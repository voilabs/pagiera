/**
 * The layout language the model writes.
 *
 * The engine this replaces asked the model to pick a block from a menu of
 * twelve and a layout from a menu of three. That guaranteed a page could never
 * be broken, and guaranteed just as firmly that it could never be new: every
 * result was an assembly of compositions written in advance, so no amount of
 * prompting could produce a page nobody had already drawn.
 *
 * Here the model composes freely — it nests rows, columns and grids, decides
 * spans and rhythm, and places type by role — but it still cannot express
 * anything invalid. Freedom is granted over *composition*; none is granted
 * over pixels, colour or responsiveness. There are no sizes in this language,
 * no hex values and no breakpoints: a `gap` is "lg", not 48, and what "lg"
 * means is the theme's business. That split is what lets the output be both
 * bespoke and unbreakable.
 */

/* -------------------------------------------------------------- vocabulary */

/** Spacing, as steps on the theme's scale rather than pixels. */
export const SIZES = ["none", "xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type Size = (typeof SIZES)[number];

/**
 * What a piece of text *is*, not how big it is.
 *
 * The theme decides the size, weight, tracking and how each behaves on a
 * phone, so a display heading is never 96px on a 375px screen by accident.
 */
export const TEXT_ROLES = [
    "display",
    "title",
    "subtitle",
    "body",
    "lead",
    "small",
    "eyebrow",
    "quote",
    "number",
] as const;
export type TextRole = (typeof TEXT_ROLES)[number];

export const TEXT_TONES = ["normal", "muted", "accent"] as const;
export type TextTone = (typeof TEXT_TONES)[number];

/** How a box is filled. Resolved against the band it sits on. */
export const TONES = ["plain", "card", "accent", "inverse", "outline"] as const;
export type Tone = (typeof TONES)[number];

export const BUTTON_KINDS = ["primary", "secondary", "quiet"] as const;
export type ButtonKind = (typeof BUTTON_KINDS)[number];

export const ALIGNS = ["start", "center", "end", "stretch"] as const;
export type Align = (typeof ALIGNS)[number];

export const JUSTIFIES = ["start", "center", "end", "between"] as const;
export type Justify = (typeof JUSTIFIES)[number];

export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

/**
 * How wide a box wants to be.
 *
 * `measure` is the one that matters: it caps a column at a readable line
 * length, which is the difference between a paragraph and a wall of text on a
 * wide monitor. The model asks for the intent; the theme supplies the number.
 */
export const WIDTHS = ["full", "measure", "narrow", "auto", "half"] as const;
export type Width = (typeof WIDTHS)[number];

export const RATIOS = ["1/1", "4/3", "3/2", "16/9", "21/9", "4/5", "3/4", "9/16"] as const;
export type Ratio = (typeof RATIOS)[number];

/* ------------------------------------------------------------------ nodes */

type Common = {
    /** Columns this node spans when its parent is a grid. */
    span?: number;
    /** Overrides the parent's cross-axis alignment for this child alone. */
    selfAlign?: Align;
    /** Share of leftover space along the parent's main axis. */
    grow?: number;
};

export type BoxNode = Common & {
    t: "box";
    dir?: "row" | "column";
    gap?: Size;
    pad?: Size;
    align?: Align;
    justify?: Justify;
    width?: Width;
    wrap?: boolean;
    tone?: Tone;
    /** Rounds and clips the box. Only meaningful with a tone or an image. */
    rounded?: boolean;
    children: Node[];
};

export type GridNode = Common & {
    t: "grid";
    columns: number;
    gap?: Size;
    align?: Align;
    children: Node[];
};

export type TextNode = Common & {
    t: "text";
    role: TextRole;
    value: string;
    tone?: TextTone;
    align?: TextAlign;
    width?: Width;
    /** Sets the text in capitals. Only honoured for eyebrow and small. */
    caps?: boolean;
};

export type ButtonNode = Common & { t: "button"; label: string; kind?: ButtonKind; width?: Width };
export type ImageNode = Common & { t: "image"; prompt: string; ratio?: Ratio; rounded?: boolean; width?: Width };
export type RuleNode = Common & { t: "rule" };
export type ChipNode = Common & { t: "chip"; label: string };
export type SpaceNode = Common & { t: "space"; size?: Size };

export type Node =
    | BoxNode
    | GridNode
    | TextNode
    | ButtonNode
    | ImageNode
    | RuleNode
    | ChipNode
    | SpaceNode;

/** The band a section paints itself on. */
export const SURFACES = ["page", "panel", "inverse", "accent"] as const;
export type SurfaceKey = (typeof SURFACES)[number];

export type Section = {
    /** Shown in the layers panel and the progress stream. */
    name: string;
    surface?: SurfaceKey;
    /** The measure the section's content sits inside. */
    width?: "full" | "wide" | "normal" | "narrow";
    /** Vertical breathing room. Defaults to the theme's band rhythm. */
    pad?: Size;
    /** Pins the section to the top of the viewport — for a navigation bar. */
    sticky?: boolean;
    /** An atmospheric background painted behind the content. */
    backdrop?: string;
    content: Node[];
};

/* ------------------------------------------------------------- normalising */

/**
 * The limits that make an arbitrary tree safe to build.
 *
 * These are not style rules — the model is free to compose anything within
 * them. They exist so a runaway or malformed answer cannot produce a page that
 * takes minutes to render or nests a hundred deep.
 */
export const LIMITS = {
    maxDepth: 7,
    maxNodesPerSection: 140,
    maxSections: 14,
    maxColumns: 6,
    maxSpan: 6,
    maxTextLength: 600,
};

/**
 * The children of a node, however the provider chose to encode them.
 *
 * A JSON Schema array of free-form objects is not expressed the same way by
 * every model: several wrap it in a single-key object — `{"item": [...]}` —
 * and some return one node where an array was asked for. Treating only a real
 * array as valid meant those answers produced a container with no children,
 * which then collapsed, which emptied the section, which failed the whole
 * request. The shape is trivially recoverable, so it is recovered.
 */
function childArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    for (const key of ["item", "items", "children", "nodes", "list", "elements", "value"]) {
        if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    // A lone node written where an array was expected.
    return "t" in record || "type" in record || "kind" in record ? [record] : [];
}

/** Numbers arrive as numeric strings often enough to be worth accepting. */
function asNumber(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return Number.NaN;
}

/** So does `"true"`, where a boolean was asked for. */
const asBoolean = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

const clampInt = (value: unknown, low: number, high: number, fallback: number) => {
    const number = Math.round(asNumber(value));
    return Number.isFinite(number) ? Math.min(high, Math.max(low, number)) : fallback;
};

const oneOf = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
    typeof value === "string" && (values as readonly string[]).includes(value) ? (value as T) : undefined;

const clean = (value: unknown, limit = LIMITS.maxTextLength) =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "";

/** Copy the model reaches for when it has nothing to say. */
const PLACEHOLDER = /^(lorem|ipsum|placeholder|your (text|headline|content)|heading|body text|text block|click here|button|label|title|subtitle|section \d+)$/i;

function realText(value: unknown, limit?: number) {
    const text = clean(value, limit);
    return PLACEHOLDER.test(text) ? "" : text;
}

/**
 * Turns whatever the model produced into a tree the compiler can walk.
 *
 * Every unknown value is dropped rather than defaulted loudly, every empty
 * container collapses, and anything past the limits is truncated. A node that
 * cannot mean anything — text with no words, a box with no children — is
 * removed instead of being rendered as a gap, because an empty box on a page
 * reads as a bug even when it was technically what was asked for.
 */
function normalizeNode(raw: unknown, depth: number, budget: { left: number }): Node | null {
    if (!raw || typeof raw !== "object" || budget.left <= 0) return null;
    const node = raw as Record<string, unknown>;
    budget.left -= 1;

    const common: Common = {
        span: node.span === undefined ? undefined : clampInt(node.span, 1, LIMITS.maxSpan, 1),
        selfAlign: oneOf(ALIGNS, node.selfAlign),
        grow: node.grow === undefined ? undefined : clampInt(node.grow, 0, 12, 0),
    };

    // Models name the container by several words; they all mean one box.
    const kind = clean(node.t ?? node.type ?? node.kind, 20).toLowerCase();

    if (kind === "text" || kind === "heading" || kind === "paragraph") {
        const value = realText(node.value ?? node.content ?? node.text);
        if (!value) return null;
        return {
            ...common,
            t: "text",
            role: oneOf(TEXT_ROLES, node.role) ?? "body",
            value,
            tone: oneOf(TEXT_TONES, node.tone),
            align: oneOf(TEXT_ALIGNS, node.align),
            width: oneOf(WIDTHS, node.width),
            caps: asBoolean(node.caps),
        };
    }

    if (kind === "button" || kind === "link" || kind === "cta") {
        const label = realText(node.label ?? node.value ?? node.text, 60);
        if (!label) return null;
        return { ...common, t: "button", label, kind: oneOf(BUTTON_KINDS, node.kind), width: oneOf(WIDTHS, node.width) };
    }

    if (kind === "image" || kind === "media" || kind === "photo") {
        const prompt = clean(node.prompt ?? node.alt ?? node.value, 400);
        // An image with nothing to show is a grey rectangle, which is worse
        // than the composition simply not having one.
        if (!prompt) return null;
        return { ...common, t: "image", prompt, ratio: oneOf(RATIOS, node.ratio), rounded: node.rounded === undefined || asBoolean(node.rounded) };
    }

    if (kind === "chip" || kind === "badge" || kind === "tag" || kind === "pill") {
        const label = realText(node.label ?? node.value ?? node.text, 40);
        if (!label) return null;
        return { ...common, t: "chip", label };
    }

    if (kind === "rule" || kind === "divider" || kind === "hr") return { ...common, t: "rule" };
    if (kind === "space" || kind === "spacer") {
        return { ...common, t: "space", size: oneOf(SIZES, node.size) };
    }

    // Anything else is treated as a container, which is what an unrecognised
    // node almost always is.
    const rawChildren = childArray(node.children ?? node.items ?? node.content);
    const children = depth >= LIMITS.maxDepth
        ? []
        : rawChildren.flatMap((child) => {
              const built = normalizeNode(child, depth + 1, budget);
              return built ? [built] : [];
          });
    // A container with nothing in it contributes only empty space.
    if (children.length === 0) return null;

    if (kind === "grid" || Number.isFinite(asNumber(node.columns))) {
        return {
            ...common,
            t: "grid",
            columns: clampInt(node.columns, 1, LIMITS.maxColumns, Math.min(children.length, 3)),
            gap: oneOf(SIZES, node.gap),
            align: oneOf(ALIGNS, node.align),
            children,
        };
    }

    return {
        ...common,
        t: "box",
        dir: node.dir === "row" || node.direction === "row" ? "row" : "column",
        gap: oneOf(SIZES, node.gap),
        pad: oneOf(SIZES, node.pad),
        align: oneOf(ALIGNS, node.align),
        justify: oneOf(JUSTIFIES, node.justify),
        width: oneOf(WIDTHS, node.width),
        wrap: asBoolean(node.wrap),
        tone: oneOf(TONES, node.tone),
        rounded: asBoolean(node.rounded),
        children,
    };
}

/** True when a subtree contains anything a reader would actually see. */
function hasSubstance(node: Node): boolean {
    if (node.t === "text" || node.t === "button" || node.t === "chip" || node.t === "image") return true;
    if (node.t === "box" || node.t === "grid") return node.children.some(hasSubstance);
    return false;
}

export function normalizeSection(raw: unknown, index: number): Section | null {
    if (!raw || typeof raw !== "object") return null;
    const section = raw as Record<string, unknown>;
    const budget = { left: LIMITS.maxNodesPerSection };
    const rawContent = childArray(section.content ?? section.children);
    const content = rawContent.flatMap((node) => {
        const built = normalizeNode(node, 1, budget);
        return built ? [built] : [];
    });
    if (!content.some(hasSubstance)) return null;

    return {
        name: clean(section.name, 40) || `Section ${index + 1}`,
        surface: oneOf(SURFACES, section.surface),
        width: oneOf(["full", "wide", "normal", "narrow"] as const, section.width),
        pad: oneOf(SIZES, section.pad),
        sticky: asBoolean(section.sticky),
        backdrop: clean(section.backdrop, 20).toLowerCase() || undefined,
        content,
    };
}

/**
 * The page, normalised.
 *
 * Sections that came back empty are dropped rather than rendered, and the
 * whole thing is capped. Nothing here decides how the page *looks* — that is
 * the model's composition and the theme's tokens — only that what arrives can
 * be built.
 */
export function normalizePage(raw: unknown): Section[] {
    const sections = Array.isArray(raw) ? raw : [];
    return sections
        .slice(0, LIMITS.maxSections)
        .flatMap((section, index) => {
            const built = normalizeSection(section, index);
            return built ? [built] : [];
        });
}

/** Every image prompt in the page, in document order. */
export function imagePrompts(sections: Section[]): string[] {
    const found: string[] = [];
    const walk = (node: Node) => {
        if (node.t === "image") found.push(node.prompt);
        else if (node.t === "box" || node.t === "grid") node.children.forEach(walk);
    };
    for (const section of sections) section.content.forEach(walk);
    return found;
}
