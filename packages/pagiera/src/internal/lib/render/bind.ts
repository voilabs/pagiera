import { readBinding } from "@/lib/data/source";
import type { CanvasElement } from "@/lib/editor/types";

/** One object of a data source, as seen inside Request or Repeat. */
export type Row = Record<string, unknown>;

/** Resolved data for every source on the page, keyed by source id. */
export type PageData = Record<string, Row[]>;

/**
 * Applies a row to an element. A bound Image or Video takes its `src` from the
 * field; anything else takes its text. Returns the element unchanged when
 * there is nothing to bind, so callers can use the result directly.
 */
export function bindElement(
    element: CanvasElement,
    row: Row | undefined,
): CanvasElement {
    if (!row || !element.binding) return element;

    const value = readBinding(row, element.binding);
    if (element.type === "Image" || element.type === "Video") {
        // An empty result would blank the element; keep the authored fallback.
        return value ? { ...element, src: value } : element;
    }
    return { ...element, content: value };
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
