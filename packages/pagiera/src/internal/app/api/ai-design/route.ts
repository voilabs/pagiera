import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";
import type { AiDesignOperation } from "@/lib/editor/ai-types";
import { BLOCK_KINDS, BLOCK_LAYOUTS, buildSection } from "@/lib/editor/ai/blocks";
import { attachImagePrompt, toAddOperations } from "@/lib/editor/ai/ops";
import { type PlannedSection, planPage, type RawSection } from "@/lib/editor/ai/plan";
import { resolveTheme, type Theme } from "@/lib/editor/ai/theme";
import { type GeneratedImage, generateImage } from "@/lib/editor/imagery";

/**
 * The AI design route.
 *
 * One model call decides *what the page says and what shape each section
 * takes*. Everything after that is deterministic: the theme resolves colours
 * with real contrast maths, the planner fixes the sequence's rhythm, and the
 * block library builds geometry a person wrote. The model is never asked for
 * a pixel, a hex code or an element tree, which is why the output cannot come
 * back structurally broken.
 *
 * The previous route asked for both, got neither reliably, and grew a
 * validator, a repair pass and a fallback page to cope. None of that is here
 * because none of it has anything to fail at.
 */

// One model call plus a handful of images. The old three-pass run needed ten
// minutes; this needs one, and the ceiling is only here for a stalled provider.
export const maxDuration = 300;

/** Each picture is a separate paid request, and a page needs very few. */
const MAX_GENERATED_IMAGES = 3;

/* ------------------------------------------------------------------ schema */

/**
 * A prose field the model writes freely.
 *
 * Clipped rather than rejected: throwing away a finished page because one
 * headline ran nine characters long would be absurd. The outer bound is what
 * catches a runaway response.
 */
const prose = (max: number) =>
    z.string().max(max * 6).transform((value) => value.slice(0, max));

/**
 * A field that falls back rather than failing the request.
 *
 * Smaller models omit a field, or answer it in the wrong shape, often enough
 * that treating any single slip as fatal makes them unusable — and the whole
 * point of this design is that the model's mistakes should cost quality, not
 * the run. Every field the page can be built without therefore recovers to a
 * neutral value, and the planner drops whatever ends up too thin to render.
 */
const soft = <T>(schema: z.ZodType<T>, fallback: T) => schema.catch(fallback);

const itemSchema = z.object({
    title: soft(prose(90), "").describe("The item's name, question, plan or figure label."),
    body: soft(prose(320), "").describe("One or two real sentences. For a pricing plan, separate included features with ·"),
    value: prose(40).optional().describe("A figure, price or short lead-in the block sets in large type."),
    badge: prose(24).optional().describe("A short tag. On pricing it marks the recommended plan."),
});

const sectionSchema = z.object({
    kind: soft(z.enum(BLOCK_KINDS), "features").describe("Which block builds this section."),
    layout: soft(prose(30), "").describe("The composition for this block; choose from its listed layouts."),
    eyebrow: prose(60).optional(),
    headline: soft(prose(160), ""),
    body: prose(400).optional(),
    primaryAction: prose(40).optional(),
    secondaryAction: prose(40).optional(),
    links: soft(z.array(prose(30)).max(15), []).describe("Navigation or footer links."),
    items: soft(z.array(itemSchema).max(8), []).describe("Cards, plans, questions, figures or steps."),
    imagePrompt: prose(400).optional().describe("Only for hero and showcase, and only when a photograph genuinely helps. Describe a photograph — never text, logos, dashboards or UI."),
    note: prose(160).optional().describe("Fine print: reassurance under a CTA, the footer's legal line."),
});

/**
 * The one object the model returns.
 *
 * `theme` is a handful of parameters, not a palette of finished colours — the
 * route derives every role from them so contrast is guaranteed rather than
 * hoped for.
 */
const themeSchema = z.object({
    mood: soft(z.enum(["light", "dark"]), "light"),
    background: soft(prose(24), "").describe("Page colour as a hex value."),
    accent: soft(prose(24), "").describe("Brand colour as a hex value."),
    typeScale: soft(z.enum(["compact", "balanced", "dramatic"]), "balanced"),
    density: soft(z.enum(["tight", "regular", "airy"]), "regular"),
    corners: soft(z.enum(["square", "soft", "round", "pill"]), "soft"),
    separation: soft(z.enum(["flat", "line", "raised"]), "line"),
    headingFont: prose(40).optional(),
    bodyFont: prose(40).optional(),
});

