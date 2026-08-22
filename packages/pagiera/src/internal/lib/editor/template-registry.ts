import type { SiteTemplatePage } from "./showcase";

export const DEFAULT_TEMPLATE_REGISTRY_URL =
    "https://raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json";

export type TemplatePreview = {
    background: string;
    foreground: string;
    accent: string;
    eyebrow: string;
    headline: string;
};

export type TemplateRegistryEntry = {
    id: string;
    version: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    pages: string[];
    file?: string;
    featured?: boolean;
    preview: TemplatePreview;
};

export type TemplateRegistry = {
    schemaVersion: 1;
    updatedAt: string;
    templates: TemplateRegistryEntry[];
};

export type TemplateBundle = {
    schemaVersion: 1;
    id: string;
    version: string;
    pages: SiteTemplatePage[];
};

export type TemplateInstallInput = string | TemplateBundle;

export const FALLBACK_TEMPLATE_REGISTRY: TemplateRegistry = {
    schemaVersion: 1,
    updatedAt: "bundled",
    templates: [
        {
            id: "editorial-blog",
            version: "1.0.0",
            name: "Field Notes",
            description: "A dynamic editorial journal with API-powered article routes.",
            category: "Editorial",
            tags: ["Blog", "Dynamic", "Light"],
            pages: ["Home", "Journal", "Article / :slug", "About"],
            featured: true,
            preview: { background: "#f3efe6", foreground: "#171714", accent: "#db4b2d", eyebrow: "FIELD NOTES / 04", headline: "IDEAS FOR A MORE HUMAN WEB." },
        },
        {
            id: "orbit-saas",
            version: "1.0.0",
            name: "Orbit OS",
            description: "A high-contrast product launch site for modern software teams.",
            category: "SaaS",
            tags: ["Product", "Dark", "Launch"],
            pages: ["Home", "Product", "Pricing"],
            preview: { background: "#070914", foreground: "#f5f7ff", accent: "#7357ff", eyebrow: "ORBIT / SYSTEM 01", headline: "SHIP THE NEXT VERSION OF YOU." },
        },
        {
            id: "nocturne",
            version: "1.0.0",
            name: "Nocturne Studio",
            description: "An art-directed portfolio for independent creative studios.",
            category: "Portfolio",
            tags: ["Studio", "Dark", "Motion"],
            pages: ["Home", "Work", "Studio", "Contact"],
            preview: { background: "#0b0b0a", foreground: "#f1f0ea", accent: "#d7ff3f", eyebrow: "NOCTURNE / ISTANBUL", headline: "WE DESIGN THE UNEXPECTED." },
        },
    ],
};

const CACHE_TTL = 15 * 60 * 1000;
const memory = new Map<string, { storedAt: number; value: unknown }>();

function readCache<T>(key: string, allowStale = false): T | undefined {
    const current = memory.get(key);
    if (current && (allowStale || Date.now() - current.storedAt < CACHE_TTL)) return current.value as T;
    try {
        const raw = window.localStorage.getItem(`pagiera:${key}`);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as { storedAt: number; value: T };
        if (!allowStale && Date.now() - parsed.storedAt >= CACHE_TTL) return undefined;
        memory.set(key, parsed);
        return parsed.value;
    } catch {
        return undefined;
    }
}

function writeCache(key: string, value: unknown) {
    const cached = { storedAt: Date.now(), value };
    memory.set(key, cached);
    try {
        window.localStorage.setItem(`pagiera:${key}`, JSON.stringify(cached));
    } catch {
        // Storage may be disabled or full; memory caching still works.
    }
}

function isRegistry(value: unknown): value is TemplateRegistry {
    if (!value || typeof value !== "object") return false;
    const registry = value as Partial<TemplateRegistry>;
    return registry.schemaVersion === 1 && Array.isArray(registry.templates) && registry.templates.every((entry) =>
        Boolean(entry && typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.version === "string" && entry.preview),
    );
}

function isBundle(value: unknown, expectedId: string): value is TemplateBundle {
    if (!value || typeof value !== "object") return false;
    const bundle = value as Partial<TemplateBundle>;
    return bundle.schemaVersion === 1 && bundle.id === expectedId && typeof bundle.version === "string" && Array.isArray(bundle.pages) && bundle.pages.length > 0;
}

async function fetchJson(url: string) {
    const response = await fetch(url, { cache: "no-cache", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Template registry returned ${response.status}.`);
    return response.json() as Promise<unknown>;
}

export async function loadTemplateRegistry(url = DEFAULT_TEMPLATE_REGISTRY_URL, force = false) {
    const key = `template-registry:${url}`;
    if (!force) {
        const cached = readCache<TemplateRegistry>(key);
        if (cached && isRegistry(cached)) return { registry: cached, source: "cache" as const };
    }
    try {
        const value = await fetchJson(url);
        if (!isRegistry(value)) throw new Error("Template registry has an unsupported format.");
        writeCache(key, value);
        return { registry: value, source: "github" as const };
    } catch (error) {
        const stale = readCache<TemplateRegistry>(key, true);
        if (stale && isRegistry(stale)) return { registry: stale, source: "stale" as const, error };
        return { registry: FALLBACK_TEMPLATE_REGISTRY, source: "bundled" as const, error };
    }
}

export async function loadTemplateBundle(entry: TemplateRegistryEntry, registryUrl = DEFAULT_TEMPLATE_REGISTRY_URL) {
    if (!entry.file) return entry.id;
    const url = new URL(entry.file, registryUrl).href;
    const key = `template:${entry.id}:${entry.version}:${url}`;
    const cached = readCache<TemplateBundle>(key);
    if (cached && isBundle(cached, entry.id)) return cached;
    const value = await fetchJson(url);
    if (!isBundle(value, entry.id)) throw new Error(`${entry.name} has an unsupported template format.`);
    writeCache(key, value);
    return value;
}
