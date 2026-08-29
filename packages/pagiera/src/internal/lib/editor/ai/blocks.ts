import type { CanvasElement } from "../types";
import {
    band,
    button,
    Canvas,
    card,
    chip,
    divider,
    eyebrow,
    grid,
    heading,
    image,
    navLink,
    row,
    shell,
    stack,
    text,
} from "./build";
import { alpha, type Surface, surfaceOf, type Theme } from "./theme";

/**
 * The parametric block library.
 *
 * A block is not a fixed layout with holes punched in it for copy. It is a
 * function of the theme, the content and a small set of compositional axes,
 * and it decides its own structure from those. `featureBlock` with four items
 * and `layout: "alternating"` is a genuinely different composition from the
 * same block with three items and `layout: "grid"` — not the same skeleton
 * with different text.
 *
 * That is the whole difference from the previous system, which chose one of
 * twenty-four hard-coded presets and pushed strings into whichever headings it
 * could find by regular expression. Here the model chooses *composition*, and
 * the geometry is always valid because a person wrote it.
 */

export const BLOCK_KINDS = [
    "nav",
    "hero",
    "logos",
    "features",
    "showcase",
    "stats",
    "steps",
    "testimonial",
    "pricing",
    "faq",
    "cta",
    "footer",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

export type BlockItem = {
    title: string;
    body: string;
    /** A number, a plan price, a step index — whatever the block leads with. */
    value?: string;
    /** A short tag; pricing uses it to mark the recommended plan. */
    badge?: string;
};

export type SectionContent = {
    kind: BlockKind;
    /** Which band this section is painted on. Alternation is what gives rhythm. */
    surface: Surface["key"];
    /** The compositional axis. Each block documents the values it accepts. */
    layout: string;
    eyebrow: string;
    headline: string;
    body: string;
    primaryAction: string;
    secondaryAction: string;
    links: string[];
    items: BlockItem[];
    /** Set only when the section is genuinely better with a picture. */
    imagePrompt?: string;
    /** Fine print: a footer's legal line, a CTA's reassurance. */
    note?: string;
    brand: string;
};

/** The axes each block understands, for the schema and the prompt. */
export const BLOCK_LAYOUTS: Record<BlockKind, readonly string[]> = {
    nav: ["standard", "centered", "minimal"],
    hero: ["split", "centered", "editorial", "stacked"],
    logos: ["row", "bordered"],
    features: ["grid", "alternating", "list", "bento"],
    showcase: ["media-right", "media-left", "media-below"],
    stats: ["row", "bordered", "stacked"],
    steps: ["numbered-row", "numbered-column"],
    testimonial: ["single", "grid"],
    pricing: ["tiers", "compact"],
    faq: ["two-column", "list"],
    cta: ["banner", "split", "boxed"],
    footer: ["columns", "minimal", "closing"],
};

/* ------------------------------------------------------------------ shared */

function pick(values: readonly string[], requested: string) {
    return values.includes(requested) ? requested : values[0];
}

/** Trims and falls back, so a block never renders an empty string. */
function copy(value: string | undefined, fallback: string) {
    const trimmed = value?.replace(/\s+/g, " ").trim();
    return trimmed && trimmed.length > 1 ? trimmed : fallback;
}

/**
 * The eyebrow / headline / paragraph group most sections open with.
 *
 * Centred headers cap their measure, because a 1200px-wide centred paragraph
 * is unreadable no matter how good the type is.
 */
function sectionHeader(
    canvas: Canvas,
    parentId: string,
    content: SectionContent,
    align: "start" | "center" = "start",
) {
    canvas.beginGroup();
    const group = stack(canvas, parentId, "Header", {
        gap: canvas.theme.space.text,
        align,
        widthMode: align === "center" ? "auto" : "fill",
        w: align === "center" ? 720 : undefined,
        textAlign: align === "center" ? "center" : "left",
    }, align === "center" ? { mobile: { widthMode: "fill" } } : undefined);

    if (content.eyebrow) eyebrow(canvas, group.id, content.eyebrow);
    if (content.headline) {
        heading(canvas, group.id, content.headline, "title", {
            textAlign: align === "center" ? "center" : "left",
        });
    }
    if (content.body) {
        text(canvas, group.id, content.body, "body", {
            textAlign: align === "center" ? "center" : "left",
            w: 640,
            widthMode: align === "center" ? "auto" : "fill",
        });
    }
    return group;
}

/** The primary/secondary action pair, omitted entirely when there is no label. */
function actions(
    canvas: Canvas,
    parentId: string,
    content: SectionContent,
    justify: "start" | "center" = "start",
) {
    if (!content.primaryAction && !content.secondaryAction) return undefined;
    const group = row(canvas, parentId, "Actions", {
        gap: 12,
        justify,
        align: "center",
        widthMode: "auto",
    }, { mobile: { direction: "column", align: "stretch", widthMode: "fill" } });
    if (content.primaryAction) button(canvas, group.id, content.primaryAction, "primary");
    if (content.secondaryAction) button(canvas, group.id, content.secondaryAction, "secondary");
    return group;
}

/* ------------------------------------------------------------------- nav */

function navBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.nav, content.layout);
    const bar = band(canvas, "Navigation", {
        padT: 18,
        padB: 18,
        borderB: 1,
        borderW: 0,
        borderC: surface.line,
        position: "sticky",
        pinSide: "top",
        stickyOffset: 0,
        zIndex: 50,
        bg: surface.bg,
    });
    const inner = shell(canvas, bar.id, 1200, {
        direction: "row",
        align: "center",
        justify: "between",
        gap: 24,
    });
    // The one row on the page that must stay a row on a phone: a navigation
    // bar that folds into a column pushes the whole page down by its height.
    inner.overrides = { ...inner.overrides, mobile: { direction: "row", align: "center", gap: 12 } };

    const brand = heading(canvas, inner.id, copy(content.brand, "Studio"), "cardTitle", {
        widthMode: "auto",
        fontSize: theme.type.cardTitle,
        letterSpacing: -0.4,
        entrance: "none",
    });
    brand.name = "Brand";

    const links = content.links.filter(Boolean).slice(0, 5);
    if (layout !== "minimal" && links.length) {
        const group = row(canvas, inner.id, "Links", {
            widthMode: "auto",
            gap: layout === "centered" ? 26 : 20,
            justify: "center",
        }, { mobile: { hidden: true } });
        for (const link of links) navLink(canvas, group.id, link);
        // A centred wordmark needs the links split around it; ordering the
        // group before the brand is enough, since the row is space-between.
        if (layout === "centered") group.base.order = -1;
    }

    const right = row(canvas, inner.id, "Actions", { widthMode: "auto", gap: 10, justify: "end" }, {
        mobile: { direction: "row", align: "center", gap: 8 },
    });
    if (content.secondaryAction && layout === "standard") {
        button(canvas, right.id, content.secondaryAction, "quiet");
    }
    button(canvas, right.id, copy(content.primaryAction, "Get started"), "primary", {
        padT: 10,
        padB: 10,
        padR: 18,
        padL: 18,
    });
    return bar;
}

