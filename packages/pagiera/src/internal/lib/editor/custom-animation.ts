import { springCurve } from "./motion";

/**
 * Custom animations: named keyframe timelines an author draws once and uses
 * anywhere — to show, hide or toggle a layer, or to play on demand from the
 * action graph.
 *
 * The built-in animations (fade, slide, zoom…) are one start frame tweened to
 * the layer's own look. A custom animation is a list of frames at points in
 * time, each with any of the properties below, so it can bounce, wobble,
 * overshoot or travel along a path. Everything is plain numbers and colours;
 * the runtime turns it into a Web Animations API timeline.
 */

export type AnimationFrame = {
    /** Where in the timeline, 0 → 100 (%). */
    at: number;
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    skewX?: number;
    skewY?: number;
    blur?: number;
    radius?: number;
    background?: string;
    color?: string;
};

export type AnimationEasing =
    | { type: "preset"; value: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "smooth" | "snappy" | "overshoot" }
    | { type: "bezier"; value: string }
    | { type: "spring"; stiffness: number; damping: number; mass: number };

export type CustomAnimation = {
    id: string;
    name: string;
    frames: AnimationFrame[];
    duration: number;
    delay?: number;
    easing: AnimationEasing;
    /** 0 means forever. */
    iterations?: number;
    direction?: "normal" | "reverse" | "alternate";
};

export const FRAME_FIELDS: Array<{ key: Exclude<keyof AnimationFrame, "at" | "background" | "color">; label: string; min: number; max: number; step: number; unit: string; rest: number }> = [
    { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.05, unit: "", rest: 1 },
    { key: "x", label: "Move X", min: -2000, max: 2000, step: 1, unit: "px", rest: 0 },
    { key: "y", label: "Move Y", min: -2000, max: 2000, step: 1, unit: "px", rest: 0 },
    { key: "scale", label: "Scale", min: 0, max: 10, step: 0.05, unit: "×", rest: 1 },
    { key: "scaleX", label: "Scale X", min: 0, max: 10, step: 0.05, unit: "×", rest: 1 },
    { key: "scaleY", label: "Scale Y", min: 0, max: 10, step: 0.05, unit: "×", rest: 1 },
    { key: "rotate", label: "Rotate", min: -1080, max: 1080, step: 1, unit: "°", rest: 0 },
    { key: "skewX", label: "Skew X", min: -89, max: 89, step: 1, unit: "°", rest: 0 },
    { key: "skewY", label: "Skew Y", min: -89, max: 89, step: 1, unit: "°", rest: 0 },
    { key: "blur", label: "Blur", min: 0, max: 100, step: 1, unit: "px", rest: 0 },
    { key: "radius", label: "Radius", min: 0, max: 1000, step: 1, unit: "px", rest: 0 },
];

export const EASING_PRESETS: Record<string, string> = {
    linear: "linear",
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
    smooth: "cubic-bezier(.16,1,.3,1)",
    snappy: "cubic-bezier(.2,.9,.1,1)",
    overshoot: "cubic-bezier(.34,1.56,.64,1)",
};

/** Starting points for the library; each is an ordinary, editable animation. */
export const ANIMATION_TEMPLATES: Array<Omit<CustomAnimation, "id">> = [
    {
        name: "Bounce in",
        duration: 900,
        easing: { type: "preset", value: "ease-out" },
        frames: [
            { at: 0, opacity: 0, y: 60, scale: 0.9 },
            { at: 55, opacity: 1, y: -12, scale: 1.03 },
            { at: 75, y: 6, scale: 0.99 },
            { at: 100, opacity: 1, y: 0, scale: 1 },
        ],
    },
    {
        name: "Blur slide",
        duration: 700,
        easing: { type: "preset", value: "smooth" },
        frames: [
            { at: 0, opacity: 0, x: -40, blur: 16 },
            { at: 100, opacity: 1, x: 0, blur: 0 },
        ],
    },
    {
        name: "Wobble",
        duration: 800,
        easing: { type: "preset", value: "ease-in-out" },
        frames: [
            { at: 0, rotate: 0 },
            { at: 20, rotate: -8 },
            { at: 40, rotate: 6 },
            { at: 60, rotate: -4 },
            { at: 80, rotate: 2 },
            { at: 100, rotate: 0 },
        ],
    },
    {
        name: "Pulse",
        duration: 1200,
        iterations: 0,
        easing: { type: "preset", value: "ease-in-out" },
        frames: [
            { at: 0, scale: 1 },
            { at: 50, scale: 1.06 },
            { at: 100, scale: 1 },
        ],
    },
    {
        name: "Spring pop",
        duration: 600,
        easing: { type: "spring", stiffness: 260, damping: 14, mass: 1 },
        frames: [
            { at: 0, opacity: 0, scale: 0.6, rotate: -6 },
            { at: 100, opacity: 1, scale: 1, rotate: 0 },
        ],
    },
];

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const BEZIER = /^\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*$/;
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|transparent|[a-z]{3,20})$/i;

function clampNumber(value: unknown, min: number, max: number) {
    const number = Number(value);
    if (value === undefined || value === null || value === "" || !Number.isFinite(number)) return undefined;
    return Math.min(Math.max(number, min), max);
}

