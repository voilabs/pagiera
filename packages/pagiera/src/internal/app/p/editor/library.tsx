"use client";

import { IconArrowLeft, IconBox, IconChevronRight, IconLayoutNavbar, IconLayoutRows, IconPhoto, IconPlus, IconSearch } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { COMPONENT_PRESETS, type ComponentPreset } from "@/lib/editor/presets";
import { resolveStyle } from "@/lib/editor/style";
import { childrenOf, createElement, displayName, subtreeIds } from "@/lib/editor/tree";
import { ELEMENT_TYPES, type CanvasElement, type ElementType } from "@/lib/editor/types";

export type LibraryPage = { id: string; name: string; elements: CanvasElement[] };
export type LibraryPick = { elements: CanvasElement[]; rootId: string };
type View = "home" | "Navigation" | "Hero" | "Footer" | "Basic" | "Blocks";
type Entry = { pageId: string; pageName: string; element: CanvasElement; elements: CanvasElement[]; childCount: number };

const CATEGORIES: Array<{ view: View; name: string; description: string; icon: typeof IconBox }> = [
    { view: "Navigation", name: "Navbar", description: "Headers, menus and navigation", icon: IconLayoutNavbar },
    { view: "Hero", name: "Hero", description: "Modern opening sections", icon: IconPhoto },
    { view: "Footer", name: "Footer", description: "Links, legal and conversion", icon: IconLayoutRows },
    { view: "Basic", name: "Basic components", description: "Buttons, text, grids and media", icon: IconBox },
    { view: "Blocks", name: "Page blocks", description: "Sections reused from your pages", icon: IconLayoutRows },
];

export function LibraryPanel({ pages, currentPageId, onInsert }: { pages: LibraryPage[]; currentPageId: string; onInsert: (pick: LibraryPick) => void }) {
    const [view, setView] = useState<View>("home");
    const [direction, setDirection] = useState(1);
    const [search, setSearch] = useState("");
    const entries = useMemo<Entry[]>(() => pages.flatMap((page) => childrenOf(page.elements, undefined).map((element) => ({ pageId: page.id, pageName: page.name, element, elements: page.elements, childCount: subtreeIds(page.elements, element.id).size - 1 }))), [pages]);
    const open = (next: View) => { setDirection(1); setSearch(""); setView(next); };
    const back = () => { setDirection(-1); setSearch(""); setView("home"); };
    const insertPreset = (preset: ComponentPreset) => { const elements = preset.create(); onInsert({ elements, rootId: elements[0].id }); };
    const insertBasic = (type: ElementType) => { const element = createElement(type, { x: 0, y: 0, z: 0 }); onInsert({ elements: [element], rootId: element.id }); };

    return <div className="relative h-full overflow-hidden"><AnimatePresence initial={false} custom={direction} mode="popLayout"><motion.div key={view} custom={direction} variants={{ enter: (value: number) => ({ x: value > 0 ? "100%" : "-28%", opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (value: number) => ({ x: value > 0 ? "-28%" : "100%", opacity: 0 }) }} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.8 }} className="absolute inset-0 overflow-y-auto">
        {view === "home" ? <LibraryHome onOpen={open} /> : <DetailHeader view={view} search={search} onSearch={setSearch} onBack={back} />}
        {view === "Navigation" || view === "Hero" || view === "Footer" ? <PresetList category={view} query={search} onInsert={insertPreset} /> : null}
        {view === "Basic" ? <BasicList query={search} onInsert={insertBasic} /> : null}
        {view === "Blocks" ? <BlockList entries={entries} currentPageId={currentPageId} query={search} onInsert={onInsert} /> : null}
    </motion.div></AnimatePresence></div>;
}

