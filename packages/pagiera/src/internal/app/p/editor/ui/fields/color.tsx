"use client";

import { useId } from "react";

import { Row } from "./group";
import { FIELD, VALUE } from "./style";

/* A colour, as a swatch you can open and a value you can type. */

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
