import type { DropPlan } from "./drop-target";

const SELECTOR = "[data-canvas-element]";

/** How far the pointer travels before a press becomes a drag, in screen px. */
export const DRAG_THRESHOLD = 4;

/** How close to the viewport's edge the pointer has to be to scroll it. */
const AUTO_SCROLL_EDGE = 36;
const AUTO_SCROLL_MAX = 22;

const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const SHIFT_MS = 200;
const SETTLE_MS = 220;

type Offset = { x: number; y: number; w: number; h: number };

const NO_OFFSET = { x: 0, y: 0 };

/** Inline styles a session overwrites, so they can be put back exactly. */
type Saved = { transform: string; transition: string; boxShadow: string; opacity: string; zIndex: string; position: string; pointerEvents: string; willChange: string };

/**
 * Restores still waiting on a transition to finish.
 *
 * A layer can be picked up again before the last gesture has put it back.
 * Saving it then would take the previous gesture's temporary styles for the
 * originals, and the late timer would trample the new gesture besides, so a
 * pending restore always runs first.
 */
const pending = new Map<HTMLElement, { timer: number; run: () => void }>();

/** Puts every layer still settling back in place, before anything is measured. */
function flushAll() {
    for (const node of [...pending.keys()]) flush(node);
}

function later(node: HTMLElement, saved: Saved, ms: number) {
    flush(node);
    const run = () => {
        pending.delete(node);
        restore(node, saved);
    };
    pending.set(node, { timer: window.setTimeout(run, ms), run });
}

function flush(node: HTMLElement) {
    const entry = pending.get(node);
    if (!entry) return;
    window.clearTimeout(entry.timer);
    entry.run();
}

function save(node: HTMLElement): Saved {
    flush(node);
    const { transform, transition, boxShadow, opacity, zIndex, position, pointerEvents, willChange } = node.style;
    return { transform, transition, boxShadow, opacity, zIndex, position, pointerEvents, willChange };
}

function restore(node: HTMLElement, saved: Saved) {
    Object.assign(node.style, saved);
}

function idOf(node: Element | null | undefined) {
    return (node as HTMLElement | null | undefined)?.dataset?.canvasElement || undefined;
}

function intersect(a: Offset, b: Offset): Offset {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
}

/** What the preview needs to know about a container to open a gap in it. */
export type FlowInfo = {
    /** Children in document order, the dragged one included. */
    childIds: string[];
    vertical: boolean;
    /** Wrapping rows and grids cannot be previewed by sliding along one axis. */
    linear: boolean;
    /** The container's own gap, in canvas px; used when it has one child. */
    gap: number;
};

/**
 * One drag of a layer across the canvas, from the press to the drop.
 *
 * Everything the canvas does *while* something is dragged lives here and is
 * written straight to the DOM: the lifted layer following the pointer, the
 * siblings sliding apart to make room, the gap they leave, and the settle on
 * release. None of it is the document, so none of it re-renders React.
 *
 * Geometry is measured once, when the drag starts. Siblings move while the
 * pointer is still looking for a place, and measuring them live fed those
 * moves back into the hit test — the gap ran away from the pointer and the
 * insertion point flickered between two answers. Read from the snapshot, the
 * layout the author is aiming at holds still. The snapshot is stored relative
 * to the artboard, which is read live, so scrolling the canvas keeps it true.
 */
export class DragSession {
    readonly id: string;
    readonly startX: number;
    readonly startY: number;
    active = false;
    cancelled = false;

    private page: HTMLElement | null = null;
    private node: HTMLElement | null = null;
    private nodeSaved: Saved | null = null;
    private scale = 1;
    private scrollStart = { left: 0, top: 0 };
    private offsets = new Map<HTMLElement, Offset>();
    /** Each node's box clipped by the containers it is drawn inside. */
    private visible = new Map<HTMLElement, Offset>();
    private order: HTMLElement[] = [];
    private parents = new Map<HTMLElement, HTMLElement | null>();
    private clipping = new Set<HTMLElement>();
    private pageSize = { w: 0, h: 0 };
    private shifted = new Map<HTMLElement, Saved>();
    /** The lifted layer's containers, raised with it, and what they had. */
    private raised: Array<{ node: HTMLElement; zIndex: string }> = [];
    private origin: FlowInfo | null = null;
    private closing = new Map<HTMLElement, { x: number; y: number }>();
    private grab = { x: 0, y: 0 };

