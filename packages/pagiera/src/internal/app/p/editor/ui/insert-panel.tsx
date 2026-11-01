"use client";
import { useRef } from "react";
import { IconComponents, IconIcons, IconLayoutGrid, IconSearch, IconX } from "@tabler/icons-react";

/*
 * The Insert panel's own chrome: the view switch and the one search box.
 *
 * Both sit in the panel shell rather than inside the scrolling list, so they
 * stay put while the cards scroll and take the full width of the rows above
 * them (a scroll container reserves room for its bar).
 */

export const INSERT_VIEWS = ["Elements", "Components", "Icons"] as const;
export type InsertView = (typeof INSERT_VIEWS)[number];

const VIEW_ICONS: Record<InsertView, typeof IconLayoutGrid> = {
    Elements: IconLayoutGrid,
    Components: IconComponents,
    Icons: IconIcons,
};

/** A segmented switch between the three things the panel inserts. */
export function InsertViewTabs({ value, onChange }: { value: InsertView; onChange: (view: InsertView) => void }) {
    return (
        <div role="tablist" aria-label="Insert" className="mx-3 mt-2 grid shrink-0 grid-cols-3 gap-0.5 rounded-[10px] bg-ed-field p-[3px]">
            {INSERT_VIEWS.map((view) => {
                const Icon = VIEW_ICONS[view];
                const active = value === view;
                return (
                    <button
                        type="button"
                        role="tab"
                        key={view}
                        aria-selected={active}
                        onClick={() => onChange(view)}
                        className={`flex h-7 items-center justify-center gap-1.5 rounded-[7px] text-[11px] font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:shadow-[var(--ed-accent-glow)] ${active
                            ? "bg-ed-surface text-ed-text shadow-[0_0_0_1px_var(--ed-border),0_1px_2px_var(--ed-border-strong)]"
                            : "text-ed-muted hover:text-ed-text"}`}
                    >
                        <Icon size={13} stroke={1.75} className={active ? "text-ed-accent" : undefined} />
                        {view}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * The search field for a list. It clears from its own button or with Escape,
 * so a filter that hid everything is one key away from undone.
 */
export function InsertSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="px-3 pb-2 pt-2">
            <label className="pg-field flex h-8 items-center gap-2 rounded-[9px] bg-ed-surface px-2.5 shadow-[inset_0_0_0_1px_var(--ed-border-strong)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_var(--ed-accent),0_0_0_3px_var(--ed-accent-soft)]">
                <IconSearch size={14} className="shrink-0 text-ed-faint" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    aria-label={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape" && value) {
                            event.stopPropagation();
                            onChange("");
                        }
                    }}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-ed-text outline-none placeholder:text-ed-faint"
                />
                {value && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                            onChange("");
                            inputRef.current?.focus();
                        }}
                        className="flex size-5 shrink-0 items-center justify-center rounded-md text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                    >
                        <IconX size={12} />
                    </button>
                )}
            </label>
        </div>
    );
}

/** A friendly empty state, with a way out when a search is what emptied it. */
export function InsertEmpty({ title, hint, onClear }: { title: string; hint?: string; onClear?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ed-field text-ed-faint">
                <IconSearch size={16} />
            </span>
            <p className="text-[12px] font-medium text-ed-text">{title}</p>
            {hint && <p className="text-[11px] leading-relaxed text-ed-faint">{hint}</p>}
            {onClear && (
                <button type="button" onClick={onClear} className="mt-1 rounded-lg bg-ed-field px-3 py-1.5 text-[11px] font-medium text-ed-text transition-colors hover:bg-ed-field-hover">
                    Clear search
                </button>
            )}
        </div>
    );
}
