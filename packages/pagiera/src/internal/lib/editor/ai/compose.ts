import { createElement } from "../tree";
import type { CanvasElement, ElementStyle, ElementType } from "../types";
import type { Node, Section, Size, TextRole, Tone, Width } from "./dsl";
import { type Backdrop, BACKDROPS, backdropFor, alpha, type Surface, surfaceOf, type Theme } from "./theme";

/**
 * Compiles the model's composition into canvas elements.
 *
 * The division of labour is the whole point. The model owns *structure*: what
 * is beside what, what spans how much, where the rhythm breaks. This file owns
 * everything that can be wrong — colour against its background, type sizes at
 * every breakpoint, whether a row survives a 375px screen — and the model is
 * given no way to express those at all.
 *
 * So the tree can be as strange as the model likes and the page still cannot
 * come out illegible, overflowing or broken on a phone.
 */

/** Colours in play, carried down so a toned box restyles its own subtree. */
type Ctx = {
    theme: Theme;
    surface: Surface;
    depth: number;
    /**
     * Whether this node sits somewhere whose width is already decided.
     *
     * A measure cap is a maximum along the block axis, and this style system
     * has no maximum — only a fixed width, which cannot shrink. That is safe
     * at the top of a section, where the full measure is available, and
     * disastrous inside a grid cell or a row column, where 640px of fixed
     * text pushes the entire page sideways. Once the width has been decided
     * by an ancestor, a measure simply fills instead.
     */
    constrained: boolean;
    /** True inside a pinned section, where rows must stay rows. */
    sticky: boolean;
};

class Builder {
    readonly elements: CanvasElement[] = [];
    private stagger = 0;

    push(element: CanvasElement) {
        this.elements.push(element);
        return element;
    }

    /** Entrance delays are handed out in creation order, which is reading order. */
    nextDelay() {
        const delay = this.stagger;
        this.stagger = Math.min(this.stagger + 60, 480);
        return delay;
    }

    resetStagger() {
        this.stagger = 0;
    }
}

function make(
    builder: Builder,
    type: ElementType,
    style: Partial<ElementStyle>,
    props: Partial<CanvasElement>,
    overrides?: { tablet?: Partial<ElementStyle>; mobile?: Partial<ElementStyle> },
) {
    const element = createElement(type, { x: 0, y: 0, z: builder.elements.length, parentId: props.parentId });
    element.base = { ...element.base, ...style };
    Object.assign(element, props);
    if (overrides?.tablet || overrides?.mobile) element.overrides = { ...element.overrides, ...overrides };
    return builder.push(element);
}

function motion(builder: Builder, effect: "up" | "fade" = "up"): Partial<ElementStyle> {
    return {
        entrance: effect,
        entranceDuration: 620,
        entranceDelay: builder.nextDelay(),
        entranceCurve: "ease",
        entranceBezier: "0.16, 1, 0.3, 1",
    };
}

/* ------------------------------------------------------------------ tokens */

/** The spacing scale, derived from the theme's density rather than fixed. */
function space(theme: Theme, size: Size | undefined, fallback: Size = "md"): number {
    const unit = theme.space.text;
    const scale: Record<Size, number> = {
        none: 0,
        xs: Math.round(unit * 0.5),
        sm: Math.round(unit * 0.85),
        md: unit,
        lg: theme.space.block,
        xl: Math.round(theme.space.block * 1.6),
        "2xl": Math.round(theme.space.block * 2.4),
    };
    return scale[size ?? fallback];
}

type TypeSpec = {
    size: number;
    weight: string;
    lineHeight: number;
    tracking: number;
    /** Floor for the phone, so a display heading cannot overflow a 375px screen. */
    minSize: number;
    heading: boolean;
};

function typeOf(theme: Theme, role: TextRole): TypeSpec {
    const t = theme.type;
    switch (role) {
        case "display":
            return { size: t.display, weight: t.headingWeight, lineHeight: 1.05, tracking: t.tightTracking, minSize: 30, heading: true };
        case "title":
            return { size: t.title, weight: t.headingWeight, lineHeight: 1.14, tracking: -0.9, minSize: 24, heading: true };
        case "subtitle":
            return { size: t.cardTitle, weight: "600", lineHeight: 1.3, tracking: -0.2, minSize: 17, heading: true };
        case "lead":
            return { size: t.body + 3, weight: "400", lineHeight: 1.55, tracking: 0, minSize: 16, heading: false };
        case "body":
            return { size: t.body, weight: "400", lineHeight: 1.65, tracking: 0, minSize: 15, heading: false };
        case "small":
            return { size: t.small, weight: "400", lineHeight: 1.55, tracking: 0, minSize: 13, heading: false };
        case "eyebrow":
            return { size: t.eyebrow, weight: "600", lineHeight: 1.4, tracking: 1.5, minSize: 11, heading: false };
        case "quote":
            return { size: Math.round(t.title * 0.82), weight: "500", lineHeight: 1.35, tracking: -0.5, minSize: 20, heading: true };
        case "number":
            return { size: t.title, weight: t.headingWeight, lineHeight: 1, tracking: -1.2, minSize: 28, heading: true };
        default:
            return { size: t.body, weight: "400", lineHeight: 1.65, tracking: 0, minSize: 15, heading: false };
    }
}

