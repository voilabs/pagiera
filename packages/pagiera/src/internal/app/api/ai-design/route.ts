import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";
import type { AiDesignOperation } from "@/lib/editor/ai-types";
import { composeFragment, composeSection, PAGE_MEASURE } from "@/lib/editor/ai/compose";
import { BACKDROPS } from "@/lib/editor/ai/theme";
import { ALIGNS, BUTTON_KINDS, JUSTIFIES, LIMITS, normalizeSection, RATIOS, type Section, SIZES, SURFACES, TEXT_ROLES, TONES, WIDTHS } from "@/lib/editor/ai/dsl";
import { toAddOperations } from "@/lib/editor/ai/ops";
import { fillThemeBrief, hashSeed, pickBySeed, resolveTheme, type Theme } from "@/lib/editor/ai/theme";
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

/**
 * How many times one section may be asked for before its brief is compiled
 * instead. Smaller models drop a section perhaps one time in seven, and almost
 * always succeed on the next attempt.
 */
const SECTION_ATTEMPTS = 3;

/**
 * The fewest sections a page can be made of before the outline is questioned.
 * A hero and a footer is not a landing page, and some models stop there.
 */
const MINIMUM_SECTIONS = 4;

/** Reported on every run so a stale build is visible rather than mysterious. */
const ENGINE_BUILD = "dsl-3 · craft-only";

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

/**
 * One node of the layout language, described flat.
 *
 * `children` is deliberately untyped rather than recursive. A self-referencing
 * JSON Schema is either rejected or silently flattened by several providers,
 * and expanding it to a fixed depth multiplies an already large tool
 * definition by five. Naming every field and enum once, at the top level, is
 * what the model actually reads; the nesting rules live in the prompt, and
 * `normalizePage` is the thing that truly validates the tree — it walks any
 * depth, drops what it cannot understand and collapses what would render
 * empty, so a malformed branch costs that branch and nothing else.
 */
const nodeSchema = z.object({
    // Recover fields independently. Catching the whole node used to turn a
    // perfectly useful hero tree into one spacer when the model misspelled a
    // single enum (for example `align: "middle"`). The DSL normaliser below
    // already knows how to discard an invalid property safely.
    t: soft(z.enum(["box", "grid", "text", "button", "image", "chip", "rule", "space"]), "box").describe("The kind of node."),
    children: soft(z.array(z.unknown()).max(24).optional(), undefined).describe("Nodes inside a box or grid, in the same shape as this one."),
    dir: soft(z.enum(["row", "column"]).optional(), undefined).describe("box only. Defaults to column."),
    columns: soft(z.number().int().min(1).max(LIMITS.maxColumns).optional(), undefined).describe("grid only."),
    span: soft(z.number().int().min(1).max(LIMITS.maxSpan).optional(), undefined).describe("Columns this node spans inside a grid."),
    grow: soft(z.number().int().min(0).max(12).optional(), undefined).describe("Share of leftover space along the parent row."),
    gap: soft(z.enum(SIZES).optional(), undefined),
    pad: soft(z.enum(SIZES).optional(), undefined).describe("box only. Inner padding."),
    align: soft(z.enum(ALIGNS).optional(), undefined).describe("Cross-axis alignment of children."),
    selfAlign: soft(z.enum(ALIGNS).optional(), undefined),
    justify: soft(z.enum(JUSTIFIES).optional(), undefined).describe("Main-axis distribution of children."),
    width: soft(z.enum(WIDTHS).optional(), undefined).describe("full fills; measure caps at a readable line length; narrow is tighter; auto shrinks to content; half splits a row evenly."),
    wrap: soft(z.boolean().optional(), undefined),
    tone: soft(z.enum(TONES).optional(), undefined).describe("box only. card is a panel, outline is a bordered box, accent and inverse are filled and restyle everything inside them."),
    rounded: soft(z.boolean().optional(), undefined),
    role: soft(z.enum(TEXT_ROLES).optional(), undefined).describe("text only. What the text is; the theme decides its size."),
    value: soft(prose(600).optional(), undefined).describe("text only. The words."),
    caps: soft(z.boolean().optional(), undefined).describe("text only. Uppercase; honoured for eyebrow and small."),
    label: soft(prose(80).optional(), undefined).describe("button and chip only."),
    kind: soft(z.enum(BUTTON_KINDS).optional(), undefined).describe("button only."),
    prompt: soft(prose(400).optional(), undefined).describe("image only. Describe a photograph — never text, logos, dashboards or UI."),
    ratio: soft(z.enum(RATIOS).optional(), undefined).describe("image only."),
    size: soft(z.enum(SIZES).optional(), undefined).describe("space only."),
});

/** What a node that could not be understood degrades to; the normaliser drops it. */
const EMPTY_NODE = { t: "space" } as unknown as z.infer<typeof nodeSchema>;

