import type { ActionAnimation, ActionStep, ActionWorkflow, Overlay } from "../editor/actions";
import { actionFrame, actionTiming, type MotionFrame } from "../editor/motion";

/**
 * Interprets the workflows `lib/editor/actions.ts` describes.
 *
 * Workflows arrive as JSON in `data-pg-actions`; this is the only code that
 * runs, so nothing is evaluated and a page under a strict Content Security
 * Policy behaves the same as the editor's preview. Animations use the Web
 * Animations API, which no policy restricts.
 *
 * Open state lives in `data-pg-open`, the same attribute the older
 * `interaction` toggle script writes, so a layer can be opened by either.
 */

/** Hides closed overlays before the runtime arrives, so they never flash. */
export const OVERLAY_CSS = '.pg-root [data-pg-overlay]:not([data-pg-open="true"]){display:none}';

const NONE: ActionAnimation = { type: "none", duration: 0 };

function parse<T>(value: string | undefined): T | undefined {
    if (!value) return undefined;
    try {
        return JSON.parse(value) as T;
    } catch {
        return undefined;
    }
}

function keyframe(frame: MotionFrame): Keyframe {
    const out: Keyframe = {};
    for (const [property, value] of Object.entries(frame)) if (value !== undefined) out[property] = value;
    return out;
}

/** Matches a layer on the published page (`id`) and on the editor canvas. */
function selectorFor(id: string) {
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `[data-canvas-element="${safe}"],#pg-${safe}`;
}

