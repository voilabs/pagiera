"use client";

import type React from "react";
import { useId } from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Row } from "./group";
import { FIELD, LABEL, LABEL_W } from "./style";

/* Picking one of several: a dropdown when the list is long, a segmented bar
   when it is short enough to show every choice at once. */

/** Shared shadcn select used by every inspector choice. */
/** The dropdown every inspector choice is drawn with. */
export function SelectShell<T extends string>({
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
    /** Omitted inside a `Field`, which already names the control above it. */
    label?: string;
    value: T;
    options: ReadonlyArray<{ label: string; value: T }>;
    onChange: (value: T) => void;
}) {
    const id = useId();
    const select = (
        <SelectShell id={id} value={value} options={options} onChange={onChange} />
    );
    return label === undefined ? (
        select
    ) : (
        <Row label={label} htmlFor={id}>
            {select}
        </Row>
    );
}

/** Segmented control — for two to four short, mutually exclusive choices. */
export function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
    comfortable = false,
}: {
    label?: string;
    value: T;
    options: ReadonlyArray<{ label: string; value: T; icon?: React.ReactNode }>;
    onChange: (value: T) => void;
    /** Adds breathing room for prominent tab switches. */
    comfortable?: boolean;
}) {
    const control = (
        <div className={`flex w-full min-w-0 flex-1 gap-0.5 rounded-lg bg-ed-subtle ${comfortable ? "min-h-9 p-0.5" : "h-8 p-0.5"}`}>
            {options.map((option) => (
                <button
                    type="button"
                    key={option.value}
                    title={option.label}
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex min-w-0 flex-1 items-center justify-center rounded-[5px] px-2 text-[11px] font-medium transition-colors ${comfortable ? "py-1.5" : ""} ${
                        value === option.value
                            ? "bg-ed-field-hover text-ed-text shadow-[0_1px_2px_rgb(0_0_0/0.35)]"
                            : "text-ed-muted hover:bg-ed-field/70 hover:text-ed-text"
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