    /** The rendered copy that was pressed — one per artboard is drawn. */
    private readonly pressed: HTMLElement | null;

    constructor(id: string, startX: number, startY: number, pressed?: HTMLElement | null) {
        this.id = id;
        this.startX = startX;
        this.startY = startY;
        this.pressed = pressed ?? null;
        const page = this.pressed?.closest<HTMLElement>("[data-canvas-page]")?.getBoundingClientRect();
        this.pressPage = page ? { left: page.left, top: page.top } : null;
    }

    /** The artboard's corner at the press, to read travel in canvas units. */
    private readonly pressPage: { left: number; top: number } | null;

    /**
     * How far the pointer has travelled over the content since the press,
     * in canvas px. Measured against the artboard rather than the screen,
     * so scrolling or zooming mid-drag does not count as movement.
     */
    canvasDelta(clientX: number, clientY: number, scale: number, pressScale: number) {
        const page = this.pressed?.isConnected
            ? this.pressed.closest<HTMLElement>("[data-canvas-page]")?.getBoundingClientRect()
            : undefined;
        if (!page || !this.pressPage) {
            return { x: (clientX - this.startX) / scale, y: (clientY - this.startY) / scale };
        }
        return {
            x: (clientX - page.left) / scale - (this.startX - this.pressPage.left) / pressScale,
            y: (clientY - page.top) / scale - (this.startY - this.pressPage.top) / pressScale,
        };
    }

    /** Whether the pointer has gone far enough for a press to become a drag. */
    passedThreshold(clientX: number, clientY: number) {
        return Math.hypot(clientX - this.startX, clientY - this.startY) >= DRAG_THRESHOLD;
    }

    /** Lifts the layer and snapshots the artboard it lives on. */
    activate(viewport: HTMLElement | null, scale: number) {
        this.active = true;
        this.scale = scale;
        this.scrollStart = { left: viewport?.scrollLeft ?? 0, top: viewport?.scrollTop ?? 0 };
        flushAll();
        this.node = this.pressed?.isConnected && this.pressed.closest("[data-canvas-page]")
            ? this.pressed
            : document.querySelector<HTMLElement>(`[data-canvas-page] [data-canvas-element="${CSS.escape(this.id)}"]`);
        this.page = this.node?.closest<HTMLElement>("[data-canvas-page]") ?? null;
        this.measure();
        document.documentElement.dataset.pgDragging = "";
        // Where on the layer it was grabbed, in canvas units, so the grip
        // stays under the pointer through scrolling and zooming alike.
        const box = this.node ? this.rect(this.node) : null;
        this.grab = box ? { x: (this.startX - box.left) / scale, y: (this.startY - box.top) / scale } : { x: 0, y: 0 };
    }

    private measure() {
        this.offsets.clear();
        this.parents.clear();
        this.clipping.clear();
        this.order = [];
        const page = this.page;
        if (!page) return;
        const origin = page.getBoundingClientRect();
        this.pageSize = { w: origin.width, h: origin.height };
        for (const node of page.querySelectorAll<HTMLElement>(SELECTOR)) {
            const rect = node.getBoundingClientRect();
            this.offsets.set(node, { x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height });
            this.order.push(node);
            this.parents.set(node, node.parentElement?.closest<HTMLElement>(SELECTOR) ?? null);
            if (getComputedStyle(node).overflow !== "visible") this.clipping.add(node);
        }
        this.clip();
    }

    /**
     * What of each layer can be hit: whatever clips its nearest layer, plus
     * that layer itself when it hides its overflow — a slide parked off the
     * side of a carousel is not something to drop onto.
     */
    private clip() {
        this.visible.clear();
        const pageBox = { x: 0, y: 0, ...this.pageSize };
        const clips = new Map<HTMLElement, Offset>();
        for (const node of this.order) {
            const raw = this.offsets.get(node);
            if (!raw) continue;
            const box = raw;
            const parent = this.parents.get(node);
            const inherited = (parent && clips.get(parent)) ?? pageBox;
            this.visible.set(node, intersect(box, inherited));
            clips.set(node, this.clipping.has(node) ? intersect(box, inherited) : inherited);
        }
    }

