/**
 * Authoring script for the two hand-designed templates.
 *
 * Written as code rather than checked-in JSON because the rules that make a
 * template work — `z` ordering siblings, every `parentId` resolving, a mobile
 * override on every row and oversized heading — are invariants, and a builder
 * can hold them where a hand-edited 200KB file cannot.
 *
 * Run with: bun run templates/scripts/build-extra.ts <outputDir>
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Style = Record<string, unknown>;
type Element = {
    id: string;
    type: string;
    name: string;
    parentId?: string;
    z: number;
    content?: string;
    src?: string;
    href?: string;
    alt?: string;
    base: Style;
    overrides?: Record<string, Style>;
    hover?: Style;
};

/** Collects elements while keeping `z` dense and parents ahead of children. */
class Tree {
    readonly elements: Element[] = [];
    private counters = new Map<string | undefined, number>();

    add(node: Omit<Element, "z">): string {
        const next = (this.counters.get(node.parentId) ?? 0);
        this.counters.set(node.parentId, next + 1);
        this.elements.push({ ...node, z: next });
        return node.id;
    }
}

const BEZIER = "0.16, 1, 0.3, 1";
/** Entrance with a stagger, so a section reveals in reading order. */
const rise = (step: number): Style => ({
    entrance: "up",
    entranceDuration: 620,
    entranceDelay: step * 90,
    entranceBezier: BEZIER,
});

type Palette = {
    bg: string;
    surface: string;
    primary: string;
    text: string;
    muted: string;
    border: string;
};

/**
 * A full-bleed band with a single centred content column.
 *
 * Every section in both templates is built this way: the wrapper fills the
 * viewport so its background reaches both edges, and an inner container holds
 * the readable width. Mobile drops the side padding.
 */
function band(
    tree: Tree,
    id: string,
    name: string,
    style: Style,
    inner: Style = {},
) {
    tree.add({
        id,
        type: "Section",
        name,
        base: {
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            align: "center",
            padT: 112,
            padB: 112,
            padL: 40,
            padR: 40,
            ...style,
        },
        overrides: {
            tablet: { padT: 80, padB: 80, padL: 28, padR: 28 },
            mobile: { padT: 64, padB: 64, padL: 20, padR: 20 },
        },
    });

    const innerId = `${id}-inner`;
    tree.add({
        id: innerId,
        type: "Container",
        name: `${name} inner`,
        parentId: id,
        base: {
            widthMode: "fill",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            gap: 32,
            ...inner,
        },
    });
    return innerId;
}

/* ------------------------------------------------------------------ Sable */

