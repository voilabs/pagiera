import type { CanvasElement } from "./types";
import { subtreeIds } from "./tree";

/** Strip generated layout chrome and restore authored page roots before saving. */
export function unwrapPageLayout(elements: CanvasElement[]): CanvasElement[] {
    const generated = new Set(elements.filter(el => el.layoutRole === "layout").map(el => el.id));
    return elements.filter(el => !generated.has(el.id)).map(el => el.parentId && generated.has(el.parentId) ? { ...el, parentId: undefined } : el);
}

export function applyPageLayout(elements: CanvasElement[], components: CanvasElement[], layoutId?: string): CanvasElement[] {
    const own = unwrapPageLayout(elements);
    const master = components.find(el => el.componentRole === "master" && el.isLayout && (el.componentId ?? el.id) === layoutId);
    if (!master) return own;
    const ids = subtreeIds(components, master.id);
    const nodes = components.filter(el => ids.has(el.id));
    const slots = nodes.filter(el => el.childrenSlot);
    // Fail open if the author removes the slot; page content must never disappear.
    if (slots.length !== 1) return own;
    const idFor = (id: string) => `layout-page-${id}`;
    const masterIds = new Set<string>();
    for (const root of own.filter(el => el.componentRole === "master")) for (const id of subtreeIds(own, root.id)) masterIds.add(id);
    const chrome = nodes.map(el => ({
        ...el, id: idFor(el.id), parentId: el.id === master.id ? undefined : el.parentId ? idFor(el.parentId) : undefined,
        componentRole: undefined, componentId: undefined, componentSourceId: undefined,
        isLayout: undefined, layoutRole: "layout" as const, locked: true,
        base: el.base,
    }));
    return [...own.map(el => !el.parentId && !el.parked && !el.layoutRole && !masterIds.has(el.id) ? { ...el, parentId: idFor(slots[0].id) } : el), ...chrome];
}
