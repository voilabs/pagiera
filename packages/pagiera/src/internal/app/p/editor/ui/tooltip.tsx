"use client";

import type React from "react";

import { cn } from "@/lib/utils";

/**
 * The label that appears on hover, inverted so it reads over anything.
 *
 * It lives on the button rather than in a layer of its own, so a control only
 * has to be marked `group` for its name to appear beside it.
 */
export function ChromeTooltip({
    placement = "below",
    className,
    children,
}: {
    placement?: "below" | "right";
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            role="tooltip"
            className={cn(
                "pointer-events-none absolute z-[100] w-max whitespace-nowrap rounded-md bg-[var(--ed-tooltip)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--ed-tooltip-text)] opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
                placement === "below"
                    ? "left-1/2 top-[calc(100%+9px)] -translate-x-1/2 translate-y-1 group-hover:translate-y-0 group-focus-visible:translate-y-0"
                    : "left-[calc(100%+10px)] group-hover:translate-x-0.5",
                className,
            )}
        >
            {children}
        </span>
    );
}
