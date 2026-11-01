"use client";

import { IconBolt, IconFocusCentered, IconPlus, IconSearch, IconTrash, IconVariable, IconX } from "@tabler/icons-react";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
    type ActionGraph,
    BUILT_IN_ANIMATIONS,
    compatible,
    type GraphLink,
    type GraphNode,
    type GraphVariable,
    layerScope,
    missingTargets,
    NODE_SPEC,
    NODE_SPECS,
    type NodeCategory,
    type NodeSpec,
    type PinKind,
} from "@/lib/editor/action-graph";

/**
 * The page's actions as a node graph, drawn the way Unreal's Blueprint
 * editor draws one: events in red, flow in grey, actions in blue, data in
 * green; white wires carry execution, coloured wires carry values.
 *
 * Everything here edits a local copy and hands the whole graph back with
 * `onChange` when a gesture ends, so dragging a node is one undo step rather
 * than a hundred.
 */

type Layer = { id: string; label: string };

const CATEGORY: Record<NodeCategory, { label: string; header: string; accent: string }> = {
    event: { label: "Events", header: "linear-gradient(90deg,#7f1d1d,#3f1416)", accent: "#ef4444" },
    flow: { label: "Flow", header: "linear-gradient(90deg,#3f3f46,#27272a)", accent: "#d4d4d8" },
    action: { label: "Actions", header: "linear-gradient(90deg,#1e3a5f,#172033)", accent: "#60a5fa" },
    data: { label: "Data", header: "linear-gradient(90deg,#14532d,#132a1d)", accent: "#4ade80" },
};

const PIN_COLOR: Record<PinKind, string> = {
    exec: "#f4f4f5",
    bool: "#ef4444",
    number: "#22c55e",
    text: "#ec4899",
    any: "#a1a1aa",
};

const NODE_WIDTH = 248;
const EMPTY: ActionGraph = { nodes: [], links: [], variables: [] };

const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

type View = { x: number; y: number; zoom: number };
type PinRef = { node: string; pin: string; dir: "in" | "out"; kind: PinKind };
type Palette = { screenX: number; screenY: number; worldX: number; worldY: number; from?: PinRef };
type Gesture =
    | { type: "pan"; startX: number; startY: number; view: View }
    | { type: "move"; node: string; startX: number; startY: number; nodeX: number; nodeY: number; moved: boolean }
    | { type: "wire"; from: PinRef; x: number; y: number };

