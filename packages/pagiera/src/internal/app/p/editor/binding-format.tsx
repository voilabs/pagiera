"use client";

import type { BindingFormat, BindingFormatKind } from "@/lib/data/format";
import { NumberInput, SelectInput, TextInput } from "./ui";

/**
 * How a bound field reads on the page: as it arrives, as a date, a number or
 * a price, and what to show when the field is empty.
 *
 * The language and time zone are stored with the format, so the canvas, the
 * server and every visitor print the same text. Picking a date or number
 * format fills the language in from the editor's own, which is what an author
 * expects to see; it can be changed afterwards.
 */

const KINDS: Array<{ label: string; value: BindingFormatKind | "" }> = [
    { label: "As it arrives", value: "" },
    { label: "Text", value: "text" },
    { label: "Date", value: "date" },
    { label: "Number", value: "number" },
    { label: "Currency", value: "currency" },
];

const DATE_STYLES = [
    { label: "24.10.2026", value: "short" },
    { label: "24 Eki 2026", value: "medium" },
    { label: "24 Ekim 2026", value: "long" },
    { label: "Cumartesi, 24 Ekim 2026", value: "full" },
    { label: "Date and time", value: "datetime" },
    { label: "Time only", value: "time" },
    { label: "Custom pattern…", value: "custom" },
];

const LOCALES = [
    { label: "Türkçe (tr-TR)", value: "tr-TR" },
    { label: "English (en-US)", value: "en-US" },
    { label: "English (en-GB)", value: "en-GB" },
    { label: "Deutsch (de-DE)", value: "de-DE" },
    { label: "Français (fr-FR)", value: "fr-FR" },
    { label: "Español (es-ES)", value: "es-ES" },
    { label: "العربية (ar-SA)", value: "ar-SA" },
];

const TIME_ZONES = [
    { label: "UTC", value: "UTC" },
    { label: "İstanbul", value: "Europe/Istanbul" },
    { label: "London", value: "Europe/London" },
    { label: "Berlin", value: "Europe/Berlin" },
    { label: "New York", value: "America/New_York" },
    { label: "Los Angeles", value: "America/Los_Angeles" },
    { label: "Dubai", value: "Asia/Dubai" },
    { label: "Tokyo", value: "Asia/Tokyo" },
];

const TRANSFORMS = [
    { label: "Unchanged", value: "" },
    { label: "UPPERCASE", value: "upper" },
    { label: "lowercase", value: "lower" },
    { label: "Capitalize Words", value: "capitalize" },
];

function editorLocale() {
    if (typeof navigator === "undefined") return "en-US";
    const candidate = navigator.language || "en-US";
    return LOCALES.find((item) => item.value.toLowerCase() === candidate.toLowerCase())?.value
        ?? LOCALES.find((item) => item.value.slice(0, 2) === candidate.slice(0, 2).toLowerCase())?.value
        ?? "en-US";
}

/** Keeps the format small: unset keys are removed, and an empty format is none. */
function tidy(format: BindingFormat): BindingFormat | undefined {
    const kept = Object.fromEntries(
        Object.entries(format).filter(([key, value]) => value !== undefined && (value !== "" || key === "empty")),
    ) as BindingFormat;
    return Object.keys(kept).length ? kept : undefined;
}

