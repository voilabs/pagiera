import type { ElementStyle, LoopMotion, StateTransition } from "./types";

/**
 * Motion shared by the editor canvas and the published stylesheet.
 *
 * Everything here compiles to plain CSS — keyframes, easing functions and
 * durations — so a published page animates without shipping an animation
 * library. The editor feeds the same values to the Web Animations API, which
 * is what keeps Play on the canvas identical to the page a visitor sees.
 */

export type Spring = { stiffness: number; damping: number; mass: number };

export type SpringCurve = {
    /** A CSS `linear()` easing that traces the spring. */
    easing: string;
    /** For browsers without `linear()`: a cubic that roughly follows it. */
    fallback: string;
    /** Milliseconds until the spring settles. */
    duration: number;
    /** The sampled progress values, 0 → 1, evenly spaced in time. */
    points: number[];
};

const curves = new Map<string, SpringCurve>();

/**
 * Simulates a damped spring from 0 to 1 and samples it.
 *
 * A real spring has no duration of its own — it ends when it stops moving —
 * so the length comes out of the physics, as it does in Framer. The curve is
 * then flattened into evenly spaced samples for `linear()`, which can
 * overshoot past 1 and settle back, which no cubic-bezier can do twice.
 */
export function springCurve({ stiffness, damping, mass }: Spring): SpringCurve {
    const k = clamp(stiffness, 1, 1000);
    const c = clamp(damping, 1, 100);
    const m = clamp(mass, 0.1, 10);
    const key = `${k}|${c}|${m}`;
    const known = curves.get(key);
    if (known) return known;

    const dt = 1 / 1000;
    const values = [0];
    let x = 0;
    let v = 0;
    for (let step = 1; step <= 5000; step++) {
        const a = (-k * (x - 1) - c * v) / m;
        v += a * dt;
        x += v * dt;
        values.push(x);
    }
    let last = values.length - 1;
    while (last > 0 && Math.abs(values[last] - 1) < 0.002) last--;
    const duration = Math.max(120, Math.min(5000, last + 1));

    const count = Math.round(clamp(duration / 14, 16, 72));
    const points: number[] = [];
    for (let i = 0; i <= count; i++) {
        const at = Math.round((i / count) * duration);
        points.push(i === count ? 1 : Number(values[Math.min(at, values.length - 1)].toFixed(4)));
    }
    const curve = {
        easing: `linear(${points.join(", ")})`,
        fallback: `cubic-bezier(.16,${(1 + Math.max(0, 45 - c) / 100).toFixed(2)},${Math.max(0.12, Math.min(0.52, 120 / k)).toFixed(2)},1)`,
        duration,
        points,
    };
    curves.set(key, curve);
    return curve;
}

export type Timing = { duration: number; easing: string; fallback: string };

export function entranceTiming(
    style: Pick<ElementStyle, "entranceCurve" | "entranceBezier" | "entranceDuration" | "springStiffness" | "springDamping" | "springMass">,
): Timing {
    if (style.entranceCurve === "spring") {
        const spring = springCurve({ stiffness: style.springStiffness, damping: style.springDamping, mass: style.springMass ?? 1 });
        return { duration: spring.duration, easing: spring.easing, fallback: spring.fallback };
    }
    const easing = `cubic-bezier(${style.entranceBezier})`;
    return { duration: style.entranceDuration, easing, fallback: easing };
}

/**
 * The state an entrance starts from, as individual CSS properties.
 *
 * Only a start is given: the keyframe's end is the element's own computed
 * style, so an element at 60% opacity or with its own blur arrives at that
 * value instead of being forced to 1 and to none. Individual `translate`,
 * `scale` and `rotate` compose with the element's own `transform`.
 */
export type MotionFrame = {
    opacity?: number;
    translate?: string;
    scale?: string;
    rotate?: string;
    filter?: string;
    clipPath?: string;
};

