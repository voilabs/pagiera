import type { CSSProperties } from "react";
import { baseOf, type Cascade, chainFor, DEFAULT_CASCADE } from "./cascade";
import {
    type Align,
    type Breakpoint,
    type CanvasElement,
    type ElementStyle,
    type Justify,
    type RootStyle,
    type StyleKey,
} from "./types";

/**
 * Flattens the cascade for one breakpoint: the base values, then each override
 * between the base and this artboard, nearest-to-base first.
 */
export function resolveStyle(
    element: CanvasElement,
    breakpoint: Breakpoint,
    cascade: Cascade = DEFAULT_CASCADE,
): ElementStyle {
    let style = element.base;
    for (const step of chainFor(cascade, breakpoint)) {
        const override = element.overrides?.[step];
        if (override) style = { ...style, ...override };
    }
    return style;
}

/**
 * Which breakpoint actually supplies the value shown for `key` — used to mark
 * a field in the inspector as inherited rather than set here.
 */
export function originOf(
    element: CanvasElement,
    breakpoint: Breakpoint,
    key: StyleKey,
    cascade: Cascade = DEFAULT_CASCADE,
): Breakpoint {
    let origin: Breakpoint = baseOf(cascade).id;
    for (const step of chainFor(cascade, breakpoint)) {
        if (element.overrides?.[step]?.[key] !== undefined) origin = step;
    }
    return origin;
}

export function hasOverride(
    element: CanvasElement,
    breakpoint: Breakpoint,
    key: StyleKey,
    cascade: Cascade = DEFAULT_CASCADE,
) {
    return (
        breakpoint !== baseOf(cascade).id &&
        element.overrides?.[breakpoint]?.[key] !== undefined
    );
}

/**
 * Writes style changes to the right layer: an edit on the base artboard
 * changes the shared values, anywhere else accumulates an override so the
 * other artboards keep theirs.
 */
export function applyStyle(
    element: CanvasElement,
    breakpoint: Breakpoint,
    patch: Partial<ElementStyle>,
    cascade: Cascade = DEFAULT_CASCADE,
): CanvasElement {
    const baseId = baseOf(cascade).id;
    if (breakpoint === baseId) {
        const next = { ...element, base: { ...element.base, ...patch } };
        // The base owns `base`, so an override under its own id is dead weight
        // — usually left behind when the base moved. Clear it as we pass.
        if (next.overrides?.[baseId]) {
            const overrides = { ...next.overrides };
            delete overrides[baseId];
            next.overrides =
                Object.keys(overrides).length > 0 ? overrides : undefined;
        }
        return next;
    }
    return {
        ...element,
        overrides: {
            ...element.overrides,
            [breakpoint]: { ...element.overrides?.[breakpoint], ...patch },
        },
    };
}

/** Keeps a base-breakpoint edit local by snapshotting the affected values on
 * every other artboard before changing the shared desktop base. */
export function applyStyleIsolated(
    element: CanvasElement,
    breakpoint: Breakpoint,
    patch: Partial<ElementStyle>,
    breakpoints: readonly Breakpoint[],
    cascade: Cascade = DEFAULT_CASCADE,
): CanvasElement {
    const keys = Object.keys(patch) as StyleKey[];
    const baseId = baseOf(cascade).id;
    const snapshots = new Map<Breakpoint, ElementStyle>();
    for (const target of breakpoints) {
        if (target !== breakpoint && target !== baseId) {
            snapshots.set(target, resolveStyle(element, target, cascade));
        }
    }
    const updated = applyStyle(element, breakpoint, patch, cascade);
    const overrides = { ...updated.overrides };
    for (const [target, effective] of snapshots) {
        const layer = { ...overrides[target] };
        for (const key of keys) layer[key] = effective[key] as never;
        overrides[target] = layer;
    }
    return { ...updated, overrides };
}

/** Drops overrides for `keys` at this breakpoint so they inherit again. */
export function clearOverrides(
    element: CanvasElement,
    breakpoint: Breakpoint,
    keys: StyleKey[],
    cascade: Cascade = DEFAULT_CASCADE,
): CanvasElement {
    // The base artboard holds the shared values; there is nothing to clear.
    if (breakpoint === baseOf(cascade).id) return element;
    const current = element.overrides?.[breakpoint];
    if (!current) return element;

    const next = { ...current };
    for (const key of keys) delete next[key];

    const overrides = { ...element.overrides };
    if (Object.keys(next).length === 0) delete overrides[breakpoint];
    else overrides[breakpoint] = next;

    return { ...element, overrides };
}

/* ------------------------------------------------------------------ to CSS */

const JUSTIFY_MAP: Record<Justify, CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
};

const ALIGN_MAP: Record<Align, CSSProperties["alignItems"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
};

export type BoxContext = {
    /** How the parent arranges this element; drives positioning vs flex sizing. */
    parentLayout: "absolute" | "stack";
    parentDirection: "row" | "column";
    parentAlign?: Align;
};

