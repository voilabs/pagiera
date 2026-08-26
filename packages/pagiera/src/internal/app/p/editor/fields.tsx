"use client";

import { IconChevronRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useId, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/*
 * Inspector controls.
 *
 * One grammar for every field: a 28px row, a muted label on the left, the
 * value on the right, and no visible chrome until the row is hovered or
 * focused. Keeping the shell identical everywhere is what stops the panel
 * reading as a pile of unrelated boxes.
 */

const FIELD =
    "flex h-8 items-center gap-2 rounded-lg bg-ed-field px-2.5 text-[12px] text-ed-text transition-colors hover:bg-ed-field-hover focus-within:bg-ed-surface focus-within:ring-1 focus-within:ring-inset focus-within:ring-[var(--ed-accent)]/60";
const LABEL = "shrink-0 text-[11px] text-ed-muted";
const VALUE =
    "min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-ed-faint";

/** Label column width, so every row in a group lines up. */
const LABEL_W = "w-[70px]";

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
        <div className="flex flex-col py-1.5">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={open}
                    className="-ml-1 flex flex-1 items-center gap-1.5 rounded-md py-2 pl-1 text-left text-[11px] font-semibold uppercase tracking-wide text-ed-muted transition-colors hover:text-ed-text"
                >
                    <IconChevronRight
                        size={12}
                        className={`shrink-0 text-ed-faint transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                    />
                    {title}
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
                        <div className="flex flex-col gap-2 pb-3 pt-0.5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
                className="self-start rounded-md px-1.5 py-1 text-[10px] text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-muted"
            >
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
        <div className="flex items-center gap-2">
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

/* ------------------------------------------------------------------- select */

/** Shared shadcn select used by every inspector choice. */
function SelectShell<T extends string>({
    value,
    options,
    onChange,
    className = "",
    ariaLabel,
    id,
}: {
    value: T;
    options: ReadonlyArray<{ label: string; value: T }>;
    onChange: (value: T) => void;
    className?: string;
    ariaLabel?: string;
    id?: string;
}) {
    // Provider-defined fonts and dynamic data can legitimately contain the
    // same value more than once. Radix expects one item per value, so collapse
    // duplicates here instead of leaking unstable React keys into every field.
    const uniqueOptions = Array.from(
        new Map(options.map((option) => [option.value, option])).values(),
    );

    return (
        <Select value={value} onValueChange={(next) => onChange(next as T)}>
            <SelectTrigger
                id={id}
                aria-label={ariaLabel}
                className={`min-w-0 border-transparent bg-ed-field px-2.5 hover:bg-ed-field-hover focus:border-ed-accent ${className || "flex-1"}`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {uniqueOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function SelectInput<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: ReadonlyArray<{ label: string; value: T }>;
    onChange: (value: T) => void;
}) {
    const id = useId();
    return (
        <Row label={label} htmlFor={id}>
            <SelectShell id={id} value={value} options={options} onChange={onChange} />
        </Row>
    );
}

/* --------------------------------------------------------------------- size */

export type SizeChoice = "fixed" | "fill" | "auto" | "screen";

const SIZE_OPTIONS: ReadonlyArray<{ label: string; value: SizeChoice }> = [
    { label: "Fixed", value: "fixed" },
    { label: "Fill", value: "fill" },
    { label: "Hug", value: "auto" },
];
const HEIGHT_SIZE_OPTIONS: ReadonlyArray<{ label: string; value: SizeChoice }> = [
    ...SIZE_OPTIONS,
    { label: "Screen", value: "screen" },
];

/**
 * Width and height in one row. The number and the sizing mode describe the same
 * decision, so splitting them into a cramped three-way toggle plus a separate
 * box was both wider and harder to read.
 */
export function SizeField({
    axis,
    mode,
    value,
    onMode,
    onValue,
    onCommitStart,
    onCommitEnd,
}: {
    axis: "W" | "H";
    mode: SizeChoice;
    value: number;
    onMode: (mode: SizeChoice) => void;
    onValue: (value: number) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
}) {
    const id = useId();
    const name = axis === "W" ? "Width" : "Height";

    return (
        <div className="flex items-center gap-1.5">
            <label htmlFor={id} className={`${LABEL} w-3.5 font-medium`} title={name}>
                {axis}
            </label>

            <div className={`${FIELD} flex-1`}>
                {mode === "fixed" ? (
                    <>
                        <input
                            id={id}
                            type="number"
                            min={1}
                            value={Math.round(value)}
                            onFocus={onCommitStart}
                            onBlur={onCommitEnd}
                            onChange={(event) => {
                                const next = Number(event.target.value);
                                if (Number.isFinite(next)) onValue(Math.max(1, next));
                            }}
                            className={VALUE}
                        />
                        <span className="shrink-0 text-ed-faint">px</span>
                    </>
                ) : (
                    // The layout owns this axis, so there is no number to type.
                    <span className="flex-1 text-right text-ed-faint">
                        {mode === "fill" ? "Fill" : mode === "screen" ? "100vh" : "Hug"}
                    </span>
                )}
            </div>

            <SelectShell
                value={mode}
                options={axis === "H" ? HEIGHT_SIZE_OPTIONS : SIZE_OPTIONS}
                onChange={onMode}
                ariaLabel={`${name} sizing mode`}
                className="w-[76px] shrink-0"
            />
        </div>
    );
}

/* ------------------------------------------------------------------- inputs */

export function NumberInput({
    label,
    value,
    onChange,
    onCommitStart,
    onCommitEnd,
    min,
    max,
    step = 1,
    suffix,
    disabled,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    disabled?: boolean;
}) {
    const id = useId();
    return (
        <Row label={label} htmlFor={id}>
            <div className={FIELD}>
                <input
                    id={id}
                    type="number"
                    value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    onFocus={onCommitStart}
                    onBlur={onCommitEnd}
                    onChange={(event) => {
                        const next = Number(event.target.value);
                        if (!Number.isFinite(next)) return;
                        onChange(
                            Math.min(
                                max ?? Number.MAX_SAFE_INTEGER,
                                Math.max(min ?? -1e9, next),
                            ),
                        );
                    }}
                    className={`${VALUE} disabled:text-ed-faint`}
                />
                {suffix && <span className="shrink-0 text-ed-faint">{suffix}</span>}
            </div>
        </Row>
    );
}

export function TextInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const id = useId();
    return (
        <Row label={label} htmlFor={id}>
            <div className={FIELD}>
                <input
                    id={id}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    className={`${VALUE} text-left`}
                />
            </div>
        </Row>
    );
}

export function ColorInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const id = useId();
    const swatch = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";

    return (
        <Row label={label} htmlFor={id}>
            <div className={FIELD}>
                {/* The native picker writes hex; the text field still accepts
                    rgba()/named colours and CSS variables. */}
                <input
                    type="color"
                    aria-label={`${label} colour picker`}
                    value={swatch}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border border-black/10 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-0"
                />
                <input
                    id={id}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    className={`${VALUE} text-left`}
                />
            </div>
        </Row>
    );
}

/** Segmented control — for two to four short, mutually exclusive choices. */
export function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label?: string;
    value: T;
    options: ReadonlyArray<{ label: string; value: T; icon?: React.ReactNode }>;
    onChange: (value: T) => void;
}) {
    const control = (
        <div className="flex h-8 min-w-0 flex-1 gap-0.5 rounded-lg bg-ed-field p-1">
            {options.map((option) => (
                <button
                    type="button"
                    key={option.value}
                    title={option.label}
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex min-w-0 flex-1 items-center justify-center rounded-md px-1 text-[11px] transition-colors ${
                        value === option.value
                            ? "bg-ed-surface text-ed-text shadow-sm"
                            : "text-ed-muted hover:text-ed-text"
                    }`}
                >
                    <span className="truncate">{option.icon ?? option.label}</span>
                </button>
            ))}
        </div>
    );

    if (!label) return control;
    return (
        <div className="flex items-center gap-2">
            <span className={`${LABEL} ${LABEL_W}`}>{label}</span>
            {control}
        </div>
    );
}

