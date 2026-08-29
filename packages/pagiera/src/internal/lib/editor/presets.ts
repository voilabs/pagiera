import { createElement } from "./tree";
import type { CanvasElement, ElementStyle, ElementType } from "./types";

export const PRESET_CATEGORIES = [
    "Navigation",
    "Hero",
    "Features",
    "Content",
    "Social proof",
    "Pricing",
    "CTA",
    "Footer",
] as const;

export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export type ComponentPreset = {
    id: string;
    name: string;
    category: PresetCategory;
    description: string;
    create: () => CanvasElement[];
};

/**
 * One palette for every preset.
 *
 * They are dropped onto pages that already have a design, so what matters is
 * that they are internally consistent and easy to recolour — a preset built
 * from a named token is one Find-and-replace away from a brand, while one built
 * from thirty ad-hoc hexes is a afternoon.
 */
const C = {
    ink: "#0b1020",
    inkSoft: "#111827",
    surface: "#ffffff",
    subtle: "#f8fafc",
    line: "#e2e8f0",
    lineDark: "rgba(255,255,255,.12)",
    text: "#0f172a",
    muted: "#64748b",
    mutedDark: "#94a3b8",
    onDark: "#f8fafc",
    accent: "#6366f1",
    accentSoft: "#eef2ff",
};

function node(
    type: ElementType,
    patch: Partial<ElementStyle>,
    props: Partial<CanvasElement> = {},
    parentId?: string,
) {
    const element = createElement(type, { x: 0, y: 0, z: 0, parentId });
    element.base = { ...element.base, ...patch };
    return Object.assign(element, props);
}

/* --------------------------------------------------------------- vocabulary */

/** A full-bleed band with the page's usual vertical rhythm. */
function section(name: string, patch: Partial<ElementStyle> = {}, props: Partial<CanvasElement> = {}) {
    const element = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column",
        gap: 40, padT: 88, padR: 40, padB: 88, padL: 40,
        bg: C.surface, color: C.text, ...patch,
    }, { name, ...props });
    element.overrides = { mobile: { padT: 56, padR: 20, padB: 56, padL: 20, gap: 28 } };
    return element;
}

/** A layout box: no chrome of its own unless it is asked for. */
function box(
    name: string,
    parentId: string,
    patch: Partial<ElementStyle> = {},
    props: Partial<CanvasElement> = {},
) {
    return node("Container", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column",
        gap: 12, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0, bg: "transparent",
        align: "stretch", ...patch,
    }, { name, ...props }, parentId);
}

/** A row that becomes a column on a phone — the shape most sections need. */
function row(
    name: string,
    parentId: string,
    patch: Partial<ElementStyle> = {},
    props: Partial<CanvasElement> = {},
) {
    const element = box(name, parentId, { direction: "row", align: "center", gap: 24, ...patch }, props);
    element.overrides = { mobile: { direction: "column", align: "stretch" } };
    return element;
}

function heading(text: string, parentId: string, size: number, patch: Partial<ElementStyle> = {}) {
    const element = node("Heading", {
        widthMode: "fill", heightMode: "auto", fontSize: size, fontWeight: "700",
        lineHeight: 1.12, letterSpacing: size > 40 ? -1.6 : -0.6, color: C.text, ...patch,
    }, { content: text }, parentId);
    element.overrides = { mobile: { fontSize: Math.max(24, Math.round(size * 0.62)), letterSpacing: -0.5 } };
    return element;
}

function body(text: string, parentId: string, patch: Partial<ElementStyle> = {}) {
    return node("Text", {
        widthMode: "fill", heightMode: "auto", fontSize: 16, lineHeight: 1.7,
        color: C.muted, ...patch,
    }, { content: text }, parentId);
}

function eyebrow(text: string, parentId: string, color = C.accent) {
    return node("Text", {
        widthMode: "auto", heightMode: "auto", fontSize: 12, fontWeight: "600",
        letterSpacing: 1.6, textTransform: "uppercase", color,
    }, { content: text }, parentId);
}

function button(text: string, parentId: string, kind: "primary" | "ghost" | "light" = "primary") {
    const skin: Partial<ElementStyle> =
        kind === "primary"
            ? { bg: C.accent, color: "#ffffff", borderW: 0 }
            : kind === "light"
                ? { bg: "#ffffff", color: C.inkSoft, borderW: 0 }
                : { bg: "transparent", color: C.text, borderW: 1, borderC: C.line };
    return node("Button", {
        widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row",
        justify: "center", align: "center", radius: 10,
        padT: 13, padR: 22, padB: 13, padL: 22, fontSize: 15, fontWeight: "600",
        textAlign: "center", ...skin,
    }, { content: text }, parentId);
}

