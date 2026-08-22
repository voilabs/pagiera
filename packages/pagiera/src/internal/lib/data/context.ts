import type { RequestContext } from "@/lib/editor/types";

/**
 * Narrows Next's `searchParams` into the flat string map a request token can
 * read. Repeated keys collapse to the first value, which is what a template
 * like `{{query.id}}` means.
 */
export function toRequestContext(
    searchParams: Record<string, string | string[] | undefined>,
    slug: string,
    params: Record<string, string> = {},
): RequestContext {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(searchParams)) {
        if (typeof value === "string") query[key] = value;
        else if (Array.isArray(value) && typeof value[0] === "string") {
            query[key] = value[0];
        }
    }
    return { query, params, page: { slug } };
}
