import {
    BLOCK_KINDS,
    BLOCK_LAYOUTS,
    type BlockKind,
    hasEnoughContent,
    type SectionContent,
} from "./blocks";
import type { Surface } from "./theme";

/**
 * Turns what the model asked for into a page that holds together.
 *
 * The model is good at deciding *what a page should say* and roughly what
 * shape each section wants. It is unreliable about the things a reader
 * notices most: that seven sections in a row are all white, that three of them
 * are the same three-card grid, that the footer arrived second. Those are
 * mechanical properties of the sequence, so they are decided here rather than
 * asked for in a prompt and hoped for.
 */

export type RawSection = {
    kind?: string;
    layout?: string;
    surface?: string;
    eyebrow?: string;
    headline?: string;
    body?: string;
    primaryAction?: string;
    secondaryAction?: string;
    links?: string[];
    items?: Array<{ title?: string; body?: string; value?: string; badge?: string }>;
    imagePrompt?: string;
    note?: string;
};

const KINDS = new Set<string>(BLOCK_KINDS);

function asKind(value: string | undefined): BlockKind {
    const key = (value ?? "").trim().toLowerCase();
    if (KINDS.has(key)) return key as BlockKind;
    // Models reach for the vocabulary of the page rather than the library.
    if (/nav|header|menu/.test(key)) return "nav";
    if (/hero|masthead|banner|intro/.test(key)) return "hero";
    if (/logo|client|trusted|brands/.test(key)) return "logos";
    if (/stat|metric|number|impact/.test(key)) return "stats";
    if (/step|process|how|workflow/.test(key)) return "steps";
    if (/quote|testimonial|review|voice/.test(key)) return "testimonial";
    if (/pricing|plan|tier|package/.test(key)) return "pricing";
    if (/faq|question/.test(key)) return "faq";
    if (/cta|call|convert|signup|newsletter/.test(key)) return "cta";
    if (/footer/.test(key)) return "footer";
    if (/showcase|detail|deep|spotlight|about|story/.test(key)) return "showcase";
    return "features";
}

const clean = (value: string | undefined, limit: number) =>
    (value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);

/** Copy the model reaches for when it has nothing to say. */
const PLACEHOLDER = /^(lorem|placeholder|your (text|headline|content)|heading|body text|text block|click here|section \d)/i;

function realCopy(value: string | undefined, limit: number) {
    const text = clean(value, limit);
    return PLACEHOLDER.test(text) ? "" : text;
}

/**
 * The band each section is painted on.
 *
 * Two rules, applied in order: nothing may repeat the surface directly above
 * it more than once in a row, and the whole page gets at most one inverse
 * band, placed on whichever section most deserves the emphasis. Alternating
 * strictly would be its own kind of monotony — page, panel, page, panel reads
 * as a striped table — so the run is page-weighted with panels used to close
 * groups.
 */
function assignSurfaces(sections: SectionContent[]): SectionContent[] {
    // The section that carries the page's one full-contrast moment. A closing
    // CTA earns it; failing that, whichever proof section exists.
    const emphasisAt = (() => {
        const cta = sections.findIndex((section) => section.kind === "cta");
        if (cta >= 0) return cta;
        const proof = sections.findIndex((section) => section.kind === "testimonial" || section.kind === "stats");
        return proof;
    })();

    let previous: Surface["key"] = "page";
    let sameRun = 0;
    return sections.map((section, index) => {
        if (section.kind === "nav" || section.kind === "footer") {
            previous = "page";
            sameRun = 0;
            return { ...section, surface: "page" as const };
        }
        if (index === emphasisAt) {
            previous = "inverse";
            sameRun = 0;
            return { ...section, surface: "inverse" as const };
        }
        // A hero is the page's own colour; anything else would make the top of
        // the page argue with the navigation directly above it.
        let key: Surface["key"] = section.kind === "hero" ? "page" : previous === "page" && sameRun >= 1 ? "panel" : "page";
        if (key === previous) sameRun += 1;
        else sameRun = 0;
        previous = key;
        return { ...section, surface: key };
    });
}

/**
 * Stops the same composition appearing twice.
 *
 * Two feature grids in one page is the clearest symptom of a generated
 * layout. When a kind repeats, the later one is rotated to the next layout its
 * block understands, which is always a real alternative rather than a fallback.
 */