/** A bordered card — the unit most of these sections are built from. */
function card(name: string, parentId: string, patch: Partial<ElementStyle> = {}) {
    return box(name, parentId, {
        gap: 12, padT: 26, padR: 26, padB: 26, padL: 26,
        bg: C.surface, borderW: 1, borderC: C.line, radius: 16, ...patch,
    });
}

/** A stand-in for a picture the author has not chosen yet. */
function placeholder(name: string, parentId: string, patch: Partial<ElementStyle> = {}) {
    return node("Image", {
        widthMode: "fill", heightMode: "fixed", h: 260, bg: C.accentSoft,
        radius: 16, ...patch,
    }, { name, src: "", alt: "" }, parentId);
}

function icon(name: string, parentId: string, glyph: CanvasElement["iconName"], patch: Partial<ElementStyle> = {}) {
    return node("Icon", {
        widthMode: "fixed", heightMode: "fixed", w: 22, h: 22, color: C.accent, ...patch,
    }, { name, iconName: glyph }, parentId);
}

/* ------------------------------------------------------------- navigation */

function navbar() {
    const bar = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row",
        justify: "between", align: "center", gap: 24, padT: 18, padR: 40,
        padB: 18, padL: 40, bg: C.ink, color: C.onDark,
    }, { name: "Navbar" });
    bar.overrides = { mobile: { direction: "column", align: "stretch", padR: 20, padL: 20 } };

    const logo = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 20, fontWeight: "700", color: "#ffffff", letterSpacing: -0.4 }, { name: "Brand", content: "NORTHSTAR" }, bar.id);
    const links = box("Navigation links", bar.id, { widthMode: "auto", direction: "row", align: "center", gap: 6 });
    links.overrides = { mobile: { widthMode: "fill", justify: "center", wrap: true } };
    const link = (label: string) => node("Button", { widthMode: "auto", heightMode: "auto", bg: "transparent", color: "#cbd5e1", padT: 8, padR: 12, padB: 8, padL: 12, fontSize: 14, fontWeight: "500" }, { content: label }, links.id);
    const cta = node("Button", { widthMode: "auto", heightMode: "auto", bg: "#8b7bff", color: "#ffffff", radius: 999, padT: 10, padR: 18, padB: 10, padL: 18, fontSize: 14, fontWeight: "600" }, { content: "Get started", name: "Navbar CTA" }, bar.id);
    return [bar, logo, links, link("Product"), link("Solutions"), link("Pricing"), cta];
}

function navbarLight() {
    const elements = navbar();
    const bar = elements[0];
    bar.name = "Navbar · Light";
    bar.base = { ...bar.base, bg: "#ffffff", color: C.inkSoft, borderW: 0, shadow: "0 1px 0 rgba(15,23,42,.10)", padT: 16, padB: 16 };
    for (const element of elements) {
        if (element.name === "Brand") element.base = { ...element.base, color: C.inkSoft };
        if (element.parentId === elements[2].id) element.base = { ...element.base, color: "#475569" };
    }
    const cta = elements.find((element) => element.name === "Navbar CTA");
    if (cta) cta.base = { ...cta.base, bg: C.inkSoft, color: "#ffffff", radius: 10 };
    return elements;
}

function navbarGlass() {
    const elements = navbar();
    const bar = elements[0];
    bar.name = "Navbar · Glass";
    bar.base = { ...bar.base, bg: "rgba(15,23,42,.78)", backdropBlur: 18, borderW: 1, borderC: C.lineDark, radius: 18, padT: 14, padR: 22, padB: 14, padL: 22, shadow: "0 18px 50px rgba(2,6,23,.28)" };
    const cta = elements.find((element) => element.name === "Navbar CTA");
    if (cta) cta.base = { ...cta.base, bg: "#ffffff", color: C.inkSoft };
    return elements;
}

/** Logo in the middle, navigation split either side of it. */
function navbarCentered() {
    const bar = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row",
        justify: "between", align: "center", gap: 20, padT: 18, padR: 40, padB: 18, padL: 40,
        bg: "#ffffff", color: C.text, borderB: 1, borderC: C.line,
    }, { name: "Navbar · Centered" });
    bar.overrides = { mobile: { direction: "column", padR: 20, padL: 20 } };

    const group = (name: string) => {
        const element = box(name, bar.id, { widthMode: "fill", direction: "row", align: "center", gap: 4 });
        element.base.grow = 1;
        return element;
    };
    const left = group("Links left");
    const right = group("Links right");
    right.base.justify = "end";

    const logo = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 19, fontWeight: "700", letterSpacing: -0.4, color: C.text, textAlign: "center" }, { name: "Brand", content: "NORTHSTAR" }, bar.id);
    const link = (label: string, parent: string) => node("Button", { widthMode: "auto", heightMode: "auto", bg: "transparent", color: C.muted, padT: 8, padR: 12, padB: 8, padL: 12, fontSize: 14, fontWeight: "500" }, { content: label }, parent);

    return [bar, left, link("Product", left.id), link("Pricing", left.id), logo, right, link("Docs", right.id), link("Sign in", right.id)];
}