/**
 * Turns a resolved style into inline CSS. Positioning depends on the parent:
 * inside an absolute parent the element is placed at x/y, inside a stack it is
 * a flex item whose sizing comes from widthMode/heightMode.
 */
export function styleToCss(
    style: ElementStyle,
    context: BoxContext,
    element?: Pick<CanvasElement, "type">,
): CSSProperties {
    const css: CSSProperties = {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: style.direction,
        gap: style.gap || undefined,
        justifyContent: JUSTIFY_MAP[style.justify],
        alignItems: ALIGN_MAP[style.align],
        flexWrap: style.wrap ? "wrap" : "nowrap",

        paddingTop: style.padT || undefined,
        paddingRight: style.padR || undefined,
        paddingBottom: style.padB || undefined,
        marginBottom: style.marginB || undefined,
        paddingLeft: style.padL || undefined,

        backgroundColor: style.bg || undefined,
        // A gradient and a photo can be layered; the gradient is painted first
        // so it reads as a scrim over the image.
        backgroundImage:
            [style.gradient, style.bgImage && `url("${style.bgImage}")`]
                .filter(Boolean)
                .join(", ") || undefined,
        backgroundSize: style.bgImage ? style.bgSize : undefined,
        backgroundPosition: style.bgImage ? style.bgPosition : undefined,
        backgroundRepeat: style.bgImage ? "no-repeat" : undefined,

        overflow: style.overflow === "visible" ? undefined : style.overflow,
        zIndex: style.zIndex,
        aspectRatio: style.aspectRatio || undefined,
        cursor: style.cursor === "auto" ? undefined : style.cursor,
        mixBlendMode: style.blendMode === "normal" ? undefined : style.blendMode,
        filter: style.blur ? `blur(${style.blur}px)` : undefined,
        backdropFilter: style.backdropBlur
            ? `blur(${style.backdropBlur}px)`
            : undefined,
        color: style.color,
        borderRadius: style.radius || undefined,
        opacity: style.opacity === 100 ? undefined : style.opacity / 100,
        borderWidth: style.borderW || undefined,
        borderColor: style.borderW ? style.borderC : undefined,
        borderStyle: style.borderW ? style.borderStyle : undefined,
        boxShadow: style.shadow || undefined,
        transform:
            [
                style.rotate ? `rotate(${style.rotate}deg)` : "",
                style.scale === 100 ? "" : `scale(${style.scale / 100})`,
            ]
                .filter(Boolean)
                .join(" ") || undefined,

        fontFamily: style.fontFamily === "inherit" ? undefined : style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing || undefined,
        textAlign: style.textAlign,
        textTransform: style.textTransform,
    };

    // Grid and Repeat ignore the flex axis and lay their children out in
    // explicit columns. Repeat renders the same child template once per row,
    // so treating it as a grid is what makes its Columns control meaningful.
    if ((element?.type === "Grid" || element?.type === "Repeat") && style.layout === "stack") {
        css.display = "grid";
        css.gridTemplateColumns = `repeat(${Math.max(1, style.columns)}, minmax(0, 1fr))`;
        css.alignItems = ALIGN_MAP[style.align];
    }

    // An absolute container is still a positioning context for its children.
    if (style.layout === "absolute") {
        css.display = "block";
    }

    // `fixed` answers to the viewport, not to any parent, so it is decided
    // before the parent's layout gets a say — otherwise an absolute parent
    // would quietly turn a fixed navbar back into an absolute one.
    if (style.position === "fixed") {
        css.position = "fixed";
        pinTo(css, style);
        // Across the pinned axis the element keeps its own sizing; along the
        // other one, filling means spanning the viewport rather than a parent
        // that no longer contains it.
        const horizontal = style.pinSide === "left" || style.pinSide === "right";
        if (horizontal) {
            css.height = style.heightMode === "fixed" ? style.h : "auto";
            if (style.heightMode === "fill") { css.top = 0; css.bottom = 0; css.height = "auto"; }
            css.width = style.widthMode === "fixed" ? style.w : "max-content";
        } else {
            css.width = style.widthMode === "fixed" ? style.w : "max-content";
            if (style.widthMode === "fill") { css.left = 0; css.right = 0; css.width = "auto"; }
            css.height = style.heightMode === "fixed" ? style.h : "max-content";
        }
        return css;
    }

    // Either the container places its children freely, or this one element
    // asked to be placed freely inside a container that does not.
    if (context.parentLayout === "absolute" || style.position === "absolute") {
        css.position = "absolute";
        css.left = style.x;
        css.top = style.y;
        css.width = style.widthMode === "fixed" ? style.w : "max-content";
        css.height = style.heightMode === "fixed" ? style.h : "max-content";
        if (style.widthMode === "fill") css.width = "100%";
        if (style.heightMode === "fill") css.height = "100%";

        const transforms: string[] = [];
        if (style.constraintX === "center") {
            css.left = `calc(50% + ${style.x}px)`;
            transforms.push("translateX(-50%)");
        } else if (style.constraintX === "end") {
            css.left = undefined;
            css.right = style.x;
        } else if (style.constraintX === "stretch") {
            css.left = style.x;
            css.right = style.x;
            css.width = "auto";
        }

        if (style.constraintY === "center") {
            css.top = `calc(50% + ${style.y}px)`;
            transforms.push("translateY(-50%)");
        } else if (style.constraintY === "end") {
            css.top = undefined;
            css.bottom = style.y;
        } else if (style.constraintY === "stretch") {
            css.top = style.y;
            css.bottom = style.y;
            css.height = "auto";
        }
        if (css.transform) transforms.push(String(css.transform));
        css.transform = transforms.join(" ") || undefined;
        return css;
    }

    // Sticky only means anything inside a flowing parent; in an absolute one
    // the element is already taken out of the flow above.
    css.position = style.position === "sticky" ? "sticky" : "relative";
    if (style.position === "sticky") pinTo(css, style);

    const mainAxisIsWidth = context.parentDirection === "row";

    applySize(css, "width", style.widthMode, style.w, mainAxisIsWidth, context.parentAlign);
    applySize(css, "height", style.heightMode, style.h, !mainAxisIsWidth, context.parentAlign);

    return css;
}

