import { springCurve } from "./motion";

/**
 * Keyframes: a layer animated freely, the way After Effects animates one.
 *
 * Each property has its own track of keyframes at any times, each with the
 * curve that leads out of it — a preset, a bezier drawn by hand or a spring.
 * Transform values are offsets from the layer's own look (0px, 100%, 0°…);
 * appearance values (colours, corner radius, letter spacing) are absolute,
 * starting from whatever the layer has. A track can also wiggle, and a text
 * layer can play its keyframes letter by letter or word by word, in order,
 * backwards, from the centre or at random.
 *
 * The published page plays them as CSS animations, one per CSS property,
 * all as long as the whole motion so they stay in step on a loop. The editor
 * builds the very same keyframes with the Web Animations API to scrub them.
 */

export type KeyProp =
    | "x" | "y" | "scale" | "scaleX" | "scaleY" | "rotate" | "opacity"
    | "rotateX" | "rotateY" | "skewX" | "skewY"
    | "radius" | "background" | "color" | "letterSpacing"
    | "shadowX" | "shadowY" | "shadowBlur" | "shadowColor"
    | "blur" | "brightness" | "contrast" | "saturate" | "hue" | "grayscale"
    | "clipTop" | "clipRight" | "clipBottom" | "clipLeft";

export type KeyEase = "linear" | "ease" | "in" | "out" | "inOut" | "back" | "hold";
/** A named curve, `bezier:x1,y1,x2,y2`, or `spring:stiffness,damping`. */
export type Ease = KeyEase | `bezier:${string}` | `spring:${string}`;
export type KeyValue = number | string;

export type Keyframe = {
    /** Milliseconds from the start of the motion. */
    t: number;
    v: KeyValue;
    /** The curve from this keyframe to the next; `ease` when unset. */
    ease?: Ease;
};

export type Wiggle = { amount: number; speed: number };
export type SplitOrder = "forward" | "backward" | "center" | "random";
export type TextSplit = { by: "letters" | "words"; stagger: number; order?: SplitOrder };

export type LayerMotion = {
    tracks: Partial<Record<KeyProp, Keyframe[]>>;
    /** "view" waits until the layer scrolls into view; "load" plays as the page opens. */
    trigger?: "view" | "load";
    repeat?: "once" | "loop" | "pingpong";
    /** Random wobble on top of a track, After Effects' `wiggle(speed, amount)`. */
    wiggles?: Partial<Record<KeyProp, Wiggle>>;
    /** Plays the keyframes on each letter or word, one after another. */
    split?: TextSplit;
    /** The anchor point, in % of the layer: what it scales and rotates around. */
    origin?: { x: number; y: number };
};

export type CssProperty =
    | "translate" | "scale" | "rotate" | "transform" | "opacity" | "filter"
    | "border-radius" | "background-color" | "color" | "letter-spacing" | "box-shadow" | "clip-path";

export type KeyGroup = "Transform" | "3D & skew" | "Appearance" | "Shadow" | "Filters" | "Mask" | "Text";

export type PropSpec = {
    prop: KeyProp;
    label: string;
    group: KeyGroup;
    kind: "number" | "color";
    /** The resting value; `null` for an absolute property whose rest is the layer's own. */
    rest: KeyValue | null;
    min: number;
    max: number;
    step: number;
    unit: string;
    color: string;
    css: CssProperty;
};

const n = (prop: KeyProp, label: string, group: KeyGroup, css: CssProperty, rest: number | null, min: number, max: number, unit: string, color: string, step = 1): PropSpec =>
    ({ prop, label, group, kind: "number", rest, min, max, step, unit, color, css });
const c = (prop: KeyProp, label: string, group: KeyGroup, css: CssProperty, rest: string | null, color: string): PropSpec =>
    ({ prop, label, group, kind: "color", rest, min: 0, max: 0, step: 0, unit: "", color, css });

