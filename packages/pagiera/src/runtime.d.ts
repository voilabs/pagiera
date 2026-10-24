import type { ComponentType, ElementType } from "react";

/**
 * Host components a page may be rendered with.
 *
 * Naming a component here lets the host keep its own behaviour: in Next.js,
 * `{ Link }` from `next/link` turns an authored link into a client-side
 * transition instead of a full page load. The component is given the same
 * props the plain tag would receive, so an anchor replacement drops in.
 *
 * Only in-app paths (`/blog/x`) reach the component; fragments, absolute URLs
 * and `target="_blank"` links stay plain anchors.
 */
export type PagieraComponents = {
    Link?: ElementType;
};

/**
 * One language's strings. Flat keys (`{ "nav.home": "Home" }`) and nested
 * objects (`{ nav: { home: "Home" } }`) both work.
 */
export type PagieraTranslations = { [key: string]: string | PagieraTranslations };

export const RenderedPage: ComponentType<{
    /**
     * The strings of the language being rendered. A layer that carries a
     * translation key shows this language's string for it; a key that is
     * missing here, and every layer without a key, keeps its authored value.
     */
    translations?: PagieraTranslations;
    elements: unknown[];
    rootStyle: unknown;
    /** Rows already fetched for each data source; see `loadPageData`. */
    data?: Record<string, Array<Record<string, unknown>>>;
    /** Template thumbnails render inside a scriptless sandbox. */
    includeScripts?: boolean;
    /** Host components to render with, such as the framework's own link. */
    components?: PagieraComponents;
    /**
     * The address this page was requested at, so an element can refer to it
     * with `{{params.slug}}`, `{{query.q}}` or `{{page.slug}}` — the same
     * tokens a data source URL already understands. Without it those tokens
     * stay on the page as written.
     */
    context?: {
        query?: Record<string, string>;
        params?: Record<string, string>;
        page?: { slug?: string };
    };
}>;
export function loadPageData(
    elements: unknown[],
    sources: unknown[],
    options?: Record<string, unknown>,
    /** Extra source ids to load, such as `rootStyle.seo.sourceId`. */
    alsoLoad?: Array<string | undefined>,
): Promise<Record<string, Array<Record<string, unknown>>>>;
/** Fills a page's SEO templates from its loaded data (`pagiera/data`). */
export function resolvePageSeo(
    page: { name?: string; rootStyle?: unknown },
    data?: Record<string, Array<Record<string, unknown>>>,
    context?: { query?: Record<string, string>; params?: Record<string, string>; page?: { slug?: string } },
): { title: string; description?: string; image?: string; canonical?: string; noindex: boolean };
