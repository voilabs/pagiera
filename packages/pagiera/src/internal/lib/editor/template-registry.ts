export const DEFAULT_TEMPLATE_REGISTRY_URL =
    "/api/pagiera/templates/registry.json";

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
    /** Relative to the registry URL, or an absolute public image URL. */
    thumbnail?: string;
    featured?: boolean;
    font?: { title: string; family: string; url?: string };
    preview: TemplatePreview;
};

export type TemplateRegistry = {
    schemaVersion: 1;
    updatedAt: string;
    templates: TemplateRegistryEntry[];
};

export const FALLBACK_TEMPLATE_REGISTRY: TemplateRegistry = {
    schemaVersion: 1,
    updatedAt: "bundled",
    templates: [
        {
            id: "pulse-social",
            version: "1.1.1",
            name: "Pulse Social",
            description: "A polished one-page social feed with a responsive shell, native search and post composer forms.",
            category: "Social",
            tags: ["Social", "App", "Dark", "Responsive"],
            pages: ["Home"],
            thumbnail: "./pulse-social/thumbnail.svg",
            featured: true,
            font: { title: "Manrope", family: '"Manrope Showcase", sans-serif', url: "/api/pagiera/assets/manrope-variable.woff2" },
            preview: { background: "#070708", foreground: "#f5f5f6", accent: "#8b5cf6", eyebrow: "PULSE / SOCIAL SYSTEM", headline: "YOUR CREATIVE NETWORK, IN MOTION." },
        },
        {
            id: "editorial-blog",
            version: "1.3.1",
            name: "Field Notes",
            description: "A dynamic editorial journal with API-powered article routes.",
            category: "Editorial",
            tags: ["Blog", "Dynamic", "Light"],
            pages: ["Home", "Journal", "Article / :slug", "About"],
            thumbnail: "./editorial-blog/thumbnail.svg",
            featured: true,
            font: { title: "Manrope", family: '"Manrope Showcase", sans-serif', url: "/api/pagiera/assets/manrope-variable.woff2" },
            preview: { background: "#f3efe6", foreground: "#171714", accent: "#db4b2d", eyebrow: "FIELD NOTES / 04", headline: "IDEAS FOR A MORE HUMAN WEB." },
        },
        {
            id: "orbit-saas",
            version: "1.2.1",
            name: "Orbit OS",
            description: "A high-contrast product launch site for modern software teams.",
            category: "SaaS",
            tags: ["Product", "Dark", "Launch"],
            pages: ["Home", "Product", "Pricing"],
            thumbnail: "./orbit-saas/thumbnail.svg",
            font: { title: "Manrope", family: '"Manrope Showcase", sans-serif', url: "/api/pagiera/assets/manrope-variable.woff2" },
            preview: { background: "#070914", foreground: "#f5f7ff", accent: "#7357ff", eyebrow: "ORBIT / SYSTEM 01", headline: "SHIP THE NEXT VERSION OF YOU." },
        },
        {
            id: "nocturne",
            version: "1.2.1",
            name: "Nocturne Studio",
            description: "An art-directed portfolio for independent creative studios.",
            category: "Portfolio",
            tags: ["Studio", "Dark", "Motion"],
            pages: ["Home", "Work", "Studio", "Contact"],
            thumbnail: "./nocturne/thumbnail.svg",
            font: { title: "Manrope", family: '"Manrope Showcase", sans-serif', url: "/api/pagiera/assets/manrope-variable.woff2" },
            preview: { background: "#0b0b0a", foreground: "#f1f0ea", accent: "#d7ff3f", eyebrow: "NOCTURNE / ISTANBUL", headline: "WE DESIGN THE UNEXPECTED." },
        },
    ],
};

const CACHE_TTL = 15 * 60 * 1000;
const CACHE_REVISION = 4;
const memory = new Map<string, { storedAt: number; value: unknown }>();

function isSameOriginRegistry(url: string) {
    if (!globalThis.location) return false;
    try {
        return new URL(url, globalThis.location.href).origin === globalThis.location.origin;
    } catch {
        return false;
    }
}

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

async function fetchJson(url: string) {
    const response = await fetch(url, { cache: "no-cache", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Template registry returned ${response.status}.`);
    return {
        value: await response.json() as unknown,
        source: response.headers.get("x-pagiera-template-source"),
    };
}

export async function loadTemplateRegistry(url = DEFAULT_TEMPLATE_REGISTRY_URL, force = false) {
    const key = `template-registry:v${CACHE_REVISION}:${url}`;
    const cacheable = !isSameOriginRegistry(url);
    if (!force && cacheable) {
        const cached = readCache<TemplateRegistry>(key);
        if (cached && isRegistry(cached)) return { registry: cached, source: "cache" as const };
    }
    try {
        const response = await fetchJson(url);
        const value = response.value;
        if (!isRegistry(value)) throw new Error("Template registry has an unsupported format.");
        if (cacheable) writeCache(key, value);
        return { registry: value, source: response.source === "local" ? "local" as const : "network" as const };
    } catch (error) {
        const stale = cacheable ? readCache<TemplateRegistry>(key, true) : undefined;
        if (stale && isRegistry(stale)) return { registry: stale, source: "stale" as const, error };
        return { registry: FALLBACK_TEMPLATE_REGISTRY, source: "bundled" as const, error };
    }
}
