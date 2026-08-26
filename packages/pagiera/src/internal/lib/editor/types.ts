export const ELEMENT_TYPES = [
    "Frame",
    "Stack",
    "Section",
    "Container",
    "Grid",
    "Heading",
    "Text",
    "Image",
    "Button",
    "Video",
    "Icon",
    "Form",
    "Input",
    "Textarea",
    "Request",
    "Repeat",
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

/** One key/value pair on a request; values may carry `{{…}}` tokens. */
export type RequestPair = { key: string; value: string };

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const DATA_SOURCE_NOT_FOUND_BEHAVIORS = ["empty", "page-404"] as const;
export type DataSourceNotFoundBehavior = (typeof DATA_SOURCE_NOT_FOUND_BEHAVIORS)[number];

/** Methods that carry a request body. */
export function sendsBody(method: HttpMethod) {
    return method === "POST" || method === "PUT" || method === "PATCH";
}

/**
 * A JSON endpoint the page pulls content from. Sources live on the page so a
 * Repeat block can name one without carrying the URL on every element.
 */
export type DataSource = {
    id: string;
    name: string;
    url: string;
    /** Dotted path to the array inside the payload; "" when it is the root. */
    path: string;
    method?: HttpMethod;
    /** JSON body for POST/PUT/PATCH; tokens are resolved before sending. */
    body?: string;
    /** Appended to the URL as a query string. */
    params?: RequestPair[];
    /** Sent as request headers — for API keys and the like. */
    headers?: RequestPair[];
    /** Controls whether an upstream 404 empties this source or rejects the whole page. */
    onNotFound?: DataSourceNotFoundBehavior;
};

/**
 * Values a request token can read. Everything else resolves to an empty
 * string, so a typo cannot leak an unrelated value into the URL.
 */
export type RequestContext = {
    /** The visitor's query string, e.g. `{{query.id}}` on /post?id=5. */
    query: Record<string, string>;
    /** Values captured by a dynamic page path, e.g. `{{params.slug}}`. */
    params: Record<string, string>;
    /** The page being rendered, e.g. `{{page.slug}}`. */
    page: { slug: string };
};

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";

/* ------------------------------------------------------------- breakpoints */

export const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;
export type Breakpoint = string;

export type BreakpointDefinition = {
    id: string;
    name: string;
    width: number;
};

export const DEFAULT_BREAKPOINTS: BreakpointDefinition[] = [
    { id: "desktop", name: "Desktop", width: 1280 },
    { id: "tablet", name: "Tablet", width: 768 },
    { id: "mobile", name: "Mobile", width: 375 },
];

export const BREAKPOINT_WIDTHS: Record<string, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};

/**
 * Styles cascade from the widest breakpoint down, so a value set on desktop
 * holds everywhere until a narrower breakpoint overrides it.
 */
export const BREAKPOINT_CHAIN: Record<string, Breakpoint[]> = {
    desktop: ["desktop"],
    tablet: ["desktop", "tablet"],
    mobile: ["desktop", "tablet", "mobile"],
};

/* ------------------------------------------------------------------ styles */

/** `fill` stretches to the parent, `auto` shrinks to the content. */
export type SizeMode = "fixed" | "fill" | "auto";
export type Constraint = "start" | "center" | "end" | "stretch";
/** `absolute` positions children by x/y; `stack` lays them out with flexbox. */
export type LayoutMode = "absolute" | "stack";
export type Direction = "row" | "column";
export type Justify = "start" | "center" | "end" | "between";
export type Align = "start" | "center" | "end" | "stretch";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export type ObjectFit = "cover" | "contain" | "fill" | "none";
export type Overflow = "visible" | "hidden" | "auto" | "scroll";
export type Entrance = "none" | "fade" | "up" | "down" | "left" | "right" | "zoom";
export type MotionCurve = "ease" | "spring";
export type CursorStyle = "auto" | "default" | "pointer" | "text" | "grab" | "zoom-in" | "none";
/**
 * How an element sits relative to its siblings.
 *
 * `absolute` is per element, not per container: it lifts this one out of the
 * flow and places it at x/y while everything around it keeps stacking. Making
 * the whole parent free instead would move every sibling to satisfy one of
 * them.
 */
export type PositionMode = "static" | "sticky" | "fixed" | "absolute";
/** Which edge a pinned element holds to. */
export type PinSide = "top" | "bottom" | "left" | "right";
export type BgSize = "cover" | "contain" | "auto";
export type BlendMode =
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "difference"
    | "luminosity";