const sectionSchema = z.object({
    name: soft(prose(40), "").describe("What this section is, for the layers panel."),
    surface: z.enum(SURFACES).optional().describe("The band this section is painted on."),
    width: z.enum(["full", "wide", "normal", "narrow"]).optional().describe("The measure the content sits inside."),
    pad: z.enum(SIZES).optional().describe("Vertical breathing room. Omit for the theme's own rhythm."),
    sticky: z.boolean().optional().describe("Pins the section to the top of the viewport. Use for a navigation bar and nothing else."),
    backdrop: z.enum(BACKDROPS).optional().describe("An atmospheric background painted behind this section."),
    // Every element is caught individually. Catching only the array meant a
    // single malformed node emptied the whole section — and catching only the
    // section list meant one section without a name emptied the entire page,
    // silently, with no error and no output.
    content: soft(z.array(soft(nodeSchema, EMPTY_NODE)).max(20), []).describe("The composition, as nodes."),
});

/**
 * An axis the model may leave out.
 *
 * Deliberately recovers to `undefined` rather than to a value: "unspecified"
 * and "chose the default" have to stay distinguishable, because the route
 * fills the gaps from the brief's own seed. Collapsing them to a fixed default
 * is exactly what made every vaguely-answered request produce the same page.
 */
const axis = <const T extends readonly [string, ...string[]]>(values: T) =>
    z.enum(values).optional().catch(undefined);

const themeSchema = z.object({
    mood: axis(["light", "dark"]),
    background: soft(prose(24), "").describe("Page colour as a hex value."),
    accent: soft(prose(24), "").describe("Brand colour as a hex value."),
    typeScale: axis(["compact", "balanced", "dramatic"]),
    density: axis(["tight", "regular", "airy"]),
    corners: axis(["square", "soft", "round", "pill"]),
    separation: axis(["flat", "line", "raised"]),
    finish: axis(["matte", "tinted", "luminous", "vivid"]).describe("How much light the page appears to have. matte: flat colour. tinted: a wash behind the hero and a gradient primary button. luminous: adds glass navigation, gradient bands and tinted feature cards. vivid: adds coloured glow under the primary actions."),
    headingFont: prose(40).optional(),
    bodyFont: prose(40).optional(),
});

const DEFAULT_THEME: z.infer<typeof themeSchema> = { background: "", accent: "" };

/** A section that could not be understood; the normaliser drops it. */
const EMPTY_SECTION: z.infer<typeof sectionSchema> = { name: "", content: [] };

/**
 * The one object the model returns.
 *
 * `theme` is a handful of parameters, not a palette of finished colours — the
 * route derives every role from them so contrast is guaranteed rather than
 * hoped for.
 */
/**
 * The page's outline: what each section is, not yet how it is built.
 *
 * Composition is asked for separately, one section at a time. Asking for the
 * direction, the theme and every section's full node tree in a single answer
 * reliably exhausted smaller models: they wrote the theme, wrote a thoughtful
 * direction, and then closed the tool call with `sections: []`. That failed
 * silently — the canvas kept the previous page, so it looked like the engine
 * was producing the same design over and over when it was producing nothing.
 */
const outlineSchema = z.object({
    name: soft(prose(40), "").describe("What this section is."),
    surface: z.enum(SURFACES).optional().describe("The band it is painted on."),
    width: z.enum(["full", "wide", "normal", "narrow"]).optional(),
    backdrop: z.enum(BACKDROPS).optional(),
    sticky: z.boolean().optional().describe("Only for a navigation bar."),
    // Two different things, and confusing them put stage directions on a
    // customer's page. `brief` is an instruction to yourself about how to
    // arrange this section and is never shown to anyone; `headline` and
    // `summary` are finished copy that a reader will see.
    brief: soft(prose(320), "").describe("Private note to yourself: how this section should be arranged. Never displayed."),
    headline: soft(prose(160), "").describe("The section's real headline, as a reader will see it. Finished copy — never a description of the layout."),
    summary: soft(prose(280), "").describe("One real supporting sentence a reader will see. Finished copy, not a description."),
});

const designSchema = z.object({
    intent: soft(z.enum(["build", "modify", "conversation"]), "build"),
    reply: soft(prose(600), "").describe("What to tell the author, in their own language. For a question, this is the whole answer."),
    brand: soft(prose(60), ""),
    direction: soft(prose(300), "").describe("The art direction in one or two sentences. Name the design language you chose."),
    theme: soft(themeSchema, DEFAULT_THEME),
    sections: soft(z.array(soft(outlineSchema, { name: "", brief: "", headline: "", summary: "" })).max(14), []),
});

/** One section's composition, asked for on its own. */
const contentSchema = z.object({
    content: soft(z.array(soft(nodeSchema, EMPTY_NODE)).max(20), []).describe("The composition for this section, as nodes."),
});


/* ------------------------------------------------------------------ prompt */

