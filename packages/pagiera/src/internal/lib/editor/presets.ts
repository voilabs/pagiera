import { createElement } from "./tree";
import type { CanvasElement, ElementStyle, ElementType } from "./types";

export type ComponentPreset = {
    id: string;
    name: string;
    category: "Navigation" | "Hero" | "Footer";
    description: string;
    create: () => CanvasElement[];
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

function navbar() {
    const bar = node("Section", {
        widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row",
        justify: "between", align: "center", gap: 24, padT: 18, padR: 40,
        padB: 18, padL: 40, bg: "#0b1020", color: "#f8fafc",
    }, { name: "Navbar" });
    bar.overrides = { mobile: { direction: "column", align: "stretch", padR: 20, padL: 20 } };

    const logo = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 20, fontWeight: "700", color: "#ffffff", letterSpacing: -0.4 }, { name: "Brand", content: "NORTHSTAR" }, bar.id);
    const links = node("Container", { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", align: "center", gap: 6, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0 }, { name: "Navigation links" }, bar.id);
    links.overrides = { mobile: { widthMode: "fill", justify: "center", wrap: true } };
    const link = (label: string) => node("Button", { widthMode: "auto", heightMode: "auto", bg: "transparent", color: "#cbd5e1", padT: 8, padR: 12, padB: 8, padL: 12, fontSize: 14, fontWeight: "500" }, { content: label }, links.id);
    const cta = node("Button", { widthMode: "auto", heightMode: "auto", bg: "#8b7bff", color: "#ffffff", radius: 999, padT: 10, padR: 18, padB: 10, padL: 18, fontSize: 14, fontWeight: "600" }, { content: "Get started", name: "Navbar CTA" }, bar.id);
    return [bar, logo, links, link("Product"), link("Solutions"), link("Pricing"), cta];
}

function navbarLight() {
    const elements = navbar();
    const bar = elements[0];
    bar.name = "Navbar · Light";
    bar.base = { ...bar.base, bg: "#ffffff", color: "#111827", borderW: 0, shadow: "0 1px 0 rgba(15,23,42,.10)", padT: 16, padB: 16 };
    for (const element of elements) {
        if (element.name === "Brand") element.base = { ...element.base, color: "#111827" };
        if (element.parentId === elements[2].id) element.base = { ...element.base, color: "#475569" };
    }
    const cta = elements.find((element) => element.name === "Navbar CTA");
    if (cta) cta.base = { ...cta.base, bg: "#111827", color: "#ffffff", radius: 10 };
    return elements;
}

function navbarGlass() {
    const elements = navbar();
    const bar = elements[0];
    bar.name = "Navbar · Glass";
    bar.base = { ...bar.base, bg: "rgba(15,23,42,.78)", backdropBlur: 18, borderW: 1, borderC: "rgba(255,255,255,.12)", radius: 18, padT: 14, padR: 22, padB: 14, padL: 22, shadow: "0 18px 50px rgba(2,6,23,.28)" };
    const cta = elements.find((element) => element.name === "Navbar CTA");
    if (cta) cta.base = { ...cta.base, bg: "#ffffff", color: "#111827" };
    return elements;
}

function footer() {
    const root = node("Section", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 36, padT: 64, padR: 40, padB: 32, padL: 40, bg: "#09090f", color: "#f8fafc" }, { name: "Footer" });
    const top = node("Container", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "start", gap: 32, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0 }, { name: "Footer content" }, root.id);
    top.overrides = { mobile: { direction: "column" } };
    const brand = node("Container", { widthMode: "fixed", w: 340, heightMode: "auto", layout: "stack", direction: "column", gap: 12, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0 }, { name: "Footer brand" }, top.id);
    const title = node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 24, fontWeight: "700", color: "#ffffff" }, { content: "NORTHSTAR" }, brand.id);
    const copy = node("Text", { widthMode: "fill", heightMode: "auto", fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }, { content: "Thoughtful digital products for teams building what comes next." }, brand.id);
    const columns = node("Container", { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 64, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0 }, { name: "Footer links" }, top.id);
    columns.overrides = { mobile: { widthMode: "fill", wrap: true, gap: 32 } };
    const column = (heading: string, body: string) => {
        const group = node("Container", { widthMode: "fixed", w: 130, heightMode: "auto", layout: "stack", direction: "column", gap: 10, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0 }, {}, columns.id);
        return [group, node("Heading", { widthMode: "auto", heightMode: "auto", fontSize: 13, fontWeight: "600", color: "#ffffff" }, { content: heading }, group.id), node("Text", { widthMode: "auto", heightMode: "auto", fontSize: 13, color: "#94a3b8", lineHeight: 2 }, { content: body }, group.id)];
    };
    const legal = node("Text", { widthMode: "fill", heightMode: "auto", padT: 24, borderW: 0, color: "#64748b", fontSize: 12 }, { content: "© 2026 Northstar. All rights reserved." }, root.id);
    return [root, top, brand, title, copy, columns, ...column("Product", "Features\nIntegrations\nChangelog"), ...column("Company", "About\nJournal\nContact"), legal];
}

