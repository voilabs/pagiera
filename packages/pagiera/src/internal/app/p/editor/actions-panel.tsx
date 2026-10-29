"use client";

import {
    ACTION_ANIMATIONS,
    ACTION_DIRECTIONS,
    ACTION_STEP_KINDS,
    ACTION_TRIGGERS,
    type ActionAnimation,
    type ActionStep,
    type ActionWorkflow,
    type Overlay,
} from "@/lib/editor/actions";
import { displayName } from "@/lib/editor/tree";
import type { CanvasElement } from "@/lib/editor/types";
import { Group, NumberInput, Pair, SelectInput, TextInput } from "./ui";

type Props = {
    element: CanvasElement;
    elements: CanvasElement[];
    onProps: (patch: Partial<CanvasElement>) => void;
};

const button = "rounded-md bg-ed-field px-2 py-1 text-[11px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text";

function blankStep(kind: ActionStep["kind"], target = ""): ActionStep {
    switch (kind) {
        case "wait":
            return { kind, ms: 500 };
        case "if":
            return { kind, target, state: "open", do: [] };
        case "navigate":
            return { kind, url: "" };
        case "scroll-to":
            return { kind, target };
        default:
            return { kind, target };
    }
}

function AnimationFields({ value, onChange, label = "Animation" }: { value?: ActionAnimation; onChange: (value?: ActionAnimation) => void; label?: string }) {
    const type = value?.type ?? "none";
    const set = (patch: Partial<ActionAnimation>) => {
        const next = { duration: 260, ...value, type, ...patch } as ActionAnimation;
        onChange(next.type === "none" ? undefined : next);
    };
    return (
        <>
            <SelectInput label={label} value={type} options={ACTION_ANIMATIONS} onChange={(next) => set({ type: next })} />
            {type !== "none" && (
                <Pair>
                    {(type === "slide" || type === "flip") && (
                        <SelectInput label="From" value={value?.direction ?? "up"} options={ACTION_DIRECTIONS} onChange={(direction) => set({ direction })} />
                    )}
                    <NumberInput label="Time" suffix="ms" min={0} max={5000} step={20} value={value?.duration ?? 260} onChange={(duration) => set({ duration })} />
                </Pair>
            )}
            {type === "slide" && <NumberInput label="Distance" suffix="px" min={0} max={2000} value={value?.distance ?? 24} onChange={(distance) => set({ distance })} />}
        </>
    );
}

function StepList({ steps, onChange, layers, depth }: { steps: ActionStep[]; onChange: (steps: ActionStep[]) => void; layers: Array<{ label: string; value: string }>; depth: number }) {
    const update = (index: number, step: ActionStep) => onChange(steps.map((current, i) => (i === index ? step : current)));
    const move = (index: number, by: number) => {
        const next = [...steps];
        const [step] = next.splice(index, 1);
        next.splice(Math.max(0, Math.min(next.length, index + by)), 0, step);
        onChange(next);
    };
    return (
        <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: steps have no ids; order is their identity
                <div key={index} className="flex flex-col gap-2 rounded-lg border border-ed-border p-2">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-ed-faint">{index + 1}</span>
                        <div className="flex-1">
                            <SelectInput
                                value={step.kind}
                                options={depth >= 2 ? ACTION_STEP_KINDS.filter((kind) => kind.value !== "if") : ACTION_STEP_KINDS}
                                onChange={(kind) => update(index, blankStep(kind, "target" in step ? step.target : ""))}
                            />
                        </div>
                        <button type="button" className={button} onClick={() => move(index, -1)} aria-label="Move step up">↑</button>
                        <button type="button" className={button} onClick={() => move(index, 1)} aria-label="Move step down">↓</button>
                        <button type="button" className={button} onClick={() => onChange(steps.filter((_, i) => i !== index))} aria-label="Remove step">×</button>
                    </div>
                    {"target" in step && (
                        <SelectInput label="Layer" value={step.target} options={layers} onChange={(target) => update(index, { ...step, target } as ActionStep)} />
                    )}
                    {(step.kind === "show" || step.kind === "hide" || step.kind === "toggle") && (
                        <AnimationFields value={step.animation} onChange={(animation) => update(index, { ...step, animation })} />
                    )}
                    {step.kind === "wait" && (
                        <NumberInput label="Wait" suffix="ms" min={0} max={30000} step={100} value={step.ms} onChange={(ms) => update(index, { ...step, ms })} />
                    )}
                    {step.kind === "navigate" && (
                        <>
                            <TextInput label="URL" value={step.url} placeholder="https://… or /s/about" onChange={(url) => update(index, { ...step, url })} />
                            <SelectInput
                                label="Opens"
                                value={step.newTab ? "_blank" : "_self"}
                                options={[{ label: "Same tab", value: "_self" }, { label: "New tab", value: "_blank" }]}
                                onChange={(target) => update(index, { ...step, newTab: target === "_blank" || undefined })}
                            />
                        </>
                    )}
                    {step.kind === "if" && (
                        <>
                            <SelectInput
                                label="Is"
                                value={step.state}
                                options={[{ label: "Open", value: "open" }, { label: "Closed", value: "closed" }]}
                                onChange={(state) => update(index, { ...step, state })}
                            />
                            <p className="text-[10px] font-semibold text-ed-faint">Then</p>
                            <StepList steps={step.do} layers={layers} depth={depth + 1} onChange={(steps) => update(index, { ...step, do: steps })} />
                            <p className="text-[10px] font-semibold text-ed-faint">Otherwise</p>
                            <StepList steps={step.else ?? []} layers={layers} depth={depth + 1} onChange={(otherwise) => update(index, { ...step, else: otherwise.length ? otherwise : undefined })} />
                        </>
                    )}
                </div>
            ))}
            <button type="button" className={button} onClick={() => onChange([...steps, blankStep("show")])}>+ Add step</button>
        </div>
    );
}

