import { resolveStyle } from "./style";
import { childrenOf, subtreeIds } from "./tree";
import type { Breakpoint, CanvasElement } from "./types";

/** How close (in canvas px) an edge must be before it snaps. */
export const SNAP_THRESHOLD = 6;

export type Guide = {
    axis: "x" | "y";
    /** Position in the dragged element's own coordinate space. */
    at: number;
    /** Span of the guide line, so it only reaches as far as the pairing needs. */
    from: number;
    to: number;
};

type Box = { x: number; y: number; w: number; h: number };

function edges(box: Box, axis: "x" | "y") {
    return axis === "x"
        ? [box.x, box.x + box.w / 2, box.x + box.w]
        : [box.y, box.y + box.h / 2, box.y + box.h];
}

/**
 * Aligns the moving box against its siblings and the frame it lives in,
 * returning the corrected position plus the guides worth drawing.
 *
 * Everything is expressed in the moving element's parent coordinate space, so
 * a nested element snaps against its own container rather than the page.
 */
export function snapPosition(
    elements: CanvasElement[],
    movingId: string,
    proposed: Box,
    frame: { w: number; h: number },
    breakpoint: Breakpoint,
    threshold = SNAP_THRESHOLD,
): { x: number; y: number; guides: Guide[] } {
    const moving = elements.find((el) => el.id === movingId);
    if (!moving) return { x: proposed.x, y: proposed.y, guides: [] };

    const excluded = subtreeIds(elements, movingId);
    const siblings = childrenOf(elements, moving.parentId)
        .filter((el) => !excluded.has(el.id))
        .map((el) => ({ el, style: resolveStyle(el, breakpoint) }))
        .filter(({ style }) => !style.hidden);

    const targets: Box[] = [
        { x: 0, y: 0, w: frame.w, h: frame.h },
        ...siblings.map(({ style }) => ({
            x: style.x,
            y: style.y,
            w: style.w,
            h: style.h,
        })),
    ];

    const guides: Guide[] = [];
    const result = { x: proposed.x, y: proposed.y };

    for (const axis of ["x", "y"] as const) {
        const movingEdges = edges(proposed, axis);
        let best: { delta: number; at: number; target: Box } | null = null;

        for (const target of targets) {
            for (const targetEdge of edges(target, axis)) {
                for (const movingEdge of movingEdges) {
                    const delta = targetEdge - movingEdge;
                    if (Math.abs(delta) > threshold) continue;
                    if (!best || Math.abs(delta) < Math.abs(best.delta)) {
                        best = { delta, at: targetEdge, target };
                    }
                }
            }
        }

        if (!best) continue;
        result[axis] = proposed[axis] + best.delta;

        const crossAxis = axis === "x" ? "y" : "x";
        const crossSize = axis === "x" ? "h" : "w";
        const movingStart = proposed[crossAxis];
        const movingEnd = movingStart + proposed[crossSize];
        const targetStart = best.target[crossAxis];
        const targetEnd = targetStart + best.target[crossSize];

        guides.push({
            axis,
            at: best.at,
            from: Math.min(movingStart, targetStart),
            to: Math.max(movingEnd, targetEnd),
        });
    }

    return { ...result, guides };
}
