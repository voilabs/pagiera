"use client";
import { AiSettings } from "./ui/ai-settings";
import { WorkspaceTabs, useWorkspaceTabs, type WorkspaceTab } from "./ui/workspace-tabs";

import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconArrowsMaximize,
    IconCommand,
    IconCode,
    IconComponents,
    IconCopy,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconDatabase,
    IconDeviceDesktop,
    IconDots,
    IconDeviceMobile,
    IconDeviceTablet,
    IconFocusCentered,
    IconMinus,
    IconPlayerPlay,
    IconPointer,
    IconPlus,
    IconSearch,
    IconSettings,
    IconSparkles,
    IconTrash,
    IconUnlink,
    IconRefresh,
    IconWorld,
    IconLayersLinked,
    IconLayoutColumns,
    IconBox,
    IconEyeOff,
    IconFile,
    IconFrame,
    IconPalette,
    IconPin,
    IconPinFilled,
    IconTemplate,
    IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type React from "react";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
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
import {
    ChromeButton,
    AssetsPanel,
    SettingsNavigation,
    SettingsWorkspace,
    TemplatesNavigation,
    PanelAction,
    PanelHeader,
    PanelSearch,
    RailTab,
    Readout,
    SegmentedBar,
    ToolButton,
    ToolDivider,
    ToolGroup,
    Menu,
    MenuItem,
    MenuLink,
    MenuSeparator,
    EditorShell,
} from "./ui";
import { alignElements, distributeElements } from "@/lib/editor/arrange";
import { baseOf, cascadeOf, duplicateThresholds, windowRangeChip, windowRangeLabel } from "@/lib/editor/cascade";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import { bindElement, type Row, rowsFor } from "@/lib/render/bind";
import { resolveFont } from "@/lib/render/css";
import { inlineStyleObject } from "@/lib/render/custom";
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
    displayName,
    cloneSubtree,
    createElement,
    indexById,
    nextZ,
    removeSubtree,
    reorder,
    reparent,
    parkedIds,
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
    REQUIRED_BREAKPOINT_IDS,
} from "@/lib/editor/types";
import { Inspector, INSPECTOR_TABS, MultiSelectPanel, PageInspector } from "./inspector";
import { PagieraMark } from "./brand";
import { GestureLayer, type GestureLayerHandle, type Measure } from "./gesture-layer";

import { DataPanel, type SourceSample } from "./data-panel";
import type { SourcePreviewer } from "./data-modal";
import { type LibraryPage, type LibraryPick, LibraryPanel } from "./library";
import {
    ContextMenu,
    ElementBody,
    ElementsPanel,
    IconsPanel,
    LayersPanel,
    type PageEntry,
    PagesPanel,
    PaddingHandles,
    ResizeHandles,
    SectionSeam,
    SaveIndicator,
    SiteTransfer,
} from "./parts";
import { type DropPlan, resolveDrop } from "./drop-target";
import { useCanvasView } from "./use-canvas-view";
import { useEditorDocument } from "./use-editor";
import { AiPanel, type AiDesignGenerator, type AiFocus } from "./ai-panel";
import { HistoryPanel } from "./history-panel";
import { LumaMark } from "./brand";
import { VariablesPanel } from "./variables-panel";
import { TemplatesPanel } from "./templates-panel";
import { WorkspaceMenu } from "./ui/workspace-menu";
import { InsertMenu } from "./ui/insert-menu";
import { SHADER_PRESETS, shaderDocument } from "@/lib/editor/shaders";
import { normalizeInteractive, interactiveDocument, restoreInteractiveElement } from "@/lib/editor/interactive";
import { MarqueePreview } from "./ui/marquee-preview";
import { CarouselEditor } from "./ui/carousel-editor";
import { carouselControlAttributes } from "@/lib/editor/carousel-controls";
import { disclosureAttributes, disclosureChildren } from '@/lib/editor/disclosure';
import { mountDisclosures } from '@/lib/render/disclosure';
import { canvasTargetSelector } from "@/lib/editor/canvas-target";
import { applyPageLayout } from "@/lib/editor/page-layout";

const MIN_SIZE = 10;
/** How close to its container's edge a drag counts as "all the way". */
const SNAP_FILL = 12;
const COMPONENT_MIME = "application/pagiera-component";
const EDITOR_TABS_STORAGE_KEY = "pagiera:editor-tabs";

/**
 * The left rail, in the order it is drawn.
 *
 * "Insert" is one panel with its own Elements / Components / Icons sub-tabs.
 * They used to be three separate rail entries, which put four different
 * buttons — counting the + at the top — in front of the same question, and two
 * of the panels behind them listed the same element types.
 */
const LEFT_EDITOR_TABS = [
    "Insert",
    "Layers",
    "Components",
    "Assets",
    "Templates",
    "Variables",
    "AI",
    "Data",
    "Pages",
    "History",
    "Settings",
] as const;

/** The sections of the Insert panel. */
const INSERT_VIEWS = ["Elements", "Components", "Icons"] as const;
type InsertView = (typeof INSERT_VIEWS)[number];
const RIGHT_EDITOR_TABS = INSPECTOR_TABS;

type LeftEditorTab = (typeof LEFT_EDITOR_TABS)[number];
type RightEditorTab = (typeof RIGHT_EDITOR_TABS)[number];

type ComponentAsset = {
    id: string;
    name: string;
    variants: CanvasElement[];
};

function componentHasContent(elements: CanvasElement[], master: CanvasElement) {
    return Boolean(
        master.code ||
        master.src ||
        master.content?.trim() ||
        elements.some((element) => element.parentId === master.id),
    );
}

