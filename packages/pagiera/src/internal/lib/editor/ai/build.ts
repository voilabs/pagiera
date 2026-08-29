import { createElement } from "../tree";
import type { CanvasElement, ElementStyle, ElementType } from "../types";
import { alpha, type Surface, type Theme } from "./theme";

/**
 * The vocabulary blocks are written in.
 *
 * Every primitive here reads its colours and sizes from the theme and the
 * surface it is placed on, and — critically — assigns its own responsive
 * overrides and entrance motion. A block author cannot forget to shrink a
 * headline on mobile or to stagger a column, because they never write those
 * values in the first place.
 *
 * The old compiler stored finished hexes in twenty-four fixed presets and then
 * tried to recolour them by matching known hard-coded values. Anything it did
 * not recognise stayed indigo. Here there is nothing to recognise: a colour
 * exists in exactly one place, the theme.
 */

/** The builder state one section is assembled against. */
export class Canvas {
    readonly elements: CanvasElement[] = [];
    /** Entrance delays are handed out in creation order, which is reading order. */
    private stagger = 0;

    constructor(
        readonly theme: Theme,
        readonly surface: Surface,
    ) {}

    /** Resets the stagger so a new group animates as its own run. */
    beginGroup() {
        this.stagger = 0;
    }

    nextDelay() {
        const delay = this.stagger;
        this.stagger = Math.min(this.stagger + 70, 560);
        return delay;
    }

    push(element: CanvasElement) {
        this.elements.push(element);
        return element;
    }
}

type Overrides = { tablet?: Partial<ElementStyle>; mobile?: Partial<ElementStyle> };

function make(
    canvas: Canvas,
    type: ElementType,
    style: Partial<ElementStyle>,
    props: Partial<CanvasElement> = {},
    overrides?: Overrides,
) {
    const element = createElement(type, { x: 0, y: 0, z: canvas.elements.length, parentId: props.parentId });
    element.base = { ...element.base, ...style };
    Object.assign(element, props);
    if (overrides && (overrides.tablet || overrides.mobile)) {
        element.overrides = { ...element.overrides, ...overrides };
    }
    return canvas.push(element);
}

/** Entrance motion, shared by everything that animates in. */
function motion(canvas: Canvas, effect: "up" | "fade" = "up"): Partial<ElementStyle> {
    return {
        entrance: effect,
        entranceDuration: 640,
        entranceDelay: canvas.nextDelay(),
        entranceCurve: "ease",
        entranceBezier: "0.16, 1, 0.3, 1",
    };
}

/* ------------------------------------------------------------- containers */

/**
 * A full-bleed band.
 *
 * `heightMode: auto` is not negotiable — a fixed or filled height here is what
 * produced the giant empty bands the old system had to write a validator for.
 */
export function band(canvas: Canvas, name: string, patch: Partial<ElementStyle> = {}) {
    const { theme, surface } = canvas;
    // The narrow-screen padding is scaled from whatever this band actually
    // uses, not from the theme's rhythm. A navigation bar that overrides its
    // padding down to 18px would otherwise be handed the generic band's 60px
    // on a phone, and the sticky header would eat a third of the viewport.
    const padT = patch.padT ?? theme.space.band;
    const padB = patch.padB ?? theme.space.band;
    return make(canvas, "Section", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "center",
        gap: 0,
        padT: theme.space.band,
        padR: theme.space.gutter,
        padB: theme.space.band,
        padL: theme.space.gutter,
        bg: surface.bg,
        color: surface.text,
        fontFamily: theme.type.bodyFamily,
        ...patch,
    }, { name }, {
        tablet: { padT: Math.round(padT * 0.78), padB: Math.round(padB * 0.78), padR: 32, padL: 32 },
        mobile: { padT: Math.round(padT * 0.58), padB: Math.round(padB * 0.58), padR: 20, padL: 20 },
    });
}

/**
 * The measure the content sits inside.
 *
 * Every band gets one, so text never runs the full width of a 2560px monitor —
 * the single most reliable difference between a page that looks designed and
 * one that looks like a document.
 */
export function shell(canvas: Canvas, parentId: string, width = 1200, patch: Partial<ElementStyle> = {}) {
    return make(canvas, "Container", {
        widthMode: "fill",
        heightMode: "auto",
        w: width,
        layout: "stack",
        direction: "column",
        align: "stretch",
        gap: canvas.theme.space.block,
        bg: "transparent",
        borderW: 0,
        ...patch,
    }, { name: "Content", parentId });
}

