/**
 * Image generation for the design agent.
 *
 * The plan names what a picture should show; the bytes are fetched here, once
 * the layout is settled, so a failed image never costs the whole run. Providers
 * answer with a base64 data URI of well over a megabyte, which is far past what
 * an element's `src` accepts and would travel with the document on every load —
 * so the caller stores the bytes and puts a URL in its place.
 */

export type GeneratedImage = { mime: string; bytes: Buffer; prompt: string };

const MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

/** Photography rather than illustration, and never with text baked in. */
const STYLE_GUIDE =
    "Editorial photography for a website. Natural light, real materials, shallow depth of field, no text, no logos, no watermarks, no user interface, no collage.";

export async function generateImage(options: {
    prompt: string;
    apiKey: string;
    model?: string;
    signal?: AbortSignal;
}): Promise<GeneratedImage | undefined> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: options.model || DEFAULT_IMAGE_MODEL,
            modalities: ["image", "text"],
            messages: [{ role: "user", content: `${options.prompt.slice(0, 700)}\n\n${STYLE_GUIDE}` }],
        }),
        signal: options.signal,
    });

    if (!response.ok) return undefined;
    const body = (await response.json()) as {
        choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string }; url?: string }> } }>;
    };

    const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url
        ?? body.choices?.[0]?.message?.images?.[0]?.url;
    if (!url) return undefined;

    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(url);
    if (!match) return undefined;

    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return undefined;
    return { mime: match[1].toLowerCase(), bytes, prompt: options.prompt };
}