function ComponentAssetCards({
    assets,
    activeMasterId,
    onOpen,
}: {
    assets: ComponentAsset[];
    activeMasterId?: string;
    onOpen: (master: CanvasElement) => void;
}) {
    if (assets.length === 0) return <p className="rounded-2xl border border-dashed border-ed-border p-5 text-center text-[10px] text-ed-faint">Create a shared asset or add one from code.</p>;
    return (
        <div className="space-y-3">
            {assets.map((asset) => (
                <section key={asset.id} className="overflow-hidden rounded-[18px] bg-ed-subtle">
                    <button type="button" onClick={() => onOpen(asset.variants[0])} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-ed-field">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-ed-field text-ed-accent"><IconComponents size={16} /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-ed-text">{asset.name}</span><span className="block text-[9px] text-ed-faint">{asset.variants.length} variant{asset.variants.length === 1 ? "" : "s"} · shared across pages</span></span>
                        <IconChevronRight size={14} className="text-ed-faint" />
                    </button>
                    <div className="grid grid-cols-2 gap-1.5 border-t border-ed-border p-2">
                        {asset.variants.map((variant) => (
                            <button
                                key={variant.id}
                                type="button"
                                draggable
                                onDragStart={(event) => { event.dataTransfer.setData(COMPONENT_MIME, variant.id); event.dataTransfer.effectAllowed = "copy"; }}
                                onClick={() => onOpen(variant)}
                                className={`group min-w-0 cursor-grab rounded-xl border p-1.5 text-left active:cursor-grabbing ${activeMasterId === variant.id ? "border-ed-accent bg-[var(--ed-accent-soft)]" : "border-transparent bg-ed-field hover:border-ed-border"}`}
                            >
                                <span className="mb-1.5 flex h-12 items-center justify-center overflow-hidden rounded-xl" style={{ background: variant.base.gradient || variant.base.bg || "var(--ed-surface)" }}>
                                    <span className="rounded-md bg-black/35 px-2 py-1 font-mono text-[8px] text-white/80">{Math.round(variant.base.w)}×{Math.round(variant.base.h)}</span>
                                </span>
                                <span className="block truncate px-1 text-[9px] font-semibold text-ed-text">{variant.variant ?? "Default"}</span>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

function isEditorTab<T extends string>(value: unknown, tabs: readonly T[]): value is T {
    return typeof value === "string" && tabs.includes(value as T);
}

/** URL segment for a panel, where it differs from the tab's own name. */
const PANEL_SLUGS: Partial<Record<LeftEditorTab, string>> = { Insert: "elements" };

function panelSlug(tab: LeftEditorTab): string {
    return PANEL_SLUGS[tab] ?? tab.toLowerCase();
}

function leftTabFromValue(value: string | null): LeftEditorTab | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    const aliased = (Object.keys(PANEL_SLUGS) as LeftEditorTab[]).find((tab) => PANEL_SLUGS[tab] === normalized);
    if (aliased) return aliased;
    return LEFT_EDITOR_TABS.find((tab) => tab.toLowerCase() === normalized);
}

function leftTabFromPath(pathname: string): LeftEditorTab | undefined {
    const segment = pathname.split("/").filter(Boolean).at(-1);
    return leftTabFromValue(segment ? decodeURIComponent(segment) : null);
}

/** Panels the sidebar already renders; opening them needs no second column. */
function tabForDocumentMode(tab: LeftEditorTab, componentMode: boolean): LeftEditorTab {
    if (componentMode) {
        if (tab === "Assets") return "Components";
        if (tab === "Pages" || tab === "Templates" || tab === "Settings") return "Layers";
        return tab;
    }
    return tab === "Components" ? "Assets" : tab;
}

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
    mcp?: import("./ui/mcp-panel").McpAdapter;
    createPage?: (name: string, slug: string) => Promise<PageMutationResult>;
    renamePage?: (id: string, name: string, slug: string) => Promise<PageMutationResult>;
    duplicatePage?: (id: string, name: string, slug: string) => Promise<PageMutationResult>;
    deletePage?: (id: string) => Promise<PageMutationResult>;
    installTemplate?: (templateId: string, fontFamily?: string) => Promise<PageMutationResult>;
    /** Installs a bundle the author supplied from a file rather than the catalog. */
    importTemplate?: (bundle: unknown, fontFamily?: string) => Promise<PageMutationResult>;
    /** Where the current site can be downloaded as a template bundle. */
    exportTemplateUrl?: (id: string) => string;
    setSiteFont?: (fontFamily: string, customFonts?: RootStyle["customFonts"]) => Promise<unknown>;
    setSiteTransition?: (pageTransition: RootStyle["pageTransition"], pageTransitionDuration: number) => Promise<unknown>;
    /** Names the shared components that wrap every page of the site. */
    setSiteLayout?: (headerId?: string, footerId?: string) => Promise<unknown>;
    publishPage?: (id: string) => Promise<PageMutationResult>;
    unpublishPage?: (id: string, slug: string) => Promise<PageMutationResult>;
    navigate?: (pageId: string, options?: { replace?: boolean }) => void | Promise<void>;
    editorHref?: (pageId: string, panel?: string) => string;
    refresh?: () => void;
    previewHref?: (pageId: string) => string;
    /** Saved versions of a page, newest first. */
    listRevisions?: (pageId: string) => Promise<unknown>;
    /** Puts a saved version back into the draft. */
    restoreRevision?: (pageId: string, revisionId: string) => Promise<unknown>;
    /** Stores an image and answers with its URL; without it images are inlined. */
    uploadImage?: (file: File) => Promise<string>;
    publishedHref?: (slug: string) => string;
    previewSource?: SourcePreviewer;
    /** Compiles author TSX into an isolated, self-contained browser document. */
    compileCode?: (source: string) => Promise<{ status: "ok"; html: string }>;
};

const defaultEditorHref = (pageId: string, panel?: string) => `/editor/${encodeURIComponent(pageId)}${panel ? `/${encodeURIComponent(panel)}` : ""}`;
const defaultPublishedHref = (slug: string) => slug === "home" || slug === "" ? "/" : `/${slug.split("/").map((part) => part.startsWith(":") ? part : encodeURIComponent(part)).join("/")}`;
const DEFAULT_TSX_COMPONENT = `export default function Card() {
  return (
    <article style={{ padding: 24, fontFamily: "system-ui", color: "#17141f" }}>
      <span style={{ color: "#6a25f0", fontSize: 12, fontWeight: 700 }}>PAGIERA COMPONENT</span>
      <h2 style={{ margin: "12px 0 8px", fontSize: 28 }}>Built with TSX.</h2>
      <p style={{ margin: 0, color: "#6f6878" }}>Edit the source and ship it as a reusable component.</p>
    </article>
  );
}`;
const DEFAULT_HTML_COMPONENT = `<style>body{margin:0;font-family:system-ui;display:grid;place-items:center;height:100vh}button{border:0;border-radius:12px;padding:14px 22px;background:#6a25f0;color:white;font-weight:600}</style><button>Button</button>`;

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
    /** Set for text, so a corner drag can scale the type with the box. */
    initialFontSize?: number;
};

type PadSide = "padT" | "padR" | "padB" | "padL";

type PaddingInfo = {
    id: string;
    breakpoint: Breakpoint;
    side: PadSide;
    startX: number;
    startY: number;
    initial: number;
    /** Alt-drag moves the opposite side by the same amount. */
    symmetric: boolean;
};

type Clipboard = { elements: CanvasElement[]; rootId: string };

/** Shared empty list, so a childless layer allocates nothing. */
const EMPTY_CHILDREN: CanvasElement[] = [];

export default function Editor({
    page,
    pages,
    library,
    adapters,
    templateRegistryUrl,
    initialPanel,
}: {
    page: EditorPage;
    pages: PageEntry[];
    library: LibraryPage[];
    adapters?: EditorAdapters;
    templateRegistryUrl?: string;
    initialPanel?: string;
}) {
    const [isPending, startTransition] = useTransition();
    const reduceMotion = useReducedMotion();

    const {
        elements: documentElements,
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

    // Layout chrome is derived from the current master, never a stale saved copy.
    // Keeping this out of state also prevents preview updates from creating undo/save loops.
    const elements = useMemo(
        () => {
            const restored = documentElements.map(restoreInteractiveElement);
            return applyPageLayout(restored, restored, rootStyle.pageLayoutId);
        },
        [documentElements, rootStyle.pageLayoutId],
    );
    const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
    const [breakpointPanel, setBreakpointPanel] = useState(false);
    const componentMode = rootStyle.documentMode === "component";
    const componentMasters = elements.filter((element) => element.componentRole === "master");
    const componentAssets = useMemo<ComponentAsset[]>(() => {
        const grouped = new Map<string, ComponentAsset>();
        for (const master of componentMasters) {
            const id = master.componentId ?? master.id;
            const current = grouped.get(id);
            if (current) current.variants.push(master);
            else grouped.set(id, { id, name: master.name?.trim() || "Untitled asset", variants: [master] });
        }
        return [...grouped.values()];
    }, [elements]);
    const [activeComponentMasterId, setActiveComponentMasterId] = useState<string | null>(null);
    /** Measured component roots; these size the editor surface, never the instance. */
    const [componentPreviewSizes, setComponentPreviewSizes] = useState<Record<string, { width: number; height: number }>>({});
    const componentPreviewObservers = useRef(new Map<string, ResizeObserver>());
    /** Legacy Hug migration runs once; later manual resizing belongs to the author. */
    const normalizedComponentMasters = useRef(new Set<string>());
    const activeComponentMaster = componentMasters.find((element) => element.id === activeComponentMasterId) ?? componentMasters[0];
    const activeComponentVariants = activeComponentMaster
        ? componentMasters.filter((element) => element.componentId === activeComponentMaster.componentId)
        : [];

    /*
     * Older blank components were fixed, absolute artboards. Dropping one
     * button into them therefore produced a component whose invisible wrapper
     * stayed as large as the editing canvas. A one-child component is the
     * common button/badge/icon case: turn that legacy wrapper into a genuine
     * intrinsic component and put its child back into normal flow. This also
     * makes longer instance text expand the component instead of overflowing.
     */
    useEffect(() => {
        if (!componentMode || !activeComponentMaster || activeComponentMaster.isLayout) return;
        const directChildren = elements.filter((element) => element.parentId === activeComponentMaster.id);
        if (directChildren.length !== 1) return;
        const child = directChildren[0];
        const masterNeedsHug =
            activeComponentMaster.base.widthMode !== "auto" ||
            activeComponentMaster.base.heightMode !== "auto" ||
            activeComponentMaster.base.layout !== "stack";
        const childNeedsFlow = child.base.position !== "static" || child.base.x !== 0 || child.base.y !== 0;
        // Component variants are the responsive/state surface. Carrying page
        // breakpoint overrides into a master creates invisible declarations
        // that the component editor cannot select, yet the renderer applies
        // them at tablet/mobile widths (for example 600 becoming 500).
        const hasHiddenOverrides = Boolean(
            Object.keys(activeComponentMaster.overrides ?? {}).length ||
            Object.keys(child.overrides ?? {}).length,
        );
        const alreadyNormalized = normalizedComponentMasters.current.has(activeComponentMaster.id);
        if (alreadyNormalized && !hasHiddenOverrides) return;
        normalizedComponentMasters.current.add(activeComponentMaster.id);
        if (!masterNeedsHug && !childNeedsFlow && !hasHiddenOverrides) return;

        setElements((current) => current.map((element) => {
            if (element.id === activeComponentMaster.id) {
                return {
                    ...element,
                    overrides: undefined,
                    base: {
                        ...element.base,
                        widthMode: "auto",
                        heightMode: "auto",
                        layout: "stack",
                        direction: "row",
                        align: "center",
                        justify: "center",
                        padT: 0,
                        padR: 0,
                        padB: 0,
                        padL: 0,
                        overflow: "visible",
                    },
                };
            }
            if (element.id === child.id) {
                return {
                    ...element,
                    overrides: undefined,
                    base: { ...element.base, position: "static", x: 0, y: 0 },
                };
            }
            return element;
        }));
    }, [activeComponentMaster, componentMode, elements, setElements]);
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

    const frames = useMemo<Array<{ bp: Breakpoint; width: number; masterId?: string }>>(
        () => componentMode
            ? activeComponentVariants.map((variant) => {
                  const hasContent = componentHasContent(elements, variant);
                  return {
                      bp: "desktop",
                      // Empty masters do not expose their stale fixed canvas.
                      // The ghost is the entire surface until real content is
                      // present; afterwards this follows the rendered root.
                      width: hasContent
                          ? variant.base.widthMode === "fixed"
                              ? Math.max(1, variant.base.w)
                              : Math.max(1, componentPreviewSizes[variant.id]?.width ?? 1)
                          : 160,
                      masterId: variant.id,
                  };
              })
            : breakpointDefs.map((item) => ({ bp: item.id, width: item.canvasWidth ?? item.width })),
        [activeComponentVariants, breakpointDefs, componentMode, componentPreviewSizes, elements],
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

    const serverLeftTab = tabForDocumentMode(leftTabFromValue(initialPanel ?? null) ?? "Layers", componentMode);
    const [leftTab, setLeftTab] = useState<LeftEditorTab>(serverLeftTab);
    const [settingsSection, setSettingsSection] = useState<"general" | "variables" | "transfer" | "ai">("general");
    const [enterToSend, setEnterToSend] = useState(true);
    useEffect(() => {
        try { setEnterToSend(localStorage.getItem("pagiera:ai-enter-to-send") !== "false"); } catch { /* Browser preference is optional. */ }
    }, []);
    const updateEnterToSend = (value: boolean) => {
        setEnterToSend(value);
        try { localStorage.setItem("pagiera:ai-enter-to-send", String(value)); } catch { /* Keep the in-memory choice. */ }
    };
    useEffect(() => {
        if (leftTab === "Variables") {
            setSettingsSection("variables");
            setLeftTab("Settings");
        }
    }, [leftTab]);
    const [templateCategory, setTemplateCategory] = useState("All");
    const [templateCategories, setTemplateCategories] = useState<string[]>(["All"]);
    const [rightTab, setRightTab] = useState<RightEditorTab>("Content");
    const [rightSection, setRightSection] = useState<"Luma" | "Style">("Style");
    const [insertView, setInsertView] = useState<InsertView>("Elements");
    /** The Luma chat currently open, so the panel header can name it. */
    const [aiChatTitle, setAiChatTitle] = useState<string>();
    /** The component library brings its own scrolling; see the panel body below. */
    const libraryFillsPanel = leftTab === "Insert" && insertView === "Components";
    /** The left panel's scroll box, so switching Insert views can rewind it. */
    const leftPanelScrollRef = useRef<HTMLDivElement>(null);
    const [tabsRestored, setTabsRestored] = useState(false);
    /*
     * Layers and Pages live in the sidebar, so a session restored onto one of
     * them opens with no second column at all rather than with a panel that
     * would repeat what is already on screen.
     */
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(
        serverLeftTab === "Templates",
    );
    const [search, setSearch] = useState("");
    /** The publish button's overflow: the actions you reach for far less often. */
    const [publishMenuOpen, setPublishMenuOpen] = useState(false);
    /** The toolbar's overflow: every panel that is not Insert. */
    const [panelMenuOpen, setPanelMenuOpen] = useState(false);
    /**
     * Luma is a popup over the canvas rather than a sidebar panel: a chat is a
     * conversation you keep an eye on while you work, and in a 280px column it
     * was competing with the page's own lists for the same space.
     */
    /** The sidebar's one search box filters both lists it holds. */
    const visiblePages = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return pages;
        return pages.filter((entry) =>
            entry.name.toLowerCase().includes(needle) || entry.slug.toLowerCase().includes(needle),
        );
    }, [pages, search]);

    useLayoutEffect(() => {
        try {
            const routed = leftTabFromValue(initialPanel ?? null) ?? leftTabFromPath(window.location.pathname);
            const queried = leftTabFromValue(new URLSearchParams(window.location.search).get("tab"));
            const stored = JSON.parse(localStorage.getItem(EDITOR_TABS_STORAGE_KEY) ?? "null") as {
                left?: unknown;
                right?: unknown;
            } | null;
            if (routed) {
                setLeftTab(tabForDocumentMode(routed, componentMode));
            } else if (queried) {
                setLeftTab(tabForDocumentMode(queried, componentMode));
            } else if (isEditorTab(stored?.left, LEFT_EDITOR_TABS)) {
                setLeftTab(tabForDocumentMode(stored.left, componentMode));
            }
            if (isEditorTab(stored?.right, RIGHT_EDITOR_TABS)) setRightTab(stored.right);
        } catch {
            // Storage can be unavailable or contain data from an older editor build.
        } finally {
            setTabsRestored(true);
        }
    }, [initialPanel]);

    useEffect(() => {
        setLeftTab((current) => tabForDocumentMode(current, componentMode));
    }, [componentMode]);

    useEffect(() => {
        if (!tabsRestored) return;
        try {
            localStorage.setItem(EDITOR_TABS_STORAGE_KEY, JSON.stringify({ left: leftTab, right: rightTab }));
            const href = (adapters?.editorHref ?? defaultEditorHref)(page.id, panelSlug(leftTab));
            const url = new URL(href, window.location.href);
            const current = new URL(window.location.href);
            current.searchParams.delete("tab");
            url.search = current.search;
            url.hash = current.hash;
            if (`${url.pathname}${url.search}${url.hash}` !== `${current.pathname}${current.search}${current.hash}`) {
                window.history.replaceState(window.history.state, "", url);
            }
        } catch {
            // A private-mode storage failure must not interrupt editing.
        }
    }, [adapters?.editorHref, leftTab, page.id, rightTab, tabsRestored]);

    useEffect(() => {
        const restoreTabFromHistory = () => {
            const routed = leftTabFromPath(window.location.pathname);
            const queried = leftTabFromValue(new URLSearchParams(window.location.search).get("tab"));
            const restored = routed ?? queried;
            if (restored) {
                const next = tabForDocumentMode(restored, componentMode);
                setLeftTab(next);
                setIsLeftCollapsed(next === "Templates");
            }
        };
        window.addEventListener("popstate", restoreTabFromHistory);
        return () => window.removeEventListener("popstate", restoreTabFromHistory);
    }, [componentMode]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const hasElementSelection = selectedIds.length > 0;
    /**
     * Style is only ever about a selection, so it stands down when there is
     * none rather than showing an empty panel with a heading on it.
     */
    const activeRightSection = hasElementSelection && adapters?.generate ? rightSection : hasElementSelection ? "Style" : "Luma";
    const [editingId, setEditingId] = useState<string | null>(null);
    // Keep the complete hovered ancestry. A component root and a nested button
    // may both own hover states; a single ID made the parent snap back as soon
    // as the pointer crossed into its child.
    const [hoveredEffectIds, setHoveredEffectIds] = useState<Set<string>>(() => new Set());
    const [pressedEffectId, setPressedEffectId] = useState<string | null>(null);
    const [effectsPreview, setEffectsPreview] = useState(false);
    const [stickyPreview, setStickyPreview] = useState(true);
    const [previewVisibility, setPreviewVisibility] = useState<Record<string, boolean>>({});
    const [marquee, setMarquee] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    /**
     * What dragging on the empty canvas does: rubber-band a selection, or draw
     * a new frame beside the artboards.
     */
    const [canvasTool, setCanvasTool] = useState<"select" | "frame">("select");
    const [frameDraw, setFrameDraw] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    const [codeComposerOpen, setCodeComposerOpen] = useState(false);
    const [codeComponentName, setCodeComponentName] = useState("Code Component");
    const [codeComponentLanguage, setCodeComponentLanguage] = useState<"tsx" | "html">("tsx");
    const [codeComponentSource, setCodeComponentSource] = useState(DEFAULT_TSX_COMPONENT);
    const [codeComponentPreview, setCodeComponentPreview] = useState("");
    const [codeComponentError, setCodeComponentError] = useState("");
    const [codeComponentCompiling, setCodeComponentCompiling] = useState(false);
    const [draggedBreakpointId, setDraggedBreakpointId] = useState<string | null>(null);
    const [editingBreakpointId, setEditingBreakpointId] = useState<string | null>(null);
    const marqueePageRef = useRef<HTMLElement | null>(null);
    const marqueeBaseRef = useRef<string[]>([]);
    /** The last selection the band produced, so identical frames do nothing. */
    const marqueeHitsRef = useRef("");
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

    /**
     * Desktop is the main breakpoint, always: what you change on the widest
     * artboard is what the narrower ones inherit.
     *
     * A document saved back when the main artboard was a choice is rebased
     * once, on open, through the same routine the pin used to call — moving
     * the shared values rather than silently reading the old ones against a
     * different base.
     */
    const rebasedToDesktop = useRef(false);
    useEffect(() => {
        if (rebasedToDesktop.current || cascade.baseId === "desktop") return;
        if (!breakpointDefs.some((item) => item.id === "desktop")) return;
        rebasedToDesktop.current = true;
        setBaseBreakpoint("desktop");
        // The rebase is a one-time migration, not something to re-run whenever
        // the callback identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cascade.baseId, breakpointDefs]);

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

    /**
     * The threshold: which visitor windows this artboard governs. Changing it
     * changes the published page, so it lives in breakpoint settings rather
     * than on the artboard, where it used to be one number away from a
     * harmless resize.
     */
    const setBreakpointThreshold = (id: string, width: number) => {
        const clamped = Math.round(Math.max(240, Math.min(3840, width)));
        if (!Number.isFinite(clamped)) return;
        updateBreakpoints(
            breakpointDefs.map((item) =>
                item.id === id ? { ...item, width: clamped } : item,
            ),
        );
    };

    /** How wide the artboard is drawn. Visitors never see this number. */
    const resizeBreakpoint = (id: string, width: number) => {
        const clamped = Math.round(Math.max(240, Math.min(3840, width)));
        if (!Number.isFinite(clamped)) return;
        updateBreakpoints(
            breakpointDefs.map((item) =>
                item.id === id ? { ...item, canvasWidth: clamped } : item,
            ),
        );
    };

    const removeBreakpoint = (id: string) => {
        // Desktop, tablet and mobile are the set every page keeps; the delete
        // controls are hidden for them, and this is the backstop.
        if (REQUIRED_BREAKPOINT_IDS.includes(id as (typeof REQUIRED_BREAKPOINT_IDS)[number])) return;
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
    /*
     * Parked frames.
     *
     * A frame beside the artboards rather than inside one: drawn, selected and
     * styled like anything else, but not part of the page until it is dragged
     * onto an artboard. Its x/y are canvas coordinates, because no page ever
     * lays it out.
     */
    const parkedRoots = elements.filter((element) => element.parked);
    /** A parked frame and everything inside it. */
    const parkedSubtree = useMemo(() => parkedIds(elements), [elements]);
    /**
     * Which breakpoint's values an element is styled by.
     *
     * Almost always the one being edited — but a parked frame belongs to no
     * artboard, so no artboard's overrides may reach it. Reading it at the
     * active breakpoint is what made the parked frames slide around the canvas
     * when the breakpoint changed: they still carried the overrides they were
     * given while they lived inside one, and switching artboards swapped which
     * x/y applied. Outside the page there is only the base.
     */
    const styleBreakpoint = useCallback(
        (element: CanvasElement) => (parkedSubtree.has(element.id) ? cascade.baseId : breakpoint),
        [breakpoint, cascade.baseId, parkedSubtree],
    );
    const canvasStageRef = useRef<HTMLDivElement>(null);
    /*
     * Where parked coordinates are measured from.
     *
     * They used to be measured from the canvas stage, which is the one box that
     * cannot serve as an origin: the stage is sized by its contents and centred
     * in the viewport, so parking something moved the very edge its position
     * was measured against, and it landed somewhere other than where it was
     * dropped. The main artboard does not move when something is parked beside
     * it, so it anchors both the storing and the drawing.
     */
    const parkAnchorRef = useRef<HTMLDivElement>(null);
    const [parkOrigin, setParkOrigin] = useState({ x: 0, y: 0 });
    /** A screen point in the coordinates parked layers are stored in. */
    const parkPoint = (clientX: number, clientY: number) => {
        const rect = parkAnchorRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: Math.round((clientX - rect.left) / scale),
            y: Math.round((clientY - rect.top) / scale),
        };
    };

    /** Dragging a parked frame moves it in canvas units, not page ones. */
    /**
     * The artboard under a point, ignoring the thing being dragged.
     *
     * What you are dragging follows the pointer, so a plain hit test finds the
     * dragged element itself and then reports whatever that element happens to
     * sit inside — which is the artboard you are trying to leave.
     */
    const artboardAt = (x: number, y: number, ignoreId: string) => {
        for (const node of document.elementsFromPoint(x, y)) {
            if (node.closest(`[data-canvas-element="${ignoreId}"]`)) continue;
            const artboard = node.closest<HTMLElement>("[data-artboard]");
            if (artboard) return artboard;
        }
        return null;
    };

    const beginParkedDrag = (
        // A mouse press on the frame or a pointer press on its name: both carry
        // the coordinates the drag starts from, which is all this needs.
        event: { clientX: number; clientY: number },
        parked: CanvasElement,
    ) => {
        const style = resolveStyle(parked, cascade.baseId, cascade);
        const startX = event.clientX;
        const startY = event.clientY;
        /*
         * A press is not a drag.
         *
         * Without this, clicking the name of something parked over an artboard
         * counted as dropping it there: it was pulled into the page on a plain
         * click, and from the outside it just vanished.
         */
        let dragging = false;
        const move = (moveEvent: PointerEvent) => {
            if (!dragging) {
                const far = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 3;
                if (!far) return;
                dragging = true;
            }
            patchStyle([parked.id], {
                x: Math.round(style.x + (moveEvent.clientX - startX) / scale),
                y: Math.round(style.y + (moveEvent.clientY - startY) / scale),
            });
        };
        const up = (upEvent: PointerEvent) => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            if (!dragging) return;
            // Let go over an artboard and it joins the page: the same move in
            // reverse, so the name above it goes away and it publishes again.
            const artboard = artboardAt(upEvent.clientX, upEvent.clientY, parked.id);
            if (!artboard) return;
            const bp = artboard.dataset.artboard ?? breakpoint;
            const rect = artboard.getBoundingClientRect();
            const x = Math.round((upEvent.clientX - rect.left) / scale - style.w / 2);
            const y = Math.round((upEvent.clientY - rect.top) / scale - 16);
            if (bp !== breakpoint) setBreakpoint(bp);
            setElements((els) =>
                reparent(els, parked.id, undefined, bp, undefined, cascade).map((el) =>
                    el.id === parked.id
                        ? { ...el, parked: undefined, base: { ...el.base, position: "absolute", x, y } }
                        : el,
                ),
            );
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };

    const isRequiredBreakpoint = (id: string) =>
        REQUIRED_BREAKPOINT_IDS.includes(id as (typeof REQUIRED_BREAKPOINT_IDS)[number]);
    const rangeChip = (id: string) => windowRangeChip(cascade, id);
    const rangeLabel = (id: string) => windowRangeLabel(cascade, id);
    /** Thresholds claimed twice: both artboards match, and one wins silently. */
    const clashingThresholds = duplicateThresholds(cascade);

    const beginCanvasResize = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const startY = event.clientY;
        const initial = canvasHeight;
        const componentMasterId = componentMode ? activeComponentMaster?.id : undefined;
        let latestHeight = initial;
        let animationFrame = 0;

        beginTransaction();

        const heightAt = (clientY: number) =>
            Math.round(Math.max(1, Math.min(12000, initial + (clientY - startY) / scale)));

        const move = (pointer: MouseEvent) => {
            latestHeight = heightAt(pointer.clientY);
            // Mousemove can fire much faster than the browser can paint. One
            // local update per frame keeps resize fluid without recursively
            // driving document state, ResizeObserver and autosave.
            if (animationFrame) return;
            animationFrame = window.requestAnimationFrame(() => {
                animationFrame = 0;
                setCanvasHeight((current) => current === latestHeight ? current : latestHeight);
            });
        };
        const up = (pointer: MouseEvent) => {
            latestHeight = heightAt(pointer.clientY);
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            setCanvasHeight((current) => current === latestHeight ? current : latestHeight);

            if (componentMasterId) {
                setElements((current) => {
                    const master = current.find((element) => element.id === componentMasterId);
                    if (!master || (master.base.h === latestHeight && master.base.heightMode === "fixed")) return current;
                    return current.map((element) => element.id === componentMasterId
                        ? { ...element, base: { ...element.base, h: latestHeight, heightMode: "fixed" } }
                        : element);
                });
            } else {
                setRootStyle({ canvasHeight: latestHeight });
            }
            endTransaction();
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const beginComponentWidthResize = (event: React.MouseEvent, master = activeComponentMaster) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const initial = master?.base.w ?? 320;
        const move = (pointer: MouseEvent) => {
            const width = Math.round(Math.max(1, Math.min(4000, initial + (pointer.clientX - startX) / scale)));
            if (master) setElements((current) => current.map((element) => element.id === master.id ? { ...element, base: { ...element.base, w: width, widthMode: "fixed" } } : element));
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const aiStreamRefs = useRef(new Map<string, Map<string, string>>());

    const applyAiPlan = (plan: AiDesignPlan) => {
        const pagePatch = plan.operations
            .filter((operation) => operation.kind === "page")
            .reduce<Partial<RootStyle>>(
                (patch, operation) => ({ ...patch, ...operation.style }),
                {},
            );
        if (Object.keys(pagePatch).length) setRootStyle(pagePatch);

        const refs = plan.streamKey
            ? (() => {
                if (plan.streamReset || !aiStreamRefs.current.has(plan.streamKey)) {
                    aiStreamRefs.current.set(plan.streamKey, new Map());
                }
                return aiStreamRefs.current.get(plan.streamKey)!;
            })()
            : new Map<string, string>();

        setElements((current) => {
            let next = [...current];
            const addedIds = new Set<string>();
            for (const operation of plan.operations) {
                if (operation.kind === "page") continue;
                if (operation.kind === "remove") {
                    const id = refs.get(operation.id) ?? operation.id;
                    if (next.some((element) => element.id === id))
                        next = removeSubtree(next, id);
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
                    if (operation.name !== undefined) created.name = operation.name;
                    if (operation.alt !== undefined) created.alt = operation.alt;
                    if (operation.href !== undefined) created.href = operation.href;
                    refs.set(operation.ref, created.id);
                    addedIds.add(created.id);
                    next.push(created);
                    continue;
                }
                const updateId = refs.get(operation.id) ?? operation.id;
                next = next.map((element) => {
                    if (element.id !== updateId) return element;
                    const updated = operation.style
                        ? plan.targetBreakpoint
                            ? applyStyleIsolated(element, plan.targetBreakpoint, operation.style, breakpointDefs.map(definition => definition.id), cascade)
                            : applyStyle(element, cascade.baseId, operation.style, cascade)
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
                        ...(operation.name !== undefined ? { name: operation.name } : {}),
                        ...(operation.alt !== undefined ? { alt: operation.alt } : {}),
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
    const [paddingInfo, setPaddingInfo] = useState<PaddingInfo | null>(null);
    const [guides, setGuidesState] = useState<{
        origin: { x: number; y: number };
        lines: Guide[];
    }>({ origin: { x: 0, y: 0 }, lines: [] });

    /**
     * Setting guides is editor state, and editor state re-renders every layer
     * on every artboard. A drag that is snapping to nothing wrote a fresh
     * empty object every frame, paying that price for no visible difference.
     */
    const setGuides = useCallback(
        (next: { origin: { x: number; y: number }; lines: Guide[] }) =>
            setGuidesState((current) =>
                current.lines.length === 0 && next.lines.length === 0 ? current : next,
            ),
        [],
    );
    /**
     * The dragged layer's offset, written straight to the DOM.
     *
     * It used to be React state, so following the pointer re-rendered every
     * layer on every artboard sixty times a second to move one of them. The
     * node is right there; moving it is one assignment.
     */
    const ghostRef = useRef<{ node: HTMLElement; dx: number; dy: number } | null>(null);
    const setGhostOffset = useCallback((dx: number, dy: number) => {
        const current = ghostRef.current;
        if (!current) return;
        current.dx = dx;
        current.dy = dy;
        current.node.style.transform = `translate(${dx}px, ${dy}px)`;
        current.node.style.opacity = "0.6";
        current.node.style.pointerEvents = "none";
    }, []);
    const clearGhost = useCallback(() => {
        const current = ghostRef.current;
        if (!current) return;
        current.node.style.transform = "";
        current.node.style.opacity = "";
        current.node.style.pointerEvents = "";
        ghostRef.current = null;
    }, []);
    /** Distances to the nearest neighbours, drawn while something is dragged. */
    /**
     * The distance readouts drawn while something is being moved.
     *
     * `from`/`to` run along `axis`; `cross` is where on the other axis the line
     * is drawn. The cross position used to be missing entirely and the renderer
     * reused `at` — an x coordinate — as the line's y, which is why the ruler
     * appeared at positions that had nothing to do with the gap it measured.
     */
    /**
     * The gesture overlays: where a drop lands, the distances, the selection's
     * name and handles.
     *
     * Held by the layer that draws them rather than by the editor, so a drag
     * repaints four small boxes instead of every layer on three artboards.
     */
    const gestureRef = useRef<GestureLayerHandle>(null);
    const setSelectionBox = useCallback(
        (next: DOMRect | null | ((current: DOMRect | null) => DOMRect | null)) => {
            const handle = gestureRef.current;
            if (!handle) return;
            const value = typeof next === "function" ? next(handle.get().selectionBox) : next;
            if (value === handle.get().selectionBox) return;
            handle.set({ selectionBox: value });
        },
        [],
    );
    const setMeasures = useCallback(
        (measures: Measure[]) => gestureRef.current?.set({ measures }),
        [],
    );
    const setDropPlan = useCallback(
        (dropPlan: DropPlan | null) => gestureRef.current?.set({ dropPlan }),
        [],
    );
    const setRadiusPreview = useCallback(
        (radiusPreview: number | null) => gestureRef.current?.set({ radiusPreview }),
        [],
    );
    /** Sibling boxes measured once per gesture; see `measureGaps`. */
    const neighbourCache = useRef<{
        movingId: string;
        parentId: string | undefined;
        boxes: DOMRect[];
        container: DOMRect;
    } | null>(null);
    /** The radius being dragged right now, so the canvas can show the number. */
    /** A column grid over the artboard, for eyeballing rhythm. */
    const [gridOverlay, setGridOverlay] = useState(false);
    /** Folded layer branches. The panel reads it; its header folds them all. */
    /**
     * Folded branches in the layer tree, artboards included.
     *
     * Every artboard but the one being edited starts folded: the tree lists
     * all of them, and three copies of the same page unfolded at once is a
     * list nobody can read.
     */
    const [collapsedLayerIds, setCollapsedLayerIds] = useState<Set<string>>(
        () => new Set(DEFAULT_BREAKPOINTS.map((item) => item.id).filter((id) => id !== "desktop")),
    );
    /**
     * Which document list the sidebar shows.
     *
     * Pages and layers used to share the column, each capped so the other had
     * room — which left both short on a laptop screen. One at a time gives the
     * layer tree the height it actually needs, and switching is one click.
     */
    const [documentList, setDocumentList] = useState<"layers" | "pages">("layers");
    const [dropTargetId, setDropTargetId] = useState<string | null | undefined>(
        undefined,
    );
    /** Where inside the target the element lands, and the line that shows it. */
    /** The layer Luma has been asked to work on, if any. */
    const [aiFocus, setAiFocus] = useState<AiFocus | undefined>();
    /** Dragging the strip between two stacked sections. */
    const [seamInfo, setSeamInfo] = useState<{ id: string; breakpoint: Breakpoint; startY: number; initial: number } | null>(null);
    const [clipboard, setClipboard] = useState<Clipboard | null>(null);
    /** Rows fetched by the Data panel, used to preview Repeat blocks. */
    const [samples, setSamples] = useState<Record<string, SourceSample>>({});
    const [pageError, setPageError] = useState<string | null>(null);
    const [pageSwitchTarget, setPageSwitchTarget] = useState<string | null>(null);

    useEffect(() => {
        // Page-local state must not leak into the next document. Chrome state
        // such as leftTab/rightTab intentionally remains untouched.
        setSelectedIds([]);
        setEditingId(null);
        setHoveredEffectIds(new Set());
        setPressedEffectId(null);
        setPreviewVisibility({});
        setSamples({});
        setContextMenu(null);
        setPageSwitchTarget(null);
    }, [page.id]);

    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasHeight, setCanvasHeight] = useState(rootStyle.canvasHeight);
    const [contentHeight, setContentHeight] = useState(rootStyle.canvasHeight);

    const observeComponentPreview = useCallback((
        masterId: string,
        surface: HTMLDivElement | null,
        measureWidth: boolean,
        measureHeight: boolean,
    ) => {
        componentPreviewObservers.current.get(masterId)?.disconnect();
        componentPreviewObservers.current.delete(masterId);
        if (!surface || !componentMode || (!measureWidth && !measureHeight)) return;

        const root = surface.querySelector<HTMLElement>(
            `[data-canvas-element="${CSS.escape(masterId)}"]`,
        );
        if (!root) return;

        const measure = () => {
            const rect = root.getBoundingClientRect();
            const width = Math.max(1, Math.round(rect.width / scale));
            const height = Math.max(1, Math.round(rect.height / scale));
            setComponentPreviewSizes((current) => {
                const previous = current[masterId];
                const next = {
                    width: measureWidth ? width : previous?.width ?? width,
                    height: measureHeight ? height : previous?.height ?? height,
                };
                return previous?.width === next.width && previous.height === next.height
                    ? current
                    : { ...current, [masterId]: next };
            });
        };
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        componentPreviewObservers.current.set(masterId, observer);
        // `ref` callbacks run during React's commit. Measuring and setting
        // state synchronously here caused commit -> render -> ref -> setState
        // recursion. ResizeObserver delivers the initial size after layout,
        // which is both the accurate moment and safely outside that cycle.
    }, [componentMode, scale]);

    useEffect(() => () => {
        for (const observer of componentPreviewObservers.current.values()) observer.disconnect();
        componentPreviewObservers.current.clear();
    }, []);
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
    /** What the artboards draw: the page, without anything parked beside it. */
    const pageElements = useMemo(() => {
        if (componentMode) return visibleEditorElements;
        const parked = parkedIds(visibleEditorElements);
        return parked.size === 0
            ? visibleEditorElements
            : visibleEditorElements.filter((element) => !parked.has(element.id));
    }, [componentMode, visibleEditorElements]);
    /**
     * Children by parent, built once per change instead of searched per node.
     *
     * `childrenOf` filters and sorts the whole document, and the canvas asked
     * it that question once for every layer it drew — three artboards deep, on
     * every render. On a page of a few hundred layers that is hundreds of
     * thousands of comparisons per frame, which is where the frame rate was
     * going.
     */
    const childrenByParent = useMemo(() => {
        const index = new Map<string, CanvasElement[]>();
        for (const element of elements) {
            const key = element.parentId ?? "";
            const bucket = index.get(key);
            if (bucket) bucket.push(element);
            else index.set(key, [element]);
        }
        for (const bucket of index.values()) bucket.sort((a, b) => a.z - b.z);
        return index;
    }, [elements]);
    const childrenIn = useCallback(
        (parentId?: string) => childrenByParent.get(parentId ?? "") ?? EMPTY_CHILDREN,
        [childrenByParent],
    );

    /**
     * Resolved styles and their CSS, remembered per layer.
     *
     * Every render recomputed both for every layer on all three artboards, and
     * a single render of a few hundred layers cost about a third of a second —
     * which is what a click, a hover or the start of a drag felt like. Neither
     * result depends on anything but the layer, the artboard and the cascade,
     * so the answer is kept until one of those changes.
     */
    const styleMemo = useMemo(
        () => ({
            style: new WeakMap<CanvasElement, Map<string, ElementStyle>>(),
            css: new WeakMap<CanvasElement, Map<string, React.CSSProperties>>(),
        }),
        // Anything that changes what these produce clears the lot.
        [cascade, rootStyle, elements],
    );

    const styleFor = useCallback(
        (element: CanvasElement, bp: Breakpoint) => {
            let byBreakpoint = styleMemo.style.get(element);
            if (!byBreakpoint) styleMemo.style.set(element, (byBreakpoint = new Map()));
            const hit = byBreakpoint.get(bp);
            if (hit) return hit;
            const resolved = resolveStyle(element, bp, cascade);
            byBreakpoint.set(bp, resolved);
            return resolved;
        },
        [cascade, styleMemo],
    );

    /*
     * The artboards you are not working in are drawn once and kept.
     *
     * The page is laid out three times over, and every click, hover or drag
     * rebuilt all three — a few hundred layers each, which is where a third of
     * a second went. Only the artboard being edited can respond to any of that,
     * so while a gesture is running the other two are handed back exactly as
     * they were. They rebuild the moment the gesture ends.
     */
    const restingFrames = useRef(new Map<string, React.ReactNode>());
    const frameBody = (frame: Frame, frameElements: CanvasElement[], primary: boolean) => {
        const key = frame.masterId ?? frame.bp;
        if (!primary && gesturing) {
            const kept = restingFrames.current.get(key);
            if (kept) return kept;
        }
        const body = childrenOf(frameElements, undefined).map((el) =>
            renderNode(el, frame, undefined, `${frame.bp}:`),
        );
        if (!primary) restingFrames.current.set(key, body);
        return body;
    };

    /** The bottom-most root, for the seam the last section does not draw. */
    const lastRootId = useMemo(
        () => childrenOf(visibleEditorElements, undefined).at(-1)?.id,
        [visibleEditorElements],
    );

    const componentInstanceFor = useCallback((element: CanvasElement) => {
        if (componentMode) return undefined;
        let cursor: CanvasElement | undefined = element;
        const visited = new Set<string>();
        while (cursor && !visited.has(cursor.id)) {
            visited.add(cursor.id);
            if (cursor.componentRole === "instance") return cursor;
            cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
        }
        return undefined;
    }, [byId, componentMode]);
    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const selectedElement = selectedId ? byId.get(selectedId) : undefined;
    const deviceWidth = frameWidthForBreakpoint;
    // The artboard is as wide as the device, exactly as the published page is.
    // `maxWidth` caps a band's *content*, not the page, and applying it to the
    // artboard made every full-bleed section stop short of the frame edge in
    // the editor while reaching it on the site. Only a freely placed page is
    // genuinely fixed-width, because its coordinates were drawn on one.
    const frameWidth = rootStyle.layout === "absolute" && !rootStyle.fullWidth
        ? Math.min(deviceWidth, rootStyle.maxWidth)
        : deviceWidth;

    /**
     * How much empty canvas surrounds the artboards, in screen pixels.
     *
     * A fixed slab of room, grown to contain whatever has been parked out
     * there. Without the growing part the canvas simply stopped: a layer
     * dragged past the padding had nowhere to land and nothing to scroll to.
     */
    const canvasRoom = useMemo(() => {
        let minX = 0;
        let minY = 0;
        let maxX = frameWidth;
        let maxY = canvasHeight;
        for (const parked of parkedRoots) {
            const style = resolveStyle(parked, cascade.baseId, cascade);
            minX = Math.min(minX, style.x);
            minY = Math.min(minY, style.y);
            maxX = Math.max(maxX, style.x + style.w);
            maxY = Math.max(maxY, style.y + style.h);
        }
        const slack = 600;
        return {
            left: Math.max(1400, -minX * scale + slack),
            right: Math.max(1400, (maxX - frameWidth) * scale + slack),
            top: Math.max(800, -minY * scale + slack),
            bottom: Math.max(800, (maxY - canvasHeight) * scale + slack),
        };
    }, [canvasHeight, cascade, frameWidth, parkedRoots, scale]);

    useEffect(() => setCanvasHeight(rootStyle.canvasHeight), [rootStyle.canvasHeight]);
    useEffect(() => {
        if (!componentMode || !activeComponentMaster) return;
        setCanvasHeight(Math.max(1, activeComponentMaster.base.h));
        setContentHeight(Math.max(1, activeComponentMaster.base.h));
    }, [activeComponentMaster?.base.h, activeComponentMaster?.id, componentMode]);
    useEffect(() => {
        const node = canvasRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => {
            const height = Math.ceil(entry.contentRect.height);
            setContentHeight((current) => current === height ? current : height);
        });

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
                parentAlign: parentStyle?.align ?? rootStyle.align,
            };
        },
        [byId, breakpoint, rootStyle.align, rootStyle.direction, rootStyle.layout],
    );

    const cssFor = useCallback(
        (
            element: CanvasElement,
            bp: Breakpoint,
            style: ElementStyle,
            /** A style the cache cannot speak for: an effect or a preview. */
            custom: boolean,
        ): React.CSSProperties => {
            if (custom) return styleToCss(style, contextFor(element, bp), element);
            let byBreakpoint = styleMemo.css.get(element);
            if (!byBreakpoint) styleMemo.css.set(element, (byBreakpoint = new Map()));
            const hit = byBreakpoint.get(bp);
            // A copy every time: the caller decorates it with selection
            // outlines and cursors, and the cached one has to stay clean.
            if (hit) return { ...hit };
            const computed = styleToCss(style, contextFor(element, bp), element);
            byBreakpoint.set(bp, computed);
            return { ...computed };
        },
        [contextFor, styleMemo],
    );

    /* ---------------------------------------------------------------- edits */

    const patchStyle = useCallback(
        (ids: string[], patch: Partial<ElementStyle>) => {
            setElements((els) =>
                els.map((el) => {
                    if (!ids.includes(el.id)) return el;
                    // Parked layers are edited on the base and nowhere else, so
                    // they take the plain write: isolating a change across
                    // artboards would pin overrides onto something that has no
                    // artboards to speak of.
                    if (parkedSubtree.has(el.id)) return applyStyle(el, cascade.baseId, patch, cascade);
                    return applyStyleIsolated(el, breakpoint, patch, breakpointDefs.map((definition) => definition.id), cascade);
                }),
            );
        },
        [breakpoint, breakpointDefs, cascade, parkedSubtree, setElements],
    );

    const patchProps = useCallback(
        (id: string, patch: Partial<CanvasElement>) => {
            setElements((els) => {
                const target = els.find((element) => element.id === id);
                if (target?.componentRole === "master" && target.componentId && patch.name !== undefined) {
                    return els.map((element) => element.id === id ? { ...element, ...patch } : element.componentRole === "master" && element.componentId === target.componentId ? { ...element, name: patch.name } : element);
                }
                return els.map((element) => (element.id === id ? { ...element, ...patch } : element));
            });
        },
        [setElements],
    );

    /**
     * Typing into a text layer.
     *
     * Inside a placed component this is not an edit to that layer at all: the
     * layer is a copy, rebuilt from the master every time the page is read, so
     * anything written straight onto it is gone by the next load. The words go
     * on the instance instead, filed under the master slot they replace, and
     * the copy is updated in place so the canvas shows them immediately.
     */
    const editContent = useCallback(
        (element: CanvasElement, content: string) => {
            const instance = componentInstanceFor(element);
            if (!instance) {
                patchProps(element.id, { content });
                return;
            }
            const slot = element.componentSourceId ?? element.id;
            // Typing the master's own words back is not an override, it is a
            // change of mind: the copy goes back to following the master, so
            // editing the master later reaches it again.
            const sameAsMaster = (byId.get(slot)?.content ?? "") === content;
            setElements((els) =>
                els.map((candidate) => {
                    if (candidate.id === instance.id) {
                        const words = { ...candidate.componentContent };
                        if (sameAsMaster) delete words[slot];
                        else words[slot] = content;
                        const next = {
                            ...candidate,
                            componentContent: Object.keys(words).length ? words : undefined,
                        };
                        return next.id === element.id ? { ...next, content } : next;
                    }
                    return candidate.id === element.id ? { ...candidate, content } : candidate;
                }),
            );
        },
        [byId, componentInstanceFor, patchProps, setElements],
    );

    const resetOverrides = useCallback(
        (ids: string[], keys: StyleKey[]) => {
            setElements((els) =>
                els.map((el) =>
                    ids.includes(el.id) ? clearOverrides(el, styleBreakpoint(el), keys, cascade) : el,
                ),
            );
        },
        [cascade, setElements, styleBreakpoint],
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
            let componentParent = parentId ? byId.get(parentId) : undefined;
            while (componentParent && componentParent.componentRole !== "master") {
                componentParent = componentParent.parentId ? byId.get(componentParent.parentId) : undefined;
            }
            if (componentParent?.componentRole === "master") element.componentSourceId = element.id;
            const nested = element.disclosure?.role === 'root' ? disclosureChildren(element) : [];
            if (componentParent?.componentRole === 'master') nested.forEach(child => { child.componentSourceId = child.id; });
            setElements((current) => [...current, element, ...nested]);
            setSelectedIds([element.id]);
        },
        [byId, elements, selectedId, setElements],
    );

    const compileCodeComponent = useCallback(async () => {
        setCodeComponentError("");
        if (codeComponentLanguage === "html") {
            setCodeComponentPreview(codeComponentSource);
            return codeComponentSource;
        }
        if (!adapters?.compileCode) {
            setCodeComponentError("The host has not configured TSX compilation.");
            return undefined;
        }
        setCodeComponentCompiling(true);
        try {
            const result = await adapters.compileCode(codeComponentSource);
            setCodeComponentPreview(result.html);
            return result.html;
        } catch (error) {
            setCodeComponentError(error instanceof Error ? error.message : "TSX could not be compiled.");
            return undefined;
        } finally {
            setCodeComponentCompiling(false);
        }
    }, [adapters?.compileCode, codeComponentLanguage, codeComponentSource]);

    const createCodeComponent = async () => {
        const compiled = await compileCodeComponent();
        if (!compiled) return;
        const master = createElement("Frame", { x: 0, y: 0, z: nextZ(elements) });
        master.name = codeComponentName.trim() || "Code Component";
        master.code = compiled;
        master.codeSource = codeComponentSource;
        master.codeLanguage = codeComponentLanguage;
        master.componentRole = "master";
        master.componentId = master.id;
        master.componentSourceId = master.id;
        master.variant = "Default";
        master.base = { ...master.base, w: 360, h: 220, widthMode: "fixed", heightMode: "fixed", overflow: "visible", bg: "transparent", borderW: 0, radius: 0 };
        setElements((current) => [...current, master]);
        setRootStyle({ ...rootStyle, documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setLeftTab("Components");
        setCodeComposerOpen(false);
    };

    const createBlankComponent = (layoutPart?: "Navbar" | "Footer" | "Layout") => {
        const master = createElement("Frame", { x: 0, y: 0, z: nextZ(elements) });
        master.name = layoutPart ?? `Component ${componentAssets.length + 1}`;
        master.isLayout = layoutPart === "Layout" ? true : undefined;
        master.componentRole = "master";
        master.componentId = master.id;
        master.componentSourceId = master.id;
        master.variant = "Default";
        master.base = {
            ...master.base,
            x: 0,
            y: 0,
            w: layoutPart ? 1200 : 160,
            h: 80,
            widthMode: layoutPart ? "fill" : "auto",
            heightMode: "auto",
            layout: "stack",
            direction: "column",
            align: "start",
            bg: "transparent",
            borderW: 0,
            radius: 0,
            overflow: "visible",
        };
        const children = layoutPart === "Layout" ? createElement("Frame", { x: 0, y: 0, z: 0 }) : undefined;
        if (children) {
            children.name = "Children";
            children.childrenSlot = true;
            children.parentId = master.id;
            children.base = { ...children.base, widthMode: "fill", heightMode: "auto", layout: "stack", direction: "column", bg: "transparent", borderW: 0, radius: 0 };
        }
        setElements((current) => [...current, master, ...(children ? [children] : [])]);
        setRootStyle({ ...rootStyle, documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setBreakpoint("desktop");
        setLeftTab("Components");
    };

    const createButtonComponent = () => {
        const master = createElement("Button", { x: 0, y: 0, z: nextZ(elements) });
        master.name = "Button";
        master.content = "Button";
        master.componentRole = "master";
        master.componentId = master.id;
        master.componentSourceId = master.id;
        master.variant = "Default";
        master.base = {
            ...master.base,
            x: 0,
            y: 0,
            widthMode: "auto",
            heightMode: "auto",
            layout: "stack",
            direction: "row",
            justify: "center",
            align: "center",
            gap: 8,
            padT: 10,
            padR: 16,
            padB: 10,
            padL: 16,
            bg: "#7c3aed",
            color: "#ffffff",
            radius: 8,
            borderW: 0,
            fontSize: 14,
            fontWeight: "600",
            lineHeight: 1.2,
            overflow: "visible",
        };
        master.hover = { bg: "#6d28d9" };
        master.press = { scale: 98 };
        setElements((current) => [...current, master]);
        setRootStyle({ ...rootStyle, documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setBreakpoint("desktop");
        setLeftTab("Components");
    };

    const openComponentEditor = useCallback((instance: CanvasElement) => {
        if (!instance.componentId) return;
        const master = componentMasters.find((candidate) =>
            candidate.componentId === instance.componentId &&
            (candidate.variant ?? "Default") === (instance.variant ?? "Default"),
        ) ?? componentMasters.find((candidate) => candidate.componentId === instance.componentId);
        if (!master) return;
        setRootStyle({ documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
        setActiveComponentMasterId(master.id);
        setSelectedIds([master.id]);
        setBreakpoint("desktop");
        setLeftTab("Components");
        setEditingId(null);
    }, [componentMasters, rootStyle.maxWidth, setRootStyle]);

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
        const sourceMaster = selectedElement?.componentRole === "master" ? selectedElement : activeComponentMaster;
        if (!sourceMaster?.componentId) return;
        const siblings = elements.filter(
            (element) =>
                element.componentRole === "master" &&
                element.componentId === sourceMaster.componentId,
        );
        const clone = cloneSubtree(elements, sourceMaster.id, { x: 0, y: 0 });
        if (!clone) return;
        const copies = clone.elements.map((element) => ({
            ...element,
            componentRole: element.id === clone.rootId ? ("master" as const) : undefined,
            componentId: sourceMaster.componentId,
            variant:
                element.id === clone.rootId
                    ? `Variant ${siblings.length + 1}`
                    : undefined,
        }));
        setElements((current) => [...current, ...copies]);
        setActiveComponentMasterId(clone.rootId);
        setSelectedIds([clone.rootId]);
    }, [activeComponentMaster, elements, selectedElement, setElements]);

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

    const resetComponentInstance = useCallback(() => {
        if (selectedElement?.componentRole !== "instance") return;
        switchInstanceVariant(selectedElement.variant ?? "Default");
    }, [selectedElement, switchInstanceVariant]);

    const detachComponentInstance = useCallback(() => {
        if (selectedElement?.componentRole !== "instance") return;
        const instanceIds = subtreeIds(elements, selectedElement.id);
        setElements((current) => current.map((element) => {
            if (!instanceIds.has(element.id)) return element;
            return {
                ...element,
                componentRole: undefined,
                componentId: undefined,
                componentSourceId: undefined,
                variant: undefined,
            };
        }));
    }, [elements, selectedElement, setElements]);

    const createComponentFromSelection = useCallback(() => {
        if (!selectedElement || componentMode || selectedElement.componentRole) return;
        const selectedSubtree = elements.filter((element) => subtreeIds(elements, selectedElement.id).has(element.id));
        const clone = cloneSubtree(elements, selectedElement.id, {
            x: -selectedElement.base.x,
            y: -selectedElement.base.y,
        });
        if (!clone) return;

        const sourceIdByOriginalId = new Map<string, string>();
        selectedSubtree.forEach((element, index) => {
            const copy = clone.elements[index];
            if (copy) sourceIdByOriginalId.set(element.id, copy.id);
        });
        const componentId = clone.rootId;
        const masterCopies = clone.elements.map((element) => ({
            ...element,
            // A component has variants, not hidden page-breakpoint styles.
            // Keeping the source element's overrides makes the published
            // result differ from the only state visible in component mode.
            overrides: undefined,
            name: element.id === clone.rootId
                ? (selectedElement.name?.trim() || `${selectedElement.type} Component`)
                : element.name,
            componentRole: element.id === clone.rootId ? ("master" as const) : undefined,
            componentId: element.id === clone.rootId ? componentId : undefined,
            componentSourceId: element.id,
            variant: element.id === clone.rootId ? "Default" : undefined,
        }));
        const selectedIds = new Set(selectedSubtree.map((element) => element.id));
        setElements((current) => [
            ...current.map((element) => {
                if (!selectedIds.has(element.id)) return element;
                return {
                    ...element,
                    componentRole: element.id === selectedElement.id ? ("instance" as const) : undefined,
                    componentId: element.id === selectedElement.id ? componentId : undefined,
                    componentSourceId: sourceIdByOriginalId.get(element.id),
                    variant: element.id === selectedElement.id ? "Default" : undefined,
                };
            }),
            ...masterCopies,
        ]);
    }, [componentMode, elements, selectedElement, setElements]);

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
                    const bp = styleBreakpoint(el);
                    const style = resolveStyle(el, bp, cascade);
                    const nudged = { x: style.x + dx, y: style.y + dy };
                    return parkedSubtree.has(el.id)
                        ? applyStyle(el, cascade.baseId, nudged, cascade)
                        : applyStyleIsolated(el, bp, nudged, breakpointDefs.map((definition) => definition.id), cascade);
                }),
            );
        },
        [breakpointDefs, byId, cascade, contextFor, parkedSubtree, selectedIds, setElements, styleBreakpoint],
    );

    /** A component's insides belong to its master, so instances refuse drops. */
    const acceptsDrop = useCallback(
        (parentId: string | undefined) => {
            const parent = parentId ? byId.get(parentId) : undefined;
            if (!parent) return true;
            if (componentMode) return true;
            return !componentAssetIds.has(parent.id) && !componentInstanceFor(parent);
        },
        [byId, componentAssetIds, componentInstanceFor, componentMode],
    );

    /** Adds a Section immediately below `afterId` at the page root. */
    const insertSectionAfter = (afterId: string) => {
        const created = createElement("Section", { x: 0, y: 0, z: 0 });
        setElements((current) => {
            const siblings = childrenOf(current, undefined);
            const at = siblings.findIndex((el) => el.id === afterId);
            if (at === -1) return current;
            const ordered = [...siblings.slice(0, at + 1), created, ...siblings.slice(at + 1)];
            const zById = new Map(ordered.map((el, index) => [el.id, index]));
            return [...current, created].map((el) => {
                const z = zById.get(el.id);
                return z === undefined ? el : { ...el, z };
            });
        });
        setSelectedIds([created.id]);
    };

    const doReparent = useCallback(
        (id: string, parentId: string | undefined, beforeId?: string) => {
            const parent = parentId ? byId.get(parentId) : undefined;
            if (!componentMode && parent && (componentAssetIds.has(parent.id) || componentInstanceFor(parent))) return;
            setElements((els) => reparent(els, id, parentId, breakpoint, beforeId, cascade));
        },
        [breakpoint, byId, cascade, componentAssetIds, componentInstanceFor, componentMode, setElements],
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

    const select = useCallback((id: string, additive: boolean) => {
        setSelectedIds((current) => {
            if (!additive) return [id];
            return current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id];
        });
    }, []);

    /* ------------------------------------------------------ drag and resize */

    /**
     * The gap between the dragged box and its nearest neighbour on each side.
     *
     * Only neighbours that actually face the box count — a sibling that shares
     * no overlap on the other axis is not the thing you are spacing against,
     * and drawing a measurement to it is noise.
     */
    /**
     * The distances from what is being dragged to what is around it.
     *
     * Measured from the rendered boxes rather than from the model, because
     * that is the only way to see a layer the layout is placing: a stacked
     * element has no x/y of its own to compute from, and while it is being
     * dragged its ghost is where it visually is. The result is in client
     * coordinates, and only the label is converted back to page pixels.
     */
    const measureGaps = useCallback(
        (movingId: string, parentId: string | undefined) => {
            // The artboard holding the dragged copy, so every box measured
            // comes from the same one — the page is drawn once per breakpoint,
            // and mixing two of them would compare a phone to a desktop.
            const moving = document.querySelector<HTMLElement>(
                `[data-canvas-page] [data-canvas-element="${CSS.escape(movingId)}"]`,
            );
            const root = moving?.closest<HTMLElement>("[data-canvas-page]");
            if (!moving || !root) return [];
            const rectOf = (id: string) =>
                root
                    .querySelector<HTMLElement>(`[data-canvas-element="${CSS.escape(id)}"]`)
                    ?.getBoundingClientRect();
            const self = moving.getBoundingClientRect();

            /*
             * The neighbours are measured once per gesture, not once per frame.
             *
             * Nothing but the dragged layer moves until the drop, so re-reading
             * every sibling's box on every frame bought nothing and forced the
             * browser to lay the whole canvas out again each time — which is
             * most of what made dragging feel like half the frame rate.
             */
            const cached = neighbourCache.current;
            if (!cached || cached.movingId !== movingId || cached.parentId !== parentId) {
                const excluded = subtreeIds(elements, movingId);
                neighbourCache.current = {
                    movingId,
                    parentId,
                    boxes: childrenOf(elements, parentId)
                        .filter((child) => !excluded.has(child.id))
                        .flatMap((child) => {
                            const rect = rectOf(child.id);
                            return rect ? [rect] : [];
                        }),
                    container: (parentId ? rectOf(parentId) : undefined) ?? root.getBoundingClientRect(),
                };
            }
            const neighbours = neighbourCache.current?.boxes ?? [];
            const container = neighbourCache.current?.container ?? root.getBoundingClientRect();

            const found: Array<{
                axis: "x" | "y";
                from: number;
                to: number;
                cross: number;
                label: number;
                edge: boolean;
            }> = [];
            for (const axis of ["x", "y"] as const) {
                const near = axis === "x" ? "left" : "top";
                const far = axis === "x" ? "right" : "bottom";
                const crossNear = axis === "x" ? "top" : "left";
                const crossFar = axis === "x" ? "bottom" : "right";
                const start = self[near];
                const finish = self[far];
                const ownCentre = (self[crossNear] + self[crossFar]) / 2;

                let before: { gap: number; cross: number } | null = null;
                let after: { gap: number; cross: number } | null = null;
                for (const other of neighbours) {
                    const overlapFrom = Math.max(self[crossNear], other[crossNear]);
                    const overlapTo = Math.min(self[crossFar], other[crossFar]);
                    if (overlapTo <= overlapFrom) continue;
                    const cross = (overlapFrom + overlapTo) / 2;

                    if (other[far] <= start) {
                        const gap = start - other[far];
                        if (!before || gap < before.gap) before = { gap, cross };
                    } else if (other[near] >= finish) {
                        const gap = other[near] - finish;
                        if (!after || gap < after.gap) after = { gap, cross };
                    }
                }

                const label = (gap: number) => Math.round(gap / scale);
                if (before) {
                    found.push({ axis, from: start - before.gap, to: start, cross: before.cross, label: label(before.gap), edge: false });
                } else if (start > container[near]) {
                    found.push({ axis, from: container[near], to: start, cross: ownCentre, label: label(start - container[near]), edge: true });
                }
                if (after) {
                    found.push({ axis, from: finish, to: finish + after.gap, cross: after.cross, label: label(after.gap), edge: false });
                } else if (container[far] > finish) {
                    found.push({ axis, from: finish, to: container[far], cross: ownCentre, label: label(container[far] - finish), edge: true });
                }
            }
            return found;
        },
        [elements, scale],
    );

    /** What the rail lists, in the order the work tends to happen. */
    const railPrimary: LeftEditorTab[] = componentMode
        ? ["Layers", "Components", "Insert"]
        : ["Layers", "Pages", "Insert", "Templates", "Assets"];
    const railSecondary: LeftEditorTab[] = ["Data", "History"];

    /** Branches that can fold at all — the header's control is theirs. */
    const collapsibleLayerIds = useMemo(
        () => elements
            .filter((element) => elements.some((child) => child.parentId === element.id))
            .map((element) => element.id),
        [elements],
    );
    const layersAllCollapsed = collapsibleLayerIds.length > 0
        && collapsibleLayerIds.every((id) => collapsedLayerIds.has(id));

    const gesturing = dragInfo !== null || resizeInfo !== null || paddingInfo !== null || seamInfo !== null;

    /*
     * Keep the selection box in step with what is on screen.
     *
     * Measured after every render that could move it, on canvas scroll, when
     * the layer itself resizes, and every frame while a gesture is running —
     * which is when it moves without any of the others firing.
     */
    const selectedForChrome = selectedIds.length === 1 && !componentMode ? selectedIds[0] : null;
    useEffect(() => {
        if (effectsPreview && viewportRef.current) return mountDisclosures(viewportRef.current);
    }, [effectsPreview, elements]);
    const selectionSelector = selectedForChrome
        ? canvasTargetSelector(selectedForChrome, breakpoint, parkedSubtree.has(selectedForChrome))
        : null;
    const measureSelectionBox = useCallback(() => {
        if (!selectionSelector) {
            setSelectionBox(null);
            return;
        }
        const rect = document
            .querySelector<HTMLElement>(
                selectionSelector,
            )
            ?.getBoundingClientRect() ?? null;
        setSelectionBox((current) =>
            current && rect
                && current.left === rect.left && current.top === rect.top
                && current.width === rect.width && current.height === rect.height
                ? current
                : rect,
        );
    }, [selectionSelector]);

    useLayoutEffect(() => {
        if (!selectionSelector) {
            setSelectionBox(null);
            return;
        }
        const nodeFor = () =>
            document.querySelector<HTMLElement>(
                selectionSelector,
            );
        const measure = measureSelectionBox;
        measure();

        const viewport = viewportRef.current;
        viewport?.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        const node = nodeFor();
        const observer = node ? new ResizeObserver(measure) : undefined;
        if (node && observer) observer.observe(node);

        return () => {
            observer?.disconnect();
            viewport?.removeEventListener("scroll", measure);
            window.removeEventListener("resize", measure);
        };
    }, [measureSelectionBox, selectionSelector, scale, elements, breakpoint, canvasHeight]);

    useEffect(() => {
        if (!gesturing) return;

        /**
         * Whether a pointer position is over the canvas at all.
         *
         * Everything a drag can do — reordering, reparenting, parking a layer
         * beside the artboards — is about a place on the canvas. Over a panel
         * or the toolbar there is no such place, so the gesture has nothing to
         * say there and must not guess one.
         */
        const overCanvas = (clientX: number, clientY: number) => {
            const rect = viewportRef.current?.getBoundingClientRect();
            if (!rect) return false;
            return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        };

        /*
         * One update per painted frame.
         *
         * A mouse reports position far faster than the screen redraws — 120 or
         * 240 times a second on plenty of hardware — and every report was
         * running the whole gesture: hit tests, measurements, and the state
         * writes that re-render the canvas. Most of that work was thrown away
         * before anything was painted, and what reached the screen arrived at
         * half rate because the main thread never caught up. The newest
         * position is the only one worth acting on.
         */
        const applyMove = (event: MouseEvent) => {
            measureSelectionBox();

            const gestureBreakpoint = dragInfo?.breakpoint ?? resizeInfo?.breakpoint ?? paddingInfo?.breakpoint ?? seamInfo?.breakpoint ?? breakpoint;

            if (dragInfo) {
                const moving = byId.get(dragInfo.id);
                if (!moving) return;

                const dx = (event.clientX - dragInfo.startX) / scale;
                const dy = (event.clientY - dragInfo.startY) / scale;

                // Off the canvas there is nothing to drop onto, and showing an
                // indicator there promises a destination that does not exist.
                if (!overCanvas(event.clientX, event.clientY)) {
                    setDropPlan(null);
                    setDropTargetId(undefined);
                    setMeasures([]);
                    return;
                }

                // Which container would receive the element, and where in it.
                // Measured from the rendered DOM: the model's w/h only match
                // reality under fixed sizing.
                const plan = resolveDrop(
                    event.clientX,
                    event.clientY,
                    dragInfo.id,
                    visibleEditorElements,
                    byId,
                    gestureBreakpoint,
                    cascade,
                    canvasRef.current,
                    acceptsDrop,
                    rootStyle.layout,
                    // Hold ⌘/Ctrl to put it where the pointer is rather than
                    // in the order — the escape hatch a stack otherwise has no
                    // room for.
                    event.metaKey || event.ctrlKey,
                );
                setDropPlan(plan ?? null);
                setDropTargetId(plan ? plan.parentId ?? null : undefined);

                if (dragInfo.mode === "reflow") {
                    // Position is owned by the parent's layout, so only show a
                    // ghost offset while the pointer looks for a new home.
                    setGhostOffset(dx, dy);
                    // The distances to what surrounds it, read off the ghost.
                    // These used to appear only when the drag was about to
                    // place freely, which on a stacked page is almost never —
                    // so a whole page of dragging showed no measurements at all.
                    setMeasures(measureGaps(dragInfo.id, moving.parentId));
                    // Dragged clear of every boundary, it is about to become a
                    // freely placed element — so it aligns and measures like
                    // one already, instead of the drop being a surprise.
                    if (plan?.free) {
                        const style = resolveStyle(moving, gestureBreakpoint, cascade);
                        const parent = moving.parentId ? byId.get(moving.parentId) : undefined;
                        const parentStyle = parent ? resolveStyle(parent, gestureBreakpoint, cascade) : undefined;
                        const gestureFrameWidth = breakpointDefs.find((definition) => definition.id === gestureBreakpoint)?.width ?? frameWidth;
                        const box = {
                            x: plan.free.x / scale - (style.widthMode === "fixed" ? style.w / 2 : 0),
                            y: plan.free.y / scale - (style.heightMode === "fixed" ? style.h / 2 : 0),
                            w: style.w,
                            h: style.h,
                        };
                        const snapped = event.altKey
                            ? { ...box, guides: [] as Guide[] }
                            : snapPosition(
                                  elements,
                                  dragInfo.id,
                                  box,
                                  parentStyle ? { w: parentStyle.w, h: parentStyle.h } : { w: gestureFrameWidth, h: canvasHeight },
                                  gestureBreakpoint,
                                  6 / scale,
                              );
                        const origin = parent
                            ? absolutePosition(byId, parent, gestureBreakpoint, cascade)
                            : { x: 0, y: 0 };
                        setGuides({ origin, lines: snapped.guides });
                        setMeasures(measureGaps(dragInfo.id, moving.parentId));
                    } else {
                        // No alignment guides when there is nothing to align
                        // to — but the distances stay: they are about where the
                        // layer is, not about what it is snapping to.
                        setGuides({ origin: { x: 0, y: 0 }, lines: [] });
                    }
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

                setMeasures(measureGaps(dragInfo.id, moving.parentId));
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


            if (seamInfo) {
                const next = Math.round(Math.max(0, Math.min(9999, seamInfo.initial + (event.clientY - seamInfo.startY) / scale)));
                setElements((els) =>
                    els.map((el) =>
                        el.id === seamInfo.id
                            ? applyStyleIsolated(el, gestureBreakpoint, { marginB: next }, breakpointDefs.map((definition) => definition.id), cascade)
                            : el,
                    ),
                );
                return;
            }

            if (paddingInfo) {
                // The inset grows as the pointer moves toward the middle of the
                // box, so each side reads the axis it sits on with its own sign.
                const delta =
                    paddingInfo.side === "padT" ? event.clientY - paddingInfo.startY
                    : paddingInfo.side === "padB" ? paddingInfo.startY - event.clientY
                    : paddingInfo.side === "padL" ? event.clientX - paddingInfo.startX
                    : paddingInfo.startX - event.clientX;
                const next = Math.round(Math.max(0, Math.min(9999, paddingInfo.initial + delta / scale)));
                const opposite = { padT: "padB", padB: "padT", padL: "padR", padR: "padL" } as const;
                const patch: Partial<ElementStyle> = { [paddingInfo.side]: next };
                if (paddingInfo.symmetric) patch[opposite[paddingInfo.side]] = next;

                setElements((els) =>
                    els.map((el) =>
                        el.id === paddingInfo.id
                            ? applyStyleIsolated(el, gestureBreakpoint, patch, breakpointDefs.map((definition) => definition.id), cascade)
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

            const corner = handle.length === 2;

            /*
             * A corner keeps the shape; Shift lets go of it.
             *
             * Dragging a corner means "make this bigger", and a box that
             * changes proportion while you do it is a different box. The
             * opposite corner stays put, so the anchor is the one you are not
             * holding.
             *
             * Both axes are read together rather than one being picked as the
             * leader. Choosing a leader makes the size jump the instant the
             * lead changes hands, and on a wide, short box — a headline, say —
             * where one pixel of height is worth twenty of width, a two-pixel
             * wobble threw the width by a hundred and fifty. Averaging the two
             * as proportions of the box keeps every pixel of the drag worth
             * the same, so the size follows the hand instead of snapping.
             */
            if (corner && !event.shiftKey && initialW > 0 && initialH > 0) {
                const towardsX = handle.includes("w") ? -1 : 1;
                const towardsY = handle.includes("n") ? -1 : 1;
                const growth = ((dx * towardsX) / initialW + (dy * towardsY) / initialH) / 2;
                w = Math.max(minSize, Math.round(initialW * (1 + growth)));
                h = Math.max(minSize, Math.round(initialH * (1 + growth)));
                if (handle.includes("w")) x = initialX + (initialW - w);
                if (handle.includes("n")) y = initialY + (initialH - h);
            }

            // Dragging a corner of a text box scales the type with it: the box
            // is only ever as big as the words in it, so resizing it without
            // the font just reflows the same text into a different shape.
            // Edge handles keep the old behaviour — that is how you set a
            // measure without touching the size.
            const patch: Partial<ElementStyle> = { x, y, w, h };
            // A component master is the editing surface itself. Resizing from
            // its west/north edge changes that surface's size, not its offset
            // inside another canvas; allowing x/y to move here made the child
            // visually chase the handle and shimmer between pixels.
            if (componentMode && resizing?.componentRole === "master") {
                patch.x = 0;
                patch.y = 0;
            }
            if (corner && resizeInfo.initialFontSize) {
                const ratio = initialW > 0 && initialH > 0
                    ? Math.min(w / initialW, h / initialH)
                    : 1;
                patch.fontSize = Math.round(
                    Math.max(1, Math.min(999, resizeInfo.initialFontSize * ratio)),
                );
            }

            // Dragging the edge all the way out means "as wide as this gets",
            // not "exactly 1280 pixels". Without this the gesture silently
            // writes a fixed width, and a design that filled the 1280 artboard
            // strands at 1280 on a wider screen. Snapping to fill keeps the
            // intent, so the same design fills 1920 too.
            if (handle.includes("e") || handle.includes("w")) {
                const node = viewportRef.current?.querySelector<HTMLElement>(canvasTargetSelector(resizeInfo.id, gestureBreakpoint, parkedSubtree.has(resizeInfo.id)));
                const container = node?.parentElement?.getBoundingClientRect();
                const parentStyle = resizing?.parentId
                    ? resolveStyle(byId.get(resizing.parentId) ?? resizing, gestureBreakpoint, cascade)
                    : undefined;
                const available = container ? container.width / scale : undefined;
                const inFlow = !resizing?.parked && (!resizing?.parentId || parentStyle?.layout === "stack");
                if (inFlow && available) {
                    patch.widthMode = w >= available - SNAP_FILL ? "fill" : "fixed";
                } else {
                    patch.widthMode = "fixed";
                }
            }

            // Grabbing a handle is how a size stops being decided for you. An
            // `auto` height or a `fill` width simply ignores the numbers the
            // drag writes, so the box did not move and the handle looked
            // broken; the axis being dragged becomes explicit.
            if (handle.includes("n") || handle.includes("s")) patch.heightMode = "fixed";
            if (corner) patch.widthMode = patch.widthMode ?? "fixed";

            setElements((els) =>
                els.map((el) =>
                    el.id === resizeInfo.id
                        ? parkedSubtree.has(el.id)
                            ? applyStyle(el, cascade.baseId, patch, cascade)
                            : applyStyleIsolated(el, gestureBreakpoint, patch, breakpointDefs.map((definition) => definition.id), cascade)
                        : el,
                ),
            );
        };

        const handleMouseUp = (event: MouseEvent) => {
            const dropPlan = gestureRef.current?.get().dropPlan ?? null;
            neighbourCache.current = null;
            if (dragInfo) {
                const moving = byId.get(dragInfo.id);
                const currentParent = moving?.parentId;
                /*
                 * Let go off the canvas and nothing happens.
                 *
                 * The pointer strays over the layer tree or the inspector on
                 * the way to somewhere, and releasing there used to be treated
                 * as a drop: the layer was reparented to whatever the fallback
                 * worked out, or — worse, once layers could be parked — thrown
                 * out of the page entirely. Neither was ever what was meant.
                 */
                if (!overCanvas(event.clientX, event.clientY)) {
                    setDragInfo(null);
                    setPressedEffectId(null);
                    setResizeInfo(null);
                    setPaddingInfo(null);
                    setSeamInfo(null);
                    setDropPlan(null);
                    setDropTargetId(undefined);
                    setMeasures([]);
                    return;
                }
                /*
                 * Dragged clean out of every artboard.
                 *
                 * The layer stops being part of the page and becomes a thing
                 * parked beside it: it keeps its content and its styling, it
                 * takes a name above it the way an artboard does, and it stays
                 * out of what gets published. Dropping it back onto an artboard
                 * undoes all of that — see `reparent`, which clears the mark.
                 */
                // Same rule as the parked things: a click is not a drag, and
                // must never move a layer out of the page.
                const travelled =
                    Math.abs(event.clientX - dragInfo.startX) + Math.abs(event.clientY - dragInfo.startY) > 3;
                const overArtboard = travelled
                    ? artboardAt(event.clientX, event.clientY, dragInfo.id)
                    : true;
                if (!componentMode && !overArtboard && parkAnchorRef.current && moving && !moving.parked) {
                    const dragged = resolveStyle(moving, dragInfo.breakpoint, cascade);
                    const point = parkPoint(event.clientX, event.clientY);
                    const x = Math.round(point.x - dragged.w / 2);
                    const y = Math.round(point.y - 16);
                    setElements((els) =>
                        reparent(els, dragInfo.id, undefined, dragInfo.breakpoint, undefined, cascade).map((el) =>
                            el.id === dragInfo.id
                                // Parked things are placed by the canvas layer
                                // that draws them, from their x/y. Leaving the
                                // layer absolutely positioned as well applied
                                // those coordinates twice, so the frame flew
                                // off and left its name behind.
                                ? { ...el, parked: true, base: { ...el.base, position: "static", x, y } }
                                : el,
                        ),
                    );
                    setDragInfo(null);
                    setPressedEffectId(null);
                    setDropPlan(null);
                    setMeasures([]);
                    setGuides({ origin: { x: 0, y: 0 }, lines: [] });
                    return;
                }
                // `undefined` means the page root, which is a valid destination,
                // so only skip when nothing was hovered at all.
                // A drop that keeps the same parent still counts: reordering
                // inside one container is the common case, and skipping it
                // when only `beforeId` changed is why ordering never took.
                if (
                    dragInfo.mode === "reflow" &&
                    dragInfo.breakpoint === cascade.baseId &&
                    dropPlan?.free
                ) {
                    // Dropped away from any boundary: the element keeps the
                    // spot it was let go of. It leaves the flow on its own, so
                    // the siblings it was sitting among do not move.
                    if (dropPlan.parentId !== currentParent) {
                        doReparent(dragInfo.id, dropPlan.parentId);
                    }
                    const size = byId.get(dragInfo.id);
                    const style = size ? resolveStyle(size, dragInfo.breakpoint, cascade) : undefined;
                    // Drop point is the pointer; the element is centred on it so
                    // it lands where the cursor is, not below-right. The guides
                    // shown during the drag are what it snaps to, so releasing
                    // puts it exactly where the alignment promised.
                    const dropped = {
                        x: dropPlan.free.x / scale - (style?.widthMode === "fixed" ? style.w / 2 : 0),
                        y: dropPlan.free.y / scale - (style?.heightMode === "fixed" ? style.h / 2 : 0),
                        w: style?.w ?? 0,
                        h: style?.h ?? 0,
                    };
                    const parent = size?.parentId ? byId.get(size.parentId) : undefined;
                    const parentStyle = parent ? resolveStyle(parent, dragInfo.breakpoint, cascade) : undefined;
                    const landed = snapPosition(
                        elements,
                        dragInfo.id,
                        dropped,
                        parentStyle
                            ? { w: parentStyle.w, h: parentStyle.h }
                            : { w: breakpointDefs.find((definition) => definition.id === dragInfo.breakpoint)?.width ?? frameWidth, h: canvasHeight },
                        dragInfo.breakpoint,
                        6 / scale,
                    );
                    patchStyle([dragInfo.id], {
                        position: "absolute",
                        x: Math.round(landed.x),
                        y: Math.round(landed.y),
                    });
                } else if (
                    dragInfo.mode === "reflow" &&
                    dragInfo.breakpoint === cascade.baseId &&
                    dropPlan &&
                    (dropPlan.parentId !== currentParent || dropPlan.beforeId)
                ) {
                    doReparent(dragInfo.id, dropPlan.parentId, dropPlan.beforeId);
                } else if (
                    dragInfo.mode === "free" &&
                    dragInfo.breakpoint === cascade.baseId &&
                    dropPlan
                ) {
                    /*
                     * A freely placed element dropped onto a container.
                     *
                     * This case had no branch at all, which is why dragging
                     * something into a container "sometimes" did nothing: it
                     * worked for elements in a stack and never worked for
                     * anything already placed by hand.
                     */
                    const moved = byId.get(dragInfo.id);
                    const nextParent = dropPlan.parentId ? byId.get(dropPlan.parentId) : undefined;
                    const nextParentStyle = nextParent
                        ? resolveStyle(nextParent, dragInfo.breakpoint, cascade)
                        : undefined;
                    const landsInFlow = (nextParentStyle?.layout ?? rootStyle.layout) === "stack";
                    // Landing in a stack is always a move, even when the stack
                    // is the one it already lives in: that is a reorder, and
                    // refusing it is why dropping a hand-placed layer back among
                    // its own siblings did nothing at all.
                    if (!landsInFlow && dropPlan.parentId === currentParent) {
                        setDragInfo(null);
                        setPressedEffectId(null);
                        setResizeInfo(null);
                        setPaddingInfo(null);
                        setSeamInfo(null);
                        setDropPlan(null);
                        setDropTargetId(undefined);
                        setMeasures([]);
                        return;
                    }
                    doReparent(dragInfo.id, dropPlan.parentId, dropPlan.beforeId);
                    if (landsInFlow) {
                        // The container arranges its children, so the element
                        // gives up the coordinates it was carrying.
                        patchStyle([dragInfo.id], { position: "static" });
                    } else if (moved) {
                        // Still freely placed, now in someone else's space: keep
                        // it where it visually is by re-basing its coordinates.
                        const was = absolutePosition(byId, moved, dragInfo.breakpoint, cascade);
                        const origin = nextParent
                            ? absolutePosition(byId, nextParent, dragInfo.breakpoint, cascade)
                            : { x: 0, y: 0 };
                        patchStyle([dragInfo.id], {
                            x: Math.round(was.x - origin.x),
                            y: Math.round(was.y - origin.y),
                        });
                    }
                }
            }
            setDragInfo(null);
            setPressedEffectId(null);
            setResizeInfo(null);
            setPaddingInfo(null);
            setSeamInfo(null);
            clearGhost();
            setDropTargetId(undefined);
            setDropPlan(null);
            setGuides({ origin: { x: 0, y: 0 }, lines: [] });
            setMeasures([]);
            // The whole gesture lands in the undo stack as a single step.
            endTransaction();
        };

        let pendingMove: MouseEvent | null = null;
        let moveFrame = 0;
        const handleMouseMove = (event: MouseEvent) => {
            pendingMove = event;
            if (moveFrame) return;
            moveFrame = window.requestAnimationFrame(() => {
                moveFrame = 0;
                const latest = pendingMove;
                pendingMove = null;
                if (latest) applyMove(latest);
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            if (moveFrame) window.cancelAnimationFrame(moveFrame);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [
        breakpoint,
        breakpointDefs,
        byId,
        cascade,
        acceptsDrop,
        canvasHeight,
        doReparent,
        dragInfo,
        dropTargetId,
        elements,
        endTransaction,
        frameWidth,
        gesturing,
        paddingInfo,
        patchStyle,
        seamInfo,
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

        // A parked frame is moved by the canvas, not by the page's layout: it
        // has no siblings to reorder among and no parent to be placed in. The
        // ordinary drag path treated it as a page layer and did nothing
        // visible, which left its name the only place it could be grabbed.
        if (el.parked && !el.parentId) {
            beginParkedDrag(event, el);
            return;
        }

        const style = resolveStyle(el, bp, cascade);
        beginTransaction();
        // The rendered copy on the artboard being edited is the one that
        // follows the pointer.
        const ghostNode = document.querySelector<HTMLElement>(
            `[data-canvas-page] [data-canvas-element="${CSS.escape(el.id)}"]`,
        );
        ghostRef.current = ghostNode ? { node: ghostNode, dx: 0, dy: 0 } : null;
        setDragInfo({
            id: el.id,
            breakpoint: bp,
            // Either the container places its children freely, or this element
            // has been lifted out of the flow on its own.
            mode: contextFor(el).parentLayout === "absolute"
                || resolveStyle(el, bp, cascade).position === "absolute"
                ? "free"
                : "reflow",
            startX: event.clientX,
            startY: event.clientY,
            initialX: style.x,
            initialY: style.y,
        });
    };

    /**
     * Round the corners by dragging.
     *
     * The distance travelled along the diagonal is the radius, so pulling the
     * dot towards the middle of the box rounds it and pulling it back into the
     * corner squares it off again. Held as one transaction: the whole drag is
     * a single undo, not one per pixel.
     */
    const beginRadiusDrag = (
        event: React.MouseEvent,
        element: CanvasElement,
        bp: Breakpoint = breakpoint,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        if (element.locked) return;
        if (parkedSubtree.has(element.id)) bp = cascade.baseId;
        if (bp !== breakpoint && !parkedSubtree.has(element.id)) setBreakpoint(bp);
        const style = resolveStyle(element, bp, cascade);
        const rendered = viewportRef.current?.querySelector<HTMLElement>(canvasTargetSelector(element.id, bp, parkedSubtree.has(element.id)))?.getBoundingClientRect();
        const limit = Math.max(0, Math.min(rendered ? rendered.width / scale : style.w, rendered ? rendered.height / scale : style.h) / 2);
        const startX = event.clientX;
        const startY = event.clientY;
        const startRadius = style.radius;
        beginTransaction();

        let frame = 0;
        let latest = startRadius;
        setRadiusPreview(startRadius);
        const move = (moveEvent: MouseEvent) => {
            // The diagonal component of the movement, in canvas units.
            const travelled = ((moveEvent.clientX - startX) + (moveEvent.clientY - startY)) / 2 / scale;
            latest = Math.round(Math.max(0, Math.min(limit, startRadius + travelled)));
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                setRadiusPreview(latest);
                patchStyle([element.id], { radius: latest });
            });
        };
        const up = () => {
            if (frame) window.cancelAnimationFrame(frame);
            patchStyle([element.id], { radius: latest });
            setRadiusPreview(null);
            endTransaction();
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const handleResizeMouseDown = (
        event: React.MouseEvent,
        handle: ResizeHandle,
        el: CanvasElement,
        bp: Breakpoint,
    ) => {
        event.stopPropagation();
        // A parked frame is styled on the base and belongs to no artboard, so
        // grabbing its corner must not drag the whole editor to another one.
        event.preventDefault();
        if (el.locked) return;
        if (parkedSubtree.has(el.id)) bp = cascade.baseId;
        if (bp !== breakpoint && !parkedSubtree.has(el.id)) setBreakpoint(bp);
        setSelectedIds([el.id]);
        const style = resolveStyle(el, bp, cascade);
        const rendered = viewportRef.current?.querySelector<HTMLElement>(canvasTargetSelector(el.id, bp, parkedSubtree.has(el.id)))?.getBoundingClientRect();
        const startWidth = style.widthMode === "fixed" || !rendered ? style.w : Math.round(rendered.width / scale);
        const startHeight = style.heightMode === "fixed" || !rendered ? style.h : Math.round(rendered.height / scale);
        beginTransaction();
        setResizeInfo({
            id: el.id,
            breakpoint: bp,
            handle,
            startX: event.clientX,
            startY: event.clientY,
            initialX: style.x,
            initialY: style.y,
            initialW: startWidth,
            initialH: startHeight,
            initialFontSize: isTextual(el.type) ? style.fontSize : undefined,
        });
    };

    const handlePaddingMouseDown = (
        event: React.MouseEvent,
        side: PadSide,
        el: CanvasElement,
        bp: Breakpoint = breakpoint,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        if (bp !== breakpoint && !parkedSubtree.has(el.id)) setBreakpoint(bp);
        setSelectedIds([el.id]);
        beginTransaction();
        setPaddingInfo({
            id: el.id,
            breakpoint: bp,
            side,
            startX: event.clientX,
            startY: event.clientY,
            initial: resolveStyle(el, bp, cascade)[side],
            symmetric: event.altKey,
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

    /*
     * Keep the drawing origin in step with the anchor.
     *
     * Both the stage and the artboards move as the canvas is zoomed, scrolled
     * or resized, so the offset between them is measured after every layout
     * rather than assumed.
     */
    useLayoutEffect(() => {
        const stage = canvasStageRef.current;
        const anchor = parkAnchorRef.current;
        if (!stage || !anchor) return;
        const stageRect = stage.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const next = { x: anchorRect.left - stageRect.left, y: anchorRect.top - stageRect.top };
        setParkOrigin((current) =>
            Math.abs(current.x - next.x) < 0.5 && Math.abs(current.y - next.y) < 0.5 ? current : next,
        );
        // Deliberately narrow: two getBoundingClientRect calls force a layout,
        // and running them after every render made the whole canvas pay for it.
        // Only these change where the artboards sit inside the stage.
    }, [scale, canvasHeight, breakpointDefs, componentMode, frames.length]);

    /**
     * Draw a frame on the empty canvas.
     *
     * The result is parked beside the artboards — outside the page, named above
     * itself — which is the same state a layer dragged out of an artboard ends
     * in. Drop it onto an artboard and it becomes part of the page.
     */
    const beginFrameDraw = (event: React.MouseEvent) => {
        if (event.button !== 0 || spaceHeld || tryBeginPan(event)) return;
        event.preventDefault();
        setSelectedIds([]);
        setEditingId(null);
        setFrameDraw({ startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY });
    };

    useEffect(() => {
        if (!frameDraw) return;
        let frame = 0;
        let latest = { x: frameDraw.x, y: frameDraw.y };
        const move = (event: MouseEvent) => {
            latest = { x: event.clientX, y: event.clientY };
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                setFrameDraw((current) => (current ? { ...current, ...latest } : null));
            });
        };
        const up = (event: MouseEvent) => {
            setFrameDraw(null);
            setCanvasTool("select");
            if (!parkAnchorRef.current) return;
            const w = Math.abs(event.clientX - frameDraw.startX) / scale;
            const h = Math.abs(event.clientY - frameDraw.startY) / scale;
            // A click with no pull is not a frame; it is a click.
            if (w < 8 || h < 8) return;
            const { x, y } = parkPoint(
                Math.min(frameDraw.startX, event.clientX),
                Math.min(frameDraw.startY, event.clientY),
            );
            const frame = createElement("Frame", { x, y, z: nextZ(elements) });
            frame.parked = true;
            frame.name = "Frame";
            frame.base = {
                ...frame.base,
                x,
                y,
                w: Math.round(w),
                h: Math.round(h),
                widthMode: "fixed",
                heightMode: "fixed",
                // The canvas layer places it from x/y; positioning it again
                // from the same numbers is what separated it from its name.
                position: "static",
            };
            setElements((els) => [...els, frame]);
            setSelectedIds([frame.id]);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up, { once: true });
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [frameDraw?.startX, frameDraw?.startY]);

    useEffect(() => {
        if (!marquee) return;
        /*
         * The candidates are measured once, when the drag starts.
         *
         * Measuring them on every mousemove meant a forced layout per pointer
         * sample across every element of every artboard — several hundred
         * boxes — which is what made rubber-banding stutter. Nothing moves
         * while the band is being drawn, so one pass is enough, and the work
         * per frame drops to comparing numbers.
         */
        const targets = Array.from(
            marqueePageRef.current?.querySelectorAll<HTMLElement>("[data-canvas-element]") ?? [],
        ).flatMap((node) => {
            const id = node.dataset.canvasElement;
            if (!id) return [];
            const rect = node.getBoundingClientRect();
            return [{ id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
        });

        // One update per painted frame, from the latest pointer position.
        let frame = 0;
        let latest = { x: marquee.x, y: marquee.y };
        const apply = () => {
            frame = 0;
            const left = Math.min(marquee.startX, latest.x);
            const top = Math.min(marquee.startY, latest.y);
            const right = Math.max(marquee.startX, latest.x);
            const bottom = Math.max(marquee.startY, latest.y);
            const hits = targets.flatMap((target) =>
                target.right >= left && target.left <= right && target.bottom >= top && target.top <= bottom
                    ? [target.id]
                    : [],
            );
            // Only when it actually changed. A new array every frame re-rendered
            // the canvas, the layer tree and the inspector for a selection that
            // was identical — which is most frames of most drags.
            const next = Array.from(new Set([...marqueeBaseRef.current, ...hits]));
            const signature = next.join(",");
            if (signature !== marqueeHitsRef.current) {
                marqueeHitsRef.current = signature;
                setSelectedIds(next);
            }
            setMarquee((current) => (current ? { ...current, x: latest.x, y: latest.y } : null));
        };
        const move = (event: MouseEvent) => {
            latest = { x: event.clientX, y: event.clientY };
            if (!frame) frame = window.requestAnimationFrame(apply);
        };
        const up = () => {
            setMarquee(null);
            marqueePageRef.current = null;
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up, { once: true });
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [marquee?.startX, marquee?.startY]);

    /* ------------------------------------------------------------- dropping */

    const handleDrop = (event: React.DragEvent, parentId: string | null) => {
        event.preventDefault();
        event.stopPropagation();
        setDropTargetId(undefined);
        setDropPlan(null);

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
            if (master.isLayout) {
                if (componentMode) { setPageError("Open a page before applying a layout."); return; }
                const ids = subtreeIds(elements, master.id);
                if (elements.filter(el => ids.has(el.id) && el.childrenSlot).length !== 1) {
                    setPageError("A layout needs exactly one Children placeholder."); return;
                }
                beginTransaction();
                setElements(current => applyPageLayout(current.filter(el => !el.layoutRole || el.layoutRole === "layout"), current, master.componentId ?? master.id));
                setRootStyle({ pageLayoutId: master.componentId ?? master.id, layout: "stack" });
                setSelectedIds([]);
                endTransaction();
                return;
            }
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            const style = resolveStyle(master, cascade.baseId, cascade);
            // `w` and `h` remain as editing-canvas fallbacks even when an
            // asset hugs its contents. Using those stale values here made a
            // hug-sized button land as though it were still as large as its
            // component artboard. Only fixed axes have a trustworthy stored
            // size; hug/fill axes anchor at the pointer and let layout measure
            // the instance from its real contents.
            const grabWidth = style.widthMode === "fixed" ? style.w : 0;
            const grabHeight = style.heightMode === "fixed" ? style.h : 0;
            const x = Math.max(0, (event.clientX - rect.left) / scale - grabWidth / 2);
            const y = Math.max(0, (event.clientY - rect.top) / scale - grabHeight / 2);
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
        let componentParent = parentId ? byId.get(parentId) : undefined;
        while (componentParent && componentParent.componentRole !== "master") {
            componentParent = componentParent.parentId ? byId.get(componentParent.parentId) : undefined;
        }
        if (componentParent?.componentRole === "master") element.componentSourceId = element.id;

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
                setCanvasTool("select");
                setContextMenu(null);
                return;
            }

            const mod = event.metaKey || event.ctrlKey;

            // The canvas tools, where every other editor puts them.
            if (!typing && !mod && !event.altKey && !event.shiftKey) {
                if (event.key.toLowerCase() === "v") { setCanvasTool("select"); return; }
                if (event.key.toLowerCase() === "f" && !componentMode) { setCanvasTool("frame"); return; }
            }
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
            // Shift+1 fits the artboards, Shift+2 recentres them: the canvas
            // cluster that used to carry these is gone, and both are still
            // things you ask for by hand after panning around.
            if (event.shiftKey && !mod && event.key === "!") {
                event.preventDefault();
                zoomToFit();
                return;
            }
            if (event.shiftKey && !mod && event.key === "@") {
                event.preventDefault();
                recenter();
                return;
            }

            // Everything below would fight with normal text entry.
            if (typing) return;

            if (!mod && key === "a") {
                event.preventDefault();
                setLeftTab("Insert");
                setInsertView("Elements");
                setIsLeftCollapsed(false);
                return;
            }

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

    const navigateEditorPage = useCallback(async (id: string, options?: { replace?: boolean }) => {
        if (id === page.id || pageSwitchTarget) return;
        setPageError(null);
        setPageSwitchTarget(id);
        try {
            if (adapters?.navigate) await adapters.navigate(id, options);
            else window.location.href = `${(adapters?.editorHref ?? defaultEditorHref)(id, leftTab.toLowerCase())}${window.location.search}`;
        } catch (error) {
            setPageSwitchTarget(null);
            setPageError(error instanceof Error ? error.message : "Could not open the page.");
        }
    }, [adapters?.editorHref, adapters?.navigate, leftTab, page.id, pageSwitchTarget]);

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
                if (navigate && result.pageId) await navigateEditorPage(result.pageId, { replace: navigate === "replace" });
                else adapters?.refresh?.();
            });
        },
        [adapters, navigateEditorPage],
    );

    const installSiteTemplate = useCallback(async (templateId: string, fontFamily: string) => {
        setPageError(null);
        try {
            const result = await (adapters?.installTemplate ?? unavailable)(templateId, fontFamily);
            if (result.status === "error") {
                setPageError(result.message);
                throw new Error(result.message);
            }
            return { pageId: result.pageId };
        } catch (error) {
            const reason = error instanceof Error ? error : new Error("Template installation failed.");
            setPageError(reason.message);
            throw reason;
        }
    }, [adapters]);

    const importSiteBundle = useCallback(async (bundle: unknown) => {
        if (!adapters?.importTemplate) throw new Error("Importing is not configured.");
        setPageError(null);
        const result = await adapters.importTemplate(bundle);
        if (result.status === "error") {
            setPageError(result.message);
            throw new Error(result.message);
        }
        if (result.pageId) await navigateEditorPage(result.pageId, { replace: true });
        else adapters.refresh?.();
    }, [adapters, navigateEditorPage]);

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

    type Frame = { bp: Breakpoint; width: number; masterId?: string };

    const renderNode = (
        raw: CanvasElement,
        frame: Frame,
        row?: Row,
        keyPrefix = "",
    ): React.ReactNode => {
        const directRow = row ?? (raw.sourceId ? canvasData[raw.sourceId]?.[0] : undefined);
        const el = bindElement(raw, directRow);
        const resolvedStyle = styleFor(el, frame.bp);
        const isActiveFrame = frame.bp === breakpoint;
        const previewVisible = previewVisibility[el.id];
        const hovering = isActiveFrame && hoveredEffectIds.has(el.id) ? el.hover : undefined;
        const pressing = isActiveFrame && pressedEffectId === el.id ? el.press : undefined;
        // The cached style is shared, so a preview or an effect copies before
        // it changes anything.
        const style = previewVisible !== undefined || hovering || pressing
            ? { ...resolvedStyle, ...(previewVisible !== undefined ? { hidden: !previewVisible } : undefined), ...hovering, ...pressing }
            : resolvedStyle;
        if (style.hidden) return null;

        const children = childrenIn(el.id);
        const componentInstance = componentInstanceFor(raw);
        const interactionElement = componentInstance ?? el;
        const container = !componentInstance && isContainer(el.type);
        const isSelected = isActiveFrame && selectedIds.includes(interactionElement.id) && interactionElement.id === el.id;
        const isEditing = isActiveFrame && editingId === el.id;
        const isDropTarget = isActiveFrame && dropTargetId === el.id;
        /*
         * An empty container collapses to a few pixels, which is why dropping
         * into one so often missed: there was nothing under the pointer to
         * hit. While a drag is in flight it holds open a slot instead.
         */
        const emptyDropZone = container
            && children.length === 0
            && dragInfo !== null
            && dragInfo?.id !== el.id;

        const band = isBand(el.type, style, rootStyle);
        const css = cssFor(el, frame.bp, style, style !== resolvedStyle);
        // A parked root is placed by the canvas layer that draws it. Its own
        // coordinates would place it a second time, from the same numbers, and
        // the layer would end up somewhere its name is not — so they are the
        // one thing the parked copy does not get to apply.
        if (el.parked && !el.parentId) {
            css.position = "relative";
            css.left = undefined;
            css.top = undefined;
            css.right = undefined;
            css.bottom = undefined;
        }
        // The author's own declarations win over the inspector's, exactly as
        // they do on the published page. They are merged before the editor's
        // affordances below, so a custom `cursor` cannot hide the move handle.
        Object.assign(css, inlineStyleObject(el.customStyle));
        // A component master is a transparent coordinate system, not a
        // design layer. Visible surfaces belong to its children so cards,
        // menus and overlays can extend beyond the component bounds.
        if (el.componentRole === "master") {
            css.background = "transparent";
            css.backgroundImage = "none";
            css.borderWidth = 0;
            css.boxShadow = "none";
            css.overflow = "visible";
        }
        // A real `fixed` would answer to the editor window and float over the
        // panels. Inside the canvas it pins to the artboard instead, which is
        // what the author is actually looking at; the published page still
        // gets the genuine `position: fixed`.
        if (css.position === "fixed") css.position = "absolute";
        if (el.isLayout || (el.layoutRole === "layout" && !el.parentId)) {
            css.width = "100%";
            css.minHeight = "100%";
            css.flexShrink = 0;
        }
        if (el.childrenSlot && componentMode) {
            css.minHeight = 180;
            css.background = "rgba(84,2,230,0.06)";
            css.border = "1px dashed #a17aff";
        }
        if (!stickyPreview && style.position === "sticky") {
            css.position = "relative";
            css.top = undefined;
            css.right = undefined;
            css.bottom = undefined;
            css.left = undefined;
        }
        if (el.hover || el.press) css.transition = "transform .42s cubic-bezier(.16,1,.3,1), scale .42s cubic-bezier(.16,1,.3,1), rotate .42s cubic-bezier(.16,1,.3,1), background-color .32s ease, color .32s ease, border-color .32s ease, box-shadow .42s cubic-bezier(.16,1,.3,1), opacity .32s ease, filter .42s ease";
        if (el.loop) css.animation = `pg-loop-${el.loop.type} ${el.loop.duration}ms ease-in-out infinite`;
        css.cursor = el.locked ? "default" : isEditing ? "text" : "move";
        // The handles sit outside the box, where the next section's background
        // would paint straight over them. While something is selected it comes
        // forward, so its own controls stay on top of its neighbours.
        if (isSelected && css.zIndex === undefined) css.zIndex = 40;
        css.outline = isSelected
            ? "1.5px solid var(--ed-accent)"
            : isDropTarget
              ? "1.5px solid #22c55e"
              : undefined;
        css.outlineOffset = isSelected || isDropTarget ? "-1px" : undefined;
        // A band paints edge to edge while its content sits in a centred inner
        // box — the same split the published stylesheet emits.
        const split = band ? splitBand(css, rootStyle.maxWidth) : null;

        // Repeat iterates sampled rows. Request renders once and passes the
        // sampled object to every descendant as its binding context.
        const renderChildren = () =>
            emptyDropZone
                ? [
                      // Holds the container open so the pointer has something to
                      // hit, and shows where the element would land.
                      <span
                          key="pg-drop-zone"
                          className="pointer-events-none flex min-h-[56px] w-full items-center justify-center rounded-md border border-dashed border-ed-accent/70 text-[11px] text-ed-accent"
                      >
                          Drop here
                      </span>,
                  ]
                : el.type === "Repeat"
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
        const hoverEffectIds = [
            ...(el.hover && el.hoverTrigger !== "parent" ? [el.id] : []),
            ...children
                .filter((child) => child.hover && child.hoverTrigger === "parent")
                .map((child) => child.id),
        ];

        return (
            // A canvas node is manipulated by pointer; the Layers panel is its keyboard equivalent.
            // biome-ignore lint/a11y/noStaticElementInteractions: pointer-driven canvas node
            <div
                key={`${keyPrefix}${el.id}`}
                data-canvas-element={el.id}
                {...carouselControlAttributes(el.carouselControl)}
                {...disclosureAttributes(el.disclosure)}
                style={split ? split.shell : css}
                onMouseDown={(event) => handleElementMouseDown(event, interactionElement, frame.bp)}
                onMouseEnter={() => effectsPreview && hoverEffectIds.length > 0 && setHoveredEffectIds((current) => {
                    if (hoverEffectIds.every((id) => current.has(id))) return current;
                    const next = new Set(current);
                    for (const id of hoverEffectIds) next.add(id);
                    return next;
                })}
                onMouseUp={() => effectsPreview && setPressedEffectId((id) => id === el.id ? null : id)}
                onMouseLeave={() => { setHoveredEffectIds((current) => { if (!hoverEffectIds.some((id) => current.has(id))) return current; const next = new Set(current); for (const id of hoverEffectIds) next.delete(id); return next; }); setPressedEffectId((id) => id === el.id ? null : id); }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    if (el.layoutRole === "layout") {
                        const master = componentMasters.find(candidate => candidate.isLayout && (candidate.componentId ?? candidate.id) === rootStyle.pageLayoutId);
                        if (master) openComponentEditor(master);
                        return;
                    }
                    // Words inside a placed component belong to that copy, so
                    // they are edited here rather than in the master: reaching
                    // for the master to change one button label is what made
                    // text inside a component feel uneditable. Everything else
                    // in it still opens the master, which is where shape lives.
                    if (isTextual(el.type) && !el.locked) setEditingId(el.id);
                    else if (componentInstance) openComponentEditor(componentInstance);
                }}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!selectedIds.includes(interactionElement.id)) setSelectedIds([interactionElement.id]);
                    setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        elementId: interactionElement.id,
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
                        onChange={(event) => editContent(el, event.target.value)}
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
                    el.childrenSlot && componentMode ? <span className="pointer-events-none p-5 text-[12px] text-[#a17aff]">Children · Page content appears here</span> : <ElementBody element={el} entranceSplit={style.entranceSplit} effectsPreview={effectsPreview} />
                )}

                {el.interactive?.kind === "marquee" ? (
                    <MarqueePreview settings={el.interactive} preview={effectsPreview || (!dragInfo && !selectedIds.some(id => {
                        let current = byId.get(id);
                        const visited = new Set<string>();
                        while (current && !visited.has(current.id)) {
                            if (current.id === el.id) return true;
                            visited.add(current.id);
                            current = current.parentId ? byId.get(current.parentId) : undefined;
                        }
                        return false;
                    }))}>{children.length ? renderChildren() : el.interactive.items.length ? null : <span className="pointer-events-none p-5 text-[12px] text-ed-muted">Drop elements into Marquee</span>}</MarqueePreview>
                ) : el.interactive?.kind === "carousel" ? (
                    <CarouselEditor settings={el.interactive} preview={effectsPreview}
                        editing={isActiveFrame && selectedIds.some(id => subtreeIds(elements, el.id).has(id))}
                        controls={children.filter(child => child.carouselControl).map(child => renderNode(child, frame, row, keyPrefix))}
                        selectedSlide={children.filter(child => !child.carouselControl).findIndex(child => selectedIds.some(id => subtreeIds(elements, child.id).has(id)))}
                        onSelect={index => setSelectedIds([children.filter(child => !child.carouselControl)[index].id])}
                        onAddControl={kind => {
                            const existing = children.find(child => child.carouselControl?.action === (kind === "pagination" ? "group" : kind));
                            if (existing) { setSelectedIds([existing.id]); return; }
                            const bounds = document.querySelector<HTMLElement>(`[data-artboard="${CSS.escape(frame.bp)}"] [data-canvas-element="${CSS.escape(el.id)}"]`)?.getBoundingClientRect();
                            const width = bounds ? bounds.width / scale : style.w;
                            const height = bounds ? bounds.height / scale : style.h;
                            const control = createElement(kind === "pagination" ? "Frame" : "Button", { x: kind === "next" ? Math.max(16, width - 60) : 16, y: kind === "pagination" ? Math.max(16, height - 56) : Math.max(16, height / 2 - 20), z: nextZ(elements) });
                            control.parentId = el.id;
                            control.name = kind === "pagination" ? "Pagination" : kind === "previous" ? "Previous arrow" : "Next arrow";
                            control.content = kind === "previous" ? "←" : kind === "next" ? "→" : "";
                            control.carouselControl = { action: kind === "pagination" ? "group" : kind, slide: 1 };
                            control.base = { ...control.base, position: "absolute", widthMode: "auto", heightMode: "auto", layout: "stack", direction: "row", gap: 8, padT: 8, padR: 12, padB: 8, padL: 12 };
                            const added = [control];
                            if (kind === "pagination") children.filter(child => !child.carouselControl).forEach((_, index) => {
                                const dot = createElement("Button", { x: 0, y: 0, z: nextZ(elements) + index + 1 });
                                dot.parentId = control.id; dot.name = `Slide ${index + 1} control`; dot.content = String(index + 1);
                                dot.carouselControl = { action: "go-to", slide: index + 1, activeColor: "#5402e6", inactiveOpacity: 45 };
                                dot.base = { ...dot.base, position: "static", widthMode: "auto", heightMode: "auto", padT: 8, padR: 12, padB: 8, padL: 12 };
                                added.push(dot);
                            });
                            setElements(current => [...current, ...added]); setSelectedIds([control.id]);
                        }}
                        onAdd={() => {
                            const slide = createElement("Frame", { x: 0, y: 0, z: nextZ(elements) });
                            slide.parentId = el.id; slide.name = `Slide ${children.filter(child => !child.carouselControl).length + 1}`;
                            slide.base = { ...slide.base, position: "static", widthMode: "fill", heightMode: "fill", layout: "stack", direction: "column", padT: 24, padR: 24, padB: 24, padL: 24 };
                            setElements(current => [...current, slide]); setSelectedIds([slide.id]);
                        }}>{children.filter(child => !child.carouselControl).map(child => renderNode(child, frame, row, keyPrefix))}</CarouselEditor>
                ) : split ? (
                    <div style={split.inner}>{renderChildren()}</div>
                ) : (
                    renderChildren()
                )}

                {/* The measurement only while it is being changed: a size that
                    is always on screen is a number nobody asked for, and most
                    of the time it reads "auto × auto". */}
                {isSelected && resizeInfo?.id === el.id && (
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
                        {style.heightMode === "screen" ? "100vh" : Math.round(style.heightMode === "fixed" ? style.h : 0) || "auto"}
                    </span>
                )}

                {/* The seam belongs to the boundary below a root-level section,
                    so it is drawn by the section above it and only where one
                    section actually follows another. */}
                {!componentMode
                    && rootStyle.layout === "stack"
                    && !el.parentId

                    && lastRootId !== el.id && (
                    <SectionSeam
                        space={style.marginB}
                        scale={scale}
                        active={seamInfo?.id === el.id}
                        onDragStart={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedIds([el.id]);
                            beginTransaction();
                            setSeamInfo({ id: el.id, breakpoint: frame.bp, startY: event.clientY, initial: style.marginB });
                        }}
                        onInsert={() => insertSectionAfter(el.id)}
                    />
                )}

                {isSelected && !el.locked && selectedIds.length === 1 && (
                    <>
                        <PaddingHandles
                            element={el}
                            style={style}
                            scale={scale}
                            active={paddingInfo?.id === el.id ? paddingInfo.side : undefined}
                            onMouseDown={(event, side, element) => handlePaddingMouseDown(event, side, element, frame.bp)}
                        />
                    </>
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
    const updatePageSettings = (patch: Partial<RootStyle>) => {
        if (patch.layout) switchPageLayout(patch.layout);
        else setRootStyle(patch);
        if (patch.fontFamily && adapters?.setSiteFont) {
            void adapters.setSiteFont(patch.fontFamily, patch.customFonts ?? rootStyle.customFonts ?? []).catch((error) => {
                setPageError(error instanceof Error ? error.message : "Could not update the site font.");
            });
        }
        // Stepping this page out of the site's chrome, or back into it: the
        // bands are added as the page is read, so the page has to be read
        // again for the change to show.
        if ("useSiteHeader" in patch || "useSiteFooter" in patch) {
            saveNow();
            window.setTimeout(() => window.location.reload(), 400);
        }
        // The header and the footer belong to the site, so naming one is a
        // site-wide write rather than a page edit; every other page picks it
        // up the next time it is read.
        if ((patch.siteHeaderId !== undefined || patch.siteFooterId !== undefined) && adapters?.setSiteLayout) {
            const headerId = patch.siteHeaderId !== undefined ? patch.siteHeaderId : rootStyle.siteHeaderId;
            const footerId = patch.siteFooterId !== undefined ? patch.siteFooterId : rootStyle.siteFooterId;
            void adapters.setSiteLayout(headerId || undefined, footerId || undefined)
                .then(() => {
                    // The bands are built as the page is read, so the document
                    // in hand does not have them yet. Save what is open, then
                    // read the page again with its new chrome around it.
                    saveNow();
                    window.setTimeout(() => window.location.reload(), 400);
                })
                .catch((error) => {
                    setPageError(error instanceof Error ? error.message : "Could not update the site layout.");
                });
        }
        if ((patch.pageTransition || patch.pageTransitionDuration !== undefined) && adapters?.setSiteTransition) {
            void adapters.setSiteTransition(
                patch.pageTransition ?? rootStyle.pageTransition,
                patch.pageTransitionDuration ?? rootStyle.pageTransitionDuration,
            ).catch((error) => {
                setPageError(error instanceof Error ? error.message : "Could not update page transitions.");
            });
        }
    };
    /*
     * The sidebar shows the document itself — its pages and its layers — so
     * those are not tabs any more. What is left is the set of panels that open
     * beside it: the named rows, and the quieter icons along the bottom.
     */
    const buildToolTabs: LeftEditorTab[] = [
        "Insert",
        ...(componentMode ? [] : ["Templates" as const]),
        componentMode ? "Components" : "Assets",
    ];
    const documentToolTabs: LeftEditorTab[] = [
        "Data",
        "History",
        ...(componentMode ? [] : ["Settings" as const]),
    ];
    // Luma is the product's own face rather than a glyph from the icon set,
    // so it is wrapped to the shape the rail expects and used like any other.
    const iconForRailTab = (tab: LeftEditorTab) => tab === "Layers"
            ? IconLayersLinked
            : tab === "Insert"
                ? IconPlus
                : tab === "Templates"
                        ? IconTemplate
                        : tab === "Variables"
                            ? IconPalette
                            : tab === "AI"
                                ? LumaMark
                                : tab === "Components" || tab === "Assets"
                                    ? IconComponents
                                    : tab === "Data"
                                        ? IconDatabase
                                        : tab === "Settings"
                                            ? IconSettings
                                            : IconFile;
    /** Puts the sidebar back on the document lists, address bar included. */
    /*
     * "AI" survives as a route so an /ai link still lands on Luma, but there is
     * no column for it any more: it opens the popup and hands the sidebar back
     * to the layers.
     */
    useEffect(() => {
        if (leftTab !== "AI") return;
        setRightSection("Luma");
        setLeftTab("Layers");
    }, [leftTab]);

    const closeLeftPanel = () => {
        const href = (adapters?.editorHref ?? defaultEditorHref)(page.id, "layers");
        const url = new URL(href, window.location.href);
        const current = new URL(window.location.href);
        current.searchParams.delete("tab");
        url.search = current.search;
        url.hash = current.hash;
        window.history.pushState(window.history.state, "", url);
        setLeftTab("Layers");
        setIsLeftCollapsed(true);
    };
    const openLeftPanel = (tab: LeftEditorTab) => {
        const href = (adapters?.editorHref ?? defaultEditorHref)(page.id, panelSlug(tab));
        const url = new URL(href, window.location.href);
        const current = new URL(window.location.href);
        current.searchParams.delete("tab");
        url.search = current.search;
        url.hash = current.hash;
        window.history.pushState(window.history.state, "", url);
        setLeftTab(tab);
        setIsLeftCollapsed(tab === "Templates");
    };
    const renderRailTab = (tab: LeftEditorTab, horizontal = false) => {
        const Icon = iconForRailTab(tab);
        return (
            <RailTab
                key={tab}
                label={tab === "AI" ? "Luma" : tab}
                icon={<Icon size={15} stroke={1.65} />}
                active={leftTab === tab && (tab === "Templates" || !isLeftCollapsed)}
                horizontal={horizontal}
                onClick={() => openLeftPanel(tab)}
            />
        );
    };
    /**
     * A navigation row in the sidebar. Unlike the icon rail it replaces, the
     * label is always visible: the column is wide enough for it, and a named
     * destination does not have to be learned from a tooltip.
     */
    const renderNavItem = (tab: LeftEditorTab) => {
        const Icon = iconForRailTab(tab);
        const active = leftTab === tab && (tab === "Templates" || !isLeftCollapsed);
        return (
            <button
                type="button"
                key={tab}
                onClick={() => openLeftPanel(tab)}
                aria-pressed={active}
                className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[12.5px] transition-colors ${active
                    ? "bg-[var(--ed-nav-active)] font-medium text-[var(--ed-nav-text)]"
                    : "font-normal text-[var(--ed-nav-muted)] hover:bg-[var(--ed-nav-hover)] hover:text-[var(--ed-nav-text)]"
                }`}
            >
                <Icon size={16} stroke={1.7} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{tab === "AI" ? "Luma" : tab}</span>
            </button>
        );
    };
    const ActiveLeftIcon = iconForRailTab(leftTab);
    /** Whether a panel has taken the sidebar over from the document lists. */
    const panelOpen = leftTab === "Settings" || leftTab === "Templates" || !isLeftCollapsed;


    const toolbarLeft = (
        <>
        <WorkspaceMenu
            label={leftTab === "Settings" ? "Settings" : leftTab === "Templates" ? "Templates" : componentMode ? "Components" : "Canvas"}
            mark={<PagieraMark size={17} className="shrink-0 rounded-[4px]" />}
            items={([...railPrimary, ...railSecondary, ...(!componentMode ? ["Settings" as LeftEditorTab] : [])])
                .filter((tab, index, all) => tab !== "Insert" && all.indexOf(tab) === index)
                .map(tab => {
                    const Icon = iconForRailTab(tab);
                    return {
                        id: tab, label: tab === "AI" ? "Luma" : tab,
                        icon: <Icon size={14} stroke={1.7} />,
                        group: ["Layers", "Pages", "Insert", "Assets", "Components"].includes(tab) ? "Design" : "Workspace",
                        active: tab === leftTab,
                    };
                })}
            onSelect={id => openLeftPanel(id as LeftEditorTab)}
        />
        <InsertMenu onInsert={insertElement} onInteractive={kind => {
            const interactive = normalizeInteractive({ kind })!;
            interactive.items = [];
            const base = createElement("Frame", { x: 32, y: 32, z: 0 }).base;
            insertElement("Frame", {
                name: kind === "carousel" ? "Carousel" : "Marquee",
                interactive, code: interactiveDocument(interactive), codeLanguage: "tsx",
                base: { ...base, widthMode: "fill", heightMode: "fixed", w: 480, h: kind === "carousel" ? 320 : 140, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0, radius: 12, overflow: "hidden" },
            });
        }} onShader={id => {
            const preset = SHADER_PRESETS.find(item => item.id === id);
            const base = createElement("Frame", { x: 32, y: 32, z: 0 }).base;
            insertElement("Frame", {
                name: `Shader · ${preset?.name ?? id}`,
                code: shaderDocument(id), codeLanguage: "tsx",
                shader: { preset: id, colors: [...(preset ?? SHADER_PRESETS[0]).colors], speed: 1, scale: 1 },
                base: { ...base, widthMode: "fill", heightMode: "fixed", w: 480, h: 320, padT: 0, padR: 0, padB: 0, padL: 0, borderW: 0, radius: 0, overflow: "hidden" },
            });
        }} />
        </>
    );

    const workspaceStorageKey = "pagiera:workspace-tabs:" + (adapters?.editorHref ?? defaultEditorHref)(page.id, "layers").replace(page.id, ":page");
    const workspaceComponent = leftTab === "Components" && componentMode ? activeComponentMaster : undefined;
    const workspaceKey = [page.id, leftTab, leftTab === "Settings" ? settingsSection : "", workspaceComponent?.id ?? ""].join(":");
    const workspace = useWorkspaceTabs(workspaceStorageKey, {
        key: workspaceKey, pageId: page.id, panel: leftTab,
        section: leftTab === "Settings" ? settingsSection : undefined,
        componentId: workspaceComponent?.id,
        label: workspaceComponent ? workspaceComponent.name || "Component" : leftTab === "Layers" ? page.name : leftTab === "Settings" ? (settingsSection === "ai" ? "AI settings" : settingsSection === "general" ? "Settings" : settingsSection === "variables" ? "Variables" : "Import & export") : leftTab,
    }, tabsRestored && leftTab !== "Variables" && leftTab !== "AI");

    // A page navigation can remount the editor. Restore its exact destination
    // after the adapter has loaded the document, not before it finishes.
    useEffect(() => {
        if (!tabsRestored) return;
        try {
            const pending = JSON.parse(sessionStorage.getItem(workspaceStorageKey + ":pending") ?? "null") as WorkspaceTab | null;
            if (!pending || pending.pageId !== page.id) return;
            sessionStorage.removeItem(workspaceStorageKey + ":pending");
            if (!isEditorTab(pending.panel, LEFT_EDITOR_TABS)) return;
            setLeftTab(pending.panel);
            setIsLeftCollapsed(false);
            if (pending.section && ["general", "variables", "transfer", "ai"].includes(pending.section)) setSettingsSection(pending.section);
            if (pending.componentId && componentMasters.some(master => master.id === pending.componentId)) {
                setRootStyle({ documentMode: "component" });
                setActiveComponentMasterId(pending.componentId);
                setSelectedIds([pending.componentId]);
            } else if (pending.panel !== "Components" && componentMode) {
                setRootStyle({ documentMode: "page" });
            }
        } catch { /* Invalid or unavailable session storage cannot block navigation. */ }
    }, [page.id, tabsRestored, workspaceStorageKey]);

    const openWorkspaceTab = (tab: WorkspaceTab) => {
        if (!isEditorTab(tab.panel, LEFT_EDITOR_TABS)) return;
        if (tab.pageId !== page.id) {
            if (!pages.some(entry => entry.id === tab.pageId)) { workspace.close(tab.key); return; }
            try { sessionStorage.setItem(workspaceStorageKey + ":pending", JSON.stringify(tab)); } catch { /* Fall back to the page's default panel. */ }
            void navigateEditorPage(tab.pageId);
            return;
        }
        if (tab.componentId) {
            if (!componentMasters.some(master => master.id === tab.componentId)) { workspace.close(tab.key); return; }
            setRootStyle({ documentMode: "component", maxWidth: Math.max(rootStyle.maxWidth, 760) });
            setActiveComponentMasterId(tab.componentId);
            setSelectedIds([tab.componentId]);
            setBreakpoint("desktop");
        } else if (componentMode) {
            setRootStyle({ documentMode: "page" });
            setSelectedIds([]);
            setEditingId(null);
        }
        if (tab.section) setSettingsSection(tab.section);
        openLeftPanel(tab.panel);
    };
    const documentTabs = <WorkspaceTabs tabs={workspace.tabs} activeKey={workspaceKey} onOpen={openWorkspaceTab} onClose={tab => {
        if (tab.key === workspaceKey) {
            const index = workspace.tabs.findIndex(item => item.key === tab.key);
            const next = workspace.tabs[index - 1] ?? workspace.tabs[index + 1];
            if (!next) return;
            openWorkspaceTab(next);
        }
        workspace.close(tab.key);
    }} />;

    const toolbarCenter = (
        <>
            {documentTabs}
            <span className="mx-1 h-4 w-px shrink-0 bg-white/10" />
            {leftTab !== "Templates" && !componentMode && (
                // What a drag on the empty canvas does. Selecting and
                // drawing both start the same way — press and pull — so
                // which one you get has to be a visible, held state
                // rather than a modifier you have to remember.
                <SegmentedBar className="mr-1">
                    {([
                        { tool: "select" as const, icon: IconPointer, label: "Select  ·  V" },
                        { tool: "frame" as const, icon: IconFrame, label: "Draw a frame  ·  F" },
                    ]).map(({ tool, icon: Icon, label }) => (
                        <ToolButton
                            key={tool}
                            tone="segment"
                            label={label}
                            active={canvasTool === tool}
                            onClick={() => setCanvasTool(tool)}
                        >
                            <Icon size={14} stroke={1.7} />
                        </ToolButton>
                    ))}
                </SegmentedBar>
            )}
            {leftTab === "Templates" ? (
                <div className="flex items-center gap-2 px-3 text-[10px] font-semibold text-ed-text"><IconTemplate size={13} className="text-ed-accent" /><span>Template marketplace</span><span className="rounded-md bg-ed-field px-2 py-0.5 text-[8px] font-medium text-ed-faint">Discover</span></div>
            ) : <>
                {/* Which artboard the edits land on. Every breakpoint is
                    on the canvas at once, so this selects rather than
                    resizes: it is the width you are working at. */}
                {!componentMode && (
                    <>
                        <ToolGroup>
                            {breakpointDefs.map((definition) => {
                                const DeviceIcon = definition.width >= 1024
                                    ? IconDeviceDesktop
                                    : definition.width >= 600
                                        ? IconDeviceTablet
                                        : IconDeviceMobile;
                                const active = definition.id === breakpoint;
                                return (
                                    <ToolButton
                                        key={definition.id}
                                        label={`${definition.name} · ${definition.width}px`}
                                        active={active}
                                        onClick={() => setBreakpoint(definition.id)}
                                        className={`h-8 w-9 ${active ? "bg-transparent text-ed-accent" : ""}`}
                                    >
                                        <DeviceIcon size={15} stroke={1.7} />
                                        {/* The artboard you are editing, underlined the
                                            way a chosen tab is. */}
                                        {active && <span className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-ed-accent" />}
                                    </ToolButton>
                                );
                            })}
                        </ToolGroup>
                        <Readout>{selectedBreakpoint.width} PX</Readout>
                        <ToolDivider />
                    </>
                )}
                {!componentMode && (
                    <ToolButton
                        label={gridOverlay ? "Hide the column grid" : "Show a column grid"}
                        active={gridOverlay}
                        onClick={() => setGridOverlay((current) => !current)}
                    >
                        <IconLayoutColumns size={15} stroke={1.7} />
                    </ToolButton>
                )}
                <button
                    type="button"
                    aria-label={effectsPreview ? "Stop interaction preview" : "Preview interactions"}
                    aria-pressed={effectsPreview}
                    onClick={() => { setEffectsPreview((value) => !value); setHoveredEffectIds(new Set()); setPressedEffectId(null); setPreviewVisibility({}); }}
                    className={`group/preview relative flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors ${effectsPreview ? "border-ed-accent bg-[var(--ed-accent-soft)] text-ed-accent" : "border-ed-border text-ed-muted hover:bg-ed-field hover:text-ed-text"}`}
                >
                    <IconPlayerPlay size={13} stroke={1.7} />
                    <span>Preview</span>
                    <span role="tooltip" className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-[100] w-max translate-y-1 rounded-md bg-[var(--ed-tooltip)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--ed-tooltip-text)] opacity-0 shadow-lg transition-all group-hover/preview:translate-y-0 group-hover/preview:opacity-100 group-focus-visible/preview:translate-y-0 group-focus-visible/preview:opacity-100">{effectsPreview ? "Stop interaction preview" : "Preview hover, press and actions"}</span>
                </button>
                <ToolButton
                    tone="solid"
                    tooltip="below"
                    label={stickyPreview ? "Disable sticky preview" : "Preview sticky positioning"}
                    active={stickyPreview}
                    onClick={() => setStickyPreview((value) => !value)}
                >
                    {stickyPreview ? <IconPinFilled size={13} stroke={1.7} /> : <IconPin size={13} stroke={1.7} />}
                </ToolButton>
            <div className="mx-0.5 h-4 w-px bg-ed-border" />
            <div className="flex items-center gap-1 text-[10px] font-medium text-ed-muted">
                {componentMode && <><Select value={activeComponentMaster?.id} onValueChange={(id) => { setActiveComponentMasterId(id); setSelectedIds([id]); }}><SelectTrigger aria-label="Variant"><SelectValue placeholder="Select variant" /></SelectTrigger><SelectContent>{activeComponentVariants.map((master) => <SelectItem key={master.id} value={master.id}>{master.variant ?? "Default"}</SelectItem>)}</SelectContent></Select><button type="button" onClick={createComponentVariant} disabled={!activeComponentMaster} title="Add variant" className="flex size-6 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-30"><IconPlus size={12} /></button></>}
                <ToolGroup>
                    <ToolButton size="sm" label="Zoom out (Ctrl -)" onClick={() => stepZoom(-1)}>
                        <IconMinus size={12} />
                    </ToolButton>
                    <ToolButton
                        size="sm"
                        label="Reset zoom (Ctrl 0)"
                        onClick={() => zoomTo(100)}
                        className="w-9 select-none text-[10px] tabular-nums"
                    >
                        {zoom}%
                    </ToolButton>
                    <ToolButton size="sm" label="Zoom in (Ctrl +)" onClick={() => stepZoom(1)}>
                        <IconPlus size={12} />
                    </ToolButton>
                </ToolGroup>
            </div>

            <ToolGroup className="border-l border-ed-border pl-1">
                <ToolButton size="sm" label="Undo (Ctrl Z)" onClick={undo} disabled={!canUndo}>
                    <IconArrowBackUp size={14} />
                </ToolButton>
                <ToolButton size="sm" label="Redo (Ctrl Shift Z)" onClick={redo} disabled={!canRedo}>
                    <IconArrowForwardUp size={14} />
                </ToolButton>
            </ToolGroup>
            </>}
        </>
    );

    const toolbarRight = (
        <>
            {leftTab === "Templates" ? <>
                <span className="hidden text-[9px] text-ed-faint lg:block">Curated responsive starting points</span>
                <ChromeButton onClick={() => openLeftPanel("Layers")}>Back to canvas</ChromeButton>
            </> : <>
            <span className="hidden lg:block"><SaveIndicator status={saveStatus} error={saveError} /></span>
            <div className="mx-0.5 hidden h-4 w-px bg-ed-border lg:block" />
            {componentMode ? (
                <ChromeButton
                    onClick={() => {
                        setRootStyle({ documentMode: "page" });
                        setSelectedIds([]);
                        setEditingId(null);
                        openLeftPanel("Layers");
                    }}
                >
                    Back to pages
                </ChromeButton>
            ) : <>
            <div className="relative flex items-stretch">
                <button
                    type="button"
                    onClick={publish}
                    disabled={isPending || isDirty}
                    title={isDirty ? "Waiting for the draft to save…" : undefined}
                    className={`h-8 select-none bg-ed-accent px-4 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--ed-accent-hover)] disabled:opacity-50 ${page.publishedAt ? "rounded-l-lg" : "rounded-lg"}`}
                >
                    {isPending ? "Working…" : page.publishedAt ? "Republish" : "Publish"}
                </button>
                {page.publishedAt && (
                    <>
                        <span className="w-px bg-white/20" />
                        <button
                            type="button"
                            aria-label="More publish actions"
                            aria-haspopup="menu"
                            aria-expanded={publishMenuOpen}
                            onClick={() => setPublishMenuOpen((current) => !current)}
                            className="flex h-8 items-center rounded-r-lg bg-ed-accent px-1.5 text-white transition-colors hover:bg-[var(--ed-accent-hover)]"
                        >
                            <IconChevronDown size={14} />
                        </button>
                    </>
                )}
                <AnimatePresence>{publishMenuOpen && (
                    <>
                        {/* biome-ignore lint/a11y/noStaticElementInteractions: dismiss surface for a menu */}
                        <div className="fixed inset-0 z-[95]" onMouseDown={() => setPublishMenuOpen(false)} />
                        <Menu className="absolute right-0 top-[calc(100%+6px)] z-[96] w-[196px]">
                            <MenuLink
                                href={(adapters?.publishedHref ?? defaultPublishedHref)(page.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                icon={<IconWorld size={14} />}
                                label="View live site"
                                onClick={() => setPublishMenuOpen(false)}
                            />
                            <MenuItem
                                icon={<IconEyeOff size={14} />}
                                label="Unpublish"
                                onClick={() => {
                                    setPublishMenuOpen(false);
                                    runPageAction(() => (adapters?.unpublishPage ?? unavailable)(page.id, page.slug));
                                }}
                            />
                        </Menu>
                    </>
                )}</AnimatePresence>
            </div>
            </>}
            </>}
        </>
    );

    const rail = (
        <>
                {railPrimary.map((tab) => renderRailTab(tab))}
                <span className="my-1 h-px w-5 bg-[var(--ed-nav-border)]" />
                {railSecondary.map((tab) => renderRailTab(tab))}
                {!componentMode && (
                    <>
                        <span className="mt-auto h-px w-5 bg-[var(--ed-nav-border)]" />
                        {renderRailTab("Settings")}
                    </>
                )}
        </>
    );

    const panel = (
        <>
                {leftTab !== "Settings" && leftTab !== "Templates" && <div className="flex h-11 shrink-0 items-stretch gap-5 border-b border-white/[0.06] px-3">
                    {(componentMode
                        ? (["Layers", "Components", "Insert"] as LeftEditorTab[])
                        : (["Pages", "Layers", "Assets"] as LeftEditorTab[])
                    ).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => openLeftPanel(tab)}
                            aria-pressed={leftTab === tab}
                            className={`relative flex items-center justify-center text-[12px] font-medium transition-colors ${leftTab === tab
                                ? "text-[var(--ed-nav-text)]"
                                : "text-[var(--ed-nav-muted)] hover:text-[var(--ed-nav-text)]"
                            }`}
                        >
                            {tab}
                            {leftTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#a17aff]" />}
                        </button>
                    ))}
                </div>}
                {(leftTab === "Settings" || leftTab === "Templates") && <PanelHeader title={leftTab} />}
                {leftTab === "Layers" && (
                    <div className="flex h-9 shrink-0 items-center justify-between px-3">
                        <span className="text-[11px] font-medium text-ed-muted">Document</span>
                        <div className="flex items-center gap-0.5">
                            <PanelAction
                                label={layersAllCollapsed ? "Expand every layer" : "Collapse every layer"}
                                disabled={collapsibleLayerIds.length === 0}
                                onClick={() => setCollapsedLayerIds(
                                    layersAllCollapsed ? new Set() : new Set(collapsibleLayerIds),
                                )}
                            >
                                {layersAllCollapsed ? <IconChevronDown size={13} /> : <IconChevronUp size={13} />}
                            </PanelAction>
                            <PanelAction label="Insert a layer" onClick={() => openLeftPanel("Insert")}>
                                <IconPlus size={14} />
                            </PanelAction>
                        </div>
                    </div>
                )}

                {/* One search over the two lists the sidebar holds. It goes away
                    with them: a search box above a panel it cannot filter is a
                    box that looks broken. */}
                {(leftTab === "Layers" || leftTab === "Pages" || leftTab === "Components") && (
                <PanelSearch
                    icon={<IconSearch size={13} />}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={leftTab === "Pages" ? "Search pages…" : "Search layers…"}
                />
                )}

                {/* Whatever the rail points at. */}
                    <div className="flex min-h-0 flex-1 flex-col">
                        {/* The Insert views are chosen from the panel shell, not
                            from inside the scrolling list: a scroll container
                            reserves room for its scrollbar, which left the strip
                            ten pixels narrower than the rows above it. */}
                        {leftTab === "Insert" && (
                            <div className="mx-2 mt-2 grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-ed-subtle p-0.5">
                                {INSERT_VIEWS.map((view) => (
                                    <button
                                        type="button"
                                        key={view}
                                        onClick={() => {
                                            setInsertView(view);
                                            setSearch("");
                                            // Each view is a different list; carrying the
                                            // last one's scroll position into it drops the
                                            // reader somewhere arbitrary.
                                            leftPanelScrollRef.current?.scrollTo({ top: 0 });
                                        }}
                                        aria-pressed={insertView === view}
                                        className={`rounded-[5px] py-1.5 text-[10px] font-medium transition-colors ${insertView === view ? "bg-ed-field-hover text-ed-text shadow-[0_1px_2px_rgb(0_0_0/0.35)]" : "text-ed-muted hover:bg-ed-field/60 hover:text-ed-text"}`}
                                    >
                                        {view}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Only the lists that filter by name get a search box;
                            the Components view carries its own. */}
                        {leftTab === "Insert" && insertView !== "Components" && (
                            <div className="border-b border-ed-border px-2 py-1.5">
                                <div className="flex h-8 items-center gap-2 rounded-lg bg-ed-field px-2.5 transition-colors hover:border-[var(--ed-border-strong)] focus-within:border-ed-accent focus-within:ring-1 focus-within:ring-inset focus-within:ring-[var(--ed-accent)]/35">
                                    <IconSearch size={14} className="text-ed-faint" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={`Search ${(leftTab === "Insert" ? insertView : leftTab).toLowerCase()}…`}
                                        className="w-full bg-transparent text-xs text-ed-text outline-none placeholder:text-ed-faint"
                                    />
                                    <IconCommand size={12} className="text-ed-faint" />
                                </div>
                            </div>
                        )}

                        <div
                            ref={leftPanelScrollRef}
                            className={libraryFillsPanel
                                ? "flex min-h-0 flex-1 flex-col"
                                : "custom-scrollbar flex-1 overflow-y-auto"}
                        >
                            {leftTab === "Layers" ? (
                        <LayersPanel
                            elements={visibleEditorElements}
                            breakpoint={breakpoint}
                            componentMode={componentMode}
                            // The component canvas has masters instead of
                            // artboards, so the widths are a page-only grouping.
                            breakpointGroups={componentMode ? [] : breakpointDefs.map((item) => ({
                                id: item.id,
                                name: item.name,
                                hint: rangeChip(item.id),
                                isBase: item.id === cascade.baseId,
                            }))}
                            onBreakpointChange={setBreakpoint}
                            search={search}
                            selectedIds={selectedIds}
                            onSelect={select}
                            onToggleHidden={(id) => {
                                const el = byId.get(id);
                                if (el) {
                                    patchStyle([id], {
                                        hidden: !resolveStyle(el, styleBreakpoint(el), cascade).hidden,
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
                            onOpenComponent={openComponentEditor}
                            collapsedIds={collapsedLayerIds}
                            onCollapsedChange={setCollapsedLayerIds}
                        />
                            ) : leftTab === "Pages" ? (
                        <PagesPanel
                            pages={visiblePages}
                            currentId={page.id}
                            busy={isPending || Boolean(pageSwitchTarget)}
                            navigatingId={pageSwitchTarget}
                            error={pageError}
                            onCreate={(name, slug) =>
                                runPageAction(() => (adapters?.createPage ?? unavailable)(name, slug), "push")
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
                            onNavigate={(id) => void navigateEditorPage(id)}
                            publishedHref={adapters?.publishedHref ?? defaultPublishedHref}
                        />
                            ) : leftTab === "Insert" ? (
                                <div className={`flex flex-col ${libraryFillsPanel ? "min-h-0 flex-1" : ""}`}>
                                    {/* Keyed on the view so each list animates in
                                        rather than swapping in place. `mode="wait"`
                                        would leave the panel empty for the length of
                                        the exit, which reads as a stall on a click. */}
                                    <motion.div
                                        key={insertView}
                                        className={`flex flex-col ${libraryFillsPanel ? "min-h-0 flex-1" : ""}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        {insertView === "Elements" ? (
                                            <ElementsPanel search={search} onInsert={insertElement} />
                                        ) : insertView === "Icons" ? (
                                            <IconsPanel search={search} onInsert={(props) => insertElement("Icon", props)} />
                                        ) : (
                                            <LibraryPanel
                                                pages={library}
                                                currentPageId={page.id}
                                                onInsert={insertFromLibrary}
                                            />
                                        )}
                                    </motion.div>
                                </div>
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
                            ) : leftTab === "Assets" ? (
                                <AssetsPanel
                                    assets={componentAssets}
                                    activeMasterId={activeComponentMaster?.id}
                                    onOpen={(master) => { setRootStyle({ ...rootStyle, documentMode: "component" }); setActiveComponentMasterId(master.id); setSelectedIds([master.id]); setBreakpoint("desktop"); setLeftTab("Components"); }}
                                    onCreate={() => createBlankComponent()}
                                    onCreateLayout={() => createBlankComponent("Layout")}
                                    pageLayoutId={rootStyle.pageLayoutId}
                                    onRemoveLayout={() => { beginTransaction(); setElements(current => applyPageLayout(current, current)); setRootStyle({ pageLayoutId: "" }); endTransaction(); }}
                                    onCode={() => setCodeComposerOpen(true)}
                                />
                            ) : leftTab === "History" ? (
                                <HistoryPanel
                                    pageId={page.id}
                                    currentVersion={page.version}
                                    listRevisions={adapters?.listRevisions}
                                    restoreRevision={adapters?.restoreRevision}
                                    onRestored={() => adapters?.refresh?.()}
                                />
                            ) : leftTab === "Variables" ? (
                                <VariablesPanel
                                    rootStyle={rootStyle}
                                    selectedElement={selectedElement}
                                    setRootStyle={setRootStyle}
                                    setElements={setElements}
                                />
                            ) : leftTab === "Components" ? (
                                <div className="p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-[11px] font-semibold text-ed-text">Asset canvas</p><p className="mt-1 text-[9px] text-ed-faint">One asset, multiple variants—similar to its own breakpoint set.</p></div><button type="button" onClick={() => { setRootStyle({ ...rootStyle, documentMode: "page" }); setLeftTab("Assets"); }} className="rounded-md bg-ed-field px-2.5 py-1.5 text-[9px] text-ed-muted hover:text-ed-text">Back to page</button></div>{activeComponentMaster && <div className="mb-3 space-y-2 rounded-[18px] bg-ed-subtle p-2.5"><label className="flex items-center gap-2 text-[9px] text-ed-faint"><span className="w-16">Asset</span><input value={activeComponentMaster.name ?? ""} placeholder="Asset name" onChange={(event) => patchProps(activeComponentMaster.id, { name: event.target.value })} className="h-8 min-w-0 flex-1 rounded-xl bg-ed-field px-2.5 text-[10px] text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" /></label><label className="flex items-center gap-2 text-[9px] text-ed-faint"><span className="w-16">Variant</span><input value={activeComponentMaster.variant ?? "Default"} onChange={(event) => patchProps(activeComponentMaster.id, { variant: event.target.value })} className="h-8 min-w-0 flex-1 rounded-xl bg-ed-field px-2.5 text-[10px] text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" /></label></div>}<ComponentAssetCards assets={componentAssets} activeMasterId={activeComponentMaster?.id} onOpen={(master) => { setActiveComponentMasterId(master.id); setSelectedIds([master.id]); }} /><button type="button" onClick={createComponentVariant} disabled={!activeComponentMaster} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ed-accent px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-30"><IconPlus size={12} /> Add variant to {activeComponentMaster?.name ?? "asset"}</button></div>
                            ) : leftTab === "Settings" ? (
                                <SettingsNavigation active={settingsSection} onChange={setSettingsSection} />
                            ) : leftTab === "Templates" ? (
                                <TemplatesNavigation categories={templateCategories} active={templateCategory} onChange={setTemplateCategory} />
                            ) : (
                                <PagesPanel
                                    pages={pages}
                                    currentId={page.id}
                                    busy={isPending || Boolean(pageSwitchTarget)}
                                    navigatingId={pageSwitchTarget}
                                    error={pageError}
                                    onCreate={(name, slug) =>
                                        runPageAction(() => (adapters?.createPage ?? unavailable)(name, slug), "push")
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
                                    onNavigate={(id) => void navigateEditorPage(id)}
                                    publishedHref={adapters?.publishedHref ?? defaultPublishedHref}
                                />
                            )}
                        </div>

                    </div>


        </>
    );

    const canvas = (
        <>
                    {leftTab === "Templates" && (
                        <div className="custom-scrollbar absolute inset-0 z-50 overflow-y-auto bg-ed-surface">
                            <TemplatesPanel
                                category={templateCategory}
                                onCategoryChange={setTemplateCategory}
                                onCategoriesChange={setTemplateCategories}
                                busy={isPending}
                                registryUrl={templateRegistryUrl}
                                onInstall={installSiteTemplate}
                                onImport={adapters?.importTemplate
                                    ? async (bundle) => {
                                        const result = await adapters.importTemplate?.(bundle);
                                        // The adapter reports failure in the payload rather
                                        // than throwing, so it has to be raised here or the
                                        // panel would announce a successful import.
                                        if (result && "status" in result && result.status === "error") {
                                            throw new Error(result.message);
                                        }
                                        const pageId = result && "pageId" in result ? result.pageId : undefined;
                                        return { pageId: typeof pageId === "string" ? pageId : undefined };
                                    }
                                    : undefined}
                                exportUrl={adapters?.exportTemplateUrl}
                                onInstalled={async (pageId) => {
                                    if (pageId) await navigateEditorPage(pageId, { replace: true });
                                    else adapters?.refresh?.();
                                }}
                            />
                        </div>
                    )}
                    {leftTab === "Settings" && (
                        <SettingsWorkspace section={settingsSection}>
                            {settingsSection === "ai" && <AiSettings mcp={adapters?.mcp} available={Boolean(adapters?.generate)} enterToSend={enterToSend} onEnterToSend={updateEnterToSend} />}
                            {settingsSection === "general" && <PageInspector rootStyle={rootStyle} onChange={updatePageSettings} layoutOptions={componentAssets.map((asset) => ({ label: asset.name, value: asset.id }))} />}
                            {settingsSection === "variables" && <VariablesPanel rootStyle={rootStyle} selectedElement={selectedElement} setRootStyle={setRootStyle} setElements={setElements} />}
                            {settingsSection === "transfer" && <SiteTransfer
                                exportUrl={adapters?.exportTemplateUrl}
                                onImport={adapters?.importTemplate ? importSiteBundle : undefined}
                                busy={isPending || Boolean(pageSwitchTarget)}
                            />}
                        </SettingsWorkspace>
                    )}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: pan surface; Ctrl +/-/0 cover the same ground from the keyboard */}
                    <div
                        ref={viewportRef}
                        inert={leftTab === "Settings" || leftTab === "Templates"}
                        aria-hidden={leftTab === "Settings" || leftTab === "Templates" ? true : undefined}
                        className="canvas-scrollbar absolute inset-0 overflow-auto overscroll-none"
                        style={{ cursor: isPanning ? "grabbing" : spaceHeld ? "grab" : canvasTool === "frame" ? "crosshair" : undefined }}
                        onMouseDown={(event) => {
                            if (tryBeginPan(event)) return;
                            setContextMenu(null);
                            // Anything that is not an artboard or a parked
                            // layer is canvas. The old check compared against
                            // the viewport itself, which the scrolling
                            // container covers, so a drag out here almost never
                            // counted as a canvas drag — no rubber band, and
                            // nothing to draw a frame on.
                            const target = event.target as HTMLElement;
                            if (target.closest("[data-canvas-page]") || target.closest("[data-parked]")) return;
                            if (canvasTool === "frame") beginFrameDraw(event);
                            else beginMarquee(event, breakpoint);
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
                        <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={page.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(5px)" }}
                            animate={reduceMotion
                                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                                : pageSwitchTarget
                                ? { opacity: 0.28, y: -8, filter: "blur(4px)" }
                                : { opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
                            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                            ref={canvasStageRef}
                            className="relative flex min-w-max items-start justify-center gap-10"
                            // The canvas reaches past the artboards, and keeps
                            // reaching: the room around them is a fixed slab of
                            // space plus whatever the parked layers need, so
                            // dragging something out to the left or drawing a
                            // frame below always has somewhere to go.
                            style={{
                                paddingLeft: canvasRoom.left,
                                paddingRight: canvasRoom.right,
                                paddingTop: canvasRoom.top,
                                paddingBottom: canvasRoom.bottom,
                            }}
                        >
                            {!componentMode && parkedRoots.map((parked) => {
                                // Drawn from the base alone: a frame beside
                                // the artboards is governed by none of them.
                                const parkedStyle = resolveStyle(parked, cascade.baseId, cascade);
                                const parkedFrame = { bp: cascade.baseId, width: parkedStyle.w };
                                return (
                                    <div
                                        key={parked.id}
                                        data-parked={parked.id}
                                        className="absolute z-[15]"
                                        style={{
                                            left: parkOrigin.x + parkedStyle.x * scale,
                                            top: parkOrigin.y + parkedStyle.y * scale,
                                            width: parkedStyle.w * scale,
                                        }}
                                    >
                                        {/* Parked beside the artboards, this is
                                            a frame in its own right rather than
                                            part of the page, so it is named the
                                            way an artboard is. Drop it onto an
                                            artboard and the name goes with the
                                            parking. */}
                                        <button
                                            type="button"
                                            onClick={(event) => { event.stopPropagation(); select(parked.id, event.shiftKey || event.metaKey); }}
                                            // The name is also the handle. What
                                            // is parked here can be anything —
                                            // a section, an image — and its own
                                            // surface belongs to its content,
                                            // so there would otherwise be
                                            // nothing to grab it by.
                                            onPointerDown={(event) => {
                                                event.stopPropagation();
                                                select(parked.id, false);
                                                beginParkedDrag(event, parked);
                                            }}
                                            className={`absolute -top-5 left-0 max-w-full cursor-grab truncate text-left text-[11px] transition-colors active:cursor-grabbing ${
                                                selectedIds.includes(parked.id) ? "text-ed-accent" : "text-ed-muted hover:text-ed-text"
                                            }`}
                                        >
                                            {displayName(parked)}
                                        </button>
                                        {/* The frame's own surface drags it
                                            too, so long as the press lands on
                                            the frame rather than on something
                                            inside it. */}
                                        {/* biome-ignore lint/a11y/noStaticElementInteractions: canvas surface, like the artboards themselves */}
                                        <div
                                            style={{ width: parkedStyle.w, transform: `scale(${scale})`, transformOrigin: "top left" }}
                                            className="cursor-grab active:cursor-grabbing"
                                            onPointerDown={(event) => {
                                                if (event.target !== event.currentTarget) return;
                                                event.preventDefault();
                                                beginParkedDrag(event, parked);
                                            }}
                                        >
                                            {renderNode(parked, parkedFrame)}
                                        </div>
                                    </div>
                                );
                            })}
                            {frames.map((frame) => {
                                const frameMaster = frame.masterId ? componentMasters.find((master) => master.id === frame.masterId) : undefined;
                                const primary = componentMode ? frame.masterId === activeComponentMaster?.id : frame.bp === breakpoint;
                                const frameElementIds = componentMode && frame.masterId ? subtreeIds(elements, frame.masterId) : undefined;
                                // A parked layer is drawn once, on the canvas
                                // beside the artboards. It used to be drawn
                                // inside every artboard as well, so one frame
                                // parked next to three widths appeared four
                                // times.
                                const frameElements = frameElementIds
                                    ? elements.filter((element) => frameElementIds.has(element.id))
                                    : pageElements;
                                const hasComponentContent = Boolean(
                                    frameMaster && componentHasContent(elements, frameMaster),
                                );
                                const measuredComponentHeight = frameMaster
                                    ? componentPreviewSizes[frameMaster.id]?.height
                                    : undefined;
                                const frameCanvasHeight = componentMode
                                    ? !hasComponentContent
                                        ? 96
                                        : frameMaster?.base.heightMode === "fixed"
                                            ? Math.max(1, frameMaster.base.h)
                                            : Math.max(1, measuredComponentHeight ?? 1)
                                    : canvasHeight;
                                const frameDisplayHeight = componentMode ? frameCanvasHeight : displayCanvasHeight;
                                const definition = breakpointDefs.find(
                                    (item) => item.id === frame.bp,
                                );
                                const isBaseFrame = !componentMode && frame.bp === cascade.baseId;
                                const frameHeaderWidth = frame.width * scale;
                                const showFrameWidth = frameHeaderWidth >= 160;
                                const showFrameRange = frameHeaderWidth >= 330;
                                const showFrameActions = frameHeaderWidth >= 210;
                                return (
                                    <div key={frame.masterId ?? frame.bp} className="flex flex-col gap-2">
                                        <div
                                            draggable={!componentMode}
                                            onDragStart={(event) => { if (componentMode) return; setDraggedBreakpointId(frame.bp); event.dataTransfer.effectAllowed = "move"; }}
                                            onDragEnd={() => setDraggedBreakpointId(null)}
                                            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                                            onDrop={(event) => { event.preventDefault(); if (draggedBreakpointId) moveBreakpoint(draggedBreakpointId, frame.bp); setDraggedBreakpointId(null); }}
                                            title={!componentMode ? `${definition?.name ?? frame.bp} · drawn at ${frame.width}px · ${rangeLabel(frame.bp)}` : undefined}
                                            className={`flex h-8 min-w-0 cursor-grab items-center gap-2 overflow-hidden rounded-lg border px-2 active:cursor-grabbing ${draggedBreakpointId === frame.bp ? "border-ed-accent bg-ed-accent/10 opacity-60" : "border-ed-border bg-ed-subtle"}`}
                                            style={{ width: frameHeaderWidth }}
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
                                                    className="min-w-0 flex-1 rounded bg-ed-field px-1 text-[11px] font-medium text-ed-text outline-none ring-1 ring-ed-accent"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => { if (frameMaster) { setActiveComponentMasterId(frameMaster.id); setSelectedIds([frameMaster.id]); } else setBreakpoint(frame.bp); }}
                                                    onDoubleClick={() => { if (!componentMode) setEditingBreakpointId(frame.bp); }}
                                                    title={componentMode ? undefined : "Double-click to rename"}
                                                    className={`min-w-0 flex-1 truncate text-left text-[11px] font-medium capitalize transition-colors ${
                                                        primary
                                                            ? "text-ed-text"
                                                            : "text-ed-faint hover:text-ed-muted"
                                                    }`}
                                                >
                                                    {componentMode ? `${frameMaster?.name ?? "Asset"} / ${frameMaster?.variant ?? "Default"}` : definition?.name ?? frame.bp}
                                                </button>
                                            )}

                                            {componentMode && showFrameWidth ? (
                                                <span className="font-mono text-[10px] text-ed-faint">{`${frame.width} × ${frameCanvasHeight}`}</span>
                                            ) : !componentMode && showFrameWidth ? (
                                                <input
                                                    type="number"
                                                    value={frame.width}
                                                    onChange={(event) => resizeBreakpoint(frame.bp, Number(event.target.value))}
                                                    onFocus={(event) => event.target.select()}
                                                    title="How wide this artboard is drawn. It does not change what visitors see."
                                                    className="w-12 bg-transparent font-mono text-[10px] text-ed-faint outline-none hover:text-ed-muted focus:text-ed-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            ) : null}
                                            {!componentMode && showFrameRange && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBreakpointPanel(true)}
                                                    title={`${rangeLabel(frame.bp)} — click to edit breakpoints`}
                                                    className="shrink-0 rounded-md bg-ed-field px-1.5 py-0.5 font-mono text-[10px] text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text"
                                                >
                                                    {rangeChip(frame.bp)}
                                                </button>
                                            )}

                                            {showFrameActions && <div className="ml-auto flex shrink-0 items-center gap-1">
                                                {isBaseFrame && (
                                                    <span
                                                        title="Desktop is the main artboard: what you change here is what the narrower ones inherit."
                                                        className="rounded-md bg-ed-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.06em] text-ed-accent"
                                                    >
                                                        Main
                                                    </span>
                                                )}
                                                {!componentMode && breakpointDefs.length > 1 && !isRequiredBreakpoint(frame.bp) && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => { event.stopPropagation(); removeBreakpoint(frame.bp); }}
                                                        title="Remove breakpoint"
                                                        className="flex size-5 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-red-500/15 hover:text-red-400"
                                                    >
                                                        <IconTrash size={11} />
                                                    </button>
                                                )}
                                                <button type="button" onClick={(event) => { event.stopPropagation(); if (componentMode) createComponentVariant(); else addBreakpoint(); }} disabled={componentMode && !activeComponentMaster} className="flex size-5 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-30" title={componentMode ? "Add variant" : "Add breakpoint"}><IconPlus size={12} /></button>
                                            </div>}
                                        </div>

                                        {/* Reserves the scaled footprint so the
                                            scrollbars match what is on screen. */}
                                        <div
                                            className="group/frame relative"
                                            style={{
                                                width: frame.width * scale,
                                                height: frameDisplayHeight * scale,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {/* biome-ignore lint/a11y/noStaticElementInteractions: simulated viewport; a bare click clears the selection, as Escape does */}
                                            <div
                                                ref={(node) => {
                                                    if (primary) frameRef.current = node;
                                                    if (componentMode && frame.masterId) {
                                                        observeComponentPreview(
                                                            frame.masterId,
                                                            node,
                                                            frameMaster?.base.widthMode === "auto",
                                                            frameMaster?.base.heightMode === "auto",
                                                        );
                                                    }
                                                    // The main artboard is the
                                                    // fixed point parked layers
                                                    // are measured against.
                                                    if (!componentMode && frame.bp === cascade.baseId) parkAnchorRef.current = node;
                                                }}
                                                data-canvas-page
                                                // Marks the artboard's own area,
                                                // so a drag that ends outside
                                                // every one of them can tell.
                                                data-artboard={frame.bp}
                                                className={undefined}
                                                style={{
                                                    width: frame.width,
                                                    minHeight: frameCanvasHeight,
                                                    background: componentMode ? "transparent" : rootStyle.bg,
                                                    transform: `scale(${scale})`,
                                                    transformOrigin: "top left",
                                                    outline:
                                                        primary && frames.length > 1
                                                            ? "2px solid var(--ed-accent)"
                                                            : undefined,
                                                    outlineOffset: 3,
                                                }}
                                                onMouseDown={(event) => {
                                                    if (frameMaster && frameMaster.id !== activeComponentMaster?.id) setActiveComponentMasterId(frameMaster.id);
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
                                                        minHeight: frameCanvasHeight,
                                                        background: componentMode ? "transparent" : rootStyle.bg,
                                                    }}
                                                    onDragOver={(event) => {
                                                        event.preventDefault();
                                                        event.dataTransfer.dropEffect = "copy";
                                                        setDropTargetId(null);
                                                    }}
                                                    onDrop={(event) => { if (frameMaster) setActiveComponentMasterId(frameMaster.id); handleDrop(event, componentMode ? frame.masterId ?? null : null); }}
                                                    onMouseDown={(event) => {
                                                        if (event.target === event.currentTarget)
                                                            beginMarquee(event, frame.bp);
                                                    }}
                                                >
                                                    {componentMode && !hasComponentContent && (
                                                        <div className="pointer-events-none absolute inset-0 z-10 flex min-h-24 min-w-40 items-center justify-center rounded-lg border border-dashed border-ed-border bg-ed-field/35 px-5 text-center text-[11px] font-medium leading-relaxed text-ed-faint">
                                                            Drop content here
                                                        </div>
                                                    )}
                                                    {!componentMode && frameElements.length === 0 && (
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-ed-muted">Drag an element here to start</div>
                                                    )}

                                                    {(!componentMode || hasComponentContent) && frameBody(frame, frameElements, primary)}

                                                    {primary && gridOverlay && (
                                                        <div
                                                            className="pointer-events-none absolute inset-0 z-[9998]"
                                                            style={{
                                                                backgroundImage: `repeating-linear-gradient(to right, color-mix(in oklab, var(--ed-accent) 22%, transparent) 0 1px, transparent 1px calc(100% / 12))`,
                                                                backgroundSize: "100% 100%",
                                                            }}
                                                        />
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
                                            {componentMode && <button type="button" aria-label="Resize component width" onMouseDown={(event) => { if (frameMaster && frameMaster.id !== activeComponentMaster?.id) { setActiveComponentMasterId(frameMaster.id); setSelectedIds([frameMaster.id]); } beginComponentWidthResize(event, frameMaster); }} className="absolute -right-1.5 inset-y-0 z-30 w-3 cursor-ew-resize opacity-0 transition-opacity group-hover/frame:opacity-100"><span className="absolute inset-y-1/2 left-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ed-accent shadow-[0_0_0_3px_var(--ed-accent-soft)]" /></button>}
                                            {primary && <button type="button" aria-label={`Resize ${componentMode ? "component" : "page"} canvas height`} onMouseDown={beginCanvasResize} className="absolute -bottom-1.5 inset-x-0 z-30 h-3 cursor-ns-resize opacity-0 transition-opacity group-hover/frame:opacity-100"><span className="absolute left-1/2 top-1/2 h-1 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ed-accent shadow-[0_0_0_3px_var(--ed-accent-soft)]" /></button>}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                        </AnimatePresence>
                    </div>

                    {adapters?.generate && (
                        <>
                            <button
                                type="button"
                                aria-label="Ask Luma"
                                title="Ask Luma"
                                onClick={() => {
                                    setRightSection("Luma");
                                }}
                                className="absolute bottom-6 right-6 z-30 flex size-11 items-center justify-center rounded-full bg-ed-accent text-white shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition-colors hover:bg-[var(--ed-accent-hover)]"
                            >
                                <IconSparkles size={19} stroke={1.7} />
                            </button>

                        </>
                    )}
        </>
    );

    const inspector = (
        <>
                        {/* Two halves of one column. Luma is always reachable —
                            it is where you go when you do not yet know what to
                            select — and Style appears once there is something
                            for it to be about. */}
                        <div className="mx-4 flex h-12 shrink-0 items-stretch gap-6 border-b border-white/[0.06]">
                            {(["Luma", "Style"] as const)
                                .filter((section) => section === "Luma" ? Boolean(adapters?.generate) : hasElementSelection)
                                .map((section) => (
                                    <button
                                        type="button"
                                        key={section}
                                        aria-pressed={activeRightSection === section}
                                        onClick={() => setRightSection(section)}
                                        className={`relative flex items-center justify-center gap-2 px-1 text-xs font-medium transition-colors ${
                                            activeRightSection === section ? "text-ed-text" : "text-ed-muted hover:text-ed-text"
                                        }`}
                                    >
                                        {section === "Luma" && <LumaMark size={13} className="rounded-[4px]" />}
                                        {section}
                                        {activeRightSection === section && <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-ed-accent" />}
                                    </button>
                                ))}
                        </div>

                        {activeRightSection === "Luma" ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <AiPanel
                                    onActiveChatChange={setAiChatTitle}
                                    pageId={page.id}
                                    elements={elements}
                                    rootStyle={rootStyle}
                                    breakpoint={breakpoint}
                                    focus={selectedElement ? { id: selectedElement.id, name: displayName(selectedElement), type: selectedElement.type } : aiFocus}
                                    onClearFocus={() => { setAiFocus(undefined); setSelectedIds([]); }}
                                    onApply={applyAiPlan}
                                    generate={adapters?.generate}
                                    mcp={adapters?.mcp}
                                    enterToSend={enterToSend}
                                    onOpenAiSettings={() => { setSettingsSection("ai"); openLeftPanel("Settings"); }}
                                />
                            </div>
                        ) : (
                        <>
                        <div className="mx-4 my-3 flex h-8 shrink-0 items-stretch gap-1 rounded-lg bg-ed-field/50 p-0.5">
                            {RIGHT_EDITOR_TABS.map((tab) => (
                                <button
                                    type="button"
                                    key={tab}
                                    aria-pressed={rightTab === tab}
                                    onClick={() => setRightTab(tab)}
                                    disabled={!selectedElement}
                                    className={`relative flex flex-1 items-center justify-center rounded-md px-1 text-[10px] font-medium transition-colors disabled:opacity-30 ${
                                        rightTab === tab ? "bg-ed-field text-ed-text" : "text-ed-muted hover:text-ed-text"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {selectedElement && breakpoint !== "desktop" && (
                            <p className="mx-4 mb-2 rounded-lg bg-ed-field/50 px-3 py-2 text-[11px] leading-relaxed text-ed-muted">
                                <b className="font-medium text-ed-text">{breakpoint}</b> overrides · inherits desktop
                            </p>
                        )}

                        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5">
                            {selectedElement ? (
                                <>
                                    <div className="flex items-center gap-1.5 empty:hidden [&:not(:empty)]:mt-2 [&:not(:empty)]:mb-1">
                                        {!componentMode && rootStyle.layout === "absolute" && selectedElement.parentId && <button type="button" onClick={() => doReparent(selectedElement.id, undefined)} className="h-8 flex-1 rounded-lg bg-ed-field px-2.5 text-[10px] font-medium text-ed-muted hover:border-ed-accent/50 hover:bg-ed-field hover:text-ed-text">Detach to canvas</button>}
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
                                            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-1">
                                                <Select value={selectedElement.variant ?? "Default"} onValueChange={switchInstanceVariant}>
                                                    <SelectTrigger className="h-8 min-w-0" aria-label="Component variant"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {elements.filter((element) => element.componentRole === "master" && element.componentId === selectedElement.componentId).map((element) => (
                                                            <SelectItem key={element.id} value={element.variant ?? "Default"}>{element.variant ?? "Default"}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <button type="button" onClick={() => openComponentEditor(selectedElement)} aria-label="Edit main component" className="flex size-8 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconComponents size={13} /></button>
                                                <button type="button" onClick={resetComponentInstance} aria-label="Reset instance" className="flex size-8 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconRefresh size={13} /></button>
                                                <button type="button" onClick={detachComponentInstance} aria-label="Detach instance" className="flex size-8 items-center justify-center rounded-md bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconUnlink size={13} /></button>
                                            </div>
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
                                        style={resolveStyle(selectedElement, styleBreakpoint(selectedElement), cascade)}
                                        breakpoint={styleBreakpoint(selectedElement)}
                                        parentLayout={contextFor(selectedElement).parentLayout}
                                        onStyle={(patch) => patchStyle([selectedElement.id], patch)}
                                        onReset={(keys) => resetOverrides([selectedElement.id], keys)}
                                        onProps={(patch) => patchProps(selectedElement.id, patch)}
                                        onCommitStart={beginTransaction}
                                        onCommitEnd={endTransaction}
                                        sources={dataSources}
                                        bindingKeys={bindingKeys}
                                        insideRepeat={enclosingDataBlock !== undefined}
                                        uploadImage={adapters?.uploadImage}
                                        rootStyle={rootStyle}
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
                            ) : null}
                        </div>
                        </>
                        )}
        </>
    );

    const overlays = (
        <>
            {codeComposerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md" onMouseDown={() => setCodeComposerOpen(false)}>
                    <div className="flex h-[min(760px,88vh)] w-[min(1040px,94vw)] flex-col overflow-hidden rounded-2xl bg-ed-surface shadow-[0_24px_64px_rgb(0_0_0/0.55)]" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-ed-border px-4">
                            <div>
                                <p className="text-xs font-semibold text-ed-text">New code component</p>
                                <p className="mt-0.5 text-[9px] text-ed-faint">React components compile on the server and run in an isolated sandbox.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-lg bg-ed-subtle p-0.5">
                                    {(["tsx", "html"] as const).map((language) => (
                                        <button key={language} type="button" onClick={() => { setCodeComponentLanguage(language); setCodeComponentSource(language === "tsx" ? DEFAULT_TSX_COMPONENT : DEFAULT_HTML_COMPONENT); setCodeComponentPreview(""); setCodeComponentError(""); }} className={`h-7 rounded-md px-3 text-[9px] font-semibold uppercase transition-colors ${codeComponentLanguage === language ? "bg-ed-field text-ed-text shadow-sm" : "text-ed-faint hover:text-ed-muted"}`}>{language}</button>
                                    ))}
                                </div>
                                <button type="button" aria-label="Close code composer" onClick={() => setCodeComposerOpen(false)} className="flex size-8 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-field hover:text-ed-text"><IconX size={15} /></button>
                            </div>
                        </div>
                        <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_.9fr]">
                            <div className="flex min-h-0 flex-col gap-3 border-r border-ed-border p-4">
                                <label className="text-[9px] font-semibold tracking-wide text-ed-faint uppercase">Component name<input value={codeComponentName} onChange={(event) => setCodeComponentName(event.target.value)} className="mt-1.5 h-9 w-full rounded-[14px] bg-ed-subtle px-3 text-[11px] text-ed-text outline-none focus:border-ed-accent" /></label>
                                <label className="flex min-h-0 flex-1 flex-col text-[9px] font-semibold tracking-wide text-ed-faint uppercase">
                                    {codeComponentLanguage === "tsx" ? "Component.tsx" : "Document.html"}
                                    <textarea value={codeComponentSource} onChange={(event) => { setCodeComponentSource(event.target.value); setCodeComponentPreview(""); }} spellCheck={false} className="mt-1.5 min-h-0 flex-1 resize-none rounded-2xl bg-[#0d0e12] p-4 font-mono text-[11px] leading-[1.7] text-zinc-300 outline-none focus:border-ed-accent" />
                                </label>
                                {codeComponentError && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[9px] leading-relaxed text-red-300">{codeComponentError}</p>}
                            </div>
                            <div className="flex min-h-0 flex-col bg-ed-canvas p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-[9px] font-semibold tracking-wide text-ed-faint uppercase">Preview</span>
                                    <button type="button" onClick={() => void compileCodeComponent()} disabled={!codeComponentSource.trim() || codeComponentCompiling} className="h-7 rounded-xl bg-ed-surface px-3 text-[9px] font-semibold text-ed-muted transition-colors hover:border-ed-accent/40 hover:text-ed-text disabled:opacity-40">{codeComponentCompiling ? "Compiling…" : "Run preview"}</button>
                                </div>
                                {codeComponentPreview ? (
                                    <iframe title="Code component preview" srcDoc={codeComponentPreview} sandbox={codeComponentLanguage === "tsx" ? "allow-scripts" : ""} className="min-h-0 flex-1 rounded-2xl bg-white" />
                                ) : (
                                    <div className="grid min-h-0 flex-1 place-items-center rounded-xl border border-dashed border-ed-border bg-ed-surface/50 text-center">
                                        <div><IconCode size={20} className="mx-auto mb-2 text-ed-faint" /><p className="text-[10px] font-medium text-ed-muted">Run the component to preview it</p><p className="mt-1 text-[9px] text-ed-faint">TSX executes without same-origin access.</p></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex h-14 shrink-0 items-center justify-between border-t border-ed-border px-4">
                            <span className="text-[9px] text-ed-faint">React · TypeScript · isolated iframe</span>
                            <div className="flex gap-2"><button type="button" onClick={() => setCodeComposerOpen(false)} className="rounded-lg px-3 py-2 text-[10px] text-ed-muted hover:bg-ed-field">Cancel</button><button type="button" onClick={() => void createCodeComponent()} disabled={!codeComponentSource.trim() || codeComponentCompiling} className="rounded-lg bg-ed-accent px-4 py-2 text-[10px] font-semibold text-white disabled:opacity-30">{codeComponentCompiling ? "Compiling…" : "Create component"}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {!componentMode && (
                <div
                    aria-hidden={!breakpointPanel}
                    className={`fixed left-1/2 top-16 z-[80] w-[420px] origin-top rounded-[18px] bg-ed-surface p-4 shadow-[0_24px_64px_rgb(0_0_0/0.55)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(.22,1,.36,1)] ${breakpointPanel ? "-translate-x-1/2 translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-x-1/2 -translate-y-2 scale-95 opacity-0"}`}
                >
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-ed-text">Breakpoints</h3>
                            <p className="mt-1 text-[11px] leading-relaxed text-ed-muted">Each artboard governs a range of visitor window widths. <b className="font-semibold text-ed-text">Governs from</b> is what publishes; <b className="font-semibold text-ed-text">canvas</b> only changes how wide it is drawn here.</p>
                        </div>
                        <button type="button" onClick={() => setBreakpointPanel(false)} className="rounded p-1 text-ed-muted hover:bg-ed-field"><IconX size={15} /></button>
                    </div>
                    <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto scrollbar-none">
                        {breakpointDefs.map((item, index) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-ed-subtle p-2">
                              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                                <input
                                    aria-label="Breakpoint name"
                                    value={item.name}
                                    onChange={(event) => renameBreakpoint(item.id, event.target.value)}
                                    onBlur={() => commitBreakpointName(item.id)}
                                    className="min-w-0 rounded-xl bg-ed-field px-2.5 py-2 text-xs text-ed-text outline-none focus:border-ed-accent"
                                />
                                <div className="flex items-center gap-0.5">
                                    {item.id === cascade.baseId && (
                                        <span title="Desktop is always the main breakpoint: its edits cascade to the others." className="rounded-md bg-ed-accent/15 px-2 py-1.5 text-[10px] font-semibold text-ed-accent">MAIN</span>
                                    )}
                                    <button type="button" disabled={index === 0} title="Move left" onClick={() => { const next = [...breakpointDefs]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateBreakpoints(next); }} className="rounded p-1 text-ed-faint hover:bg-ed-field disabled:opacity-20"><IconChevronLeft size={13} /></button>
                                    <button type="button" disabled={index === breakpointDefs.length - 1} title="Move right" onClick={() => { const next = [...breakpointDefs]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; updateBreakpoints(next); }} className="rounded p-1 text-ed-faint hover:bg-ed-field disabled:opacity-20"><IconChevronRight size={13} /></button>
                                    {isRequiredBreakpoint(item.id) ? (
                                        <span title="Desktop, tablet and mobile are always kept" className="px-1 text-[9px] font-medium uppercase tracking-[.08em] text-ed-faint">Fixed</span>
                                    ) : item.id !== cascade.baseId && breakpointDefs.length > 1 && (
                                        <button type="button" title="Delete" onClick={() => removeBreakpoint(item.id)} className="rounded p-1 text-ed-faint hover:bg-red-500/10 hover:text-red-400"><IconTrash size={13} /></button>
                                    )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[9px] font-semibold uppercase tracking-[.1em] text-ed-faint">Governs from</span>
                                    <span className="flex items-center rounded-xl bg-ed-field px-2 py-1.5 text-xs text-ed-muted">
                                        <input
                                            aria-label={`${item.name} governs from`}
                                            type="number"
                                            min={240}
                                            max={4000}
                                            value={item.width}
                                            onChange={(event) => setBreakpointThreshold(item.id, Number(event.target.value) || 240)}
                                            className="w-full bg-transparent text-right tabular-nums text-ed-text outline-none"
                                        />px
                                    </span>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-[9px] font-semibold uppercase tracking-[.1em] text-ed-faint">Canvas</span>
                                    <span className="flex items-center rounded-xl bg-ed-field px-2 py-1.5 text-xs text-ed-muted">
                                        <input
                                            aria-label={`${item.name} canvas width`}
                                            type="number"
                                            min={240}
                                            max={4000}
                                            value={item.canvasWidth ?? item.width}
                                            onChange={(event) => resizeBreakpoint(item.id, Number(event.target.value) || 240)}
                                            className="w-full bg-transparent text-right tabular-nums text-ed-text outline-none"
                                        />px
                                    </span>
                                </label>
                              </div>
                              <p className="text-[10px] text-ed-muted">{rangeLabel(item.id)}</p>
                            </div>
                        ))}
                    </div>

                    {/* One axis with every range on it: the question authors
                        actually ask is "which window gets which artboard", and
                        a column of numbers never answers it at a glance. */}
                    <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[.1em] text-ed-faint">
                            <span>Window width</span>
                            <span className="font-mono tracking-normal">0 – {Math.max(...breakpointDefs.map((item) => item.width)) + 400}px</span>
                        </div>
                        <div className="flex h-7 overflow-hidden rounded-xl bg-ed-field">
                            {[...breakpointDefs]
                                .sort((a, b) => a.width - b.width)
                                .map((item, index, sorted) => {
                                    const scaleMax = Math.max(...breakpointDefs.map((entry) => entry.width)) + 400;
                                    const from = index === 0 ? 0 : item.width;
                                    const to = sorted[index + 1] ? sorted[index + 1].width : scaleMax;
                                    const share = Math.max(0.06, (to - from) / scaleMax);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setBreakpoint(item.id)}
                                            title={`${item.name} · ${rangeLabel(item.id)}`}
                                            style={{ flexGrow: share, flexBasis: 0 }}
                                            className={`flex min-w-0 items-center justify-center gap-1 border-r border-ed-border/70 px-1 text-[9px] transition-colors last:border-r-0 ${item.id === breakpoint ? "bg-[var(--ed-accent-soft)] text-ed-accent" : "text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"}`}
                                        >
                                            <span className="truncate">{item.name}</span>
                                            {item.id === cascade.baseId && <span className="shrink-0 font-semibold">·</span>}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    {clashingThresholds.length > 0 && (
                        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] leading-relaxed text-amber-500">
                            Two artboards start at {clashingThresholds.join("px, ")}px. They match the same windows, so only the later one is used — give one of them a different <b>Governs from</b>.
                        </p>
                    )}
                </div>
            )}

            <AnimatePresence>{contextMenu && menuElementId && (
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
                    isFree={(() => { const el = byId.get(menuElementId) ?? elements[0]; return resolveStyle(el, styleBreakpoint(el), cascade).position === "absolute"; })()}
                    onCreateComponent={!componentMode && selectedElement?.id === menuElementId && !selectedElement.componentRole
                        ? () => {
                            createComponentFromSelection();
                            setContextMenu(null);
                        }
                        : undefined}
                    onToggleFree={() => {
                        const el = byId.get(menuElementId);
                        if (el) {
                            const style = resolveStyle(el, styleBreakpoint(el), cascade);
                            const free = style.position === "absolute";
                            // Lifting an element out of the flow keeps it where
                            // it already looks: the coordinates it had while
                            // stacked are meaningless, so they are taken from
                            // what is on screen.
                            const node = document.querySelector<HTMLElement>(`[data-canvas-element="${CSS.escape(el.id)}"]`);
                            const box = node?.getBoundingClientRect();
                            const parent = node?.parentElement?.getBoundingClientRect();
                            const placed = !free && box && parent
                                ? { x: Math.round((box.left - parent.left) / scale), y: Math.round((box.top - parent.top) / scale) }
                                : {};
                            patchStyle([el.id], { position: free ? "static" : "absolute", ...placed });
                        }
                        setContextMenu(null);
                    }}
                    onAskLuma={() => {
                        const el = byId.get(menuElementId);
                        if (el) {
                            setAiFocus({ id: el.id, name: displayName(el), type: el.type });
                            setSelectedIds([el.id]);
                            setRightSection("Luma");
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
            )}</AnimatePresence>


            <AnimatePresence>{contextMenu && !contextMenu.elementId && (
                <Menu className="fixed z-[90] w-[204px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    {(["Text", "Heading", "Button", "Container"] as ElementType[]).map((type) => (
                        <MenuItem
                            key={type}
                            icon={<IconPlus size={13} />}
                            label={`Add ${type}`}
                            onClick={() => {
                                const created = createElement(type, { x: contextMenu.canvasX ?? 0, y: contextMenu.canvasY ?? 0, z: nextZ(elements) });
                                if (type === "Text") created.content = "Text";
                                setElements((current) => [...current, created]);
                                setSelectedIds([created.id]);
                                setContextMenu(null);
                            }}
                        />
                    ))}
                    <MenuSeparator />
                    {componentMode ? (
                        <MenuItem
                            icon={<IconComponents size={13} />}
                            label="Add variant"
                            disabled={!activeComponentMaster}
                            onClick={() => { createComponentVariant(); setContextMenu(null); }}
                        />
                    ) : (
                        <>
                            <MenuItem
                                icon={<IconLayoutColumns size={13} />}
                                label="Add breakpoint"
                                onClick={() => {
                                    addBreakpoint();
                                    setBreakpointPanel(true);
                                    setContextMenu(null);
                                }}
                            />
                            <MenuItem
                                icon={<IconBox size={13} />}
                                label="Breakpoint settings"
                                onClick={() => {
                                    setBreakpointPanel(true);
                                    setContextMenu(null);
                                }}
                            />
                        </>
                    )}
                </Menu>
            )}</AnimatePresence>



            <GestureLayer
                ref={gestureRef}
                selectedElement={selectedElement ?? null}
                breakpoint={selectedElement ? styleBreakpoint(selectedElement) : breakpoint}
                cascade={cascade}
                scale={scale}
                effectsPreview={effectsPreview}
                handleResizeMouseDown={handleResizeMouseDown}
                beginRadiusDrag={beginRadiusDrag}
            />

            {/* The rubber band, and the frame being drawn: the same rectangle,
                told apart by what it is made of — a wash you are selecting
                through, or an outline of the thing about to exist. */}
            {marquee && <div className="pointer-events-none fixed z-[110] rounded-[2px] border border-ed-accent bg-[var(--ed-accent-soft)]" style={{ left: Math.min(marquee.startX, marquee.x), top: Math.min(marquee.startY, marquee.y), width: Math.abs(marquee.x - marquee.startX), height: Math.abs(marquee.y - marquee.startY) }} />}
            {frameDraw && (
                <div
                    className="pointer-events-none fixed z-[110] rounded-[2px] border-2 border-dashed border-ed-accent bg-[var(--ed-accent-soft)]"
                    style={{
                        left: Math.min(frameDraw.startX, frameDraw.x),
                        top: Math.min(frameDraw.startY, frameDraw.y),
                        width: Math.abs(frameDraw.x - frameDraw.startX),
                        height: Math.abs(frameDraw.y - frameDraw.startY),
                    }}
                >
                    <span className="absolute -top-5 left-0 whitespace-nowrap text-[11px] font-medium text-ed-accent">
                        {Math.round(Math.abs(frameDraw.x - frameDraw.startX) / scale)} × {Math.round(Math.abs(frameDraw.y - frameDraw.startY) / scale)}
                    </span>
                </div>
            )}

            <style
                // biome-ignore lint/security/noDangerouslySetInnerHtml: webkit scrollbar pseudo-elements have no Tailwind utility
                dangerouslySetInnerHTML={{
                    __html: `${customFontCss}
                        .canvas-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
                        .canvas-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
                    `,
                }}
            />
        </>
    );

    return (
        <EditorShell
            toolbarLeft={toolbarLeft}
            toolbarCenter={toolbarCenter}
            toolbarRight={toolbarRight}
            rail={rail}
            panel={panel}
            panelOpen={panelOpen}
            canvas={canvas}
            onCanvasBackgroundMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedIds([]);
            }}
            inspector={inspector}
            inspectorVisible={leftTab !== "Settings" && leftTab !== "Templates"}
            overlays={overlays}
        />
    );
}