/* ------------------------------------------------------------------ hero */

function heroBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const hasMedia = Boolean(content.imagePrompt?.trim());
    // A split hero with no picture is half an empty page, so the axis falls
    // back rather than rendering a hole.
    const layout = hasMedia ? pick(BLOCK_LAYOUTS.hero, content.layout) : pick(["centered", "editorial"], content.layout);

    const wrapper = band(canvas, "Hero", {
        padT: Math.round(theme.space.band * 1.25),
        padB: Math.round(theme.space.band * 1.15),
    });
    const inner = shell(canvas, wrapper.id, 1200, { gap: theme.space.block });

    if (layout === "centered") {
        canvas.beginGroup();
        const column = stack(canvas, inner.id, "Hero copy", {
            align: "center",
            gap: theme.space.text,
            textAlign: "center",
            widthMode: "auto",
            w: 820,
        }, { mobile: { widthMode: "fill" } });
        if (content.eyebrow) chip(canvas, column.id, content.eyebrow);
        heading(canvas, column.id, content.headline, "display", { textAlign: "center" });
        text(canvas, column.id, content.body, "body", {
            textAlign: "center",
            fontSize: theme.type.body + 2,
            widthMode: "auto",
            w: 620,
        });
        actions(canvas, column.id, content, "center");
        if (hasMedia) image(canvas, inner.id, content.imagePrompt!, "16/9", { w: 1100 });
        return wrapper;
    }

    if (layout === "editorial") {
        // Oversized type on the left, the argument set small on the right —
        // a magazine masthead rather than a landing page.
        canvas.beginGroup();
        const split = row(canvas, inner.id, "Masthead", { align: "end", gap: 48 });
        const left = stack(canvas, split.id, "Statement", { gap: theme.space.text, grow: 3 });
        if (content.eyebrow) eyebrow(canvas, left.id, content.eyebrow);
        heading(canvas, left.id, content.headline, "display");
        const right = stack(canvas, split.id, "Argument", { gap: theme.space.text, grow: 2 });
        text(canvas, right.id, content.body, "body", { fontSize: theme.type.body + 1 });
        actions(canvas, right.id, content);
        if (hasMedia) {
            divider(canvas, inner.id);
            image(canvas, inner.id, content.imagePrompt!, "21/9");
        }
        return wrapper;
    }

    if (layout === "stacked") {
        canvas.beginGroup();
        const column = stack(canvas, inner.id, "Hero copy", { gap: theme.space.text, align: "center", textAlign: "center", widthMode: "auto", w: 780 }, { mobile: { widthMode: "fill" } });
        if (content.eyebrow) chip(canvas, column.id, content.eyebrow);
        heading(canvas, column.id, content.headline, "display", { textAlign: "center" });
        text(canvas, column.id, content.body, "body", { textAlign: "center", widthMode: "auto", w: 600 });
        actions(canvas, column.id, content, "center");
        image(canvas, inner.id, content.imagePrompt!, "16/10", {
            shadow: theme.shadow.raised || theme.shadow.card,
        });
        return wrapper;
    }

    // split
    canvas.beginGroup();
    const split = row(canvas, inner.id, "Split", { align: "center", gap: 56 });
    const column = stack(canvas, split.id, "Hero copy", { gap: theme.space.text, grow: 1 });
    if (content.eyebrow) chip(canvas, column.id, content.eyebrow);
    heading(canvas, column.id, content.headline, "display");
    text(canvas, column.id, content.body, "body", { fontSize: theme.type.body + 1 });
    actions(canvas, column.id, content);
    if (content.note) text(canvas, column.id, content.note, "small", { color: alpha(surface.muted, 0.9) });
    image(canvas, split.id, content.imagePrompt!, "4/5", { grow: 1 });
    return wrapper;
}

