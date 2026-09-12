"use client";

import type React from "react";

import { cn } from "@/lib/utils";

/* The left panel's furniture: its title row, the actions in it, and the one
   search box above whichever list is showing. */

/** The title row at the top of the left panel. */
export function PanelHeader({
    title,
    actions,
    className,
}: {
    title: React.ReactNode;
    /** Buttons at the right end — collapse all, insert, and so on. */
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex h-10 shrink-0 items-center justify-between gap-2 px-3", className)}>
            <span className="min-w-0 truncate text-[12.5px] font-semibold tracking-[-.01em] text-[var(--ed-nav-text)]">
                {title}
            </span>
            {actions && <span className="flex shrink-0 items-center gap-1">{actions}</span>}
        </div>
    );
}

/** A small square action inside a panel header. */
export function PanelAction({
    label,
    className,
    children,
    ...props
}: {
    label: string;
} & Omit<React.ComponentProps<"button">, "aria-label" | "title">) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            className={cn(
                "flex size-6 items-center justify-center rounded-lg text-[var(--ed-nav-muted)] transition-colors hover:bg-[var(--ed-nav-hover)] hover:text-[var(--ed-nav-text)] disabled:cursor-not-allowed disabled:opacity-40",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

/** The one search box above whichever list the panel is showing. */
export function PanelSearch({
    icon,
    className,
    ...props
}: {
    /** The magnifier, passed in so the icon set stays with the caller. */
    icon: React.ReactNode;
} & React.ComponentProps<"input">) {
    return (
        <div className={cn("px-2.5 py-2", className)}>
            <div className="flex h-[30px] items-center gap-2 rounded-[7px] bg-white/[0.055] px-2.5 ring-1 ring-inset ring-white/[0.055] transition-colors focus-within:ring-ed-accent">
                <span className="shrink-0 text-[var(--ed-nav-faint)]">{icon}</span>
                <input
                    type="text"
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--ed-nav-text)] outline-none placeholder:text-[var(--ed-nav-muted)]"
                    {...props}
                />
            </div>
        </div>
    );
}