function sable() {
    const p: Palette = {
        bg: "#14100D",
        surface: "#1E1813",
        primary: "#C9A227",
        text: "#F5EFE6",
        muted: "#A89880",
        border: "#2E2620",
    };
    const t = new Tree();
    const serif = "ui-serif, Georgia, serif";

    // Navigation ------------------------------------------------------------
    const nav = band(t, "nav", "Navigation", { padT: 24, padB: 24, bg: p.bg, position: "sticky", pinSide: "top", stickyOffset: 0, zIndex: 50 }, { direction: "row", justify: "between", align: "center", gap: 24 });
    t.add({ id: "nav-mark", type: "Heading", name: "Wordmark", parentId: nav, content: "SABLE", base: { widthMode: "auto", heightMode: "auto", fontFamily: serif, fontSize: 22, letterSpacing: 6, color: p.text } });
    const navLinks = t.add({ id: "nav-links", type: "Stack", name: "Links", parentId: nav, base: { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 32, align: "center" }, overrides: { mobile: { hidden: true } } });
    for (const [i, label] of ["Menu", "Cellar", "Private dining", "Visit"].entries()) {
        t.add({ id: `nav-link-${i}`, type: "Text", name: `Nav ${label}`, parentId: navLinks, content: label, base: { widthMode: "auto", heightMode: "auto", fontSize: 14, letterSpacing: 1, color: p.muted, cursor: "pointer" }, hover: { color: p.text } });
    }
    t.add({ id: "nav-cta", type: "Button", name: "Reserve", parentId: nav, content: "Reserve", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 12, padR: 22, padB: 12, padL: 22, bg: p.primary, color: p.bg, fontSize: 13, fontWeight: "600", letterSpacing: 1, radius: 2 }, hover: { scale: 102 } });

    // Hero ------------------------------------------------------------------
    const hero = band(t, "hero", "Hero", { bg: p.bg, padT: 140, padB: 140 }, { gap: 40, align: "start" });
    t.add({ id: "hero-eyebrow", type: "Text", name: "Hero eyebrow", parentId: hero, content: "LISBON · SINCE 1998", base: { widthMode: "auto", heightMode: "auto", fontSize: 12, letterSpacing: 4, color: p.primary, ...rise(0) } });
    t.add({ id: "hero-title", type: "Heading", name: "Hero title", parentId: hero, content: "A long table, a short menu, and wine worth the detour.", base: { widthMode: "fill", heightMode: "auto", fontFamily: serif, fontSize: 72, lineHeight: 1.06, letterSpacing: -2, color: p.text, ...rise(1) }, overrides: { tablet: { fontSize: 52 }, mobile: { fontSize: 34, letterSpacing: -1 } } });
    t.add({ id: "hero-lede", type: "Text", name: "Hero lede", parentId: hero, content: "Twelve seats, one seating a night, and whatever the market gave us that morning. We pour from a cellar of small growers and pour generously.", base: { widthMode: "fill", heightMode: "auto", fontSize: 17, lineHeight: 1.6, color: p.muted, ...rise(2) }, overrides: { mobile: { fontSize: 15 } } });
    t.add({ id: "hero-image", type: "Image", name: "Hero photograph", parentId: hero, alt: "Candlelit dining room with a long shared table", base: { widthMode: "fill", heightMode: "auto", aspectRatio: "21/9", radius: 2, ...rise(3) }, overrides: { mobile: { aspectRatio: "4/3" } } });

    // Story -----------------------------------------------------------------
    const story = band(t, "story", "Story", { bg: p.surface }, { direction: "row", gap: 64, align: "start" });
    (t.elements.find((e) => e.id === "story-inner") as Element).overrides = { mobile: { direction: "column", gap: 32 } };
    const storyLeft = t.add({ id: "story-left", type: "Stack", name: "Story copy", parentId: story, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 20 } });
    t.add({ id: "story-title", type: "Heading", name: "Story title", parentId: storyLeft, content: "We cook what we would want to eat on a Tuesday.", base: { widthMode: "fill", heightMode: "auto", fontFamily: serif, fontSize: 40, lineHeight: 1.15, color: p.text, ...rise(0) }, overrides: { mobile: { fontSize: 27 } } });
    t.add({ id: "story-body", type: "Text", name: "Story body", parentId: storyLeft, content: "No tasting menu, no foam, no theatre. A charcoal grill, a wood oven and produce from four farms we have used for two decades. The menu changes when the ingredients do, which is often.", base: { widthMode: "fill", heightMode: "auto", fontSize: 16, lineHeight: 1.65, color: p.muted, ...rise(1) } });
    t.add({ id: "story-image", type: "Image", name: "Kitchen photograph", parentId: story, alt: "Chef plating at a wood-fired grill", base: { widthMode: "fill", heightMode: "auto", aspectRatio: "3/4", radius: 2, ...rise(2) }, overrides: { mobile: { aspectRatio: "4/3" } } });

    // Menu ------------------------------------------------------------------
    const menu = band(t, "menu", "Menu", { bg: p.bg }, { gap: 40 });
    t.add({ id: "menu-title", type: "Heading", name: "Menu title", parentId: menu, content: "This week", base: { widthMode: "fill", heightMode: "auto", fontFamily: serif, fontSize: 40, lineHeight: 1.15, color: p.text, ...rise(0) }, overrides: { mobile: { fontSize: 27 } } });
    const dishes: Array<[string, string, string]> = [
        ["Grilled sardines", "burnt lemon, oregano, olive oil from Trás-os-Montes", "14"],
        ["Charred hispi cabbage", "anchovy butter, toasted breadcrumb, aged sheep cheese", "12"],
        ["Wood oven bream", "for two, with clams, white wine and coriander", "46"],
        ["Arroz doce", "cinnamon, lemon peel, burnt sugar crust", "8"],
    ];
    for (const [i, [dish, note, price]] of dishes.entries()) {
        const row = t.add({ id: `dish-${i}`, type: "Stack", name: dish, parentId: menu, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "start", gap: 24, padT: 20, padB: 20, borderW: 1, borderC: p.border, borderStyle: "solid", ...rise(i + 1) }, overrides: { mobile: { direction: "column", gap: 6 } } });
        const left = t.add({ id: `dish-${i}-left`, type: "Stack", name: `${dish} text`, parentId: row, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 6 } });
        t.add({ id: `dish-${i}-name`, type: "Heading", name: `${dish} name`, parentId: left, content: dish, base: { widthMode: "fill", heightMode: "auto", fontFamily: serif, fontSize: 20, lineHeight: 1.2, color: p.text } });
        t.add({ id: `dish-${i}-note`, type: "Text", name: `${dish} note`, parentId: left, content: note, base: { widthMode: "fill", heightMode: "auto", fontSize: 14, lineHeight: 1.55, color: p.muted } });
        t.add({ id: `dish-${i}-price`, type: "Text", name: `${dish} price`, parentId: row, content: `€${price}`, base: { widthMode: "auto", heightMode: "auto", fontFamily: serif, fontSize: 18, color: p.primary } });
    }

    // Visit -----------------------------------------------------------------
    const visit = band(t, "visit", "Visit", { bg: p.surface }, { direction: "row", gap: 64, align: "start" });
    (t.elements.find((e) => e.id === "visit-inner") as Element).overrides = { mobile: { direction: "column", gap: 32 } };
    for (const [i, [label, lines]] of ([
        ["Hours", ["Wednesday to Saturday", "One seating, 19:30", "Closed August"]],
        ["Address", ["Rua das Flores 82", "1200-195 Lisboa", "Portugal"]],
        ["Contact", ["reservations@sable.pt", "+351 21 099 4412"]],
    ] as Array<[string, string[]]>).entries()) {
        const col = t.add({ id: `visit-${i}`, type: "Stack", name: label, parentId: visit, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 12, ...rise(i) } });
        t.add({ id: `visit-${i}-label`, type: "Text", name: `${label} label`, parentId: col, content: label.toUpperCase(), base: { widthMode: "fill", heightMode: "auto", fontSize: 12, letterSpacing: 3, color: p.primary } });
        for (const [j, line] of lines.entries()) {
            t.add({ id: `visit-${i}-line-${j}`, type: "Text", name: `${label} ${j}`, parentId: col, content: line, base: { widthMode: "fill", heightMode: "auto", fontSize: 15, lineHeight: 1.6, color: p.text } });
        }
    }

    // Reservation -----------------------------------------------------------
    const cta = band(t, "cta", "Reservation", { bg: p.primary, padT: 96, padB: 96 }, { gap: 24, align: "center" });
    t.add({ id: "cta-title", type: "Heading", name: "CTA title", parentId: cta, content: "Twelve seats. One seating. Book early.", base: { widthMode: "fill", heightMode: "auto", fontFamily: serif, fontSize: 44, lineHeight: 1.15, textAlign: "center", color: p.bg, ...rise(0) }, overrides: { mobile: { fontSize: 28 } } });
    t.add({ id: "cta-button", type: "Button", name: "CTA button", parentId: cta, content: "Reserve a table", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 16, padR: 32, padB: 16, padL: 32, bg: p.bg, color: p.text, fontSize: 14, letterSpacing: 1, radius: 2, ...rise(1) }, hover: { scale: 102 } });

    // Footer ----------------------------------------------------------------
    const footer = band(t, "footer", "Footer", { bg: p.bg, padT: 56, padB: 56 }, { direction: "row", justify: "between", align: "center", gap: 24 });
    (t.elements.find((e) => e.id === "footer-inner") as Element).overrides = { mobile: { direction: "column", gap: 16, align: "start" } };
    t.add({ id: "footer-mark", type: "Text", name: "Footer wordmark", parentId: footer, content: "SABLE", base: { widthMode: "auto", heightMode: "auto", fontFamily: serif, fontSize: 16, letterSpacing: 5, color: p.text } });
    t.add({ id: "footer-note", type: "Text", name: "Footer note", parentId: footer, content: "© 2026 Sable · Rua das Flores 82, Lisboa", base: { widthMode: "auto", heightMode: "auto", fontSize: 13, color: p.muted } });

    return { tree: t, palette: p, font: serif };
}

