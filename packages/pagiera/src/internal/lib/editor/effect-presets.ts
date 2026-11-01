import type { Ease, Keyframe, KeyProp, LayerMotion } from "./keyframes";

/**
 * The effects library: After Effects-style moves made of ordinary
 * keyframes. Applying one writes its keyframes on the layer, starting at the
 * playhead, and from then on every keyframe is the author's to drag, retime
 * and recurve. Nothing here is a special kind of animation.
 */

export type EffectCategory = "Entrances" | "Text" | "Attention" | "Loops" | "Exits";

export type EffectPreset = {
    id: string;
    name: string;
    category: EffectCategory;
    /** For text layers only (they split into letters or words). */
    text?: boolean;
    build: () => Omit<LayerMotion, "trigger">;
};

type Step = [t: number, v: number | string, ease?: Ease];
const track = (...steps: Step[]): Keyframe[] => steps.map(([t, v, ease]) => ({ t, v, ...(ease && ease !== "ease" ? { ease } : {}) }));
const tracks = (entries: Partial<Record<KeyProp, Keyframe[]>>) => entries;

export const EFFECT_PRESETS: EffectPreset[] = [
    /* ------------------------------------------------------------ entrances */
    {
        id: "elastic-pop", name: "Elastic pop", category: "Entrances",
        build: () => ({ tracks: tracks({ scale: track([0, 0, "spring:260,11"], [700, 100]), opacity: track([0, 0, "out"], [180, 100]) }) }),
    },
    {
        id: "spin-in", name: "Spin in", category: "Entrances",
        build: () => ({ tracks: tracks({ rotate: track([0, -180, "bezier:0.16,1,0.3,1"], [800, 0]), scale: track([0, 30, "bezier:0.16,1,0.3,1"], [800, 100]), opacity: track([0, 0, "out"], [300, 100]) }) }),
    },
    {
        id: "flip-3d", name: "3D flip", category: "Entrances",
        build: () => ({ origin: { x: 50, y: 100 }, tracks: tracks({ rotateX: track([0, -95, "bezier:0.2,0.9,0.25,1.15"], [900, 0]), opacity: track([0, 0, "out"], [250, 100]) }) }),
    },
    {
        id: "swing-3d", name: "3D swing", category: "Entrances",
        build: () => ({ origin: { x: 0, y: 50 }, tracks: tracks({ rotateY: track([0, 80, "spring:120,9"], [1100, 0]), opacity: track([0, 0, "out"], [250, 100]) }) }),
    },
    {
        id: "blur-reveal", name: "Blur reveal", category: "Entrances",
        build: () => ({ tracks: tracks({ blur: track([0, 24, "out"], [900, 0]), opacity: track([0, 0, "out"], [500, 100]), scale: track([0, 108, "out"], [900, 100]) }) }),
    },
    {
        id: "zoom-blur", name: "Zoom blur", category: "Entrances",
        build: () => ({ tracks: tracks({ scale: track([0, 180, "bezier:0.16,1,0.3,1"], [700, 100]), blur: track([0, 30, "out"], [600, 0]), opacity: track([0, 0, "out"], [200, 100]) }) }),
    },
    {
        id: "mask-up", name: "Mask wipe up", category: "Entrances",
        build: () => ({ tracks: tracks({ clipTop: track([0, 100, "bezier:0.77,0,0.18,1"], [800, 0]), y: track([0, 30, "bezier:0.16,1,0.3,1"], [900, 0]) }) }),
    },
    {
        id: "mask-right", name: "Mask wipe right", category: "Entrances",
        build: () => ({ tracks: tracks({ clipRight: track([0, 100, "bezier:0.77,0,0.18,1"], [800, 0]) }) }),
    },
    {
        id: "iris", name: "Iris open", category: "Entrances",
        build: () => ({ tracks: tracks({ clipTop: track([0, 50, "inOut"], [800, 0]), clipRight: track([0, 50, "inOut"], [800, 0]), clipBottom: track([0, 50, "inOut"], [800, 0]), clipLeft: track([0, 50, "inOut"], [800, 0]) }) }),
    },
    {
        id: "drop-bounce", name: "Drop & bounce", category: "Entrances",
        build: () => ({ tracks: tracks({ y: track([0, -260, "in"], [420, 0, "out"], [560, -40, "in"], [680, 0, "out"], [760, -12, "in"], [840, 0]), opacity: track([0, 0, "out"], [150, 100]) }) }),
    },
    {
        id: "slide-glow", name: "Slide with glow", category: "Entrances",
        build: () => ({ tracks: tracks({ x: track([0, -120, "bezier:0.16,1,0.3,1"], [800, 0]), opacity: track([0, 0, "out"], [300, 100]), shadowBlur: track([0, 40, "out"], [1000, 0]), shadowColor: track([0, "rgba(124,92,255,0.8)", "out"], [1000, "rgba(124,92,255,0)"]) }) }),
    },
    {
        id: "develop", name: "Develop (colour in)", category: "Entrances",
        build: () => ({ tracks: tracks({ grayscale: track([0, 100, "inOut"], [1400, 0]), brightness: track([0, 180, "out"], [900, 100]), opacity: track([0, 0, "out"], [400, 100]) }) }),
    },
    /* ----------------------------------------------------------------- text */
    {
        id: "letters-rise", name: "Letters rise", category: "Text", text: true,
        build: () => ({ split: { by: "letters", stagger: 35 }, tracks: tracks({ y: track([0, 40, "bezier:0.16,1,0.3,1"], [700, 0]), rotate: track([0, 12, "bezier:0.16,1,0.3,1"], [700, 0]), opacity: track([0, 0, "out"], [300, 100]) }) }),
    },
    {
        id: "letters-random", name: "Letters scatter", category: "Text", text: true,
        build: () => ({ split: { by: "letters", stagger: 25, order: "random" }, tracks: tracks({ y: track([0, -30, "out"], [600, 0]), blur: track([0, 10, "out"], [500, 0]), opacity: track([0, 0, "out"], [400, 100]) }) }),
    },
    {
        id: "letters-center", name: "From the centre", category: "Text", text: true,
        build: () => ({ split: { by: "letters", stagger: 45, order: "center" }, tracks: tracks({ scale: track([0, 0, "spring:300,14"], [600, 100]), opacity: track([0, 0, "out"], [200, 100]) }) }),
    },
    {
        id: "letters-flip", name: "Letters flip", category: "Text", text: true,
        build: () => ({ split: { by: "letters", stagger: 40 }, origin: { x: 50, y: 100 }, tracks: tracks({ rotateX: track([0, -90, "bezier:0.2,0.9,0.3,1.2"], [700, 0]), opacity: track([0, 0, "out"], [200, 100]) }) }),
    },
    {
        id: "typewriter", name: "Typewriter", category: "Text", text: true,
        build: () => ({ split: { by: "letters", stagger: 55 }, tracks: tracks({ opacity: track([0, 0, "hold"], [1, 100]) }) }),
    },
    {
        id: "words-slide", name: "Words slide", category: "Text", text: true,
        build: () => ({ split: { by: "words", stagger: 90 }, tracks: tracks({ x: track([0, -24, "out"], [600, 0]), opacity: track([0, 0, "out"], [500, 100]), blur: track([0, 6, "out"], [500, 0]) }) }),
    },
    {
        id: "tracking-in", name: "Tracking in", category: "Text", text: true,
        build: () => ({ tracks: tracks({ letterSpacing: track([0, 40, "bezier:0.16,1,0.3,1"], [1200, 0]), opacity: track([0, 0, "out"], [600, 100]), blur: track([0, 8, "out"], [800, 0]) }) }),
    },
    /* ------------------------------------------------------------ attention */
    {
        id: "shake", name: "Shake", category: "Attention",
        build: () => ({ tracks: tracks({ x: track([0, 0, "linear"], [80, -12, "linear"], [160, 12, "linear"], [240, -10, "linear"], [320, 10, "linear"], [400, -6, "linear"], [480, 4, "linear"], [560, 0]) }) }),
    },
    {
        id: "rubber", name: "Rubber band", category: "Attention",
        build: () => ({ tracks: tracks({ scaleX: track([0, 100], [300, 125], [400, 75], [500, 115], [650, 95], [750, 105], [1000, 100]), scaleY: track([0, 100], [300, 75], [400, 125], [500, 85], [650, 105], [750, 95], [1000, 100]) }) }),
    },
    {
        id: "jello", name: "Jello", category: "Attention",
        build: () => ({ tracks: tracks({ skewX: track([0, 0], [110, -12.5], [220, 6.25], [330, -3.1], [440, 1.5], [550, -0.8], [700, 0]), skewY: track([0, 0], [110, -12.5], [220, 6.25], [330, -3.1], [440, 1.5], [550, -0.8], [700, 0]) }) }),
    },
    {
        id: "glitch", name: "Glitch", category: "Attention",
        build: () => ({
            tracks: tracks({
                x: track([0, 0, "hold"], [60, -8, "hold"], [120, 6, "hold"], [180, -3, "hold"], [240, 10, "hold"], [300, 0]),
                skewX: track([0, 0, "hold"], [60, 18, "hold"], [120, -10, "hold"], [240, 6, "hold"], [300, 0]),
                hue: track([0, 0, "hold"], [60, 90, "hold"], [180, -60, "hold"], [300, 0]),
                clipBottom: track([0, 0, "hold"], [60, 40, "hold"], [120, 0, "hold"], [180, 65, "hold"], [240, 0]),
            }),
        }),
    },
    {
        id: "tada", name: "Tada", category: "Attention",
        build: () => ({ tracks: tracks({ scale: track([0, 100], [100, 90], [300, 110], [900, 110], [1000, 100]), rotate: track([0, 0], [100, -3], [200, -3], [300, 3, "linear"], [400, -3, "linear"], [500, 3, "linear"], [600, -3, "linear"], [700, 3, "linear"], [800, -3, "linear"], [900, 3], [1000, 0]) }) }),
    },
    /* ---------------------------------------------------------------- loops */
    {
        id: "float", name: "Float", category: "Loops",
        build: () => ({ repeat: "pingpong", tracks: tracks({ y: track([0, 0, "inOut"], [1600, -14]), rotate: track([0, -1.5, "inOut"], [1600, 1.5]) }) }),
    },
    {
        id: "heartbeat", name: "Heartbeat", category: "Loops",
        build: () => ({ repeat: "loop", tracks: tracks({ scale: track([0, 100, "out"], [140, 114, "in"], [280, 100, "out"], [420, 110, "in"], [700, 100], [1300, 100]) }) }),
    },
    {
        id: "pulse-glow", name: "Pulse glow", category: "Loops",
        build: () => ({ repeat: "pingpong", tracks: tracks({ shadowBlur: track([0, 0, "inOut"], [1100, 36]), shadowColor: track([0, "rgba(124,92,255,0.15)", "inOut"], [1100, "rgba(124,92,255,0.85)"]), scale: track([0, 100, "inOut"], [1100, 103]) }) }),
    },
    {
        id: "wiggle", name: "Wiggle", category: "Loops",
        build: () => ({ repeat: "loop", tracks: {}, wiggles: { rotate: { amount: 6, speed: 3 }, x: { amount: 5, speed: 2 }, y: { amount: 5, speed: 2.5 } } }),
    },
    {
        id: "hue-cycle", name: "Colour cycle", category: "Loops",
        build: () => ({ repeat: "loop", tracks: tracks({ hue: track([0, 0, "linear"], [4000, 360]) }) }),
    },
    {
        id: "spin", name: "Spin", category: "Loops",
        build: () => ({ repeat: "loop", tracks: tracks({ rotate: track([0, 0, "linear"], [2400, 360]) }) }),
    },
    {
        id: "neon-flicker", name: "Neon flicker", category: "Loops",
        build: () => ({ repeat: "loop", tracks: tracks({ opacity: track([0, 100, "hold"], [900, 40, "hold"], [960, 100, "hold"], [1040, 30, "hold"], [1080, 100, "hold"], [2600, 100]), brightness: track([0, 120, "hold"], [900, 60, "hold"], [1080, 120, "hold"], [2600, 120]) }) }),
    },
    /* ---------------------------------------------------------------- exits */
    {
        id: "fade-down-out", name: "Fade down", category: "Exits",
        build: () => ({ tracks: tracks({ y: track([0, 0, "in"], [600, 40]), opacity: track([0, 100, "in"], [600, 0]) }) }),
    },
    {
        id: "shrink-spin-out", name: "Shrink & spin", category: "Exits",
        build: () => ({ tracks: tracks({ scale: track([0, 100, "back"], [700, 0]), rotate: track([0, 0, "in"], [700, 120]), opacity: track([0, 100, "in"], [700, 0]) }) }),
    },
    {
        id: "mask-out", name: "Mask wipe out", category: "Exits",
        build: () => ({ tracks: tracks({ clipBottom: track([0, 0, "bezier:0.77,0,0.18,1"], [700, 100]) }) }),
    },
];

/** A preset as keyframes starting at `at` ms: every keyframe shifted by it. */
export function presetMotion(preset: EffectPreset, at: number): Omit<LayerMotion, "trigger"> {
    const motion = preset.build();
    if (!at) return motion;
    return {
        ...motion,
        tracks: Object.fromEntries(Object.entries(motion.tracks).map(([prop, keys]) => [prop, (keys ?? []).map((key) => ({ ...key, t: Math.round(key.t + at) }))])),
    };
}
