import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ELEMENT_TYPES } from "@/lib/editor/types";

export const maxDuration = 120;

const styleSchema = z
    .object({
        x: z.number().optional(), y: z.number().optional(), constraintX: z.enum(["start", "center", "end", "stretch"]).optional(), constraintY: z.enum(["start", "center", "end", "stretch"]).optional(), w: z.number().positive().optional(), h: z.number().positive().optional(),
        widthMode: z.enum(["fixed", "fill", "auto"]).optional(), heightMode: z.enum(["fixed", "fill", "auto"]).optional(),
        layout: z.enum(["absolute", "stack"]).optional(), direction: z.enum(["row", "column"]).optional(),
        gap: z.number().nonnegative().optional(), padT: z.number().nonnegative().optional(), padR: z.number().nonnegative().optional(), padB: z.number().nonnegative().optional(), padL: z.number().nonnegative().optional(),
        justify: z.enum(["start", "center", "end", "between"]).optional(), align: z.enum(["start", "center", "end", "stretch"]).optional(), wrap: z.boolean().optional(), columns: z.number().int().min(1).max(12).optional(),
        bg: z.string().optional(), gradient: z.string().optional(), color: z.string().optional(), radius: z.number().nonnegative().optional(), opacity: z.number().min(0).max(100).optional(),
        borderW: z.number().nonnegative().optional(), borderC: z.string().optional(), borderStyle: z.enum(["solid", "dashed", "dotted"]).optional(), shadow: z.string().optional(), rotate: z.number().optional(),
        fontSize: z.number().positive().optional(), fontWeight: z.string().optional(), lineHeight: z.number().positive().optional(), letterSpacing: z.number().optional(), textAlign: z.enum(["left", "center", "right", "justify"]).optional(), textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
        overflow: z.enum(["visible", "hidden", "auto", "scroll"]).optional(), position: z.enum(["static", "sticky"]).optional(), stickyOffset: z.number().optional(),
        bgImage: z.string().optional(), bgSize: z.enum(["cover", "contain", "auto"]).optional(), bgPosition: z.string().optional(), backdropBlur: z.number().nonnegative().optional(), blur: z.number().nonnegative().optional(), scale: z.number().min(1).max(500).optional().describe("Percentage scale: 100 is normal, 102 is two percent larger"), aspectRatio: z.string().optional(),
        entrance: z.enum(["none", "fade", "up", "down", "left", "right", "zoom"]).optional(), entranceDuration: z.number().nonnegative().optional(), entranceDelay: z.number().nonnegative().optional(), entranceCurve: z.enum(["ease", "spring"]).optional(), entranceBezier: z.string().optional(), springStiffness: z.number().positive().optional(), springDamping: z.number().positive().optional(), cursor: z.enum(["auto", "default", "pointer", "text", "grab", "zoom-in", "none"]).optional(), hidden: z.boolean().optional(),
    })
    .strict();
const bindingsSchema = z.record(z.string(), z.string().max(60)).optional();
const interactionSchema = z.object({ trigger: z.literal("click"), action: z.enum(["navigate", "scroll-to", "toggle-layer", "show-layer", "hide-layer"]), value: z.string().max(2000), target: z.enum(["_self", "_blank"]).optional() }).optional();
const loopSchema = z.object({ type: z.enum(["pulse", "float", "spin"]), duration: z.number().min(100).max(20000) }).optional();

const planSchema = z.object({
    message: z.string().max(600),
    steps: z.array(z.string().max(180)).min(1).max(6),
    operations: z.array(
        z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("add"), ref: z.string().min(1).max(60), type: z.enum(ELEMENT_TYPES), parentId: z.string().nullable().optional(), content: z.string().max(5000).optional(), src: z.string().max(2000).optional(), href: z.string().max(2000).optional(), style: styleSchema.optional(), tabletStyle: styleSchema.optional(), mobileStyle: styleSchema.optional(), hoverStyle: styleSchema.optional(), pressStyle: styleSchema.optional(), loop: loopSchema, draggable: z.boolean().optional(), styleBindings: bindingsSchema, interaction: interactionSchema }),
            z.object({ kind: z.literal("update"), id: z.string(), content: z.string().max(5000).optional(), src: z.string().max(2000).optional(), href: z.string().max(2000).optional(), style: styleSchema.optional(), tabletStyle: styleSchema.optional(), mobileStyle: styleSchema.optional(), hoverStyle: styleSchema.optional(), pressStyle: styleSchema.optional(), loop: loopSchema, draggable: z.boolean().optional(), styleBindings: bindingsSchema, interaction: interactionSchema }),
            z.object({ kind: z.literal("remove"), id: z.string() }),
            z.object({ kind: z.literal("page"), style: z.object({ documentMode: z.enum(["page", "component"]).optional(), maxWidth: z.number().min(1).max(4000).optional(), canvasHeight: z.number().min(1).max(12000).optional(), fullWidth: z.boolean().optional(), bg: z.string().optional(), layout: z.enum(["absolute", "stack"]).optional(), direction: z.enum(["row", "column"]).optional(), gap: z.number().nonnegative().optional(), padT: z.number().nonnegative().optional(), padR: z.number().nonnegative().optional(), padB: z.number().nonnegative().optional(), padL: z.number().nonnegative().optional(), align: z.enum(["start", "center", "end", "stretch"]).optional(), fontFamily: z.string().optional(), variables: z.array(z.object({ id: z.string().max(60), name: z.string().max(60), type: z.enum(["color", "number"]), value: z.union([z.string(), z.number()]) })).max(24).optional() }).strict() }),
        ]),
    ).max(100),
});