const DEFAULT_THEME: z.infer<typeof themeSchema> = {
    mood: "light",
    background: "",
    accent: "",
    typeScale: "balanced",
    density: "regular",
    corners: "soft",
    separation: "line",
};

const designSchema = z.object({
    intent: soft(z.enum(["build", "modify", "conversation"]), "build"),
    reply: soft(prose(600), "").describe("What to tell the author, in their own language. For a question, this is the whole answer."),
    brand: soft(prose(60), ""),
    direction: soft(prose(300), "").describe("The art direction in one or two sentences."),
    theme: soft(themeSchema, DEFAULT_THEME),
    sections: soft(z.array(sectionSchema).max(10), []),
});


/* ------------------------------------------------------------------ prompt */

const LAYOUT_GUIDE = Object.entries(BLOCK_LAYOUTS)
    .map(([kind, layouts]) => `${kind}: ${layouts.join(" | ")}`)
    .join("\n");

const SYSTEM = `You are an art director and conversion copywriter working inside Pagiera's design system.

You do not write CSS, colours per element, sizes or element trees. The system owns all of that. You make three kinds of decision:

1. THE THEME. A mood, a page colour, a brand colour and four stylistic axes. Every other colour is derived from these with contrast maths, so pick a background and an accent that genuinely belong to this brand — not indigo-on-white by default. Match the axes to the subject: a law firm is light/compact/square/line, a music app is dark/dramatic/round/flat, a print studio is light/airy/square/flat.

2. THE SEQUENCE. Which blocks the page needs and in what order. A landing page is usually nav, hero, then three to five body sections, then a cta and a footer. Choose body blocks that suit the argument — steps for a process, stats for traction, pricing when there are plans, faq when there are objections. Do not include a block you have no real content for.

3. THE COMPOSITION AND THE COPY. For each section, a layout from the list below, and finished copy. Every headline makes a concrete, specific claim about this product. Every body sentence explains or evidences it. Never write filler like "streamline your workflow", "unlock your potential" or "take it to the next level", never invent awards or customer counts you were not given, and never emit placeholder text.

Available layouts per block:
${LAYOUT_GUIDE}

Vary the compositions. A page where every body section is a three-card grid is a failure even if the copy is perfect.

Images: request one only for a hero or showcase, only when a photograph adds something, and describe a real photograph. Most pages need zero or one.

If the author asked a question rather than for a design, set intent=conversation, answer them in the reply field, and return no sections. Write the reply in the same language the author used.`;

/* ------------------------------------------------------------------ imagery */

export type ImageStore = (image: GeneratedImage) => Promise<string>;

/**
 * Supplied once at startup by the server, which owns the database connection.
 * Without it the route still runs and simply skips generation, so the editor
 * keeps working when it is mounted without a store.
 */
let storeImage: ImageStore | undefined;

export function setImageStore(store: ImageStore) {
    storeImage = store;
}

/**
 * Resolves one section's picture.
 *
 * Never throws and never blocks the section: an image that fails leaves the
 * element with the tinted placeholder the block already gave it, which holds
 * its aspect ratio and reads as intentional rather than as a hole.
 */
async function fillImage(
    operations: AiDesignOperation[],
    apiKey: string,
    store: ImageStore | undefined,
): Promise<{ operations: AiDesignOperation[]; generated: boolean }> {
    const at = operations.findIndex(
        (operation) => operation.kind === "add" && Boolean(operation.imagePrompt?.trim()),
    );
    const target = at >= 0 ? operations[at] : undefined;
    if (!target || target.kind !== "add" || !store) return { operations, generated: false };

    try {
        const image = await generateImage({
            prompt: target.imagePrompt!,
            apiKey,
            model: process.env.OPENROUTER_IMAGE_MODEL,
        });
        if (!image) return { operations, generated: false };
        const src = await store(image);
        const next = operations.slice();
        next[at] = { ...target, src };
        return { operations: next, generated: true };
    } catch {
        // One picture is never worth losing the page over.
        return { operations, generated: false };
    }
}

/* ------------------------------------------------------------------ stream */

/**
 * One line of the progress stream.
 *
 * Each event reports something that actually happened, with the decision that
 * was made — the palette it chose, the composition it picked for a section.
 * Nothing advances on a timer, so a stalled run looks stalled.
 */
