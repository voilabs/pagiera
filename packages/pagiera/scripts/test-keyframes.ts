import assert from "node:assert/strict";
import { EFFECT_PRESETS, presetMotion } from "../src/internal/lib/editor/effect-presets";
import { easeAt, easeCss, motionCss, motionDuration, motionTracks, parseEase, parseLayerMotion, splitIndex, valueAt, wiggledAt } from "../src/internal/lib/editor/keyframes";
import { createElement } from "../src/internal/lib/editor/tree";
import { type CanvasElement, DEFAULT_ROOT_STYLE } from "../src/internal/lib/editor/types";
import { parseElements } from "../src/internal/lib/editor/validate";
import { classFor, ENTRANCE_SCRIPT, stylesheetFor } from "../src/internal/lib/render/css";

// Serbest keyframe'ler: doğrulama, ara değerler, CSS çıktısı ve yayınlanan stil dosyası.

const motion = parseLayerMotion({
    trigger: "load",
    repeat: "pingpong",
    tracks: {
        opacity: [{ t: 400, v: 100 }, { t: 0, v: 0, ease: "out" }, { t: 400, v: 80 }, { t: "x", v: 1 }],
        rotate: [{ t: 0, v: 99999 }],
        y: [{ t: 0, v: 40, ease: "hold" }, { t: 1000, v: 0 }],
        nonsense: [{ t: 0, v: 1 }],
        scale: [],
    },
})!;

assert.equal(motion.trigger, "load");
assert.equal(motion.repeat, "pingpong");
assert.deepEqual(motion.tracks.opacity, [{ t: 0, v: 0, ease: "out" }, { t: 400, v: 80 }], "sorted, one keyframe per moment (last wins), bad ones dropped");
assert.equal(motion.tracks.rotate?.[0]?.v, 3600, "values are clamped");
assert.equal(motion.tracks.scale, undefined, "empty tracks are dropped");
assert.equal("nonsense" in motion.tracks, false);
assert.equal(motionDuration(motion), 1000);
assert.equal(parseLayerMotion({ tracks: {} }), undefined);

assert.equal(valueAt(motion.tracks.opacity, -50, 100), 0, "held before the first keyframe");
assert.equal(valueAt(motion.tracks.opacity, 5000, 100), 80, "held after the last");
assert.equal(valueAt(motion.tracks.y, 999, 0), 40, "hold keeps the value until the next keyframe");
assert.ok(valueAt(motion.tracks.opacity, 200, 100) > 40, "ease out is past half way at half time");
assert.equal(valueAt(undefined, 10, 100), 100, "no track rests");
assert.ok(Math.abs(easeAt("linear", 0.3) - 0.3) < 1e-3);

const { duration, tracks } = motionTracks(motion);
assert.equal(duration, 1000);
assert.deepEqual(tracks.map((track) => track.property), ["translate", "rotate", "opacity"]);
const opacity = tracks.find((track) => track.property === "opacity")!;
assert.deepEqual(opacity.frames.map((frame) => frame.offset), [0, 0.4, 1], "a track ending early holds to the end");
assert.equal(opacity.frames[0]!.easing, "cubic-bezier(0,0,.2,1)");
const translate = tracks.find((track) => track.property === "translate")!;
assert.equal(translate.frames[0]!.value, "0px 40px");
assert.equal(translate.frames[0]!.easing, "steps(1,end)");

// X and Y keyed at different moments are sampled, so neither bends the other.
const split = motionTracks(parseLayerMotion({ tracks: { x: [{ t: 0, v: 0 }, { t: 1000, v: 100 }], y: [{ t: 500, v: 0 }, { t: 900, v: 50 }] } })!);
assert.ok(split.tracks[0]!.frames.length > 20);
assert.ok(split.tracks[0]!.frames.every((frame) => frame.easing === "linear"));

