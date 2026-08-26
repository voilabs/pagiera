import type { Cascade } from "@/lib/editor/cascade";
import { resolveStyle } from "@/lib/editor/style";
import { childrenOf, subtreeIds } from "@/lib/editor/tree";
import { type Breakpoint, type CanvasElement, isContainer } from "@/lib/editor/types";

/** Where a dragged element would land: whose child, and how it sits there. */
export type DropPlan = {
    parentId: string | undefined;
    /** Insert ahead of this sibling; append when absent. */
    beforeId?: string;
    /** Screen-space line marking the insertion point, for the overlay. */
    indicator?: { x: number; y: number; length: number; vertical: boolean };
    /**
     * Set when the drop is not aimed between two siblings. The element keeps
     * the spot it was dropped on instead of joining the flow, which is what
     * dragging something into open space plainly means.
     */
    free?: { x: number; y: number };
};

const SELECTOR = "[data-canvas-element]";

/** How near a sibling's boundary a drop has to be to count as reordering. */
const REORDER_BAND = 14;

function idOf(node: Element | null | undefined): string | undefined {
    return (node as HTMLElement | null | undefined)?.dataset?.canvasElement || undefined;
}

/**
 * How close to a container's edge counts as "beside it" rather than "inside
 * it". Without this band, stacked sections whose edges touch leave nowhere to
 * aim: every pixel belongs to one of them, so an element can only ever be
 * nested, never placed between two.
 */
function edgeBand(size: number) {
    return Math.max(6, Math.min(16, size * 0.2));
}

/**
 * Resolves a drop from the rendered DOM rather than from the model's `w`/`h`.
 *
 * Those numbers are only the truth under `fixed` sizing; a `fill` or `auto`
 * element keeps whatever width it was last authored at, so hit-testing against
 * them lands the pointer in boxes that are nowhere near it. The canvas already
 * tags every element with `data-canvas-element`, and `getBoundingClientRect`
 * reports post-zoom screen coordinates — the same space the pointer is in — so
 * the browser's own layout answers the question exactly.
 */
export function resolveDrop(
    clientX: number,
    clientY: number,
    draggedId: string,
    elements: CanvasElement[],
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    cascade: Cascade,
    /** Fallback artboard, used only when the pointer is over empty canvas. */
    fallbackRoot: HTMLElement | null,
    /** Containers that refuse children — component instances and the like. */
    accepts: (parentId: string | undefined) => boolean = () => true,
): DropPlan | undefined {
    if (typeof document === "undefined") return undefined;
    const excluded = subtreeIds(elements, draggedId);

    // Topmost rendered element under the pointer that is not being dragged.
    let hit: HTMLElement | undefined;
    for (const node of document.elementsFromPoint(clientX, clientY)) {
        const candidate = node.closest(SELECTOR) as HTMLElement | null;
        const id = idOf(candidate);
        if (!id || excluded.has(id)) continue;
        hit = candidate ?? undefined;
        break;
    }

    if (!hit) {
        // Empty canvas: the page root is a real destination.
        return accepts(undefined)
            ? {
                  parentId: undefined,
                  ...orderWithin(undefined, fallbackRoot, clientX, clientY, excluded, elements, byId, breakpoint, cascade),
              }
            : undefined;
    }

    // Walk outward until something will actually take the element. Bailing out
    // silently — which is what happens when the drop lands on a component
    // instance — reads to the author as drag-and-drop simply not working.
    let node: HTMLElement | null = hit;
    while (node) {
        const id = idOf(node);
        const element = id ? byId.get(id) : undefined;
        if (!element) break;

        const parentEl = node.parentElement?.closest(SELECTOR) as HTMLElement | null;
        const rect = node.getBoundingClientRect();
        const parentStyle = element.parentId
            ? resolveStyle(byId.get(element.parentId) ?? element, breakpoint, cascade)
            : undefined;
        const vertical = (parentStyle?.direction ?? "column") === "column";
        const pointer = vertical ? clientY : clientX;
        const start = vertical ? rect.top : rect.left;
        const end = vertical ? rect.bottom : rect.right;
        const band = edgeBand(vertical ? rect.height : rect.width);
        const nearEdge = pointer - start < band || end - pointer < band;

        // Over a leaf, or hugging a container's edge, the intent is to sit
        // beside this element rather than inside it.
        const beside = !isContainer(element.type) || nearEdge;

        if (!beside && accepts(id)) {
            return {
                parentId: id,
                ...orderWithin(id, node, clientX, clientY, excluded, elements, byId, breakpoint, cascade),
            };
        }
        if (beside && accepts(element.parentId)) {
            const scope = parentEl ?? artboardOf(node);
            return {
                parentId: element.parentId,
                ...orderWithin(element.parentId, scope, clientX, clientY, excluded, elements, byId, breakpoint, cascade),
            };
        }

        node = parentEl;
    }

    return accepts(undefined)
        ? {
              parentId: undefined,
              ...orderWithin(undefined, artboardOf(hit), clientX, clientY, excluded, elements, byId, breakpoint, cascade),
          }
        : undefined;
}

