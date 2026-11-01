import type { ActionGraph, GraphNode } from "../editor/action-graph";
import type { ActionAnimation, ActionAnimationType, ActionStep, ActionWorkflow, Overlay } from "../editor/actions";
import { type CustomAnimation, EASING_PRESETS, isCustomAnimation, timelineFor } from "../editor/custom-animation";
import { actionFrame, actionTiming, type MotionFrame, springCurve } from "../editor/motion";

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

/**
 * The page's action graph travels as JSON in a `<script type="application/json"
 * data-pg-graph>` inside the root, with `<` escaped so no value can close it.
 */
export function graphScriptJson(graph: ActionGraph | undefined, animations?: CustomAnimation[]) {
    return JSON.stringify({ ...(graph ?? { nodes: [], links: [], variables: [] }), animations: animations ?? [] }).replace(/</g, "\\u003c");
}

type PageGraph = ActionGraph & { animations?: CustomAnimation[] };

export function mountActions(root: HTMLElement, graph?: ActionGraph, animations?: CustomAnimation[]) {
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const savedStyle = new Map<HTMLElement, string | null>();
    const backdrops = new Map<HTMLElement, HTMLElement>();
    const overlays = new Map<HTMLElement, Overlay>();
    const triggersOf = new Map<HTMLElement, Set<HTMLElement>>();
    const running = new Map<HTMLElement, Animation>();
    const observers: IntersectionObserver[] = [];
    const sliding = new Map<HTMLElement, Animation>();

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

    async function play(el: HTMLElement, open: boolean, animation: ActionAnimation, delay = 0): Promise<Animation | undefined> {
        running.get(el)?.cancel();
        const frame = actionFrame(animation);
        if (reduced || animation.duration <= 0 || Object.keys(frame).length === 0 || typeof el.animate !== "function") return;
        const { duration, easing } = actionTiming(animation);
        const hidden = keyframe(frame);
        // An entrance waiting on its room holds its first frame until it starts.
        const run = el.animate(open ? [hidden, {}] : [{}, hidden], { duration, easing, delay, fill: open ? "backwards" : "forwards" });
        running.set(el, run);
        const backdrop = backdrops.get(el);
        backdrop?.animate(open ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" });
        try {
            // A background tab may not advance animations; the timer keeps a
            // workflow from stalling there.
            await Promise.race([run.finished, new Promise((done) => setTimeout(done, duration + delay + 60))]);
        } catch {
            // Cancelled by a newer show or hide; that one owns the element now.
        }
        if (running.get(el) === run) running.delete(el);
        return run;
    }

    /** Whether the layer takes room in the page flow, so showing or hiding it moves what follows. */
    function inFlow(el: HTMLElement) {
        if (overlays.has(el)) return false;
        const position = getComputedStyle(el).position;
        return position !== "absolute" && position !== "fixed";
    }

    /** A sibling that shares the parent's gap with the layer. */
    function hasShownSibling(node: Element | null, next: boolean) {
        for (let item = node; item; item = next ? item.nextElementSibling : item.previousElementSibling)
            if (item instanceof HTMLElement && !item.hasAttribute("data-pg-backdrop") && item.tagName !== "SCRIPT" && getComputedStyle(item).display !== "none")
                return true;
        return false;
    }

    /**
     * Opens or closes the room an in-flow layer takes, so the content after
     * it slides instead of jumping. The layer must be displayed while this
     * runs. Size, padding and margin go to zero along the axis its parent
     * stacks on (width in a row, height otherwise) and the parent's gap is
     * taken back with a negative margin, so nothing snaps at either end.
     */
    function slide(el: HTMLElement, open: boolean, duration: number, easing: string, delay = 0) {
        sliding.get(el)?.cancel();
        sliding.delete(el);
        if (reduced || duration <= 0 || typeof el.animate !== "function" || !inFlow(el)) return undefined;
        const parent = el.parentElement ? getComputedStyle(el.parentElement) : undefined;
        const row = Boolean(parent?.display.includes("flex") && !parent.flexDirection.startsWith("column"));
        const style = getComputedStyle(el);
        const [size, padA, padB, marA, marB] = row
            ? (["width", "paddingLeft", "paddingRight", "marginLeft", "marginRight"] as const)
            : (["height", "paddingTop", "paddingBottom", "marginTop", "marginBottom"] as const);
        const gap = Number.parseFloat((row ? parent?.columnGap : parent?.rowGap) ?? "") || 0;
        const before = hasShownSibling(el.previousElementSibling, false);
        const after = hasShownSibling(el.nextElementSibling, true);
        const min = row ? "minWidth" : "minHeight";
        const full: Keyframe = { [size]: style[size], [padA]: style[padA], [padB]: style[padB], [marA]: style[marA], [marB]: style[marB], [min]: "0px", overflow: "hidden" };
        const closed: Keyframe = {
            [size]: "0px",
            [padA]: "0px",
            [padB]: "0px",
            // The gap before (or after) it closes with it.
            [marA]: gap && before ? `${-gap}px` : "0px",
            [marB]: gap && !before && after ? `${-gap}px` : "0px",
            [min]: "0px",
            overflow: "hidden",
        };
        if (row) {
            Object.assign(full, { flexGrow: 0, flexShrink: 0 });
            Object.assign(closed, { flexGrow: 0, flexShrink: 0 });
        }
        const run = el.animate(open ? [closed, full] : [full, closed], { duration, easing, delay, fill: open ? "none" : "forwards" });
        sliding.set(el, run);
        return run;
    }

    /** How long a layer's room takes to open or close next to an animation of `duration`. */
    function roomTime(duration: number) {
        return Math.round(Math.min(380, Math.max(200, duration * 0.45)));
    }

    /** Waits for an animation without trusting a background tab to advance it. */
    async function settle(run: Animation | undefined, duration: number) {
        if (!run) return;
        try {
            await Promise.race([run.finished, new Promise((done) => setTimeout(done, duration + 80))]);
        } catch {
            // Cancelled by a newer change to the same layer.
        }
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
        const animation = animationFor(el, open, step);
        // The room it takes opens and closes over the same time, so what
        // follows it slides along; with no animation it still slides briefly.
        const timing = animation.duration > 0 ? actionTiming(animation) : { duration: 0, easing: EASING_PRESETS.smooth! };
        const roomMs = roomTime(timing.duration);
        if (open) {
            host.__pgHide = undefined;
            setVisible(el, true);
            // The room opens first and the entrance plays into it once it is
            // there: run together, an entrance that moves the layer drags a
            // squashed sliver of it over what follows.
            const room = slide(el, true, roomMs, EASING_PRESETS.smooth!);
            await Promise.all([play(el, true, animation, room ? roomMs : 0), settle(room, roomMs)]);
            if (room && sliding.get(el) === room) sliding.delete(el);
        } else {
            // `data-pg-open` stays true until the exit has played: the stylesheet
            // hides a closed overlay at once, which would cut the animation.
            const token = {};
            host.__pgHide = token;
            // The other way round: the exit plays, then the empty room closes.
            const after = timing.duration;
            const room = slide(el, false, roomMs, EASING_PRESETS.smooth!, after);
            const [run] = await Promise.all([play(el, false, animation), settle(room, roomMs + after)]);
            if (host.__pgHide === token) setVisible(el, false);
            // Held on their last frames by `fill: forwards` until display is off.
            run?.cancel();
            if (room && sliding.get(el) === room) {
                room.cancel();
                sliding.delete(el);
            }
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

    /* ------------------------------------------------------------ action graph */

    /*
     * The Blueprint-style graph (`lib/editor/action-graph.ts`). Events start a
     * run; execution follows the white wires one node at a time and waits for
     * delays and animations before going on; data nodes are evaluated when an
     * input asks for them. A budget per run stops a graph that wires itself
     * into a loop. Only the node types below exist.
     */
    const embedded = graph ? undefined : parse<PageGraph>(root.querySelector<HTMLScriptElement>("script[data-pg-graph]")?.textContent ?? undefined);
    const page = graph ?? embedded;
    const library = new Map((animations ?? embedded?.animations ?? []).map((animation) => [animation.id, animation]));
    const customOf = (value: unknown) => (isCustomAnimation(value) ? library.get(value.slice("custom:".length)) : undefined);

    /** Plays a custom animation; resolves when it ends (loops resolve at once and keep going). */
    const playCustom = async (el: HTMLElement, animation: CustomAnimation, reverse: boolean, after = 0) => {
        running.get(el)?.cancel();
        if (reduced || typeof el.animate !== "function") return undefined;
        const timeline = timelineFor(animation, reverse);
        const { keyframes } = timeline;
        const options = { ...timeline.options, delay: Number(timeline.options.delay ?? 0) + after };
        const run = el.animate(keyframes, options);
        running.set(el, run);
        if (options.iterations === Number.POSITIVE_INFINITY) return run;
        const total = Number(options.duration) * Number(options.iterations ?? 1) + Number(options.delay ?? 0);
        try {
            await Promise.race([run.finished, new Promise((done) => setTimeout(done, total + 80))]);
        } catch {
            // Cancelled by a newer animation on the same layer.
        }
        if (running.get(el) === run) running.delete(el);
        return run;
    };

    /** Shows or hides with a custom animation: forwards in, backwards out. */
    const showCustom = async (el: HTMLElement, open: boolean, animation: CustomAnimation) => {
        const duration = Number(timelineFor(animation).options.duration) || 400;
        const roomMs = roomTime(duration);
        // As with show and hide: room first, then the animation in; animation out, then the room.
        if (open) setVisible(el, true);
        const room = open ? slide(el, true, roomMs, EASING_PRESETS.smooth!) : slide(el, false, roomMs, EASING_PRESETS.smooth!, duration);
        const [run] = await Promise.all([
            playCustom(el, animation, !open, open && room ? roomMs : 0),
            settle(room, open ? roomMs : roomMs + duration),
        ]);
        if (!open) setVisible(el, false);
        run?.cancel();
        if (room && sliding.get(el) === room) {
            if (!open) room.cancel();
            sliding.delete(el);
        }
    };

    /**
     * Morphs one layer into another.
     *
     * When the two sit next to each other in the flow and swap, the source
     * really takes the target's size (width and height, not a scale), so the
     * content around it reflows with it and nothing jumps when they swap: by
     * then the source fills exactly the room the target needs.
     *
     * Otherwise the source is moved and scaled over the target (FLIP). The
     * target's room opens while it travels, and with `swap` the source's room
     * closes after, so the page around both slides instead of snapping.
     */
    const morph = async (from: HTMLElement, into: HTMLElement, props: NonNullable<GraphNode["props"]>) => {
        running.get(from)?.cancel();
        const swap = props.swap === true;
        const hidden = !isOpen(into);
        const spring = props.easing === "spring" ? springCurve({ stiffness: 220, damping: 24, mass: 1 }) : undefined;
        const duration = Math.max(Number(props.duration) || 600, spring?.duration ?? 0);
        const easing = spring?.easing ?? EASING_PRESETS[String(props.easing ?? "smooth")] ?? EASING_PRESETS.smooth!;
        const swapNow = () => {
            into.style.removeProperty("visibility");
            setVisible(into, true);
            setVisible(from, false);
        };
        if (reduced || typeof from.animate !== "function") {
            if (swap) swapNow();
            return;
        }
        const look = (style: CSSStyleDeclaration) => ({ borderRadius: style.borderRadius, backgroundColor: style.backgroundColor, color: style.color, opacity: style.opacity });
        const a = from.getBoundingClientRect();
        const start = look(getComputedStyle(from));
        const adjacent = swap && inFlow(from) && inFlow(into) && from.parentElement === into.parentElement
            && (from.nextElementSibling === into || from.previousElementSibling === into);

        if (adjacent) {
            // Measured where it will be: in the source's place.
            const display = from.style.getPropertyValue("display");
            const priority = from.style.getPropertyPriority("display");
            from.style.setProperty("display", "none", "important");
            if (hidden) {
                into.style.setProperty("visibility", "hidden");
                setVisible(into, true);
            }
            const b = into.getBoundingClientRect();
            const end = look(getComputedStyle(into));
            if (hidden) {
                setVisible(into, false);
                into.style.removeProperty("visibility");
            }
            if (display) from.style.setProperty("display", display, priority);
            else from.style.removeProperty("display");
            if (a.width === 0 || b.width === 0) return swapNow();
            // Padding goes too: a border-box can't shrink below its own padding.
            const pad = (style: CSSStyleDeclaration) => ({ paddingTop: style.paddingTop, paddingRight: style.paddingRight, paddingBottom: style.paddingBottom, paddingLeft: style.paddingLeft });
            const padFrom = pad(getComputedStyle(from));
            if (hidden) setVisible(into, true);
            const padInto = pad(getComputedStyle(into));
            if (hidden) setVisible(into, false);
            const box = { boxSizing: "border-box", overflow: "hidden", flexGrow: 0, flexShrink: 0, minWidth: "0px", minHeight: "0px" };
            // No transform: the source sits in the target's slot, so the
            // layout carries it to where the target will be as it grows —
            // in a centred column that slot itself moves, and an offset on
            // top of that would move it twice.
            const run = from.animate([
                { ...box, ...start, ...padFrom, width: `${a.width}px`, height: `${a.height}px` },
                { ...box, ...end, ...padInto, width: `${b.width}px`, height: `${b.height}px` },
            ], { duration, easing, fill: "forwards" });
            running.set(from, run);
            await settle(run, duration);
            if (running.get(from) !== run) return;
            swapNow();
            run.cancel();
            running.delete(from);
            return;
        }

        // Elsewhere on the page: the target's room opens (still invisible) while the source travels.
        let room: Animation | undefined;
        if (hidden) {
            into.style.setProperty("visibility", "hidden");
            setVisible(into, true);
            // Only a target after the source: one before it would move the source under its own animation.
            if (swap && from.compareDocumentPosition(into) & Node.DOCUMENT_POSITION_FOLLOWING) room = slide(into, true, duration, easing);
        }
        // Measured at full size, where it will end up.
        room?.pause();
        if (room) room.currentTime = duration;
        const b = into.getBoundingClientRect();
        // Where the source's own box is once the room is open: the layout
        // moves it that far along the way, so the transform covers the rest.
        const landed = from.getBoundingClientRect();
        const end = look(getComputedStyle(into));
        if (room) {
            room.currentTime = 0;
            room.play();
        }
        if (hidden && !room) {
            setVisible(into, false);
            into.style.removeProperty("visibility");
        }
        if (a.width === 0 || b.width === 0) {
            if (swap) swapNow();
            return;
        }
        const run = from.animate([
            { transformOrigin: "0 0", transform: "translate(0px, 0px) scale(1, 1)", ...start },
            {
                transformOrigin: "0 0",
                transform: `translate(${b.left - landed.left}px, ${b.top - landed.top}px) scale(${a.width ? b.width / a.width : 1}, ${a.height ? b.height / a.height : 1})`,
                ...end,
            },
        ], { duration, easing, fill: "forwards" });
        running.set(from, run);
        await settle(run, duration);
        if (running.get(from) !== run || !swap) return;
        into.style.removeProperty("visibility");
        setVisible(into, true);
        if (room && sliding.get(into) === room) sliding.delete(into);
        // The source's room closes now, so whatever was around it slides into place.
        const after = Math.min(duration, 500);
        from.style.setProperty("visibility", "hidden");
        run.cancel();
        const close = slide(from, false, after, easing);
        await settle(close, after);
        from.style.removeProperty("visibility");
        setVisible(from, false);
        close?.cancel();
        if (close && sliding.get(from) === close) sliding.delete(from);
        running.delete(from);
    };

    if (page?.nodes?.length) {
        const nodes = new Map(page.nodes.map((node) => [node.id, node]));
        const links = page.links ?? [];
        const variables = page.variables ?? [];
        const storeKey = `pg-vars:${location.pathname}`;
        let stored: Record<string, unknown> = {};
        try {
            stored = JSON.parse(localStorage.getItem(storeKey) || "{}") || {};
        } catch {
            stored = {};
        }
        const literal = (value: unknown) => {
            if (typeof value !== "string") return value;
            const trimmed = value.trim();
            if (trimmed === "true") return true;
            if (trimmed === "false") return false;
            if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
            return value;
        };
        const vars = new Map<string, unknown>(variables.map((variable) => [
            variable.name,
            variable.persist && Object.hasOwn(stored, variable.name) ? stored[variable.name] : literal(variable.value),
        ]));
        const once = new Set<string>();
        const text = (value: unknown) => (value === null || value === undefined || typeof value === "object" ? "" : String(value));
        const layer = (id: unknown) => (typeof id === "string" && id ? resolve(root, id) : undefined);
        type Budget = { left: number };

        const inputOf = (node: GraphNode, pin: string, budget: Budget): unknown => {
            const link = links.find((item) => item.to === node.id && item.toPin === pin);
            if (link) {
                const source = nodes.get(link.from);
                return source ? value(source, budget) : undefined;
            }
            return literal(node.props?.[pin]);
        };

        const value = (node: GraphNode, budget: Budget): unknown => {
            if (--budget.left < 0) return undefined;
            const props = node.props ?? {};
            switch (node.type) {
                case "data.variable": return vars.get(String(props.name));
                case "data.value": return literal(props.value);
                case "data.compare": {
                    const a = inputOf(node, "a", budget);
                    const b = inputOf(node, "b", budget);
                    const x = Number(a);
                    const y = Number(b);
                    const numeric = text(a) !== "" && text(b) !== "" && !Number.isNaN(x) && !Number.isNaN(y);
                    switch (props.op) {
                        case "!=": return text(a) !== text(b);
                        case ">": return numeric ? x > y : text(a) > text(b);
                        case "<": return numeric ? x < y : text(a) < text(b);
                        case ">=": return numeric ? x >= y : text(a) >= text(b);
                        case "<=": return numeric ? x <= y : text(a) <= text(b);
                        case "contains": return text(a).toLowerCase().includes(text(b).toLowerCase());
                        default: return numeric ? x === y : text(a) === text(b);
                    }
                }
                case "data.logic": {
                    const a = Boolean(inputOf(node, "a", budget));
                    return props.op === "or" ? a || Boolean(inputOf(node, "b", budget)) : a && Boolean(inputOf(node, "b", budget));
                }
                case "data.not": return !inputOf(node, "a", budget);
                case "data.math": {
                    const x = Number(inputOf(node, "a", budget)) || 0;
                    const y = Number(inputOf(node, "b", budget)) || 0;
                    switch (props.op) {
                        case "-": return x - y;
                        case "*": return x * y;
                        case "/": return y === 0 ? 0 : x / y;
                        case "%": return y === 0 ? 0 : x % y;
                        default: return x + y;
                    }
                }
                case "data.join": return (text(inputOf(node, "a", budget)) + text(inputOf(node, "b", budget))).slice(0, 10_000);
                case "data.isVisible": {
                    const target = layer(props.target);
                    return target ? isOpen(target) : false;
                }
                case "data.inputValue": {
                    const target = layer(props.target);
                    const control = target?.matches("input,textarea,select")
                        ? target
                        : target?.querySelector<HTMLElement>("input,textarea,select");
                    if (!control) return "";
                    const field = control as HTMLInputElement;
                    return field.type === "checkbox" ? field.checked : field.value;
                }
                case "data.layerText": return layer(props.target)?.textContent?.trim() ?? "";
            }
            return undefined;
        };

        const animationOf = (props: NonNullable<GraphNode["props"]>): ActionAnimation | undefined => {
            const type = props.animation as ActionAnimationType | undefined;
            if (!type || type === "none") return undefined;
            return { type, duration: Number(props.duration) || 300 };
        };

        const follow = async (node: GraphNode, pin: string, budget: Budget) => {
            for (const link of links) {
                if (signal.aborted) return;
                if (link.from !== node.id || link.fromPin !== pin) continue;
                const next = nodes.get(link.to);
                if (next) await exec(next, budget);
            }
        };

        const exec = async (node: GraphNode, budget: Budget): Promise<void> => {
            if (signal.aborted || --budget.left < 0) return;
            const props = node.props ?? {};
            const target = layer(props.target);
            switch (node.type) {
                case "flow.branch":
                    return follow(node, inputOf(node, "condition", budget) ? "true" : "false", budget);
                case "flow.sequence":
                    await follow(node, "then0", budget);
                    await follow(node, "then1", budget);
                    return follow(node, "then2", budget);
                case "flow.delay":
                    await wait(Math.max(0, Number(props.ms) || 0));
                    break;
                case "flow.once":
                    if (once.has(node.id)) return;
                    once.add(node.id);
                    break;
                case "action.show":
                case "action.hide":
                case "action.toggle":
                    if (target) {
                        const open = node.type === "action.toggle" ? !isOpen(target) : node.type === "action.show";
                        const custom = customOf(props.animation);
                        if (custom) await showCustom(target, open, custom);
                        else await show(target, open, animationOf(props));
                    }
                    break;
                case "action.play": {
                    const custom = customOf(props.animation);
                    if (target && custom) await playCustom(target, custom, props.reverse === true);
                    break;
                }
                case "action.morph": {
                    const into = layer(props.into);
                    if (target && into && target !== into) await morph(target, into, props);
                    break;
                }
                case "action.scrollTo":
                    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                    break;
                case "action.setText":
                    if (target) target.textContent = text(inputOf(node, "text", budget)).slice(0, 10_000);
                    break;
                case "action.addClass": {
                    const name = String(props.className ?? "").trim();
                    if (target && /^[A-Za-z_-][\w-]*$/.test(name)) {
                        if (props.mode === "add") target.classList.add(name);
                        else if (props.mode === "remove") target.classList.remove(name);
                        else target.classList.toggle(name);
                    }
                    break;
                }
                case "action.navigate": {
                    const url = text(inputOf(node, "url", budget)).trim();
                    // Web, site, mail and phone addresses only: never javascript: or data:.
                    if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url)) return;
                    if (props.newTab) window.open(url, "_blank", "noopener,noreferrer");
                    else window.location.assign(url);
                    return;
                }
                case "action.setVariable": {
                    const name = String(props.name ?? "");
                    if (!name) break;
                    const next = inputOf(node, "value", budget);
                    vars.set(name, next);
                    if (variables.some((variable) => variable.name === name && variable.persist)) {
                        stored[name] = next;
                        try {
                            localStorage.setItem(storeKey, JSON.stringify(stored));
                        } catch {
                            // Private browsing: the value lasts for this visit.
                        }
                    }
                    break;
                }
                case "action.copy":
                    void navigator.clipboard?.writeText(text(inputOf(node, "text", budget))).catch(() => undefined);
                    break;
            }
            return follow(node, "out", budget);
        };

        const start = (node: GraphNode) => void exec(node, { left: 2_000 });

        for (const node of page.nodes) {
            const target = layer(node.props?.target);
            switch (node.type) {
                case "event.load":
                    start(node);
                    break;
                case "event.click":
                    if (!target) break;
                    target.style.cursor = "pointer";
                    target.addEventListener("click", (event) => {
                        if (target.tagName === "A") event.preventDefault();
                        start(node);
                    }, { signal });
                    break;
                case "event.hoverStart":
                    target?.addEventListener("mouseenter", () => start(node), { signal });
                    break;
                case "event.hoverEnd":
                    target?.addEventListener("mouseleave", () => start(node), { signal });
                    break;
                case "event.change":
                    target?.addEventListener("input", () => start(node), { signal });
                    break;
                case "event.inView": {
                    if (!target || typeof IntersectionObserver !== "function") break;
                    const observer = new IntersectionObserver((entries) => {
                        if (!entries.some((entry) => entry.isIntersecting)) return;
                        observer.disconnect();
                        start(node);
                    }, { threshold: 0.2 });
                    observer.observe(target);
                    observers.push(observer);
                    break;
                }
                case "event.timer": {
                    const timer = setInterval(() => start(node), Math.max(250, Number(node.props?.ms) || 1_000));
                    signal.addEventListener("abort", () => clearInterval(timer), { once: true });
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
        for (const animation of sliding.values()) animation.cancel();
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
