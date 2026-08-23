import { Pool } from "pg";
import { createClient, type RedisClientType } from "redis";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import manropeDataUrl from "./manrope-data.js";

export type PagieraServerConfig = {
    postgresUrl: string;
    redisUrl: string;
    openRouterApiKey: string;
    openRouterModel: string;
    basePath?: string;
    aiRateLimitPerMinute?: number;
    templateRegistryUrl?: string;
};

const DEFAULT_TEMPLATE_REGISTRY_URL = "https://raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json";
const LOCAL_TEMPLATE_REGISTRY = "pagiera:local-templates";
const TEMPLATE_CACHE_SECONDS = 15 * 60;
const TEMPLATE_CACHE_REVISION = 4;
const BUILTIN_TEMPLATE_IDS = ["nocturne", "editorial-blog", "orbit-saas", "pulse-social"] as const;
type BuiltinTemplateId = (typeof BUILTIN_TEMPLATE_IDS)[number];

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
  font_family text, custom_fonts jsonb, page_transition text, page_transition_duration integer, components jsonb NOT NULL DEFAULT '[]', published_components jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS font_family text;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_fonts jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS page_transition text;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS page_transition_duration integer;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS components jsonb NOT NULL DEFAULT '[]';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS published_components jsonb NOT NULL DEFAULT '[]';
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name text NOT NULL, slug text NOT NULL, elements jsonb NOT NULL DEFAULT '[]', root_style jsonb NOT NULL DEFAULT '{}',
  data_sources jsonb NOT NULL DEFAULT '[]', version integer NOT NULL DEFAULT 1,
  published_elements jsonb, published_root_style jsonb, published_data_sources jsonb, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(site_id, slug)
);
CREATE INDEX IF NOT EXISTS pages_site_id_idx ON pages(site_id);
CREATE TABLE IF NOT EXISTS page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version integer NOT NULL, elements jsonb NOT NULL, root_style jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_revisions_page_id_created_at_idx ON page_revisions(page_id, created_at);
`;

function required(name: string, value: string) {
    if (!value?.trim()) throw new Error(`Pagiera config is missing ${name}.`);
}

export async function createPagieraServer(config: PagieraServerConfig) {
    required("postgresUrl", config.postgresUrl);
    required("redisUrl", config.redisUrl);
    required("openRouterApiKey", config.openRouterApiKey);
    required("openRouterModel", config.openRouterModel);

    process.env.DATABASE_URL = config.postgresUrl;
    process.env.OPENROUTER_API_KEY = config.openRouterApiKey;
    process.env.OPENROUTER_MODEL = config.openRouterModel;

    const pool = new Pool({ connectionString: config.postgresUrl, max: 10, idleTimeoutMillis: 30_000 });
    await pool.query(SCHEMA_SQL);
    const redis = createClient({ url: config.redisUrl }) as RedisClientType;
    redis.on("error", (error) => console.error("Pagiera Redis error", error));
    await redis.connect();

    const pages = await import("@/lib/pages");
    const validation = await import("@/lib/editor/validate");
    const sourceRuntime = await import("@/lib/data/source");
    const templates = await import("@/lib/editor/site-templates");
    const templateCatalog = await import("@/lib/editor/template-registry");
    const templateThumbnails = await import("@/lib/editor/template-thumbnail");
    const ai = await import("@/app/api/ai-design/route");
    const renderData = await import("@/lib/render/load-data");
    const basePath = (config.basePath ?? "/api/pagiera").replace(/\/$/, "");

    const invalidate = async () => {
        const keys = await redis.keys("pagiera:published:*");
        if (keys.length) await redis.del(keys);
    };
    const bodyOf = async (request: Request) => request.json().catch(() => ({})) as Promise<Record<string, any>>;
    const ok = (value: unknown, status = 200) => Response.json(value, { status });
    const fail = (error: unknown, status = 400) => ok({ error: error instanceof Error ? error.message : String(error) }, status);

    const cachedTemplateJson = async (cacheKey: string, url: string) => {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol === "file:") {
            // Local development intentionally bypasses Redis: saving a
            // template file must be visible on the very next refresh/install.
            const text = await readFile(fileURLToPath(parsedUrl), "utf8");
            if (text.length > 15_000_000) throw new Error("Template bundle is too large.");
            return JSON.parse(text) as unknown;
        }
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached) as unknown;
        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Template source returned ${response.status}.`);
        const text = await response.text();
        if (text.length > 15_000_000) throw new Error("Template bundle is too large.");
        const value = JSON.parse(text) as unknown;
        await redis.set(cacheKey, text, { EX: TEMPLATE_CACHE_SECONDS });
        return value;
    };

    type RegistryEntry = {
        id?: unknown;
        version?: unknown;
        file?: unknown;
        thumbnail?: unknown;
        name?: unknown;
        category?: unknown;
        preview?: unknown;
    };

    const findLocalTemplateRegistry = async () => {
        let directory = process.cwd();
        for (let depth = 0; depth < 8; depth += 1) {
            const candidate = resolve(directory, "templates", "registry.json");
            try {
                await readFile(candidate, "utf8");
                return candidate;
            } catch {
                const parent = dirname(directory);
                if (parent === directory) break;
                directory = parent;
            }
        }
        return undefined;
    };

    const templateRegistryFor = async (requestUrl: string) => {
        const configuredSource = config.templateRegistryUrl ?? DEFAULT_TEMPLATE_REGISTRY_URL;
        const localPath = configuredSource === LOCAL_TEMPLATE_REGISTRY
            ? await findLocalTemplateRegistry()
            : undefined;
        const registryUrl = localPath
            ? pathToFileURL(localPath).href
            : new URL(configuredSource === LOCAL_TEMPLATE_REGISTRY ? DEFAULT_TEMPLATE_REGISTRY_URL : configuredSource, requestUrl).href;
        let registry: { schemaVersion?: unknown; templates?: RegistryEntry[] };
        let bundled = false;
        let local = Boolean(localPath);
        try {
            // Pointing the upstream URL at this package endpoint would recurse.
            const current = new URL(requestUrl);
            const upstream = new URL(registryUrl);
            if (upstream.origin === current.origin && upstream.pathname === `${basePath}/templates/registry.json`) {
                throw new Error("The package catalog cannot use itself as its upstream registry.");
            }
            registry = await cachedTemplateJson(`pagiera:templates:registry:v${TEMPLATE_CACHE_REVISION}:${registryUrl}`, registryUrl) as typeof registry;
        } catch {
            registry = templateCatalog.FALLBACK_TEMPLATE_REGISTRY;
            bundled = true;
            local = false;
        }
        if (registry.schemaVersion !== 1 || !Array.isArray(registry.templates)) throw new Error("Template registry has an unsupported format.");
        return { registry, registryUrl, bundled, local };
    };

    const templateBundleById = async (templateId: string, requestUrl: string) => {
        if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(templateId)) return undefined;
        const builtin = BUILTIN_TEMPLATE_IDS.includes(templateId as BuiltinTemplateId);
        const { registry, registryUrl, bundled } = await templateRegistryFor(requestUrl);
        const entry = registry.templates.find((candidate) => candidate?.id === templateId);
        if (!entry) return undefined;
        if (bundled || typeof entry.file !== "string" || !entry.file) {
            return builtin ? templates.createSiteTemplateBundle(templateId as BuiltinTemplateId) : undefined;
        }
        const bundleUrl = new URL(entry.file, registryUrl).href;
        if (!/^(https?|file):$/.test(new URL(bundleUrl).protocol)) throw new Error("Template bundle URL must use HTTP, HTTPS or a local development file.");
        const bundle = await cachedTemplateJson(`pagiera:templates:bundle:${templateId}:${String(entry.version ?? "latest")}:${bundleUrl}`, bundleUrl) as {
            schemaVersion?: unknown;
            id?: unknown;
            pages?: unknown;
            components?: unknown;
        };
        if (bundle.schemaVersion !== 1 || bundle.id !== templateId || !Array.isArray(bundle.pages)) {
            throw new Error(`Template '${templateId}' has an unsupported bundle format.`);
        }
        return { pages: bundle.pages, components: Array.isArray(bundle.components) ? bundle.components : [] };
    };

    const validateTemplatePages = (raw: unknown) => {
        const rawPages = Array.isArray(raw) ? raw.slice(0, 20) : [];
        if (rawPages.length === 0) throw new Error("Template must include at least one page.");
        const slugs = new Set<string>();
        return rawPages.map((candidate) => {
            const page = candidate && typeof candidate === "object" ? candidate as Record<string, unknown> : {};
            const name = validation.parseName(page.name);
            const slug = validation.parseSlug(page.slug);
            if (!name || !slug) throw new Error("Every template page needs a valid name and slug.");
            if (slugs.has(slug)) throw new Error(`Template contains the duplicate path '${slug}'.`);
            slugs.add(slug);
            return {
                name,
                slug,
                elements: validation.parseElements(page.elements),
                rootStyle: validation.parseRootStyle(page.rootStyle),
                dataSources: validation.parseDataSources(page.dataSources),
            };
        });
    };

    const installTemplateById = async (templateId: string, requestUrl: string, fontFamily?: string) => {
        const rawBundle = await templateBundleById(templateId, requestUrl);
        if (!rawBundle) return undefined;
        const safeFontFamily = fontFamily
            ? validation.parseRootStyle({ fontFamily }).fontFamily
            : undefined;
        const templatePages = validateTemplatePages(rawBundle.pages).map((page) => {
            if (!safeFontFamily) return page;
            const usesBundledTemplateFont = safeFontFamily === page.rootStyle.fontFamily;
            return {
                ...page,
                rootStyle: {
                    ...page.rootStyle,
                    fontFamily: safeFontFamily,
                    customFonts: usesBundledTemplateFont ? page.rootStyle.customFonts : [],
                },
            };
        });
        const templateComponents = validation.parseElements(rawBundle.components);
        const pageId = await pages.installTemplatePages(templatePages, templateComponents);
        await invalidate();
        return { pageId, pageCount: templatePages.length };
    };

    function matchPagePath(pattern: string, pathname: string) {
        const patternParts = pattern.split("/").filter(Boolean);
        const pathParts = pathname.split("/").filter(Boolean);
        if (patternParts.length !== pathParts.length) return undefined;
        const params: Record<string, string> = {};
        for (let index = 0; index < patternParts.length; index += 1) {
            const part = patternParts[index];
            const value = pathParts[index];
            if (part.startsWith(":")) params[part.slice(1)] = value;
            else if (part !== value) return undefined;
        }
        return params;
    }

    async function resolvePublishedPath(pathname: string) {
        const normalized = pathname.replace(/^\/+|\/+$/g, "") || "home";
        const exact = await pages.getPublishedPage(normalized);
        if (exact) return { page: exact, pattern: normalized, params: {} as Record<string, string> };
        const patterns = (await pages.listPublishedSlugs())
            .map((entry: { slug: string }) => entry.slug)
            .filter((slug: string) => slug.includes(":"))
            .sort((left: string, right: string) => {
                const staticDifference = right.split("/").filter((part) => !part.startsWith(":")).length - left.split("/").filter((part) => !part.startsWith(":")).length;
                return staticDifference || right.length - left.length;
            });
        for (const pattern of patterns) {
            const params = matchPagePath(pattern, normalized);
            if (!params) continue;
            const page = await pages.getPublishedPage(pattern);
            if (page) return { page, pattern, params };
        }
        return undefined;
    }

    async function getPublishedDocument(slug: string) {
        const normalized = slug.replace(/^\/+|\/+$/g, "") || "home";
        const key = `pagiera:published:${normalized}`;
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);
        const resolved = await resolvePublishedPath(normalized);
        if (!resolved) return undefined;
        const document = { ...resolved.page, routePattern: resolved.pattern, routeParams: resolved.params };
        await redis.set(key, JSON.stringify(document), { EX: 60 });
        return document;
    }

    async function getPublishedPage(slug: string, context?: Record<string, unknown>) {
        const page = await getPublishedDocument(slug);
        if (!page) return undefined;
        let data;
        try {
            data = await renderData.loadPageData(page.elements, page.dataSources ?? [], {
                context: {
                    query: {},
                    page: { slug: page.routePattern ?? slug },
                    ...(context ?? {}),
                    params: { ...(page.routeParams ?? {}), ...((context as any)?.params ?? {}) },
                },
            });
        } catch (error) {
            if (error instanceof renderData.PageDataNotFoundError) return undefined;
            throw error;
        }
        return { ...page, data };
    }

    async function getEditorBootstrap(pageId?: string) {
        // Also repairs projects created before Home became mandatory.
        const home = await pages.getOrCreateDefaultPage();
        const page = pageId ? await pages.getPage(pageId) : home;
        if (!page) return undefined;
        return { page, pages: await pages.listPages(), library: await pages.listPageDocuments() };
    }

    async function getPreviewPage(pageId: string, context?: Record<string, unknown>) {
        const page = await pages.getPage(pageId);
        if (!page) return undefined;
        let data;
        try {
            data = await renderData.loadPageData(page.elements, page.dataSources ?? [], {
                context: { query: {}, params: {}, page: { slug: page.slug }, ...(context ?? {}) },
                revalidate: false,
            });
        } catch (error) {
            if (error instanceof renderData.PageDataNotFoundError) return undefined;
            throw error;
        }
        return { ...page, data };
    }

    async function handle(request: Request): Promise<Response> {
        try {
            const url = new URL(request.url);
            const path = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) || "/" : url.pathname;
            const parts = path.split("/").filter(Boolean);

            if (request.method === "GET" && path === "/health") {
                await pool.query("SELECT 1");
                return ok({ status: "ok", postgres: true, redis: (await redis.ping()) === "PONG", model: config.openRouterModel });
            }
            if (request.method === "GET" && path === "/assets/manrope-variable.woff2") {
                const encoded = manropeDataUrl.slice(manropeDataUrl.indexOf(",") + 1);
                return new Response(Buffer.from(encoded, "base64"), {
                    headers: {
                        "Content-Type": "font/woff2",
                        "Cache-Control": "public, max-age=31536000, immutable",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            }
            if (request.method === "GET" && path === "/templates/registry.json") {
                const { registry, bundled, local } = await templateRegistryFor(request.url);
                return new Response(JSON.stringify(registry), {
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Cache-Control": local || bundled ? "no-store" : "public, max-age=300, stale-while-revalidate=900",
                        "X-Pagiera-Template-Source": local ? "local" : bundled ? "bundled" : "network",
                    },
                });
            }
            if (request.method === "GET" && parts[0] === "templates" && parts.length > 2) {
                const requestedAsset = parts.slice(1).join("/");
                const { registry, registryUrl, bundled } = await templateRegistryFor(request.url);
                const entry = registry.templates.find((candidate) => {
                    const thumbnail = typeof candidate.thumbnail === "string" ? candidate.thumbnail.replace(/^\.\//, "") : "";
                    const file = typeof candidate.file === "string" ? candidate.file.replace(/^\.\//, "") : "";
                    return thumbnail === requestedAsset || file === requestedAsset;
                });
                if (!entry) return fail("Template asset not found", 404);

                const thumbnail = typeof entry.thumbnail === "string" ? entry.thumbnail.replace(/^\.\//, "") : "";
                if (thumbnail === requestedAsset && requestedAsset.endsWith(".svg") && entry.preview && typeof entry.preview === "object" && typeof entry.name === "string" && typeof entry.category === "string") {
                    return new Response(templateThumbnails.templateThumbnailSvg(entry as Parameters<typeof templateThumbnails.templateThumbnailSvg>[0]), {
                        headers: {
                            "Content-Type": "image/svg+xml; charset=utf-8",
                            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
                        },
                    });
                }

                if (bundled) return fail("Template asset not found", 404);
                const source = thumbnail === requestedAsset ? entry.thumbnail : entry.file;
                if (typeof source !== "string") return fail("Template asset not found", 404);
                const assetUrl = new URL(source, registryUrl);
                if (!/^https?:$/.test(assetUrl.protocol)) return fail("Template asset URL must use HTTP or HTTPS", 400);
                const response = await fetch(assetUrl, { signal: AbortSignal.timeout(15_000) });
                if (!response.ok) return fail(`Template source returned ${response.status}`, 502);
                return new Response(response.body, {
                    headers: {
                        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
                        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
                    },
                });
            }
            if (request.method === "GET" && path === "/bootstrap") {
                const bootstrap = await getEditorBootstrap(url.searchParams.get("pageId") ?? undefined);
                return bootstrap ? ok(bootstrap) : fail("Page not found", 404);
            }
            if (request.method === "POST" && path === "/settings/font") {
                const body = await bodyOf(request);
                const parsed = validation.parseRootStyle({
                    fontFamily: body.fontFamily,
                    customFonts: body.customFonts,
                });
                const font = await pages.setSiteFont(parsed.fontFamily, parsed.customFonts ?? []);
                await invalidate();
                return ok({ status: "ok", font });
            }
            if (request.method === "POST" && path === "/settings/transition") {
                const body = await bodyOf(request);
                const parsed = validation.parseRootStyle({
                    pageTransition: body.pageTransition,
                    pageTransitionDuration: body.pageTransitionDuration,
                });
                const transition = await pages.setSiteTransition(
                    parsed.pageTransition,
                    parsed.pageTransitionDuration,
                );
                await invalidate();
                return ok({ status: "ok", transition });
            }
            if (request.method === "GET" && parts[0] === "published" && parts[1]) {
                const page = await getPublishedDocument(parts.slice(1).join("/"));
                if (!page) return fail("Published page not found", 404);
                return ok(page);
            }
            if (request.method === "GET" && parts[0] === "pages" && parts[1]) {
                const page = await pages.getPage(parts[1]);
                return page ? ok(page) : fail("Page not found", 404);
            }
            if (request.method === "POST" && path === "/pages") {
                const body = await bodyOf(request); const name = validation.parseName(body.name); const slug = validation.parseSlug(body.slug ?? body.name);
                if (!name || !slug) return fail("A valid name and slug are required.");
                const pageId = await pages.createPage(name, slug); return pageId ? ok({ status: "ok", pageId }, 201) : fail("Slug already exists", 409);
            }
            if (parts[0] === "pages" && parts[1] && request.method === "PATCH" && parts.length === 2) {
                const body = await bodyOf(request); const name = validation.parseName(body.name); const slug = validation.parseSlug(body.slug);
                if (!name || !slug) return fail("A valid name and slug are required.");
                const current = await pages.getPage(parts[1]);
                if (current?.slug === "home" && slug !== "home") return fail("The home page path is required and cannot be changed.", 409);
                const pageId = await pages.renamePage(parts[1], name, slug); await invalidate(); return pageId ? ok({ status: "ok", pageId }) : fail("Page not found", 404);
            }
            if (parts[0] === "pages" && parts[1] && request.method === "DELETE") {
                const result = await pages.deletePage(parts[1]); await invalidate();
                return result.deleted
                    ? ok({ status: "ok", pageId: result.fallbackId })
                    : fail(result.reason === "home-required" ? "The home page is required and cannot be deleted." : "The final page cannot be deleted", 409);
            }
            if (parts[0] === "pages" && parts[1] && parts[2] === "save" && request.method === "POST") {
                const body = await bodyOf(request); const document = body.document ?? {};
                const saved = await pages.savePageDocument(parts[1], validation.parseElements(document.elements), validation.parseRootStyle(document.rootStyle), validation.parseDataSources(document.dataSources), Number(body.expectedVersion));
                if (saved.status === "saved" && saved.componentsPublished) await invalidate();
                return ok(saved);
            }
            if (parts[0] === "pages" && parts[1] && parts[2] === "duplicate" && request.method === "POST") {
                const body = await bodyOf(request); const name = validation.parseName(body.name); const slug = validation.parseSlug(body.slug);
                if (!name || !slug) return fail("A valid name and slug are required.");
                const pageId = await pages.duplicatePage(parts[1], name, slug); return pageId ? ok({ status: "ok", pageId }, 201) : fail("Could not duplicate page", 409);
            }
            if (parts[0] === "pages" && parts[1] && parts[2] === "publish" && request.method === "POST") {
                const published = await pages.publishPage(parts[1]); await invalidate(); return published ? ok({ status: "ok", slug: published.slug }) : fail("Page not found", 404);
            }
            if (parts[0] === "pages" && parts[1] && parts[2] === "unpublish" && request.method === "POST") {
                await pages.unpublishPage(parts[1]); await invalidate(); return ok({ status: "ok" });
            }
            if (parts[0] === "templates" && parts[1] === "install" && parts.length === 2 && request.method === "POST") {
                const body = await bodyOf(request);
                const templateId = typeof body.templateId === "string" ? body.templateId.trim() : "";
                if (!templateId) return fail("A template ID is required.");
                const fontFamily = typeof body.fontFamily === "string" ? body.fontFamily.trim().slice(0, 300) : undefined;
                const installed = await installTemplateById(templateId, request.url, fontFamily);
                return installed ? ok({ status: "ok", templateId, ...installed }) : fail("Unknown template", 404);
            }
            if (parts[0] === "templates" && parts[1] && parts[1] !== "install" && request.method === "POST") {
                const installed = await installTemplateById(parts[1], request.url);
                return installed ? ok({ status: "ok", templateId: parts[1], ...installed }) : fail("Unknown template", 404);
            }
            if (path === "/data/preview" && request.method === "POST") {
                const body = await bodyOf(request); const [source] = validation.parseDataSources([body.source]);
                if (!source) return fail("Invalid source.");
                const query = Object.fromEntries(new URLSearchParams(typeof body.sampleQuery === "string" ? body.sampleQuery.slice(0, 500) : ""));
                const result = await sourceRuntime.loadSource(source, { context: { query, params: {}, page: { slug: "preview" } }, revalidate: false });
                return ok({ status: "ok", ...result, total: result.rows.length });
            }
            if (path === "/ai" && request.method === "POST") {
                const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
                const rateKey = `pagiera:ai-rate:${ip}:${Math.floor(Date.now() / 60_000)}`;
                const count = await redis.incr(rateKey); if (count === 1) await redis.expire(rateKey, 70);
                if (count > (config.aiRateLimitPerMinute ?? 10)) return fail("AI rate limit exceeded.", 429);
                return ai.POST(request);
            }
            return fail("Pagiera API route not found", 404);
        } catch (error) {
            console.error("Pagiera API error", error);
            return fail(error, 500);
        }
    }

    return { handle, getEditorBootstrap, getPreviewPage, getPublishedDocument, getPublishedPage, close: async () => { await redis.quit(); await pool.end(); }, redis, pool };
}

export function pagieraConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PagieraServerConfig {
    return {
        postgresUrl: env.PAGIERA_POSTGRES_URL ?? env.DATABASE_URL ?? "",
        redisUrl: env.PAGIERA_REDIS_URL ?? env.REDIS_URL ?? "",
        openRouterApiKey: env.OPENROUTER_API_KEY ?? "",
        openRouterModel: env.OPENROUTER_MODEL ?? "",
        templateRegistryUrl: env.PAGIERA_TEMPLATE_REGISTRY_URL ?? (env.NODE_ENV === "production" ? DEFAULT_TEMPLATE_REGISTRY_URL : LOCAL_TEMPLATE_REGISTRY),
    };
}

/** Framework adapter for a Next.js catch-all Route Handler. Initialization is lazy and shared. */
export function createPagieraRouteHandlers(config: PagieraServerConfig) {
    let server: ReturnType<typeof createPagieraServer> | undefined;
    const handle = async (request: Request) => {
        try {
            return await (await (server ??= getPagieraServer(config))).handle(request);
        } catch (error) {
            server = undefined;
            return Response.json(
                { error: error instanceof Error ? error.message : "Pagiera server could not start." },
                { status: 503 },
            );
        }
    };
    return { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle };
}

const globalServers = globalThis as typeof globalThis & { __pagieraServers?: Map<string, ReturnType<typeof createPagieraServer>> };
const SERVER_RUNTIME_REVISION = 14;

/** Reuses pools and Redis connections across API routes, SSR and development reloads. */
export function getPagieraServer(config: PagieraServerConfig) {
    // Include the runtime shape so a Turbopack hot reload cannot hand a newer
    // package an older server object that is missing recently added methods.
    const key = `${SERVER_RUNTIME_REVISION}\n${config.postgresUrl}\n${config.redisUrl}\n${config.openRouterModel}\n${config.templateRegistryUrl ?? DEFAULT_TEMPLATE_REGISTRY_URL}`;
    const servers = globalServers.__pagieraServers ??= new Map();
    let server = servers.get(key);
    if (!server) {
        server = createPagieraServer(config);
        servers.set(key, server);
        server.catch(() => servers.delete(key));
    }
    return server;
}
