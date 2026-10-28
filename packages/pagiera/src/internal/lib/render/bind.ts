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
 * Whether an address that came out of a template or a data field may be
 * written into the page: a site path, a fragment, http(s), or an inline
 * raster image for `src`. The editor only checks what the author typed;
 * `{{url}}` can resolve to anything a data source returns, including
 * `javascript:`, so the resolved value is checked again here.
 */
export function safeResolvedUrl(value: string | undefined, image = false) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    if (trimmed === "") return "";
    if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (image && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,/i.test(trimmed)) return trimmed;
    return undefined;
}

/** A `{{…}}` the row could not fill: never requested, never linked. */
const unresolved = (value: string | undefined) => value?.includes("{{") ?? false;

/**
 * Applies a row to an element. A bound Image or Video takes its `src` from the
 * field; anything else takes its text. `src`, `alt` and `href` may also hold
 * `{{…}}` templates — `{{cover.url}}`, `https://cdn.example/{{file}}` — read
 * from the same row. Returns the element unchanged when there is nothing to
 * bind, so callers can use the result directly.
 */
export function bindElement(
    element: CanvasElement,
    row: Row | undefined,
): CanvasElement {
    const media = element.type === "Image" || element.type === "Video";
    if (!row) {
        // Outside any data (the editor before a source loads, a template the
        // author is still wiring) a templated address has no value yet; an
        // <img> would request the literal "{{cover.url}}".
        const navigate = element.interaction?.action === "navigate";
        if (
            !unresolved(element.href) &&
            !(media && unresolved(element.src)) &&
            !(navigate && unresolved(element.interaction?.value))
        )
            return element;
        return {
            ...element,
            href: unresolved(element.href) ? undefined : element.href,
            src: media && unresolved(element.src) ? undefined : element.src,
            interaction: navigate && unresolved(element.interaction?.value) ? undefined : element.interaction,
        };
    }

    const templatedHref = bindTemplate(element.href, row);
    const href = templatedHref === element.href ? element.href : safeResolvedUrl(templatedHref);
    // "Open a link" with `{{html_url}}`: the filled address is checked like
    // an href; one that is unsafe or still unfilled drops the click action.
    const templatedValue = element.interaction
        ? bindTemplate(element.interaction.value, row) ?? element.interaction.value
        : undefined;
    const navigateTo =
        element.interaction?.action === "navigate" && templatedValue !== element.interaction.value
            ? safeResolvedUrl(templatedValue)
            : templatedValue;
    const interaction = element.interaction
        ? navigateTo === undefined || (element.interaction.action === "navigate" && unresolved(navigateTo))
            ? undefined
            : { ...element.interaction, value: navigateTo }
        : undefined;

    // Text written around a field — "Yazar: {{author.name}}" — reads the row
    // too. A bound element takes its whole text from the field instead.
    const content = element.binding ? element.content : bindTemplate(element.content, row);
    const templatedSrc = media ? bindTemplate(element.src, row) : element.src;
    const src = templatedSrc === element.src ? element.src : safeResolvedUrl(templatedSrc, true);
    const alt = media ? bindTemplate(element.alt, row) : element.alt;

    let bound = href !== element.href || interaction?.value !== element.interaction?.value || content !== element.content || src !== element.src || alt !== element.alt
        ? { ...element, href, interaction, content, src, alt }
        : element;
    if (unresolved(bound.href) || (media && unresolved(bound.src)))
        bound = {
            ...bound,
            href: unresolved(bound.href) ? undefined : bound.href,
            src: media && unresolved(bound.src) ? undefined : bound.src,
        };

    if (!element.binding) return bound;

    const value = formatValue(selectPath(row, element.binding), element.bindingFormat);
    if (media) {
        // An empty or unsafe result would blank the element; keep the
        // authored fallback.
        const resolved = safeResolvedUrl(value, true);
        return resolved ? { ...bound, src: resolved } : bound;
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
