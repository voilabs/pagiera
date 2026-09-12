"use client";

import { IconChevronRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";

import { LABEL, LABEL_W } from "./style";

/*
 * How the inspector is divided up: sections, rows, and the marks that say a
 * value was set here rather than inherited from a wider artboard.
 */

const GROUP_STATE_KEY = "pagiera:inspector-groups";

function readGroupState(): Record<string, boolean> {
    try {
        return JSON.parse(localStorage.getItem(GROUP_STATE_KEY) ?? "{}");
    } catch {
        return {};
    }
}

/**
 * A collapsible inspector section. Which sections are open is a per-user
 * preference rather than per-element, so it is keyed by title and remembered
 * across reloads.
 */
export function Group({
    title,
    children,
    action,
    defaultOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    // Read after mount so the server and client render the same first pass.
    useEffect(() => {
        const stored = readGroupState()[title];
        if (typeof stored === "boolean") setOpen(stored);
    }, [title]);

    function toggle() {
        setOpen((current) => {
            const next = !current;
            try {
                localStorage.setItem(
                    GROUP_STATE_KEY,
                    JSON.stringify({ ...readGroupState(), [title]: next }),
                );
            } catch {
                // A private-mode storage failure must not break the panel.
            }
            return next;
        });
    }

    return (
        <section className="flex flex-col border-t border-ed-border py-3 first:border-t-0">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={open}
                    className="flex flex-1 items-center justify-between py-1 text-left text-[12px] font-semibold tracking-[-0.01em] text-ed-text transition-colors hover:text-ed-accent"
                >
                    {title}
                    <IconChevronRight
                        size={12}
                        className={`ml-2 shrink-0 text-ed-faint transition-transform duration-200 ${open ? "rotate-90 text-ed-muted" : ""}`}
                    />
                </button>
                {action}
            </div>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-1.5 pb-1 pt-2">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

/**
 * Hides the controls most edits never touch, so a group opens with only the
 * handful of fields that carry the common cases.
 */
export function More({
    children,
    label = "More options",
}: {
    children: React.ReactNode;
    label?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="more"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-2">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                type="button"
                onClick={() => setOpen((c) => !c)}
                className="flex items-center gap-1 self-start rounded-md px-1.5 py-1 text-[10px] text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-muted"
            >
                <IconChevronRight size={11} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                {open ? "Less" : label}
            </button>
        </div>
    );
}

/**
 * Marks a control whose value comes from a wider breakpoint. A hairline in the
 * gutter reads as a margin note instead of competing with the control itself.
 */
export function Overridable({
    overridden,
    onReset,
    children,
}: {
    overridden: boolean;
    onReset?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="relative">
            {overridden && onReset && (
                <button
                    type="button"
                    title="Overridden here — click to inherit again"
                    aria-label="Reset to the inherited value"
                    onClick={onReset}
                    className="absolute -left-2.5 bottom-1 top-1 w-[3px] rounded-full bg-amber-400 transition-colors hover:bg-amber-500"
                />
            )}
            {children}
        </div>
    );
}

/** A labelled row; the label column keeps every control aligned. */
/**
 * A control with its label above it.
 *
 * `Row` puts the label in a fixed-width column beside the control, which reads
 * well for a single value but wastes the panel's width as soon as two controls
 * belong together — the pair ends up squeezed into what is left after the
 * label. Stacking the label frees the full width for the controls, so
 * coordinates, sizes and paddings can sit side by side and be compared.
 */
export function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className={LABEL} title={hint}>
                {label}
            </span>
            {children}
        </div>
    );
}

/** Two controls of equal weight, side by side. */
export function Pair({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function Row({
    label,
    children,
    htmlFor,
}: {
    label: string;
    children: React.ReactNode;
    htmlFor?: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            {htmlFor ? (
                <label htmlFor={htmlFor} className={`${LABEL} ${LABEL_W}`}>
                    {label}
                </label>
            ) : (
                <span className={`${LABEL} ${LABEL_W}`}>{label}</span>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
        </div>
    );
}
