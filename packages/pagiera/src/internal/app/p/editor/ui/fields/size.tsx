"use client";

import { useId } from "react";

import { Row } from "./group";
import { SelectShell } from "./choice";
import { FIELD, LABEL, VALUE } from "./style";

/* Width and height, where the number and the sizing mode are one decision. */

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