export const KEY_PROPS: PropSpec[] = [
    n("x", "Position X", "Transform", "translate", 0, -4000, 4000, "px", "#2f80ed"),
    n("y", "Position Y", "Transform", "translate", 0, -4000, 4000, "px", "#0ea5e9"),
    n("scale", "Scale", "Transform", "scale", 100, 0, 1000, "%", "#10b981"),
    n("rotate", "Rotation", "Transform", "rotate", 0, -3600, 3600, "°", "#f59e0b"),
    n("opacity", "Opacity", "Transform", "opacity", 100, 0, 100, "%", "#8b5cf6"),
    n("scaleX", "Scale X", "3D & skew", "scale", 100, -1000, 1000, "%", "#22c55e"),
    n("scaleY", "Scale Y", "3D & skew", "scale", 100, -1000, 1000, "%", "#16a34a"),
    n("rotateX", "Rotate X (3D)", "3D & skew", "transform", 0, -3600, 3600, "°", "#ef4444"),
    n("rotateY", "Rotate Y (3D)", "3D & skew", "transform", 0, -3600, 3600, "°", "#f97316"),
    n("skewX", "Skew X", "3D & skew", "transform", 0, -89, 89, "°", "#eab308"),
    n("skewY", "Skew Y", "3D & skew", "transform", 0, -89, 89, "°", "#ca8a04"),
    n("radius", "Corner radius", "Appearance", "border-radius", null, 0, 2000, "px", "#06b6d4"),
    c("background", "Fill", "Appearance", "background-color", null, "#a855f7"),
    c("color", "Text colour", "Appearance", "color", null, "#d946ef"),
    n("shadowX", "Shadow X", "Shadow", "box-shadow", 0, -500, 500, "px", "#64748b"),
    n("shadowY", "Shadow Y", "Shadow", "box-shadow", 0, -500, 500, "px", "#475569"),
    n("shadowBlur", "Shadow blur", "Shadow", "box-shadow", 0, 0, 500, "px", "#334155"),
    c("shadowColor", "Shadow colour", "Shadow", "box-shadow", "rgba(0,0,0,0.35)", "#1e293b"),
    n("blur", "Blur", "Filters", "filter", 0, 0, 200, "px", "#ec4899", 0.5),
    n("brightness", "Brightness", "Filters", "filter", 100, 0, 500, "%", "#facc15"),
    n("contrast", "Contrast", "Filters", "filter", 100, 0, 500, "%", "#a3a3a3"),
    n("saturate", "Saturation", "Filters", "filter", 100, 0, 500, "%", "#f43f5e"),
    n("hue", "Hue", "Filters", "filter", 0, -3600, 3600, "°", "#14b8a6"),
    n("grayscale", "Greyscale", "Filters", "filter", 0, 0, 100, "%", "#737373"),
    n("clipTop", "Mask top", "Mask", "clip-path", 0, 0, 100, "%", "#6366f1"),
    n("clipRight", "Mask right", "Mask", "clip-path", 0, 0, 100, "%", "#4f46e5"),
    n("clipBottom", "Mask bottom", "Mask", "clip-path", 0, 0, 100, "%", "#4338ca"),
    n("clipLeft", "Mask left", "Mask", "clip-path", 0, 0, 100, "%", "#3730a3"),
    n("letterSpacing", "Tracking", "Text", "letter-spacing", null, -50, 400, "px", "#0d9488", 0.5),
];
export const KEY_PROP = new Map(KEY_PROPS.map((item) => [item.prop, item]));
export const KEY_GROUPS: KeyGroup[] = ["Transform", "3D & skew", "Appearance", "Shadow", "Filters", "Mask", "Text"];