/** A plain layout group. */
export function stack(
    canvas: Canvas,
    parentId: string,
    name: string,
    patch: Partial<ElementStyle> = {},
    overrides?: Overrides,
) {
    return make(canvas, "Container", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "stretch",
        gap: canvas.theme.space.text,
        bg: "transparent",
        borderW: 0,
        padT: 0,
        padR: 0,
        padB: 0,
        padL: 0,
        ...patch,
    }, { name, parentId }, overrides);
}

/** A row that folds to a column on a phone. */
export function row(
    canvas: Canvas,
    parentId: string,
    name: string,
    patch: Partial<ElementStyle> = {},
    overrides?: Overrides,
) {
    return stack(canvas, parentId, name, { direction: "row", align: "center", gap: 20, ...patch }, {
        mobile: { direction: "column", align: "stretch", gap: 16 },
        ...overrides,
    });
}

/** A responsive grid. Column counts step down rather than collapsing at once. */
export function grid(
    canvas: Canvas,
    parentId: string,
    name: string,
    columns: number,
    patch: Partial<ElementStyle> = {},
) {
    const safe = Math.max(1, Math.min(6, Math.round(columns)));
    return make(canvas, "Grid", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        columns: safe,
        gap: 20,
        align: "stretch",
        bg: "transparent",
        borderW: 0,
        ...patch,
    }, { name, parentId }, {
        tablet: { columns: safe >= 4 ? 2 : Math.min(safe, 2) },
        mobile: { columns: 1 },
    });
}

/** A bordered or raised panel — the unit most sections are built from. */
export function card(canvas: Canvas, parentId: string, name: string, patch: Partial<ElementStyle> = {}) {
    const { theme, surface } = canvas;
    return make(canvas, "Container", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "start",
        gap: theme.space.text,
        padT: theme.space.card,
        padR: theme.space.card,
        padB: theme.space.card,
        padL: theme.space.card,
        bg: surface.card,
        color: surface.text,
        borderW: theme.borderWidth,
        borderC: surface.line,
        radius: theme.radius.card,
        shadow: theme.shadow.card,
        ...motion(canvas),
        ...patch,
    }, { name, parentId }, {
        mobile: { padT: Math.max(18, theme.space.card - 6), padR: Math.max(18, theme.space.card - 6), padB: Math.max(18, theme.space.card - 6), padL: Math.max(18, theme.space.card - 6) },
    });
}

/* ------------------------------------------------------------------- text */

type TextRole = "display" | "title" | "cardTitle";

export function heading(
    canvas: Canvas,
    parentId: string,
    text: string,
    role: TextRole = "title",
    patch: Partial<ElementStyle> = {},
) {
    const { theme, surface } = canvas;
    const size = theme.type[role];
    // Tracking tightens as type grows; a 62px headline at default tracking is
    // the clearest tell of a layout nobody looked at.
    const tracking = size >= 44 ? theme.type.tightTracking : size >= 28 ? -0.8 : -0.2;
    return make(canvas, "Heading", {
        widthMode: "fill",
        heightMode: "auto",
        fontFamily: theme.type.headingFamily,
        fontSize: size,
        fontWeight: theme.type.headingWeight,
        lineHeight: size >= 44 ? 1.06 : size >= 28 ? 1.18 : 1.3,
        letterSpacing: tracking,
        color: surface.text,
        ...motion(canvas),
        ...patch,
    }, { name: role === "cardTitle" ? "Card title" : "Heading", parentId }, {
        tablet: { fontSize: Math.round(size * 0.82) },
        // 0.6 of a dramatic display is still 50px, which overflows a 375px
        // viewport; the floor is what actually keeps phones readable.
        mobile: { fontSize: Math.max(role === "cardTitle" ? 17 : 26, Math.round(size * 0.6)), letterSpacing: size >= 44 ? -0.6 : -0.2 },
    });
}

export function text(
    canvas: Canvas,
    parentId: string,
    content: string,
    variant: "body" | "small" = "body",
    patch: Partial<ElementStyle> = {},
) {
    const { theme, surface } = canvas;
    return make(canvas, "Text", {
        widthMode: "fill",
        heightMode: "auto",
        fontFamily: theme.type.bodyFamily,
        fontSize: theme.type[variant],
        lineHeight: 1.65,
        color: surface.muted,
        ...motion(canvas, "fade"),
        ...patch,
    }, { name: "Body", parentId }, { mobile: { fontSize: Math.max(15, theme.type[variant] - 1) } });
}