/** A readable line length for the role, or none when the box should fill. */
const MEASURE: Record<Width, number | undefined> = {
    full: undefined,
    measure: 640,
    narrow: 460,
    half: undefined,
    auto: undefined,
};

/**
 * How a node expresses its requested width.
 *
 * A capped measure has to be a *fixed* width, not an `auto` one: the renderer
 * emits `width: auto` for the auto mode and ignores `w` entirely, so a measure
 * expressed that way silently caps nothing and paragraphs run the full width
 * of the band. Fixed caps it — and because a fixed width does not shrink, it
 * is released again on any viewport narrower than the cap, which is what the
 * overrides below are for.
 */
function widthStyle(width: Width | undefined, constrained: boolean, fallbackFill = true): Partial<ElementStyle> {
    if (!width) return fallbackFill ? { widthMode: "fill" } : {};
    if (width === "auto") return { widthMode: "auto" };
    if (width === "half") return { widthMode: "fill", grow: 1 };
    if (width === "full") return { widthMode: "fill" };
    if (constrained) return { widthMode: "fill" };
    return { widthMode: "fixed", w: MEASURE[width] };
}

/** Releases a capped measure once the viewport is narrower than the cap. */
function widthOverrides(width: Width | undefined, constrained: boolean): { tablet?: Partial<ElementStyle>; mobile?: Partial<ElementStyle> } {
    const cap = width && !constrained ? MEASURE[width] : undefined;
    if (!cap) return {};
    return {
        // A tablet is 768 wide with 32px gutters, so anything above ~700 has
        // to let go there too.
        ...(cap > 700 ? { tablet: { widthMode: "fill" as const } } : {}),
        mobile: { widthMode: "fill" as const },
    };
}

/** How a toned box paints itself, and which surface its children inherit. */
function toneStyle(ctx: Ctx, tone: Tone | undefined, rounded: boolean): { style: Partial<ElementStyle>; surface: Surface } {
    const { theme, surface } = ctx;
    const radius = rounded ? theme.radius.card : 0;
    switch (tone) {
        case "card":
            return {
                style: {
                    bg: surface.card,
                    color: surface.text,
                    borderW: theme.borderWidth,
                    borderC: surface.line,
                    radius: rounded ? theme.radius.card : theme.radius.card,
                    shadow: theme.shadow.card,
                },
                // A card keeps the band's text colours; only its fill moved.
                surface,
            };
        case "outline":
            return {
                style: { bg: "transparent", borderW: Math.max(1, theme.borderWidth), borderC: surface.line, radius: rounded ? theme.radius.card : 0 },
                surface,
            };
        case "accent": {
            const next = surfaceOf(theme, "accent");
            return {
                style: {
                    bg: next.bg,
                    gradient: theme.effect.accentGradient,
                    color: next.text,
                    borderW: 0,
                    radius: theme.radius.card,
                    shadow: theme.effect.glow,
                },
                surface: next,
            };
        }
        case "inverse": {
            const next = surfaceOf(theme, "inverse");
            return {
                style: {
                    bg: next.bg,
                    gradient: theme.effect.inverseGradient,
                    color: next.text,
                    borderW: 0,
                    radius: theme.radius.card,
                    shadow: theme.effect.media,
                },
                surface: next,
            };
        }
        default:
            return { style: { bg: "transparent", borderW: 0, radius }, surface };
    }
}

/* --------------------------------------------------------------- responsive */

/**
 * Whether a row should become a column on a phone.
 *
 * Almost every row should — two columns of prose side by side at 375px is
 * unreadable. The exception is a row of controls or labels: a navigation bar
 * or a pair of chips that folds into a column pushes the whole page down and
 * looks broken. Deciding it from what the row actually holds means the model
 * never has to think about breakpoints at all.
 */