export const KEY_EASES: Array<{ value: KeyEase; label: string; css: string; bezier?: [number, number, number, number] }> = [
    { value: "linear", label: "Linear", css: "linear", bezier: [0, 0, 1, 1] },
    { value: "ease", label: "Ease", css: "cubic-bezier(.25,.1,.25,1)", bezier: [0.25, 0.1, 0.25, 1] },
    { value: "in", label: "Ease in", css: "cubic-bezier(.42,0,1,1)", bezier: [0.42, 0, 1, 1] },
    { value: "out", label: "Ease out", css: "cubic-bezier(0,0,.2,1)", bezier: [0, 0, 0.2, 1] },
    { value: "inOut", label: "Ease in-out", css: "cubic-bezier(.65,0,.35,1)", bezier: [0.65, 0, 0.35, 1] },
    { value: "back", label: "Overshoot", css: "cubic-bezier(.34,1.56,.64,1)", bezier: [0.34, 1.56, 0.64, 1] },
    { value: "hold", label: "Hold", css: "steps(1,end)" },
];
const EASE = new Map(KEY_EASES.map((item) => [item.value, item]));

const MAX_T = 60_000;
const MAX_KEYS = 120;
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;

/* ----------------------------------------------------------------- curves */

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The curve, if it is valid; anything else falls back to the default ease. */
export function parseEase(value: unknown): Ease | undefined {
    if (typeof value !== "string") return undefined;
    if (EASE.has(value as KeyEase)) return value === "ease" ? undefined : (value as KeyEase);
    const bezier = /^bezier:(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)$/.exec(value);
    if (bezier) {
        const [x1, y1, x2, y2] = bezier.slice(1).map(Number) as [number, number, number, number];
        if ([x1, y1, x2, y2].some((part) => !Number.isFinite(part))) return undefined;
        return `bezier:${clampNumber(x1, 0, 1)},${clampNumber(y1, -2, 3)},${clampNumber(x2, 0, 1)},${clampNumber(y2, -2, 3)}`;
    }
    const spring = /^spring:([\d.]+),([\d.]+)$/.exec(value);
    if (spring) return `spring:${Math.round(clampNumber(Number(spring[1]), 10, 1000))},${Math.round(clampNumber(Number(spring[2]), 1, 100))}`;
    return undefined;
}

export function bezierOf(ease: Ease | undefined): [number, number, number, number] | undefined {
    if (ease?.startsWith("bezier:")) return ease.slice(7).split(",").map(Number) as [number, number, number, number];
    return EASE.get((ease ?? "ease") as KeyEase)?.bezier;
}

function springOf(ease: string) {
    const [stiffness = 180, damping = 12] = ease.slice(7).split(",").map(Number);
    return springCurve({ stiffness, damping, mass: 1 });
}

export function easeCss(ease: Ease | undefined) {
    if (!ease) return EASE.get("ease")!.css;
    if (ease.startsWith("bezier:")) return `cubic-bezier(${ease.slice(7)})`;
    if (ease.startsWith("spring:")) return springOf(ease).easing;
    return EASE.get(ease as KeyEase)?.css ?? EASE.get("ease")!.css;
}

function bezierAt([x1, y1, x2, y2]: [number, number, number, number], x: number) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    let t = x;
    for (let i = 0; i < 8; i++) {
        const xt = ((ax * t + bx) * t + cx) * t - x;
        const dx = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(xt) < 1e-5 || Math.abs(dx) < 1e-6) break;
        t -= xt / dx;
    }
    t = Math.min(1, Math.max(0, t));
    return ((ay * t + by) * t + cy) * t;
}

/** Progress 0 → 1 (or past it, for overshoot) through a segment with `ease`, at linear progress `p`. */
export function easeAt(ease: Ease | undefined, p: number) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    if (ease === "hold") return 0;
    if (ease?.startsWith("spring:")) {
        const { points } = springOf(ease);
        const at = p * (points.length - 1);
        const i = Math.floor(at);
        return points[i]! + (points[Math.min(points.length - 1, i + 1)]! - points[i]!) * (at - i);
    }
    return bezierAt(bezierOf(ease) ?? [0.25, 0.1, 0.25, 1], p);
}

/* ----------------------------------------------------------------- colours */

