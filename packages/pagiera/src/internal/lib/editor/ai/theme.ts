/**
 * The design system one AI run works inside.
 *
 * Everything a block draws — every colour, size, radius and rhythm — is read
 * from here rather than written into the block. That is what makes a page
 * coherent: the model chooses a handful of parameters once, and forty
 * elements across seven sections cannot disagree about what "surface" means.
 *
 * The model never supplies a finished colour for an element. It supplies a
 * seed palette, and the roles below are *derived* — contrast-checked against
 * the surface they land on — so a badly chosen brand colour produces a
 * slightly duller page instead of white text on yellow.
 */

/* ------------------------------------------------------------------ colour */

type Rgb = { r: number; g: number; b: number };

const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

/** Parses `#abc`, `#aabbcc` or an `rgb()` string; null when it is neither. */
export function parseColor(value: string | undefined): Rgb | null {
    if (!value) return null;
    const text = value.trim();
    const hex = HEX.exec(text);
    if (hex) {
        const digits = hex[1].length === 3
            ? hex[1].split("").map((character) => character + character).join("")
            : hex[1];
        return {
            r: Number.parseInt(digits.slice(0, 2), 16),
            g: Number.parseInt(digits.slice(2, 4), 16),
            b: Number.parseInt(digits.slice(4, 6), 16),
        };
    }
    const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
    if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    return null;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function toHex({ r, g, b }: Rgb) {
    const part = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
    return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance. */
function luminance({ r, g, b }: Rgb) {
    const channel = (raw: number) => {
        const value = raw / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrast(a: string, b: string) {
    const left = parseColor(a);
    const right = parseColor(b);
    if (!left || !right) return 21;
    const one = luminance(left);
    const two = luminance(right);
    return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}

export function isDark(value: string) {
    const rgb = parseColor(value);
    return rgb ? luminance(rgb) < 0.34 : false;
}

/** Linear blend; `amount` is how much of `b` ends up in the result. */
export function mix(a: string, b: string, amount: number) {
    const left = parseColor(a);
    const right = parseColor(b);
    if (!left || !right) return a;
    const at = clamp(amount, 0, 1);
    return toHex({
        r: left.r + (right.r - left.r) * at,
        g: left.g + (right.g - left.g) * at,
        b: left.b + (right.b - left.b) * at,
    });
}

/** `#rrggbb` at a given alpha, as an `rgba()` string the renderer accepts. */
export function alpha(value: string, amount: number) {
    const rgb = parseColor(value);
    if (!rgb) return value;
    return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${clamp(amount, 0, 1)})`;
}

/**
 * Black or white, whichever is legible on `background`.
 *
 * Not simply "dark backgrounds get white": a mid-tone brand colour can fail
 * both, and the one that fails less is still the right answer. Returning the
 * better of the two is what keeps a button label readable no matter what
 * colour the model picked for it.
 */
export function readableOn(background: string, dark = "#0b1020", light = "#ffffff") {
    return contrast(background, light) >= contrast(background, dark) ? light : dark;
}

/**
 * Pulls a colour toward the surface until it is quieter than body text but
 * still clears the legibility threshold — the muted role.
 */
function muteAgainst(surface: string, text: string) {
    for (const amount of [0.42, 0.36, 0.3, 0.24]) {
        const candidate = mix(text, surface, amount);
        if (contrast(candidate, surface) >= 4.5) return candidate;
    }
    return mix(text, surface, 0.24);
}

/**
 * Nudges a brand colour until text on it is legible.
 *
 * A pale accent with white labels is the single most common way an otherwise
 * fine palette produces an unreadable page. Rather than rejecting the choice,
 * the hue is kept and the lightness walked until one of black or white clears
 * the threshold.
 */
function makeAccentUsable(accent: string, surface: string) {
    if (contrast(accent, readableOn(accent)) >= 4.5) return accent;
    const towards = isDark(surface) ? "#ffffff" : "#000000";
    for (const amount of [0.12, 0.24, 0.36, 0.48]) {
        const candidate = mix(accent, towards, amount);
        if (contrast(candidate, readableOn(candidate)) >= 4.5) return candidate;
    }
    return isDark(surface) ? "#ffffff" : "#111827";
}

/* ------------------------------------------------------------------- theme */

/** What the model is allowed to choose. Everything else is derived. */
export type ThemeBrief = {
    /** Seed colours. Either may be omitted; the rest is derived from what is given. */
    background: string;
    accent: string;
    /** Light pages read as editorial; dark ones as product. */
    mood: "light" | "dark";
    /** Drives the type scale's contrast between heading and body. */
    typeScale: "compact" | "balanced" | "dramatic";
    /** Vertical rhythm and how much air sections get. */
    density: "tight" | "regular" | "airy";
    /** Corner language, applied to every card, button and image. */
    corners: "square" | "soft" | "round" | "pill";
    /** How surfaces separate from the page: hairlines, shadows or nothing. */
    separation: "flat" | "line" | "raised";
    headingFont: string;
    bodyFont: string;
};

export type Theme = {
    color: {
        page: string;
        /** A raised panel on the page — cards, navbars, quiet bands. */
        surface: string;
        /** A deliberately contrasting band, for one or two sections. */
        inverse: string;
        onInverse: string;
        onInverseMuted: string;
        accent: string;
        onAccent: string;
        accentSoft: string;
        text: string;
        muted: string;
        line: string;
        /** A hairline that reads on the inverse band. */
        lineInverse: string;
    };
    type: {
        headingFamily: string;
        bodyFamily: string;
        display: number;
        title: number;
        cardTitle: number;
        body: number;
        small: number;
        eyebrow: number;
        headingWeight: string;
        tightTracking: number;
    };
    space: {
        /** Section top/bottom padding. */
        band: number;
        /** Page gutter. */
        gutter: number;
        /** Gap between the major groups inside a section. */
        block: number;
        /** Gap between a heading and its paragraph. */
        text: number;
        /** Padding inside a card. */
        card: number;
    };
    radius: { card: number; control: number; media: number };
    /** "" when the theme is flat, a real box-shadow otherwise. */
    shadow: { card: string; raised: string };
    borderWidth: number;
    mood: "light" | "dark";
};

const CORNERS: Record<ThemeBrief["corners"], Theme["radius"]> = {
    square: { card: 0, control: 0, media: 0 },
    soft: { card: 12, control: 10, media: 12 },
    round: { card: 22, control: 14, media: 20 },
    pill: { card: 26, control: 999, media: 24 },
};

const DENSITY: Record<ThemeBrief["density"], Theme["space"]> = {
    tight: { band: 72, gutter: 32, block: 32, text: 12, card: 22 },
    regular: { band: 104, gutter: 40, block: 48, text: 16, card: 28 },
    airy: { band: 144, gutter: 48, block: 64, text: 20, card: 34 },
};

type TypeSizes = Pick<Theme["type"], "display" | "title" | "cardTitle" | "body" | "small" | "eyebrow">;

const TYPE_SCALE: Record<ThemeBrief["typeScale"], TypeSizes> = {
    compact: { display: 46, title: 32, cardTitle: 19, body: 16, small: 14, eyebrow: 12 },
    balanced: { display: 62, title: 40, cardTitle: 21, body: 17, small: 14, eyebrow: 12 },
    dramatic: { display: 84, title: 50, cardTitle: 23, body: 18, small: 15, eyebrow: 12 },
};

const SAFE_FONT = /^[\w\s'"-]{0,60}$/;

/** Keeps a model-supplied family from becoming arbitrary CSS. */
function safeFont(value: string | undefined, fallback: string) {
    const text = (value ?? "").trim();
    return text && SAFE_FONT.test(text) ? text : fallback;
}

/**
 * Turns the model's handful of choices into every value a block will read.
 *
 * The derivations matter more than the inputs. `surface`, `muted` and `line`
 * are computed *from* the page colour, so a dark page automatically gets
 * lighter panels and a light page darker ones without the model having to
 * reason about it — and without a light-mode hairline turning invisible on a
 * near-black background.
 */
export function resolveTheme(brief: Partial<ThemeBrief>): Theme {
    const mood: "light" | "dark" = brief.mood === "dark" ? "dark" : "light";
    const seed = parseColor(brief.background);
    const page = seed ? toHex(seed) : mood === "dark" ? "#0b0f19" : "#ffffff";

    // Trust the mood over the hex when they disagree: a "dark" brief with a
    // white background would otherwise derive light panels and then place
    // inverse-mood copy on them.
    const dark = isDark(page) || mood === "dark";
    const ink = dark ? "#ffffff" : "#0b1020";

    const text = readableOn(page);
    const surface = dark ? mix(page, "#ffffff", 0.06) : mix(page, "#0b1020", 0.028);
    const inverse = dark ? mix(page, "#ffffff", 0.1) : mix(page, "#0b1020", 0.94);
    const onInverse = readableOn(inverse);

    const accentSeed = parseColor(brief.accent);
    const accent = makeAccentUsable(accentSeed ? toHex(accentSeed) : "#4f46e5", page);

    const separation = brief.separation ?? "line";
    const radius = CORNERS[brief.corners ?? "soft"] ?? CORNERS.soft;
    const space = DENSITY[brief.density ?? "regular"] ?? DENSITY.regular;
    const scale = TYPE_SCALE[brief.typeScale ?? "balanced"] ?? TYPE_SCALE.balanced;

    return {
        color: {
            page,
            surface,
            inverse,
            onInverse,
            onInverseMuted: muteAgainst(inverse, onInverse),
            accent,
            onAccent: readableOn(accent),
            // A tinted wash of the accent, kept close enough to the page that
            // body copy still reads on it.
            accentSoft: mix(page, accent, dark ? 0.16 : 0.1),
            text,
            muted: muteAgainst(page, text),
            line: alpha(ink, dark ? 0.14 : 0.1),
            lineInverse: alpha(onInverse, 0.16),
        },
        type: {
            headingFamily: safeFont(brief.headingFont, ""),
            bodyFamily: safeFont(brief.bodyFont, ""),
            ...scale,
            headingWeight: "700",
            tightTracking: -1.5,
        },
        space,
        radius,
        shadow: separation === "raised"
            ? {
                  card: `0 1px 2px ${alpha(ink, 0.04)}, 0 12px 32px ${alpha(ink, dark ? 0.4 : 0.08)}`,
                  raised: `0 24px 60px ${alpha(ink, dark ? 0.55 : 0.14)}`,
              }
            : { card: "", raised: "" },
        borderWidth: separation === "line" ? 1 : 0,
        mood: dark ? "dark" : "light",
    };
}

/**
 * The colours in play on one band.
 *
 * Sections alternate between the page, a quiet panel and a full inverse band.
 * Resolving that choice into a small object once means a block never has to
 * ask "am I on the dark band?" while deciding a border colour.
 */
export type Surface = {
    key: "page" | "panel" | "inverse" | "accent";
    bg: string;
    text: string;
    muted: string;
    line: string;
    /** The colour a card should be on this surface. */
    card: string;
    /** Accent that still reads against this background. */
    accent: string;
};

export function surfaceOf(theme: Theme, key: Surface["key"]): Surface {
    if (key === "inverse") {
        return {
            key,
            bg: theme.color.inverse,
            text: theme.color.onInverse,
            muted: theme.color.onInverseMuted,
            line: theme.color.lineInverse,
            card: mix(theme.color.inverse, theme.color.onInverse, 0.07),
            accent: contrast(theme.color.accent, theme.color.inverse) >= 3
                ? theme.color.accent
                : mix(theme.color.accent, theme.color.onInverse, 0.45),
        };
    }
    if (key === "accent") {
        return {
            key,
            bg: theme.color.accent,
            text: theme.color.onAccent,
            muted: alpha(theme.color.onAccent, 0.78),
            line: alpha(theme.color.onAccent, 0.24),
            card: mix(theme.color.accent, theme.color.onAccent, 0.12),
            accent: theme.color.onAccent,
        };
    }
    const bg = key === "panel" ? theme.color.surface : theme.color.page;
    return {
        key,
        bg,
        text: theme.color.text,
        muted: theme.color.muted,
        line: theme.color.line,
        // A card must separate from whatever it sits on, so it moves the
        // opposite way from the band it is placed against.
        card: key === "panel" ? theme.color.page : theme.color.surface,
        accent: theme.color.accent,
    };
}