export function mountActions(root: HTMLElement) {
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const savedStyle = new Map<HTMLElement, string | null>();
    const backdrops = new Map<HTMLElement, HTMLElement>();
    const overlays = new Map<HTMLElement, Overlay>();
    const triggersOf = new Map<HTMLElement, Set<HTMLElement>>();
    const running = new Map<HTMLElement, Animation>();
    const observers: IntersectionObserver[] = [];

    /** Nearest match first, so each breakpoint frame on the canvas drives its own copy. */
    function resolve(from: HTMLElement, id: string) {
        const selector = selectorFor(id);
        for (let node: HTMLElement | null = from; node; node = node.parentElement) {
            const hit = node.querySelector<HTMLElement>(selector);
            if (hit) return hit;
            if (node === root) break;
        }
        return document.querySelector<HTMLElement>(selector) ?? undefined;
    }

    function remember(el: HTMLElement) {
        if (!savedStyle.has(el)) savedStyle.set(el, el.getAttribute("style"));
    }

    function isOpen(el: HTMLElement) {
        if (el.dataset.pgOpen) return el.dataset.pgOpen === "true";
        return getComputedStyle(el).display !== "none";
    }

    function setVisible(el: HTMLElement, open: boolean) {
        remember(el);
        el.dataset.pgOpen = open ? "true" : "false";
        el.setAttribute("aria-hidden", String(!open));
        if (open) {
            const original = savedStyle.get(el);
            const display = original?.match(/(?:^|;)\s*display\s*:\s*([^;!]+)/)?.[1]?.trim();
            if (display && display !== "none") el.style.setProperty("display", display);
            else el.style.removeProperty("display");
            if (getComputedStyle(el).display === "none") el.style.setProperty("display", el.dataset.pgDisplay || "flex", "important");
        } else {
            el.style.setProperty("display", "none", "important");
        }
        const backdrop = backdrops.get(el);
        if (backdrop) backdrop.style.display = open ? "block" : "none";
        for (const trigger of triggersOf.get(el) ?? []) trigger.setAttribute("aria-expanded", String(open));
    }

    async function play(el: HTMLElement, open: boolean, animation: ActionAnimation): Promise<Animation | undefined> {
        running.get(el)?.cancel();
        const frame = actionFrame(animation);
        if (reduced || animation.duration <= 0 || Object.keys(frame).length === 0 || typeof el.animate !== "function") return;
        const { duration, easing } = actionTiming(animation);
        const hidden = keyframe(frame);
        const run = el.animate(open ? [hidden, {}] : [{}, hidden], { duration, easing, fill: open ? "none" : "forwards" });
        running.set(el, run);
        const backdrop = backdrops.get(el);
        backdrop?.animate(open ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" });
        try {
            // A background tab may not advance animations; the timer keeps a
            // workflow from stalling there.
            await Promise.race([run.finished, new Promise((done) => setTimeout(done, duration + 60))]);
        } catch {
            // Cancelled by a newer show or hide; that one owns the element now.
        }
        if (running.get(el) === run) running.delete(el);
        return run;
    }

    function animationFor(el: HTMLElement, open: boolean, step?: ActionAnimation) {
        if (step && step.type !== "none") return step;
        const overlay = overlays.get(el);
        const own = open ? overlay?.enter : (overlay?.exit ?? overlay?.enter);
        return own ?? NONE;
    }

    async function show(el: HTMLElement, open: boolean, step?: ActionAnimation) {
        if (open === isOpen(el) && !running.has(el)) return;
        const host = el as unknown as { __pgHide?: object };
        if (open) {
            host.__pgHide = undefined;
            setVisible(el, true);
            await play(el, true, animationFor(el, true, step));
        } else {
            // `data-pg-open` stays true until the exit has played: the stylesheet
            // hides a closed overlay at once, which would cut the animation.
            const token = {};
            host.__pgHide = token;
            const run = await play(el, false, animationFor(el, false, step));
            if (host.__pgHide === token) setVisible(el, false);
            // Held on its last frame by `fill: forwards` until display is off.
            run?.cancel();
        }
    }

    function wait(ms: number) {
        return new Promise<void>((done) => {
            const timer = setTimeout(done, ms);
            signal.addEventListener("abort", () => { clearTimeout(timer); done(); }, { once: true });
        });
    }

    async function run(from: HTMLElement, steps: ActionStep[], invert = false): Promise<void> {
        for (const step of steps) {
            if (signal.aborted) return;
            switch (step.kind) {
                case "show":
                case "hide":
                case "toggle": {
                    const target = resolve(from, step.target);
                    if (!target) break;
                    let open = step.kind === "toggle" ? !isOpen(target) : step.kind === "show";
                    if (invert && step.kind !== "toggle") open = !open;
                    await show(target, open, step.animation);
                    break;
                }
                case "wait":
                    if (!invert) await wait(step.ms);
                    break;
                case "if": {
                    const target = resolve(from, step.target);
                    const open = target ? isOpen(target) : false;
                    await run(from, (open === (step.state === "open") ? step.do : step.else) ?? [], invert);
                    break;
                }
                case "navigate":
                    if (invert) break;
                    if (step.newTab) window.open(step.url, "_blank", "noopener,noreferrer");
                    else window.location.assign(step.url);
                    return;
                case "scroll-to":
                    if (!invert) resolve(from, step.target)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                    break;
            }
        }
    }

    function targetsOf(steps: ActionStep[], out: string[] = []) {
        for (const step of steps) {
            if (step.kind === "if") {
                targetsOf(step.do, out);
                targetsOf(step.else ?? [], out);
            } else if (step.kind === "show" || step.kind === "hide" || step.kind === "toggle") out.push(step.target);
        }
        return out;
    }

    // Overlays first, so triggers bound below already see them closed.
    for (const el of root.querySelectorAll<HTMLElement>("[data-pg-overlay]")) {
        const overlay = parse<Overlay>(el.dataset.pgOverlay);
        if (!overlay) continue;
        remember(el);
        overlays.set(el, overlay);
        if (overlay.kind === "modal") {
            el.setAttribute("role", "dialog");
            el.setAttribute("aria-modal", "true");
            el.style.setProperty("inset", "0");
            el.style.setProperty("margin", "auto");
            el.style.setProperty("height", "fit-content");
            el.style.setProperty("max-width", "calc(100vw - 32px)");
            if (overlay.backdrop !== false) {
                const backdrop = document.createElement("div");
                backdrop.setAttribute("data-pg-backdrop", "");
                const z = Number(getComputedStyle(el).zIndex);
                backdrop.style.cssText = `position:fixed;inset:0;background:rgba(15,10,25,.5);display:none;z-index:${Number.isFinite(z) ? z - 1 : 49}`;
                if (overlay.closeOnOutside !== false) backdrop.addEventListener("click", () => void show(el, false), { signal });
                el.before(backdrop);
                backdrops.set(el, backdrop);
            }
        }
        setVisible(el, overlay.open === true);
    }

    for (const trigger of root.querySelectorAll<HTMLElement>("[data-pg-actions]")) {
        const workflows = parse<ActionWorkflow[]>(trigger.dataset.pgActions);
        if (!workflows) continue;
        for (const workflow of workflows) {
            for (const id of targetsOf(workflow.steps)) {
                const target = resolve(trigger, id);
                if (!target) continue;
                if (!triggersOf.has(target)) triggersOf.set(target, new Set());
                triggersOf.get(target)?.add(trigger);
                if (workflow.trigger === "click") trigger.setAttribute("aria-expanded", String(isOpen(target)));
            }
            const start = () => void run(trigger, workflow.steps);
            switch (workflow.trigger) {
                case "click":
                    trigger.addEventListener("click", (event) => {
                        if (!workflow.steps.some((step) => step.kind === "navigate")) event.preventDefault();
                        event.stopPropagation();
                        start();
                    }, { signal });
                    break;
                case "hover":
                    trigger.addEventListener("mouseenter", start, { signal });
                    trigger.addEventListener("mouseleave", () => void run(trigger, workflow.steps, true), { signal });
                    break;
                case "mouseenter":
                case "mouseleave":
                    trigger.addEventListener(workflow.trigger, start, { signal });
                    break;
                case "load":
                    start();
                    break;
                case "visible": {
                    const observer = new IntersectionObserver((entries) => {
                        if (entries.some((entry) => entry.isIntersecting)) {
                            observer.disconnect();
                            start();
                        }
                    });
                    observer.observe(trigger);
                    observers.push(observer);
                    break;
                }
            }
        }
    }

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        for (const [el, overlay] of overlays) if (overlay.closeOnEscape !== false && isOpen(el)) void show(el, false);
    }, { signal });

    document.addEventListener("pointerdown", (event) => {
        const target = event.target as Node | null;
        if (!target) return;
        for (const [el, overlay] of overlays) {
            if (overlay.closeOnOutside === false || !isOpen(el) || el.contains(target)) continue;
            if ([...(triggersOf.get(el) ?? [])].some((trigger) => trigger.contains(target))) continue;
            if (backdrops.get(el)?.contains(target)) continue;
            void show(el, false);
        }
    }, { signal });

    return () => {
        controller.abort();
        for (const observer of observers) observer.disconnect();
        for (const animation of running.values()) animation.cancel();
        for (const backdrop of backdrops.values()) backdrop.remove();
        savedStyle.forEach((style, el) => {
            if (style === null) el.removeAttribute("style");
            else el.setAttribute("style", style);
            delete el.dataset.pgOpen;
            el.removeAttribute("aria-hidden");
            if (overlays.get(el)?.kind === "modal") { el.removeAttribute("role"); el.removeAttribute("aria-modal"); }
        });
        for (const triggers of triggersOf.values()) for (const trigger of triggers) trigger.removeAttribute("aria-expanded");
    };
}
