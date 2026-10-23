"use client";

import { useId } from "react";

import { Row } from "./group";
import { FIELD, LABEL, VALUE } from "./style";

/* Words: a line, a paragraph, or code. */

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
                className="pg-field min-h-[88px] resize-y rounded-[9px] bg-ed-surface p-2.5 text-[13px] leading-relaxed text-ed-text outline-none transition-shadow shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_rgb(24_24_27/0.24)] focus:shadow-[inset_0_0_0_1px_var(--ed-accent),0_0_0_3px_var(--ed-accent-soft)]"
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
                className="pg-field w-full resize-y rounded-[9px] bg-ed-surface px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-ed-text outline-none transition-shadow shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_rgb(24_24_27/0.24)] focus:shadow-[inset_0_0_0_1px_var(--ed-accent),0_0_0_3px_var(--ed-accent-soft)]"
                style={{ whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
            />
            {hint && <p className="text-[10px] leading-relaxed text-ed-faint">{hint}</p>}
        </div>
    );
}
