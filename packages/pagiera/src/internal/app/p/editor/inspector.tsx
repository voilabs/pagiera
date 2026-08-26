"use client";

import {
    IconAlignBoxCenterMiddle,
    IconAlignBoxLeftMiddle,
    IconAlignBoxRightMiddle,
    IconArrowsHorizontal,
    IconArrowsVertical,
    IconLayoutAlignBottom,
    IconLayoutAlignTop,
    IconChevronRight,
    IconPlus,
    IconPlayerPlay,
    IconTrash,
    IconUpload,
    IconX,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { usePagieraFonts } from "pagiera/provider";
import { ICON_CATALOG } from "@/lib/editor/icon";
import { hasOverride, resolveStyle } from "@/lib/editor/style";
import { displayName } from "@/lib/editor/tree";
import {
    type Align,
    ASPECT_RATIOS,
    type BgSize,
    type BlendMode,
    type Breakpoint,
    type CanvasElement,
    type Constraint,
    type DataSource,
    type Direction,
    type ElementStyle,
    ENTRANCES,
    FONT_STACKS,
    isContainer,
    isTextual,
    type Justify,
    type LayoutMode,
    type PinSide,
    type PositionMode,
    type RootStyle,
    SHADOW_PRESETS,
    type StyleKey,
    type TextAlign,
    type TextTransform,
} from "@/lib/editor/types";
import {
    CodeInput,
    ColorInput,
    Group,
    More,
    NumberInput,
    Overridable,
    Segmented,
    SelectInput,
    SizeField,
    SliderInput,
    TextArea,
    TextInput,
} from "./fields";

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
};

type Wrap = (keys: StyleKey[], node: React.ReactNode) => React.ReactNode;

const INLINE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

