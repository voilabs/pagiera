import { createElement } from "./tree";
import type { CanvasElement } from "./types";

/**
 * The action engine: workflows an author wires on a layer.
 *
 * A workflow is a trigger and an ordered list of steps. Steps show, hide or
 * toggle other layers with an animation, wait, branch on a layer's state,
 * navigate or scroll. Everything is plain data: the published page runs one
 * fixed interpreter over it (`lib/render/actions.ts`), so no author code is
 * evaluated and a strict Content Security Policy is enough.
 *
 * Overlays — popover, modal, dropdown — are ordinary layers with an `overlay`
 * marker. The marker gives the target its runtime behaviour (starts closed,
 * Escape and outside clicks close it, a modal traps the backdrop) and its
 * default enter and exit animations; the trigger is any layer whose workflow
 * opens it.
 */

export type ActionAnimationType = "none" | "fade" | "slide" | "scale" | "zoom" | "blur" | "flip" | "pop";
export type ActionDirection = "up" | "down" | "left" | "right";

export type ActionAnimation = {
    type: ActionAnimationType;
    /** Where a slide or flip comes from. */
    direction?: ActionDirection;
    /** Slide distance in pixels. */
    distance?: number;
    duration: number;
    /** A cubic-bezier body such as `0.16, 1, 0.3, 1`. */
    bezier?: string;
};

export type ActionTrigger = "click" | "hover" | "mouseenter" | "mouseleave" | "load" | "visible";

export type ActionStep =
    | { kind: "show" | "hide" | "toggle"; target: string; animation?: ActionAnimation }
    | { kind: "wait"; ms: number }
    | { kind: "if"; target: string; state: "open" | "closed"; do: ActionStep[]; else?: ActionStep[] }
    | { kind: "navigate"; url: string; newTab?: boolean }
    | { kind: "scroll-to"; target: string };

export type ActionWorkflow = { trigger: ActionTrigger; steps: ActionStep[] };

export type OverlayKind = "popover" | "modal" | "dropdown";
export type Overlay = {
    kind: OverlayKind;
    /** Start open; otherwise the runtime hides it on load. */
    open?: boolean;
    closeOnEscape?: boolean;
    closeOnOutside?: boolean;
    /** Modal only: dims the page behind the panel. */
    backdrop?: boolean;
    enter?: ActionAnimation;
    exit?: ActionAnimation;
};

export const ACTION_TRIGGERS: Array<{ label: string; value: ActionTrigger }> = [
    { label: "Click", value: "click" },
    { label: "Hover (in and out)", value: "hover" },
    { label: "Pointer enters", value: "mouseenter" },
    { label: "Pointer leaves", value: "mouseleave" },
    { label: "Page loads", value: "load" },
    { label: "Scrolls into view", value: "visible" },
];

export const ACTION_STEP_KINDS: Array<{ label: string; value: ActionStep["kind"] }> = [
    { label: "Show layer", value: "show" },
    { label: "Hide layer", value: "hide" },
    { label: "Toggle layer", value: "toggle" },
    { label: "Wait", value: "wait" },
    { label: "If layer is…", value: "if" },
    { label: "Open link", value: "navigate" },
    { label: "Scroll to layer", value: "scroll-to" },
];

export const ACTION_ANIMATIONS: Array<{ label: string; value: ActionAnimationType }> = [
    { label: "Default", value: "none" },
    { label: "Fade", value: "fade" },
    { label: "Slide", value: "slide" },
    { label: "Scale", value: "scale" },
    { label: "Zoom", value: "zoom" },
    { label: "Blur", value: "blur" },
    { label: "Flip", value: "flip" },
    { label: "Pop", value: "pop" },
];

export const ACTION_DIRECTIONS: Array<{ label: string; value: ActionDirection }> = [
    { label: "From below", value: "up" },
    { label: "From above", value: "down" },
    { label: "From left", value: "left" },
    { label: "From right", value: "right" },
];