export function SliderInput({
    label,
    value,
    min,
    max,
    step = 1,
    suffix,
    onChange,
    onCommitStart,
    onCommitEnd,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (value: number) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
}) {
    const id = useId();
    return (
        <Row label={label} htmlFor={id}>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onPointerDown={onCommitStart}
                onPointerUp={onCommitEnd}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-7 min-w-0 flex-1 accent-blue-600"
            />
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-ed-muted">
                {Math.round(value)}
                {suffix}
            </span>
        </Row>
    );
}

export function TextArea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className={LABEL}>
                {label}
            </label>
            <textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-[88px] resize-y rounded-lg bg-ed-field p-2.5 text-[12px] leading-relaxed text-ed-text outline-none transition-colors hover:bg-ed-field-hover focus:bg-ed-surface focus:ring-1 focus:ring-inset focus:ring-[var(--ed-accent)]/60"
            />
        </div>
    );
}

/**
 * A full-width code field for the raw CSS/JS escape hatches.
 *
 * These are edited as whole documents rather than single values, so the label
 * sits above the box instead of beside it and the text keeps its own
 * monospaced, non-wrapping layout — wrapped code is unreadable to skim.
 */
export function CodeInput({
    label,
    value,
    onChange,
    placeholder,
    hint,
    rows = 10,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hint?: string;
    rows?: number;
}) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[10px] font-medium text-ed-muted">
                {label}
            </label>
            <textarea
                id={id}
                value={value}
                rows={rows}
                spellCheck={false}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full resize-y rounded-xl bg-ed-field px-3 py-2.5 font-mono text-[10px] leading-[1.6] text-ed-text outline-none ring-ed-accent focus:ring-1"
                style={{ whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
            />
            {hint && <p className="text-[9px] leading-relaxed text-ed-faint">{hint}</p>}
        </div>
    );
}
