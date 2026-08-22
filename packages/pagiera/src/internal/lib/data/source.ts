import {
    type DataSource,
    type HttpMethod,
    type RequestContext,
    type RequestPair,
    sendsBody,
} from "@/lib/editor/types";

/**
 * Fetching an author-supplied URL from our server is a server-side request
 * forgery vector: without checks it can reach cloud metadata endpoints, admin
 * services on localhost, or anything else inside the network perimeter. Every
 * hop is validated against this list, and redirects are followed by hand so a
 * public URL cannot bounce into private space.
 */
const BLOCKED_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
    "metadata.goog",
]);

const PRIVATE_IPV4 =
    /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Hostnames that only resolve inside a private network. */
const PRIVATE_SUFFIXES = [".local", ".internal", ".localdomain", ".home.arpa"];

export const MAX_ROWS = 200;
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

export class DataSourceError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = "DataSourceError";
    }
}

export function assertFetchableUrl(raw: string): URL {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new DataSourceError("That is not a valid URL.");
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new DataSourceError("Only http and https URLs can be requested.");
    }

    const host = url.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host) || PRIVATE_IPV4.test(host)) {
        throw new DataSourceError(`Requests to ${host} are not allowed.`);
    }
    if (PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
        throw new DataSourceError(`Requests to ${host} are not allowed.`);
    }
    // Bracketed IPv6 literals: anything link-local or unique-local.
    if (host.startsWith("[") && /^\[(fe80|fc|fd)/i.test(host)) {
        throw new DataSourceError("Requests to private addresses are not allowed.");
    }

    return url;
}

/**
 * Walks a dotted path such as `data.items` or `results.0.tags`. An empty path
 * returns the payload itself, which is what a bare JSON array needs.
 */
export function selectPath(payload: unknown, path: string): unknown {
    const steps = path.split(".").map((s) => s.trim()).filter(Boolean);
    let cursor: unknown = payload;
    for (const step of steps) {
        if (cursor === null || typeof cursor !== "object") return undefined;
        cursor = (cursor as Record<string, unknown>)[step];
    }
    return cursor;
}

/** Reads a body with a hard cap so a huge response cannot exhaust memory. */
async function readCapped(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) return "";

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) {
            await reader.cancel();
            throw new DataSourceError("That response is too large (over 2 MB).");
        }
        chunks.push(value);
    }
    return new TextDecoder().decode(
        chunks.reduce<Uint8Array>((acc, chunk) => {
            const merged = new Uint8Array(acc.length + chunk.length);
            merged.set(acc);
            merged.set(chunk, acc.length);
            return merged;
        }, new Uint8Array()),
    );
}

export type SourceResult = { rows: Array<Record<string, unknown>>; keys: string[] };

/**
 * Requests a source and normalizes it to rows. A root object becomes one row
 * for Request; an array stays multiple rows for Repeat.
 */
export type LoadOptions = {
    /**
     * Seconds to cache the response for. `false` bypasses the cache — only for
     * the editor's Test button; on a rendered route it would force an
     * otherwise-static page to become dynamic on every request.
     */
    revalidate?: number | false;
    /** Supplies `{{query.…}}` / `{{page.…}}` values for this request. */
    context?: RequestContext;
};

export const DEFAULT_REVALIDATE = 60;