/** Brand and one action. For documentation and marketing one-pagers. */
function navbarMinimal() {
    const bar = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row",
        justify: "between", align: "center", gap: 16, padT: 20, padR: 40, padB: 20, padL: 40,
        bg: "transparent", color: C.text,
    }, { name: "Navbar · Minimal" });
    bar.overrides = { mobile: { padR: 20, padL: 20 } };
    const logo = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 18, fontWeight: "700", letterSpacing: -0.3, color: C.text }, { name: "Brand", content: "NORTHSTAR" }, bar.id);
    const cta = button("Get in touch", bar.id, "ghost");
    cta.base = { ...cta.base, radius: 999, padT: 10, padR: 18, padB: 10, padL: 18, fontSize: 14 };
    return [bar, logo, cta];
}

/* ------------------------------------------------------------------- hero */

function hero() {
    const root = node("Section", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", justify: "center", align: "center", gap: 24, padT: 112, padR: 32, padB: 112, padL: 32, bg: C.ink, gradient: "radial-gradient(circle at 50% 0%, #312e81 0%, #0b1020 55%)", color: "#ffffff", textAlign: "center" }, { name: "Hero" });
    root.overrides = { mobile: { padT: 72, padB: 72, padR: 20, padL: 20 } };
    const brow = eyebrow("Built for ambitious teams", root.id, "#a5b4fc");
    brow.base.textAlign = "center";
    const title = node("Heading", { widthMode: "fixed", w: 820, heightMode: "auto", color: "#ffffff", fontSize: 64, fontWeight: "700", lineHeight: 1.05, letterSpacing: -2, textAlign: "center" }, { content: "Turn your next big idea into something remarkable" }, root.id);
    title.overrides = { tablet: { w: 640, fontSize: 48 }, mobile: { widthMode: "fill", fontSize: 38, letterSpacing: -1 } };
    const text = node("Text", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#cbd5e1", fontSize: 18, lineHeight: 1.7, textAlign: "center" }, { content: "A flexible platform for designing, launching, and improving digital experiences without slowing down." }, root.id);
    text.overrides = { mobile: { widthMode: "fill", fontSize: 16 } };
    const actions = box("Hero actions", root.id, { widthMode: "auto", direction: "row", justify: "center", align: "center", gap: 12, padT: 8 });
    actions.overrides = { mobile: { widthMode: "fill", direction: "column", align: "stretch" } };
    const primary = node("Button", { widthMode: "auto", heightMode: "auto", bg: "#8b7bff", color: "#ffffff", radius: 999, padT: 14, padR: 24, padB: 14, padL: 24, fontWeight: "600" }, { content: "Start building" }, actions.id);
    const secondary = node("Button", { widthMode: "auto", heightMode: "auto", bg: "rgba(255,255,255,.08)", color: "#ffffff", radius: 999, borderW: 1, borderC: "rgba(255,255,255,.16)", padT: 14, padR: 24, padB: 14, padL: 24, fontWeight: "600" }, { content: "See how it works" }, actions.id);
    return [root, brow, title, text, actions, primary, secondary];
}

/** Copy on the left, a picture on the right. The workhorse marketing hero. */
function heroSplit() {
    const root = section("Hero · Split", { padT: 96, padB: 96 });
    const split = row("Hero split", root.id, { align: "center", gap: 56 });
    const copy = box("Hero copy", split.id, { gap: 18 });
    copy.base.grow = 1;
    const brow = eyebrow("New in 2026", copy.id);
    const title = heading("Ship the work your team is proud of", copy.id, 52);
    const text = body("Plan, build and publish in one place. No handoffs, no rebuilds, no waiting for a release window.", copy.id, { fontSize: 18 });
    const actions = box("Hero actions", copy.id, { widthMode: "auto", direction: "row", gap: 10, padT: 8 });
    actions.overrides = { mobile: { widthMode: "fill", direction: "column", align: "stretch" } };
    const shot = placeholder("Hero image", split.id, { h: 380, radius: 20 });
    shot.base.grow = 1;
    return [root, split, copy, brow, title, text, actions, button("Start free", actions.id), button("Book a demo", actions.id, "ghost"), shot];
}

/** A photograph with the message set over it. */
function heroImage() {
    const root = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column",
        justify: "center", align: "start", gap: 20, padT: 140, padR: 56, padB: 140, padL: 56,
        bg: C.ink, bgImage: "", gradient: "linear-gradient(90deg, rgba(11,16,32,.92) 0%, rgba(11,16,32,.45) 100%)",
        bgSize: "cover", bgPosition: "center", color: "#ffffff",
    }, { name: "Hero · Image" });
    root.overrides = { mobile: { padT: 88, padB: 88, padR: 20, padL: 20 } };
    const copy = box("Hero copy", root.id, { widthMode: "fixed", w: 620, gap: 18 });
    copy.overrides = { mobile: { widthMode: "fill" } };
    const title = heading("Where the work actually happens", copy.id, 56, { color: "#ffffff" });
    const text = body("Set the section's background image in the Style panel — the gradient above it keeps the type readable whatever you choose.", copy.id, { color: "#cbd5e1", fontSize: 18 });
    const actions = box("Hero actions", copy.id, { widthMode: "auto", direction: "row", gap: 10, padT: 8 });
    return [root, copy, title, text, actions, button("Get started", actions.id, "light"), button("Watch the film", actions.id, "ghost")];
}

/* --------------------------------------------------------------- features */

/** A bento wall: unequal cells that still line up, using column spans. */
function bento() {
    const root = section("Bento", { bg: C.subtle });
    const head = box("Bento heading", root.id, { gap: 12, align: "center", textAlign: "center" });
    const brow = eyebrow("Everything included", head.id);
    brow.base.textAlign = "center";
    const title = heading("One place for the whole product", head.id, 40, { textAlign: "center" });

    const grid = node("Grid", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row",
        columns: 6, gap: 16, align: "stretch",
    }, { name: "Bento grid" }, root.id);
    grid.overrides = { mobile: { columns: 1 } };

    const cell = (name: string, span: number, title_: string, text_: string, tall = false) => {
        const element = card(name, grid.id, { gap: 10, padT: 24, padR: 24, padB: 24, padL: 24 });
        element.base.gridSpan = span;
        if (tall) element.base.h = 240;
        element.overrides = { mobile: { gridSpan: 1 } };
        return [
            element,
            node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 18, fontWeight: "600", color: C.text, lineHeight: 1.3 }, { content: title_ }, element.id),
            body(text_, element.id, { fontSize: 14 }),
        ];
    };

    return [
        root, head, brow, title, grid,
        ...cell("Bento · wide", 4, "Design and build in the same file", "No exporting, no handoff. What you draw is what publishes.", true),
        ...cell("Bento · tall", 2, "Real data", "Bind any element to a JSON endpoint."),
        ...cell("Bento · small", 2, "Breakpoints", "Every value can differ per screen."),
        ...cell("Bento · small", 2, "Components", "Build once, reuse across pages."),
        ...cell("Bento · small", 2, "Publish", "One click, versioned."),
    ];
}

