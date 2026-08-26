import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";
import type { AiDesignOperation } from "@/lib/editor/ai-types";
import { type GeneratedImage, generateImage } from "@/lib/editor/imagery";
import { ELEMENT_TYPES } from "@/lib/editor/types";

// A cheap model takes about a minute a section; seven of them in parallel
// still lands near six. Cutting the request off at five would throw away a
// page that was nearly finished.
export const maxDuration = 600;

/** Each picture is a separate paid request that takes seconds; a landing page
 *  does not need more than this many. */
const MAX_GENERATED_IMAGES = 6;

/**
 * The sections a landing page gets when the blueprint does not name any.
 *
 * Smaller models often answer the section list in a shape the schema cannot
 * take, and the tolerant parse turns that into an empty array. Falling back to
 * one generic section produced a nine-element page; falling back to the shape
 * every landing page actually has produces a page.
 */
const DEFAULT_SECTIONS = [
    { name: "Navigation", purpose: "Wordmark, a few links and one primary action", composition: "Row, space between, vertically centred", details: ["wordmark", "3-4 links", "primary button"] },
    { name: "Hero", purpose: "State what the product is and who it is for", composition: "Asymmetric split: oversized headline and supporting copy on one side, a photograph on the other", details: ["oversized headline", "supporting paragraph", "primary and secondary action", "hero photograph"] },
    { name: "Social proof", purpose: "Show who already uses it", composition: "Horizontal strip of names or a single quoted line", details: ["eyebrow label", "customer names or a short quote"] },
    { name: "Features", purpose: "Explain the three things it does best", composition: "Three-column grid of cards, each with a heading and a sentence", details: ["section heading", "three cards", "one supporting photograph"] },
    { name: "Metrics", purpose: "Give the claim a number", composition: "Row of two or three large figures with captions", details: ["2-3 metrics", "short captions"] },
    { name: "Call to action", purpose: "Ask for the next step", composition: "Centred statement with one button on a contrasting surface", details: ["statement heading", "one sentence", "primary button"] },
    { name: "Footer", purpose: "Navigation and legal", composition: "Multi-column link groups above a thin bottom bar", details: ["3-4 link columns", "wordmark", "copyright line"] },
];

/**
 * The craft rules every section is built against.
 *
 * Written as requirements rather than advice: a small model treats "consider
 * adding motion" as optional and ships none, while "every section sets these
 * fields" gets obeyed. Each line names the exact field, because guidance the
 * model cannot map onto a property produces nothing.
 */
const CRAFT = [
    "STRUCTURE. One Section wrapper with widthMode=fill and heightMode=auto, holding one Container with widthMode=fill for the content. Groups inside it are Stacks. Never use fixed widths on the wrapper or the content container.",
    "SPACING. Section padT/padB between 64 and 128, padL/padR 24 to 48. Set marginB on the Section for the gap to the next one. All spacing from 8/12/16/24/32/48/64/96.",
    "TYPE. Headings 40-72 with lineHeight 1.05-1.15; body 15-17 with lineHeight 1.5-1.6. lineHeight is a multiplier, never pixels.",
    "MOTION IS REQUIRED. Every text and media element in the section sets entrance (use \"up\" or \"fade\"), entranceDuration 500-700, and an entranceDelay staggered 60-120ms apart in reading order. Reuse entranceBezier \"0.16, 1, 0.3, 1\" everywhere.",
    "RESPONSIVE IS REQUIRED. Every element that is a row, a grid, or larger than 32px type sets mobileStyle. Rows become direction=column, grids become columns=1, headings drop roughly 40 percent, padL/padR fall to 20. Add tabletStyle wherever the desktop and mobile treatments differ.",
    "INTERACTION. Every Button and card Container sets hoverStyle. scale is a percentage — 102 for a subtle hover, never 1.02.",
    "IMAGERY. Every Image sets imagePrompt describing the photograph, leaves src empty, and sets aspectRatio so the layout holds while it loads.",
    "ALIGNMENT. justify is the parent's main axis, align its cross axis. A child with widthMode=fill cannot centre on the cross axis — use auto or fixed for centred content.",
    "COPY. Real sentences about the product. No lorem ipsum, no placeholder metrics, no 'Lorem' or 'Your text here'.",
].join("\n");

