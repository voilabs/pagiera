import type { CSSProperties } from "react";
import { CUSTOM_TAGS, RESERVED_ATTRIBUTES } from "@/lib/editor/types";

/**
 * The markup escape hatch, as the renderers see it.
 *
 * Structural rather than `CustomMarkup` so the published-site renderer and
 * the package's public `PagieraPage` — which carries a looser element type —
 * share one implementation instead of two that can drift apart.
 */
export type CustomMarkup = {
    tag?: string;
    customClass?: string;
    customStyle?: string;
    attributes?: Array<{ name: string; value: string }>;
};

const CUSTOM_TAG_SET: ReadonlySet<string> = new Set(CUSTOM_TAGS);

/**
 * The tag the author chose, or nothing when they chose none.
 *
 * Checked again here rather than trusted from the document: the renderer is
 * also fed pages that were stored before a tag left the allowlist.
 */
export function customTagOf(element: CustomMarkup) {
    return element.tag && CUSTOM_TAG_SET.has(element.tag) ? element.tag : undefined;
}

/**
 * Turns an author's `color: red; margin-top: 4px` into the object React wants.
 *
 * Custom properties keep their exact spelling — `--brand` is not a camelCase
 * name — while everything else is converted, so `margin-top` and `marginTop`
 * both land on the same declaration.
 */
export function inlineStyleObject(css: string | undefined): CSSProperties | undefined {
    if (!css?.trim()) return undefined;

    const style: Record<string, string> = {};
    for (const declaration of css.split(";")) {
        const at = declaration.indexOf(":");
        if (at <= 0) continue;
        const property = declaration.slice(0, at).trim();
        const value = declaration.slice(at + 1).trim();
        if (!property || !value) continue;
        style[
            property.startsWith("--")
                ? property
                : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
        ] = value;
    }

    return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

/**
 * The author's raw attributes, ready to spread onto a node.
 *
 * `parseAttributes` already refused handlers and reserved names when the page
 * was saved; this repeats the refusal because the check is cheap and the cost
 * of it having been skipped once — an `onclick` reaching a visitor's page — is
 * not.
 */
export function customAttributes(element: CustomMarkup): Record<string, string> {
    const out: Record<string, string> = {};
    for (const { name, value } of element.attributes ?? []) {
        const key = name.trim().toLowerCase();
        if (!key || key.startsWith("on") || RESERVED_ATTRIBUTES.has(key)) continue;
        out[key] = value;
    }
    return out;
}

/**
 * Everything the author added by hand, merged with what the renderer built.
 *
 * The author's own class and style come last on purpose: the generated class
 * carries the inspector's values, and the escape hatch exists precisely to
 * overrule them.
 */
export function withCustom(
    element: CustomMarkup,
    props: Record<string, unknown> & { className: string },
) {
    const custom = customAttributes(element);
    const inline = inlineStyleObject(element.customStyle);
    return {
        ...props,
        ...custom,
        className: element.customClass ? `${props.className} ${element.customClass}` : props.className,
        style: inline
            ? { ...(props.style as CSSProperties | undefined), ...inline }
            : (props.style as CSSProperties | undefined),
    };
}
