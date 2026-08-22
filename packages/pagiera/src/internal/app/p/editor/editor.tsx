"use client";

import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconArrowsMaximize,
    IconCommand,
    IconComponents,
    IconCopy,
    IconChevronLeft,
    IconChevronRight,
    IconDatabase,
    IconExternalLink,
    IconFocusCentered,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarRightCollapse,
    IconMinus,
    IconPlayerPlay,
    IconPlus,
    IconPointer,
    IconSearch,
    IconSparkles,
    IconTrash,
    IconWorld,
    IconLayersLinked,
    IconLayoutColumns,
    IconBox,
    IconFile,
    IconLibrary,
    IconIcons,
    IconMoon,
    IconPalette,
    IconPin,
    IconPinFilled,
    IconSun,
    IconTemplate,
    IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { alignElements, distributeElements } from "@/lib/editor/arrange";
import { baseOf, cascadeOf } from "@/lib/editor/cascade";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import { bindElement, type Row, rowsFor } from "@/lib/render/bind";
import { resolveFont } from "@/lib/render/css";
import { createNocturneShowcase } from "@/lib/editor/showcase";
import type { SiteTemplateId } from "@/lib/editor/site-templates";
import { type Guide, snapPosition } from "@/lib/editor/snap";
import {
    applyStyle,
    applyStyleIsolated,
    clearOverrides,
    isBand,
    resolveStyle,
    rootStyleToCss,
    splitBand,
    styleToCss,
} from "@/lib/editor/style";
import {
    absolutePosition,
    childrenOf,
    cloneSubtree,
    containerAt,
    createElement,
    indexById,
    isNote,
    nextZ,
    removeSubtree,
    reorder,
    reparent,
    subtreeIds,
    wrapInContainer,
} from "@/lib/editor/tree";
import {
    DEFAULT_BREAKPOINTS,
    type Breakpoint,
    type BreakpointDefinition,
    type CanvasElement,
    type DataSource,
    DRAG_MIME,
    type ElementStyle,
    type ElementType,
    isContainer,
    isTextual,
    MOVE_MIME,
    type ResizeHandle,
    type RootStyle,
    STYLE_KEYS,
    type StyleKey,
} from "@/lib/editor/types";
import { Inspector, MultiSelectPanel, PageInspector } from "./inspector";
import { DataPanel, type SourceSample } from "./data-panel";
import type { SourcePreviewer } from "./data-modal";
import { type LibraryPage, type LibraryPick, LibraryPanel } from "./library";
import {
    Breadcrumbs,
    ContextMenu,
    ElementBody,
    ElementsPanel,
    IconsPanel,
    LayersPanel,
    type PageEntry,
    PagesPanel,
    ResizeHandles,
    SaveIndicator,
} from "./parts";
import { useCanvasView } from "./use-canvas-view";
import { useEditorDocument } from "./use-editor";
import { AiPanel, type AiDesignGenerator } from "./ai-panel";
import { VariablesPanel } from "./variables-panel";
import { TemplatesPanel } from "./templates-panel";

const MIN_SIZE = 10;
const COMPONENT_MIME = "application/pagiera-component";

export type EditorPage = {
    id: string;
    name: string;
    slug: string;
    version: number;
    elements: CanvasElement[];
    rootStyle: RootStyle;
    dataSources: DataSource[];
    publishedAt: string | null;
};

export type EditorAdapters = {
    save?: Parameters<typeof useEditorDocument>[0]["saveDocument"];
    generate?: AiDesignGenerator;
    createPage?: (name: string, slug: string) => Promise<PageMutationResult>;
    renamePage?: (id: string, name: string, slug: string) => Promise<PageMutationResult>;
    duplicatePage?: (id: string, name: string, slug: string) => Promise<PageMutationResult>;
    deletePage?: (id: string) => Promise<PageMutationResult>;
    installTemplate?: (id: SiteTemplateId) => Promise<PageMutationResult>;
    publishPage?: (id: string) => Promise<PageMutationResult>;
    unpublishPage?: (id: string, slug: string) => Promise<PageMutationResult>;
    navigate?: (pageId: string, options?: { replace?: boolean }) => void | Promise<void>;
    refresh?: () => void;
    previewHref?: (pageId: string) => string;
    publishedHref?: (slug: string) => string;
    previewSource?: SourcePreviewer;
};

const defaultEditorHref = (pageId: string) => `/editor/${encodeURIComponent(pageId)}`;
const defaultPublishedHref = (slug: string) => slug === "home" || slug === "" ? "/" : `/${slug.split("/").map((part) => part.startsWith(":") ? part : encodeURIComponent(part)).join("/")}`;

export type PageMutationResult =
    | { status: "ok"; pageId?: string; slug?: string }
    | { status: "error"; message: string };

const unavailable = async (): Promise<PageMutationResult> => ({
    status: "error",
    message: "This editor action has no host adapter.",
});

type DragInfo = {
    id: string;
    breakpoint: Breakpoint;
    /** `free` moves by x/y; `reflow` only reparents, the layout owns position. */
    mode: "free" | "reflow";
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
};

type ResizeInfo = {
    id: string;
    breakpoint: Breakpoint;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
};

type Clipboard = { elements: CanvasElement[]; rootId: string };

