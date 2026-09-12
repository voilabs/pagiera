"use client";
import { TextEffectsContent } from "@/lib/render/text-effects";

import {
    IconArrowDown,
    IconArrowUp,
    IconArrowsMove,
    IconBox,
    IconCheck,
    IconCircleDot,
    IconChevronDown,
    IconChevronRight,
    IconCopy,
    IconCloudDownload,
    IconComponents,
    IconEye,
    IconEyeOff,
    IconExternalLink,
    IconFile,
    IconFrame,
    IconGridDots,
    IconHandClick,
    IconHome,
    IconHeading,
    IconLock,
    IconLockOpen,
    IconLayoutRows,
    IconList,
    IconPaperclip,
    IconPencil,
    IconPhoto,
    IconPlayerPlay,
    IconPlus,
    IconPoint,
    IconMarkdown,
    IconQuote,
    IconRepeat,
    IconSection,
    IconSeparator,
    IconSelector,
    IconSquareCheck,
    IconSpace,
    IconSparkles,
    IconDownload,
    IconUpload,
    IconTrash,
    IconTag,
    IconTypography,
    IconVideo,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { resolveStyle } from "@/lib/editor/style";
import { ICON_CATALOG, IconGlyph } from "@/lib/editor/icon";
import { childrenOf, displayName, subtreeIds } from "@/lib/editor/tree";
import {
    type Breakpoint,
    type CanvasElement,
    DRAG_MIME,
    type ElementStyle,
    type ElementType,
    type EntranceSplit,
    isContainer,
    MOVE_MIME,
    type ResizeHandle,
} from "@/lib/editor/types";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "./ui";
import { shaderDocument } from "@/lib/editor/shaders";
import { interactiveDocument } from "@/lib/editor/interactive";
import { markdownToHtml } from "@/lib/render/markdown";
import { splitTextParts } from "@/lib/render/page-render";
import { PagieraMark } from "./brand";
import type { SaveStatus } from "./use-editor";

export const TYPE_ICONS: Record<
    ElementType,
    React.ComponentType<{ size?: number; stroke?: number; className?: string }>
> = {
    Frame: IconBox,
    Stack: IconLayoutRows,
    Section: IconSection,
    Container: IconBox,
    Grid: IconGridDots,
    Heading: IconHeading,
    Text: IconTypography,
    Image: IconPhoto,
    Button: IconHandClick,
    Video: IconVideo,
    Icon: IconSparkles,
    Divider: IconSeparator,
    Spacer: IconSpace,
    List: IconList,
    ListItem: IconPoint,
    Quote: IconQuote,
    Markdown: IconMarkdown,
    Embed: IconFrame,
    Form: IconLayoutRows,
    Fieldset: IconBox,
    Label: IconTag,
    Input: IconPencil,
    Textarea: IconTypography,
    Select: IconSelector,
    Checkbox: IconSquareCheck,
    Radio: IconCircleDot,
    FileInput: IconPaperclip,
    Request: IconCloudDownload,
    Repeat: IconRepeat,
};

/* ------------------------------------------------------------------ canvas */

/** What an element shows on the canvas when it is not being text-edited. */
export function ElementBody({
    element,
    entranceSplit = "none",
    effectsPreview = false,
}: {
    element: CanvasElement;
    /** Break the text the way the published page will, so Play is honest. */
    entranceSplit?: EntranceSplit;
    effectsPreview?: boolean;
}) {
    if (element.interactive) return null;
    if (element.shader) return <iframe title={element.name ?? "Shader"} srcDoc={shaderDocument(element.shader.preset, element.shader)} sandbox="allow-scripts" className="pointer-events-none h-full w-full border-0 bg-transparent" />;
if (element.code) return <iframe title={element.name ?? "Code component"} srcDoc={element.code} sandbox={element.codeLanguage === "tsx" ? "allow-scripts" : ""} className="pointer-events-none h-full w-full border-0 bg-transparent" />;
    if (element.type === "Image") {
        if (element.src) {
            return (
                // biome-ignore lint/performance/noImgElement: the src is author-supplied at runtime and cannot be statically optimised
                <img
                    src={element.src}
                    alt={element.alt ?? ""}
                    draggable={false}
                    className="pointer-events-none h-full w-full"
                    style={{ objectFit: element.objectFit ?? "cover", borderRadius: "inherit" }}
                />
            );
        }
        return (
            <span className="pointer-events-none flex h-full w-full items-center justify-center text-ed-muted">
                <IconPhoto size={28} stroke={1.5} />
            </span>
        );
    }

    if (element.type === "Video") {
        return (
            <span className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-1 text-ed-muted">
                <IconPlayerPlay size={28} stroke={1.5} />
                {element.src && (
                    <span className="max-w-full truncate px-2 text-[9px]">
                        {element.src}
                    </span>
                )}
            </span>
        );
    }

    if (element.type === "Icon") return <span className="pointer-events-none block size-full"><IconGlyph element={element} /></span>;

    if (element.type === "Spacer") {
        return <span className="pointer-events-none flex size-full items-center justify-center text-[9px] tracking-wide text-ed-faint opacity-0 transition-opacity group-hover/canvas:opacity-100">Spacer</span>;
    }

    if (element.type === "Embed") {
        return <span className="pointer-events-none flex size-full flex-col items-center justify-center gap-1 text-ed-muted"><IconFrame size={26} stroke={1.5} />{element.src && <span className="max-w-full truncate px-2 text-[9px]">{element.src}</span>}</span>;
    }

    if (element.type === "ListItem") {
        return <span className="pointer-events-none flex w-full select-none items-baseline gap-2"><span className="opacity-50">•</span><span className="min-w-0 flex-1 whitespace-pre-wrap">{element.content}</span></span>;
    }

    if (element.type === "Input" || element.type === "Textarea" || element.type === "Select") {
        // A field shows the text a visitor would see before they touch it: its
        // placeholder, or the value it is pre-filled with.
        const preview = element.type === 'Select' ? element.options?.find(option => option.value === element.defaultValue)?.label || element.placeholder || element.options?.[0]?.label || 'Select' : element.defaultValue || element.placeholder || element.type;
        const appearance = element.fieldAppearance;
        return <span className="pointer-events-none flex w-full select-none items-center gap-1 truncate" style={{ color: !element.defaultValue ? appearance?.placeholderColor : undefined, opacity: element.disabled ? (appearance?.disabledOpacity ?? 45) / 100 : 1 }}><span className="min-w-0 flex-1 truncate">{preview}</span>{element.type === "Select" && appearance?.arrow !== 'none' && <span style={{ color: appearance?.arrowColor, fontSize: appearance?.arrowSize ?? 16 }} className="shrink-0">{appearance?.arrow === 'chevron' ? '⌄' : <IconSelector size={13} />}</span>}</span>;
    }

    if (element.type === "FileInput") {
        return <span className="pointer-events-none flex w-full select-none items-center gap-1.5 truncate opacity-65"><IconPaperclip size={13} className="shrink-0" /><span className="min-w-0 flex-1 truncate">{element.placeholder || element.accept || "Choose a file…"}</span></span>;
    }

    if (element.type === "Checkbox") {
        return <span className="pointer-events-none flex size-full items-center justify-center rounded-[3px] border border-current"><IconCheck size={12} className="opacity-70" /></span>;
    }

    if (element.type === "Radio") {
        return <span className="pointer-events-none flex w-full select-none flex-col gap-2">{(element.options ?? []).map((option, index) => <span key={`${index}:${option.value}`} className="flex items-center gap-2"><span className="flex size-[13px] shrink-0 items-center justify-center rounded-full border border-current">{index === 0 && <span className="size-[6px] rounded-full bg-current" />}</span><span className="truncate">{option.label || option.value}</span></span>)}</span>;
    }

    // The canvas shows the rendered result, not the source. An author editing a
    // Markdown block is arranging a page, and `##` on screen would tell them
    // nothing about how the published page looks.
    if (element.type === "Markdown") {
        if (!element.content) return null;
        return (
            <div
                className="pg-md pointer-events-none w-full select-none"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: markdownToHtml escapes raw HTML before parsing
                dangerouslySetInnerHTML={{ __html: markdownToHtml(element.content) }}
            />
        );
    }

    if (!element.content) return null;
    return (
        <span className="pointer-events-none block w-full select-none whitespace-pre-wrap">
            {element.textEffects && (element.textEffects.hover !== "none" || element.textEffects.scroll !== "none") ? <TextEffectsContent content={element.content} effects={element.textEffects} enabled={effectsPreview} /> : entranceSplit === "none"
                ? element.content
                : splitTextParts(element.content, entranceSplit)}
        </span>
    );
}

/**
 * Where each handle sits on the box, as fractions of its width and height.
 *
 * Fractions rather than classes because the dot's own size has to be undone
 * from the canvas zoom: at 33% a 10px handle rendered 3px across, which is not
 * something a hand can catch.
 */
const HANDLE_SPOTS: Partial<Record<ResizeHandle, { x: number; y: number; cursor: string }>> = {
    nw: { x: 0, y: 0, cursor: "nwse-resize" },
    ne: { x: 1, y: 0, cursor: "nesw-resize" },
    sw: { x: 0, y: 1, cursor: "nesw-resize" },
    se: { x: 1, y: 1, cursor: "nwse-resize" },
};

const CORNERS: ResizeHandle[] = ["nw", "ne", "sw", "se"];

/**
 * The transform box: four corners and four edge midpoints, sitting on the
 * outline itself.
 */
export function ResizeHandles({
    element,
    style,
    scale,
    onMouseDown,
}: {
    element: CanvasElement;
    style: ElementStyle;
    /** The canvas zoom, so a handle stays the same size on screen. */
    scale: number;
    onMouseDown: (
        event: React.MouseEvent,
        handle: ResizeHandle,
        element: CanvasElement,
    ) => void;
}) {
    /*
     * Four corners, and nothing else.
     *
     * A corner is where a hand goes to resize something, and it says both
     * dimensions at once; the edge midpoints only repeated what the inspector
     * states exactly. The handles used to be rationed by sizing mode too, so
     * an auto-height text had no corners at all — now a drag on one simply
     * makes that size explicit.
     */
    // One size on screen whatever the zoom, and a hit area wider than the dot
    // it draws — the same trick every design tool uses to make a 10px handle
    // catchable.
    const dot = 8 / scale;
    const hit = 18 / scale;

    return (
        <>
            {CORNERS.map((handle) => {
                const spot = HANDLE_SPOTS[handle];
                if (!spot) return null;
                return (
                    <button
                        type="button"
                        key={handle}
                        aria-label={`Resize ${handle}`}
                        onMouseDown={(event) => onMouseDown(event, handle, element)}
                        className="absolute z-[60] flex items-center justify-center"
                        style={{
                            left: `${spot.x * 100}%`,
                            top: `${spot.y * 100}%`,
                            width: hit,
                            height: hit,
                            transform: "translate(-50%, -50%)",
                            cursor: spot.cursor,
                        }}
                    >
                        {/* A white square with an accent edge, sitting on the
                            corner it moves. White because it has to read on a
                            near-black canvas and on a white artboard alike;
                            square because that is what a corner of a box looks
                            like when you take hold of it. */}
                        <span
                            className="border-ed-accent"
                            style={{
                                width: dot,
                                height: dot,
                                background: "#fff",
                                borderWidth: 1 / scale,
                                borderRadius: 1 / scale,
                            }}
                        />
                    </button>
                );
            })}
        </>
    );
}

export function Breadcrumbs({
    byId,
    selectedId,
    onSelect,
}: {
    byId: Map<string, CanvasElement>;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const trail: CanvasElement[] = [];
    let cursor = selectedId ? byId.get(selectedId) : undefined;
    const guard = new Set<string>();
    while (cursor && !guard.has(cursor.id)) {
        guard.add(cursor.id);
        trail.unshift(cursor);
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }

    return (
        <div className="pointer-events-auto flex items-center gap-1">
            <span className="text-ed-faint">Page</span>
            {trail.map((el) => (
                <span key={el.id} className="flex items-center gap-1">
                    <IconChevronRight size={11} className="text-ed-faint" />
                    <button
                        type="button"
                        onClick={() => onSelect(el.id)}
                        className="text-ed-muted transition-colors hover:text-ed-text"
                    >
                        {displayName(el)}
                    </button>
                </span>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ header */

const SAVE_LABELS: Record<SaveStatus, { text: string; dot: string }> = {
    saved: { text: "Saved", dot: "bg-emerald-500" },
    dirty: { text: "Unsaved changes", dot: "bg-amber-500" },
    saving: { text: "Saving…", dot: "bg-blue-500 animate-pulse" },
    error: { text: "Save failed", dot: "bg-red-500" },
    conflict: { text: "Reloaded from server", dot: "bg-amber-500" },
};

export function SaveIndicator({
    status,
    error,
}: {
    status: SaveStatus;
    error: string | null;
}) {
    const { text, dot } = SAVE_LABELS[status];
    return (
        <span
            title={error ?? undefined}
            className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-ed-muted"
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {text}
        </span>
    );
}

/* ------------------------------------------------------------- left panels */

const ELEMENT_GROUPS: Array<{ title: string; types: ElementType[] }> = [
    { title: "Layout", types: ["Frame", "Stack", "Grid", "Section", "Container"] },
    { title: "Basic", types: ["Heading", "Text", "Quote", "Markdown", "Image", "Button", "Video", "Embed"] },
    { title: "Structure", types: ["Divider", "Spacer", "List", "ListItem"] },
    { title: "Forms", types: ["Form", "Fieldset", "Label", "Input", "Textarea", "Select", "Checkbox", "Radio", "FileInput"] },
    { title: "Data", types: ["Request", "Repeat"] },
];

export function ElementsPanel({
    search,
    onInsert,
}: {
    search: string;
    onInsert: (type: ElementType) => void;
}) {
    const query = search.trim().toLowerCase();
    const groups = ELEMENT_GROUPS.map((group) => ({
        ...group,
        types: group.types.filter((type) => type.toLowerCase().includes(query)),
    })).filter((group) => group.types.length > 0);

    if (groups.length === 0) {
        return <p className="p-4 text-center text-ed-faint">No elements match “{search}”</p>;
    }

    return (
        <div className="flex flex-col gap-4 p-2.5">
            {groups.map((group) => (
                <div key={group.title}>
                    <h3 className="px-1 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-ed-faint">
                        {group.title}
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                        {group.types.map((type) => {
                            const Icon = TYPE_ICONS[type];
                            return (
                                <button
                                    type="button"
                                    key={type}
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData(DRAG_MIME, type);
                                        event.dataTransfer.effectAllowed = "copy";
                                    }}
                                    onClick={() => onInsert(type)}
                                    className="group flex min-h-[78px] cursor-grab flex-col items-center justify-center gap-1.5 rounded-[14px] bg-ed-subtle/45 px-1.5 py-2.5 transition-all duration-150 hover:-translate-y-px hover:border-ed-accent/40 hover:bg-ed-field hover:shadow-md active:cursor-grabbing"
                                >
                                    <span className="pointer-events-none flex size-7 items-center justify-center rounded-lg bg-ed-field text-ed-muted transition-colors group-hover:bg-ed-accent/15 group-hover:text-ed-accent">
                                        <Icon size={15} stroke={1.55} />
                                    </span>
                                    <span className="pointer-events-none max-w-full truncate text-[9px] font-medium text-ed-muted group-hover:text-ed-text">
                                        {type}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export { IconsPanel } from "./ui/icons-panel";

export function LayersPanel({
    elements,
    breakpoint,
    search,
    selectedIds,
    onSelect,
    onToggleHidden,
    onToggleLocked,
    onReorder,
    onDelete,
    onReparent,
    componentMode = false,
    onOpenComponent,
    collapsedIds,
    onCollapsedChange,
    breakpointGroups = [],
    onBreakpointChange,
}: {
    elements: CanvasElement[];
    breakpoint: Breakpoint;
    search: string;
    selectedIds: string[];
    onSelect: (id: string, additive: boolean) => void;
    onToggleHidden: (id: string) => void;
    onToggleLocked: (id: string) => void;
    onReorder: (id: string, direction: "up" | "down") => void;
    onDelete: (id: string) => void;
    onReparent: (id: string, parentId: string | undefined, beforeId?: string) => void;
    componentMode?: boolean;
    onOpenComponent?: (element: CanvasElement) => void;
    /** Folded branches, held by the shell so its header can fold them all. */
    collapsedIds: Set<string>;
    onCollapsedChange: (next: Set<string>) => void;
    /**
     * The artboards, in canvas order.
     *
     * The tree lists every one of them rather than only the one being edited:
     * the page is the same page at each width, and which width you are looking
     * at is a property of the artboard, not a filter over the document.
     */
    breakpointGroups?: Array<{ id: string; name: string; hint: string; isBase: boolean }>;
    onBreakpointChange?: (id: string) => void;
}) {
    const [dropTarget, setDropTarget] = useState<{
        id: string;
        placement: "before" | "inside" | "after";
    } | null>(null);
    const [layerMenu, setLayerMenu] = useState<{ id: string; x: number; y: number } | null>(null);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => setPortalTarget(document.body), []);

    if (elements.length === 0) {
        return (
            <p className="p-4 text-center text-ed-faint">
                Nothing on the canvas yet. Drop an element from the Elements tab.
            </p>
        );
    }

    const query = search.trim().toLowerCase();
    const matches = (el: CanvasElement) =>
        !query || displayName(el).toLowerCase().includes(query);

    // Follow document/canvas flow from top to bottom. This keeps a stack page
    // readable as Navigation → Hero → Sections → Footer instead of presenting
    // the entire page backwards.
    /**
     * Builds the visible rows.
     *
     * `lines` carries one flag per ancestor level: true where that ancestor
     * has another sibling below, which is exactly when its guide line has to
     * continue past this row. Without it the tree draws lines through
     * branches that have already ended.
     */
    const rows = (
        parentId: string | undefined,
        depth: number,
        lines: boolean[] = [],
        /** The artboard these rows are listed under, if any. */
        group?: string,
    ): React.ReactNode[] => {
        const bp = group ?? breakpoint;
        const siblings = childrenOf(elements, parentId).filter((el) => {
            // A parked frame sits beside the artboards rather than inside one,
            // so it is listed once, after them, instead of repeated under every
            // width — which is also why the artboards leave it out.
            if (parentId !== undefined || breakpointGroups.length === 0) return true;
            return group === undefined ? Boolean(el.parked) : !el.parked;
        });
        return siblings.flatMap((el, siblingIndex) => {
                // On a page, a component instance is one atomic layer. Its
                // implementation belongs to the component canvas and opens on
                // double-click instead of leaking dozens of internal rows.
                const componentInstance = !componentMode && el.componentRole === "instance";
                const canCollapse = !componentInstance && childrenOf(elements, el.id).length > 0;
                // Searching temporarily expands every branch so a collapsed
                // parent can never hide a matching descendant.
                const collapsed = canCollapse && !query && collapsedIds.has(el.id);
                const hasMoreSiblings = siblingIndex < siblings.length - 1;
                const nested = componentInstance || collapsed
                    ? []
                    : rows(el.id, depth + 1, [...lines, hasMoreSiblings], group);
                // Keep a branch visible when a descendant matches the search.
                if (!matches(el) && nested.length === 0) return [];

                return [
                    <LayerRow
                        key={`${group ?? "all"}:${el.id}`}
                        element={el}
                        style={resolveStyle(el, bp)}
                        depth={depth}
                        lines={lines}
                        isLastChild={!hasMoreSiblings}
                        // The same logical layer is listed under every
                        // artboard, but only the artboard being edited owns the
                        // selection highlight. Painting all three rows as
                        // selected made one click look like three selections.
                        isSelected={selectedIds.includes(el.id) && (!group || group === breakpoint)}
                        dropPlacement={dropTarget?.id === el.id ? dropTarget.placement : undefined}
                        nextSiblingId={siblings[siblingIndex + 1]?.id}
                        onSelect={(id, additive) => {
                            // Selecting inside an artboard is also a statement
                            // about which artboard you are working in: the
                            // inspector has to edit the width you just clicked.
                            if (group && group !== breakpoint) onBreakpointChange?.(group);
                            onSelect(id, additive);
                        }}
                        onDropTargetChange={setDropTarget}
                        onReparent={onReparent}
                        isComponentInstance={componentInstance}
                        onOpenComponent={onOpenComponent}
                        canCollapse={canCollapse}
                        collapsed={collapsed}
                        onToggleCollapsed={(deep) => {
                            const next = new Set(collapsedIds);
                            const collapsing = !next.has(el.id);
                            const ids = deep ? subtreeIds(elements, el.id) : new Set([el.id]);
                            for (const id of ids) {
                                if (collapsing) next.add(id);
                                else next.delete(id);
                            }
                            onCollapsedChange(next);
                        }}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (group && group !== breakpoint) onBreakpointChange?.(group);
                            onSelect(el.id, false);
                            setLayerMenu({
                                id: el.id,
                                x: Math.max(8, Math.min(event.clientX, window.innerWidth - 222)),
                                y: Math.max(8, Math.min(event.clientY, window.innerHeight - 250)),
                            });
                        }}
                    />,
                    ...nested,
                ];
            });
    };

    const list = breakpointGroups.length === 0
        ? rows(undefined, 0)
        : [
            ...breakpointGroups.flatMap((group) => {
                const open = !collapsedIds.has(group.id);
                const body = open ? rows(undefined, 1, [], group.id) : [];
                // A search that matches nothing inside an artboard does not
                // leave the artboard's own row behind as a false hit.
                if (query && body.length === 0) return [];
                return [
                    <BreakpointRow
                        key={group.id}
                        group={group}
                        open={open}
                        active={group.id === breakpoint}
                        onToggle={() => {
                            const next = new Set(collapsedIds);
                            if (open) next.add(group.id);
                            else next.delete(group.id);
                            onCollapsedChange(next);
                        }}
                        onSelect={() => onBreakpointChange?.(group.id)}
                    />,
                    ...body,
                ];
            }),
            ...rows(undefined, 0),
        ];
    if (list.length === 0) {
        return <p className="p-4 text-center text-ed-faint">No layers match “{search}”</p>;
    }

    return (
        // The panel body is a drop zone for moving a layer to the page root;
        // the row buttons carry the keyboard-reachable actions.
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop surface
        <div
            className="min-h-full py-2"
            onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(MOVE_MIME)) return;
                event.preventDefault();
                setDropTarget(null);
            }}
            onDrop={(event) => {
                const id = event.dataTransfer.getData(MOVE_MIME);
                if (!id) return;
                event.preventDefault();
                // Dropping on empty panel space moves the layer to the page root.
                onReparent(id, undefined);
                setDropTarget(null);
            }}
        >
            {list}
            {portalTarget && createPortal(
                <div
                    className="pg-editor pointer-events-none fixed inset-0 z-[1000]"
                    data-ed-theme={document.querySelector<HTMLElement>(".pg-editor")?.dataset.edTheme ?? "dark"}
                >
                    <AnimatePresence>
                        {layerMenu && (() => {
                            const element = elements.find((candidate) => candidate.id === layerMenu.id);
                            if (!element) return null;
                            const style = resolveStyle(element, breakpoint);
                            const close = () => setLayerMenu(null);
                            return (
                                // Portalling to body keeps viewport coordinates
                                // independent from the animated/clipped sidebar.
                                // biome-ignore lint/a11y/noStaticElementInteractions: dismiss surface for a context menu
                                <motion.div
                                    key="layer-context-menu"
                                    className="pointer-events-auto fixed inset-0"
                                    onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
                                    onContextMenu={(event) => { if (event.target === event.currentTarget) { event.preventDefault(); close(); } }}
                                >
                                    <Menu
                                        role="menu"
                                        aria-label={`${displayName(element)} layer actions`}
                                        className="pg-menu absolute w-[214px] origin-top-left"
                                        style={{ left: layerMenu.x, top: layerMenu.y }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <MenuLabel>{displayName(element)}</MenuLabel>
                                        <MenuItem icon={<IconArrowUp size={14} className="text-ed-muted" />} label="Move up" onClick={() => { onReorder(element.id, "down"); close(); }} />
                                        <MenuItem icon={<IconArrowDown size={14} className="text-ed-muted" />} label="Move down" onClick={() => { onReorder(element.id, "up"); close(); }} />
                                        <MenuSeparator />
                                        <MenuItem
                                            icon={style.hidden ? <IconEye size={14} className="text-ed-muted" /> : <IconEyeOff size={14} className="text-ed-muted" />}
                                            label={style.hidden ? "Show layer" : "Hide layer"}
                                            onClick={() => { onToggleHidden(element.id); close(); }}
                                        />
                                        <MenuItem
                                            icon={element.locked ? <IconLockOpen size={14} className="text-ed-muted" /> : <IconLock size={14} className="text-ed-muted" />}
                                            label={element.locked ? "Unlock layer" : "Lock layer"}
                                            onClick={() => { onToggleLocked(element.id); close(); }}
                                        />
                                        <MenuSeparator />
                                        <MenuItem icon={<IconTrash size={14} className="text-red-400/80" />} label="Delete" shortcut="Del" destructive onClick={() => { onDelete(element.id); close(); }} />
                                    </Menu>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>,
                portalTarget,
            )}
        </div>
    );
}

/**
 * An artboard's row in the tree.
 *
 * It reads as chrome rather than as a layer — it is not something you can
 * delete, drag or hide — so it carries the width it governs instead of the
 * layer controls, and clicking it moves the editor to that width.
 */
function BreakpointRow({
    group,
    open,
    active,
    onToggle,
    onSelect,
}: {
    group: { id: string; name: string; hint: string; isBase: boolean };
    open: boolean;
    active: boolean;
    onToggle: () => void;
    onSelect: () => void;
}) {
    return (
        <div
            className={`group/bp flex h-8 w-full items-center gap-1 rounded-md pl-1 pr-2 transition-colors ${
                active ? "bg-ed-field text-ed-text" : "text-ed-muted hover:bg-ed-field-hover"
            }`}
        >
            <button
                type="button"
                aria-label={open ? `Collapse ${group.name}` : `Expand ${group.name}`}
                onClick={onToggle}
                className="flex size-4 shrink-0 items-center justify-center rounded text-ed-faint transition-colors hover:text-ed-text"
            >
                <IconChevronRight size={12} className={`transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
            <button
                type="button"
                onClick={onSelect}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
                <IconFrame size={13} className={`shrink-0 ${active ? "text-ed-accent" : "text-ed-faint"}`} />
                <span className={`min-w-0 flex-1 truncate text-[11.5px] ${active ? "font-medium" : ""}`}>
                    {group.name}
                </span>
                <span className="shrink-0 text-[9.5px] font-medium uppercase tracking-[.04em] text-ed-faint">
                    {group.isBase ? "Main" : group.hint}
                </span>
            </button>
        </div>
    );
}

function LayerRow({
    element,
    style,
    depth,
    lines = [],
    isLastChild = true,
    isSelected,
    dropPlacement,
    nextSiblingId,
    onSelect,
    onDropTargetChange,
    onReparent,
    isComponentInstance,
    onOpenComponent,
    canCollapse,
    collapsed,
    onToggleCollapsed,
    onContextMenu,
}: {
    element: CanvasElement;
    style: ElementStyle;
    depth: number;
    /** One flag per ancestor: does its guide line continue past this row. */
    lines?: boolean[];
    isLastChild?: boolean;
    isSelected: boolean;
    dropPlacement?: "before" | "inside" | "after";
    nextSiblingId?: string;
    onSelect: (id: string, additive: boolean) => void;
    onDropTargetChange: (target: { id: string; placement: "before" | "inside" | "after" } | null) => void;
    onReparent: (id: string, parentId: string | undefined, beforeId?: string) => void;
    isComponentInstance: boolean;
    onOpenComponent?: (element: CanvasElement) => void;
    canCollapse: boolean;
    collapsed: boolean;
    /** `deep` folds the whole branch — alt-click. */
    onToggleCollapsed: (deep: boolean) => void;
    onContextMenu: (event: React.MouseEvent) => void;
}) {
    const Icon = isComponentInstance ? IconComponents : TYPE_ICONS[element.type];
    const container = !isComponentInstance && isContainer(element.type);

    return (
        // Every row accepts before/after drops. Containers additionally expose
        // a middle zone for nesting, matching the canvas tree structure.
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop surface
        <div
            className={`group relative mx-1 flex h-[30px] items-center gap-1.5 rounded-[6px] pr-2 text-[12px] transition-colors ${dropPlacement === "inside"
                    ? "bg-[var(--ed-accent-soft)] text-ed-text ring-1 ring-inset ring-ed-accent/40"
                    : isSelected
                        ? "bg-ed-accent text-white"
                        : "text-ed-muted hover:bg-ed-field hover:text-ed-text"
                }`}
            style={{ paddingLeft: 7 + depth * 13 }}
            onContextMenu={onContextMenu}
            data-layer-depth={depth}
            onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(MOVE_MIME)) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientY - rect.top) / rect.height;
                const placement = container && ratio >= 0.3 && ratio <= 0.7
                    ? "inside"
                    : ratio < 0.5 ? "before" : "after";
                onDropTargetChange({ id: element.id, placement });
            }}
            onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                onDropTargetChange(null);
            }}
            onDrop={(event) => {
                const id = event.dataTransfer.getData(MOVE_MIME);
                if (!id) return;
                event.preventDefault();
                event.stopPropagation();
                if (id !== element.id) {
                    if (dropPlacement === "inside") onReparent(id, element.id);
                    else if (dropPlacement === "before") onReparent(id, element.parentId, element.id);
                    else if (nextSiblingId !== id) onReparent(id, element.parentId, nextSiblingId);
                }
                onDropTargetChange(null);
            }}
        >
            {/* Hierarchy guides. They sit under the row's own content and
                never take the pointer, so dragging and selection are
                unaffected by them. */}
            {lines.map((continues, level) => (
                continues ? (
                    <span
                        key={`line-${level}`}
                        className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--ed-nav-border)]"
                        style={{ left: 13 + level * 13 }}
                    />
                ) : null
            ))}
            {depth > 0 && (
                <>
                    <span
                        className="pointer-events-none absolute top-0 w-px bg-[var(--ed-nav-border)]"
                        style={{ left: 13 + (depth - 1) * 13, height: isLastChild ? "50%" : "100%" }}
                    />
                    <span
                        className="pointer-events-none absolute h-px bg-[var(--ed-nav-border)]"
                        style={{ left: 13 + (depth - 1) * 13, top: "50%", width: 8 }}
                    />
                </>
            )}
            {dropPlacement === "before" && (
                <span className="pointer-events-none absolute inset-x-1 top-0 z-10 h-0.5 -translate-y-1/2 rounded-full bg-ed-accent">
                    <span className="absolute -left-0.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-ed-accent" />
                </span>
            )}
            {dropPlacement === "after" && (
                <span className="pointer-events-none absolute inset-x-1 bottom-0 z-10 h-0.5 translate-y-1/2 rounded-full bg-ed-accent">
                    <span className="absolute -left-0.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-ed-accent" />
                </span>
            )}
            {canCollapse ? (
                <button
                    type="button"
                    aria-label={collapsed ? "Expand layer" : "Collapse layer"}
                    aria-expanded={!collapsed}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleCollapsed(event.altKey);
                    }}
                    className={`flex size-4 shrink-0 items-center justify-center rounded transition-colors ${isSelected ? "text-white/70 hover:bg-white/15 hover:text-white" : "text-ed-faint hover:bg-ed-field-hover hover:text-ed-text"}`}
                >
                    <IconChevronRight size={12} className={`transition-transform ${collapsed ? "" : "rotate-90"}`} />
                </button>
            ) : (
                <span className="size-4 shrink-0" aria-hidden="true" />
            )}
            {/* Selection stays lightweight; secondary actions live in the
                row's context menu so layer names retain the available width. */}
            <button
                type="button"
                draggable
                onDragStart={(event) => {
                    event.dataTransfer.setData(MOVE_MIME, element.id);
                    event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => onDropTargetChange(null)}
                onClick={(event) => onSelect(element.id, event.shiftKey || event.metaKey)}
                onDoubleClick={(event) => {
                    if (!isComponentInstance || !onOpenComponent) return;
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenComponent(element);
                }}
                aria-pressed={isSelected}
                className="flex min-w-0 flex-1 cursor-grab items-center gap-2 text-left active:cursor-grabbing"
            >
                <Icon size={12} stroke={1.55} className={isSelected ? "text-white/85" : isComponentInstance ? "text-ed-accent" : "text-ed-faint"} />
                <span
                    className={`flex-1 truncate ${style.hidden ? "text-ed-faint line-through" : ""}`}
                >
                    {displayName(element)}
                </span>
                {Number.isFinite(style.zIndex) && style.zIndex !== 0 && (
                    <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[8px] ${isSelected ? "bg-white/15 text-white" : "bg-[var(--ed-accent-soft)] text-ed-accent"}`}
                        title={`z-index: ${style.zIndex}`}
                    >
                        z{style.zIndex}
                    </span>
                )}
                {isComponentInstance && (
                    <span className="shrink-0 rounded-md bg-[var(--ed-accent-soft)] px-2 py-0.5 text-[8px] font-semibold text-ed-accent">
                        {element.variant ?? "Component"}
                    </span>
                )}
            </button>
        </div>
    );
}

/* ------------------------------------------------------------- pages panel */

export type PageEntry = {
    id: string;
    name: string;
    slug: string;
    published: boolean;
};

/**
 * A slug the router will accept, derived as the author types a name.
 *
 * The server normalises whatever it is sent, but doing it here means the URL
 * the page will live at is visible before it is created rather than after.
 */
function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * What the panel is doing right now.
 *
 * One value rather than the four independent flags this used to keep, because
 * the states are mutually exclusive in the interface and were not in the code:
 * a create form, a row's action strip and a rename form could all be open at
 * once, each pushing the list somewhere different.
 */
type PagesMode =
    | { kind: "idle" }
    | { kind: "create"; slug: string }
    | { kind: "edit"; id: string; slug: string }
    | { kind: "delete"; id: string };

export function PagesPanel({
    pages,
    currentId,
    navigatingId,
    busy,
    error,
    onCreate,
    onRename,
    onDuplicate,
    onDelete,
    onNavigate,
    publishedHref,
}: {
    pages: PageEntry[];
    currentId: string;
    navigatingId?: string | null;
    busy: boolean;
    error: string | null;
    onCreate: (name: string, slug: string) => void;
    onRename: (id: string, name: string, slug: string) => void;
    onDuplicate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (id: string) => void;
    publishedHref: (slug: string) => string;
}) {
    const [mode, setMode] = useState<PagesMode>({ kind: "idle" });
    const idle = () => setMode({ kind: "idle" });
    /** Pending single-click navigation, cancelled when a double click follows. */
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (openTimer.current) clearTimeout(openTimer.current);
    }, []);
    const openLater = (id: string) => {
        if (openTimer.current) return;
        openTimer.current = setTimeout(() => {
            openTimer.current = null;
            onNavigate(id);
        }, 220);
    };
    const cancelOpen = () => {
        if (!openTimer.current) return;
        clearTimeout(openTimer.current);
        openTimer.current = null;
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
                <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-ed-faint">
                    Pages
                </span>
                <span className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-ed-faint">{pages.length}</span>
                    <button
                        type="button"
                        aria-label="New page"
                        onClick={() =>
                            setMode(
                                mode.kind === "create"
                                    ? { kind: "idle" }
                                    : { kind: "create", slug: "" },
                            )
                        }
                        className={`flex size-6 items-center justify-center rounded-lg transition-colors ${mode.kind === "create"
                            ? "bg-ed-accent text-white"
                            : "bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"
                            }`}
                    >
                        <IconPlus size={12} className={`transition-transform ${mode.kind === "create" ? "rotate-45" : ""}`} />
                    </button>
                </span>
            </div>

            {error && (
                <p className="mx-2.5 mb-1 rounded-lg bg-red-500/10 px-3 py-2 text-[10px] leading-relaxed text-red-400">
                    {error}
                </p>
            )}

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                {mode.kind === "create" && (
                    <div className="mx-2.5 mb-1 flex h-9 items-center gap-2 rounded-lg border border-ed-accent bg-ed-field px-3">
                        <span className="font-mono text-[11px] text-ed-faint">/</span>
                        <input
                            autoFocus
                            value={mode.slug}
                            disabled={busy}
                            placeholder="new-page"
                            onChange={(event) => setMode({ kind: "create", slug: event.target.value })}
                            onBlur={idle}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") idle();
                                if (event.key === "Enter") {
                                    const slug = slugify(mode.slug);
                                    if (!slug) return;
                                    onCreate(slug.replace(/-/g, " "), slug);
                                    idle();
                                }
                            }}
                            className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-ed-text outline-none placeholder:text-ed-faint"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-1 px-2.5 pb-2.5">
                    {pages.map((page) => {
                        const isCurrent = page.id === currentId;
                        const isNavigating = page.id === navigatingId;
                        // The home page is what the site resolves to at `/`;
                        // renaming its slug or deleting it would take that away.
                        const isHome = page.slug === "home";

                        if (mode.kind === "edit" && mode.id === page.id) {
                            return (
                                <div key={page.id} className="mx-0 flex h-9 items-center gap-2 rounded-lg border border-ed-accent bg-ed-field px-3">
                                    <IconFile size={13} className="shrink-0 text-ed-accent" />
                                    <span className="font-mono text-[11px] text-ed-faint">/</span>
                                    <input
                                        autoFocus
                                        value={mode.slug}
                                        disabled={busy}
                                        onChange={(event) => setMode({ kind: "edit", id: page.id, slug: event.target.value })}
                                        onBlur={() => {
                                            const slug = slugify(mode.slug);
                                            if (slug && slug !== page.slug) onRename(page.id, page.name, slug);
                                            idle();
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Escape") idle();
                                            if (event.key === "Enter") event.currentTarget.blur();
                                        }}
                                        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-ed-text outline-none"
                                    />
                                </div>
                            );
                        }

                        if (mode.kind === "delete" && mode.id === page.id) {
                            return (
                                <div key={page.id} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5">
                                    <span className="min-w-0 flex-1 text-[10px] leading-relaxed text-ed-text">
                                        Delete <b>{page.name}</b> and everything on it?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={idle}
                                        className="shrink-0 rounded-lg px-2 py-1 text-[10px] text-ed-muted hover:bg-ed-field hover:text-ed-text"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { onDelete(page.id); idle(); }}
                                        className="shrink-0 rounded-lg bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:opacity-90"
                                    >
                                        Delete
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={page.id}
                                onDoubleClick={() => {
                                    cancelOpen();
                                    if (!busy && !isHome) setMode({ kind: "edit", id: page.id, slug: page.slug });
                                }}
                                className={`group relative flex items-center rounded-lg transition-colors ${isCurrent
                                    ? "bg-ed-field-hover text-ed-text before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-ed-accent"
                                    : isNavigating ? "bg-ed-field" : "hover:bg-ed-subtle"
                                    }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => openLater(page.id)}
                                    disabled={busy || isCurrent}
                                    className="flex h-9 min-w-0 flex-1 items-center gap-2.5 px-3 text-left disabled:pointer-events-none"
                                >
                                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${isCurrent ? "bg-ed-accent-soft text-ed-accent" : "text-ed-muted"}`}>
                                        {isHome ? <IconHome size={13} stroke={1.6} /> : <IconFile size={13} stroke={1.6} />}
                                    </span>
                                    <span className={`min-w-0 flex-1 truncate font-mono text-[11px] ${isCurrent ? "font-semibold text-ed-text" : "text-ed-muted"}`}>
                                        {isHome ? "/" : `/${page.slug}`}
                                    </span>
                                    {page.published && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" title="Published" />}
                                    {isNavigating && (
                                        <motion.span
                                            aria-label="Opening page"
                                            className="size-1.5 shrink-0 rounded-full bg-ed-accent"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
                                        />
                                    )}
                                </button>

                                {/* The actions sit in the row itself. They used to be
                                    behind a per-row menu that expanded downward, which
                                    moved every page below the one being acted on.
                                    Hidden until the row is hovered or focused, so a
                                    long list still reads as names and URLs. */}
                                <span className={`flex shrink-0 items-center pr-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${isCurrent ? "[&_a]:text-white/70 [&_button]:text-white/70" : ""}`}>
                                    <RowAction
                                        label={`Duplicate ${page.name}`}
                                        onClick={() => onDuplicate(page.id, `${page.name} copy`)}
                                    >
                                        <IconCopy size={12} />
                                    </RowAction>
                                    {page.published && (
                                        <a
                                            href={publishedHref(page.slug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Open published ${page.name}`}
                                            className="flex size-6 items-center justify-center rounded-md text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                                        >
                                            <IconExternalLink size={12} />
                                        </a>
                                    )}
                                    {!isHome && (
                                        <RowAction
                                            label={`Delete ${page.name}`}
                                            danger
                                            onClick={() => setMode({ kind: "delete", id: page.id })}
                                        >
                                            <IconTrash size={12} />
                                        </RowAction>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function RowAction({
    label,
    onClick,
    danger,
    children,
}: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex size-6 items-center justify-center rounded-md text-ed-faint transition-colors ${danger ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-ed-field hover:text-ed-text"}`}
        >
            {children}
        </button>
    );
}

/* ------------------------------------------------------------ context menu */

export function ContextMenu({
    x,
    y,
    onBringForward,
    onSendBackward,
    onDuplicate,
    onCopy,
    onWrap,
    onUnwrap,
    onToggleFree,
    isFree,
    onCreateComponent,
    onAskLuma,
    onDelete,
}: {
    x: number;
    y: number;
    onBringForward: () => void;
    onSendBackward: () => void;
    onDuplicate: () => void;
    onCopy: () => void;
    onWrap: () => void;
    onUnwrap: () => void;
    onToggleFree: () => void;
    /** Whether this element is already placed freely. */
    isFree: boolean;
    /** Absent for a layer that is already part of a component. */
    onCreateComponent?: () => void;
    onAskLuma: () => void;
    onDelete: () => void;
}) {
    return (
        <Menu
            className="fixed z-[100] min-w-[216px]"
            style={{ left: x, top: y }}
            onClick={(event) => event.stopPropagation()}
        >
            <MenuItem
                icon={<PagieraMark size={14} className="rounded-[4px]" />}
                label="Ask Luma…"
                onClick={onAskLuma}
            />
            <MenuSeparator />
            <MenuItem
                icon={<IconArrowUp size={14} className="text-ed-muted" />}
                label="Bring forward"
                onClick={onBringForward}
            />
            <MenuItem
                icon={<IconArrowDown size={14} className="text-ed-muted" />}
                label="Send backward"
                onClick={onSendBackward}
            />
            <MenuSeparator />
            <MenuItem
                icon={<IconArrowsMove size={14} className="text-ed-muted" />}
                label={isFree ? "Return to flow" : "Place freely"}
                onClick={onToggleFree}
            />
            <MenuItem
                icon={<IconBox size={14} className="text-ed-muted" />}
                label="Wrap in container"
                onClick={onWrap}
            />
            <MenuItem
                icon={<IconBox size={14} className="text-ed-muted" />}
                label="Move out of parent"
                onClick={onUnwrap}
            />
            {onCreateComponent && (
                <MenuItem
                    icon={<IconComponents size={14} className="text-ed-muted" />}
                    label="Create component"
                    onClick={onCreateComponent}
                />
            )}
            <MenuSeparator />
            <MenuItem
                icon={<IconCopy size={14} className="text-ed-muted" />}
                label="Duplicate"
                shortcut="Ctrl D"
                onClick={onDuplicate}
            />
            <MenuItem
                icon={<IconCopy size={14} className="text-ed-muted" />}
                label="Copy"
                shortcut="Ctrl C"
                onClick={onCopy}
            />
            <MenuSeparator />
            <MenuItem
                icon={<IconTrash size={14} className="text-red-400/80" />}
                label="Delete"
                shortcut="Del"
                destructive
                onClick={onDelete}
            />
        </Menu>
    );
}

type PadSide = "padT" | "padR" | "padB" | "padL";

const PAD_SIDES: Array<{ side: PadSide; cursor: string }> = [
    { side: "padT", cursor: "cursor-ns-resize" },
    { side: "padR", cursor: "cursor-ew-resize" },
    { side: "padB", cursor: "cursor-ns-resize" },
    { side: "padL", cursor: "cursor-ew-resize" },
];

/**
 * Draggable padding bands drawn inside the selected container.
 *
 * Padding is the difference between a stacked layout that reads as designed
 * and one that reads as a form, but it is the one property you cannot judge
 * from a number field — you have to see it against the content. These bands
 * shade the actual inset and let it be dragged in place.
 *
 * Only stacked containers get them: under `absolute` the parent does not place
 * its children, so its padding changes nothing.
 */
export function PaddingHandles({
    element,
    style,
    scale,
    active,
    onMouseDown,
}: {
    element: CanvasElement;
    style: ElementStyle;
    /** Canvas zoom, so a band keeps a usable grab area at any magnification. */
    scale: number;
    active?: PadSide;
    onMouseDown: (
        event: React.MouseEvent,
        side: PadSide,
        element: CanvasElement,
    ) => void;
}) {
    if (style.layout !== "stack") return null;

    // Below a couple of screen pixels the band is unhittable, so give it a
    // floor and let it overhang the (tiny) padding it represents.
    const grab = Math.max(6, 10 / scale);

    return (
        <>
            {PAD_SIDES.map(({ side, cursor }) => {
                const value = style[side];
                const vertical = side === "padT" || side === "padB";
                const thickness = Math.max(value, grab);
                const box: React.CSSProperties = {
                    position: "absolute",
                    zIndex: 55,
                    background:
                        active === side || value > 0
                            ? "color-mix(in srgb, var(--ed-accent) 16%, transparent)"
                            : "transparent",
                    ...(vertical
                        ? { left: 0, right: 0, height: thickness, [side === "padT" ? "top" : "bottom"]: 0 }
                        : { top: 0, bottom: 0, width: thickness, [side === "padL" ? "left" : "right"]: 0 }),
                };
                return (
                    <button
                        type="button"
                        key={side}
                        aria-label={`Drag ${side} padding`}
                        title={`${side.slice(3)} padding · ${value}px`}
                        onMouseDown={(event) => onMouseDown(event, side, element)}
                        className={`${cursor} border-0 p-0 hover:bg-ed-accent/25`}
                        style={box}
                    >
                        {active === side && (
                            <span
                                className="pointer-events-none absolute rounded bg-ed-accent px-1 text-[9px] font-semibold text-white"
                                style={
                                    vertical
                                        ? { left: "50%", top: "50%", transform: "translate(-50%,-50%)" }
                                        : { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }
                                }
                            >
                                {value}
                            </span>
                        )}
                    </button>
                );
            })}
        </>
    );
}

/**
 * The seam between two stacked sections.
 *
 * Wix-style: the distance between sections is something you reach for on the
 * canvas rather than hunt for in a panel, and the point where you want a new
 * section is almost always the point you are looking at. Both live on the same
 * strip — drag it to change the space, click the button to insert there.
 *
 * Only rendered under a stacked root, where one section genuinely follows
 * another; free placement has no seam to speak of.
 */
export function SectionSeam({
    space,
    scale,
    active,
    onDragStart,
    onInsert,
}: {
    /** Current `marginB` of the section above, in canvas pixels. */
    space: number;
    scale: number;
    active: boolean;
    onDragStart: (event: React.MouseEvent) => void;
    onInsert: () => void;
}) {
    // The strip has to stay grabbable when the sections are flush, so it keeps
    // a minimum height and overlays the boundary rather than occupying it.
    const height = Math.max(space, 18 / scale);

    return (
        <div
            className="group/seam pointer-events-none absolute inset-x-0 z-[70] flex items-center justify-center"
            style={{ top: "100%", height }}
        >
            <div
                className={`pointer-events-auto absolute inset-0 transition-colors ${active ? "bg-ed-accent/10" : "group-hover/seam:bg-ed-accent/[.06]"}`}
            />
            <div className={`pointer-events-auto relative flex items-center gap-1.5 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover/seam:opacity-100"}`}>
                <button
                    type="button"
                    aria-label="Drag to change the space after this section"
                    onMouseDown={onDragStart}
                    className="flex h-4 w-9 cursor-ns-resize items-center justify-center rounded-full bg-ed-accent shadow-md"
                >
                    <span className="h-0.5 w-4 rounded-full bg-white/80" />
                </button>
                <span className="rounded-full bg-ed-accent px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-md">
                    {Math.round(space)} px
                </span>
                <button
                    type="button"
                    onClick={onInsert}
                    className="flex items-center gap-1 rounded-lg bg-ed-accent px-2.5 py-1 text-[10px] font-semibold text-white shadow-md hover:brightness-110"
                >
                    <IconPlus size={11} /> Add section
                </button>
            </div>
        </div>
    );
}

/**
 * Saving the site to a file and replacing it from one.
 *
 * Lives in Settings rather than the template catalog: the catalog is for
 * browsing what other people made, while these two act on this site. The
 * exported file is the same bundle shape the catalog serves, so a site saved
 * here can be committed to a registry and installed anywhere.
 */
export function SiteTransfer({
    exportUrl,
    onImport,
    busy,
}: {
    exportUrl?: (id: string) => string;
    onImport?: (bundle: unknown) => Promise<void>;
    busy?: boolean;
}) {
    const [name, setName] = useState("my-template");
    const [error, setError] = useState("");
    const [importing, setImporting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // The file name doubles as the bundle id, so it has to survive being one.
    const id = name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "my-template";

    const read = async (file: File) => {
        setError("");
        setImporting(true);
        try {
            const bundle = JSON.parse(await file.text()) as { schemaVersion?: unknown; pages?: unknown };
            if (bundle?.schemaVersion !== 1 || !Array.isArray(bundle?.pages)) {
                throw new Error("That file is not a Pagiera template bundle.");
            }
            await onImport?.(bundle);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not read that file.");
        } finally {
            setImporting(false);
            setConfirming(false);
        }
    };

    if (!exportUrl && !onImport) return null;

    return (
        <div className="flex flex-col gap-2.5 border-t border-ed-border px-4 py-4">
            <span className="text-[10px] font-semibold text-ed-text">Template file</span>

            {exportUrl && (
                <>
                    <div className="flex items-center gap-2">
                        <input
                            aria-label="Template name"
                            value={name}
                            onChange={(event) => setName(event.target.value.slice(0, 60))}
                            className="min-w-0 flex-1 rounded-lg bg-ed-field px-2.5 py-2 font-mono text-[10px] text-ed-text outline-none ring-ed-accent focus:ring-1"
                        />
                        <a
                            href={exportUrl(id)}
                            download={`${id}.json`}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ed-field px-3 py-2 text-[10px] font-medium text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text"
                        >
                            <IconDownload size={13} /> Export
                        </a>
                    </div>
                    <p className="text-[9px] leading-relaxed text-ed-faint">
                        Saves every page as a bundle in the same format the template catalog serves.
                    </p>
                </>
            )}

            {onImport && (
                <>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            // Cleared so choosing the same file twice still fires.
                            event.target.value = "";
                            if (file) void read(file);
                        }}
                    />
                    {confirming ? (
                        <div className="flex flex-col gap-2 rounded-xl bg-amber-400/[.07] px-3 py-2.5">
                            <p className="text-[9px] leading-relaxed text-ed-muted">
                                <strong className="font-semibold text-ed-text">This replaces the whole site.</strong>{" "}
                                Every page and its revision history is removed once the import succeeds.
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="flex-1 rounded-lg bg-ed-accent px-3 py-2 text-[10px] font-semibold text-white hover:brightness-110"
                                >
                                    Choose file
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className="rounded-lg px-3 py-2 text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            disabled={busy || importing}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-ed-field px-3 py-2 text-[10px] font-medium text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-40"
                        >
                            <IconUpload size={13} /> {importing ? "Importing…" : "Import a bundle"}
                        </button>
                    )}
                </>
            )}

            {error && (
                <p className="rounded-lg bg-red-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-red-300">{error}</p>
            )}
        </div>
    );
}