/* ----------------------------------------------------------------- logos */

function logosBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.logos, content.layout);
    const wrapper = band(canvas, "Logos", {
        padT: Math.round(theme.space.band * 0.45),
        padB: Math.round(theme.space.band * 0.45),
        borderW: 0,
        borderT: layout === "bordered" ? 1 : 0,
        borderB: layout === "bordered" ? 1 : 0,
        borderC: surface.line,
    });
    const inner = shell(canvas, wrapper.id, 1100, { align: "center", gap: 24 });
    canvas.beginGroup();
    if (content.eyebrow) {
        eyebrow(canvas, inner.id, content.eyebrow, { textAlign: "center", widthMode: "fill", color: surface.muted });
    }
    const marks = (content.items.length ? content.items.map((item) => item.title) : content.links).filter(Boolean).slice(0, 6);
    const strip = row(canvas, inner.id, "Marks", {
        justify: "between",
        align: "center",
        gap: 32,
        wrap: true,
    }, { mobile: { direction: "row", wrap: true, justify: "center", gap: 20 } });
    for (const mark of marks) {
        const element = heading(canvas, strip.id, mark, "cardTitle", {
            widthMode: "auto",
            color: surface.muted,
            fontWeight: "600",
            letterSpacing: -0.2,
            opacity: 80,
        });
        element.name = "Mark";
        element.hover = { opacity: 100, color: surface.text };
    }
    return wrapper;
}

/* -------------------------------------------------------------- features */

function featuresBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.features, content.layout);
    const items = content.items.slice(0, layout === "bento" ? 5 : 6);
    const wrapper = band(canvas, "Features");
    const inner = shell(canvas, wrapper.id, 1200);

    if (layout === "alternating") {
        sectionHeader(canvas, inner.id, content);
        for (const [index, item] of items.slice(0, 4).entries()) {
            canvas.beginGroup();
            const strip = row(canvas, inner.id, `Feature ${index + 1}`, { align: "center", gap: 48 }, {
                mobile: { direction: "column", align: "stretch" },
            });
            const column = stack(canvas, strip.id, "Copy", { gap: theme.space.text, grow: 1 });
            if (item.value) chip(canvas, column.id, item.value);
            heading(canvas, column.id, item.title, "cardTitle", { fontSize: theme.type.title - 6 });
            text(canvas, column.id, item.body);
            const panel = stack(canvas, strip.id, "Panel", {
                grow: 1,
                bg: alpha(surface.text, 0.05),
                radius: theme.radius.media,
                h: 260,
                heightMode: "fixed",
                borderW: theme.borderWidth,
                borderC: surface.line,
            }, { mobile: { h: 180 } });
            // Odd rows put the panel first, which is what makes the section
            // read as a rhythm rather than four identical rows.
            if (index % 2 === 1) panel.base.order = -1;
        }
        return wrapper;
    }

    if (layout === "list") {
        const split = row(canvas, inner.id, "Split", { align: "start", gap: 64 }, { mobile: { direction: "column" } });
        const left = stack(canvas, split.id, "Header", { grow: 1, gap: theme.space.text });
        canvas.beginGroup();
        if (content.eyebrow) eyebrow(canvas, left.id, content.eyebrow);
        heading(canvas, left.id, content.headline, "title");
        if (content.body) text(canvas, left.id, content.body);
        const right = stack(canvas, split.id, "Items", { grow: 1, gap: 0 });
        for (const [index, item] of items.entries()) {
            canvas.beginGroup();
            const entry = stack(canvas, right.id, item.title.slice(0, 40), {
                gap: 8,
                padT: 22,
                padB: 22,
                borderW: 0,
                borderT: index === 0 ? 0 : 1,
                borderC: surface.line,
            });
            heading(canvas, entry.id, item.title, "cardTitle");
            text(canvas, entry.id, item.body, "small");
        }
        return wrapper;
    }

    if (layout === "bento") {
        sectionHeader(canvas, inner.id, content);
        const board = grid(canvas, inner.id, "Bento", 3, { gap: 18 });
        for (const [index, item] of items.entries()) {
            // The first cell is wide and tall; the rest fill in around it.
            const feature = index === 0;
            const cell = card(canvas, board.id, item.title.slice(0, 40), {
                gridSpan: feature ? 2 : 1,
                justify: feature ? "end" : "start",
                padT: feature ? theme.space.card + 12 : theme.space.card,
                padB: feature ? theme.space.card + 12 : theme.space.card,
                bg: feature ? theme.color.accentSoft : surface.card,
            });
            if (item.value) chip(canvas, cell.id, item.value);
            heading(canvas, cell.id, item.title, "cardTitle", feature ? { fontSize: theme.type.title - 8 } : undefined);
            text(canvas, cell.id, item.body, "small");
        }
        return wrapper;
    }

    // grid
    sectionHeader(canvas, inner.id, content, items.length === 3 ? "center" : "start");
    const board = grid(canvas, inner.id, "Cards", items.length >= 4 ? (items.length % 3 === 0 ? 3 : 2) : Math.max(1, items.length));
    for (const item of items) {
        const cell = card(canvas, board.id, item.title.slice(0, 40));
        if (item.value) chip(canvas, cell.id, item.value);
        heading(canvas, cell.id, item.title, "cardTitle");
        text(canvas, cell.id, item.body, "small");
    }
    return wrapper;
}

/* -------------------------------------------------------------- showcase */

function showcaseBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.showcase, content.layout);
    const wrapper = band(canvas, "Showcase");
    const inner = shell(canvas, wrapper.id, 1160);
    const prompt = content.imagePrompt?.trim();

    if (layout === "media-below" || !prompt) {
        sectionHeader(canvas, inner.id, content, "center");
        if (prompt) image(canvas, inner.id, prompt, "16/9");
        else {
            const board = grid(canvas, inner.id, "Points", Math.min(3, Math.max(1, content.items.length)));
            for (const item of content.items.slice(0, 3)) {
                const cell = card(canvas, board.id, item.title.slice(0, 40));
                heading(canvas, cell.id, item.title, "cardTitle");
                text(canvas, cell.id, item.body, "small");
            }
        }
        return wrapper;
    }

    canvas.beginGroup();
    const split = row(canvas, inner.id, "Split", { align: "center", gap: 56 });
    const column = stack(canvas, split.id, "Copy", { grow: 1, gap: theme.space.text });
    if (content.eyebrow) eyebrow(canvas, column.id, content.eyebrow);
    heading(canvas, column.id, content.headline, "title");
    if (content.body) text(canvas, column.id, content.body);
    for (const item of content.items.slice(0, 3)) {
        const point = row(canvas, column.id, item.title.slice(0, 40), { align: "start", gap: 12 }, { mobile: { direction: "row" } });
        const dot = stack(canvas, point.id, "Dot", {
            widthMode: "fixed",
            heightMode: "fixed",
            w: 8,
            h: 8,
            radius: 999,
            bg: surface.accent,
            // Lines up with the first line of the title rather than the top
            // of the box, which is what makes a bullet look intentional.
            marginB: 0,
            padT: 0,
        });
        dot.base.alignSelf = "start";
        dot.base.order = -1;
        const copyGroup = stack(canvas, point.id, "Text", { gap: 4, grow: 1 });
        heading(canvas, copyGroup.id, item.title, "cardTitle", { fontSize: theme.type.body + 1 });
        text(canvas, copyGroup.id, item.body, "small");
    }
    actions(canvas, column.id, content);
    const media = image(canvas, split.id, prompt, "4/3", { grow: 1 });
    if (layout === "media-left") media.base.order = -1;
    return wrapper;
}