const DSL_GUIDE = `A section is { name, surface, width, pad, sticky, content: [node] }.
  surface: ${SURFACES.join(" | ")} — the band it is painted on. Alternate deliberately; most sections are "page".
  width:   full | wide | normal | narrow — the measure the content sits inside.
  sticky:  true only for a navigation bar.
  backdrop: ${BACKDROPS.join(" | ")} — the atmosphere behind the content. wash and spotlight are soft light from one direction; aurora and mesh are several coloured lights; grid is a hairline lattice; vignette darkens the edges. A hero is where this earns its keep. Do not put one on every section.

A node is one of:
  { t:"box", dir, gap, pad, align, justify, width, wrap, tone, rounded, children:[...] }
      A row or a column. This is how you compose. Nest them freely.
      tone: plain (default) | card | outline | accent | inverse.
      An accent or inverse box restyles everything inside it, so its text stays legible automatically.
  { t:"grid", columns, gap, align, children:[...] }
      Children may carry span to take more than one column — that is how a layout stops being a row of equal cards.
  { t:"text", role, value, tone, align, width, caps }
      role: ${TEXT_ROLES.join(" | ")}.
  { t:"button", label, kind }        kind: ${BUTTON_KINDS.join(" | ")}
  { t:"image", prompt, ratio, width }
  { t:"chip", label }                A small pill: a badge, a tag, a step marker.
  { t:"rule" }                       A hairline.
  { t:"space", size }                Deliberate empty space.

Every node may set span, selfAlign and grow.
Sizes are always one of: ${SIZES.join(" | ")}. Never a number of pixels.`;

const SYSTEM = `You are an art director and copywriter. You design the page; a compiler builds it.

You never write CSS, pixels, hex codes per element or breakpoints. You describe a theme and a composition, and the compiler resolves every colour against its background, sizes type at every breakpoint, and folds rows on a phone. Nothing you write can break the page, so design the page you actually want rather than the safe one.

HOW TO WORK.

1. READ THE BRIEF FOR ITS ARGUMENT. Before choosing anything visual, decide what a visitor has to believe, and in what order, for this page to work. That sequence is the page. A product with an unbelievable claim needs proof early; one with an unfamiliar process needs the how before the what; one whose price is the argument leads with it. Length follows from the argument — some pages need four sections, some eleven.

2. CHOOSE A THEME FROM THE SUBJECT. A mood, a page colour, a brand colour and five axes. Every other colour is derived from your two by contrast maths, so those two are the whole palette decision. Nothing here has a default and nothing is safer than anything else: pure white, warm paper, sand, deep ink and near-black are all available, as are saturated colours at full strength. The axes are typeScale, density, corners, separation and finish; name every one of them, because an axis you leave out is a decision handed to a system that does not know what this brand is.

3. COMPOSE EACH SECTION. Say what it must contain, then build it out of boxes and grids.

CRAFT — the things that separate a designed page from a stacked one.

HIERARCHY. Every section has exactly one thing it is for. Set that at the largest size in the section and let everything else be visibly smaller. Two elements competing at the same size means neither is the point.

MEASURE. Running text is capped with width "measure" or "narrow"; a display headline is not. Text that runs the full width of a wide monitor is unreadable regardless of how good it is.

RHYTHM. Sections should not all feel the same weight. Alternate the surface, vary the vertical padding, and let at least one section be noticeably denser or emptier than its neighbours. A page of evenly spaced equal bands reads as a list.

ASYMMETRY. grow makes a row 2:1 or 3:2 instead of 50/50, and span makes one grid cell wider than its neighbours. A perfectly even split is what you get when nobody decided; an uneven one is visibly a decision.

FOCAL POINTS. tone gives one box the accent or inverse fill. Used once or twice on a page it creates somewhere for the eye to land; used everywhere it creates noise.

SEPARATION. Sections can be divided by a rule, by space, or by a change of surface — not only by putting a border around everything. Cards are one option among several, not the default container.

NESTING. Composition happens in depth: a row inside a grid cell, a card holding its own grid. A flat list of siblings is rarely the best answer to anything.

REPETITION. If two sections end up with the same internal shape, one of them has not been designed. Vary the arrangement even when the content type is similar.

COPY. Every headline makes a concrete, specific claim about this subject; every supporting sentence explains or evidences it. Never filler, never invented awards, customers or metrics, never placeholder text.

Give each section a headline and a supporting sentence as finished copy, plus a private note to yourself about how it should be arranged. The note is never displayed. Do not write the note where copy belongs: "a navigation bar with the studio's name and a contact link" describes a layout — it is not something a visitor reads.

Images: request one only where a photograph genuinely adds something, and describe a real photograph.

If the author asked a question rather than for a design, set intent=conversation, answer them in the reply field, and return no sections. Write the reply in the same language the author used.`;

/**
 * The prompt for one section, composed on its own.
 *
 * Deliberately short. The direction pass carries the essays about design
 * languages and failure modes; by this point those decisions are made, and
 * what is left is a single compositional problem. A long system prompt here
 * would eat the output budget that the composition itself needs.
 */