/**
 * A prose field the model writes freely.
 *
 * The limit exists to bound the payload, not to judge the answer — rejecting a
 * finished blueprint because its description ran to 520 characters throws away
 * a minute of work over nothing. It is clipped instead, with a generous outer
 * bound left in place so a runaway response still fails.
 */
const prose = (max: number, hint?: string) =>
    z.string()
        .max(max * 4)
        .transform((value) => value.slice(0, max))
        .describe(hint ?? `Keep this to about ${max} characters.`);

const styleSchema = z
    .object({
        x: z.number().optional(), y: z.number().optional(), constraintX: z.enum(["start", "center", "end", "stretch"]).optional(), constraintY: z.enum(["start", "center", "end", "stretch"]).optional(), w: z.number().positive().optional(), h: z.number().positive().optional(),
        widthMode: z.enum(["fixed", "fill", "auto"]).optional(), heightMode: z.enum(["fixed", "fill", "auto"]).optional(),
        layout: z.enum(["absolute", "stack"]).optional(), direction: z.enum(["row", "column"]).optional(),
        gap: z.number().nonnegative().optional(), padT: z.number().nonnegative().optional(), padR: z.number().nonnegative().optional(), padB: z.number().nonnegative().optional(), padL: z.number().nonnegative().optional(), marginB: z.number().nonnegative().optional().describe("Space below this element, separating it from the next one. Use it for the rhythm between sections instead of padding."),
        justify: z.enum(["start", "center", "end", "between"]).optional(), align: z.enum(["start", "center", "end", "stretch"]).optional(), wrap: z.boolean().optional(), columns: z.number().int().min(1).max(12).optional(),
        bg: z.string().optional(), gradient: z.string().optional(), color: z.string().optional(), radius: z.number().nonnegative().optional(), opacity: z.number().min(0).max(100).optional(),
        borderW: z.number().nonnegative().optional(), borderC: z.string().optional(), borderStyle: z.enum(["solid", "dashed", "dotted"]).optional(), shadow: z.string().optional(), rotate: z.number().optional(),
        fontSize: z.number().positive().optional(), fontWeight: z.string().optional(), lineHeight: z.number().min(0.85).max(2.2).optional().describe("Unitless multiplier of the font size — 1.05-1.2 for display headings, 1.4-1.6 for body. Never a pixel value: 10 would render each line ten times the type size."), letterSpacing: z.number().optional(), textAlign: z.enum(["left", "center", "right", "justify"]).optional(), textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
        overflow: z.enum(["visible", "hidden", "auto", "scroll"]).optional(), position: z.enum(["static", "sticky", "fixed", "absolute"]).optional().describe("absolute lifts this one element out of the flow and places it at x/y, leaving its siblings stacked — for badges, overlays and decorative pieces"), stickyOffset: z.number().optional(), pinSide: z.enum(["top", "bottom", "left", "right"]).optional(),
        bgImage: z.string().optional(), bgSize: z.enum(["cover", "contain", "auto"]).optional(), bgPosition: z.string().optional(), backdropBlur: z.number().nonnegative().optional(), blur: z.number().nonnegative().optional(), scale: z.number().min(1).max(500).optional().describe("Percentage scale: 100 is normal, 102 is two percent larger"), aspectRatio: z.string().optional(),
        entrance: z.enum(["none", "fade", "up", "down", "left", "right", "zoom"]).optional(), entranceDuration: z.number().nonnegative().optional(), entranceDelay: z.number().nonnegative().optional(), entranceCurve: z.enum(["ease", "spring"]).optional(), entranceBezier: z.string().optional(), springStiffness: z.number().positive().optional(), springDamping: z.number().positive().optional(), cursor: z.enum(["auto", "default", "pointer", "text", "grab", "zoom-in", "none"]).optional(), hidden: z.boolean().optional(),
    })
    .strict();
const bindingsSchema = z.record(z.string(), z.string().max(60)).optional();
const interactionSchema = z.object({ trigger: z.literal("click"), action: z.enum(["navigate", "scroll-to", "toggle-layer", "show-layer", "hide-layer"]), value: z.string().max(2000), target: z.enum(["_self", "_blank"]).optional() }).optional();
const loopSchema = z.object({ type: z.enum(["pulse", "float", "spin"]), duration: z.number().min(100).max(20000) }).optional();