export type BorderStyle = "solid" | "dashed" | "dotted";

export type ElementStyle = {
    // Box — x/y only apply inside an `absolute` parent.
    x: number;
    y: number;
    constraintX: Constraint;
    constraintY: Constraint;
    w: number;
    h: number;
    widthMode: SizeMode;
    heightMode: SizeMode;

    // How this element arranges its own children.
    layout: LayoutMode;
    direction: Direction;
    gap: number;
    padT: number;
    padR: number;
    padB: number;
    padL: number;
    /**
     * Space held below the element, outside its own box.
     *
     * Separate from `padB` on purpose: padding is the breathing room the
     * author gave the content inside a section, while this is the distance to
     * whatever comes next. Sharing one value would make adjusting the rhythm
     * between sections quietly reflow their insides.
     */
    marginB: number;
    justify: Justify;
    align: Align;
    wrap: boolean;
    /** Grid columns; only read when `layout` is `stack` on a Grid element. */
    columns: number;

    // Appearance
    bg: string;
    /** A full CSS gradient value, or "" for none. Painted over `bg`. */
    gradient: string;
    color: string;
    radius: number;
    opacity: number;
    borderW: number;
    /** Per-edge override; null inherits borderW. */
    borderT: number | null;
    borderR: number | null;
    borderB: number | null;
    borderL: number | null;
    borderC: string;
    borderStyle: BorderStyle;
    /** A full CSS box-shadow value, or "" for none. */
    shadow: string;
    rotate: number;

    // Typography
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
    letterSpacing: number;
    textAlign: TextAlign;
    textTransform: TextTransform;

    // Composition — the pieces that make a layout feel designed rather than
    // stacked: clipping, sticky rails, imagery, glass and blend effects.
    overflow: Overflow;
    position: PositionMode;
    /** CSS stacking order, independent from the internal document order. */
    zIndex: number;
    /** Distance from `pinSide` while pinned; read when position is sticky or fixed. */
    stickyOffset: number;
    /** Edge a sticky or fixed element pins to. */
    pinSide: PinSide;
    /** Background image URL, or "" for none. Painted over `gradient`. */
    bgImage: string;
    bgSize: BgSize;
    bgPosition: string;
    /** Blurs the element's own content, in px. */
    blur: number;
    /** Blurs whatever sits behind the element, in px — the glass effect. */
    backdropBlur: number;
    blendMode: BlendMode;
    /** Percent; 100 leaves the element alone. */
    scale: number;
    /** A CSS ratio such as "16/9", or "" to leave height to the layout. */
    aspectRatio: string;

    /** Entrance effect, played once when the element scrolls into view. */
    entrance: Entrance;
    /** Milliseconds. */
    entranceDuration: number;
    entranceDelay: number;
    entranceCurve: MotionCurve;
    entranceBezier: string;
    springStiffness: number;
    springDamping: number;
    cursor: CursorStyle;

    /** Hidden at this breakpoint. */
    hidden: boolean;
};

export const STYLE_KEYS = [
    "x",
    "y",
    "constraintX",
    "constraintY",
    "w",
    "h",
    "widthMode",
    "heightMode",
    "layout",
    "direction",
    "gap",
    "padT",
    "padR",
    "padB",
    "padL",
    "marginB",
    "justify",
    "align",
    "wrap",
    "columns",
    "bg",
    "gradient",
    "color",
    "radius",
    "opacity",
    "borderW",
    "borderT",
    "borderR",
    "borderB",
    "borderL",
    "borderC",
    "borderStyle",
    "shadow",
    "rotate",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "textTransform",
    "overflow",
    "position",
    "zIndex",
    "stickyOffset",
    "pinSide",
    "bgImage",
    "bgSize",
    "bgPosition",
    "blur",
    "backdropBlur",
    "blendMode",
    "scale",
    "aspectRatio",
    "entrance",
    "entranceDuration",
    "entranceDelay",
    "entranceCurve",
    "entranceBezier",
    "springStiffness",
    "springDamping",
    "cursor",
    "hidden",
] as const satisfies ReadonlyArray<keyof ElementStyle>;

export type StyleKey = (typeof STYLE_KEYS)[number];