    /** Re-measures after a zoom; the snapshot is in screen pixels. */
    rescale(scale: number) {
        if (!this.active || scale === this.scale) return;
        for (const [node, saved] of this.shifted) restore(node, saved);
        this.shifted.clear();
        // Restoring a slid container also put back its own z-index; the lift
        // still needs it raised until the drag ends.
        for (const { node } of this.raised) node.style.zIndex = "59";
        if (this.node && this.nodeSaved) {
            const lifted = { transform: this.node.style.transform, transition: this.node.style.transition };
            this.node.style.transition = "none";
            this.node.style.transform = this.nodeSaved.transform;
            this.scale = scale;
            this.measure();
            Object.assign(this.node.style, lifted);
        } else {
            this.scale = scale;
            this.measure();
        }
        this.setOrigin(this.origin);
    }

    /** A layer's box as it was when the drag began, in today's screen space. */
    private snapshotRect(node: HTMLElement): DOMRect {
        const offset = this.page ? this.offsets.get(node) : undefined;
        if (!offset || !this.page) return node.getBoundingClientRect();
        const origin = this.page.getBoundingClientRect();
        return new DOMRect(origin.left + offset.x, origin.top + offset.y, offset.w, offset.h);
    }

    /**
     * A layer's box as it was laid out before the lift.
     *
     * Aiming is judged against the layout from before anything moved, never
     * against the moving one. What is on screen during a drag is always the
     * finished result — the hole closed *and* the room opened — so a pointer
     * over the room is over the place it names. Judging against the closed
     * layout instead made a press that barely moved swap a layer with its
     * neighbour, because the neighbour had slid under the pointer.
     */
    rect = (node: HTMLElement): DOMRect => this.snapshotRect(node);

    /**
     * Which row the dragged layer is lifted out of. Its later siblings slide
     * back over the space it took for as long as it is held; nothing for a
     * drag that cannot reorder.
     */
    setOrigin(origin: FlowInfo | null) {
        this.origin = origin;
        this.closing.clear();
        if (!origin?.linear || !this.node) return;
        const nodes = origin.childIds
            .map((id) => this.nodeFor(id))
            .filter((node): node is HTMLElement => Boolean(node) && (node === this.node || this.visibleBox(node as HTMLElement)));
        const at = nodes.indexOf(this.node);
        if (at === -1) return;
        const dragged = this.snapshotRect(this.node);
        const size = (origin.vertical ? dragged.height : dragged.width) + this.spacing(origin, nodes, (node) => this.snapshotRect(node));
        for (const node of nodes.slice(at + 1)) this.closing.set(node, origin.vertical ? { x: 0, y: -size } : { x: -size, y: 0 });
    }

    /**
     * How far the hole closing moved a layer on screen: its own offset, or
     * that of the sibling it sits inside — children ride along with their
     * parent's transform. Visual only; aiming never uses it.
     */
    private closedWith(node: HTMLElement) {
        for (let current: HTMLElement | null = node; current; current = this.parents.get(current) ?? null) {
            const offset = this.closing.get(current);
            if (offset) return offset;
        }
        return NO_OFFSET;
    }

    private visibleBox(node: HTMLElement) {
        const box = this.offsets.get(node);
        return Boolean(box && box.w + box.h > 0);
    }

    private spacing(flow: FlowInfo, nodes: HTMLElement[], rectOf: (node: HTMLElement) => DOMRect) {
        for (let index = 1; index < nodes.length; index += 1) {
            const a = rectOf(nodes[index - 1]);
            const b = rectOf(nodes[index]);
            const gap = flow.vertical ? b.top - a.bottom : b.left - a.right;
            if (gap >= 0) return gap;
        }
        return flow.gap * this.scale;
    }