const pageStyleSchema = z.object({ documentMode: z.enum(["page", "component"]).optional(), maxWidth: z.number().min(1).max(4000).optional(), canvasHeight: z.number().min(1).max(12000).optional(), fullWidth: z.boolean().optional(), bg: z.string().optional(), layout: z.enum(["absolute", "stack"]).optional(), direction: z.enum(["row", "column"]).optional(), gap: z.number().nonnegative().optional(), padT: z.number().nonnegative().optional(), padR: z.number().nonnegative().optional(), padB: z.number().nonnegative().optional(), padL: z.number().nonnegative().optional(), align: z.enum(["start", "center", "end", "stretch"]).optional(), fontFamily: z.string().optional(), variables: z.array(z.object({ id: z.string().max(60), name: z.string().max(60), type: z.enum(["color", "number"]), value: z.union([z.string(), z.number()]) })).max(24).optional() }).strict();

/**
 * The wire shape for one operation.
 *
 * Deliberately one flat object with an enum discriminator rather than a
 * discriminated union. A `oneOf` at this depth makes providers drop structured
 * output entirely and answer with fenced markdown in an invented format, which
 * surfaces as "could not parse the response" and an empty plan. The
 * kind-specific fields are therefore optional here and narrowed in
 * `toOperations` once the response is back.
 */
const operationSchema = z.object({
    kind: z.enum(["add", "update", "remove", "page"]),
    /** New elements only: the handle later operations use as `parentId`. */
    ref: z.string().min(1).max(60).optional(),
    /** Existing elements only, for update and remove. */
    id: z.string().max(120).optional(),
    type: z.enum(ELEMENT_TYPES).optional(),
    parentId: z.string().nullable().optional(),
    content: z.string().max(5000).optional(),
    src: z.string().max(2000).optional(),
    /** Image elements: describe the picture and one will be generated for it. */
    imagePrompt: z.string().max(500).optional().describe("For an Image element, what the photograph should show. Leave src empty and let this be generated. Describe subject, setting and light in one sentence; never ask for text, logos or UI in the picture."),
    href: z.string().max(2000).optional(),
    style: styleSchema.optional(),
    tabletStyle: styleSchema.optional(),
    mobileStyle: styleSchema.optional(),
    hoverStyle: styleSchema.optional(),
    pressStyle: styleSchema.optional(),
    loop: loopSchema,
    draggable: z.boolean().optional(),
    styleBindings: bindingsSchema,
    interaction: interactionSchema,
    /** `page` operations only — settings for the document, not an element. */
    pageStyle: pageStyleSchema.optional(),
});

/**
 * Operations, and nothing else.
 *
 * Asking for a summary in the same call reliably cost the whole answer: the
 * model wrote `message` and `steps`, closed the steps array and ended the tool
 * call there, every time, with no operations at all. Reordering the fields did
 * not move it — the prompt asked for prose first and the model obliged, then
 * considered itself finished. The summary is written from the plan afterwards
 * instead, which is cheaper and cannot fail.
 */
export const planSchema = z.object({
    operations: z.array(operationSchema).max(100),
});

const blueprintSchema = z.object({
    intent: z.enum(["conversation", "modify", "build-page"]),
    direction: prose(500),
    palette: z.object({
        background: z.string(),
        surface: z.string(),
        primary: z.string(),
        text: z.string(),
        muted: z.string(),
        border: z.string(),
    }),
    typography: z.object({
        heading: z.string(),
        body: z.string(),
        scale: z.array(z.number()).max(7),
    }).catch({ heading: "", body: "", scale: [] }),
    // Advisory: these steer the draft prompt and the progress line. A model
    // that writes one of them in the wrong shape has still done the thinking,
    // so a slip here falls back rather than throwing the run away.
    signature: z.object({
        visualMotif: prose(240),
        heroComposition: prose(320),
        motionRhythm: prose(240),
        avoid: z.array(prose(120)).max(8),
    }).catch({ visualMotif: "", heroComposition: "", motionRhythm: "", avoid: [] }),
    sections: z.array(
        z.object({
            name: prose(80),
            purpose: prose(240),
            composition: prose(320),
            details: z.array(prose(200)).max(8),
        }),
    ).max(12).catch([]),
});

