import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSiteTemplateBundle, type SiteTemplateId } from "../../packages/pagiera/src/internal/lib/editor/site-templates";
import { templateThumbnailSvg } from "../../packages/pagiera/src/internal/lib/editor/template-thumbnail";

const templatesRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await readFile(resolve(templatesRoot, "registry.json"), "utf8")) as {
    templates: Array<{
        id: SiteTemplateId;
        version: string;
        name: string;
        category: string;
        thumbnail?: string;
        preview: { background: string; foreground: string; accent: string; eyebrow: string; headline: string };
    }>;
};

for (const template of registry.templates) {
    const bundle = createSiteTemplateBundle(template.id);
    const directory = resolve(templatesRoot, template.id);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "template.json"), `${JSON.stringify({
        schemaVersion: 1,
        id: template.id,
        version: template.version,
        pages: bundle.pages,
        components: bundle.components,
    }, null, 2)}\n`);
    if (template.thumbnail) await writeFile(resolve(templatesRoot, template.thumbnail), templateThumbnailSvg(template));
}

console.log(`Exported ${registry.templates.length} Pagiera templates and catalog thumbnails.`);