const MAX_WORKFLOWS = 8;
const MAX_STEPS = 24;
const MAX_DEPTH = 3;
const ANIMATIONS = ACTION_ANIMATIONS.map((item) => item.value);
const DIRECTIONS = ACTION_DIRECTIONS.map((item) => item.value);
const TRIGGERS = ACTION_TRIGGERS.map((item) => item.value);

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
}
function num(value: unknown, min: number, max: number, fallback: number) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}
function layerId(value: unknown) {
    return typeof value === "string" ? value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100) : "";
}
function bezier(value: unknown) {
    if (typeof value !== "string") return undefined;
    const parts = value.split(",").map((part) => Number(part.trim()));
    return parts.length === 4 && parts.every(Number.isFinite) ? parts.map((part) => Number(part.toFixed(3))).join(", ") : undefined;
}

export function normalizeAnimation(value: unknown): ActionAnimation | undefined {
    if (!value || typeof value !== "object") return undefined;
    const v = value as Record<string, unknown>;
    const type = pick(v.type, ANIMATIONS, "none");
    const animation: ActionAnimation = { type, duration: num(v.duration, 0, 5000, 260) };
    if (type === "slide" || type === "flip") animation.direction = pick(v.direction, DIRECTIONS, "up");
    if (type === "slide" && v.distance !== undefined) animation.distance = num(v.distance, 0, 2000, 24);
    const curve = bezier(v.bezier);
    if (curve) animation.bezier = curve;
    return animation;
}

function normalizeSteps(value: unknown, safeUrl: (url: unknown) => string | undefined, depth: number): ActionStep[] {
    if (!Array.isArray(value) || depth > MAX_DEPTH) return [];
    const steps: ActionStep[] = [];
    for (const raw of value.slice(0, MAX_STEPS)) {
        if (!raw || typeof raw !== "object") continue;
        const v = raw as Record<string, unknown>;
        switch (v.kind) {
            case "show":
            case "hide":
            case "toggle": {
                const target = layerId(v.target);
                if (!target) break;
                const animation = normalizeAnimation(v.animation);
                steps.push(animation ? { kind: v.kind, target, animation } : { kind: v.kind, target });
                break;
            }
            case "wait":
                steps.push({ kind: "wait", ms: num(v.ms, 0, 30000, 500) });
                break;
            case "if": {
                const target = layerId(v.target);
                if (!target) break;
                const step: ActionStep = {
                    kind: "if",
                    target,
                    state: pick(v.state, ["open", "closed"] as const, "open"),
                    do: normalizeSteps(v.do ?? v.then, safeUrl, depth + 1),
                };
                const otherwise = normalizeSteps(v.else, safeUrl, depth + 1);
                if (otherwise.length) step.else = otherwise;
                steps.push(step);
                break;
            }
            case "navigate": {
                const url = safeUrl(v.url);
                if (url) steps.push(v.newTab === true ? { kind: "navigate", url, newTab: true } : { kind: "navigate", url });
                break;
            }
            case "scroll-to": {
                const target = layerId(v.target);
                if (target) steps.push({ kind: "scroll-to", target });
                break;
            }
        }
    }
    return steps;
}

/** Validates stored or AI-written workflows; anything unknown is dropped. */
export function normalizeActions(value: unknown, safeUrl: (url: unknown) => string | undefined): ActionWorkflow[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const workflows = value
        .slice(0, MAX_WORKFLOWS)
        .filter((raw): raw is Record<string, unknown> => !!raw && typeof raw === "object")
        .map((raw) => ({ trigger: pick(raw.trigger, TRIGGERS, "click"), steps: normalizeSteps(raw.steps, safeUrl, 0) }))
        .filter((workflow) => workflow.steps.length > 0);
    return workflows.length ? workflows : undefined;
}

export function normalizeOverlay(value: unknown): Overlay | undefined {
    if (!value || typeof value !== "object") return undefined;
    const v = value as Record<string, unknown>;
    if (!["popover", "modal", "dropdown"].includes(v.kind as string)) return undefined;
    const overlay: Overlay = { kind: v.kind as OverlayKind };
    if (v.open === true) overlay.open = true;
    overlay.closeOnEscape = v.closeOnEscape !== false;
    overlay.closeOnOutside = v.closeOnOutside !== false;
    if (overlay.kind === "modal") overlay.backdrop = v.backdrop !== false;
    const enter = normalizeAnimation(v.enter);
    const exit = normalizeAnimation(v.exit);
    if (enter) overlay.enter = enter;
    if (exit) overlay.exit = exit;
    return overlay;
}

