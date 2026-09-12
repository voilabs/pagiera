"use client";

import type React from "react";

import { cn } from "@/lib/utils";

/* What the bar arranges its buttons with: groups, rules, and readouts. */

/** Buttons that belong together, spaced the way the chrome spaces them. */
export function ToolGroup({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex shrink-0 items-center gap-0.5", className)} {...props} />;
}

/** A group where exactly one button is on: the tools, the view switches. */
export function SegmentedBar({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("flex shrink-0 items-center gap-0.5 rounded-lg bg-ed-field p-0.5", className)}
            {...props}
        />
    );
}

/** The hairline between two groups of controls. */
export function ToolDivider({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("mx-0.5 h-4 w-px shrink-0 bg-ed-border", className)} {...props} />;
}

/** A number the toolbar reports rather than a control: the width, the zoom. */
export function Readout({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            className={cn(
                "flex h-8 shrink-0 select-none items-center rounded-xl bg-ed-field px-2.5 text-[11px] font-medium tabular-nums text-ed-text",
                className,
            )}
            {...props}
        />
    );
}