/** Three columns, each an icon, a title and a line of copy. */
function featuresThree() {
    const root = section("Features · Three up");
    const head = box("Features heading", root.id, { gap: 12, align: "center", textAlign: "center" });
    const brow = eyebrow("Why teams switch", head.id);
    brow.base.textAlign = "center";
    const title = heading("Built for the way you actually work", head.id, 40, { textAlign: "center" });

    const grid = node("Grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 3, gap: 24, align: "stretch" }, { name: "Feature columns" }, root.id);
    grid.overrides = { mobile: { columns: 1 } };

    const column = (name: string, glyph: CanvasElement["iconName"], title_: string, text_: string) => {
        const element = box(name, grid.id, { gap: 12 });
        return [
            element,
            icon("Feature icon", element.id, glyph, { w: 26, h: 26 }),
            node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 19, fontWeight: "600", color: C.text }, { content: title_ }, element.id),
            body(text_, element.id, { fontSize: 15 }),
        ];
    };

    return [
        root, head, brow, title, grid,
        ...column("Feature", "bolt", "Fast by default", "Pages publish as static markup with no runtime to wait on."),
        ...column("Feature", "lock", "Safe to edit", "Every change is versioned, so nothing is ever one click from gone."),
        ...column("Feature", "sparkles", "Made to share", "Hand a teammate a link and they are editing the real thing."),
    ];
}

/** A picture beside a checklist, the pattern for explaining one capability. */
function featureSplit() {
    const root = section("Feature · Split");
    const split = row("Feature split", root.id, { align: "center", gap: 56 });
    const shot = placeholder("Feature image", split.id, { h: 340, radius: 20 });
    shot.base.grow = 1;
    const copy = box("Feature copy", split.id, { gap: 16 });
    copy.base.grow = 1;
    const brow = eyebrow("Collaboration", copy.id);
    const title = heading("Everyone works from the same page", copy.id, 38);
    const text = body("Comments, versions and permissions live with the page itself rather than in a second tool.", copy.id);

    const list = node("List", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 10, padL: 22, align: "stretch", color: C.text, fontSize: 15, lineHeight: 1.6 }, { name: "Feature list", listStyle: "bullet" }, copy.id);
    const item = (text_: string) => node("ListItem", { widthMode: "fill", heightMode: "auto", fontSize: 15, lineHeight: 1.6, color: C.text }, { content: text_ }, list.id);

    return [root, split, shot, copy, brow, title, text, list, item("Live cursors and inline comments"), item("Roles down to a single page"), item("Restore any earlier version")];
}

