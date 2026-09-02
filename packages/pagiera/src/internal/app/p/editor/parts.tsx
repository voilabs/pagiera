"use client";

import {
    IconArrowDown,
    IconArrowUp,
    IconArrowsMove,
    IconBox,
    IconCheck,
    IconCircleDot,
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
import { childrenOf, displayName } from "@/lib/editor/tree";
import {
    type Breakpoint,
    type CanvasElement,
    DRAG_MIME,
    type ElementStyle,
    type ElementType,
    isContainer,
    MOVE_MIME,
    type ResizeHandle,
} from "@/lib/editor/types";
import { markdownToHtml } from "@/lib/render/markdown";
import { PagieraMark } from "./brand";
import type { SaveStatus } from "./use-editor";

const TYPE_ICONS: Record<
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
export function ElementBody({ element }: { element: CanvasElement }) {
    if (element.code) return <iframe title={element.name ?? "Code component"} srcDoc={element.code} sandbox="" className="pointer-events-none h-full w-full border-0 bg-transparent" />;
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
        const preview = element.defaultValue || element.placeholder || element.type;
        return <span className="pointer-events-none flex w-full select-none items-center gap-1 truncate opacity-65"><span className="min-w-0 flex-1 truncate">{preview}</span>{element.type === "Select" && <IconSelector size={13} className="shrink-0" />}</span>;
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
            {element.content}
        </span>
    );
}

const CORNER_HANDLES: Array<{ handle: ResizeHandle; className: string }> = [
    { handle: "nw", className: "-top-[5px] -left-[5px] cursor-nwse-resize" },
    { handle: "ne", className: "-top-[5px] -right-[5px] cursor-nesw-resize" },
    { handle: "sw", className: "-bottom-[5px] -left-[5px] cursor-nesw-resize" },
    { handle: "se", className: "-bottom-[5px] -right-[5px] cursor-nwse-resize" },
];

const EDGE_HANDLES: Record<ResizeHandle, string> = {
    nw: "",
    ne: "",
    sw: "",
    se: "",
    n: "left-1/2 -top-[5px] -translate-x-1/2 cursor-ns-resize",
    s: "left-1/2 -bottom-[5px] -translate-x-1/2 cursor-ns-resize",
    w: "top-1/2 -left-[5px] -translate-y-1/2 cursor-ew-resize",
    e: "top-1/2 -right-[5px] -translate-y-1/2 cursor-ew-resize",
};

/**
 * Only the axes the element can actually be resized on get a handle: a `fill`
 * or `auto` dimension is decided by the layout, not by dragging.
 */