export function ActionGraphEditor({
    graph,
    onChange,
    layers,
    animations = [],
    scope,
}: {
    graph?: ActionGraph;
    onChange: (graph: ActionGraph | undefined) => void;
    layers: Layer[];
    /** The site's custom animations, offered next to the built-in ones. */
    animations?: Array<{ id: string; name: string }>;
    /**
     * Opened for one layer (the canvas's split view): only the flows about
     * that layer are shown, and new nodes aim at it. "All" shows the page.
     */
    scope?: { layer: string; name: string };
}) {
    const [draft, setDraft] = useState<ActionGraph>(graph ?? EMPTY);
    const [view, setView] = useState<View>({ x: 80, y: 80, zoom: 1 });
    const [selected, setSelected] = useState<{ kind: "node" | "link"; id: string } | null>(null);
    const [gesture, setGesture] = useState<Gesture | null>(null);
    const [palette, setPalette] = useState<Palette | null>(null);
    const [showVariables, setShowVariables] = useState(false);
    const [pins, setPins] = useState<Record<string, { x: number; y: number }>>({});
    const surface = useRef<HTMLDivElement>(null);
    const world = useRef<HTMLDivElement>(null);
    const draftRef = useRef(draft);
    draftRef.current = draft;

    // Outside changes (undo, another tab) replace the copy while idle.
    useEffect(() => {
        if (!gesture) setDraft(graph ?? EMPTY);
        // biome-ignore lint/correctness/useExhaustiveDependencies: only follow the prop, not the gesture ending
    }, [graph]);

    const commit = useCallback((next: ActionGraph) => {
        setDraft(next);
        onChange(next.nodes.length || next.variables.length ? next : undefined);
    }, [onChange]);

    const layerIds = useMemo(() => new Set(layers.map((layer) => layer.id)), [layers]);
    const broken = useMemo(() => missingTargets(draft, layerIds), [draft, layerIds]);

    // The layer's own flows, plus nodes added here that are not wired in yet.
    const [scoped, setScoped] = useState(true);
    const [added, setAdded] = useState<string[]>([]);
    const visible = useMemo(() => {
        if (!scope || !scoped) return null;
        const shown = layerScope(draft, scope.layer);
        for (const id of added) shown.add(id);
        return shown;
    }, [draft, scope, scoped, added]);
    const nodesShown = visible ? draft.nodes.filter((node) => visible.has(node.id)) : draft.nodes;

    /* -------------------------------------------------------------- geometry */

    const toWorld = useCallback((clientX: number, clientY: number) => {
        const rect = surface.current?.getBoundingClientRect();
        return {
            x: (clientX - (rect?.left ?? 0) - view.x) / view.zoom,
            y: (clientY - (rect?.top ?? 0) - view.y) / view.zoom,
        };
    }, [view]);

    // Pin centres are measured from the DOM, so rows of any height line up.
    useLayoutEffect(() => {
        const host = world.current;
        if (!host) return;
        const origin = host.getBoundingClientRect();
        const next: Record<string, { x: number; y: number }> = {};
        for (const element of host.querySelectorAll<HTMLElement>("[data-pin]")) {
            const rect = element.getBoundingClientRect();
            // `node:pin:dir:kind` — wires look pins up without the kind.
            next[element.dataset.pin!.split(":").slice(0, 3).join(":")] = {
                x: (rect.left + rect.width / 2 - origin.left) / view.zoom,
                y: (rect.top + rect.height / 2 - origin.top) / view.zoom,
            };
        }
        setPins((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    });

    // Wheel zooms around the pointer; the listener is non-passive so the page does not scroll.
    useEffect(() => {
        const element = surface.current;
        if (!element) return;
        const onWheel = (event: WheelEvent) => {
            if ((event.target as HTMLElement).closest("input,textarea,select,[data-scroll]")) return;
            event.preventDefault();
            const rect = element.getBoundingClientRect();
            setView((current) => {
                const zoom = Math.min(2, Math.max(0.25, current.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
                const px = event.clientX - rect.left;
                const py = event.clientY - rect.top;
                return { zoom, x: px - ((px - current.x) / current.zoom) * zoom, y: py - ((py - current.y) / current.zoom) * zoom };
            });
        };
        element.addEventListener("wheel", onWheel, { passive: false });
        return () => element.removeEventListener("wheel", onWheel);
    }, []);

    /* --------------------------------------------------------------- editing */

    const updateNode = (id: string, patch: Partial<GraphNode>) =>
        commit({ ...draft, nodes: draft.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)) });

    const setProp = (node: GraphNode, key: string, value: string | number | boolean | undefined) => {
        const props = { ...(node.props ?? {}) };
        if (value === undefined || value === "") delete props[key];
        else props[key] = value;
        updateNode(node.id, { props });
    };

    const removeNode = (id: string) =>
        commit({ ...draft, nodes: draft.nodes.filter((node) => node.id !== id), links: draft.links.filter((link) => link.from !== id && link.to !== id) });

    const removePinLinks = (pin: PinRef) =>
        commit({
            ...draft,
            links: draft.links.filter((link) =>
                pin.dir === "out" ? !(link.from === pin.node && link.fromPin === pin.pin) : !(link.to === pin.node && link.toPin === pin.pin)),
        });

    /** Joins two pins; replaces whatever the single-ended side was wired to. */
    const connect = (graphNow: ActionGraph, a: PinRef, b: PinRef): ActionGraph => {
        const out = a.dir === "out" ? a : b;
        const into = a.dir === "out" ? b : a;
        if (out.dir !== "out" || into.dir !== "in" || out.node === into.node || !compatible(out.kind, into.kind)) return graphNow;
        const links = graphNow.links.filter((link) =>
            out.kind === "exec"
                ? !(link.from === out.node && link.fromPin === out.pin)
                : !(link.to === into.node && link.toPin === into.pin));
        const link: GraphLink = { id: uid("l"), from: out.node, fromPin: out.pin, to: into.node, toPin: into.pin };
        return { ...graphNow, links: [...links, link] };
    };

    const addNode = (spec: NodeSpec, x: number, y: number, from?: PinRef) => {
        const node: GraphNode = { id: uid("n"), type: spec.type, x: Math.round(x), y: Math.round(y) };
        const aim = scope?.layer ?? layers[0]?.id;
        if (spec.props.some((prop) => prop.type === "layer") && aim) node.props = { target: aim };
        if (visible) setAdded((current) => [...current, node.id]);
        let next: ActionGraph = { ...draft, nodes: [...draft.nodes, node] };
        if (from) {
            const pins = from.dir === "out" ? spec.inputs : spec.outputs;
            const match = pins.find((pin) => (from.dir === "out" ? compatible(from.kind, pin.kind) : compatible(pin.kind, from.kind)));
            if (match) next = connect(next, from, { node: node.id, pin: match.id, dir: from.dir === "out" ? "in" : "out", kind: match.kind });
        }
        commit(next);
        setSelected({ kind: "node", id: node.id });
        setPalette(null);
    };

    // Beside the canvas (the split view) both answer the keyboard. Whichever
    // was clicked last owns Delete: clicking outside lets go of the graph's
    // selection, and while the graph is in use its keys stop here, before
    // the editor's shortcut would delete the selected canvas layer as well.
    const engaged = useRef(false);
    useEffect(() => {
        const onDown = (event: PointerEvent) => {
            engaged.current = Boolean(surface.current?.contains(event.target as Node));
            if (!engaged.current) setSelected(null);
        };
        document.addEventListener("pointerdown", onDown, true);
        return () => document.removeEventListener("pointerdown", onDown, true);
    }, []);

    // Delete removes the selection, unless a field has focus.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            // The target can be the window or the document, which have no `closest`.
            if (event.target instanceof Element && event.target.closest("input,textarea,select")) return;
            if (event.key === "Escape") { setPalette(null); setGesture(null); return; }
            if (event.key === "Delete" || event.key === "Backspace") {
                if (!engaged.current && !selected) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                if (!selected) return;
                if (selected.kind === "node") removeNode(selected.id);
                else commit({ ...draftRef.current, links: draftRef.current.links.filter((link) => link.id !== selected.id) });
                setSelected(null);
            }
        };
        // Capture, so it runs before the editor's own window shortcuts.
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    });

    /* ---------------------------------------------------------------- gestures */

    const onSurfaceDown = (event: React.PointerEvent) => {
        if (event.button === 2) return;
        if ((event.target as HTMLElement).closest("[data-node],[data-ui]")) return;
        setSelected(null);
        setPalette(null);
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        setGesture({ type: "pan", startX: event.clientX, startY: event.clientY, view });
    };

    const onPointerMove = (event: React.PointerEvent) => {
        if (!gesture) return;
        if (gesture.type === "pan") {
            setView({ ...gesture.view, x: gesture.view.x + event.clientX - gesture.startX, y: gesture.view.y + event.clientY - gesture.startY });
        } else if (gesture.type === "move") {
            const dx = (event.clientX - gesture.startX) / view.zoom;
            const dy = (event.clientY - gesture.startY) / view.zoom;
            setGesture({ ...gesture, moved: gesture.moved || Math.abs(dx) + Math.abs(dy) > 2 });
            setDraft((current) => ({
                ...current,
                nodes: current.nodes.map((node) => (node.id === gesture.node ? { ...node, x: Math.round(gesture.nodeX + dx), y: Math.round(gesture.nodeY + dy) } : node)),
            }));
        } else {
            const point = toWorld(event.clientX, event.clientY);
            setGesture({ ...gesture, x: point.x, y: point.y });
        }
    };

    const onPointerUp = (event: React.PointerEvent) => {
        if (!gesture) return;
        if (gesture.type === "move" && gesture.moved) commit(draftRef.current);
        if (gesture.type === "wire") {
            // The pointer is captured by the surface, so ask what is really under it.
            const under = document.elementFromPoint(event.clientX, event.clientY);
            const hit = under?.closest<HTMLElement>("[data-pin]");
            if (hit) {
                const [node, pin, dir, kind] = hit.dataset.pin!.split(":") as [string, string, "in" | "out", PinKind];
                commit(connect(draftRef.current, gesture.from, { node, pin, dir, kind }));
            } else if (!under?.closest("[data-node],[data-ui]")) {
                // Dropped on empty space: offer the nodes that fit, Blueprint-style.
                const rect = surface.current!.getBoundingClientRect();
                const point = toWorld(event.clientX, event.clientY);
                setPalette({ screenX: event.clientX - rect.left, screenY: event.clientY - rect.top, worldX: point.x, worldY: point.y, from: gesture.from });
            }
        }
        setGesture(null);
    };

    const startWire = (event: React.PointerEvent, from: PinRef) => {
        event.stopPropagation();
        if (event.altKey || event.button === 2) {
            removePinLinks(from);
            return;
        }
        surface.current?.setPointerCapture(event.pointerId);
        const point = toWorld(event.clientX, event.clientY);
        setGesture({ type: "wire", from, x: point.x, y: point.y });
    };

    const openPalette = (event: React.MouseEvent) => {
        event.preventDefault();
        if ((event.target as HTMLElement).closest("[data-node],[data-ui]")) return;
        const rect = surface.current!.getBoundingClientRect();
        const point = toWorld(event.clientX, event.clientY);
        setPalette({ screenX: event.clientX - rect.left, screenY: event.clientY - rect.top, worldX: point.x, worldY: point.y });
    };

    const fit = () => {
        const rect = surface.current?.getBoundingClientRect();
        if (!rect || nodesShown.length === 0) {
            setView({ x: 80, y: 80, zoom: 1 });
            return;
        }
        const minX = Math.min(...nodesShown.map((node) => node.x));
        const minY = Math.min(...nodesShown.map((node) => node.y));
        const maxX = Math.max(...nodesShown.map((node) => node.x + NODE_WIDTH));
        const maxY = Math.max(...nodesShown.map((node) => node.y + 200));
        const zoom = Math.min(1.2, Math.max(0.3, Math.min((rect.width - 120) / (maxX - minX), (rect.height - 120) / (maxY - minY))));
        setView({ zoom, x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom });
    };

    // Opening the page frames the whole graph once; after that the view is the
    // author's. The workspace mounts hidden and gets its size later, so this
    // waits for the surface to be measured rather than trying once.
    const framed = useRef(false);
    const fitRef = useRef(fit);
    fitRef.current = fit;
    useEffect(() => {
        const element = surface.current;
        if (!element) return;
        const frame = () => {
            if (framed.current || draftRef.current.nodes.length === 0 || element.clientWidth === 0) return;
            framed.current = true;
            fitRef.current();
        };
        frame();
        const observer = new ResizeObserver(frame);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!framed.current && draft.nodes.length > 0 && surface.current?.clientWidth) {
            framed.current = true;
            fit();
        }
    });
    // Another layer, or All / Only this layer: frame what is shown now.
    // biome-ignore lint/correctness/useExhaustiveDependencies: refits when the scope changes, not on every edit
    useEffect(() => {
        setAdded([]);
        if (surface.current?.clientWidth) requestAnimationFrame(() => fitRef.current());
    }, [scope?.layer, scoped]);

    /* ----------------------------------------------------------------- wires */

    const wirePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const dx = Math.max(60, Math.abs(b.x - a.x) * 0.5);
        return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
    };

    const kindOf = (nodeId: string, pinId: string, dir: "in" | "out"): PinKind => {
        const node = draft.nodes.find((item) => item.id === nodeId);
        const spec = node ? NODE_SPEC.get(node.type) : undefined;
        return (dir === "out" ? spec?.outputs : spec?.inputs)?.find((pin) => pin.id === pinId)?.kind ?? "any";
    };

    const wired = useMemo(() => {
        const set = new Set<string>();
        for (const link of draft.links) {
            set.add(`${link.from}:${link.fromPin}:out`);
            set.add(`${link.to}:${link.toPin}:in`);
        }
        return set;
    }, [draft.links]);

    const variableNames = draft.variables.map((variable) => variable.name);

    /* ---------------------------------------------------------------- render */

    const grid = 16 * view.zoom;
    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden rounded-2xl bg-[#0f1012] text-[12px] text-zinc-200">
            <div
                ref={surface}
                role="application"
                aria-label="Action graph"
                className="relative min-w-0 flex-1 select-none overflow-hidden"
                style={{
                    cursor: gesture?.type === "pan" ? "grabbing" : "default",
                    backgroundColor: "#16171a",
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)," +
                        "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
                    backgroundSize: `${grid * 8}px ${grid * 8}px,${grid * 8}px ${grid * 8}px,${grid}px ${grid}px,${grid}px ${grid}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`,
                }}
                onPointerDown={onSurfaceDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={openPalette}
            >
                {/* Toolbar */}
                <div data-ui="" className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1c1d21]/95 p-1.5 shadow-lg backdrop-blur">
                    <span className="flex max-w-[220px] items-center gap-1.5 truncate px-2 text-[12px] font-semibold text-zinc-100">
                        <IconBolt size={15} className="shrink-0 text-amber-400" /> <span className="truncate">{scope && scoped ? scope.name : "Page actions"}</span>
                    </span>
                    {scope && (
                        <div className="flex rounded-lg bg-black/30 p-0.5">
                            {([["Only this layer", true], ["All", false]] as const).map(([label, value]) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setScoped(value)}
                                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${scoped === value ? "bg-white/15 text-white" : "text-zinc-400 hover:text-zinc-100"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                    <span className="h-5 w-px bg-white/10" />
                    <GraphButton
                        onClick={() => {
                            const rect = surface.current!.getBoundingClientRect();
                            const point = toWorld(rect.left + rect.width / 2, rect.top + rect.height / 3);
                            setPalette({ screenX: rect.width / 2 - 140, screenY: rect.height / 3, worldX: point.x, worldY: point.y });
                        }}
                    >
                        <IconPlus size={14} /> Add node
                    </GraphButton>
                    <GraphButton active={showVariables} onClick={() => setShowVariables((value) => !value)}>
                        <IconVariable size={14} /> Variables{draft.variables.length ? ` · ${draft.variables.length}` : ""}
                    </GraphButton>
                    <GraphButton onClick={fit} title="Fit graph">
                        <IconFocusCentered size={14} />
                    </GraphButton>
                    <span className="px-1.5 font-mono text-[11px] text-zinc-500">{Math.round(view.zoom * 100)}%</span>
                </div>

                {visible && nodesShown.length === 0 && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
                        <div>
                            <p className="text-[13px] font-semibold text-zinc-100">No actions on {scope?.name} yet</p>
                            <p className="mt-1 text-[12px] text-zinc-400">Right-click or use Add node — events and actions you add here start on this layer.</p>
                        </div>
                    </div>
                )}

                {/* World */}
                <div
                    ref={world}
                    className="absolute left-0 top-0"
                    style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: "0 0" }}
                >
                    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
                        {draft.links.map((link) => {
                            if (visible && (!visible.has(link.from) || !visible.has(link.to))) return null;
                            const a = pins[`${link.from}:${link.fromPin}:out`];
                            const b = pins[`${link.to}:${link.toPin}:in`];
                            if (!a || !b) return null;
                            const kind = kindOf(link.from, link.fromPin, "out");
                            const active = selected?.kind === "link" && selected.id === link.id;
                            return (
                                <g key={link.id}>
                                    <path
                                        d={wirePath(a, b)}
                                        stroke="transparent"
                                        strokeWidth={14}
                                        fill="none"
                                        className="pointer-events-auto cursor-pointer"
                                        onPointerDown={(event) => { event.stopPropagation(); setSelected({ kind: "link", id: link.id }); }}
                                        onDoubleClick={() => commit({ ...draft, links: draft.links.filter((item) => item.id !== link.id) })}
                                    />
                                    <path
                                        d={wirePath(a, b)}
                                        stroke={active ? "#fbbf24" : kind === "exec" ? "#e4e4e7" : PIN_COLOR[kind]}
                                        strokeWidth={kind === "exec" ? 2.6 : 2}
                                        fill="none"
                                        opacity={0.95}
                                    />
                                </g>
                            );
                        })}
                        {gesture?.type === "wire" && pins[`${gesture.from.node}:${gesture.from.pin}:${gesture.from.dir}`] && (() => {
                            const start = pins[`${gesture.from.node}:${gesture.from.pin}:${gesture.from.dir}`]!;
                            const end = { x: gesture.x, y: gesture.y };
                            return (
                                <path
                                    d={gesture.from.dir === "out" ? wirePath(start, end) : wirePath(end, start)}
                                    stroke={PIN_COLOR[gesture.from.kind]}
                                    strokeWidth={2.4}
                                    strokeDasharray="6 5"
                                    fill="none"
                                />
                            );
                        })()}
                    </svg>

                    {nodesShown.map((node) => {
                        const spec = NODE_SPEC.get(node.type);
                        if (!spec) return null;
                        const category = CATEGORY[spec.category];
                        const isSelected = selected?.kind === "node" && selected.id === node.id;
                        const error = broken.has(node.id);
                        const rows = Math.max(spec.inputs.length, spec.outputs.length);
                        return (
                            <div
                                key={node.id}
                                data-node=""
                                className="absolute rounded-[10px] border bg-[#1d1e22]/95 shadow-[0_10px_30px_rgba(0,0,0,.45)]"
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    width: NODE_WIDTH,
                                    borderColor: isSelected ? "#fbbf24" : "rgba(255,255,255,.09)",
                                    boxShadow: isSelected ? "0 0 0 1px #fbbf24, 0 10px 30px rgba(0,0,0,.45)" : undefined,
                                }}
                                onPointerDown={(event) => {
                                    if ((event.target as HTMLElement).closest("input,select,textarea,button,[data-pin]")) return;
                                    event.stopPropagation();
                                    setSelected({ kind: "node", id: node.id });
                                    setPalette(null);
                                    surface.current?.setPointerCapture(event.pointerId);
                                    setGesture({ type: "move", node: node.id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y, moved: false });
                                }}
                            >
                                <div className="cursor-grab rounded-t-[9px] px-3 py-2" style={{ background: category.header }}>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rotate-45 border border-white/70" style={{ background: category.accent }} />
                                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{spec.title}</span>
                                        {isSelected && (
                                            <button
                                                type="button"
                                                aria-label="Delete node"
                                                className="rounded p-0.5 text-white/60 hover:bg-white/10 hover:text-white"
                                                onClick={() => removeNode(node.id)}
                                            >
                                                <IconTrash size={13} />
                                            </button>
                                        )}
                                    </div>
                                    {spec.subtitle && <p className="mt-0.5 truncate pl-4 text-[11px] italic text-white/55">{spec.subtitle}</p>}
                                </div>

                                {rows > 0 && (
                                    <div className="grid grid-cols-2 gap-x-2 py-2">
                                        <div className="flex flex-col gap-1.5">
                                            {spec.inputs.map((pin) => {
                                                const key = `${node.id}:${pin.id}:in`;
                                                const ref: PinRef = { node: node.id, pin: pin.id, dir: "in", kind: pin.kind };
                                                const literal = node.props?.[pin.id];
                                                return (
                                                    <div key={pin.id} className="flex min-h-6 items-center gap-1.5 pl-1">
                                                        <Pin pinKey={key} kind={pin.kind} filled={wired.has(key)} onPointerDown={(event) => startWire(event, ref)} />
                                                        {pin.label && <span className="text-[11px] text-zinc-300">{pin.label}</span>}
                                                        {pin.kind !== "exec" && !wired.has(key) && (
                                                            <input
                                                                aria-label={pin.label || "Value"}
                                                                className="min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[11px] text-zinc-100 outline-none focus:border-amber-400/70"
                                                                value={literal === undefined ? "" : String(literal)}
                                                                placeholder={pin.kind === "bool" ? "false" : pin.kind === "number" ? "0" : "…"}
                                                                onChange={(event) => setProp(node, pin.id, event.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {spec.outputs.map((pin) => {
                                                const key = `${node.id}:${pin.id}:out`;
                                                return (
                                                    <div key={pin.id} className="flex min-h-6 items-center gap-1.5 pr-1">
                                                        {pin.label && <span className="text-[11px] text-zinc-300">{pin.label}</span>}
                                                        <Pin
                                                            pinKey={key}
                                                            kind={pin.kind}
                                                            filled={wired.has(key)}
                                                            onPointerDown={(event) => startWire(event, { node: node.id, pin: pin.id, dir: "out", kind: pin.kind })}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {spec.props.length > 0 && (
                                    <div className="flex flex-col gap-1.5 border-t border-white/[.06] px-2.5 py-2">
                                        {spec.props.map((prop) => {
                                            const current = node.props?.[prop.id];
                                            const field = "w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-100 outline-none focus:border-amber-400/70";
                                            return (
                                                <label key={prop.id} className="flex items-center gap-2">
                                                    <span className="w-[62px] shrink-0 text-[11px] text-zinc-400">{prop.label}</span>
                                                    {prop.type === "layer" ? (
                                                        <select className={field} value={typeof current === "string" ? current : ""} onChange={(event) => setProp(node, prop.id, event.target.value || undefined)}>
                                                            <option value="">Choose a layer…</option>
                                                            {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
                                                            {typeof current === "string" && current && !layerIds.has(current) && <option value={current}>Missing layer</option>}
                                                        </select>
                                                    ) : prop.type === "select" ? (
                                                        <select className={field} value={typeof current === "string" ? current : prop.options[0]?.value} onChange={(event) => setProp(node, prop.id, event.target.value)}>
                                                            {prop.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                                        </select>
                                                    ) : prop.type === "variable" ? (
                                                        <select
                                                            className={field}
                                                            value={typeof current === "string" ? current : ""}
                                                            onChange={(event) => {
                                                                if (event.target.value !== "__new") return setProp(node, prop.id, event.target.value || undefined);
                                                                const name = nextVariableName(variableNames);
                                                                commit({
                                                                    ...draft,
                                                                    variables: [...draft.variables, { name, value: "" }],
                                                                    nodes: draft.nodes.map((item) => (item.id === node.id ? { ...item, props: { ...(item.props ?? {}), [prop.id]: name } } : item)),
                                                                });
                                                                setShowVariables(true);
                                                            }}
                                                        >
                                                            <option value="">Choose…</option>
                                                            {variableNames.map((name) => <option key={name} value={name}>{name}</option>)}
                                                            <option value="__new">+ New variable</option>
                                                        </select>
                                                    ) : prop.type === "animation" ? (
                                                        <select
                                                            className={field}
                                                            value={typeof current === "string" ? current : prop.builtIn ? "none" : ""}
                                                            onChange={(event) => setProp(node, prop.id, event.target.value || undefined)}
                                                        >
                                                            {!prop.builtIn && <option value="">Choose an animation…</option>}
                                                            {prop.builtIn && BUILT_IN_ANIMATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                                            {animations.length > 0 && (
                                                                <optgroup label="Custom">
                                                                    {animations.map((item) => <option key={item.id} value={`custom:${item.id}`}>{item.name}</option>)}
                                                                </optgroup>
                                                            )}
                                                            {typeof current === "string" && current.startsWith("custom:") && !animations.some((item) => `custom:${item.id}` === current) && (
                                                                <option value={current}>Missing animation</option>
                                                            )}
                                                        </select>
                                                    ) : prop.type === "bool" ? (
                                                        <input type="checkbox" checked={current === true} onChange={(event) => setProp(node, prop.id, event.target.checked || undefined)} />
                                                    ) : prop.type === "number" ? (
                                                        <div className="flex flex-1 items-center gap-1">
                                                            <input
                                                                type="number"
                                                                className={field}
                                                                value={typeof current === "number" ? current : ""}
                                                                min={prop.min}
                                                                max={prop.max}
                                                                onChange={(event) => setProp(node, prop.id, event.target.value === "" ? undefined : Number(event.target.value))}
                                                            />
                                                            {prop.suffix && <span className="text-[10px] text-zinc-500">{prop.suffix}</span>}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            className={field}
                                                            value={typeof current === "string" ? current : ""}
                                                            placeholder={prop.placeholder}
                                                            onChange={(event) => setProp(node, prop.id, event.target.value)}
                                                        />
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded-b-[9px] bg-[#b91c1c] py-0.5 text-center text-[11px] font-bold tracking-wide text-white">
                                        ERROR! Choose a layer
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {draft.nodes.length === 0 && !palette && (
                    <div data-ui="" className="absolute inset-0 grid place-items-center">
                        <div className="w-[360px] rounded-2xl border border-white/10 bg-[#1c1d21]/95 p-5 text-center shadow-2xl">
                            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-amber-400/10 text-amber-400"><IconBolt size={22} /></span>
                            <p className="mt-3 text-[14px] font-semibold text-zinc-100">Start with an event</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
                                An event starts a flow; wire it to actions with the white pins. Right-click anywhere to add a node.
                            </p>
                            <div className="mt-4 flex justify-center gap-2">
                                {["event.click", "event.load", "event.inView"].map((type) => {
                                    const spec = NODE_SPEC.get(type)!;
                                    return (
                                        <GraphButton key={type} onClick={() => addNode(spec, 40, 60)}>
                                            {spec.title}
                                        </GraphButton>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {palette && (
                    <NodePalette
                        palette={palette}
                        onClose={() => setPalette(null)}
                        onPick={(spec) => addNode(spec, palette.worldX, palette.worldY, palette.from)}
                    />
                )}

                <p data-ui="" className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/40 px-2.5 py-1 text-[11px] text-zinc-400">
                    Right-click to add · Drag from a pin to connect · Alt+click a pin to disconnect · Delete removes the selection
                </p>
            </div>

            {showVariables && (
                <VariablesPanel
                    variables={draft.variables}
                    onChange={(variables) => commit({ ...draft, variables })}
                    onRename={(from, to) => commit({
                        ...draft,
                        variables: draft.variables.map((variable) => (variable.name === from ? { ...variable, name: to } : variable)),
                        // Nodes follow the variable they read or write.
                        nodes: draft.nodes.map((node) => (node.props?.name === from ? { ...node, props: { ...node.props, name: to } } : node)),
                    })}
                    onClose={() => setShowVariables(false)}
                />
            )}
        </div>
    );
}

function nextVariableName(names: string[]) {
    let index = names.length + 1;
    while (names.includes(`variable${index}`)) index++;
    return `variable${index}`;
}

function GraphButton({ active, className = "", ...props }: React.ComponentProps<"button"> & { active?: boolean }) {
    return (
        <button
            type="button"
            className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors ${active ? "bg-amber-400/15 text-amber-300" : "text-zinc-300 hover:bg-white/[.07] hover:text-white"} ${className}`}
            {...props}
        />
    );
}

/** Execution pins are arrows, data pins are circles, as in Blueprints. Filled once wired. */
function Pin({
    pinKey,
    kind,
    filled,
    onPointerDown,
}: {
    pinKey: string;
    kind: PinKind;
    filled: boolean;
    onPointerDown: (event: React.PointerEvent) => void;
}) {
    const color = PIN_COLOR[kind];
    return (
        <span
            data-pin={`${pinKey}:${kind}`}
            role="button"
            tabIndex={-1}
            aria-label={`${kind} pin`}
            className="grid size-5 shrink-0 cursor-crosshair place-items-center"
            onPointerDown={onPointerDown}
            onContextMenu={(event) => event.preventDefault()}
        >
            {kind === "exec" ? (
                <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M1.5 1.5h5l4 4.5-4 4.5h-5z" fill={filled ? color : "none"} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
            ) : (
                <span className="size-2.5 rounded-full border-2" style={{ borderColor: color, background: filled ? color : "transparent" }} />
            )}
        </span>
    );
}

function NodePalette({
    palette,
    onPick,
    onClose,
}: {
    palette: Palette;
    onPick: (spec: NodeSpec) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => input.current?.focus(), []);
    const from = palette.from;
    const items = NODE_SPECS.filter((spec) => {
        if (from) {
            const pins = from.dir === "out" ? spec.inputs : spec.outputs;
            if (!pins.some((pin) => (from.dir === "out" ? compatible(from.kind, pin.kind) : compatible(pin.kind, from.kind)))) return false;
        }
        const needle = query.trim().toLowerCase();
        return !needle || `${spec.title} ${spec.subtitle ?? ""} ${CATEGORY[spec.category].label}`.toLowerCase().includes(needle);
    });
    const groups = (Object.keys(CATEGORY) as NodeCategory[]).map((category) => ({ category, items: items.filter((spec) => spec.category === category) })).filter((group) => group.items.length);

    return (
        <div
            data-ui=""
            className="absolute z-30 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#1c1d21] shadow-2xl"
            style={{ left: Math.max(8, palette.screenX), top: Math.max(8, palette.screenY) }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <div className="flex items-center gap-2 border-b border-white/10 px-2.5 py-2">
                <IconSearch size={14} className="text-zinc-500" />
                <input
                    ref={input}
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-100 outline-none placeholder:text-zinc-500"
                    placeholder={from ? "Nodes that fit this pin…" : "Search nodes…"}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && items[0]) onPick(items[0]);
                        if (event.key === "Escape") onClose();
                    }}
                />
                <button type="button" aria-label="Close" className="text-zinc-500 hover:text-zinc-200" onClick={onClose}><IconX size={14} /></button>
            </div>
            <div data-scroll="" className="max-h-[340px] overflow-y-auto p-1.5">
                {groups.map((group) => (
                    <div key={group.category} className="mb-1">
                        <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: CATEGORY[group.category].accent }}>
                            {CATEGORY[group.category].label}
                        </p>
                        {group.items.map((spec) => (
                            <button
                                key={spec.type}
                                type="button"
                                className="flex w-full flex-col rounded-lg px-2 py-1.5 text-left hover:bg-white/[.06]"
                                onClick={() => onPick(spec)}
                            >
                                <span className="text-[12px] text-zinc-100">{spec.title}</span>
                                {spec.subtitle && <span className="text-[11px] text-zinc-500">{spec.subtitle}</span>}
                            </button>
                        ))}
                    </div>
                ))}
                {groups.length === 0 && <p className="px-2 py-4 text-center text-[12px] text-zinc-500">No node fits.</p>}
            </div>
        </div>
    );
}

function VariablesPanel({
    variables,
    onChange,
    onRename,
    onClose,
}: {
    variables: GraphVariable[];
    onChange: (variables: GraphVariable[]) => void;
    onRename: (from: string, to: string) => void;
    onClose: () => void;
}) {
    const set = (index: number, patch: Partial<GraphVariable>) =>
        onChange(variables.map((variable, at) => (at === index ? { ...variable, ...patch } : variable)));
    return (
        <aside className="flex w-[260px] shrink-0 flex-col border-l border-white/10 bg-[#141518]">
            <div className="flex items-center justify-between px-3.5 py-3">
                <p className="text-[13px] font-semibold text-zinc-100">Variables</p>
                <button type="button" aria-label="Close variables" className="text-zinc-500 hover:text-zinc-200" onClick={onClose}><IconX size={15} /></button>
            </div>
            <p className="px-3.5 pb-3 text-[11px] leading-relaxed text-zinc-500">
                Values the graph remembers while the page is open. "Keep" stores one in the visitor's browser between visits.
            </p>
            <div data-scroll="" className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                {variables.map((variable, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the name is what is being edited
                    <div key={index} className="space-y-1.5 rounded-lg border border-white/10 bg-black/20 p-2">
                        <div className="flex items-center gap-1.5">
                            <input
                                aria-label="Variable name"
                                className="min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-1.5 py-1 font-mono text-[11px] text-zinc-100 outline-none focus:border-amber-400/70"
                                value={variable.name}
                                onChange={(event) => {
                                    const name = event.target.value.replace(/[^A-Za-z0-9_]/g, "").replace(/^[0-9]+/, "").slice(0, 40);
                                    if (name && !variables.some((item) => item.name === name)) onRename(variable.name, name);
                                }}
                            />
                            <button type="button" aria-label="Remove variable" className="text-zinc-500 hover:text-red-400" onClick={() => onChange(variables.filter((_, at) => at !== index))}>
                                <IconTrash size={13} />
                            </button>
                        </div>
                        <input
                            aria-label="Initial value"
                            className="w-full rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] text-zinc-100 outline-none focus:border-amber-400/70"
                            placeholder="Initial value"
                            value={variable.value}
                            onChange={(event) => set(index, { value: event.target.value })}
                        />
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <input type="checkbox" checked={variable.persist === true} onChange={(event) => set(index, { persist: event.target.checked || undefined })} />
                            Keep between visits
                        </label>
                    </div>
                ))}
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2 text-[12px] text-zinc-300 hover:border-amber-400/50 hover:text-amber-300"
                    onClick={() => onChange([...variables, { name: nextVariableName(variables.map((item) => item.name)), value: "" }])}
                >
                    <IconPlus size={13} /> Add variable
                </button>
            </div>
        </aside>
    );
}
