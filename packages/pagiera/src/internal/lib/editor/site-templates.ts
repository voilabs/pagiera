import { createElement } from "./tree";
import { DEFAULT_ROOT_STYLE, type CanvasElement, type DataSource, type ElementStyle, type ElementType, type RootStyle } from "./types";
import { createNocturneSiteTemplate, type SiteTemplatePage } from "./showcase";

export type SiteTemplateId = "nocturne" | "editorial-blog" | "orbit-saas";

function el(type: ElementType, name: string, style: Partial<ElementStyle>, content?: string, parentId?: string) {
    const item = createElement(type, { x: 0, y: 0, z: 0, parentId });
    item.name = name;
    item.base = { ...item.base, ...style };
    if (content !== undefined) item.content = content;
    return item;
}

function root(bg: string, ink: string, accent: string): RootStyle {
    return {
        ...DEFAULT_ROOT_STYLE,
        fullWidth: true,
        canvasHeight: 3600,
        bg,
        layout: "stack",
        direction: "column",
        align: "stretch",
        gap: 0,
        padT: 0, padR: 0, padB: 0, padL: 0,
        fontFamily: '"Manrope Showcase", sans-serif',
        customFonts: [{ id: "template-manrope", name: "Manrope Showcase", url: "/api/pagiera/assets/manrope-variable.woff2", weight: 400, style: "normal" }],
        variables: [
            { id: "template-bg", name: "Template / Background", type: "color", value: bg },
            { id: "template-ink", name: "Template / Ink", type: "color", value: ink },
            { id: "template-accent", name: "Template / Accent", type: "color", value: accent },
        ],
    };
}

