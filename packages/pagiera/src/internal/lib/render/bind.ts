import { evaluate, isPlainPath } from "@/lib/data/expression";
import { formatValue, parsePipes } from "@/lib/data/format";
import { selectPath } from "@/lib/data/source";
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

/**
 * Fills `{{field}}` from the row, with optional pipes:
 * `{{published_at | date:"d MMMM yyyy" | default:"Taslak"}}`.
 *
 * Anything other than a plain field path is an expression in Pagiera's safe
 * template language (`lib/data/expression.ts`):
 * `{{status == "draft" ? "Taslak" : "Yayında"}}`,
 * `{{tags.map(t => t.name).join(", ")}}`.
 *
 * Page tokens (`{{params.slug}}`, `{{query.q}}`, `{{page.slug}}`) belong to
 * the address, not the row; they are left for `bindPageContext`, so the
 * editor keeps showing them as written instead of blanking them.
 */
export function bindTemplate(value: string | undefined, row: Row) {
    if (!value?.includes("{{")) return value;
    return value.replace(/{{\s*([^{}]+?)\s*}}/g, (match, expression: string) => {
        const { path, format } = parsePipes(expression);
        if (/^(?:params|query|page)\./.test(path)) return match;
        // A field path is read directly; when it finds nothing (`title.length`
        // is a property, not a field) it is tried as an expression.
        const direct = isPlainPath(path) ? selectPath(row, path) : undefined;
        const value = direct !== undefined ? direct : evaluate(path, { row });
        return formatValue(value, format);
    });
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

    // Text written around a field — "Yazar: {{author.name}}" — reads the row
    // too. A bound element takes its whole text from the field instead.
    const content = element.binding ? element.content : bindTemplate(element.content, row);

    let bound = href !== element.href || interaction?.value !== element.interaction?.value || content !== element.content
        ? { ...element, href, interaction, content }
        : element;

    if (!element.binding) return bound;

    const value = formatValue(selectPath(row, element.binding), element.bindingFormat);
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