/* ----------------------------------------------------------------- stats */

function statsBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.stats, content.layout);
    const items = content.items.slice(0, 4);
    const wrapper = band(canvas, "Stats", {
        padT: layout === "stacked" ? theme.space.band : Math.round(theme.space.band * 0.7),
        padB: layout === "stacked" ? theme.space.band : Math.round(theme.space.band * 0.7),
    });
    const inner = shell(canvas, wrapper.id, 1100);
    if (layout === "stacked") sectionHeader(canvas, inner.id, content, "center");

    const board = grid(canvas, inner.id, "Figures", Math.max(1, items.length), {
        gap: 0,
    });
    for (const [index, item] of items.entries()) {
        canvas.beginGroup();
        const cell = stack(canvas, board.id, item.title.slice(0, 40), {
            gap: 6,
            align: layout === "row" ? "start" : "center",
            textAlign: layout === "row" ? "left" : "center",
            padT: 8,
            padB: 8,
            padL: layout === "bordered" ? 24 : 0,
            padR: 24,
            borderW: 0,
            borderL: layout === "bordered" && index > 0 ? 1 : 0,
            borderC: surface.line,
        }, { mobile: { borderL: 0, padL: 0, align: "start", textAlign: "left" } });
        heading(canvas, cell.id, item.value || item.title, "title", {
            color: surface.accent,
            textAlign: layout === "row" ? "left" : "center",
        });
        text(canvas, cell.id, item.body || item.title, "small", {
            textAlign: layout === "row" ? "left" : "center",
        });
    }
    return wrapper;
}

/* ----------------------------------------------------------------- steps */

function stepsBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.steps, content.layout);
    const items = content.items.slice(0, 4);
    const wrapper = band(canvas, "Steps");
    const inner = shell(canvas, wrapper.id, 1160);
    sectionHeader(canvas, inner.id, content, layout === "numbered-row" ? "center" : "start");

    const container = layout === "numbered-row"
        ? grid(canvas, inner.id, "Steps", Math.max(1, items.length), { gap: 28 })
        : stack(canvas, inner.id, "Steps", { gap: 0 });

    for (const [index, item] of items.entries()) {
        canvas.beginGroup();
        const isRow = layout === "numbered-row";
        const step = stack(canvas, container.id, `Step ${index + 1}`, isRow
            ? { gap: theme.space.text, align: "start" }
            : {
                  direction: "row",
                  gap: 28,
                  align: "start",
                  padT: 28,
                  padB: 28,
                  borderW: 0,
                  borderT: index === 0 ? 0 : 1,
                  borderC: surface.line,
              },
            isRow ? undefined : { mobile: { direction: "column", gap: 14 } });

        const marker = heading(canvas, step.id, String(index + 1).padStart(2, "0"), "title", {
            widthMode: "auto",
            color: alpha(surface.accent, 0.55),
            fontSize: isRow ? theme.type.title : theme.type.title - 4,
            letterSpacing: -1,
        });
        marker.name = "Number";

        const copyGroup = stack(canvas, step.id, "Copy", { gap: 8, grow: 1 });
        heading(canvas, copyGroup.id, item.title, "cardTitle");
        text(canvas, copyGroup.id, item.body, "small");
    }
    return wrapper;
}

/* ----------------------------------------------------------- testimonial */

function testimonialBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.testimonial, content.layout);
    const wrapper = band(canvas, "Testimonials");
    const inner = shell(canvas, wrapper.id, layout === "single" ? 900 : 1200);

    if (layout === "single") {
        const item = content.items[0];
        canvas.beginGroup();
        const column = stack(canvas, inner.id, "Quote", { gap: theme.space.block, align: "center", textAlign: "center" });
        if (content.eyebrow) eyebrow(canvas, column.id, content.eyebrow, { textAlign: "center" });
        const quote = heading(canvas, column.id, copy(item?.body || content.body, content.headline), "title", {
            textAlign: "center",
            fontWeight: "500",
            lineHeight: 1.32,
            letterSpacing: -0.6,
        });
        quote.name = "Quote";
        const attribution = stack(canvas, column.id, "Attribution", { gap: 2, align: "center", textAlign: "center" });
        text(canvas, attribution.id, copy(item?.title, content.brand), "small", {
            textAlign: "center",
            color: surface.text,
            fontWeight: "600",
        });
        if (item?.value) text(canvas, attribution.id, item.value, "small", { textAlign: "center" });
        return wrapper;
    }

    sectionHeader(canvas, inner.id, content, "center");
    const board = grid(canvas, inner.id, "Quotes", Math.min(3, Math.max(1, content.items.length)));
    for (const item of content.items.slice(0, 3)) {
        const cell = card(canvas, board.id, item.title.slice(0, 40), { gap: theme.space.block, justify: "between" });
        text(canvas, cell.id, item.body, "body", { color: surface.text, lineHeight: 1.6 });
        const who = stack(canvas, cell.id, "Attribution", { gap: 2 });
        text(canvas, who.id, item.title, "small", { color: surface.text, fontWeight: "600" });
        if (item.value) text(canvas, who.id, item.value, "small");
    }
    return wrapper;
}

/* --------------------------------------------------------------- pricing */

function pricingBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.pricing, content.layout);
    const items = content.items.slice(0, 3);
    const wrapper = band(canvas, "Pricing");
    const inner = shell(canvas, wrapper.id, 1140);
    sectionHeader(canvas, inner.id, content, "center");

    const board = grid(canvas, inner.id, "Plans", Math.max(1, items.length), { gap: 20, align: "stretch" });
    for (const [index, item] of items.entries()) {
        // The recommended plan is whichever the model badged; the middle one
        // is the convention when it badged none.
        const featured = item.badge ? true : items.every((plan) => !plan.badge) && items.length === 3 && index === 1;
        const cell = card(canvas, board.id, item.title.slice(0, 40), {
            gap: theme.space.text,
            padT: featured ? theme.space.card + 10 : theme.space.card,
            padB: featured ? theme.space.card + 10 : theme.space.card,
            bg: featured ? theme.color.accentSoft : surface.card,
            borderW: featured ? Math.max(1, theme.borderWidth) : theme.borderWidth,
            borderC: featured ? theme.color.accent : surface.line,
            shadow: featured ? theme.shadow.raised || theme.shadow.card : theme.shadow.card,
            justify: "between",
        });
        const head = stack(canvas, cell.id, "Plan", { gap: 8 });
        const title = row(canvas, head.id, "Title", { justify: "between", align: "center", gap: 8 }, { mobile: { direction: "row" } });
        heading(canvas, title.id, item.title, "cardTitle", { widthMode: "fill" });
        if (item.badge) chip(canvas, title.id, item.badge);
        if (item.value) {
            heading(canvas, head.id, item.value, "title", { fontSize: theme.type.title - 4, letterSpacing: -1 });
        }
        if (layout !== "compact" && item.body) {
            const list = stack(canvas, cell.id, "Includes", { gap: 8 });
            for (const line of item.body.split(/\s*[·•\n;]\s*/).filter(Boolean).slice(0, 6)) {
                text(canvas, list.id, line, "small");
            }
        } else if (item.body) {
            text(canvas, cell.id, item.body, "small");
        }
        button(canvas, cell.id, copy(content.primaryAction, "Choose plan"), featured ? "primary" : "secondary", {
            widthMode: "fill",
        });
    }
    if (content.note) {
        text(canvas, inner.id, content.note, "small", { textAlign: "center" });
    }
    return wrapper;
}

/* ------------------------------------------------------------------- faq */

function faqBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.faq, content.layout);
    const wrapper = band(canvas, "FAQ");
    const inner = shell(canvas, wrapper.id, 1080);

    const host = layout === "two-column"
        ? row(canvas, inner.id, "Split", { align: "start", gap: 64 }, { mobile: { direction: "column" } })
        : inner;
    if (layout === "two-column") {
        canvas.beginGroup();
        const left = stack(canvas, host.id, "Header", { grow: 1, gap: theme.space.text });
        if (content.eyebrow) eyebrow(canvas, left.id, content.eyebrow);
        heading(canvas, left.id, content.headline, "title");
        if (content.body) text(canvas, left.id, content.body);
    } else {
        sectionHeader(canvas, host.id, content, "center");
    }

    const list = stack(canvas, host.id, "Questions", { gap: 0, grow: layout === "two-column" ? 1 : undefined });
    for (const [index, item] of content.items.slice(0, 6).entries()) {
        canvas.beginGroup();
        const entry = stack(canvas, list.id, item.title.slice(0, 40), {
            gap: 8,
            padT: 22,
            padB: 22,
            borderW: 0,
            borderT: index === 0 ? 0 : 1,
            borderC: surface.line,
        });
        heading(canvas, entry.id, item.title, "cardTitle");
        text(canvas, entry.id, item.body, "small");
    }
    return wrapper;
}

