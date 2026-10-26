/**
 * Turns a bound value into the text a page shows.
 *
 * APIs return dates as ISO strings or timestamps, prices as bare numbers and
 * missing fields as null. Shown as they arrive, a card reads
 * "2026-10-24T09:12:00.000Z" or simply nothing. A format says how the value
 * should read — a date in words, a price with its currency — and what to show
 * instead when there is no value.
 *
 * Formatting is deterministic: the language and time zone are part of the
 * format rather than taken from whoever happens to render the page, so the
 * editor, the server and the browser all print the same text.
 */

export type BindingFormatKind = "text" | "date" | "number" | "currency";

export type BindingFormat = {
    /** How to read the value. Omitted: shown as it arrives. */
    kind?: BindingFormatKind;
    /**
     * Dates: a preset (`short`, `medium`, `long`, `full`, `time`,
     * `datetime`) or a pattern such as `d MMMM yyyy` or `dd.MM.yyyy HH:mm`.
     */
    pattern?: string;
    /** BCP 47 language for month names and number grouping, e.g. `tr-TR`. */
    locale?: string;
    /** IANA time zone for dates, e.g. `Europe/Istanbul`. Default `UTC`. */
    timeZone?: string;
    /** Numbers: digits after the decimal point. */
    decimals?: number;
    /** Currency: ISO 4217 code, e.g. `TRY`. */
    currency?: string;
    /** Text: letter case. */
    transform?: "upper" | "lower" | "capitalize";
    /** Cut longer text at this many characters and add an ellipsis. */
    maxLength?: number;
    /** Put before / after a non-empty value, e.g. "₺" or " dk". */
    prefix?: string;
    suffix?: string;
    /** Shown when the value is missing, null or an empty string or list. */
    empty?: string;
    /**
     * Replaces whole values: `{ draft: "Taslak", published: "Yayında" }`.
     * The key `*` catches every value not listed.
     */
    map?: Record<string, string>;
    /** Find-and-replace pairs applied to the finished text, in order. */
    replace?: Array<[string, string]>;
};

export const DATE_PRESETS: Record<string, Intl.DateTimeFormatOptions> = {
    short: { dateStyle: "short" },
    medium: { dateStyle: "medium" },
    long: { dateStyle: "long" },
    full: { dateStyle: "full" },
    time: { timeStyle: "short" },
    datetime: { dateStyle: "medium", timeStyle: "short" },
};

const DEFAULT_LOCALE = "en-US";

function isEmpty(value: unknown) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

function safeLocale(locale: string | undefined) {
    if (!locale) return DEFAULT_LOCALE;
    try {
        return Intl.getCanonicalLocales(locale)[0] ?? DEFAULT_LOCALE;
    } catch {
        return DEFAULT_LOCALE;
    }
}

function safeTimeZone(timeZone: string | undefined) {
    if (!timeZone) return "UTC";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
        return timeZone;
    } catch {
        return "UTC";
    }
}

/**
 * Reads a date from what APIs actually send: ISO strings, `2026-10-24`,
 * Unix seconds or milliseconds (as numbers or digit strings).
 */