/** Trigger → steps workflows, the editable side of `lib/editor/actions.ts`. */
export function ActionsGroup({ element, elements, onProps }: Props) {
    const workflows = element.actions ?? [];
    const layers = [
        { label: "Choose a layer…", value: "" },
        ...elements.filter((candidate) => candidate.id !== element.id).map((candidate) => ({ label: displayName(candidate), value: candidate.id })),
    ];
    const save = (next: ActionWorkflow[]) => onProps({ actions: next.length ? next : undefined });
    const update = (index: number, workflow: ActionWorkflow) => save(workflows.map((current, i) => (i === index ? workflow : current)));
    return (
        <Group title="Actions" defaultOpen={workflows.length > 0}>
            {workflows.map((workflow, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: workflows have no ids; order is their identity
                <div key={index} className="mb-2 flex flex-col gap-2">
                    <div className="flex items-end gap-1">
                        <div className="flex-1">
                            <SelectInput label="When" value={workflow.trigger} options={ACTION_TRIGGERS} onChange={(trigger) => update(index, { ...workflow, trigger })} />
                        </div>
                        <button type="button" className={button} onClick={() => save(workflows.filter((_, i) => i !== index))} aria-label="Remove workflow">×</button>
                    </div>
                    <StepList steps={workflow.steps} layers={layers} depth={0} onChange={(steps) => update(index, { ...workflow, steps })} />
                </div>
            ))}
            <button type="button" className={button} onClick={() => save([...workflows, { trigger: "click", steps: [blankStep("toggle")] }])}>
                + Add workflow
            </button>
            <p className="text-[10px] leading-relaxed text-ed-faint">
                Chain steps: show a popover, wait, hide it; branch with “If layer is…”. Steps without a layer are skipped when the page is saved. Play effects to try them.
            </p>
        </Group>
    );
}

/** Makes a layer a popover, dropdown or modal that actions open and close. */
export function OverlayGroup({ element, onProps }: Props) {
    const overlay = element.overlay;
    const set = (patch: Partial<Overlay> | null) =>
        onProps({ overlay: patch === null ? undefined : ({ closeOnEscape: true, closeOnOutside: true, kind: "popover", ...overlay, ...patch } as Overlay) });
    return (
        <Group title="Overlay" defaultOpen={!!overlay}>
            <SelectInput
                label="Behaves as"
                value={overlay?.kind ?? "none"}
                options={[
                    { label: "Normal layer", value: "none" },
                    { label: "Popover", value: "popover" },
                    { label: "Dropdown", value: "dropdown" },
                    { label: "Modal", value: "modal" },
                ]}
                onChange={(kind) => set(kind === "none" ? null : { kind, backdrop: kind === "modal" ? (overlay?.backdrop ?? true) : undefined })}
            />
            {overlay && (
                <>
                    <SelectInput
                        label="Starts"
                        value={overlay.open ? "open" : "closed"}
                        options={[{ label: "Closed", value: "closed" }, { label: "Open", value: "open" }]}
                        onChange={(state) => set({ open: state === "open" || undefined })}
                    />
                    <SelectInput
                        label="Closes on"
                        value={`${overlay.closeOnEscape !== false ? "e" : ""}${overlay.closeOnOutside !== false ? "o" : ""}` || "none"}
                        options={[
                            { label: "Escape and outside click", value: "eo" },
                            { label: "Escape only", value: "e" },
                            { label: "Outside click only", value: "o" },
                            { label: "Only its actions", value: "none" },
                        ]}
                        onChange={(value) => set({ closeOnEscape: value.includes("e"), closeOnOutside: value.includes("o") })}
                    />
                    {overlay.kind === "modal" && (
                        <SelectInput
                            label="Backdrop"
                            value={overlay.backdrop === false ? "off" : "on"}
                            options={[{ label: "Dim the page", value: "on" }, { label: "None", value: "off" }]}
                            onChange={(value) => set({ backdrop: value === "on" })}
                        />
                    )}
                    <AnimationFields label="Opens with" value={overlay.enter} onChange={(enter) => set({ enter })} />
                    <AnimationFields label="Closes with" value={overlay.exit} onChange={(exit) => set({ exit })} />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        “Closes with” Default plays the opening animation in reverse. Edit mode keeps the overlay visible.
                    </p>
                </>
            )}
        </Group>
    );
}
