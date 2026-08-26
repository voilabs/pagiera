import { type Cascade, DEFAULT_CASCADE } from "./cascade";
import { applyStyle, resolveStyle } from "./style";
import {
    type Breakpoint,
    type CanvasElement,
    ELEMENT_DEFAULTS,
    type ElementType,
    isContainer,
    type LayoutMode,
    makeStyle,
} from "./types";

export function indexById(elements: CanvasElement[]) {
    return new Map(elements.map((el) => [el.id, el]));
}

export function childrenOf(elements: CanvasElement[], parentId?: string) {
    return elements
        .filter((el) => (el.parentId ?? undefined) === parentId)
        .sort((a, b) => a.z - b.z);
}

/** The element plus every descendant. */
export function subtreeIds(elements: CanvasElement[], rootId: string) {
    const ids = new Set<string>([rootId]);
    let grew = true;
    while (grew) {
        grew = false;
        for (const el of elements) {
            if (el.parentId && ids.has(el.parentId) && !ids.has(el.id)) {
                ids.add(el.id);
                grew = true;
            }
        }
    }
    return ids;
}

export function removeSubtree(elements: CanvasElement[], rootId: string) {
    const doomed = subtreeIds(elements, rootId);
    return elements.filter((el) => !doomed.has(el.id));
}

export function nextZ(elements: CanvasElement[], parentId?: string) {
    const siblings = childrenOf(elements, parentId);
    return siblings.length ? Math.max(...siblings.map((s) => s.z)) + 1 : 0;
}