const blueprintSchema = z.object({
    intent: z.enum(["conversation", "modify", "build-page"]),
    direction: z.string().max(500),
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
        scale: z.array(z.number()).min(3).max(7),
    }),
    signature: z.object({
        visualMotif: z.string().max(240),
        heroComposition: z.string().max(320),
        motionRhythm: z.string().max(240),
        avoid: z.array(z.string().max(120)).min(3).max(8),
    }),
    sections: z.array(
        z.object({
            name: z.string(),
            purpose: z.string(),
            composition: z.string(),
            details: z.array(z.string()).min(2).max(8),
        }),
    ).max(12),
});

export async function POST(request: Request) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 503 });

    try {
    const body = (await request.json()) as { prompt?: unknown; document?: unknown; breakpoint?: unknown; history?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) return Response.json({ error: "Prompt is required." }, { status: 400 });

    const openrouter = createOpenRouter({ apiKey });
    const model = openrouter(
        process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5",
    );
    const requestContext = {
        request: body.prompt.slice(0, 4000),
        activeBreakpoint: body.breakpoint,
        recentConversation: body.history,
        document: body.document,
    };

    const { output: blueprint } = await generateText({
        model,
        maxRetries: 2,
        maxOutputTokens: 5000,
        output: Output.object({ schema: blueprintSchema, name: "pagiera_blueprint" }),
        system: `You are an award-winning digital art director and UX architect. Plan before building.
Create a specific, contemporary visual direction—not generic SaaS filler. Establish one exact palette, typography hierarchy, spacing rhythm and a section-by-section composition. The signature must name one repeatable visual motif, a concrete asymmetric hero composition, a motion rhythm and explicit clichés to avoid.
For a full page, plan 5-8 substantial sections with meaningful visual variety: navigation, hero, proof, editorial or feature storytelling, metrics/testimonial, conversion CTA and footer. Each section needs layered details, not only a heading and paragraph.
Avoid the default AI look: endless equal cards, centered text in every section, neon purple gradients, excessive pills, fake dashboard rectangles, glow on everything, and identical rounded boxes. Mix editorial whitespace with one or two dense moments. Each section must have a distinct silhouette while sharing the same system.
Use the existing document intelligently. If the user asks a conversational question, set intent=conversation and keep sections empty. Preserve good existing work unless replacement was requested.
Treat motion as part of the visual direction: define a restrained entrance rhythm, one shared easing character, and a clear focal moment. Animation must reinforce hierarchy rather than decorate every node.`,
        prompt: JSON.stringify(requestContext).slice(0, 60000),
    });

    const { output: draft } = await generateText({
        model,
        maxRetries: 2,
        maxOutputTokens: 24000,
        output: Output.object({ schema: planSchema, name: "pagiera_design_plan" }),
        system: `You are Pagiera's senior web designer. Turn the request into precise editor operations.
Use only existing element IDs from the document for update/remove/parentId. For newly added parents, reference their ref in later parentId fields.
Build polished, production-ready layouts with strong hierarchy, spacing, responsive-friendly fill/auto sizing, accessible contrast, and concise real copy. Follow approvedBlueprint.signature literally so the result has an identifiable art direction.
Compose complete pages from recognizable sections: Navbar, Hero, social proof, feature grid, CTA and Footer. A Navbar is a row Section with justify=between and align=center; a Footer is a spacious Section with grouped link Containers. Do not output a random pile of Text and Button nodes.
Sections and containers should normally use stack layout. Prefer full-width Sections, auto heights and nested Containers. Put siblings in a stack parent rather than positioning them manually.
Use Frame for bounded visual compositions, Stack for row/column groups, and Grid for repeated cards. For full page builds create page variables for the exact palette and core spacing values, then bind repeated style properties with styleBindings. IDs in styleBindings must match those page variables.
Alignment rules are strict: justify controls the parent's main axis; align controls its cross axis. To center a column vertically and horizontally use justify=center and align=center. A child with widthMode=fill cannot visibly center on the cross axis, so use fixed/auto for centered content and fill only when it should stretch. Use textAlign=center for centered copy.
Before operations, provide 2-6 short implementation steps in the steps field.
Create one coherent design system per page: choose exactly one page background, one surface color, one primary accent, one main text color and one muted text color. Reuse those exact values throughout all operations. Do not introduce unrelated colors section by section. Use at most one subtle gradient and only when it supports the chosen palette.
Use consistent spacing (8/12/16/24/32/48/64/96), restrained radii, modern typography, generous whitespace, and no placeholder copy. Never invent unsupported element types.
Implement every blueprint section with enough nested elements to make it visually complete. Full-page builds should normally contain 22-55 purposeful operations. Quality, composition and hierarchy matter more than node count. Add responsive tabletStyle/mobileStyle for structural, spacing and typography changes.
Do not make every section a centered column or every feature an equal card. Use at least three composition patterns across a full page: asymmetric split, editorial text/media, structured grid, horizontal proof strip, oversized statement or layered visual frame. Keep readable content inside a consistent inner Container while Section backgrounds may fill the viewport.
Headings should use a deliberate type scale and tight line height; body copy should stay readable and constrained. Buttons must size to content unless intentionally full width on mobile. Never use fixed heights for text-heavy sections.
Create Framer-quality motion choreography. Stagger related entranceDelay values by 60-120ms, reuse a coherent entranceBezier, and choose spring only for expressive focal elements. Add restrained hoverStyle to interactive buttons/cards and pressStyle to primary controls. At most one subtle ornamental element may use a pulse, float, or spin loop. Enable draggable only when it has an intentional product interaction. Never animate every element or mix unrelated easing styles.
Scale values are percentages: 100 is the resting size, a subtle hover is 101-103, and a press is 97-99. Never output CSS multipliers such as 1.02 or 0.98.
Use custom font families already registered in document.rootStyle.customFonts by their exact names when they suit the direction. Never invent a font URL or an unregistered custom family; otherwise use the document's existing font stack.
Use interaction for real navigation buttons and scroll-to navigation items. Build reusable visual patterns consistently so they can later become component masters and variants.
Responsive navbars should create the hidden mobile menu layer before the menu trigger, then set the trigger interaction to toggle-layer using that earlier ref. Use show-layer/hide-layer for overlays and close buttons. Tablet/mobile layouts must reorganize rather than merely shrink.
If the request is conversational or needs no visual change, return no operations and answer in message. Do not remove existing work unless explicitly asked.`,
        prompt: JSON.stringify({ ...requestContext, approvedBlueprint: blueprint }).slice(0, 90000),
    });

    if (!draft) throw new Error("The model returned an empty design plan.");

    let finalPlan = draft;
    if (blueprint.intent === "build-page" && draft.operations.length > 0) {
        try {
            const { output: polished } = await generateText({
                model,
                maxRetries: 1,
                maxOutputTokens: 26000,
                output: Output.object({ schema: planSchema, name: "pagiera_polished_design_plan" }),
                system: `You are the final design director and implementation reviewer for Pagiera. Return a complete replacement plan, not commentary.
Audit the draft ruthlessly, then rewrite its operations into a refined, buildable landing page. Preserve the user's intent and approved palette, but remove generic AI aesthetics.

QUALITY GATE:
- Every add parentId must reference an existing document ID or an earlier add ref. Parents always precede children.
- Page uses stack/column flow. Full-width Sections contain bounded inner Containers. Text-heavy sections use auto height.
- Desktop composition feels art-directed, not templated. Use varied silhouettes and asymmetric hierarchy without random absolute positioning.
- Tablet and mobile overrides prevent overflow, collapse rows/grids, reduce padding and maintain readable type. Mobile must never be a scaled-down desktop screenshot.
- Use one exact color system, one radius language and one shadow language. Remove gratuitous gradients, glass, glow, pills and borders.
- Motion is a coherent sequence: restrained staggered entrances, meaningful hover/press feedback, no more than one ambient loop.
- Copy is specific and credible. Remove placeholder metrics, lorem ipsum and repetitive labels.
- Keep 22-55 purposeful operations when building a full page. Do not lose required sections while simplifying.

Return only the corrected plan matching the schema. Its message should briefly describe the finished visual direction and its steps should describe what was actually built.`,
                prompt: JSON.stringify({ requestContext, approvedBlueprint: blueprint, draftPlan: draft }).slice(0, 115000),
            });
            if (polished?.operations.length) finalPlan = polished;
        } catch (polishError) {
            console.warn("AI polish pass failed; returning valid draft", polishError);
        }
    }

    return Response.json(finalPlan);
    } catch (reason) {
        const rawMessage = reason instanceof Error ? reason.message : "Unknown AI provider error";
        console.error("AI design request failed", reason);
        const truncated = /unexpected end|unterminated|parse|json|no object generated|length|token/i.test(rawMessage);
        return Response.json(
            {
                error: truncated
                    ? "AI yanıtı tamamlanmadan kesildi. İstek otomatik olarak korunuyor; tekrar deneyebilir veya daha küçük bir bölüm isteyebilirsin."
                    : `AI tasarımı oluşturulamadı: ${rawMessage.slice(0, 240)}`,
                code: truncated ? "INCOMPLETE_AI_RESPONSE" : "AI_PROVIDER_ERROR",
            },
            { status: truncated ? 422 : 502 },
        );
    }
}
