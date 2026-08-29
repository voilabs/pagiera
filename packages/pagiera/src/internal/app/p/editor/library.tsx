"use client";

import { IconArrowLeft, IconBox, IconChevronRight, IconCoin, IconLayoutGrid, IconLayoutNavbar, IconLayoutRows, IconPhoto, IconPlus, IconQuote, IconSearch, IconSparkles } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COMPONENT_PRESETS, type ComponentPreset, type PresetCategory } from "@/lib/editor/presets";
import { resolveStyle } from "@/lib/editor/style";
import { childrenOf, displayName, subtreeIds } from "@/lib/editor/tree";
import { DEFAULT_ROOT_STYLE, type CanvasElement, type RootStyle } from "@/lib/editor/types";
import { RenderedPage } from "@/lib/render/page-render";

export type LibraryPage = { id: string; name: string; elements: CanvasElement[] };
export type LibraryPick = { elements: CanvasElement[]; rootId: string };
type View = "home" | PresetCategory | "Blocks";
type Entry = { pageId: string; pageName: string; element: CanvasElement; elements: CanvasElement[]; childCount: number };

const CATEGORIES: Array<{ view: View; name: string; description: string; icon: typeof IconBox }> = [
    { view: "Navigation", name: "Navigation", description: "Headers, menus and brand bars", icon: IconLayoutNavbar },
    { view: "Hero", name: "Hero", description: "Opening sections", icon: IconPhoto },
    { view: "Features", name: "Features", description: "Bento walls, columns and splits", icon: IconLayoutGrid },
    { view: "Content", name: "Content", description: "Stats, logos and questions", icon: IconBox },
    { view: "Social proof", name: "Social proof", description: "Testimonials and quotes", icon: IconQuote },
    { view: "Pricing", name: "Pricing", description: "Plans and comparison", icon: IconCoin },
    { view: "CTA", name: "Call to action", description: "Closing bands and sign-up", icon: IconSparkles },
    { view: "Footer", name: "Footer", description: "Links, legal and conversion", icon: IconLayoutRows },
    { view: "Blocks", name: "Page blocks", description: "Sections reused from your pages", icon: IconLayoutRows },
];

/** Every category that is served from `COMPONENT_PRESETS`. */
const PRESET_VIEWS = new Set<View>(CATEGORIES.map((item) => item.view).filter((view) => view !== "Blocks"));

export function LibraryPanel({ pages, currentPageId, onInsert }: { pages: LibraryPage[]; currentPageId: string; onInsert: (pick: LibraryPick) => void }) {
    const [view, setView] = useState<View>("home");
    const [direction, setDirection] = useState(1);
    const [search, setSearch] = useState("");
    const entries = useMemo<Entry[]>(() => pages.flatMap((page) => childrenOf(page.elements, undefined).map((element) => ({ pageId: page.id, pageName: page.name, element, elements: page.elements, childCount: subtreeIds(page.elements, element.id).size - 1 }))), [pages]);
    const open = (next: View) => { setDirection(1); setSearch(""); setView(next); };
    const back = () => { setDirection(-1); setSearch(""); setView("home"); };
    const insertPreset = (preset: ComponentPreset) => { const elements = preset.create(); onInsert({ elements, rootId: elements[0].id }); };

    return <div className="relative h-full overflow-hidden"><AnimatePresence initial={false} custom={direction} mode="popLayout"><motion.div key={view} custom={direction} variants={{ enter: (value: number) => ({ x: value > 0 ? "100%" : "-28%", opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (value: number) => ({ x: value > 0 ? "-28%" : "100%", opacity: 0 }) }} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.8 }} className="custom-scrollbar absolute inset-0 overflow-y-auto">
        {view === "home" ? <LibraryHome onOpen={open} /> : <DetailHeader view={view} search={search} onSearch={setSearch} onBack={back} />}
        {PRESET_VIEWS.has(view) && view !== "home" ? <PresetList category={view as PresetCategory} query={search} onInsert={insertPreset} /> : null}
        {view === "Blocks" ? <BlockList entries={entries} currentPageId={currentPageId} query={search} onInsert={onInsert} /> : null}
    </motion.div></AnimatePresence></div>;
}

