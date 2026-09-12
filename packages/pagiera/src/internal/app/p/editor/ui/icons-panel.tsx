"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowLeft, IconChevronRight, IconSearch, IconIcons } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import type { IconifyJSON } from "@iconify/types";
import type { CanvasElement } from "@/lib/editor/types";
import { ICON_PACKS, loadIconPack, iconNames, iconSvg, type IconPack } from "@/lib/editor/icon-library";

const ROW_HEIGHT = 68;
const COLUMNS = 4;
const VIEWPORT = 340;

export function IconsPanel({ search, onInsert }: {
    search: string;
    onInsert: (props: Partial<CanvasElement>) => void;
}) {
    const [pack, setPack] = useState<IconPack | null>(null);
    const [query, setQuery] = useState("");
    const reduced = useReducedMotion();
    const [loaded, setLoaded] = useState<{ pack: IconPack; data: IconifyJSON }>();
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let cancelled = false;
        setError(false);
        if (!pack) return;
        loadIconPack(pack).then(data => { if (!cancelled) setLoaded({ pack, data }); }, () => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, [pack, retry]);
    useEffect(() => {
        setScrollTop(0);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [pack, query]);
    const data = loaded?.pack === pack ? loaded.data : undefined;
    const names = useMemo(() => data ? iconNames(data) : [], [data]);
    const filtered = useMemo(() => {
        const words = query.trim().toLowerCase().split(/[\s-]+/).filter(Boolean);
        return names.filter(name => words.every(word => name.includes(word)));
    }, [names, query]);
    const totalRows = Math.ceil(filtered.length / COLUMNS);
    const firstRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
    const endRow = Math.min(totalRows, firstRow + Math.ceil(VIEWPORT / ROW_HEIGHT) + 5);
    const current = ICON_PACKS.find(item => item.id === pack)!;
    if (!pack) return <div className="flex flex-col gap-1" aria-label="Icon packages">
        {ICON_PACKS.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase())).map(item => <button key={item.id} type="button" onClick={() => { setPack(item.id); setQuery(""); }} className="flex h-16 items-center gap-3 rounded-xl px-3 text-left text-ed-text transition-colors hover:bg-ed-field">
            <span className="flex size-9 items-center justify-center rounded-lg bg-ed-field text-ed-muted"><IconIcons size={22} /></span>
            <span className="flex-1 text-[12px]">{item.name}<span className="mt-1 block text-[10px] text-ed-muted">Browse all icons</span></span><IconChevronRight size={14} className="text-ed-muted" />
        </button>)}
    </div>;
    return <motion.div key={pack} initial={{ opacity: 0, x: reduced ? 0 : 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : .15 }} className="flex min-w-0 flex-col gap-3">
        <button type="button" onClick={() => setPack(null)} className="flex items-center gap-2 py-1 text-[12px] text-ed-text"><IconArrowLeft size={15} />{current.name}<span className="ml-auto text-[10px] text-ed-muted">All packs</span></button>
        <label className="flex h-8 items-center gap-2 rounded-lg bg-ed-field px-2 text-ed-muted"><IconSearch size={13} /><input autoFocus aria-label={`Search ${current.name} icons`} value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${current.name}…`} className="min-w-0 flex-1 bg-transparent text-[11px] text-ed-text outline-none" /></label>
        <p className="text-[10px] text-ed-muted" aria-live="polite">{data ? `${filtered.length.toLocaleString()} / ${names.length.toLocaleString()} icons` : error ? "Could not load icons." : "Loading icons…"}</p>
        {error ? <button type="button" onClick={() => setRetry(value => value + 1)} className="rounded-lg bg-ed-field p-2 text-ed-text">Retry</button> : <div ref={scrollRef} role="region" aria-label={`${current.name} icons`} aria-busy={!data} onScroll={event => setScrollTop(event.currentTarget.scrollTop)} className="custom-scrollbar overflow-y-auto overscroll-contain" style={{ height: VIEWPORT }}>
            {data && !filtered.length && <p className="py-8 text-center text-[11px] text-ed-muted">No icons match “{query}”.</p>}
            <div style={{ height: totalRows * ROW_HEIGHT, position: "relative" }}>
                {data && filtered.slice(firstRow * COLUMNS, endRow * COLUMNS).map((name, index) => {
                    const absolute = firstRow * COLUMNS + index;
                    const svg = iconSvg(data, name);
                    return <button key={`${pack}:${name}`} type="button" title={`${current.name} · ${name}`} aria-label={`Insert ${current.name} ${name}`} onClick={() => onInsert({ name: `${current.name} · ${name}`, svg })} className="group absolute flex flex-col items-center justify-center gap-1 rounded-lg text-ed-muted transition-colors hover:bg-ed-field hover:text-ed-accent focus-visible:outline focus-visible:outline-ed-accent" style={{ top: Math.floor(absolute / COLUMNS) * ROW_HEIGHT, left: `${absolute % COLUMNS * 25}%`, width: "25%", height: ROW_HEIGHT - 4 }}>
                        <span aria-hidden className="block size-6" dangerouslySetInnerHTML={{ __html: svg }} />
                        <span className="w-full truncate px-1 text-center text-[8px]">{name}</span>
                    </button>;
                })}
            </div>
        </div>}
        <p className="text-[9px] text-ed-faint">{current.name} · {current.license} · SVG / currentColor</p>
    </motion.div>;
}