function section(elements: CanvasElement[], name: string, bg: string, padding = 64) {
    const item = el("Section", name, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", bg, padT: padding, padR: 32, padB: padding, padL: 32 });
    elements.push(item);
    return item;
}

function container(elements: CanvasElement[], name: string, parentId: string, style: Partial<ElementStyle> = {}) {
    const item = el("Container", name, { widthMode: "fixed", w: 1120, heightMode: "auto", layout: "stack", direction: "column", gap: 24, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0, ...style }, undefined, parentId);
    item.overrides = { tablet: { w: 820 }, mobile: { widthMode: "fill", direction: style.direction === "row" ? "column" : style.direction } };
    elements.push(item);
    return item;
}

function motion(item: CanvasElement, delay = 0) {
    item.base = { ...item.base, entrance: "up", entranceDuration: 720, entranceDelay: delay, entranceBezier: "0.16, 1, 0.3, 1" };
    return item;
}

function editorialNav(elements: CanvasElement[]) {
    const nav = section(elements, "Editorial navigation", "#f3efe6", 22);
    const inner = container(elements, "Navigation inner", nav.id, { direction: "row", justify: "between", align: "center" });
    elements.push(el("Heading", "Editorial wordmark", { widthMode: "auto", heightMode: "auto", color: "#171714", fontSize: 20, fontWeight: "800", letterSpacing: -1 }, "FIELD NOTES", inner.id));
    const links = el("Container", "Navigation links", { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 24, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, inner.id); links.overrides = { mobile: { hidden: true } }; elements.push(links);
    for (const [label, href] of [["Journal", "/blog"], ["About", "/about"]]) { const link = el("Button", `${label} link`, { widthMode: "auto", heightMode: "auto", bg: "transparent", color: "#58564f", padT: 4, padR: 0, padB: 4, padL: 0, fontSize: 13, cursor: "pointer" }, label, links.id); link.href = href; link.hover = { color: "#db4b2d" }; elements.push(link); }
}

function createEditorialBlogTemplate(): SiteTemplatePage[] {
    const posts: DataSource = { id: "editorial-posts", name: "Published posts", url: "https://dummyjson.com/posts", path: "posts", method: "GET", params: [{ key: "limit", value: "6" }] };
    const post: DataSource = { id: "editorial-post", name: "Current post", url: "https://dummyjson.com/posts/{{params.slug}}", path: "", method: "GET", onNotFound: "page-404" };
    const list: CanvasElement[] = []; editorialNav(list);
    const hero = section(list, "Journal hero", "#f3efe6", 90); const heroIn = container(list, "Journal hero inner", hero.id, { gap: 30 });
    list.push(motion(el("Text", "Issue label", { widthMode: "auto", heightMode: "auto", color: "#db4b2d", fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }, "Independent journal / Vol. 04", heroIn.id)));
    const title = motion(el("Heading", "Journal title", { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 96, fontWeight: "500", lineHeight: .9, letterSpacing: -7 }, "IDEAS FOR A\nMORE HUMAN WEB.", heroIn.id), 70); title.overrides = { tablet: { fontSize: 68 }, mobile: { fontSize: 48, letterSpacing: -3 } }; list.push(title);
    list.push(motion(el("Text", "Journal intro", { widthMode: "fixed", w: 570, heightMode: "auto", color: "#656158", fontSize: 17, lineHeight: 1.7 }, "Essays on design, technology and the quiet decisions that shape products people choose to keep.", heroIn.id), 140));
    const feed = section(list, "Latest writing", "#171714", 90); const feedIn = container(list, "Feed inner", feed.id, { gap: 38 });
    list.push(el("Heading", "Feed title", { widthMode: "fill", heightMode: "auto", color: "#f3efe6", fontSize: 38, fontWeight: "600" }, "Latest writing", feedIn.id));
    const repeat = el("Repeat", "Posts request grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 2, wrap: true, gap: 18 }, undefined, feedIn.id); repeat.sourceId = posts.id; repeat.overrides = { mobile: { columns: 1 } }; list.push(repeat);
    const card = motion(el("Container", "Post card", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 20, bg: "#24231f", borderW: 1, borderC: "#393832", radius: 18, padT: 30, padR: 30, padB: 34, padL: 30 }, undefined, repeat.id)); card.hover = { scale: 101.5, shadow: "0 24px 70px rgba(0,0,0,.28)" }; list.push(card);
    const number = el("Text", "Post number", { widthMode: "auto", heightMode: "auto", color: "#db4b2d", fontSize: 11, fontWeight: "800" }, "01", card.id); number.binding = "id"; list.push(number);
    const postTitle = el("Heading", "Post title", { widthMode: "fill", heightMode: "auto", color: "#f3efe6", fontSize: 27, fontWeight: "600", lineHeight: 1.15, letterSpacing: -1 }, "Article title", card.id); postTitle.binding = "title"; list.push(postTitle);
    const excerpt = el("Text", "Post excerpt", { widthMode: "fill", heightMode: "auto", color: "#aaa69b", fontSize: 14, lineHeight: 1.65 }, "Article excerpt", card.id); excerpt.binding = "body"; list.push(excerpt);

    const detail: CanvasElement[] = []; editorialNav(detail);
    const article = section(detail, "Article", "#f3efe6", 100); const articleIn = container(detail, "Article inner", article.id, { w: 820, gap: 34 });
    detail.push(el("Text", "Dynamic route", { widthMode: "auto", heightMode: "auto", color: "#db4b2d", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" }, "Journal / Dynamic article", articleIn.id));
    const request = el("Request", "Current post request", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 34, align: "stretch" }, undefined, articleIn.id); request.sourceId = post.id; detail.push(request);
    const detailTitle = motion(el("Heading", "Dynamic title", { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 68, fontWeight: "500", lineHeight: 1, letterSpacing: -4, textTransform: "capitalize" }, "Article title", request.id)); detailTitle.binding = "title"; detail.push(detailTitle);
    const body = el("Text", "Article body", { widthMode: "fill", heightMode: "auto", color: "#4f4c45", fontSize: 20, lineHeight: 1.85 }, "Article body", request.id); body.binding = "body"; detail.push(body);

    const about: CanvasElement[] = []; editorialNav(about); const aboutHero = section(about, "About Field Notes", "#db4b2d", 120); const aboutIn = container(about, "About inner", aboutHero.id, { gap: 36 });
    about.push(motion(el("Heading", "About title", { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 82, fontWeight: "500", lineHeight: .95, letterSpacing: -5 }, "WE WRITE TO\nNOTICE BETTER.", aboutIn.id)));
    about.push(el("Text", "About copy", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#2e261f", fontSize: 19, lineHeight: 1.75 }, "Field Notes is an independent publication exploring how thoughtful digital work gets made—and why restraint is often the boldest decision.", aboutIn.id));
    return [
        { name: "Home", slug: "home", elements: structuredClone(list), rootStyle: root("#f3efe6", "#171714", "#db4b2d"), dataSources: [structuredClone(posts)] },
        { name: "Journal", slug: "blog", elements: list, rootStyle: root("#f3efe6", "#171714", "#db4b2d"), dataSources: [posts] },
        { name: "Article", slug: "blog/:slug", elements: detail, rootStyle: root("#f3efe6", "#171714", "#db4b2d"), dataSources: [post] },
        { name: "About", slug: "about", elements: about, rootStyle: root("#db4b2d", "#171714", "#f3efe6"), dataSources: [] },
    ];
}

function createOrbitTemplate(): SiteTemplatePage[] {
    const build = (name: string, slug: string, eyebrow: string, titleText: string, copy: string): SiteTemplatePage => {
        const elements: CanvasElement[] = [];
        const nav = section(elements, "Orbit navigation", "#070914", 20); const navIn = container(elements, "Orbit navigation inner", nav.id, { direction: "row", justify: "between", align: "center" });
        elements.push(el("Heading", "Orbit logo", { widthMode: "auto", heightMode: "auto", color: "#f5f7ff", fontSize: 19, fontWeight: "800" }, "ORBIT/OS", navIn.id));
        const cta = el("Button", "Navigation action", { widthMode: "auto", heightMode: "auto", bg: "#7357ff", color: "#ffffff", radius: 999, padT: 11, padR: 18, padB: 11, padL: 18, fontSize: 12, fontWeight: "700" }, "Start building", navIn.id); cta.hover = { scale: 103, shadow: "0 14px 40px rgba(115,87,255,.35)" }; elements.push(cta);
        const hero = section(elements, `${name} hero`, "#070914", 110); const heroIn = container(elements, "Orbit hero inner", hero.id, { align: "center", gap: 28 });
        elements.push(motion(el("Text", "Orbit eyebrow", { widthMode: "auto", heightMode: "auto", color: "#9e8cff", fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }, eyebrow, heroIn.id)));
        const heading = motion(el("Heading", "Orbit heading", { widthMode: "fill", heightMode: "auto", color: "#f5f7ff", fontSize: 80, fontWeight: "600", lineHeight: .95, letterSpacing: -5, textAlign: "center" }, titleText, heroIn.id), 70); heading.overrides = { tablet: { fontSize: 62 }, mobile: { fontSize: 44, letterSpacing: -2.5 } }; elements.push(heading);
        elements.push(motion(el("Text", "Orbit copy", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#9298b3", fontSize: 17, lineHeight: 1.7, textAlign: "center" }, copy, heroIn.id), 140));
        const visual = motion(el("Frame", "Product interface", { widthMode: "fill", heightMode: "fixed", h: 520, bg: "#101426", gradient: "radial-gradient(circle at 50% 0%,rgba(115,87,255,.42),transparent 46%),linear-gradient(145deg,#11162b,#090b16)", borderW: 1, borderC: "#282e4d", radius: 24, shadow: "0 60px 140px rgba(0,0,0,.48)", overflow: "hidden" }, undefined, heroIn.id), 210); visual.overrides = { mobile: { h: 330 } }; elements.push(visual);
        const metrics = section(elements, "Product metrics", "#0d1020", 80); const grid = container(elements, "Metrics grid", metrics.id, { direction: "row", gap: 16 });
        [["32%", "faster launches"], ["4.8×", "team velocity"], ["99.99%", "platform uptime"]].forEach(([value, label], index) => { const card = motion(el("Container", `Metric ${index + 1}`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 9, bg: "#14182b", borderW: 1, borderC: "#272c47", radius: 18, padT: 28, padR: 28, padB: 28, padL: 28 }, undefined, grid.id), index * 80); elements.push(card, el("Heading", "Metric value", { widthMode: "fill", heightMode: "auto", color: "#f5f7ff", fontSize: 36, fontWeight: "700" }, value, card.id), el("Text", "Metric label", { widthMode: "fill", heightMode: "auto", color: "#858ca7", fontSize: 13 }, label, card.id)); });
        return { name, slug, elements, rootStyle: root("#070914", "#f5f7ff", "#7357ff"), dataSources: [] };
    };
    return [
        build("Home", "home", "The adaptive product platform", "SHIP THE NEXT\nVERSION OF YOU.", "Orbit gives product teams one composable workspace for planning, building and learning—without the operational drag."),
        build("Product", "product", "One system, every workflow", "FROM SIGNAL\nTO SHIPPED.", "Connect research, decisions, design and delivery in a system that keeps context alive from first insight to final release."),
        build("Pricing", "pricing", "Simple by design", "PRICING THAT\nSCALES CALMLY.", "Start with the essentials, then expand across teams without surprise platform fees or a maze of artificial limits."),
    ];
}

export function createSiteTemplate(id: SiteTemplateId): SiteTemplatePage[] {
    if (id === "nocturne") return createNocturneSiteTemplate();
    if (id === "editorial-blog") return createEditorialBlogTemplate();
    return createOrbitTemplate();
}
