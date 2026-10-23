import { entranceFrom, entranceTiming, entranceTo, type MotionFrame } from "@/lib/editor/motion";
import { childrenOf } from "@/lib/editor/tree";
import type { CanvasElement, ElementStyle } from "@/lib/editor/types";

/**
 * Plays entrances on the canvas with the Web Animations API.
 *
 * The keyframes, curve and timing come from the same functions the published
 * stylesheet is built from, so what Play shows is what a visitor gets. The
 * animations are not persisted: they finish and leave the canvas on its
 * resting, editable state.
 */
export function playEntrance(element: CanvasElement, style: ElementStyle, elements: CanvasElement[], offset = 0) {
    if (style.entrance === "none") return 0;
    const from = entranceFrom(style);
    const to = entranceTo(from);
    const timing = entranceTiming(style);
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-canvas-element="${element.id}"]`));
    let longest = 0;
    for (const node of nodes) {
        const targets: HTMLElement[][] =
            style.entranceSplit === "children"
                ? childrenOf(elements, element.id).map((child) =>
                      Array.from(node.querySelectorAll<HTMLElement>(`[data-canvas-element="${child.id}"]`)),
                  )
                : style.entranceSplit !== "none" && node.querySelector(".pg-part")
                  ? Array.from(node.querySelectorAll<HTMLElement>(".pg-part")).map((part) => [part])
                  : [[node]];
        targets.forEach((group, index) => {
            const delay = offset + style.entranceDelay + (targets.length > 1 ? index * style.entranceStagger : 0);
            longest = Math.max(longest, delay + timing.duration);
            for (const target of group) animate(target, from, to, timing.duration, delay, timing.easing, timing.fallback);
        });
    }
    return longest;
}

/** Every entrance on the page, as a visitor landing on it would see them. */
export function playAllEntrances(elements: CanvasElement[], styleOf: (element: CanvasElement) => ElementStyle) {
    for (const element of elements) {
        const style = styleOf(element);
        if (style.scrollEffect === "none") playEntrance(element, style, elements);
    }
}

function animate(
    target: HTMLElement,
    from: MotionFrame,
    to: MotionFrame,
    duration: number,
    delay: number,
    easing: string,
    fallback: string,
) {
    const keyframes: Keyframe[] = Object.keys(to).length
        ? [{ ...from } as Keyframe, { ...to } as Keyframe]
        : [{ ...from, offset: 0 } as Keyframe];
    const options: KeyframeAnimationOptions = { duration, delay, easing, fill: "backwards" };
    try {
        target.animate(keyframes, options);
    } catch {
        // A browser without `linear()` rejects the spring; its cubic stand-in
        // is what the published stylesheet falls back to as well.
        target.animate(keyframes, { ...options, easing: fallback });
    }
}
