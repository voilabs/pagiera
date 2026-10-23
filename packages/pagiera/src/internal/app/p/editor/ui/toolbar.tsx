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
            className={cn("flex shrink-0 items-center gap-0.5 rounded-[10px] bg-ed-field p-0.5 shadow-[inset_0_0_0_1px_var(--ed-border)]", className)}
            {...props}
        />
    );
}

/** The hairline between two groups of controls. */
export function ToolDivider({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("mx-1 h-5 w-px shrink-0 bg-[var(--ed-nav-field)]", className)} {...props} />;
}

/** A number the toolbar reports rather than a control: the width, the zoom. */
export function Readout({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            className={cn(
                "flex h-7 shrink-0 select-none items-center rounded-lg bg-ed-field px-2.5 text-[11px] font-medium tabular-nums text-ed-muted shadow-[inset_0_0_0_1px_var(--ed-border)]",
                className,
            )}
            {...props}
        />
    );
}
