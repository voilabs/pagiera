import { readBinding } from "@/lib/data/source";
import type { CanvasElement } from "@/lib/editor/types";

/** One object of a data source, as seen inside Request or Repeat. */
export type Row = Record<string, unknown>;

/** Resolved data for every source on the page, keyed by source id. */
export type PageData = Record<string, Row[]>;

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
