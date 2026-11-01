import type React from "react";

import type { ElementType } from "@/lib/editor/types";

/*
 * A small drawing of what each element is, for the Insert panel.
 *
 * An icon in a grey square says "there is a thing called Grid"; a sketch of
 * two-by-two tiles says what dropping it will give you. Drawn with the
 * chrome's own ink and field tones so the panel stays calm, and with no
 * gradients — it is a diagram, not an illustration.
 */

const ink = "bg-[color-mix(in_srgb,var(--ed-text)_72%,transparent)]";
const soft = "bg-[color-mix(in_srgb,var(--ed-text)_14%,transparent)]";
const line = "bg-[color-mix(in_srgb,var(--ed-text)_22%,transparent)]";

function Lines({ count = 3, last = "60%" }: { count?: number; last?: string }) {
    return (
        <span className="flex w-full flex-col gap-[5px]">
            {Array.from({ length: count }, (_, index) => (
                <span key={index} className={`h-[4px] rounded-full ${line}`} style={{ width: index === count - 1 ? last : "100%" }} />
            ))}
        </span>
    );
}

function Field({ label = true, tall = false }: { label?: boolean; tall?: boolean }) {
    return (
        <span className="flex w-full flex-col gap-[5px]">
            {label && <span className={`h-[3px] w-8 rounded-full ${line}`} />}
            <span className={`w-full rounded-[5px] bg-ed-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--ed-text)_16%,transparent)] ${tall ? "h-7" : "h-[14px]"}`} />
        </span>
    );
}

