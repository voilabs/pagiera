/** Canonical URL segments supported by the full Pagiera Studio. */
export const PAGIERA_EDITOR_PANELS = [
    "layers",
    "elements",
    "components",
    "assets",
    "library",
    "icons",
    "templates",
    "variables",
    "ai",
    "data",
    "pages",
    "settings",
] as const;

export type PagieraEditorPanel = (typeof PAGIERA_EDITOR_PANELS)[number];

/** Normalises an untrusted route segment into a supported editor panel. */
export function editorPanel(value: string | null | undefined): PagieraEditorPanel | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    return PAGIERA_EDITOR_PANELS.find((panel) => panel === normalized);
}

/** Builds the canonical path used by SSR editor routes and client navigation. */
export function editorPath(pageId: string, panel: PagieraEditorPanel = "layers", basePath = "/editor") {
    const base = `/${basePath.replace(/^\/+|\/+$/g, "")}`;
    return `${base}/${encodeURIComponent(pageId)}/${panel}`;
}