export type AiStreamEvent =
    | { type: "phase"; id: "direction" | "build"; status: "start" | "done"; facts?: string[] }
    | { type: "section"; id: string; label: string; index: number; total: number; status: "start" | "done" | "failed"; facts?: string[] }
    | { type: "plan"; plan: unknown; partial?: boolean; section?: { id: string; label: string; index: number; total: number } }
    | { type: "reply"; text: string }
    | { type: "error"; error: string; code?: string };

/* ------------------------------------------------------------- model call */

/**
 * Asks the model for one structured object, through a forced tool call.
 *
 * `generateObject` leans on `response_format`, which OpenRouter accepts and
 * then silently ignores for several models: the request succeeds and the model
 * answers with fenced prose. A forced tool call is honoured, and the arguments
 * come back matching the schema.
 */
async function generateStructured<T>(options: {
    model: Parameters<typeof generateText>[0]["model"];
    schema: z.ZodType<T>;
    name: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
}): Promise<T> {
    let last: unknown;
    // The same request that is cut off mid-JSON frequently succeeds on the
    // next attempt; a genuine schema disagreement will not, so only the flaky
    // failure is retried.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await attemptStructured(options);
        } catch (reason) {
            last = reason;
            const message = reason instanceof Error ? reason.message : "";
            if (!/cut short|did not call the tool/i.test(message)) throw reason;
        }
    }
    throw last;
}

async function attemptStructured<T>(options: {
    model: Parameters<typeof generateText>[0]["model"];
    schema: z.ZodType<T>;
    name: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
}): Promise<T> {
    const { toolCalls } = await generateText({
        model: options.model,
        maxRetries: 2,
        maxOutputTokens: options.maxOutputTokens,
        system: options.system,
        prompt: options.prompt,
        tools: {
            [options.name]: {
                description: "Return the result for this request.",
                inputSchema: options.schema,
            },
        },
        toolChoice: { type: "tool", toolName: options.name },
    });

    const call = toolCalls.find((entry) => entry.toolName === options.name);
    if (!call) throw new Error("No object generated: the model did not call the tool.");

    let raw: unknown;
    if (typeof call.input === "string") {
        try {
            raw = JSON.parse(call.input);
        } catch {
            throw new Error(
                `No object generated: the response was cut short after ${call.input.length} characters, before the JSON was complete.`,
            );
        }
    } else {
        raw = call.input;
    }

    const result = options.schema.safeParse(raw);
    if (!result.success) {
        const first = result.error.issues[0];
        throw new Error(
            `No object generated: response did not match schema (${first?.path.join(".") || "root"}: ${first?.message ?? "invalid"}).`,
        );
    }
    return result.data;
}

/**
 * Turns a provider failure into something the author can act on.
 *
 * These fail in genuinely different ways and want different responses: telling
 * someone their answer was cut short when the model could not satisfy the
 * schema sends them to retry the same request forever.
 */
export function describeFailure(rawMessage: string): { error: string; code: string } {
    const model = process.env.OPENROUTER_MODEL ?? "the configured model";

    if (/unexpected end|unterminated|cut short|max tokens|maximum context|too long|length limit/i.test(rawMessage)) {
        return {
            error: "AI yanıtı tamamlanmadan kesildi. İstek korunuyor; tekrar deneyebilir veya daha küçük bir bölüm isteyebilirsin.",
            code: "INCOMPLETE_AI_RESPONSE",
        };
    }

    if (/no object generated|no output generated|did not match schema|could not parse/i.test(rawMessage)) {
        const detail = /\(([^)]+)\)/.exec(rawMessage)?.[1];
        return {
            error: `“${model}” tasarım şemasına uygun bir çıktı üretemedi${detail ? ` — ${detail}` : ""}. Daha küçük bir istek dene, ya da OPENROUTER_MODEL'i daha güçlü bir modele çevir.`,
            code: "AI_SCHEMA_MISMATCH",
        };
    }

    if (/user not found|invalid api key|unauthorized|401/i.test(rawMessage)) {
        return {
            error: "OpenRouter anahtarı reddedildi. OPENROUTER_API_KEY'i kontrol edip sunucuyu yeniden başlat.",
            code: "AI_AUTH_ERROR",
        };
    }

    return { error: `AI tasarımı oluşturulamadı: ${rawMessage.slice(0, 240)}`, code: "AI_PROVIDER_ERROR" };
}