/**
 * Anchors a pinned element to one edge.
 *
 * Only the chosen edge is written. Setting `top` on something meant to hold the
 * bottom of the screen is the usual reason a "sticky" footer never sticks.
 */
function pinTo(css: CSSProperties, style: ElementStyle) {
    css.top = undefined;
    css.right = undefined;
    css.bottom = undefined;
    css.left = undefined;
    css[style.pinSide] = style.stickyOffset;
}

function applySize(
    css: CSSProperties,
    axis: "width" | "height",
    mode: ElementStyle["widthMode"],
    value: number,
    isMainAxis: boolean,
    parentAlign: Align = "start",
) {
    if (mode === "fixed") {
        css[axis] = value;
        if (isMainAxis) css.flexShrink = 0;
        // An explicit size already wins over the parent's `stretch`.
        return;
    }

    if (mode === "auto") {
        css[axis] = "auto";
        if (isMainAxis) css.flexGrow = 0;
        // Hug content must opt out of stretch, but it should still respect a
        // parent's centre/end alignment. Forcing flex-start here used to make
        // centred eyebrows and buttons appear left-aligned.
        else css.alignSelf = parentAlign === "center"
            ? "center"
            : parentAlign === "end"
                ? "flex-end"
                : "flex-start";
        return;
    }

    // fill
    css[axis] = "auto";
    if (isMainAxis) {
        css.flexGrow = 1;
        css.flexBasis = 0;
    } else {
        css.alignSelf = "stretch";
    }
}

/**
 * A Section is a full-bleed band: its background reaches both edges of the
 * viewport while the content inside stays within the page's content width.
 * Capping the Section itself instead would box the background too, which is
 * why the published page used to sit in a container the canvas never showed.
 *
 * Returns the outer shell and the centred inner box; the inner one keeps the
 * flex/grid layout so children lay out exactly as before.
 */
export function splitBand(
    css: CSSProperties,
    contentWidth: number,
): { shell: CSSProperties; inner: CSSProperties } {
    const inner: CSSProperties = {
        boxSizing: "border-box",
        display: css.display,
        flexDirection: css.flexDirection,
        gap: css.gap,
        justifyContent: css.justifyContent,
        alignItems: css.alignItems,
        flexWrap: css.flexWrap,
        gridTemplateColumns: css.gridTemplateColumns,
        width: "100%",
        maxWidth: contentWidth,
        marginLeft: "auto",
        marginRight: "auto",
    };

    const shell: CSSProperties = { ...css };
    // The inner box owns the layout now.
    shell.flexDirection = undefined;
    shell.gap = undefined;
    shell.justifyContent = undefined;
    shell.alignItems = undefined;
    shell.flexWrap = undefined;
    shell.gridTemplateColumns = undefined;
    shell.display = "block";

    return { shell, inner };
}

/** Whether this element should render as a full-bleed band. */
export function isBand(
    type: string,
    style: ElementStyle,
    root: Pick<RootStyle, "fullWidth">,
) {
    return type === "Section" && style.layout === "stack" && !root.fullWidth;
}

export function rootStyleToCss(root: RootStyle): CSSProperties {
    return {
        boxSizing: "border-box",
        display: root.layout === "stack" ? "flex" : "block",
        flexDirection: root.direction,
        gap: root.gap || undefined,
        alignItems: ALIGN_MAP[root.align],
        paddingTop: root.padT || undefined,
        paddingRight: root.padR || undefined,
        paddingBottom: root.padB || undefined,
        paddingLeft: root.padL || undefined,
        backgroundColor: root.bg,
        fontFamily: root.fontFamily === "inherit" ? undefined : root.fontFamily,
        position: "relative",
        // A freely placed page holds its children out of the normal flow, so
        // nothing gives the root a height and the page would collapse to the
        // viewport with everything below the fold clipped. The authored canvas
        // height is the only thing that knows how tall the design is.
        minHeight: root.layout === "absolute" ? root.canvasHeight : "100%",
        width: "100%",
    };
}