export default function Editor({
    page,
    pages,
    library,
    adapters,
}: {
    page: EditorPage;
    pages: PageEntry[];
    library: LibraryPage[];
    adapters?: EditorAdapters;
}) {
    const [isPending, startTransition] = useTransition();

    const {
        elements,
        rootStyle,
        dataSources,
        setElements,
        setRootStyle,
        setDataSources,
        beginTransaction,
        endTransaction,
        undo,
        redo,
        canUndo,
        canRedo,
        saveStatus,
        saveError,
        isDirty,
        saveNow,
    } = useEditorDocument({
        pageId: page.id,
        initialDocument: {
            elements: page.elements,
            rootStyle: page.rootStyle,
            dataSources: page.dataSources,
        },
        initialVersion: page.version,
        saveDocument: useCallback(
            (pageId, document, expectedVersion) =>
                adapters?.save?.(pageId, document, expectedVersion) ??
                Promise.resolve({ status: "error" as const, message: "No persistence adapter configured." }),
            [adapters?.save],
        ),
    });

    /** Editor chrome theme; the palette itself lives in globals.css. */
    const [chromeTheme, setChromeTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const stored = localStorage.getItem("pagiera:editor-theme");
        if (stored === "dark" || stored === "light") setChromeTheme(stored);
    }, []);

    const toggleChromeTheme = useCallback(() => {
        setChromeTheme((current) => {
            const next = current === "dark" ? "light" : "dark";
            try {
                localStorage.setItem("pagiera:editor-theme", next);
            } catch {
                // A private-mode storage failure must not block the toggle.
            }
            return next;
        });
    }, []);

    const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
    const [breakpointPanel, setBreakpointPanel] = useState(false);
    const componentMode = rootStyle.documentMode === "component";
    const componentMasters = elements.filter((element) => element.componentRole === "master");
    const [activeComponentMasterId, setActiveComponentMasterId] = useState<string | null>(null);
    const activeComponentMaster = componentMasters.find((element) => element.id === activeComponentMasterId) ?? componentMasters[0];
    const activeComponentVariants = activeComponentMaster
        ? componentMasters.filter((element) => element.componentId === activeComponentMaster.componentId)
        : [];
    const breakpointDefs = rootStyle.breakpoints?.length
        ? rootStyle.breakpoints
        : DEFAULT_BREAKPOINTS;
    const cascade = useMemo(
        () => cascadeOf(rootStyle.breakpoints, rootStyle.baseBreakpointId),
        [rootStyle.breakpoints, rootStyle.baseBreakpointId],
    );
    const selectedBreakpoint =
        breakpointDefs.find((item) => item.id === breakpoint) ?? breakpointDefs[0];
    const frameWidthForBreakpoint = selectedBreakpoint.width;

    const frames = useMemo<Array<{ bp: Breakpoint; width: number }>>(
        () => componentMode ? [{ bp: "desktop", width: Math.max(1, activeComponentMaster?.base.w ?? 320) }] : breakpointDefs.map((item) => ({ bp: item.id, width: item.width })),
        [activeComponentMaster?.base.w, breakpointDefs, componentMode],
    );

    /** Widest frame on screen; the zoom fits against this. */
    const fitWidth = Math.max(320, frames.reduce((total, frame) => total + frame.width, 0) + Math.max(0, frames.length - 1) * 40);

    const {
        viewportRef,
        frameRef,
        zoom,
        scale,
        zoomTo,
        stepZoom,
        zoomToFit,
        spaceHeld,
        isPanning,
        tryBeginPan,
        recenter,
    } = useCanvasView(fitWidth);

    const [leftTab, setLeftTab] = useState("Layers");
    const [rightTab, setRightTab] = useState<"Design" | "Content" | "Hover" | "Interact">("Design");
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [search, setSearch] = useState("");

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [hoveredEffectId, setHoveredEffectId] = useState<string | null>(null);
    const [pressedEffectId, setPressedEffectId] = useState<string | null>(null);
    const [effectsPreview, setEffectsPreview] = useState(false);
    const [previewVisibility, setPreviewVisibility] = useState<Record<string, boolean>>({});
    const [marquee, setMarquee] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    const [codeComposerOpen, setCodeComposerOpen] = useState(false);
    const [codeComponentName, setCodeComponentName] = useState("Code Component");
    const [codeComponentSource, setCodeComponentSource] = useState('<style>body{margin:0;font-family:system-ui;display:grid;place-items:center;height:100vh}button{border:0;border-radius:12px;padding:14px 22px;background:#4f8cff;color:white;font-weight:600}</style><button>Button</button>');
    const [draggedBreakpointId, setDraggedBreakpointId] = useState<string | null>(null);
    const [editingBreakpointId, setEditingBreakpointId] = useState<string | null>(null);
    const marqueePageRef = useRef<HTMLElement | null>(null);
    const marqueeBaseRef = useRef<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        elementId?: string;
        canvasX?: number;
        canvasY?: number;
    } | null>(null);

    const updateBreakpoints = (next: BreakpointDefinition[]) =>
        setRootStyle({
            ...rootStyle,
            breakpoints: next,
            // Keep the current base unless it was the artboard just removed.
            baseBreakpointId: next.some((item) => item.id === cascade.baseId)
                ? cascade.baseId
                : baseOf(cascadeOf(next, undefined)).id,
        });

    /**
     * Moving the base moves where shared values live: the old base's values are
     * already in `element.base`, so the new base needs its own overrides folded
     * in and the old base needs an override carrying what it used to show.
     */
    const setBaseBreakpoint = (nextBaseId: string) => {
        if (nextBaseId === cascade.baseId) return;
        const nextCascade = cascadeOf(breakpointDefs, nextBaseId);

        setElements((els) =>
            els.map((el) => {
                // What each artboard shows today, before anything moves.
                const before = new Map(
                    breakpointDefs.map((bp) => [bp.id, resolveStyle(el, bp.id, cascade)]),
                );

                const base = before.get(nextBaseId);
                if (!base) return el;

                const overrides: CanvasElement["overrides"] = {};
                for (const bp of breakpointDefs) {
                    if (bp.id === nextBaseId) continue;
                    const effective = before.get(bp.id);
                    if (!effective) continue;

                    // Keep only what actually differs from the new base, so the
                    // stored deltas stay meaningful rather than full copies.
                    const delta: Partial<ElementStyle> = {};
                    for (const key of STYLE_KEYS) {
                        if (effective[key] !== base[key]) {
                            delta[key] = effective[key] as never;
                        }
                    }
                    if (Object.keys(delta).length > 0) overrides[bp.id] = delta;
                }

                return {
                    ...el,
                    base,
                    overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
                };
            }),
        );

        setRootStyle({ ...rootStyle, baseBreakpointId: nextCascade.baseId });
    };

    const addBreakpoint = () => {
        const id = `bp-${Date.now().toString(36)}`;
        const width = Math.max(240, selectedBreakpoint.width - 160);
        updateBreakpoints([
            ...breakpointDefs,
            { id, name: `Breakpoint ${breakpointDefs.length + 1}`, width },
        ]);
        setBreakpoint(id);
    };

    const moveBreakpoint = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        const next = [...breakpointDefs];
        const from = next.findIndex((item) => item.id === sourceId);
        const to = next.findIndex((item) => item.id === targetId);
        if (from < 0 || to < 0) return;
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        updateBreakpoints(next);
    };

    const renameBreakpoint = (id: string, name: string) => {
        updateBreakpoints(
            breakpointDefs.map((item) =>
                item.id === id ? { ...item, name: name.slice(0, 40) } : item,
            ),
        );
    };

    const commitBreakpointName = (id: string) => {
        const item = breakpointDefs.find((entry) => entry.id === id);
        if (item && !item.name.trim()) renameBreakpoint(id, "Breakpoint");
    };

    const resizeBreakpoint = (id: string, width: number) => {
        const clamped = Math.round(Math.max(240, Math.min(3840, width)));
        if (!Number.isFinite(clamped)) return;
        updateBreakpoints(
            breakpointDefs.map((item) =>
                item.id === id ? { ...item, width: clamped } : item,
            ),
        );
    };

    const removeBreakpoint = (id: string) => {
        if (breakpointDefs.length < 2) return;
        const next = breakpointDefs.filter((item) => item.id !== id);
        // Drop the artboard's stored deltas too, otherwise they linger invisibly
        // and reappear if a breakpoint is later added back under the same id.
        setElements((els) =>
            els.map((el) => {
                if (!el.overrides?.[id]) return el;
                const overrides = { ...el.overrides };
                delete overrides[id];
                return {
                    ...el,
                    overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
                };
            }),
        );
        updateBreakpoints(next);
        if (breakpoint === id) setBreakpoint(next[0].id);
    };

    /** What window widths an artboard actually governs on the published page. */
    const breakpointRange = (id: string) => {
        const item = breakpointDefs.find((entry) => entry.id === id);
        if (!item) return "";
        const ceiling = breakpointDefs
            .filter((other) => other.width > item.width)
            .reduce(
                (lowest, other) => Math.min(lowest, other.width),
                Number.POSITIVE_INFINITY,
            );
        return Number.isFinite(ceiling)
            ? `${item.width} — ${ceiling - 1}`
            : `${item.width}+`;
    };

    const beginCanvasResize = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const startY = event.clientY;
        const initial = canvasHeight;
        const move = (pointer: MouseEvent) => {
            const height = Math.round(Math.max(1, Math.min(12000, initial + (pointer.clientY - startY) / scale)));
            setCanvasHeight(height);
            if (componentMode && activeComponentMaster) setElements((current) => current.map((element) => element.id === activeComponentMaster.id ? { ...element, base: { ...element.base, h: height, heightMode: "fixed" } } : element));
        };
        const up = (pointer: MouseEvent) => {
            const height = Math.round(Math.max(1, Math.min(12000, initial + (pointer.clientY - startY) / scale)));
            setCanvasHeight(height);
            setRootStyle({ ...rootStyle, canvasHeight: height });
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const beginComponentWidthResize = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const initial = activeComponentMaster?.base.w ?? 320;
        const move = (pointer: MouseEvent) => {
            const width = Math.round(Math.max(1, Math.min(4000, initial + (pointer.clientX - startX) / scale)));
            if (activeComponentMaster) setElements((current) => current.map((element) => element.id === activeComponentMaster.id ? { ...element, base: { ...element.base, w: width, widthMode: "fixed" } } : element));
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const applyAiPlan = (plan: AiDesignPlan) => {
        const pagePatch = plan.operations
            .filter((operation) => operation.kind === "page")
            .reduce<Partial<RootStyle>>(
                (patch, operation) => ({ ...patch, ...operation.style }),
                {},
            );
        if (Object.keys(pagePatch).length) setRootStyle(pagePatch);

        setElements((current) => {
            let next = [...current];
            const refs = new Map<string, string>();
            const addedIds = new Set<string>();
            for (const operation of plan.operations) {
                if (operation.kind === "page") continue;
                if (operation.kind === "remove") {
                    if (next.some((element) => element.id === operation.id))
                        next = removeSubtree(next, operation.id);
                    continue;
                }
                if (operation.kind === "add") {
                    const parentId = operation.parentId
                        ? refs.get(operation.parentId) ?? operation.parentId
                        : undefined;
                    const created = createElement(operation.type, {
                        x: operation.style?.x ?? 0,
                        y: operation.style?.y ?? 0,
                        z: nextZ(next, parentId),
                        parentId,
                    });
                    created.base = { ...created.base, ...operation.style };
                    created.overrides = {
                        ...(operation.tabletStyle
                            ? { tablet: operation.tabletStyle }
                            : {}),
                        ...(operation.mobileStyle
                            ? { mobile: operation.mobileStyle }
                            : {}),
                    };
                    if (operation.hoverStyle) created.hover = operation.hoverStyle;
                    if (operation.pressStyle) created.press = operation.pressStyle;
                    if (operation.loop) created.loop = operation.loop;
                    if (operation.draggable !== undefined) created.draggable = operation.draggable;
                    if (operation.styleBindings) created.styleBindings = operation.styleBindings;
                    if (operation.interaction) created.interaction = {
                        ...operation.interaction,
                        value: operation.interaction.action === "navigate"
                            ? operation.interaction.value
                            : refs.get(operation.interaction.value) ?? operation.interaction.value,
                    };
                    if (operation.content !== undefined) created.content = operation.content;
                    if (operation.src !== undefined) created.src = operation.src;
                    if (operation.href !== undefined) created.href = operation.href;
                    refs.set(operation.ref, created.id);
                    addedIds.add(created.id);
                    next.push(created);
                    continue;
                }
                next = next.map((element) => {
                    if (element.id !== operation.id) return element;
                    const updated = operation.style
                        ? applyStyle(element, cascade.baseId, operation.style, cascade)
                        : element;
                    return {
                        ...updated,
                        overrides: {
                            ...updated.overrides,
                            ...(operation.tabletStyle
                                ? {
                                      tablet: {
                                          ...updated.overrides?.tablet,
                                          ...operation.tabletStyle,
                                      },
                                  }
                                : {}),
                            ...(operation.mobileStyle
                                ? {
                                      mobile: {
                                          ...updated.overrides?.mobile,
                                          ...operation.mobileStyle,
                                      },
                                  }
                                : {}),
                        },
                        hover: operation.hoverStyle
                            ? { ...updated.hover, ...operation.hoverStyle }
                            : updated.hover,
                        press: operation.pressStyle
                            ? { ...updated.press, ...operation.pressStyle }
                            : updated.press,
                        loop: operation.loop ?? updated.loop,
                        draggable: operation.draggable ?? updated.draggable,
                        styleBindings: operation.styleBindings
                            ? { ...updated.styleBindings, ...operation.styleBindings }
                            : updated.styleBindings,
                        interaction: operation.interaction ? {
                            ...operation.interaction,
                            value: operation.interaction.action === "navigate"
                                ? operation.interaction.value
                                : refs.get(operation.interaction.value) ?? operation.interaction.value,
                        } : updated.interaction,
                        ...(operation.content !== undefined
                            ? { content: operation.content }
                            : {}),
                        ...(operation.src !== undefined ? { src: operation.src } : {}),
                        ...(operation.href !== undefined ? { href: operation.href } : {}),
                    };
                });
            }
            const generatedById = new Map(next.map((element) => [element.id, element]));
            return next.map((element) => {
                if (!addedIds.has(element.id)) return element;
                const parent = element.parentId
                    ? generatedById.get(element.parentId)
                    : undefined;
                const parentStyle = parent?.base;
                const hasChildren = next.some((child) => child.parentId === element.id);
                const base = { ...element.base };

                // Keep generated compositions in the flow. Absolute children
                // and fixed section heights are the main source of overlaps
                // and fake-looking AI pages.
                if (element.type === "Section") {
                    base.widthMode = "fill";
                    base.heightMode = "auto";
                    if (hasChildren) base.layout = "stack";
                }
                if (
                    hasChildren &&
                    ["Frame", "Stack", "Container", "Grid", "Request", "Repeat"].includes(
                        element.type,
                    ) &&
                    base.layout === "absolute"
                ) {
                    base.layout = "stack";
                }
                if (["Heading", "Text", "Button"].includes(element.type)) {
                    base.heightMode = "auto";
                }
                if (element.type === "Button") {
                    base.layout = "stack";
                    base.justify = "center";
                    base.align = "center";
                    if (parentStyle?.align === "center" && base.widthMode === "fill")
                        base.widthMode = "auto";
                }
                return { ...element, base };
            });
        });
    };

    const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
    const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null);
    const [guides, setGuides] = useState<{
        origin: { x: number; y: number };
        lines: Guide[];
    }>({ origin: { x: 0, y: 0 }, lines: [] });
    const [ghost, setGhost] = useState<{ dx: number; dy: number } | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null | undefined>(
        undefined,
    );
    const [clipboard, setClipboard] = useState<Clipboard | null>(null);
    /** Rows fetched by the Data panel, used to preview Repeat blocks. */
    const [samples, setSamples] = useState<Record<string, SourceSample>>({});

    useEffect(() => {
        // Page-local state must not leak into the next document. Chrome state
        // such as leftTab/rightTab intentionally remains untouched.
        setSelectedIds([]);
        setEditingId(null);
        setHoveredEffectId(null);
        setPressedEffectId(null);
        setPreviewVisibility({});
        setSamples({});
        setContextMenu(null);
    }, [page.id]);
    const [pageError, setPageError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasHeight, setCanvasHeight] = useState(rootStyle.canvasHeight);
    const [contentHeight, setContentHeight] = useState(rootStyle.canvasHeight);
    const displayCanvasHeight = Math.max(canvasHeight, contentHeight);

    const byId = useMemo(() => indexById(elements), [elements]);
    const componentAssetIds = useMemo(() => {
        const ids = new Set<string>();
        for (const master of elements.filter((element) => element.componentRole === "master")) for (const id of subtreeIds(elements, master.id)) ids.add(id);
        return ids;
    }, [elements]);
    const activeComponentIds = useMemo(
        () => activeComponentMaster ? subtreeIds(elements, activeComponentMaster.id) : new Set<string>(),
        [activeComponentMaster, elements],
    );
    const visibleEditorElements = useMemo(() => elements.filter((element) => componentMode ? activeComponentIds.has(element.id) : !componentAssetIds.has(element.id)), [activeComponentIds, componentAssetIds, componentMode, elements]);
    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const selectedElement = selectedId ? byId.get(selectedId) : undefined;
    const deviceWidth = frameWidthForBreakpoint;
    const frameWidth = rootStyle.fullWidth
        ? deviceWidth
        : Math.min(deviceWidth, rootStyle.maxWidth);

    useEffect(() => setCanvasHeight(rootStyle.canvasHeight), [rootStyle.canvasHeight]);
    useEffect(() => {
        if (!componentMode || !activeComponentMaster) return;
        setCanvasHeight(Math.max(1, activeComponentMaster.base.h));
        setContentHeight(Math.max(1, activeComponentMaster.base.h));
    }, [activeComponentMaster?.base.h, activeComponentMaster?.id, componentMode]);
    useEffect(() => {
        const node = canvasRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => setContentHeight(Math.ceil(entry.contentRect.height)));
        observer.observe(node);
        return () => observer.disconnect();
    }, [breakpoint, componentMode]);

    /** How the parent of `element` arranges its children at this breakpoint. */
    const contextFor = useCallback(
        (element: CanvasElement, bp: Breakpoint = breakpoint) => {
            const parent = element.parentId ? byId.get(element.parentId) : undefined;
            const parentStyle = parent ? resolveStyle(parent, bp, cascade) : undefined;
            return {
                parentLayout: parentStyle?.layout ?? rootStyle.layout,
                parentDirection: parentStyle?.direction ?? rootStyle.direction,
            };
        },
        [byId, breakpoint, rootStyle.direction, rootStyle.layout],
    );

    /* ---------------------------------------------------------------- edits */

    const patchStyle = useCallback(
        (ids: string[], patch: Partial<ElementStyle>) => {
            setElements((els) =>
                els.map((el) =>
                    ids.includes(el.id) ? applyStyleIsolated(el, breakpoint, patch, breakpointDefs.map((definition) => definition.id), cascade) : el,
                ),
            );
        },
        [breakpoint, breakpointDefs, cascade, setElements],
    );

    const patchProps = useCallback(
        (id: string, patch: Partial<CanvasElement>) => {
            setElements((els) =>
                els.map((el) => (el.id === id ? { ...el, ...patch } : el)),
            );
        },
        [setElements],
    );

    const resetOverrides = useCallback(
        (ids: string[], keys: StyleKey[]) => {
            setElements((els) =>
                els.map((el) =>
                    ids.includes(el.id) ? clearOverrides(el, breakpoint, keys, cascade) : el,
                ),
            );
        },
        [breakpoint, cascade, setElements],
    );

    const deleteElements = useCallback(
        (ids: string[]) => {
            // Children live inside their parent, so they have to go with it.
            const doomed = new Set<string>();
            for (const id of ids) {
                for (const sub of subtreeIds(elements, id)) doomed.add(sub);
            }
            setElements((els) =>
                ids.reduce((acc, id) => removeSubtree(acc, id), els),
            );
            setSelectedIds((current) => current.filter((id) => !doomed.has(id)));
            setEditingId((current) => (current && doomed.has(current) ? null : current));
            setContextMenu(null);
        },
        [elements, setElements],
    );

    const duplicateElements = useCallback(
        (ids: string[]) => {
            const additions: CanvasElement[] = [];
            const roots: string[] = [];
            for (const id of ids) {
                const clone = cloneSubtree(elements, id);
                if (!clone) continue;
                additions.push(...clone.elements);
                roots.push(clone.rootId);
            }
            if (additions.length === 0) return;
            setElements((els) => [...els, ...additions]);
            setSelectedIds(roots);
            setContextMenu(null);
        },
        [elements, setElements],
    );

    const copyElements = useCallback(
        (ids: string[]) => {
            if (ids.length === 0) return;
            const wanted = new Set<string>();
            for (const id of ids) {
                for (const sub of subtreeIds(elements, id)) wanted.add(sub);
            }
            setClipboard({
                elements: elements.filter((el) => wanted.has(el.id)),
                rootId: ids[0],
            });
        },
        [elements],
    );

    const pasteClipboard = useCallback(() => {
        if (!clipboard) return;
        const clone = cloneSubtree(clipboard.elements, clipboard.rootId);
        if (!clone) return;

        // Paste into the selection when it can hold children, otherwise beside it.
        const anchor = selectedId ? byId.get(selectedId) : undefined;
        const parentId = anchor
            ? isContainer(anchor.type)
                ? anchor.id
                : anchor.parentId
            : undefined;
        const z = nextZ(elements, parentId);

        setElements((els) => [
            ...els,
            ...clone.elements.map((el) =>
                el.id === clone.rootId ? { ...el, parentId, z } : el,
            ),
        ]);
        setSelectedIds([clone.rootId]);
    }, [byId, clipboard, elements, selectedId, setElements]);

    const insertFromLibrary = useCallback(
        (pick: LibraryPick) => {
            const clone = cloneSubtree(pick.elements, pick.rootId, { x: 0, y: 0 });
            if (!clone) return;

            // Drop it into the selected container when there is one, so a block
            // can be nested rather than always landing at the page root.
            const anchor = selectedId ? byId.get(selectedId) : undefined;
            const parentId = anchor && isContainer(anchor.type) ? anchor.id : undefined;
            const z = nextZ(elements, parentId);

            setElements((els) => [
                ...els,
                ...clone.elements.map((el) =>
                    el.id === clone.rootId ? { ...el, parentId, z } : el,
                ),
            ]);
            setSelectedIds([clone.rootId]);
        },
        [byId, elements, selectedId, setElements],
    );

    const insertElement = useCallback(
        (type: ElementType, props?: Partial<CanvasElement>) => {
            const anchor = selectedId ? byId.get(selectedId) : undefined;
            const parentId = anchor && isContainer(anchor.type) ? anchor.id : undefined;
            const element = createElement(type, {
                x: 32,
                y: 32,
                z: nextZ(elements, parentId),
                parentId,
            });
            Object.assign(element, props);
            setElements((current) => [...current, element]);
            setSelectedIds([element.id]);
        },
        [byId, elements, selectedId, setElements],
    );

    const createCodeComponent = () => {
        const master = createElement("Frame", { x: 0, y: 0, z: nextZ(elements) });
        master.name = codeComponentName.trim() || "Code Component";
        master.code = codeComponentSource;
        master.componentRole = "master";
        master.componentId = master.id;
        master.componentSourceId = master.id;
        master.variant = "Default";
        master.base = { ...master.base, w: 360, h: 220, widthMode: "fixed", heightMode: "fixed", overflow: "hidden", bg: "#ffffff", radius: 16 };
        setElements((current) => [...current, master]);
        setRootStyle({ ...rootStyle, documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setLeftTab("Components");
        setCodeComposerOpen(false);
    };

    const createBlankComponent = () => {
        const master = createElement("Frame", { x: 0, y: 0, z: nextZ(elements) });
        master.name = `Component ${componentMasters.length + 1}`;
        master.componentRole = "master";
        master.componentId = master.id;
        master.componentSourceId = master.id;
        master.variant = "Default";
        master.base = { ...master.base, w: 320, h: 180, widthMode: "fixed", heightMode: "fixed", layout: "absolute", bg: "#ffffff", radius: 16, overflow: "hidden" };
        setElements((current) => [...current, master]);
        setRootStyle({ ...rootStyle, documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setBreakpoint("desktop");
        setLeftTab("Components");
    };

    const createComponentInstance = useCallback(() => {
        if (!selectedElement?.componentId || selectedElement.componentRole !== "master")
            return;
        const clone = cloneSubtree(elements, selectedElement.id, { x: 32, y: 32 });
        if (!clone) return;
        const copies = clone.elements.map((element) => ({
            ...element,
            componentRole: element.id === clone.rootId ? ("instance" as const) : undefined,
            componentId: selectedElement.componentId,
            variant: element.id === clone.rootId ? selectedElement.variant : undefined,
        }));
        setElements((current) => [...current, ...copies]);
        setSelectedIds([clone.rootId]);
    }, [elements, selectedElement, setElements]);

    const createComponentVariant = useCallback(() => {
        if (!selectedElement?.componentId || selectedElement.componentRole !== "master")
            return;
        const siblings = elements.filter(
            (element) =>
                element.componentRole === "master" &&
                element.componentId === selectedElement.componentId,
        );
        const clone = cloneSubtree(elements, selectedElement.id, { x: 0, y: 0 });
        if (!clone) return;
        const copies = clone.elements.map((element) => ({
            ...element,
            componentRole: element.id === clone.rootId ? ("master" as const) : undefined,
            componentId: selectedElement.componentId,
            variant:
                element.id === clone.rootId
                    ? `Variant ${siblings.length + 1}`
                    : undefined,
        }));
        setElements((current) => [...current, ...copies]);
        setActiveComponentMasterId(clone.rootId);
        setSelectedIds([clone.rootId]);
    }, [elements, selectedElement, setElements]);

    const switchInstanceVariant = useCallback(
        (variant: string) => {
            if (
                !selectedElement?.componentId ||
                selectedElement.componentRole !== "instance"
            )
                return;
            const master = elements.find(
                (element) =>
                    element.componentRole === "master" &&
                    element.componentId === selectedElement.componentId &&
                    element.variant === variant,
            );
            if (!master) return;
            const masterIds = subtreeIds(elements, master.id);
            const sourceBySlot = new Map(
                elements
                    .filter((element) => masterIds.has(element.id))
                    .map((element) => [element.componentSourceId, element]),
            );
            const instanceIds = subtreeIds(elements, selectedElement.id);
            setElements((current) =>
                current.map((element) => {
                    if (!instanceIds.has(element.id)) return element;
                    const source = sourceBySlot.get(element.componentSourceId);
                    if (!source) return element;
                    const position = element.id === selectedElement.id
                        ? {
                              x: element.base.x,
                              y: element.base.y,
                              constraintX: element.base.constraintX,
                              constraintY: element.base.constraintY,
                          }
                        : {};
                    return {
                        ...element,
                        type: source.type,
                        content: source.content,
                        code: source.code,
                        src: source.src,
                        href: source.href,
                        base: { ...source.base, ...position },
                        overrides: source.overrides,
                        hover: source.hover,
                        press: source.press,
                        loop: source.loop,
                        draggable: source.draggable,
                        variant:
                            element.id === selectedElement.id ? variant : undefined,
                    };
                }),
            );
        },
        [elements, selectedElement, setElements],
    );

    const nudge = useCallback(
        (dx: number, dy: number) => {
            const movable = selectedIds.filter((id) => {
                const el = byId.get(id);
                return el && !el.locked && contextFor(el).parentLayout === "absolute";
            });
            if (movable.length === 0) return;

            setElements((els) =>
                els.map((el) => {
                    if (!movable.includes(el.id)) return el;
                    const style = resolveStyle(el, breakpoint, cascade);
                    return applyStyleIsolated(el, breakpoint, {
                        x: style.x + dx,
                        y: style.y + dy,
                    }, breakpointDefs.map((definition) => definition.id), cascade);
                }),
            );
        },
        [breakpoint, breakpointDefs, byId, cascade, contextFor, selectedIds, setElements],
    );

    const doReparent = useCallback(
        (id: string, parentId: string | undefined, beforeId?: string) => {
            if (!componentMode && parentId && componentAssetIds.has(parentId)) return;
            setElements((els) => reparent(els, id, parentId, breakpoint, beforeId));
        },
        [breakpoint, componentAssetIds, componentMode, setElements],
    );

    const switchPageLayout = (layout: "stack" | "absolute") => {
        if (layout === rootStyle.layout) return;
        if (layout === "absolute") {
            const canvas = canvasRef.current;
            const canvasRect = canvas?.getBoundingClientRect();
            if (canvas && canvasRect) {
                const rootIds = new Set(childrenOf(visibleEditorElements, undefined).map((element) => element.id));
                setElements((current) => current.map((element) => {
                    if (!rootIds.has(element.id)) return element;
                    const node = canvas.querySelector<HTMLElement>(`[data-canvas-element="${element.id}"]`);
                    if (!node) return element;
                    const rect = node.getBoundingClientRect();
                    return applyStyleIsolated(element, breakpoint, { x: (rect.left - canvasRect.left) / scale, y: (rect.top - canvasRect.top) / scale }, breakpointDefs.map((definition) => definition.id), cascade);
                }));
            }
            setRootStyle({ ...rootStyle, layout: "absolute", padT: 0, padR: 0, padB: 0, padL: 0 });
        } else {
            const rootIds = new Set(childrenOf(visibleEditorElements, undefined).map((element) => element.id));
            setElements((current) => current.map((element) => rootIds.has(element.id) ? applyStyleIsolated(element, breakpoint, { x: 0, y: 0 }, breakpointDefs.map((definition) => definition.id), cascade) : element));
            setRootStyle({ ...rootStyle, layout: "stack" });
        }
    };

    const applyStyleKit = (kit: "midnight" | "editorial" | "cobalt" | "warm") => {
        const palette = {
            midnight: { bg: "#090b10", surface: "#121620", text: "#f8fafc", muted: "#94a3b8", accent: "#7c5cff", border: "#252b38" },
            editorial: { bg: "#f3efe7", surface: "#fffdf8", text: "#171512", muted: "#746f66", accent: "#e14b32", border: "#d8d0c2" },
            cobalt: { bg: "#071425", surface: "#0d2038", text: "#f0f7ff", muted: "#91a9c2", accent: "#2f80ff", border: "#1d3a59" },
            warm: { bg: "#18110f", surface: "#251916", text: "#fff7ed", muted: "#c6a99b", accent: "#f97316", border: "#44302a" },
        }[kit];
        setRootStyle({ ...rootStyle, bg: palette.bg, variables: [
            { id: "kit-bg", name: "Background", type: "color", value: palette.bg },
            { id: "kit-surface", name: "Surface", type: "color", value: palette.surface },
            { id: "kit-text", name: "Text", type: "color", value: palette.text },
            { id: "kit-muted", name: "Muted", type: "color", value: palette.muted },
            { id: "kit-accent", name: "Accent", type: "color", value: palette.accent },
        ] });
        setElements((current) => current.map((element) => {
            if (componentAssetIds.has(element.id)) return element;
            const base = { ...element.base };
            if (element.type === "Button") { base.bg = palette.accent; base.color = "#ffffff"; base.borderC = palette.accent; }
            else if (isTextual(element.type)) base.color = element.type === "Text" ? palette.muted : palette.text;
            else if (base.bg && base.bg !== "transparent") { base.bg = palette.surface; base.borderC = palette.border; }
            return { ...element, base };
        }));
    };

    const loadNocturneShowcase = () => {
        if (elements.some((element) => !componentAssetIds.has(element.id)) && !window.confirm("This replaces the current page canvas with the Nocturne showcase. Continue?")) return;
        const showcase = createNocturneShowcase();
        beginTransaction();
        setElements((current) => [...current.filter((element) => componentAssetIds.has(element.id)), ...showcase.elements]);
        setRootStyle(showcase.rootStyle);
        setSelectedIds([]);
        setBreakpoint("desktop");
        setLeftTab("Layers");
        endTransaction();
        window.setTimeout(() => zoomToFit(), 80);
    };

    const select = useCallback((id: string, additive: boolean) => {
        setSelectedIds((current) => {
            if (!additive) return [id];
            return current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id];
        });
    }, []);

    /* ------------------------------------------------------ drag and resize */

    const gesturing = dragInfo !== null || resizeInfo !== null;

    useEffect(() => {
        if (!gesturing) return;

        const handleMouseMove = (event: MouseEvent) => {

            const gestureBreakpoint = dragInfo?.breakpoint ?? resizeInfo?.breakpoint ?? breakpoint;

            if (dragInfo) {
                const moving = byId.get(dragInfo.id);
                if (!moving) return;

                const dx = (event.clientX - dragInfo.startX) / scale;
                const dy = (event.clientY - dragInfo.startY) / scale;

                // Which container would receive the element if dropped here.
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const point = {
                        x: (event.clientX - rect.left) / scale,
                        y: (event.clientY - rect.top) / scale,
                    };
                    setDropTargetId(
                        containerAt(visibleEditorElements, byId, point, gestureBreakpoint, dragInfo.id),
                    );
                }

                if (dragInfo.mode === "reflow") {
                    // Position is owned by the parent's layout, so only show a
                    // ghost offset while the pointer looks for a new home.
                    setGhost({ dx, dy });
                    return;
                }

                const style = resolveStyle(moving, gestureBreakpoint, cascade);
                const proposed = {
                    x: dragInfo.initialX + dx,
                    y: dragInfo.initialY + dy,
                    w: style.w,
                    h: style.h,
                };

                const parent = moving.parentId ? byId.get(moving.parentId) : undefined;
                const parentStyle = parent ? resolveStyle(parent, gestureBreakpoint, cascade) : undefined;
                const gestureFrameWidth = breakpointDefs.find((definition) => definition.id === gestureBreakpoint)?.width ?? frameWidth;
                const frame = parentStyle
                    ? { w: parentStyle.w, h: parentStyle.h }
                    : { w: gestureFrameWidth, h: canvasHeight };

                // Alt suspends snapping for pixel-exact placement.
                const snapped = event.altKey
                    ? { ...proposed, guides: [] as Guide[] }
                    : snapPosition(
                          elements,
                          dragInfo.id,
                          proposed,
                          frame,
                          gestureBreakpoint,
                          6 / scale,
                      );

                setGuides({
                    origin: parent
                        ? absolutePosition(byId, parent, gestureBreakpoint, cascade)
                        : { x: 0, y: 0 },
                    lines: snapped.guides,
                });

                setElements((els) =>
                    els.map((el) =>
                        el.id === dragInfo.id
                            ? applyStyleIsolated(el, gestureBreakpoint, { x: snapped.x, y: snapped.y }, breakpointDefs.map((definition) => definition.id), cascade)
                            : el,
                    ),
                );
                return;
            }

            if (!resizeInfo) return;
            const dx = (event.clientX - resizeInfo.startX) / scale;
            const dy = (event.clientY - resizeInfo.startY) / scale;
            const { initialX, initialY, initialW, initialH, handle } = resizeInfo;

            let x = initialX;
            let y = initialY;
            let w = initialW;
            let h = initialH;

            const resizing = byId.get(resizeInfo.id);
            const minSize = resizing?.componentRole === "master" ? 1 : MIN_SIZE;
            if (handle.includes("e")) w = Math.max(minSize, initialW + dx);
            if (handle.includes("s")) h = Math.max(minSize, initialH + dy);
            if (handle.includes("w") && initialW - dx >= minSize) {
                w = initialW - dx;
                x = initialX + dx;
            }
            if (handle.includes("n") && initialH - dy >= minSize) {
                h = initialH - dy;
                y = initialY + dy;
            }

            setElements((els) =>
                els.map((el) =>
                    el.id === resizeInfo.id
                        ? applyStyleIsolated(el, gestureBreakpoint, { x, y, w, h }, breakpointDefs.map((definition) => definition.id), cascade)
                        : el,
                ),
            );
        };

        const handleMouseUp = () => {
            if (dragInfo) {
                const moving = byId.get(dragInfo.id);
                const currentParent = moving?.parentId;
                // `undefined` means the page root, which is a valid destination,
                // so only skip when nothing was hovered at all.
                if (
                    dragInfo.mode === "reflow" &&
                    dragInfo.breakpoint === cascade.baseId &&
                    dropTargetId !== undefined &&
                    dropTargetId !== currentParent
                ) {
                    doReparent(dragInfo.id, dropTargetId ?? undefined);
                }
            }
            setDragInfo(null);
            setPressedEffectId(null);
            setResizeInfo(null);
            setGhost(null);
            setDropTargetId(undefined);
            setGuides({ origin: { x: 0, y: 0 }, lines: [] });
            // The whole gesture lands in the undo stack as a single step.
            endTransaction();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [
        breakpoint,
        breakpointDefs,
        byId,
        cascade,
        canvasHeight,
        doReparent,
        dragInfo,
        dropTargetId,
        elements,
        endTransaction,
        frameWidth,
        gesturing,
        resizeInfo,
        scale,
        setElements,
        visibleEditorElements,
    ]);

    const handleElementMouseDown = (
        event: React.MouseEvent,
        el: CanvasElement,
        bp: Breakpoint = breakpoint,
    ) => {
        // Space-drag and middle-drag pan the canvas instead of moving elements.
        if (tryBeginPan(event)) return;
        event.stopPropagation();
        // Editing in a frame switches the toolbar to that frame's breakpoint,
        // so the inspector and the drag write to the same layer.
        if (bp !== breakpoint) setBreakpoint(bp);
        if (effectsPreview) {
            if (el.press) setPressedEffectId(el.id);
            const interaction = el.interaction;
            if (interaction && ["toggle-layer", "show-layer", "hide-layer"].includes(interaction.action)) {
                const target = byId.get(interaction.value);
                if (target) setPreviewVisibility((current) => {
                    const currentlyVisible = current[target.id] ?? !resolveStyle(target, bp, cascade).hidden;
                    const visible = interaction.action === "show-layer" ? true : interaction.action === "hide-layer" ? false : !currentlyVisible;
                    return { ...current, [target.id]: visible };
                });
            }
            return;
        }
        select(el.id, event.shiftKey || event.metaKey);
        if (editingId !== el.id) setEditingId(null);
        if (el.locked || editingId === el.id) return;

        const style = resolveStyle(el, bp, cascade);
        beginTransaction();
        setDragInfo({
            id: el.id,
            breakpoint: bp,
            mode: contextFor(el).parentLayout === "absolute" ? "free" : "reflow",
            startX: event.clientX,
            startY: event.clientY,
            initialX: style.x,
            initialY: style.y,
        });
    };

    const handleResizeMouseDown = (
        event: React.MouseEvent,
        handle: ResizeHandle,
        el: CanvasElement,
        bp: Breakpoint,
    ) => {
        event.stopPropagation();
        if (bp !== breakpoint) setBreakpoint(bp);
        setSelectedIds([el.id]);
        const style = resolveStyle(el, bp, cascade);
        beginTransaction();
        setResizeInfo({
            id: el.id,
            breakpoint: bp,
            handle,
            startX: event.clientX,
            startY: event.clientY,
            initialX: style.x,
            initialY: style.y,
            initialW: style.w,
            initialH: style.h,
        });
    };

    const beginMarquee = (event: React.MouseEvent, bp: Breakpoint) => {
        if (event.button !== 0 || spaceHeld || tryBeginPan(event)) return;
        event.preventDefault();
        if (bp !== breakpoint) setBreakpoint(bp);
        marqueePageRef.current = ((event.currentTarget as HTMLElement).closest("[data-canvas-page]") ?? event.currentTarget) as HTMLElement;
        marqueeBaseRef.current = event.shiftKey || event.metaKey ? selectedIds : [];
        if (!marqueeBaseRef.current.length) setSelectedIds([]);
        setEditingId(null);
        setMarquee({ startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY });
    };

    useEffect(() => {
        if (!marquee) return;
        const move = (event: MouseEvent) => {
            const left = Math.min(marquee.startX, event.clientX);
            const top = Math.min(marquee.startY, event.clientY);
            const right = Math.max(marquee.startX, event.clientX);
            const bottom = Math.max(marquee.startY, event.clientY);
            const hits = Array.from(marqueePageRef.current?.querySelectorAll<HTMLElement>("[data-canvas-element]") ?? []).flatMap((node) => {
                const rect = node.getBoundingClientRect();
                const intersects = rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom;
                const id = node.dataset.canvasElement;
                return intersects && id ? [id] : [];
            });
            setSelectedIds(Array.from(new Set([...marqueeBaseRef.current, ...hits])));
            setMarquee((current) => current ? { ...current, x: event.clientX, y: event.clientY } : null);
        };
        const up = () => {
            setMarquee(null);
            marqueePageRef.current = null;
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up, { once: true });
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [marquee?.startX, marquee?.startY]);

    /* ------------------------------------------------------------- dropping */

    const handleDrop = (event: React.DragEvent, parentId: string | null) => {
        event.preventDefault();
        event.stopPropagation();
        setDropTargetId(undefined);

        // An existing layer dragged out of the Layers panel.
        const movedId = event.dataTransfer.getData(MOVE_MIME);
        if (movedId) {
            doReparent(movedId, parentId ?? undefined);
            setSelectedIds([movedId]);
            return;
        }

        const componentId = event.dataTransfer.getData(COMPONENT_MIME);
        if (componentId) {
            const master = elements.find((element) => element.id === componentId && element.componentRole === "master");
            if (!master) return;
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            const style = resolveStyle(master, cascade.baseId, cascade);
            const x = Math.max(0, (event.clientX - rect.left) / scale - style.w / 2);
            const y = Math.max(0, (event.clientY - rect.top) / scale - style.h / 2);
            const clone = cloneSubtree(elements, master.id, { x: x - style.x, y: y - style.y });
            if (!clone) return;
            const copies = clone.elements.map((element) => element.id === clone.rootId ? { ...element, parentId: parentId ?? undefined, componentRole: "instance" as const, componentId: master.componentId, variant: master.variant, z: nextZ(elements, parentId ?? undefined) } : { ...element, componentRole: undefined });
            setElements((current) => [...current, ...copies]);
            setSelectedIds([clone.rootId]);
            return;
        }

        const type = event.dataTransfer.getData(DRAG_MIME) as ElementType;
        if (!type) return;

        // The drop target's rect is already scaled by the zoom transform, so
        // dividing brings the pointer back into canvas coordinates.
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (event.clientX - rect.left) / scale;
        const y = (event.clientY - rect.top) / scale;

        const element = createElement(type, {
            x: 0,
            y: 0,
            z: nextZ(elements, parentId ?? undefined),
            parentId: parentId ?? undefined,
        });
        element.base.x = Math.max(0, x - element.base.w / 2);
        element.base.y = Math.max(0, y - element.base.h / 2);

        setElements((els) => [...els, element]);
        setSelectedIds([element.id]);
    };

    /* ------------------------------------------------------------ shortcuts */

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing =
                !!target &&
                (target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

            if (event.key === "Escape") {
                if (editingId) setEditingId(null);
                else setSelectedIds([]);
                setContextMenu(null);
                return;
            }

            const mod = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();


            // These stay live even while a field has focus.
            if (mod && key === "s") {
                event.preventDefault();
                saveNow();
                return;
            }
            if (mod && key === "z") {
                event.preventDefault();
                if (event.shiftKey) redo();
                else undo();
                return;
            }
            if (mod && key === "y") {
                event.preventDefault();
                redo();
                return;
            }
            if (mod && (event.key === "=" || event.key === "+")) {
                event.preventDefault();
                stepZoom(1);
                return;
            }
            if (mod && event.key === "-") {
                event.preventDefault();
                stepZoom(-1);
                return;
            }
            if (mod && event.key === "0") {
                event.preventDefault();
                zoomTo(100);
                return;
            }

            // Everything below would fight with normal text entry.
            if (typing) return;

            if (mod && key === "a") {
                event.preventDefault();
                setSelectedIds(elements.map((el) => el.id));
                return;
            }
            if (mod && key === "c" && selectedIds.length) {
                copyElements(selectedIds);
                return;
            }
            if (mod && key === "x" && selectedIds.length) {
                copyElements(selectedIds);
                deleteElements(selectedIds);
                return;
            }
            if (mod && key === "v") {
                event.preventDefault();
                pasteClipboard();
                return;
            }
            if (mod && key === "d" && selectedIds.length) {
                event.preventDefault();
                duplicateElements(selectedIds);
                return;
            }
            if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length) {
                event.preventDefault();
                deleteElements(selectedIds);
                return;
            }

            const step = event.shiftKey ? 10 : 1;
            const arrows: Record<string, [number, number]> = {
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
                ArrowUp: [0, -step],
                ArrowDown: [0, step],
            };
            const delta = arrows[event.key];
            if (delta) {
                event.preventDefault();
                nudge(delta[0], delta[1]);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        copyElements,
        deleteElements,
        duplicateElements,
        editingId,
        elements,
        nudge,
        pasteClipboard,
        redo,
        saveNow,
        selectedIds,
        stepZoom,
        undo,
        zoomTo,
    ]);

    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, [contextMenu]);

    /* -------------------------------------------------------- page actions */

    const runPageAction = useCallback(
        (
            action: () => Promise<
                { status: "ok"; pageId?: string } | { status: "error"; message: string }
            >,
            navigate: false | "push" | "replace" = false,
        ) => {
            setPageError(null);
            startTransition(async () => {
                const result = await action();
                if (result.status === "error") {
                    setPageError(result.message);
                    return;
                }
                if (navigate && result.pageId) adapters?.navigate?.(result.pageId, { replace: navigate === "replace" });
                else adapters?.refresh?.();
            });
        },
        [adapters],
    );

    const installSiteTemplate = useCallback((templateId: SiteTemplateId) => {
        setPageError(null);
        startTransition(async () => {
            const result = await (adapters?.installTemplate ?? unavailable)(templateId);
            if (result.status === "error") {
                setPageError(result.message);
                return;
            }
            // A template can replace the currently open page document. A hard
            // navigation guarantees stale editor state cannot autosave over it.
            if (result.pageId) adapters?.navigate?.(result.pageId, { replace: true });
        });
    }, [adapters]);

    const publish = useCallback(() => {
        // Flush the draft first; Publish snapshots whatever the server holds.
        saveNow();
        setPageError(null);
        startTransition(async () => {
            const result = await (adapters?.publishPage ?? unavailable)(page.id);
            if (result.status === "error") setPageError(result.message);
            else adapters?.refresh?.();
        });
    }, [adapters, page.id, saveNow]);

    /* --------------------------------------------------------------- render */

    const enclosingDataBlock = useMemo(() => {
        if (!selectedElement) return undefined;
        let cursor = selectedElement.parentId
            ? byId.get(selectedElement.parentId)
            : undefined;
        const guard = new Set<string>([selectedElement.id]);
        while (cursor && !guard.has(cursor.id)) {
            guard.add(cursor.id);
            if (cursor.type === "Repeat" || cursor.type === "Request") return cursor;
            cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
        }
        return undefined;
    }, [byId, selectedElement]);

    const bindingSourceId = enclosingDataBlock?.sourceId ?? selectedElement?.sourceId;
    const bindingKeys = bindingSourceId
        ? (samples[bindingSourceId]?.keys ?? [])
        : [];

    const canvasData = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(samples).map(([id, sample]) => [id, sample.rows]),
            ),
        [samples],
    );

    type Frame = { bp: Breakpoint; width: number };

    const renderNode = (
        raw: CanvasElement,
        frame: Frame,
        row?: Row,
        keyPrefix = "",
    ): React.ReactNode => {
        const directRow = row ?? (raw.sourceId ? canvasData[raw.sourceId]?.[0] : undefined);
        const el = bindElement(raw, directRow);
        const resolvedStyle = resolveStyle(el, frame.bp, cascade);
        const isActiveFrame = frame.bp === breakpoint;
        const previewVisible = previewVisibility[el.id];
        if (previewVisible !== undefined) resolvedStyle.hidden = !previewVisible;
        const style = {
            ...resolvedStyle,
            ...(isActiveFrame && hoveredEffectId === el.id ? el.hover : undefined),
            ...(isActiveFrame && pressedEffectId === el.id ? el.press : undefined),
        };
        if (style.hidden) return null;

        const children = childrenOf(elements, el.id);
        const container = isContainer(el.type);
        const isSelected = isActiveFrame && selectedIds.includes(el.id);
        const isEditing = isActiveFrame && editingId === el.id;
        const isDropTarget = isActiveFrame && dropTargetId === el.id;
        const isGhosting = ghost !== null && dragInfo?.id === el.id && dragInfo.breakpoint === frame.bp;

        const note = isNote(el, byId, frame.bp, frame.width, rootStyle.layout, cascade);
        const band = isBand(el.type, style, rootStyle);
        const css = styleToCss(style, contextFor(el, frame.bp), el);
        if (el.hover || el.press) css.transition = "transform .42s cubic-bezier(.16,1,.3,1), scale .42s cubic-bezier(.16,1,.3,1), rotate .42s cubic-bezier(.16,1,.3,1), background-color .32s ease, color .32s ease, border-color .32s ease, box-shadow .42s cubic-bezier(.16,1,.3,1), opacity .32s ease, filter .42s ease";
        css.zIndex = el.z;
        if (el.loop) css.animation = `pg-loop-${el.loop.type} ${el.loop.duration}ms ease-in-out infinite`;
        css.cursor = el.locked ? "default" : isEditing ? "text" : "move";
        css.outline = isSelected
            ? "1.5px solid var(--ed-accent)"
            : isDropTarget
              ? "1.5px solid #22c55e"
              : note
                ? "1.5px dashed var(--ed-accent)"
                : undefined;
        if (note) css.opacity = 0.55;
        css.outlineOffset = isSelected || isDropTarget ? "-1px" : undefined;
        // A band paints edge to edge while its content sits in a centred inner
        // box — the same split the published stylesheet emits.
        const split = band ? splitBand(css, rootStyle.maxWidth) : null;
        if (isGhosting) {
            css.transform = `${css.transform ?? ""} translate(${ghost.dx}px, ${ghost.dy}px)`;
            css.opacity = 0.6;
            css.pointerEvents = "none";
        }

        // Repeat iterates sampled rows. Request renders once and passes the
        // sampled object to every descendant as its binding context.
        const renderChildren = () =>
            el.type === "Repeat"
                ? rowsFor(el, canvasData, true).flatMap((dataRow, index) =>
                      children.map((child) =>
                          renderNode(child, frame, dataRow, `${keyPrefix}${index}:`),
                      ),
                  )
                : children.map((child) => renderNode(
                      child,
                      frame,
                      el.type === "Request" ? canvasData[el.sourceId ?? ""]?.[0] : row,
                      keyPrefix,
                  ));

        return (
            // A canvas node is manipulated by pointer; the Layers panel is its keyboard equivalent.
            // biome-ignore lint/a11y/noStaticElementInteractions: pointer-driven canvas node
            <div
                key={`${keyPrefix}${el.id}`}
                data-canvas-element={el.id}
                style={split ? split.shell : css}
                onMouseDown={(event) => handleElementMouseDown(event, el, frame.bp)}
                onMouseEnter={() => effectsPreview && el.hover && setHoveredEffectId(el.id)}
                onMouseUp={() => effectsPreview && setPressedEffectId((id) => id === el.id ? null : id)}
                onMouseLeave={() => { setHoveredEffectId((id) => id === el.id ? null : id); setPressedEffectId((id) => id === el.id ? null : id); }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    if (isTextual(el.type) && !el.locked) setEditingId(el.id);
                }}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!selectedIds.includes(el.id)) setSelectedIds([el.id]);
                    setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        elementId: el.id,
                    });
                }}
                onDragOver={
                    container
                        ? (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              event.dataTransfer.dropEffect = "copy";
                              setDropTargetId(el.id);
                          }
                        : undefined
                }
                onDragLeave={
                    container
                        ? () => setDropTargetId((c) => (c === el.id ? undefined : c))
                        : undefined
                }
                onDrop={container ? (event) => handleDrop(event, el.id) : undefined}
            >
                {isEditing ? (
                    <textarea
                        // Focus follows the double-click that opened the editor.
                        ref={(node) => node?.focus()}
                        value={el.content ?? ""}
                        onChange={(event) => patchProps(el.id, { content: event.target.value })}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onBlur={() => setEditingId(null)}
                        className="min-h-[1em] w-full flex-1 resize-none overflow-hidden whitespace-pre-wrap bg-transparent text-inherit outline-none"
                        style={{
                            font: "inherit",
                            color: "inherit",
                            textAlign: style.textAlign,
                            letterSpacing: "inherit",
                            lineHeight: "inherit",
                        }}
                    />
                ) : (
                    <ElementBody element={el} />
                )}

                {split ? (
                    <div style={split.inner}>{renderChildren()}</div>
                ) : (
                    renderChildren()
                )}

                {isSelected && !note && (
                    <span
                        className="pointer-events-none absolute -bottom-1 left-1/2 z-[70] translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-white shadow-sm"
                        style={{
                            background: "var(--ed-accent)",
                            // Undo the canvas zoom so the label keeps one size.
                            transform: `translate(-50%, 100%) scale(${1 / scale})`,
                            transformOrigin: "top center",
                        }}
                    >
                        {Math.round(style.widthMode === "fixed" ? style.w : 0) || "auto"} ×{" "}
                        {Math.round(style.heightMode === "fixed" ? style.h : 0) || "auto"}
                    </span>
                )}

                {note && (
                    <span
                        className="pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                            background: "var(--ed-accent-soft)",
                            color: "var(--ed-accent)",
                        }}
                    >
                        Note · not published
                    </span>
                )}

                {isSelected && !el.locked && selectedIds.length === 1 && (
                    <ResizeHandles
                        element={el}
                        style={style}
                        onMouseDown={(event, handle, element) => handleResizeMouseDown(event, handle, element, frame.bp)}
                    />
                )}
            </div>
        );
    };

    const rootCss = rootStyleToCss(rootStyle);
    const customFontCss = (rootStyle.customFonts ?? []).map((font) => `@font-face{font-family:"${font.name.replace(/["'{};]/g, "")}";src:url("${font.url.replace(/["'()\\]/g, "")}");font-weight:${font.weight};font-style:${font.style};font-display:swap}`).join("\n");
    const arrangeable = useMemo(() => {
        if (selectedIds.length < 2) return false;
        const parents = new Set(
            selectedIds.map((id) => byId.get(id)?.parentId ?? "__root__"),
        );
        if (parents.size !== 1) return false;
        const first = byId.get(selectedIds[0]);
        return first ? contextFor(first).parentLayout === "absolute" : false;
    }, [byId, contextFor, selectedIds]);

    const menuElementId = contextMenu?.elementId;

    return (
        <div
            className="pg-editor flex h-screen w-full flex-col overflow-hidden bg-ed-surface font-sans text-xs text-ed-text selection:bg-blue-500/30"
            data-ed-theme={chromeTheme === "light" ? "light" : undefined}
        >
            <header className="relative z-30 grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-ed-border bg-ed-surface/90 px-3 backdrop-blur-2xl">
                <button type="button" onClick={() => setIsLeftCollapsed((current) => !current)} title="Toggle sidebar" className="w-fit text-[13px] font-semibold tracking-tight text-ed-text">Pagiera</button>

                <div className="pg-chrome-card flex items-center gap-2 rounded-2xl border border-ed-border bg-ed-subtle/90 p-1.5 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-ed-muted">
                        {componentMode && <><Select value={activeComponentMaster?.id} onValueChange={(id) => { setActiveComponentMasterId(id); setSelectedIds([id]); }}><SelectTrigger aria-label="Variant"><SelectValue placeholder="Select variant" /></SelectTrigger><SelectContent>{activeComponentVariants.map((master) => <SelectItem key={master.id} value={master.id}>{master.variant ?? "Default"}</SelectItem>)}</SelectContent></Select><button type="button" onClick={createComponentVariant} disabled={selectedElement?.componentRole !== "master"} title="Add variant" className="flex size-7 items-center justify-center rounded-lg bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-30"><IconPlus size={13} /></button></>}
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                title="Zoom out (Ctrl -)"
                                onClick={() => stepZoom(-1)}
                                className="rounded p-1 transition-colors hover:bg-ed-field hover:text-ed-text"
                            >
                                <IconMinus size={12} />
                            </button>
                            <button
                                type="button"
                                title="Reset zoom (Ctrl 0)"
                                onClick={() => zoomTo(100)}
                                className="w-10 select-none text-center tabular-nums transition-colors hover:text-ed-text"
                            >
                                {zoom}%
                            </button>
                            <button
                                type="button"
                                title="Zoom in (Ctrl +)"
                                onClick={() => stepZoom(1)}
                                className="rounded p-1 transition-colors hover:bg-ed-field hover:text-ed-text"
                            >
                                <IconPlus size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-ed-border pl-2 text-ed-muted">
                        <button
                            type="button"
                            title="Undo (Ctrl Z)"
                            onClick={undo}
                            disabled={!canUndo}
                            className="transition-colors hover:text-ed-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ed-muted"
                        >
                            <IconArrowBackUp size={16} />
                        </button>
                        <button
                            type="button"
                            title="Redo (Ctrl Shift Z)"
                            onClick={redo}
                            disabled={!canRedo}
                            className="transition-colors hover:text-ed-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ed-muted"
                        >
                            <IconArrowForwardUp size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-2">
                    {page.publishedAt && (
                        <a
                            href={(adapters?.publishedHref ?? defaultPublishedHref)(page.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden items-center gap-1.5 text-[11px] text-emerald-500 transition-colors hover:text-emerald-400 xl:flex"
                        >
                            <IconWorld size={14} />
                            {(adapters?.publishedHref ?? defaultPublishedHref)(page.slug)}
                            <IconExternalLink size={11} />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={publish}
                        disabled={isPending || isDirty}
                        title={isDirty ? "Waiting for the draft to save…" : undefined}
                        className="rounded-lg bg-ed-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                    >
                        {isPending ? "Working…" : page.publishedAt ? "Republish" : "Publish"}
                    </button>
                    {page.publishedAt && (
                        <button
                            type="button"
                            onClick={() =>
                                runPageAction(() => (adapters?.unpublishPage ?? unavailable)(page.id, page.slug))
                            }
                            className="text-[11px] text-ed-muted transition-colors hover:text-ed-text"
                        >
                            Unpublish
                        </button>
                    )}
                    <button
                        type="button"
                        title={chromeTheme === "dark" ? "Switch to light editor" : "Switch to dark editor"}
                        aria-label="Toggle editor theme"
                        onClick={toggleChromeTheme}
                        className="rounded-md p-1.5 text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text"
                    >
                        {chromeTheme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsRightCollapsed((c) => !c)}
                        className="text-ed-faint transition-colors hover:text-ed-text"
                    >
                        {isRightCollapsed ? (
                            <IconLayoutSidebarLeftCollapse size={18} />
                        ) : (
                            <IconLayoutSidebarRightCollapse size={18} />
                        )}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden bg-ed-canvas">
                {/* Thin Toolbar */}
                <aside className="z-20 flex w-12 shrink-0 flex-col items-center border-r border-ed-border bg-ed-surface/95 py-2 backdrop-blur-xl">
                    <button
                        type="button"
                        title="Select (V)"
                        className="mb-1 flex size-8 items-center justify-center rounded-xl bg-ed-accent/15 text-ed-accent ring-1 ring-inset ring-ed-accent/20 transition-all hover:scale-105 hover:bg-ed-accent/20"
                    >
                        <IconPointer size={17} stroke={1.7} />
                    </button>
                    <button
                        type="button"
                        title="Insert (A)"
                        className="flex size-8 items-center justify-center rounded-lg text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-text"
                        onClick={() => {
                            setLeftTab("Elements");
                            setIsLeftCollapsed(false);
                        }}
                    >
                        <IconPlus size={18} stroke={1.8} />
                    </button>
                    <div className="my-2 h-px w-5 bg-ed-border" />
                    <div className="flex w-full flex-col items-center gap-1 px-1.5">
                        {["Layers", componentMode ? "Components" : "Assets", "Library", "Icons", ...(componentMode ? [] : ["Templates"]), "Variables", "AI", "Data", ...(componentMode ? [] : ["Pages"])].map((tab) => {
                            const Icon =
                                tab === "Layers"
                                    ? IconLayersLinked
                                    : tab === "Elements"
                                      ? IconBox
                                      : tab === "Library"
                                      ? IconLibrary
                                      : tab === "Icons"
                                        ? IconIcons
                                      : tab === "Templates"
                                        ? IconTemplate
                                      : tab === "Variables"
                                        ? IconPalette
                                        : tab === "AI"
                                          ? IconSparkles
                                        : tab === "Components" || tab === "Assets"
                                          ? IconComponents
                                        : tab === "Data"
                                          ? IconDatabase
                                          : IconFile;
                            return (
                                <button
                                    type="button"
                                    key={tab}
                                    onClick={() => {
                                        setLeftTab(tab);
                                        if (isLeftCollapsed) setIsLeftCollapsed(false);
                                    }}
                                    className={`flex size-8 items-center justify-center rounded-xl transition-all hover:scale-105 ${
                                        leftTab === tab && !isLeftCollapsed
                                            ? "bg-ed-field text-ed-accent"
                                            : "text-ed-muted hover:bg-ed-subtle hover:text-ed-text"
                                    }`}
                                    title={tab}
                                >
                                    <Icon size={17} stroke={1.6} />
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Left Panel */}
                <AnimatePresence initial={false}>
                {!isLeftCollapsed && (
                    <motion.aside initial={{ width: 0, opacity: 0, x: -12 }} animate={{ width: 292, opacity: 1, x: 0 }} exit={{ width: 0, opacity: 0, x: -12 }} transition={{ type: "spring", stiffness: 420, damping: 38 }} className="relative z-10 flex w-[292px] shrink-0 flex-col overflow-hidden border-r border-ed-border bg-ed-surface/95 backdrop-blur-xl">
                        <div className="flex h-11 shrink-0 items-center justify-between border-b border-ed-border px-3.5">
                            <span className="text-[11px] font-semibold text-ed-text">{leftTab}</span>
                            <button type="button" onClick={() => setIsLeftCollapsed(true)} className="text-ed-faint hover:text-ed-muted transition-colors p-1 rounded-md hover:bg-ed-field">
                                <IconX size={16} />
                            </button>
                        </div>

                        {leftTab !== "Pages" && leftTab !== "Components" && leftTab !== "Assets" && leftTab !== "Library" && leftTab !== "Templates" && leftTab !== "Variables" && leftTab !== "Data" && leftTab !== "AI" && (
                            <div className="border-b border-ed-border p-3 bg-ed-subtle">
                                <div className="flex items-center gap-2 rounded-md border border-ed-border bg-ed-surface px-2.5 py-1.5 transition-all focus-within:border-ed-accent/50 focus-within:ring-1 focus-within:ring-blue-500/20">
                                    <IconSearch size={14} className="text-ed-faint" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={`Search ${leftTab.toLowerCase()}...`}
                                        className="w-full bg-transparent text-xs text-ed-text outline-none placeholder:text-ed-faint"
                                    />
                                    <IconCommand size={12} className="text-ed-faint" />
                                </div>
                            </div>
                        )}

                        <div className="custom-scrollbar flex-1 overflow-y-auto">
                            {leftTab === "Layers" ? (
                                <LayersPanel
                                    elements={visibleEditorElements}
                                    breakpoint={breakpoint}
                                    search={search}
                                    selectedIds={selectedIds}
                                    onSelect={select}
                                    onToggleHidden={(id) => {
                                        const el = byId.get(id);
                                        if (el) {
                                            patchStyle([id], {
                                                hidden: !resolveStyle(el, breakpoint, cascade).hidden,
                                            });
                                        }
                                    }}
                                    onToggleLocked={(id) => {
                                        const el = byId.get(id);
                                        if (el) patchProps(id, { locked: !el.locked });
                                    }}
                                    onReorder={(id, direction) =>
                                        setElements((els) => reorder(els, id, direction))
                                    }
                                    onDelete={(id) => deleteElements([id])}
                                    onReparent={doReparent}
                                />
                            ) : leftTab === "Elements" ? (
                                <ElementsPanel search={search} onInsert={insertElement} />
                            ) : leftTab === "Icons" ? (
                                <IconsPanel search={search} onInsert={(iconName) => insertElement("Icon", { iconName })} />
                            ) : leftTab === "Data" ? (
                                <DataPanel
                                    sources={dataSources}
                                    samples={samples}
                                    onChange={setDataSources}
                                    onSample={(id, sample) =>
                                        setSamples((prev) => ({ ...prev, [id]: sample }))
                                    }
                                    preview={adapters?.previewSource ?? (async () => ({ status: "error", message: "No data preview adapter configured." }))}
                                />
                            ) : leftTab === "Library" ? (
                                <LibraryPanel
                                    pages={library}
                                    currentPageId={page.id}
                                    onInsert={insertFromLibrary}
                                />
                            ) : leftTab === "Templates" ? (
                                <TemplatesPanel busy={isPending} onInstall={(id) => {
                                    if (!window.confirm("Replace this site with the selected template? All existing pages and their revisions will be deleted.")) return;
                                    installSiteTemplate(id);
                                }} />
                            ) : leftTab === "Assets" ? (
                                <div className="p-3"><div className="mb-3 rounded-xl border border-ed-border bg-ed-subtle p-3"><p className="text-[11px] font-semibold text-ed-text">Project assets</p><p className="mt-1 text-[9px] leading-relaxed text-ed-faint">Open a component to edit its own canvas, or drag a variant directly onto the page.</p></div><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-ed-muted">Components</span><span className="flex gap-1"><button type="button" onClick={createBlankComponent} className="flex items-center gap-1 rounded-md bg-ed-field px-2 py-1 text-[9px] text-ed-muted hover:text-ed-text"><IconPlus size={10} /> New</button><button type="button" onClick={() => setCodeComposerOpen(true)} className="flex items-center gap-1 rounded-md bg-ed-field px-2 py-1 text-[9px] text-ed-muted hover:text-ed-text">Code</button></span></div><div className="space-y-2">{componentMasters.map((master) => <button key={master.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.setData(COMPONENT_MIME, master.id); event.dataTransfer.effectAllowed = "copy"; }} onClick={() => { setRootStyle({ ...rootStyle, documentMode: "component" }); setActiveComponentMasterId(master.id); setSelectedIds([master.id]); setBreakpoint("desktop"); setLeftTab("Components"); }} className="group flex w-full cursor-grab items-center gap-3 rounded-xl border border-ed-border bg-ed-subtle p-2.5 text-left hover:border-ed-accent/50 hover:bg-ed-field active:cursor-grabbing"><span className="flex size-9 items-center justify-center rounded-lg bg-ed-field text-ed-accent"><IconComponents size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-ed-text">{master.name ?? "Component"}</span><span className="block text-[9px] text-ed-faint">{master.variant ?? "Default"} · drag to insert</span></span></button>)}{componentMasters.length === 0 && <p className="rounded-xl border border-dashed border-ed-border p-5 text-center text-[10px] text-ed-faint">Create a component or add one from code.</p>}</div></div>
                            ) : leftTab === "Variables" ? (
                                <VariablesPanel
                                    rootStyle={rootStyle}
                                    selectedElement={selectedElement}
                                    setRootStyle={setRootStyle}
                                    setElements={setElements}
                                />
                            ) : leftTab === "AI" ? (
                                <AiPanel
                                    pageId={page.id}
                                    elements={elements}
                                    rootStyle={rootStyle}
                                    breakpoint={breakpoint}
                                    onApply={applyAiPlan}
                                    generate={adapters?.generate}
                                />
                            ) : leftTab === "Components" ? (
                                <div className="p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-[11px] font-semibold text-ed-text">Component canvas</p><p className="mt-1 text-[9px] text-ed-faint">Every variant opens in its own resizable canvas.</p></div><button type="button" onClick={() => { setRootStyle({ ...rootStyle, documentMode: "page" }); setLeftTab("Layers"); }} className="rounded-lg bg-ed-field px-2 py-1.5 text-[9px] text-ed-muted hover:text-ed-text">Page mode</button></div>{selectedElement?.componentRole === "master" && <div className="mb-3 space-y-2 rounded-xl border border-ed-border bg-ed-subtle p-2.5"><label className="flex items-center gap-2 text-[9px] text-ed-faint"><span className="w-16">Name</span><input value={selectedElement.name ?? ""} placeholder="Component name" onChange={(event) => patchProps(selectedElement.id, { name: event.target.value })} className="h-8 min-w-0 flex-1 rounded-lg bg-ed-field px-2.5 text-[10px] text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" /></label><label className="flex items-center gap-2 text-[9px] text-ed-faint"><span className="w-16">Variant</span><input value={selectedElement.variant ?? "Default"} onChange={(event) => patchProps(selectedElement.id, { variant: event.target.value })} className="h-8 min-w-0 flex-1 rounded-lg bg-ed-field px-2.5 text-[10px] text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" /></label></div>}<div className="space-y-2">{componentMasters.map((master) => <button key={master.id} type="button" onClick={() => { setActiveComponentMasterId(master.id); setSelectedIds([master.id]); }} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${activeComponentMaster?.id === master.id ? "border-ed-accent bg-ed-accent/10" : "border-ed-border bg-ed-subtle hover:bg-ed-field"}`}><span className="flex size-8 items-center justify-center rounded-lg bg-ed-field text-ed-accent"><IconComponents size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-ed-text">{master.name ?? "Component"}</span><span className="block text-[9px] text-ed-faint">{master.variant ?? "Default"}</span></span><span className="font-mono text-[9px] text-ed-faint">{Math.round(master.base.w)}×{Math.round(master.base.h)}</span></button>)}{componentMasters.length === 0 && <p className="rounded-xl border border-dashed border-ed-border p-5 text-center text-[10px] text-ed-faint">Create a new component canvas.</p>}</div><button type="button" onClick={createComponentVariant} disabled={selectedElement?.componentRole !== "master"} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ed-accent px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-30"><IconPlus size={12} /> Add variant</button></div>
                            ) : (
                                <PagesPanel
                                    pages={pages}
                                    currentId={page.id}
                                    busy={isPending}
                                    error={pageError}
                                    onCreate={(name) =>
                                        runPageAction(() => (adapters?.createPage ?? unavailable)(name, name), "push")
                                    }
                                    onRename={(id, name, slug) =>
                                        runPageAction(() => (adapters?.renamePage ?? unavailable)(id, name, slug))
                                    }
                                    onDuplicate={(id, name) =>
                                        runPageAction(
                                            () => (adapters?.duplicatePage ?? unavailable)(id, name, name),
                                            "push",
                                        )
                                    }
                                    onDelete={(id) =>
                                        runPageAction(() => (adapters?.deletePage ?? unavailable)(id), id === page.id ? "replace" : false)
                                    }
                                    onNavigate={(id) => (adapters?.navigate ?? ((pageId) => { window.location.href = defaultEditorHref(pageId); }))(id)}
                                    publishedHref={adapters?.publishedHref ?? defaultPublishedHref}
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-ed-border p-2 px-3 text-ed-muted">
                            <span className="text-[10px] tabular-nums">
                                {elements.length} element{elements.length === 1 ? "" : "s"}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    title="Duplicate (Ctrl D)"
                                    disabled={selectedIds.length === 0}
                                    onClick={() => duplicateElements(selectedIds)}
                                    className="rounded p-1.5 transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                                >
                                    <IconCopy size={16} />
                                </button>
                                <button
                                    type="button"
                                    title="Delete (Del)"
                                    disabled={selectedIds.length === 0}
                                    onClick={() => deleteElements(selectedIds)}
                                    className="rounded p-1.5 transition-colors hover:bg-ed-field hover:text-ed-text disabled:pointer-events-none disabled:opacity-30"
                                >
                                    <IconTrash size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
                </AnimatePresence>

                <main
                    className="relative flex flex-1 flex-col overflow-hidden bg-ed-canvas"
                    style={{
                        // The grid is drawn from the border colour, so it reads
                        // on the dark well and the light one alike.
                        backgroundImage:
                            "linear-gradient(to right, var(--ed-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--ed-grid) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        backgroundPosition: "-1px -1px",
                    }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedIds([]);
                    }}
                >
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: pan surface; Ctrl +/-/0 cover the same ground from the keyboard */}
                    <div
                        ref={viewportRef}
                        className="canvas-scrollbar absolute inset-0 overflow-auto overscroll-none"
                        style={{ cursor: isPanning ? "grabbing" : spaceHeld ? "grab" : undefined }}
                        onMouseDown={(event) => {
                            if (tryBeginPan(event)) return;
                            setContextMenu(null);
                            if (event.target === event.currentTarget) beginMarquee(event, breakpoint);
                        }}
                        onContextMenu={(event) => {
                            if ((event.target as HTMLElement).closest("[data-canvas-page]")) return;
                            event.preventDefault();
                            const rect = frameRef.current?.getBoundingClientRect();
                            setContextMenu({
                                x: event.clientX,
                                y: event.clientY,
                                canvasX: rect ? Math.round((event.clientX - rect.left) / scale) : 0,
                                canvasY: rect ? Math.round((event.clientY - rect.top) / scale) : 0,
                            });
                        }}
                    >
                        {/* The gutter is what makes panning possible: with the
                            frames sized to fit exactly there would be no scroll
                            range at all, and space-drag would do nothing. Fixed
                            rather than viewport units: the canvas area is
                            narrower than the window by however much the panels
                            take, so vw/vh under-measured it. */}
                        <div className="flex min-w-max items-start justify-center gap-10 px-[900px] py-[560px]">
                            {frames.map((frame) => {
                                const primary = frame.bp === breakpoint;
                                const definition = breakpointDefs.find(
                                    (item) => item.id === frame.bp,
                                );
                                const isBaseFrame = !componentMode && frame.bp === cascade.baseId;
                                return (
                                    <div key={frame.bp} className="flex flex-col gap-2">
                                        <div
                                            draggable={!componentMode}
                                            onDragStart={(event) => { if (componentMode) return; setDraggedBreakpointId(frame.bp); event.dataTransfer.effectAllowed = "move"; }}
                                            onDragEnd={() => setDraggedBreakpointId(null)}
                                            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                                            onDrop={(event) => { event.preventDefault(); if (draggedBreakpointId) moveBreakpoint(draggedBreakpointId, frame.bp); setDraggedBreakpointId(null); }}
                                            className={`flex h-8 cursor-grab items-center gap-2 rounded-lg border px-2 active:cursor-grabbing ${draggedBreakpointId === frame.bp ? "border-ed-accent bg-ed-accent/10 opacity-60" : "border-ed-border bg-ed-subtle"}`}
                                            style={{ width: frame.width * scale }}
                                        >
                                            {editingBreakpointId === frame.bp && !componentMode ? (
                                                <input
                                                    ref={(node) => node?.select()}
                                                    value={definition?.name ?? frame.bp}
                                                    onChange={(event) => renameBreakpoint(frame.bp, event.target.value)}
                                                    onBlur={(event) => { renameBreakpoint(frame.bp, event.target.value); commitBreakpointName(frame.bp); setEditingBreakpointId(null); }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") event.currentTarget.blur();
                                                        if (event.key === "Escape") setEditingBreakpointId(null);
                                                    }}
                                                    className="w-24 rounded bg-ed-field px-1 text-[11px] font-medium text-ed-text outline-none ring-1 ring-ed-accent"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setBreakpoint(frame.bp)}
                                                    onDoubleClick={() => { if (!componentMode) setEditingBreakpointId(frame.bp); }}
                                                    title={componentMode ? undefined : "Double-click to rename"}
                                                    className={`text-[11px] font-medium capitalize transition-colors ${
                                                        primary
                                                            ? "text-ed-text"
                                                            : "text-ed-faint hover:text-ed-muted"
                                                    }`}
                                                >
                                                    {componentMode ? activeComponentMaster?.name ?? "Component" : definition?.name ?? frame.bp}
                                                </button>
                                            )}

                                            {componentMode ? (
                                                <span className="font-mono text-[10px] text-ed-faint">{`${frame.width} × ${canvasHeight}`}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={frame.width}
                                                    onChange={(event) => resizeBreakpoint(frame.bp, Number(event.target.value))}
                                                    onFocus={(event) => event.target.select()}
                                                    title={`Governs ${breakpointRange(frame.bp)}px`}
                                                    className="w-12 bg-transparent font-mono text-[10px] text-ed-faint outline-none hover:text-ed-muted focus:text-ed-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            )}
                                            {!componentMode && (
                                                <span className="font-mono text-[10px] text-ed-faint/60">{breakpointRange(frame.bp)}</span>
                                            )}

                                            <div className="ml-auto flex items-center gap-1">
                                                {!componentMode && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => { event.stopPropagation(); setBaseBreakpoint(frame.bp); }}
                                                        disabled={isBaseFrame}
                                                        title={isBaseFrame ? "Main breakpoint — its edits are shared" : "Make main breakpoint"}
                                                        className={`flex size-5 items-center justify-center rounded-md ${isBaseFrame ? "bg-ed-accent/15 text-ed-accent" : "bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"}`}
                                                    >
                                                        {isBaseFrame ? <IconPinFilled size={11} /> : <IconPin size={11} />}
                                                    </button>
                                                )}
                                                {!componentMode && breakpointDefs.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => { event.stopPropagation(); removeBreakpoint(frame.bp); }}
                                                        title="Remove breakpoint"
                                                        className="flex size-5 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-red-500/15 hover:text-red-400"
                                                    >
                                                        <IconTrash size={11} />
                                                    </button>
                                                )}
                                                <button type="button" onClick={(event) => { event.stopPropagation(); if (componentMode) createComponentVariant(); else addBreakpoint(); }} disabled={componentMode && selectedElement?.componentRole !== "master"} className="flex size-5 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-30" title={componentMode ? "Add variant" : "Add breakpoint"}><IconPlus size={12} /></button>
                                            </div>
                                        </div>

                                        {/* Reserves the scaled footprint so the
                                            scrollbars match what is on screen. */}
                                        <div
                                            className="group/frame relative"
                                            style={{
                                                width: frame.width * scale,
                                                height: displayCanvasHeight * scale,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {/* biome-ignore lint/a11y/noStaticElementInteractions: simulated viewport; a bare click clears the selection, as Escape does */}
                                            <div
                                                ref={primary ? frameRef : undefined}
                                                data-canvas-page
                                                className="shadow-2xl"
                                                style={{
                                                    width: frame.width,
                                                    minHeight: canvasHeight,
                                                    background: rootStyle.bg,
                                                    transform: `scale(${scale})`,
                                                    transformOrigin: "top left",
                                                    outline:
                                                        primary && frames.length > 1
                                                            ? "2px solid var(--ed-accent)"
                                                            : undefined,
                                                    outlineOffset: 3,
                                                }}
                                                onMouseDown={(event) => {
                                                    if (event.target === event.currentTarget)
                                                        beginMarquee(event, frame.bp);
                                                }}
                                            >
                                                {/* biome-ignore lint/a11y/noStaticElementInteractions: the page surface clears the selection on a bare click; Escape does the same */}
                                                <div
                                                    ref={primary ? canvasRef : undefined}
                                                    style={{
                                                        ...rootCss,
                                                        // Match the published page: the
                                                        // app font must not leak in.
                                                        fontFamily: resolveFont(
                                                            rootStyle.fontFamily,
                                                        ),
                                                        // The shell spans the frame; the
                                                        // content width comes from bands.
                                                        maxWidth: "none",
                                                        minHeight: canvasHeight,
                                                    }}
                                                    onDragOver={(event) => {
                                                        event.preventDefault();
                                                        event.dataTransfer.dropEffect = "copy";
                                                        setDropTargetId(null);
                                                    }}
                                                    onDrop={(event) => handleDrop(event, null)}
                                                    onMouseDown={(event) => {
                                                        if (event.target === event.currentTarget)
                                                            beginMarquee(event, frame.bp);
                                                    }}
                                                >
                                                    {visibleEditorElements.length === 0 && (
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-ed-muted">
                                                            Drag an element here to start
                                                        </div>
                                                    )}

                                                    {childrenOf(visibleEditorElements, undefined).map((el) =>
                                                        renderNode(
                                                            el,
                                                            frame,
                                                            undefined,
                                                            `${frame.bp}:`,
                                                        ),
                                                    )}

                                                    {primary &&
                                                        guides.lines.map((guide) => (
                                                            <div
                                                                key={`${guide.axis}-${guide.at}-${guide.from}`}
                                                                className="pointer-events-none absolute z-[9999] bg-fuchsia-500"
                                                                style={
                                                                    guide.axis === "x"
                                                                        ? {
                                                                              left:
                                                                                  guides.origin.x +
                                                                                  guide.at,
                                                                              top:
                                                                                  guides.origin.y +
                                                                                  guide.from,
                                                                              width: 1,
                                                                              height:
                                                                                  guide.to -
                                                                                  guide.from,
                                                                          }
                                                                        : {
                                                                              top:
                                                                                  guides.origin.y +
                                                                                  guide.at,
                                                                              left:
                                                                                  guides.origin.x +
                                                                                  guide.from,
                                                                              height: 1,
                                                                              width:
                                                                                  guide.to -
                                                                                  guide.from,
                                                                          }
                                                                }
                                                            />
                                                        ))}
                                                </div>
                                            </div>
                                            {componentMode && <button type="button" aria-label="Resize component width" onMouseDown={beginComponentWidthResize} className="absolute -right-1.5 inset-y-0 z-30 w-3 cursor-ew-resize opacity-0 transition-opacity group-hover/frame:opacity-100"><span className="absolute inset-y-1/2 left-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ed-accent shadow-[0_0_0_3px_var(--ed-accent-soft)]" /></button>}
                                            {primary && <button type="button" aria-label={`Resize ${componentMode ? "component" : "page"} canvas height`} onMouseDown={beginCanvasResize} className="absolute -bottom-1.5 inset-x-0 z-30 h-3 cursor-ns-resize opacity-0 transition-opacity group-hover/frame:opacity-100"><span className="absolute left-1/2 top-1/2 h-1 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ed-accent shadow-[0_0_0_3px_var(--ed-accent-soft)]" /></button>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 z-20 flex h-8 w-full items-center gap-2 border-t border-ed-border bg-ed-surface px-4 text-[11px] text-ed-muted shadow-sm">
                        <Breadcrumbs
                            byId={byId}
                            selectedId={selectedId}
                            onSelect={(id) => setSelectedIds([id])}
                        />
                    </div>

                    <div className="absolute bottom-12 right-6 z-20 flex items-center gap-0.5 rounded-lg border border-ed-border bg-ed-surface/90 p-1 shadow-md backdrop-blur">
                        <button type="button" title={effectsPreview ? "Stop interaction preview" : "Preview hover, press and layer actions"} onClick={() => { setEffectsPreview((value) => !value); setHoveredEffectId(null); setPressedEffectId(null); setPreviewVisibility({}); }} className={`rounded-md p-1.5 transition-colors ${effectsPreview ? "bg-ed-accent text-white" : "text-ed-faint hover:bg-ed-field hover:text-ed-text"}`}><IconPlayerPlay size={16} stroke={1.5} /></button>
                        <button
                            type="button"
                            title="Select"
                            className="rounded-md bg-[var(--ed-accent-soft)] p-1.5 text-ed-accent"
                        >
                            <IconPointer size={16} stroke={1.5} />
                        </button>
                        <button
                            type="button"
                            title="Recentre the canvas"
                            onClick={recenter}
                            className="rounded-md p-1.5 text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                        >
                            <IconFocusCentered size={16} stroke={1.5} />
                        </button>
                        <button
                            type="button"
                            title="Zoom to 100% (Ctrl 0)"
                            onClick={() => zoomTo(100)}
                            className="rounded-md px-1.5 py-1.5 font-mono text-[11px] text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                        >
                            1:1
                        </button>
                        <button
                            type="button"
                            title="Fit to width"
                            onClick={() => zoomToFit()}
                            className="rounded-md p-1.5 text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                        >
                            <IconArrowsMaximize size={16} stroke={1.5} />
                        </button>
                    </div>
                </main>

                <AnimatePresence initial={false}>
                {!isRightCollapsed && (
                    <motion.aside initial={{ width: 0, opacity: 0, x: 14 }} animate={{ width: 312, opacity: 1, x: 0 }} exit={{ width: 0, opacity: 0, x: 14 }} transition={{ type: "spring", stiffness: 420, damping: 38 }} className="z-10 flex w-[312px] shrink-0 flex-col overflow-hidden border-l border-ed-border bg-ed-surface/95 backdrop-blur-xl">
                        <div className="flex h-11 shrink-0 items-end gap-0.5 border-b border-ed-border px-2">
                            {(["Design", "Content", "Hover", "Interact"] as const).map((tab) => (
                                <button
                                    type="button"
                                    key={tab}
                                    onClick={() => setRightTab(tab)}
                                    disabled={!selectedElement}
                                    className={`relative flex-1 px-2 pb-3 pt-2 text-[11px] font-medium transition-colors disabled:opacity-30 ${
                                        rightTab === tab
                                            ? "text-ed-text"
                                            : "text-ed-muted hover:text-ed-text"
                                    }`}
                                >
                                    {tab === "Hover" ? "Effects" : tab === "Interact" ? "Actions" : tab}
                                    {rightTab === tab && selectedElement && (
                                        <motion.span
                                            layoutId="inspector-tab"
                                            className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ed-accent"
                                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {selectedElement && breakpoint !== "desktop" && (
                            <p className="border-b border-ed-border bg-amber-500/10 px-5 py-2.5 text-[11px] leading-relaxed text-amber-500">
                                Editing the <b>{breakpoint}</b> breakpoint. Changes here
                                override desktop and only apply at this size.
                            </p>
                        )}

                        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-3">
                            {selectedElement ? (
                                <>
                                    <div className="mb-1 flex items-baseline justify-between">
                                        <span className="text-[15px] font-semibold tracking-tight text-ed-text">
                                            {selectedElement.type}
                                        </span>
                                        <span className="font-mono text-[10px] text-ed-faint">
                                            {selectedElement.id.slice(0, 6)}
                                        </span>
                                    </div>
                                    <div className="mb-3 flex items-center gap-1.5">
                                        {!componentMode && rootStyle.layout === "absolute" && selectedElement.parentId && <button type="button" onClick={() => doReparent(selectedElement.id, undefined)} className="flex-1 rounded-lg border border-ed-border bg-ed-subtle px-2.5 py-2 text-[10px] font-medium text-ed-muted hover:border-ed-accent/50 hover:bg-ed-field hover:text-ed-text">Detach to canvas</button>}
                                        {selectedElement.componentRole === "master" && (
                                            <>
                                                <span className="rounded-md bg-ed-accent/15 px-2 py-1 text-[9px] font-semibold uppercase text-ed-accent">
                                                    Master · {selectedElement.variant}
                                                </span>
                                                <button type="button" onClick={createComponentInstance} className="rounded-lg bg-ed-field px-2 py-1.5 text-[9px] text-ed-text hover:bg-ed-field-hover">Instance</button>
                                                <button type="button" onClick={createComponentVariant} className="rounded-lg bg-ed-field px-2 py-1.5 text-[9px] text-ed-text hover:bg-ed-field-hover">+ Variant</button>
                                            </>
                                        )}
                                        {selectedElement.componentRole === "instance" && (
                                            <Select
                                                value={selectedElement.variant ?? "Default"}
                                                onValueChange={switchInstanceVariant}
                                            >
                                                <SelectTrigger className="h-8 min-w-0 flex-1" aria-label="Component variant">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {elements
                                                        .filter(
                                                            (element) =>
                                                                element.componentRole === "master" &&
                                                                element.componentId ===
                                                                    selectedElement.componentId,
                                                        )
                                                        .map((element) => (
                                                            <SelectItem
                                                                key={element.id}
                                                                value={element.variant ?? "Default"}
                                                            >
                                                                {element.variant ?? "Default"}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <motion.div
                                        key={rightTab}
                                        initial={{ opacity: 0, y: 7 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                    ><Inspector
                                        tab={rightTab}
                                        element={selectedElement}
                                        elements={visibleEditorElements}
                                        style={resolveStyle(selectedElement, breakpoint, cascade)}
                                        breakpoint={breakpoint}
                                        parentLayout={contextFor(selectedElement).parentLayout}
                                        onStyle={(patch) => patchStyle([selectedElement.id], patch)}
                                        onReset={(keys) => resetOverrides([selectedElement.id], keys)}
                                        onProps={(patch) => patchProps(selectedElement.id, patch)}
                                        onCommitStart={beginTransaction}
                                        onCommitEnd={endTransaction}
                                        sources={dataSources}
                                        bindingKeys={bindingKeys}
                                        insideRepeat={enclosingDataBlock !== undefined}
                                    /></motion.div>
                                </>
                            ) : selectedIds.length > 1 ? (
                                <MultiSelectPanel
                                    count={selectedIds.length}
                                    canArrange={arrangeable}
                                    onAlign={(action) =>
                                        setElements((els) =>
                                            alignElements(els, selectedIds, action, breakpoint),
                                        )
                                    }
                                    onDistribute={(action) =>
                                        setElements((els) =>
                                            distributeElements(els, selectedIds, action, breakpoint),
                                        )
                                    }
                                />
                            ) : (
                                <PageInspector rootStyle={rootStyle} onChange={(patch) => patch.layout ? switchPageLayout(patch.layout) : setRootStyle(patch)} onApplyStyleKit={applyStyleKit} onLoadShowcase={loadNocturneShowcase} />
                            )}
                        </div>
                    </motion.aside>
                )}
                </AnimatePresence>
            </div>

            {codeComposerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm" onMouseDown={() => setCodeComposerOpen(false)}><div className="flex h-[min(720px,85vh)] w-[min(820px,92vw)] flex-col overflow-hidden rounded-2xl border border-ed-border bg-ed-surface shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex h-12 items-center justify-between border-b border-ed-border px-4"><div><p className="text-xs font-semibold text-ed-text">New code component</p><p className="text-[9px] text-ed-faint">Sandboxed HTML and CSS — scripts stay disabled.</p></div><button type="button" onClick={() => setCodeComposerOpen(false)} className="rounded-md p-1.5 text-ed-muted hover:bg-ed-field hover:text-ed-text"><IconX size={15} /></button></div><div className="grid min-h-0 flex-1 grid-cols-2"><div className="flex min-h-0 flex-col gap-3 border-r border-ed-border p-4"><label className="text-[10px] font-medium text-ed-muted">Name<input value={codeComponentName} onChange={(event) => setCodeComponentName(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-ed-border bg-ed-field px-3 text-[11px] text-ed-text outline-none focus:border-ed-accent" /></label><label className="flex min-h-0 flex-1 flex-col text-[10px] font-medium text-ed-muted">HTML / CSS<textarea value={codeComponentSource} onChange={(event) => setCodeComponentSource(event.target.value)} spellCheck={false} className="mt-1.5 min-h-0 flex-1 resize-none rounded-xl border border-ed-border bg-[#101114] p-3 font-mono text-[11px] leading-relaxed text-zinc-300 outline-none focus:border-ed-accent" /></label></div><div className="flex min-h-0 flex-col bg-ed-canvas p-4"><span className="mb-2 text-[10px] font-medium text-ed-muted">Preview</span><iframe title="Code component preview" srcDoc={codeComponentSource} sandbox="" className="min-h-0 flex-1 rounded-xl border border-ed-border bg-white" /></div></div><div className="flex h-14 items-center justify-end gap-2 border-t border-ed-border px-4"><button type="button" onClick={() => setCodeComposerOpen(false)} className="rounded-lg px-3 py-2 text-[10px] text-ed-muted hover:bg-ed-field">Cancel</button><button type="button" onClick={createCodeComponent} disabled={!codeComponentSource.trim()} className="rounded-lg bg-ed-accent px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-30">Create component</button></div></div></div>}

            {breakpointPanel && !componentMode && (
                <div className="fixed left-1/2 top-16 z-[80] w-[420px] -translate-x-1/2 rounded-2xl border border-ed-border bg-ed-surface p-4 shadow-2xl">
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-ed-text">Breakpoints</h3>
                            <p className="mt-1 text-[11px] text-ed-muted">Rename, resize and reorder the viewports. Main values are shared by every other size.</p>
                        </div>
                        <button type="button" onClick={() => setBreakpointPanel(false)} className="rounded p-1 text-ed-muted hover:bg-ed-field"><IconX size={15} /></button>
                    </div>
                    <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto scrollbar-none">
                        {breakpointDefs.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-[1fr_86px_auto] items-center gap-2 rounded-xl border border-ed-border bg-ed-subtle p-2">
                                <input
                                    aria-label="Breakpoint name"
                                    value={item.name}
                                    onChange={(event) => renameBreakpoint(item.id, event.target.value)}
                                    onBlur={() => commitBreakpointName(item.id)}
                                    className="min-w-0 rounded-lg border border-ed-border bg-ed-field px-2.5 py-2 text-xs text-ed-text outline-none focus:border-ed-accent"
                                />
                                <label className="flex items-center rounded-lg border border-ed-border bg-ed-field px-2 py-2 text-xs text-ed-muted">
                                    <input
                                        aria-label="Breakpoint width"
                                        type="number"
                                        min={240}
                                        max={4000}
                                        value={item.width}
                                        onChange={(event) => resizeBreakpoint(item.id, Number(event.target.value) || 240)}
                                        className="w-full bg-transparent text-right tabular-nums text-ed-text outline-none"
                                    />px
                                </label>
                                <div className="flex items-center gap-0.5">
                                    {item.id === cascade.baseId ? (
                                        <span className="rounded-md bg-ed-accent/15 px-2 py-1.5 text-[10px] font-semibold text-ed-accent">MAIN</span>
                                    ) : (
                                        <button type="button" title="Make main" onClick={() => setBaseBreakpoint(item.id)} className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-ed-muted hover:bg-ed-field hover:text-ed-text">MAIN</button>
                                    )}
                                    <button type="button" disabled={index === 0} title="Move left" onClick={() => { const next = [...breakpointDefs]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateBreakpoints(next); }} className="rounded p-1 text-ed-faint hover:bg-ed-field disabled:opacity-20"><IconChevronLeft size={13} /></button>
                                    <button type="button" disabled={index === breakpointDefs.length - 1} title="Move right" onClick={() => { const next = [...breakpointDefs]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; updateBreakpoints(next); }} className="rounded p-1 text-ed-faint hover:bg-ed-field disabled:opacity-20"><IconChevronRight size={13} /></button>
                                    {item.id !== cascade.baseId && breakpointDefs.length > 1 && (
                                        <button type="button" title="Delete" onClick={() => removeBreakpoint(item.id)} className="rounded p-1 text-ed-faint hover:bg-red-500/10 hover:text-red-400"><IconTrash size={13} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {contextMenu && menuElementId && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onBringForward={() => {
                        setElements((els) => reorder(els, menuElementId, "up"));
                        setContextMenu(null);
                    }}
                    onSendBackward={() => {
                        setElements((els) => reorder(els, menuElementId, "down"));
                        setContextMenu(null);
                    }}
                    onWrap={() => {
                        const wrapped = wrapInContainer(
                            elements,
                            menuElementId,
                            breakpoint,
                        );
                        if (wrapped) {
                            setElements(wrapped.elements);
                            setSelectedIds([wrapped.wrapperId]);
                        }
                        setContextMenu(null);
                    }}
                    onUnwrap={() => {
                        const el = byId.get(menuElementId);
                        const grandparent = el?.parentId
                            ? byId.get(el.parentId)?.parentId
                            : undefined;
                        doReparent(menuElementId, grandparent);
                        setContextMenu(null);
                    }}
                    onDuplicate={() => duplicateElements([menuElementId])}
                    onCopy={() => {
                        copyElements([menuElementId]);
                        setContextMenu(null);
                    }}
                    onDelete={() => deleteElements([menuElementId])}
                />
            )}

            {contextMenu && !contextMenu.elementId && (
                <div className="fixed z-[90] w-48 overflow-hidden rounded-xl border border-ed-border bg-ed-surface p-1.5 shadow-2xl" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    {(["Text", "Heading", "Button", "Container"] as ElementType[]).map((type) => (
                        <button key={type} type="button" onClick={() => {
                            const created = createElement(type, { x: contextMenu.canvasX ?? 0, y: contextMenu.canvasY ?? 0, z: nextZ(elements) });
                            if (type === "Text") created.content = "Canvas note";
                            setElements((current) => [...current, created]);
                            setSelectedIds([created.id]);
                            setContextMenu(null);
                        }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-ed-muted hover:bg-ed-field hover:text-ed-text">
                            <IconPlus size={13} /> Add {type}
                        </button>
                    ))}
                    <div className="my-1 h-px bg-ed-border" />
                    {componentMode ? <button type="button" onClick={() => { createComponentVariant(); setContextMenu(null); }} disabled={selectedElement?.componentRole !== "master"} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-ed-muted hover:bg-ed-field hover:text-ed-text disabled:opacity-30"><IconComponents size={13} /> Add variant</button> : <><button type="button" onClick={() => {
                        addBreakpoint();
                        setBreakpointPanel(true);
                        setContextMenu(null);
                    }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-ed-muted hover:bg-ed-field hover:text-ed-text">
                        <IconLayoutColumns size={13} /> Add breakpoint
                    </button>
                    <button type="button" onClick={() => {
                        setBreakpointPanel(true);
                        setContextMenu(null);
                    }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-ed-muted hover:bg-ed-field hover:text-ed-text">
                        <IconBox size={13} /> Breakpoint settings
                    </button></>}
                </div>
            )}

            {marquee && <div className="pointer-events-none fixed z-[110] border border-blue-400 bg-blue-500/20 shadow-[0_0_0_1px_rgba(59,130,246,.15)]" style={{ left: Math.min(marquee.startX, marquee.x), top: Math.min(marquee.startY, marquee.y), width: Math.abs(marquee.x - marquee.startX), height: Math.abs(marquee.y - marquee.startY) }} />}

            <style
                // biome-ignore lint/security/noDangerouslySetInnerHtml: webkit scrollbar pseudo-elements have no Tailwind utility
                dangerouslySetInnerHTML={{
                    __html: `${customFontCss}
                        .canvas-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
                        .canvas-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
                    `,
                }}
            />
        </div>
    );
}