const { keyframes, declarations } = motionCss(motion, "pg-k-demo");
assert.match(keyframes, /@keyframes pg-k-demo-opacity\{0%\{opacity:0;animation-timing-function:cubic-bezier\(0,0,\.2,1\)\}/);
assert.match(declarations, /animation-iteration-count:infinite,infinite,infinite/);
assert.match(declarations, /animation-direction:alternate/);
assert.match(declarations, /animation-fill-mode:both/);

// Published: keyframes replace the entrance and play through the reveal script.
const layer: CanvasElement = {
    ...createElement("Text", { x: 0, y: 0, z: 0 }),
    id: "kf",
    base: { ...createElement("Text", { x: 0, y: 0, z: 0 }).base, entrance: "up" },
    motion,
};
const [parsed] = parseElements([layer]);
assert.deepEqual(parsed!.motion, motion, "keyframes round-trip through validation");
const css = stylesheetFor([parsed!], DEFAULT_ROOT_STYLE);
const cls = classFor("kf");
assert.ok(css.includes(`@keyframes pg-k-${cls}-opacity`));
assert.ok(css.includes(`.pg-ready .${cls}.pg-kf:not(.pg-in){translate:0px 40px;rotate:3600deg;opacity:0}`), "waits on its first frame");
assert.ok(css.includes(`.pg-ready .${cls}.pg-kf.pg-in{animation-name:`));
assert.ok(!css.includes(`pg-e-${cls}`), "the entrance it replaces is not emitted");
assert.ok(ENTRANCE_SCRIPT.includes(".pg-anim,.pg-kf") && ENTRANCE_SCRIPT.includes("data-pg-now"));

// Kurallar: renkler, filtre grupları, eğriler, wiggle, metin bölme ve efekt kütüphanesi.
const rich = parseLayerMotion({
    tracks: {
        background: [{ t: 0, v: "#ff0000" }, { t: 1000, v: "rgba(0,0,255,0.5)" }, { t: 500, v: "url(javascript:x)" }],
        brightness: [{ t: 0, v: 50 }, { t: 1000, v: 100 }],
        hue: [{ t: 0, v: 0 }, { t: 1000, v: 90 }],
        rotateX: [{ t: 0, v: -90, ease: "bezier:0.2,1.8,0.3,1" }, { t: 600, v: 0 }],
        clipTop: [{ t: 0, v: 100, ease: "spring:9999,0" }, { t: 800, v: 0 }],
    },
    wiggles: { x: { amount: 10, speed: 3 }, background: { amount: 1, speed: 1 } },
    split: { by: "letters", stagger: 40, order: "center" },
    origin: { x: 50, y: 100 },
})!;
assert.equal(rich.tracks.background?.length, 2, "unsafe colours are dropped");
assert.equal(String(valueAt(rich.tracks.background, 500, "#000")).startsWith("rgba("), true, "colours blend");
assert.equal(rich.tracks.clipTop?.[0]?.ease, "spring:1000,1", "springs are clamped");
assert.equal(rich.wiggles?.background, undefined, "only numbers wiggle");
assert.deepEqual(rich.split, { by: "letters", stagger: 40, order: "center" });
assert.deepEqual(rich.origin, { x: 50, y: 100 });
assert.equal(parseEase("bezier:2,9,-1,1"), "bezier:1,3,0,1");
assert.equal(parseEase("nonsense"), undefined);
assert.match(easeCss("spring:180,12"), /^linear\(/);
assert.ok(easeAt("bezier:0.2,1.8,0.3,1", 0.5) > 1, "a hand-drawn curve can overshoot");
assert.equal(motionDuration(parseLayerMotion({ tracks: {}, wiggles: { rotate: { amount: 5, speed: 2 } } })!), 3000, "a wiggle alone runs three seconds");
assert.notEqual(wiggledAt(rich, "x", 400, 0), wiggledAt(rich, "x", 900, 0), "wiggle moves");
assert.equal(wiggledAt(rich, "x", 400, 0), wiggledAt(rich, "x", 400, 0), "and the same way every time");

const built = motionTracks(rich);
const filter = built.tracks.find((t) => t.property === "filter")!;
assert.match(filter.frames[0]!.value, /^brightness\(0\.5\) hue-rotate\(0deg\)$/, "filters share one property, keyed ones only");
assert.ok(built.tracks.find((t) => t.property === "transform")!.frames[0]!.value.includes("rotateX(-90deg)"));
assert.ok(built.tracks.find((t) => t.property === "translate")!.frames.length > 20, "a wiggle is sampled");
assert.ok(built.tracks.some((t) => t.property === "clip-path"));
assert.equal(built.tracks.find((t) => t.property === "background-color")!.frames[0]!.value, "#ff0000");
assert.match(motionCss(rich, "pg-k-x").declarations, /animation-delay:calc\(var\(--i, 0\) \* 40ms\)/, "split pieces wait their turn");
assert.deepEqual([0, 1, 2, 3, 4].map((i) => splitIndex(i, 5, "center")), [2, 1, 0, 1, 2]);
assert.deepEqual([0, 1, 2].map((i) => splitIndex(i, 3, "backward")), [2, 1, 0]);
const shuffled = Array.from({ length: 8 }, (_, i) => splitIndex(i, 8, "random"));
assert.deepEqual([...shuffled].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7], "random is a permutation");

const textLayer: CanvasElement = { ...createElement("Text", { x: 0, y: 0, z: 0 }), id: "tx", content: "Hello", motion: rich };
const textCss = stylesheetFor(parseElements([textLayer]), DEFAULT_ROOT_STYLE);
assert.ok(textCss.includes(`.pg-ready .${classFor("tx")}.pg-kf.pg-in .pg-part{`), "a split text animates its pieces");
assert.ok(textCss.includes(`.${classFor("tx")} .pg-part{transform-origin:50% 100%}`), "the anchor point applies to the pieces");

for (const preset of EFFECT_PRESETS) {
    const motion = parseLayerMotion(presetMotion(preset, 250));
    assert.ok(motion, `${preset.name} is a valid motion`);
    assert.ok(motionTracks(motion).tracks.length > 0, `${preset.name} produces animation`);
    if (Object.keys(motion.tracks).length) assert.equal(Math.min(...Object.values(motion.tracks).flatMap((keys) => keys!.map((key) => key.t))), 250, `${preset.name} starts at the playhead`);
}

console.log(`Keyframes: validation, values, curves, colours, filters, wiggle, text split, ${EFFECT_PRESETS.length} effects and published stylesheet passed.`);
