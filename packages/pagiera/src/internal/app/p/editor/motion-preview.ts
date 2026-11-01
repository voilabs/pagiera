import { motionTracks } from "@/lib/editor/keyframes";
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
export function playEntrance(element: CanvasElement, style: ElementStyle, elements: CanvasElement[], offset = 0, collect?: Animation[]) {
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
            for (const target of group) {
                const run = animate(target, from, to, timing.duration, delay, timing.easing, timing.fallback);
                collect?.push(run);
            }
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

/**
 * The page's motion as one seekable clip, for Motion's timeline: every
 * entrance and every keyframed layer is built paused, and `seek` puts them
 * all at one moment of the page opening. A layer with keyframes plays those
 * instead of its entrance, as on the published page.
 */
export function entranceTimeline(elements: CanvasElement[], styleOf: (element: CanvasElement) => ElementStyle) {
    const runs: Animation[] = [];
    let duration = 0;
    for (const element of elements) {
        if (element.motion) {
            const motion = element.motion;
            const built = motionTracks(motion);
            const property = (name: string) => name.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
            for (const node of document.querySelectorAll<HTMLElement>(`[data-canvas-element="${element.id}"]`)) {
                // A split text plays on each piece, delayed by its place in the order.
                const targets = motion.split ? Array.from(node.querySelectorAll<HTMLElement>(".pg-part")) : [node];
                for (const target of targets) {
                    const delay = motion.split ? (Number(target.style.getPropertyValue("--i")) || 0) * motion.split.stagger : 0;
                    duration = Math.max(duration, built.duration + delay);
                    if (motion.origin) {
                        const origin = `${motion.origin.x}% ${motion.origin.y}%`;
                        runs.push(target.animate([{ transformOrigin: origin }, { transformOrigin: origin }], { duration: 1, fill: "both" }));
                    }
                    for (const track of built.tracks)
                        runs.push(target.animate(
                            track.frames.map((frame) => ({ offset: frame.offset, easing: frame.easing, [property(track.property)]: frame.value })),
                            { duration: built.duration, delay, fill: "both" },
                        ));
                }
            }
            continue;
        }
        const style = styleOf(element);
        if (style.scrollEffect !== "none" || style.entrance === "none") continue;
        duration = Math.max(duration, playEntrance(element, style, elements, 0, runs));
    }
    for (const run of runs) {
        run.pause();
        run.currentTime = 0;
        // Held through the end too, so a seek past it shows the layer at rest.
        run.effect?.updateTiming({ fill: "both" });
    }
    return {
        duration,
        seek(ms: number) {
            for (const run of runs) run.currentTime = Math.max(0, ms);
        },
        cancel() {
            for (const run of runs) run.cancel();
        },
    };
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
        return target.animate(keyframes, options);
    } catch {
        // A browser without `linear()` rejects the spring; its cubic stand-in
        // is what the published stylesheet falls back to as well.
        return target.animate(keyframes, { ...options, easing: fallback });
    }
}
