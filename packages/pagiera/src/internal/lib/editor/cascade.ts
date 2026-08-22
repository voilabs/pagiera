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
