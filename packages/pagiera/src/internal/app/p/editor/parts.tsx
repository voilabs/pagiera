"use client";

import {
    IconArrowDown,
    IconArrowUp,
    IconBox,
    IconChevronRight,
    IconCopy,
    IconCloudDownload,
    IconEye,
    IconEyeOff,
    IconFile,
    IconGridDots,
    IconHandClick,
    IconHeart,
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
    IconStar,
    IconArrowRight,
    IconCheck,
    IconMenu2,
    IconTrash,
    IconTypography,
    IconVideo,
    IconWorld,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { resolveStyle } from "@/lib/editor/style";
import { IconGlyph } from "@/lib/editor/icon";
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
    React.ComponentType<{ size?: number; stroke?: number }>
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

const ICON_CHOICES = [
    { name: "Star", value: "star", icon: IconStar },
    { name: "Heart", value: "heart", icon: IconHeart },
    { name: "Arrow right", value: "arrow-right", icon: IconArrowRight },
    { name: "Check", value: "check", icon: IconCheck },
    { name: "Menu", value: "menu", icon: IconMenu2 },
    { name: "Search", value: "search", icon: IconSearch },
] as const;

export function IconsPanel({ search, onInsert }: {
    search: string;
    onInsert: (iconName: CanvasElement["iconName"]) => void;
}) {
    const query = search.trim().toLowerCase();
    const icons = ICON_CHOICES.filter((item) => item.name.toLowerCase().includes(query));
    return <div className="grid grid-cols-3 gap-2 p-3">{icons.map(({ name, value, icon: Icon }) => <button key={value} type="button" title={name} onClick={() => onInsert(value)} className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-ed-border bg-ed-subtle text-ed-muted transition-all hover:-translate-y-0.5 hover:border-ed-accent/50 hover:bg-ed-field hover:text-ed-accent active:scale-95"><Icon size={22} stroke={1.7} /><span className="max-w-full truncate px-1 text-[8px] text-ed-faint group-hover:text-ed-muted">{name}</span></button>)}</div>;
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
}) {
    const [dropTarget, setDropTarget] = useState<string | null>(null);

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

    // Layers are listed top-most first, the reverse of paint order.
    const rows = (parentId: string | undefined, depth: number): React.ReactNode[] =>
        childrenOf(elements, parentId)
            .slice()
            .reverse()
            .flatMap((el) => {
                const nested = rows(el.id, depth + 1);
                // Keep a branch visible when a descendant matches the search.
                if (!matches(el) && nested.length === 0) return [];

                return [
                    <LayerRow
                        key={el.id}
                        element={el}
                        style={resolveStyle(el, breakpoint)}
                        depth={depth}
                        isSelected={selectedIds.includes(el.id)}
                        isDropTarget={dropTarget === el.id}
                        onSelect={onSelect}
                        onToggleHidden={onToggleHidden}
                        onToggleLocked={onToggleLocked}
                        onReorder={onReorder}
                        onDelete={onDelete}
                        onDropTargetChange={setDropTarget}
                        onReparent={onReparent}
                    />,
                    ...nested,
                ];
            });

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
        </div>
    );
}

function LayerRow({
    element,
    style,
    depth,
    isSelected,
    isDropTarget,
    onSelect,
    onToggleHidden,
    onToggleLocked,
    onReorder,
    onDelete,
    onDropTargetChange,
    onReparent,
}: {
    element: CanvasElement;
    style: ElementStyle;
    depth: number;
    isSelected: boolean;
    isDropTarget: boolean;
    onSelect: (id: string, additive: boolean) => void;
    onToggleHidden: (id: string) => void;
    onToggleLocked: (id: string) => void;
    onReorder: (id: string, direction: "up" | "down") => void;
    onDelete: (id: string) => void;
    onDropTargetChange: (id: string | null) => void;
    onReparent: (id: string, parentId: string | undefined, beforeId?: string) => void;
}) {
    const Icon = TYPE_ICONS[element.type];
    const container = isContainer(element.type);

    return (
        // A container row accepts dropped layers; selection and every action
        // live on the buttons inside it.
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop surface
        <div
            className={`group flex h-8 items-center gap-2 pr-2 text-[11px] transition-colors ${isDropTarget
                    ? "bg-emerald-500/20 text-ed-text"
                    : isSelected
                        ? "bg-[var(--ed-accent-soft)] text-ed-text"
                        : "text-ed-muted hover:bg-ed-field hover:text-ed-text"
                }`}
            style={{ paddingLeft: 12 + depth * 14 }}
            onDragOver={
                container
                    ? (event) => {
                        if (!event.dataTransfer.types.includes(MOVE_MIME)) return;
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = "move";
                        onDropTargetChange(element.id);
                    }
                    : undefined
            }
            onDragLeave={container ? () => onDropTargetChange(null) : undefined}
            onDrop={
                container
                    ? (event) => {
                        const id = event.dataTransfer.getData(MOVE_MIME);
                        if (!id) return;
                        event.preventDefault();
                        event.stopPropagation();
                        onReparent(id, element.id);
                        onDropTargetChange(null);
                    }
                    : undefined
            }
        >
            {/* The row's own button selects; the action buttons sit beside it so
                the markup stays valid (buttons cannot nest). */}
            <button
                type="button"
                draggable
                onDragStart={(event) => {
                    event.dataTransfer.setData(MOVE_MIME, element.id);
                    event.dataTransfer.effectAllowed = "move";
                }}
                onClick={(event) => onSelect(element.id, event.shiftKey || event.metaKey)}
                aria-pressed={isSelected}
                className="flex min-w-0 flex-1 cursor-grab items-center gap-2 text-left active:cursor-grabbing"
            >
                <Icon size={13} stroke={1.5} />
                <span
                    className={`flex-1 truncate ${style.hidden ? "text-ed-faint line-through" : ""}`}
                >
                    {displayName(element)}
                </span>
            </button>

            <span className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <LayerAction
                    label="Move up"
                    onClick={() => onReorder(element.id, "up")}
                    icon={<IconArrowUp size={12} />}
                />
                <LayerAction
                    label="Move down"
                    onClick={() => onReorder(element.id, "down")}
                    icon={<IconArrowDown size={12} />}
                />
                <LayerAction
                    label={element.locked ? "Unlock" : "Lock"}
                    onClick={() => onToggleLocked(element.id)}
                    icon={element.locked ? <IconLock size={12} /> : <IconLockOpen size={12} />}
                />
                <LayerAction
                    label="Delete"
                    onClick={() => onDelete(element.id)}
                    icon={<IconTrash size={12} />}
                />
            </span>

            <LayerAction
                label={style.hidden ? "Show" : "Hide"}
                onClick={() => onToggleHidden(element.id)}
                icon={style.hidden ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                className={style.hidden ? "" : "opacity-0 group-hover:opacity-100"}
            />
        </div>
    );
}

function LayerAction({
    label,
    onClick,
    icon,
    className = "",
}: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`rounded p-1 text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text ${className}`}
        >
            {icon}
        </button>
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
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState({ name: "", slug: "" });

    return (
        <div className="flex flex-col gap-3 p-3">
            <form
                className="flex gap-1"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!newName.trim()) return;
                    onCreate(newName.trim());
                    setNewName("");
                }}
            >
                <input
                    type="text"
                    value={newName}
                    placeholder="New page name"
                    onChange={(event) => setNewName(event.target.value)}
                    className="min-w-0 flex-1 rounded border border-ed-border bg-ed-surface px-2 py-1.5 text-xs text-ed-text outline-none placeholder:text-ed-faint focus:border-ed-accent/50 focus:ring-1 focus:ring-blue-500/20"
                />
                <button
                    type="submit"
                    disabled={busy || !newName.trim()}
                    className="rounded bg-ed-accent px-2 text-ed-text transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                    <IconPlus size={14} />
                </button>
            </form>

            {error && (
                <p className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-300">
                    {error}
                </p>
            )}

            <div className="flex flex-col gap-1">
                {pages.map((page) => {
                    const isCurrent = page.id === currentId;

                    if (editing === page.id) {
                        return (
                            <form
                                key={page.id}
                                className="flex flex-col gap-1 rounded border border-ed-accent/40 bg-black/30 p-2"
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
                                    className="rounded bg-ed-surface px-2 py-1 text-xs text-ed-text outline-none"
                                />
                                <div className="flex items-center gap-1 rounded bg-ed-surface px-2 py-1">
                                    <span className="max-w-24 truncate text-[10px] text-ed-faint">
                                        {publishedHref("").replace(/\/$/, "") || "/"}
                                    </span>
                                    <input
                                        type="text"
                                        value={draft.slug}
                                        aria-label="Page URL slug"
                                        onChange={(e) =>
                                            setDraft((d) => ({ ...d, slug: e.target.value }))
                                        }
                                        className="min-w-0 flex-1 bg-transparent text-xs text-ed-text outline-none"
                                    />
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="submit"
                                        className="flex-1 rounded bg-ed-accent py-1 text-[10px] text-ed-text hover:opacity-90"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="flex-1 rounded bg-ed-field py-1 text-[10px] text-ed-muted hover:text-ed-text"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        );
                    }

                    return (
                        <div
                            key={page.id}
                            className={`group flex items-center gap-1.5 rounded px-2 py-1.5 transition-colors ${isCurrent
                                    ? "bg-[var(--ed-accent-soft)] text-ed-text"
                                    : "text-ed-muted hover:bg-ed-field"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => onNavigate(page.id)}
                                className="flex min-w-0 flex-1 items-center gap-2"
                            >
                                <IconFile size={13} stroke={1.5} />
                                <span className="min-w-0 flex-1 truncate text-[11px] text-left">
                                    {page.name}
                                </span>
                                {page.published && (
                                    <IconWorld
                                        size={11}
                                        className="shrink-0 text-emerald-500"
                                        title="Published"
                                    />
                                )}
                            </button>
                            <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                {page.slug !== "home" && <LayerAction
                                    label="Rename"
                                    onClick={() => {
                                        setDraft({ name: page.name, slug: page.slug });
                                        setEditing(page.id);
                                    }}
                                    icon={<IconPencil size={12} />}
                                />}
                                <LayerAction
                                    label="Duplicate"
                                    onClick={() => onDuplicate(page.id, `${page.name} copy`)}
                                    icon={<IconCopy size={12} />}
                                />
                                {page.slug !== "home" && <LayerAction
                                    label="Delete"
                                    onClick={() => onDelete(page.id)}
                                    icon={<IconTrash size={12} />}
                                />}
                            </span>
                        </div>
                    );
                })}
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
