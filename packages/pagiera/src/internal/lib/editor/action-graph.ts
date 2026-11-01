import { ACTION_ANIMATIONS } from "./actions";

/**
 * Page actions as a node graph, in the spirit of Unreal's Blueprints.
 *
 * Events start a flow ("Page loaded", "Clicked"). White execution wires carry
 * it from node to node in order — through a Branch, a Sequence, a Delay — to
 * actions that change the page ("Show layer", "Go to URL"). Coloured data
 * wires feed values into those nodes: a variable, a comparison, the text of
 * an input.
 *
 * The graph is data, never code. The published page runs it with the same
 * interpreter as layer workflows (`lib/render/actions.ts`), which only knows the node types
 * listed here, so a graph can do exactly what this catalogue offers and
 * nothing more. That is also what lets the server validate a graph before it
 * is saved.
 */

export type PinKind = "exec" | "bool" | "number" | "text" | "any";

export type PinSpec = {
    id: string;
    label: string;
    kind: PinKind;
};

export type PropSpec =
    | { id: string; label: string; type: "layer" }
    | { id: string; label: string; type: "text"; placeholder?: string }
    | { id: string; label: string; type: "number"; min?: number; max?: number; suffix?: string }
    | { id: string; label: string; type: "bool" }
    | { id: string; label: string; type: "select"; options: Array<{ value: string; label: string }> }
    | { id: string; label: string; type: "variable" }
    /** A built-in animation or one of the site's custom ones (`custom:<id>`). */
    | { id: string; label: string; type: "animation"; builtIn: boolean };

export type NodeCategory = "event" | "flow" | "action" | "data";

export type NodeSpec = {
    type: string;
    category: NodeCategory;
    title: string;
    /** One line under the title, e.g. "Target is a layer". */
    subtitle?: string;
    inputs: PinSpec[];
    outputs: PinSpec[];
    props: PropSpec[];
};

const EXEC_IN: PinSpec = { id: "in", label: "", kind: "exec" };
const EXEC_OUT: PinSpec = { id: "out", label: "", kind: "exec" };
const TARGET: PropSpec = { id: "target", label: "Layer", type: "layer" };
/** Show, hide and toggle play the same animations as layer workflows and overlays. */
const ANIMATION: PropSpec[] = [
    { id: "animation", label: "Animation", type: "animation", builtIn: true },
    { id: "duration", label: "Duration", type: "number", min: 0, max: 5_000, suffix: "ms" },
];

export const BUILT_IN_ANIMATIONS = ACTION_ANIMATIONS.map((item) => ({ value: item.value as string, label: item.label }));

const COMPARE_OPS = [
    { value: "==", label: "equals" },
    { value: "!=", label: "does not equal" },
    { value: ">", label: "is greater than" },
    { value: "<", label: "is less than" },
    { value: ">=", label: "is at least" },
    { value: "<=", label: "is at most" },
    { value: "contains", label: "contains" },
];

