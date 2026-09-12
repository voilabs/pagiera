import {
    type BreakpointDefinition,
    DEFAULT_BREAKPOINTS,
} from "./types";

/**
 * The breakpoint layout of a page: which artboards exist and which one holds
 * the shared values.
 *
 * Styles live in two places — `element.base` carries the base breakpoint's
 * values, and `element.overrides[id]` carries the deltas for every other one.
 * Which overrides apply to a given artboard depends entirely on where it sits
 * relative to the base, so that ordering is computed here rather than being
 * hard-coded to desktop → tablet → mobile.
 */
export type Cascade = {
    breakpoints: BreakpointDefinition[];
    /** Whose values live in `element.base`. */
    baseId: string;
};

export const DEFAULT_CASCADE: Cascade = {
    breakpoints: DEFAULT_BREAKPOINTS,
    baseId: "desktop",
};

/** Builds a cascade from whatever the page has stored, filling the gaps. */
export function cascadeOf(
    breakpoints: BreakpointDefinition[] | undefined,
    baseId: string | undefined,
): Cascade {
    const list = breakpoints?.length ? breakpoints : DEFAULT_BREAKPOINTS;
    const base = list.find((item) => item.id === baseId) ?? widest(list);
    return { breakpoints: list, baseId: base.id };
}

function widest(list: BreakpointDefinition[]) {
    return list.reduce((a, b) => (b.width > a.width ? b : a), list[0]);
}

export function baseOf(cascade: Cascade): BreakpointDefinition {
    return (
        cascade.breakpoints.find((item) => item.id === cascade.baseId) ??
        widest(cascade.breakpoints)
    );
}

/**
 * The overrides to apply, in order, to reach `targetId` from the base.
 *
 * Narrower artboards inherit downward from the base and wider ones inherit
 * upward, so a value set on the base reaches both directions until something
 * closer to the target overrides it.
 */
export function overrideChain(cascade: Cascade, targetId: string): string[] {
    const base = baseOf(cascade);
    if (targetId === base.id) return [];

    const target = cascade.breakpoints.find((item) => item.id === targetId);
    if (!target) return [];

    const goingNarrower = target.width < base.width;

    const between = cascade.breakpoints.filter((item) => {
        if (item.id === base.id) return false;
        return goingNarrower
            ? item.width < base.width && item.width >= target.width
            : item.width > base.width && item.width <= target.width;
    });

    // Apply from the artboard nearest the base outward, so the one closest to
    // the target has the last word.
    between.sort((a, b) => (goingNarrower ? b.width - a.width : a.width - b.width));
    return between.map((item) => item.id);
}

/**
 * Media queries for the published page, in the order they must appear so that
 * later rules win. Narrower artboards become `max-width`, wider ones
 * `min-width`; the base itself needs no query.
 */
export function mediaPlan(
    cascade: Cascade,
): Array<{ id: string; query: string }> {
    const base = baseOf(cascade);

    // An artboard governs from its own width up to just below the next wider
    // one — the same reading the canvas gives, where a 1000px window falls to
    // the nearest artboard at or below it.
    const narrower = cascade.breakpoints
        .filter((item) => item.id !== base.id && item.width < base.width)
        .sort((a, b) => b.width - a.width)
        .map((item) => {
            const ceiling = cascade.breakpoints
                .filter((other) => other.width > item.width)
                .reduce(
                    (lowest, other) => Math.min(lowest, other.width),
                    Number.POSITIVE_INFINITY,
                );
            return { id: item.id, query: `(max-width: ${ceiling - 1}px)` };
        });

    const wider = cascade.breakpoints
        .filter((item) => item.id !== base.id && item.width > base.width)
        .sort((a, b) => a.width - b.width)
        .map((item) => ({ id: item.id, query: `(min-width: ${item.width}px)` }));

    return [...narrower, ...wider];
}

/** Memoised chains — resolution runs per element, the chain does not. */
const chainCache = new WeakMap<Cascade, Map<string, string[]>>();

export function chainFor(cascade: Cascade, targetId: string): string[] {
    let byTarget = chainCache.get(cascade);
    if (!byTarget) {
        byTarget = new Map();
        chainCache.set(cascade, byTarget);
    }
    const cached = byTarget.get(targetId);
    if (cached) return cached;

    const chain = overrideChain(cascade, targetId);
    byTarget.set(targetId, chain);
    return chain;
}

/**
 * The window widths an artboard governs, as numbers rather than as a label.
 *
 * `from` is the artboard's own threshold and `to` is one pixel below the next
 * wider threshold, so the ranges tile the whole axis with no gap. The
 * narrowest artboard reaches down to 0 and the widest has no upper bound.
 */
export function windowRange(
    cascade: Cascade,
    id: string,
): { from: number; to?: number } | undefined {
    const item = cascade.breakpoints.find((entry) => entry.id === id);
    if (!item) return undefined;
    const narrowest = cascade.breakpoints.reduce(
        (lowest, entry) => Math.min(lowest, entry.width),
        Number.POSITIVE_INFINITY,
    );
    const ceiling = cascade.breakpoints
        .filter((other) => other.width > item.width)
        .reduce((lowest, other) => Math.min(lowest, other.width), Number.POSITIVE_INFINITY);
    return {
        from: item.width === narrowest ? 0 : item.width,
        to: Number.isFinite(ceiling) ? ceiling - 1 : undefined,
    };
}

/** The same range as a sentence, for labels and tooltips. */
export function windowRangeLabel(cascade: Cascade, id: string): string {
    const range = windowRange(cascade, id);
    if (!range) return "";
    // A lone artboard governs everything; naming a threshold of 0 would
    // describe a rule the author never set.
    if (range.to === undefined) return range.from === 0 ? "Every window width" : `Windows ${range.from}px and wider`;
    if (range.from === 0) return `Windows up to ${range.to}px`;
    return `Windows ${range.from}–${range.to}px`;
}

/** Short form for the artboard header, where there is no room for a sentence. */
export function windowRangeChip(cascade: Cascade, id: string): string {
    const range = windowRange(cascade, id);
    if (!range) return "";
    if (range.to === undefined) return range.from === 0 ? "All widths" : `≥ ${range.from}px`;
    if (range.from === 0) return `≤ ${range.to}px`;
    return `${range.from}–${range.to}px`;
}

/**
 * Two artboards claiming the same threshold both match the same windows and
 * the later rule silently wins, so the editor has to be able to say so.
 */
export function duplicateThresholds(cascade: Cascade): number[] {
    const counts = new Map<number, number>();
    for (const item of cascade.breakpoints) {
        counts.set(item.width, (counts.get(item.width) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([width]) => width);
}