/** The small uppercase label above a section heading. */
export function eyebrow(canvas: Canvas, parentId: string, content: string, patch: Partial<ElementStyle> = {}) {
    const { theme, surface } = canvas;
    return make(canvas, "Text", {
        widthMode: "auto",
        heightMode: "auto",
        fontFamily: theme.type.bodyFamily,
        fontSize: theme.type.eyebrow,
        fontWeight: "600",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: surface.accent,
        ...motion(canvas, "fade"),
        ...patch,
    }, { name: "Eyebrow", parentId });
}

/* --------------------------------------------------------------- controls */

export type ButtonKind = "primary" | "secondary" | "quiet";

export function button(
    canvas: Canvas,
    parentId: string,
    label: string,
    kind: ButtonKind = "primary",
    patch: Partial<ElementStyle> = {},
) {
    const { theme, surface } = canvas;
    const skin: Partial<ElementStyle> =
        kind === "primary"
            ? { bg: surface.key === "accent" ? surface.text : theme.color.accent, color: surface.key === "accent" ? surface.bg : theme.color.onAccent, borderW: 0 }
            : kind === "secondary"
                ? { bg: "transparent", color: surface.text, borderW: 1, borderC: surface.line }
                : { bg: "transparent", color: surface.muted, borderW: 0, padL: 0, padR: 0 };

    const element = make(canvas, "Button", {
        widthMode: "auto",
        heightMode: "auto",
        layout: "stack",
        direction: "row",
        justify: "center",
        align: "center",
        radius: theme.radius.control,
        padT: 13,
        padR: 24,
        padB: 13,
        padL: 24,
        fontFamily: theme.type.bodyFamily,
        fontSize: theme.type.small + 1,
        fontWeight: "600",
        textAlign: "center",
        cursor: "pointer",
        ...skin,
        ...motion(canvas, "fade"),
        ...patch,
    }, { name: `${kind} action`, parentId });

    // Hover is part of the component, not an optional extra a prompt has to
    // remember to ask for. `scale` is a percentage here, so 102 is subtle.
    element.hover = kind === "quiet"
        ? { color: surface.text }
        : { scale: 102, opacity: 92 };
    element.press = { scale: 98 };
    return element;
}

/** A navigation link: a Button with no chrome, so it stays clickable. */
export function navLink(canvas: Canvas, parentId: string, label: string) {
    return button(canvas, parentId, label, "quiet", {
        fontSize: canvas.theme.type.small + 1,
        fontWeight: "500",
        padT: 6,
        padB: 6,
    });
}

/* ------------------------------------------------------------------ media */

/**
 * A picture with its shape reserved.
 *
 * `aspectRatio` is always set so the layout holds while the image loads, and
 * so a section whose generated image never arrives keeps its proportions
 * instead of collapsing to nothing.
 */
export function image(
    canvas: Canvas,
    parentId: string,
    prompt: string,
    ratio: string,
    patch: Partial<ElementStyle> = {},
) {
    const { theme, surface } = canvas;
    const element = make(canvas, "Image", {
        widthMode: "fill",
        heightMode: "auto",
        aspectRatio: ratio,
        radius: theme.radius.media,
        overflow: "hidden",
        // Visible before the picture arrives, and after it fails.
        bg: alpha(surface.text, 0.06),
        borderW: theme.borderWidth,
        borderC: surface.line,
        ...motion(canvas),
        ...patch,
    }, { name: "Image", parentId, src: "", alt: prompt.slice(0, 120), objectFit: "cover" });
    return element;
}

export function divider(canvas: Canvas, parentId: string, patch: Partial<ElementStyle> = {}) {
    return make(canvas, "Divider", {
        widthMode: "fill",
        heightMode: "auto",
        h: 1,
        bg: canvas.surface.line,
        borderW: 0,
        ...patch,
    }, { name: "Rule", parentId });
}

/** A small pill — counts, tags, plan labels. */
export function chip(canvas: Canvas, parentId: string, label: string, patch: Partial<ElementStyle> = {}) {
    const { theme, surface } = canvas;
    return make(canvas, "Text", {
        widthMode: "auto",
        heightMode: "auto",
        fontFamily: theme.type.bodyFamily,
        fontSize: theme.type.eyebrow,
        fontWeight: "600",
        letterSpacing: 0.4,
        color: surface.key === "page" || surface.key === "panel" ? theme.color.accent : surface.text,
        bg: surface.key === "page" || surface.key === "panel" ? theme.color.accentSoft : alpha(surface.text, 0.12),
        radius: 999,
        padT: 6,
        padR: 12,
        padB: 6,
        padL: 12,
        ...patch,
    }, { name: "Chip", parentId });
}