export const NODE_SPECS: NodeSpec[] = [
    // Events: where a flow starts. One execution output, no input.
    { type: "event.load", category: "event", title: "Page loaded", inputs: [], outputs: [EXEC_OUT], props: [] },
    { type: "event.click", category: "event", title: "On click", subtitle: "When a layer is clicked", inputs: [], outputs: [EXEC_OUT], props: [TARGET] },
    { type: "event.hoverStart", category: "event", title: "On hover", subtitle: "Pointer enters a layer", inputs: [], outputs: [EXEC_OUT], props: [TARGET] },
    { type: "event.hoverEnd", category: "event", title: "On hover end", subtitle: "Pointer leaves a layer", inputs: [], outputs: [EXEC_OUT], props: [TARGET] },
    { type: "event.inView", category: "event", title: "On scroll into view", subtitle: "First time a layer is seen", inputs: [], outputs: [EXEC_OUT], props: [TARGET] },
    { type: "event.change", category: "event", title: "On input change", subtitle: "A field's value changes", inputs: [], outputs: [EXEC_OUT], props: [TARGET] },
    {
        type: "event.timer", category: "event", title: "Every interval", subtitle: "Repeats while the page is open",
        inputs: [], outputs: [EXEC_OUT],
        props: [{ id: "ms", label: "Every", type: "number", min: 250, max: 3_600_000, suffix: "ms" }],
    },

    // Flow: decides where execution goes next.
    {
        type: "flow.branch", category: "flow", title: "Branch",
        inputs: [EXEC_IN, { id: "condition", label: "Condition", kind: "bool" }],
        outputs: [{ id: "true", label: "True", kind: "exec" }, { id: "false", label: "False", kind: "exec" }],
        props: [],
    },
    {
        type: "flow.sequence", category: "flow", title: "Sequence",
        inputs: [EXEC_IN],
        outputs: [{ id: "then0", label: "Then 0", kind: "exec" }, { id: "then1", label: "Then 1", kind: "exec" }, { id: "then2", label: "Then 2", kind: "exec" }],
        props: [],
    },
    {
        type: "flow.delay", category: "flow", title: "Delay",
        inputs: [EXEC_IN], outputs: [{ id: "out", label: "Completed", kind: "exec" }],
        props: [{ id: "ms", label: "Duration", type: "number", min: 0, max: 600_000, suffix: "ms" }],
    },
    { type: "flow.once", category: "flow", title: "Do once", inputs: [EXEC_IN], outputs: [{ id: "out", label: "Completed", kind: "exec" }], props: [] },

    // Actions: change the page, then continue.
    { type: "action.show", category: "action", title: "Show layer", subtitle: "Target is a layer", inputs: [EXEC_IN], outputs: [EXEC_OUT], props: [TARGET, ...ANIMATION] },
    { type: "action.hide", category: "action", title: "Hide layer", subtitle: "Target is a layer", inputs: [EXEC_IN], outputs: [EXEC_OUT], props: [TARGET, ...ANIMATION] },
    { type: "action.toggle", category: "action", title: "Toggle layer", subtitle: "Show if hidden, hide if shown", inputs: [EXEC_IN], outputs: [EXEC_OUT], props: [TARGET, ...ANIMATION] },
    { type: "action.scrollTo", category: "action", title: "Scroll to layer", subtitle: "Smoothly", inputs: [EXEC_IN], outputs: [EXEC_OUT], props: [TARGET] },
    {
        type: "action.setText", category: "action", title: "Set text", subtitle: "Replaces a layer's text",
        inputs: [EXEC_IN, { id: "text", label: "Text", kind: "text" }], outputs: [EXEC_OUT], props: [TARGET],
    },
    {
        type: "action.addClass", category: "action", title: "Toggle class", subtitle: "For your custom CSS",
        inputs: [EXEC_IN], outputs: [EXEC_OUT],
        props: [TARGET, { id: "className", label: "Class", type: "text", placeholder: "is-active" }, {
            id: "mode", label: "Mode", type: "select",
            options: [{ value: "toggle", label: "Toggle" }, { value: "add", label: "Add" }, { value: "remove", label: "Remove" }],
        }],
    },
    {
        type: "action.play", category: "action", title: "Play animation", subtitle: "A custom animation on a layer",
        inputs: [EXEC_IN], outputs: [{ id: "out", label: "Finished", kind: "exec" }],
        props: [TARGET, { id: "animation", label: "Animation", type: "animation", builtIn: false }, { id: "reverse", label: "Reverse", type: "bool" }],
    },
    {
        type: "action.morph", category: "action", title: "Morph into layer", subtitle: "Shape, size, corners and colour",
        inputs: [EXEC_IN], outputs: [{ id: "out", label: "Finished", kind: "exec" }],
        props: [
            TARGET,
            { id: "into", label: "Into", type: "layer" },
            { id: "duration", label: "Duration", type: "number", min: 50, max: 10_000, suffix: "ms" },
            {
                id: "easing", label: "Easing", type: "select",
                options: [{ value: "smooth", label: "Smooth" }, { value: "spring", label: "Spring" }, { value: "snappy", label: "Snappy" }, { value: "linear", label: "Linear" }],
            },
            { id: "swap", label: "Then swap", type: "bool" },
        ],
    },
    {
        type: "action.navigate", category: "action", title: "Go to URL",
        inputs: [EXEC_IN, { id: "url", label: "URL", kind: "text" }], outputs: [],
        props: [{ id: "newTab", label: "New tab", type: "bool" }],
    },
    {
        type: "action.setVariable", category: "action", title: "Set variable",
        inputs: [EXEC_IN, { id: "value", label: "Value", kind: "any" }], outputs: [EXEC_OUT],
        props: [{ id: "name", label: "Variable", type: "variable" }],
    },
    {
        type: "action.copy", category: "action", title: "Copy to clipboard",
        inputs: [EXEC_IN, { id: "text", label: "Text", kind: "text" }], outputs: [EXEC_OUT], props: [],
    },

    // Data: values, pure — they run when a node above asks for them.
    {
        type: "data.variable", category: "data", title: "Get variable",
        inputs: [], outputs: [{ id: "value", label: "Value", kind: "any" }],
        props: [{ id: "name", label: "Variable", type: "variable" }],
    },
    {
        type: "data.value", category: "data", title: "Value",
        inputs: [], outputs: [{ id: "value", label: "Value", kind: "any" }],
        props: [{ id: "value", label: "Value", type: "text", placeholder: "Text, number, true/false" }],
    },
    {
        type: "data.compare", category: "data", title: "Compare",
        inputs: [{ id: "a", label: "A", kind: "any" }, { id: "b", label: "B", kind: "any" }],
        outputs: [{ id: "value", label: "Result", kind: "bool" }],
        props: [{ id: "op", label: "Check", type: "select", options: COMPARE_OPS }],
    },
    {
        type: "data.logic", category: "data", title: "And / Or",
        inputs: [{ id: "a", label: "A", kind: "bool" }, { id: "b", label: "B", kind: "bool" }],
        outputs: [{ id: "value", label: "Result", kind: "bool" }],
        props: [{ id: "op", label: "Logic", type: "select", options: [{ value: "and", label: "Both (and)" }, { value: "or", label: "Either (or)" }] }],
    },
    { type: "data.not", category: "data", title: "Not", inputs: [{ id: "a", label: "", kind: "bool" }], outputs: [{ id: "value", label: "", kind: "bool" }], props: [] },
    {
        type: "data.math", category: "data", title: "Math",
        inputs: [{ id: "a", label: "A", kind: "number" }, { id: "b", label: "B", kind: "number" }],
        outputs: [{ id: "value", label: "Result", kind: "number" }],
        props: [{ id: "op", label: "Operation", type: "select", options: [{ value: "+", label: "Add" }, { value: "-", label: "Subtract" }, { value: "*", label: "Multiply" }, { value: "/", label: "Divide" }, { value: "%", label: "Remainder" }] }],
    },
    {
        type: "data.join", category: "data", title: "Join text",
        inputs: [{ id: "a", label: "A", kind: "text" }, { id: "b", label: "B", kind: "text" }],
        outputs: [{ id: "value", label: "Text", kind: "text" }],
        props: [],
    },
    { type: "data.isVisible", category: "data", title: "Is layer shown", inputs: [], outputs: [{ id: "value", label: "Shown", kind: "bool" }], props: [TARGET] },
    { type: "data.inputValue", category: "data", title: "Input value", subtitle: "What a field holds", inputs: [], outputs: [{ id: "value", label: "Value", kind: "text" }], props: [TARGET] },
    { type: "data.layerText", category: "data", title: "Layer text", inputs: [], outputs: [{ id: "value", label: "Text", kind: "text" }], props: [TARGET] },
];