export type CanvasElement = {
    id: string;
    type: ElementType;
    name?: string;
    parentId?: string;
    z: number;
    locked?: boolean;
    /** Page-local reusable component metadata. */
    componentRole?: "master" | "instance";
    componentId?: string;
    componentSourceId?: string;
    variant?: string;
    styleBindings?: Partial<Record<StyleKey, string>>;

    // Content is shared across breakpoints.
    content?: string;
    /** Sandboxed HTML/CSS used by code components. */
    code?: string;
    src?: string;
    alt?: string;
    objectFit?: ObjectFit;
    iconName?: PagieraIconName;
    placeholder?: string;
    fieldName?: string;
    inputType?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
    required?: boolean;
    formAction?: string;
    formMethod?: HttpMethod;
    formSubmitMode?: "request" | "native";
    formContentType?: "json" | "form-data" | "urlencoded";
    /** Optional request body. `{{form.email}}` tokens read submitted fields. */
    formBody?: string;
    /** One `Header: value` pair per line. */
    formHeaders?: string;
    formSuccessMessage?: string;
    formErrorMessage?: string;
    formResetOnSuccess?: boolean;
    buttonType?: "button" | "submit" | "reset";
    href?: string;
    target?: "_self" | "_blank";
    interaction?: {
        trigger: "click";
        action: "navigate" | "scroll-to" | "toggle-layer" | "show-layer" | "hide-layer";
        value: string;
        target?: "_self" | "_blank";
    };

    /** Data source read by a Request/Repeat block or a directly-bound element. */
    sourceId?: string;
    /**
     * Inside Request/Repeat, pulls this field off the current object instead
     * of using the element's content. Dotted paths work: "author.name".
     */
    binding?: string;

    /** Desktop values; every breakpoint falls back to these. */
    base: ElementStyle;
    /** Narrower-breakpoint deltas, applied over `base` in cascade order. */
    overrides?: Record<string, Partial<ElementStyle>>;
    /** Applied on pointer hover, on top of the resolved breakpoint style. */
    hover?: Partial<ElementStyle>;
    /** Applied while the pointer is pressed. */
    press?: Partial<ElementStyle>;
    loop?: { type: "pulse" | "float" | "spin"; duration: number };
    draggable?: boolean;
};

/* ---------------------------------------------------------------- defaults */

export const BASE_STYLE: ElementStyle = {
    x: 0,
    y: 0,
    constraintX: "start",
    constraintY: "start",
    w: 200,
    h: 100,
    widthMode: "fixed",
    heightMode: "fixed",

    layout: "absolute",
    direction: "column",
    gap: 0,
    padT: 0,
    padR: 0,
    padB: 0,
    padL: 0,
    marginB: 0,
    justify: "start",
    align: "start",
    wrap: false,
    columns: 3,

    bg: "transparent",
    gradient: "",
    color: "#27272a",
    radius: 0,
    opacity: 100,
    borderW: 0,
    borderT: null,
    borderR: null,
    borderB: null,
    borderL: null,
    borderC: "transparent",
    borderStyle: "solid",
    shadow: "",
    rotate: 0,

    fontFamily: "inherit",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: "left",
    textTransform: "none",

    overflow: "visible",
    position: "static",
    zIndex: 0,
    stickyOffset: 0,
    pinSide: "top",
    bgImage: "",
    bgSize: "cover",
    bgPosition: "center",
    blur: 0,
    backdropBlur: 0,
    blendMode: "normal",
    scale: 100,
    aspectRatio: "",

    entrance: "none",
    entranceDuration: 600,
    entranceDelay: 0,
    entranceCurve: "ease",
    entranceBezier: "0.44, 0, 0.56, 1",
    springStiffness: 300,
    springDamping: 30,
    cursor: "auto",

    hidden: false,
};

export function makeStyle(overrides: Partial<ElementStyle>): ElementStyle {
    return { ...BASE_STYLE, ...overrides };
}

/** Every field a freshly dropped element starts with. */
export const ELEMENT_DEFAULTS: Record<
    ElementType,
    { style: Partial<ElementStyle>; props?: Partial<CanvasElement> }
