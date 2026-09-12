"use client";
import { normalizeFieldAppearance, type FieldAppearance } from "@/lib/editor/field-appearance";
import { normalizeTextEffects, type TextEffects } from "@/lib/editor/text-effects";

import {
    IconAlignBoxCenterMiddle,
    IconAlignBoxLeftMiddle,
    IconAlignBoxLeftStretch,
    IconAlignBoxRightMiddle,
    IconArrowsHorizontal,
    IconArrowsVertical,
    IconLayoutAlignBottom,
    IconLayoutAlignTop,
    IconLink,
    IconUnlink,
    IconPlus,
    IconPlayerPlay,
    IconUpload,
    IconX,
} from "@tabler/icons-react";
import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { SHADER_PRESETS, shaderSettingsFor, shaderDocument, type ShaderSettings } from "@/lib/editor/shaders";
import { normalizeInteractive, interactiveDocument, type InteractiveSettings } from "@/lib/editor/interactive";
import { usePagieraFonts } from "pagiera/provider";
import { ICON_CATALOG } from "@/lib/editor/icon";
import { hasOverride, resolveStyle } from "@/lib/editor/style";
import { displayName } from "@/lib/editor/tree";
import {
    type Align,
    ASPECT_RATIOS,
    CUSTOM_TAGS,
    type CustomTag,
    type ElementAttribute,
    type FieldOption,
    type AlignContent,
    type AlignSelf,
    hasOptions,
    INPUT_TYPES,
    type InputType,
    isField,
    RESERVED_ATTRIBUTES,
    type BgSize,
    type BlendMode,
    type Breakpoint,
    type CanvasElement,
    type Constraint,
    type DataSource,
    type Direction,
    type ElementStyle,
    ENTRANCE_SPLITS,
    ENTRANCES,
    FONT_STACKS,
    isContainer,
    isTextual,
    type Justify,
    type LayoutMode,
    type PinSide,
    type PositionMode,
    type RootStyle,
    SCROLL_EFFECTS,
    SHADOW_PRESETS,
    type StyleKey,
    type TextAlign,
    type TextTransform,
} from "@/lib/editor/types";
import {
    CodeInput,
    ColorInput,
    Field,
    Group,
    More,
    NumberInput,
    Overridable,
    Pair,
    Segmented,
    ScrubInput,
    SelectInput,
    SizeField,
    SliderInput,
    TextArea,
    TextInput,
} from "./ui";

type Ctx = {
    element: CanvasElement;
    elements: CanvasElement[];
    style: ElementStyle;
    breakpoint: Breakpoint;
    parentLayout: LayoutMode;
    onStyle: (patch: Partial<ElementStyle>) => void;
    onReset: (keys: StyleKey[]) => void;
    onProps: (patch: Partial<CanvasElement>) => void;
    onCommitStart: () => void;
    onCommitEnd: () => void;
    /** Page data sources, for the Repeat picker. */
    sources: DataSource[];
    /** Field names sampled from the enclosing Repeat's source. */
    bindingKeys: string[];
    /** Whether this element sits inside a Repeat, so binding is meaningful. */
    insideRepeat: boolean;
    /**
     * Stores an image somewhere durable and answers with its URL.
     *
     * Without one, an uploaded image is inlined into the document as a data
     * URI — fine for a logo, ruinous for photography: the bytes then travel
     * with every read of the page, in the editor and on the published site
     * alike. A host that has file storage supplies this and the document keeps
     * a URL instead.
     */
    uploadImage?: (file: File) => Promise<string>;
    /** The site's own settings, so a layer can name and reuse the site font. */
    rootStyle: RootStyle;
};

type Wrap = (keys: StyleKey[], node: React.ReactNode) => React.ReactNode;

const INLINE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Puts an image on an element.
 *
 * Two modes, decided by whether the host gave an `uploadImage` adapter. With
 * one, the file goes to the host's storage and the document keeps a URL — the
 * only shape that stays sane as a site fills with photography. Without one, the
 * image is inlined as a data URI and the 2 MB cap applies, because those bytes
 * are then carried by the document itself on every read.
 */
