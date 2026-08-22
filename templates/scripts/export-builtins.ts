import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSiteTemplate, type SiteTemplateId } from "../../packages/pagiera/src/internal/lib/editor/site-templates";

const templatesRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await readFile(resolve(templatesRoot, "registry.json"), "utf8")) as {
    templates: Array<{ id: SiteTemplateId; version: string }>;
};

for (const template of registry.templates) {
    const directory = resolve(templatesRoot, template.id);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "template.json"), `${JSON.stringify({
        schemaVersion: 1,
        id: template.id,
        version: template.version,
        pages: createSiteTemplate(template.id),
    }, null, 2)}\n`);
}

console.log(`Exported ${registry.templates.length} Pagiera templates.`);