function LibraryHome({ onOpen }: { onOpen: (view: View) => void }) {
    return <div className="p-3"><div className="pg-chrome-card relative mb-3 overflow-hidden rounded-2xl border border-ed-border bg-ed-subtle p-5"><span className="mb-4 flex size-9 items-center justify-center rounded-xl bg-ed-accent text-white"><IconBox size={17} /></span><p className="text-[13px] font-semibold tracking-tight text-ed-text">Component library</p><p className="mt-1.5 text-[10px] leading-relaxed text-ed-muted">Choose a category, preview a component and add its complete editable structure.</p></div><div className="flex flex-col gap-1.5">{CATEGORIES.map(({ view, name, description, icon: Icon }) => <motion.button whileTap={{ scale: .995 }} key={view} type="button" onClick={() => onOpen(view)} className="group relative rounded-2xl border border-ed-border bg-ed-surface p-3.5 text-left transition-colors hover:border-ed-accent/40 hover:bg-ed-subtle"><span className="relative flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ed-field text-ed-muted transition-colors group-hover:text-ed-text"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-ed-text">{name}</span><span className="mt-0.5 block truncate text-[9px] text-ed-faint">{description}</span></span><IconChevronRight size={14} className="text-ed-faint transition-transform group-hover:translate-x-1 group-hover:text-ed-text" /></span></motion.button>)}</div></div>;
}

function DetailHeader({ view, search, onSearch, onBack }: { view: Exclude<View, "home">; search: string; onSearch: (value: string) => void; onBack: () => void }) {
    const title = CATEGORIES.find((item) => item.view === view)?.name ?? view;
    return <div className="sticky top-0 z-10 border-b border-ed-border bg-ed-surface/95 p-3 backdrop-blur-md"><div className="mb-3 flex items-center gap-2"><button type="button" onClick={onBack} className="flex size-7 items-center justify-center rounded-lg bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconArrowLeft size={14} /></button><div><p className="text-[11px] font-semibold text-ed-text">{title}</p><p className="text-[9px] text-ed-faint">Choose a variant</p></div></div><div className="flex h-8 items-center gap-2 rounded-lg border border-ed-border bg-ed-field px-2.5"><IconSearch size={12} className="text-ed-faint" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="min-w-0 flex-1 bg-transparent text-[10px] text-ed-text outline-none placeholder:text-ed-faint" /></div></div>;
}

/** The width the thumbnail lays out at before it is scaled down to fit. */
const THUMB_WIDTH = 1280;
const THUMB_MIN_HEIGHT = 56;
const THUMB_MAX_HEIGHT = 190;

const THUMB_ROOT: RootStyle = { ...DEFAULT_ROOT_STYLE, fullWidth: true, bg: "transparent" };

/**
 * The preset as it will actually publish, minus the parts a still image has no
 * use for: links that would navigate, entrances that would start invisible,
 * loops and drags that need a script the frame is not allowed to run.
 */
function thumbnailElements(preset: ComponentPreset): CanvasElement[] {
    return preset.create().map((element) => ({
        ...element,
        href: undefined,
        interaction: undefined,
        draggable: undefined,
        loop: undefined,
        base: { ...element.base, entrance: "none" as const },
    }));
}

/**
 * A real render of the preset, not a diagram of it.
 *
 * It goes in an iframe for the same reason the template preview does: the
 * generated stylesheet is a *page* stylesheet — it carries `html` and `body`
 * rules and view-transition keyframes — so dropping it into the editor's own
 * document would restyle the editor. The frame isolates it, and the sandbox
 * withholds `allow-scripts` so nothing in a preset can run here.
 *
 * The card takes its height from what the preset actually renders, clamped, so
 * a navbar gets a short card and a pricing table a tall one instead of every
 * component being letterboxed into the same box.
 */
function PresetThumbnail({ preset }: { preset: ComponentPreset }) {
    const elements = useMemo(() => thumbnailElements(preset), [preset]);
    const hostRef = useRef<HTMLDivElement>(null);
    const [body, setBody] = useState<HTMLElement | null>(null);
    const [width, setWidth] = useState(0);
    const [contentHeight, setContentHeight] = useState(THUMB_MAX_HEIGHT);

    useEffect(() => {
        const node = hostRef.current;
        if (!node) return;
        // Seeded from the layout rather than waiting for the observer to
        // deliver: the first notification only arrives with a frame, so a
        // panel that mounts in a background tab would sit empty until it is
        // looked at.
        setWidth(node.clientWidth);
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!body) return;
        // The frame's document grows as the portalled page paints, so the
        // height is watched rather than read once.
        const measure = () => setContentHeight(body.scrollHeight || THUMB_MAX_HEIGHT);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(body);
        return () => observer.disconnect();
    }, [body]);

    const scale = width > 0 ? width / THUMB_WIDTH : 0;
    const scaled = contentHeight * scale;
    const height = scale > 0
        ? Math.round(Math.min(THUMB_MAX_HEIGHT, Math.max(THUMB_MIN_HEIGHT, scaled)))
        : THUMB_MIN_HEIGHT;
    // A navbar is only a few scaled pixels tall. Held at the min height it sat
    // as a strip along the top of an otherwise empty card; centring it makes a
    // short component look deliberate rather than cut off.
    const offset = scale > 0 && scaled < height ? Math.round((height - scaled) / 2) : 0;

    return (
        <div
            ref={hostRef}
            className="relative overflow-hidden border-b border-ed-border bg-white"
            style={{ height }}
        >
            {scale > 0 && (
                <iframe
                    title={`${preset.name} preview`}
                    sandbox="allow-same-origin"
                    srcDoc="<!doctype html><html><head><meta charset='utf-8'></head><body style='margin:0'></body></html>"
                    onLoad={(event) => setBody(event.currentTarget.contentDocument?.body ?? null)}
                    // The click belongs to the card behind it.
                    style={{
                        width: THUMB_WIDTH,
                        height: Math.max(contentHeight, height / scale),
                        border: 0,
                        pointerEvents: "none",
                        transform: `translateY(${offset}px) scale(${scale})`,
                        transformOrigin: "top left",
                    }}
                />
            )}
            {body && createPortal(<RenderedPage elements={elements} rootStyle={THUMB_ROOT} includeScripts={false} />, body)}
        </div>
    );
}

function PresetList({ category, query, onInsert }: { category: ComponentPreset["category"]; query: string; onInsert: (preset: ComponentPreset) => void }) {
    const presets = COMPONENT_PRESETS.filter((preset) => preset.category === category && `${preset.name} ${preset.description}`.toLowerCase().includes(query.toLowerCase()));
    return (
        <div className="space-y-2.5 p-3">
            {presets.map((preset) => (
                // The click target is an overlaid button rather than a button
                // wrapping the card: an iframe inside a button swallows the
                // press and is not valid content for one.
                <motion.div
                    whileTap={{ scale: 0.995 }}
                    key={preset.id}
                    className="pg-chrome-card group relative overflow-hidden rounded-2xl border border-ed-border bg-ed-subtle text-left transition-colors hover:border-ed-accent/50"
                >
                    <PresetThumbnail preset={preset} />
                    <span className="flex items-center gap-3 p-3.5">
                        <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-semibold text-ed-text">{preset.name}</span>
                            <span className="mt-0.5 block text-[9px] text-ed-faint">{preset.description}</span>
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-xl bg-ed-field text-ed-faint transition-colors group-hover:bg-ed-accent group-hover:text-white">
                            <IconPlus size={13} />
                        </span>
                    </span>
                    <button
                        type="button"
                        aria-label={`Insert ${preset.name}`}
                        onClick={() => onInsert(preset)}
                        className="absolute inset-0 cursor-pointer"
                    />
                </motion.div>
            ))}
            {presets.length === 0 && <Empty />}
        </div>
    );
}

function BlockList({ entries, currentPageId, query, onInsert }: { entries: Entry[]; currentPageId: string; query: string; onInsert: (pick: LibraryPick) => void }) {
    const visible = entries.filter((entry) => entry.pageId !== currentPageId && `${displayName(entry.element)} ${entry.pageName}`.toLowerCase().includes(query.toLowerCase()));
    return <div className="space-y-2 p-3">{visible.map((entry) => { const style = resolveStyle(entry.element, "desktop"); return <button key={`${entry.pageId}:${entry.element.id}`} type="button" onClick={() => onInsert({ elements: entry.elements, rootId: entry.element.id })} className="flex w-full items-center gap-3 rounded-xl border border-ed-border bg-ed-subtle p-2.5 text-left transition-colors hover:border-ed-accent/40 hover:bg-ed-field"><span className="h-10 w-12 shrink-0 rounded-lg border border-ed-border" style={{ background: style.gradient || style.bg || "var(--ed-field)" }} /><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium text-ed-text">{displayName(entry.element)}</span><span className="block truncate text-[9px] text-ed-faint">{entry.pageName} · {entry.childCount} children</span></span><IconPlus size={12} className="text-ed-faint" /></button>; })}{visible.length === 0 && <Empty />}</div>;
}


function Empty() { return <p className="p-6 text-center text-[10px] leading-relaxed text-ed-faint">Nothing matches this category yet.</p>; }

export { IconArrowLeft };