function ImageUpload({
    src,
    onChange,
    uploadImage,
}: {
    src?: string;
    onChange: (src: string) => void;
    uploadImage?: (file: File) => Promise<string>;
}) {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const inlined = src?.startsWith("data:image/") ?? false;

    const choose = async (file?: File) => {
        setError("");
        if (!file) return;
        if (!INLINE_IMAGE_TYPES.has(file.type)) {
            setError("Use PNG, JPG, WebP, GIF or AVIF.");
            return;
        }

        if (uploadImage) {
            setBusy(true);
            try {
                const url = await uploadImage(file);
                if (!url) throw new Error("The upload returned no address.");
                onChange(url);
            } catch (uploadError) {
                setError(
                    uploadError instanceof Error
                        ? uploadError.message
                        : "The image could not be uploaded.",
                );
            } finally {
                setBusy(false);
            }
            return;
        }

        if (file.size > MAX_INLINE_IMAGE_BYTES) {
            setError("The image must be 2 MB or smaller when it is stored in the page.");
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => setError("Could not read the image.");
        reader.onload = () => {
            if (typeof reader.result === "string") onChange(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const label = busy
        ? "Uploading…"
        : uploadImage
          ? src
              ? "Replace image"
              : "Upload image"
          : inlined
            ? "Replace uploaded image"
            : "Upload image as base64";

    return (
        <div className="flex flex-col gap-2">
            <label className={`flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-ed-border bg-ed-field px-3 py-3 text-[10px] font-medium text-ed-muted transition-colors ${busy ? "opacity-60" : "cursor-pointer hover:border-ed-accent/60 hover:text-ed-text"}`}>
                <IconUpload size={14} /> {label}
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    disabled={busy}
                    onChange={(event) => {
                        void choose(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
            </label>
            {inlined && (
                <div className="flex items-center justify-between rounded-lg bg-ed-subtle px-2.5 py-2 text-[9px] text-ed-faint">
                    <span>Stored inside the page JSON</span>
                    <button type="button" onClick={() => onChange("")} className="text-ed-muted hover:text-red-400">Remove</button>
                </div>
            )}
            {error && <p className="rounded-lg bg-red-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-red-300">{error}</p>}
        </div>
    );
}

/* -------------------------------------------------------------- list editors */

const ROW = "flex items-center gap-1.5";
const CELL =
    "min-w-0 flex-1 rounded-lg bg-ed-field px-2 py-1.5 text-[10px] text-ed-text outline-none transition-colors hover:bg-ed-field-hover focus:bg-ed-surface focus:ring-1 focus:ring-inset focus:ring-[var(--ed-accent)]/60";
const REMOVE =
    "flex size-6 shrink-0 items-center justify-center rounded-md text-ed-faint transition-colors hover:bg-ed-field hover:text-red-400";
const ADD =
    "flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ed-border py-1.5 text-[10px] font-medium text-ed-muted transition-colors hover:border-ed-accent/60 hover:text-ed-text";

/** The choices a Select or Radio offers, edited as label/value pairs. */
function OptionsEditor({
    options,
    onChange,
}: {
    options: FieldOption[];
    onChange: (options: FieldOption[]) => void;
}) {
    const patch = (index: number, next: Partial<FieldOption>) =>
        onChange(options.map((option, at) => (at === index ? { ...option, ...next } : option)));

    return (
        <div className="flex flex-col gap-1.5">
            {options.map((option, index) => (
                // Options have no identity of their own, so the row index is
                // the only stable key available while one is being typed.
                // biome-ignore lint/suspicious/noArrayIndexKey: an option is identified by its position
                <div key={index} className={ROW}>
                    <input
                        value={option.label}
                        placeholder="Label"
                        onChange={(event) => patch(index, { label: event.target.value })}
                        className={CELL}
                    />
                    <input
                        value={option.value}
                        placeholder="value"
                        onChange={(event) => patch(index, { value: event.target.value })}
                        className={`${CELL} font-mono`}
                    />
                    <button
                        type="button"
                        aria-label={`Remove ${option.label || "option"}`}
                        onClick={() => onChange(options.filter((_, at) => at !== index))}
                        className={REMOVE}
                    >
                        <IconX size={12} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...options, { label: "", value: "" }])}
                className={ADD}
            >
                <IconPlus size={12} /> Add option
            </button>
            <p className="text-[9px] leading-relaxed text-ed-faint">
                The label is what a visitor reads; the value is what the form submits.
            </p>
        </div>
    );
}

/**
 * Raw HTML attributes.
 *
 * Names that would execute script or fight the generated stylesheet are
 * refused here as well as on save, so the author is told why the attribute is
 * not going to appear rather than watching it vanish after a reload.
 */
function AttributesEditor({
    attributes,
    onChange,
}: {
    attributes: ElementAttribute[];
    onChange: (attributes: ElementAttribute[]) => void;
}) {
    const patch = (index: number, next: Partial<ElementAttribute>) =>
        onChange(attributes.map((item, at) => (at === index ? { ...item, ...next } : item)));

    const refusal = (name: string) => {
        const key = name.trim().toLowerCase();
        if (!key) return undefined;
        if (key.startsWith("on")) return "Event handlers are not allowed.";
        if (RESERVED_ATTRIBUTES.has(key)) return `${key} is set by the fields above.`;
        if (!/^(?:data-|aria-)?[a-z][a-z0-9-]*$/.test(key)) return "Use letters, digits and dashes.";
        return undefined;
    };

    return (
        <div className="flex flex-col gap-1.5">
            {attributes.map((attribute, index) => {
                const problem = refusal(attribute.name);
                return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: an attribute row is identified by its position
                    <div key={index} className="flex flex-col gap-1">
                        <div className={ROW}>
                            <input
                                value={attribute.name}
                                placeholder="data-analytics"
                                onChange={(event) => patch(index, { name: event.target.value })}
                                className={`${CELL} font-mono ${problem ? "ring-1 ring-inset ring-red-500/50" : ""}`}
                            />
                            <input
                                value={attribute.value}
                                placeholder="value"
                                onChange={(event) => patch(index, { value: event.target.value })}
                                className={CELL}
                            />
                            <button
                                type="button"
                                aria-label={`Remove ${attribute.name || "attribute"}`}
                                onClick={() => onChange(attributes.filter((_, at) => at !== index))}
                                className={REMOVE}
                            >
                                <IconX size={12} />
                            </button>
                        </div>
                        {problem && <p className="pl-1 text-[9px] text-red-400">{problem}</p>}
                    </div>
                );
            })}
            <button
                type="button"
                onClick={() => onChange([...attributes, { name: "", value: "" }])}
                className={ADD}
            >
                <IconPlus size={12} /> Add attribute
            </button>
        </div>
    );
}

/**
 * Wraps a control so it shows — and can undo — an override set at the current
 * breakpoint. Every style field goes through this, otherwise there is no way to
 * tell an inherited value from one set here.
 */
function makeOverridable(ctx: Ctx): Wrap {
    return (keys, node) => (
        <Overridable
            overridden={keys.some((key) => hasOverride(ctx.element, ctx.breakpoint, key))}
            onReset={() => ctx.onReset(keys)}
        >
            {node}
        </Overridable>
    );
}

/**
 * Three tabs, split by the question the author is asking:
 *
 * - Content — what this element *is*: its words, its picture, what it submits.
 * - Style — what it *looks like* at rest.
 * - Interact — what it *does*: on click, on hover, on entering the viewport.
 *
 * The split matters because a control belongs in exactly one of them. An
 * earlier layout had a Design tab and an Effects tab that both set the
 * entrance animation, and a Link field that competed with the click action for
 * the same URL, so the same page could be described two ways.
 */
export function Inspector({
    tab,
    ...ctx
}: Ctx & { tab: InspectorTab }) {
    if (tab === "Content") return <ContentTab {...ctx} />;
    if (tab === "Layout") return <LayoutTab {...ctx} />;
    if (tab === "Effects") return <InteractTab {...ctx} />;
    return <StyleTab {...ctx} />;
}

/*
 * Four tabs, split by the question each one answers: what this layer says,
 * where it sits, what it is painted with, and what it does. Size, spacing and
 * typography used to share a single Style tab, which is what made it read as
 * one long undifferentiated list.
 */
export const INSPECTOR_TABS = ["Content", "Layout", "Style", "Effects"] as const;
export type InspectorTab = (typeof INSPECTOR_TABS)[number];

/* -------------------------------------------------------------------- style */

/**
 * The element at rest, from the outside in: how big it is, how it arranges
 * what is inside it, then what it is painted with.
 */
/** Where the layer sits: its box, how it arranges its children, its spacing. */
function LayoutTab(ctx: Ctx) {
    const { element } = ctx;
    const ov = makeOverridable(ctx);

    return (
        <div className="flex flex-col">
            <SizeGroup ctx={ctx} ov={ov} />
            {ctx.parentLayout === "stack" && <FlexChildGroup ctx={ctx} ov={ov} />}
            {isContainer(element.type) && <LayoutGroup ctx={ctx} ov={ov} />}
            <SpacingGroup ctx={ctx} ov={ov} />
            <CompositionGroup ctx={ctx} ov={ov} />
        </div>
    );
}

/** What the layer is painted with. */
function StyleTab(ctx: Ctx) {
    const { element } = ctx;
    const ov = makeOverridable(ctx);
    const textual = isTextual(element.type);

    return (
        <div className="flex flex-col">
            {/* The group most likely to be edited for this element opens first. */}
            {shaderSettingsFor(element) && <ShaderGroup ctx={ctx} />}
            {textual && <TypographyGroup ctx={ctx} ov={ov} />}
            <FillGroup ctx={ctx} ov={ov} defaultOpen={!textual} />
            <BorderGroup ctx={ctx} ov={ov} />
        </div>
    );
}

/**
 * Where the box sits and how big it is.
 *
 * Labels sit above their controls rather than beside them: coordinates and the
 * two size axes belong together and are read as pairs, and a left-hand label
 * column would leave each half of the pair too narrow to compare against the
 * other.
 */
function ShaderColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    return <ColorInput label={label} value={draft} onChange={next => {
        setDraft(next);
        if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next);
    }} />;
}

function ShaderGroup({ ctx }: { ctx: Ctx }) {
    const settings = shaderSettingsFor(ctx.element)!;
    const update = (patch: Partial<ShaderSettings>) => {
        const shader = { ...settings, ...patch };
        ctx.onProps({ shader, code: shaderDocument(shader.preset, shader), codeLanguage: "tsx" });
    };
    return <Group title="Shader" defaultOpen>
        <SelectInput label="Preset" value={settings.preset} options={SHADER_PRESETS.map(item => ({ label: item.name, value: item.id }))} onChange={id => {
            const preset = SHADER_PRESETS.find(item => item.id === id)!;
            update({ preset: id, colors: [...preset.colors] });
        }} />
        {settings.colors.map((color, index) => <ShaderColor key={index} label={`Colour ${index + 1}`} value={color} onChange={value => update({ colors: settings.colors.map((previous, i) => i === index ? value : previous) })} />)}
        <NumberInput label="Speed" value={settings.speed} min={0} max={5} step={.1} suffix="×" onChange={speed => update({ speed })} onCommitStart={ctx.onCommitStart} onCommitEnd={ctx.onCommitEnd} />
        <NumberInput label="Scale" value={settings.scale} min={.2} max={5} step={.1} suffix="×" onChange={scale => update({ scale })} onCommitStart={ctx.onCommitStart} onCommitEnd={ctx.onCommitEnd} />
        <p className="text-[11px] text-ed-muted">Speed 0 freezes the animation. Colours are shared across breakpoints.</p>
    </Group>;
}

function SizeGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, parentLayout, onStyle, onCommitStart, onCommitEnd } = ctx;
    const placed = parentLayout === "absolute";

    return (
        <Group title="Size">
            {placed && (
                <Field label="Coordinates">
                    <Pair>
                        {ov(
                            ["x"],
                            <NumberInput
                                compact
                                label="X"
                                suffix="px"
                                value={style.x}
                                onChange={(x) => onStyle({ x })}
                                onCommitStart={onCommitStart}
                                onCommitEnd={onCommitEnd}
                            />,
                        )}
                        {ov(
                            ["y"],
                            <NumberInput
                                compact
                                label="Y"
                                suffix="px"
                                value={style.y}
                                onChange={(y) => onStyle({ y })}
                                onCommitStart={onCommitStart}
                                onCommitEnd={onCommitEnd}
                            />,
                        )}
                    </Pair>
                </Field>
            )}

            <div className="flex flex-col gap-1.5">
                {ov(
                    ["widthMode", "w"],
                    <SizeField
                        axis="W"
                        mode={style.widthMode}
                        value={style.w}
                        onMode={(widthMode) => onStyle({ widthMode })}
                        onValue={(w) => onStyle({ w })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["heightMode", "h"],
                    <SizeField
                        axis="H"
                        mode={style.heightMode}
                        value={style.h}
                        onMode={(heightMode) => onStyle({ heightMode })}
                        onValue={(h) => onStyle({ h })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
            </div>

            {/* Constraints only mean anything when the parent positions absolutely. */}
            {placed && (
                <More label="Constraints">
                    <Field label="Horizontal">
                        {ov(
                            ["constraintX"],
                            <SelectInput
                                value={style.constraintX}
                                options={[
                                    { label: "Left", value: "start" as Constraint },
                                    { label: "Center", value: "center" as Constraint },
                                    { label: "Right", value: "end" as Constraint },
                                    { label: "Left & right", value: "stretch" as Constraint },
                                ]}
                                onChange={(constraintX) => onStyle({ constraintX })}
                            />,
                        )}
                    </Field>
                    <Field label="Vertical">
                        {ov(
                            ["constraintY"],
                            <SelectInput
                                value={style.constraintY}
                                options={[
                                    { label: "Top", value: "start" as Constraint },
                                    { label: "Center", value: "center" as Constraint },
                                    { label: "Bottom", value: "end" as Constraint },
                                    { label: "Top & bottom", value: "stretch" as Constraint },
                                ]}
                                onChange={(constraintY) => onStyle({ constraintY })}
                            />,
                        )}
                    </Field>
                </More>
            )}
        </Group>
    );
}

/**
 * What this element does with the space its parent gives it.
 *
 * Only shown inside a flowing parent — in an absolute one the element is
 * placed by x/y and none of this applies. It is separate from Size because it
 * answers a different question: Size is how big this box wants to be, this is
 * how it negotiates with its siblings for what is left over.
 */
function FlexChildGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle, onCommitStart, onCommitEnd } = ctx;
    const parent = ctx.elements.find((candidate) => candidate.id === ctx.element.parentId);
    const inGrid = parent?.type === "Grid" || parent?.type === "Repeat";

    return (
        <Group title="In the parent" defaultOpen={false}>
            {ov(
                ["alignSelf"],
                <SelectInput
                    label="Align self"
                    value={style.alignSelf}
                    options={[
                        { label: "Follow the parent", value: "auto" as AlignSelf },
                        { label: "Start", value: "start" as AlignSelf },
                        { label: "Centre", value: "center" as AlignSelf },
                        { label: "End", value: "end" as AlignSelf },
                        { label: "Stretch", value: "stretch" as AlignSelf },
                        { label: "Baseline", value: "baseline" as AlignSelf },
                    ]}
                    onChange={(alignSelf) => onStyle({ alignSelf })}
                />,
            )}

            {inGrid
                ? ov(
                      ["gridSpan"],
                      <NumberInput
                          label="Column span"
                          min={1}
                          max={12}
                          value={style.gridSpan}
                          onChange={(gridSpan) => onStyle({ gridSpan: Math.round(gridSpan) })}
                      />,
                  )
                : ov(
                      ["grow"],
                      <NumberInput
                          label="Grow"
                          min={-1}
                          max={100}
                          value={style.grow}
                          onChange={(grow) => onStyle({ grow: Math.round(grow) })}
                      />,
                  )}
            {!inGrid && (
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    -1 leaves it to the width and height modes. 0 holds its size; 1 or
                    more claims that share of the leftover space, so two siblings at 2
                    and 1 split the row two-thirds to one.
                </p>
            )}

            <More>
                {ov(
                    ["order"],
                    <NumberInput
                        label="Order"
                        min={-999}
                        max={999}
                        value={style.order}
                        onChange={(order) => onStyle({ order: Math.round(order) })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    Moves the element among its siblings without moving it in the
                    layer tree. Set it on one breakpoint to reorder a row on mobile
                    while the layers stay where the rest of the page expects them.
                </p>
            </More>
        </Group>
    );
}

function LayoutGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle, element } = ctx;
    const isGrid = element.type === "Grid" || element.type === "Repeat";

    return (
        <Group title="Layout">
            {ov(
                ["layout"],
                <Segmented
                    label="Mode"
                    value={style.layout}
                    options={[
                        { label: "Stack", value: "stack" as LayoutMode },
                        { label: "Free", value: "absolute" as LayoutMode },
                    ]}
                    onChange={(layout) => onStyle({ layout })}
                />,
            )}

            {style.layout === "stack" && (
                <>
                    {isGrid
                        ? ov(
                              ["columns"],
                              <NumberInput
                                  label="Columns"
                                  min={1}
                                  max={12}
                                  value={style.columns}
                                  onChange={(columns) => onStyle({ columns })}
                              />,
                          )
                        : ov(
                              ["direction"],
                              <Segmented
                                  label="Flow"
                                  value={style.direction}
                                  options={[
                                      {
                                          label: "Row",
                                          value: "row" as Direction,
                                          icon: <IconArrowsHorizontal size={12} />,
                                      },
                                      {
                                          label: "Column",
                                          value: "column" as Direction,
                                          icon: <IconArrowsVertical size={12} />,
                                      },
                                  ]}
                                  onChange={(direction) => onStyle({ direction })}
                              />,
                          )}

                    {ov(
                        ["gap"],
                        <NumberInput
                            label="Gap"
                            suffix="px"
                            min={0}
                            value={style.gap}
                            onChange={(gap) => onStyle({ gap })}
                        />,
                    )}

                    <More label="Gaps and wrapping">
                        {ov(
                            ["rowGap"],
                            <NumberInput
                                label="Row gap"
                                suffix="px"
                                min={-1}
                                value={style.rowGap}
                                onChange={(rowGap) => onStyle({ rowGap: Math.round(rowGap) })}
                            />,
                        )}
                        {ov(
                            ["columnGap"],
                            <NumberInput
                                label="Column gap"
                                suffix="px"
                                min={-1}
                                value={style.columnGap}
                                onChange={(columnGap) => onStyle({ columnGap: Math.round(columnGap) })}
                            />,
                        )}
                        <p className="text-[10px] leading-relaxed text-ed-faint">
                            -1 leaves the axis to the single Gap above. Set one to pull
                            wrapped rows closer than the columns are.
                        </p>
                        {style.wrap &&
                            ov(
                                ["alignContent"],
                                <SelectInput
                                    label="Wrapped lines"
                                    value={style.alignContent}
                                    options={[
                                        { label: "Packed at the start", value: "start" as AlignContent },
                                        { label: "Centred", value: "center" as AlignContent },
                                        { label: "Packed at the end", value: "end" as AlignContent },
                                        { label: "Stretched", value: "stretch" as AlignContent },
                                        { label: "Spaced apart", value: "between" as AlignContent },
                                    ]}
                                    onChange={(alignContent) => onStyle({ alignContent })}
                                />,
                            )}
                    </More>

                    <More label="Alignment">
                        {ov(
                            ["align"],
                            <Segmented
                                label="Align"
                                value={style.align}
                                options={[
                                    { label: "Start", value: "start" as Align },
                                    { label: "Center", value: "center" as Align },
                                    { label: "End", value: "end" as Align },
                                    { label: "Stretch", value: "stretch" as Align },
                                ]}
                                onChange={(align) => onStyle({ align })}
                            />,
                        )}
                        {!isGrid &&
                            ov(
                                ["justify"],
                                <Segmented
                                    label="Spread"
                                    value={style.justify}
                                    options={[
                                        { label: "Start", value: "start" as Justify },
                                        { label: "Center", value: "center" as Justify },
                                        { label: "End", value: "end" as Justify },
                                        { label: "Space", value: "between" as Justify },
                                    ]}
                                    onChange={(justify) => onStyle({ justify })}
                                />,
                            )}
                        {!isGrid &&
                            ov(
                                ["wrap"],
                                <Segmented
                                    label="Wrap"
                                    value={style.wrap ? "on" : "off"}
                                    options={[
                                        { label: "Off", value: "off" },
                                        { label: "On", value: "on" },
                                    ]}
                                    onChange={(value) => onStyle({ wrap: value === "on" })}
                                />,
                            )}
                    </More>
                </>
            )}
        </Group>
    );
}

/**
 * The room around and inside this layer.
 *
 * Padding and margin are one control with two tabs rather than two stacked
 * sections: an author adjusting the space around a box is choosing between
 * inside and outside, and showing both at once doubles the panel for a choice
 * that is one or the other.
 *
 * Each side gets its own field in a 2x2 grid laid out the way the box is —
 * top above, bottom below — so the field an author reaches for is where the
 * edge it changes actually is. The old "Per side" disclosure hid the same four
 * values behind a click and listed them vertically, which read as a form
 * rather than a box.
 */
/**
 * One numeric cell in the box model.
 *
 * The cells carry no border of their own: the diagram's own rectangles already
 * say what each number belongs to, and eight bordered inputs inside two nested
 * boxes turn into a grid of noise.
 */
function SpacingCell({
    value,
    onChange,
    label,
    disabled,
}: {
    value: number;
    onChange: (value: number) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <input
            type="number"
            min={0}
            aria-label={label}
            title={label}
            disabled={disabled}
            value={Number.isFinite(value) ? value : 0}
            onFocus={(event) => event.target.select()}
            onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) onChange(Math.max(0, next));
            }}
            className="h-6 w-10 rounded-md bg-transparent text-center text-[11px] tabular-nums text-ed-text outline-none transition-colors [appearance:textfield] hover:bg-ed-field focus:bg-ed-field focus:ring-1 focus:ring-inset focus:ring-[var(--ed-accent)] disabled:cursor-not-allowed disabled:text-ed-faint [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
    );
}

/**
 * Padding and margin as the nested box every browser inspector draws.
 *
 * The two used to sit behind a pair of sub-tabs, which meant you could only
 * see half of an element's spacing at a time — and spacing is nearly always
 * read as a whole: the gap outside plus the gap inside is what decides whether
 * something looks right.
 */
function SpacingGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;
    const [uniformPadding, setUniformPadding] = useState(
        style.padT === style.padR && style.padR === style.padB && style.padB === style.padL,
    );
    const horizontallyCentered = style.marginL === "auto" && style.marginR === "auto";
    const marginValue = (side: "marginL" | "marginR") =>
        typeof style[side] === "number" ? (style[side] as number) : 0;

    const pad = (key: "padT" | "padR" | "padB" | "padL", label: string, value: number) =>
        ov(
            [key],
            <SpacingCell
                label={label}
                value={value}
                onChange={(next) =>
                    onStyle(
                        uniformPadding
                            ? { padT: next, padR: next, padB: next, padL: next }
                            : ({ [key]: next } as Partial<ElementStyle>),
                    )
                }
            />,
        );

    return (
        <Group title="Spacing">
            <div className="relative rounded-lg border border-dashed border-ed-border bg-ed-subtle p-1.5">
                <span className="absolute left-2 top-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-ed-faint">Margin</span>

                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-x-1 gap-y-0.5 pt-3">
                    <span />
                    {ov(["marginT"], <SpacingCell label="Margin top" value={style.marginT} onChange={(marginT) => onStyle({ marginT })} />)}
                    <span />

                    {ov(
                        ["marginL"],
                        <SpacingCell
                            label={horizontallyCentered ? "Left margin is auto" : "Margin left"}
                            disabled={horizontallyCentered}
                            value={marginValue("marginL")}
                            onChange={(marginL) => onStyle({ marginL })}
                        />,
                    )}

                    {/* The padding box sits inside the margin box, the way the
                        two actually nest on the page. */}
                    <div className="relative w-full rounded-lg bg-ed-surface p-1.5">
                        <span className="absolute left-2 top-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-ed-faint">Padding</span>
                        <button
                            type="button"
                            aria-label={uniformPadding ? "Set each padding side on its own" : "Set every padding side together"}
                            aria-pressed={uniformPadding}
                            onClick={() => setUniformPadding((current) => !current)}
                            className={`absolute right-1 top-1 flex size-5 items-center justify-center rounded transition-colors ${uniformPadding ? "text-ed-accent" : "text-ed-faint hover:text-ed-muted"}`}
                        >
                            {uniformPadding ? <IconLink size={12} /> : <IconUnlink size={12} />}
                        </button>

                        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-x-1 gap-y-0.5 pt-3">
                            <span />
                            {pad("padT", "Padding top", style.padT)}
                            <span />
                            {pad("padL", "Padding left", style.padL)}
                            <span className="h-7 w-full rounded bg-ed-field" />
                            {pad("padR", "Padding right", style.padR)}
                            <span />
                            {pad("padB", "Padding bottom", style.padB)}
                            <span />
                        </div>
                    </div>

                    {ov(
                        ["marginR"],
                        <SpacingCell
                            label={horizontallyCentered ? "Right margin is auto" : "Margin right"}
                            disabled={horizontallyCentered}
                            value={marginValue("marginR")}
                            onChange={(marginR) => onStyle({ marginR })}
                        />,
                    )}

                    <span />
                    {ov(["marginB"], <SpacingCell label="Margin bottom" value={style.marginB} onChange={(marginB) => onStyle({ marginB })} />)}
                    <span />
                </div>
            </div>

            <button
                type="button"
                aria-pressed={horizontallyCentered}
                onClick={() => onStyle(horizontallyCentered ? { marginL: 0, marginR: 0 } : { marginL: "auto", marginR: "auto" })}
                className={`flex h-8 w-full items-center justify-center gap-2 rounded-md border text-[10px] font-medium transition-colors ${horizontallyCentered ? "border-ed-accent bg-[var(--ed-accent-soft)] text-ed-accent" : "border-ed-border bg-ed-field text-ed-muted hover:text-ed-text"}`}
            >
                <IconAlignBoxCenterMiddle size={13} />
                {horizontallyCentered ? "Horizontally centered" : "Center horizontally"}
            </button>
        </Group>
    );
}

const GRADIENT_PRESETS = [
    "linear-gradient(135deg,#6366f1,#a855f7)",
    "linear-gradient(135deg,#0ea5e9,#22d3ee)",
    "linear-gradient(135deg,#f97316,#ef4444)",
    "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.6))",
];

function FillGroup({
    ctx,
    ov,
    defaultOpen,
}: {
    ctx: Ctx;
    ov: Wrap;
    defaultOpen: boolean;
}) {
    const { style, onStyle } = ctx;

    // Text already sets its own colour in the Text group; repeating it here
    // would be the second place to change one value.
    const paintsForeground = ctx.element.type === "Icon";

    return (
        <Group title="Appearance" defaultOpen={defaultOpen}>
            {ov(
                ["bg"],
                <ColorInput
                    label="Background"
                    value={style.bg}
                    placeholder="transparent"
                    onChange={(bg) => onStyle({ bg })}
                />,
            )}
            {style.bg !== "transparent" &&
                style.bg !== "" &&
                ov(
                    ["bgOpacity"],
                    <SliderInput
                        label="Fill opacity"
                        min={0}
                        max={100}
                        suffix="%"
                        value={style.bgOpacity}
                        onChange={(bgOpacity) => onStyle({ bgOpacity })}
                        onCommitStart={ctx.onCommitStart}
                        onCommitEnd={ctx.onCommitEnd}
                    />,
                )}
            {paintsForeground &&
                ov(
                    ["color"],
                    <ColorInput
                        label="Colour"
                        value={style.color}
                        onChange={(color) => onStyle({ color })}
                    />,
                )}
            {ov(
                ["opacity"],
                <SliderInput
                    label="Opacity"
                    min={0}
                    max={100}
                    suffix="%"
                    value={style.opacity}
                    onChange={(opacity) => onStyle({ opacity })}
                    onCommitStart={ctx.onCommitStart}
                    onCommitEnd={ctx.onCommitEnd}
                />,
            )}
            {style.opacity < 100 && style.backdropBlur > 0 && (
                <p className="rounded-lg bg-amber-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-amber-400">
                    Opacity fades the whole element, including the glass blur behind
                    it. For a frosted panel leave Opacity at 100% and lower Fill
                    opacity instead.
                </p>
            )}
            <More label="Gradient">
                <div className="flex gap-1">
                    {GRADIENT_PRESETS.map((preset) => (
                        <button
                            type="button"
                            key={preset}
                            aria-label="Apply gradient preset"
                            onClick={() => onStyle({ gradient: preset })}
                            className="h-5 flex-1 rounded"
                            style={{ backgroundImage: preset }}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => onStyle({ gradient: "" })}
                        className="h-5 flex-1 rounded text-[9px] text-ed-muted hover:text-ed-text"
                    >
                        None
                    </button>
                </div>
                {ov(
                    ["gradient"],
                    <TextInput
                        label="Custom"
                        value={style.gradient}
                        placeholder="linear-gradient(...)"
                        onChange={(gradient) => onStyle({ gradient })}
                    />,
                )}
            </More>
        </Group>
    );
}

/**
 * Every face the site can set on a layer: the fonts the host provides, the
 * ones the author uploaded, and the generic stacks — the same list the site
 * font picker offers, so what you can choose for the site you can also choose
 * for one heading.
 */
function fontOptionsFor(rootStyle: RootStyle, providerFonts: Array<{ title: string; family: string }>) {
    const custom = (rootStyle.customFonts ?? []).map((font) => ({
        label: font.name,
        value: `"${font.name}", sans-serif`,
    }));
    const provided = providerFonts.map((font) => ({ label: font.title, value: font.family }));
    const options = [...custom, ...provided, ...FONT_STACKS];
    return options.filter((font, index) => options.findIndex((candidate) => candidate.value === font.value) === index);
}

function TypographyGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle, onCommitStart, onCommitEnd, rootStyle } = ctx;
    const providerFonts = usePagieraFonts();
    const fontOptions = useMemo(() => {
        const all = fontOptionsFor(rootStyle, providerFonts);
        // "Inherit" is the site font by another name, so it says which one.
        const site = all.find((font) => font.value === rootStyle.fontFamily);
        return all.map((font) => font.value === "inherit"
            ? { ...font, label: site && site.value !== "inherit" ? `Site font · ${site.label}` : "Site font" }
            : font);
    }, [providerFonts, rootStyle]);

    return (
        <Group title="Text">
            {ov(
                ["color"],
                <ColorInput
                    label="Colour"
                    value={style.color}
                    onChange={(color) => onStyle({ color })}
                />,
            )}
            {ov(
                ["fontSize"],
                <ScrubInput
                    label="Size"
                    suffix="px"
                    min={8}
                    max={160}
                    value={style.fontSize}
                    onChange={(fontSize) => onStyle({ fontSize })}
                    onCommitStart={onCommitStart}
                    onCommitEnd={onCommitEnd}
                />,
            )}
            {ov(
                ["lineHeight"],
                <ScrubInput
                    label="Line height"
                    min={0.8}
                    max={3}
                    step={0.05}
                    value={style.lineHeight}
                    onChange={(lineHeight) => onStyle({ lineHeight })}
                    onCommitStart={onCommitStart}
                    onCommitEnd={onCommitEnd}
                />,
            )}            {ov(
                ["fontWeight"],
                <SelectInput
                    label="Weight"
                    value={style.fontWeight}
                    options={[
                        { label: "Light", value: "300" },
                        { label: "Normal", value: "normal" },
                        { label: "Medium", value: "500" },
                        { label: "Semibold", value: "600" },
                        { label: "Bold", value: "bold" },
                        { label: "Black", value: "800" },
                    ]}
                    onChange={(fontWeight) => onStyle({ fontWeight })}
                />,
            )}
            {ov(
                ["textAlign"],
                <Segmented
                    label="Align"
                    value={style.textAlign}
                    options={[
                        {
                            label: "Left",
                            value: "left" as TextAlign,
                            icon: <IconAlignBoxLeftMiddle size={12} />,
                        },
                        {
                            label: "Center",
                            value: "center" as TextAlign,
                            icon: <IconAlignBoxCenterMiddle size={12} />,
                        },
                        {
                            label: "Right",
                            value: "right" as TextAlign,
                            icon: <IconAlignBoxRightMiddle size={12} />,
                        },
                        {
                            label: "Justify",
                            value: "justify" as TextAlign,
                            icon: <IconAlignBoxLeftStretch size={12} />,
                        },
                    ]}
                    onChange={(textAlign) => onStyle({ textAlign })}
                />,
            )}

            {ov(
                ["fontFamily"],
                <SelectInput
                    label="Font"
                    value={style.fontFamily}
                    options={fontOptions}
                    onChange={(fontFamily) => onStyle({ fontFamily })}
                />,
            )}

            <More>
                {ov(
                    ["letterSpacing"],
                    <ScrubInput
                        label="Tracking"
                        suffix="px"
                        min={-5}
                        max={20}
                        step={0.1}
                        value={style.letterSpacing}
                        onChange={(letterSpacing) => onStyle({ letterSpacing })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["textTransform"],
                    <SelectInput
                        label="Case"
                        value={style.textTransform}
                        options={[
                            { label: "As typed", value: "none" as TextTransform },
                            { label: "UPPERCASE", value: "uppercase" as TextTransform },
                            { label: "lowercase", value: "lowercase" as TextTransform },
                            { label: "Capitalize", value: "capitalize" as TextTransform },
                        ]}
                        onChange={(textTransform) => onStyle({ textTransform })}
                    />,
                )}
            </More>
        </Group>
    );
}

/** The element's edge: its corners, its border and the shadow it casts. */
function BorderGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;
    const knownShadow = SHADOW_PRESETS.some((p) => p.value === style.shadow);
    const separateBorders = [style.borderT, style.borderR, style.borderB, style.borderL].some((value) => value !== null);
    const hasBorder = [style.borderT, style.borderR, style.borderB, style.borderL]
        .map((value) => value ?? style.borderW)
        .some((value) => value > 0);

    return (
        <Group title="Border and shadow" defaultOpen={false}>
            {ov(
                ["radius"],
                <NumberInput
                    label="Corner radius"
                    suffix="px"
                    min={0}
                    value={style.radius}
                    onChange={(radius) => onStyle({ radius })}
                />,
            )}
            {ov(
                ["shadow"],
                <SelectInput
                    label="Shadow"
                    value={knownShadow ? style.shadow : "custom"}
                    options={
                        knownShadow
                            ? SHADOW_PRESETS
                            : [...SHADOW_PRESETS, { label: "Custom", value: "custom" }]
                    }
                    onChange={(shadow) => {
                        if (shadow !== "custom") onStyle({ shadow });
                    }}
                />,
            )}

            <More label="Border sides">
                <Segmented
                    label="Border sides"
                    value={separateBorders ? "separate" : "linked"}
                    options={[
                        { label: "Linked", value: "linked" as const },
                        { label: "Separate", value: "separate" as const },
                    ]}
                    onChange={(value) => value === "linked"
                        ? onStyle({ borderT: null, borderR: null, borderB: null, borderL: null })
                        : onStyle({ borderT: style.borderW, borderR: style.borderW, borderB: style.borderW, borderL: style.borderW })}
                />
                {!separateBorders && ov(
                    ["borderW"],
                    <NumberInput
                        label="All sides"
                        suffix="px"
                        min={0}
                        value={style.borderW}
                        onChange={(borderW) => onStyle({ borderW })}
                    />,
                )}
                {separateBorders && (
                    <div className="grid grid-cols-2 gap-2">
                        {ov(["borderT"], <NumberInput compact label="Top" min={0} value={style.borderT ?? style.borderW} onChange={(borderT) => onStyle({ borderT })} />)}
                        {ov(["borderR"], <NumberInput compact label="Right" min={0} value={style.borderR ?? style.borderW} onChange={(borderR) => onStyle({ borderR })} />)}
                        {ov(["borderB"], <NumberInput compact label="Bottom" min={0} value={style.borderB ?? style.borderW} onChange={(borderB) => onStyle({ borderB })} />)}
                        {ov(["borderL"], <NumberInput compact label="Left" min={0} value={style.borderL ?? style.borderW} onChange={(borderL) => onStyle({ borderL })} />)}
                    </div>
                )}
                {ov(
                    ["borderStyle"],
                    <SelectInput
                        label="Style"
                        value={style.borderStyle}
                        options={[
                            { label: "Solid", value: "solid" as const },
                            { label: "Dashed", value: "dashed" as const },
                            { label: "Dotted", value: "dotted" as const },
                        ]}
                        onChange={(borderStyle) => onStyle({ borderStyle })}
                    />,
                )}                {hasBorder &&
                    ov(
                        ["borderC"],
                        <ColorInput
                            label="Colour"
                            value={style.borderC}
                            onChange={(borderC) => onStyle({ borderC })}
                        />,
                    )}
            </More>
        </Group>
    );
}

/**
 * The pieces that turn a stack of boxes into a designed page: clipping,
 * sticky rails, imagery, glass and blend effects.
 */
/**
 * Why a sticky element will not stick.
 *
 * Both causes are silent — the element simply scrolls away with everything
 * else, and nothing in the style panel hints at the ancestor responsible. That
 * makes it the single most confusing property in the editor, so the reason is
 * named here rather than left to be discovered.
 */
function stickyBlocker(ctx: Ctx): string | undefined {
    if (ctx.style.position !== "sticky") return undefined;
    if (ctx.parentLayout === "absolute") {
        return "Its container places children freely, so this is already out of the flow and cannot stick. Switch the container to Stack.";
    }

    const byId = new Map(ctx.elements.map((el) => [el.id, el]));
    let cursor = ctx.element.parentId ? byId.get(ctx.element.parentId) : undefined;
    const seen = new Set<string>([ctx.element.id]);
    while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id);
        const overflow = resolveStyle(cursor, ctx.breakpoint).overflow;
        if (overflow !== "visible") {
            return `“${displayName(cursor)}” clips its content (overflow: ${overflow}), which stops anything inside it from sticking. Set that layer's overflow to Visible.`;
        }
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return undefined;
}

function CompositionGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle, onCommitStart, onCommitEnd } = ctx;
    const stickyWarning = stickyBlocker(ctx);

    return (
        <Group title="Position" defaultOpen={false}>
            {ov(
                ["position"],
                <SelectInput
                    label="Type"
                    value={style.position}
                    options={[
                        { label: "Default", value: "static" as PositionMode },
                        { label: "Sticky", value: "sticky" as PositionMode },
                        { label: "Fixed", value: "fixed" as PositionMode },
                        { label: "Absolute", value: "absolute" as PositionMode },
                    ]}
                    onChange={(position) => onStyle({ position })}
                />,
            )}
            {ov(
                ["zIndex"],
                <NumberInput
                    label="Z-index"
                    value={style.zIndex}
                    min={-9999}
                    max={9999}
                    onChange={(zIndex) => onStyle({ zIndex: Math.round(zIndex) })}
                    onCommitStart={onCommitStart}
                    onCommitEnd={onCommitEnd}
                />,
            )}
            {ov(
                ["overflow"],
                <SelectInput
                    label="Overflow"
                    value={style.overflow}
                    options={[
                        { label: "Visible", value: "visible" as const },
                        { label: "Clip", value: "hidden" as const },
                        { label: "Scroll if needed", value: "auto" as const },
                        { label: "Always scroll", value: "scroll" as const },
                    ]}
                    onChange={(overflow) => onStyle({ overflow })}
                />,
            )}
            {ov(
                ["aspectRatio"],
                <SelectInput
                    label="Ratio"
                    value={style.aspectRatio}
                    options={ASPECT_RATIOS}
                    onChange={(aspectRatio) => onStyle({ aspectRatio })}
                />,
            )}
            {style.position !== "static" && (
                <>
                    {ov(
                        ["pinSide"],
                        <Segmented
                            label="Edge"
                            value={style.pinSide}
                            options={[
                                { label: "Top", value: "top" as PinSide },
                                { label: "Bottom", value: "bottom" as PinSide },
                                { label: "Left", value: "left" as PinSide },
                                { label: "Right", value: "right" as PinSide },
                            ]}
                            onChange={(pinSide) => onStyle({ pinSide })}
                        />,
                    )}
                    {ov(
                        ["stickyOffset"],
                        <NumberInput
                            label="Stops at"
                            suffix="px"
                            value={style.stickyOffset}
                            onChange={(stickyOffset) => onStyle({ stickyOffset })}
                        />,
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        {style.position === "absolute"
                            ? "Placed at its own coordinates. Its siblings keep stacking as if it were not there."
                            : style.position === "fixed"
                            ? "Holds its place on screen while the page scrolls under it. The canvas pins it to the artboard so you can still edit it."
                            : "Scrolls with the page until it reaches this edge, then holds until its container leaves."}
                    </p>
                    {stickyWarning && (
                        <p className="text-[10px] leading-relaxed text-amber-300">{stickyWarning}</p>
                    )}
                </>
            )}

            <More label="Image and effects">
                {ov(
                    ["bgImage"],
                    <TextInput
                        label="Image"
                        value={style.bgImage}
                        placeholder="https://…"
                        onChange={(bgImage) => onStyle({ bgImage })}
                    />,
                )}
                {style.bgImage !== "" && (
                    <>
                        {ov(
                            ["bgSize"],
                            <Segmented
                                label="Fit"
                                value={style.bgSize}
                                options={[
                                    { label: "Cover", value: "cover" as BgSize },
                                    { label: "Contain", value: "contain" as BgSize },
                                    { label: "Actual", value: "auto" as BgSize },
                                ]}
                                onChange={(bgSize) => onStyle({ bgSize })}
                            />,
                        )}
                        {ov(
                            ["bgPosition"],
                            <TextInput
                                label="Focus"
                                value={style.bgPosition}
                                placeholder="center"
                                onChange={(bgPosition) => onStyle({ bgPosition })}
                            />,
                        )}
                    </>
                )}
                {ov(
                    ["backdropBlur"],
                    <SliderInput
                        label="Glass"
                        min={0}
                        max={40}
                        suffix="px"
                        value={style.backdropBlur}
                        onChange={(backdropBlur) => onStyle({ backdropBlur })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["blur"],
                    <SliderInput
                        label="Blur"
                        min={0}
                        max={40}
                        suffix="px"
                        value={style.blur}
                        onChange={(blur) => onStyle({ blur })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["scale"],
                    <SliderInput
                        label="Scale"
                        min={10}
                        max={300}
                        suffix="%"
                        value={style.scale}
                        onChange={(scale) => onStyle({ scale })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["rotate"],
                    <SliderInput
                        label="Rotate"
                        min={-180}
                        max={180}
                        suffix="°"
                        value={style.rotate}
                        onChange={(rotate) => onStyle({ rotate })}
                        onCommitStart={onCommitStart}
                        onCommitEnd={onCommitEnd}
                    />,
                )}
                {ov(
                    ["blendMode"],
                    <SelectInput
                        label="Blend"
                        value={style.blendMode}
                        options={[
                            { label: "Normal", value: "normal" as BlendMode },
                            { label: "Multiply", value: "multiply" as BlendMode },
                            { label: "Screen", value: "screen" as BlendMode },
                            { label: "Overlay", value: "overlay" as BlendMode },
                            { label: "Darken", value: "darken" as BlendMode },
                            { label: "Lighten", value: "lighten" as BlendMode },
                            { label: "Difference", value: "difference" as BlendMode },
                            { label: "Luminosity", value: "luminosity" as BlendMode },
                        ]}
                        onChange={(blendMode) => onStyle({ blendMode })}
                    />,
                )}
            </More>
        </Group>
    );
}

/** Entrance effects play on the published page and in Preview, not on canvas. */
/* ------------------------------------------------------------------ content */

function InteractiveGroup({ element, onProps }: { element: CanvasElement; onProps: Ctx["onProps"] }) {
    const settings = normalizeInteractive(element.interactive)!;
    const update = (patch: Partial<InteractiveSettings>) => {
        const interactive = { ...settings, ...patch };
        onProps({ interactive, code: interactiveDocument(interactive), codeLanguage: "tsx" });
    };
    return <Group title={settings.kind === "carousel" ? "Carousel" : "Marquee"} defaultOpen>
        <Segmented label="Autoplay" value={settings.autoplay ? "on" : "off"} options={[{ label: "On", value: "on" }, { label: "Off", value: "off" }]} onChange={value => update({ autoplay: value === "on" })} />
        <NumberInput label={settings.kind === "carousel" ? "Interval" : "Duration"} value={settings.interval} min={1} max={120} suffix="s" onChange={interval => update({ interval })} />
        {settings.kind === "marquee" && <Segmented label="Direction" value={settings.reverse ? "right" : "left"} options={[{ label: "Left", value: "left" }, { label: "Right", value: "right" }]} onChange={value => update({ reverse: value === "right" })} />}
        {settings.kind === "marquee" && <p className="text-[11px] leading-relaxed text-ed-muted">Drop elements here or move them in Layers. The loop pauses while its layers are selected; click the canvas background to play. Edit spacing and appearance in Layout / Style.</p>}
        {settings.kind === "carousel" && <>
        <SelectInput label="Transition" value={settings.transition ?? "slide"} options={[{ label: "Slide", value: "slide" }, { label: "Fade", value: "fade" }, { label: "Zoom", value: "zoom" }]} onChange={transition => update({ transition })} />
        <NumberInput label="Animation" value={settings.duration ?? 450} min={0} max={2000} step={50} suffix="ms" onChange={duration => update({ duration })} />
        <SelectInput label="Easing" value={settings.easing ?? "ease"} options={[{ label: "Smooth", value: "ease" }, { label: "Linear", value: "linear" }, { label: "Ease in / out", value: "ease-in-out" }]} onChange={easing => update({ easing })} />
        <More>
            {([ ["loop", "Loop"], ["arrows", "Arrows"], ["dots", "Dots"], ["swipe", "Swipe / drag"], ["pauseOnHover", "Pause on hover"] ] as const).map(([key, label]) => <Segmented key={key} label={label} value={settings[key] !== false ? "on" : "off"} options={[{ label: "On", value: "on" }, { label: "Off", value: "off" }]} onChange={value => update({ [key]: value === "on" })} />)}
        </More>
        <ShaderColor label="Controls colour" value={settings.color} onChange={color => update({ color })} />
        <p className="text-[11px] leading-relaxed text-ed-muted">Each direct child is a slide. Use + Slide on the canvas to add a blank frame. Design it with any elements, and rename, reorder or duplicate slides in Layers. Slide appearance is edited in Layout / Style.</p>
        </>}
    </Group>;
}

function CarouselControlGroup({ element, elements, onProps }: Pick<Ctx, "element" | "elements" | "onProps">) {
    const seen = new Set<string>();
    let parent = elements.find(candidate => candidate.id === element.parentId);
    while (parent && parent.interactive?.kind !== "carousel" && !seen.has(parent.id)) {
        seen.add(parent.id);
        parent = elements.find(candidate => candidate.id === parent!.parentId);
    }
    if (!parent || parent.interactive?.kind !== "carousel") return null;
    const value = element.carouselControl;
    const update = (patch: Partial<NonNullable<CanvasElement["carouselControl"]>>) => onProps({ carouselControl: { action: "go-to", slide: 1, ...value, ...patch } });
    const slides = elements.filter(candidate => candidate.parentId === parent.id && !candidate.carouselControl);
    return <Group title="Carousel control" defaultOpen>
        <SelectInput label="Role" value={value?.action ?? "none"} options={[{ label: "Slide content", value: "none" }, { label: "Previous slide", value: "previous" }, { label: "Next slide", value: "next" }, { label: "Go to slide", value: "go-to" }, { label: "Controls group", value: "group" }]} onChange={action => action === "none" ? onProps({ carouselControl: undefined }) : update({ action })} />
        {value?.action === "go-to" && <>
            <SelectInput label="Target slide" value={String(value.slide)} options={slides.map((slide, index) => ({ label: `${index + 1} · ${slide.name || "Slide"}`, value: String(index + 1) }))} onChange={slide => update({ slide: Number(slide) })} />
            <Segmented label="Active fill" value={value.activeColor ? "on" : "off"} options={[{ label: "Keep design", value: "off" }, { label: "Custom", value: "on" }]} onChange={state => update({ activeColor: state === "on" ? "#5402e6" : undefined })} />
            {value.activeColor && <ShaderColor label="Active colour" value={value.activeColor} onChange={activeColor => update({ activeColor })} />}
            <NumberInput label="Inactive opacity" value={value.inactiveOpacity ?? 100} min={0} max={100} suffix="%" onChange={inactiveOpacity => update({ inactiveOpacity })} />
        </>}
        <p className="text-[11px] leading-relaxed text-ed-muted">Design this layer freely in Layout / Style. Place controls directly inside the carousel to keep them on every slide. Use a Controls group to arrange your own pagination. Custom controls replace their built-in equivalents in Preview.</p>
    </Group>;
}

function ContentTab({ element, elements, onProps, sources, bindingKeys, insideRepeat, uploadImage }: Ctx) {
    return (
        <div className="flex flex-col">
            {element.interactive && <InteractiveGroup element={element} onProps={onProps} />}
            <CarouselControlGroup element={element} elements={elements} onProps={onProps} />
            {element.disclosure && <Group title={element.disclosure.kind === 'tabs' ? 'Tabs' : 'Accordion'} defaultOpen>
                <p className="text-[11px] leading-relaxed text-ed-muted">Headers and panels are editable layers. Use Layers to design their content, and Layout / Style for spacing, colours and corners. Play effects to test interactions; edit mode keeps all panels visible.</p>
                {element.disclosure.role !== 'root' && <TextInput label="Panel key" value={element.disclosure.target} onChange={target => onProps({ disclosure: { ...element.disclosure!, target } })} />}
            </Group>}
            {(element.type === "Repeat" || element.type === "Request") && (
                <Group title="Data">
                    <SelectInput
                        label="Source"
                        value={element.sourceId ?? ""}
                        options={[
                            { label: "Choose a source…", value: "" },
                            ...sources.map((s) => ({ label: s.name, value: s.id })),
                        ]}
                        onChange={(sourceId) => onProps({ sourceId })}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        {element.type === "Request"
                            ? "Fetches on the server and renders its children once with the returned object. Bind child fields such as title or user.name."
                            : "Whatever you put inside this block is the template — it renders once per row. Add sources in the Data panel."}
                    </p>
                </Group>
            )}



            {isTextual(element.type) && (
                <Group title="Text">
                    <TextArea
                        label="Content"
                        value={element.content ?? ""}
                        onChange={(content) => onProps({ content })}
                    />
                </Group>
            )}

            {element.type === "Button" && (
                <Group title="Button behavior" defaultOpen={false}>
                    <SelectInput
                        label="Type"
                        value={element.buttonType ?? "button"}
                        options={[
                            { label: "Regular button", value: "button" as const },
                            { label: "Submit form", value: "submit" as const },
                            { label: "Reset form", value: "reset" as const },
                        ]}
                        onChange={(buttonType) => onProps({ buttonType })}
                    />
                </Group>
            )}

            {isField(element.type) && <FieldGroup element={element} onProps={onProps} />}

            {element.type === "Label" && (
                <Group title="Label">
                    <SelectInput
                        label="Labels"
                        value={element.labelFor ?? ""}
                        options={[
                            { label: "Nothing yet", value: "" },
                            ...elements
                                .filter((candidate) => isField(candidate.type))
                                .map((candidate) => ({ label: displayName(candidate), value: candidate.id })),
                        ]}
                        onChange={(labelFor) => onProps({ labelFor: labelFor || undefined })}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Clicking the label focuses the field it points at, and screen readers
                        announce the two together.
                    </p>
                </Group>
            )}

            {element.type === "Form" && (
                <Group title="Form">
                    <Segmented
                        label="Submit"
                        value={element.formSubmitMode ?? "request"}
                        options={[{ label: "Background", value: "request" as const }, { label: "Native", value: "native" as const }]}
                        onChange={(formSubmitMode) => onProps({ formSubmitMode })}
                    />
                    <TextInput label="Endpoint" value={element.formAction ?? ""} placeholder="https://api.example.com/contact" onChange={(formAction) => onProps({ formAction })} />
                    <SelectInput
                        label="Method"
                        value={element.formMethod ?? "POST"}
                        options={[
                            { label: "GET", value: "GET" as const },
                            { label: "POST", value: "POST" as const },
                            { label: "PUT", value: "PUT" as const },
                            { label: "PATCH", value: "PATCH" as const },
                            { label: "DELETE", value: "DELETE" as const },
                        ]}
                        onChange={(formMethod) => onProps({ formMethod })}
                    />
                    {element.formSubmitMode !== "native" && (
                        <>
                            <SelectInput
                                label="Payload"
                                value={element.formContentType ?? "json"}
                                options={[
                                    { label: "JSON", value: "json" as const },
                                    { label: "Form data", value: "form-data" as const },
                                    { label: "URL encoded", value: "urlencoded" as const },
                                ]}
                                onChange={(formContentType) => onProps({ formContentType })}
                            />
                            <TextArea label="Body" value={element.formBody ?? ""} onChange={(formBody) => onProps({ formBody })} />
                            <p className="text-[10px] leading-relaxed text-ed-faint">Leave body empty to send every field automatically. Custom bodies can use tokens such as {"{{form.email}}"}.</p>
                            <TextArea label="Headers" value={element.formHeaders ?? ""} onChange={(formHeaders) => onProps({ formHeaders })} />
                            <p className="text-[10px] leading-relaxed text-ed-faint">One header per line. These are visible in the browser, so private API keys must stay behind your own server endpoint.</p>
                            <TextInput label="Success" value={element.formSuccessMessage ?? ""} placeholder="Sent successfully." onChange={(formSuccessMessage) => onProps({ formSuccessMessage })} />
                            <TextInput label="Error" value={element.formErrorMessage ?? ""} placeholder="Something went wrong." onChange={(formErrorMessage) => onProps({ formErrorMessage })} />
                            <Segmented
                                label="On success"
                                value={element.formResetOnSuccess ? "reset" : "keep"}
                                options={[{ label: "Keep", value: "keep" as const }, { label: "Reset", value: "reset" as const }]}
                                onChange={(value) => onProps({ formResetOnSuccess: value === "reset" })}
                            />
                        </>
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">Background mode sends with fetch and keeps the visitor on the page. Native mode uses regular browser form navigation.</p>
                </Group>
            )}

            {element.type === "Image" && (
                <Group title="Image">
                    <ImageUpload src={element.src} onChange={(src) => onProps({ src })} uploadImage={uploadImage} />
                    <TextInput
                        label="Source"
                        value={element.src ?? ""}
                        placeholder="https://…"
                        onChange={(src) => onProps({ src })}
                    />
                    <TextInput
                        label="Alt text"
                        value={element.alt ?? ""}
                        placeholder="Describes the image"
                        onChange={(alt) => onProps({ alt })}
                    />
                    <SelectInput
                        label="Fit"
                        value={element.objectFit ?? "cover"}
                        options={[
                            { label: "Cover", value: "cover" as const },
                            { label: "Contain", value: "contain" as const },
                            { label: "Stretch", value: "fill" as const },
                            { label: "Original", value: "none" as const },
                        ]}
                        onChange={(objectFit) => onProps({ objectFit })}
                    />
                </Group>
            )}

            {element.type === "List" && (
                <Group title="List">
                    <Segmented
                        label="Markers"
                        value={element.listStyle ?? "bullet"}
                        options={[
                            { label: "Bullets", value: "bullet" as const },
                            { label: "Numbers", value: "number" as const },
                            { label: "None", value: "none" as const },
                        ]}
                        onChange={(listStyle) => onProps({ listStyle })}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Numbers publish the list as an <code className="text-ed-muted">ol</code>,
                        bullets and none as a <code className="text-ed-muted">ul</code>. Put List
                        item elements inside it; the markers sit in the list's left padding.
                    </p>
                </Group>
            )}

            {element.type === "Embed" && (
                <Group title="Embed">
                    <TextInput
                        label="URL"
                        value={element.src ?? ""}
                        placeholder="https://…"
                        onChange={(src) => onProps({ src })}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        For a map, a calendar or a third-party form. The frame is
                        sandboxed, and a site that refuses to be framed will show
                        nothing here — that is the other site's choice, not a broken URL.
                    </p>
                </Group>
            )}

            {element.type === "Video" && (
                <Group title="Video">
                    <TextInput
                        label="Embed URL"
                        value={element.src ?? ""}
                        placeholder="https://www.youtube.com/embed/…"
                        onChange={(src) => onProps({ src })}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Use the provider's embed URL — a normal watch link will be
                        refused by the site it points at.
                    </p>
                </Group>
            )}

            {element.type === "Icon" && <IconGroup element={element} onProps={onProps} />}
            {!insideRepeat && element.type !== "Repeat" && element.type !== "Request" && (
                <Group title="Data binding" defaultOpen={false}>
                    <SelectInput
                        label="Source"
                        value={element.sourceId ?? ""}
                        options={[
                            { label: "Not connected", value: "" },
                            ...sources.map((source) => ({ label: source.name, value: source.id })),
                        ]}
                        onChange={(sourceId) => onProps({ sourceId: sourceId || undefined, binding: sourceId ? element.binding : undefined })}
                    />
                    {element.sourceId && (bindingKeys.length > 0 ? (
                        <SelectInput
                            label="Field"
                            value={element.binding ?? ""}
                            options={[{ label: "Choose a field…", value: "" }, ...bindingKeys.map((key) => ({ label: key, value: key }))]}
                            onChange={(binding) => onProps({ binding: binding || undefined })}
                        />
                    ) : (
                        <TextInput
                            label="Field"
                            value={element.binding ?? ""}
                            placeholder="title, author.name or image.url"
                            onChange={(binding) => onProps({ binding: binding || undefined })}
                        />
                    ))}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Uses the returned object directly. Repeat is only needed when you want to render every item in a list.
                    </p>
                </Group>
            )}
            {insideRepeat && element.type !== "Repeat" && element.type !== "Request" && (
                <Group title="Data binding" defaultOpen={false}>
                    {bindingKeys.length > 0 ? (
                        <SelectInput
                            label="Field"
                            value={element.binding ?? ""}
                            options={[
                                { label: "Not bound", value: "" },
                                ...bindingKeys.map((key) => ({ label: key, value: key })),
                            ]}
                            onChange={(binding) => onProps({ binding: binding || undefined })}
                        />
                    ) : (
                        <TextInput
                            label="Field"
                            value={element.binding ?? ""}
                            placeholder="title, or author.name"
                            onChange={(binding) => onProps({ binding: binding || undefined })}
                        />
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        {element.type === "Image" || element.type === "Video"
                            ? "The field supplies this element's source URL."
                            : "The field supplies this element's text."}
                    </p>
                </Group>
            )}

            <Group title="Layer name" defaultOpen={false}>
                <TextInput
                    label="Name"
                    value={element.name ?? ""}
                    placeholder={element.type}
                    onChange={(name) => onProps({ name })}
                />
            </Group>

            <HtmlGroup element={element} onProps={onProps} />
        </div>
    );
}

/**
 * Everything a field submits and validates, for whichever field type is
 * selected. One group rather than one per type: an author moving from an Input
 * to a Select should find the name and required controls in the same place.
 */
function FieldGroup({
    element,
    onProps,
}: {
    element: CanvasElement;
    onProps: (patch: Partial<CanvasElement>) => void;
}) {
    const { type } = element;
    const boolean = type === "Checkbox";
    const textual = type === "Input" || type === "Textarea";
    const ranged =
        type === "Input" &&
        ["number", "range", "date", "time", "datetime-local", "month", "week"].includes(
            element.inputType ?? "text",
        );

    return (
        <Group title="Field">
            <FieldDesign element={element} onProps={onProps} />
            {type === "Input" && (
                <SelectInput
                    label="Type"
                    value={element.inputType ?? "text"}
                    options={INPUT_TYPES.map((value) => ({ label: INPUT_TYPE_LABELS[value], value }))}
                    onChange={(inputType: InputType) => onProps({ inputType })}
                />
            )}

            <TextInput
                label="Name"
                value={element.fieldName ?? ""}
                placeholder={type === "Radio" ? "plan" : "email"}
                onChange={(fieldName) => onProps({ fieldName })}
            />

            {(textual || type === "Select") && (
                <TextInput
                    label="Placeholder"
                    value={element.placeholder ?? ""}
                    placeholder={type === "Select" ? "Choose an option…" : "Enter a value…"}
                    onChange={(placeholder) => onProps({ placeholder })}
                />
            )}

            {hasOptions(type) && (
                <OptionsEditor
                    options={element.options ?? []}
                    onChange={(options) => onProps({ options })}
                />
            )}

            {boolean ? (
                <>
                    <TextInput
                        label="Submits"
                        value={element.defaultValue ?? ""}
                        placeholder="yes"
                        onChange={(defaultValue) => onProps({ defaultValue })}
                    />
                    <Segmented
                        label="Starts"
                        value={element.checked ? "checked" : "clear"}
                        options={[{ label: "Clear", value: "clear" as const }, { label: "Checked", value: "checked" as const }]}
                        onChange={(value) => onProps({ checked: value === "checked" || undefined })}
                    />
                </>
            ) : type !== "FileInput" ? (
                <TextInput
                    label="Default"
                    value={element.defaultValue ?? ""}
                    placeholder={hasOptions(type) ? "The value of a choice above" : "Pre-filled value"}
                    onChange={(defaultValue) => onProps({ defaultValue })}
                />
            ) : null}

            {type === "FileInput" && (
                <TextInput
                    label="Accepts"
                    value={element.accept ?? ""}
                    placeholder="image/*,.pdf"
                    onChange={(accept) => onProps({ accept })}
                />
            )}

            <Segmented
                label="Required"
                value={element.required ? "yes" : "no"}
                options={[{ label: "No", value: "no" as const }, { label: "Yes", value: "yes" as const }]}
                onChange={(value) => onProps({ required: value === "yes" || undefined })}
            />

            <More>
                {(type === "Select" || type === "FileInput") && (
                    <Segmented
                        label="Multiple"
                        value={element.multiple ? "yes" : "no"}
                        options={[{ label: "One", value: "no" as const }, { label: "Many", value: "yes" as const }]}
                        onChange={(value) => onProps({ multiple: value === "yes" || undefined })}
                    />
                )}

                {ranged && (
                    <>
                        <TextInput label="Min" value={element.minValue ?? ""} placeholder="0" onChange={(minValue) => onProps({ minValue })} />
                        <TextInput label="Max" value={element.maxValue ?? ""} placeholder="100" onChange={(maxValue) => onProps({ maxValue })} />
                        <TextInput label="Step" value={element.step ?? ""} placeholder="1" onChange={(step) => onProps({ step })} />
                    </>
                )}

                {textual && (
                    <>
                        <NumberInput
                            label="Min length"
                            value={element.minLength ?? 0}
                            min={0}
                            max={10000}
                            onChange={(minLength) => onProps({ minLength: minLength || undefined })}
                        />
                        <NumberInput
                            label="Max length"
                            value={element.maxLength ?? 0}
                            min={0}
                            max={10000}
                            onChange={(maxLength) => onProps({ maxLength: maxLength || undefined })}
                        />
                        <TextInput
                            label="Pattern"
                            value={element.pattern ?? ""}
                            placeholder="[0-9]{4}"
                            onChange={(pattern) => onProps({ pattern })}
                        />
                        <TextInput
                            label="Autocomplete"
                            value={element.autocomplete ?? ""}
                            placeholder="email, name, off…"
                            onChange={(autocomplete) => onProps({ autocomplete })}
                        />
                        <Segmented
                            label="Read only"
                            value={element.readOnly ? "yes" : "no"}
                            options={[{ label: "No", value: "no" as const }, { label: "Yes", value: "yes" as const }]}
                            onChange={(value) => onProps({ readOnly: value === "yes" || undefined })}
                        />
                    </>
                )}

                <Segmented
                    label="Disabled"
                    value={element.disabled ? "yes" : "no"}
                    options={[{ label: "No", value: "no" as const }, { label: "Yes", value: "yes" as const }]}
                    onChange={(value) => onProps({ disabled: value === "yes" || undefined })}
                />
            </More>
        </Group>
    );
}

const INPUT_TYPE_LABELS: Record<InputType, string> = {
    text: "Text",
    email: "Email",
    password: "Password",
    number: "Number",
    tel: "Telephone",
    url: "URL",
    search: "Search",
    date: "Date",
    time: "Time",
    "datetime-local": "Date and time",
    month: "Month",
    week: "Week",
    color: "Colour",
    range: "Slider",
    hidden: "Hidden",
};

/**
 * The glyph an Icon draws: one from the catalogue, or the author's own SVG.
 *
 * A pasted SVG takes over while it is set, so the two are shown as one choice
 * rather than two fields that both claim to decide the shape.
 */
function IconGroup({
    element,
    onProps,
}: {
    element: CanvasElement;
    onProps: (patch: Partial<CanvasElement>) => void;
}) {
    const [draft, setDraft] = useState(element.svg ?? "");
    const custom = Boolean(element.svg);

    return (
        <Group title="Icon">
            <Segmented
                label="Source"
                value={custom ? "custom" : "catalog"}
                options={[
                    { label: "Catalogue", value: "catalog" as const },
                    { label: "Custom SVG", value: "custom" as const },
                ]}
                onChange={(value) =>
                    onProps({ svg: value === "custom" ? draft || PLACEHOLDER_SVG : undefined })
                }
            />

            {custom ? (
                <>
                    <CodeInput
                        label="SVG"
                        rows={7}
                        value={draft}
                        placeholder={PLACEHOLDER_SVG}
                        hint="Paste a complete <svg> element. Scripts, stylesheets and links to other documents are removed when the page is saved."
                        onChange={(value) => {
                            setDraft(value);
                            onProps({ svg: value });
                        }}
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Use <code className="text-ed-muted">currentColor</code> for strokes and
                        fills and the icon will follow the Colour field in Style. A hard-coded
                        colour in the SVG stays exactly as written.
                    </p>
                    {draft.trim() && !element.svg && (
                        <p className="rounded-lg bg-amber-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-amber-400">
                            This is not being drawn: an icon has to be a single complete
                            &lt;svg&gt;…&lt;/svg&gt; element.
                        </p>
                    )}
                </>
            ) : (
                <SelectInput
                    label="Glyph"
                    value={element.iconName ?? "star"}
                    options={ICON_CATALOG.map((icon) => ({
                        label: `${icon.category} · ${icon.name}`,
                        value: icon.value,
                    }))}
                    onChange={(iconName) => onProps({ iconName })}
                />
            )}
        </Group>
    );
}

const PLACEHOLDER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 4 21h16z"/></svg>';

/**
 * The markup escape hatch: the tag an element publishes as, the classes and
 * declarations layered over the generated ones, and any raw attribute.
 *
 * It is closed by default and last in the panel because reaching for it means
 * the inspector above could not express something — the exception, not the
 * route most edits should take.
 */
function HtmlGroup({
    element,
    onProps,
}: {
    element: CanvasElement;
    onProps: (patch: Partial<CanvasElement>) => void;
}) {
    return (
        <Group title="HTML" defaultOpen={false}>
            <SelectInput
                label="Tag"
                value={element.tag ?? ""}
                options={[
                    { label: `Automatic (${element.type.toLowerCase()})`, value: "" },
                    ...CUSTOM_TAGS.map((tag) => ({ label: `<${tag}>`, value: tag })),
                ]}
                onChange={(tag) => onProps({ tag: (tag || undefined) as CustomTag | undefined })}
            />
            <p className="text-[10px] leading-relaxed text-ed-faint">
                Changes only the published markup — the canvas keeps drawing the element
                the same way. Fields and images ignore it, since their tag carries their
                behaviour.
            </p>

            <TextInput
                label="Classes"
                value={element.customClass ?? ""}
                placeholder="hero-card featured"
                onChange={(customClass) => onProps({ customClass })}
            />

            <CodeInput
                label="Inline style"
                rows={4}
                value={element.customStyle ?? ""}
                placeholder={"mix-blend-mode: difference;\n--accent: #5402e6;"}
                hint="Applied on the element itself, so it overrides everything the inspector set."
                onChange={(customStyle) => onProps({ customStyle })}
            />

            <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-ed-muted">Attributes</span>
                <AttributesEditor
                    attributes={element.attributes ?? []}
                    onChange={(attributes) => onProps({ attributes })}
                />
            </div>
        </Group>
    );
}

/* -------------------------------------------------------------------- hover */

function bezierValues(value: string): [number, number, number, number] {
    const values = value.split(",").map((part) => Number(part.trim()));
    return values.length === 4 && values.every(Number.isFinite)
        ? [values[0], values[1], values[2], values[3]]
        : [0.44, 0, 0.56, 1];
}

function BezierEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const points = bezierValues(value);
    const px = (x: number) => 20 + x * 120;
    const py = (y: number) => 84 - y * 68;
    const begin = (event: React.PointerEvent<SVGCircleElement>, point: 0 | 1) => {
        event.preventDefault();
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        const move = (pointer: PointerEvent) => {
            const rect = svg.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, ((pointer.clientX - rect.left) / rect.width * 160 - 20) / 120));
            const y = Math.max(-1, Math.min(2, (84 - (pointer.clientY - rect.top) / rect.height * 100) / 68));
            const next = [...points] as [number, number, number, number];
            next[point * 2] = x;
            next[point * 2 + 1] = y;
            onChange(next.map((number) => Number(number.toFixed(2))).join(", "));
        };
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up, { once: true });
    };
    return <div className="rounded-xl bg-white/5 p-2"><svg viewBox="0 0 160 100" className="h-36 w-full touch-none overflow-visible"><path d="M20 84H140M20 16V84" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1"/><line x1="20" y1="84" x2={px(points[0])} y2={py(points[1])} stroke="#52525b"/><line x1="140" y1="16" x2={px(points[2])} y2={py(points[3])} stroke="#52525b"/><path d={`M20 84 C${px(points[0])} ${py(points[1])}, ${px(points[2])} ${py(points[3])}, 140 16`} fill="none" stroke="#a1a1aa" strokeWidth="2.2"/><circle cx="20" cy="84" r="4" fill="#fff"/><circle cx="140" cy="16" r="4" fill="#fff"/><circle cx={px(points[0])} cy={py(points[1])} r="6" fill="#4f8cff" stroke="white" strokeWidth="2" className="cursor-grab active:cursor-grabbing" onPointerDown={(event) => begin(event, 0)}/><circle cx={px(points[2])} cy={py(points[3])} r="6" fill="#4f8cff" stroke="white" strokeWidth="2" className="cursor-grab active:cursor-grabbing" onPointerDown={(event) => begin(event, 1)}/></svg><div className="grid grid-cols-4 gap-1">{points.map((number, index) => <label key={index} className="rounded-md bg-black/20 px-1.5 py-1 text-center font-mono text-[9px] text-zinc-400"><span className="mr-1 text-zinc-600">{["X1", "Y1", "X2", "Y2"][index]}</span>{number}</label>)}</div></div>;
}

/**
 * Everything that happens *after* the page has loaded: what a click does, how
 * the element answers a pointer, and the motion it plays on its own.
 *
 * Each behaviour is one group with an explicit on/off, rather than the
 * summary cards and pop-over menu this panel used to open with — those listed
 * the same effects the groups below already showed, so the state of an element
 * was readable in two places that could disagree.
 */
function FieldDesign({ element, onProps }: { element: CanvasElement; onProps: Ctx['onProps'] }) {
    const field = normalizeFieldAppearance(element.fieldAppearance ?? {})!;
    const update = (patch: Partial<FieldAppearance>) => onProps({ fieldAppearance: normalizeFieldAppearance({ ...field, ...patch }) });
    return <More>
        <ShaderColor label="Placeholder colour" value={field.placeholderColor} onChange={placeholderColor => update({ placeholderColor })} />
        <ShaderColor label="Focus / checked colour" value={field.focusColor} onChange={focusColor => update({ focusColor })} />
        <NumberInput label="Disabled opacity" value={field.disabledOpacity} min={0} max={100} suffix="%" onChange={disabledOpacity => update({ disabledOpacity })} />
        {element.type === 'Select' && <>
            <SelectInput label="Select arrow" value={field.arrow} options={[{ label: 'System', value: 'native' }, { label: 'Chevron', value: 'chevron' }, { label: 'None', value: 'none' }]} onChange={arrow => update({ arrow })} />
            {field.arrow === 'chevron' && <><ShaderColor label="Arrow colour" value={field.arrowColor} onChange={arrowColor => update({ arrowColor })} /><NumberInput label="Arrow size" value={field.arrowSize} min={8} max={40} suffix="px" onChange={arrowSize => update({ arrowSize })} /></>}
            <p className="text-[10px] text-ed-faint">The closed field is fully styled here. The system option popup follows the visitor’s browser. Use Layout / Style for padding, typography, background and corners.</p>
        </>}
    </More>;
}

function TextEffectsGroup({ element, onProps }: Ctx) {
    const effect = normalizeTextEffects(element.textEffects ?? {})!;
    const update = (patch: Partial<TextEffects>) => onProps({ textEffects: normalizeTextEffects({ ...effect, ...patch }) });
    return <Group title="Text effects" defaultOpen>
        <SelectInput label="Hover" value={effect.hover} options={[{ label: 'None', value: 'none' }, { label: 'Underline', value: 'underline' }, { label: 'Glow', value: 'glow' }, { label: 'Staggered lift', value: 'lift' }, { label: 'Diagonal roll', value: 'roll' }]} onChange={hover => update({ hover })} />
        <SelectInput label="Scroll" value={effect.scroll} options={[{ label: 'None', value: 'none' }, { label: 'Reveal', value: 'reveal' }, { label: 'Rise', value: 'rise' }, { label: 'Blur reveal', value: 'blur' }]} onChange={scroll => update({ scroll })} />
        {(effect.hover !== 'none' || effect.scroll !== 'none') && <>
            <SelectInput label="Animate" value={effect.split} options={[{ label: 'Whole text', value: 'none' }, { label: 'Words', value: 'words' }, { label: 'Letters', value: 'letters' }]} onChange={split => update({ split })} />
            {effect.hover !== 'none' && <><NumberInput label="Hover duration" value={effect.duration} min={50} max={3000} suffix="ms" onChange={duration => update({ duration })} /><NumberInput label="Hover stagger" value={effect.stagger} min={0} max={200} suffix="ms" onChange={stagger => update({ stagger })} /></>}
            {(effect.hover === 'lift' || effect.hover === 'roll' || effect.scroll === 'rise') && <NumberInput label="Distance" value={effect.distance} min={0} max={100} suffix="px" onChange={distance => update({ distance })} />}
            {effect.hover === 'roll' && <>
                <NumberInput label="Roll angle" value={effect.angle ?? 15} min={-60} max={60} suffix="°" onChange={angle => update({ angle })} />
                <Segmented label="Repeat" value={effect.repeat ? 'loop' : 'once'} options={[{ label: 'Once', value: 'once' }, { label: 'While hovering', value: 'loop' }]} onChange={value => update({ repeat: value === 'loop' })} />
                <p className="text-[10px] leading-relaxed text-ed-faint">The original exits upwards as its copy rolls in from below. Negative angles reverse the diagonal; 0° rolls straight up.</p>
            </>}
            {effect.scroll !== 'none' && <><NumberInput label="Scroll start" value={effect.start} min={0} max={95} suffix="%" onChange={start => update({ start })} /><NumberInput label="Scroll end" value={effect.end} min={effect.start + 1} max={100} suffix="%" onChange={end => update({ end })} /></>}
            <p className="text-[10px] leading-relaxed text-ed-faint">Play effects to test hover. Scroll progress follows the text crossing the viewport and reverses as you scroll back. Unsupported browsers and reduced-motion preferences keep the text readable.</p>
        </>}
    </Group>;
}

function InteractTab(ctx: Ctx) {
    return (
        <div className="flex flex-col">
            <ClickGroup {...ctx} />
            {['Text', 'Heading', 'Button', 'Quote', 'ListItem', 'Label'].includes(ctx.element.type) && <TextEffectsGroup {...ctx} />}
            <HoverGroup {...ctx} />
            <PressGroup {...ctx} />
            <ScrollGroup {...ctx} />
            <EntranceGroup {...ctx} />
            <LoopGroup {...ctx} />
        </div>
    );
}

const CLICK_ACTIONS = [
    { label: "Nothing", value: "none" },
    { label: "Open a link", value: "link" },
    { label: "Scroll to a layer", value: "scroll-to" },
    { label: "Toggle a layer", value: "toggle-layer" },
    { label: "Show a layer", value: "show-layer" },
    { label: "Hide a layer", value: "hide-layer" },
] as const;

type ClickAction = (typeof CLICK_ACTIONS)[number]["value"];

/**
 * One control for what a click does.
 *
 * "Open a link" writes `href`, so the element publishes as a real anchor a
 * visitor can middle-click and a crawler can follow; the layer actions write
 * `interaction`. Before they shared a panel there was a Link field in Content
 * and a Navigate action here, both setting a URL, and only one of them won.
 */
function ClickGroup({ element, style, elements, onProps, onStyle }: Ctx) {
    const interaction = element.interaction;
    const action: ClickAction = interaction?.action === "navigate"
        ? "link"
        : element.href
          ? "link"
          : (interaction?.action ?? "none");
    const targetsLayer = action !== "none" && action !== "link";

    const choose = (next: ClickAction) => {
        if (next === "none") return onProps({ href: "", target: undefined, interaction: undefined });
        if (next === "link")
            return onProps({
                href: "",
                target: undefined,
                interaction: {
                    trigger: "click",
                    action: "navigate",
                    value: interaction?.action === "navigate" ? interaction.value : (element.href ?? ""),
                    target: interaction?.target ?? element.target ?? "_self",
                },
            });
        onProps({
            href: "",
            target: undefined,
            interaction: {
                trigger: "click",
                action: next,
                value: interaction?.action !== "navigate" ? (interaction?.value ?? "") : "",
                target: "_self",
            },
        });
    };

    return (
        <Group title="On click">
            <SelectInput
                label="Does"
                value={action}
                options={[...CLICK_ACTIONS]}
                onChange={choose}
            />

            {action === "link" && (
                <>
                    <TextInput
                        label="URL"
                        value={interaction?.action === "navigate" ? interaction.value : (element.href ?? "")}
                        placeholder="https://… or /s/about"
                        onChange={(value) => onProps({
                            href: "",
                            interaction: { trigger: "click", action: "navigate", value, target: interaction?.target ?? element.target ?? "_self" },
                        })}
                    />
                    <SelectInput
                        label="Opens"
                        value={interaction?.action === "navigate" ? (interaction.target ?? "_self") : (element.target ?? "_self")}
                        options={[
                            { label: "Same tab", value: "_self" as const },
                            { label: "New tab", value: "_blank" as const },
                        ]}
                        onChange={(target) => onProps({
                            target: undefined,
                            interaction: {
                                trigger: "click",
                                action: "navigate",
                                value: interaction?.action === "navigate" ? interaction.value : (element.href ?? ""),
                                target,
                            },
                        })}
                    />
                </>
            )}

            {targetsLayer && (
                <>
                    <SelectInput
                        label="Layer"
                        value={interaction?.value ?? ""}
                        options={[
                            { label: "Choose a layer…", value: "" },
                            ...elements
                                .filter((candidate) => candidate.id !== element.id)
                                .map((candidate) => ({ label: displayName(candidate), value: candidate.id })),
                        ]}
                        onChange={(value) =>
                            onProps({ interaction: { trigger: "click", action, value, target: "_self" } })
                        }
                    />
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Toggle, show and hide are what menus, dropdowns, accordions and
                        overlays are built from. Use Preview to try them.
                    </p>
                </>
            )}

            <More>
                <SelectInput
                    label="Cursor"
                    value={style.cursor}
                    options={[
                        { label: "Automatic", value: "auto" as const },
                        { label: "Pointer", value: "pointer" as const },
                        { label: "Text", value: "text" as const },
                        { label: "Grab", value: "grab" as const },
                        { label: "Zoom in", value: "zoom-in" as const },
                        { label: "Hidden", value: "none" as const },
                    ]}
                    onChange={(cursor) => onStyle({ cursor })}
                />
                <Segmented
                    label="Draggable"
                    value={element.draggable ? "yes" : "no"}
                    options={[
                        { label: "No", value: "no" as const },
                        { label: "Yes", value: "yes" as const },
                    ]}
                    onChange={(value) => onProps({ draggable: value === "yes" || undefined })}
                />
                {element.draggable && (
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Visitors can drag this element freely on Preview and on the
                        published page.
                    </p>
                )}
            </More>
        </Group>
    );
}

/** The style the element takes while the pointer is over it. */
function HoverGroup({ element, style, onProps }: Ctx) {
    const hover = element.hover ?? {};
    const active = Object.keys(hover).length > 0;
    const setHover = (patch: Partial<ElementStyle>) => onProps({ hover: { ...hover, ...patch } });
    const clear = (key: keyof ElementStyle) => {
        const next = { ...hover };
        delete next[key];
        onProps({ hover: Object.keys(next).length > 0 ? next : undefined });
    };

    return (
        <Group
            title="Hover"
            defaultOpen={false}
            action={
                active ? (
                    <button
                        type="button"
                        onClick={() => onProps({ hover: undefined })}
                        className="text-[10px] text-ed-muted transition-colors hover:text-ed-text"
                    >
                        Clear
                    </button>
                ) : null
            }
        >
            {element.parentId && (
                <Segmented
                    label="Triggered by"
                    value={element.hoverTrigger ?? "self"}
                    options={[
                        { label: "This layer", value: "self" as const },
                        { label: "Its parent", value: "parent" as const },
                    ]}
                    onChange={(hoverTrigger) => onProps({ hoverTrigger })}
                />
            )}
            <ColorInput label="Background" value={hover.bg ?? style.bg} onChange={(bg) => setHover({ bg })} />
            <SliderInput
                label="Background opacity"
                min={0}
                max={100}
                suffix="%"
                value={hover.bgOpacity ?? style.bgOpacity}
                onChange={(bgOpacity) => setHover({ bgOpacity })}
            />
            <ColorInput label="Text" value={hover.color ?? style.color} onChange={(color) => setHover({ color })} />
            <SliderInput
                label="Layer opacity"
                min={0}
                max={100}
                suffix="%"
                value={hover.opacity ?? style.opacity}
                onChange={(opacity) => setHover({ opacity })}
            />
            <Segmented
                label="Grow"
                value={hover.scale === undefined ? "off" : "on"}
                options={[
                    { label: "Off", value: "off" as const },
                    { label: "On", value: "on" as const },
                ]}
                onChange={(value) => (value === "off" ? clear("scale") : setHover({ scale: 103 }))}
            />
            {hover.scale !== undefined && (
                <SliderInput
                    label="Scale"
                    min={10}
                    max={150}
                    suffix="%"
                    value={hover.scale}
                    onChange={(scale) => setHover({ scale })}
                />
            )}
            <More>
                <ColorInput label="Border" value={hover.borderC ?? style.borderC} onChange={(borderC) => setHover({ borderC })} />
                <SelectInput
                    label="Shadow"
                    value={hover.shadow ?? style.shadow}
                    options={SHADOW_PRESETS}
                    onChange={(shadow) => setHover({ shadow })}
                />
                <NumberInput
                    label="Corner radius"
                    suffix="px"
                    min={0}
                    value={hover.radius ?? style.radius}
                    onChange={(radius) => setHover({ radius })}
                />
            </More>
            {active && (
                <p className="text-[10px] text-ed-faint">Overriding: {Object.keys(hover).join(", ")}</p>
            )}
        </Group>
    );
}

/** The style the element takes while the pointer is held down on it. */
function PressGroup({ element, style, onProps }: Ctx) {
    const press = element.press;

    return (
        <Group
            title="Press"
            defaultOpen={false}
            action={
                press ? (
                    <button
                        type="button"
                        onClick={() => onProps({ press: undefined })}
                        className="text-[10px] text-ed-muted transition-colors hover:text-red-400"
                    >
                        Clear
                    </button>
                ) : null
            }
        >
            {press ? (
                <>
                    <ColorInput
                        label="Background"
                        value={press.bg ?? style.bg}
                        onChange={(bg) => onProps({ press: { ...press, bg } })}
                    />
                    <SliderInput
                        label="Background opacity"
                        min={0}
                        max={100}
                        suffix="%"
                        value={press.bgOpacity ?? style.bgOpacity}
                        onChange={(bgOpacity) => onProps({ press: { ...press, bgOpacity } })}
                    />
                    <SliderInput
                        label="Scale"
                        min={10}
                        max={150}
                        suffix="%"
                        value={press.scale ?? 96}
                        onChange={(scale) => onProps({ press: { ...press, scale } })}
                    />
                    <SliderInput
                        label="Layer opacity"
                        min={0}
                        max={100}
                        suffix="%"
                        value={press.opacity ?? 92}
                        onChange={(opacity) => onProps({ press: { ...press, opacity } })}
                    />
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => onProps({ press: { scale: 96, opacity: 92 } })}
                    className="rounded-lg border border-dashed border-ed-border py-2 text-[10px] font-medium text-ed-muted transition-colors hover:border-ed-accent/60 hover:text-ed-text"
                >
                    Add a press effect
                </button>
            )}
        </Group>
    );
}

/**
 * Motion tied to the scrollbar rather than to arrival.
 *
 * An entrance plays once and is done; this one's progress is the element's
 * progress across the viewport, so scrolling back up plays it back. Browsers
 * without scroll-driven animations simply show the finished element, which is
 * why the effect can be offered without a JavaScript fallback.
 */
function ScrollGroup(ctx: Ctx) {
    const { style, onStyle } = ctx;
    const ov = makeOverridable(ctx);
    const moves = style.scrollEffect === "rise" || style.scrollEffect === "parallax";

    return (
        <Group title="Scroll" defaultOpen={false}>
            {ov(
                ["scrollEffect"],
                <SelectInput
                    label="Effect"
                    value={style.scrollEffect}
                    options={SCROLL_EFFECTS}
                    onChange={(scrollEffect) => onStyle({ scrollEffect })}
                />,
            )}
            {style.scrollEffect !== "none" && (
                <>
                    {ov(
                        ["scrollAmount"],
                        <SliderInput
                            label={moves ? "Distance" : "Strength"}
                            min={0}
                            max={moves ? 400 : 100}
                            suffix={moves ? "px" : "%"}
                            value={style.scrollAmount}
                            onChange={(scrollAmount) => onStyle({ scrollAmount })}
                        />,
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        {style.entrance === "none"
                            ? "Runs as the layer crosses the viewport, and rewinds when you scroll back. Open Preview to see it."
                            : "Scroll replaces the entrance on this layer — it is tied to the scrollbar, not to arriving."}
                    </p>
                </>
            )}
        </Group>
    );
}

/**
 * The animation played once as the element scrolls into view.
 *
 * The curve editor lives inside this group rather than behind the modal it
 * used to open: a modal that covers the panel hides the effect being tuned.
 */
function EntranceGroup(ctx: Ctx) {
    const { element, style, onStyle } = ctx;
    const ov = makeOverridable(ctx);

    const preview = () => {
        const nodes = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-canvas-element="${element.id}"]`),
        );
        const from: Keyframe =
            style.entrance === "zoom"
                ? { opacity: 0, scale: 0.94 }
                : style.entrance === "left"
                  ? { opacity: 0, translate: "-32px 0" }
                  : style.entrance === "right"
                    ? { opacity: 0, translate: "32px 0" }
                    : style.entrance === "down"
                      ? { opacity: 0, translate: "0 -28px" }
                      : style.entrance === "fade"
                        ? { opacity: 0 }
                        : { opacity: 0, translate: "0 28px" };
        const easing =
            style.entranceCurve === "spring"
                ? `cubic-bezier(.16,${1 + Math.max(0, 45 - style.springDamping) / 100},${Math.max(0.12, Math.min(0.52, 120 / style.springStiffness))},1)`
                : `cubic-bezier(${style.entranceBezier})`;
        const to: Keyframe = { opacity: 1, translate: "none", scale: 1 };
        for (const node of nodes) {
            // A split entrance belongs to the pieces, so preview the pieces:
            // the canvas renders the same spans the published page will.
            const parts = Array.from(node.querySelectorAll<HTMLElement>(".pg-part"));
            const targets = style.entranceSplit !== "none" && parts.length ? parts : [node];
            targets.forEach((target, index) => {
                target.animate([from, to], {
                    duration: style.entranceDuration,
                    delay:
                        style.entranceDelay +
                        (targets.length > 1 ? index * style.entranceStagger : 0),
                    easing,
                    fill: "both",
                });
            });
        }
    };

    return (
        <Group
            title="Entrance"
            defaultOpen={false}
            action={
                style.entrance !== "none" ? (
                    <button
                        type="button"
                        onClick={preview}
                        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text"
                    >
                        <IconPlayerPlay size={11} /> Play
                    </button>
                ) : null
            }
        >
            {ov(
                ["entrance"],
                <SelectInput
                    label="Effect"
                    value={style.entrance}
                    options={ENTRANCES}
                    onChange={(entrance) => onStyle({ entrance })}
                />,
            )}
            {style.entrance !== "none" && (
                <>
                    {ov(
                        ["entranceSplit"],
                        <SelectInput
                            label="Arrive"
                            value={style.entranceSplit}
                            options={ENTRANCE_SPLITS}
                            onChange={(entranceSplit) => onStyle({ entranceSplit })}
                        />,
                    )}
                    {style.entranceSplit !== "none" &&
                        ov(
                            ["entranceStagger"],
                            <SliderInput
                                label="Stagger"
                                min={0}
                                max={400}
                                suffix="ms"
                                value={style.entranceStagger}
                                onChange={(entranceStagger) => onStyle({ entranceStagger })}
                            />,
                        )}
                    {ov(
                        ["entranceDuration"],
                        <SliderInput
                            label="Duration"
                            min={50}
                            max={5000}
                            suffix="ms"
                            value={style.entranceDuration}
                            onChange={(entranceDuration) => onStyle({ entranceDuration })}
                        />,
                    )}
                    {ov(
                        ["entranceDelay"],
                        <SliderInput
                            label="Delay"
                            min={0}
                            max={5000}
                            suffix="ms"
                            value={style.entranceDelay}
                            onChange={(entranceDelay) => onStyle({ entranceDelay })}
                        />,
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        The canvas shows the finished state — use Play, or Preview, to
                        watch it run.
                    </p>

                    <More label="Curve">
                        <Segmented
                            label="Shape"
                            value={style.entranceCurve}
                            options={[
                                { label: "Ease", value: "ease" as const },
                                { label: "Spring", value: "spring" as const },
                            ]}
                            onChange={(entranceCurve) => onStyle({ entranceCurve })}
                        />
                        {style.entranceCurve === "ease" ? (
                            <>
                                <BezierEditor
                                    value={style.entranceBezier}
                                    onChange={(entranceBezier) => onStyle({ entranceBezier })}
                                />
                                <SelectInput
                                    label="Preset"
                                    value="custom"
                                    options={[
                                        { label: "Custom", value: "custom" },
                                        { label: "Ease", value: "0.25, 0.1, 0.25, 1" },
                                        { label: "Ease in", value: "0.42, 0, 1, 1" },
                                        { label: "Ease out", value: "0, 0, 0.58, 1" },
                                        { label: "Ease in out", value: "0.42, 0, 0.58, 1" },
                                        { label: "Snappy", value: "0.2, 0.8, 0.2, 1" },
                                        { label: "Overshoot", value: "0.34, 1.56, 0.64, 1" },
                                    ]}
                                    onChange={(preset) => preset !== "custom" && onStyle({ entranceBezier: preset })}
                                />
                            </>
                        ) : (
                            <>
                                <SliderInput
                                    label="Stiffness"
                                    min={1}
                                    max={1000}
                                    value={style.springStiffness}
                                    onChange={(springStiffness) => onStyle({ springStiffness })}
                                />
                                <SliderInput
                                    label="Damping"
                                    min={1}
                                    max={100}
                                    value={style.springDamping}
                                    onChange={(springDamping) => onStyle({ springDamping })}
                                />
                            </>
                        )}
                    </More>
                </>
            )}
        </Group>
    );
}

/** Motion that runs forever, rather than once on arrival. */
function LoopGroup({ element, onProps }: Ctx) {
    const loop = element.loop;

    return (
        <Group
            title="Loop"
            defaultOpen={false}
            action={
                loop ? (
                    <button
                        type="button"
                        onClick={() => onProps({ loop: undefined })}
                        className="text-[10px] text-ed-muted transition-colors hover:text-red-400"
                    >
                        Clear
                    </button>
                ) : null
            }
        >
            {loop ? (
                <>
                    <SelectInput
                        label="Motion"
                        value={loop.type}
                        options={[
                            { label: "Pulse", value: "pulse" as const },
                            { label: "Float", value: "float" as const },
                            { label: "Spin", value: "spin" as const },
                        ]}
                        onChange={(type) => onProps({ loop: { ...loop, type } })}
                    />
                    <SliderInput
                        label="Duration"
                        min={100}
                        max={10000}
                        suffix="ms"
                        value={loop.duration}
                        onChange={(duration) => onProps({ loop: { ...loop, duration } })}
                    />
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => onProps({ loop: { type: "pulse", duration: 1600 } })}
                    className="rounded-lg border border-dashed border-ed-border py-2 text-[10px] font-medium text-ed-muted transition-colors hover:border-ed-accent/60 hover:text-ed-text"
                >
                    Add a looping motion
                </button>
            )}
        </Group>
    );
}

export function PageInspector({
    rootStyle,
    onChange,
    layoutOptions = [],
}: {
    rootStyle: RootStyle;
    onChange: (patch: Partial<RootStyle>) => void;
    /** Shared components this site can wrap its pages in. */
    layoutOptions?: Array<{ label: string; value: string }>;
}) {
    const providerFonts = usePagieraFonts();
    const customFontOptions = (rootStyle.customFonts ?? []).map((font) => ({
        label: font.name,
        value: `"${font.name}", sans-serif`,
    }));
    const siteFontOptions = fontOptionsFor(rootStyle, providerFonts);
    return (
        <div className="flex flex-col">
            <p className="pb-3 text-[10px] leading-relaxed text-ed-muted">
                Global canvas, typography and layout settings for every breakpoint.
            </p>

            <Group title="Canvas">
                <Segmented
                    label="Width"
                    value={rootStyle.fullWidth ? "full" : "contained"}
                    options={[
                        { label: "Contained", value: "contained" },
                        { label: "Full bleed", value: "full" },
                    ]}
                    onChange={(mode) => onChange({ fullWidth: mode === "full" })}
                />
                {!rootStyle.fullWidth && (
                    <NumberInput
                        label="Max width"
                        suffix="px"
                        min={320}
                        max={4000}
                        value={rootStyle.maxWidth}
                        onChange={(maxWidth) => onChange({ maxWidth })}
                    />
                )}
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    {rootStyle.fullWidth
                        ? "Content runs edge to edge on every screen."
                        : `Wider screens show the page background beside the ${rootStyle.maxWidth}px content.`}
                </p>
                <ColorInput
                    label="Background"
                    value={rootStyle.bg}
                    onChange={(bg) => onChange({ bg })}
                />
            </Group>

            {/*
              * The site's layout: what wraps every page.
              *
              * A navbar is one design, not one per page, so it is named here
              * once and drawn on every page that does not opt out. It is made
              * of a shared component, which is where it is edited — change it
              * there and every page follows.
              */}
            <Group title="Layout">
                <SelectInput
                    label="Header"
                    value={rootStyle.siteHeaderId ?? ""}
                    options={[{ label: "None", value: "" }, ...layoutOptions]}
                    onChange={(siteHeaderId) => onChange({ siteHeaderId })}
                />
                <SelectInput
                    label="Footer"
                    value={rootStyle.siteFooterId ?? ""}
                    options={[{ label: "None", value: "" }, ...layoutOptions]}
                    onChange={(siteFooterId) => onChange({ siteFooterId })}
                />
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    {layoutOptions.length === 0
                        ? "Make a shared asset out of a navbar or a footer first — anything in Assets can be used here."
                        : "Drawn on every page of the site. Edit it in the asset it is made of and every page follows."}
                </p>
                {(rootStyle.siteHeaderId || rootStyle.siteFooterId) && (
                    <>
                        <Segmented
                            label="On this page"
                            value={rootStyle.useSiteHeader === false ? "hidden" : "shown"}
                            options={[
                                { label: "Header", value: "shown" },
                                { label: "No header", value: "hidden" },
                            ]}
                            onChange={(mode) => onChange({ useSiteHeader: mode === "hidden" ? false : undefined })}
                        />
                        <Segmented
                            label=""
                            value={rootStyle.useSiteFooter === false ? "hidden" : "shown"}
                            options={[
                                { label: "Footer", value: "shown" },
                                { label: "No footer", value: "hidden" },
                            ]}
                            onChange={(mode) => onChange({ useSiteFooter: mode === "hidden" ? false : undefined })}
                        />
                        <p className="text-[10px] leading-relaxed text-ed-faint">
                            This page only — for a landing page that wants nothing around it.
                        </p>
                    </>
                )}
            </Group>

            <Group title="Typography">
                <SelectInput
                    label="Site font"
                    value={rootStyle.fontFamily}
                    options={siteFontOptions}
                    onChange={(fontFamily) => onChange({
                        fontFamily,
                        customFonts: customFontOptions.some((font) => font.value === fontFamily)
                            ? rootStyle.customFonts
                            : [],
                    })}
                />
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    Applied to the whole site. Individual layers inherit this font automatically.
                </p>
            </Group>

            <Group title="Page transitions">
                <SelectInput
                    label="Style"
                    value={rootStyle.pageTransition ?? "smooth"}
                    options={[
                        { label: "Smooth", value: "smooth" },
                        { label: "Fade", value: "fade" },
                        { label: "Slide", value: "slide" },
                        { label: "Instant", value: "none" },
                    ]}
                    onChange={(pageTransition) => onChange({ pageTransition })}
                />
                {(rootStyle.pageTransition ?? "smooth") !== "none" && (
                    <SliderInput
                        label="Duration"
                        suffix="ms"
                        min={120}
                        max={1200}
                        step={20}
                        value={rootStyle.pageTransitionDuration ?? 380}
                        onChange={(pageTransitionDuration) => onChange({ pageTransitionDuration })}
                    />
                )}
                <p className="text-[10px] leading-relaxed text-ed-faint">
                    Used for navigation between every published page. Reduced-motion preferences are always respected.
                </p>
            </Group>

            <Group title="Custom code" defaultOpen={false}>
                <CodeInput
                    label="CSS"
                    value={rootStyle.customCss ?? ""}
                    onChange={(customCss) => onChange({ customCss })}
                    placeholder={".pg-root h1 {\n  letter-spacing: -0.04em;\n}"}
                    hint="Appended after the generated stylesheet, so these rules win at equal specificity. @import is stripped."
                />
                <CodeInput
                    label="JavaScript"
                    value={rootStyle.customJs ?? ""}
                    onChange={(customJs) => onChange({ customJs })}
                    placeholder={"document.querySelectorAll('.pg-node')"}
                    hint="Runs on the published page only — never in the editor or the preview, so a mistake here cannot break the canvas. Publish to test it."
                />
            </Group>

            <Group title="Layout" defaultOpen={false}>
                <Segmented
                    label="Mode"
                    value={rootStyle.layout}
                    options={[
                        { label: "Stack", value: "stack" as LayoutMode },
                        { label: "Free", value: "absolute" as LayoutMode },
                    ]}
                    onChange={(layout) => onChange({ layout })}
                />
                {rootStyle.layout === "stack" && (
                    <>
                        <Segmented
                            label="Flow"
                            value={rootStyle.direction}
                            options={[
                                {
                                    label: "Row",
                                    value: "row" as Direction,
                                    icon: <IconArrowsHorizontal size={12} />,
                                },
                                {
                                    label: "Column",
                                    value: "column" as Direction,
                                    icon: <IconArrowsVertical size={12} />,
                                },
                            ]}
                            onChange={(direction) => onChange({ direction })}
                        />
                        <NumberInput
                            label="Gap"
                            suffix="px"
                            min={0}
                            value={rootStyle.gap}
                            onChange={(gap) => onChange({ gap })}
                        />
                        <Segmented
                            label="Align"
                            value={rootStyle.align}
                            options={[
                                { label: "Start", value: "start" as Align },
                                { label: "Center", value: "center" as Align },
                                { label: "End", value: "end" as Align },
                                { label: "Stretch", value: "stretch" as Align },
                            ]}
                            onChange={(align) => onChange({ align })}
                        />
                    </>
                )}
            </Group>

            <Group title="Spacing" defaultOpen={false}>
                <NumberInput
                    label="Top"
                    suffix="px"
                    min={0}
                    value={rootStyle.padT}
                    onChange={(padT) => onChange({ padT })}
                />
                <NumberInput
                    label="Right"
                    suffix="px"
                    min={0}
                    value={rootStyle.padR}
                    onChange={(padR) => onChange({ padR })}
                />
                <NumberInput
                    label="Bottom"
                    suffix="px"
                    min={0}
                    value={rootStyle.padB}
                    onChange={(padB) => onChange({ padB })}
                />
                <NumberInput
                    label="Left"
                    suffix="px"
                    min={0}
                    value={rootStyle.padL}
                    onChange={(padL) => onChange({ padL })}
                />            </Group>
        </div>
    );
}

/* --------------------------------------------------------- multi-selection */

export type AlignChoice =
    | "left"
    | "center-x"
    | "right"
    | "top"
    | "center-y"
    | "bottom";

const ALIGN_LABELS: Record<AlignChoice, string> = {
    left: "Align left",
    "center-x": "Align centre",
    right: "Align right",
    top: "Align top",
    "center-y": "Align middle",
    bottom: "Align bottom",
};

export function MultiSelectPanel({
    count,
    canArrange,
    onAlign,
    onDistribute,
}: {
    count: number;
    canArrange: boolean;
    onAlign: (action: AlignChoice) => void;
    onDistribute: (action: "horizontal" | "vertical") => void;
}) {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-[10px] leading-relaxed text-ed-muted">
                {count} elements selected.
                {!canArrange &&
                    " Alignment needs siblings inside a freely positioned parent."}
            </p>

            <Group title="Align">
                <div className="grid grid-cols-3 gap-1">
                    {(
                        [
                            ["left", <IconAlignBoxLeftMiddle key="l" size={14} />],
                            ["center-x", <IconAlignBoxCenterMiddle key="c" size={14} />],
                            ["right", <IconAlignBoxRightMiddle key="r" size={14} />],
                            ["top", <IconLayoutAlignTop key="t" size={14} />],
                            ["center-y", <IconAlignBoxCenterMiddle key="m" size={14} />],
                            ["bottom", <IconLayoutAlignBottom key="b" size={14} />],
                        ] as Array<[AlignChoice, React.ReactNode]>
                    ).map(([action, icon]) => (
                        <button
                            type="button"
                            key={action}
                            title={ALIGN_LABELS[action]}
                            aria-label={ALIGN_LABELS[action]}
                            disabled={!canArrange}
                            onClick={() => onAlign(action)}
                            className="flex items-center justify-center rounded bg-ed-field p-2 text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </Group>

            <Group title="Distribute">
                <div className="grid grid-cols-2 gap-1">
                    <button
                        type="button"
                        disabled={!canArrange || count < 3}
                        onClick={() => onDistribute("horizontal")}
                        className="flex items-center justify-center gap-1.5 rounded bg-ed-field p-2 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                    >
                        <IconArrowsHorizontal size={13} /> Horizontal
                    </button>
                    <button
                        type="button"
                        disabled={!canArrange || count < 3}
                        onClick={() => onDistribute("vertical")}
                        className="flex items-center justify-center gap-1.5 rounded bg-ed-field p-2 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                    >
                        <IconArrowsVertical size={13} /> Vertical
                    </button>
                </div>
            </Group>
        </div>
    );
}
