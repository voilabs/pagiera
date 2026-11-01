import assert from "node:assert/strict";
import { parseActionGraph } from "../src/internal/lib/editor/action-graph";
import { ANIMATION_TEMPLATES, parseCustomAnimations, timelineFor } from "../src/internal/lib/editor/custom-animation";
import { parseRootStyle } from "../src/internal/lib/editor/validate";

// Özel animasyonlar: doğrulama, zaman çizelgesi ve grafikteki kullanım.

const [animation] = parseCustomAnimations([
    {
        id: "bounce",
        name: "  Bounce  ",
        duration: 999999,
        easing: { type: "bezier", value: "0.2, 0.9, 0.1, 1" },
        iterations: 3,
        direction: "alternate",
        frames: [
            { at: 100, opacity: 1, y: 0, background: "#fff" },
            { at: 0, opacity: 0, y: 80, rotate: 5000, background: "url(javascript:x)" },
            { at: 50, y: -10 },
        ],
    },
    { id: "one-frame", frames: [{ at: 0 }] },
    { id: "bad id!", frames: [{ at: 0 }, { at: 100 }] },
])!;

assert.equal(animation.name, "Bounce");
assert.equal(animation.duration, 20000);
assert.deepEqual(animation.frames.map((frame) => frame.at), [0, 50, 100]);
assert.equal(animation.frames[0]!.rotate, 1080, "values are clamped");
assert.equal(animation.frames[0]!.background, undefined, "unsafe colours are dropped");
assert.equal(parseCustomAnimations([{ id: "x", frames: [{ at: 0 }] }]), undefined, "an animation needs two frames");

const { keyframes, options } = timelineFor(animation);
assert.deepEqual(keyframes.map((frame) => frame.offset), [0, 0.5, 1]);
// The middle frame names only `y`; opacity and background are filled from its neighbours.
assert.equal(keyframes[1]!.opacity, 0);
assert.equal(keyframes[1]!.backgroundColor, "#fff");
assert.ok(String(keyframes[1]!.transform).includes("translate(0px, -10px)"));
assert.equal(options.easing, "cubic-bezier(0.2, 0.9, 0.1, 1)");
assert.equal(options.iterations, 3);
assert.equal(options.direction, "alternate");
assert.equal(timelineFor({ ...animation, direction: undefined }, true).options.direction, "reverse");

const spring = timelineFor({ ...ANIMATION_TEMPLATES.find((item) => item.name === "Spring pop")!, id: "s" });
assert.ok(String(spring.options.easing).startsWith("linear("), "springs become a linear() curve");
assert.equal(timelineFor({ ...ANIMATION_TEMPLATES.find((item) => item.name === "Pulse")!, id: "p" }).options.iterations, Number.POSITIVE_INFINITY);

// Every template is a valid animation.
assert.equal(parseCustomAnimations(ANIMATION_TEMPLATES.map((template, index) => ({ ...template, id: `t${index}` })))?.length, ANIMATION_TEMPLATES.length);

// The root style keeps the library; the graph accepts custom animations and the new nodes.
assert.equal(parseRootStyle({ animations: [{ ...ANIMATION_TEMPLATES[0], id: "a1" }] }).animations?.length, 1);
const graph = parseActionGraph({
    nodes: [
        { id: "show", type: "action.show", x: 0, y: 0, props: { target: "panel", animation: "custom:a1" } },
        { id: "hide", type: "action.hide", x: 0, y: 0, props: { target: "panel", animation: "custom:<script>" } },
        { id: "play", type: "action.play", x: 0, y: 0, props: { target: "card", animation: "fade", reverse: true } },
        { id: "morph", type: "action.morph", x: 0, y: 0, props: { target: "a", into: "b", duration: 50000, easing: "spring", swap: true } },
    ],
    links: [],
    variables: [],
})!;
assert.equal(graph.nodes[0]!.props?.animation, "custom:a1");
assert.equal(graph.nodes[1]!.props?.animation, undefined);
assert.equal(graph.nodes[2]!.props?.animation, undefined, "Play animation only takes custom animations");
assert.deepEqual(graph.nodes[3]!.props, { target: "a", into: "b", duration: 10000, easing: "spring", swap: true });

console.log("Custom animations: validation, timelines, springs, templates and graph use passed.");
