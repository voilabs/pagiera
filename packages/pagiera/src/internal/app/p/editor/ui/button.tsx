"use client";

import type React from "react";

import { cn } from "@/lib/utils";

import { ChromeTooltip } from "./tooltip";

/*
 * The editor's buttons.
 *
 * Two shapes cover the whole chrome: a square holding an icon, and a short
 * worded one. How they react — quiet, segmented, or filled — is the tone table
 * below, so changing every button in the toolbar at once is changing one
 * object rather than forty class strings.
 */

/** How a button reacts, and what "on" looks like for it. */
export type ToolTone =
    /** The default: quiet until hovered; accent-tinted when on. */
    | "ghost"
    /** One choice inside a segmented group: lifts to the surface when on. */
    | "segment"
    /** On means filled with the accent — for a state you must not miss. */
    | "solid";

const TOOL_SIZES = {
    sm: "size-6",
    md: "size-7",
    lg: "size-8",
} as const;

const TOOL_TONES: Record<ToolTone, { rest: string; on: string }> = {
    ghost: {
        rest: "text-ed-muted hover:bg-ed-field hover:text-ed-text",
        on: "bg-[var(--ed-accent-soft)] text-ed-accent",
    },
    segment: {
        rest: "text-ed-muted hover:text-ed-text",
        on: "bg-ed-surface text-ed-text shadow-sm",
    },
    solid: {
        rest: "text-ed-muted hover:bg-ed-field-hover hover:text-ed-text",
        on: "bg-ed-accent text-white",
    },
};

/**
 * An icon button in the chrome.
 *
 * `label` is the whole accessible story — the title, the aria-label, and the
 * tooltip if one is asked for — because a square with a glyph in it is not
 * self-explanatory to anyone who cannot see it.
 */
export function ToolButton({
    label,
    active = false,
    tone = "ghost",
    size = "md",
    tooltip,
    className,
    children,
    ...props
}: {
    label: string;
    active?: boolean;
    tone?: ToolTone;
    size?: keyof typeof TOOL_SIZES;
    /** Where the hover label appears, if at all. */
    tooltip?: "below" | "right";
} & Omit<React.ComponentProps<"button">, "aria-label" | "title">) {
    const tones = TOOL_TONES[tone];
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "group relative flex shrink-0 items-center justify-center rounded-md transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ed-muted",
                TOOL_SIZES[size],
                active ? tones.on : tones.rest,
                className,
            )}
            {...props}
        >
            {children}
            {tooltip && <ChromeTooltip placement={tooltip}>{label}</ChromeTooltip>}
        </button>
    );
}

/** A worded button: back to canvas, back to pages, and the like. */
export function ChromeButton({ className, ...props }: React.ComponentProps<"button">) {
    return (
        <button
            type="button"
            className={cn(
                "h-7 shrink-0 select-none rounded-lg bg-ed-field px-3 text-[10px] font-semibold text-ed-text transition-colors hover:bg-ed-field-hover disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        />
    );
}
