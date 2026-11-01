"use client";

import {
    IconArrowsHorizontal,
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconEye,
    IconFilter,
    IconMagnet,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerSkipBack,
    IconPlayerSkipForward,
    IconPlayerTrackNext,
    IconPlayerTrackPrev,
    IconRepeat,
    IconSparkles,
    IconWaveSine,
    IconX,
} from "@tabler/icons-react";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { EFFECT_PRESETS, type EffectCategory, type EffectPreset, presetMotion } from "@/lib/editor/effect-presets";
import {
    bezierOf,
    type Ease,
    easeAt,
    KEY_EASES,
    KEY_GROUPS,
    KEY_PROP,
    KEY_PROPS,
    type KeyEase,
    type Keyframe,
    type KeyGroup,
    type KeyProp,
    type KeyValue,
    type LayerMotion,
    motionDuration,
    motionTracks,
    type PropSpec,
    toHex,
    valueAt,
    wiggledAt,
} from "@/lib/editor/keyframes";
import { entranceTiming, springCurve } from "@/lib/editor/motion";
import { childrenOf, displayName } from "@/lib/editor/tree";
import { type CanvasElement, ENTRANCES, type ElementStyle, type Entrance, isTextual, SCROLL_EFFECTS } from "@/lib/editor/types";
import { entranceTimeline } from "./motion-preview";

/**
 * Motion's timeline, After Effects style.
 *
 * Every layer has its properties in groups — Transform, 3D & skew,
 * Appearance, Shadow, Filters, Mask and Text. Click a property's stopwatch
 * and it is animated: a keyframe lands at the playhead with the value it has
 * now. From then on, move the playhead and change the value (drag the number
 * sideways, type it, or pick a colour) and a keyframe is set there.
 * Keyframes are dragged in time — several at once with Shift — get a curve
 * from a right-click or a hand-drawn bezier or spring from a double-click,
 * and a double-click on a lane adds one. A property can wiggle; a text layer
 * can play its keyframes letter by letter in any order; the anchor point
 * sets what it scales and turns around. The Effects library writes whole
 * moves as ordinary keyframes at the playhead.
 *
 * The playhead always shows the canvas as it is at that moment: the same
 * keyframes the published stylesheet plays, built with the Web Animations
 * API (see `entranceTimeline`).
 */

type StyleOf = (element: CanvasElement) => ElementStyle;
type Patch = Partial<ElementStyle>;

const HEADER_W = 340;
const LAYER_ROW = 34;
const PROP_ROW = 26;
const FRAME = 1000 / 60;
const HEIGHT_KEY = "pg-motion-timeline-height";

/** The custom start a preset amounts to, to turn an entrance into keyframes. */
const PRESET_START: Partial<Record<Entrance, Partial<Record<KeyProp, number>>>> = {
    fade: { opacity: 0 },
    up: { opacity: 0, y: 28 },
    down: { opacity: 0, y: -28 },
    left: { opacity: 0, x: -32 },
    right: { opacity: 0, x: 32 },
    zoom: { opacity: 0, scale: 94 },
    blur: { opacity: 0, y: 12, blur: 14 },
    pop: { opacity: 0, scale: 60 },
    shrink: { opacity: 0, scale: 112 },
};

/** The keyframes an entrance amounts to, or undefined when it can't be expressed (reveal, flip, split). */
export function entranceToMotion(style: ElementStyle): LayerMotion | undefined {
    if (style.entrance === "none" || style.entranceSplit !== "none") return undefined;
    const start: Partial<Record<KeyProp, number>> | undefined = style.entrance === "custom"
        ? { opacity: style.entranceOpacity, x: style.entranceX, y: style.entranceY, scale: style.entranceScale, rotate: style.entranceRotate, blur: style.entranceBlur }
        : PRESET_START[style.entrance];
    if (!start) return undefined;
    const from = style.entranceDelay;
    const to = from + entranceTiming(style).duration;
    const [, y1 = 0, , y2 = 1] = style.entranceBezier.split(",").map((part) => Number(part.trim()));
    const ease: KeyEase = style.entranceCurve === "spring" || y1 > 1 || y2 > 1 ? "back" : style.entranceBezier.replace(/\s/g, "") === "0.44,0,0.56,1" ? "inOut" : "out";
    const tracks: LayerMotion["tracks"] = {};
    for (const spec of KEY_PROPS) {
        const value = start[spec.prop];
        if (value === undefined || spec.rest === null || value === spec.rest) continue;
        tracks[spec.prop] = [{ t: from, v: value, ease }, { t: to, v: spec.rest }];
    }
    return Object.keys(tracks).length ? { tracks } : undefined;
}

/** What the layer has now for an absolute property (colour, radius, tracking), read off the canvas. */
function ownValue(id: string, spec: PropSpec): KeyValue {
    if (spec.rest !== null) return spec.rest;
    const node = document.querySelector<HTMLElement>(`[data-canvas-element="${id}"]`);
    if (!node) return spec.kind === "color" ? "#000000" : 0;
    const style = getComputedStyle(node);
    if (spec.prop === "radius") return Math.round(Number.parseFloat(style.borderTopLeftRadius) || 0);
    if (spec.prop === "letterSpacing") return Math.round((Number.parseFloat(style.letterSpacing) || 0) * 10) / 10;
    if (spec.prop === "background") return style.backgroundColor === "rgba(0, 0, 0, 0)" ? "rgba(255,255,255,0)" : style.backgroundColor.replace(/\s/g, "");
    if (spec.prop === "color") return style.color.replace(/\s/g, "");
    return 0;
}

const WIGGLE_DEFAULT: Partial<Record<KeyProp, number>> = { x: 8, y: 8, rotate: 5, scale: 4, opacity: 20, rotateX: 8, rotateY: 8, blur: 4, hue: 30 };