/* -------------------------------------------------------------------- focus */

const focusSchema = z.object({
    id: z.string().min(1).max(120),
    name: z.string().max(120),
    type: z.string().max(40),
});

/**
 * Drops anything a scoped run was not allowed to touch.
 *
 * Telling the model to stay inside one element is a request, not a guarantee.
 * `allowed` grows as the run adds children, so new elements parented into the
 * focused subtree are kept while edits to unrelated ids are removed.
 */
export function withinFocus(operations: AiDesignOperation[], focusId: string) {
    const allowed = new Set([focusId]);
    return operations.filter((operation) => {
        if (operation.kind === "page") return false;
        if (operation.kind === "add") {
            const parent = operation.parentId ?? undefined;
            if (!parent || !allowed.has(parent)) return false;
            allowed.add(operation.ref);
            return true;
        }
        return allowed.has(operation.id);
    });
}

/* --------------------------------------------------------------- handler */

export async function POST(request: Request) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
        return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const emit = (event: AiStreamEvent) => {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            };
            try {
                await run(body, body.prompt as string, apiKey, emit);
            } catch (reason) {
                const rawMessage = reason instanceof Error ? reason.message : "Unknown AI provider error";
                console.error("AI design request failed", reason);
                const { error, code } = describeFailure(rawMessage);
                emit({ type: "error", error, code });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
            // Proxies that buffer would defeat the point of streaming at all.
            "X-Accel-Buffering": "no",
        },
    });
}

/** A compact view of the page, so the model can reason about it cheaply. */
function summarizeDocument(document: unknown) {
    const raw = document && typeof document === "object" ? document as { rootStyle?: unknown; elements?: unknown } : undefined;
    const elements = Array.isArray(raw?.elements) ? raw.elements : [];
    return {
        elementCount: elements.length,
        outline: elements.slice(0, 60).map((value) => {
            const element = value && typeof value === "object" ? value as Record<string, unknown> : {};
            return {
                id: element.id,
                type: element.type,
                name: element.name,
                parentId: element.parentId,
                content: typeof element.content === "string" ? element.content.slice(0, 120) : undefined,
            };
        }),
    };
}

/** Everything on the page that a rebuild replaces, as removals. */
function clearPage(document: unknown): AiDesignOperation[] {
    const raw = document && typeof document === "object" ? document as { elements?: unknown } : undefined;
    const elements = Array.isArray(raw?.elements) ? raw.elements : [];
    return elements.flatMap((value): AiDesignOperation[] => {
        const element = value && typeof value === "object" ? value as Record<string, unknown> : {};
        // Only roots are removed; the applier takes their subtrees with them.
        // Component masters are page furniture the author owns, not output.
        return typeof element.id === "string" && !element.parentId && element.componentRole !== "master"
            ? [{ kind: "remove", id: element.id }]
            : [];
    });
}

/** The page-level settings a generated design needs in place before it lands. */
function pageOperation(theme: Theme): AiDesignOperation {
    return {
        kind: "page",
        style: {
            layout: "stack",
            direction: "column",
            gap: 0,
            padT: 0,
            padR: 0,
            padB: 0,
            padL: 0,
            fullWidth: true,
            bg: theme.color.page,
            // Published as real variables so the author can restyle the whole
            // page from one place afterwards.
            variables: [
                { id: "ai-page", name: "AI / Page", type: "color", value: theme.color.page },
                { id: "ai-surface", name: "AI / Surface", type: "color", value: theme.color.surface },
                { id: "ai-accent", name: "AI / Accent", type: "color", value: theme.color.accent },
                { id: "ai-text", name: "AI / Text", type: "color", value: theme.color.text },
                { id: "ai-muted", name: "AI / Muted", type: "color", value: theme.color.muted },
                { id: "ai-line", name: "AI / Line", type: "color", value: theme.color.line },
            ],
        },
    };
}

function describeSection(section: PlannedSection, count: number) {
    const facts = [`${section.layout} · ${section.surface} band`, `${count} elements`];
    if (section.items.length) facts.push(`${section.items.length} items`);
    return facts;
}