export function ResizeHandles({
    element,
    style,
    onMouseDown,
}: {
    element: CanvasElement;
    style: ElementStyle;
    onMouseDown: (
        event: React.MouseEvent,
        handle: ResizeHandle,
        element: CanvasElement,
    ) => void;
}) {
    // `fill` gets handles too: dragging inward is the only way back to an
    // explicit width once an element has been stretched to its container.
    const canWidth = style.widthMode === "fixed" || style.widthMode === "fill";
    const canHeight = style.heightMode === "fixed";
    if (!canWidth && !canHeight) return null;

    const edges = (list: readonly ResizeHandle[]) =>
        list.map((h) => ({ handle: h, className: EDGE_HANDLES[h] }));

    // With both axes free, the corners scale the box (and a text's type with
    // it) while the edge midpoints change one dimension on its own — the
    // arrangement every design tool uses, and the only way to widen something
    // without also making it taller.
    const handles: Array<{ handle: ResizeHandle; className: string }> =
        canWidth && canHeight
            ? [...CORNER_HANDLES, ...edges(["n", "s", "w", "e"])]
            : canWidth
                ? edges(["w", "e"])
                : edges(["n", "s"]);

    return (
        <>
            {handles.map(({ handle, className }) => (
                <button
                    type="button"
                    key={handle}
                    aria-label={`Resize ${handle}`}
                    onMouseDown={(event) => onMouseDown(event, handle, element)}
                    className={`absolute z-[60] h-[10px] w-[10px] rounded-full border-[1.5px] border-ed-accent bg-ed-surface shadow-sm ${className}`}
                />
            ))}
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
                    <div className="grid grid-cols-2 gap-1.5">
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
                                    className="group flex cursor-grab flex-col items-center justify-center gap-2 rounded-xl border border-ed-border bg-ed-surface p-3.5 transition-colors duration-150 hover:border-ed-accent/40 hover:bg-ed-subtle active:cursor-grabbing"
                                >
                                    <span className="pointer-events-none flex size-8 items-center justify-center rounded-lg bg-ed-field text-ed-muted transition-colors group-hover:bg-ed-accent/15 group-hover:text-ed-accent">
                                        <Icon size={20} stroke={1.5} />
                                    </span>
                                    <span className="pointer-events-none text-[10px] font-medium text-ed-muted group-hover:text-ed-text">
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

export function IconsPanel({ search, onInsert }: {
    search: string;
    onInsert: (iconName: CanvasElement["iconName"]) => void;
}) {
    const query = search.trim().toLowerCase();
    const icons = ICON_CATALOG.filter((item) =>
        `${item.name} ${item.value} ${item.category}`.toLowerCase().includes(query),
    );
    const categories = Array.from(new Set(icons.map((item) => item.category)));

    return (
        <div className="flex flex-col gap-4 p-2.5">
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-ed-faint">
                    {query ? `${icons.length} results` : `${ICON_CATALOG.length} icons`}
                </p>
                <span className="rounded-full bg-ed-field px-2 py-0.5 text-[8px] font-semibold text-ed-muted">
                    Tabler
                </span>
            </div>
            {categories.map((category) => (
                <section key={category}>
                    <h3 className="px-1 pb-2 text-[9px] font-semibold uppercase tracking-[.12em] text-ed-faint">
                        {category}
                    </h3>
                    <div className="grid grid-cols-4 gap-1.5">
                        {icons.filter((item) => item.category === category).map(({ name, value, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                title={name}
                                onClick={() => onInsert(value)}
                                className="group flex aspect-square min-w-0 select-none flex-col items-center justify-center gap-1.5 rounded-xl bg-ed-subtle text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-accent"
                            >
                                <Icon size={20} stroke={1.7} />
                                <span className="w-full truncate px-1 text-center text-[7px] text-ed-faint group-hover:text-ed-muted">
                                    {name}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
            {icons.length === 0 && (
                <div className="rounded-2xl bg-ed-subtle px-4 py-10 text-center text-[10px] text-ed-faint">
                    No icons match “{search}”.
                </div>
            )}
        </div>
    );
}

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
}) {
    const [dropTarget, setDropTarget] = useState<{
        id: string;
        placement: "before" | "inside" | "after";
    } | null>(null);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
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
    const rows = (parentId: string | undefined, depth: number): React.ReactNode[] => {
        const siblings = childrenOf(elements, parentId);
        return siblings.flatMap((el, siblingIndex) => {
                // On a page, a component instance is one atomic layer. Its
                // implementation belongs to the component canvas and opens on
                // double-click instead of leaking dozens of internal rows.
                const componentInstance = !componentMode && el.componentRole === "instance";
                const canCollapse = !componentInstance && childrenOf(elements, el.id).length > 0;
                // Searching temporarily expands every branch so a collapsed
                // parent can never hide a matching descendant.
                const collapsed = canCollapse && !query && collapsedIds.has(el.id);
                const nested = componentInstance || collapsed ? [] : rows(el.id, depth + 1);
                // Keep a branch visible when a descendant matches the search.
                if (!matches(el) && nested.length === 0) return [];

                return [
                    <LayerRow
                        key={el.id}
                        element={el}
                        style={resolveStyle(el, breakpoint)}
                        depth={depth}
                        isSelected={selectedIds.includes(el.id)}
                        dropPlacement={dropTarget?.id === el.id ? dropTarget.placement : undefined}
                        nextSiblingId={siblings[siblingIndex + 1]?.id}
                        onSelect={onSelect}
                        onDropTargetChange={setDropTarget}
                        onReparent={onReparent}
                        isComponentInstance={componentInstance}
                        onOpenComponent={onOpenComponent}
                        canCollapse={canCollapse}
                        collapsed={collapsed}
                        onToggleCollapsed={() => setCollapsedIds((current) => {
                            const next = new Set(current);
                            if (next.has(el.id)) next.delete(el.id);
                            else next.add(el.id);
                            return next;
                        })}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
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

    const list = rows(undefined, 0);
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
                                    <motion.div
                                        role="menu"
                                        aria-label={`${displayName(element)} layer actions`}
                                        initial={{ opacity: 0, scale: 0.94, y: -6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                                        transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}
                                        className="absolute flex w-[214px] origin-top-left flex-col rounded-xl border border-ed-border bg-ed-surface/95 p-1.5 shadow-2xl backdrop-blur-md"
                                        style={{ left: layerMenu.x, top: layerMenu.y }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                    >
                                        <p className="truncate px-3 pb-1.5 pt-1 text-[9px] font-semibold text-ed-faint">{displayName(element)}</p>
                                        <MenuItem icon={<IconArrowUp size={14} className="text-ed-muted" />} label="Move up" onClick={() => { onReorder(element.id, "down"); close(); }} />
                                        <MenuItem icon={<IconArrowDown size={14} className="text-ed-muted" />} label="Move down" onClick={() => { onReorder(element.id, "up"); close(); }} />
                                        <div className="mx-1 my-1 h-px bg-ed-field" />
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
                                        <div className="mx-1 my-1 h-px bg-ed-field" />
                                        <MenuItem icon={<IconTrash size={14} className="text-red-400/80" />} label="Delete" shortcut="Del" destructive onClick={() => { onDelete(element.id); close(); }} />
                                    </motion.div>
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

function LayerRow({
    element,
    style,
    depth,
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
    onToggleCollapsed: () => void;
    onContextMenu: (event: React.MouseEvent) => void;
}) {
    const Icon = isComponentInstance ? IconComponents : TYPE_ICONS[element.type];
    const container = !isComponentInstance && isContainer(element.type);

    return (
        // Every row accepts before/after drops. Containers additionally expose
        // a middle zone for nesting, matching the canvas tree structure.
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop surface
        <div
            className={`group relative flex h-8 items-center gap-2 pr-2 text-[11px] transition-colors ${dropPlacement === "inside"
                    ? "bg-[var(--ed-accent-soft)] text-ed-text"
                    : isSelected
                        ? "bg-[var(--ed-accent-soft)] text-ed-text"
                        : "text-ed-muted hover:bg-ed-field hover:text-ed-text"
                }`}
            style={{ paddingLeft: 12 + depth * 14 }}
            onContextMenu={onContextMenu}
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
                        onToggleCollapsed();
                    }}
                    className="flex size-4 shrink-0 items-center justify-center rounded text-ed-faint hover:bg-ed-field-hover hover:text-ed-text"
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
                <Icon size={13} stroke={1.5} className={isComponentInstance ? "text-ed-accent" : undefined} />
                <span
                    className={`flex-1 truncate ${style.hidden ? "text-ed-faint line-through" : ""}`}
                >
                    {displayName(element)}
                </span>
                {Number.isFinite(style.zIndex) && style.zIndex !== 0 && (
                    <span
                        className="shrink-0 rounded-full bg-[var(--ed-accent-soft)] px-1.5 py-0.5 font-mono text-[8px] text-ed-accent"
                        title={`z-index: ${style.zIndex}`}
                    >
                        z{style.zIndex}
                    </span>
                )}
                {isComponentInstance && (
                    <span className="shrink-0 rounded-full bg-[var(--ed-accent-soft)] px-2 py-0.5 text-[8px] font-semibold text-ed-accent">
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
    | { kind: "create"; name: string; slug: string; slugTouched: boolean }
    | { kind: "edit"; id: string; name: string; slug: string }
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
                                    : { kind: "create", name: "", slug: "", slugTouched: false },
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
                {/* A new page is written in the same form a rename uses, in the
                    place the page is about to appear. */}
                {mode.kind === "create" && (
                    <PageForm
                        title="New page"
                        name={mode.name}
                        slug={mode.slug}
                        busy={busy}
                        submitLabel="Create"
                        onName={(name) =>
                            setMode({
                                ...mode,
                                name,
                                // The slug follows the name until the author
                                // takes it over; after that it is theirs.
                                slug: mode.slugTouched ? mode.slug : slugify(name),
                            })
                        }
                        onSlug={(slug) => setMode({ ...mode, slug, slugTouched: true })}
                        onCancel={idle}
                        onSubmit={() => {
                            const name = mode.name.trim();
                            if (!name) return;
                            onCreate(name, slugify(mode.slug) || slugify(name));
                            idle();
                        }}
                    />
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
                                <PageForm
                                    key={page.id}
                                    title={`Editing ${page.name}`}
                                    name={mode.name}
                                    slug={mode.slug}
                                    busy={busy}
                                    lockSlug={isHome}
                                    submitLabel="Save"
                                    onName={(name) => setMode({ ...mode, name })}
                                    onSlug={(slug) => setMode({ ...mode, slug })}
                                    onCancel={idle}
                                    onSubmit={() => {
                                        const name = mode.name.trim();
                                        if (!name) return;
                                        onRename(page.id, name, isHome ? page.slug : slugify(mode.slug));
                                        idle();
                                    }}
                                />
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
                                className={`group flex items-center rounded-lg transition-colors ${isCurrent
                                    ? "bg-ed-accent text-white"
                                    : isNavigating ? "bg-ed-field" : "hover:bg-ed-subtle"
                                    }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onNavigate(page.id)}
                                    disabled={busy || isCurrent}
                                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
                                >
                                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${isCurrent ? "bg-white/20 text-white" : "bg-ed-field text-ed-muted"}`}>
                                        {isHome ? <IconHome size={13} stroke={1.6} /> : <IconFile size={13} stroke={1.6} />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className={`truncate text-[11px] font-semibold ${isCurrent ? "text-white" : "text-ed-text"}`}>{page.name}</span>
                                            {page.published && (
                                                <span className={`size-1.5 shrink-0 rounded-full ${isCurrent ? "bg-white/80" : "bg-emerald-500"}`} title="Published" />
                                            )}
                                        </span>
                                        <span className={`mt-0.5 block truncate font-mono text-[9px] ${isCurrent ? "text-white/70" : "text-ed-faint"}`}>
                                            {isHome ? "/" : `/${page.slug}`}
                                        </span>
                                    </span>
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
                                        label={`Edit ${page.name}`}
                                        onClick={() => setMode({ kind: "edit", id: page.id, name: page.name, slug: page.slug })}
                                    >
                                        <IconPencil size={12} />
                                    </RowAction>
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

/**
 * The one form for naming a page, used by both create and rename.
 *
 * Creating and renaming ask for exactly the same two things, so they are the
 * same form. Previously they were two different shapes in two different places
 * — a name-only strip in the header, and a name-and-slug card inside the row —
 * which is why the slug could only be set after the page already existed.
 */
function PageForm({
    title,
    name,
    slug,
    busy,
    lockSlug,
    submitLabel,
    onName,
    onSlug,
    onCancel,
    onSubmit,
}: {
    title: string;
    name: string;
    slug: string;
    busy: boolean;
    lockSlug?: boolean;
    submitLabel: string;
    onName: (value: string) => void;
    onSlug: (value: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    return (
        <form
            className="mb-1 flex flex-col gap-2 rounded-lg border border-ed-border bg-ed-subtle p-3"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-ed-faint">{title}</p>
            <input
                // biome-ignore lint/a11y/noAutofocus: the form only exists because the author just asked for it
                autoFocus
                type="text"
                value={name}
                aria-label="Page name"
                placeholder="Page name"
                onChange={(event) => onName(event.target.value)}
                className="h-8 rounded-lg bg-ed-field px-2.5 text-[11px] text-ed-text outline-none placeholder:text-ed-faint focus:ring-1 focus:ring-inset focus:ring-ed-accent"
            />
            <label className={`flex h-8 items-center gap-1 rounded-lg bg-ed-field px-2.5 focus-within:ring-1 focus-within:ring-inset focus-within:ring-ed-accent ${lockSlug ? "opacity-55" : ""}`}>
                <span className="font-mono text-[10px] text-ed-faint">/</span>
                <input
                    type="text"
                    value={slug}
                    aria-label="Page URL"
                    placeholder="url-path"
                    disabled={lockSlug}
                    onChange={(event) => onSlug(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[10px] text-ed-text outline-none placeholder:text-ed-faint"
                />
            </label>
            {lockSlug && (
                <p className="text-[9px] leading-relaxed text-ed-faint">
                    The home page is what the site serves at <code className="text-ed-muted">/</code>, so its
                    URL is fixed.
                </p>
            )}
            <div className="flex justify-end gap-1.5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-2.5 py-1.5 text-[10px] text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={busy || !name.trim()}
                    className="rounded-lg bg-ed-accent px-3 py-1.5 text-[10px] font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-35"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
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
    onAskLuma: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className="fixed z-[100] flex min-w-[210px] flex-col rounded-xl border border-ed-border bg-ed-surface/95 p-1.5 shadow-2xl backdrop-blur-md"
            style={{ left: x, top: y }}
        >
            <MenuItem
                icon={<PagieraMark size={14} className="rounded-[4px]" />}
                label="Ask Luma…"
                onClick={onAskLuma}
            />
            <div className="mx-1 my-1 h-px bg-ed-field" />
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
            <div className="mx-1 my-1 h-px bg-ed-field" />
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
            <div className="mx-1 my-1 h-px bg-ed-field" />
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
            <div className="mx-1 my-1 h-px bg-ed-field" />
            <MenuItem
                icon={<IconTrash size={14} className="text-red-400/80" />}
                label="Delete"
                shortcut="Del"
                destructive
                onClick={onDelete}
            />
        </div>
    );
}

function MenuItem({
    icon,
    label,
    shortcut,
    destructive = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    destructive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[11px] font-medium transition-colors ${destructive
                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    : "text-ed-text hover:bg-ed-field-hover hover:text-ed-text"
                }`}
        >
            {icon}
            {label}
            {shortcut && <span className="ml-auto text-[10px] text-ed-faint">{shortcut}</span>}
        </button>
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
                    className="flex items-center gap-1 rounded-full bg-ed-accent px-2.5 py-1 text-[10px] font-semibold text-white shadow-md hover:brightness-110"
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
