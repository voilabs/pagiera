import { createElement } from "./tree";
import { DEFAULT_ROOT_STYLE, type CanvasElement, type DataSource, type ElementStyle, type ElementType, type RootStyle } from "./types";
import { createNocturneSiteTemplate, type SiteTemplatePage } from "./showcase";
import type { PagieraIconName } from "../../../icon-names";

export type SiteTemplateId = "nocturne" | "editorial-blog" | "orbit-saas" | "pulse-social";
export type SiteTemplateBundle = { pages: SiteTemplatePage[]; components: CanvasElement[] };

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
    item.overrides = {
        tablet: { padR: 28, padL: 28 },
        mobile: { padT: Math.max(20, Math.round(padding * .7)), padR: 20, padB: Math.max(20, Math.round(padding * .7)), padL: 20 },
    };
    elements.push(item);
    return item;
}

function container(elements: CanvasElement[], name: string, parentId: string, style: Partial<ElementStyle> = {}) {
    const item = el("Container", name, { widthMode: "fixed", w: 1120, heightMode: "auto", layout: "stack", direction: "column", gap: 24, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0, ...style }, undefined, parentId);
    item.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill" } };
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
    const journalIntro = motion(el("Text", "Journal intro", { widthMode: "fixed", w: 570, heightMode: "auto", color: "#656158", fontSize: 17, lineHeight: 1.7 }, "Essays on design, technology and the quiet decisions that shape products people choose to keep.", heroIn.id), 140); journalIntro.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", fontSize: 15 } }; list.push(journalIntro);
    const feed = section(list, "Latest writing", "#171714", 90); const feedIn = container(list, "Feed inner", feed.id, { gap: 38 });
    list.push(el("Heading", "Feed title", { widthMode: "fill", heightMode: "auto", color: "#f3efe6", fontSize: 38, fontWeight: "600" }, "Latest writing", feedIn.id));
    const repeat = el("Repeat", "Posts request grid", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", columns: 2, wrap: true, gap: 18 }, undefined, feedIn.id); repeat.sourceId = posts.id; repeat.overrides = { mobile: { direction: "column", columns: 1, wrap: false } }; list.push(repeat);
    const card = motion(el("Container", "Post card", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 20, bg: "#24231f", borderW: 1, borderC: "#393832", radius: 18, padT: 30, padR: 30, padB: 34, padL: 30, cursor: "pointer" }, undefined, repeat.id)); card.overrides = { mobile: { gap: 16, padT: 22, padR: 22, padB: 24, padL: 22 } }; card.href = "/blog/{{id}}"; card.target = "_self"; card.hover = { scale: 101.5, shadow: "0 24px 70px rgba(0,0,0,.28)" }; list.push(card);
    const number = el("Text", "Post number", { widthMode: "auto", heightMode: "auto", color: "#db4b2d", fontSize: 11, fontWeight: "800" }, "01", card.id); number.binding = "id"; list.push(number);
    const postTitle = el("Heading", "Post title", { widthMode: "fill", heightMode: "auto", color: "#f3efe6", fontSize: 27, fontWeight: "600", lineHeight: 1.15, letterSpacing: -1 }, "Article title", card.id); postTitle.binding = "title"; list.push(postTitle);
    const excerpt = el("Text", "Post excerpt", { widthMode: "fill", heightMode: "auto", color: "#aaa69b", fontSize: 14, lineHeight: 1.65 }, "Article excerpt", card.id); excerpt.binding = "body"; list.push(excerpt);

    const detail: CanvasElement[] = []; editorialNav(detail);
    const article = section(detail, "Article", "#f3efe6", 100); const articleIn = container(detail, "Article inner", article.id, { w: 820, gap: 34 });
    detail.push(el("Text", "Dynamic route", { widthMode: "auto", heightMode: "auto", color: "#db4b2d", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" }, "Journal / Dynamic article", articleIn.id));
    const request = el("Request", "Current post request", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 34, align: "stretch" }, undefined, articleIn.id); request.sourceId = post.id; detail.push(request);
    const detailTitle = motion(el("Heading", "Dynamic title", { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 68, fontWeight: "500", lineHeight: 1, letterSpacing: -4, textTransform: "capitalize" }, "Article title", request.id)); detailTitle.overrides = { tablet: { fontSize: 54, letterSpacing: -3 }, mobile: { fontSize: 40, letterSpacing: -2 } }; detailTitle.binding = "title"; detail.push(detailTitle);
    const body = el("Text", "Article body", { widthMode: "fill", heightMode: "auto", color: "#4f4c45", fontSize: 20, lineHeight: 1.85 }, "Article body", request.id); body.overrides = { mobile: { fontSize: 17, lineHeight: 1.75 } }; body.binding = "body"; detail.push(body);

    const about: CanvasElement[] = []; editorialNav(about); const aboutHero = section(about, "About Field Notes", "#db4b2d", 120); const aboutIn = container(about, "About inner", aboutHero.id, { gap: 36 });
    const aboutTitle = motion(el("Heading", "About title", { widthMode: "fill", heightMode: "auto", color: "#171714", fontSize: 82, fontWeight: "500", lineHeight: .95, letterSpacing: -5 }, "WE WRITE TO\nNOTICE BETTER.", aboutIn.id)); aboutTitle.overrides = { tablet: { fontSize: 62, letterSpacing: -3.5 }, mobile: { fontSize: 44, letterSpacing: -2.4 } }; about.push(aboutTitle);
    const aboutCopy = el("Text", "About copy", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#2e261f", fontSize: 19, lineHeight: 1.75 }, "Field Notes is an independent publication exploring how thoughtful digital work gets made—and why restraint is often the boldest decision.", aboutIn.id); aboutCopy.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", fontSize: 16 } }; about.push(aboutCopy);
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
        elements.push(motion(el("Text", "Orbit eyebrow", { widthMode: "fill", heightMode: "auto", color: "#9e8cff", fontSize: 11, fontWeight: "800", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }, eyebrow, heroIn.id)));
        const heading = motion(el("Heading", "Orbit heading", { widthMode: "fill", heightMode: "auto", color: "#f5f7ff", fontSize: 80, fontWeight: "600", lineHeight: .95, letterSpacing: -5, textAlign: "center" }, titleText, heroIn.id), 70); heading.overrides = { tablet: { fontSize: 62 }, mobile: { fontSize: 44, letterSpacing: -2.5 } }; elements.push(heading);
        const heroCopy = motion(el("Text", "Orbit copy", { widthMode: "fixed", w: 620, heightMode: "auto", color: "#9298b3", fontSize: 17, lineHeight: 1.7, textAlign: "center" }, copy, heroIn.id), 140); heroCopy.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", fontSize: 15 } }; elements.push(heroCopy);
        const visual = motion(el("Frame", "Product interface", { widthMode: "fill", heightMode: "fixed", h: 520, bg: "#101426", gradient: "radial-gradient(circle at 50% 0%,rgba(115,87,255,.42),transparent 46%),linear-gradient(145deg,#11162b,#090b16)", borderW: 1, borderC: "#282e4d", radius: 24, shadow: "0 60px 140px rgba(0,0,0,.48)", overflow: "hidden" }, undefined, heroIn.id), 210); visual.overrides = { tablet: { h: 440 }, mobile: { h: 300, radius: 18 } }; elements.push(visual);
        const metrics = section(elements, "Product metrics", "#0d1020", 80); const grid = container(elements, "Metrics grid", metrics.id, { direction: "row", gap: 16 });
        grid.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill", direction: "column" } };
        [["32%", "faster launches"], ["4.8×", "team velocity"], ["99.99%", "platform uptime"]].forEach(([value, label], index) => { const card = motion(el("Container", `Metric ${index + 1}`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 9, bg: "#14182b", borderW: 1, borderC: "#272c47", radius: 18, padT: 28, padR: 28, padB: 28, padL: 28 }, undefined, grid.id), index * 80); card.overrides = { mobile: { padT: 22, padR: 22, padB: 22, padL: 22 } }; elements.push(card, el("Heading", "Metric value", { widthMode: "fill", heightMode: "auto", color: "#f5f7ff", fontSize: 36, fontWeight: "700" }, value, card.id), el("Text", "Metric label", { widthMode: "fill", heightMode: "auto", color: "#858ca7", fontSize: 13 }, label, card.id)); });
        return { name, slug, elements, rootStyle: root("#070914", "#f5f7ff", "#7357ff"), dataSources: [] };
    };
    return [
        build("Home", "home", "The adaptive product platform", "SHIP THE NEXT\nVERSION OF YOU.", "Orbit gives product teams one composable workspace for planning, building and learning—without the operational drag."),
        build("Product", "product", "One system, every workflow", "FROM SIGNAL\nTO SHIPPED.", "Connect research, decisions, design and delivery in a system that keeps context alive from first insight to final release."),
        build("Pricing", "pricing", "Simple by design", "PRICING THAT\nSCALES CALMLY.", "Start with the essentials, then expand across teams without surprise platform fees or a maze of artificial limits."),
    ];
}

const PULSE = {
    bg: "#070708", surface: "#111113", raised: "#18181b", border: "#29292e",
    ink: "#f5f5f6", muted: "#8b8b95", accent: "#8b5cf6", soft: "rgba(139,92,246,.14)",
};

function pulseIcon(elements: CanvasElement[], parentId: string, iconName: PagieraIconName, name: string, size = 20, color = PULSE.ink) {
    const icon = el("Icon", name, { widthMode: "fixed", heightMode: "fixed", w: size, h: size, color }, undefined, parentId);
    icon.iconName = iconName;
    elements.push(icon);
    return icon;
}

function pulseAvatar(elements: CanvasElement[], parentId: string, name: string, gradient: string, size = 42) {
    const avatar = el("Frame", `${name} avatar`, { widthMode: "fixed", heightMode: "fixed", w: size, h: size, layout: "stack", justify: "center", align: "center", bg: PULSE.raised, gradient, radius: 999, borderW: 1, borderC: "rgba(255,255,255,.16)" }, undefined, parentId);
    elements.push(avatar);
    pulseIcon(elements, avatar.id, "user", `${name} avatar icon`, Math.round(size * .48), "rgba(255,255,255,.9)");
    return avatar;
}

function pulseNavItem(elements: CanvasElement[], parentId: string, label: string, iconName: PagieraIconName, href: string, active: boolean) {
    const button = el("Button", `${label} navigation`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "center", gap: 13, bg: active ? PULSE.soft : "transparent", color: active ? PULSE.ink : PULSE.muted, borderW: 0, radius: 999, padT: 13, padR: 17, padB: 13, padL: 17, fontSize: 14, fontWeight: "700", cursor: "pointer" }, label, parentId);
    button.href = href; button.hover = { bg: "rgba(255,255,255,.06)", color: PULSE.ink }; button.press = { scale: 96 };
    button.overrides = { tablet: { widthMode: "fixed", w: 48, fontSize: 0, gap: 0, justify: "center", padT: 13, padR: 13, padB: 13, padL: 13 } };
    elements.push(button); pulseIcon(elements, button.id, iconName, `${label} icon`, 21, active ? PULSE.accent : "currentColor");
}

