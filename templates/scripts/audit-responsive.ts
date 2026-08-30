import { createSiteTemplateBundle, type SiteTemplateId } from "../../packages/pagiera/src/internal/lib/editor/site-templates";
import { resolveStyle } from "../../packages/pagiera/src/internal/lib/editor/style";
import { DEFAULT_BREAKPOINTS, type CanvasElement, type ElementStyle, type RootStyle } from "../../packages/pagiera/src/internal/lib/editor/types";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BUILTIN_IDS: SiteTemplateId[] = ["editorial-blog", "orbit-saas", "nocturne", "pulse-social"];
const failures: string[] = [];

/**
 * Every template in the registry, however it was authored.
 *
 * The bundled designs are read from source so the audit runs against what will
 * be exported next; anything else is read from its own template.json. Auditing
 * only the built-ins left hand-written templates — the ones most likely to
 * strand content at a fixed width or forget a mobile override — unchecked.
 */
function auditTargets(): Array<{ id: string; pages: Array<{ elements: CanvasElement[]; rootStyle: RootStyle }> }> {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const registry = JSON.parse(readFileSync(resolve(root, "registry.json"), "utf8")) as {
        templates: Array<{ id: string; file: string }>;
    };

    return registry.templates.map((entry) => {
        if (BUILTIN_IDS.includes(entry.id as SiteTemplateId)) {
            return { id: entry.id, pages: createSiteTemplateBundle(entry.id as SiteTemplateId).pages };
        }
        const bundle = JSON.parse(readFileSync(resolve(root, entry.file), "utf8")) as {
            pages: Array<{ elements: CanvasElement[]; rootStyle: RootStyle }>;
        };
        return { id: entry.id, pages: bundle.pages };
    });
}

const targets = auditTargets();

type LayoutContext = {
    available: number;
    parent?: CanvasElement;
    parentStyle?: ElementStyle;
};

for (const target of targets) {
    const templateId = target.id;
    for (const page of target.pages) {
        const children = new Map<string | undefined, CanvasElement[]>();
        for (const element of page.elements) {
            const siblings = children.get(element.parentId) ?? [];
            siblings.push(element);
            children.set(element.parentId, siblings);
        }

        for (const breakpoint of DEFAULT_BREAKPOINTS) {
            const rootWidth = Math.max(0, breakpoint.width - page.rootStyle.padL - page.rootStyle.padR);

            const walk = (parentId: string | undefined, context: LayoutContext) => {
                const visible = (children.get(parentId) ?? []).filter((element) => !resolveStyle(element, breakpoint.id).hidden);
                if (visible.length === 0) return;

                const parentStyle = context.parentStyle;
                const gap = parentStyle?.gap ?? page.rootStyle.gap;
                const isAbsolute = parentStyle?.layout === "absolute";
                const isGrid = (context.parent?.type === "Grid" || context.parent?.type === "Repeat") && parentStyle?.layout === "stack";
                const isRow = !isGrid && (parentStyle?.direction ?? page.rootStyle.direction) === "row";
                const contentWidth = Math.max(0, context.available);
                const styles = new Map(visible.map((element) => [element.id, resolveStyle(element, breakpoint.id)]));

                // A row that wraps cannot overflow: what does not fit on one
                // line moves to the next. Measuring it against a single line
                // reported every deliberately wrapping row as broken.
                const wraps = parentStyle?.wrap === true;

                if (!isAbsolute && isRow && !wraps) {
                    const fixed = visible.reduce((sum, element) => {
                        const style = styles.get(element.id)!;
                        return sum + (style.widthMode === "fixed" ? style.w : 0);
                    }, 0);
                    const required = fixed + Math.max(0, visible.length - 1) * gap;
                    if (required > contentWidth + 1) failures.push(`${templateId}/${page.slug}/${breakpoint.id}: row '${context.parent?.name ?? "root"}' needs ${Math.round(required)}px but has ${Math.round(contentWidth)}px.`);
                }

                const gridColumns = isGrid ? Math.max(1, parentStyle?.columns ?? 1) : 1;
                const gridCell = isGrid ? Math.max(0, (contentWidth - Math.max(0, gridColumns - 1) * gap) / gridColumns) : contentWidth;
                const rowFillCount = isRow ? visible.filter((element) => styles.get(element.id)!.widthMode === "fill").length : 0;
                const rowFixed = isRow ? visible.reduce((sum, element) => sum + (styles.get(element.id)!.widthMode === "fixed" ? styles.get(element.id)!.w : 0), 0) : 0;
                const rowShare = rowFillCount > 0 ? Math.max(0, (contentWidth - rowFixed - Math.max(0, visible.length - 1) * gap) / rowFillCount) : contentWidth;

                for (const element of visible) {
                    const style = styles.get(element.id)!;
                    const slot = isGrid ? gridCell : isRow && style.widthMode === "fill" ? rowShare : contentWidth;
                    if (!isAbsolute && !isRow && !isGrid && style.widthMode === "fixed" && style.w > slot + 1) failures.push(`${templateId}/${page.slug}/${breakpoint.id}: '${element.name ?? element.type}' is ${Math.round(style.w)}px wide inside a ${Math.round(slot)}px column.`);

                    const ownWidth = style.widthMode === "fixed" ? style.w : slot;
                    if (ownWidth > breakpoint.width + 1) failures.push(`${templateId}/${page.slug}/${breakpoint.id}: '${element.name ?? element.type}' exceeds the ${breakpoint.width}px viewport.`);

                    if (isAbsolute && style.widthMode === "fixed" && style.constraintX === "start" && style.x + style.w > contentWidth + 1) failures.push(`${templateId}/${page.slug}/${breakpoint.id}: absolute '${element.name ?? element.type}' ends at ${Math.round(style.x + style.w)}px inside ${Math.round(contentWidth)}px.`);

                    const childWidth = Math.max(0, ownWidth - style.padL - style.padR);
                    walk(element.id, { available: childWidth, parent: element, parentStyle: style });
                }
            };

            walk(undefined, { available: rootWidth });
        }
    }
}

if (failures.length > 0) throw new Error(`Responsive template audit failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
console.log(`Audited ${targets.length} Pagiera templates across ${DEFAULT_BREAKPOINTS.length} breakpoints.`);