type FlatOperation = z.infer<typeof operationSchema>;
type FlatPlan = z.infer<typeof planSchema>;

/** Persists one generated image and returns the URL to reference it by. */
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
 * Turns every `imagePrompt` in a plan into a real picture.
 *
 * Runs after the layout is settled and never throws: an image that fails to
 * generate leaves its element with the placeholder it already had, which is a
 * far better outcome than losing a finished page over one picture. Generation
 * is capped because each image is a separate paid request that takes seconds.
 */
async function fillImagery(
    operations: AiDesignOperation[],
    apiKey: string,
    emit: (event: AiStreamEvent) => void,
    store?: ImageStore,
): Promise<AiDesignOperation[]> {
    const promptOf = (operation: AiDesignOperation) =>
        operation.kind === "add" || operation.kind === "update"
            ? operation.imagePrompt?.trim() || undefined
            : undefined;

    const wanted = operations.flatMap((operation, index) => {
        const prompt = promptOf(operation);
        return prompt ? [{ index, prompt }] : [];
    });
    if (wanted.length === 0 || !store) return operations;

    const budget = wanted.slice(0, MAX_GENERATED_IMAGES);
    emit({ type: "phase", id: "imagery", status: "start" });

    const model = process.env.OPENROUTER_IMAGE_MODEL;
    const generated = new Map<number, string>();
    await Promise.all(
        budget.map(async ({ index, prompt }) => {
            try {
                const image = await generateImage({ prompt, apiKey, model });
                if (image) generated.set(index, await store(image));
            } catch {
                // One picture is never worth losing the page over.
            }
        }),
    );

    emit({
        type: "phase",
        id: "imagery",
        status: "done",
        facts: [
            `${generated.size} of ${wanted.length} images generated`,
            ...budget.slice(0, 3).map((entry) => entry.prompt.slice(0, 90)),
        ],
    });

    return operations.map((operation, index) => {
        const src = generated.get(index);
        return src ? { ...operation, src } : operation;
    });
}

const focusSchema = z.object({
    id: z.string().min(1).max(120),
    name: z.string().max(120),
    type: z.string().max(40),
});

function parseFocus(value: unknown) {
    const parsed = focusSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
}

/**
 * Drops anything a scoped run was not allowed to touch.
 *
 * Telling the model to stay inside one element is a request, not a guarantee —
 * a run that quietly rewrote the rest of the page while the author asked about
 * one button would be worse than not offering the scope at all. `allowed`
 * grows as the run adds children, so new elements parented into the focused
 * subtree are kept while edits to unrelated ids are removed.
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

/**
 * Asks the model for one structured object, through a forced tool call.
 *
 * `Output.object` and `generateObject` both lean on `response_format`, which
 * OpenRouter accepts and then silently ignores for these models: the request
 * succeeds, no error is raised, and the model answers with fenced HTML or TSX
 * in whatever shape it likes. A forced tool call is honoured, and the arguments
 * come back matching the schema — including the editor's own field names
 * rather than invented CSS ones.
 */