export function entranceFrom(
    style: Pick<
        ElementStyle,
        "entrance" | "entranceX" | "entranceY" | "entranceScale" | "entranceRotate" | "entranceBlur" | "entranceOpacity"
    >,
): MotionFrame {
    switch (style.entrance) {
        case "fade":
            return { opacity: 0 };
        case "up":
            return { opacity: 0, translate: "0 28px" };
        case "down":
            return { opacity: 0, translate: "0 -28px" };
        case "left":
            return { opacity: 0, translate: "-32px 0" };
        case "right":
            return { opacity: 0, translate: "32px 0" };
        case "zoom":
            return { opacity: 0, scale: "0.94" };
        case "blur":
            return { opacity: 0, translate: "0 12px", filter: "blur(14px)" };
        case "pop":
            return { opacity: 0, scale: "0.6" };
        case "reveal":
            return { clipPath: "inset(0 0 100% 0)", translate: "0 24px" };
        case "custom": {
            const frame: MotionFrame = {};
            if (style.entranceOpacity < 100) frame.opacity = style.entranceOpacity / 100;
            if (style.entranceX || style.entranceY) frame.translate = `${style.entranceX}px ${style.entranceY}px`;
            if (style.entranceScale !== 100) frame.scale = String(style.entranceScale / 100);
            if (style.entranceRotate) frame.rotate = `${style.entranceRotate}deg`;
            if (style.entranceBlur > 0) frame.filter = `blur(${style.entranceBlur}px)`;
            return frame;
        }
        default:
            return {};
    }
}

export function frameToCss(frame: MotionFrame) {
    return Object.entries(frame)
        .filter(([, value]) => value !== undefined)
        .map(([property, value]) => `${property === "clipPath" ? "clip-path" : property}:${value}`)
        .join(";");
}

/** The opposite of a reveal's clip, so the keyframe has a known end to wipe to. */
export function entranceTo(frame: MotionFrame): MotionFrame {
    return frame.clipPath ? { clipPath: "inset(0 0 0% 0)" } : {};
}

/* -------------------------------------------------------------------- loops */

/**
 * Loop keyframes read their strength from `--pg-la`, so one set of keyframes
 * serves every element and an author's Amount is a single custom property.
 * Mirrored in the editor's globals.css for the canvas.
 */
export const LOOP_KEYFRAMES =
    "@keyframes pg-loop-pulse{0%,100%{scale:1}50%{scale:calc(1 + .06 * var(--pg-la,1))}}" +
    "@keyframes pg-loop-float{0%,100%{translate:0 0}50%{translate:0 calc(-12px * var(--pg-la,1))}}" +
    "@keyframes pg-loop-sway{0%,100%{translate:0 0}50%{translate:calc(14px * var(--pg-la,1)) 0}}" +
    "@keyframes pg-loop-spin{from{rotate:0deg}to{rotate:360deg}}" +
    "@keyframes pg-loop-bounce{0%,100%{translate:0 0;animation-timing-function:cubic-bezier(.33,0,.67,0)}50%{translate:0 calc(-18px * var(--pg-la,1));animation-timing-function:cubic-bezier(.33,1,.67,1)}}" +
    "@keyframes pg-loop-wiggle{0%,100%{rotate:0deg}25%{rotate:calc(-6deg * var(--pg-la,1))}75%{rotate:calc(6deg * var(--pg-la,1))}}" +
    "@keyframes pg-loop-breathe{0%,100%{opacity:1}50%{opacity:calc(1 - .45 * var(--pg-la,1))}}";

export type AnimationLayer = {
    name: string;
    duration: number;
    easing: string;
    fallback?: string;
    /** Milliseconds, or a CSS time expression such as a stagger `calc()`. */
    delay: number | string;
    iterations: number | "infinite";
    direction: "normal" | "reverse" | "alternate";
    fill: "none" | "backwards" | "forwards" | "both";
    /** `view()` for scroll-linked layers; absent means the document timeline. */
    timeline?: string;
    range?: string;
};

export function loopLayer(loop: LoopMotion, startAfter = 0): AnimationLayer {
    const linear = (loop.ease ?? (loop.type === "spin" ? "linear" : "smooth")) === "linear";
    return {
        name: `pg-loop-${loop.type}`,
        duration: loop.duration,
        easing: linear ? "linear" : "ease-in-out",
        delay: startAfter + (loop.delay ?? 0),
        iterations: "infinite",
        direction: loop.direction ?? "normal",
        fill: "none",
    };
}