/* ---------------------------------------------------------------- content */

/** Numbers, big enough to be the argument. */
function stats() {
    const root = section("Stats", { bg: C.ink, color: C.onDark, padT: 64, padB: 64 });
    const grid = node("Grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 4, gap: 24, align: "stretch" }, { name: "Stat row" }, root.id);
    grid.overrides = { mobile: { columns: 2 } };
    const stat = (value: string, label: string) => {
        const element = box("Stat", grid.id, { gap: 6, align: "center", textAlign: "center" });
        return [
            element,
            node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 44, fontWeight: "700", letterSpacing: -1.4, color: "#ffffff", textAlign: "center" }, { content: value }, element.id),
            node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 13, color: C.mutedDark, textAlign: "center", letterSpacing: 0.4 }, { content: label }, element.id),
        ];
    };
    return [root, grid, ...stat("12k+", "Teams building"), ...stat("99.99%", "Uptime"), ...stat("40ms", "Median response"), ...stat("4.9/5", "Customer rating")];
}

/** A quiet row of customer marks. */
function logoCloud() {
    const root = section("Logo cloud", { bg: C.subtle, padT: 48, padB: 48, gap: 24 });
    const label = node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 12, fontWeight: "600", letterSpacing: 1.6, textTransform: "uppercase", color: C.muted, textAlign: "center" }, { content: "Trusted by teams that ship" }, root.id);
    const strip = box("Logos", root.id, { direction: "row", justify: "between", align: "center", gap: 32, wrap: true });
    const mark = (text: string) => node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 19, fontWeight: "700", letterSpacing: 0.6, color: "#94a3b8" }, { content: text }, strip.id);
    return [root, label, strip, mark("NORTHSTAR"), mark("FLEXO"), mark("KITE"), mark("MOTION"), mark("LUMA"), mark("ARC")];
}

/** Question and answer rows. */
function faq() {
    const root = section("FAQ");
    const split = row("FAQ split", root.id, { align: "start", gap: 56 });
    const intro = box("FAQ intro", split.id, { gap: 12 });
    intro.base.grow = 1;
    const title = heading("Questions, answered", intro.id, 38);
    const text = body("Everything people ask before they start. Anything else, just get in touch.", intro.id);

    const rows = box("FAQ rows", split.id, { gap: 0 });
    rows.base.grow = 1;
    const entry = (q: string, a: string) => {
        const element = box("FAQ item", rows.id, { gap: 8, padT: 20, padB: 20, borderT: 1, borderC: C.line });
        return [
            element,
            node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 16, fontWeight: "600", color: C.text }, { content: q }, element.id),
            body(a, element.id, { fontSize: 15 }),
        ];
    };
    return [
        root, split, intro, title, text, rows,
        ...entry("Can I use my own domain?", "Yes. Point a CNAME at us and the certificate is issued automatically."),
        ...entry("What happens to my data?", "It stays in your database. We never copy page content anywhere else."),
        ...entry("Is there a free plan?", "Every account starts free, with no card and no time limit."),
    ];
}

/* ----------------------------------------------------------- social proof */

/** One quotation, given room. */
function testimonialSingle() {
    const root = section("Testimonial", { bg: C.subtle, align: "center" });
    const inner = box("Testimonial inner", root.id, { widthMode: "fixed", w: 760, gap: 24, align: "center", textAlign: "center" });
    inner.overrides = { mobile: { widthMode: "fill" } };
    const quote = node("Quote", {
        widthMode: "fill", heightMode: "auto", fontSize: 26, lineHeight: 1.5,
        color: C.text, borderL: 0, padL: 0, padT: 0, textAlign: "center", fontWeight: "500",
    }, { content: "We replaced three tools with this and shipped our marketing site in a week. The team has not opened a ticket since." }, inner.id);
    const who = box("Attribution", inner.id, { widthMode: "auto", direction: "row", align: "center", gap: 12 });
    const avatar = node("Image", { widthMode: "fixed", heightMode: "fixed", w: 40, h: 40, radius: 999, bg: C.accentSoft }, { name: "Avatar", src: "", alt: "" }, who.id);
    const name = node("Text", { widthMode: "auto", heightMode: "auto", fontSize: 14, fontWeight: "600", color: C.text }, { content: "Maya Chen · VP Marketing, Flexo" }, who.id);
    return [root, inner, quote, who, avatar, name];
}