async function generateStructured<T>(options: {
    model: Parameters<typeof generateText>[0]["model"];
    schema: z.ZodType<T>;
    name: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
    maxRetries?: number;
}): Promise<T> {
    // The same request that fails once frequently succeeds on the next
    // attempt: the answer is cut off mid-JSON by the provider rather than
    // being something the model cannot produce. Giving up on the first
    // truncation throws away a finished blueprint and a minute of waiting.
    let last: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await attemptStructured(options);
        } catch (reason) {
            last = reason;
            const message = reason instanceof Error ? reason.message : "";
            // A schema mismatch on a field will repeat; only retry the flaky
            // failures, and never sit in a loop over a real disagreement.
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
    maxRetries?: number;
}): Promise<T> {
    const { toolCalls } = await generateText({
        model: options.model,
        maxRetries: options.maxRetries ?? 2,
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

    // Tool arguments arrive as whatever the model wrote — usually an object,
    // sometimes a JSON string, and occasionally that string is cut off part
    // way through. Parsing here turns any of those into one clear error rather
    // than a TypeError deep in the caller.
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
 * Narrows the flat wire operations back to the editor's tagged shape.
 *
 * Anything missing the field its kind depends on — an `add` with no type, an
 * `update` naming no element — is dropped rather than passed on, because the
 * applier would silently do nothing with it and the run would report changes
 * it never made.
 */
export function toOperations(plan: FlatPlan): AiDesignOperation[] {
    return plan.operations.flatMap((operation: FlatOperation): AiDesignOperation[] => {
        const shared = {
            content: operation.content, src: operation.src, href: operation.href, imagePrompt: operation.imagePrompt,
            style: operation.style, tabletStyle: operation.tabletStyle, mobileStyle: operation.mobileStyle,
            hoverStyle: operation.hoverStyle, pressStyle: operation.pressStyle,
            loop: operation.loop, draggable: operation.draggable,
            styleBindings: operation.styleBindings, interaction: operation.interaction,
        };
        switch (operation.kind) {
            case "add": {
                // Models reach for `id` as often as `ref` when naming something
                // they are creating; both mean the same handle here.
                const ref = operation.ref ?? operation.id;
                if (!ref || !operation.type) return [];
                return [{ kind: "add" as const, ref, type: operation.type, parentId: operation.parentId, ...shared }];
            }
            case "update":
                return operation.id ? [{ kind: "update" as const, id: operation.id, ...shared }] : [];
            case "remove":
                return operation.id ? [{ kind: "remove" as const, id: operation.id }] : [];
            case "page":
                return operation.pageStyle ? [{ kind: "page" as const, style: operation.pageStyle }] : [];
            default:
                return [];
        }
    });
}

/**
 * One line of the progress stream.
 *
 * The request runs three real model passes that take tens of seconds between
 * them, so the client needs to hear about each as it lands. `facts` carries
 * what the pass actually decided — the palette it chose, the sections it
 * planned — rather than a generic label, because a progress step that cannot
 * be wrong is not telling the reader anything.
 */
export type AiStreamEvent =
    | { type: "phase"; id: "blueprint" | "draft" | "polish" | "imagery"; status: "start"; facts?: string[] }
    | { type: "phase"; id: "blueprint" | "draft" | "polish" | "imagery"; status: "done" | "skipped"; facts?: string[] }
    | { type: "plan"; plan: unknown }
    | { type: "error"; error: string; code?: string };

/**
 * Turns a provider failure into something the author can act on.
 *
 * These three fail in genuinely different ways and want different responses,
 * so they must not share one message. Telling someone their answer was cut
 * short when the model actually could not satisfy the schema sends them to
 * retry the same request forever.
 */
export function describeFailure(rawMessage: string): { error: string; code: string } {
    const model = process.env.OPENROUTER_MODEL ?? "the configured model";

    // Ran out of room mid-answer: a smaller request genuinely helps.
    if (/unexpected end|unterminated|cut short|max tokens|maximum context|too long|length limit/i.test(rawMessage)) {
        return {
            error: "AI yanıtı tamamlanmadan kesildi. İstek korunuyor; tekrar deneyebilir veya daha küçük bir bölüm isteyebilirsin.",
            code: "INCOMPLETE_AI_RESPONSE",
        };
    }

    // Answered, but not in the shape the editor needs. Retrying rarely helps;
    // the model is the variable worth changing.
    if (/no object generated|no output generated|did not match schema|could not parse/i.test(rawMessage)) {
        // The parser names the offending field; passing it through beats a
        // generic complaint, and recommending the model already in use — which
        // this used to do — reads as the tool not knowing its own settings.
        const detail = /\(([^)]+)\)/.exec(rawMessage)?.[1];
        const advice = model.includes("claude-sonnet-4.5")
            ? "Daha küçük bir bölüm istemeyi dene."
            : "OPENROUTER_MODEL=anthropic/claude-sonnet-4.5 ile dene, ya da daha küçük bir bölüm iste.";
        return {
            error: `“${model}” Pagiera'nın tasarım şemasına uygun bir çıktı üretemedi${detail ? ` — ${detail}` : ""}. ${advice}`,
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

export async function POST(request: Request) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 503 });

    const body = (await request.json().catch(() => ({}))) as { prompt?: unknown; document?: unknown; breakpoint?: unknown; history?: unknown; focus?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) return Response.json({ error: "Prompt is required." }, { status: 400 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const emit = (event: AiStreamEvent) => {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            };
            try {
                await run({ ...body, prompt: body.prompt as string }, apiKey, emit);
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

async function run(
    body: { prompt: string; document?: unknown; breakpoint?: unknown; history?: unknown; focus?: unknown },
    apiKey: string,
    emit: (event: AiStreamEvent) => void,
) {
    {

    const openrouter = createOpenRouter({ apiKey });
    const model = openrouter(
        process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5",
    );
    const focus = parseFocus(body.focus);
    const requestContext = {
        request: body.prompt.slice(0, 4000),
        activeBreakpoint: body.breakpoint,
        recentConversation: body.history,
        document: body.document,
        // Named `editOnly` rather than `focus` so the constraint reads as one
        // in the prompt itself, not as a hint the model may weigh up.
        editOnly: focus
            ? { id: focus.id, name: focus.name, type: focus.type, rule: "Change only this element and its descendants. Do not touch anything else on the page." }
            : undefined,
    };

    emit({ type: "phase", id: "blueprint", status: "start" });
    const blueprint = await generateStructured({
        model,
        schema: blueprintSchema,
        name: "pagiera_blueprint",
        maxRetries: 2,
        maxOutputTokens: 5000,
        system: `You are an award-winning digital art director and UX architect. Plan before building.
Create a specific, contemporary visual direction—not generic SaaS filler. Establish one exact palette, typography hierarchy, spacing rhythm and a section-by-section composition. The signature must name one repeatable visual motif, a concrete asymmetric hero composition, a motion rhythm and explicit clichés to avoid.
For a full page, plan 5-8 substantial sections with meaningful visual variety: navigation, hero, proof, editorial or feature storytelling, metrics/testimonial, conversion CTA and footer. Each section needs layered details, not only a heading and paragraph.
Avoid the default AI look: endless equal cards, centered text in every section, neon purple gradients, excessive pills, fake dashboard rectangles, glow on everything, and identical rounded boxes. Mix editorial whitespace with one or two dense moments. Each section must have a distinct silhouette while sharing the same system.
Use the existing document intelligently. If the user asks a conversational question, set intent=conversation and keep sections empty. Preserve good existing work unless replacement was requested.
Treat motion as part of the visual direction: define a restrained entrance rhythm, one shared easing character, and a clear focal moment. Animation must reinforce hierarchy rather than decorate every node.`,
        prompt: JSON.stringify(requestContext).slice(0, 60000),
    });

    emit({
        type: "phase",
        id: "blueprint",
        status: "done",
        facts: [
            blueprint.direction.slice(0, 160),
            `Palette · ${blueprint.palette.background} / ${blueprint.palette.primary} / ${blueprint.palette.text}`,
            blueprint.typography.heading ? `Type · ${blueprint.typography.heading} over ${blueprint.typography.body}` : "",
            blueprint.sections.length
                ? `${blueprint.sections.length} sections · ${blueprint.sections.map((section) => section.name).slice(0, 6).join(", ")}`
                : "No structural change — answering in conversation",
        ],
    });

    emit({ type: "phase", id: "draft", status: "start" });

    /**
     * One section at a time.
     *
     * Asked for a whole page in a single call the model answers with an empty
     * object: the request carries the full brief, the document and a schema
     * covering every element property, and it simply gives up. The same schema
     * against one section's worth of work returns a complete answer, so the
     * page is built section by section and the results concatenated.
     *
     * Refs are namespaced per section because each call invents its own, and
     * two sections would otherwise both call their wrapper "hero".
     */
    const planned = blueprint.sections.length > 0
        ? blueprint.sections.slice(0, 10)
        : blueprint.intent === "build-page"
            ? DEFAULT_SECTIONS
            : [{ name: "Page", purpose: body.prompt.slice(0, 200), composition: "", details: [] }];

    // Sections do not depend on one another, so they are generated at the same
    // time. In sequence a page costs the sum of every call — minutes on a cheap
    // model — while together it costs the slowest one.
    let built = 0;
    const results = await Promise.all(
        planned.map(async (section, index) => {
            try {
                const part = await generateStructured({
                    model,
                    schema: planSchema,
                    name: "pagiera_design_plan",
                    maxRetries: 1,
                    maxOutputTokens: 8000,
                    system: `You are Pagiera's senior web designer. Return editor operations for ONE section of a page.
Every operation is one flat object with a "kind" of add, update, remove or page.
add: set "ref" (your own handle) and "type"; later operations point at it through "parentId". The section's own wrapper has no parentId.
Start with one Section element, then build its contents inside it. Do not build any other section.
${CRAFT}`,
                    prompt: JSON.stringify({
                        request: requestContext.request,
                        palette: blueprint.palette,
                        typography: blueprint.typography,
                        signature: blueprint.signature,
                        section,
                        position: `section ${index + 1} of ${planned.length}`,
                    }).slice(0, 20000),
                });

                built += 1;
                emit({
                    type: "phase",
                    id: "draft",
                    status: "start",
                    facts: [`${section.name} · ${part.operations.length} operations`],
                });

                // Each call invents its own handles, so two sections would both
                // call their wrapper "hero" without a namespace.
                const namespace = `s${index}-`;
                return part.operations.map((operation) => ({
                    ...operation,
                    ref: operation.ref ? namespace + operation.ref : operation.ref,
                    parentId: operation.parentId ? namespace + operation.parentId : operation.parentId,
                }));
            } catch (sectionError) {
                // One section failing is not the page failing; the rest still
                // lands and the author can ask again for the missing piece.
                console.warn(`AI section "${section.name}" failed`, sectionError);
                emit({ type: "phase", id: "draft", status: "start", facts: [`${section.name} · failed`] });
                return [];
            }
        }),
    );

    const collected: FlatOperation[] = results.flat();

    if (collected.length === 0) {
        throw new Error("No object generated: every section came back empty.");
    }

    const draft: FlatPlan = { operations: collected.slice(0, 100) };
    emit({
        type: "phase",
        id: "draft",
        status: "done",
        facts: [`${built} of ${planned.length} sections built`, `${draft.operations.length} operations`],
    });

    if (!draft) throw new Error("The model returned an empty design plan.");

    // Model-authored step text is free-form and occasionally degenerates into
    // punctuation or a bare fragment. Those add nothing to a progress line, so
    // they never reach the panel.
    /** What the plan did, read off the plan rather than asked for. */
    const describePlan = (plan: FlatPlan) => {
        const adds = plan.operations.filter((operation) => operation.kind === "add");
        const types = adds.reduce<Record<string, number>>((tally, operation) => {
            const key = operation.type ?? "element";
            tally[key] = (tally[key] ?? 0) + 1;
            return tally;
        }, {});
        return Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `${count} ${type}`);
    };

    const countKinds = (plan: typeof draft) => {
        const kinds = plan.operations.reduce<Record<string, number>>((tally, operation) => {
            tally[operation.kind] = (tally[operation.kind] ?? 0) + 1;
            return tally;
        }, {});
        return Object.entries(kinds).map(([kind, count]) => `${count} ${kind}`).join(", ") || "no operations";
    };

    emit({
        type: "phase",
        id: "draft",
        status: "done",
        facts: [`${draft.operations.length} operations · ${countKinds(draft)}`, describePlan(draft).join(", ")],
    });

    // No review pass. It rewrote the entire page in one call — the request
    // that fails outright on a large brief, and the reason sections are built
    // separately in the first place. Each section is already small enough to
    // come back complete, and the craft rules are enforced per section.
    const finalPlan = draft;
    emit({ type: "phase", id: "polish", status: "skipped", facts: ["Sections are reviewed as they are built"] });

    // A build that produced nothing is a failed run, not a quiet success.
    const narrowed = focus
        ? withinFocus(toOperations(finalPlan), focus.id)
        : toOperations(finalPlan);
    if (blueprint.intent !== "conversation" && narrowed.length === 0) {
        throw new Error(
            "The model planned the design but returned no editor operations. This usually means the configured model cannot produce Pagiera's structured plan — try OPENROUTER_MODEL=anthropic/claude-sonnet-4.5, or ask for a smaller section.",
        );
    }

    const withImagery = await fillImagery(narrowed, apiKey, emit, storeImage);

    emit({
        type: "plan",
        plan: {
            message: `${blueprint.direction.slice(0, 220)} — ${withImagery.length} changes applied.`,
            steps: describePlan(finalPlan),
            operations: withImagery,
        },
    });
    }
}