function timecode(ms: number) {
    const total = Math.max(0, ms);
    const seconds = Math.floor(total / 1000);
    const hundredths = Math.floor((total % 1000) / 10);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

const keyId = (layer: string, prop: KeyProp, t: number) => `${layer}|${prop}|${t}`;
const parseKeyId = (id: string) => {
    const [layer, prop, t] = id.split("|");
    return { layer: layer!, prop: prop as KeyProp, t: Number(t) };
};

type Row = { element: CanvasElement; style: ElementStyle; depth: number; motion?: LayerMotion; entrance: boolean };
type KeyDrag = { delta: number; x: number; y: number };
type ClipDrag = { id: string; mode: "move" | "start" | "end"; start: number; length: number; x: number; y: number };
type Menu = { x: number; y: number; keys: string[] };
type CurveEditing = { x: number; y: number; keys: string[]; ease: Ease | undefined };

export function MotionTimeline({
    elements,
    styleOf,
    selectedId,
    onSelect,
    onStyle,
    onMotion,
    onCommitStart,
    onCommitEnd,
}: {
    elements: CanvasElement[];
    styleOf: StyleOf;
    selectedId?: string;
    onSelect: (id: string) => void;
    onStyle: (id: string, patch: Patch) => void;
    onMotion: (id: string, motion: LayerMotion | undefined) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
}) {
    /* ------------------------------------------------------------- rows */

    const [showAll, setShowAll] = useState(false);
    const [onlyAnimated, setOnlyAnimated] = useState(false);
    const byId = useMemo(() => new Map(elements.map((element) => [element.id, element])), [elements]);
    const depthOf = (element: CanvasElement) => {
        let depth = 0;
        for (let parent = element.parentId ? byId.get(element.parentId) : undefined; parent; parent = parent.parentId ? byId.get(parent.parentId) : undefined) depth++;
        return depth;
    };
    const rows: Row[] = [];
    const scrolling: Row[] = [];
    for (const element of elements) {
        const style = styleOf(element);
        const entrance = !element.motion && style.entrance !== "none" && style.scrollEffect === "none";
        const row = { element, style, depth: depthOf(element), motion: element.motion, entrance };
        if (!element.motion && style.scrollEffect !== "none") scrolling.push(row);
        else if (element.motion || entrance || showAll || element.id === selectedId) rows.push(row);
    }
    const minDepth = Math.min(0, ...rows.map((row) => row.depth));
    const partsOf = (id: string) => Math.max(1, document.querySelector(`[data-canvas-element="${id}"]`)?.querySelectorAll(".pg-part").length ?? 1);
    const entranceEnd = (row: Row) => {
        const parts = row.style.entranceSplit === "none" ? 1 : row.style.entranceSplit === "children" ? Math.max(1, childrenOf(elements, row.element.id).length) : partsOf(row.element.id);
        return { length: entranceTiming(row.style).duration, tail: (parts - 1) * row.style.entranceStagger, parts };
    };
    const motionEnd = (row: Row) => motionDuration(row.motion) + (row.motion?.split ? (partsOf(row.element.id) - 1) * row.motion.split.stagger : 0);
    const total = rows.reduce((end, row) => {
        if (row.motion) return Math.max(end, motionEnd(row));
        if (!row.entrance) return end;
        const { length, tail } = entranceEnd(row);
        return Math.max(end, row.style.entranceDelay + length + tail);
    }, 0);

    /* ------------------------------------------------------------ state */

    const [height, setHeight] = useState(340);
    useEffect(() => {
        try {
            const saved = Number(localStorage.getItem(HEIGHT_KEY));
            if (saved >= 180 && saved <= 1000) setHeight(saved);
        } catch {
            // Private mode: the default height it is.
        }
    }, []);
    const [zoom, setZoom] = useState(0.25);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [loop, setLoop] = useState(false);
    const [snapOn, setSnapOn] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
    const [time, setTimeState] = useState(0);
    const [hover, setHover] = useState<number | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [keyDrag, setKeyDrag] = useState<KeyDrag | null>(null);
    const [clipDrag, setClipDrag] = useState<ClipDrag | null>(null);
    const [menu, setMenu] = useState<Menu | null>(null);
    const [curveEditing, setCurveEditing] = useState<CurveEditing | null>(null);
    const [effectsOpen, setEffectsOpen] = useState(false);
    const effectsAnchor = useRef<HTMLDivElement>(null);
    const timeRef = useRef(0);
    const preview = useRef<ReturnType<typeof entranceTimeline> | null>(null);
    const lanes = useRef<HTMLDivElement>(null);
    const scroller = useRef<HTMLDivElement>(null);

    // The playhead starts at the end, where everything has arrived.
    const started = useRef(false);
    useEffect(() => {
        if (started.current || total === 0) return;
        started.current = true;
        timeRef.current = total;
        setTimeState(total);
    }, [total]);

    const setTime = useCallback((ms: number) => {
        const next = Math.max(0, Math.round(ms));
        timeRef.current = next;
        setTimeState(next);
        preview.current?.seek(next);
    }, []);

    const signature = rows
        .map((row) => (row.motion ? `${row.element.id}:${JSON.stringify(row.motion)}` : `${row.element.id}:${row.style.entrance}:${row.style.entranceDelay}:${row.style.entranceDuration}:${row.style.entranceCurve}:${row.style.entranceBezier}:${row.style.entranceSplit}:${row.style.entranceStagger}`))
        .join("|");
    useEffect(() => {
        // Built a frame later, so a split text's new pieces are on the canvas first.
        let built: ReturnType<typeof entranceTimeline> | null = null;
        const frame = requestAnimationFrame(() => {
            built = entranceTimeline(elements, styleOf);
            preview.current = built;
            built.seek(timeRef.current);
        });
        return () => {
            cancelAnimationFrame(frame);
            built?.cancel();
            if (preview.current === built) preview.current = null;
        };
        // biome-ignore lint/correctness/useExhaustiveDependencies: rebuilt when the motion itself changes
    }, [signature]);

    useEffect(() => {
        if (!playing) return;
        let frame = 0;
        let last = performance.now();
        const end = Math.max(total, 1);
        const tick = (now: number) => {
            let next = timeRef.current + (now - last) * speed;
            last = now;
            if (next >= end) {
                if (!loop) {
                    setTime(end);
                    setPlaying(false);
                    return;
                }
                next = 0;
            }
            setTime(next);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, total, speed, loop, setTime]);

    const togglePlay = () => {
        if (playing) return setPlaying(false);
        if (total === 0) return;
        if (timeRef.current >= total) setTime(0);
        setPlaying(true);
    };

    /* --------------------------------------------------------- geometry */

    const span = Math.max(total + 2000, 5000);
    const width = span * zoom;
    const seek = (ms: number) => {
        setPlaying(false);
        setTime(Math.min(Math.max(0, ms), span));
    };
    const step = [50, 100, 250, 500, 1000, 2000, 5000].find((value) => value * zoom >= 72) ?? 5000;
    const minor = step / 5;
    const msAt = (clientX: number) => {
        const rect = lanes.current?.getBoundingClientRect();
        return rect ? Math.min(span, Math.max(0, (clientX - rect.left) / zoom)) : 0;
    };
    const fit = () => {
        const available = (scroller.current?.clientWidth ?? 900) - HEADER_W - 40;
        setZoom(Math.min(1.5, Math.max(0.02, available / Math.max(total + 400, 1000))));
    };
    const fitted = useRef(false);
    useLayoutEffect(() => {
        if (fitted.current || !scroller.current?.clientWidth) return;
        fitted.current = true;
        fit();
    });

    const edges = useMemo(() => {
        const list: number[] = [0];
        for (const row of rows) {
            if (row.motion) for (const keys of Object.values(row.motion.tracks)) for (const key of keys ?? []) list.push(key.t);
            else if (row.entrance) {
                const { length, tail } = entranceEnd(row);
                list.push(row.style.entranceDelay, row.style.entranceDelay + length, row.style.entranceDelay + length + tail);
            }
        }
        return list;
        // biome-ignore lint/correctness/useExhaustiveDependencies: derived from the rows' signature
    }, [signature]);
    const snap = (ms: number, ignore?: (edge: number) => boolean) => {
        if (!snapOn) return Math.round(ms);
        const candidates = [time, ...edges.filter((edge) => !ignore?.(edge))];
        return candidates.find((edge) => Math.abs(edge - ms) * zoom < 7) ?? Math.round(ms / 10) * 10;
    };

    /* ------------------------------------------------------- keyframes */

    const motionOf = (id: string) => byId.get(id)?.motion;
    /** The layer's motion, turning its entrance into keyframes first if that is all it has. */
    const baseMotion = (id: string): LayerMotion => {
        const element = byId.get(id);
        if (element?.motion) return element.motion;
        const converted = element ? entranceToMotion(styleOf(element)) : undefined;
        return converted ?? { tracks: {} };
    };
    const hasMotion = (motion: LayerMotion) => Object.values(motion.tracks).some((keys) => keys?.length) || Object.keys(motion.wiggles ?? {}).length > 0;
    const writeMotion = (id: string, motion: LayerMotion) => {
        const tracks = Object.fromEntries(Object.entries(motion.tracks).filter(([, keys]) => keys && keys.length > 0));
        const next = { ...motion, tracks };
        const element = byId.get(id);
        onMotion(id, hasMotion(next) || next.split || next.origin ? next : undefined);
        if (element && !element.motion && styleOf(element).entrance !== "none") onStyle(id, { entrance: "none" });
    };
    const commitMotion = (id: string, motion: LayerMotion) => {
        onCommitStart?.();
        writeMotion(id, motion);
        onCommitEnd?.();
    };
    const setKey = (motion: LayerMotion, prop: KeyProp, t: number, v: KeyValue): LayerMotion => {
        const keys = [...(motion.tracks[prop] ?? [])];
        const at = keys.findIndex((key) => key.t === t);
        if (at >= 0) keys[at] = { ...keys[at]!, v };
        else keys.push({ t, v });
        keys.sort((a, b) => a.t - b.t);
        return { ...motion, tracks: { ...motion.tracks, [prop]: keys } };
    };
    const restOf = (id: string, spec: PropSpec) => ownValue(id, spec);
    const currentValue = (id: string, spec: PropSpec) => {
        const motion = motionOf(id);
        return motion ? wiggledAt(motion, spec.prop, time, restOf(id, spec)) : restOf(id, spec);
    };

    const toggleStopwatch = (id: string, spec: PropSpec) => {
        const motion = baseMotion(id);
        if (motion.tracks[spec.prop]?.length && byId.get(id)?.motion) {
            const { [spec.prop]: _removed, ...rest } = motion.tracks;
            commitMotion(id, { ...motion, tracks: rest });
        } else {
            commitMotion(id, setKey(motion, spec.prop, time, valueAt(motion.tracks[spec.prop], time, restOf(id, spec))));
        }
    };
    /** A new value at the playhead: a keyframe there (the stopwatch starts if it was off). */
    const setValue = (id: string, spec: PropSpec, value: KeyValue) => {
        const v = typeof value === "number" ? Math.round(Math.min(spec.max, Math.max(spec.min, value)) * 100) / 100 : value;
        writeMotion(id, setKey(baseMotion(id), spec.prop, time, v));
    };
    const toggleKeyHere = (id: string, spec: PropSpec) => {
        const motion = baseMotion(id);
        const keys = motion.tracks[spec.prop] ?? [];
        if (keys.some((key) => key.t === time)) commitMotion(id, { ...motion, tracks: { ...motion.tracks, [spec.prop]: keys.filter((key) => key.t !== time) } });
        else commitMotion(id, setKey(motion, spec.prop, time, valueAt(keys, time, restOf(id, spec))));
    };
    const jump = (keys: Keyframe[] | undefined, direction: -1 | 1) => {
        if (!keys?.length) return;
        const target = direction < 0 ? [...keys].reverse().find((key) => key.t < time - 0.5) : keys.find((key) => key.t > time + 0.5);
        if (target) seek(target.t);
    };
    const toggleWiggle = (id: string, spec: PropSpec) => {
        const motion = baseMotion(id);
        const wiggles = { ...(motion.wiggles ?? {}) };
        if (wiggles[spec.prop]) delete wiggles[spec.prop];
        else wiggles[spec.prop] = { amount: WIGGLE_DEFAULT[spec.prop] ?? Math.max(1, Math.round((spec.max - spec.min) / 40)), speed: 2 };
        commitMotion(id, { ...motion, wiggles });
    };

    const editSelected = (change: (keys: Keyframe[], selected: Set<number>, prop: KeyProp) => Keyframe[], ids = [...selectedKeys]) => {
        const byLayer = new Map<string, Map<KeyProp, Set<number>>>();
        for (const id of ids) {
            const { layer, prop, t } = parseKeyId(id);
            if (!byLayer.has(layer)) byLayer.set(layer, new Map());
            const props = byLayer.get(layer)!;
            if (!props.has(prop)) props.set(prop, new Set());
            props.get(prop)!.add(t);
        }
        onCommitStart?.();
        for (const [layer, props] of byLayer) {
            const motion = motionOf(layer);
            if (!motion) continue;
            const tracks = { ...motion.tracks };
            for (const [prop, times] of props) tracks[prop] = change(tracks[prop] ?? [], times, prop);
            writeMotion(layer, { ...motion, tracks });
        }
        onCommitEnd?.();
    };
    const deleteSelected = () => {
        editSelected((keys, selected) => keys.filter((key) => !selected.has(key.t)));
        setSelectedKeys(new Set());
    };
    const easeSelected = (ease: Ease | undefined, ids: string[]) =>
        editSelected((keys, selected) => keys.map((key) => {
            if (!selected.has(key.t)) return key;
            const { ease: _old, ...rest } = key;
            return ease && ease !== "ease" ? { ...rest, ease } : rest;
        }), ids);

    const startKeyDrag = (event: React.PointerEvent, id: string) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        const { layer, t } = parseKeyId(id);
        onSelect(layer);
        let selection = selectedKeys;
        if (event.shiftKey) {
            selection = new Set(selectedKeys);
            if (selection.has(id)) selection.delete(id);
            else selection.add(id);
            setSelectedKeys(selection);
            return;
        }
        if (!selection.has(id)) {
            selection = new Set([id]);
            setSelectedKeys(selection);
        }
        const moving = new Set([...selection].map((item) => parseKeyId(item).t));
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        const originX = event.clientX;
        let delta = 0;
        let moved = false;
        const move = (moveEvent: PointerEvent) => {
            const raw = (moveEvent.clientX - originX) / zoom;
            if (!moved && Math.abs(moveEvent.clientX - originX) < 3) return;
            moved = true;
            const landed = snap(t + raw, (edge) => moving.has(edge));
            delta = Math.max(-Math.min(...[...selection].map((item) => parseKeyId(item).t)), landed - t);
            setKeyDrag({ delta, x: moveEvent.clientX, y: moveEvent.clientY });
        };
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            setKeyDrag(null);
            if (!moved) {
                seek(t);
                return;
            }
            if (delta === 0) return;
            const ids = [...selection];
            editSelected((keys, selected) => {
                // Where a moved keyframe lands on another, the moved one wins.
                const byTime = new Map<number, Keyframe>();
                for (const key of keys) if (!selected.has(key.t)) byTime.set(key.t, key);
                for (const key of keys) if (selected.has(key.t)) byTime.set(Math.round(key.t + delta), { ...key, t: Math.round(key.t + delta) });
                return [...byTime.values()].sort((a, b) => a.t - b.t);
            }, ids);
            setSelectedKeys(new Set(ids.map((item) => {
                const { layer: l, prop, t: at } = parseKeyId(item);
                return keyId(l, prop, Math.round(at + delta));
            })));
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const startBarDrag = (event: React.PointerEvent, row: Row) => {
        if (event.button !== 0 || !row.motion) return;
        event.stopPropagation();
        onSelect(row.element.id);
        const all = Object.entries(row.motion.tracks).flatMap(([prop, keys]) => (keys ?? []).map((key) => keyId(row.element.id, prop as KeyProp, key.t)));
        if (!all.length) return;
        const first = Math.min(...all.map((item) => parseKeyId(item).t));
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        const originX = event.clientX;
        let delta = 0;
        const move = (moveEvent: PointerEvent) => {
            const raw = (moveEvent.clientX - originX) / zoom;
            delta = Math.max(-first, snap(first + raw, (edge) => all.some((item) => parseKeyId(item).t === edge)) - first);
            setKeyDrag({ delta, x: moveEvent.clientX, y: moveEvent.clientY });
            setSelectedKeys(new Set(all));
        };
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            setKeyDrag(null);
            if (!delta) return;
            const motion = row.motion!;
            commitMotion(row.element.id, {
                ...motion,
                tracks: Object.fromEntries(Object.entries(motion.tracks).map(([prop, keys]) => [prop, (keys ?? []).map((key) => ({ ...key, t: Math.round(key.t + delta) }))])),
            });
            setSelectedKeys(new Set(all.map((item) => {
                const { layer, prop, t } = parseKeyId(item);
                return keyId(layer, prop, Math.round(t + delta));
            })));
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const startClipDrag = (event: React.PointerEvent, row: Row, mode: ClipDrag["mode"]) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        onSelect(row.element.id);
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        const originX = event.clientX;
        const spring = row.style.entranceCurve === "spring";
        const start0 = row.style.entranceDelay;
        const length0 = entranceTiming(row.style).duration;
        let latest: ClipDrag = { id: row.element.id, mode, start: start0, length: length0, x: event.clientX, y: event.clientY };
        const move = (moveEvent: PointerEvent) => {
            const delta = (moveEvent.clientX - originX) / zoom;
            if (mode === "move") latest = { ...latest, start: Math.min(5000, Math.max(0, snap(start0 + delta))) };
            else if (mode === "end") latest = { ...latest, length: Math.min(3000, Math.max(100, snap(start0 + length0 + delta) - start0)) };
            else {
                const end = start0 + length0;
                const start = Math.min(spring ? 5000 : end - 100, Math.max(0, snap(start0 + delta)));
                latest = { ...latest, start, length: spring ? length0 : Math.min(3000, end - start) };
            }
            setClipDrag({ ...latest, x: moveEvent.clientX, y: moveEvent.clientY });
        };
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            setClipDrag(null);
            const patch: Patch = {};
            if (latest.start !== start0) patch.entranceDelay = latest.start;
            if (latest.length !== length0 && !spring) patch.entranceDuration = latest.length;
            if (Object.keys(patch).length) {
                onCommitStart?.();
                onStyle(row.element.id, patch);
                onCommitEnd?.();
            }
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const applyEffect = (preset: EffectPreset) => {
        if (!selectedId) return;
        const current = motionOf(selectedId);
        const motion = presetMotion(preset, Math.round(time >= total ? 0 : time));
        commitMotion(selectedId, { ...motion, ...(current?.trigger ? { trigger: current.trigger } : {}) });
        setExpanded((open) => new Set([...open, selectedId]));
        setEffectsOpen(false);
        seek(motion.tracks ? Math.min(...Object.values(motion.tracks).flatMap((keys) => (keys ?? []).map((key) => key.t)), Number.POSITIVE_INFINITY) || 0 : 0);
        setPlaying(true);
    };

    /* ---------------------------------------------------------- misc UI */

    const scrub = (event: React.PointerEvent) => {
        if (event.button !== 0) return;
        setPlaying(false);
        setMenu(null);
        if (!event.shiftKey) setSelectedKeys(new Set());
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        setTime(msAt(event.clientX));
        const move = (moveEvent: PointerEvent) => setTime(snap(msAt(moveEvent.clientX)));
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const resizePanel = (event: React.PointerEvent) => {
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        const originY = event.clientY;
        const from = height;
        let next = from;
        const move = (moveEvent: PointerEvent) => {
            next = Math.min(Math.round(window.innerHeight * 0.8), Math.max(180, from + originY - moveEvent.clientY));
            setHeight(next);
        };
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            try {
                localStorage.setItem(HEIGHT_KEY, String(next));
            } catch {
                // Not remembered; nothing else depends on it.
            }
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if ((event.target as HTMLElement).closest("input,select,textarea")) return;
        const handled = () => {
            event.preventDefault();
            event.stopPropagation();
        };
        const key = event.key;
        if (key === " ") { handled(); togglePlay(); }
        else if (key === "ArrowLeft" || key === "ArrowRight") { handled(); seek(time + (event.shiftKey ? 1000 : 100) * (key === "ArrowLeft" ? -1 : 1)); }
        else if (key === "," || key === "PageUp") { handled(); seek(time - FRAME); }
        else if (key === "." || key === "PageDown") { handled(); seek(time + FRAME); }
        else if (key === "Home") { handled(); seek(0); }
        else if (key === "End") { handled(); seek(total); }
        else if (key.toLowerCase() === "u" && !event.ctrlKey && !event.metaKey) { handled(); setOnlyAnimated((value) => !value); }
        else if (key === "Escape") { handled(); setSelectedKeys(new Set()); setMenu(null); setCurveEditing(null); setEffectsOpen(false); }
        else if ((key === "Delete" || key === "Backspace") && selectedKeys.size) { handled(); deleteSelected(); }
        else if (key.toLowerCase() === "a" && (event.ctrlKey || event.metaKey)) {
            handled();
            setSelectedKeys(new Set(rows.flatMap((row) => Object.entries(row.motion?.tracks ?? {}).flatMap(([prop, keys]) => (keys ?? []).map((k) => keyId(row.element.id, prop as KeyProp, k.t))))));
        }
    };
    useEffect(() => {
        if (!menu && !curveEditing && !effectsOpen) return;
        const close = (event: PointerEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-key-menu]")) setMenu(null);
            if (!target.closest("[data-curve-editor]")) setCurveEditing(null);
            if (!target.closest("[data-effects]")) setEffectsOpen(false);
        };
        document.addEventListener("pointerdown", close, true);
        return () => document.removeEventListener("pointerdown", close, true);
    }, [menu, curveEditing, effectsOpen]);

    const toggleExpanded = (id: string) =>
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    useEffect(() => {
        if (selectedId) setExpanded((current) => (current.has(selectedId) ? current : new Set([...current, selectedId])));
    }, [selectedId]);

    const shifted = (layer: string, prop: KeyProp, t: number) => (keyDrag && selectedKeys.has(keyId(layer, prop, t)) ? t + keyDrag.delta : t);
    const selected = selectedId ? byId.get(selectedId) : undefined;

    /* ------------------------------------------------------- prop rows */

    const propRow = (row: Row, spec: PropSpec, indent: number) => {
        const id = row.element.id;
        const track = row.motion?.tracks[spec.prop];
        const wiggle = row.motion?.wiggles?.[spec.prop];
        const animated = Boolean(track?.length);
        const value = currentValue(id, spec);
        const here = track?.some((key) => key.t === time);
        return (
            <div key={spec.prop}>
                <div className="flex" style={{ height: PROP_ROW }}>
                    <div className="group sticky left-0 z-10 flex shrink-0 items-center gap-1 border-b border-r border-ed-border bg-ed-subtle pr-1.5" style={{ width: HEADER_W, paddingLeft: indent + 22 }}>
                        <button
                            type="button"
                            aria-pressed={animated}
                            title={animated ? "Stop animating (removes its keyframes)" : "Animate — sets a keyframe at the playhead"}
                            onClick={() => toggleStopwatch(id, spec)}
                            className={`grid size-5 shrink-0 place-items-center rounded ${animated ? "text-[var(--ed-accent)]" : "text-ed-faint hover:text-ed-text"}`}
                        >
                            <IconClock size={13} stroke={animated ? 2.4 : 1.6} />
                        </button>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: spec.color }} />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-ed-muted">{spec.label}</span>
                        {spec.kind === "number" && (
                            <button
                                type="button"
                                aria-pressed={Boolean(wiggle)}
                                title={wiggle ? "Stop wiggling" : "Wiggle — random wobble on top"}
                                onClick={() => toggleWiggle(id, spec)}
                                className={`grid size-5 shrink-0 place-items-center rounded ${wiggle ? "text-[var(--ed-accent)]" : "invisible text-ed-faint hover:text-ed-text group-hover:visible"}`}
                            >
                                <IconWaveSine size={13} />
                            </button>
                        )}
                        <div className={`flex items-center ${animated ? "" : "invisible group-hover:visible"}`}>
                            <button type="button" aria-label="Previous keyframe" title="Previous keyframe" onClick={() => jump(track, -1)} className="grid size-4 place-items-center rounded text-ed-faint hover:text-ed-text"><IconChevronLeft size={11} /></button>
                            <button type="button" aria-label={here ? "Remove keyframe here" : "Add keyframe here"} title={here ? "Remove the keyframe at the playhead" : "Add a keyframe at the playhead"} onClick={() => toggleKeyHere(id, spec)} className="grid size-4 place-items-center">
                                <span className="size-2 rotate-45 rounded-[1px] border" style={{ borderColor: spec.color, background: here ? spec.color : "transparent" }} />
                            </button>
                            <button type="button" aria-label="Next keyframe" title="Next keyframe" onClick={() => jump(track, 1)} className="grid size-4 place-items-center rounded text-ed-faint hover:text-ed-text"><IconChevronRight size={11} /></button>
                        </div>
                        {spec.kind === "color" ? (
                            <ColorValue value={String(value)} active={animated} onStart={onCommitStart} onEnd={onCommitEnd} onChange={(next) => setValue(id, spec, next)} />
                        ) : (
                            <Scrubby value={Number(value)} spec={spec} active={animated} onStart={onCommitStart} onEnd={onCommitEnd} onChange={(next) => setValue(id, spec, next)} />
                        )}
                    </div>
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: a lane — click scrubs, double-click adds a keyframe */}
                    <div
                        className="relative flex-1 border-b border-ed-border bg-[color-mix(in_srgb,var(--ed-subtle)_55%,transparent)]"
                        onPointerDown={(event) => event.target === event.currentTarget && scrub(event)}
                        onDoubleClick={(event) => {
                            if (event.target !== event.currentTarget) return;
                            const t = snap(msAt(event.clientX));
                            const motion = baseMotion(id);
                            commitMotion(id, setKey(motion, spec.prop, t, valueAt(motion.tracks[spec.prop], t, restOf(id, spec))));
                            seek(t);
                        }}
                    >
                        {(animated || wiggle) && row.motion && (
                            spec.kind === "color"
                                ? <ColorStrip keys={track!} zoom={zoom} span={span} height={PROP_ROW} />
                                : <ValueCurve motion={row.motion} prop={spec.prop} rest={Number(restOf(id, spec))} color={spec.color} zoom={zoom} span={span} height={PROP_ROW} />
                        )}
                        {track?.map((key) => {
                            const kid = keyId(id, spec.prop, key.t);
                            const picked = selectedKeys.has(kid);
                            return (
                                <KeyMark
                                    key={key.t}
                                    left={shifted(id, spec.prop, key.t) * zoom}
                                    ease={key.ease}
                                    color={spec.color}
                                    picked={picked}
                                    title={`${spec.label} ${key.v}${spec.unit} at ${key.t}ms · ${easeLabel(key.ease)} — double-click to draw its curve`}
                                    onPointerDown={(event) => startKeyDrag(event, kid)}
                                    onDoubleClick={(event) => {
                                        const ids = picked ? [...selectedKeys] : [kid];
                                        if (!picked) setSelectedKeys(new Set([kid]));
                                        setCurveEditing({ x: event.clientX, y: event.clientY, keys: ids, ease: key.ease });
                                    }}
                                    onContextMenu={(event) => {
                                        event.preventDefault();
                                        const ids = picked ? [...selectedKeys] : [kid];
                                        if (!picked) setSelectedKeys(new Set([kid]));
                                        setMenu({ x: event.clientX, y: event.clientY, keys: ids });
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                {wiggle && (
                    <div className="flex" style={{ height: PROP_ROW }}>
                        <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-b border-r border-ed-border bg-ed-subtle pr-1.5 text-[11px] text-ed-muted" style={{ width: HEADER_W, paddingLeft: indent + 48 }}>
                            <IconWaveSine size={12} className="shrink-0 text-[var(--ed-accent)]" />
                            <span className="flex-1">Wiggle</span>
                            <span className="text-[10px] text-ed-faint">amount</span>
                            <Scrubby value={wiggle.amount} spec={{ ...spec, min: 0, step: spec.step }} active onStart={onCommitStart} onEnd={onCommitEnd}
                                onChange={(amount) => writeMotion(id, { ...row.motion!, wiggles: { ...row.motion!.wiggles, [spec.prop]: { ...wiggle, amount: Math.max(0, amount) } } })} />
                            <span className="text-[10px] text-ed-faint">speed</span>
                            <Scrubby value={wiggle.speed} spec={{ ...spec, min: 0.1, max: 30, step: 0.1, unit: "/s" }} active onStart={onCommitStart} onEnd={onCommitEnd}
                                onChange={(next) => writeMotion(id, { ...row.motion!, wiggles: { ...row.motion!.wiggles, [spec.prop]: { ...wiggle, speed: Math.min(30, Math.max(0.1, Math.round(next * 10) / 10)) } } })} />
                        </div>
                        <div className="flex-1 border-b border-ed-border bg-[color-mix(in_srgb,var(--ed-subtle)_55%,transparent)]" />
                    </div>
                )}
            </div>
        );
    };

    const settingRow = (key: string, indent: number, label: string, control: React.ReactNode) => (
        <div key={key} className="flex" style={{ height: PROP_ROW }}>
            <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-b border-r border-ed-border bg-ed-subtle pr-1.5" style={{ width: HEADER_W, paddingLeft: indent + 48 }}>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ed-muted">{label}</span>
                {control}
            </div>
            <div className="flex-1 border-b border-ed-border bg-[color-mix(in_srgb,var(--ed-subtle)_55%,transparent)]" />
        </div>
    );

    const groupRows = (row: Row, indent: number) => {
        const id = row.element.id;
        const textual = isTextual(row.element.type);
        return KEY_GROUPS.filter((group) => group !== "Text" || textual).map((group) => {
            const specs = KEY_PROPS.filter((spec) => spec.group === group);
            const live = specs.filter((spec) => row.motion?.tracks[spec.prop]?.length || row.motion?.wiggles?.[spec.prop]);
            const gid = `${id}:${group}`;
            const extra = group === "Transform" ? Boolean(row.motion?.origin) : group === "Text" ? Boolean(row.motion?.split) : false;
            if (onlyAnimated && !live.length && !extra) return null;
            const open = openGroups.has(gid) ? true : openGroups.has(`!${gid}`) ? false : group === "Transform" || live.length > 0 || extra;
            const shown = onlyAnimated ? live : specs;
            return (
                <div key={group}>
                    <div className="flex" style={{ height: 22 }}>
                        <button
                            type="button"
                            onClick={() => setOpenGroups((current) => {
                                const next = new Set(current);
                                next.delete(gid);
                                next.delete(`!${gid}`);
                                next.add(open ? `!${gid}` : gid);
                                return next;
                            })}
                            className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-b border-r border-ed-border bg-ed-subtle pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-ed-faint hover:text-ed-text"
                            style={{ width: HEADER_W, paddingLeft: indent + 18 }}
                        >
                            <IconChevronRight size={10} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                            {group}
                            {live.length > 0 && <span className="ml-1 rounded bg-[var(--ed-accent-soft)] px-1 text-[9px] text-[var(--ed-accent-hover)]">{live.length}</span>}
                        </button>
                        <div className="flex-1 border-b border-ed-border bg-ed-subtle" />
                    </div>
                    {open && (
                        <>
                            {shown.map((spec) => propRow(row, spec, indent))}
                            {group === "Transform" && (!onlyAnimated || row.motion?.origin) && settingRow("origin", indent, "Anchor point",
                                <div className="flex items-center gap-1">
                                    <Scrubby value={row.motion?.origin?.x ?? 50} spec={{ ...KEY_PROP.get("x")!, min: -200, max: 300, unit: "%" }} active={Boolean(row.motion?.origin)} onStart={onCommitStart} onEnd={onCommitEnd}
                                        onChange={(x) => writeMotion(id, { ...baseMotion(id), origin: { x: Math.round(x), y: baseMotion(id).origin?.y ?? 50 } })} />
                                    <Scrubby value={row.motion?.origin?.y ?? 50} spec={{ ...KEY_PROP.get("y")!, min: -200, max: 300, unit: "%" }} active={Boolean(row.motion?.origin)} onStart={onCommitStart} onEnd={onCommitEnd}
                                        onChange={(y) => writeMotion(id, { ...baseMotion(id), origin: { x: baseMotion(id).origin?.x ?? 50, y: Math.round(y) } })} />
                                </div>,
                            )}
                            {group === "Text" && (
                                <>
                                    {settingRow("split", indent, "Animate by",
                                        <MiniSelect label="Animate by" value={row.motion?.split?.by ?? "off"}
                                            options={[{ value: "off", label: "Whole text" }, { value: "letters", label: "Letters" }, { value: "words", label: "Words" }]}
                                            onChange={(by) => {
                                                const motion = baseMotion(id);
                                                const { split: _old, ...rest } = motion;
                                                commitMotion(id, by === "off" ? rest : { ...motion, split: { stagger: motion.split?.stagger ?? 40, order: motion.split?.order, by: by as "letters" | "words" } });
                                            }} />,
                                    )}
                                    {row.motion?.split && settingRow("stagger", indent, "Stagger",
                                        <Scrubby value={row.motion.split.stagger} spec={{ ...KEY_PROP.get("x")!, min: 0, max: 2000, unit: "ms" }} active onStart={onCommitStart} onEnd={onCommitEnd}
                                            onChange={(stagger) => writeMotion(id, { ...row.motion!, split: { ...row.motion!.split!, stagger: Math.round(Math.max(0, Math.min(2000, stagger))) } })} />,
                                    )}
                                    {row.motion?.split && settingRow("order", indent, "Order",
                                        <MiniSelect label="Order" value={row.motion.split.order ?? "forward"}
                                            options={[{ value: "forward", label: "First to last" }, { value: "backward", label: "Last to first" }, { value: "center", label: "From the centre" }, { value: "random", label: "Random" }]}
                                            onChange={(order) => commitMotion(id, { ...row.motion!, split: { ...row.motion!.split!, order: order === "forward" ? undefined : (order as "backward" | "center" | "random") } })} />,
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            );
        });
    };

    /* ------------------------------------------------------------ render */

    return (
        // Above the canvas's selection layer, which is fixed and so not clipped by the canvas.
        // biome-ignore lint/a11y/noStaticElementInteractions: the timeline takes its keyboard shortcuts while focused
        <section
            aria-label="Motion timeline"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="relative z-40 flex shrink-0 select-none flex-col overflow-hidden rounded-2xl bg-ed-surface text-ed-text shadow-[var(--ed-panel-shadow)] outline-none"
            style={{ height }}
        >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle for the panel's height */}
            <div onPointerDown={resizePanel} title="Drag to resize" className="group absolute inset-x-0 top-0 z-30 flex h-2 cursor-ns-resize justify-center">
                <span className="mt-[3px] h-[3px] w-10 rounded-full bg-[var(--ed-border-strong)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {/* Transport */}
            <div className="flex h-12 shrink-0 items-center gap-1 border-b border-ed-border px-3 pt-1">
                <Tool label="To start (Home)" onClick={() => seek(0)}><IconPlayerSkipBack size={15} /></Tool>
                <Tool label="Previous frame (,)" onClick={() => seek(time - FRAME)}><IconPlayerTrackPrev size={15} /></Tool>
                <button
                    type="button"
                    aria-label={playing ? "Pause (Space)" : "Play (Space)"}
                    title={playing ? "Pause (Space)" : "Play (Space)"}
                    onClick={togglePlay}
                    disabled={total === 0}
                    className="mx-0.5 grid size-8 place-items-center rounded-full bg-ed-primary text-[var(--ed-primary-text)] transition-colors hover:bg-[var(--ed-primary-hover)] disabled:opacity-40"
                >
                    {playing ? <IconPlayerPause size={15} /> : <IconPlayerPlay size={15} />}
                </button>
                <Tool label="Next frame (.)" onClick={() => seek(time + FRAME)}><IconPlayerTrackNext size={15} /></Tool>
                <Tool label="To end (End)" onClick={() => seek(total)}><IconPlayerSkipForward size={15} /></Tool>
                <div className="ml-2 flex items-baseline gap-1.5 rounded-lg bg-ed-field px-2.5 py-1 font-mono tabular-nums">
                    <span className="text-[13px] font-semibold">{timecode(time)}</span>
                    <span className="text-[11px] text-ed-faint">/ {timecode(total)}</span>
                </div>
                <div className="ml-2 flex rounded-lg bg-ed-field p-0.5">
                    {[0.25, 0.5, 1].map((value) => (
                        <button key={value} type="button" title={`Play at ${value}× speed`} onClick={() => setSpeed(value)} className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${speed === value ? "bg-ed-surface text-ed-text shadow-sm" : "text-ed-muted hover:text-ed-text"}`}>
                            {value}×
                        </button>
                    ))}
                </div>
                <Toggle on={loop} label="Loop the preview" onClick={() => setLoop((value) => !value)}><IconRepeat size={14} /></Toggle>
                <div ref={effectsAnchor} data-effects="" className="relative ml-2">
                    <button
                        type="button"
                        onClick={() => setEffectsOpen((value) => !value)}
                        disabled={!selected}
                        title={selected ? `Apply an effect to ${displayName(selected)} at the playhead` : "Select a layer to apply an effect"}
                        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-40 ${effectsOpen ? "bg-[var(--ed-accent)] text-white" : "bg-[var(--ed-accent-soft)] text-[var(--ed-accent-hover)] hover:brightness-95"}`}
                    >
                        <IconSparkles size={13} /> Effects
                    </button>
                    {effectsOpen && selected && <EffectsLibrary anchor={effectsAnchor} textual={isTextual(selected.type)} onApply={applyEffect} />}
                </div>
                <span className="flex-1" />
                {selectedKeys.size > 0 && <span className="mr-1 text-[11px] text-ed-muted">{selectedKeys.size} keyframe{selectedKeys.size > 1 ? "s" : ""}</span>}
                <Toggle on={onlyAnimated} label="Only animated properties (U)" onClick={() => setOnlyAnimated((value) => !value)}><IconFilter size={14} /></Toggle>
                <Toggle on={showAll} label="Show every layer, not just the animated ones" onClick={() => setShowAll((value) => !value)}><IconEye size={14} /></Toggle>
                <Toggle on={snapOn} label="Snap to keyframes and the playhead" onClick={() => setSnapOn((value) => !value)}><IconMagnet size={14} /></Toggle>
                <input type="range" aria-label="Zoom" min={Math.log(0.02)} max={Math.log(1.5)} step={0.01} value={Math.log(zoom)} onChange={(event) => setZoom(Math.exp(Number(event.target.value)))} className="mx-1 w-24 accent-[var(--ed-accent)]" />
                <Tool label="Fit the timeline" onClick={fit}><IconArrowsHorizontal size={15} /></Tool>
            </div>

            <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto">
                <div className="relative" style={{ width: HEADER_W + width + 32, minHeight: "100%" }}>
                    {/* Ruler */}
                    <div className="sticky top-0 z-20 flex h-7 bg-ed-surface">
                        <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-b border-r border-ed-border bg-ed-surface px-3 text-[10px] font-medium uppercase tracking-wider text-ed-faint" style={{ width: HEADER_W }}>
                            <span className="flex-1">Layer</span>
                            <span className="text-right">Value at playhead</span>
                        </div>
                        {/* biome-ignore lint/a11y/useFocusableInteractive: the timeline section takes the keys */}
                        <div ref={lanes} role="slider" aria-label="Playhead" aria-valuemin={0} aria-valuemax={span} aria-valuenow={Math.round(time)}
                            onPointerDown={scrub} onPointerMove={(event) => setHover(msAt(event.clientX))} onPointerLeave={() => setHover(null)}
                            className="relative flex-1 cursor-ew-resize border-b border-ed-border">
                            {total > 0 && <span className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--ed-accent)_8%,transparent)]" style={{ width: total * zoom }} />}
                            {Array.from({ length: Math.floor(span / minor) + 1 }, (_, index) => index * minor).map((ms) => {
                                const major = Math.abs(ms / step - Math.round(ms / step)) < 1e-6;
                                return (
                                    <span key={ms} className="absolute inset-y-0" style={{ left: ms * zoom }}>
                                        <span className={`absolute bottom-0 w-px ${major ? "h-2.5 bg-[var(--ed-border-strong)]" : "h-1 bg-ed-border"}`} />
                                        {major && <span className="absolute left-1 top-1 whitespace-nowrap font-mono text-[9px] text-ed-faint">{ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}</span>}
                                    </span>
                                );
                            })}
                            {hover !== null && !keyDrag && !clipDrag && <span className="pointer-events-none absolute top-0 -translate-x-1/2 rounded bg-ed-text px-1 font-mono text-[9px] leading-[14px] text-ed-surface" style={{ left: hover * zoom }}>{Math.round(hover)}ms</span>}
                            <span className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded bg-[#ef4444] px-1 font-mono text-[9px] leading-[14px] text-white" style={{ left: time * zoom }}>{Math.round(time)}ms</span>
                        </div>
                    </div>

                    {rows.map((row) => {
                        const id = row.element.id;
                        const open = expanded.has(id);
                        const isSelected = id === selectedId;
                        const keys = Object.entries(row.motion?.tracks ?? {}).flatMap(([prop, list]) => (list ?? []).map((key) => ({ prop: prop as KeyProp, key })));
                        const times = keys.map(({ prop, key }) => shifted(id, prop, key.t));
                        const first = times.length ? Math.min(...times) : 0;
                        const last = times.length ? Math.max(...times) : 0;
                        const tail = row.motion ? motionEnd(row) - motionDuration(row.motion) : 0;
                        const indent = 6 + Math.min(6, row.depth - minDepth) * 12;
                        return (
                            <div key={id}>
                                <div className="flex" style={{ height: LAYER_ROW }}>
                                    <div className={`sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-b border-r border-ed-border pr-2 ${isSelected ? "bg-[color-mix(in_srgb,var(--ed-accent)_10%,var(--ed-surface))]" : "bg-ed-surface"}`} style={{ width: HEADER_W, paddingLeft: indent }}>
                                        <button type="button" aria-label={open ? "Hide properties" : "Show properties"} aria-expanded={open} onClick={() => toggleExpanded(id)} className="grid size-5 shrink-0 place-items-center rounded text-ed-muted hover:bg-ed-field hover:text-ed-text">
                                            <IconChevronRight size={12} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                                        </button>
                                        <span className="size-2 shrink-0 rounded-[3px]" style={{ background: row.motion ? "var(--ed-accent)" : row.entrance ? "color-mix(in srgb, var(--ed-accent) 45%, transparent)" : "var(--ed-border-strong)" }} />
                                        <button type="button" onClick={() => onSelect(id)} className={`min-w-0 flex-1 truncate text-left text-[12px] ${isSelected ? "font-semibold" : ""}`}>{displayName(row.element)}</button>
                                        {row.motion ? (
                                            <>
                                                <MiniSelect label="When it plays" value={row.motion.trigger ?? "view"} options={[{ value: "view", label: "In view" }, { value: "load", label: "On load" }]}
                                                    onChange={(trigger) => commitMotion(id, { ...row.motion!, trigger: trigger === "load" ? "load" : undefined })} />
                                                <MiniSelect label="Repeat" value={row.motion.repeat ?? "once"} options={[{ value: "once", label: "Once" }, { value: "loop", label: "Loop" }, { value: "pingpong", label: "Ping-pong" }]}
                                                    onChange={(repeat) => commitMotion(id, { ...row.motion!, repeat: repeat === "once" ? undefined : (repeat as LayerMotion["repeat"]) })} />
                                                <button type="button" aria-label="Remove all keyframes" title="Remove all keyframes" onClick={() => { onCommitStart?.(); onMotion(id, undefined); onCommitEnd?.(); }} className="grid size-5 shrink-0 place-items-center rounded text-ed-faint hover:bg-ed-field hover:text-red-500"><IconX size={11} /></button>
                                            </>
                                        ) : row.entrance ? (
                                            <span className="shrink-0 rounded bg-ed-field px-1.5 py-0.5 text-[10px] text-ed-muted">{ENTRANCES.find((item) => item.value === row.style.entrance)?.label}</span>
                                        ) : null}
                                    </div>
                                    {/* biome-ignore lint/a11y/noStaticElementInteractions: an empty lane moves the playhead */}
                                    <div className="relative flex-1 border-b border-ed-border" onPointerDown={(event) => event.target === event.currentTarget && scrub(event)}>
                                        {row.motion && times.length > 0 && (
                                            // biome-ignore lint/a11y/noStaticElementInteractions: the bar slides all of the layer's keyframes
                                            <div title="Drag to move all of this layer's keyframes"
                                                className={`absolute top-[9px] h-4 cursor-grab rounded-full active:cursor-grabbing ${isSelected ? "bg-[color-mix(in_srgb,var(--ed-accent)_30%,transparent)]" : "bg-[color-mix(in_srgb,var(--ed-accent)_16%,transparent)]"}`}
                                                style={{ left: first * zoom - 6, width: Math.max(12, (last - first) * zoom + 12) }}
                                                onPointerDown={(event) => startBarDrag(event, row)} />
                                        )}
                                        {tail > 0 && <span className="pointer-events-none absolute top-[13px] h-2 rounded-r-full opacity-40" style={{ left: last * zoom, width: tail * zoom, backgroundImage: "repeating-linear-gradient(135deg, var(--ed-accent) 0 1px, transparent 1px 5px)" }} title="Letters arriving one after another" />}
                                        {keys.map(({ prop, key }) => (
                                            <span key={`${prop}-${key.t}`} className="pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ left: shifted(id, prop, key.t) * zoom, background: KEY_PROP.get(prop)!.color }} />
                                        ))}
                                        {row.entrance && <EntranceClip row={row} zoom={zoom} isSelected={isSelected} drag={clipDrag?.id === id ? clipDrag : undefined} entranceEnd={entranceEnd} onDrag={startClipDrag} />}
                                    </div>
                                </div>
                                {open && (
                                    <>
                                        {row.entrance && !entranceToMotion(row.style) && (
                                            <div className="flex" style={{ height: PROP_ROW }}>
                                                <div className="sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-ed-border bg-ed-subtle pr-2 text-[11px] text-ed-faint" style={{ width: HEADER_W, paddingLeft: indent + 30 }}>
                                                    {row.style.entranceSplit !== "none" ? "Split entrances stay a clip" : "This preset stays a clip"} — keyframes replace it.
                                                </div>
                                                <div className="flex-1 border-b border-ed-border bg-ed-subtle" />
                                            </div>
                                        )}
                                        {groupRows(row, indent)}
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {rows.length === 0 && (
                        <p className="py-6 pr-4 text-[12px] leading-relaxed text-ed-muted" style={{ paddingLeft: HEADER_W + 16 }}>
                            Select a layer on the canvas — its properties open here. Click a stopwatch to start animating, or pick something from Effects.
                        </p>
                    )}

                    {scrolling.length > 0 && (
                        <>
                            <div className="flex h-7">
                                <div className="sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-ed-border bg-ed-subtle px-3 text-[10px] font-medium uppercase tracking-wider text-ed-faint" style={{ width: HEADER_W }}>On scroll</div>
                                <div className="flex flex-1 items-center border-b border-ed-border bg-ed-subtle px-3 text-[11px] text-ed-faint">Follows the scroll position, not time — open Preview to scroll through it.</div>
                            </div>
                            {scrolling.map(({ element, style }) => (
                                <div key={element.id} className="flex" style={{ height: LAYER_ROW }}>
                                    <button type="button" onClick={() => onSelect(element.id)} className={`sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-ed-border pl-9 pr-2 text-left text-[12px] ${element.id === selectedId ? "bg-[color-mix(in_srgb,var(--ed-accent)_10%,var(--ed-surface))] font-semibold" : "bg-ed-surface hover:bg-ed-field"}`} style={{ width: HEADER_W }}>
                                        <span className="truncate">{displayName(element)}</span>
                                    </button>
                                    <div className="relative flex-1 border-b border-ed-border">
                                        <span className="absolute inset-y-[6px] left-0 flex items-center rounded-[7px] px-2 text-[11px] font-medium" style={{ width: Math.max(160, width), background: "repeating-linear-gradient(135deg, color-mix(in srgb, #10b981 18%, var(--ed-surface)) 0 8px, color-mix(in srgb, #10b981 10%, var(--ed-surface)) 8px 16px)" }}>
                                            {SCROLL_EFFECTS.find((item) => item.value === style.scrollEffect)?.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {total > 0 && <span className="pointer-events-none absolute bottom-0 top-7 z-[5] border-l border-dashed border-[var(--ed-border-strong)]" style={{ left: HEADER_W + total * zoom }} />}
                    <span className="pointer-events-none absolute bottom-0 top-0 z-[25] w-px bg-[#ef4444]" style={{ left: HEADER_W + time * zoom }} />
                </div>
            </div>

            {(keyDrag || clipDrag) && (
                <span className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-[130%] rounded-md bg-ed-text px-1.5 py-0.5 font-mono text-[10px] text-ed-surface shadow" style={{ left: (keyDrag ?? clipDrag)!.x, top: (keyDrag ?? clipDrag)!.y }}>
                    {keyDrag ? `${keyDrag.delta >= 0 ? "+" : ""}${Math.round(keyDrag.delta)}ms` : clipDrag!.mode === "move" ? `starts ${clipDrag!.start}ms` : clipDrag!.mode === "end" ? `${clipDrag!.length}ms` : `starts ${clipDrag!.start}ms · ${clipDrag!.length}ms`}
                </span>
            )}

            {menu && (
                <div data-key-menu="" className="fixed z-[300] min-w-[180px] rounded-xl bg-ed-menu p-1 text-[12px] shadow-[var(--ed-dock-shadow)]" style={{ left: menu.x, top: menu.y }}>
                    <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-ed-faint">Curve to next keyframe</p>
                    {KEY_EASES.map((item) => (
                        <button key={item.value} type="button" onClick={() => { easeSelected(item.value, menu.keys); setMenu(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-ed-menu-hover">
                            <EaseIcon ease={item.value} />
                            {item.label}
                        </button>
                    ))}
                    <button type="button" onClick={() => { const first = parseKeyId(menu.keys[0]!); setCurveEditing({ x: menu.x, y: menu.y, keys: menu.keys, ease: motionOf(first.layer)?.tracks[first.prop]?.find((k) => k.t === first.t)?.ease }); setMenu(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-ed-menu-hover">
                        <EaseIcon ease="bezier:0.2,1.4,0.3,1" />
                        Draw a curve…
                    </button>
                    <div className="my-1 h-px bg-ed-border" />
                    <button type="button" onClick={() => { editSelected((keys, picked) => keys.filter((key) => !picked.has(key.t)), menu.keys); setSelectedKeys(new Set()); setMenu(null); }} className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-ed-menu-hover">
                        Delete keyframe{menu.keys.length > 1 ? "s" : ""}
                    </button>
                </div>
            )}

            {curveEditing && (
                <CurveEditor
                    at={curveEditing}
                    onApply={(ease) => { easeSelected(ease, curveEditing.keys); setCurveEditing({ ...curveEditing, ease }); }}
                    onClose={() => setCurveEditing(null)}
                />
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Parts                                                                */
/* ------------------------------------------------------------------ */

const easeLabel = (ease: Ease | undefined) =>
    ease?.startsWith("bezier:") ? "Custom curve" : ease?.startsWith("spring:") ? "Spring" : (KEY_EASES.find((item) => item.value === (ease ?? "ease"))?.label ?? "Ease");

/** The effects library: whole moves written as keyframes at the playhead, previewed on hover. */
function EffectsLibrary({ anchor, textual, onApply }: { anchor: React.RefObject<HTMLElement | null>; textual: boolean; onApply: (preset: EffectPreset) => void }) {
    const categories: EffectCategory[] = ["Entrances", "Text", "Attention", "Loops", "Exits"];
    const [category, setCategory] = useState<EffectCategory>("Entrances");
    // Placed against the window, not the button: the timeline sits at the foot
    // of the screen, so the library opens upwards when there is more room
    // above, stays inside the window sideways, and scrolls within whatever
    // height it gets.
    const [place, setPlace] = useState<React.CSSProperties>({ visibility: "hidden" });
    useLayoutEffect(() => {
        const measure = () => {
            const rect = anchor.current?.getBoundingClientRect();
            if (!rect) return;
            const margin = 12;
            const width = Math.min(480, window.innerWidth - margin * 2);
            const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
            const below = window.innerHeight - rect.bottom - margin - 6;
            const above = rect.top - margin - 6;
            const up = below < 380 && above > below;
            setPlace({
                left,
                width,
                maxHeight: Math.max(200, up ? above : below),
                ...(up ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
            });
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [anchor]);
    return (
        <div className="fixed z-[300] flex flex-col rounded-2xl bg-ed-menu p-3 shadow-[var(--ed-dock-shadow)]" style={place}>
            <div className="mb-2.5 flex shrink-0 flex-wrap gap-1">
                {categories.map((item) => (
                    <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${category === item ? "bg-[var(--ed-accent)] text-white" : "text-ed-muted hover:bg-ed-menu-hover hover:text-ed-text"}`}>
                        {item}
                    </button>
                ))}
            </div>
            {category === "Text" && !textual && <p className="mb-2 shrink-0 text-[11px] text-ed-faint">Text effects play letter by letter — select a text layer for these.</p>}
            <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(100px,1fr))] content-start gap-2 overflow-y-auto pr-0.5">
                {EFFECT_PRESETS.filter((preset) => preset.category === category).map((preset) => (
                    <EffectCard key={preset.id} preset={preset} disabled={Boolean(preset.text && !textual)} onApply={() => onApply(preset)} />
                ))}
            </div>
            <p className="mt-2.5 shrink-0 text-[11px] leading-relaxed text-ed-faint">Written as ordinary keyframes from the playhead — drag, retime and recurve them after.</p>
        </div>
    );
}

function EffectCard({ preset, disabled, onApply }: { preset: EffectPreset; disabled: boolean; onApply: () => void }) {
    const box = useRef<HTMLSpanElement>(null);
    const runs = useRef<Animation[]>([]);
    const play = () => {
        const target = box.current;
        if (!target || typeof target.animate !== "function") return;
        for (const run of runs.current) run.cancel();
        const motion = { ...preset.build(), split: undefined };
        const built = motionTracks(motion);
        const property = (name: string) => name.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
        runs.current = built.tracks.map((track) => {
            try {
                return target.animate(track.frames.map((frame) => ({ offset: frame.offset, easing: frame.easing, [property(track.property)]: frame.value })), { duration: built.duration, iterations: motion.repeat && motion.repeat !== "once" ? 2 : 1, direction: motion.repeat === "pingpong" ? "alternate" : "normal" });
            } catch {
                return target.animate([], 1);
            }
        });
        if (motion.origin) target.style.transformOrigin = `${motion.origin.x}% ${motion.origin.y}%`;
    };
    return (
        <button type="button" disabled={disabled} onMouseEnter={play} onFocus={play} onClick={onApply}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-ed-surface p-2 text-[11px] text-ed-text shadow-[inset_0_0_0_1px_var(--ed-border)] transition-colors hover:shadow-[inset_0_0_0_1.5px_var(--ed-accent)] disabled:opacity-35">
            <span className="grid h-12 w-full place-items-center overflow-hidden rounded-lg bg-ed-subtle [perspective:300px]">
                <span ref={box} className="grid h-6 w-9 place-items-center rounded-md bg-[var(--ed-accent)] text-[9px] font-bold text-white">{preset.text ? "Aa" : ""}</span>
            </span>
            <span className="w-full truncate text-center leading-tight">{preset.name}</span>
        </button>
    );
}

/**
 * The curve between two keyframes, drawn by hand: two handles of a cubic
 * bezier, which can reach above and below the line for overshoot and
 * anticipation, or a spring with its stiffness and damping.
 */
function CurveEditor({ at, onApply, onClose }: { at: CurveEditing; onApply: (ease: Ease | undefined) => void; onClose: () => void }) {
    const initial = bezierOf(at.ease) ?? [0.25, 0.1, 0.25, 1];
    const [points, setPoints] = useState<[number, number, number, number]>(initial);
    const isSpring = at.ease?.startsWith("spring:") ?? false;
    const [springMode, setSpringMode] = useState(isSpring);
    const [spring, setSpring] = useState<[number, number]>(isSpring ? (at.ease!.slice(7).split(",").map(Number) as [number, number]) : [180, 12]);
    const size = 200;
    const pad = 24;
    const inner = size - pad * 2;
    // y from -0.6 to 1.6 so handles can overshoot and anticipate.
    const sx = (x: number) => pad + x * inner;
    const sy = (y: number) => pad + ((1.6 - y) / 2.2) * inner;
    const fromScreen = (px: number, py: number): [number, number] => [Math.min(1, Math.max(0, (px - pad) / inner)), Math.min(1.6, Math.max(-0.6, 1.6 - ((py - pad) / inner) * 2.2))];
    const svg = useRef<SVGSVGElement>(null);
    const bezier = (p: [number, number, number, number]) => `bezier:${p.map((value) => Math.round(value * 100) / 100).join(",")}` as Ease;

    const drag = (handle: 0 | 1) => (event: React.PointerEvent) => {
        event.stopPropagation();
        const target = event.currentTarget as SVGElement;
        target.setPointerCapture(event.pointerId);
        let latest = points;
        const move = (moveEvent: PointerEvent) => {
            const rect = svg.current!.getBoundingClientRect();
            const [x, y] = fromScreen(((moveEvent.clientX - rect.left) / rect.width) * size, ((moveEvent.clientY - rect.top) / rect.height) * size);
            latest = handle === 0 ? [x, y, latest[2], latest[3]] : [latest[0], latest[1], x, y];
            setPoints(latest);
        };
        const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            setSpringMode(false);
            onApply(bezier(latest));
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
    };

    const springPath = () => {
        const { points: samples } = springCurve({ stiffness: spring[0], damping: spring[1], mass: 1 });
        return samples.map((value, index) => `${index ? "L" : "M"} ${sx(index / (samples.length - 1))} ${sy(value)}`).join(" ");
    };
    const left = Math.min(at.x, window.innerWidth - 260);
    const top = Math.max(12, Math.min(at.y - 300, window.innerHeight - 340));
    return (
        <div data-curve-editor="" className="fixed z-[320] w-[248px] rounded-2xl bg-ed-menu p-3 shadow-[var(--ed-dock-shadow)]" style={{ left, top }}>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ed-text">Curve</span>
                <button type="button" aria-label="Close" onClick={onClose} className="grid size-6 place-items-center rounded-md text-ed-muted hover:bg-ed-menu-hover"><IconX size={12} /></button>
            </div>
            <div className="mb-2 flex rounded-lg bg-ed-field p-0.5 text-[11px]">
                <button type="button" onClick={() => { setSpringMode(false); onApply(bezier(points)); }} className={`flex-1 rounded-md py-1 ${!springMode ? "bg-ed-surface font-medium shadow-sm" : "text-ed-muted"}`}>Bezier</button>
                <button type="button" onClick={() => { setSpringMode(true); onApply(`spring:${spring[0]},${spring[1]}`); }} className={`flex-1 rounded-md py-1 ${springMode ? "bg-ed-surface font-medium shadow-sm" : "text-ed-muted"}`}>Spring</button>
            </div>
            <svg ref={svg} viewBox={`0 0 ${size} ${size}`} className="w-full touch-none rounded-xl bg-ed-surface" aria-label="Curve editor">
                <rect x={sx(0)} y={sy(1)} width={inner} height={sy(0) - sy(1)} fill="none" stroke="var(--ed-border)" strokeDasharray="3 3" />
                <path d={`M ${sx(0)} ${sy(0)} L ${sx(1)} ${sy(1)}`} stroke="var(--ed-border)" />
                {springMode ? (
                    <path d={springPath()} fill="none" stroke="var(--ed-accent)" strokeWidth={2.2} />
                ) : (
                    <>
                        <line x1={sx(0)} y1={sy(0)} x2={sx(points[0])} y2={sy(points[1])} stroke="var(--ed-text-muted)" strokeWidth={1} />
                        <line x1={sx(1)} y1={sy(1)} x2={sx(points[2])} y2={sy(points[3])} stroke="var(--ed-text-muted)" strokeWidth={1} />
                        <path d={`M ${sx(0)} ${sy(0)} C ${sx(points[0])} ${sy(points[1])}, ${sx(points[2])} ${sy(points[3])}, ${sx(1)} ${sy(1)}`} fill="none" stroke="var(--ed-accent)" strokeWidth={2.2} />
                        <circle cx={sx(points[0])} cy={sy(points[1])} r={7} fill="var(--ed-surface)" stroke="var(--ed-accent)" strokeWidth={2} className="cursor-grab" onPointerDown={drag(0)} />
                        <circle cx={sx(points[2])} cy={sy(points[3])} r={7} fill="var(--ed-surface)" stroke="var(--ed-accent)" strokeWidth={2} className="cursor-grab" onPointerDown={drag(1)} />
                    </>
                )}
            </svg>
            {springMode ? (
                <div className="mt-2 space-y-1.5 text-[11px] text-ed-muted">
                    {(["Stiffness", "Damping"] as const).map((label, index) => (
                        <label key={label} className="flex items-center gap-2">
                            <span className="w-16">{label}</span>
                            <input type="range" min={index ? 1 : 10} max={index ? 60 : 600} value={spring[index]}
                                onChange={(event) => setSpring((current) => (index ? [current[0], Number(event.target.value)] : [Number(event.target.value), current[1]]))}
                                onPointerUp={() => onApply(`spring:${spring[0]},${spring[1]}`)}
                                className="flex-1 accent-[var(--ed-accent)]" />
                            <span className="w-8 text-right font-mono">{spring[index]}</span>
                        </label>
                    ))}
                </div>
            ) : (
                <p className="mt-2 text-center font-mono text-[10px] text-ed-faint">cubic-bezier({points.map((value) => Math.round(value * 100) / 100).join(", ")})</p>
            )}
            <div className="mt-2 grid grid-cols-3 gap-1">
                {KEY_EASES.filter((item) => item.bezier).map((item) => (
                    <button key={item.value} type="button" onClick={() => { setSpringMode(false); setPoints(item.bezier!); onApply(item.value); }} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-ed-muted hover:bg-ed-menu-hover hover:text-ed-text">
                        <EaseIcon ease={item.value} /> <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function EntranceClip({ row, zoom, isSelected, drag, entranceEnd, onDrag }: {
    row: Row;
    zoom: number;
    isSelected: boolean;
    drag?: ClipDrag;
    entranceEnd: (row: Row) => { length: number; tail: number; parts: number };
    onDrag: (event: React.PointerEvent, row: Row, mode: ClipDrag["mode"]) => void;
}) {
    const { length: length0, tail, parts } = entranceEnd(row);
    const start = drag?.start ?? row.style.entranceDelay;
    const length = drag?.length ?? length0;
    const spring = row.style.entranceCurve === "spring";
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clips are dragged with the pointer
        <div
            className={`absolute top-[5px] cursor-grab overflow-hidden rounded-[7px] active:cursor-grabbing ${isSelected ? "text-white" : "text-ed-text"}`}
            style={{
                left: start * zoom,
                width: Math.max(12, (length + tail) * zoom),
                height: LAYER_ROW - 10,
                background: isSelected ? "var(--ed-accent)" : "color-mix(in srgb, var(--ed-accent) 16%, var(--ed-surface))",
                boxShadow: isSelected ? "0 0 0 1px var(--ed-accent)" : "inset 0 0 0 1px color-mix(in srgb, var(--ed-accent) 30%, transparent)",
            }}
            onPointerDown={(event) => onDrag(event, row, "move")}
        >
            <ClipCurve style={row.style} width={Math.max(12, length * zoom)} height={LAYER_ROW - 10} />
            <span className="pointer-events-none relative flex h-full items-center gap-1.5 truncate px-2 text-[11px] font-medium">
                {ENTRANCES.find((item) => item.value === row.style.entrance)?.label}
                <span className="font-normal opacity-60">{length}ms</span>
            </span>
            {tail > 0 && (
                <span className="pointer-events-none absolute inset-y-0" style={{ left: length * zoom, width: tail * zoom }}>
                    <span className="absolute inset-0 opacity-25" style={{ backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 6px)" }} />
                    {Array.from({ length: Math.min(parts - 1, 60) }, (_, index) => (
                        <span key={index} className="absolute bottom-1 h-1.5 w-px bg-current opacity-60" style={{ left: (index + 1) * row.style.entranceStagger * zoom - 1 }} />
                    ))}
                </span>
            )}
            <span role="separator" aria-label="Trim start" className="absolute inset-y-0 left-0 w-2 cursor-col-resize hover:bg-white/30" onPointerDown={(event) => onDrag(event, row, "start")} />
            {!spring && <span role="separator" aria-label="Trim end" className="absolute inset-y-0 w-2 cursor-col-resize hover:bg-white/30" style={{ left: Math.max(2, length * zoom - 8) }} onPointerDown={(event) => onDrag(event, row, "end")} />}
        </div>
    );
}

function ClipCurve({ style, width, height }: { style: ElementStyle; width: number; height: number }) {
    let path: string;
    if (style.entranceCurve === "spring") {
        const { points } = springCurve({ stiffness: style.springStiffness, damping: style.springDamping, mass: style.springMass ?? 1 });
        const top = Math.max(1, ...points);
        path = points.map((value, index) => `${index ? "L" : "M"} ${(index / (points.length - 1)) * width} ${(1 - value / top) * (height - 4) + 2}`).join(" ");
    } else {
        const [x1 = 0.44, y1 = 0, x2 = 0.56, y2 = 1] = style.entranceBezier.split(",").map((part) => Number(part.trim()));
        const sy = (value: number) => (1 - value) * (height - 4) + 2;
        path = `M 0 ${sy(0)} C ${x1 * width} ${sy(y1)}, ${x2 * width} ${sy(y2)}, ${width} ${sy(1)}`;
    }
    return (
        <svg className="pointer-events-none absolute left-0 top-0" width={width} height={height} aria-hidden="true">
            <path d={path} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.28} />
        </svg>
    );
}

/** The property's value over time (wiggle included), drawn faintly behind its keyframes. */
function ValueCurve({ motion, prop, rest, color, zoom, span, height }: { motion: LayerMotion; prop: KeyProp; rest: number; color: string; zoom: number; span: number; height: number }) {
    const end = Math.max(motionDuration(motion), (motion.tracks[prop] ?? []).at(-1)?.t ?? 0);
    const samples: Array<[number, number]> = [];
    const count = Math.max(40, Math.min(600, Math.round((end * zoom) / 3)));
    for (let i = 0; i <= count; i++) {
        const t = (end * i) / count;
        samples.push([t, Number(wiggledAt(motion, prop, t, rest))]);
    }
    const values = samples.map(([, value]) => value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const range = high - low || 1;
    const y = (value: number) => height - 4 - ((value - low) / range) * (height - 8);
    const last = samples[samples.length - 1]!;
    const d = `M 0 ${y(samples[0]![1])} ${samples.map(([t, value]) => `L ${t * zoom} ${y(value)}`).join(" ")} L ${span * zoom} ${y(last[1])}`;
    return (
        <svg className="pointer-events-none absolute left-0 top-0" width={span * zoom} height={height} aria-hidden="true">
            <path d={d} fill="none" stroke={color} strokeWidth={1.4} opacity={0.5} />
        </svg>
    );
}

/** A colour track: the colours themselves, blending from keyframe to keyframe. */
function ColorStrip({ keys, zoom, span, height }: { keys: Keyframe[]; zoom: number; span: number; height: number }) {
    const from = keys[0]!.t;
    const to = keys[keys.length - 1]!.t;
    const stops = keys.map((key) => `${String(key.v)} ${to > from ? ((key.t - from) / (to - from)) * 100 : 0}%`).join(",");
    return (
        <span className="pointer-events-none absolute rounded-full opacity-80" style={{ left: 0, width: span * zoom, top: height / 2 - 3, height: 6, backgroundImage: `linear-gradient(90deg, ${String(keys[0]!.v)} 0, ${String(keys[0]!.v)} ${from * zoom}px, transparent ${from * zoom}px), linear-gradient(90deg, ${keys.length > 1 ? stops : `${String(keys[0]!.v)} 0%, ${String(keys[0]!.v)} 100%`})`, backgroundSize: `100% 100%, ${Math.max(1, (to - from) * zoom)}px 100%`, backgroundPosition: `0 0, ${from * zoom}px 0`, backgroundRepeat: "no-repeat" }} />
    );
}

function KeyMark({ left, ease, color, picked, title, onPointerDown, onDoubleClick, onContextMenu }: {
    left: number;
    ease?: Ease;
    color: string;
    picked: boolean;
    title: string;
    onPointerDown: (event: React.PointerEvent) => void;
    onDoubleClick: (event: React.MouseEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
}) {
    // After Effects draws its keyframes by curve: diamond, rounded, square for hold.
    const custom = ease?.startsWith("bezier:") || ease?.startsWith("spring:");
    const shape = ease === "hold" ? "rounded-[1px]" : ease === "linear" ? "rotate-45 rounded-[1px]" : "rotate-45 rounded-[4px]";
    return (
        <span
            role="button"
            tabIndex={-1}
            title={title}
            aria-label={title}
            onPointerDown={onPointerDown}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            className={`absolute top-1/2 z-[2] size-[11px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize border-[1.5px] ${shape}`}
            style={{
                left,
                borderColor: picked ? "#ef4444" : color,
                background: picked ? "#ef4444" : ease === "back" || custom ? "var(--ed-surface)" : color,
                boxShadow: picked ? "0 0 0 2px color-mix(in srgb, #ef4444 30%, transparent)" : custom ? `inset 0 0 0 2px ${color}` : undefined,
            }}
        />
    );
}

function EaseIcon({ ease }: { ease: Ease }) {
    const bezier = bezierOf(ease);
    const path = bezier
        ? `M 1 15 C ${1 + bezier[0] * 14} ${15 - bezier[1] * 14}, ${1 + bezier[2] * 14} ${15 - bezier[3] * 14}, 15 1`
        : Array.from({ length: 16 }, (_, i) => `${i ? "L" : "M"} ${1 + i * (14 / 15)} ${15 - easeAt(ease, i / 15) * 14}`).join(" ");
    return (
        <svg width={16} height={16} viewBox="0 0 16 16" className="shrink-0 overflow-visible text-ed-muted" aria-hidden="true">
            <path d={path} fill="none" stroke="currentColor" strokeWidth={1.4} />
        </svg>
    );
}

/** A value you drag sideways to change, After Effects style; click it to type. */
function Scrubby({ value, spec, active, onChange, onStart, onEnd }: {
    value: number;
    spec: Pick<PropSpec, "step" | "unit" | "min" | "max">;
    active: boolean;
    onChange: (value: number) => void;
    onStart?: () => void;
    onEnd?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState("");
    const shown = Math.round(value * 10) / 10;
    if (editing) {
        return (
            <input
                // biome-ignore lint/a11y/noAutofocus: opened by a click on the value
                autoFocus
                value={text}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => {
                    setEditing(false);
                    const number = Number(text);
                    if (text.trim() !== "" && Number.isFinite(number) && number !== shown) {
                        onStart?.();
                        onChange(number);
                        onEnd?.();
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                    if (event.key === "Escape") setEditing(false);
                    event.stopPropagation();
                }}
                className="h-5 w-[62px] shrink-0 rounded bg-ed-surface px-1 text-right font-mono text-[11px] tabular-nums text-ed-text outline-none shadow-[inset_0_0_0_1px_var(--ed-accent)]"
            />
        );
    }
    return (
        <button
            type="button"
            title="Drag sideways to change, click to type · Shift for 10×"
            className={`h-5 w-[62px] shrink-0 cursor-ew-resize rounded px-1 text-right font-mono text-[11px] tabular-nums hover:bg-ed-field ${active ? "text-[var(--ed-accent)]" : "text-ed-text"}`}
            onPointerDown={(event) => {
                if (event.button !== 0) return;
                const target = event.currentTarget;
                target.setPointerCapture(event.pointerId);
                const originX = event.clientX;
                const from = value;
                let moved = false;
                const move = (moveEvent: PointerEvent) => {
                    const dx = moveEvent.clientX - originX;
                    if (!moved && Math.abs(dx) < 3) return;
                    if (!moved) onStart?.();
                    moved = true;
                    onChange(Math.min(spec.max, Math.max(spec.min, from + dx * spec.step * (moveEvent.shiftKey ? 10 : 1))));
                };
                const up = () => {
                    target.removeEventListener("pointermove", move);
                    target.removeEventListener("pointerup", up);
                    if (moved) onEnd?.();
                    else {
                        setText(String(shown));
                        setEditing(true);
                    }
                };
                target.addEventListener("pointermove", move);
                target.addEventListener("pointerup", up);
            }}
        >
            {shown}
            <span className="ml-0.5 text-ed-faint">{spec.unit}</span>
        </button>
    );
}

/** A colour value: a swatch that opens the picker; the picked colour is keyed at the playhead. */
function ColorValue({ value, active, onChange, onStart, onEnd }: { value: string; active: boolean; onChange: (value: string) => void; onStart?: () => void; onEnd?: () => void }) {
    return (
        <label className={`flex h-5 w-[62px] shrink-0 cursor-pointer items-center gap-1 rounded px-1 hover:bg-ed-field ${active ? "text-[var(--ed-accent)]" : "text-ed-text"}`} title="Pick a colour">
            <span className="size-3.5 shrink-0 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: value }} />
            <span className="truncate font-mono text-[10px]">{toHex(value).slice(1)}</span>
            <input type="color" className="sr-only" value={toHex(value)} onFocus={onStart} onBlur={onEnd} onChange={(event) => onChange(event.target.value)} />
        </label>
    );
}

function MiniSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
    return (
        <select aria-label={label} title={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-6 shrink-0 rounded-md bg-ed-field px-1 text-[10px] text-ed-muted outline-none hover:text-ed-text">
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
    );
}

function Tool({ label, ...props }: React.ComponentProps<"button"> & { label: string }) {
    return <button type="button" aria-label={label} title={label} className="grid size-7 place-items-center rounded-md text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text" {...props} />;
}

function Toggle({ on, label, ...props }: React.ComponentProps<"button"> & { on: boolean; label: string }) {
    return (
        <button type="button" aria-pressed={on} aria-label={label} title={label}
            className={`ml-1 grid size-7 place-items-center rounded-md transition-colors ${on ? "bg-[var(--ed-accent-soft)] text-[var(--ed-accent-hover)]" : "text-ed-muted hover:bg-ed-field hover:text-ed-text"}`}
            {...props} />
    );
}