/* ----------------------------------------------------------------- Ledger */

function ledger() {
    const p: Palette = {
        bg: "#FBFBF9",
        surface: "#FFFFFF",
        primary: "#1B4332",
        text: "#14171A",
        muted: "#5C6670",
        border: "#E4E4DE",
    };
    const t = new Tree();
    const sans = "ui-sans-serif, system-ui, sans-serif";

    // Navigation ------------------------------------------------------------
    const nav = band(t, "nav", "Navigation", { padT: 20, padB: 20, bg: p.bg, borderW: 1, borderC: p.border, borderStyle: "solid", position: "sticky", pinSide: "top", stickyOffset: 0, zIndex: 50 }, { direction: "row", justify: "between", align: "center", gap: 24 });
    t.add({ id: "nav-mark", type: "Heading", name: "Wordmark", parentId: nav, content: "Ledger & Co.", base: { widthMode: "auto", heightMode: "auto", fontSize: 18, fontWeight: "600", letterSpacing: -0.3, color: p.text } });
    const navLinks = t.add({ id: "nav-links", type: "Stack", name: "Links", parentId: nav, base: { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 28, align: "center" }, overrides: { mobile: { hidden: true } } });
    for (const [i, label] of ["Services", "Approach", "Team", "Insights"].entries()) {
        t.add({ id: `nav-link-${i}`, type: "Text", name: `Nav ${label}`, parentId: navLinks, content: label, base: { widthMode: "auto", heightMode: "auto", fontSize: 14, color: p.muted, cursor: "pointer" }, hover: { color: p.primary } });
    }
    t.add({ id: "nav-cta", type: "Button", name: "Book a call", parentId: nav, content: "Book a call", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 11, padR: 20, padB: 11, padL: 20, bg: p.primary, color: "#FFFFFF", fontSize: 14, fontWeight: "500", radius: 6 }, hover: { scale: 102 } });

    // Hero ------------------------------------------------------------------
    const hero = band(t, "hero", "Hero", { bg: p.bg, padT: 120, padB: 96 }, { gap: 28, align: "start" });
    t.add({ id: "hero-eyebrow", type: "Text", name: "Hero eyebrow", parentId: hero, content: "CHARTERED ACCOUNTANTS · EST. 1974", base: { widthMode: "auto", heightMode: "auto", fontSize: 12, letterSpacing: 2, color: p.primary, ...rise(0) } });
    t.add({ id: "hero-title", type: "Heading", name: "Hero title", parentId: hero, content: "The accounts are the easy part. Knowing what they mean is the work.", base: { widthMode: "fill", heightMode: "auto", fontSize: 60, lineHeight: 1.08, letterSpacing: -1.6, color: p.text, ...rise(1) }, overrides: { tablet: { fontSize: 44 }, mobile: { fontSize: 32, letterSpacing: -0.8 } } });
    t.add({ id: "hero-lede", type: "Text", name: "Hero lede", parentId: hero, content: "We look after founder-led businesses between two and forty million in turnover. Same partner every year, no juniors rotating through your file, and an opinion when you ask for one.", base: { widthMode: "fill", heightMode: "auto", fontSize: 17, lineHeight: 1.62, color: p.muted, ...rise(2) }, overrides: { mobile: { fontSize: 15 } } });
    const heroActions = t.add({ id: "hero-actions", type: "Stack", name: "Hero actions", parentId: hero, base: { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 12, ...rise(3) }, overrides: { mobile: { direction: "column", widthMode: "fill" } } });
    t.add({ id: "hero-primary", type: "Button", name: "Primary", parentId: heroActions, content: "Book a call", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 14, padR: 26, padB: 14, padL: 26, bg: p.primary, color: "#FFFFFF", fontSize: 15, fontWeight: "500", radius: 6 }, hover: { scale: 102 } });
    t.add({ id: "hero-secondary", type: "Button", name: "Secondary", parentId: heroActions, content: "See our services", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 14, padR: 26, padB: 14, padL: 26, bg: "transparent", color: p.text, fontSize: 15, borderW: 1, borderC: p.border, borderStyle: "solid", radius: 6 }, hover: { borderC: p.primary } });

    // Metrics ---------------------------------------------------------------
    const metrics = band(t, "metrics", "Metrics", { bg: p.surface, padT: 64, padB: 64, borderW: 1, borderC: p.border, borderStyle: "solid" }, { direction: "row", gap: 48 });
    (t.elements.find((e) => e.id === "metrics-inner") as Element).overrides = { mobile: { direction: "column", gap: 28 } };
    for (const [i, [figure, caption]] of ([["51", "years in practice"], ["230", "businesses advised"], ["9", "partners, no juniors on your file"]] as Array<[string, string]>).entries()) {
        const col = t.add({ id: `metric-${i}`, type: "Stack", name: `Metric ${figure}`, parentId: metrics, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 8, ...rise(i) } });
        t.add({ id: `metric-${i}-figure`, type: "Heading", name: `Metric ${i} figure`, parentId: col, content: figure, base: { widthMode: "fill", heightMode: "auto", fontSize: 52, lineHeight: 1.05, letterSpacing: -1.5, color: p.primary }, overrides: { mobile: { fontSize: 36 } } });
        t.add({ id: `metric-${i}-caption`, type: "Text", name: `Metric ${i} caption`, parentId: col, content: caption, base: { widthMode: "fill", heightMode: "auto", fontSize: 14, lineHeight: 1.5, color: p.muted } });
    }

    // Services --------------------------------------------------------------
    const services = band(t, "services", "Services", { bg: p.bg }, { gap: 40 });
    t.add({ id: "services-title", type: "Heading", name: "Services title", parentId: services, content: "Three things, done properly", base: { widthMode: "fill", heightMode: "auto", fontSize: 40, lineHeight: 1.12, letterSpacing: -1, color: p.text, ...rise(0) }, overrides: { mobile: { fontSize: 27 } } });
    const grid = t.add({ id: "services-grid", type: "Grid", name: "Services grid", parentId: services, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 3, gap: 20, ...rise(1) }, overrides: { tablet: { columns: 2 }, mobile: { columns: 1 } } });
    const cards: Array<[string, string]> = [
        ["Year-end and audit", "Statutory accounts, corporation tax and an audit that finishes when we said it would. Filed early, every year."],
        ["Management reporting", "A monthly pack you can actually read, with the three numbers that move your business on the first page."],
        ["Advisory", "Raising, selling, restructuring or buying. The partner who signs your accounts is the one in the room."],
    ];
    for (const [i, [title, body]] of cards.entries()) {
        const card = t.add({ id: `card-${i}`, type: "Container", name: title, parentId: grid, base: { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 12, padT: 28, padR: 28, padB: 28, padL: 28, bg: p.surface, borderW: 1, borderC: p.border, borderStyle: "solid", radius: 8 }, hover: { borderC: p.primary } });
        t.add({ id: `card-${i}-index`, type: "Text", name: `${title} index`, parentId: card, content: `0${i + 1}`, base: { widthMode: "fill", heightMode: "auto", fontSize: 12, letterSpacing: 2, color: p.primary } });
        t.add({ id: `card-${i}-title`, type: "Heading", name: `${title} heading`, parentId: card, content: title, base: { widthMode: "fill", heightMode: "auto", fontSize: 20, lineHeight: 1.2, letterSpacing: -0.4, color: p.text } });
        t.add({ id: `card-${i}-body`, type: "Text", name: `${title} body`, parentId: card, content: body, base: { widthMode: "fill", heightMode: "auto", fontSize: 15, lineHeight: 1.6, color: p.muted } });
    }

    // Quote -----------------------------------------------------------------
    const quote = band(t, "quote", "Testimonial", { bg: p.primary, padT: 96, padB: 96 }, { gap: 24, align: "start" });
    t.add({ id: "quote-text", type: "Heading", name: "Quote", parentId: quote, content: "“They told us not to do the acquisition. It cost them a fee and saved us a company.”", base: { widthMode: "fill", heightMode: "auto", fontSize: 36, lineHeight: 1.28, letterSpacing: -0.8, color: "#FFFFFF", ...rise(0) }, overrides: { mobile: { fontSize: 24 } } });
    t.add({ id: "quote-source", type: "Text", name: "Quote source", parentId: quote, content: "Marta Bergström · Managing Director, Nordhavn Logistics", base: { widthMode: "fill", heightMode: "auto", fontSize: 14, color: "#C7D6CE", ...rise(1) } });

    // CTA -------------------------------------------------------------------
    const cta = band(t, "cta", "Call to action", { bg: p.bg }, { gap: 20, align: "center" });
    t.add({ id: "cta-title", type: "Heading", name: "CTA title", parentId: cta, content: "Talk to a partner, not a form", base: { widthMode: "fill", heightMode: "auto", fontSize: 40, lineHeight: 1.12, letterSpacing: -1, textAlign: "center", color: p.text, ...rise(0) }, overrides: { mobile: { fontSize: 27 } } });
    t.add({ id: "cta-body", type: "Text", name: "CTA body", parentId: cta, content: "Thirty minutes, no pitch deck. If we are not the right firm we will say so and tell you who is.", base: { widthMode: "fill", heightMode: "auto", fontSize: 16, lineHeight: 1.6, textAlign: "center", color: p.muted, ...rise(1) } });
    t.add({ id: "cta-button", type: "Button", name: "CTA button", parentId: cta, content: "Book a call", base: { widthMode: "auto", heightMode: "auto", layout: "stack", justify: "center", align: "center", padT: 15, padR: 30, padB: 15, padL: 30, bg: p.primary, color: "#FFFFFF", fontSize: 15, fontWeight: "500", radius: 6, ...rise(2) }, hover: { scale: 102 } });

    // Footer ----------------------------------------------------------------
    const footer = band(t, "footer", "Footer", { bg: p.surface, padT: 56, padB: 56, borderW: 1, borderC: p.border, borderStyle: "solid" }, { direction: "row", justify: "between", align: "start", gap: 40 });
    (t.elements.find((e) => e.id === "footer-inner") as Element).overrides = { mobile: { direction: "column", gap: 28 } };
    t.add({ id: "footer-mark", type: "Heading", name: "Footer wordmark", parentId: footer, content: "Ledger & Co.", base: { widthMode: "auto", heightMode: "auto", fontSize: 16, fontWeight: "600", color: p.text } });
    for (const [i, [label, links]] of ([
        ["Firm", ["Services", "Approach", "Team"]],
        ["Resources", ["Insights", "Rates", "Deadlines"]],
        ["Contact", ["hello@ledger.co", "+44 20 7946 0813"]],
    ] as Array<[string, string[]]>).entries()) {
        const col = t.add({ id: `footer-col-${i}`, type: "Stack", name: label, parentId: footer, base: { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "column", gap: 10 } });
        t.add({ id: `footer-col-${i}-label`, type: "Text", name: `${label} label`, parentId: col, content: label, base: { widthMode: "auto", heightMode: "auto", fontSize: 13, fontWeight: "600", color: p.text } });
        for (const [j, link] of links.entries()) {
            t.add({ id: `footer-col-${i}-link-${j}`, type: "Text", name: `${label} ${j}`, parentId: col, content: link, base: { widthMode: "auto", heightMode: "auto", fontSize: 14, color: p.muted, cursor: "pointer" }, hover: { color: p.primary } });
        }
    }

    return { tree: t, palette: p, font: sans };
}

