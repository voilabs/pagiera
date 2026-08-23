"use client";

import {
    IconArrowDown,
    IconArrowUp,
    IconBox,
    IconChevronRight,
    IconCopy,
    IconCloudDownload,
    IconComponents,
    IconEye,
    IconEyeOff,
    IconExternalLink,
    IconFile,
    IconGridDots,
    IconHandClick,
    IconHome,
    IconHeading,
    IconLock,
    IconLockOpen,
    IconLayoutRows,
    IconPencil,
    IconPhoto,
    IconPlayerPlay,
    IconPlus,
    IconRepeat,
    IconSection,
    IconSearch,
    IconSparkles,
    IconDots,
    IconTrash,
    IconTypography,
    IconVideo,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
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
    Form: IconLayoutRows,
    Input: IconPencil,
    Textarea: IconTypography,
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

    if (element.type === "Input" || element.type === "Textarea") {
        return <span className="pointer-events-none block w-full select-none truncate opacity-65">{element.placeholder || (element.type === "Input" ? "Input" : "Textarea")}</span>;
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
    const canWidth = style.widthMode === "fixed";
    const canHeight = style.heightMode === "fixed";
    if (!canWidth && !canHeight) return null;

    const handles: Array<{ handle: ResizeHandle; className: string }> =
        canWidth && canHeight
            ? CORNER_HANDLES
            : canWidth
                ? (["w", "e"] as const).map((h) => ({ handle: h, className: EDGE_HANDLES[h] }))
                : (["n", "s"] as const).map((h) => ({ handle: h, className: EDGE_HANDLES[h] }));

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
    { title: "Basic", types: ["Heading", "Text", "Image", "Button", "Video"] },
    { title: "Forms", types: ["Form", "Input", "Textarea"] },
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
        <div className="flex flex-col gap-6 p-3.5">
            {groups.map((group) => (
                <div key={group.title}>
                    <h3 className="mb-3 px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ed-faint">
                        {group.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
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
                                    className="pg-chrome-card group relative flex cursor-grab flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-ed-border bg-gradient-to-b from-ed-subtle to-ed-surface p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ed-accent/40 hover:from-ed-field active:scale-[.97] active:cursor-grabbing"
                                >
                                    <span className="pointer-events-none flex size-8 items-center justify-center rounded-xl bg-ed-field text-ed-muted ring-1 ring-inset ring-white/[.03] transition-all group-hover:scale-105 group-hover:bg-ed-accent/15 group-hover:text-ed-accent">
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
        <div className="space-y-5 p-3">
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
                    <div className="mb-2 flex items-center gap-2 px-1">
                        <h3 className="text-[9px] font-semibold uppercase tracking-[.12em] text-ed-faint">
                            {category}
                        </h3>
                        <span className="h-px flex-1 bg-ed-border" />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {icons.filter((item) => item.category === category).map(({ name, value, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                title={name}
                                onClick={() => onInsert(value)}
                                className="group flex aspect-square min-w-0 select-none flex-col items-center justify-center gap-1.5 rounded-xl bg-ed-subtle text-ed-muted transition-all hover:-translate-y-0.5 hover:bg-ed-field hover:text-ed-accent active:scale-95"
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
    onCreate: (name: string) => void;
    onRename: (id: string, name: string, slug: string) => void;
    onDuplicate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (id: string) => void;
    publishedHref: (slug: string) => string;
}) {
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [menuPage, setMenuPage] = useState<string | null>(null);
    const [draft, setDraft] = useState({ name: "", slug: "" });
    const publishedCount = pages.filter((page) => page.published).length;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-ed-border p-3">
                <div className="rounded-2xl bg-ed-subtle p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[12px] font-semibold tracking-[-.02em] text-ed-text">Project pages</p>
                            <p className="mt-1 text-[9px] leading-relaxed text-ed-faint">
                                {pages.length} page{pages.length === 1 ? "" : "s"} · {publishedCount} published
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreating((value) => !value)}
                            aria-expanded={creating}
                            className={`flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold transition-colors ${creating ? "bg-ed-field text-ed-text" : "bg-ed-accent text-white hover:opacity-90"}`}
                        >
                            <IconPlus size={12} className={`transition-transform ${creating ? "rotate-45" : ""}`} />
                            {creating ? "Close" : "New page"}
                        </button>
                    </div>

                    <AnimatePresence initial={false}>
                        {creating && (
                            <motion.form
                                initial={{ height: 0, opacity: 0, y: -4 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -4 }}
                                transition={{ duration: 0.16 }}
                                className="overflow-hidden"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!newName.trim()) return;
                                    onCreate(newName.trim());
                                    setNewName("");
                                    setCreating(false);
                                }}
                            >
                                <div className="mt-3 flex gap-1.5">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newName}
                                        placeholder="Page name"
                                        onChange={(event) => setNewName(event.target.value)}
                                        className="h-8 min-w-0 flex-1 rounded-full bg-ed-field px-3 text-[11px] text-ed-text outline-none placeholder:text-ed-faint focus:ring-1 focus:ring-ed-accent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={busy || !newName.trim()}
                                        className="h-8 rounded-full bg-ed-text px-3 text-[10px] font-semibold text-ed-surface transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-35"
                                    >
                                        Create
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {error && (
                <p className="mx-3 mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[10px] leading-relaxed text-red-400">
                    {error}
                </p>
            )}

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-ed-faint">Pages</span>
                    <span className="rounded-full bg-ed-field px-2 py-0.5 font-mono text-[9px] text-ed-faint">{pages.length}</span>
                </div>
                <motion.div layout className="flex flex-col gap-1.5">
                {pages.map((page) => {
                    const isCurrent = page.id === currentId;
                    const isNavigating = page.id === navigatingId;
                    const isHome = page.slug === "home";
                    const menuOpen = menuPage === page.id;
                    const PageIcon = isHome ? IconHome : IconFile;

                    if (editing === page.id) {
                        return (
                            <motion.form
                                layout
                                key={page.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-2 rounded-2xl bg-ed-subtle p-2.5 ring-1 ring-inset ring-ed-accent/35"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    onRename(page.id, draft.name, draft.slug);
                                    setEditing(null);
                                }}
                            >
                                <input
                                    type="text"
                                    value={draft.name}
                                    aria-label="Page name"
                                    onChange={(e) =>
                                        setDraft((d) => ({ ...d, name: e.target.value }))
                                    }
                                    className="h-8 rounded-full bg-ed-field px-3 text-[11px] text-ed-text outline-none focus:ring-1 focus:ring-ed-accent"
                                />
                                <div className="flex h-8 items-center gap-1.5 rounded-full bg-ed-field px-3">
                                    <span className="text-[10px] text-ed-faint">/</span>
                                    <input
                                        type="text"
                                        value={draft.slug}
                                        aria-label="Page URL slug"
                                        onChange={(e) =>
                                            setDraft((d) => ({ ...d, slug: e.target.value }))
                                        }
                                        className="min-w-0 flex-1 bg-transparent text-[11px] text-ed-text outline-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="rounded-full px-3 py-1.5 text-[10px] text-ed-muted hover:bg-ed-field hover:text-ed-text"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-full bg-ed-accent px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90"
                                    >
                                        Save changes
                                    </button>
                                </div>
                            </motion.form>
                        );
                    }

                    return (
                        <motion.div
                            layout
                            key={page.id}
                            className={`overflow-hidden rounded-2xl transition-colors ${isCurrent
                                    ? "bg-[var(--ed-accent-soft)] ring-1 ring-inset ring-ed-accent/25"
                                    : isNavigating ? "bg-ed-subtle ring-1 ring-inset ring-ed-accent/20" : "bg-ed-subtle/65 hover:bg-ed-subtle"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 p-1.5">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(page.id)}
                                    disabled={busy || isCurrent}
                                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-left"
                                >
                                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? "bg-ed-accent text-white" : "bg-ed-field text-ed-muted"}`}>
                                        <PageIcon size={14} stroke={1.6} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className="truncate text-[11px] font-semibold text-ed-text">{page.name}</span>
                                            {page.published && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" title="Published" />}
                                        </span>
                                        <span className="mt-0.5 block truncate font-mono text-[9px] text-ed-faint">{isHome ? "/" : `/${page.slug}`}</span>
                                    </span>
                                    {isNavigating && (
                                        <motion.span
                                            aria-label="Opening page"
                                            className="mr-1 size-1.5 shrink-0 rounded-full bg-ed-accent"
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                            transition={{ duration: 0.9, repeat: Infinity }}
                                        />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Page actions for ${page.name}`}
                                    aria-expanded={menuOpen}
                                    onClick={() => setMenuPage(menuOpen ? null : page.id)}
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${menuOpen ? "bg-ed-field-hover text-ed-text" : "text-ed-faint hover:bg-ed-field hover:text-ed-text"}`}
                                >
                                    <IconDots size={15} />
                                </button>
                            </div>

                            <AnimatePresence initial={false}>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.14 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-1 border-t border-ed-border/70 px-2 py-1.5">
                                            {!isHome && (
                                                <button type="button" onClick={() => { setDraft({ name: page.name, slug: page.slug }); setEditing(page.id); setMenuPage(null); }} className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[9px] text-ed-muted hover:bg-ed-field hover:text-ed-text">
                                                    <IconPencil size={11} /> Rename
                                                </button>
                                            )}
                                            <button type="button" onClick={() => { onDuplicate(page.id, `${page.name} copy`); setMenuPage(null); }} className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[9px] text-ed-muted hover:bg-ed-field hover:text-ed-text">
                                                <IconCopy size={11} /> Duplicate
                                            </button>
                                            {page.published && (
                                                <a href={publishedHref(page.slug)} target="_blank" rel="noopener noreferrer" aria-label={`Open published ${page.name}`} className="ml-auto flex size-7 items-center justify-center rounded-full text-ed-faint hover:bg-ed-field hover:text-ed-text">
                                                    <IconExternalLink size={11} />
                                                </a>
                                            )}
                                            {!isHome && (
                                                <button type="button" onClick={() => { onDelete(page.id); setMenuPage(null); }} aria-label={`Delete ${page.name}`} className="ml-auto flex size-7 items-center justify-center rounded-full text-ed-faint hover:bg-red-500/10 hover:text-red-400">
                                                    <IconTrash size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
                </motion.div>
            </div>
        </div>
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
    onDelete: () => void;
}) {
    return (
        <div
            className="fixed z-[100] flex min-w-[210px] flex-col rounded-xl border border-ed-border bg-ed-surface/95 p-1.5 shadow-2xl backdrop-blur-md"
            style={{ left: x, top: y }}
        >
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