/** The custom property a loop's keyframes scale by. */
export function loopAmount(loop: LoopMotion) {
    return ((loop.amount ?? 100) / 100).toFixed(2);
}

/** A loop as a single `animation` shorthand, for inline styles on the canvas. */
export function loopAnimation(loop: LoopMotion) {
    const layer = loopLayer(loop);
    return `${layer.name} ${layer.duration}ms ${layer.easing} ${layer.delay}ms infinite ${layer.direction}`;
}

/**
 * Animation layers as longhand declarations.
 *
 * Longhands rather than the shorthand because the shorthand resets
 * `animation-timeline`, and because a spring's `linear()` easing needs a
 * cubic fallback declared before it: a browser that does not understand the
 * second timing-function line keeps the first.
 */
export function animationDeclarations(layers: AnimationLayer[]) {
    const list = (pick: (layer: AnimationLayer) => string) => layers.map(pick).join(",");
    const declarations = [
        `animation-name:${list((l) => l.name)}`,
        `animation-duration:${list((l) => `${Math.round(l.duration)}ms`)}`,
    ];
    const fallback = list((l) => l.fallback ?? l.easing);
    const easing = list((l) => l.easing);
    declarations.push(`animation-timing-function:${fallback}`);
    if (easing !== fallback) declarations.push(`animation-timing-function:${easing}`);
    declarations.push(
        `animation-delay:${list((l) => (typeof l.delay === "string" ? l.delay : `${Math.round(l.delay)}ms`))}`,
        `animation-iteration-count:${list((l) => String(l.iterations))}`,
        `animation-direction:${list((l) => l.direction)}`,
        `animation-fill-mode:${list((l) => l.fill)}`,
    );
    if (layers.some((l) => l.timeline)) {
        declarations.push(`animation-timeline:${list((l) => l.timeline ?? "auto")}`);
        declarations.push(`animation-range:${list((l) => l.range ?? "normal")}`);
    }
    return declarations.join(";");
}

/* ------------------------------------------------------------- transitions */

const GEOMETRY = ["transform", "scale", "rotate", "translate", "box-shadow", "filter", "border-radius"];
const PAINT = ["background-color", "color", "border-color", "opacity"];

/** The resting transition every hover or press used before it was editable. */
export const LEGACY_STATE_TRANSITION =
    "transform .42s cubic-bezier(.16,1,.3,1),scale .42s cubic-bezier(.16,1,.3,1),rotate .42s cubic-bezier(.16,1,.3,1),translate .42s cubic-bezier(.16,1,.3,1),background-color .32s ease,color .32s ease,border-color .32s ease,box-shadow .42s cubic-bezier(.16,1,.3,1),opacity .32s ease,filter .42s ease";

/**
 * The `transition` an element uses between its states.
 *
 * A spring drives the geometry — scale, movement, rotation, shadow — where an
 * overshoot reads as physical. Colour and opacity take a plain ease over a
 * shorter time instead: past 100% they would only clamp, so a bouncing curve
 * there is just a slower one.
 */
export function stateTransition(transition?: StateTransition): { value: string; fallback: string } {
    if (!transition) return { value: LEGACY_STATE_TRANSITION, fallback: LEGACY_STATE_TRANSITION };
    const spring = transition.curve === "spring"
        ? springCurve({ stiffness: transition.stiffness, damping: transition.damping, mass: transition.mass })
        : undefined;
    const duration = spring ? spring.duration : transition.duration;
    const easing = spring ? spring.easing : `cubic-bezier(${transition.bezier})`;
    const fallbackEasing = spring ? spring.fallback : easing;
    const paint = Math.round(spring ? Math.min(duration, 360) : duration);
    const build = (curve: string) =>
        [
            ...GEOMETRY.map((property) => `${property} ${Math.round(duration)}ms ${curve}`),
            ...PAINT.map((property) => `${property} ${paint}ms ${spring ? "cubic-bezier(.25,.1,.25,1)" : curve}`),
        ].join(",");
    return { value: build(easing), fallback: build(fallbackEasing) };
}

function clamp(value: number, min: number, max: number) {
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