export function BindingFormatFields({
    format = {},
    onChange,
    media = false,
}: {
    format?: BindingFormat;
    onChange: (format: BindingFormat | undefined) => void;
    /** Image/Video: the field is an address, so only the empty fallback and affixes apply. */
    media?: boolean;
}) {
    const set = (patch: Partial<BindingFormat>) => onChange(tidy({ ...format, ...patch }));
    const kind = format.kind ?? "";
    const pattern = format.pattern ?? "medium";
    const custom = kind === "date" && !DATE_STYLES.some((item) => item.value === pattern && item.value !== "custom");

    return (
        <div className="flex flex-col gap-2 border-t border-ed-border pt-3">
            {!media && (
                <SelectInput
                    label="Format"
                    value={kind}
                    options={KINDS}
                    onChange={(next) => {
                        const value = next || undefined;
                        set({
                            kind: value,
                            // A language makes month names and grouping stable.
                            locale: value && value !== "text" ? (format.locale ?? editorLocale()) : format.locale,
                            pattern: value === "date" ? format.pattern : undefined,
                            timeZone: value === "date" ? format.timeZone : undefined,
                            decimals: value === "number" || value === "currency" ? format.decimals : undefined,
                            currency: value === "currency" ? (format.currency ?? "TRY") : undefined,
                        });
                    }}
                />
            )}

            {kind === "date" && (
                <>
                    <SelectInput
                        label="Style"
                        value={custom ? "custom" : pattern}
                        options={DATE_STYLES}
                        onChange={(next) => set({ pattern: next === "custom" ? "d MMMM yyyy" : next })}
                    />
                    {custom && (
                        <TextInput
                            label="Pattern"
                            value={format.pattern ?? ""}
                            placeholder="d MMMM yyyy, HH:mm"
                            onChange={(next) => set({ pattern: next || undefined })}
                        />
                    )}
                    {custom && (
                        <p className="text-[10px] leading-relaxed text-ed-faint">
                            yyyy year · MMMM month name · MM month · d day · EEEE weekday · HH:mm time · &apos;text&apos; as written
                        </p>
                    )}
                    <SelectInput
                        label="Time zone"
                        value={format.timeZone ?? "UTC"}
                        options={TIME_ZONES.some((item) => item.value === (format.timeZone ?? "UTC"))
                            ? TIME_ZONES
                            : [...TIME_ZONES, { label: format.timeZone ?? "UTC", value: format.timeZone ?? "UTC" }]}
                        onChange={(next) => set({ timeZone: next === "UTC" ? undefined : next })}
                    />
                </>
            )}

            {(kind === "number" || kind === "currency") && (
                <>
                    {kind === "currency" && (
                        <TextInput
                            label="Currency"
                            value={format.currency ?? ""}
                            placeholder="TRY, USD, EUR"
                            onChange={(next) => set({ currency: next.toUpperCase().slice(0, 3) || undefined })}
                        />
                    )}
                    <NumberInput
                        label="Decimals"
                        value={format.decimals ?? (kind === "currency" ? 2 : 0)}
                        min={0}
                        max={10}
                        onChange={(next) => set({ decimals: Math.max(0, Math.min(10, Math.round(next))) })}
                    />
                </>
            )}

            {kind && kind !== "text" && (
                <SelectInput
                    label="Language"
                    value={format.locale ?? "en-US"}
                    options={LOCALES.some((item) => item.value === format.locale) || !format.locale
                        ? LOCALES
                        : [...LOCALES, { label: format.locale, value: format.locale }]}
                    onChange={(next) => set({ locale: next })}
                />
            )}

            {!media && (kind === "" || kind === "text") && (
                <>
                    <SelectInput
                        label="Case"
                        value={format.transform ?? ""}
                        options={TRANSFORMS}
                        onChange={(next) => set({ transform: (next || undefined) as BindingFormat["transform"] })}
                    />
                    <NumberInput
                        label="Max length"
                        value={format.maxLength ?? 0}
                        min={0}
                        max={10000}
                        suffix="chr"
                        onChange={(next) => set({ maxLength: Math.round(next) > 0 ? Math.round(next) : undefined })}
                    />
                </>
            )}

            <TextInput
                label="Before"
                value={format.prefix ?? ""}
                placeholder={media ? "https://cdn…/" : "e.g. ₺ or Yazar: "}
                onChange={(next) => set({ prefix: next || undefined })}
            />
            <TextInput
                label="After"
                value={format.suffix ?? ""}
                placeholder={media ? "?w=800" : "e.g.  dk"}
                onChange={(next) => set({ suffix: next || undefined })}
            />
            <TextInput
                label="If empty"
                value={format.empty ?? ""}
                placeholder={media ? "Fallback image URL" : "Shown when the field is empty"}
                onChange={(next) => set({ empty: next === "" ? undefined : next })}
            />
            <p className="text-[10px] leading-relaxed text-ed-faint">
                {media
                    ? "Before and After wrap a non-empty address. If empty is used when the field is missing; otherwise the element keeps its own source."
                    : "Empty means missing, null, blank text or an empty list. Before and After are added only when there is a value."}
            </p>
        </div>
    );
}
