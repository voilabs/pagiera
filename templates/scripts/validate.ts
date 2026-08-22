import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await readFile(resolve(root, "registry.json"), "utf8")) as {
    schemaVersion: number;
    templates: Array<{ id: string; version: string; file: string }>;
};

if (registry.schemaVersion !== 1 || !Array.isArray(registry.templates)) throw new Error("Invalid template registry.");
const ids = new Set<string>();
for (const entry of registry.templates) {
    if (!entry.id || !entry.version || !entry.file || ids.has(entry.id)) throw new Error(`Invalid or duplicate registry entry '${entry.id}'.`);
    ids.add(entry.id);
    const bundle = JSON.parse(await readFile(resolve(root, entry.file), "utf8")) as { schemaVersion: number; id: string; version: string; pages: Array<{ slug: string }> };
    if (bundle.schemaVersion !== 1 || bundle.id !== entry.id || bundle.version !== entry.version) throw new Error(`Registry and bundle metadata differ for '${entry.id}'.`);
    if (!Array.isArray(bundle.pages) || !bundle.pages.some((page) => page.slug === "home")) throw new Error(`Template '${entry.id}' must include home.`);
    const slugs = bundle.pages.map((page) => page.slug);
    if (new Set(slugs).size !== slugs.length) throw new Error(`Template '${entry.id}' contains duplicate page slugs.`);
}

console.log(`Validated ${ids.size} Pagiera templates.`);
