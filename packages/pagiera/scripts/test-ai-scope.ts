import assert from "node:assert/strict";
import { scopeAiPlan } from "../src/internal/lib/editor/ai-scope";
import { createElement } from "../src/internal/lib/editor/tree";
import { applyStyleIsolated } from "../src/internal/lib/editor/style";
const root = createElement("Frame", { x: 0, y: 0, z: 0 });
const child = createElement("Text", { x: 0, y: 0, z: 1, parentId: root.id });
const other = createElement("Frame", { x: 0, y: 0, z: 2 });
const elements = [root, child, other];
const result = scopeAiPlan({ message: "", steps: [], operations: [
    { kind: "update", id: child.id, content: "changed", style: { fontSize: 30 } },
    { kind: "remove", id: other.id }, { kind: "page", style: { maxWidth: 200 } },
    { kind: "add", ref: "x", type: "Text" },
] }, elements, root.id, "tablet");
assert.equal(result.operations.length, 1);
assert.equal(result.targetBreakpoint, "tablet");
assert.equal("content" in result.operations[0], false);
assert.equal(scopeAiPlan({ message: "", steps: [], operations: [{ kind: "update", id: child.id, style: { gap: 10 } }] }, elements, "missing").operations.length, 0);
const isolated = applyStyleIsolated(child, "tablet", { fontSize: 30 }, ["desktop", "tablet", "mobile"]);
assert.equal(isolated.base.fontSize, child.base.fontSize);
assert.equal(isolated.overrides?.tablet?.fontSize, 30);
console.log("AI scope and isolated breakpoint tests passed");
const targeted = scopeAiPlan({ message: "", steps: [], operations: [
    { kind: "update", id: child.id, content: "Edited label" },
    { kind: "update", id: other.id, style: { bg: "red" } },
    { kind: "remove", id: child.id },
    { kind: "page", style: { bg: "black" } },
    { kind: "add", ref: "new-label", parentId: root.id, type: "Text", content: "New label" },
] }, elements, root.id);
assert.deepEqual(targeted.operations.map(operation => operation.kind), ["update", "add"]);
assert.equal(scopeAiPlan({ message: "", steps: [], operations: [{ kind: "page", style: { bg: "red" } }, { kind: "remove", id: root.id }] }, elements).operations.length, 0);
console.log("Targeted edits preserve unrelated layers and reject destructive replacement");
