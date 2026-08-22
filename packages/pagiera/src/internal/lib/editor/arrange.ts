import { applyStyle, resolveStyle } from "./style";
import type { Breakpoint, CanvasElement } from "./types";

export type AlignAction =
    | "left"
    | "center-x"
    | "right"
    | "top"
    | "center-y"
    | "bottom";

export type DistributeAction = "horizontal" | "vertical";

type Box = { id: string; x: number; y: number; w: number; h: number };

function boxesOf(
    elements: CanvasElement[],
    ids: string[],
    breakpoint: Breakpoint,
): Box[] {
    return elements
        .filter((el) => ids.includes(el.id))
        .map((el) => {
            const style = resolveStyle(el, breakpoint);
            return { id: el.id, x: style.x, y: style.y, w: style.w, h: style.h };
        });
}

/**
 * Aligns the selection against its own bounding box. Only meaningful for
 * elements positioned by x/y, so callers should restrict it to siblings inside
 * an absolute parent.
 */
export function alignElements(
    elements: CanvasElement[],
    ids: string[],
    action: AlignAction,
    breakpoint: Breakpoint,
): CanvasElement[] {
    const boxes = boxesOf(elements, ids, breakpoint);
    if (boxes.length < 2) return elements;

    const minX = Math.min(...boxes.map((b) => b.x));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const patchFor = (box: Box) => {
        switch (action) {
            case "left":
                return { x: minX };
            case "right":
                return { x: maxX - box.w };
            case "center-x":
                return { x: midX - box.w / 2 };
            case "top":
                return { y: minY };
            case "bottom":
                return { y: maxY - box.h };
            case "center-y":
                return { y: midY - box.h / 2 };
        }
    };

    const byId = new Map(boxes.map((b) => [b.id, b]));
    return elements.map((el) => {
        const box = byId.get(el.id);
        return box ? applyStyle(el, breakpoint, patchFor(box)) : el;
    });
}

/** Evens out the gaps between the outermost two elements of the selection. */
export function distributeElements(
    elements: CanvasElement[],
    ids: string[],
    action: DistributeAction,
    breakpoint: Breakpoint,
): CanvasElement[] {
    const boxes = boxesOf(elements, ids, breakpoint);
    if (boxes.length < 3) return elements;

    const horizontal = action === "horizontal";
    const sorted = [...boxes].sort((a, b) =>
        horizontal ? a.x - b.x : a.y - b.y,
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = horizontal
        ? last.x + last.w - first.x
        : last.y + last.h - first.y;
    const used = sorted.reduce((sum, b) => sum + (horizontal ? b.w : b.h), 0);
    const gap = (span - used) / (sorted.length - 1);

    const patches = new Map<string, { x?: number; y?: number }>();
    let cursor = horizontal ? first.x : first.y;
    for (const box of sorted) {
        patches.set(box.id, horizontal ? { x: cursor } : { y: cursor });
        cursor += (horizontal ? box.w : box.h) + gap;
    }

    return elements.map((el) => {
        const patch = patches.get(el.id);
        return patch ? applyStyle(el, breakpoint, patch) : el;
    });
}