/* ------------------------------------------------------------------- cta */

function ctaBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.cta, content.layout);

    if (layout === "boxed") {
        // The band stays on the page colour and the panel carries the accent,
        // so the closing argument reads as an object rather than another band.
        const wrapper = band(canvas, "CTA");
        const inner = shell(canvas, wrapper.id, 1100);
        const panelSurface = surfaceOf(theme, theme.mood === "dark" ? "panel" : "inverse");
        const panelCanvas = new Canvas(theme, panelSurface);
        const panel = stack(canvas, inner.id, "Panel", {
            bg: panelSurface.bg,
            color: panelSurface.text,
            radius: theme.radius.card + 8,
            padT: Math.round(theme.space.band * 0.7),
            padR: theme.space.band > 100 ? 64 : 44,
            padB: Math.round(theme.space.band * 0.7),
            padL: theme.space.band > 100 ? 64 : 44,
            gap: theme.space.text,
            align: "center",
            textAlign: "center",
        }, { mobile: { padR: 24, padL: 24 } });
        // Children are built against the panel's own surface so their text and
        // borders resolve against the panel, not the page behind it.
        panelCanvas.beginGroup();
        if (content.eyebrow) eyebrow(panelCanvas, panel.id, content.eyebrow, { textAlign: "center" });
        heading(panelCanvas, panel.id, content.headline, "title", { textAlign: "center" });
        if (content.body) {
            text(panelCanvas, panel.id, content.body, "body", { textAlign: "center", widthMode: "auto", w: 560 });
        }
        actions(panelCanvas, panel.id, content, "center");
        if (content.note) text(panelCanvas, panel.id, content.note, "small", { textAlign: "center" });
        canvas.elements.push(...panelCanvas.elements);
        return wrapper;
    }

    const wrapper = band(canvas, "CTA", {
        padT: Math.round(theme.space.band * 0.85),
        padB: Math.round(theme.space.band * 0.85),
    });
    const inner = shell(canvas, wrapper.id, 1100);

    if (layout === "split") {
        canvas.beginGroup();
        const split = row(canvas, inner.id, "Split", { align: "center", justify: "between", gap: 40 });
        const column = stack(canvas, split.id, "Copy", { gap: theme.space.text, grow: 1 });
        heading(canvas, column.id, content.headline, "title");
        if (content.body) text(canvas, column.id, content.body);
        const group = stack(canvas, split.id, "Actions", { gap: 10, widthMode: "auto", align: "stretch" });
        if (content.primaryAction) button(canvas, group.id, content.primaryAction, "primary");
        if (content.secondaryAction) button(canvas, group.id, content.secondaryAction, "secondary");
        if (content.note) text(canvas, group.id, content.note, "small", { textAlign: "center" });
        return wrapper;
    }

    canvas.beginGroup();
    const column = stack(canvas, inner.id, "Closing", { gap: theme.space.text, align: "center", textAlign: "center" });
    if (content.eyebrow) eyebrow(canvas, column.id, content.eyebrow, { textAlign: "center" });
    heading(canvas, column.id, content.headline, "title", { textAlign: "center", widthMode: "auto", w: 760 });
    if (content.body) {
        text(canvas, column.id, content.body, "body", { textAlign: "center", widthMode: "auto", w: 580 });
    }
    actions(canvas, column.id, content, "center");
    if (content.note) text(canvas, column.id, content.note, "small", { textAlign: "center" });
    return wrapper;
}

/* ---------------------------------------------------------------- footer */

