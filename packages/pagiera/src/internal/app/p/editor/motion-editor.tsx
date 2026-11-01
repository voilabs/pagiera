"use client";

import { IconCopy, IconPlayerPlay, IconPlus, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
    ANIMATION_TEMPLATES,
    type AnimationEasing,
    type AnimationFrame,
    type CustomAnimation,
    EASING_PRESETS,
    FRAME_FIELDS,
    timelineFor,
} from "@/lib/editor/custom-animation";
import { KEY_PROPS, type LayerMotion } from "@/lib/editor/keyframes";
import { entranceFrom, entranceTo, type MotionFrame } from "@/lib/editor/motion";
import { displayName } from "@/lib/editor/tree";
import {
    type CanvasElement,
    ENTRANCE_SPLITS,
    ENTRANCES,
    type ElementStyle,
    type Entrance,
    isTextual,
    SCROLL_EFFECTS,
    type ScrollEffect,
} from "@/lib/editor/types";
import { playEntrance } from "./motion-preview";
import { FIELD, Group, LABEL, LABEL_W, Segmented, SelectInput, SliderInput, VALUE } from "./ui";

/**
 * Motion: how each layer arrives, in one place.
 *
 * Select a layer, say when it moves — as it appears, or while the page
 * scrolls — and pick a card. Delay, duration and feel are the only knobs on
 * show; the start frame of a custom arrival is behind the Custom card. These
 * are the layer's own entrance and scroll settings, the same ones the
 * published stylesheet is built from, so nothing new runs on the page.
 *
 * The site's keyframe animations, which the Actions graph plays, are edited
 * here too, out of the way at the foot of the list.
 */

type When = "none" | "appear" | "scroll";

const uid = () => `a${Math.random().toString(36).slice(2, 10)}`;

function whenOf(style: ElementStyle): When {
    if (style.scrollEffect !== "none") return "scroll";
    return style.entrance !== "none" ? "appear" : "none";
}


/** Card names short enough for a third of the panel. */
const cardLabel = (label: string) => label.replace("Slide from ", "From ").replace(" (wipe up)", "");

/** A rough start frame for each scroll effect, for the card thumbnails only. */
const SCROLL_PREVIEW: Record<ScrollEffect, MotionFrame> = {
    none: {},
    fade: { opacity: 0 },
    rise: { opacity: 0, translate: "0 24px" },
    parallax: { translate: "0 18px" },
    zoom: { scale: "0.7" },
    blur: { opacity: 0, filter: "blur(8px)" },
    "slide-left": { translate: "-26px 0" },
    "slide-right": { translate: "26px 0" },
    rotate: { rotate: "-25deg", opacity: 0 },
    shrink: { scale: "1.25" },
};

/* ------------------------------------------------------------------ */
/* Left panel                                                           */
/* ------------------------------------------------------------------ */