function rowFoldsOnMobile(children: Node[], sticky: boolean) {
    // A pinned bar never folds. A navigation that becomes a column takes a
    // third of the viewport and pushes the page down behind it.
    if (sticky) return false;
    if (children.length > 4) return false;
    return !children.every((child) =>
        child.t === "button" ||
        child.t === "chip" ||
        (child.t === "text" && (child.role === "eyebrow" || child.role === "small" || child.role === "subtitle")),
    );
}

/** Column counts step down rather than collapsing straight to one. */
function gridSteps(columns: number) {
    if (columns >= 5) return { tablet: 3, mobile: 1 };
    if (columns === 4) return { tablet: 2, mobile: 1 };
    if (columns === 3) return { tablet: 2, mobile: 1 };
    return { tablet: Math.min(columns, 2), mobile: 1 };
}

/* ---------------------------------------------------------------- compiler */

function compose(builder: Builder, node: Node, parentId: string, ctx: Ctx): void {
    const { theme, surface } = ctx;
    const common: Partial<ElementStyle> = {
        ...(node.span ? { gridSpan: node.span } : {}),
        ...(node.selfAlign ? { alignSelf: node.selfAlign } : {}),
        ...(node.grow !== undefined ? { grow: node.grow } : {}),
    };

    switch (node.t) {
        case "text": {
            const spec = typeOf(theme, node.role);
            const colour = node.tone === "accent"
                ? surface.accentText
                : node.tone === "muted"
                    ? surface.muted
                    : spec.heading || node.role === "lead"
                        ? surface.text
                        : surface.muted;
            const width = node.width ?? (spec.heading ? "full" : "measure");
            const capped = MEASURE[width];
            make(builder, spec.heading ? "Heading" : "Text", {
                ...widthStyle(width, ctx.constrained),
                heightMode: "auto",
                fontFamily: spec.heading ? theme.type.headingFamily : theme.type.bodyFamily,
                fontSize: spec.size,
                fontWeight: spec.weight,
                lineHeight: spec.lineHeight,
                letterSpacing: spec.tracking,
                color: colour,
                textAlign: node.align ?? "left",
                textTransform: node.caps && (node.role === "eyebrow" || node.role === "small") ? "uppercase" : "none",
                ...(capped ? { w: capped } : {}),
                ...motion(builder, spec.heading ? "up" : "fade"),
                ...common,
            }, { name: node.role, parentId, content: node.value }, (() => {
                const release = widthOverrides(width, ctx.constrained);
                return {
                    tablet: spec.size > 30 || release.tablet
                        ? { ...(spec.size > 30 ? { fontSize: Math.round(spec.size * 0.8) } : {}), ...release.tablet }
                        : undefined,
                    mobile: {
                        fontSize: Math.max(spec.minSize, Math.round(spec.size * 0.6)),
                        ...(spec.size >= 44 ? { letterSpacing: -0.5 } : {}),
                        ...release.mobile,
                    },
                };
            })());
            return;
        }

        case "button": {
            const onAccentBand = surface.key === "accent";
            const kind = node.kind ?? "primary";
            const skin: Partial<ElementStyle> =
                kind === "primary"
                    ? {
                          bg: onAccentBand ? surface.text : theme.color.accent,
                          gradient: onAccentBand ? "" : theme.effect.accentGradient,
                          color: onAccentBand ? surface.bg : theme.color.onAccent,
                          borderW: 0,
                          shadow: onAccentBand ? "" : theme.effect.glow,
                      }
                    : kind === "secondary"
                        ? { bg: "transparent", color: surface.text, borderW: 1, borderC: surface.line }
                        : { bg: "transparent", color: surface.muted, borderW: 0, padL: 0, padR: 0 };

            const element = make(builder, "Button", {
                ...widthStyle(node.width ?? "auto", ctx.constrained, false),
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
                ...motion(builder, "fade"),
                ...common,
            }, { name: `${kind} action`, parentId, content: node.label });
            element.hover = kind === "quiet"
                ? { color: surface.text }
                : kind === "primary" && theme.effect.glow
                    ? { scale: 102, shadow: `0 20px 44px -10px ${theme.color.accent}` }
                    : { scale: 102, opacity: 92 };
            element.press = { scale: 98 };
            return;
        }

        case "image": {
            make(builder, "Image", {
                ...widthStyle(node.width ?? "full", ctx.constrained),
                heightMode: "auto",
                aspectRatio: node.ratio ?? "4/3",
                radius: node.rounded === false ? 0 : theme.radius.media,
                overflow: "hidden",
                shadow: theme.effect.media,
                // Visible while the picture loads, and if it never arrives.
                bg: alpha(surface.text, 0.06),
                borderW: theme.borderWidth,
                borderC: surface.line,
                ...motion(builder),
                ...common,
            }, { name: "Image", parentId, src: "", alt: node.prompt.slice(0, 120), objectFit: "cover" });
            return;
        }

        case "chip": {
            make(builder, "Text", {
                widthMode: "auto",
                heightMode: "auto",
                fontFamily: theme.type.bodyFamily,
                fontSize: theme.type.eyebrow,
                fontWeight: "600",
                letterSpacing: 0.4,
                color: surface.key === "page" || surface.key === "panel" ? theme.color.accent : surface.text,
                bg: surface.key === "page" || surface.key === "panel" ? theme.color.accentSoft : alpha(surface.text, 0.14),
                radius: 999,
                padT: 6,
                padR: 12,
                padB: 6,
                padL: 12,
                ...motion(builder, "fade"),
                ...common,
            }, { name: "Chip", parentId, content: node.label });
            return;
        }

        case "rule": {
            make(builder, "Divider", {
                widthMode: "fill",
                heightMode: "auto",
                h: 1,
                bg: surface.line,
                borderW: 0,
                ...common,
            }, { name: "Rule", parentId });
            return;
        }

        case "space": {
            make(builder, "Spacer", {
                widthMode: "fill",
                heightMode: "fixed",
                h: space(theme, node.size, "lg"),
                bg: "transparent",
                borderW: 0,
                ...common,
            }, { name: "Space", parentId });
            return;
        }

        case "grid": {
            const steps = gridSteps(node.columns);
            const grid = make(builder, "Grid", {
                widthMode: "fill",
                heightMode: "auto",
                layout: "stack",
                columns: node.columns,
                gap: space(theme, node.gap, "md"),
                align: node.align ?? "stretch",
                bg: "transparent",
                borderW: 0,
                ...common,
            }, { name: "Grid", parentId }, {
                tablet: { columns: steps.tablet },
                mobile: { columns: steps.mobile },
            });
            for (const child of node.children) {
                // Every grid cell is a column of unknown, usually narrow width.
                compose(builder, child, grid.id, { ...ctx, depth: ctx.depth + 1, constrained: true });
            }
            return;
        }

        case "box": {
            const { style: tone, surface: inner } = toneStyle(ctx, node.tone, node.rounded === true);
            const isRow = node.dir === "row";
            const pad = node.pad ?? (node.tone && node.tone !== "plain" ? "lg" : "none");
            const padding = space(theme, pad, "none");
            const box = make(builder, "Container", {
                ...widthStyle(node.width, ctx.constrained),
                heightMode: "auto",
                layout: "stack",
                direction: isRow ? "row" : "column",
                gap: space(theme, node.gap, isRow ? "md" : "md"),
                align: node.align ?? (isRow ? "center" : "stretch"),
                justify: node.justify ?? "start",
                wrap: node.wrap === true,
                padT: padding,
                padR: padding,
                padB: padding,
                padL: padding,
                ...tone,
                ...common,
            }, { name: isRow ? "Row" : "Column", parentId }, (() => {
                const release = widthOverrides(node.width, ctx.constrained);
                return {
                    tablet: release.tablet,
                    mobile: {
                        ...(isRow && rowFoldsOnMobile(node.children, ctx.sticky)
                            ? { direction: "column" as const, align: "stretch" as const }
                            : isRow
                                ? { direction: "row" as const, wrap: true }
                                : {}),
                        ...(padding > 20 ? { padT: 20, padR: 20, padB: 20, padL: 20 } : {}),
                        ...release.mobile,
                    },
                };
            })());
            // A card is the page's repeated unit, so it is where a hover is felt.
            if (node.tone === "card" && theme.effect.hoverShadow) {
                box.hover = { shadow: theme.effect.hoverShadow, borderC: inner.text };
            }
            for (const child of node.children) {
                compose(builder, child, box.id, {
                    theme,
                    surface: inner,
                    depth: ctx.depth + 1,
                    sticky: ctx.sticky,
                    // A row divides its width among its children, and a box that
                    // took a width of its own has already decided the space
                    // inside it. Either way, a descendant may no longer assume
                    // the section's full measure is available.
                    constrained: ctx.constrained || isRow || (node.width !== undefined && node.width !== "full"),
                });
            }
            return;
        }

        default:
            return;
    }
}

