import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const packageRoot = resolve(import.meta.dirname, "..");
const from = resolve(packageRoot, "src/internal/app/globals.css");
const source = await readFile(from, "utf8");

/*
 * The editor's stylesheet lives inside the editor and nowhere else.
 *
 * Tailwind writes its theme variables to `:root`, its reset to `*`, `html`
 * and `body`, and every utility as a bare class. Loaded into a host app as
 * is, that re-themed the host: its `--radius`, `--primary` and colour scale
 * were overwritten, its own `.rounded-lg` picked up the editor's radius, and
 * the reset restyled its headings and buttons. Every rule is therefore moved
 * under `.pg-scope`, the invisible box the editor renders inside:
 *
 * - root-level selectors (`:root`, `:host`, `html`, `body`) become
 *   `.pg-scope`, so the variables and base text settings only exist there;
 * - everything else is prefixed with `:where(.pg-scope)`, which adds no
 *   specificity, so the editor's own cascade is exactly what it was.
 *
 * Keyframes, `@property` and `@font-face` stay global: they only define
 * names, and change nothing until something inside the scope uses them.
 */
const SCOPE = ".pg-scope";
const ROOT = /^(:root|:host|html|body)(?=$|[:[.])/;

function scopeSelector(selector) {
    const trimmed = selector.trim();
    // The drag cursor is set on the document element on purpose.
    if (trimmed.includes("data-pg-dragging")) return trimmed;
    if (trimmed.startsWith(SCOPE)) return trimmed;
    if (ROOT.test(trimmed)) return trimmed.replace(ROOT, SCOPE);
    return `:where(${SCOPE}) ${trimmed}`;
}

const scope = {
    postcssPlugin: "pagiera-scope",
    Rule(rule) {
        if (rule.__scoped) return;
        rule.__scoped = true;
        let parent = rule.parent;
        while (parent) {
            if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return;
            parent = parent.parent;
        }
        rule.selectors = rule.selectors.map(scopeSelector);
    },
};

const result = await postcss([tailwindcss(), scope]).process(source, { from });
const fontImports = '@import "@fontsource-variable/figtree";\n@import "@fontsource-variable/figtree/wght-italic.css";\n\n';
const css = `${fontImports}${result.css}`;
await writeFile(resolve(packageRoot, "dist/full.css"), css);
