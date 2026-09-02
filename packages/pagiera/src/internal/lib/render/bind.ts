import { readBinding } from "@/lib/data/source";
import type { CanvasElement } from "@/lib/editor/types";

/** One object of a data source, as seen inside Request or Repeat. */
export type Row = Record<string, unknown>;

/** Resolved data for every source on the page, keyed by source id. */
export type PageData = Record<string, Row[]>;

/** The page's own address, as an element may refer to it. */
export type PageContext = {
    query?: Record<string, string>;
    params?: Record<string, string>;
    page?: { slug?: string };
};

const PAGE_TOKEN = /\{\{\s*(query|params|page)\.([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Resolves `{{params.slug}}`, `{{query.q}}` and `{{page.slug}}` in an element's
 * text.
 *
 * A data source URL has always understood these; an element could not, so a
 * form had no way to carry the address it was submitted from — a comment box on
 * `/blog/:slug` could not tell the server which post it belonged to.
 *
 * Only these three namespaces are touched. Anything else in braces is left
 * exactly as written, because `{{title}}` and `{{$.title}}` belong to the row
 * binding that runs afterwards and eating them here would blank every bound
 * value on the page.
 */
export function bindPageContext<T extends string | undefined>(
    value: T,
    context: PageContext | undefined,
): T {
    if (!value || !context || !value.includes("{{")) return value;
    return value.replace(PAGE_TOKEN, (_match, namespace: string, key: string) => {
        if (namespace === "query") return context.query?.[key] ?? "";
        if (namespace === "params") return context.params?.[key] ?? "";
        return key === "slug" ? (context.page?.slug ?? "") : "";
    }) as T;
}

function bindTemplate(value: string | undefined, row: Row) {
    if (!value?.includes("{{")) return value;
    return value.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, path: string) => readBinding(row, path));
}

/**
 * Applies a row to an element. A bound Image or Video takes its `src` from the
 * field; anything else takes its text. Returns the element unchanged when
 * there is nothing to bind, so callers can use the result directly.
 */
export function bindElement(
    element: CanvasElement,
    row: Row | undefined,
): CanvasElement {
    if (!row) return element;

    const href = bindTemplate(element.href, row);
    const interaction = element.interaction
        ? { ...element.interaction, value: bindTemplate(element.interaction.value, row) ?? element.interaction.value }
        : undefined;

    let bound = href !== element.href || interaction?.value !== element.interaction?.value
        ? { ...element, href, interaction }
        : element;

    if (!element.binding) return bound;

    const value = readBinding(row, element.binding);
    if (element.type === "Image" || element.type === "Video") {
        // An empty result would blank the element; keep the authored fallback.
        return value ? { ...bound, src: value } : bound;
    }
    return { ...bound, content: value };
}

/**
 * The rows a Repeat should render. An unconfigured or failed source yields a
 * single placeholder row so the template still shows up in the editor rather
 * than collapsing to nothing.
 */
export function rowsFor(
    element: CanvasElement,
    data: PageData,
    placeholderWhenEmpty: boolean,
): Array<Row | undefined> {
    const rows = element.sourceId ? data[element.sourceId] : undefined;
    if (rows && rows.length > 0) return rows;
    return placeholderWhenEmpty ? [undefined] : [];
}
