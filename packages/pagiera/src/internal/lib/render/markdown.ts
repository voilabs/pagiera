import { marked } from "marked";

/**
 * Renders a Markdown element's text.
 *
 * Raw HTML is escaped before parsing. A page's Markdown usually arrives from a
 * data source — a CMS field, an API — and the published page carries inline
 * scripts of its own, so a `<script>` reaching the body would run with the
 * page's own privileges. Escaping `<` costs nothing that Markdown provides:
 * headings, lists, emphasis, links, images and tables all still work. What it
 * removes is the author's ability to hand-write HTML, which is the point.
 *
 * Parsing is synchronous because it happens inside a render pass; `marked`
 * only needs the async path for custom extensions, and none are registered.
 */
export function markdownToHtml(source: string): string {
    if (!source) return "";
    const escaped = source.replace(/</g, "&lt;");
    return marked.parse(escaped, { async: false, gfm: true, breaks: false });
}