    /**
     * The topmost layer under the pointer, judged from the snapshot.
     *
     * Off the dragged layer's own artboard there is no snapshot and nothing
     * is moving, so the browser's own hit test is the right answer there.
     */
    hit = (clientX: number, clientY: number, excluded: Set<string>): HTMLElement | undefined => {
        const page = this.page;
        const origin = page?.getBoundingClientRect();
        if (page && origin && clientX >= origin.left && clientX <= origin.right && clientY >= origin.top && clientY <= origin.bottom) {
            for (let index = this.order.length - 1; index >= 0; index -= 1) {
                const node = this.order[index];
                const id = idOf(node);
                if (!id || excluded.has(id)) continue;
                const box = this.visible.get(node);
                if (!box || box.w <= 0 || box.h <= 0) continue;
                const x = clientX - origin.left;
                const y = clientY - origin.top;
                if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) return node;
            }
            return undefined;
        }
        for (const node of document.elementsFromPoint(clientX, clientY)) {
            const candidate = node.closest<HTMLElement>(SELECTOR);
            const id = idOf(candidate);
            if (!candidate || !id || excluded.has(id)) continue;
            return candidate;
        }
        return undefined;
    };

    /** How far the canvas has scrolled since the drag began, in screen px. */
    scrolled(viewport: HTMLElement | null) {
        return {
            x: (viewport?.scrollLeft ?? 0) - this.scrollStart.left,
            y: (viewport?.scrollTop ?? 0) - this.scrollStart.top,
        };
    }

    /**
     * How far the lifted layer has to move, in screen px, for the point it
     * was grabbed by to sit under the pointer. Measured against where the
     * layer is laid out now, so a scroll or a zoom mid-drag cannot pull the
     * two apart.
     */
    offsetFor(clientX: number, clientY: number) {
        if (!this.node) return { x: 0, y: 0 };
        const box = this.rect(this.node);
        return { x: clientX - (box.left + this.grab.x * this.scale), y: clientY - (box.top + this.grab.y * this.scale) };
    }

    /** Moves the lifted layer with the pointer; offsets are in screen px. */
    follow(dx: number, dy: number) {
        const node = this.node;
        if (!node) return;
        if (!this.nodeSaved) {
            this.nodeSaved = save(node);
            node.style.transition = "box-shadow 160ms ease, opacity 160ms ease";
            node.style.willChange = "transform";
            node.style.pointerEvents = "none";
            node.style.zIndex = "60";
            if (getComputedStyle(node).position === "static") node.style.position = "relative";
            node.style.boxShadow = "0 18px 40px -8px rgb(15 10 40 / 0.35), 0 0 0 1.5px var(--ed-accent, #6c28ed)";
            node.style.opacity = "0.94";
            // Raising the layer alone only lifts it inside its own container:
            // every section is its own stacking context, so a background
            // image carried over the next section went under that section's
            // text. Its containers come up with it for the length of the
            // drag. Only z-index changes, so nothing is laid out again.
            for (let current = node.parentElement?.closest<HTMLElement>(SELECTOR); current && this.page?.contains(current); current = current.parentElement?.closest<HTMLElement>(SELECTOR)) {
                this.raised.push({ node: current, zIndex: current.style.zIndex });
                current.style.zIndex = "59";
            }
        }
        node.style.transform = `translate(${dx / this.scale}px, ${dy / this.scale}px) ${this.nodeSaved.transform}`.trim();
    }

    /** The container the dragged layer sits in on its own artboard. */
    home() {
        return this.node?.parentElement?.closest<HTMLElement>(SELECTOR) ?? null;
    }

    /** The dragged layer's box as measured at the start, for the resolver. */
    draggedRect = (): DOMRect | undefined => (this.node ? this.snapshotRect(this.node) : undefined);

    /** The lifted layer's box on screen right now. */
    ghostRect() {
        return this.node?.getBoundingClientRect() ?? null;
    }

    private nodeFor(id: string) {
        return this.page?.querySelector<HTMLElement>(`[data-canvas-element="${CSS.escape(id)}"]`) ?? null;
    }

    private shift(node: HTMLElement, x: number, y: number) {
        let saved = this.shifted.get(node);
        if (!saved) {
            saved = save(node);
            // A container raised for the lift keeps its own z-index on
            // record, never the temporary one, or putting the slide back
            // would leave it raised after the drag.
            const raised = this.raised.find((entry) => entry.node === node);
            if (raised) saved.zIndex = raised.zIndex;
            this.shifted.set(node, saved);
            node.style.transition = `transform ${SHIFT_MS}ms ${EASE}`;
            node.style.willChange = "transform";
        }
        node.style.transform = x || y
            ? `translate(${x / this.scale}px, ${y / this.scale}px) ${saved.transform}`.trim()
            : saved.transform;
    }

    /**
     * Opens room where the layer would land; the hole it left stays closed.
     *
     * Returns the slot the layer would fill — drawn in the gap the siblings
     * made, so what the author sees while dragging is the layout they get.
     */
    preview(plan: DropPlan | null, target: FlowInfo | null): DropPlan["slot"] | undefined {
        if (!this.active || !this.page || !this.node) return undefined;
        const dragged = this.snapshotRect(this.node);
        const opening = new Map<HTMLElement, { x: number; y: number }>();

        // The room: the siblings from the insertion point on make way for it.
        let slot: DropPlan["slot"] | undefined;
        if (plan && target?.linear && (plan.beforeId !== undefined || plan.indicator)) {
            // Only what is actually drawn: a hidden child has no box to move
            // and would push every index after it off by one.
            const rendered = target.childIds
                .filter((id) => id !== this.id)
                .map((id) => ({ id, node: this.nodeFor(id) }))
                .filter((entry): entry is { id: string; node: HTMLElement } => Boolean(entry.node) && this.visibleBox(entry.node as HTMLElement));
            const siblings = rendered.map((entry) => entry.id);
            const nodes = rendered.map((entry) => entry.node);
            // Measured with the dragged layer still counted where it sits, so
            // the gap is never read across the hole it left.
            const laidOut = target.childIds
                .map((id) => (id === this.id ? this.node : this.nodeFor(id)))
                .filter((node): node is HTMLElement => Boolean(node) && this.visibleBox(node as HTMLElement));
            const gap = this.spacing(target, laidOut, this.rect);
            const length = target.vertical ? dragged.height : dragged.width;
            const found = plan.beforeId ? siblings.indexOf(plan.beforeId) : -1;
            const at = found === -1 ? siblings.length : found;
            for (const node of nodes.slice(at)) {
                opening.set(node, target.vertical ? { x: 0, y: length + gap } : { x: length + gap, y: 0 });
            }

            const anchor = found !== -1 ? nodes[found] : nodes.at(-1);
            if (anchor) {
                const base = this.rect(anchor);
                // Where the anchor is drawn: closed over the hole, then moved
                // aside for the room.
                const open = opening.get(anchor) ?? NO_OFFSET;
                const closed = this.closedWith(anchor);
                const box = new DOMRect(base.left + open.x + closed.x, base.top + open.y + closed.y, base.width, base.height);
                const before = found !== -1;
                slot = target.vertical
                    ? { x: box.left, w: box.width, h: length, y: before ? box.top - gap - length : box.bottom + gap }
                    : { y: box.top, h: box.height, w: length, x: before ? box.left - gap - length : box.right + gap };
            }
        }

        const offsets = new Map<HTMLElement, { x: number; y: number }>();
        for (const [node, offset] of this.closing) offsets.set(node, { ...offset });
        for (const [node, offset] of opening) {
            const current = offsets.get(node) ?? { x: 0, y: 0 };
            offsets.set(node, { x: current.x + offset.x, y: current.y + offset.y });
        }
        for (const node of [...this.shifted.keys()]) {
            if (!offsets.has(node)) this.shift(node, 0, 0);
        }
        for (const [node, offset] of offsets) this.shift(node, offset.x, offset.y);
        return slot;
    }

    /**
     * Scroll speed for a pointer this close to the viewport's edge.
     *
     * Only towards an edge the pointer has actually travelled to. A layer
     * picked up near the side of the canvas — an artboard flush with the
     * viewport makes that the whole left edge — would otherwise start the
     * canvas sliding at once, carry the artboard out from under a pointer
     * that never moved, and park the layer beside it on release.
     */
    autoScroll(viewport: HTMLElement | null, clientX: number, clientY: number) {
        const rect = viewport?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const speed = (distance: number) =>
            distance < AUTO_SCROLL_EDGE ? Math.round(AUTO_SCROLL_MAX * (1 - Math.max(0, distance) / AUTO_SCROLL_EDGE) ** 2) : 0;
        const toward = (travel: number, direction: number) => Math.sign(travel) === direction && Math.abs(travel) > AUTO_SCROLL_EDGE / 2;
        const dx = clientX - this.startX;
        const dy = clientY - this.startY;
        // Scrolling stops once the artboard's own edge reaches the pointer:
        // carried past the end of the page, the layer would be off every
        // artboard, and letting go there parks it instead of placing it.
        const page = this.page?.getBoundingClientRect();
        const room = {
            left: !page || page.left < clientX - AUTO_SCROLL_EDGE,
            right: !page || page.right > clientX + AUTO_SCROLL_EDGE,
            up: !page || page.top < clientY - AUTO_SCROLL_EDGE,
            down: !page || page.bottom > clientY + AUTO_SCROLL_EDGE,
        };
        const left = toward(dx, -1) && room.left ? speed(clientX - rect.left) : 0;
        const right = toward(dx, 1) && room.right ? speed(rect.right - clientX) : 0;
        const up = toward(dy, -1) && room.up ? speed(clientY - rect.top) : 0;
        const down = toward(dy, 1) && room.down ? speed(rect.bottom - clientY) : 0;
        return { x: left ? -left : right, y: up ? -up : down };
    }

    /**
     * Ends the gesture.
     *
     * `dropped` is called once the drop has been written; on the next frame
     * the layout already holds the new order, so the siblings let go of their
     * offsets without a jump and the dropped layer glides from where the
     * pointer left it into the place it took.
     */
    finish(dropped: boolean) {
        delete document.documentElement.dataset.pgDragging;
        for (const { node, zIndex } of this.raised) node.style.zIndex = zIndex;
        this.raised = [];
        const node = this.node;
        const nodeSaved = this.nodeSaved;
        const from = dropped ? this.ghostRect() : null;
        const shifted = [...this.shifted];
        this.shifted.clear();
        this.active = false;

        if (!dropped) {
            // Abandoned: everything slides back to where it was.
            for (const [sibling, saved] of shifted) {
                sibling.style.transform = saved.transform;
                later(sibling, saved, SHIFT_MS + 40);
            }
            if (node && nodeSaved) {
                node.style.transition = `transform ${SETTLE_MS}ms ${EASE}, box-shadow ${SETTLE_MS}ms ease, opacity ${SETTLE_MS}ms ease`;
                node.style.transform = nodeSaved.transform;
                node.style.boxShadow = nodeSaved.boxShadow;
                node.style.opacity = nodeSaved.opacity;
                later(node, nodeSaved, SETTLE_MS + 40);
            }
            return;
        }

        const id = this.id;
        const page = this.page;
        const landedIn = this.node?.closest<HTMLElement>("[data-artboard]");
        const scale = this.scale;
        // Put the drag's own styles back now, while the DOM still holds the
        // old document: React commits the drop on top of them, so whatever
        // the drop changed — a new position, a new parent — wins. Nothing is
        // painted in between, and once the new order is laid out the siblings
        // already sit where they were shown.
        for (const [sibling, saved] of shifted) restore(sibling, saved);
        if (node && nodeSaved) restore(node, nodeSaved);
        window.requestAnimationFrame(() => {
            // The layer may have been re-created under a new parent.
            // The editor may have gone in the meantime; a settle that can no
            // longer find its own artboard is dropped, never aimed elsewhere.
            const scope = landedIn?.isConnected ? landedIn : page?.isConnected ? page : null;
            if (!scope) return;
            const landed = scope.querySelector<HTMLElement>(`[data-canvas-element="${CSS.escape(id)}"]`);
            if (!landed || !from) return;
            const to = landed.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
            const saved = save(landed);
            landed.style.transition = "none";
            landed.style.transform = `translate(${dx / scale}px, ${dy / scale}px) ${saved.transform}`.trim();
            void landed.offsetWidth;
            landed.style.transition = `transform ${SETTLE_MS}ms ${EASE}`;
            landed.style.transform = saved.transform;
            later(landed, saved, SETTLE_MS + 40);
        });
    }
}