export const NODE_SPEC = new Map(NODE_SPECS.map((spec) => [spec.type, spec]));

export type GraphNode = {
    id: string;
    type: string;
    x: number;
    y: number;
    /** Settings and the literal values of unwired data inputs, by id. */
    props?: Record<string, string | number | boolean>;
};

export type GraphLink = {
    id: string;
    from: string;
    fromPin: string;
    to: string;
    toPin: string;
};

export type GraphVariable = {
    name: string;
    value: string;
    /** Keep the value in the visitor's browser between visits. */
    persist?: boolean;
};

export type ActionGraph = {
    nodes: GraphNode[];
    links: GraphLink[];
    variables: GraphVariable[];
};

export const MAX_NODES = 300;
export const MAX_LINKS = 600;
export const MAX_VARIABLES = 50;

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const VARIABLE = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;

function prop(spec: PropSpec | PinSpec | undefined, value: unknown): string | number | boolean | undefined {
    if (value === undefined || value === null) return undefined;
    const type = spec && "type" in spec ? spec.type : "text";
    if (type === "number") {
        const number = Number(value);
        if (!Number.isFinite(number)) return undefined;
        const ranged = spec && "min" in spec ? Math.min(Math.max(number, spec.min ?? number), spec.max ?? number) : number;
        return Math.round(ranged);
    }
    if (type === "bool") return value === true || value === "true";
    if (type === "layer") return typeof value === "string" && ID.test(value) ? value : undefined;
    if (type === "variable") return typeof value === "string" && VARIABLE.test(value) ? value : undefined;
    if (type === "animation" && spec && "builtIn" in spec) {
        if (typeof value !== "string") return undefined;
        if (/^custom:[A-Za-z0-9_-]{1,64}$/.test(value)) return value;
        return spec.builtIn && BUILT_IN_ANIMATIONS.some((item) => item.value === value) ? value : undefined;
    }
    if (type === "select" && spec && "options" in spec)
        return spec.options.some((option) => option.value === value) ? String(value) : undefined;
    if (typeof value === "number" || typeof value === "boolean") return value;
    return typeof value === "string" ? value.slice(0, 2_000) : undefined;
}