function ImageUpload({ src, onChange }: { src?: string; onChange: (src: string) => void }) {
    const [error, setError] = useState("");
    const uploaded = src?.startsWith("data:image/") ?? false;

    const choose = (file?: File) => {
        setError("");
        if (!file) return;
        if (!INLINE_IMAGE_TYPES.has(file.type)) {
            setError("Use PNG, JPG, WebP, GIF or AVIF. SVG is not accepted for inline uploads.");
            return;
        }
        if (file.size > MAX_INLINE_IMAGE_BYTES) {
            setError("The image must be 2 MB or smaller.");
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => setError("Could not read the image.");
        reader.onload = () => {
            if (typeof reader.result === "string") onChange(reader.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-ed-border bg-ed-field px-3 py-3 text-[10px] font-medium text-ed-muted transition-colors hover:border-ed-accent/60 hover:text-ed-text">
                <IconUpload size={14} /> {uploaded ? "Replace uploaded image" : "Upload image as base64"}
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => {
                        choose(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
            </label>
            {uploaded && (
                <div className="flex items-center justify-between rounded-lg bg-ed-subtle px-2.5 py-2 text-[9px] text-ed-faint">
                    <span>Stored inside the page JSON</span>
                    <button type="button" onClick={() => onChange("")} className="text-ed-muted hover:text-red-400">Remove</button>
                </div>
            )}
            {error && <p className="rounded-lg bg-red-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-red-300">{error}</p>}
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

export function Inspector({
    tab,
    ...ctx
}: Ctx & { tab: "Design" | "Content" | "Hover" | "Interact" }) {
    if (tab === "Content") return <ContentTab {...ctx} />;
    if (tab === "Hover") return <HoverTab {...ctx} />;
    if (tab === "Interact") return <InteractionTab {...ctx} />;
    return <DesignTab {...ctx} />;
}

function InteractionTab({ element, elements, onProps }: Ctx) {
    const interaction = element.interaction;
    const action = interaction?.action ?? "navigate";
    return (
        <div className="flex flex-col gap-4">
            <p className="text-[10px] leading-relaxed text-ed-muted">Create navigation or control another layer. Toggle/show/hide powers menus, dropdowns, accordions and overlays.</p>
            <Group title="On click">
                <SelectInput label="Action" value={action} options={[{ label: "Navigate", value: "navigate" as const }, { label: "Scroll to layer", value: "scroll-to" as const }, { label: "Toggle layer", value: "toggle-layer" as const }, { label: "Show layer", value: "show-layer" as const }, { label: "Hide layer", value: "hide-layer" as const }]} onChange={(nextAction) => onProps({ interaction: { trigger: "click", action: nextAction, value: interaction?.value ?? "", target: interaction?.target ?? "_self" } })} />
                {action === "navigate" ? <TextInput label="URL" value={interaction?.value ?? ""} placeholder="https://… or /s/about" onChange={(value) => onProps({ interaction: { trigger: "click", action, value, target: interaction?.target ?? "_self" } })} /> : <SelectInput label="Target layer" value={interaction?.value ?? ""} options={[{ label: "Choose a layer…", value: "" }, ...elements.filter((candidate) => candidate.id !== element.id).map((candidate) => ({ label: candidate.name || candidate.type, value: candidate.id }))]} onChange={(value) => onProps({ interaction: { trigger: "click", action, value, target: "_self" } })} />}
                {action === "navigate" && <SelectInput label="Opens" value={interaction?.target ?? "_self"} options={[{ label: "Same tab", value: "_self" as const }, { label: "New tab", value: "_blank" as const }]} onChange={(target) => onProps({ interaction: { trigger: "click", action, value: interaction?.value ?? "", target } })} />}
                {interaction && <button type="button" onClick={() => onProps({ interaction: undefined })} className="self-start rounded-md px-2 py-1 text-[10px] text-ed-faint hover:bg-ed-field hover:text-red-400">Remove interaction</button>}
            </Group>
        </div>
    );
}

/* ------------------------------------------------------------------- design */

function DesignTab(ctx: Ctx) {
    const { element } = ctx;
    const ov = makeOverridable(ctx);
    const textual = isTextual(element.type);

    return (
        <div className="flex flex-col divide-y divide-ed-border">
            <SizeGroup ctx={ctx} ov={ov} />
            {isContainer(element.type) && <LayoutGroup ctx={ctx} ov={ov} />}
            {/* The group most likely to be edited for this element opens first. */}
            {textual && <TypographyGroup ctx={ctx} ov={ov} />}
            {element.type === "Icon" && <IconAppearanceGroup ctx={ctx} ov={ov} />}
            <FillGroup ctx={ctx} ov={ov} defaultOpen={!textual} />
            <SpacingGroup ctx={ctx} ov={ov} />
            <EffectsGroup ctx={ctx} ov={ov} />
            <CompositionGroup ctx={ctx} ov={ov} />
            <MotionGroup ctx={ctx} ov={ov} />
        </div>
    );
}

function IconAppearanceGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;
    return (
        <Group title="Icon">
            {ov(
                ["color"],
                <ColorInput
                    label="Colour"
                    value={style.color}
                    onChange={(color) => onStyle({ color })}
                />,
            )}
        </Group>
    );
}

function SizeGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, parentLayout, onStyle, onCommitStart, onCommitEnd } = ctx;

    return (
        <Group title="Size">
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

            {/* x/y only mean anything when the parent positions absolutely. */}
            {parentLayout === "absolute" && (
                <More label="Position">
                    {ov(
                        ["x"],
                        <NumberInput
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
                            label="Y"
                            suffix="px"
                            value={style.y}
                            onChange={(y) => onStyle({ y })}
                            onCommitStart={onCommitStart}
                            onCommitEnd={onCommitEnd}
                        />,
                    )}
                    {ov(
                        ["constraintX"],
                        <SelectInput
                            label="Horizontal"
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
                    {ov(
                        ["constraintY"],
                        <SelectInput
                            label="Vertical"
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
                </More>
            )}
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

function SpacingGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;
    const uniform =
        style.padT === style.padR &&
        style.padR === style.padB &&
        style.padB === style.padL;

    return (
        <Group title="Spacing" defaultOpen={false}>
            {ov(
                ["padT", "padR", "padB", "padL"],
                <NumberInput
                    label={uniform ? "Padding" : "Padding (mixed)"}
                    suffix="px"
                    min={0}
                    value={style.padT}
                    onChange={(value) =>
                        onStyle({ padT: value, padR: value, padB: value, padL: value })
                    }
                />,
            )}
            {ov(
                ["marginB"],
                <NumberInput
                    label="Space after"
                    suffix="px"
                    min={0}
                    value={style.marginB}
                    onChange={(marginB) => onStyle({ marginB })}
                />,
            )}
            <p className="text-[10px] leading-relaxed text-ed-faint">
                Padding is the room inside this layer; space after is the distance to the next one.
            </p>
            <More label="Per side">
                    {ov(
                        ["padT"],
                        <NumberInput
                            label="Top"
                            suffix="px"
                            min={0}
                            value={style.padT}
                            onChange={(padT) => onStyle({ padT })}
                        />,
                    )}
                    {ov(
                        ["padR"],
                        <NumberInput
                            label="Right"
                            suffix="px"
                            min={0}
                            value={style.padR}
                            onChange={(padR) => onStyle({ padR })}
                        />,
                    )}
                    {ov(
                        ["padB"],
                        <NumberInput
                            label="Bottom"
                            suffix="px"
                            min={0}
                            value={style.padB}
                            onChange={(padB) => onStyle({ padB })}
                        />,
                    )}
                    {ov(
                        ["padL"],
                        <NumberInput
                            label="Left"
                            suffix="px"
                            min={0}
                            value={style.padL}
                            onChange={(padL) => onStyle({ padL })}
                        />,
                    )}
            </More>
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

    return (
        <Group title="Fill" defaultOpen={defaultOpen}>
            {ov(
                ["bg"],
                <ColorInput
                    label="Background"
                    value={style.bg}
                    placeholder="transparent"
                    onChange={(bg) => onStyle({ bg })}
                />,
            )}
            <More label="Gradient">
                <div className="flex gap-1">
                    {GRADIENT_PRESETS.map((preset) => (
                        <button
                            type="button"
                            key={preset}
                            aria-label="Apply gradient preset"
                            onClick={() => onStyle({ gradient: preset })}
                            className="h-5 flex-1 rounded border border-ed-border"
                            style={{ backgroundImage: preset }}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => onStyle({ gradient: "" })}
                        className="h-5 flex-1 rounded border border-ed-border text-[9px] text-ed-muted hover:text-ed-text"
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

function TypographyGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;

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
                <NumberInput
                    label="Size"
                    suffix="px"
                    min={1}
                    value={style.fontSize}
                    onChange={(fontSize) => onStyle({ fontSize })}
                />,
            )}
            {ov(
                ["lineHeight"],
                <NumberInput
                    label="Line height"
                    min={0.5}
                    max={10}
                    step={0.05}
                    value={style.lineHeight}
                    onChange={(lineHeight) => onStyle({ lineHeight })}
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
                        { label: "Justify", value: "justify" as TextAlign },
                    ]}
                    onChange={(textAlign) => onStyle({ textAlign })}
                />,
            )}

            <More>
                {ov(
                    ["fontFamily"],
                    <SelectInput
                        label="Font"
                        value={style.fontFamily}
                        options={FONT_STACKS}
                        onChange={(fontFamily) => onStyle({ fontFamily })}
                    />,
                )}
                {ov(
                    ["letterSpacing"],
                    <NumberInput
                        label="Tracking"
                        suffix="px"
                        step={0.1}
                        value={style.letterSpacing}
                        onChange={(letterSpacing) => onStyle({ letterSpacing })}
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

function EffectsGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle, onCommitStart, onCommitEnd } = ctx;
    const knownShadow = SHADOW_PRESETS.some((p) => p.value === style.shadow);
    const separateBorders = [style.borderT, style.borderR, style.borderB, style.borderL].some((value) => value !== null);
    const hasBorder = [style.borderT, style.borderR, style.borderB, style.borderL]
        .map((value) => value ?? style.borderW)
        .some((value) => value > 0);

    return (
        <Group title="Effects" defaultOpen={false}>
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
            {ov(
                ["opacity"],
                <SliderInput
                    label="Opacity"
                    min={0}
                    max={100}
                    suffix="%"
                    value={style.opacity}
                    onChange={(opacity) => onStyle({ opacity })}
                    onCommitStart={onCommitStart}
                    onCommitEnd={onCommitEnd}
                />,
            )}

            <More label="Border and rotation">
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
                        {ov(["borderT"], <NumberInput label="Top" suffix="px" min={0} value={style.borderT ?? style.borderW} onChange={(borderT) => onStyle({ borderT })} />)}
                        {ov(["borderR"], <NumberInput label="Right" suffix="px" min={0} value={style.borderR ?? style.borderW} onChange={(borderR) => onStyle({ borderR })} />)}
                        {ov(["borderB"], <NumberInput label="Bottom" suffix="px" min={0} value={style.borderB ?? style.borderW} onChange={(borderB) => onStyle({ borderB })} />)}
                        {ov(["borderL"], <NumberInput label="Left" suffix="px" min={0} value={style.borderL ?? style.borderW} onChange={(borderL) => onStyle({ borderL })} />)}
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
        <Group title="Composition" defaultOpen={false}>
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
            {ov(
                ["position"],
                <Segmented
                    label="Pin"
                    value={style.position}
                    options={[
                        { label: "Off", value: "static" as PositionMode },
                        { label: "Sticky", value: "sticky" as PositionMode },
                        { label: "Fixed", value: "fixed" as PositionMode },
                        { label: "Free", value: "absolute" as PositionMode },
                    ]}
                    onChange={(position) => onStyle({ position })}
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
function MotionGroup({ ctx, ov }: { ctx: Ctx; ov: Wrap }) {
    const { style, onStyle } = ctx;

    return (
        <Group title="Motion" defaultOpen={false}>
            {ov(
                ["entrance"],
                <SelectInput
                    label="Entrance"
                    value={style.entrance}
                    options={ENTRANCES}
                    onChange={(entrance) => onStyle({ entrance })}
                />,
            )}
            {style.entrance !== "none" && (
                <>
                    {ov(
                        ["entranceDuration"],
                        <NumberInput
                            label="Duration"
                            suffix="ms"
                            min={50}
                            max={5000}
                            step={50}
                            value={style.entranceDuration}
                            onChange={(entranceDuration) => onStyle({ entranceDuration })}
                        />,
                    )}
                    {ov(
                        ["entranceDelay"],
                        <NumberInput
                            label="Delay"
                            suffix="ms"
                            min={0}
                            max={5000}
                            step={50}
                            value={style.entranceDelay}
                            onChange={(entranceDelay) => onStyle({ entranceDelay })}
                        />,
                    )}
                    <p className="text-[10px] leading-relaxed text-ed-faint">
                        Plays once as the element scrolls into view. The canvas shows
                        the finished state — use Preview to watch it.
                    </p>
                </>
            )}
        </Group>
    );
}

/* ------------------------------------------------------------------ content */

function ContentTab({ element, onProps, sources, bindingKeys, insideRepeat }: Ctx) {
    return (
        <div className="flex flex-col divide-y divide-ed-border">
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

            {!insideRepeat && element.type !== "Repeat" && element.type !== "Request" && (
                <Group title="Request result">
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
                <Group title="Bound field">
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

            {(element.type === "Input" || element.type === "Textarea") && (
                <Group title="Field">
                    {element.type === "Input" && (
                        <SelectInput
                            label="Type"
                            value={element.inputType ?? "text"}
                            options={[
                                { label: "Text", value: "text" as const },
                                { label: "Email", value: "email" as const },
                                { label: "Password", value: "password" as const },
                                { label: "Number", value: "number" as const },
                                { label: "Telephone", value: "tel" as const },
                                { label: "URL", value: "url" as const },
                                { label: "Search", value: "search" as const },
                            ]}
                            onChange={(inputType) => onProps({ inputType })}
                        />
                    )}
                    <TextInput label="Name" value={element.fieldName ?? ""} placeholder="email" onChange={(fieldName) => onProps({ fieldName })} />
                    <TextInput label="Placeholder" value={element.placeholder ?? ""} placeholder="Enter a value…" onChange={(placeholder) => onProps({ placeholder })} />
                    <Segmented
                        label="Required"
                        value={element.required ? "yes" : "no"}
                        options={[{ label: "No", value: "no" as const }, { label: "Yes", value: "yes" as const }]}
                        onChange={(value) => onProps({ required: value === "yes" })}
                    />
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
                    <ImageUpload src={element.src} onChange={(src) => onProps({ src })} />
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

            {element.type === "Icon" && (
                <Group title="Icon">
                    <SelectInput
                        label="Glyph"
                        value={element.iconName ?? "star"}
                        options={ICON_CATALOG.map((icon) => ({
                            label: `${icon.category} · ${icon.name}`,
                            value: icon.value,
                        }))}
                        onChange={(iconName) => onProps({ iconName })}
                    />
                </Group>
            )}

            <Group title="Link" defaultOpen={false}>
                <TextInput
                    label="URL"
                    value={element.href ?? ""}
                    placeholder="https://… or /s/about"
                    onChange={(href) => onProps({ href })}
                />
                <SelectInput
                    label="Opens"
                    value={element.target ?? "_self"}
                    options={[
                        { label: "Same tab", value: "_self" as const },
                        { label: "New tab", value: "_blank" as const },
                    ]}
                    onChange={(target) => onProps({ target })}
                />
            </Group>

            <Group title="Layer name" defaultOpen={false}>
                <TextInput
                    label="Name"
                    value={element.name ?? ""}
                    placeholder={element.type}
                    onChange={(name) => onProps({ name })}
                />
            </Group>
        </div>
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

function HoverTab({ element, style, onProps, onStyle }: Ctx) {
    const hover = element.hover ?? {};
    const active = Object.keys(hover).length > 0;
    const [addOpen, setAddOpen] = useState(false);
    const [transitionOpen, setTransitionOpen] = useState(false);
    const setHover = (patch: Partial<ElementStyle>) =>
        onProps({ hover: { ...hover, ...patch } });
    const clearHoverProperty = (key: keyof ElementStyle) => {
        const next = { ...hover };
        delete next[key];
        onProps({ hover: Object.keys(next).length > 0 ? next : undefined });
    };
    const addEffect = (name: string) => {
        setAddOpen(false);
        if (name === "Appear") setTransitionOpen(true);
        if (name === "Hover") onProps({ hover: { ...hover, scale: hover.scale ?? 103 } });
        if (name === "Press") onProps({ press: { ...(element.press ?? {}), scale: element.press?.scale ?? 96, opacity: element.press?.opacity ?? 92 } });
        if (name === "Loop") onProps({ loop: element.loop ?? { type: "pulse", duration: 1600 } });
        if (name === "Drag") onProps({ draggable: true });
        if (name === "Scroll") { onStyle({ entrance: style.entrance === "none" ? "up" : style.entrance }); setTransitionOpen(true); }
    };
    const previewEntrance = () => {
        const frames = Array.from(document.querySelectorAll<HTMLElement>(`[data-canvas-element="${element.id}"]`));
        const from: Keyframe = style.entrance === "zoom" ? { opacity: 0, scale: 0.94 } : style.entrance === "left" ? { opacity: 0, translate: "-32px 0" } : style.entrance === "right" ? { opacity: 0, translate: "32px 0" } : style.entrance === "down" ? { opacity: 0, translate: "0 -28px" } : style.entrance === "fade" ? { opacity: 0 } : { opacity: 0, translate: "0 28px" };
        const easing = style.entranceCurve === "spring" ? `cubic-bezier(.16,${1 + Math.max(0, 45 - style.springDamping) / 100},${Math.max(0.12, Math.min(0.52, 120 / style.springStiffness))},1)` : `cubic-bezier(${style.entranceBezier})`;
        for (const frame of frames) frame.animate([from, { opacity: 1, translate: "none", scale: 1 }], { duration: style.entranceDuration, delay: style.entranceDelay, easing, fill: "both" });
    };

    return (
        <div className="relative flex flex-col gap-3">
            <div className="relative rounded-xl border border-ed-border bg-ed-subtle">
                <div className="flex items-center justify-between border-b border-ed-border px-3 py-2.5"><span className="text-[11px] font-semibold text-ed-text">Effects</span><button type="button" onClick={() => setAddOpen((value) => !value)} className="rounded-md p-1 text-ed-muted hover:bg-ed-field hover:text-ed-text"><IconPlus size={14} /></button></div>
                <button type="button" onClick={() => setTransitionOpen(true)} className="flex w-full items-center justify-between border-b border-ed-border px-3 py-2.5 text-left"><span><span className="block text-[10px] font-medium text-ed-text">Appear</span><span className="mt-0.5 block text-[9px] text-ed-faint">{style.entrance === "none" ? "None" : `${style.entrance} · ${style.entranceDuration / 1000}s`}</span></span><IconChevronRight size={13} className="text-ed-faint" /></button>
                <div className="flex items-center justify-between px-3 py-2.5"><span><span className="block text-[10px] font-medium text-ed-text">Hover</span><span className="mt-0.5 block text-[9px] text-ed-faint">{active ? `${Object.keys(hover).length} properties` : "Not configured"}</span></span><span className={`size-1.5 rounded-full ${active ? "bg-ed-accent" : "bg-ed-border"}`} /></div>
                {addOpen && <div className="absolute right-2 top-10 z-30 w-36 rounded-xl border border-ed-border bg-ed-surface p-1.5 shadow-2xl">{["Appear", "Hover", "Press", "Loop", "Drag", "Scroll"].map((name) => <button key={name} type="button" onClick={() => addEffect(name)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-medium text-ed-muted hover:bg-ed-field hover:text-ed-text"><span>{name}</span>{name === "Scroll" && <IconChevronRight size={12} />}</button>)}</div>}
            </div>
            <div className="rounded-xl border border-ed-border bg-ed-subtle"><div className="flex items-center justify-between border-b border-ed-border px-3 py-2.5"><span className="text-[10px] font-medium text-ed-text">Overlays</span><IconPlus size={13} className="text-ed-faint" /></div><div className="border-b border-ed-border px-3 py-2.5"><SelectInput label="Cursor" value={style.cursor} options={[{ label: "Automatic", value: "auto" as const }, { label: "Pointer", value: "pointer" as const }, { label: "Text", value: "text" as const }, { label: "Grab", value: "grab" as const }, { label: "Zoom in", value: "zoom-in" as const }, { label: "Hidden", value: "none" as const }]} onChange={(cursor) => onStyle({ cursor })} /></div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-[10px] font-medium text-ed-text">Styles</span><IconPlus size={13} className="text-ed-faint" /></div></div>

            <Group
                title="Hover state"
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
                        label="Trigger"
                        value={element.hoverTrigger ?? "self"}
                        options={[
                            { label: "Self", value: "self" as const },
                            { label: "Parent", value: "parent" as const },
                        ]}
                        onChange={(hoverTrigger) => onProps({ hoverTrigger })}
                    />
                )}
                <ColorInput
                    label="Background"
                    value={hover.bg ?? style.bg}
                    onChange={(bg) => setHover({ bg })}
                />
                <ColorInput
                    label="Text"
                    value={hover.color ?? style.color}
                    onChange={(color) => setHover({ color })}
                />
                <SliderInput
                    label="Opacity"
                    min={0}
                    max={100}
                    suffix="%"
                    value={hover.opacity ?? style.opacity}
                    onChange={(opacity) => setHover({ opacity })}
                />
                <Segmented
                    label="Scale effect"
                    value={hover.scale === undefined ? "off" : "on"}
                    options={[
                        { label: "Off", value: "off" as const },
                        { label: "On", value: "on" as const },
                    ]}
                    onChange={(value) => value === "off" ? clearHoverProperty("scale") : setHover({ scale: 103 })}
                />
                {hover.scale !== undefined && (
                    <SliderInput
                        label="Hover scale"
                        min={10}
                        max={150}
                        suffix="%"
                        value={hover.scale}
                        onChange={(scale) => setHover({ scale })}
                    />
                )}
                <More>
                    <ColorInput
                        label="Border"
                        value={hover.borderC ?? style.borderC}
                        onChange={(borderC) => setHover({ borderC })}
                    />
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
            </Group>

            {element.press && <Group title="Press state" action={<button type="button" onClick={() => onProps({ press: undefined })} className="text-[10px] text-ed-muted hover:text-red-400">Remove</button>}><SliderInput label="Scale" min={10} max={150} suffix="%" value={element.press.scale ?? 96} onChange={(scale) => onProps({ press: { ...element.press, scale } })} /><SliderInput label="Opacity" min={0} max={100} suffix="%" value={element.press.opacity ?? 92} onChange={(opacity) => onProps({ press: { ...element.press, opacity } })} /></Group>}
            {element.loop && <Group title="Loop" action={<button type="button" onClick={() => onProps({ loop: undefined })} className="text-[10px] text-ed-muted hover:text-red-400">Remove</button>}><SelectInput label="Motion" value={element.loop.type} options={[{ label: "Pulse", value: "pulse" as const }, { label: "Float", value: "float" as const }, { label: "Spin", value: "spin" as const }]} onChange={(type) => onProps({ loop: { ...element.loop!, type } })} /><SliderInput label="Duration" min={100} max={10000} suffix="ms" value={element.loop.duration} onChange={(duration) => onProps({ loop: { ...element.loop!, duration } })} /></Group>}
            {element.draggable && <Group title="Drag" action={<button type="button" onClick={() => onProps({ draggable: undefined })} className="text-[10px] text-ed-muted hover:text-red-400">Remove</button>}><p className="text-[10px] leading-relaxed text-ed-muted">Visitors can drag this element freely on Preview and the published page.</p></Group>}

            {active && (
                <p className="text-[10px] text-ed-faint">
                    Overriding: {Object.keys(hover).join(", ")}
                </p>
            )}
            {transitionOpen && <div className="absolute inset-x-0 top-0 z-40 max-h-[calc(100vh-150px)] overflow-y-auto rounded-2xl border border-ed-border bg-[#151515] p-3 shadow-2xl"><div className="mb-3 flex items-center justify-between"><button type="button" onClick={previewEntrance} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-white/10"><IconPlayerPlay size={12} /> Preview</button><span className="text-[11px] font-semibold text-white">Transition</span><button type="button" onClick={() => setTransitionOpen(false)} className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-white"><IconX size={13} /></button></div><div className="mb-3 grid grid-cols-2 rounded-lg bg-white/5 p-0.5"><button type="button" onClick={() => onStyle({ entranceCurve: "ease" })} className={`rounded-md py-1.5 text-[10px] ${style.entranceCurve === "ease" ? "bg-white/15 text-white" : "text-zinc-500"}`}>Ease</button><button type="button" onClick={() => onStyle({ entranceCurve: "spring" })} className={`rounded-md py-1.5 text-[10px] ${style.entranceCurve === "spring" ? "bg-white/15 text-white" : "text-zinc-500"}`}>Spring</button></div>{style.entranceCurve === "ease" ? <><BezierEditor value={style.entranceBezier} onChange={(entranceBezier) => onStyle({ entranceBezier })} /><SelectInput label="Preset" value="custom" options={[{ label: "Custom", value: "custom" }, { label: "Ease", value: "0.25, 0.1, 0.25, 1" }, { label: "Ease in", value: "0.42, 0, 1, 1" }, { label: "Ease out", value: "0, 0, 0.58, 1" }, { label: "Ease in out", value: "0.42, 0, 0.58, 1" }, { label: "Snappy", value: "0.2, 0.8, 0.2, 1" }, { label: "Overshoot", value: "0.34, 1.56, 0.64, 1" }]} onChange={(preset) => preset !== "custom" && onStyle({ entranceBezier: preset })} /><TextInput label="Bezier" value={style.entranceBezier} onChange={(entranceBezier) => onStyle({ entranceBezier })} /></> : <div className="rounded-xl bg-white/5 p-3"><svg viewBox="0 0 160 90" className="h-28 w-full"><path d="M15 75 C48 75 54 8 98 18 C124 25 130 10 145 15" fill="none" stroke="#a1a1aa" strokeWidth="2"/><circle cx="15" cy="75" r="4" fill="white"/><circle cx="145" cy="15" r="4" fill="white"/></svg><SliderInput label="Stiffness" min={1} max={1000} value={style.springStiffness} onChange={(springStiffness) => onStyle({ springStiffness })} /><SliderInput label="Damping" min={1} max={100} value={style.springDamping} onChange={(springDamping) => onStyle({ springDamping })} /></div>}<div className="mt-3 space-y-2"><SelectInput label="Effect" value={style.entrance} options={ENTRANCES} onChange={(entrance) => onStyle({ entrance })} /><SliderInput label="Time" min={50} max={5000} suffix="ms" value={style.entranceDuration} onChange={(entranceDuration) => onStyle({ entranceDuration })} /><SliderInput label="Delay" min={0} max={5000} suffix="ms" value={style.entranceDelay} onChange={(entranceDelay) => onStyle({ entranceDelay })} /></div></div>}
        </div>
    );
}

/* ---------------------------------------------------------------- page tab */

export function PageInspector({
    rootStyle,
    onChange,
}: {
    rootStyle: RootStyle;
    onChange: (patch: Partial<RootStyle>) => void;
}) {
    const providerFonts = usePagieraFonts();
    const customFontOptions = (rootStyle.customFonts ?? []).map((font) => ({
        label: font.name,
        value: `"${font.name}", sans-serif`,
    }));
    const siteFontOptions = [...customFontOptions, ...providerFonts.map((font) => ({ label: font.title, value: font.family })), ...FONT_STACKS]
        .filter((font, index, options) => options.findIndex((candidate) => candidate.value === font.value) === index);
    return (
        <div className="flex flex-col divide-y divide-ed-border">
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
                            className="flex items-center justify-center rounded border border-ed-border bg-ed-field p-2 text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
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
                        className="flex items-center justify-center gap-1.5 rounded border border-ed-border bg-ed-field p-2 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                    >
                        <IconArrowsHorizontal size={13} /> Horizontal
                    </button>
                    <button
                        type="button"
                        disabled={!canArrange || count < 3}
                        onClick={() => onDistribute("vertical")}
                        className="flex items-center justify-center gap-1.5 rounded border border-ed-border bg-ed-field p-2 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                    >
                        <IconArrowsVertical size={13} /> Vertical
                    </button>
                </div>
            </Group>
        </div>
    );
}
