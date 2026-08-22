import {
    BASE_STYLE,
    DATA_SOURCE_NOT_FOUND_BEHAVIORS,
    type DataSource,
    HTTP_METHODS,
    type RequestPair,
    type Breakpoint,
    type CanvasElement,
    DEFAULT_BREAKPOINTS,
    DEFAULT_ROOT_STYLE,
    ELEMENT_TYPES,
    type ElementStyle,
    type ElementType,
    type RootStyle,
    STYLE_KEYS,
    type StyleKey,
} from "./types";

export const MAX_ELEMENTS = 2000;
const MAX_CONTENT = 10_000;
const MAX_SHORT_STRING = 200;
const MAX_URL = 2048;
const COORD_LIMIT = 100_000;

const ELEMENT_TYPE_SET: ReadonlySet<string> = new Set(ELEMENT_TYPES);

export class InvalidElementsError extends Error {}

/* ------------------------------------------------------------------ scalars */

function num(value: unknown, fallback: number, min: number, max: number) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

/** Older AI/preset builds wrote CSS scale multipliers (1.03) while the editor
 * stores percentages (103). Normalize those documents as they are loaded. */
function scalePercent(value: unknown, fallback: number) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = parsed > 0 && parsed <= 5 ? parsed * 100 : parsed;
    return Math.min(500, Math.max(1, normalized));
}

function str(value: unknown, max: number) {
    if (typeof value !== "string") return undefined;
    return value.length > max ? value.slice(0, max) : value;
}

function oneOf<T extends string>(
    value: unknown,
    allowed: readonly T[],
    fallback: T,
): T {
    return typeof value === "string" && (allowed as readonly string[]).includes(value)
        ? (value as T)
        : fallback;
}

/**
 * Colours, gradients, shadows and font stacks are written into a stylesheet on
 * the published page, so a value carrying `;` or `}` could close the rule and
 * inject arbitrary CSS. Strip the characters that can escape a declaration.
 */
function cssValue(value: unknown, fallback: string) {
    const raw = str(value, MAX_SHORT_STRING);
    if (raw === undefined) return fallback;
    const cleaned = raw.replace(/[;{}<>\\]/g, "").replace(/@import/gi, "");
    return cleaned.trim();
}

/**
 * Only http(s) and data: images are allowed through. Anything else — most
 * importantly `javascript:` — is dropped rather than rendered into an href.
 */
function safeUrl(value: unknown): string | undefined {
    const raw = str(value, MAX_URL);
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (trimmed === "") return "";
    // Relative links stay relative; they cannot carry a scheme.
    if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^data:image\//i.test(trimmed)) return trimmed;
    return undefined;
}