const SKETCHES: Partial<Record<ElementType, React.ReactNode>> = {
    Frame: <span className="h-11 w-16 rounded-md bg-ed-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--ed-text)_16%,transparent)]" />,
    Stack: (
        <span className="flex w-14 flex-col gap-1">
            <span className={`h-2.5 rounded ${soft}`} /><span className={`h-2.5 rounded ${soft}`} /><span className={`h-2.5 rounded ${soft}`} />
        </span>
    ),
    Grid: (
        <span className="grid w-14 grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((index) => <span key={index} className={`h-[18px] rounded ${soft}`} />)}
        </span>
    ),
    Section: (
        <span className="flex w-[72px] flex-col gap-1">
            <span className={`h-[3px] w-6 rounded-full ${line}`} />
            <span className={`h-7 rounded-md ${soft}`} />
        </span>
    ),
    Container: (
        <span className="flex h-11 w-16 items-center justify-center rounded-md shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ed-text)_18%,transparent)]">
            <span className={`h-5 w-9 rounded ${soft}`} />
        </span>
    ),
    Heading: (
        <span className="flex w-16 flex-col gap-1.5">
            <span className={`h-[7px] w-full rounded-full ${ink}`} /><span className={`h-[7px] w-3/5 rounded-full ${ink}`} />
        </span>
    ),
    Text: <span className="w-16"><Lines count={4} /></span>,
    Quote: (
        <span className="flex w-16 gap-2">
            <span className={`w-[3px] shrink-0 rounded-full ${ink}`} />
            <Lines count={3} last="70%" />
        </span>
    ),
    Markdown: (
        <span className="flex w-16 flex-col gap-1.5">
            <span className={`h-[5px] w-1/2 rounded-full ${ink}`} /><Lines count={2} />
        </span>
    ),
    Image: (
        <span className={`relative h-11 w-16 overflow-hidden rounded-md ${soft}`}>
            <span className="absolute left-2 top-2 size-2.5 rounded-full bg-ed-surface" />
            <span className="absolute -bottom-3 left-3 size-10 rotate-45 rounded-sm bg-[color-mix(in_srgb,var(--ed-text)_18%,transparent)]" />
        </span>
    ),
    Button: <span className={`flex h-6 w-16 items-center justify-center rounded-full ${ink}`}><span className="h-[3px] w-7 rounded-full bg-ed-surface/80" /></span>,
    Video: (
        <span className={`flex h-11 w-16 items-center justify-center rounded-md ${soft}`}>
            <span className="size-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-[color-mix(in_srgb,var(--ed-text)_60%,transparent)]" />
        </span>
    ),
    Embed: <span className="flex h-11 w-16 items-center justify-center rounded-md font-mono text-[11px] font-semibold text-[color-mix(in_srgb,var(--ed-text)_45%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ed-text)_18%,transparent)]">{"</>"}</span>,
    Divider: <span className={`h-[2px] w-16 rounded-full ${line}`} />,
    Spacer: (
        <span className="flex w-16 flex-col items-center gap-1">
            <span className={`h-[3px] w-full rounded-full ${line}`} />
            <span className="h-4 w-px border-l border-dashed border-[color-mix(in_srgb,var(--ed-text)_30%,transparent)]" />
            <span className={`h-[3px] w-full rounded-full ${line}`} />
        </span>
    ),
    List: (
        <span className="flex w-16 flex-col gap-1.5">
            {[0, 1, 2].map((index) => <span key={index} className="flex items-center gap-1.5"><span className={`size-[5px] shrink-0 rounded-full ${ink}`} /><span className={`h-[4px] flex-1 rounded-full ${line}`} /></span>)}
        </span>
    ),
    ListItem: <span className="flex w-16 items-center gap-1.5"><span className={`size-[5px] shrink-0 rounded-full ${ink}`} /><span className={`h-[4px] flex-1 rounded-full ${line}`} /></span>,
    Form: (
        <span className="flex w-16 flex-col gap-1.5">
            <Field label={false} /><Field label={false} /><span className={`h-[11px] w-8 rounded-full ${ink}`} />
        </span>
    ),
    Fieldset: <span className="flex w-16 flex-col gap-1 rounded-md p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ed-text)_18%,transparent)]"><Field label={false} /><Field label={false} /></span>,
    Label: <span className={`h-[5px] w-10 rounded-full ${ink}`} />,
    Input: <span className="w-16"><Field /></span>,
    Textarea: <span className="w-16"><Field tall /></span>,
    Select: (
        <span className="relative w-16">
            <Field />
            <span className="absolute bottom-[4px] right-1.5 size-0 border-x-[3px] border-t-[4px] border-x-transparent border-t-[color-mix(in_srgb,var(--ed-text)_55%,transparent)]" />
        </span>
    ),
    Checkbox: <span className="flex w-16 items-center gap-1.5"><span className={`flex size-3 shrink-0 items-center justify-center rounded-[3px] ${ink}`}><span className="h-1 w-1.5 -rotate-45 border-b-[1.5px] border-l-[1.5px] border-ed-surface" /></span><span className={`h-[4px] flex-1 rounded-full ${line}`} /></span>,
    Radio: <span className="flex w-16 items-center gap-1.5"><span className="flex size-3 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--ed-text)_70%,transparent)]"><span className={`size-1.5 rounded-full ${ink}`} /></span><span className={`h-[4px] flex-1 rounded-full ${line}`} /></span>,
    FileInput: <span className="flex h-9 w-16 items-center justify-center rounded-md border border-dashed border-[color-mix(in_srgb,var(--ed-text)_30%,transparent)]"><span className={`h-[3px] w-7 rounded-full ${line}`} /></span>,
    Request: (
        <span className="flex items-center gap-1.5">
            <span className={`size-4 rounded ${soft}`} /><span className={`h-[2px] w-4 ${line}`} /><span className={`size-4 rounded-full ${soft}`} />
        </span>
    ),
    Repeat: (
        <span className="flex w-16 flex-col gap-1">
            {[0.9, 0.55, 0.3].map((opacity, index) => <span key={index} className="h-[9px] rounded bg-ed-text" style={{ opacity: opacity * 0.22 }} />)}
        </span>
    ),
};

export function ElementSketch({ type, fallback }: { type: ElementType; fallback: React.ReactNode }) {
    return <>{SKETCHES[type] ?? fallback}</>;
}