const SECTION_SYSTEM = `You compose one section of a page that has already been art-directed.

You write only the composition, in this layout language. You never write CSS, pixels, hex codes or breakpoints — the compiler resolves colour, type and responsiveness for you, so nothing you write can break the page.

${DSL_GUIDE}

Build the section its brief describes, in the design language given to you. Use the tools that make a composition rather than a list:
- span, so a grid is not a row of equal cards
- tone, for one focal panel rather than a border around everything
- width, so running text is capped and a display heading is not
- grow, so a split is 2:1 rather than 50/50
- rule and space, so a section can be separated by air instead of boxes
- nesting, which is where composition actually happens

The section you are given carries a headline and a summary that are real copy, and a howToArrange note that is an instruction to you. Build the composition the note describes, and write finished copy — concrete, specific claims about this product. Never place the note, or any description of a layout, into a text node: no page should read "a simple navigation bar with the studio's name". Never use filler or placeholder text. Satisfy the composition constraints you are given.

Return only this section. Do not repeat the navigation or the footer unless this section is one.`;

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
 * Asks the model for one structured object.
 *
 * `generateObject` leans on `response_format`, which OpenRouter accepts and
 * then silently ignores for several models: the request succeeds and the model
 * answers with fenced prose. A forced tool call is honoured where tools exist,
 * and `attemptStructured` falls back to plain JSON where they do not.
 */
async function generateStructured<T>(options: {
    model: Parameters<typeof generateText>[0]["model"];
    schema: z.ZodType<T>;
    name: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
    channel: Channel;
}): Promise<T> {
    let last: unknown;
    // A truncated or refused answer usually succeeds on the next attempt; a
    // genuine schema disagreement will not, so only the recoverable failures
    // are retried.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await attemptStructured(options);
        } catch (reason) {
            last = reason;
            const message = reason instanceof Error ? reason.message : "";
            if (!/cut short|did not call the tool|contained no JSON|replied with nothing|Unexpected|JSON/i.test(message)) throw reason;
        }
    }
    throw last;
}

/**
 * How this run is talking to the model.
 *
 * Tool calling is the better channel — the arguments come back already shaped —
 * but a large share of the models available through OpenRouter cannot use tools
 * at all, and asking them to produces an error before a single section is
 * designed. The first time that happens the run drops to plain JSON for good,
 * so the cost of the discovery is one request rather than one per call.
 */
type Channel = { tools: boolean };

/**
 * Errors that mean "this channel cannot carry this request", not "that failed".
 *
 * Beyond models with no tools at all, some providers reject the *schema*.
 * Google compiles a tool's JSON Schema into a state machine and refuses
 * anything past a size limit — "the specified schema produces a constraint
 * that has too many states for serving" — which the node schema, with its
 * twenty-odd optional enums, comfortably exceeds. Every section call therefore
 * failed on Gemini while the much smaller outline call succeeded, so the page
 * came out as nothing but fallbacks. Plain JSON has no such limit.
 */
const NO_TOOL_SUPPORT = /tool|function.?call|no endpoints|not support|unsupported|invalid_request|too many states|constraint|specified schema|400/i;

/**
 * Pulls one JSON object out of whatever the model actually replied with.
 *
 * Models without tools wrap their answer in prose, in markdown fences, or in
 * both, and they run out of output halfway through more often than tool calls
 * do. Scanning for the outermost object and closing whatever is still open
 * recovers an answer from all three, which matters because a page that is
 * ninety percent composed is worth far more than an error message.
 */
export function extractJson(text: string): unknown {
    let body = text.trim();
    const fence = /```(?:json)?\s*([\s\S]*?)(?:```|$)/i.exec(body);
    if (fence) body = fence[1].trim();

    const opens = body.indexOf("{");
    if (opens < 0) throw new Error("No object generated: the reply contained no JSON object.");
    body = body.slice(opens);

    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    let complete = -1;

    for (let at = 0; at < body.length; at += 1) {
        const character = body[at];
        if (inString) {
            if (escaped) escaped = false;
            else if (character === "\\") escaped = true;
            else if (character === '"') inString = false;
            continue;
        }
        if (character === '"') inString = true;
        else if (character === "{" || character === "[") stack.push(character);
        else if (character === "}" || character === "]") {
            stack.pop();
            if (stack.length === 0) { complete = at + 1; break; }
        }
    }

    if (complete > 0) return JSON.parse(body.slice(0, complete));

    // Cut off mid-answer: close the string and every container still open, and
    // drop the fragment after the last complete value so the tail parses.
    let repaired = body;
    if (inString) repaired += '"';
    repaired = repaired.replace(/,\s*$/, "");
    // A dangling `"key":` has no value to close over.
    repaired = repaired.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    for (let at = stack.length - 1; at >= 0; at -= 1) repaired += stack[at] === "{" ? "}" : "]";

    try {
        return JSON.parse(repaired);
    } catch {
        // Only now, on input that has already failed, is it worth stripping
        // commas that sit before a closing bracket — the pattern could in
        // principle appear inside a string, so it is never applied to text
        // that parses on its own.
        return JSON.parse(repaired.replace(/,(\s*[}\]])/g, "$1"));
    }
}