export async function loadSource(
    source: DataSource,
    { revalidate = DEFAULT_REVALIDATE, context = EMPTY_CONTEXT }: LoadOptions = {},
): Promise<SourceResult> {
    const request = buildRequest(source, context);
    let target = request.url;

    let response: Response | undefined;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        response = await fetch(target, {
            // Redirects are followed by hand so each hop is validated too.
            redirect: "manual",
            method: request.method,
            headers: request.headers,
            body: request.body,
            signal: AbortSignal.timeout(TIMEOUT_MS),
            // Only GET responses are cacheable; anything with side effects is
            // fetched fresh every time.
            ...(revalidate === false || request.method !== "GET"
                ? { cache: "no-store" as const }
                : { next: { revalidate } }),
        });

        if (response.status < 300 || response.status >= 400) break;

        const location = response.headers.get("location");
        if (!location) break;
        target = assertFetchableUrl(new URL(location, target).toString());
        response = undefined;
    }

    if (!response) throw new DataSourceError("Too many redirects.");
    if (!response.ok) {
        throw new DataSourceError(`The API replied ${response.status}.`, response.status);
    }

    const text = await readCapped(response);
    let payload: unknown;
    try {
        payload = JSON.parse(text);
    } catch {
        throw new DataSourceError("The response was not JSON.");
    }

    const selected = selectPath(payload, source.path);
    const selectedRows = Array.isArray(selected)
        ? selected
        : selected !== null && typeof selected === "object"
          ? [selected]
          : undefined;
    if (!selectedRows) {
        throw new DataSourceError(
            source.path
                ? `"${source.path}" is not a list in that response.`
                : "That response is neither an object nor a list.",
        );
    }

    const rows = selectedRows
        .slice(0, MAX_ROWS)
        .map((row) =>
            row !== null && typeof row === "object" && !Array.isArray(row)
                ? (row as Record<string, unknown>)
                : { value: row },
        );

    // Union of the keys across the sample, so binding menus list everything.
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
    return { rows, keys };
}

/** Reads one binding path off a row and flattens it to something renderable. */
export function readBinding(row: Record<string, unknown>, path: string): string {
    const value = selectPath(row, path);
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return "";
    return String(value);
}

/* ------------------------------------------------------------------ tokens */

/**
 * Resolves `{{query.id}}`, `{{params.slug}}` and `{{page.slug}}`.
 *
 * Only these two namespaces exist: an unknown token becomes an empty string
 * rather than being left in the URL, so a typo cannot send a literal `{{…}}`
 * to the API or accidentally expose something else.
 */
export function resolveTokens(value: string, context: RequestContext): string {
    return value.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, token: string) => {
        const [namespace, ...rest] = token.split(".");
        const key = rest.join(".");
        if (namespace === "query") return context.query[key] ?? "";
        if (namespace === "params") return context.params[key] ?? "";
        if (namespace === "page" && key === "slug") return context.page.slug;
        return "";
    });
}

/** Header names and values must not be able to inject extra headers. */
function safeHeader(pair: RequestPair, context: RequestContext) {
    const name = pair.key.trim();
    if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) return null;
    // Strip anything that could terminate the header line.
    const value = resolveTokens(pair.value, context).replace(/[\r\n\0]/g, "").trim();
    return value ? ([name, value] as const) : null;
}

/**
 * Builds the final URL: tokens resolved, params appended and percent-encoded
 * by `URLSearchParams` so a value can never break out into the query grammar.
 */
export function buildRequest(source: DataSource, context: RequestContext) {
    const url = assertFetchableUrl(resolveTokens(source.url, context));

    for (const pair of source.params ?? []) {
        const key = pair.key.trim();
        if (!key) continue;
        const value = resolveTokens(pair.value, context);
        // An empty optional filter is dropped rather than sent as `key=`.
        if (value === "") continue;
        url.searchParams.set(key, value);
    }

    const method: HttpMethod = source.method ?? "GET";

    const headers: Record<string, string> = {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
    };

    let body: string | undefined;
    if (sendsBody(method) && source.body?.trim()) {
        body = resolveTokens(source.body, context);
        headers["content-type"] = "application/json";
    }

    // Author headers last, so they can override the defaults above.
    for (const pair of source.headers ?? []) {
        const safe = safeHeader(pair, context);
        if (safe) headers[safe[0]] = safe[1];
    }

    // Re-check after tokens: a token could have rewritten the host.
    return { url: assertFetchableUrl(url.toString()), headers, method, body };
}

export const EMPTY_CONTEXT: RequestContext = { query: {}, params: {}, page: { slug: "" } };
