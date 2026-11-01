import assert from "node:assert/strict";
import { compatible, layerScope, missingTargets, NODE_SPECS, parseActionGraph } from "../src/internal/lib/editor/action-graph";
import { parseRootStyle } from "../src/internal/lib/editor/validate";

// Sayfa aksiyon grafiği: yalnız bilinen düğümler, uyumlu bağlantılar ve güvenli değerler saklanır.

const graph = parseActionGraph({
    nodes: [
        { id: "click", type: "event.click", x: 10.4, y: 20, props: { target: "button", junk: "x" } },
        { id: "branch", type: "flow.branch", x: 300, y: 20, props: { condition: "true" } },
        { id: "show", type: "action.show", x: 600, y: 0, props: { target: "panel", animation: "fade", duration: 99999 } },
        { id: "go", type: "action.navigate", x: 600, y: 200, props: { url: "javascript:alert(1)", newTab: "true" } },
        { id: "evil", type: "action.eval", x: 0, y: 0 },
        { id: "click", type: "event.load", x: 0, y: 0 },
        { id: "bad id!", type: "event.load", x: 0, y: 0 },
        { id: "set", type: "action.setVariable", x: 0, y: 0, props: { name: "1nope" } },
        { id: "var", type: "data.variable", x: 0, y: 0, props: { name: "clicks" } },
        { id: "cmp", type: "data.compare", x: 0, y: 0, props: { op: "rm -rf", b: 3 } },
    ],
    links: [
        { id: "a", from: "click", fromPin: "out", to: "branch", toPin: "in" },
        { id: "b", from: "click", fromPin: "out", to: "show", toPin: "in" }, // a second wire from one exec output
        { id: "c", from: "branch", fromPin: "true", to: "show", toPin: "in" },
        { id: "d", from: "var", fromPin: "value", to: "cmp", toPin: "a" },
        { id: "e", from: "cmp", fromPin: "value", to: "branch", toPin: "condition" },
        { id: "f", from: "var", fromPin: "value", to: "branch", toPin: "condition" }, // second source for one input
        { id: "g", from: "branch", fromPin: "false", to: "cmp", toPin: "a" }, // exec into data
        { id: "h", from: "ghost", fromPin: "out", to: "show", toPin: "in" },
        { id: "i", from: "show", fromPin: "out", to: "show", toPin: "in" }, // a node into itself
    ],
    variables: [
        { name: "clicks", value: 0, persist: true },
        { name: "clicks", value: "dup" },
        { name: "bad name", value: "x" },
    ],
});

assert.ok(graph);
assert.deepEqual(graph.nodes.map((node) => node.id), ["click", "branch", "show", "go", "set", "var", "cmp"]);
assert.deepEqual(graph.nodes[0], { id: "click", type: "event.click", x: 10, y: 20, props: { target: "button" } });
assert.equal(graph.nodes[1]!.props?.condition, "true");
assert.deepEqual(graph.nodes[2]!.props, { target: "panel", animation: "fade", duration: 5000 });
assert.equal(graph.nodes[3]!.props?.url, undefined, "javascript: URLs are dropped");
assert.equal(graph.nodes[3]!.props?.newTab, true);
assert.equal(graph.nodes[4]!.props, undefined, "invalid variable names are dropped");
assert.deepEqual(graph.nodes[6]!.props, { b: 3 }, "unknown compare operators are dropped");
assert.deepEqual(graph.links.map((link) => link.id), ["a", "c", "d", "e"]);
assert.deepEqual(graph.variables, [{ name: "clicks", value: "0", persist: true }]);

// Pin compatibility.
assert.equal(compatible("exec", "exec"), true);
assert.equal(compatible("exec", "any"), false);
assert.equal(compatible("number", "text"), true);
assert.equal(compatible("bool", "number"), false);
assert.equal(compatible("any", "bool"), true);

// Nodes whose layer is gone are flagged.
assert.deepEqual([...missingTargets(graph, new Set(["button"]))], ["show"]);

// Every node type the editor offers survives a round trip through the page's root style.
const every = {
    nodes: NODE_SPECS.map((spec, index) => ({ id: `n${index}`, type: spec.type, x: index * 10, y: 0 })),
    links: [],
    variables: [],
};
const stored = parseRootStyle({ actionGraph: every }).actionGraph;
assert.equal(stored?.nodes.length, NODE_SPECS.length);
assert.equal(parseRootStyle({}).actionGraph, undefined);
assert.equal(parseActionGraph({ nodes: "nope" }), undefined);

// Bir katmanın kapsamı: o katmandaki olaylardan ileri, onu hedefleyen aksiyonlardan geri akış ve besleyen veri düğümleri.
const scoped = parseActionGraph({
    nodes: [
        { id: "load", type: "event.load", x: 0, y: 0 },
        { id: "seq", type: "flow.sequence", x: 0, y: 0 },
        { id: "showA", type: "action.show", x: 0, y: 0, props: { target: "a" } },
        { id: "showB", type: "action.show", x: 0, y: 0, props: { target: "b" } },
        { id: "clickA", type: "event.click", x: 0, y: 0, props: { target: "a" } },
        { id: "text", type: "action.setText", x: 0, y: 0, props: { target: "c" } },
        { id: "value", type: "data.value", x: 0, y: 0, props: { value: "hi" } },
        { id: "clickC", type: "event.click", x: 0, y: 0, props: { target: "c" } },
    ],
    links: [
        { id: "l1", from: "load", fromPin: "out", to: "seq", toPin: "in" },
        { id: "l2", from: "seq", fromPin: "then0", to: "showA", toPin: "in" },
        { id: "l3", from: "seq", fromPin: "then1", to: "showB", toPin: "in" },
        { id: "l4", from: "clickA", fromPin: "out", to: "text", toPin: "in" },
        { id: "l5", from: "value", fromPin: "value", to: "text", toPin: "text" },
        { id: "l6", from: "clickC", fromPin: "out", to: "showB", toPin: "in" },
    ],
    variables: [],
})!;
assert.equal(scoped.links.length, 6, "the scope fixture keeps all its links");
assert.deepEqual([...layerScope(scoped, "a")].sort(), ["clickA", "load", "seq", "showA", "text", "value"].sort());
assert.deepEqual([...layerScope(scoped, "b")].sort(), ["clickC", "load", "seq", "showB"].sort(), "other branches of an event stay out");
assert.equal(layerScope(scoped, "nobody").size, 0);

console.log(`Action graph: ${NODE_SPECS.length} node types, validation, links, variables, layer scope and round trip passed.`);