/**
 * The measure every band's content is capped at, page-wide.
 *
 * The renderer centres a Section's content inside this automatically. It is
 * exported because the page's root style has to be set to the same number for
 * that mechanism to engage at all.
 */
export const PAGE_MEASURE = 1320;

/**
 * A section's own measure, expressed as inset rather than as a width.
 *
 * An element cannot carry a maximum width in this style system — only a fixed
 * one, which does not shrink and so overflows every viewport narrower than
 * itself. Insetting the band instead is responsive by construction: the
 * padding simply gets smaller as the screen does, and the renderer's own cap
 * still holds the outer measure.
 */
const SECTION_INSET: Record<NonNullable<Section["width"]>, number> = {
    full: 0,
    wide: 0,
    normal: 70,
    narrow: 210,
};

/**
 * Builds one section into a fresh, self-contained element list.
 *
 * The band and its measure are supplied here rather than by the model: a
 * section that forgets to constrain its content is the difference between a
 * designed page and a text file, and it is not a decision worth risking on a
 * model remembering to make it.
 */
export function composeSection(theme: Theme, section: Section): CanvasElement[] {
    const builder = new Builder();
    const surface = surfaceOf(theme, section.surface ?? "page");
    const ctx: Ctx = { theme, surface, depth: 0, constrained: false, sticky: section.sticky === true };

    const backdrop = (BACKDROPS as readonly string[]).includes(section.backdrop ?? "")
        ? (section.backdrop as Backdrop)
        : undefined;
    const padding = section.pad ? space(theme, section.pad) : theme.space.band;
    const inset = SECTION_INSET[section.width ?? "normal"];
    const gutter = theme.space.gutter + inset;
    const band = make(builder, "Section", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "center",
        gap: 0,
        padT: padding,
        padR: gutter,
        padB: padding,
        padL: gutter,
        bg: surface.bg,
        // An explicit backdrop wins; otherwise the band takes the atmosphere
        // its surface implies. Both are measured against this band's own text,
        // so neither can cost the section its legibility.
        gradient: backdrop
            ? backdropFor(theme, backdrop, surface.bg, surface.text)
            : surface.key === "inverse"
                ? theme.effect.inverseGradient
                : surface.key === "panel"
                    ? theme.effect.bandWash
                    : "",
        overflow: "hidden",
        color: surface.text,
        fontFamily: theme.type.bodyFamily,
        ...(section.sticky
            ? { position: "sticky", pinSide: "top", stickyOffset: 0, zIndex: 50, ...(theme.effect.glass ? { bgOpacity: theme.effect.glass.opacity, backdropBlur: theme.effect.glass.blur } : {}) }
            : {}),
    }, { name: section.name }, {
        tablet: { padT: Math.round(padding * 0.78), padB: Math.round(padding * 0.78), padR: 32 + Math.round(inset * 0.3), padL: 32 + Math.round(inset * 0.3) },
        mobile: { padT: Math.round(padding * 0.58), padB: Math.round(padding * 0.58), padR: 20, padL: 20 },
    });

    const shell = make(builder, "Container", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "stretch",
        gap: theme.space.block,
        bg: "transparent",
        borderW: 0,
    }, { name: "Content", parentId: band.id });

    for (const node of section.content) {
        builder.resetStagger();
        compose(builder, node, shell.id, ctx);
    }

    band.parentId = undefined;
    return builder.elements;
}