/**
 * Keeps only what the runtime understands: known node types, known props and
 * pins, links between pins of matching shape, and sane sizes. Anything else
 * is dropped rather than refusing the page.
 */
export function parseActionGraph(input: unknown): ActionGraph | undefined {
    if (!input || typeof input !== "object") return undefined;
    const raw = input as Record<string, unknown>;
    const nodes: GraphNode[] = [];
    const seen = new Set<string>();
    for (const candidate of Array.isArray(raw.nodes) ? raw.nodes.slice(0, MAX_NODES) : []) {
        if (!candidate || typeof candidate !== "object") continue;
        const node = candidate as Record<string, unknown>;
        const spec = typeof node.type === "string" ? NODE_SPEC.get(node.type) : undefined;
        if (!spec || typeof node.id !== "string" || !ID.test(node.id) || seen.has(node.id)) continue;
        seen.add(node.id);
        const rawProps = node.props && typeof node.props === "object" ? (node.props as Record<string, unknown>) : {};
        const props: Record<string, string | number | boolean> = {};
        for (const spec_ of spec.props) {
            const value = prop(spec_, rawProps[spec_.id]);
            if (value !== undefined) props[spec_.id] = value;
        }
        // Literal values typed into unwired data inputs.
        for (const pin of spec.inputs) {
            if (pin.kind === "exec") continue;
            const value = prop(undefined, rawProps[pin.id]);
            if (value !== undefined) props[pin.id] = value;
        }
        if (typeof props.url === "string" && !/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(props.url.trim())) delete props.url;
        nodes.push({
            id: node.id,
            type: spec.type,
            x: Math.round(Math.min(Math.max(Number(node.x) || 0, -100_000), 100_000)),
            y: Math.round(Math.min(Math.max(Number(node.y) || 0, -100_000), 100_000)),
            ...(Object.keys(props).length ? { props } : {}),
        });
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const links: GraphLink[] = [];
    const taken = new Set<string>();
    for (const candidate of Array.isArray(raw.links) ? raw.links.slice(0, MAX_LINKS) : []) {
        if (!candidate || typeof candidate !== "object") continue;
        const link = candidate as Record<string, unknown>;
        const from = byId.get(String(link.from));
        const to = byId.get(String(link.to));
        if (!from || !to || from === to) continue;
        const out = NODE_SPEC.get(from.type)?.outputs.find((pin) => pin.id === link.fromPin);
        const into = NODE_SPEC.get(to.type)?.inputs.find((pin) => pin.id === link.toPin);
        if (!out || !into || !compatible(out.kind, into.kind)) continue;
        // An execution output leads to one place; a data input reads one source.
        const key = out.kind === "exec" ? `out:${from.id}:${out.id}` : `in:${to.id}:${into.id}`;
        if (taken.has(key)) continue;
        taken.add(key);
        links.push({
            id: typeof link.id === "string" && ID.test(link.id) ? link.id : `${from.id}-${out.id}-${to.id}-${into.id}`.slice(0, 64),
            from: from.id,
            fromPin: out.id,
            to: to.id,
            toPin: into.id,
        });
    }

    const variables: GraphVariable[] = [];
    const names = new Set<string>();
    for (const candidate of Array.isArray(raw.variables) ? raw.variables.slice(0, MAX_VARIABLES) : []) {
        if (!candidate || typeof candidate !== "object") continue;
        const variable = candidate as Record<string, unknown>;
        if (typeof variable.name !== "string" || !VARIABLE.test(variable.name) || names.has(variable.name)) continue;
        names.add(variable.name);
        variables.push({
            name: variable.name,
            value: typeof variable.value === "string" ? variable.value.slice(0, 2_000) : String(variable.value ?? ""),
            ...(variable.persist === true ? { persist: true } : {}),
        });
    }

    if (!nodes.length && !variables.length) return undefined;
    return { nodes, links, variables };
}

/** Whether an output of one kind may feed an input of another. */
export function compatible(out: PinKind, into: PinKind) {
    if (out === "exec" || into === "exec") return out === into;
    return out === into || out === "any" || into === "any" || into === "text";
}

/** Layers a node points at that no longer exist — shown as errors. */
export function missingTargets(graph: ActionGraph, layerIds: Set<string>) {
    const broken = new Set<string>();
    for (const node of graph.nodes) {
        const spec = NODE_SPEC.get(node.type);
        for (const item of spec?.props ?? []) {
            if (item.type !== "layer") continue;
            const value = node.props?.[item.id];
            if (typeof value !== "string" || !layerIds.has(value)) broken.add(node.id);
        }
    }
    return broken;
}

/**
 * The part of a graph that is about one layer, for the editor's split view.
 *
 * It starts from every node that names the layer — an event on it, an
 * action aimed at it — and follows the execution wires: forwards from each,
 * and backwards from actions along the path from the events that reach
 * them. Other branches of those events stay out: they are about other
 * layers. Data nodes feeding anything shown come along with it.
 */
export function layerScope(graph: ActionGraph, layerId: string) {
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const pinKind = (nodeId: string, pinId: string) =>
        NODE_SPEC.get(byId.get(nodeId)?.type ?? "")?.outputs.find((pin) => pin.id === pinId)?.kind;
    const exec = graph.links.filter((link) => pinKind(link.from, link.fromPin) === "exec");
    const data = graph.links.filter((link) => pinKind(link.from, link.fromPin) !== "exec");
    const names = (node: GraphNode) =>
        (NODE_SPEC.get(node.type)?.props ?? []).some((prop) => prop.type === "layer" && node.props?.[prop.id] === layerId);

    const shown = new Set<string>();
    const walk = (start: string, step: (id: string) => string[]) => {
        const queue = [start];
        while (queue.length) {
            const id = queue.pop()!;
            for (const next of step(id)) if (!shown.has(next)) { shown.add(next); queue.push(next); }
        }
    };
    const forward = (id: string) => exec.filter((link) => link.from === id).map((link) => link.to);
    const backward = (id: string) => exec.filter((link) => link.to === id).map((link) => link.from);
    for (const node of graph.nodes.filter(names)) {
        shown.add(node.id);
        walk(node.id, forward);
        if (!node.type.startsWith("event.")) walk(node.id, backward);
    }
    for (const id of [...shown]) walk(id, (target) => data.filter((link) => link.to === target).map((link) => link.from));
    return shown;
}
