import { readBinding } from "@/lib/data/source";
import type { PageSeo } from "@/lib/editor/types";
import { bindPageContext, type PageContext, type PageData, type Row } from "./bind";

/** What a host puts in `<head>` for one request of a page. */
export type ResolvedSeo = {
    title: string;
    description?: string;
    image?: string;
    canonical?: string;
    noindex: boolean;
};

const MAX_TITLE = 160;
const MAX_DESCRIPTION = 320;

/**
 * Turns a field value into one line of plain text.
 *
 * Bound fields are often rich text — a post's excerpt arrives as HTML — and a
 * description full of tags or line breaks is what a search result shows.
 */
function plain(value: string, max: number) {
    const text = value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** `{{params.slug}}` and friends first, then the row's own fields. */
function fill(template: string | undefined, row: Row | undefined, context: PageContext | undefined) {
    if (!template) return "";
    const withPage = bindPageContext(template, context);
    if (!withPage.includes("{{")) return withPage;
    // Without its row a template reads "— Blog"; better the fallback.
    if (!row) return "";
    return withPage.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, path: string) => readBinding(row, path));
}

/** Only an absolute http(s) address or a site path is usable as a link. */
function address(value: string) {
    const trimmed = value.trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) return trimmed;
    if (/^\/[^\s"'<>]*$/.test(trimmed) && !trimmed.startsWith("//")) return trimmed;
    return undefined;
}

/**
 * Resolves a page's SEO for one request.
 *
 * A dynamic page such as `/blog/:slug` names the source that fetches the
 * post; its first row fills `{{title}}`, `{{excerpt}}` or `{{cover.url}}`, so
 * every post gets its own title and description from one template. A field
 * that resolves to nothing falls back to the page's name for the title and is
 * left out otherwise, rather than publishing an empty tag.
 */
export function resolvePageSeo(
    page: { name?: string; rootStyle?: { seo?: PageSeo } },
    data: PageData = {},
    context?: PageContext,
): ResolvedSeo {
    const seo = page.rootStyle?.seo ?? {};
    const row = seo.sourceId ? data[seo.sourceId]?.[0] : undefined;
    const title = plain(fill(seo.title, row, context), MAX_TITLE) || plain(page.name ?? "", MAX_TITLE);
    const description = plain(fill(seo.description, row, context), MAX_DESCRIPTION) || undefined;
    const image = address(fill(seo.image, row, context));
    const canonical = address(fill(seo.canonical, row, context));
    return {
        title,
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
        ...(canonical ? { canonical } : {}),
        noindex: seo.noindex === true,
    };
}