export function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "number" && Number.isFinite(value)) {
        // Below 10^11 a timestamp can only be seconds: that is the year 5138 in ms.
        return new Date(Math.abs(value) < 1e11 ? value * 1000 : value);
    }
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (/^-?\d{9,13}$/.test(trimmed)) return toDate(Number(trimmed));
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** The calendar parts of a date as seen in one time zone. */
function partsOf(date: Date, locale: string, timeZone: string) {
    const numeric = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hourCycle: "h23",
        weekday: "short",
    }).formatToParts(date);
    const get = (type: string) => numeric.find((part) => part.type === type)?.value ?? "";
    const named = (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
    return {
        year: Number(get("year")),
        month: Number(get("month")),
        day: Number(get("day")),
        hour: Number(get("hour")) % 24,
        minute: Number(get("minute")),
        second: Number(get("second")),
        monthLong: () => named({ month: "long", day: "numeric" }).replace(/[\d\s.,]/g, "") || named({ month: "long" }),
        monthShort: () => named({ month: "short" }),
        weekdayLong: () => named({ weekday: "long" }),
        weekdayShort: () => named({ weekday: "short" }),
    };
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/**
 * Formats with a pattern. Tokens: `yyyy yy MMMM MMM MM M dd d EEEE EEE
 * HH H hh h mm ss a`. Text in single quotes is printed as is: `d 'of' MMMM`.
 */
export function formatDatePattern(date: Date, pattern: string, locale: string, timeZone: string) {
    const parts = partsOf(date, locale, timeZone);
    const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
    const tokens: Record<string, () => string> = {
        yyyy: () => String(parts.year),
        yy: () => pad(parts.year % 100),
        MMMM: parts.monthLong,
        MMM: parts.monthShort,
        MM: () => pad(parts.month),
        M: () => String(parts.month),
        dd: () => pad(parts.day),
        d: () => String(parts.day),
        EEEE: parts.weekdayLong,
        EEE: parts.weekdayShort,
        HH: () => pad(parts.hour),
        H: () => String(parts.hour),
        hh: () => pad(hour12),
        h: () => String(hour12),
        mm: () => pad(parts.minute),
        ss: () => pad(parts.second),
        a: () => (parts.hour < 12 ? "AM" : "PM"),
    };
    return pattern.replace(/'([^']*)'|yyyy|yy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|HH|H|hh|h|mm|ss|a/g, (token, quoted?: string) =>
        quoted !== undefined ? quoted : (tokens[token]?.() ?? token),
    );
}

function formatDate(value: unknown, format: BindingFormat) {
    const date = toDate(value);
    if (!date) return null;
    const locale = safeLocale(format.locale);
    const timeZone = safeTimeZone(format.timeZone);
    const pattern = format.pattern?.trim() || "medium";
    const preset = DATE_PRESETS[pattern];
    if (preset) return new Intl.DateTimeFormat(locale, { timeZone, ...preset }).format(date);
    return formatDatePattern(date, pattern, locale, timeZone);
}

function toNumber(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
    return Number(trimmed.replace(",", "."));
}

function formatNumber(value: unknown, format: BindingFormat) {
    const number = toNumber(value);
    if (number === null) return null;
    const locale = safeLocale(format.locale);
    const digits = format.decimals === undefined ? undefined : Math.min(Math.max(Math.trunc(format.decimals), 0), 10);
    const options: Intl.NumberFormatOptions = digits === undefined
        ? {}
        : { minimumFractionDigits: digits, maximumFractionDigits: digits };
    if (format.kind === "currency") {
        const currency = /^[A-Za-z]{3}$/.test(format.currency ?? "") ? format.currency!.toUpperCase() : "USD";
        return new Intl.NumberFormat(locale, { style: "currency", currency, ...options }).format(number);
    }
    return new Intl.NumberFormat(locale, options).format(number);
}

function applyText(text: string, format: BindingFormat) {
    let out = text;
    // Replacements first, so case and length apply to the finished words.
    for (const [find, replacement] of format.replace ?? []) if (find) out = out.split(find).join(replacement);
    const locale = safeLocale(format.locale);
    if (format.transform === "upper") out = out.toLocaleUpperCase(locale);
    else if (format.transform === "lower") out = out.toLocaleLowerCase(locale);
    else if (format.transform === "capitalize")
        out = out.replace(/(^|\s)(\p{L})/gu, (_match, space: string, letter: string) => space + letter.toLocaleUpperCase(locale));
    if (format.maxLength && format.maxLength > 0) {
        const chars = Array.from(out);
        if (chars.length > format.maxLength) out = `${chars.slice(0, format.maxLength).join("").trimEnd()}…`;
    }
    return out;
}

/**
 * The text for one bound value. Objects and lists that are not empty have no
 * readable text, so they show as empty too — the same as before formats
 * existed.
 */
export function formatValue(value: unknown, format?: BindingFormat): string {
    const fallback = format?.empty ?? "";
    if (format?.map && !isEmpty(value) && typeof value !== "object") {
        const key = String(value);
        if (Object.hasOwn(format.map, key)) value = format.map[key];
        else if (Object.hasOwn(format.map, "*")) value = format.map["*"];
    }
    if (isEmpty(value)) return fallback;
    if (!format || !format.kind) {
        if (typeof value === "object") return fallback;
        const plain = String(value);
        return format ? decorate(applyText(plain, format), format) : plain;
    }
    let text: string | null = null;
    if (format.kind === "date") text = formatDate(value, format);
    else if (format.kind === "number" || format.kind === "currency") text = formatNumber(value, format);
    else if (typeof value !== "object") text = String(value);
    // A value that is not a date (or not a number) is shown as it arrived
    // rather than dropped: a wrong format should not blank the page.
    if (text === null) text = typeof value === "object" ? "" : String(value);
    if (text === "") return fallback;
    return decorate(applyText(text, format), format);
}