function pulseAction(elements: CanvasElement[], parentId: string, label: string, iconName: PagieraIconName) {
    const button = el("Button", `${label} action`, { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", align: "center", gap: 6, bg: "transparent", color: PULSE.muted, borderW: 0, radius: 999, padT: 7, padR: 9, padB: 7, padL: 9, fontSize: 10, fontWeight: "650", cursor: "pointer" }, label, parentId);
    button.hover = { bg: PULSE.soft, color: PULSE.accent }; button.press = { scale: 92 };
    elements.push(button); pulseIcon(elements, button.id, iconName, `${label} icon`, 16, "currentColor");
}

function pulsePost(elements: CanvasElement[], parentId: string, author: string, handle: string, copy: string, gradient: string, delay = 0) {
    const post = motion(el("Container", `${author} post`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 15, bg: "transparent", borderW: 1, borderC: PULSE.border, radius: 0, padT: 21, padR: 23, padB: 15, padL: 23 }, undefined, parentId), delay);
    post.overrides = { mobile: { padT: 18, padR: 16, padB: 14, padL: 16 } }; post.hover = { bg: "rgba(255,255,255,.02)" }; elements.push(post);
    const head = el("Container", `${author} header`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", align: "center", gap: 11, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, post.id); elements.push(head);
    pulseAvatar(elements, head.id, author, gradient);
    const who = el("Container", `${author} identity`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 2, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, head.id); elements.push(who);
    elements.push(el("Text", `${author} name`, { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 14, fontWeight: "750", lineHeight: 1.2 }, author, who.id), el("Text", `${author} handle`, { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 10 }, `${handle} · 2h`, who.id));
    pulseIcon(elements, head.id, "dots", "Post options", 18, PULSE.muted);
    elements.push(el("Text", `${author} post copy`, { widthMode: "fill", heightMode: "auto", color: "#dedee3", fontSize: 14, lineHeight: 1.65 }, copy, post.id));
    const media = el("Frame", `${author} post visual`, { widthMode: "fill", heightMode: "fixed", h: 286, bg: PULSE.raised, gradient, radius: 19, borderW: 1, borderC: "rgba(255,255,255,.1)", overflow: "hidden" }, undefined, post.id); media.overrides = { mobile: { h: 210, radius: 15 } }; elements.push(media);
    const mark = el("Heading", `${author} visual title`, { x: 21, y: 213, w: 380, h: 54, widthMode: "fixed", heightMode: "auto", color: "rgba(255,255,255,.92)", fontSize: 31, fontWeight: "700", letterSpacing: -2 }, "MAKE IT FEEL ALIVE.", media.id); mark.overrides = { mobile: { x: 16, y: 151, w: 270, fontSize: 23, letterSpacing: -1.3 } }; elements.push(mark);
    const actions = el("Container", `${author} engagement`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "center", gap: 2, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, post.id); elements.push(actions);
    pulseAction(elements, actions.id, "24", "message"); pulseAction(elements, actions.id, "318", "heart"); pulseAction(elements, actions.id, "Share", "share"); pulseAction(elements, actions.id, "Save", "bookmark");
}

type PulsePage = "Home" | "Explore" | "Notifications" | "Profile";

function pulseShell(elements: CanvasElement[], active: PulsePage) {
    const shell = el("Section", "Pulse social application", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", align: "center", bg: PULSE.bg, padT: 0, padR: 0, padB: 0, padL: 0 }); elements.push(shell);
    const mobile = el("Container", "Mobile social navigation", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "center", gap: 6, bg: "rgba(7,7,8,.9)", borderW: 1, borderC: PULSE.border, radius: 0, padT: 10, padR: 20, padB: 10, padL: 20, position: "sticky", stickyOffset: 0, backdropBlur: 18, hidden: true }, undefined, shell.id); mobile.overrides = { mobile: { hidden: false } }; elements.push(mobile);
    for (const [label, iconName, href] of [["Home", "home", "/"], ["Explore", "search", ""], ["Notifications", "bell", ""], ["Profile", "user", ""]] as Array<[PulsePage, PagieraIconName, string]>) { const button = el("Button", `Mobile ${label}`, { widthMode: "auto", heightMode: "auto", bg: active === label ? PULSE.soft : "transparent", color: active === label ? PULSE.accent : PULSE.muted, borderW: 0, radius: 999, padT: 10, padR: 12, padB: 10, padL: 12, fontSize: 0 }, "", mobile.id); button.href = href; elements.push(button); pulseIcon(elements, button.id, iconName, `${label} mobile icon`, 21, "currentColor"); }
    const columns = container(elements, "Pulse application columns", shell.id, { w: 1180, direction: "row", gap: 0, align: "stretch" }); columns.overrides = { tablet: { widthMode: "fill" }, mobile: { widthMode: "fill" } };
    const nav = el("Container", "Desktop social navigation", { widthMode: "fixed", w: 226, heightMode: "auto", layout: "stack", direction: "column", gap: 7, bg: PULSE.bg, borderW: 1, borderC: PULSE.border, radius: 0, padT: 25, padR: 17, padB: 25, padL: 17, position: "sticky", stickyOffset: 0 }, undefined, columns.id); nav.overrides = { tablet: { w: 74, padR: 13, padL: 13 }, mobile: { hidden: true } }; elements.push(nav);
    const brand = el("Container", "Pulse brand", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", gap: 10, align: "center", borderW: 0, padT: 4, padR: 12, padB: 18, padL: 12 }, undefined, nav.id); brand.overrides = { tablet: { justify: "center", padR: 0, padL: 0 } }; elements.push(brand); pulseIcon(elements, brand.id, "sparkles", "Pulse logo", 27, PULSE.accent); const word = el("Heading", "Pulse wordmark", { widthMode: "auto", heightMode: "auto", color: PULSE.ink, fontSize: 19, fontWeight: "800", letterSpacing: -1 }, "PULSE", brand.id); word.overrides = { tablet: { hidden: true } }; elements.push(word);
    pulseNavItem(elements, nav.id, "Home", "home", "/", active === "Home"); pulseNavItem(elements, nav.id, "Explore", "search", "", active === "Explore"); pulseNavItem(elements, nav.id, "Notifications", "bell", "", active === "Notifications"); pulseNavItem(elements, nav.id, "Profile", "user", "", active === "Profile");
    const create = el("Button", "Create post", { widthMode: "fill", heightMode: "auto", bg: PULSE.accent, color: "#fff", borderW: 0, radius: 999, padT: 13, padR: 18, padB: 13, padL: 18, fontSize: 13, fontWeight: "750" }, "New post", nav.id); create.hover = { bg: "#9f7aea", scale: 102 }; create.overrides = { tablet: { widthMode: "fixed", w: 48, fontSize: 0, padT: 14, padR: 14, padB: 14, padL: 14 } }; elements.push(create); pulseIcon(elements, create.id, "plus", "Create icon", 20, "#fff");
    const feed = el("Container", "Social feed", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 0, bg: PULSE.bg, borderW: 1, borderC: PULSE.border, radius: 0, padT: 0, padR: 0, padB: 70, padL: 0 }, undefined, columns.id); elements.push(feed);
    const aside = el("Container", "Discovery sidebar", { widthMode: "fixed", w: 306, heightMode: "auto", layout: "stack", direction: "column", gap: 16, bg: PULSE.bg, borderW: 0, padT: 20, padR: 0, padB: 30, padL: 18 }, undefined, columns.id); aside.overrides = { tablet: { hidden: true }, mobile: { hidden: true } }; elements.push(aside);
    const search = el("Form", "Search Pulse", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", gap: 10, align: "center", bg: PULSE.raised, borderW: 1, borderC: PULSE.border, radius: 999, padT: 5, padR: 13, padB: 5, padL: 13 }, undefined, aside.id); search.formAction = "/"; search.formMethod = "GET"; elements.push(search); pulseIcon(elements, search.id, "search", "Search icon", 17, PULSE.muted); const searchInput = el("Input", "Search input", { widthMode: "fill", heightMode: "fixed", h: 34, bg: "transparent", color: PULSE.ink, borderW: 0, radius: 0, padT: 0, padR: 0, padB: 0, padL: 0, fontSize: 11 }, undefined, search.id); searchInput.fieldName = "q"; searchInput.inputType = "search"; searchInput.placeholder = "Search Pulse"; elements.push(searchInput);
    const trends = el("Container", "Trending panel", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 17, bg: PULSE.surface, borderW: 1, borderC: PULSE.border, radius: 21, padT: 20, padR: 20, padB: 20, padL: 20 }, undefined, aside.id); elements.push(trends, el("Heading", "Trending heading", { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 18, fontWeight: "750", letterSpacing: -.7 }, "What’s happening", trends.id));
    [["Design", "Interfaces with a pulse"], ["Technology", "Small models, big ideas"], ["Culture", "Independent internet"]].forEach(([meta, title]) => { const trend = el("Container", `${title} trend`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 4, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, trends.id); elements.push(trend, el("Text", "Trend category", { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 9 }, `${meta} · Trending`, trend.id), el("Text", "Trend name", { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 12, fontWeight: "700" }, title, trend.id), el("Text", "Trend volume", { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 9 }, "8.4K posts", trend.id)); });
    return feed;
}

function pulseHeader(elements: CanvasElement[], feedId: string, title: string, subtitle: string) {
    const header = el("Container", `${title} header`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", align: "center", gap: 10, bg: "rgba(7,7,8,.84)", borderW: 1, borderC: PULSE.border, radius: 0, padT: 15, padR: 21, padB: 15, padL: 21, position: "sticky", stickyOffset: 0, backdropBlur: 18 }, undefined, feedId); elements.push(header); const copy = el("Container", `${title} title`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 2, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, header.id); elements.push(copy, el("Heading", `${title} h1`, { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 18, fontWeight: "780", letterSpacing: -.7 }, title, copy.id), el("Text", `${title} subtitle`, { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 9 }, subtitle, copy.id)); pulseIcon(elements, header.id, "sparkles", "Header sparkle", 18, PULSE.accent);
}

function createPulseSocialTemplate(): SiteTemplatePage[] {
    const make = (name: PulsePage, slug: string, build: (elements: CanvasElement[], feed: CanvasElement) => void) => { const elements: CanvasElement[] = []; const feed = pulseShell(elements, name); build(elements, feed); return { name, slug, elements, rootStyle: { ...root(PULSE.bg, PULSE.ink, PULSE.accent), canvasHeight: 1800, pageTransition: "smooth" as const, pageTransitionDuration: 320 }, dataSources: [] }; };
    const home = make("Home", "home", (elements, feed) => {
        pulseHeader(elements, feed.id, "Home", "Your creative network");
        const compose = el("Form", "Post composer", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", gap: 12, align: "start", bg: PULSE.bg, borderW: 1, borderC: PULSE.border, radius: 0, padT: 19, padR: 21, padB: 19, padL: 21 }, undefined, feed.id);
        compose.formAction = "/api/posts"; compose.formMethod = "POST"; compose.overrides = { mobile: { hidden: true } }; elements.push(compose);
        pulseAvatar(elements, compose.id, "You", "linear-gradient(145deg,#8b5cf6,#06b6d4)", 43);
        const body = el("Container", "Composer body", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 15, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, compose.id); elements.push(body);
        const composerInput = el("Textarea", "Post content", { widthMode: "fill", heightMode: "fixed", h: 68, bg: "transparent", color: PULSE.ink, borderW: 0, radius: 0, padT: 8, padR: 0, padB: 8, padL: 0, fontSize: 15, lineHeight: 1.5 }, undefined, body.id); composerInput.fieldName = "content"; composerInput.placeholder = "What’s moving through your mind?"; composerInput.required = true; elements.push(composerInput);
        const tools = el("Container", "Composer tools", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", justify: "between", gap: 14, align: "center", borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, body.id); elements.push(tools);
        const toolIcons = el("Container", "Composer media tools", { widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 14, align: "center", borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, tools.id); elements.push(toolIcons); pulseIcon(elements, toolIcons.id, "photo", "Add photo", 18, PULSE.accent); pulseIcon(elements, toolIcons.id, "gift", "Add gift", 18, PULSE.accent); pulseIcon(elements, toolIcons.id, "map-pin", "Add location", 18, PULSE.accent);
        const submit = el("Button", "Publish post", { widthMode: "auto", heightMode: "auto", bg: PULSE.accent, color: "#fff", borderW: 0, radius: 999, padT: 9, padR: 18, padB: 9, padL: 18, fontSize: 12, fontWeight: "750" }, "Post", tools.id); submit.buttonType = "submit"; submit.hover = { bg: "#9f7aea", scale: 102 }; elements.push(submit);
        pulsePost(elements, feed.id, "Maya Chen", "@mayamakes", "Motion should explain the interface, not decorate it. We rebuilt this concept around one clear rhythm and a lot more breathing room.", "radial-gradient(circle at 72% 28%,#f0abfc 0 5%,transparent 28%),radial-gradient(circle at 30% 72%,#22d3ee 0 7%,transparent 32%),linear-gradient(135deg,#312e81,#111827)", 30);
        pulsePost(elements, feed.id, "Arda Studio", "@ardastudio", "A tiny experiment in editorial interfaces, variable type and unapologetically vivid color.", "radial-gradient(circle at 50% 45%,#facc15 0 8%,transparent 9%),linear-gradient(120deg,#7c2d12,#db2777 52%,#312e81)", 90);
    });
    const explore = make("Explore", "explore", (elements, feed) => { pulseHeader(elements, feed.id, "Explore", "Find your next obsession"); const hero = motion(el("Container", "Explore hero", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 16, bg: PULSE.raised, gradient: "radial-gradient(circle at 85% 10%,rgba(139,92,246,.55),transparent 38%),linear-gradient(145deg,#18181b,#0f172a)", borderW: 1, borderC: PULSE.border, radius: 0, padT: 52, padR: 32, padB: 40, padL: 32 }, undefined, feed.id)); hero.overrides = { mobile: { padT: 40, padR: 19, padB: 32, padL: 19 } }; elements.push(hero, el("Text", "Explore eyebrow", { widthMode: "fill", heightMode: "auto", color: "#c4b5fd", fontSize: 10, fontWeight: "800", letterSpacing: 1.7, textTransform: "uppercase" }, "Curated for curious people", hero.id)); const title = el("Heading", "Explore title", { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 45, fontWeight: "700", lineHeight: 1, letterSpacing: -3 }, "DISCOVER THE\nNEXT WAVE.", hero.id); title.overrides = { mobile: { fontSize: 35, letterSpacing: -2 } }; elements.push(title); const grid = el("Grid", "Explore topics", { widthMode: "fill", heightMode: "auto", layout: "stack", columns: 2, gap: 1, bg: PULSE.border }, undefined, feed.id); grid.overrides = { mobile: { columns: 1 } }; elements.push(grid); [["Design", "Interfaces with a pulse", "sparkles"], ["Technology", "Small systems, big leverage", "bolt"], ["Culture", "Independent internet", "world"], ["Music", "Sounds for deep work", "music"]].forEach(([eyebrow, cardTitle, icon], index) => { const card = motion(el("Container", `${eyebrow} topic`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 13, bg: PULSE.surface, borderW: 0, radius: 0, padT: 27, padR: 25, padB: 29, padL: 25 }, undefined, grid.id), index * 55); card.hover = { bg: PULSE.raised }; elements.push(card); pulseIcon(elements, card.id, icon as PagieraIconName, `${eyebrow} icon`, 22, PULSE.accent); elements.push(el("Text", `${eyebrow} label`, { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 9, fontWeight: "750", textTransform: "uppercase", letterSpacing: 1.2 }, eyebrow, card.id), el("Heading", `${eyebrow} topic title`, { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 19, fontWeight: "700", lineHeight: 1.2, letterSpacing: -.8 }, cardTitle, card.id)); }); });
    const notifications = make("Notifications", "notifications", (elements, feed) => { pulseHeader(elements, feed.id, "Notifications", "Everything worth noticing"); [["heart", "Maya Chen and 48 others liked your post.", "12m", "#ec4899"], ["user", "Efe Kaya followed you.", "1h", PULSE.accent], ["message", "Nora Vale replied: “This is exactly it.”", "3h", "#22d3ee"], ["share", "Your post was shared 71 times today.", "6h", "#10b981"], ["sparkles", "Your weekly Pulse recap is ready.", "1d", "#facc15"]].forEach(([icon, copy, time, color], index) => { const row = motion(el("Container", `Notification ${index + 1}`, { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "row", gap: 15, align: "start", bg: index < 2 ? "rgba(139,92,246,.055)" : "transparent", borderW: 1, borderC: PULSE.border, radius: 0, padT: 21, padR: 23, padB: 21, padL: 23 }, undefined, feed.id), index * 45); row.overrides = { mobile: { padR: 16, padL: 16 } }; elements.push(row); pulseIcon(elements, row.id, icon as PagieraIconName, "Notification type", 21, color); const body = el("Container", "Notification content", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 5, borderW: 0, padT: 0, padR: 0, padB: 0, padL: 0 }, undefined, row.id); elements.push(body, el("Text", "Notification copy", { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 13, lineHeight: 1.55 }, copy, body.id), el("Text", "Notification time", { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 9 }, time, body.id)); }); });
    const profile = make("Profile", "profile", (elements, feed) => { pulseHeader(elements, feed.id, "Arin Voss", "1,248 posts"); const cover = el("Frame", "Profile cover", { widthMode: "fill", heightMode: "fixed", h: 205, bg: PULSE.raised, gradient: "radial-gradient(circle at 72% 25%,#a78bfa 0 7%,transparent 32%),radial-gradient(circle at 24% 80%,#22d3ee 0 5%,transparent 30%),linear-gradient(135deg,#172554,#3b0764)", radius: 0, borderW: 0 }, undefined, feed.id); cover.overrides = { mobile: { h: 158 } }; elements.push(cover); const identity = el("Container", "Profile identity", { widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", gap: 12, bg: PULSE.bg, borderW: 1, borderC: PULSE.border, radius: 0, padT: 18, padR: 23, padB: 23, padL: 23 }, undefined, feed.id); identity.overrides = { mobile: { padR: 16, padL: 16 } }; elements.push(identity); pulseAvatar(elements, identity.id, "Arin Voss", "linear-gradient(145deg,#8b5cf6,#22d3ee)", 82); elements.push(el("Heading", "Profile name", { widthMode: "fill", heightMode: "auto", color: PULSE.ink, fontSize: 23, fontWeight: "780", letterSpacing: -1 }, "Arin Voss", identity.id), el("Text", "Profile handle", { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 11 }, "@arinvoss", identity.id), el("Text", "Profile bio", { widthMode: "fill", heightMode: "auto", color: "#d4d4d8", fontSize: 13, lineHeight: 1.65 }, "Designer and builder making expressive tools for thoughtful people. Istanbul ↔ everywhere.", identity.id), el("Text", "Profile stats", { widthMode: "fill", heightMode: "auto", color: PULSE.muted, fontSize: 11 }, "824 following   ·   18.2K followers", identity.id)); pulsePost(elements, feed.id, "Arin Voss", "@arinvoss", "A page builder should feel like a creative instrument: fast enough to disappear, expressive enough to surprise you.", "radial-gradient(circle at 50% 45%,#a78bfa 0 8%,transparent 9%),linear-gradient(135deg,#111827,#4c1d95,#0e7490)", 40); });
    // Pulse is intentionally a single-page social product template. The
    // remaining views above are kept as internal design material, but are not
    // installed as routes.
    void explore; void notifications; void profile;
    return [home];
}

function promoteSharedRoots(pages: SiteTemplatePage[], names: string[]): SiteTemplateBundle {
    const components: CanvasElement[] = [];
    const nextPages = pages.map((page) => ({ ...page, elements: structuredClone(page.elements) }));

    for (const name of names) {
        const sourcePage = nextPages.find((page) => page.elements.some((element) => element.name === name));
        const sourceRoot = sourcePage?.elements.find((element) => element.name === name);
        if (!sourcePage || !sourceRoot) continue;
        const sourceIds = new Set<string>([sourceRoot.id]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const element of sourcePage.elements) {
                if (element.parentId && sourceIds.has(element.parentId) && !sourceIds.has(element.id)) {
                    sourceIds.add(element.id);
                    changed = true;
                }
            }
        }
        const sourceNodes = sourcePage.elements.filter((element) => sourceIds.has(element.id));
        const componentId = sourceRoot.id;
        components.push(...sourceNodes.map((element) => ({
            ...structuredClone(element),
            parentId: element.id === sourceRoot.id ? undefined : element.parentId,
            componentRole: element.id === sourceRoot.id ? "master" as const : undefined,
            componentId: element.id === sourceRoot.id ? componentId : undefined,
            componentSourceId: element.id,
            variant: element.id === sourceRoot.id ? "Default" : undefined,
        })));

        for (const page of nextPages) {
            const localRoot = page.elements.find((element) => element.name === name);
            if (!localRoot) continue;
            const localIds = new Set<string>([localRoot.id]);
            let localChanged = true;
            while (localChanged) {
                localChanged = false;
                for (const element of page.elements) {
                    if (element.parentId && localIds.has(element.parentId) && !localIds.has(element.id)) {
                        localIds.add(element.id);
                        localChanged = true;
                    }
                }
            }
            const idMap = new Map(sourceNodes.map((source) => [source.id, createElement(source.type, { x: 0, y: 0, z: 0 }).id]));
            const instance = sourceNodes.map((source) => ({
                ...structuredClone(source),
                id: idMap.get(source.id)!,
                parentId: source.id === sourceRoot.id ? localRoot.parentId : source.parentId ? idMap.get(source.parentId) : undefined,
                z: source.id === sourceRoot.id ? localRoot.z : source.z,
                componentRole: source.id === sourceRoot.id ? "instance" as const : undefined,
                componentId: source.id === sourceRoot.id ? componentId : undefined,
                componentSourceId: source.id,
                variant: source.id === sourceRoot.id ? "Default" : undefined,
                interaction: source.interaction && source.interaction.action !== "navigate"
                    ? { ...source.interaction, value: idMap.get(source.interaction.value) ?? source.interaction.value }
                    : source.interaction,
            }));
            // Replace the local subtree where its root originally lived. The
            // old append-based implementation moved shared navigation to the
            // end of stack pages, so a navbar became the last section of the
            // published site. Keeping the original slot preserves both flow
            // order and equal-z paint order for every shared asset.
            page.elements = page.elements.flatMap((element) => {
                if (element.id === localRoot.id) return instance;
                return localIds.has(element.id) ? [] : [element];
            });
        }
    }
    return { pages: nextPages, components };
}

export function createSiteTemplate(id: SiteTemplateId): SiteTemplatePage[] {
    if (id === "nocturne") return createNocturneSiteTemplate();
    if (id === "editorial-blog") return createEditorialBlogTemplate();
    if (id === "pulse-social") return createPulseSocialTemplate();
    return createOrbitTemplate();
}

export function createSiteTemplateBundle(id: SiteTemplateId): SiteTemplateBundle {
    const pages = createSiteTemplate(id);
    if (id === "editorial-blog") return promoteSharedRoots(pages, ["Editorial navigation"]);
    if (id === "orbit-saas") return promoteSharedRoots(pages, ["Orbit navigation"]);
    if (id === "nocturne") return promoteSharedRoots(pages, ["Nocturne navigation", "Footer"]);
    if (id === "pulse-social") return promoteSharedRoots(pages, ["Mobile social navigation", "Desktop social navigation", "Discovery sidebar"]);
    return { pages, components: [] };
}
