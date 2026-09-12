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
     * The space the element would occupy, in screen coordinates.
     *
     * A hairline says where the element goes; a slot the size of the element
     * says what the result will look like, which is what makes a drop into a
     * container feel like it clicked into place rather than nearly missed.
     */
    slot?: { x: number; y: number; w: number; h: number };
    /**
     * Set when the drop is not aimed between two siblings. The element keeps
     * the spot it was dropped on instead of joining the flow, which is what
     * dragging something into open space plainly means.
     */
    free?: { x: number; y: number };
};

const SELECTOR = "[data-canvas-element]";

/** How near a sibling's boundary a drop has to be to count as reordering. */

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
    // A short box has to keep an interior: with a flat band on each side a
    // 20px-tall empty container is all edge, so it could only ever be dropped
    // beside — which is exactly the "it doesn't go in" case.
    //
    // A tall one has the opposite problem. Capped at 16px, a 900px section
    // offered two 16px slivers for "put this next to it" and 868px of "put it
    // inside" — so reordering sections meant hitting a sliver, which is what
    // made dragging on an artboard feel like it went wherever it liked. The
    // cap is now wide enough to aim at, and still never more than a third of
    // the box, so small containers keep an inside.
    return Math.max(2, Math.min(44, size * 0.2, size / 3));
}

/** How tall an insertion slot is drawn when the dragged element has no box. */
const FALLBACK_SLOT = 44;

/** The dragged element's rendered size, so the slot matches what will land. */
function draggedBox(draggedId: string) {
    if (typeof document === "undefined") return undefined;
    const node = document.querySelector(`[data-canvas-element="${CSS.escape(draggedId)}"]`);
    return node?.getBoundingClientRect();
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
    /** How the page itself arranges its own children. */
    rootLayout: "stack" | "absolute" = "absolute",
    /**
     * Place at the pointer instead of inserting into the order.
     *
     * Held by the author, not inferred. A stack decides where its children go,
     * so the only honest way to put something at a spot inside one is to say
     * so — and the only way to reorder without that being second-guessed is
     * for the plain drag to always mean "reorder".
     */
    freePlacement = false,
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
                  ...orderWithin(undefined, fallbackRoot, clientX, clientY, excluded, elements, byId, breakpoint, cascade, draggedId, rootLayout, freePlacement),
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
                ...orderWithin(id, node, clientX, clientY, excluded, elements, byId, breakpoint, cascade, draggedId, rootLayout, freePlacement),
            };
        }
        if (beside && accepts(element.parentId)) {
            const scope = parentEl ?? artboardOf(node);
            return {
                parentId: element.parentId,
                ...orderWithin(element.parentId, scope, clientX, clientY, excluded, elements, byId, breakpoint, cascade, draggedId, rootLayout, freePlacement),
            };
        }

        node = parentEl;
    }

    return accepts(undefined)
        ? {
              parentId: undefined,
              ...orderWithin(undefined, artboardOf(hit), clientX, clientY, excluded, elements, byId, breakpoint, cascade, draggedId, rootLayout, freePlacement),
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
    draggedId?: string,
    rootLayout: "stack" | "absolute" = "absolute",
    freePlacement = false,
): { beforeId?: string; indicator?: DropPlan["indicator"]; free?: DropPlan["free"]; slot?: DropPlan["slot"] } {
    if (!scope) return {};
    const parent = parentId ? byId.get(parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;

    const box = scope.getBoundingClientRect();
    const dropped = { x: clientX - box.left, y: clientY - box.top };

    /*
     * Stacked or free, and the two behave differently on purpose.
     *
     * A stack arranges its children, so there is nowhere in it to "place"
     * anything: every drop is an insertion between two of them. A freely
     * positioned parent is the opposite — the coordinates are the point.
     */
    const stacked = parent ? parentStyle?.layout === "stack" : rootLayout === "stack";
    if (!stacked || freePlacement) return { free: dropped };

    const vertical = (parentStyle?.direction ?? "column") === "column";

    const siblings = childrenOf(elements, parentId)
        .filter((child) => !excluded.has(child.id))
        .map((child) => ({
            id: child.id,
            rect: (scope.querySelector(`${SELECTOR.slice(0, -1)}="${CSS.escape(child.id)}"]`) as HTMLElement | null)
                ?.getBoundingClientRect(),
        }))
        .filter((entry): entry is { id: string; rect: DOMRect } => Boolean(entry.rect));

    // An empty stack container is a slot in its own right: dropping into it
    // means "put this inside", not "place it at these coordinates".
    if (siblings.length === 0) {
        // An empty stacked page takes the element as its first child.
        if (!parent) return {};
        const dragged = draggedId ? draggedBox(draggedId) : undefined;
        const inner = scope.getBoundingClientRect();
        return {
            slot: {
                x: inner.left + 4,
                y: inner.top + 4,
                w: Math.max(8, inner.width - 8),
                h: Math.max(8, Math.min(inner.height - 8, dragged?.height ?? FALLBACK_SLOT)),
            },
        };
    }

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

    /*
     * No escape hatch here any more.
     *
     * A drop further than a few pixels from a boundary used to fall out of the
     * flow and be placed at coordinates instead — inside a stack, which cannot
     * honour coordinates. Dragging a section a little off the seam therefore
     * yanked it out of the layout rather than moving it, which is what made
     * reordering inside a frame feel broken. The nearest boundary is always
     * what was meant.
     */

    const anchor = nearest.before ?? siblings[siblings.length - 1];
    const { rect } = anchor;
    const edge = nearest.before
        ? (vertical ? rect.top : rect.left)
        : (vertical ? rect.bottom : rect.right);

    const dragged = draggedId ? draggedBox(draggedId) : undefined;
    const thickness = vertical
        ? Math.max(6, Math.min(dragged?.height ?? FALLBACK_SLOT, 160))
        : Math.max(6, Math.min(dragged?.width ?? FALLBACK_SLOT, 160));

    return {
        beforeId: nearest.before?.id,
        indicator: vertical
            ? { x: rect.left, y: edge, length: rect.width, vertical: false }
            : { x: edge, y: rect.top, length: rect.height, vertical: true },
        slot: vertical
            ? { x: rect.left, y: edge - thickness / 2, w: rect.width, h: thickness }
            : { x: edge - thickness / 2, y: rect.top, w: thickness, h: rect.height },
    };
}
