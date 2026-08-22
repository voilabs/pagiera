import { Pool } from "pg";
import { createClient, type RedisClientType } from "redis";
import manropeDataUrl from "./manrope-data.js";

export type PagieraServerConfig = {
    postgresUrl: string;
    redisUrl: string;
    openRouterApiKey: string;
    openRouterModel: string;
    basePath?: string;
    aiRateLimitPerMinute?: number;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
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
            if (request.method === "GET" && path === "/bootstrap") {
                const bootstrap = await getEditorBootstrap(url.searchParams.get("pageId") ?? undefined);
                return bootstrap ? ok(bootstrap) : fail("Page not found", 404);
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
                return ok(await pages.savePageDocument(parts[1], validation.parseElements(document.elements), validation.parseRootStyle(document.rootStyle), validation.parseDataSources(document.dataSources), Number(body.expectedVersion)));
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
            if (path === "/templates/install" && request.method === "POST") {
                const body = await bodyOf(request);
                const rawPages = Array.isArray(body.template?.pages) ? body.template.pages.slice(0, 20) : [];
                if (rawPages.length === 0) return fail("Template must include at least one page.");
                const slugs = new Set<string>();
                const templatePages = rawPages.map((raw: Record<string, unknown>) => {
                    const name = validation.parseName(raw?.name);
                    const slug = validation.parseSlug(raw?.slug);
                    if (!name || !slug) throw new Error("Every template page needs a valid name and slug.");
                    if (slugs.has(slug)) throw new Error(`Template contains the duplicate path '${slug}'.`);
                    slugs.add(slug);
                    return {
                        name,
                        slug,
                        elements: validation.parseElements(raw.elements),
                        rootStyle: validation.parseRootStyle(raw.rootStyle),
                        dataSources: validation.parseDataSources(raw.dataSources),
                    };
                });
                const pageId = await pages.installTemplatePages(templatePages);
                await invalidate();
                return ok({ status: "ok", pageId });
            }
            if (parts[0] === "templates" && parts[1] && request.method === "POST") {
                if (!["nocturne", "editorial-blog", "orbit-saas"].includes(parts[1])) return fail("Unknown template", 404);
                const pageId = await pages.installTemplatePages(templates.createSiteTemplate(parts[1] as "nocturne" | "editorial-blog" | "orbit-saas"));
                await invalidate();
                return ok({ status: "ok", pageId });
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
const SERVER_RUNTIME_REVISION = 4;

/** Reuses pools and Redis connections across API routes, SSR and development reloads. */
export function getPagieraServer(config: PagieraServerConfig) {
    // Include the runtime shape so a Turbopack hot reload cannot hand a newer
    // package an older server object that is missing recently added methods.
    const key = `${SERVER_RUNTIME_REVISION}\n${config.postgresUrl}\n${config.redisUrl}\n${config.openRouterModel}`;
    const servers = globalServers.__pagieraServers ??= new Map();
    let server = servers.get(key);
    if (!server) {
        server = createPagieraServer(config);
        servers.set(key, server);
        server.catch(() => servers.delete(key));
    }
    return server;
}