function parseEasing(input: unknown): AnimationEasing {
    const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    if (raw.type === "bezier" && typeof raw.value === "string" && BEZIER.test(raw.value)) return { type: "bezier", value: raw.value.trim() };
    if (raw.type === "spring")
        return {
            type: "spring",
            stiffness: clampNumber(raw.stiffness, 1, 1000) ?? 300,
            damping: clampNumber(raw.damping, 1, 100) ?? 30,
            mass: clampNumber(raw.mass, 0.1, 10) ?? 1,
        };
    const preset = typeof raw.value === "string" && Object.hasOwn(EASING_PRESETS, raw.value) ? raw.value : "smooth";
    return { type: "preset", value: preset as Extract<AnimationEasing, { type: "preset" }>["value"] };
}

/** Keeps the library to sane sizes and values; drops anything malformed. */
export function parseCustomAnimations(input: unknown): CustomAnimation[] | undefined {
    if (!Array.isArray(input)) return undefined;
    const out: CustomAnimation[] = [];
    const ids = new Set<string>();
    for (const candidate of input.slice(0, 40)) {
        if (!candidate || typeof candidate !== "object") continue;
        const raw = candidate as Record<string, unknown>;
        if (typeof raw.id !== "string" || !ID.test(raw.id) || ids.has(raw.id)) continue;
        const frames: AnimationFrame[] = [];
        for (const frameInput of Array.isArray(raw.frames) ? raw.frames.slice(0, 24) : []) {
            if (!frameInput || typeof frameInput !== "object") continue;
            const source = frameInput as Record<string, unknown>;
            const frame: AnimationFrame = { at: clampNumber(source.at, 0, 100) ?? 0 };
            for (const field of FRAME_FIELDS) {
                const value = clampNumber(source[field.key], field.min, field.max);
                if (value !== undefined) frame[field.key] = value;
            }
            for (const key of ["background", "color"] as const)
                if (typeof source[key] === "string" && COLOR.test(source[key].trim())) frame[key] = source[key].trim();
            frames.push(frame);
        }
        if (frames.length < 2) continue;
        frames.sort((a, b) => a.at - b.at);
        ids.add(raw.id);
        out.push({
            id: raw.id,
            name: (typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "") || "Animation",
            frames,
            duration: clampNumber(raw.duration, 50, 20_000) ?? 600,
            ...(clampNumber(raw.delay, 0, 20_000) ? { delay: clampNumber(raw.delay, 0, 20_000) } : {}),
            easing: parseEasing(raw.easing),
            ...(raw.iterations !== undefined ? { iterations: clampNumber(raw.iterations, 0, 100) ?? 1 } : {}),
            ...(raw.direction === "reverse" || raw.direction === "alternate" ? { direction: raw.direction } : {}),
        });
    }
    return out.length ? out : undefined;
}

/** One frame as CSS: the transform is composed in a fixed order so every frame interpolates. */
export function frameToKeyframe(frame: AnimationFrame): Keyframe {
    const transform = [
        `translate(${frame.x ?? 0}px, ${frame.y ?? 0}px)`,
        `scale(${(frame.scale ?? 1) * (frame.scaleX ?? 1)}, ${(frame.scale ?? 1) * (frame.scaleY ?? 1)})`,
        `rotate(${frame.rotate ?? 0}deg)`,
        `skew(${frame.skewX ?? 0}deg, ${frame.skewY ?? 0}deg)`,
    ].join(" ");
    const keyframe: Keyframe = { offset: frame.at / 100, transform };
    if (frame.opacity !== undefined) keyframe.opacity = frame.opacity;
    if (frame.blur !== undefined) keyframe.filter = `blur(${frame.blur}px)`;
    if (frame.radius !== undefined) keyframe.borderRadius = `${frame.radius}px`;
    if (frame.background) keyframe.backgroundColor = frame.background;
    if (frame.color) keyframe.color = frame.color;
    return keyframe;
}

export function easingFor(easing: AnimationEasing) {
    if (easing.type === "bezier") return `cubic-bezier(${easing.value})`;
    if (easing.type === "spring") return springCurve(easing).easing;
    return EASING_PRESETS[easing.value] ?? EASING_PRESETS.smooth!;
}

/**
 * The Web Animations API arguments for an animation. Properties a frame
 * leaves out are filled from its neighbours, because WAAPI interpolates only
 * between frames that name the property.
 */
export function timelineFor(animation: CustomAnimation, reverse = false) {
    const keys = new Set<keyof AnimationFrame>();
    for (const frame of animation.frames) for (const key of Object.keys(frame) as Array<keyof AnimationFrame>) keys.add(key);
    const filled = animation.frames.map((frame, index) => {
        const out: AnimationFrame = { ...frame };
        for (const key of keys) {
            if (key === "at" || out[key] !== undefined) continue;
            const before = [...animation.frames.slice(0, index)].reverse().find((item) => item[key] !== undefined);
            const after = animation.frames.slice(index + 1).find((item) => item[key] !== undefined);
            const source = before ?? after;
            if (source) (out as Record<string, unknown>)[key] = source[key];
        }
        return out;
    });
    const keyframes = filled.map(frameToKeyframe);
    const options: KeyframeAnimationOptions = {
        duration: animation.easing.type === "spring" ? Math.max(animation.duration, springCurve(animation.easing).duration) : animation.duration,
        delay: animation.delay ?? 0,
        easing: easingFor(animation.easing),
        iterations: animation.iterations === 0 ? Number.POSITIVE_INFINITY : (animation.iterations ?? 1),
        direction: reverse
            ? animation.direction === "reverse" ? "normal" : "reverse"
            : (animation.direction ?? "normal"),
        fill: "both",
    };
    return { keyframes, options };
}

export const isCustomAnimation = (value: unknown): value is `custom:${string}` =>
    typeof value === "string" && /^custom:[A-Za-z0-9_-]{1,64}$/.test(value);
