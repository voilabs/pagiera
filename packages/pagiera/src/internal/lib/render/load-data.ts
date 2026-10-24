import { DataSourceError, type LoadOptions, loadSource } from "@/lib/data/source";
import type { CanvasElement, DataSource } from "@/lib/editor/types";
import type { PageData } from "./bind";

/** Signals that a source elected to turn its upstream 404 into a page 404. */
export class PageDataNotFoundError extends Error {
    constructor(public readonly sourceId: string) {
        super(`Data source ${sourceId} returned 404.`);
        this.name = "PageDataNotFoundError";
    }
}

/**
 * Fetches every source a page actually uses. Sources nothing references are
 * skipped, and a source that fails yields no rows rather than failing the
 * whole page — a broken API should not take the site down.
 */
export async function loadPageData(
    elements: CanvasElement[],
    sources: DataSource[],
    options?: LoadOptions,
    /** Sources used outside the elements, such as the one the page's SEO reads. */
    alsoLoad: Array<string | undefined> = [],
): Promise<PageData> {
    const used = new Set([
        ...elements
            .filter((el) => el.sourceId)
            .map((el) => el.sourceId as string),
        ...alsoLoad.filter((id): id is string => Boolean(id)),
    ]);
    const wanted = sources.filter((source) => used.has(source.id) && source.url);
    if (wanted.length === 0) return {};

    const results = await Promise.all(
        wanted.map(async (source) => {
            try {
                const { rows } = await loadSource(source, options);
                return [source.id, rows] as const;
            } catch (error) {
                if (
                    error instanceof DataSourceError &&
                    error.status === 404 &&
                    source.onNotFound === "page-404"
                ) {
                    throw new PageDataNotFoundError(source.id);
                }
                console.warn(
                    `Data source "${source.name}" failed:`,
                    error instanceof DataSourceError ? error.message : error,
                );
                return [source.id, []] as const;
            }
        }),
    );

    return Object.fromEntries(results);
}