/** Every layer id a workflow points at, for remapping when layers are copied. */
export function remapActions(workflows: ActionWorkflow[] | undefined, map: (id: string) => string): ActionWorkflow[] | undefined {
    if (!workflows) return workflows;
    const steps = (list: ActionStep[]): ActionStep[] =>
        list.map((step) => {
            if (step.kind === "if") return { ...step, target: map(step.target), do: steps(step.do), else: step.else && steps(step.else) };
            if ("target" in step) return { ...step, target: map(step.target) };
            return step;
        });
    return workflows.map((workflow) => ({ ...workflow, steps: steps(workflow.steps) }));
}

/** The attributes the runtime reads. Targets stay raw layer ids; the runtime resolves them. */
export function actionAttributes(element: { actions?: ActionWorkflow[]; overlay?: Overlay }): Record<string, string | undefined> {
    return {
        "data-pg-actions": element.actions?.length ? JSON.stringify(element.actions) : undefined,
        "data-pg-overlay": element.overlay ? JSON.stringify(element.overlay) : undefined,
        "data-pg-open": element.overlay?.open ? "true" : undefined,
    };
}

export function hasActions(elements: Array<{ actions?: ActionWorkflow[]; overlay?: Overlay }>) {
    return elements.some((element) => element.actions?.length || element.overlay);
}

/* ---------------------------------------------------------------- presets */

const DEFAULT_ENTER: Record<OverlayKind, ActionAnimation> = {
    popover: { type: "scale", duration: 180 },
    dropdown: { type: "slide", direction: "down", distance: 8, duration: 200 },
    modal: { type: "zoom", duration: 260 },
};

/**
 * A trigger and its overlay as editable layers.
 *
 * The root holds both so the popover and dropdown can sit under their button;
 * the modal panel is fixed to the viewport instead.
 */
export function overlayPreset(kind: OverlayKind): CanvasElement[] {
    const elements: CanvasElement[] = [];
    function add(type: "Container" | "Button" | "Text", name: string, parentId?: string) {
        const el = createElement(type, { x: 0, y: 0, z: elements.length, parentId });
        el.name = name;
        el.base = { ...el.base, position: "static", layout: "stack", direction: "column", widthMode: "auto", heightMode: "auto", gap: 12, borderW: 0 };
        elements.push(el);
        return el;
    }
    const label = kind === "modal" ? "Modal" : kind === "popover" ? "Popover" : "Dropdown";
    const root = add("Container", label);
    root.base = { ...root.base, bg: "transparent" };
    const trigger = add("Button", `${label} trigger`, root.id);
    trigger.content = kind === "modal" ? "Open modal" : kind === "dropdown" ? "Menu ▾" : "Details";
    trigger.base = { ...trigger.base, bg: "#251a35", color: "#ffffff", radius: 10, padT: 12, padB: 12, padL: 18, padR: 18, cursor: "pointer" };
    const panel = add("Container", `${label} panel`, root.id);
    panel.overlay = { kind, closeOnEscape: true, closeOnOutside: true, backdrop: kind === "modal" ? true : undefined, enter: DEFAULT_ENTER[kind] };
    panel.base = { ...panel.base, bg: "#ffffff", color: "#251a35", radius: 14, padT: 20, padB: 20, padL: 20, padR: 20, shadow: "0 18px 48px rgba(37,26,53,.18)", zIndex: 50 };
    if (kind === "modal") {
        panel.base = { ...panel.base, position: "fixed", widthMode: "fixed", w: 440, x: 0, y: 120, padT: 32, padB: 32, padL: 32, padR: 32 };
    } else {
        panel.base = { ...panel.base, position: "absolute", widthMode: "fixed", w: kind === "dropdown" ? 220 : 280, x: 0, y: 52 };
    }
    const text = add("Text", `${label} content`, panel.id);
    text.content = kind === "dropdown" ? "Menu item" : "Design this panel with any layers.";
    text.base = { ...text.base, color: "#51465f" };
    if (kind === "modal") {
        const close = add("Button", "Close", panel.id);
        close.content = "Close";
        close.base = { ...close.base, bg: "#ece7f5", color: "#251a35", radius: 8, padT: 10, padB: 10, padL: 16, padR: 16, cursor: "pointer" };
        close.actions = [{ trigger: "click", steps: [{ kind: "hide", target: panel.id }] }];
    }
    trigger.actions = [{ trigger: "click", steps: [{ kind: kind === "modal" ? "show" : "toggle", target: panel.id }] }];
    return elements;
}