function decorate(text: string, format: BindingFormat) {
    return `${format.prefix ?? ""}${text}${format.suffix ?? ""}`;
}

/* ------------------------------------------------------------------ pipes */

/**
 * `{{published_at | date:"d MMMM yyyy" | default:"Taslak"}}` — the template
 * form of a format, for text, links and anywhere else `{{…}}` is read.
 *
 * Filters: `date[:pattern]`, `number[:decimals]`, `currency[:code]`,
 * `upper`, `lower`, `capitalize`, `truncate:n`, `prefix:text`,
 * `suffix:text`, `locale:tr-TR`, `tz:Europe/Istanbul`,
 * `map:draft=Taslak,published=Yayında,*=Diğer`, `replace:"-"," "`, and
 * `default:text` (alias `empty`). Arguments may be quoted.
 */
export function parsePipes(expression: string): { path: string; format?: BindingFormat } {
    const segments = splitPipes(expression);
    const path = (segments.shift() ?? "").trim();
    if (segments.length === 0) return { path };
    const format: BindingFormat = {};
    for (const segment of segments) {
        const at = segment.indexOf(":");
        const name = (at < 0 ? segment : segment.slice(0, at)).trim().toLowerCase();
        const arg = at < 0 ? "" : unquote(segment.slice(at + 1).trim());
        switch (name) {
            case "date":
                format.kind = "date";
                if (arg) format.pattern = arg;
                break;
            case "number":
                format.kind = "number";
                if (arg && /^\d+$/.test(arg)) format.decimals = Number(arg);
                break;
            case "currency":
                format.kind = "currency";
                if (arg) format.currency = arg;
                break;
            case "upper":
            case "lower":
            case "capitalize":
                format.transform = name;
                break;
            case "truncate":
                if (/^\d+$/.test(arg)) format.maxLength = Number(arg);
                break;
            case "prefix":
                format.prefix = arg;
                break;
            case "suffix":
                format.suffix = arg;
                break;
            case "locale":
                format.locale = arg;
                break;
            case "tz":
            case "timezone":
                format.timeZone = arg;
                break;
            case "default":
            case "empty":
                format.empty = arg;
                break;
            case "map": {
                const map: Record<string, string> = { ...format.map };
                for (const pair of splitArgs(segment.slice(at + 1))) {
                    const eq = pair.indexOf("=");
                    if (eq > 0) map[unquote(pair.slice(0, eq).trim())] = unquote(pair.slice(eq + 1).trim());
                }
                format.map = map;
                break;
            }
            case "replace": {
                const [find, replacement = ""] = splitArgs(segment.slice(at + 1)).map((part) => unquote(part.trim()));
                if (find) format.replace = [...(format.replace ?? []), [find, replacement]];
                break;
            }
        }
    }
    return { path, format };
}

/** Splits on `|` outside quotes; `||` is the "or" operator, not a pipe. */
function splitPipes(expression: string) {
    return splitOutside(expression, "|", true);
}

/** Splits filter arguments on commas outside quotes. */
function splitArgs(value: string) {
    return splitOutside(value, ",", false).filter((part) => part.trim() !== "");
}

function splitOutside(source: string, separator: string, skipDoubled: boolean) {
    const out: string[] = [];
    let current = "";
    let quote: string | null = null;
    for (let index = 0; index < source.length; index++) {
        const char = source[index]!;
        if (quote) {
            if (char === "\\" && index + 1 < source.length) {
                current += char + source[++index];
                continue;
            }
            if (char === quote) quote = null;
            current += char;
        } else if (char === '"' || char === "'") {
            quote = char;
            current += char;
        } else if (char === separator) {
            if (skipDoubled && source[index + 1] === separator) {
                current += char + separator;
                index++;
            } else {
                out.push(current);
                current = "";
            }
        } else current += char;
    }
    out.push(current);
    return out;
}

function unquote(value: string) {
    const match = /^(["'])([\s\S]*)\1$/.exec(value);
    return match ? match[2] : value;
}