function footerBlock(canvas: Canvas, content: SectionContent) {
    const { theme, surface } = canvas;
    const layout = pick(BLOCK_LAYOUTS.footer, content.layout);
    const wrapper = band(canvas, "Footer", {
        padT: Math.round(theme.space.band * 0.65),
        padB: Math.round(theme.space.band * 0.45),
        borderW: 0,
        borderT: 1,
        borderC: surface.line,
        marginB: 0,
    });
    const inner = shell(canvas, wrapper.id, 1200, { gap: theme.space.block });

    if (layout === "closing") {
        canvas.beginGroup();
        const closing = stack(canvas, inner.id, "Closing", { gap: theme.space.text, align: "center", textAlign: "center" });
        heading(canvas, closing.id, content.headline, "title", { textAlign: "center", widthMode: "auto", w: 700 });
        if (content.primaryAction) {
            const group = row(canvas, closing.id, "Actions", { widthMode: "auto", justify: "center", gap: 12 });
            button(canvas, group.id, content.primaryAction, "primary");
        }
        divider(canvas, inner.id);
    }

    if (layout === "columns") {
        canvas.beginGroup();
        const top = row(canvas, inner.id, "Top", { align: "start", justify: "between", gap: 48 }, {
            mobile: { direction: "column", align: "stretch", gap: 32 },
        });
        const brandGroup = stack(canvas, top.id, "Brand", { gap: 10, grow: 1 });
        const mark = heading(canvas, brandGroup.id, copy(content.brand, "Studio"), "cardTitle", { widthMode: "auto" });
        mark.name = "Brand";
        if (content.body) text(canvas, brandGroup.id, content.body, "small", { widthMode: "auto", w: 320 });

        // The link list is split into columns of five so a long list becomes a
        // real footer rather than one tall stack.
        const links = content.links.filter(Boolean).slice(0, 15);
        const groups: string[][] = [];
        for (let at = 0; at < links.length; at += 5) groups.push(links.slice(at, at + 5));
        const columns = row(canvas, top.id, "Links", { widthMode: "auto", align: "start", gap: 56 }, {
            mobile: { direction: "row", wrap: true, gap: 32, align: "start" },
        });
        for (const [index, group] of groups.entries()) {
            const column = stack(canvas, columns.id, `Column ${index + 1}`, { widthMode: "auto", gap: 10, align: "start" });
            for (const link of group) navLink(canvas, column.id, link);
        }
    }

    canvas.beginGroup();
    const legal = row(canvas, inner.id, "Legal", { justify: "between", align: "center", gap: 16 }, {
        mobile: { direction: "column", align: "start", gap: 10 },
    });
    text(canvas, legal.id, copy(content.note, `© ${new Date().getFullYear()} ${copy(content.brand, "Studio")}. All rights reserved.`), "small", { widthMode: "auto" });
    if (layout === "minimal") {
        const group = row(canvas, legal.id, "Links", { widthMode: "auto", gap: 18, justify: "end" }, { mobile: { direction: "row", wrap: true } });
        for (const link of content.links.filter(Boolean).slice(0, 5)) navLink(canvas, group.id, link);
    }
    return wrapper;
}

/* -------------------------------------------------------------- registry */

const BUILDERS: Record<BlockKind, (canvas: Canvas, content: SectionContent) => CanvasElement> = {
    nav: navBlock,
    hero: heroBlock,
    logos: logosBlock,
    features: featuresBlock,
    showcase: showcaseBlock,
    stats: statsBlock,
    steps: stepsBlock,
    testimonial: testimonialBlock,
    pricing: pricingBlock,
    faq: faqBlock,
    cta: ctaBlock,
    footer: footerBlock,
};

/**
 * The minimum content each block needs to be worth rendering at all.
 *
 * A stats band with no figures, or a pricing table with one plan, is worse
 * than no section. The planner uses this to drop or substitute a section
 * before anything reaches the canvas.
 */
const MINIMUM_ITEMS: Partial<Record<BlockKind, number>> = {
    features: 2,
    showcase: 0,
    stats: 2,
    steps: 2,
    testimonial: 1,
    pricing: 2,
    faq: 2,
    logos: 3,
};

export function hasEnoughContent(content: SectionContent) {
    const needed = MINIMUM_ITEMS[content.kind] ?? 0;
    const supply = content.kind === "logos" && content.items.length === 0 ? content.links.length : content.items.length;
    return supply >= needed;
}

/**
 * Builds one section into a fresh element list.
 *
 * The returned elements are already parented to each other and carry the
 * theme's colours, responsive overrides and motion. Nothing downstream needs
 * to inspect or repair them.
 */
export function buildSection(theme: Theme, content: SectionContent): CanvasElement[] {
    const canvas = new Canvas(theme, surfaceOf(theme, content.surface));
    const build = BUILDERS[content.kind] ?? BUILDERS.features;
    const root = build(canvas, content);
    root.parentId = undefined;
    return canvas.elements;
}
