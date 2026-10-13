import type { CanvasElement, ElementTranslationKeys } from "@/lib/editor/types";

/**
 * One language's strings, as a host hands them over.
 *
 * Flat (`{ "nav.home": "Home" }`) and nested (`{ nav: { home: "Home" } }`)
 * are both accepted, because both are what translation files actually look
 * like and a key such as `nav.home` should find its value in either.
 */
export type Translations = { [key: string]: string | Translations };

/** Answers a key with its string, or nothing when the language has none. */
export type TranslationResolver = (key: string) => string | undefined;

/** The fields of an element a translation may replace. */
export const TRANSLATABLE_FIELDS = ["content", "src", "alt", "href", "placeholder"] as const satisfies ReadonlyArray<keyof ElementTranslationKeys>;

/**
 * Finds a key in a dictionary: as written first, then as a dotted path.
 *
 * Only strings count. A key that names a branch of a nested file, or one that
 * is simply missing, resolves to nothing so the caller keeps the authored
 * value instead of printing `[object Object]` or a blank.
 */
export function lookupTranslation(dictionary: Translations | undefined, key: string): string | undefined {
    if (!dictionary || !key) return undefined;
    const direct = dictionary[key];
    if (typeof direct === "string") return direct;

    let cursor: string | Translations | undefined = dictionary;
    for (const part of key.split(".")) {
        if (!cursor || typeof cursor === "string") return undefined;
        cursor = cursor[part];
    }
    return typeof cursor === "string" ? cursor : undefined;
}

export function resolverFor(dictionary: Translations | undefined): TranslationResolver | undefined {
    return dictionary ? (key) => lookupTranslation(dictionary, key) : undefined;
}

/**
 * The element as it reads in one language.
 *
 * Every field that carries a key takes the language's string for it. A field
 * without a key, or a key the language does not have, keeps what the author
 * typed — so a half-translated site shows its original text rather than holes.
 * Returns the same object when nothing changed, so callers can compare.
 */
export function translateElement(element: CanvasElement, resolve: TranslationResolver | undefined): CanvasElement {
    const keys = element.i18n;
    if (!keys || !resolve) return element;

    let translated: CanvasElement | undefined;
    for (const field of TRANSLATABLE_FIELDS) {
        const key = keys[field];
        if (!key) continue;
        const value = resolve(key);
        if (value === undefined || value === element[field]) continue;
        translated ??= { ...element };
        translated[field] = value;
    }
    return translated ?? element;
}

/** Every key a dictionary defines, dotted, for telling which ones a language lacks. */
export function translationKeys(dictionary: Translations | undefined, prefix = ""): string[] {
    if (!dictionary) return [];
    return Object.entries(dictionary).flatMap(([key, value]) =>
        typeof value === "string" ? [`${prefix}${key}`] : translationKeys(value, `${prefix}${key}.`),
    );
}