function hero() {
    const root = node("Section", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", justify: "center", align: "center", gap: 24, padT: 112, padR: 32, padB: 112, padL: 32, bg: "#0b1020", gradient: "radial-gradient(circle at 50% 0%, #312e81 0%, #0b1020 55%)", color: "#ffffff", textAlign: "center" }, { name: "Hero" });
    const eyebrow = node("Text", { widthMode: "auto", heightMode: "auto", color: "#a5b4fc", fontSize: 13, fontWeight: "600", letterSpacing: 1.8, textTransform: "uppercase", textAlign: "center" }, { content: "Built for ambitious teams" }, root.id);
    const heading = node("Heading", { widthMode: "fixed", w: 820, heightMode: "auto", color: "#ffffff", fontSize: 64, fontWeight: "700", lineHeight: 1.05, letterSpacing: -2, textAlign: "center" }, { content: "Turn your next big idea into something remarkable" }, root.id);
    heading.overrides = { tablet: { w: 640, fontSize: 48 }, mobile: { widthMode: "fill", fontSize: 38, letterSpacing: -1 } };
    const text = node("Text", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#cbd5e1", fontSize: 18, lineHeight: 1.7, textAlign: "center" }, { content: "A flexible platform for designing, launching, and improving digital experiences without slowing down." }, root.id);
    text.overrides = { mobile: { widthMode: "fill", fontSize: 16 } };
    const actions = node("Container", { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", justify: "center", align: "center", gap: 12, padT: 8, padR: 0, padB: 0, padL: 0, borderW: 0 }, {}, root.id);
    actions.overrides = { mobile: { widthMode: "fill", direction: "column", align: "stretch" } };
    const primary = node("Button", { widthMode: "auto", heightMode: "auto", bg: "#8b7bff", color: "#ffffff", radius: 999, padT: 14, padR: 24, padB: 14, padL: 24, fontWeight: "600" }, { content: "Start building" }, actions.id);
    const secondary = node("Button", { widthMode: "auto", heightMode: "auto", bg: "rgba(255,255,255,.08)", color: "#ffffff", radius: 999, borderW: 1, borderC: "rgba(255,255,255,.16)", padT: 14, padR: 24, padB: 14, padL: 24, fontWeight: "600" }, { content: "See how it works" }, actions.id);
    return [root, eyebrow, heading, text, actions, primary, secondary];
}

export const COMPONENT_PRESETS: ComponentPreset[] = [
    { id: "navbar-dark", name: "Navbar Dark", category: "Navigation", description: "Dark brand, links and pill CTA", create: navbar },
    { id: "navbar-light", name: "Navbar Light", category: "Navigation", description: "Clean product navigation", create: navbarLight },
    { id: "navbar-glass", name: "Navbar Glass", category: "Navigation", description: "Floating translucent navigation", create: navbarGlass },
    { id: "hero-centered", name: "Hero Centered", category: "Hero", description: "Gradient conversion hero", create: hero },
    { id: "footer-columns", name: "Footer Columns", category: "Footer", description: "Responsive link footer", create: footer },
];
