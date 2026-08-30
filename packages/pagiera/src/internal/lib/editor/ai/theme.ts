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

/* ---------------------------------------------------------------- hue work */

type Hsl = { h: number; s: number; l: number };

function toHsl({ r, g, b }: Rgb): Hsl {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === red
        ? ((green - blue) / d + (green < blue ? 6 : 0))
        : max === green
            ? (blue - red) / d + 2
            : (red - green) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
}

function fromHsl({ h, s, l }: Hsl): Rgb {
    const hue = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * clamp(s, 0, 1);
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        hue < 60 ? [c, x, 0] :
        hue < 120 ? [x, c, 0] :
        hue < 180 ? [0, c, x] :
        hue < 240 ? [0, x, c] :
        hue < 300 ? [x, 0, c] : [c, 0, x];
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Rotates a colour around the wheel, keeping its saturation and lightness.
 *
 * This is what makes a gradient look designed rather than generated: a ramp
 * from a colour to a lighter version of itself reads as a fade, while a ramp
 * to its analogous neighbour reads as light passing through something. A grey
 * has no hue to rotate, so it is returned untouched rather than being given an
 * arbitrary one.
 */
export function shiftHue(color: string, degrees: number) {
    const rgb = parseColor(color);
    if (!rgb) return color;
    const hsl = toHsl(rgb);
    if (hsl.s < 0.08) return color;
    return toHex(fromHsl({ ...hsl, h: hsl.h + degrees }));
}

/** Moves a colour toward white (positive) or black (negative). */
export function lighten(color: string, amount: number) {
    return mix(color, amount >= 0 ? "#ffffff" : "#000000", Math.abs(amount));
}

/**
 * The largest tint of `ink` over `base` that still lets `text` be read.
 *
 * Every atmospheric effect here — the wash behind a hero, the tint on a
 * featured card, the colour bled into an inverse band — is a colour laid over
 * a surface whose text has already been chosen. Rather than picking a strength
 * that "looks about right" and hoping, the strength is walked down until the
 * text measurably still passes. An effect can therefore never be the reason a
 * headline stops being readable; at worst it fades away to nothing.
 */
function safeTint(base: string, ink: string, text: string, wanted: number, floor = 4.5) {
    for (let amount = wanted; amount > 0.02; amount -= 0.02) {
        if (contrast(text, mix(base, ink, amount)) >= floor) return amount;
    }
    return 0;
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

/* -------------------------------------------------------------- variation */

/**
 * A stable number derived from text.
 *
 * Used to choose between equally valid options when the model did not choose
 * for itself. Deterministic on purpose: the same brief twice produces the same
 * page, so a regeneration is a decision the author makes rather than a dice
 * roll they cannot repeat.
 */
export function hashSeed(text: string) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/**
 * One option from a list, chosen by seed.
 *
 * `salt` separates independent decisions that share a seed, so a page does not
 * pick the first option of every list simply because its hash was low.
 */
export function pickBySeed<T>(options: readonly T[], seed: number, salt = 0): T {
    const mixed = Math.imul(seed ^ Math.imul(salt + 1, 2654435761), 2246822519) >>> 0;
    return options[mixed % options.length];
}

/**
 * Palettes to fall back on, rather than one hard-coded indigo.
 *
 * A missing colour used to mean every page in the product came out
 * blue-on-white, which is the single loudest way a generator announces itself.
 * These are real pairings — a background and a brand colour that belong
 * together — so an unspecified palette still looks chosen.
 */
const FALLBACK_PALETTES: Record<"light" | "dark", Array<{ background: string; accent: string }>> = {
    light: [
        { background: "#ffffff", accent: "#1a4fd6" },
        { background: "#fdfcfa", accent: "#b4530a" },
        { background: "#f7f8f5", accent: "#0f766e" },
        { background: "#fffdf9", accent: "#b42318" },
        { background: "#fafaff", accent: "#5b21b6" },
        { background: "#f6f5f3", accent: "#1f2937" },
    ],
    dark: [
        { background: "#0a0b0f", accent: "#6d5cff" },
        { background: "#07110f", accent: "#2dd4a7" },
        { background: "#0d0a12", accent: "#f43f5e" },
        { background: "#080d14", accent: "#38bdf8" },
        { background: "#100c07", accent: "#f59e0b" },
        { background: "#0b0b0b", accent: "#e8ff3f" },
    ],
};

const AXES = {
    typeScale: ["compact", "balanced", "dramatic"],
    density: ["tight", "regular", "airy"],
    corners: ["square", "soft", "round", "pill"],
    separation: ["flat", "line", "raised"],
    finish: ["matte", "tinted", "luminous", "vivid"],
} as const;

/**
 * Completes a partial brief, choosing anything the model left out.
 *
 * The alternative — defaulting every gap to one fixed value — is what made the
 * generator produce the same page for every request a weaker model answered
 * vaguely. Choosing by seed keeps each brief's result stable while making two
 * different briefs look genuinely different.
 *
 * No value is weighted over another. Every axis value is an equally valid
 * answer, and choosing between them is the model's decision, not this file's.
 */
export function fillThemeBrief(partial: Partial<ThemeBrief>, seed: number): Partial<ThemeBrief> {
    const mood = partial.mood ?? pickBySeed(["light", "dark"] as const, seed, 1);
    const palette = pickBySeed(FALLBACK_PALETTES[mood], seed, 2);
    return {
        ...partial,
        mood,
        background: parseColor(partial.background) ? partial.background : palette.background,
        accent: parseColor(partial.accent) ? partial.accent : palette.accent,
        typeScale: partial.typeScale ?? pickBySeed(AXES.typeScale, seed, 3),
        density: partial.density ?? pickBySeed(AXES.density, seed, 4),
        corners: partial.corners ?? pickBySeed(AXES.corners, seed, 5),
        separation: partial.separation ?? pickBySeed(AXES.separation, seed, 6),
        finish: partial.finish ?? pickBySeed(AXES.finish, seed, 7),
    };
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
    /**
     * The atmosphere laid over the palette.
     *
     * Separate from `separation`, which is about how a card is edged. This is
     * the difference between a page that is merely correct and one that looks
     * like it was art-directed: whether light appears to fall on it.
     *
     * `matte` paints flat colour. `tinted` adds a soft wash behind the hero and
     * a gradient on the primary control. `luminous` extends that to inverse
     * bands, featured cards and a glass navigation bar. `vivid` pushes the
     * ramps further and adds coloured glow under the primary actions.
     */
    finish: "matte" | "tinted" | "luminous" | "vivid";
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
    /**
     * The atmosphere. Every field is "" or null when the finish does not call
     * for it, so a block can apply them unconditionally and a matte theme
     * simply receives nothing.
     */
    effect: {
        /** A wash painted behind the hero. A CSS gradient, or "". */
        heroWash: string;
        /** A quieter wash for one mid-page band. */
        bandWash: string;
        /** The ramp on primary controls and featured surfaces. */
        accentGradient: string;
        /** The ramp painted across an inverse band. */
        inverseGradient: string;
        /** A tinted ramp for a featured card, over the page. */
        featureGradient: string;
        /** Coloured glow under the primary action; "" unless vivid. */
        glow: string;
        /** Shadow under photography and product shots. */
        media: string;
        /** Lift applied to a card on hover; "" when the theme is flat. */
        hoverShadow: string;
        /** Set when the navigation bar should be glass. */
        glass: { opacity: number; blur: number } | null;
    };
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
        effect: resolveEffect({ finish: brief.finish ?? "tinted", page, text, accent, inverse, onInverse, dark, ink }),
    };
}

/**
 * Turns the finish into the actual gradients, glows and glass.
 *
 * Kept apart from `resolveTheme` because the reasoning is different in kind:
 * above, roles are derived so the page is *correct*; here, light is added so
 * the page is *attractive*. Every value is still measured — a wash that would
 * cost the headline its contrast is reduced until it does not, and a gradient
 * whose far end would swallow a button label is pulled back toward the accent.
 */
function resolveEffect(input: {
    finish: NonNullable<ThemeBrief["finish"]>;
    page: string;
    text: string;
    accent: string;
    inverse: string;
    onInverse: string;
    dark: boolean;
    ink: string;
}): Theme["effect"] {
    const { finish, page, text, accent, inverse, onInverse, dark, ink } = input;
    const none: Theme["effect"] = {
        heroWash: "", bandWash: "", accentGradient: "", inverseGradient: "",
        featureGradient: "", glow: "", media: "", hoverShadow: "", glass: null,
    };
    if (finish === "matte") {
        return { ...none, media: `0 20px 44px -20px ${alpha(ink, dark ? 0.6 : 0.22)}` };
    }

    const strength = finish === "vivid" ? 1 : finish === "luminous" ? 0.75 : 0.5;
    const onAccent = readableOn(accent);

    // The far end of the accent ramp: an analogous hue, brightened a little,
    // then pulled back toward the accent until the control's label still reads.
    const accentEnd = (() => {
        const candidate = lighten(shiftHue(accent, dark ? -26 : 24), dark ? 0.1 : -0.06);
        for (const towards of [0, 0.3, 0.55, 0.8]) {
            const value = mix(candidate, accent, towards);
            if (contrast(value, onAccent) >= 4.5) return value;
        }
        return accent;
    })();

    // Washes are laid over the page, so their strength is capped by what the
    // body text can still be read against.
    const washAmount = safeTint(page, accent, text, (dark ? 0.3 : 0.18) * strength);
    const bandAmount = safeTint(page, shiftHue(accent, 40), text, (dark ? 0.2 : 0.12) * strength);
    const inverseAmount = safeTint(inverse, accent, onInverse, 0.3 * strength);

    const heroWash = washAmount > 0.03
        ? `radial-gradient(120% 90% at 50% -20%, ${alpha(accent, washAmount)} 0%, ${alpha(accent, 0)} 62%)`
        : "";

    return {
        heroWash,
        bandWash: bandAmount > 0.03
            ? `radial-gradient(90% 120% at 100% 0%, ${alpha(shiftHue(accent, 40), bandAmount)} 0%, ${alpha(accent, 0)} 60%)`
            : "",
        accentGradient: accentEnd === accent ? "" : `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)`,
        inverseGradient: finish === "tinted" || inverseAmount <= 0.03
            ? ""
            : `linear-gradient(155deg, ${alpha(accent, 0)} 20%, ${alpha(accent, inverseAmount)} 100%)`,
        featureGradient: finish === "tinted"
            ? ""
            : `linear-gradient(165deg, ${alpha(accent, 0.14 * strength)} 0%, ${alpha(accent, 0.02)} 100%)`,
        glow: finish === "vivid" ? `0 14px 34px -10px ${alpha(accent, 0.55)}` : "",
        media: `0 30px 64px -24px ${alpha(ink, dark ? 0.7 : 0.28)}`,
        hoverShadow: `0 18px 40px -16px ${alpha(ink, dark ? 0.65 : 0.2)}`,
        glass: finish === "luminous" || finish === "vivid" ? { opacity: 72, blur: 16 } : null,
    };
}

/**
 * The atmospheric backgrounds a section can ask for.
 *
 * The engine had no way to express these at all: a band was a flat colour, a
 * quiet panel or a full inverse block, so every hero was a rectangle of one
 * colour no matter what the brief wanted. These are the treatments that
 * actually distinguish a designed hero — and because each is built from the
 * theme's own accent at a strength measured against the band's text, none of
 * them can make the headline unreadable.
 */
export const BACKDROPS = ["none", "wash", "spotlight", "aurora", "mesh", "grid", "vignette"] as const;
export type Backdrop = (typeof BACKDROPS)[number];

/**
 * The CSS background for one backdrop, or "" when the theme is too flat for it.
 *
 * `over` is the colour the band is painted in and `text` what will be read on
 * it; every tint is walked down until that text still passes, so a bold
 * treatment on a pale palette quietly becomes a subtle one rather than an
 * illegible one.
 */
export function backdropFor(theme: Theme, kind: Backdrop, over: string, text: string): string {
    if (kind === "none") return "";
    const accent = theme.color.accent;
    const second = shiftHue(accent, theme.mood === "dark" ? -38 : 32);
    const ink = theme.mood === "dark" ? "#ffffff" : "#0b1020";
    // A matte theme has deliberately renounced atmosphere; honour that.
    const ceiling = theme.effect.heroWash || theme.effect.accentGradient ? 1 : 0.35;

    const tint = (colour: string, wanted: number) => alpha(colour, safeTint(over, colour, text, wanted * ceiling));

    switch (kind) {
        case "wash":
            return `radial-gradient(120% 90% at 50% -20%, ${tint(accent, 0.26)} 0%, ${alpha(accent, 0)} 62%)`;
        case "spotlight":
            return `radial-gradient(70% 60% at 20% 0%, ${tint(accent, 0.3)} 0%, ${alpha(accent, 0)} 70%)`;
        case "aurora":
            return [
                `radial-gradient(60% 70% at 10% 10%, ${tint(accent, 0.3)} 0%, ${alpha(accent, 0)} 65%)`,
                `radial-gradient(55% 65% at 85% 20%, ${tint(second, 0.26)} 0%, ${alpha(second, 0)} 70%)`,
                `radial-gradient(70% 60% at 50% 100%, ${tint(accent, 0.18)} 0%, ${alpha(accent, 0)} 70%)`,
            ].join(", ");
        case "mesh":
            return [
                `radial-gradient(45% 55% at 15% 25%, ${tint(accent, 0.28)} 0%, ${alpha(accent, 0)} 70%)`,
                `radial-gradient(40% 50% at 75% 10%, ${tint(second, 0.24)} 0%, ${alpha(second, 0)} 70%)`,
                `radial-gradient(50% 45% at 60% 85%, ${tint(second, 0.2)} 0%, ${alpha(second, 0)} 70%)`,
                `radial-gradient(35% 45% at 90% 70%, ${tint(accent, 0.22)} 0%, ${alpha(accent, 0)} 70%)`,
            ].join(", ");
        case "grid": {
            // A hairline lattice, written as repeating gradients rather than a
            // tiled one: the renderer only emits `background-size` alongside a
            // background *image*, so a tiled pattern would arrive stretched
            // across the whole band instead of repeating.
            const line = alpha(ink, theme.mood === "dark" ? 0.09 : 0.06);
            return [
                `repeating-linear-gradient(to right, ${line} 0 1px, transparent 1px 64px)`,
                `repeating-linear-gradient(to bottom, ${line} 0 1px, transparent 1px 64px)`,
            ].join(", ");
        }
        case "vignette":
            return `radial-gradient(120% 100% at 50% 40%, ${alpha(ink, 0)} 40%, ${alpha(ink, theme.mood === "dark" ? 0.5 : 0.1)} 100%)`;
        default:
            return "";
    }
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
    /** Accent that still reads against this background, as a fill. */
    accent: string;
    /**
     * The accent as *text*.
     *
     * A brand colour is validated as a button fill — dark enough that a white
     * label reads on it. That says nothing about the colour set at 12px on the
     * page behind it, and a mid-tone accent used for an eyebrow lands around
     * 2.8:1. This is the same hue walked until it is readable as type.
     */
    accentText: string;
};

/** Darkens or lightens a colour against a background until type reads on it. */
function accentAsText(accent: string, background: string) {
    if (contrast(accent, background) >= 4.5) return accent;
    const towards = isDark(background) ? "#ffffff" : "#000000";
    for (const amount of [0.15, 0.3, 0.45, 0.6, 0.75]) {
        const candidate = mix(accent, towards, amount);
        if (contrast(candidate, background) >= 4.5) return candidate;
    }
    return readableOn(background);
}

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
            accentText: accentAsText(theme.color.accent, theme.color.inverse),
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
            accentText: theme.color.onAccent,
        };
    }
    const bg = key === "panel" ? theme.color.surface : theme.color.page;
    return {
        key,
        bg,
        text: theme.color.text,
        // Recomputed against this band rather than reused from the page. The
        // panel colour is a shade off the page colour, and a muted tone tuned
        // to one of them lands just under the threshold on the other — which
        // is exactly where small print stops being readable.
        muted: key === "panel" ? muteAgainst(bg, theme.color.text) : theme.color.muted,
        line: theme.color.line,
        // A card must separate from whatever it sits on, so it moves the
        // opposite way from the band it is placed against.
        card: key === "panel" ? theme.color.page : theme.color.surface,
        accent: theme.color.accent,
        accentText: accentAsText(theme.color.accent, bg),
    };
}
