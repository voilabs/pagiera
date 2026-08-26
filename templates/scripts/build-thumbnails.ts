/**
 * Writes the catalog thumbnail for any registry entry missing one.
 *
 * The package renders these from the entry's `preview` colours at request time,
 * but the registry validator requires the file to exist, and a published
 * registry served from a static host has no generator behind it.
 *
 * Run with: bun run templates/scripts/build-thumbnails.ts [registryDir]
 */
import { access, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { templateThumbnailSvg } from "../../packages/pagiera/src/internal/lib/editor/template-thumbnail";

async function main() {
    const root = process.argv[2]
        ? resolve(process.argv[2])
        : resolve(dirname(fileURLToPath(import.meta.url)), "..");

    const registry = JSON.parse(await readFile(resolve(root, "registry.json"), "utf8")) as {
        templates: Array<Parameters<typeof templateThumbnailSvg>[0] & { thumbnail?: string }>;
    };

    let written = 0;
    for (const entry of registry.templates) {
        if (!entry.thumbnail) continue;
        const target = resolve(root, entry.thumbnail);
        try {
            await access(target);
            continue;
        } catch {
            await writeFile(target, templateThumbnailSvg(entry));
            console.log(`  wrote ${entry.thumbnail}`);
            written += 1;
        }
    }
    console.log(written === 0 ? "All thumbnails present." : `Wrote ${written} thumbnails.`);
}

main();
