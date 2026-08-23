export type PagieraClientOptions = {
    baseUrl?: string;
    fetch?: typeof globalThis.fetch;
};

async function jsonRequest(fetcher: typeof globalThis.fetch, url: string, init?: RequestInit) {
    const response = await fetcher(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? `Pagiera API request failed (${response.status})`);
    return body;
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
            setSiteFont: (fontFamily: string, customFonts?: unknown[]) => call("/settings/font", "POST", { fontFamily, customFonts }),
            setSiteTransition: (pageTransition: string, pageTransitionDuration: number) => call("/settings/transition", "POST", { pageTransition, pageTransitionDuration }),
            publishPage: (id: string) => call(`/pages/${id}/publish`, "POST"),
            unpublishPage: (id: string) => call(`/pages/${id}/unpublish`, "POST"),
            previewSource: (source: unknown, sampleQuery: string) => call("/data/preview", "POST", { source, sampleQuery }),
            generate: (request: unknown) => call("/ai", "POST", request),
        },
    };
}