/* ------------------------------------------------------------------ emit */

function bundle(id: string, version: string, name: string, built: ReturnType<typeof sable>) {
    return {
        schemaVersion: 1,
        id,
        version,
        pages: [
            {
                name: "Home",
                slug: "home",
                elements: built.tree.elements,
                rootStyle: {
                    documentMode: "page",
                    maxWidth: 1180,
                    canvasHeight: 5200,
                    fullWidth: true,
                    bg: built.palette.bg,
                    layout: "stack",
                    direction: "column",
                    gap: 0,
                    padT: 0,
                    padR: 0,
                    padB: 0,
                    padL: 0,
                    align: "stretch",
                    fontFamily: built.font,
                    pageTransition: "smooth",
                    pageTransitionDuration: 380,
                    breakpoints: [
                        { id: "desktop", name: "Desktop", width: 1280 },
                        { id: "tablet", name: "Tablet", width: 768 },
                        { id: "mobile", name: "Mobile", width: 390 },
                    ],
                    baseBreakpointId: "desktop",
                },
                dataSources: [],
            },
        ],
        components: [],
    };
}

const outDir = process.argv[2];
if (!outDir) throw new Error("Usage: build-extra.ts <outputDir>");

const builds = [
    { id: "sable-wine-room", version: "1.0.0", name: "Sable", built: sable() },
    { id: "ledger-advisory", version: "1.0.0", name: "Ledger & Co.", built: ledger() },
];

async function main() {
    for (const entry of builds) {
        const dir = resolve(outDir, entry.id);
        await mkdir(dir, { recursive: true });
        const data = bundle(entry.id, entry.version, entry.name, entry.built);
        await writeFile(resolve(dir, "template.json"), `${JSON.stringify(data, null, 2)}\n`);
        console.log(`${entry.id}: ${entry.built.tree.elements.length} elements`);
    }
}

main();