export function MotionLibrary({
    animations,
    onAnimations,
    editingAnimationId,
    onEditAnimation,
}: {
    animations: CustomAnimation[];
    onAnimations: (next: CustomAnimation[] | undefined) => void;
    editingAnimationId: string | null;
    onEditAnimation: (id: string | null) => void;
}) {
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const create = (template: Omit<CustomAnimation, "id">) => {
        const id = uid();
        const names = new Set(animations.map((item) => item.name));
        let name = template.name;
        for (let index = 2; names.has(name); index++) name = `${template.name} ${index}`;
        onAnimations([...animations, { ...structuredClone(template), id, name }]);
        onEditAnimation(id);
        setTemplatesOpen(false);
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">

            <div className="flex h-8 items-center justify-between border-t border-ed-border pl-4 pr-3 pt-3">
                <span className="text-[12px] font-medium text-ed-muted">Custom animations</span>
                <button type="button" aria-label="New custom animation" title="New custom animation" onClick={() => setTemplatesOpen((open) => !open)} className="grid size-6 place-items-center rounded-md text-ed-muted hover:bg-ed-field hover:text-ed-text">
                    <IconPlus size={13} />
                </button>
            </div>
            <p className="px-4 pb-2 pt-1 text-[11px] leading-relaxed text-ed-faint">Keyframe animations for Show, Hide, Toggle and Play animation in Actions.</p>
            {templatesOpen && (
                <div className="mx-3 mb-2 grid grid-cols-2 gap-1.5 rounded-xl bg-ed-subtle p-2">
                    {ANIMATION_TEMPLATES.map((template) => (
                        <button key={template.name} type="button" onClick={() => create(template)} className="truncate rounded-lg bg-ed-surface px-2 py-1.5 text-left text-[11px] text-ed-text shadow-[inset_0_0_0_1px_var(--ed-border)] hover:bg-ed-field">
                            {template.name}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => create({ name: "Animation", duration: 600, easing: { type: "preset", value: "smooth" }, frames: [{ at: 0, opacity: 0 }, { at: 100, opacity: 1 }] })}
                        className="rounded-lg bg-ed-surface px-2 py-1.5 text-left text-[11px] text-ed-text shadow-[inset_0_0_0_1px_var(--ed-border)] hover:bg-ed-field"
                    >
                        Blank
                    </button>
                </div>
            )}
            <div className="space-y-0.5 px-2">
                {animations.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onEditAnimation(item.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${item.id === editingAnimationId ? "bg-[var(--ed-accent-soft)]" : "hover:bg-ed-field"}`}
                    >
                        <AnimationGlyph animation={item} />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ed-text">{item.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-ed-faint">{item.duration}ms</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/** A tiny bar of the animation's keyframes, so the list reads at a glance. */
function AnimationGlyph({ animation }: { animation: CustomAnimation }) {
    return (
        <span className="relative h-4 w-7 shrink-0 rounded bg-[color-mix(in_srgb,var(--ed-accent)_14%,transparent)]">
            {animation.frames.map((frame, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: frames are ordered by time
                <span key={index} className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--ed-accent)]" style={{ left: `${8 + frame.at * 0.84}%` }} />
            ))}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Right panel: one layer                                               */
/* ------------------------------------------------------------------ */

export function MotionLayerPanel({
    element,
    elements,
    style,
    onStyle,
    onCommitStart,
    onCommitEnd,
}: {
    element: CanvasElement;
    elements: CanvasElement[];
    style: ElementStyle;
    onStyle: (patch: Partial<ElementStyle>) => void;
    onCommitStart?: () => void;
    onCommitEnd?: () => void;
}) {
    const when = whenOf(style);
    const hasChildren = elements.some((candidate) => candidate.parentId === element.id);
    const splits = ENTRANCE_SPLITS.filter((option) =>
        option.value === "children" ? hasChildren : option.value === "none" || isTextual(element.type),
    );
    const moves = ["rise", "parallax", "slide-left", "slide-right"].includes(style.scrollEffect);
    // Picking a card plays it on the canvas once the new style has rendered.
    const [replay, setReplay] = useState(0);
    useEffect(() => {
        if (replay && whenOf(style) === "appear") playEntrance(element, style, elements);
        // biome-ignore lint/correctness/useExhaustiveDependencies: plays once per pick, with the style it produced
    }, [replay]);
    const again = () => setReplay((count) => count + 1);

    const setWhen = (next: When) => {
        if (next === "none") onStyle({ entrance: "none", scrollEffect: "none" });
        if (next === "appear") {
            onStyle({ scrollEffect: "none", entrance: style.entrance === "none" ? "up" : style.entrance });
            again();
        }
        if (next === "scroll") onStyle({ entrance: "none", scrollEffect: style.scrollEffect === "none" ? "fade" : style.scrollEffect });
    };
    const slider = { onCommitStart, onCommitEnd };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-ed-border px-4">
                <span className="min-w-0 truncate text-[13px] font-semibold text-ed-text">{displayName(element)}</span>
                {when === "appear" && (
                    <button type="button" onClick={() => playEntrance(element, style, elements)} className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-ed-primary px-2.5 text-[11px] font-medium text-[var(--ed-primary-text)] hover:bg-[var(--ed-primary-hover)]">
                        <IconPlayerPlay size={12} /> Preview
                    </button>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <div className="pt-4">
                    <Segmented
                        value={when}
                        options={[{ label: "None", value: "none" }, { label: "On appear", value: "appear" }, { label: "On scroll", value: "scroll" }]}
                        onChange={setWhen}
                    />
                </div>

                {when === "none" && (
                    <p className="pt-4 text-[12px] leading-relaxed text-ed-muted">
                        This layer doesn't move. <b className="font-medium text-ed-text">On appear</b> plays once as it comes into view — straight away for what is on screen when the page opens. <b className="font-medium text-ed-text">On scroll</b> ties it to the scroll position.
                    </p>
                )}

                {when === "appear" && (
                    <>
                        <div className="grid grid-cols-3 gap-2 pt-4">
                            {ENTRANCES.filter((item) => item.value !== "none").map((item) => (
                                <PresetCard
                                    key={item.value}
                                    label={cardLabel(item.label)}
                                    selected={style.entrance === item.value}
                                    from={entranceFrom({ ...style, entrance: item.value })}
                                    to={entranceTo(entranceFrom({ ...style, entrance: item.value }))}
                                    custom={item.value === "custom"}
                                    onPick={() => {
                                        onStyle({ entrance: item.value as Entrance });
                                        again();
                                    }}
                                />
                            ))}
                        </div>
                        <div className="space-y-2.5 pt-4">
                            <SliderInput label="Delay" min={0} max={3000} step={50} suffix="ms" value={style.entranceDelay} onChange={(entranceDelay) => onStyle({ entranceDelay })} {...slider} />
                            {style.entranceCurve === "ease" && (
                                <SliderInput label="Duration" min={100} max={3000} step={50} suffix="ms" value={style.entranceDuration} onChange={(entranceDuration) => onStyle({ entranceDuration })} {...slider} />
                            )}
                            <FieldRow label="Feel">
                                <Segmented
                                    value={style.entranceCurve}
                                    options={[{ label: "Smooth", value: "ease" }, { label: "Bouncy", value: "spring" }]}
                                    onChange={(entranceCurve) => { onStyle({ entranceCurve }); again(); }}
                                />
                            </FieldRow>
                        </div>
                        {style.entrance === "custom" && (
                            <Group title="Starts from">
                                <SliderInput label="Opacity" min={0} max={100} suffix="%" value={style.entranceOpacity} onChange={(entranceOpacity) => onStyle({ entranceOpacity })} {...slider} />
                                <SliderInput label="Move X" min={-400} max={400} suffix="px" value={style.entranceX} onChange={(entranceX) => onStyle({ entranceX })} {...slider} />
                                <SliderInput label="Move Y" min={-400} max={400} suffix="px" value={style.entranceY} onChange={(entranceY) => onStyle({ entranceY })} {...slider} />
                                <SliderInput label="Scale" min={0} max={200} suffix="%" value={style.entranceScale} onChange={(entranceScale) => onStyle({ entranceScale })} {...slider} />
                                <SliderInput label="Rotate" min={-180} max={180} suffix="°" value={style.entranceRotate} onChange={(entranceRotate) => onStyle({ entranceRotate })} {...slider} />
                                <SliderInput label="Blur" min={0} max={40} suffix="px" value={style.entranceBlur} onChange={(entranceBlur) => onStyle({ entranceBlur })} {...slider} />
                            </Group>
                        )}
                        <Group title="More" defaultOpen={false}>
                            {splits.length > 1 && (
                                <SelectInput label="Arrive" value={style.entranceSplit} options={splits} onChange={(entranceSplit) => { onStyle({ entranceSplit }); again(); }} />
                            )}
                            {style.entranceSplit !== "none" && (
                                <SliderInput label="One by one" min={0} max={400} suffix="ms" value={style.entranceStagger} onChange={(entranceStagger) => onStyle({ entranceStagger })} {...slider} />
                            )}
                            <FieldRow label="Plays">
                                <Segmented
                                    value={style.entranceReplay ? "always" : "once"}
                                    options={[{ label: "Once", value: "once" }, { label: "Every time", value: "always" }]}
                                    onChange={(value) => onStyle({ entranceReplay: value === "always" })}
                                />
                            </FieldRow>
                        </Group>
                    </>
                )}

                {when === "scroll" && (
                    <>
                        <div className="grid grid-cols-3 gap-2 pt-4">
                            {SCROLL_EFFECTS.filter((item) => item.value !== "none").map((item) => (
                                <PresetCard
                                    key={item.value}
                                    label={cardLabel(item.label)}
                                    selected={style.scrollEffect === item.value}
                                    from={SCROLL_PREVIEW[item.value]}
                                    to={{}}
                                    onPick={() => onStyle({ scrollEffect: item.value })}
                                />
                            ))}
                        </div>
                        <div className="pt-4">
                            <SliderInput
                                label={moves ? "Distance" : "Strength"}
                                min={0}
                                max={moves ? 400 : 100}
                                suffix={moves ? "px" : "%"}
                                value={style.scrollAmount}
                                onChange={(scrollAmount) => onStyle({ scrollAmount })}
                                {...slider}
                            />
                        </div>
                        <p className="pt-3 text-[11px] leading-relaxed text-ed-faint">Scroll effects follow the page as it scrolls; open Preview to see them move.</p>
                    </>
                )}
            </div>
        </div>
    );
}

/** A card with a little square that plays the effect when hovered or picked. */
function PresetCard({
    label,
    selected,
    from,
    to,
    custom,
    onPick,
}: {
    label: string;
    selected: boolean;
    from: MotionFrame;
    to: MotionFrame;
    custom?: boolean;
    onPick: () => void;
}) {
    const box = useRef<HTMLSpanElement>(null);
    const play = () => {
        const target = box.current;
        if (!target || typeof target.animate !== "function" || !Object.keys(from).length) return;
        try {
            target.animate([{ ...from } as Keyframe, { ...to } as Keyframe], { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        } catch {
            // A frame the browser can't animate just doesn't preview.
        }
    };
    return (
        <button
            type="button"
            aria-pressed={selected}
            onMouseEnter={play}
            onClick={() => { onPick(); play(); }}
            className={`flex flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-2.5 text-[11px] transition-colors ${selected ? "bg-[var(--ed-accent-soft)] text-ed-text shadow-[inset_0_0_0_1.5px_var(--ed-accent)]" : "bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"}`}
        >
            <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-ed-surface [perspective:200px]">
                {custom && !selected ? (
                    <IconPlus size={14} className="text-ed-muted" />
                ) : (
                    <span ref={box} className={`size-4 rounded-[5px] ${selected ? "bg-[var(--ed-accent)]" : "bg-[color-mix(in_srgb,var(--ed-text)_55%,transparent)]"}`} />
                )}
            </span>
            <span className="w-full truncate text-center leading-tight">{label}</span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Right panel: one custom animation                                    */
/* ------------------------------------------------------------------ */

export function AnimationEditor({
    animation,
    animations,
    onAnimations,
    onEdit,
}: {
    animation: CustomAnimation;
    animations: CustomAnimation[];
    onAnimations: (next: CustomAnimation[] | undefined) => void;
    onEdit: (id: string | null) => void;
}) {
    const [frameIndex, setFrameIndex] = useState(0);
    const sample = useRef<HTMLDivElement>(null);
    useEffect(() => setFrameIndex(0), [animation.id]);
    const index = Math.min(frameIndex, animation.frames.length - 1);
    const frame = animation.frames[index]!;
    const commit = (next: CustomAnimation[]) => onAnimations(next.length ? next : undefined);
    const update = (patch: Partial<CustomAnimation>) => commit(animations.map((item) => (item.id === animation.id ? { ...item, ...patch } : item)));
    const updateFrame = (patch: Partial<AnimationFrame>) => update({ frames: animation.frames.map((item, at) => (at === index ? { ...item, ...patch } : item)) });
    const easing = animation.easing;
    const play = () => {
        const { keyframes, options } = timelineFor(animation);
        const once = { ...options, iterations: options.iterations === Number.POSITIVE_INFINITY ? 2 : options.iterations, fill: "none" as const };
        try {
            sample.current?.animate(keyframes, once);
        } catch {
            sample.current?.animate(keyframes, { ...once, easing: "ease" });
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-1 border-b border-ed-border px-3">
                <input
                    aria-label="Animation name"
                    className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[13px] font-semibold text-ed-text outline-none hover:bg-ed-field focus:bg-ed-field"
                    value={animation.name}
                    onChange={(event) => update({ name: event.target.value.slice(0, 60) })}
                />
                <SmallButton label="Duplicate" onClick={() => {
                    const id = uid();
                    commit([...animations, { ...structuredClone(animation), id, name: `${animation.name} copy` }]);
                    onEdit(id);
                }}><IconCopy size={13} /></SmallButton>
                <SmallButton label="Delete" danger onClick={() => { commit(animations.filter((item) => item.id !== animation.id)); onEdit(null); }}><IconTrash size={13} /></SmallButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <button type="button" onClick={play} className="group relative mt-4 grid h-28 w-full place-items-center overflow-hidden rounded-xl bg-ed-subtle">
                    <div ref={sample} className="grid h-12 w-16 place-items-center rounded-xl bg-[var(--ed-accent)] text-[13px] font-semibold text-white">Aa</div>
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-ed-surface px-1.5 py-0.5 text-[10px] text-ed-muted shadow-sm group-hover:text-ed-text"><IconPlayerPlay size={10} /> Play</span>
                </button>

                <Group title="Keyframes">
                    <KeyframeStrip animation={animation} index={index} onSelect={setFrameIndex} onFrames={(frames, select) => { update({ frames }); setFrameIndex(select); }} />
                    <p className="text-[11px] leading-relaxed text-ed-faint">Click the strip to add a keyframe, drag one to move it.</p>
                </Group>

                <Group
                    title={`Keyframe · ${frame.at}%`}
                    action={animation.frames.length > 2 ? (
                        <button type="button" className="text-[11px] text-ed-muted hover:text-red-500" onClick={() => { update({ frames: animation.frames.filter((_, at) => at !== index) }); setFrameIndex(Math.max(0, index - 1)); }}>Remove</button>
                    ) : undefined}
                >
                    <FieldRow label="Position"><Num value={frame.at} min={0} max={100} suffix="%" onChange={(at) => updateFrame({ at })} /></FieldRow>
                    {FRAME_FIELDS.map((item) => (
                        <FieldRow key={item.key} label={item.label}>
                            <Num value={frame[item.key]} placeholder={String(item.rest)} min={item.min} max={item.max} step={item.step} suffix={item.unit}
                                onChange={(value) => updateFrame({ [item.key]: value })} onClear={() => updateFrame({ [item.key]: undefined })} />
                        </FieldRow>
                    ))}
                    {(["background", "color"] as const).map((key) => (
                        <FieldRow key={key} label={key === "background" ? "Fill" : "Text"}>
                            <div className={FIELD}>
                                <input type="color" aria-label={key === "background" ? "Fill colour" : "Text colour"} className="size-4 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                                    value={/^#[0-9a-f]{6}$/i.test(frame[key] ?? "") ? frame[key] : "#ffffff"} onChange={(event) => updateFrame({ [key]: event.target.value })} />
                                <input className={VALUE} placeholder="Unchanged" value={frame[key] ?? ""} onChange={(event) => updateFrame({ [key]: event.target.value || undefined })} />
                            </div>
                        </FieldRow>
                    ))}
                    <p className="text-[11px] leading-relaxed text-ed-faint">Empty fields take the nearest keyframe's value, or the layer's own.</p>
                </Group>

                <Group title="Timing">
                    <FieldRow label="Duration"><Num value={animation.duration} min={50} max={20_000} suffix="ms" onChange={(duration) => update({ duration })} /></FieldRow>
                    <FieldRow label="Delay"><Num value={animation.delay ?? 0} min={0} max={20_000} suffix="ms" onChange={(delay) => update({ delay: delay || undefined })} /></FieldRow>
                    <FieldRow label="Repeat"><Num value={animation.iterations ?? 1} min={0} max={100} suffix={(animation.iterations ?? 1) === 0 ? "∞" : "×"} onChange={(iterations) => update({ iterations })} /></FieldRow>
                    <FieldRow label="Direction">
                        <select className={`${FIELD} ${VALUE}`} value={animation.direction ?? "normal"} onChange={(event) => update({ direction: event.target.value === "normal" ? undefined : (event.target.value as CustomAnimation["direction"]) })}>
                            <option value="normal">Forwards</option>
                            <option value="reverse">Backwards</option>
                            <option value="alternate">Back and forth</option>
                        </select>
                    </FieldRow>
                    <FieldRow label="Easing">
                        <select className={`${FIELD} ${VALUE}`} value={easing.type} onChange={(event) => {
                            const kind = event.target.value as AnimationEasing["type"];
                            update({ easing: kind === "spring" ? { type: "spring", stiffness: 260, damping: 18, mass: 1 } : kind === "bezier" ? { type: "bezier", value: ".16, 1, .3, 1" } : { type: "preset", value: "smooth" } });
                        }}>
                            <option value="preset">Preset</option>
                            <option value="bezier">Cubic bezier</option>
                            <option value="spring">Spring</option>
                        </select>
                    </FieldRow>
                    {easing.type === "preset" && (
                        <FieldRow label="">
                            <select className={`${FIELD} ${VALUE}`} value={easing.value} onChange={(event) => update({ easing: { type: "preset", value: event.target.value as typeof easing.value } })}>
                                {Object.keys(EASING_PRESETS).map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </FieldRow>
                    )}
                    {easing.type === "bezier" && (
                        <FieldRow label=""><div className={FIELD}><input className={`${VALUE} font-mono`} value={easing.value} onChange={(event) => update({ easing: { type: "bezier", value: event.target.value } })} /></div></FieldRow>
                    )}
                    {easing.type === "spring" && (
                        <>
                            <FieldRow label="Stiffness"><Num value={easing.stiffness} min={1} max={1000} onChange={(stiffness) => update({ easing: { ...easing, stiffness } })} /></FieldRow>
                            <FieldRow label="Damping"><Num value={easing.damping} min={1} max={100} onChange={(damping) => update({ easing: { ...easing, damping } })} /></FieldRow>
                            <FieldRow label="Mass"><Num value={easing.mass} min={0.1} max={10} step={0.1} onChange={(mass) => update({ easing: { ...easing, mass } })} /></FieldRow>
                        </>
                    )}
                </Group>
            </div>
        </div>
    );
}

/** The animation's frames on one line: click to add, drag to move. */
function KeyframeStrip({
    animation,
    index,
    onSelect,
    onFrames,
}: {
    animation: CustomAnimation;
    index: number;
    onSelect: (index: number) => void;
    onFrames: (frames: AnimationFrame[], select: number) => void;
}) {
    const strip = useRef<HTMLDivElement>(null);
    const atOf = (clientX: number) => {
        const rect = strip.current!.getBoundingClientRect();
        return Math.round(Math.min(100, Math.max(0, ((clientX - rect.left - 8) / (rect.width - 16)) * 100)));
    };
    return (
        <div>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: clicking the strip adds a keyframe there */}
            <div
                ref={strip}
                className="relative h-8 cursor-copy rounded-lg bg-ed-field"
                onPointerDown={(event) => {
                    if ((event.target as HTMLElement).closest("[data-frame]")) return;
                    const at = atOf(event.clientX);
                    const nearest = [...animation.frames].sort((a, b) => Math.abs(a.at - at) - Math.abs(b.at - at))[0]!;
                    const frames = [...animation.frames, { ...nearest, at }].sort((a, b) => a.at - b.at);
                    onFrames(frames, frames.findIndex((frame) => frame.at === at));
                }}
            >
                <span className="absolute inset-x-2 top-1/2 h-px bg-[var(--ed-border-strong)]" />
                {animation.frames.map((frame, position) => (
                    <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: frames are ordered by time
                        key={position}
                        data-frame=""
                        role="button"
                        tabIndex={0}
                        aria-label={`Keyframe at ${frame.at}%`}
                        className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab border-2 ${position === index ? "border-[var(--ed-accent)] bg-[var(--ed-accent)]" : "border-ed-muted bg-ed-surface"}`}
                        style={{ left: `calc(8px + ${frame.at} * (100% - 16px) / 100)` }}
                        onKeyDown={(event) => event.key === "Enter" && onSelect(position)}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            onSelect(position);
                            const target = event.currentTarget;
                            target.setPointerCapture(event.pointerId);
                            let at = frame.at;
                            const move = (moveEvent: PointerEvent) => {
                                at = atOf(moveEvent.clientX);
                                target.style.left = `calc(8px + ${at} * (100% - 16px) / 100)`;
                            };
                            const up = () => {
                                target.removeEventListener("pointermove", move);
                                target.removeEventListener("pointerup", up);
                                if (at === frame.at) return;
                                const frames = animation.frames.map((item, place) => (place === position ? { ...item, at } : item));
                                const moved = frames[position]!;
                                frames.sort((a, b) => a.at - b.at);
                                onFrames(frames, frames.indexOf(moved));
                            };
                            target.addEventListener("pointermove", move);
                            target.addEventListener("pointerup", up);
                        }}
                    />
                ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-ed-faint"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Small parts                                                          */
/* ------------------------------------------------------------------ */

export function MotionEmpty({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center border-b border-ed-border px-4 text-[13px] font-semibold">Motion</div>
            <p className="shrink-0 p-4 text-[12px] leading-relaxed text-ed-muted">
                Select a layer on the canvas to choose how it arrives. The timeline under the canvas is the page opening: drag a clip to change when it starts, drag its end to change how long it takes.
            </p>
            {children}
        </div>
    );
}

function SmallButton({ label, danger, ...props }: React.ComponentProps<"button"> & { label: string; danger?: boolean }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`grid size-7 shrink-0 place-items-center rounded-md text-ed-muted transition-colors hover:bg-ed-field ${danger ? "hover:text-red-500" : "hover:text-ed-text"}`}
            {...props}
        />
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className={`${LABEL} ${LABEL_W}`}>{label}</span>
            {children}
        </div>
    );
}

/** A number box that can also be left empty (a keyframe that sets nothing). */
function Num({
    value,
    onChange,
    onClear,
    min,
    max,
    step = 1,
    suffix,
    placeholder,
}: {
    value: number | undefined;
    onChange: (value: number) => void;
    onClear?: () => void;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    placeholder?: string;
}) {
    const [text, setText] = useState(value === undefined ? "" : String(Math.round(value * 100) / 100));
    useEffect(() => setText(value === undefined ? "" : String(Math.round(value * 100) / 100)), [value]);
    return (
        <div className={FIELD}>
            <input
                type="number"
                className={VALUE}
                value={text}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                onChange={(event) => {
                    setText(event.target.value);
                    if (event.target.value === "") return onClear?.();
                    const number = Number(event.target.value);
                    if (Number.isFinite(number)) onChange(Math.min(max, Math.max(min, number)));
                }}
            />
            {suffix && <span className="shrink-0 text-[11px] text-ed-faint">{suffix}</span>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Right panel: a layer animated with keyframes                         */
/* ------------------------------------------------------------------ */

/** A keyframed layer's summary: its keyframes live on the timeline, the play settings here. */
export function KeyframePanel({
    element,
    motion,
    onMotion,
}: {
    element: CanvasElement;
    motion: LayerMotion;
    onMotion: (motion: LayerMotion | undefined) => void;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center border-b border-ed-border px-4">
                <span className="min-w-0 truncate text-[13px] font-semibold text-ed-text">{displayName(element)}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <p className="text-[12px] leading-relaxed text-ed-muted">
                    Animated with keyframes on the timeline below. Move the playhead and change a value to set a keyframe; right-click one to change its curve.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {KEY_PROPS.filter((spec) => motion.tracks[spec.prop]?.length).map((spec) => (
                        <span key={spec.prop} className="flex items-center gap-1.5 rounded-md bg-ed-field px-2 py-1 text-[11px] text-ed-text">
                            <span className="size-1.5 rounded-full" style={{ background: spec.color }} />
                            {spec.label}
                            <span className="text-ed-faint">{motion.tracks[spec.prop]!.length}</span>
                        </span>
                    ))}
                </div>
                <FieldRow label="Starts">
                    <Segmented
                        value={motion.trigger ?? "view"}
                        options={[{ label: "In view", value: "view" }, { label: "On load", value: "load" }]}
                        onChange={(trigger) => onMotion({ ...motion, trigger: trigger === "load" ? "load" : undefined })}
                    />
                </FieldRow>
                <FieldRow label="Repeat">
                    <Segmented
                        value={motion.repeat ?? "once"}
                        options={[{ label: "Once", value: "once" }, { label: "Loop", value: "loop" }, { label: "Ping-pong", value: "pingpong" }]}
                        onChange={(repeat) => onMotion({ ...motion, repeat: repeat === "once" ? undefined : repeat })}
                    />
                </FieldRow>
                <button type="button" onClick={() => onMotion(undefined)} className="text-[12px] text-ed-muted hover:text-red-500">
                    Remove keyframes
                </button>
            </div>
        </div>
    );
}
