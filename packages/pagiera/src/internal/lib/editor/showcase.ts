import { createElement } from "./tree";
import { DEFAULT_ROOT_STYLE, type CanvasElement, type DataSource, type ElementStyle, type ElementType, type RootStyle } from "./types";

function node(type: ElementType, name: string, style: Partial<ElementStyle>, content?: string, parentId?: string) {
    const element = createElement(type, { x: 0, y: 0, z: 0, parentId });
    element.name = name;
    element.base = { ...element.base, ...style };
    if (content !== undefined) element.content = content;
    return element;
}

function responsive(element: CanvasElement, tablet: Partial<ElementStyle>, mobile: Partial<ElementStyle>) {
    element.overrides = { tablet, mobile };
    return element;
}

function enter(element: CanvasElement, delay = 0, entrance: ElementStyle["entrance"] = "up") {
    element.base = { ...element.base, entrance, entranceDelay: delay, entranceDuration: 760, entranceCurve: "ease", entranceBezier: "0.16, 1, 0.3, 1" };
    return element;
}

export function createNocturneShowcase(): { elements: CanvasElement[]; rootStyle: RootStyle } {
    const ink = "#f1f0ea";
    const muted = "#96958f";
    const acid = "#d7ff3f";
    const surface = "#151514";
    const border = "rgba(241,240,234,.14)";
    const elements: CanvasElement[] = [];

    const section = (name: string, style: Partial<ElementStyle>) => {
        const item = node("Section", name, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", ...style });
        item.overrides = {
            tablet: { padT: Math.max(18, Math.round((style.padT ?? 24) * .82)), padR: Math.min(style.padR ?? 32, 32), padB: Math.max(18, Math.round((style.padB ?? 24) * .82)), padL: Math.min(style.padL ?? 32, 32) },
            mobile: { padT: Math.max(16, Math.round((style.padT ?? 24) * .68)), padR: 20, padB: Math.max(16, Math.round((style.padB ?? 24) * .68)), padL: 20 },
        };
        elements.push(item);
        return item;
    };
    const container = (name: string, parentId: string, style: Partial<ElementStyle>) => {
        const item = node("Container", name, { widthMode: "fill", heightMode: "auto", layout: "stack", borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0, ...style }, undefined, parentId);
        elements.push(item);
        return item;
    };

    const nav = section("Nocturne navigation", { bg: "#0b0b0a", padT: 22, padR: 40, padB: 22, padL: 40, borderW: 0 });
    const navInner = responsive(container("Navigation inner", nav.id, { direction: "row", justify: "between", align: "center", gap: 28, w: 1180, widthMode: "fixed" }), { widthMode: "fill" }, { widthMode: "fill" });
    elements.push(node("Heading", "Wordmark", { widthMode: "auto", heightMode: "auto", color: ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.7 }, "NOCTURNE®", navInner.id));
    const links = responsive(container("Navigation links", navInner.id, { widthMode: "auto", direction: "row", align: "center", gap: 28 }), {}, { hidden: true });
    for (const [label, slug] of [["Work", "work"], ["Studio", "studio"], ["Contact", "contact"]]) { const link = node("Button", `Nav ${label}`, { widthMode: "auto", heightMode: "auto", bg: "transparent", color: muted, fontSize: 13, fontWeight: "600", padT: 4, padR: 0, padB: 4, padL: 0, cursor: "pointer" }, label, links.id); link.interaction = { trigger: "click", action: "navigate", value: `/${slug}`, target: "_self" }; link.hover = { color: ink }; elements.push(link); }
    const navCta = node("Button", "Navigation CTA", { widthMode: "auto", heightMode: "auto", bg: acid, color: "#0b0b0a", radius: 999, padT: 11, padR: 18, padB: 11, padL: 18, fontSize: 12, fontWeight: "800", cursor: "pointer" }, "Start a project ↗", navInner.id);
    navCta.hover = { scale: 101.8, bg: "#edff9a", shadow: "0 10px 32px rgba(215,255,63,.18)" }; navCta.press = { scale: 97.5 }; navCta.overrides = { mobile: { hidden: true } }; elements.push(navCta);
    const menuButton = node("Button", "Mobile menu trigger", { widthMode: "auto", heightMode: "auto", bg: "transparent", color: ink, borderW: 1, borderC: border, radius: 999, padT: 9, padR: 14, padB: 9, padL: 14, fontSize: 11, fontWeight: "800", hidden: true, cursor: "pointer" }, "MENU +", navInner.id);
    menuButton.overrides = { mobile: { hidden: false } }; menuButton.press = { scale: 97 }; elements.push(menuButton);
    const mobileMenu = node("Container", "Mobile navigation menu", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 0, bg: "#151514", borderW: 1, borderC: border, radius: 14, padT: 8, padR: 8, padB: 8, padL: 8, hidden: true }, undefined, nav.id); elements.push(mobileMenu);
    menuButton.interaction = { trigger: "click", action: "toggle-layer", value: mobileMenu.id };
    for (const [label, slug] of [["Work", "work"], ["Studio", "studio"], ["Contact", "contact"]]) { const item = node("Button", `Mobile ${label}`, { widthMode: "fill", heightMode: "auto", bg: "transparent", color: ink, borderW: 0, radius: 9, padT: 14, padR: 14, padB: 14, padL: 14, fontSize: 14, fontWeight: "700", textAlign: "left", cursor: "pointer" }, `${label}  ↗`, mobileMenu.id); item.interaction = { trigger: "click", action: "navigate", value: `/${slug}`, target: "_self" }; item.hover = { bg: "rgba(255,255,255,.06)" }; elements.push(item); }

    const hero = section("Hero", { bg: "#0b0b0a", padT: 86, padR: 40, padB: 72, padL: 40, overflow: "hidden" });
    const heroInner = responsive(container("Hero composition", hero.id, { direction: "row", justify: "between", align: "end", gap: 64, w: 1180, widthMode: "fixed" }), { widthMode: "fill", direction: "column", align: "stretch", gap: 48 }, { widthMode: "fill", direction: "column", align: "stretch", gap: 40 });
    const heroCopy = container("Hero copy", heroInner.id, { widthMode: "fixed", w: 650, direction: "column", gap: 26 });
    heroCopy.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", gap: 22 } };
    elements.push(enter(node("Text", "Hero index", { widthMode: "auto", heightMode: "auto", color: acid, fontSize: 11, fontWeight: "700", letterSpacing: 2.2, textTransform: "uppercase" }, "Independent creative practice — Istanbul / Worldwide", heroCopy.id), 0, "fade"));
    const title = enter(node("Heading", "Hero title", { widthMode: "fill", heightMode: "auto", color: ink, fontSize: 96, fontWeight: "600", lineHeight: .9, letterSpacing: -6.5 }, "WE DESIGN\nTHE UNEXPECTED.", heroCopy.id), 90);
    title.overrides = { tablet: { fontSize: 68, letterSpacing: -4 }, mobile: { fontSize: 52, letterSpacing: -3, lineHeight: .94 } }; elements.push(title);
    const heroBottom = container("Hero statement", heroCopy.id, { direction: "row", justify: "between", align: "end", gap: 28, padT: 12, borderW: 0 });
    heroBottom.overrides = { mobile: { direction: "column", align: "start" } };
    const intro = enter(node("Text", "Hero intro", { widthMode: "fixed", w: 390, heightMode: "auto", color: muted, fontSize: 16, lineHeight: 1.65 }, "A strategy-led design studio shaping identities and digital experiences for ambitious people building what comes next.", heroBottom.id), 180);
    intro.overrides = { mobile: { widthMode: "fill" } }; elements.push(intro);
    const scroll = node("Text", "Scroll cue", { widthMode: "auto", heightMode: "auto", color: ink, fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" }, "Scroll to explore ↓", heroBottom.id); scroll.loop = { type: "float", duration: 2600 }; elements.push(scroll);

    const visual = enter(node("Frame", "Hero artwork", { widthMode: "fixed", w: 390, heightMode: "fixed", h: 540, layout: "absolute", bg: surface, gradient: "radial-gradient(circle at 68% 28%, #d7ff3f 0%, #7f9c16 11%, #27291d 28%, #151514 58%)", radius: 2, overflow: "hidden", borderW: 1, borderC: border, rotate: 2, shadow: "0 40px 100px rgba(0,0,0,.45)" }, undefined, heroInner.id), 160, "zoom");
    visual.overrides = { tablet: { widthMode: "fill", h: 460, rotate: 0 }, mobile: { widthMode: "fill", h: 390, rotate: 0 } }; elements.push(visual);
    const artLabel = node("Text", "Artwork label", { x: 24, y: 24, w: 190, h: 30, widthMode: "fixed", heightMode: "fixed", color: "#0b0b0a", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" }, "Form / Tension / 001", visual.id); artLabel.overrides = { mobile: { x: 18, y: 18 } }; elements.push(artLabel);
    const orb = node("Frame", "Kinetic orb", { x: 220, y: 350, w: 110, h: 110, widthMode: "fixed", heightMode: "fixed", bg: acid, radius: 999, blur: 1, shadow: "0 0 70px rgba(215,255,63,.42)" }, undefined, visual.id); orb.overrides = { tablet: { x: 500, y: 286 }, mobile: { x: 200, y: 245, w: 96, h: 96 } }; orb.loop = { type: "pulse", duration: 4200 }; elements.push(orb);
    const artworkNumber = node("Heading", "Artwork number", { x: 24, y: 436, w: 260, h: 82, widthMode: "fixed", heightMode: "fixed", color: ink, fontSize: 64, fontWeight: "500", letterSpacing: -4 }, "24—26", visual.id); artworkNumber.overrides = { tablet: { y: 350 }, mobile: { x: 18, y: 310, w: 220, h: 60, fontSize: 48, letterSpacing: -3 } }; elements.push(artworkNumber);

    const ticker = section("Ticker", { bg: acid, padT: 17, padR: 24, padB: 17, padL: 24 });
    elements.push(node("Text", "Ticker line", { widthMode: "fill", heightMode: "auto", color: "#0b0b0a", fontSize: 12, fontWeight: "800", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }, "Brand systems  ✦  Digital direction  ✦  Interactive experiences  ✦  Art direction  ✦  Strategy", ticker.id));

    const manifesto = section("Manifesto", { bg: "#f1f0ea", padT: 140, padR: 40, padB: 140, padL: 40 });
    const manifestoInner = responsive(container("Manifesto inner", manifesto.id, { direction: "column", gap: 64, w: 1180, widthMode: "fixed" }), { widthMode: "fill", gap: 48 }, { widthMode: "fill", gap: 40 });
    elements.push(node("Text", "Manifesto eyebrow", { widthMode: "auto", heightMode: "auto", color: "#5d5d58", fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }, "01 / Our point of view", manifestoInner.id));
    const statement = enter(node("Heading", "Manifesto statement", { widthMode: "fill", heightMode: "auto", color: "#11110f", fontSize: 70, fontWeight: "500", lineHeight: 1.03, letterSpacing: -4.4 }, "Safe ideas disappear.\nDistinct ones build culture.", manifestoInner.id), 40);
    statement.overrides = { tablet: { fontSize: 54 }, mobile: { fontSize: 40, letterSpacing: -2.4 } }; elements.push(statement);
    const manifestoBottom = responsive(container("Manifesto details", manifestoInner.id, { direction: "row", justify: "end", gap: 60 }), { direction: "column", gap: 28 }, { direction: "column", gap: 24 });
    const body = node("Text", "Manifesto body", { widthMode: "fixed", w: 500, heightMode: "auto", color: "#5d5d58", fontSize: 17, lineHeight: 1.75 }, "We partner with founders and cultural teams at inflection points—when the old language no longer fits and a sharper expression can unlock the next chapter.", manifestoBottom.id); body.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", fontSize: 16 } }; elements.push(body);
    const services = node("Text", "Manifesto services", { widthMode: "fixed", w: 220, heightMode: "auto", color: "#11110f", fontSize: 13, fontWeight: "700", lineHeight: 2 }, "POSITIONING\nIDENTITY SYSTEMS\nDIGITAL PRODUCTS\nCAMPAIGN WORLDS", manifestoBottom.id); services.overrides = { mobile: { widthMode: "fill" } }; elements.push(services);

    const work = section("Selected work", { bg: "#0b0b0a", padT: 128, padR: 40, padB: 128, padL: 40 });
    const workInner = responsive(container("Work inner", work.id, { direction: "column", gap: 42, w: 1180, widthMode: "fixed" }), { widthMode: "fill" }, { widthMode: "fill", gap: 34 });
    const workHead = container("Work heading", workInner.id, { direction: "row", justify: "between", align: "end", gap: 20 }); workHead.overrides = { mobile: { direction: "column", align: "start" } };
    elements.push(node("Heading", "Work title", { widthMode: "auto", heightMode: "auto", color: ink, fontSize: 48, fontWeight: "600", letterSpacing: -2.5 }, "SELECTED WORK", workHead.id));
    elements.push(node("Text", "Work count", { widthMode: "auto", heightMode: "auto", color: muted, fontSize: 12, letterSpacing: 1.2 }, "2024—2026 / 03 PROJECTS", workHead.id));
    const grid = responsive(node("Grid", "Projects grid", { widthMode: "fill", heightMode: "auto", layout: "stack", columns: 2, gap: 18 }, undefined, workInner.id), { columns: 2 }, { columns: 1 }); elements.push(grid);
    const projects = [
        ["AER / Mobility", "Identity + Digital", "linear-gradient(135deg,#29352a,#a9c6a2 55%,#e4ecdf)"],
        ["KERN / Objects", "Strategy + Commerce", "linear-gradient(145deg,#4b251c,#e06d45 48%,#f3c7a8)"],
        ["OTHER / Culture", "Campaign + Experience", "linear-gradient(145deg,#172d43,#3b83a8 48%,#b8ddea)"],
    ];
    projects.forEach(([titleText, meta, gradient], index) => {
        const card = enter(node("Container", `Project ${index + 1}`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 18, bg: "transparent", borderW: 0, padT: 0, padR: 0, padB: 18, padL: 0 }, undefined, grid.id), index * 90);
        if (index === 2) card.base = { ...card.base, columns: 2 }; card.hover = { shadow: "0 26px 70px rgba(0,0,0,.28)", opacity: 96 }; elements.push(card);
        const image = node("Frame", "Project image", { widthMode: "fill", heightMode: "fixed", h: index === 0 ? 520 : 360, bg: surface, gradient, overflow: "hidden", radius: 2 }, undefined, card.id); image.overrides = { mobile: { h: 320 } }; elements.push(image);
        const caption = container("Project caption", card.id, { direction: "row", justify: "between", gap: 20 }); caption.overrides = { mobile: { direction: "column", gap: 6 } };
        elements.push(node("Heading", "Project name", { widthMode: "auto", heightMode: "auto", color: ink, fontSize: 17, fontWeight: "700", letterSpacing: -.5 }, titleText, caption.id));
        elements.push(node("Text", "Project discipline", { widthMode: "auto", heightMode: "auto", color: muted, fontSize: 12 }, meta, caption.id));
    });

    const cta = section("Closing CTA", { bg: acid, padT: 120, padR: 40, padB: 120, padL: 40 });
    const ctaInner = responsive(container("CTA inner", cta.id, { direction: "column", align: "center", gap: 30, w: 980, widthMode: "fixed", textAlign: "center" }), { widthMode: "fill" }, { widthMode: "fill" });
    elements.push(node("Text", "CTA eyebrow", { widthMode: "fill", heightMode: "auto", color: "#30340d", fontSize: 11, fontWeight: "800", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }, "Have a meaningful problem?", ctaInner.id));
    const ctaTitle = node("Heading", "CTA title", { widthMode: "fill", heightMode: "auto", color: "#0b0b0a", fontSize: 76, fontWeight: "600", lineHeight: .98, letterSpacing: -4.5, textAlign: "center" }, "LET’S MAKE IT\nIMPOSSIBLE TO IGNORE.", ctaInner.id); ctaTitle.overrides = { tablet: { fontSize: 60, letterSpacing: -3.5 }, mobile: { fontSize: 42, letterSpacing: -2.5 } }; elements.push(ctaTitle);
    const button = node("Button", "CTA button", { widthMode: "auto", heightMode: "auto", bg: "#0b0b0a", color: ink, radius: 999, padT: 15, padR: 24, padB: 15, padL: 24, fontSize: 13, fontWeight: "800", cursor: "pointer" }, "Tell us what you’re building ↗", ctaInner.id); button.hover = { scale: 101.8, bg: "#282821", shadow: "0 16px 44px rgba(11,11,10,.2)" }; button.press = { scale: 97.5 }; elements.push(button);

    const footer = section("Footer", { bg: "#0b0b0a", padT: 42, padR: 40, padB: 42, padL: 40 });
    const footerInner = responsive(container("Footer inner", footer.id, { direction: "row", justify: "between", align: "end", gap: 32, w: 1180, widthMode: "fixed" }), { widthMode: "fill" }, { widthMode: "fill", direction: "column", align: "start" });
    elements.push(node("Heading", "Footer brand", { widthMode: "auto", heightMode: "auto", color: ink, fontSize: 28, fontWeight: "800", letterSpacing: -1.5 }, "NOCTURNE®", footerInner.id));
    const footerMeta = node("Text", "Footer meta", { widthMode: "auto", heightMode: "auto", color: muted, fontSize: 11, lineHeight: 1.8, textAlign: "right" }, "ISTANBUL / WORLDWIDE\n© 2026 — ALL RIGHTS RESERVED", footerInner.id); footerMeta.overrides = { mobile: { textAlign: "left" } }; elements.push(footerMeta);

    return {
        elements,
        rootStyle: {
            ...DEFAULT_ROOT_STYLE,
            documentMode: "page",
            fullWidth: true,
            maxWidth: 1200,
            canvasHeight: 5200,
            bg: "#0b0b0a",
            layout: "stack",
            direction: "column",
            gap: 0,
            align: "stretch",
            padT: 0, padR: 0, padB: 0, padL: 0,
            fontFamily: '"Manrope Showcase", sans-serif',
        customFonts: [{ id: "showcase-manrope", name: "Manrope Showcase", url: "/api/pagiera/assets/manrope-variable.woff2", weight: 400, style: "normal" }],
            variables: [
                { id: "nocturne-bg", name: "Nocturne / Background", type: "color", value: "#0b0b0a" },
                { id: "nocturne-ink", name: "Nocturne / Ink", type: "color", value: ink },
                { id: "nocturne-acid", name: "Nocturne / Acid", type: "color", value: acid },
                { id: "nocturne-muted", name: "Nocturne / Muted", type: "color", value: muted },
            ],
        },
    };
}

export type SiteTemplatePage = { name: string; slug: string; elements: CanvasElement[]; rootStyle: RootStyle; dataSources?: DataSource[] };

function nocturneInnerPage(name: string, slug: string, index: string, title: string, intro: string, columns: Array<[string, string]>) : SiteTemplatePage {
    const source = createNocturneShowcase();
    const roots = source.elements.filter((element) => element.name === "Nocturne navigation" || element.name === "Footer");
    const keep = new Set<string>();
    const visit = (id: string) => { keep.add(id); source.elements.filter((element) => element.parentId === id).forEach((element) => visit(element.id)); };
    roots.forEach((root) => visit(root.id));
    const nav = roots.find((root) => root.name === "Nocturne navigation");
    const footer = roots.find((root) => root.name === "Footer");
    const navTree = source.elements.filter((element) => keep.has(element.id) && (element.id === nav?.id || (() => { let cursor = element.parentId; while (cursor) { if (cursor === nav?.id) return true; cursor = source.elements.find((item) => item.id === cursor)?.parentId; } return false; })()));
    const footerTree = source.elements.filter((element) => keep.has(element.id) && (element.id === footer?.id || (() => { let cursor = element.parentId; while (cursor) { if (cursor === footer?.id) return true; cursor = source.elements.find((item) => item.id === cursor)?.parentId; } return false; })()));

    const elements: CanvasElement[] = [...navTree];
    const hero = responsive(node("Section", `${name} hero`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", gap: 54, bg: "#0b0b0a", padT: 120, padR: 40, padB: 130, padL: 40 }), { padT: 96, padR: 32, padB: 104, padL: 32 }, { gap: 38, padT: 72, padR: 20, padB: 78, padL: 20 }); elements.push(hero);
    const inner = responsive(node("Container", `${name} hero inner`, { widthMode: "fixed", w: 1180, heightMode: "auto", layout: "stack", direction: "column", gap: 34, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, hero.id), { widthMode: "fill" }, { widthMode: "fill", gap: 28 }); elements.push(inner);
    elements.push(enter(node("Text", `${name} index`, { widthMode: "auto", heightMode: "auto", color: "#d7ff3f", fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }, `${index} / ${name}`, inner.id), 0, "fade"));
    const heading = enter(node("Heading", `${name} title`, { widthMode: "fill", heightMode: "auto", color: "#f1f0ea", fontSize: 92, fontWeight: "600", lineHeight: .92, letterSpacing: -6 }, title, inner.id), 70); heading.overrides = { tablet: { fontSize: 66 }, mobile: { fontSize: 48, letterSpacing: -3 } }; elements.push(heading);
    const introNode = enter(node("Text", `${name} intro`, { widthMode: "fixed", w: 620, heightMode: "auto", color: "#96958f", fontSize: 18, lineHeight: 1.7 }, intro, inner.id), 150); introNode.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", fontSize: 16 } }; elements.push(introNode);

    const content = responsive(node("Section", `${name} content`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", bg: "#f1f0ea", padT: 110, padR: 40, padB: 120, padL: 40 }), { padT: 90, padR: 32, padB: 96, padL: 32 }, { padT: 72, padR: 20, padB: 78, padL: 20 }); elements.push(content);
    const grid = responsive(node("Grid", `${name} grid`, { widthMode: "fixed", w: 1180, heightMode: "auto", layout: "stack", columns: 2, gap: 1, bg: "#b9b8b0" }, undefined, content.id), { widthMode: "fill" }, { widthMode: "fill", columns: 1 }); elements.push(grid);
    columns.forEach(([label, copy], position) => {
        const card = enter(node("Container", `${name} ${label}`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 26, bg: "#f1f0ea", borderW: 0, padT: 44, padR: 44, padB: 50, padL: 44 }, undefined, grid.id), position * 80); card.overrides = { mobile: { gap: 20, padT: 30, padR: 26, padB: 34, padL: 26 } }; elements.push(card);
        elements.push(node("Text", `${label} number`, { widthMode: "auto", heightMode: "auto", color: "#74736d", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 }, `0${position + 1} — ${label.toUpperCase()}`, card.id));
        elements.push(node("Text", `${label} copy`, { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 21, lineHeight: 1.5, letterSpacing: -.5 }, copy, card.id));
    });
    elements.push(...footerTree);
    return { name, slug, elements, rootStyle: { ...source.rootStyle, canvasHeight: 3000 } };
}

function addNocturneContactForm(page: SiteTemplatePage) {
    const footerIndex = page.elements.findIndex((element) => !element.parentId && element.name === "Footer");
    const formElements: CanvasElement[] = [];
    const section = responsive(node("Section", "Project enquiry", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", bg: "#0b0b0a", padT: 110, padR: 40, padB: 120, padL: 40 }), { padT: 90, padR: 32, padB: 96, padL: 32 }, { padT: 72, padR: 20, padB: 78, padL: 20 }); formElements.push(section);
    const form = responsive(node("Form", "New project form", { widthMode: "fixed", w: 860, heightMode: "auto", layout: "stack", direction: "column", gap: 16, bg: "#151514", borderW: 1, borderC: "rgba(241,240,234,.14)", radius: 24, padT: 34, padR: 34, padB: 34, padL: 34 }, undefined, section.id), { widthMode: "fill" }, { widthMode: "fill", radius: 18, padT: 22, padR: 20, padB: 22, padL: 20 }); form.formAction = "/api/contact"; form.formMethod = "POST"; formElements.push(form);
    formElements.push(node("Text", "Form eyebrow", { widthMode: "fill", heightMode: "auto", color: "#d7ff3f", fontSize: 10, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" }, "Start a conversation", form.id));
    const title = node("Heading", "Form title", { widthMode: "fill", heightMode: "auto", color: "#f1f0ea", fontSize: 38, fontWeight: "600", lineHeight: 1.05, letterSpacing: -2 }, "WHAT ARE WE BUILDING?", form.id); title.overrides = { mobile: { fontSize: 30, letterSpacing: -1.4 } }; formElements.push(title);
    const fields = responsive(node("Container", "Contact fields", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", gap: 12, borderW: 0, padT: 8, padR: 0, padB: 0, padL: 0 }, undefined, form.id), {}, { direction: "column" }); formElements.push(fields);
    for (const [name, type, placeholder] of [["name", "text", "Your name"], ["email", "email", "Email address"]] as const) { const input = node("Input", `${name} field`, { widthMode: "fill", heightMode: "fixed", h: 52, bg: "#0b0b0a", color: "#f1f0ea", borderW: 1, borderC: "rgba(241,240,234,.16)", radius: 12, padT: 0, padR: 16, padB: 0, padL: 16, fontSize: 14 }, undefined, fields.id); input.fieldName = name; input.inputType = type; input.placeholder = placeholder; input.required = true; formElements.push(input); }
    const message = node("Textarea", "Project details", { widthMode: "fill", heightMode: "fixed", h: 150, bg: "#0b0b0a", color: "#f1f0ea", borderW: 1, borderC: "rgba(241,240,234,.16)", radius: 12, padT: 15, padR: 16, padB: 15, padL: 16, fontSize: 14, lineHeight: 1.55 }, undefined, form.id); message.fieldName = "message"; message.placeholder = "Tell us about the change you want to create…"; message.required = true; formElements.push(message);
    const submit = node("Button", "Send enquiry", { widthMode: "fill", heightMode: "auto", bg: "#d7ff3f", color: "#0b0b0a", borderW: 0, radius: 999, padT: 15, padR: 24, padB: 15, padL: 24, fontSize: 13, fontWeight: "800", textAlign: "center", cursor: "pointer" }, "Send project enquiry ↗", form.id); submit.buttonType = "submit"; submit.hover = { bg: "#edff9a", scale: 101 }; formElements.push(submit);
    page.elements.splice(footerIndex < 0 ? page.elements.length : footerIndex, 0, ...formElements);
    return page;
}

export function createNocturneSiteTemplate(): SiteTemplatePage[] {
    const home = createNocturneShowcase();
    const contact = addNocturneContactForm(nocturneInnerPage("Contact", "contact", "04", "LET’S START\nWITH THE TRUTH.", "Tell us what is changing, what feels stuck and why this moment matters. We will take it from there.", [["New business", "projects@nocturne.studio\nShare your ambition, timing and the people involved."], ["Elsewhere", "Instagram / LinkedIn / Are.na\nFollow current work, fragments and studio notes."], ["Istanbul", "Karaköy, Istanbul\nWorking locally and collaborating worldwide."], ["Availability", "Selected partnerships for Q4 2026.\nTypical engagements begin with a focused strategy sprint."]]));
    return [
        { name: "Home", slug: "home", ...home },
        nocturneInnerPage("Work", "work", "02", "SELECTED\nENGAGEMENTS.", "A focused archive of identities, products and campaign worlds created with teams in motion.", [["Aer", "A new identity and booking experience for an electric mobility company built around quiet confidence."], ["Kern", "A tactile commerce system for collectible objects, balancing material detail with digital clarity."], ["Other", "A cultural platform transformed into an evolving editorial identity and participatory campaign."], ["Field", "A data product made human through a precise interface, direct language and a flexible visual system."]]),
        nocturneInnerPage("Studio", "studio", "03", "SMALL TEAM.\nSERIOUS RANGE.", "Nocturne is an independent strategy and design practice for moments when a familiar answer is no longer enough.", [["Approach", "We begin with the tension underneath the brief, then build one clear idea that can carry an entire system."], ["Team", "A senior, hands-on core supported by a trusted network of specialists selected around each challenge."], ["Principles", "Clarity over decoration. Character over trends. Systems that stay useful after the launch moment."], ["Partners", "We work directly with founders, cultural leaders and internal teams who value an honest creative exchange."]]),
        contact,
    ];
}