/**
 * Composes content for an element that already exists on the page.
 *
 * A scoped run rebuilds one element, and `composeSection` is the wrong tool for
 * it: that function always emits a band — a full-bleed Section carrying the
 * page's vertical rhythm, its own background and a centred measure — which,
 * nested inside an existing hero, produces a page within a page. Asking to
 * revise a hero returned an entire site inside it.
 *
 * Here the nodes are compiled on their own. The caller parents the roots into
 * the element being rebuilt, so what lands is a composition and nothing else.
 */
export function composeFragment(theme: Theme, section: Section): CanvasElement[] {
    const builder = new Builder();
    const surface = surfaceOf(theme, section.surface ?? "page");
    const ctx: Ctx = { theme, surface, depth: 0, constrained: false, sticky: section.sticky === true };

    // A holder that exists only to give the fragment a single root, so the
    // caller has one thing to reparent. It paints nothing and takes no space of
    // its own beyond the gap between the pieces inside it.
    const holder = make(builder, "Container", {
        widthMode: "fill",
        heightMode: "auto",
        layout: "stack",
        direction: "column",
        align: "stretch",
        gap: theme.space.block,
        bg: "transparent",
        borderW: 0,
        padT: 0,
        padR: 0,
        padB: 0,
        padL: 0,
    }, { name: section.name || "Revision" });

    for (const node of section.content) {
        builder.resetStagger();
        compose(builder, node, holder.id, ctx);
    }

    holder.parentId = undefined;
    return builder.elements;
}