/** The frame element holding this node — the parent of its outermost node. */
function artboardOf(node: HTMLElement): HTMLElement | null {
    let top = node;
    for (;;) {
        const next = top.parentElement?.closest(SELECTOR) as HTMLElement | null;
        if (!next) break;
        top = next;
    }
    return top.parentElement;
}

/**
 * Decides whether a drop reorders or simply places.
 *
 * Aimed at a boundary between two siblings, it is a reorder and the insertion
 * line is shown. Anywhere else the author is putting the element down, not
 * sequencing it, so the drop coordinates come back instead — which is what
 * makes dragging into open space keep the spot it was dropped on.
 */
function orderWithin(
    parentId: string | undefined,
    scope: HTMLElement | null,
    clientX: number,
    clientY: number,
    excluded: Set<string>,
    elements: CanvasElement[],
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    cascade: Cascade,
): { beforeId?: string; indicator?: DropPlan["indicator"]; free?: DropPlan["free"] } {
    if (!scope) return {};
    const parent = parentId ? byId.get(parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;

    const box = scope.getBoundingClientRect();
    const dropped = { x: clientX - box.left, y: clientY - box.top };

    // Inside a freely positioned parent there is no order to insert into, so
    // every drop is a placement.
    if (parent && parentStyle?.layout !== "stack") return { free: dropped };

    const vertical = (parentStyle?.direction ?? "column") === "column";

    const siblings = childrenOf(elements, parentId)
        .filter((child) => !excluded.has(child.id))
        .map((child) => ({
            id: child.id,
            rect: (scope.querySelector(`${SELECTOR.slice(0, -1)}="${CSS.escape(child.id)}"]`) as HTMLElement | null)
                ?.getBoundingClientRect(),
        }))
        .filter((entry): entry is { id: string; rect: DOMRect } => Boolean(entry.rect));

    if (siblings.length === 0) return { free: dropped };

    // Each boundary, paired with the sibling a drop there would precede; the
    // last one appends.
    const pointer = vertical ? clientY : clientX;
    const boundaries = [
        { at: vertical ? siblings[0].rect.top : siblings[0].rect.left, before: siblings[0] },
        ...siblings.map((entry, index) => ({
            at: vertical ? entry.rect.bottom : entry.rect.right,
            before: siblings[index + 1],
        })),
    ];
    const nearest = boundaries.reduce((best, entry) =>
        Math.abs(entry.at - pointer) < Math.abs(best.at - pointer) ? entry : best,
    );

    if (Math.abs(nearest.at - pointer) > REORDER_BAND) return { free: dropped };

    const anchor = nearest.before ?? siblings[siblings.length - 1];
    const { rect } = anchor;
    const edge = nearest.before
        ? (vertical ? rect.top : rect.left)
        : (vertical ? rect.bottom : rect.right);

    return {
        beforeId: nearest.before?.id,
        indicator: vertical
            ? { x: rect.left, y: edge, length: rect.width, vertical: false }
            : { x: edge, y: rect.top, length: rect.height, vertical: true },
    };
}
