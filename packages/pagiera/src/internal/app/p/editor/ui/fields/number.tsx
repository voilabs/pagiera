"use client";

import type React from "react";
import { useEffect, useId, useRef, useState } from "react";

import { Row } from "./group";
import { FIELD, LABEL, VALUE } from "./style";

/* Numbers: typed, dragged, or slid. */

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
    compact,
}: {
    /** Omitted inside a `Field`, which already names the control above it. */
    label?: string;
    value: number;
    onChange: (value: number) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    disabled?: boolean;
    /**
     * Stacks the label above the field instead of beside it.
     *
     * The side-by-side row reserves a fixed 70px for the label, which is most
     * of the space when two of these share a 280px panel — the four border
     * sides used to overflow the inspector entirely.
     */
    compact?: boolean;
}) {
    const id = useId();
    const field = (
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
    );

    if (compact) {
        return label === undefined ? (
            field
        ) : (
            <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={id} className="truncate text-[10px] text-ed-muted">
                    {label}
                </label>
                {field}
            </div>
        );
    }

    return label === undefined ? (
        field
    ) : (
        <Row label={label} htmlFor={id}>
            {field}
        </Row>
    );
}

/**
 * A value you nudge and a value you type, on one row.
 *
 * Type sizes and line heights are usually adjusted by feel — the slider is the
 * fast way to find the size — but they are also often set to an exact number a
 * design system dictates. Neither control alone covers both.
 */
export function ScrubInput({
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
    const safe = Number.isFinite(value) ? value : min;
    return (
        <Row label={label} htmlFor={id}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={Math.min(max, Math.max(min, safe))}
                aria-label={`${label} slider`}
                onPointerDown={onCommitStart}
                onPointerUp={onCommitEnd}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-6 min-w-0 flex-1 cursor-ew-resize appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ed-accent [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-ed-field-hover [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-ed-field-hover [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ed-accent"
            />
            <div className={`${FIELD} !w-[74px] !flex-none`}>
                <input
                    id={id}
                    type="number"
                    min={min}
                    step={step}
                    value={Math.round(safe * 100) / 100}
                    onFocus={onCommitStart}
                    onBlur={onCommitEnd}
                    onChange={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isFinite(next)) onChange(next);
                    }}
                    className={VALUE}
                />
                {suffix && <span className="shrink-0 text-ed-faint">{suffix}</span>}
            </div>
        </Row>
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
    const animationFrame = useRef<number | null>(null);
    const pendingValue = useRef(value);
    const range = max - min;
    const progress = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;

    useEffect(
        () => () => {
            if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
        },
        [],
    );

    const queueChange = (next: number) => {
        pendingValue.current = next;
        if (animationFrame.current !== null) return;
        animationFrame.current = requestAnimationFrame(() => {
            animationFrame.current = null;
            onChange(pendingValue.current);
        });
    };

    const finishChange = () => {
        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
            onChange(pendingValue.current);
        }
        onCommitEnd?.();
    };

    return (
        <Row label={label} htmlFor={id}>
            <div className="group/slider relative flex h-8 min-w-0 flex-1 items-center">
                <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-ed-field shadow-[inset_0_0_0_1px_var(--ed-border)]">
                    <div
                        className="h-full rounded-full bg-ed-accent"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onPointerDown={onCommitStart}
                    onPointerUp={finishChange}
                    onPointerCancel={finishChange}
                    onChange={(event) => queueChange(Number(event.target.value))}
                    className="relative h-8 w-full cursor-ew-resize appearance-none bg-transparent outline-none [&::-moz-range-progress]:bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ed-surface [&::-moz-range-thumb]:bg-ed-accent [&::-moz-range-thumb]:shadow-md [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ed-surface [&::-webkit-slider-thumb]:bg-ed-accent [&::-webkit-slider-thumb]:shadow-md hover:[&::-moz-range-thumb]:scale-110 hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-moz-range-thumb]:ring-2 focus-visible:[&::-moz-range-thumb]:ring-ed-accent/30 focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ed-accent/30"
                />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-ed-muted">
                {Math.round(value)}
                {suffix}
            </span>
        </Row>
    );
}