export function newId() {
    // `crypto.randomUUID` needs a secure context, which localhost and https
    // both provide; the fallback covers anything else.
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `el-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createElement(
    type: ElementType,
    position: { x: number; y: number; z: number; parentId?: string },
): CanvasElement {
    const defaults = ELEMENT_DEFAULTS[type];
    return {
        id: newId(),
        type,
        z: position.z,
        parentId: position.parentId,
        ...defaults.props,
        base: makeStyle({ ...defaults.style, x: position.x, y: position.y }),
    };
}

/**
 * Copies an element and everything under it, giving each node a fresh id while
 * keeping the parent/child wiring intact.
 */
export function cloneSubtree(
    elements: CanvasElement[],
    rootId: string,
    offset = { x: 16, y: 16 },
): { elements: CanvasElement[]; rootId: string } | null {
    const byId = indexById(elements);
    const root = byId.get(rootId);
    if (!root) return null;

    const ids = subtreeIds(elements, rootId);
    const idMap = new Map<string, string>();
    for (const id of ids) idMap.set(id, newId());
    const remap = (id: string) => idMap.get(id) ?? id;

    const copies = elements
        .filter((el) => ids.has(el.id))
        .map<CanvasElement>((el) => ({
            ...el,
            id: remap(el.id),
            parentId: el.parentId ? idMap.get(el.parentId) : undefined,
            // Only the root shifts; descendants stay positioned relative to it.
            base:
                el.id === rootId
                    ? { ...el.base, x: el.base.x + offset.x, y: el.base.y + offset.y }
                    : el.base,
        }));

    const newRootId = remap(rootId);
    const topZ = nextZ(elements, root.parentId);
    return {
        elements: copies.map((el) =>
            el.id === newRootId ? { ...el, z: topZ } : el,
        ),
        rootId: newRootId,
    };
}

/** Absolute position on the canvas, accumulating every ancestor's offset. */
export function absolutePosition(
    byId: Map<string, CanvasElement>,
    element: CanvasElement,
    breakpoint: Breakpoint,
    cascade: Cascade = DEFAULT_CASCADE,
) {
    const own = resolveStyle(element, breakpoint, cascade);
    let x = own.x;
    let y = own.y;
    let parent = element.parentId ? byId.get(element.parentId) : undefined;
    const guard = new Set<string>([element.id]);

    while (parent && !guard.has(parent.id)) {
        guard.add(parent.id);
        const style = resolveStyle(parent, breakpoint, cascade);
        x += style.x;
        y += style.y;
        parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    return { x, y };
}

export function isAncestor(
    byId: Map<string, CanvasElement>,
    maybeAncestorId: string,
    elementId: string,
) {
    let cursor = byId.get(elementId);
    const guard = new Set<string>();
    while (cursor?.parentId) {
        if (guard.has(cursor.id)) return false;
        guard.add(cursor.id);
        if (cursor.parentId === maybeAncestorId) return true;
        cursor = byId.get(cursor.parentId);
    }
    return false;
}

export function displayName(element: CanvasElement) {
    if (element.name?.trim()) return element.name.trim();
    const content = element.content?.trim();
    if (content && !isContainer(element.type)) {
        return content.length > 24 ? `${content.slice(0, 24)}…` : content;
    }
    return element.type;
}

/** Moves an element one step up or down among its siblings. */
export function reorder(
    elements: CanvasElement[],
    id: string,
    direction: "up" | "down",
): CanvasElement[] {
    const target = elements.find((el) => el.id === id);
    if (!target) return elements;

    const siblings = childrenOf(elements, target.parentId);
    const index = siblings.findIndex((s) => s.id === id);
    const nextIndex = direction === "up" ? index + 1 : index - 1;
    if (!siblings[nextIndex]) return elements;

    // Re-index the whole sibling list so repeated swaps can't collide on ties.
    const ordered = [...siblings];
    ordered[index] = siblings[nextIndex];
    ordered[nextIndex] = target;
    const zById = new Map(ordered.map((el, i) => [el.id, i]));

    return elements.map((el) => {
        const z = zById.get(el.id);
        return z === undefined ? el : { ...el, z };
    });
}

/**
 * Inserts a Container between an element and its parent, sized to the element
 * and taking over its slot, so a loose element can be grouped in one step.
 */
export function wrapInContainer(
    elements: CanvasElement[],
    id: string,
    breakpoint: Breakpoint,
): { elements: CanvasElement[]; wrapperId: string } | null {
    const target = elements.find((el) => el.id === id);
    if (!target) return null;

    const style = resolveStyle(target, breakpoint);
    const wrapper = createElement("Container", {
        x: style.x,
        y: style.y,
        z: target.z,
        parentId: target.parentId,
    });
    wrapper.base = {
        ...wrapper.base,
        w: style.w,
        h: style.h,
        widthMode: style.widthMode,
        heightMode: "auto",
        padT: 0,
        padR: 0,
        padB: 0,
        padL: 0,
        borderW: 0,
        radius: 0,
    };

    const child = applyStyle({ ...target, parentId: wrapper.id, z: 0 }, breakpoint, {
        x: 0,
        y: 0,
    });

    return {
        elements: [...elements.map((el) => (el.id === id ? child : el)), wrapper],
        wrapperId: wrapper.id,
    };
}

/* -------------------------------------------------------------- reparenting */

/**
 * Moves an element under a new parent, refusing the moves that would corrupt
 * the tree (into itself, into a descendant, or into a leaf).
 */
export function reparent(
    elements: CanvasElement[],
    id: string,
    newParentId: string | undefined,
    breakpoint: Breakpoint,
    /** Insert before this sibling; appended last when omitted. */
    beforeSiblingId?: string,
    cascade: Cascade = DEFAULT_CASCADE,
): CanvasElement[] {
    const byId = indexById(elements);
    const element = byId.get(id);
    if (!element) return elements;
    if (newParentId === id) return elements;

    if (newParentId) {
        const parent = byId.get(newParentId);
        if (!parent || !isContainer(parent.type)) return elements;
        if (subtreeIds(elements, id).has(newParentId)) return elements;
    }

    // Keep the element where it looks like it is: convert its absolute position
    // into the new parent's coordinate space.
    const before = absolutePosition(byId, element, breakpoint, cascade);
    const newParent = newParentId ? byId.get(newParentId) : undefined;
    const parentOrigin = newParent
        ? absolutePosition(byId, newParent, breakpoint, cascade)
        : { x: 0, y: 0 };

    const moved = applyStyle(
        { ...element, parentId: newParentId },
        breakpoint,
        { x: before.x - parentOrigin.x, y: before.y - parentOrigin.y },
        cascade,
    );

    const rest = elements.map((el) => (el.id === id ? moved : el));
    return resequence(rest, newParentId, id, beforeSiblingId);
}

/** Rewrites z for one parent's children so the order is dense and explicit. */
function resequence(
    elements: CanvasElement[],
    parentId: string | undefined,
    movedId: string,
    beforeSiblingId?: string,
): CanvasElement[] {
    const siblings = childrenOf(elements, parentId).filter(
        (el) => el.id !== movedId,
    );
    const moved = elements.find((el) => el.id === movedId);
    if (!moved) return elements;

    const at = beforeSiblingId
        ? siblings.findIndex((s) => s.id === beforeSiblingId)
        : -1;
    const ordered =
        at === -1
            ? [...siblings, moved]
            : [...siblings.slice(0, at), moved, ...siblings.slice(at)];

    const zById = new Map(ordered.map((el, i) => [el.id, i]));
    return elements.map((el) => {
        const z = zById.get(el.id);
        return z === undefined ? el : { ...el, z };
    });
}

/**
 * The deepest container under a point that can accept `draggedId`, or
 * undefined for the page root.
 */
export function containerAt(
    elements: CanvasElement[],
    byId: Map<string, CanvasElement>,
    point: { x: number; y: number },
    breakpoint: Breakpoint,
    draggedId?: string,
): string | undefined {
    const excluded = draggedId ? subtreeIds(elements, draggedId) : new Set<string>();

    const hits = elements
        .filter((el) => isContainer(el.type) && !excluded.has(el.id))
        .filter((el) => !resolveStyle(el, breakpoint).hidden)
        .filter((el) => {
            const style = resolveStyle(el, breakpoint);
            const origin = absolutePosition(byId, el, breakpoint);
            return (
                point.x >= origin.x &&
                point.x <= origin.x + style.w &&
                point.y >= origin.y &&
                point.y <= origin.y + style.h
            );
        });

    if (hits.length === 0) return undefined;

    // Prefer the most deeply nested hit, then the one painted on top.
    return hits.sort((a, b) => depthOf(byId, b) - depthOf(byId, a) || b.z - a.z)[0]
        .id;
}

function depthOf(byId: Map<string, CanvasElement>, element: CanvasElement) {
    let depth = 0;
    let cursor = element.parentId ? byId.get(element.parentId) : undefined;
    const guard = new Set<string>([element.id]);
    while (cursor && !guard.has(cursor.id)) {
        guard.add(cursor.id);
        depth += 1;
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return depth;
}

/**
 * An element parked beside the canvas is treated as a note: it stays visible
 * while designing but is left out of the published page.
 *
 * Only the horizontal axis counts. The canvas has a definite width — the
 * simulated viewport — while its height grows with the content, so "below the
 * fold" is a normal place for content to be, not a margin.
 */
export function isNote(
    element: CanvasElement,
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    frameWidth: number,
    /** How the page root arranges its own children. */
    rootLayout: LayoutMode = "absolute",
    cascade: Cascade = DEFAULT_CASCADE,
): boolean {
    // Wherever a stack does the placing, x/y are not read at all — so a stale
    // coordinate must never be able to drop an element from the page.
    const parent = element.parentId ? byId.get(element.parentId) : undefined;
    const placedBy = parent
        ? resolveStyle(parent, breakpoint, cascade).layout
        : rootLayout;
    if (placedBy !== "absolute") return false;

    const style = resolveStyle(element, breakpoint, cascade);
    const { x } = absolutePosition(byId, element, breakpoint, cascade);
    const right = x + (style.widthMode === "fixed" ? style.w : 0);

    // Fully past either edge — a partial overlap is still part of the page.
    return right <= 0 || x >= frameWidth;
}

/** Ids of every note and everything inside one. */
export function noteIds(
    elements: CanvasElement[],
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    frameWidth: number,
    rootLayout: LayoutMode = "absolute",
    cascade: Cascade = DEFAULT_CASCADE,
): Set<string> {
    const notes = new Set<string>();
    for (const element of elements) {
        if (isNote(element, byId, breakpoint, frameWidth, rootLayout, cascade)) {
            for (const id of subtreeIds(elements, element.id)) notes.add(id);
        }
    }
    return notes;
}