> = {
    Frame: {
        style: {
            w: 640,
            h: 420,
            widthMode: "fixed",
            heightMode: "fixed",
            layout: "absolute",
            direction: "column",
            overflow: "hidden",
            bg: "#ffffff",
            borderW: 1,
            borderC: "#e4e4e7",
            radius: 12,
        },
    },
    Stack: {
        style: {
            w: 600,
            h: 160,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 16,
            padT: 0,
            padR: 0,
            padB: 0,
            padL: 0,
            justify: "start",
            align: "stretch",
            bg: "transparent",
        },
    },
    Section: {
        style: {
            w: 1280,
            h: 480,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 24,
            padT: 64,
            padR: 48,
            padB: 64,
            padL: 48,
            justify: "start",
            align: "stretch",
            bg: "#ffffff",
        },
    },
    Container: {
        style: {
            w: 600,
            h: 240,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 16,
            padT: 24,
            padR: 24,
            padB: 24,
            padL: 24,
            align: "stretch",
            bg: "transparent",
            borderW: 1,
            borderC: "#e4e4e7",
            radius: 12,
        },
    },
    Grid: {
        style: {
            w: 900,
            h: 300,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "row",
            columns: 3,
            gap: 24,
            align: "stretch",
        },
    },
    Heading: {
        style: {
            w: 480,
            h: 48,
            widthMode: "fill",
            heightMode: "auto",
            fontSize: 40,
            fontWeight: "bold",
            lineHeight: 1.2,
            letterSpacing: -0.5,
            color: "#18181b",
        },
        props: { content: "Heading" },
    },
    Text: {
        style: {
            w: 480,
            h: 24,
            widthMode: "fill",
            heightMode: "auto",
            fontSize: 16,
            lineHeight: 1.6,
            color: "#52525b",
        },
        props: { content: "Text block content" },
    },
    Image: {
        style: { w: 400, h: 260, widthMode: "fill", bg: "#e4e4e7", radius: 12 },
        props: { src: "", alt: "", objectFit: "cover" },
    },
    Button: {
        style: {
            w: 140,
            h: 44,
            widthMode: "auto",
            heightMode: "auto",
            layout: "stack",
            direction: "row",
            justify: "center",
            align: "center",
            padT: 12,
            padR: 22,
            padB: 12,
            padL: 22,
            bg: "#2563eb",
            color: "#ffffff",
            radius: 8,
            fontSize: 15,
            fontWeight: "500",
            textAlign: "center",
        },
        props: { content: "Button", href: "", target: "_self", buttonType: "button" },
    },
    Video: {
        style: { w: 640, h: 360, widthMode: "fill", bg: "#18181b", radius: 12 },
        props: { src: "" },
    },
    Icon: {
        style: { w: 24, h: 24, widthMode: "fixed", heightMode: "fixed", color: "#5402E6" },
        props: { iconName: "star" },
    },
    Form: {
        style: {
            w: 560,
            h: 240,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 14,
            align: "stretch",
        },
        props: {
            formAction: "",
            formMethod: "POST",
            formSubmitMode: "request",
            formContentType: "json",
            formSuccessMessage: "Sent successfully.",
            formErrorMessage: "Something went wrong.",
        },
    },
    Input: {
        style: {
            w: 320,
            h: 46,
            widthMode: "fill",
            heightMode: "fixed",
            padT: 0,
            padR: 14,
            padB: 0,
            padL: 14,
            bg: "#ffffff",
            color: "#18181b",
            borderW: 1,
            borderC: "#d4d4d8",
            radius: 10,
            fontSize: 15,
        },
        props: { placeholder: "Enter a value…", fieldName: "field", inputType: "text" },
    },
    Textarea: {
        style: {
            w: 320,
            h: 120,
            widthMode: "fill",
            heightMode: "fixed",
            padT: 12,
            padR: 14,
            padB: 12,
            padL: 14,
            bg: "#ffffff",
            color: "#18181b",
            borderW: 1,
            borderC: "#d4d4d8",
            radius: 10,
            fontSize: 15,
        },
        props: { placeholder: "Write your message…", fieldName: "message" },
    },
    Request: {
        style: {
            w: 900,
            h: 200,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 16,
            align: "stretch",
        },
        props: { sourceId: "" },
    },
    Repeat: {
        style: {
            w: 900,
            h: 200,
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "row",
            gap: 24,
            align: "stretch",
            wrap: true,
        },
        props: { sourceId: "" },
    },
};

/* ----------------------------------------------------------------- helpers */

const CONTAINER_TYPES: ReadonlySet<ElementType> = new Set([
    "Frame",
    "Stack",
    "Section",
    "Container",
    "Grid",
    "Button",
    "Form",
    "Request",
    "Repeat",
]);

