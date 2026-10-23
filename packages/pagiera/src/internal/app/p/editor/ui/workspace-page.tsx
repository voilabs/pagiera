"use client";

import type React from "react";

import { cn } from "@/lib/utils";

/**
 * A full workspace page — Settings, Templates — rather than a sheet laid
 * over the canvas.
 *
 * Its own navigation runs down the left of one white card and the content
 * scrolls beside it. Nothing of the canvas shows through: a settings screen
 * that still had artboards, the dock and the selection chrome alive behind it
 * read as a fake page dropped on top of the editor.
 */
export function WorkspacePage({
    nav,
    title,
    description,
    actions,
    children,
    className,
}: {
    /** The page's own section list. */
    nav: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** Buttons at the right of the title row. */
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className="flex h-full min-h-0">
            <aside className="custom-scrollbar w-[232px] shrink-0 overflow-y-auto border-r border-ed-border px-3 py-4">
                {nav}
            </aside>
            <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto">
                <div className={cn("mx-auto w-full max-w-[1040px] px-10 py-10", className)}>
                    {(title || actions) && (
                        <header className="mb-8 flex items-start justify-between gap-6">
                            <div className="min-w-0">
                                {title && <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ed-text">{title}</h1>}
                                {description && <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-ed-muted">{description}</p>}
                            </div>
                            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                        </header>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}

/** One entry in a workspace page's section list. */
export function WorkspaceNavItem({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    icon?: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ed-accent-glow)]",
                active
                    ? "bg-[var(--ed-nav-active)] font-medium text-ed-text"
                    : "text-ed-muted hover:bg-[var(--ed-nav-hover)] hover:text-ed-text",
            )}
        >
            {icon && <span className={active ? "text-ed-text" : "text-ed-faint"}>{icon}</span>}
            <span className="truncate">{label}</span>
        </button>
    );
}

/** The heading over a workspace page's section list. */
export function WorkspaceNavTitle({ children }: { children: React.ReactNode }) {
    return <p className="px-2.5 pb-2 pt-1 text-[13px] font-semibold text-ed-text">{children}</p>;
}
