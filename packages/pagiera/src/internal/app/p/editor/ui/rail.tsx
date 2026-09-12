"use client";

import type React from "react";

import { cn } from "@/lib/utils";

import { ChromeTooltip } from "./tooltip";

/**
 * A destination in the icon rail.
 *
 * The bar down its left edge, not just the tint, is what says which panel is
 * open: at 28px square a colour change alone is easy to miss.
 */
export function RailTab({
    label,
    icon,
    active = false,
    horizontal = false,
    className,
    ...props
}: {
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    /** In a horizontal strip the marker and the tooltip both turn a quarter. */
    horizontal?: boolean;
} & Omit<React.ComponentProps<"button">, "aria-label" | "title">) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "group relative flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                active
                    ? "bg-[var(--ed-accent-soft)] text-ed-accent"
                    : "text-ed-muted hover:bg-ed-field-hover hover:text-ed-text",
                className,
            )}
            {...props}
        >
            {active && !horizontal && <span className="absolute -left-2 h-5 w-0.5 rounded-r bg-ed-accent" />}
            {icon}
            <ChromeTooltip placement={horizontal ? "below" : "right"}>{label}</ChromeTooltip>
        </button>
    );
}