/** Safe for interpolation into `url("…")`. */
function imageUrl(value: unknown) {
    const raw = safeUrl(value);
    if (!raw) return "";
    return /["'()\\]/.test(raw) ? "" : raw;
}

/**
 * A binding is a dotted field path such as `author.name`. Restricting the
 * alphabet keeps it a lookup and nothing more.
 */
function bindingPath(value: unknown) {
    const raw = str(value, MAX_SHORT_STRING)?.trim();
    if (!raw) return undefined;
    return /^[A-Za-z0-9_$][A-Za-z0-9_$.-]*$/.test(raw) ? raw : undefined;
}

/* -------------------------------------------------------------------- style */

function parseStyle(input: unknown, base: ElementStyle): ElementStyle {
    const raw = (input && typeof input === "object" ? input : {}) as Record<
        string,
        unknown
    >;

    return {
        x: num(raw.x, base.x, -COORD_LIMIT, COORD_LIMIT),
        y: num(raw.y, base.y, -COORD_LIMIT, COORD_LIMIT),
        constraintX: oneOf(
            raw.constraintX,
            ["start", "center", "end", "stretch"],
            base.constraintX,
        ),
        constraintY: oneOf(
            raw.constraintY,
            ["start", "center", "end", "stretch"],
            base.constraintY,
        ),
        w: num(raw.w, base.w, 1, COORD_LIMIT),
        h: num(raw.h, base.h, 1, COORD_LIMIT),
        widthMode: oneOf(raw.widthMode, ["fixed", "fill", "auto"], base.widthMode),
        heightMode: oneOf(raw.heightMode, ["fixed", "fill", "auto"], base.heightMode),

        layout: oneOf(raw.layout, ["absolute", "stack"], base.layout),
        direction: oneOf(raw.direction, ["row", "column"], base.direction),
        gap: num(raw.gap, base.gap, 0, 999),
        padT: num(raw.padT, base.padT, 0, 9999),
        padR: num(raw.padR, base.padR, 0, 9999),
        padB: num(raw.padB, base.padB, 0, 9999),
        padL: num(raw.padL, base.padL, 0, 9999),
        justify: oneOf(raw.justify, ["start", "center", "end", "between"], base.justify),
        align: oneOf(raw.align, ["start", "center", "end", "stretch"], base.align),
        wrap: raw.wrap === true,
        columns: num(raw.columns, base.columns, 1, 12),

        bg: cssValue(raw.bg, base.bg),
        gradient: cssValue(raw.gradient, base.gradient),
        color: cssValue(raw.color, base.color),
        radius: num(raw.radius, base.radius, 0, 9999),
        opacity: num(raw.opacity, base.opacity, 0, 100),
        borderW: num(raw.borderW, base.borderW, 0, 999),
        borderC: cssValue(raw.borderC, base.borderC),
        borderStyle: oneOf(raw.borderStyle, ["solid", "dashed", "dotted"], base.borderStyle),
        shadow: cssValue(raw.shadow, base.shadow),
        rotate: num(raw.rotate, base.rotate, -360, 360),

        fontFamily: cssValue(raw.fontFamily, base.fontFamily),
        fontSize: num(raw.fontSize, base.fontSize, 1, 999),
        fontWeight: cssValue(raw.fontWeight, base.fontWeight),
        lineHeight: num(raw.lineHeight, base.lineHeight, 0.5, 10),
        letterSpacing: num(raw.letterSpacing, base.letterSpacing, -50, 50),
        textAlign: oneOf(raw.textAlign, ["left", "center", "right", "justify"], base.textAlign),
        textTransform: oneOf(
            raw.textTransform,
            ["none", "uppercase", "lowercase", "capitalize"],
            base.textTransform,
        ),

        overflow: oneOf(raw.overflow, ["visible", "hidden", "auto", "scroll"] as const, base.overflow),
        position: oneOf(raw.position, ["static", "sticky"] as const, base.position),
        stickyOffset: num(raw.stickyOffset, base.stickyOffset, -9999, 9999),
        bgImage: raw.bgImage === undefined ? base.bgImage : imageUrl(raw.bgImage),
        bgSize: oneOf(raw.bgSize, ["cover", "contain", "auto"] as const, base.bgSize),
        bgPosition: cssValue(raw.bgPosition, base.bgPosition),
        blur: num(raw.blur, base.blur, 0, 200),
        backdropBlur: num(raw.backdropBlur, base.backdropBlur, 0, 200),
        blendMode: oneOf(
            raw.blendMode,
            ["normal","multiply","screen","overlay","darken","lighten","difference","luminosity"] as const,
            base.blendMode,
        ),
        scale: scalePercent(raw.scale, base.scale),
        aspectRatio: /^\d{1,3}\/\d{1,3}$/.test(String(raw.aspectRatio ?? ""))
            ? String(raw.aspectRatio)
            : raw.aspectRatio === undefined
              ? base.aspectRatio
              : "",

        entrance: oneOf(
            raw.entrance,
            ["none", "fade", "up", "down", "left", "right", "zoom"] as const,
            base.entrance,
        ),
        entranceDuration: num(raw.entranceDuration, base.entranceDuration, 50, 5000),
        entranceDelay: num(raw.entranceDelay, base.entranceDelay, 0, 5000),
        entranceCurve: oneOf(raw.entranceCurve, ["ease", "spring"], base.entranceCurve),
        entranceBezier: cssValue(raw.entranceBezier, base.entranceBezier),
        springStiffness: num(raw.springStiffness, base.springStiffness, 1, 1000),
        springDamping: num(raw.springDamping, base.springDamping, 1, 100),
        cursor: oneOf(raw.cursor, ["auto", "default", "pointer", "text", "grab", "zoom-in", "none"], base.cursor),

        hidden: raw.hidden === true,
    };
}

/** Keeps only the keys the caller actually set, so the cascade stays intact. */
function parsePartialStyle(
    input: unknown,
    base: ElementStyle,
): Partial<ElementStyle> {
    if (!input || typeof input !== "object") return {};
    const raw = input as Record<string, unknown>;
    const full = parseStyle(raw, base);

    const partial: Partial<ElementStyle> = {};
    for (const key of STYLE_KEYS) {
        if (raw[key] !== undefined) {
            // `as never` narrows the union assignment that TS cannot follow
            // across a generic key.
            partial[key] = full[key] as never;
        }
    }
    return partial;
}

/* ----------------------------------------------------------------- elements */

/**
 * Server Actions are reachable by direct POST, so anything arriving from the
 * client is untrusted. This narrows an unknown payload to a well-formed
 * element list: unknown keys are dropped, numbers clamped, unsafe URLs
 * removed, and orphaned or cyclic `parentId` links severed.
 */
export function parseElements(
    input: unknown,
    /** Whichever breakpoint holds the shared values; it owns `base`, so it can
     *  never also carry an override. */
    baseBreakpointId = "desktop",
): CanvasElement[] {
    if (!Array.isArray(input)) {
        throw new InvalidElementsError("elements must be an array");
    }
    if (input.length > MAX_ELEMENTS) {
        throw new InvalidElementsError(
            `a page cannot hold more than ${MAX_ELEMENTS} elements`,
        );
    }

    const seen = new Set<string>();
    const parsed: CanvasElement[] = [];

    for (const raw of input) {
        if (!raw || typeof raw !== "object") continue;
        const el = upgradeLegacy(raw as Record<string, unknown>);

        const id = str(el.id, MAX_SHORT_STRING);
        if (!id || seen.has(id)) continue;
        if (typeof el.type !== "string" || !ELEMENT_TYPE_SET.has(el.type)) continue;
        seen.add(id);

        const base = parseStyle(el.base, BASE_STYLE);

        const overrides: CanvasElement["overrides"] = {};
        if (el.overrides && typeof el.overrides === "object") {
            for (const [key, value] of Object.entries(
                el.overrides as Record<string, unknown>,
            )) {
                if (!/^[a-zA-Z0-9_-]{1,60}$/.test(key)) continue;
                if (key === baseBreakpointId) continue;
                const partial = parsePartialStyle(value, base);
                if (Object.keys(partial).length > 0) {
                    overrides[key as Breakpoint] = partial;
                }
            }
        }

        const hover = parsePartialStyle(el.hover, base);
        const press = parsePartialStyle(el.press, base);

        parsed.push({
            id,
            type: el.type as ElementType,
            name: str(el.name, MAX_SHORT_STRING),
            parentId: str(el.parentId, MAX_SHORT_STRING),
            z: num(el.z, 0, 0, MAX_ELEMENTS),
            locked: el.locked === true ? true : undefined,
            componentRole:
                el.componentRole === "master" || el.componentRole === "instance"
                    ? el.componentRole
                    : undefined,
            componentId: str(el.componentId, MAX_SHORT_STRING),
            componentSourceId: str(el.componentSourceId, MAX_SHORT_STRING),
            variant: str(el.variant, MAX_SHORT_STRING),
            styleBindings:
                el.styleBindings && typeof el.styleBindings === "object"
                    ? Object.fromEntries(
                          Object.entries(
                              el.styleBindings as Record<string, unknown>,
                          ).flatMap(([key, value]) =>
                              STYLE_KEYS.includes(key as StyleKey) &&
                              typeof value === "string"
                                  ? [[key, value.slice(0, MAX_SHORT_STRING)]]
                                  : [],
                          ),
                      )
                    : undefined,

            content: str(el.content, MAX_CONTENT),
            code: str(el.code, MAX_CONTENT),
            src: safeUrl(el.src),
            alt: str(el.alt, MAX_SHORT_STRING),
            objectFit: oneOf(el.objectFit, ["cover", "contain", "fill", "none"] as const, "cover"),
            iconName: oneOf(el.iconName, ["star", "heart", "arrow-right", "check", "menu", "search"] as const, "star"),
            href: safeUrl(el.href),
            sourceId: str(el.sourceId, MAX_SHORT_STRING),
            binding: bindingPath(el.binding),
            target: oneOf(el.target, ["_self", "_blank"] as const, "_self"),
            interaction:
                el.interaction && typeof el.interaction === "object"
                    ? (() => {
                          const interaction = el.interaction as Record<string, unknown>;
                          const action = oneOf(
                              interaction.action,
                              ["navigate", "scroll-to", "toggle-layer", "show-layer", "hide-layer"] as const,
                              "navigate",
                          );
                          const value =
                              action !== "navigate"
                                  ? str(interaction.value, MAX_SHORT_STRING)?.replace(/[^a-zA-Z0-9_-]/g, "")
                                  : safeUrl(interaction.value);
                          return value
                              ? {
                                    trigger: "click" as const,
                                    action,
                                    value,
                                    target: oneOf(
                                        interaction.target,
                                        ["_self", "_blank"] as const,
                                        "_self",
                                    ),
                                }
                              : undefined;
                      })()
                    : undefined,

            base,
            overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
            hover: Object.keys(hover).length > 0 ? hover : undefined,
            press: Object.keys(press).length > 0 ? press : undefined,
            loop:
                el.loop && typeof el.loop === "object"
                    ? {
                          type: oneOf((el.loop as Record<string, unknown>).type, ["pulse", "float", "spin"], "pulse"),
                          duration: num((el.loop as Record<string, unknown>).duration, 1600, 100, 20000),
                      }
                    : undefined,
            draggable: el.draggable === true ? true : undefined,
        });
    }

    return severBrokenParents(parsed);
}

/**
 * Documents saved before styles moved into `base` stored every style field on
 * the element itself. Lift them so old pages keep working.
 */
function upgradeLegacy(raw: Record<string, unknown>): Record<string, unknown> {
    if (raw.base !== undefined) return raw;

    const legacy = raw as Record<string, unknown>;
    return {
        ...legacy,
        base: {
            x: legacy.x,
            y: legacy.y,
            w: legacy.w,
            h: legacy.h,
            heightMode: legacy.autoHeight === true ? "auto" : "fixed",
            bg: legacy.bg,
            color: legacy.color,
            radius: legacy.radius,
            opacity: legacy.opacity,
            borderW: legacy.borderW,
            borderC: legacy.borderC,
            fontSize: legacy.fontSize,
            fontWeight: legacy.fontWeight,
            hidden: legacy.hidden,
        },
    };
}

/**
 * Drops `parentId` values that point at a missing element or that would form a
 * cycle, so rendering can never recurse forever.
 */
function severBrokenParents(elements: CanvasElement[]): CanvasElement[] {
    const byId = new Map(elements.map((el) => [el.id, el]));

    return elements.map((el) => {
        if (!el.parentId) return el;
        if (el.parentId === el.id || !byId.has(el.parentId)) {
            return { ...el, parentId: undefined };
        }

        const visited = new Set<string>([el.id]);
        let cursor = byId.get(el.parentId);
        while (cursor) {
            if (visited.has(cursor.id)) return { ...el, parentId: undefined };
            visited.add(cursor.id);
            cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
        }
        return el;
    });
}

/* --------------------------------------------------------------- root style */

export function parseRootStyle(input: unknown): RootStyle {
    const raw = (input && typeof input === "object" ? input : {}) as Record<
        string,
        unknown
    >;
    const base = DEFAULT_ROOT_STYLE;
    const breakpoints = Array.isArray(raw.breakpoints)
        ? raw.breakpoints
              .slice(0, 12)
              .flatMap((item) => {
                  if (!item || typeof item !== "object") return [];
                  const value = item as Record<string, unknown>;
                  const id = str(value.id, 60)?.replace(/[^a-zA-Z0-9_-]/g, "");
                  const name = str(value.name, 40)?.trim();
                  if (!id || !name) return [];
                  return [{ id, name, width: num(value.width, 1280, 240, 4000) }];
              })
        : undefined;
    const variables: RootStyle["variables"] = Array.isArray(raw.variables)
        ? raw.variables.slice(0, 100).reduce<NonNullable<RootStyle["variables"]>>((result, item) => {
              if (!item || typeof item !== "object") return result;
              const variable = item as Record<string, unknown>;
              const id = str(variable.id, 60);
              const name = str(variable.name, 60)?.trim();
              if (!id || !name) return result;
              if (variable.type === "color" && typeof variable.value === "string")
                  result.push({ id, name, type: "color", value: cssValue(variable.value, "#000000") });
              if (variable.type === "number" && Number.isFinite(Number(variable.value)))
                  result.push({ id, name, type: "number", value: Number(variable.value) });
              return result;
          }, [])
        : undefined;
    const customFonts: RootStyle["customFonts"] = Array.isArray(raw.customFonts)
        ? raw.customFonts.slice(0, 20).flatMap((item) => {
              if (!item || typeof item !== "object") return [];
              const font = item as Record<string, unknown>;
              const id = str(font.id, 60);
              const name = str(font.name, 80)?.trim();
              const url = safeUrl(font.url);
              if (!id || !name || !url || (!/^https?:\/\//i.test(url) && !url.startsWith("/"))) return [];
              return [{ id, name, url, weight: num(font.weight, 400, 100, 900), style: oneOf(font.style, ["normal", "italic"], "normal") }];
          })
        : undefined;

    return {
        documentMode: oneOf(raw.documentMode, ["page", "component"], base.documentMode),
        maxWidth: num(raw.maxWidth, base.maxWidth, 1, 4000),
        canvasHeight: num(raw.canvasHeight, base.canvasHeight, 1, 12000),
        fullWidth: raw.fullWidth === true,
        bg: cssValue(raw.bg, base.bg),
        layout: oneOf(raw.layout, ["absolute", "stack"], base.layout),
        direction: oneOf(raw.direction, ["row", "column"], base.direction),
        gap: num(raw.gap, base.gap, 0, 999),
        padT: num(raw.padT, base.padT, 0, 9999),
        padR: num(raw.padR, base.padR, 0, 9999),
        padB: num(raw.padB, base.padB, 0, 9999),
        padL: num(raw.padL, base.padL, 0, 9999),
        align: oneOf(raw.align, ["start", "center", "end", "stretch"], base.align),
        fontFamily: cssValue(raw.fontFamily, base.fontFamily),
        // A page may define any set of artboards, so the stored list is kept as
        // it comes; only an empty one falls back to the defaults.
        breakpoints: breakpoints?.length ? breakpoints : undefined,
        // The main breakpoint is whichever one holds the shared values. It has
        // to name a breakpoint that exists, or resolution would find nothing.
        baseBreakpointId: (breakpoints ?? DEFAULT_BREAKPOINTS).some(
            (item) => item.id === raw.baseBreakpointId,
        )
            ? (raw.baseBreakpointId as string)
            : undefined,
        variables,
        customFonts,
    };
}

/**
 * Query params and headers. Values keep their `{{…}}` tokens; encoding and
 * header-injection checks happen at request time in `buildRequest`.
 */
function parsePairs(input: unknown): RequestPair[] {
    if (!Array.isArray(input)) return [];
    const out: RequestPair[] = [];
    for (const raw of input.slice(0, 25)) {
        if (!raw || typeof raw !== "object") continue;
        const row = raw as Record<string, unknown>;
        const key = str(row.key, 120)?.trim();
        if (!key) continue;
        out.push({ key, value: str(row.value, 500)?.trim() ?? "" });
    }
    return out;
}

/** Narrows an untrusted payload to the page's data-source list. */
export function parseDataSources(input: unknown): DataSource[] {
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    const out: DataSource[] = [];

    for (const raw of input.slice(0, 20)) {
        if (!raw || typeof raw !== "object") continue;
        const row = raw as Record<string, unknown>;
        const id = str(row.id, MAX_SHORT_STRING);
        if (!id || seen.has(id)) continue;
        seen.add(id);

        // The URL is only checked for shape here; `assertFetchableUrl` does the
        // network-safety check at request time, where it cannot be bypassed.
        out.push({
            id,
            name: str(row.name, 120)?.trim() || "Untitled source",
            url: str(row.url, MAX_URL)?.trim() ?? "",
            path: bindingPath(row.path) ?? "",
            method: oneOf(row.method, HTTP_METHODS, "GET"),
            body: str(row.body, 20_000)?.trim() ?? "",
            params: parsePairs(row.params),
            headers: parsePairs(row.headers),
            onNotFound: oneOf(row.onNotFound, DATA_SOURCE_NOT_FOUND_BEHAVIORS, "empty"),
        });
    }
    return out;
}

const STATIC_PATH_SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PARAM_PATH_SEGMENT_RE = /^:[a-z][a-z0-9_]*$/;

export function parseSlug(input: unknown): string | null {
    const raw = str(input, 200)?.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!raw) return null;
    const segments = raw.split("/").map((segment) =>
        segment.startsWith(":")
            ? segment
            : segment.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    );
    if (segments.some((segment) => !STATIC_PATH_SEGMENT_RE.test(segment) && !PARAM_PATH_SEGMENT_RE.test(segment))) return null;
    const names = segments.filter((segment) => segment.startsWith(":")).map((segment) => segment.slice(1));
    if (new Set(names).size !== names.length) return null;
    return segments.join("/");
}

export function parseName(input: unknown): string | null {
    const raw = str(input, 120)?.trim();
    return raw && raw.length > 0 ? raw : null;
}
