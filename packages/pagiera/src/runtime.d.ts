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

export const RenderedPage: ComponentType<{
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
): Promise<Record<string, Array<Record<string, unknown>>>>;