/** Three cards for the shorter kind of praise. */
function testimonialGrid() {
    const root = section("Testimonials");
    const head = box("Testimonials heading", root.id, { gap: 12, align: "center", textAlign: "center" });
    const title = heading("What teams tell us", head.id, 38, { textAlign: "center" });
    const grid = node("Grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 3, gap: 20, align: "stretch" }, { name: "Testimonial grid" }, root.id);
    grid.overrides = { mobile: { columns: 1 } };
    const entry = (text_: string, who: string) => {
        const element = card("Testimonial card", grid.id, { gap: 16 });
        return [
            element,
            body(text_, element.id, { fontSize: 15, color: C.text, lineHeight: 1.65 }),
            node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 13, fontWeight: "600", color: C.muted }, { content: who }, element.id),
        ];
    };
    return [
        root, head, title, grid,
        ...entry("The first builder our designers did not immediately ask to replace.", "Ada Owens · Head of Design"),
        ...entry("We publish four times a week now. It used to be four times a quarter.", "Tom Reyes · Growth"),
        ...entry("Binding pages to our own API took an afternoon.", "Sofia Marín · Engineering"),
    ];
}

/* ---------------------------------------------------------------- pricing */

function pricing() {
    const root = section("Pricing");
    const head = box("Pricing heading", root.id, { gap: 12, align: "center", textAlign: "center" });
    const brow = eyebrow("Pricing", head.id);
    brow.base.textAlign = "center";
    const title = heading("Simple, per seat", head.id, 40, { textAlign: "center" });

    const grid = node("Grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 3, gap: 20, align: "stretch" }, { name: "Pricing tiers" }, root.id);
    grid.overrides = { mobile: { columns: 1 } };

    const tier = (name: string, price: string, note: string, features: string[], featured: boolean) => {
        const element = card(`Tier · ${name}`, grid.id, {
            gap: 16, padT: 30, padR: 28, padB: 30, padL: 28,
            ...(featured
                ? { bg: C.ink, borderC: C.ink, color: C.onDark, shadow: "0 24px 60px rgba(15,23,42,.18)" }
                : {}),
        });
        const on = featured ? "#ffffff" : C.text;
        const soft = featured ? C.mutedDark : C.muted;
        const list = node("List", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 8, padL: 20, align: "stretch", color: on, fontSize: 14, lineHeight: 1.6 }, { name: "Tier features", listStyle: "bullet" }, element.id);
        const action = button(featured ? "Start free trial" : "Choose plan", element.id, featured ? "light" : "ghost");
        action.base = { ...action.base, widthMode: "fill" };
        return [
            element,
            node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 13, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase", color: soft }, { content: name }, element.id),
            node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 40, fontWeight: "700", letterSpacing: -1.4, color: on }, { content: price }, element.id),
            node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 14, color: soft }, { content: note }, element.id),
            list,
            ...features.map((text_) => node("ListItem", { widthMode: "fill", heightMode: "auto", fontSize: 14, lineHeight: 1.6, color: on }, { content: text_ }, list.id)),
            action,
        ];
    };

    return [
        root, head, brow, title, grid,
        ...tier("Starter", "$0", "For one person finding their feet.", ["One project", "Community support"], false),
        ...tier("Team", "$18", "Per editor, per month.", ["Unlimited projects", "Custom domains", "Version history"], true),
        ...tier("Scale", "Talk to us", "For organisations with a review process.", ["SSO and SCIM", "Audit log", "Priority support"], false),
    ];
}

/* -------------------------------------------------------------------- cta */

/** The closing argument, on a coloured band. */
function ctaBanner() {
    const root = section("CTA · Banner", { bg: C.accent, color: "#ffffff", align: "center", gap: 20, padT: 72, padB: 72 });
    const title = heading("Ready when you are", root.id, 42, { color: "#ffffff", textAlign: "center" });
    const text = body("Start with a blank page or one of the templates. No card, no call.", root.id, { color: "rgba(255,255,255,.82)", fontSize: 17, textAlign: "center" });
    const actions = box("CTA actions", root.id, { widthMode: "auto", direction: "row", justify: "center", gap: 10, padT: 6 });
    actions.overrides = { mobile: { widthMode: "fill", direction: "column", align: "stretch" } };
    const secondary = button("Talk to sales", actions.id, "ghost");
    secondary.base = { ...secondary.base, color: "#ffffff", borderC: "rgba(255,255,255,.4)" };
    return [root, title, text, actions, button("Start building", actions.id, "light"), secondary];
}

/** Copy on one side, the buttons on the other. */
function ctaSplit() {
    const root = section("CTA · Split", { padT: 64, padB: 64 });
    const panel = row("CTA panel", root.id, {
        justify: "between", align: "center", gap: 32,
        bg: C.subtle, borderW: 1, borderC: C.line, radius: 20,
        padT: 36, padR: 36, padB: 36, padL: 36,
    });
    const copy = box("CTA copy", panel.id, { gap: 8 });
    copy.base.grow = 1;
    const title = heading("Bring your next page live today", copy.id, 28);
    const text = body("Import a template, point it at your data and publish.", copy.id, { fontSize: 15 });
    const actions = box("CTA actions", panel.id, { widthMode: "auto", direction: "row", gap: 10 });
    actions.overrides = { mobile: { widthMode: "fill", direction: "column", align: "stretch" } };
    return [root, panel, copy, title, text, actions, button("Get started", actions.id), button("See templates", actions.id, "ghost")];
}