function diversifyLayouts(sections: SectionContent[]): SectionContent[] {
    const used = new Map<BlockKind, Set<string>>();
    return sections.map((section) => {
        const options = BLOCK_LAYOUTS[section.kind];
        const seen = used.get(section.kind) ?? new Set<string>();
        used.set(section.kind, seen);

        let layout = options.includes(section.layout) ? section.layout : options[0];
        if (seen.has(layout)) {
            const alternative = options.find((option) => !seen.has(option));
            if (alternative) layout = alternative;
        }
        seen.add(layout);
        return { ...section, layout };
    });
}

/**
 * Keeps the page's picture budget where it does the most good.
 *
 * Every image is a slow paid request, and a page where six sections all carry
 * a photograph reads as a stock library. The hero keeps its prompt; after
 * that only showcase sections do, and only up to the budget.
 */
function limitImagery(sections: SectionContent[], budget: number): SectionContent[] {
    let left = budget;
    return sections.map((section) => {
        if (!section.imagePrompt) return section;
        const wanted = section.kind === "hero" || section.kind === "showcase";
        if (!wanted || left <= 0) return { ...section, imagePrompt: undefined };
        left -= 1;
        return section;
    });
}

const ORDER: Record<BlockKind, number> = {
    nav: 0,
    hero: 1,
    logos: 2,
    showcase: 3,
    features: 3,
    steps: 3,
    stats: 4,
    testimonial: 5,
    pricing: 6,
    faq: 7,
    cta: 8,
    footer: 9,
};

/**
 * Normalises one model section into something a block can build.
 *
 * Everything is clamped and defaulted here so no block ever has to ask whether
 * a field is present.
 */
function normalize(raw: RawSection, brand: string): SectionContent {
    const kind = asKind(raw.kind);
    const items = (raw.items ?? [])
        .map((item) => ({
            title: clean(item.title, 90),
            body: clean(item.body, 320),
            value: clean(item.value, 40) || undefined,
            badge: clean(item.badge, 24) || undefined,
        }))
        .filter((item) => item.title || item.body || item.value)
        .slice(0, 8);

    return {
        kind,
        surface: "page",
        layout: clean(raw.layout, 30).toLowerCase(),
        eyebrow: realCopy(raw.eyebrow, 60),
        headline: realCopy(raw.headline, 160),
        body: realCopy(raw.body, 400),
        primaryAction: realCopy(raw.primaryAction, 40),
        secondaryAction: realCopy(raw.secondaryAction, 40),
        links: (raw.links ?? []).map((link) => clean(link, 30)).filter(Boolean).slice(0, 15),
        items,
        imagePrompt: realCopy(raw.imagePrompt, 400) || undefined,
        note: realCopy(raw.note, 160),
        brand,
    };
}

export type PlannedSection = SectionContent & {
    /** Stable id for the progress stream. */
    id: string;
    /** What the reader is told is being built. */
    label: string;
};

const LABELS: Record<BlockKind, string> = {
    nav: "Navigation",
    hero: "Hero",
    logos: "Social proof",
    features: "Features",
    showcase: "Showcase",
    stats: "Numbers",
    steps: "How it works",
    testimonial: "Testimonials",
    pricing: "Pricing",
    faq: "Questions",
    cta: "Call to action",
    footer: "Footer",
};

/**
 * The whole page plan, in the order it will be built.
 *
 * Sections the model under-specified are dropped rather than rendered empty:
 * a stats band with one figure is a worse outcome than a page without one.
 */
export function planPage(raw: RawSection[], brand: string, imageBudget: number): PlannedSection[] {
    const normalized = raw.map((section) => normalize(section, brand)).filter(hasEnoughContent);

    // One of each structural kind. A second navigation or footer is always a
    // mistake, and two pricing tables is never what was wanted.
    const once = new Set<BlockKind>(["nav", "hero", "footer", "pricing", "cta"]);
    const taken = new Set<BlockKind>();
    const unique = normalized.filter((section) => {
        if (!once.has(section.kind)) return true;
        if (taken.has(section.kind)) return false;
        taken.add(section.kind);
        return true;
    });

    const ordered = unique
        .map((section, index) => ({ section, index }))
        .sort((a, b) => ORDER[a.section.kind] - ORDER[b.section.kind] || a.index - b.index)
        .map(({ section }) => section)
        .slice(0, 10);

    return limitImagery(diversifyLayouts(assignSurfaces(ordered)), imageBudget).map((section, index) => ({
        ...section,
        id: `section-${index}`,
        label: LABELS[section.kind],
    }));
}