function LibraryHome({ onOpen }: { onOpen: (view: View) => void }) {
    return <div className="p-3"><div className="pg-chrome-card relative mb-4 overflow-hidden rounded-3xl border border-ed-border bg-[radial-gradient(circle_at_90%_0%,rgba(109,124,255,.2),transparent_48%),linear-gradient(145deg,var(--ed-subtle),var(--ed-surface))] p-5"><span className="mb-4 flex size-9 items-center justify-center rounded-2xl bg-ed-accent text-white shadow-[0_10px_28px_rgba(109,124,255,.32)]"><IconBox size={17} /></span><p className="text-[13px] font-semibold tracking-tight text-ed-text">Component library</p><p className="mt-1.5 text-[10px] leading-relaxed text-ed-muted">Choose a category, preview a component and add its complete editable structure.</p></div><div className="flex flex-col gap-2.5">{CATEGORIES.map(({ view, name, description, icon: Icon }, index) => <motion.button whileHover={{ y: -2 }} whileTap={{ scale: .985 }} key={view} type="button" onClick={() => onOpen(view)} className="pg-chrome-card group relative overflow-hidden rounded-2xl border border-ed-border bg-gradient-to-r from-ed-subtle to-ed-surface p-3.5 text-left transition-colors hover:border-ed-accent/40"><span className={`absolute inset-y-0 right-0 w-24 opacity-20 ${index === 0 ? "bg-gradient-to-l from-indigo-500" : index === 1 ? "bg-gradient-to-l from-cyan-500" : index === 2 ? "bg-gradient-to-l from-violet-500" : "bg-gradient-to-l from-ed-accent"}`} /><span className="relative flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/[.04] bg-ed-field text-ed-accent transition-transform group-hover:scale-105"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-ed-text">{name}</span><span className="mt-0.5 block truncate text-[9px] text-ed-faint">{description}</span></span><IconChevronRight size={14} className="text-ed-faint transition-transform group-hover:translate-x-1 group-hover:text-ed-text" /></span></motion.button>)}</div></div>;
}

function DetailHeader({ view, search, onSearch, onBack }: { view: Exclude<View, "home">; search: string; onSearch: (value: string) => void; onBack: () => void }) {
    const title = CATEGORIES.find((item) => item.view === view)?.name ?? view;
    return <div className="sticky top-0 z-10 border-b border-ed-border bg-ed-surface/95 p-3 backdrop-blur-md"><div className="mb-3 flex items-center gap-2"><button type="button" onClick={onBack} className="flex size-7 items-center justify-center rounded-lg bg-ed-field text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconArrowLeft size={14} /></button><div><p className="text-[11px] font-semibold text-ed-text">{title}</p><p className="text-[9px] text-ed-faint">Choose a variant</p></div></div><div className="flex h-8 items-center gap-2 rounded-lg border border-ed-border bg-ed-field px-2.5"><IconSearch size={12} className="text-ed-faint" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="min-w-0 flex-1 bg-transparent text-[10px] text-ed-text outline-none placeholder:text-ed-faint" /></div></div>;
}

function PresetList({ category, query, onInsert }: { category: ComponentPreset["category"]; query: string; onInsert: (preset: ComponentPreset) => void }) {
    const presets = COMPONENT_PRESETS.filter((preset) => preset.category === category && `${preset.name} ${preset.description}`.toLowerCase().includes(query.toLowerCase()));
    return <div className="space-y-3.5 p-3">{presets.map((preset) => <motion.button whileHover={{ y: -3 }} whileTap={{ scale: .99 }} key={preset.id} type="button" onClick={() => onInsert(preset)} className="pg-chrome-card group block w-full overflow-hidden rounded-3xl border border-ed-border bg-ed-subtle text-left transition-colors hover:border-ed-accent/50"><PresetPreview preset={preset} /><span className="flex items-center gap-3 p-3.5"><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-ed-text">{preset.name}</span><span className="mt-0.5 block text-[9px] text-ed-faint">{preset.description}</span></span><span className="flex size-8 items-center justify-center rounded-xl bg-ed-field text-ed-faint transition-all group-hover:rotate-90 group-hover:bg-ed-accent group-hover:text-white"><IconPlus size={13} /></span></span></motion.button>)}{presets.length === 0 && <Empty />}</div>;
}

function BasicList({ query, onInsert }: { query: string; onInsert: (type: ElementType) => void }) {
    const types = ELEMENT_TYPES.filter((type) => type.toLowerCase().includes(query.toLowerCase()));
    return <div className="grid grid-cols-2 gap-2 p-3">{types.map((type) => <button key={type} type="button" onClick={() => onInsert(type)} className="overflow-hidden rounded-xl border border-ed-border bg-ed-subtle text-left hover:border-ed-accent/40 hover:bg-ed-field"><BasicPreview type={type} /><span className="flex items-center justify-between px-2.5 py-2 text-[10px] font-medium text-ed-text">{type}<IconPlus size={11} className="text-ed-faint" /></span></button>)}</div>;
}

function BlockList({ entries, currentPageId, query, onInsert }: { entries: Entry[]; currentPageId: string; query: string; onInsert: (pick: LibraryPick) => void }) {
    const visible = entries.filter((entry) => entry.pageId !== currentPageId && `${displayName(entry.element)} ${entry.pageName}`.toLowerCase().includes(query.toLowerCase()));
    return <div className="space-y-2 p-3">{visible.map((entry) => { const style = resolveStyle(entry.element, "desktop"); return <button key={`${entry.pageId}:${entry.element.id}`} type="button" onClick={() => onInsert({ elements: entry.elements, rootId: entry.element.id })} className="flex w-full items-center gap-3 rounded-xl border border-ed-border bg-ed-subtle p-2.5 text-left hover:border-ed-accent/40 hover:bg-ed-field"><span className="h-10 w-12 shrink-0 rounded-lg border border-ed-border" style={{ background: style.gradient || style.bg || "var(--ed-field)" }} /><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium text-ed-text">{displayName(entry.element)}</span><span className="block truncate text-[9px] text-ed-faint">{entry.pageName} · {entry.childCount} children</span></span><IconPlus size={12} className="text-ed-faint" /></button>; })}{visible.length === 0 && <Empty />}</div>;
}

function PresetPreview({ preset }: { preset: ComponentPreset }) {
    const light = preset.id === "navbar-light"; const glass = preset.id === "navbar-glass";
    if (preset.category === "Navigation") return <span className={`flex h-24 items-start p-4 ${light ? "bg-[#e8edf4]" : glass ? "bg-gradient-to-br from-[#4338ca] to-[#0f172a]" : "bg-[#070b16]"}`}><span className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 ${glass ? "border border-white/15 bg-white/10 backdrop-blur" : light ? "bg-white shadow-md" : "bg-[#111827]"}`}><span className={`h-2 w-10 rounded-full ${light ? "bg-slate-900" : "bg-white"}`} /><span className="ml-auto h-1 w-7 rounded bg-slate-400/60" /><span className="h-1 w-7 rounded bg-slate-400/60" /><span className={`ml-1 h-4 w-12 rounded-full ${glass ? "bg-white" : light ? "bg-slate-900" : "bg-[#8b7bff]"}`} /></span></span>;
    if (preset.category === "Hero") return <span className="flex h-32 flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_0%,#4338ca,#0b1020_65%)] px-8"><span className="h-1 w-16 rounded bg-indigo-300/70" /><span className="h-3 w-4/5 rounded bg-white" /><span className="h-1.5 w-2/3 rounded bg-slate-300/60" /><span className="mt-2 h-5 w-16 rounded-full bg-[#8b7bff]" /></span>;
    return <span className="flex h-28 flex-col justify-between bg-[#09090f] p-4"><span className="flex justify-between"><span className="space-y-2"><span className="block h-2 w-10 rounded bg-white" /><span className="block h-1 w-16 rounded bg-slate-600" /></span><span className="flex gap-5">{[1,2,3].map((value) => <span key={value} className="space-y-2"><span className="block h-1.5 w-8 rounded bg-slate-300" /><span className="block h-1 w-6 rounded bg-slate-700" /><span className="block h-1 w-7 rounded bg-slate-700" /></span>)}</span></span><span className="h-px bg-slate-800" /></span>;
}

function BasicPreview({ type }: { type: ElementType }) {
    return <span className="flex h-14 items-center justify-center border-b border-ed-border bg-ed-field/60 px-2">{type === "Button" ? <span className="rounded-full bg-[#8b7bff] px-3 py-1.5 text-[7px] font-semibold text-white">Button</span> : type === "Heading" ? <span className="text-xs font-bold text-ed-text">Big heading</span> : type === "Text" ? <span className="space-y-1.5"><span className="block h-1 w-16 rounded bg-ed-muted/70" /><span className="block h-1 w-11 rounded bg-ed-faint/50" /></span> : type === "Image" || type === "Video" ? <span className="h-9 w-16 rounded bg-gradient-to-br from-indigo-400/50 to-cyan-400/20" /> : type === "Request" ? <span className="flex h-9 w-16 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/10 font-mono text-[7px] text-cyan-300">GET {"{}"}</span> : type === "Grid" || type === "Repeat" ? <span className="flex gap-1">{[1,2,3].map((item) => <span key={item} className="h-8 w-6 rounded border border-ed-border bg-ed-surface" />)}</span> : <span className="h-9 w-16 rounded border border-ed-border bg-ed-surface shadow-sm" />}</span>;
}

function Empty() { return <p className="p-6 text-center text-[10px] leading-relaxed text-ed-faint">Nothing matches this category yet.</p>; }

export { IconArrowLeft };