/** Whether an element can hold children. */
export function isContainer(type: ElementType) {
    return CONTAINER_TYPES.has(type);
}

const TEXTUAL_TYPES: ReadonlySet<ElementType> = new Set([
    "Heading",
    "Text",
    "Button",
]);

/** Whether an element renders editable text. */
export function isTextual(type: ElementType) {
    return TEXTUAL_TYPES.has(type);
}

/** Page-level settings; the canvas behaves as the root container. */
export type RootStyle = {
    documentMode: "page" | "component";
    /** Content is centred inside this width unless `fullWidth` is set. */
    maxWidth: number;
    /** Editable design-surface height; the public page can still grow with content. */
    canvasHeight: number;
    /** Let content run edge to edge instead of being capped at `maxWidth`. */
    fullWidth: boolean;
    bg: string;
    layout: LayoutMode;
    direction: Direction;
    gap: number;
    padT: number;
    padR: number;
    padB: number;
    padL: number;
    align: Align;
    fontFamily: string;
    /** Cross-document animation used by links on the published site. */
    pageTransition: "smooth" | "fade" | "slide" | "none";
    /** Duration of the incoming published-page animation in milliseconds. */
    pageTransitionDuration: number;
    /** User-defined viewport previews, ordered from widest to narrowest. */
    breakpoints?: BreakpointDefinition[];
    /** The breakpoint whose values live in every element's `base` style. */
    baseBreakpointId?: string;
    variables?: DesignVariable[];
    customFonts?: CustomFont[];
    /**
     * Raw CSS appended after the generated sheet, so it can override any rule
     * the builder produced. Escape hatch for what the inspector cannot express.
     */
    customCss?: string;
    /**
     * Raw JavaScript run on the published page, after the document parses.
     *
     * It is deliberately never executed inside the editor: the canvas and the
     * template preview both render without scripting, so a page cannot reach
     * the editor it is being built in.
     */
    customJs?: string;
};

export type CustomFont = { id: string; name: string; url: string; weight: number; style: "normal" | "italic" };

export type DesignVariable = {
    id: string;
    name: string;
    type: "color" | "number";
    value: string | number;
};

export const DEFAULT_ROOT_STYLE: RootStyle = {
    documentMode: "page",
    maxWidth: 1280,
    canvasHeight: 800,
    fullWidth: false,
    bg: "#ffffff",
    layout: "stack",
    direction: "column",
    gap: 0,
    padT: 0,
    padR: 0,
    padB: 0,
    padL: 0,
    align: "stretch",
    fontFamily: "inherit",
    pageTransition: "smooth",
    pageTransitionDuration: 380,
};

export const FONT_STACKS: Array<{ label: string; value: string }> = [
    { label: "Inherit", value: "inherit" },
    { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
    { label: "Serif", value: "ui-serif, Georgia, serif" },
    { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
];

export const SHADOW_PRESETS: Array<{ label: string; value: string }> = [
    { label: "None", value: "" },
    { label: "Small", value: "0 1px 2px rgba(0,0,0,0.06)" },
    { label: "Medium", value: "0 4px 12px rgba(0,0,0,0.08)" },
    { label: "Large", value: "0 12px 32px rgba(0,0,0,0.12)" },
    { label: "Glow", value: "0 0 0 4px rgba(37,99,235,0.15)" },
];

export const ASPECT_RATIOS: Array<{ label: string; value: string }> = [
    { label: "Free", value: "" },
    { label: "Square 1:1", value: "1/1" },
    { label: "Photo 4:3", value: "4/3" },
    { label: "Wide 16:9", value: "16/9" },
    { label: "Ultra 21:9", value: "21/9" },
    { label: "Portrait 3:4", value: "3/4" },
];

export const ENTRANCES: Array<{ label: string; value: Entrance }> = [
    { label: "None", value: "none" },
    { label: "Fade in", value: "fade" },
    { label: "Rise up", value: "up" },
    { label: "Drop down", value: "down" },
    { label: "Slide from left", value: "left" },
    { label: "Slide from right", value: "right" },
    { label: "Zoom in", value: "zoom" },
];

export const DRAG_MIME = "application/pagiera-element-type";
/** Set when dragging an element that already exists on the canvas. */
export const MOVE_MIME = "application/pagiera-element-id";
import type { PagieraIconName } from "../../../icon-names";
