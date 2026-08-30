export type PagieraClientOptions = {
    baseUrl?: string;
    fetch?: typeof globalThis.fetch;
};

/**
 * A failed API call, carrying the status the server answered with.
 *
 * The status is the difference between "your URL is refused" and "the server
 * fell over", and a caller that wants to show the author what happened cannot
 * recover it from a message alone.
 */
export class PagieraRequestError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
        this.name = "PagieraRequestError";
    }
}

async function jsonRequest(fetcher: typeof globalThis.fetch, url: string, init?: RequestInit) {
    const response = await fetcher(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new PagieraRequestError(
            body?.error ?? `Pagiera API request failed (${response.status})`,
            response.status,
        );
    }
    return body;
}

/**
 * Runs a design request and reports each pass as it finishes.
 *
 * The endpoint answers with newline-delimited JSON so the three model passes
 * can be surfaced while they run instead of after all of them. A server that
 * still answers with a single JSON object — an older deployment — is handled
 * by the non-stream branch, so upgrading either side alone keeps working.
 */
async function streamAi(
    fetcher: typeof globalThis.fetch,
    url: string,
    request: unknown,
    onEvent?: (event: unknown) => void,
    /** Aborting stops the request itself, not just the reading of it. */
    signal?: AbortSignal,
) {
    const response = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
    });

    const isStream = response.headers.get("content-type")?.includes("ndjson");
    if (!isStream || !response.body) {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? `Pagiera API request failed (${response.status})`);
        return body;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let plan: unknown;

    const consume = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let event: { type?: string; plan?: unknown; error?: string };
        try {
            event = JSON.parse(trimmed);
        } catch {
            return;
        }
        if (event.type === "error") throw new Error(event.error ?? "AI request failed.");
        if (event.type === "plan") plan = event.plan;
        onEvent?.(event);
    };

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
            consume(buffer.slice(0, newline));
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
        }
    }
    consume(buffer);

    if (!plan) throw new Error("The AI stream ended without a plan.");
    return plan;
}

/** Ready-to-pass adapters for `<PagieraStudio />`. */
export function createPagieraClient(options: PagieraClientOptions = {}) {
    const base = (options.baseUrl ?? "/api/pagiera").replace(/\/$/, "");
    const fetcher = options.fetch ?? globalThis.fetch;
    const call = (path: string, method: string, body?: unknown) =>
        jsonRequest(fetcher, `${base}${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });

    return {
        bootstrap: (pageId?: string) => jsonRequest(fetcher, `${base}/bootstrap${pageId ? `?pageId=${encodeURIComponent(pageId)}` : ""}`),
        loadPage: (pageId: string) => jsonRequest(fetcher, `${base}/pages/${pageId}`),
        adapters: {
            save: (pageId: string, document: unknown, expectedVersion: number) => call(`/pages/${pageId}/save`, "POST", { document, expectedVersion }),
            createPage: (name: string, slug: string) => call("/pages", "POST", { name, slug }),
            renamePage: (id: string, name: string, slug: string) => call(`/pages/${id}`, "PATCH", { name, slug }),
            duplicatePage: (id: string, name: string, slug: string) => call(`/pages/${id}/duplicate`, "POST", { name, slug }),
            deletePage: (id: string) => call(`/pages/${id}`, "DELETE"),
            installTemplate: (templateId: string, fontFamily?: string) => call("/templates/install", "POST", { templateId, fontFamily }),
            importTemplate: (bundle: unknown, fontFamily?: string) => call("/templates/import", "POST", { bundle, fontFamily }),
            exportTemplateUrl: (id: string) => `${base}/templates/export?id=${encodeURIComponent(id)}`,
            setSiteFont: (fontFamily: string, customFonts?: unknown[]) => call("/settings/font", "POST", { fontFamily, customFonts }),
            setSiteTransition: (pageTransition: string, pageTransitionDuration: number) => call("/settings/transition", "POST", { pageTransition, pageTransitionDuration }),
            publishPage: (id: string) => call(`/pages/${id}/publish`, "POST"),
            unpublishPage: (id: string) => call(`/pages/${id}/unpublish`, "POST"),
            previewSource: (source: unknown, sampleQuery: string) => call("/data/preview", "POST", { source, sampleQuery }),
            generate: (request: unknown, onEvent?: (event: unknown) => void, signal?: AbortSignal) =>
                streamAi(fetcher, `${base}/ai`, request, onEvent, signal),
        },
    };
}