/** A real form, wired to whatever endpoint the author points it at. */
function ctaNewsletter() {
    const root = section("CTA · Newsletter", { bg: C.ink, color: C.onDark, align: "center", gap: 18, padT: 72, padB: 72 });
    const title = heading("Get the monthly build notes", root.id, 34, { color: "#ffffff", textAlign: "center" });
    const text = body("What changed, what broke and what we learned. One email a month.", root.id, { color: C.mutedDark, textAlign: "center" });

    const form = node("Form", {
        widthMode: "fixed", w: 460, heightMode: "auto", layout: "stack", direction: "row",
        gap: 10, align: "stretch", padT: 6,
    }, {
        name: "Newsletter form", formAction: "", formMethod: "POST", formSubmitMode: "request",
        formContentType: "json", formSuccessMessage: "You are on the list.",
        formErrorMessage: "That did not go through — try again?", formResetOnSuccess: true,
    }, root.id);
    form.overrides = { mobile: { widthMode: "fill", direction: "column" } };

    const email = node("Input", {
        widthMode: "fill", heightMode: "fixed", h: 46, padR: 14, padL: 14,
        bg: "rgba(255,255,255,.06)", color: "#ffffff", borderW: 1, borderC: C.lineDark,
        radius: 10, fontSize: 15,
    }, { name: "Email", fieldName: "email", inputType: "email", placeholder: "you@company.com", required: true }, form.id);
    email.base.grow = 1;

    const submit = node("Button", {
        widthMode: "auto", heightMode: "fixed", h: 46, layout: "stack", direction: "row",
        justify: "center", align: "center", bg: "#ffffff", color: C.inkSoft,
        radius: 10, padR: 22, padL: 22, fontSize: 15, fontWeight: "600",
    }, { content: "Subscribe", buttonType: "submit" }, form.id);

    return [root, title, text, form, email, submit];
}

/* ----------------------------------------------------------------- footer */

function footer() {
    const root = node("Section", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 36, padT: 64, padR: 40, padB: 32, padL: 40, bg: "#09090f", color: C.onDark }, { name: "Footer" });
    const top = box("Footer content", root.id, { direction: "row", justify: "between", align: "start", gap: 32 });
    top.overrides = { mobile: { direction: "column" } };
    const brand = box("Footer brand", top.id, { widthMode: "fixed", w: 340, gap: 12 });
    const title = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 24, fontWeight: "700", color: "#ffffff" }, { content: "NORTHSTAR" }, brand.id);
    const copy = node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 14, color: C.mutedDark, lineHeight: 1.7 }, { content: "Thoughtful digital products for teams building what comes next." }, brand.id);
    const columns = box("Footer links", top.id, { widthMode: "auto", direction: "row", gap: 64 });
    columns.overrides = { mobile: { widthMode: "fill", wrap: true, gap: 32 } };
    const column = (heading_: string, body_: string) => {
        const group = box("Footer column", columns.id, { widthMode: "fixed", w: 130, gap: 10 });
        return [group, node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 13, fontWeight: "600", color: "#ffffff" }, { content: heading_ }, group.id), node("Text", { widthMode: "auto", heightMode: "auto", fontSize: 13, color: C.mutedDark, lineHeight: 2 }, { content: body_ }, group.id)];
    };
    const legal = node("Text", { widthMode: "fill", heightMode: "auto", padT: 24, borderW: 0, color: "#64748b", fontSize: 12 }, { content: "© 2026 Northstar. All rights reserved." }, root.id);
    return [root, top, brand, title, copy, columns, ...column("Product", "Features\nIntegrations\nChangelog"), ...column("Company", "About\nJournal\nContact"), legal];
}

/** Brand, a line of links and the legal note, on one rule. */
function footerMinimal() {
    const root = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column",
        gap: 16, padT: 32, padR: 40, padB: 32, padL: 40, bg: C.surface, color: C.text,
        borderT: 1, borderC: C.line,
    }, { name: "Footer · Minimal" });
    root.overrides = { mobile: { padR: 20, padL: 20 } };
    const bar = row("Footer row", root.id, { justify: "between", align: "center", gap: 20 });
    const brand = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 17, fontWeight: "700", letterSpacing: -0.3, color: C.text }, { name: "Brand", content: "NORTHSTAR" }, bar.id);
    const links = box("Footer links", bar.id, { widthMode: "auto", direction: "row", align: "center", gap: 4 });
    links.overrides = { mobile: { widthMode: "fill", wrap: true, justify: "start" } };
    const link = (label: string) => node("Button", { widthMode: "auto", heightMode: "auto", bg: "transparent", color: C.muted, padT: 6, padR: 10, padB: 6, padL: 10, fontSize: 14, fontWeight: "500" }, { content: label }, links.id);
    const rule = node("Divider", { widthMode: "fill", heightMode: "fixed", h: 1, bg: C.line }, { name: "Footer rule" }, root.id);
    const legal = node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 12, color: C.muted }, { content: "© 2026 Northstar. All rights reserved." }, root.id);
    return [root, bar, brand, links, link("Privacy"), link("Terms"), link("Status"), rule, legal];
}