export function parseColor(value: string): [number, number, number, number] | undefined {
    const text = value.trim().toLowerCase();
    if (text.startsWith("#")) {
        const hex = text.slice(1);
        const full = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
        if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(full)) return undefined;
        return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1];
    }
    const match = /^rgba?\(([^)]+)\)$/.exec(text);
    if (!match) return undefined;
    const parts = match[1]!.split(",").map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return undefined;
    return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1];
}

export function toHex(value: string) {
    const rgba = parseColor(value);
    if (!rgba) return "#000000";
    return `#${rgba.slice(0, 3).map((part) => Math.round(clampNumber(part, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}

function mixColor(a: string, b: string, p: number) {
    const from = parseColor(a) ?? [0, 0, 0, 0];
    const to = parseColor(b) ?? from;
    const mix = from.map((part, index) => part + (to[index]! - part) * p);
    return `rgba(${Math.round(mix[0]!)},${Math.round(mix[1]!)},${Math.round(mix[2]!)},${Math.round(clampNumber(mix[3]!, 0, 1) * 1000) / 1000})`;
}

/* ------------------------------------------------------------- validation */

/** Keeps known properties, sane values and one keyframe per moment; drops the rest. */
export function parseLayerMotion(input: unknown): LayerMotion | undefined {
    if (!input || typeof input !== "object") return undefined;
    const raw = input as Record<string, unknown>;
    const tracksIn = raw.tracks && typeof raw.tracks === "object" ? (raw.tracks as Record<string, unknown>) : {};
    const tracks: LayerMotion["tracks"] = {};
    for (const spec of KEY_PROPS) {
        const list = tracksIn[spec.prop];
        if (!Array.isArray(list)) continue;
        const byTime = new Map<number, Keyframe>();
        for (const item of list.slice(0, MAX_KEYS)) {
            if (!item || typeof item !== "object") continue;
            const key = item as Record<string, unknown>;
            const t = Number(key.t);
            if (!Number.isFinite(t)) continue;
            let v: KeyValue;
            if (spec.kind === "color") {
                if (typeof key.v !== "string" || !COLOR.test(key.v.trim())) continue;
                v = key.v.trim();
            } else {
                const number = Number(key.v);
                if (typeof key.v === "boolean" || !Number.isFinite(number)) continue;
                v = Math.round(clampNumber(number, spec.min, spec.max) * 100) / 100;
            }
            const time = Math.round(clampNumber(t, 0, MAX_T));
            const ease = parseEase(key.ease);
            byTime.set(time, { t: time, v, ...(ease ? { ease } : {}) });
        }
        const keys = [...byTime.values()].sort((a, b) => a.t - b.t);
        if (keys.length) tracks[spec.prop] = keys;
    }
    const wiggles: LayerMotion["wiggles"] = {};
    if (raw.wiggles && typeof raw.wiggles === "object") {
        for (const [prop, value] of Object.entries(raw.wiggles as Record<string, unknown>)) {
            const spec = KEY_PROP.get(prop as KeyProp);
            if (!spec || spec.kind !== "number" || !value || typeof value !== "object") continue;
            const wiggle = value as Record<string, unknown>;
            const amount = Number(wiggle.amount);
            const speed = Number(wiggle.speed);
            if (!Number.isFinite(amount) || !Number.isFinite(speed) || amount === 0) continue;
            wiggles[spec.prop] = { amount: Math.round(clampNumber(Math.abs(amount), 0, spec.max - spec.min) * 100) / 100, speed: Math.round(clampNumber(speed, 0.1, 30) * 10) / 10 };
        }
    }
    if (!Object.keys(tracks).length && !Object.keys(wiggles).length) return undefined;
    const split = raw.split && typeof raw.split === "object" ? (raw.split as Record<string, unknown>) : undefined;
    const origin = raw.origin && typeof raw.origin === "object" ? (raw.origin as Record<string, unknown>) : undefined;
    return {
        tracks,
        ...(raw.trigger === "load" ? { trigger: "load" as const } : {}),
        ...(raw.repeat === "loop" || raw.repeat === "pingpong" ? { repeat: raw.repeat } : {}),
        ...(Object.keys(wiggles).length ? { wiggles } : {}),
        ...(split && (split.by === "letters" || split.by === "words")
            ? {
                  split: {
                      by: split.by,
                      stagger: Math.round(clampNumber(Number(split.stagger) || 0, 0, 2000)),
                      ...(split.order === "backward" || split.order === "center" || split.order === "random" ? { order: split.order } : {}),
                  },
              }
            : {}),
        ...(origin && Number.isFinite(Number(origin.x)) && Number.isFinite(Number(origin.y)) && !(Number(origin.x) === 50 && Number(origin.y) === 50)
            ? { origin: { x: Math.round(clampNumber(Number(origin.x), -200, 300)), y: Math.round(clampNumber(Number(origin.y), -200, 300)) } }
            : {}),
    };
}

/** How long one pass of the keyframes takes (a wiggle alone runs for three seconds). */
export function motionDuration(motion: LayerMotion | undefined) {
    let end = 0;
    for (const keys of Object.values(motion?.tracks ?? {})) for (const key of keys ?? []) end = Math.max(end, key.t);
    if (motion?.wiggles && Object.keys(motion.wiggles).length) end = Math.max(end, 3000);
    return end;
}

/* ----------------------------------------------------------------- values */

/** A track's value at time `t`: held before the first key and after the last; `rest` with no keys. */
export function valueAt(keys: Keyframe[] | undefined, t: number, rest: KeyValue): KeyValue {
    if (!keys?.length) return rest;
    if (t <= keys[0]!.t) return keys[0]!.v;
    for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i]!;
        const b = keys[i + 1]!;
        if (t <= b.t) {
            const p = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
            const e = easeAt(a.ease, p);
            if (typeof a.v === "string" || typeof b.v === "string") return mixColor(String(a.v), String(b.v), clampNumber(e, 0, 1));
            return a.v + (b.v - a.v) * e;
        }
    }
    return keys[keys.length - 1]!.v;
}

/** Smooth, repeatable noise in -1…1: value noise with a cosine blend, seeded per property. */
function noise(x: number, seed: number) {
    const hash = (i: number) => {
        const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
        return (s - Math.floor(s)) * 2 - 1;
    };
    const i = Math.floor(x);
    const f = x - i;
    const blend = (1 - Math.cos(f * Math.PI)) / 2;
    return hash(i) * (1 - blend) + hash(i + 1) * blend;
}

/** The value including its wiggle, if any. */
export function wiggledAt(motion: LayerMotion, prop: KeyProp, t: number, rest: KeyValue): KeyValue {
    const base = valueAt(motion.tracks[prop], t, rest);
    const wiggle = motion.wiggles?.[prop];
    if (!wiggle || typeof base !== "number") return base;
    const spec = KEY_PROP.get(prop)!;
    return clampNumber(base + noise((t / 1000) * wiggle.speed, KEY_PROPS.indexOf(spec) + 1) * wiggle.amount, spec.min, spec.max);
}

/* ------------------------------------------------------ CSS / WAAPI frames */

export type MotionFrame = { offset: number; value: string; easing: string };
export type MotionTrack = { property: CssProperty; frames: MotionFrame[] };

const fmt = (value: number) => String(Math.round(value * 1000) / 1000);

/** One CSS property's value, from its members' values (members not animated sit at rest). */
function cssValue(property: CssProperty, get: (prop: KeyProp) => KeyValue, members: KeyProp[]) {
    const num = (prop: KeyProp) => Number(get(prop));
    switch (property) {
        case "translate":
            return `${fmt(num("x"))}px ${fmt(num("y"))}px`;
        case "scale":
            return `${fmt((num("scale") / 100) * (num("scaleX") / 100))} ${fmt((num("scale") / 100) * (num("scaleY") / 100))}`;
        case "rotate":
            return `${fmt(num("rotate"))}deg`;
        case "transform":
            return `perspective(900px) rotateX(${fmt(num("rotateX"))}deg) rotateY(${fmt(num("rotateY"))}deg) skew(${fmt(num("skewX"))}deg,${fmt(num("skewY"))}deg)`;
        case "opacity":
            return fmt(num("opacity") / 100);
        case "filter": {
            const parts: Record<string, string> = {
                blur: `blur(${fmt(num("blur"))}px)`,
                brightness: `brightness(${fmt(num("brightness") / 100)})`,
                contrast: `contrast(${fmt(num("contrast") / 100)})`,
                saturate: `saturate(${fmt(num("saturate") / 100)})`,
                hue: `hue-rotate(${fmt(num("hue"))}deg)`,
                grayscale: `grayscale(${fmt(num("grayscale") / 100)})`,
            };
            return members.map((member) => parts[member]).join(" ");
        }
        case "border-radius":
            return `${fmt(num("radius"))}px`;
        case "background-color":
            return String(get("background"));
        case "color":
            return String(get("color"));
        case "letter-spacing":
            return `${fmt(num("letterSpacing"))}px`;
        case "box-shadow":
            return `${fmt(num("shadowX"))}px ${fmt(num("shadowY"))}px ${fmt(num("shadowBlur"))}px ${get("shadowColor")}`;
        case "clip-path":
            return `inset(${fmt(num("clipTop"))}% ${fmt(num("clipRight"))}% ${fmt(num("clipBottom"))}% ${fmt(num("clipLeft"))}%)`;
    }
}

const PROPERTY_ORDER: CssProperty[] = ["translate", "scale", "rotate", "transform", "opacity", "filter", "border-radius", "background-color", "color", "letter-spacing", "box-shadow", "clip-path"];

/**
 * One keyframe list per CSS property, each spanning the whole motion so all
 * of them share a duration. A property whose keys start late holds its first
 * value from 0, and its last value to the end.
 *
 * Properties made of several tracks (`translate` from X and Y, `filter` from
 * every filter, the shadow, the mask…) pass their keys straight through when
 * the tracks are keyed at the same moments with the same curves; otherwise,
 * or with a wiggle, they are sampled finely at linear steps so no track
 * bends another's curve.
 */
export function motionTracks(motion: LayerMotion): { duration: number; tracks: MotionTrack[] } {
    const duration = Math.max(1, motionDuration(motion));
    const at = (t: number) => Math.min(1, Math.max(0, t / duration));
    const tracks: MotionTrack[] = [];
    for (const property of PROPERTY_ORDER) {
        const specs = KEY_PROPS.filter((spec) => spec.css === property);
        const members = specs.filter((spec) => motion.tracks[spec.prop]?.length || motion.wiggles?.[spec.prop]).map((spec) => spec.prop);
        if (!members.length) continue;
        const restOf = (prop: KeyProp) => KEY_PROP.get(prop)!.rest ?? motion.tracks[prop]?.[0]?.v ?? 0;
        const get = (t: number) => (prop: KeyProp) => wiggledAt(motion, prop, t, restOf(prop));
        const keyed = members.filter((prop) => motion.tracks[prop]?.length);
        const wiggly = members.some((prop) => motion.wiggles?.[prop]);
        const first = motion.tracks[keyed[0]!] ?? [];
        const aligned = !wiggly && keyed.length > 0 && keyed.every((prop) => {
            const keys = motion.tracks[prop]!;
            return keys.length === first.length && keys.every((key, index) => key.t === first[index]!.t && (key.ease ?? "ease") === (first[index]!.ease ?? "ease"));
        });
        const frames: MotionFrame[] = [];
        if (aligned) {
            if (first[0]!.t > 0) frames.push({ offset: 0, value: cssValue(property, get(first[0]!.t), members), easing: "linear" });
            for (const key of first) frames.push({ offset: at(key.t), value: cssValue(property, get(key.t), members), easing: easeCss(key.ease) });
            if (first[first.length - 1]!.t < duration) frames.push({ offset: 1, value: cssValue(property, get(duration), members), easing: "linear" });
        } else {
            const times = new Set([0, duration]);
            for (const prop of keyed) for (const key of motion.tracks[prop]!) times.add(key.t);
            const sorted = [...times].sort((a, b) => a - b);
            const fastest = Math.max(0, ...members.map((prop) => motion.wiggles?.[prop]?.speed ?? 0));
            for (let i = 0; i < sorted.length; i++) {
                const t = sorted[i]!;
                const next = sorted[i + 1];
                frames.push({ offset: at(t), value: cssValue(property, get(t), members), easing: "linear" });
                if (next === undefined) break;
                const hold = keyed.some((prop) => motion.tracks[prop]!.some((key) => key.t === t && key.ease === "hold"));
                const steps = hold ? 1 : Math.min(120, Math.max(12, Math.ceil(((next - t) / 1000) * fastest * 10)));
                for (let step = 1; step < steps; step++) {
                    const s = t + ((next - t) * step) / steps;
                    frames.push({ offset: at(s), value: cssValue(property, get(s), members), easing: "linear" });
                }
                if (hold) frames[frames.length - 1]!.easing = "steps(1,end)";
            }
        }
        tracks.push({ property, frames });
    }
    return { duration, tracks };
}

/** What the layer looks like at the very start, as CSS declarations: its state before it plays. */
export function firstFrameCss(motion: LayerMotion) {
    return motionTracks(motion).tracks.map((track) => `${track.property}:${track.frames[0]!.value}`).join(";");
}

/** `@keyframes` and the declarations that play them, for the published stylesheet. */
export function motionCss(motion: LayerMotion, name: string) {
    const { duration, tracks } = motionTracks(motion);
    const keyframes = tracks
        .map((track) => `@keyframes ${name}-${track.property}{${track.frames.map((frame) => `${fmt(frame.offset * 100)}%{${track.property}:${frame.value};animation-timing-function:${frame.easing}}`).join("")}}`)
        .join("");
    const list = (value: string) => tracks.map(() => value).join(",");
    const delay = motion.split ? `calc(var(--i, 0) * ${motion.split.stagger}ms)` : "0ms";
    const declarations = [
        `animation-name:${tracks.map((track) => `${name}-${track.property}`).join(",")}`,
        `animation-duration:${list(`${Math.round(duration)}ms`)}`,
        `animation-timing-function:${list("linear")}`,
        `animation-delay:${list(delay)}`,
        `animation-iteration-count:${list(motion.repeat && motion.repeat !== "once" ? "infinite" : "1")}`,
        `animation-direction:${list(motion.repeat === "pingpong" ? "alternate" : "normal")}`,
        `animation-fill-mode:${list("both")}`,
    ].join(";");
    return { keyframes, declarations };
}

/** `transform-origin` for a motion's anchor point, if it has one. */
export function originCss(motion: LayerMotion) {
    return motion.origin ? `transform-origin:${motion.origin.x}% ${motion.origin.y}%` : "";
}

/** The order a split part plays in: its index, reversed, from the centre, or shuffled the same way every time. */
export function splitIndex(index: number, count: number, order: SplitOrder | undefined) {
    if (order === "backward") return count - 1 - index;
    if (order === "center") return Math.round(Math.abs(index - (count - 1) / 2));
    if (order === "random") {
        const order = Array.from({ length: count }, (_, i) => i);
        let seed = count * 9301 + 49297;
        for (let i = count - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            const j = Math.floor((seed / 233280) * (i + 1));
            [order[i], order[j]] = [order[j]!, order[i]!];
        }
        return order[index] ?? index;
    }
    return index;
}