async function run(
    body: Record<string, unknown>,
    prompt: string,
    apiKey: string,
    emit: (event: AiStreamEvent) => void,
) {
    const openrouter = createOpenRouter({ apiKey });
    const model = openrouter(process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5");
    const parsedFocus = focusSchema.safeParse(body.focus);
    const focus = parsedFocus.success ? parsedFocus.data : undefined;

    emit({ type: "phase", id: "direction", status: "start", facts: ["Reading the brief"] });

    const design = await generateStructured({
        model,
        schema: designSchema,
        name: "pagiera_design",
        maxOutputTokens: 9000,
        system: SYSTEM,
        prompt: JSON.stringify({
            request: prompt.slice(0, 4000),
            recentConversation: body.history,
            currentPage: summarizeDocument(body.document),
            editOnly: focus
                ? { id: focus.id, name: focus.name, type: focus.type, rule: "Build only inside this element. Do not restyle the page." }
                : undefined,
        }).slice(0, 24000),
    });

    const theme = resolveTheme(design.theme);
    emit({
        type: "phase",
        id: "direction",
        status: "done",
        facts: [
            design.direction,
            `${theme.mood} · ${design.theme.density} · ${design.theme.corners} corners · ${design.theme.separation}`,
            `${theme.color.page} page · ${theme.color.accent} accent · ${theme.color.text} text`,
        ].filter(Boolean),
    });

    if (design.reply) emit({ type: "reply", text: design.reply });

    if (design.intent === "conversation" || design.sections.length === 0) {
        // Nothing to build and nothing to say is not an answer. Every other
        // shortfall recovers to a default, so reaching here means the model
        // returned an effectively empty object and a retry is what helps.
        if (!design.reply.trim() && !design.direction.trim()) {
            throw new Error("No object generated: the model returned no sections and no reply.");
        }
        emit({ type: "plan", plan: { message: design.reply || design.direction, steps: [], operations: [] } });
        return;
    }

    const sections = planPage(design.sections as RawSection[], design.brand, storeImage ? MAX_GENERATED_IMAGES : 0);
    if (sections.length === 0) {
        throw new Error("No object generated: the design named no section with enough content to build.");
    }

    emit({
        type: "phase",
        id: "build",
        status: "start",
        facts: [`${sections.length} sections`, sections.map((section) => section.label).join(" → ")],
    });

    let built = 0;
    for (const [index, section] of sections.entries()) {
        emit({ type: "section", id: section.id, label: section.label, index, total: sections.length, status: "start" });
        try {
            const elements = buildSection(theme, section);
            let operations = attachImagePrompt(toAddOperations(elements), section.imagePrompt);

            if (focus) {
                const root = operations.find((operation) => operation.kind === "add" && !operation.parentId);
                if (root?.kind === "add") root.parentId = focus.id;
                operations = withinFocus(operations, focus.id);
            }

            const filled = await fillImage(operations, apiKey, storeImage);
            operations = filled.operations;

            // The page is set up once, immediately before the first section
            // lands, so the canvas never shows the old design under the new one.
            if (index === 0 && !focus) {
                operations = [
                    ...(design.intent === "build" ? clearPage(body.document) : []),
                    pageOperation(theme),
                    ...operations,
                ];
            }

            built += 1;
            // One operation per event: the wrapper, then its groups, then the
            // copy and controls visibly arrive in document order.
            for (const [at, operation] of operations.entries()) {
                emit({
                    type: "plan",
                    partial: true,
                    section: { id: section.id, label: section.label, index, total: sections.length },
                    plan: {
                        message: `${section.label} · ${at + 1}/${operations.length}`,
                        steps: [],
                        operations: [operation],
                        streamKey: section.id,
                        streamReset: at === 0,
                    },
                });
                // A short yield gives React a chance to paint each element
                // rather than batching a whole section into one frame.
                await new Promise((resolve) => setTimeout(resolve, 24));
            }

            emit({
                type: "section",
                id: section.id,
                label: section.label,
                index,
                total: sections.length,
                status: "done",
                facts: describeSection(section, operations.length),
            });
        } catch (reason) {
            // One section failing is not the page failing.
            console.warn(`AI section "${section.label}" failed`, reason);
            emit({ type: "section", id: section.id, label: section.label, index, total: sections.length, status: "failed" });
        }
    }

    if (built === 0) throw new Error("No object generated: every section failed to build.");

    emit({ type: "phase", id: "build", status: "done", facts: [`${built} of ${sections.length} sections built`] });
    emit({
        type: "plan",
        plan: {
            message: design.reply || design.direction,
            steps: sections.map((section) => `${section.label} — ${section.layout}`),
            operations: [],
        },
    });
}
