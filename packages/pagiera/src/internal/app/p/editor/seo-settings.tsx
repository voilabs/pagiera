"use client";

import type React from "react";
import { useId, useRef, useState } from "react";

import type { DataSource, PageSeo } from "@/lib/editor/types";
import { resolvePageSeo } from "@/lib/render/seo";
import type { SourceSample } from "./data-panel";
import { SelectInput } from "./ui/fields/choice";
import { LABEL } from "./ui/fields/style";

type FieldName = "title" | "description" | "image" | "canonical";

const NONE = "__none__";

const INPUT =
    "pg-field w-full rounded-[9px] bg-ed-surface px-2.5 py-2 text-[13px] leading-relaxed text-ed-text outline-none transition-shadow placeholder:text-ed-faint shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_rgb(24_24_27/0.24)] focus:shadow-[inset_0_0_0_1px_var(--ed-accent),0_0_0_3px_var(--ed-accent-soft)]";

/**
 * Search and sharing metadata for the open page.
 *
 * Static pages type their title and description. A dynamic page such as
 * `/blog/:slug` picks the source that loads the post, and its fields become
 * chips that insert `{{field}}` where the cursor was — so one template gives
 * every post its own title. The preview fills the templates with the source's
 * last tested row, the way a search result would show it.
 */
export function SeoSettings({
    seo = {},
    onChange,
    sources,
    samples,
    slug,
    pageName,
}: {
    seo?: PageSeo;
    onChange: (seo: PageSeo) => void;
    sources: DataSource[];
    samples: Record<string, SourceSample>;
    slug: string;
    pageName: string;
}) {
    const [focused, setFocused] = useState<FieldName>("title");
    const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>>({});
    const dynamic = slug.split("/").some((part) => part.startsWith(":"));
    const params = Object.fromEntries(
        slug.split("/").filter((part) => part.startsWith(":")).map((part) => [part.slice(1), part.slice(1)]),
    );
    const sample = seo.sourceId ? samples[seo.sourceId] : undefined;
    const keys = sample?.keys ?? [];
    const preview = resolvePageSeo(
        { name: pageName, rootStyle: { seo } },
        seo.sourceId && sample?.rows.length ? { [seo.sourceId]: sample.rows } : {},
        { params, query: {}, page: { slug } },
    );

    const set = (patch: Partial<PageSeo>) => {
        const next = { ...seo, ...patch };
        for (const key of Object.keys(next) as Array<keyof PageSeo>) {
            if (next[key] === "" || next[key] === undefined || next[key] === false) delete next[key];
        }
        onChange(next);
    };

    /** Puts `{{key}}` at the cursor of the field last focused. */
    const insert = (token: string) => {
        const field = inputs.current[focused];
        const current = seo[focused] ?? "";
        const start = field?.selectionStart ?? current.length;
        const end = field?.selectionEnd ?? current.length;
        const value = `${current.slice(0, start)}${token}${current.slice(end)}`;
        set({ [focused]: value });
        requestAnimationFrame(() => {
            field?.focus();
            field?.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const text = (name: FieldName, label: string, placeholder: string, hint?: string, multiline = false) => {
        const props = {
            value: seo[name] ?? "",
            placeholder,
            onFocus: () => setFocused(name),
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [name]: event.target.value }),
            className: `${INPUT} ${multiline ? "min-h-[76px] resize-y" : ""}`,
        };
        return (
            <Labelled label={label} hint={hint}>
                {(id) => multiline
                    ? <textarea id={id} ref={(node) => { inputs.current[name] = node; }} {...props} />
                    : <input id={id} type="text" ref={(node) => { inputs.current[name] = node; }} {...props} />}
            </Labelled>
        );
    };

    return (
        <div className="flex flex-col gap-5">
            {/* What a search result would show, filled with sample data. */}
            <div className="rounded-xl bg-ed-subtle p-4">
                <p className="text-[11px] font-medium text-ed-faint">Search preview</p>
                <p className="mt-2 truncate text-[12px] text-ed-muted">/{slug === "home" ? "" : slug}</p>
                <p className="truncate text-[17px] leading-snug text-[#1a0dab]">{preview.title || "Untitled"}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ed-muted">
                    {preview.description ?? "No description — search engines will pick text from the page."}
                </p>
                {preview.noindex && <p className="mt-2 text-[12px] font-medium text-amber-700">Hidden from search engines</p>}
            </div>

            {(dynamic || sources.length > 0) && (
                <div className="flex flex-col gap-2">
                    <SelectInput
                        label="Data"
                        value={seo.sourceId && sources.some((source) => source.id === seo.sourceId) ? seo.sourceId : NONE}
                        options={[
                            { label: "None", value: NONE },
                            ...sources.map((source) => ({ label: source.name, value: source.id })),
                        ]}
                        onChange={(sourceId) => set({ sourceId: sourceId === NONE ? undefined : sourceId })}
                    />
                    <p className="text-[12px] leading-relaxed text-ed-faint">
                        {dynamic
                            ? "Pick the source that loads this page's item — for /blog/:slug, the one requesting the post by {{params.slug}}. Its first row fills the {{field}} tokens below."
                            : "Optional: a source whose first row fills {{field}} tokens below."}
                    </p>
                    {seo.sourceId && (
                        keys.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {keys.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => insert(`{{${key}}}`)}
                                        className="rounded-md bg-ed-surface px-2 py-1 font-mono text-[11px] text-ed-text shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_var(--ed-accent)]"
                                    >
                                        {key}
                                    </button>
                                ))}
                                {Object.keys(params).map((param) => (
                                    <button
                                        key={`param-${param}`}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => insert(`{{params.${param}}}`)}
                                        className="rounded-md bg-ed-surface px-2 py-1 font-mono text-[11px] text-ed-muted shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_var(--ed-accent)]"
                                    >
                                        params.{param}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-lg bg-ed-subtle px-3 py-2 text-[12px] text-ed-muted">
                                Test this source once in the Data panel to see its fields here.
                            </p>
                        )
                    )}
                </div>
            )}

            {text("title", "Title", dynamic ? "{{title}} — Blog" : pageName, "Shown in the browser tab and as the search result's headline. Empty uses the page name.")}
            {text("description", "Description", dynamic ? "{{excerpt}}" : "One or two sentences about this page.", "Tags and line breaks are removed; long text is cut at about 320 characters.", true)}
            {text("image", "Social image", "https://… or {{cover.url}}", "Shown when the link is shared. Use an absolute URL so other sites can load it.")}
            {text("canonical", "Canonical URL", dynamic ? "https://example.com/blog/{{params.slug}}" : "https://example.com/…", "The preferred address of this page, when the same content is reachable at several.")}

            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[13px] text-ed-text">Hide from search engines</p>
                    <p className="text-[12px] text-ed-faint">Adds noindex, nofollow to this page.</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-label="Hide from search engines"
                    aria-checked={seo.noindex === true}
                    onClick={() => set({ noindex: !seo.noindex })}
                    className={`flex h-6 w-10 shrink-0 items-center rounded-full p-1 transition-colors ${seo.noindex ? "bg-ed-accent" : "bg-ed-field"}`}
                >
                    <span className={`size-4 rounded-full bg-white transition-transform motion-reduce:transition-none ${seo.noindex ? "translate-x-4" : ""}`} />
                </button>
            </div>
        </div>
    );
}

function Labelled({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className={LABEL}>{label}</label>
            {children(id)}
            {hint && <p className="text-[12px] leading-relaxed text-ed-faint">{hint}</p>}
        </div>
    );
}