async function attemptStructured<T>(options: {
    model: Parameters<typeof generateText>[0]["model"];
    schema: z.ZodType<T>;
    name: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
    channel: Channel;
}): Promise<T> {
    let raw: unknown;

    if (options.channel.tools) {
        try {
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
            if (!call) throw new Error("The model did not call the tool.");
            raw = typeof call.input === "string" ? extractJson(call.input) : call.input;
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : String(reason);
            if (!NO_TOOL_SUPPORT.test(message)) throw reason;
            console.warn(`Model cannot use tools (${message.slice(0, 120)}); switching this run to plain JSON.`);
            options.channel.tools = false;
        }
    }

    if (!options.channel.tools) {
        // Written out rather than described, because a model that cannot use
        // tools has also not been shown the shape any other way.
        const shape = JSON.stringify(z.toJSONSchema(options.schema as z.ZodType, { io: "input" }));
        const { text } = await generateText({
            model: options.model,
            maxRetries: 2,
            maxOutputTokens: options.maxOutputTokens,
            system: `${options.system}

Reply with one JSON object and nothing else — no explanation before it, no commentary after it, no markdown fences. It must satisfy this JSON Schema:
${shape.slice(0, 6000)}`,
            prompt: options.prompt,
        });
        if (!text.trim()) throw new Error("No object generated: the model replied with nothing.");
        raw = extractJson(text);
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

/** Removals for everything currently inside one element. */
function childrenOf(document: unknown, parentId: string): AiDesignOperation[] {
    const raw = document && typeof document === "object" ? document as { elements?: unknown } : undefined;
    const elements = Array.isArray(raw?.elements) ? raw.elements : [];
    return elements.flatMap((value): AiDesignOperation[] => {
        const element = value && typeof value === "object" ? value as Record<string, unknown> : {};
        return typeof element.id === "string" && element.parentId === parentId
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
            // Bands paint edge to edge, but their *content* is capped and
            // centred by the renderer's own band mechanism — which it only
            // applies when the page is not in full-width mode. Leaving this on
            // meant every section's copy ran the entire width of the monitor,
            // because an element cannot express a maximum width on its own.
            fullWidth: false,
            maxWidth: PAGE_MEASURE,
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

/** What the composition actually turned out to be, for the progress stream. */
function describeSection(section: Section, elements: number) {
    const shapes = section.content.reduce<string[]>((found, node) => {
        if (node.t === "grid") found.push(`${node.columns}-column grid`);
        else if (node.t === "box" && node.dir === "row") found.push("row");
        return found;
    }, []);
    return [
        `${section.surface ?? "page"} band · ${section.width ?? "normal"} measure`,
        `${elements} elements${shapes.length ? ` · ${[...new Set(shapes)].join(", ")}` : ""}`,
    ];
}

/**
 * Whether a piece of text is really the arrangement note wearing a headline.
 *
 * Exact-matching the note was not enough: a model that is told "how to arrange"
 * and "what to say" in one breath tends to rephrase the arrangement slightly
 * and hand it back as copy, so pages came out reading "a simple navigation bar
 * with the studio's name and a contact link".
 *
 * Comparison is per text node and against this section's own note only, so it
 * can never touch unrelated copy, and it needs four distinctive words before it
 * will fire at all. A section legitimately shares a word or two with its brief
 * — its subject — but not four fifths of them.
 */
export function echoesArrangement(value: string, brief: string) {
    // Apostrophes and plurals are flattened before comparing. A note saying
    // "the studio's name" and copy saying "the studio" are the same word, and
    // treating them as different was enough to let a reworded note through.
    // The same flattening is applied to both sides, so a crude rule is safe:
    // "process" and "processes" both become "proces", which is not a word but
    // is consistently not a word.
    const words = (text: string) =>
        new Set(
            (text.toLowerCase().replace(/'/g, "").match(/[a-z]{4,}/g) ?? [])
                .map((word) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word)),
        );
    const distinctive = new Set([...words(brief)].filter((word) => !STOP_WORDS.has(word)));
    if (distinctive.size < 4) return false;
    const present = words(value);
    let shared = 0;
    for (const word of distinctive) if (present.has(word)) shared += 1;
    return shared / distinctive.size >= 0.75;
}

/** Words too common to say anything about whether two sentences match. */
const STOP_WORDS = new Set([
    "with", "that", "this", "then", "than", "from", "into", "them", "they",
    "have", "will", "would", "should", "which", "where", "when", "what",
    "about", "there", "their", "your", "page", "section", "content", "text",
]);

/** Every text and label a composed section will actually display. */
function visibleStrings(nodes: unknown[]): string[] {
    const found: string[] = [];
    const walk = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const record = node as Record<string, unknown>;
        for (const key of ["value", "label"]) {
            if (typeof record[key] === "string") found.push(record[key] as string);
        }
        if (Array.isArray(record.children)) record.children.forEach(walk);
    };
    nodes.forEach(walk);
    return found;
}

async function run(
    body: Record<string, unknown>,
    prompt: string,
    apiKey: string,
    emit: (event: AiStreamEvent) => void,
) {
    const openrouter = createOpenRouter({ apiKey });
    const model = openrouter(process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5");
    // Discovered once, then reused for every call this run makes.
    const channel: Channel = { tools: true };
    const parsedFocus = focusSchema.safeParse(body.focus);
    const focus = parsedFocus.success ? parsedFocus.data : undefined;

    /**
     * A different centre of gravity per request.
     *
     * A well-written prompt still lets a model settle into one favourite
     * answer, and most requests describe software, so most pages came back in
     * the same language. Offering one language up front — chosen from the
     * request's own text, so it is stable for a given brief and different
     * across briefs — moves the starting point without taking the decision
     * away: the model is told plainly that it may reject it, and a brief that
     * actually specifies a look will.
     */

    // The engine's own name, first line of every run. Without it there is no
    // way to tell from the editor whether a rebuilt package is actually the one
    // answering, and a stale dev server looks identical to a broken change.
    emit({
        type: "phase",
        id: "direction",
        status: "start",
        facts: [`Engine · ${ENGINE_BUILD}`, "Reading the brief"],
    });

    const directionPrompt = JSON.stringify({
        request: prompt.slice(0, 4000),
        recentConversation: body.history,
        currentPage: summarizeDocument(body.document),
        editOnly: focus
            ? {
                  id: focus.id,
                  name: focus.name,
                  type: focus.type,
                  rule: "You are rebuilding this one element, not designing a page. Return exactly one section: its content replaces what the element currently holds. Do not add navigation, a footer, or any other section, and do not restyle the page.",
              }
            : undefined,
    }).slice(0, 24000);

    const design = await generateStructured({
        model,
        schema: designSchema,
        name: "pagiera_design",
        channel,
        maxOutputTokens: 14000,
        system: SYSTEM,
        prompt: directionPrompt,
    });

    // The outline only; each section's nodes are composed below.
    let outline = design.sections.filter((section) => section.name || section.brief).slice(0, LIMITS.maxSections);

    /**
     * A run scoped to one element rebuilds that element, not a page.
     *
     * The outline pass still answers with a whole site — navigation, hero,
     * footer — because that is what it is good at, and every one of those used
     * to be parented into the selection. Asking to fix one card produced an
     * entire page inside it. Only the first entry survives, and its content
     * replaces what the element already held.
     */
    if (focus) outline = outline.slice(0, 1);

    /**
     * Weaker models answer the outline with two or three sections and stop.
     *
     * That is not a failure the schema can see — every field is valid, there
     * are simply not enough of them to be a page — so it is caught here and
     * asked for once more, naming the shortfall. One extra request is a much
     * better outcome than a landing page consisting of a hero and a footer.
     */
    if (!focus && design.intent !== "conversation" && outline.length > 0 && outline.length < MINIMUM_SECTIONS) {
        console.warn(`AI outline returned only ${outline.length} sections; asking again.`);
        try {
            const again = await generateStructured({
                model,
                schema: designSchema,
                name: "pagiera_design",
                channel,
                maxOutputTokens: 14000,
                system: SYSTEM,
                prompt: `${directionPrompt}\n\nYour previous answer listed only ${outline.length} sections, which is not a page. Return the same direction and theme, but a fuller sequence: at least ${MINIMUM_SECTIONS} sections, each with a real brief.`,
            });
            const fuller = again.sections.filter((section) => section.name || section.brief).slice(0, LIMITS.maxSections);
            if (fuller.length > outline.length) outline = fuller;
        } catch (reason) {
            // The first outline still stands; a thin page beats no page.
            console.warn("AI outline retry failed", reason);
        }
    }

    // The brief's own fingerprint. Anything the model left unspecified is
    // chosen from this rather than from a fixed default, so two different
    // requests answered with equal vagueness still produce different pages —
    // while the same request twice produces the same page.
    const seed = hashSeed([
        design.brand,
        design.direction,
        prompt,
        ...outline.map((section) => section.name),
    ].join("|")) ^ (Number.isFinite(body.seed as number) ? Number(body.seed) >>> 0 : 0);

    /**
     * The theme, as the model decided it.
     *
     * Anything left unspecified still has to become a value, and that value
     * comes from the request's own seed — so two different briefs answered with
     * equal vagueness do not resolve to the same page. Nothing here overrides a
     * choice the model made.
     */
    const brief = fillThemeBrief(design.theme, seed);
    const theme = resolveTheme(brief);
    // Which axes the model actually decided, so the progress line distinguishes
    // its choices from the ones the system made on its behalf.
    const chosen = (key: keyof typeof design.theme) => design.theme[key] ? "" : "*";
    emit({
        type: "phase",
        id: "direction",
        status: "done",
        facts: [
            design.direction,
            `${brief.mood}${chosen("mood")} · ${brief.density}${chosen("density")} · ${brief.corners}${chosen("corners")} corners · ${brief.separation}${chosen("separation")} · ${brief.finish}${chosen("finish")}`,
            `${theme.color.page} page · ${theme.color.accent} accent · ${theme.color.text} text`,
            "* chosen by Pagiera — the model left it unspecified",
        ].filter(Boolean),
    });

    if (design.reply) emit({ type: "reply", text: design.reply });

    if (design.intent === "conversation") {
        if (!design.reply.trim() && !design.direction.trim()) {
            throw new Error("No object generated: the model returned no sections and no reply.");
        }
        emit({ type: "plan", plan: { message: design.reply || design.direction, steps: [], operations: [] } });
        return;
    }

    if (outline.length === 0) {
        // A build that produced no section is a failure, and it used to end
        // here quietly — the author got the art direction back as a message and
        // an unchanged canvas, with nothing saying why. The raw shape goes to
        // the server log because the cause is always in what the model wrote.
        console.warn(
            "AI design produced no buildable section. Raw sections:",
            JSON.stringify(design.sections).slice(0, 2000),
        );
        throw new Error(
            `No object generated: the model described a direction but composed no usable section (${design.sections.length} returned, none survived validation).`,
        );
    }


    if (outline.length === 0) {
        throw new Error("No object generated: every section the model composed was empty.");
    }

    emit({
        type: "phase",
        id: "build",
        status: "start",
        facts: [`${outline.length} sections`, outline.map((section) => section.name).join(" → ")],
    });

    const themeSummary = {
        direction: design.direction,
        mood: brief.mood,
        density: brief.density,
        corners: brief.corners,
        finish: brief.finish,
    };

    let built = 0;
    let imageBudget = storeImage ? MAX_GENERATED_IMAGES : 0;
    const sections: Section[] = [];
    for (const [index, entry] of outline.entries()) {
        const id = `section-${index}`;
        emit({ type: "section", id, label: entry.name || `Section ${index + 1}`, index, total: outline.length, status: "start" });
        try {
            /**
             * One small call per section, retried until it produces something.
             *
             * A section that comes back empty is usually a transient failure —
             * the answer was cut off, or the model closed the tool call early —
             * and asking again with the problem named fixes it far more often
             * than not. Retrying here rather than moving on also keeps the page
             * in order: nothing later is composed until this one has landed, so
             * the canvas never gains a gap it has to fill in afterwards.
             */
            let section: Section | null = null;
            let problem = "";
            for (let attempt = 1; attempt <= SECTION_ATTEMPTS && !section; attempt += 1) {
                if (attempt > 1) {
                    emit({
                        type: "section",
                        id,
                        label: entry.name || `Section ${index + 1}`,
                        index,
                        total: outline.length,
                        status: "start",
                        facts: [`Attempt ${attempt} of ${SECTION_ATTEMPTS} — ${problem}`],
                    });
                }
                try {
                    const composed = await generateStructured({
                        model,
                        schema: contentSchema,
                        name: "pagiera_section",
                        channel,
                        // Reasoning models spend this budget thinking before
                        // they write anything, so a tight ceiling does not
                        // produce a shorter composition — it produces a
                        // truncated one. Unused tokens cost nothing.
                        maxOutputTokens: 12000,
                        system: SECTION_SYSTEM,
                        prompt: JSON.stringify({
                            theme: themeSummary,
                            pageOutline: outline.map((item) => item.name),
                            // A scoped run composes the inside of an element
                            // that is already on the page.
                            rebuilding: focus ? { element: focus.name, type: focus.type, rule: "Compose only what goes inside this element. Do not build a page section, a navigation bar or a footer, and do not wrap the result in a full-width band." } : undefined,
                            section: {
                                name: entry.name,
                                surface: entry.surface,
                                width: entry.width,
                                headline: entry.headline,
                                summary: entry.summary,
                                howToArrange: entry.brief,
                            },
                            position: `${index + 1} of ${outline.length}`,
                            retry: attempt > 1
                                ? {
                                      attempt,
                                      whatWentWrong: problem,
                                      rule: "Your previous answer could not be used. Return the content array and nothing else, and keep the composition simpler than you were about to.",
                                  }
                                : undefined,
                        }).slice(0, 12000),
                    });
                    section = normalizeSection({ ...entry, content: composed.content }, index);
                    // The arrangement note is an instruction. A model that
                    // repeats it — word for word or loosely reworded — would
                    // publish it, so that counts as a failed attempt.
                    const echoed = section
                        ? visibleStrings(section.content).find((value) => echoesArrangement(value, entry.brief))
                        : undefined;
                    if (echoed) {
                        console.warn(`AI section "${entry.name}" attempt ${attempt} echoed its arrangement note: "${echoed.slice(0, 90)}"`);
                        problem = "you wrote the howToArrange note into the page as text. It describes the layout; it is not copy. Write what a visitor reads instead.";
                        section = null;
                    }
                    if (!section) {
                        problem = "the answer contained no usable nodes";
                        // The cause is always in what the model actually sent,
                        // and a shape that normalises to nothing is invisible
                        // without seeing it.
                        console.warn(`AI section "${entry.name}" attempt ${attempt} unusable:`, JSON.stringify(composed.content).slice(0, 600));
                    }
                } catch (reason) {
                    problem = reason instanceof Error ? reason.message.slice(0, 140) : "the request failed";
                    console.warn(`AI section "${entry.name}" attempt ${attempt} failed: ${problem}`);
                }
            }

            if (!section) {
                /**
                 * Every attempt failed. The outline's finished copy can still
                 * carry a plain version of this section — but only the copy.
                 *
                 * This used to fall back to the `brief` instead, which is a
                 * note about how to arrange the section, and so published
                 * sentences like "a simple navigation bar with the studio's
                 * name and a contact link" as the page's own text. A section
                 * with no real copy behind it is dropped instead: a shorter
                 * page is recoverable, stage directions in front of a customer
                 * are not.
                 */
                const headline = entry.headline.trim();
                // The outline can make the same mistake: a "headline" that is
                // really a description of the section. Publishing that is worse
                // than dropping the section.
                if (!headline || echoesArrangement(headline, entry.brief)) {
                    throw new Error("The section produced no composition and the outline held no copy to fall back on.");
                }
                console.warn(`AI section "${entry.name}" failed ${SECTION_ATTEMPTS} attempts; falling back to its headline.`);
                const summary = entry.summary.trim();
                section = normalizeSection({
                    ...entry,
                    content: [{
                        t: "box",
                        gap: "md",
                        width: "full",
                        children: [
                            { t: "text", role: index === 0 ? "display" : "title", value: headline, width: "measure" },
                            ...(summary ? [{ t: "text", role: "body", value: summary, width: "measure" }] : []),
                        ],
                    }],
                }, index);
            }
            if (!section) throw new Error("The section outline contained no usable content.");
            sections.push(section);
            const elements = focus ? composeFragment(theme, section) : composeSection(theme, section);
            let operations = toAddOperations(elements);
            // The compiler leaves an Image's prompt on its `alt`, which is
            // where the generator reads it from; only as many as the budget
            // allows are actually requested.
            operations = operations.map((operation) => {
                if (operation.kind !== "add" || operation.type !== "Image" || imageBudget <= 0) return operation;
                imageBudget -= 1;
                return { ...operation, imagePrompt: operation.alt };
            });

            if (focus) {
                // A fragment may have several roots; all of them belong inside
                // the element. Reparenting only the first, as this used to,
                // silently dropped the rest when `withinFocus` ran.
                operations = operations.map((operation) =>
                    operation.kind === "add" && !operation.parentId
                        ? { ...operation, parentId: focus.id }
                        : operation);
                operations = withinFocus(operations, focus.id);
                // Replace, rather than append. Without this the new composition
                // lands underneath whatever was already inside the element and
                // the author sees their old content plus a second copy.
                operations = [...childrenOf(body.document, focus.id), ...operations];
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
                    section: { id, label: section.name, index, total: outline.length },
                    plan: {
                        message: `${section.name} · ${at + 1}/${operations.length}`,
                        steps: [],
                        operations: [operation],
                        streamKey: id,
                        streamReset: at === 0,
                    },
                });
                // A short yield gives React a chance to paint each element
                // rather than batching a whole section into one frame.
                await new Promise((resolve) => setTimeout(resolve, 24));
            }

            emit({
                type: "section",
                id,
                label: section.name,
                index,
                total: outline.length,
                status: "done",
                facts: describeSection(section, operations.length),
            });
        } catch (reason) {
            // One section failing is not the page failing.
            console.warn(`AI section "${entry.name}" failed`, reason);
            emit({ type: "section", id, label: entry.name || `Section ${index + 1}`, index, total: outline.length, status: "failed" });
        }
    }

    if (built === 0) throw new Error("No object generated: every section failed to build.");

    emit({ type: "phase", id: "build", status: "done", facts: [`${built} of ${outline.length} sections built`] });
    emit({
        type: "plan",
        plan: {
            message: design.reply || design.direction,
            steps: sections.map((section) => `${section.name} — ${section.surface ?? "page"} band`),
            operations: [],
        },
    });
}
