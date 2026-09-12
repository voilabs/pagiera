import { getIconData, iconToSVG, iconToHTML } from "@iconify/utils";
import type { IconifyJSON } from "@iconify/types";

export const ICON_PACKS = [
    { id: "tabler", name: "Tabler", license: "MIT" },
    { id: "lucide", name: "Lucide", license: "ISC" },
    { id: "ri", name: "Remix", license: "Apache-2.0" },
] as const;
export type IconPack = typeof ICON_PACKS[number]["id"];
const loaders = {
    tabler: () => import("@iconify-json/tabler/icons.json"),
    lucide: () => import("@iconify-json/lucide/icons.json"),
    ri: () => import("@iconify-json/ri/icons.json"),
};
const cache = new Map<IconPack, Promise<IconifyJSON>>();
export function loadIconPack(pack: IconPack): Promise<IconifyJSON> {
    if (!cache.has(pack)) cache.set(pack, loaders[pack]().then(module => module.default as IconifyJSON).catch(error => {
        cache.delete(pack);
        throw error;
    }));
    return cache.get(pack)!;
}
export function iconNames(data: IconifyJSON) {
    return [...new Set([...Object.keys(data.icons), ...Object.keys(data.aliases ?? {})])].sort();
}
export function iconSvg(data: IconifyJSON, name: string): string {
    const icon = getIconData(data, name);
    if (!icon) return "";
    const svg = iconToSVG(icon, { width: "100%", height: "100%" });
    // A few bundled glyphs reuse paths. Flatten those local references so
    // the saved SVG remains compatible with the strict user-SVG sanitizer.
    const paths = new Map<string, string>();
    for (const match of svg.body.matchAll(/<path\b[^>]*\bid="([^"]+)"[^>]*\/>/g)) {
        paths.set(match[1], match[0].replace(/\s+id="[^"]+"/, ""));
    }
    const body = svg.body.replace(/<use href="#([^"]+)"\s*\/>/g, (original, id: string) => paths.get(id) ?? original);
    return iconToHTML(body, svg.attributes);
}