/** A closing invitation stacked on top of the usual link columns. */
function footerCta() {
    const elements = footer();
    const root = elements[0];
    root.name = "Footer · With CTA";
    root.base = { ...root.base, gap: 40, padT: 72 };

    const band = box("Footer CTA", root.id, {
        direction: "row", justify: "between", align: "center", gap: 24,
        padB: 36, borderB: 1, borderC: C.lineDark,
    });
    band.overrides = { mobile: { direction: "column", align: "stretch" } };
    const title = node("Heading", { widthMode: "fill", heightMode: "auto", fontSize: 34, fontWeight: "700", letterSpacing: -1, color: "#ffffff", lineHeight: 1.15 }, { content: "Start building today" }, band.id);
    const actions = box("Footer CTA actions", band.id, { widthMode: "auto", direction: "row", gap: 10 });
    const primary = button("Get started", actions.id, "light");
    const secondary = button("Talk to us", actions.id, "ghost");
    secondary.base = { ...secondary.base, color: "#ffffff", borderC: C.lineDark };

    // Siblings all share z, so document order is what puts the band above the
    // link columns — the same rule every preset here relies on. (A negative z
    // would not help: the validator clamps z to zero or more.)
    return [root, band, title, actions, primary, secondary, ...elements.slice(1)];
}

export const COMPONENT_PRESETS: ComponentPreset[] = [
    { id: "navbar-dark", name: "Navbar Dark", category: "Navigation", description: "Dark brand, links and pill CTA", create: navbar },
    { id: "navbar-light", name: "Navbar Light", category: "Navigation", description: "Clean product navigation", create: navbarLight },
    { id: "navbar-glass", name: "Navbar Glass", category: "Navigation", description: "Floating translucent navigation", create: navbarGlass },
    { id: "navbar-centered", name: "Navbar Centered", category: "Navigation", description: "Logo between two link groups", create: navbarCentered },
    { id: "navbar-minimal", name: "Navbar Minimal", category: "Navigation", description: "Brand and a single action", create: navbarMinimal },

    { id: "hero-centered", name: "Hero Centered", category: "Hero", description: "Gradient conversion hero", create: hero },
    { id: "hero-split", name: "Hero Split", category: "Hero", description: "Copy beside a product shot", create: heroSplit },
    { id: "hero-image", name: "Hero Image", category: "Hero", description: "Full-bleed photo with a scrim", create: heroImage },

    { id: "bento-grid", name: "Bento Grid", category: "Features", description: "Unequal cells on one grid", create: bento },
    { id: "features-three", name: "Three Up", category: "Features", description: "Icon, title and copy columns", create: featuresThree },
    { id: "feature-split", name: "Feature Split", category: "Features", description: "Image beside a checklist", create: featureSplit },

    { id: "stats-row", name: "Stat Row", category: "Content", description: "Four numbers on a dark band", create: stats },
    { id: "logo-cloud", name: "Logo Cloud", category: "Content", description: "A quiet row of customer marks", create: logoCloud },
    { id: "faq-list", name: "FAQ", category: "Content", description: "Questions beside their answers", create: faq },

    { id: "testimonial-single", name: "Quote", category: "Social proof", description: "One testimonial, given room", create: testimonialSingle },
    { id: "testimonial-grid", name: "Quote Grid", category: "Social proof", description: "Three short testimonials", create: testimonialGrid },

    { id: "pricing-tiers", name: "Pricing Tiers", category: "Pricing", description: "Three plans, middle featured", create: pricing },

    { id: "cta-banner", name: "CTA Banner", category: "CTA", description: "Closing argument on colour", create: ctaBanner },
    { id: "cta-split", name: "CTA Panel", category: "CTA", description: "Copy left, buttons right", create: ctaSplit },
    { id: "cta-newsletter", name: "Newsletter", category: "CTA", description: "A working email capture form", create: ctaNewsletter },

    { id: "footer-columns", name: "Footer Columns", category: "Footer", description: "Responsive link footer", create: footer },
    { id: "footer-minimal", name: "Footer Minimal", category: "Footer", description: "Brand, links and legal on one rule", create: footerMinimal },
    { id: "footer-cta", name: "Footer CTA", category: "Footer", description: "Closing invitation above the links", create: footerCta },
];
