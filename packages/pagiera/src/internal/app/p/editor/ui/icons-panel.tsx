"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowLeft, IconChevronRight, IconIcons, IconRefresh } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import type { IconifyJSON } from "@iconify/types";
import type { CanvasElement } from "@/lib/editor/types";
import { ICON_PACKS, loadIconPack, iconNames, iconSvg, type IconPack } from "@/lib/editor/icon-library";
import { InsertEmpty } from "./insert-panel";

const ROW_HEIGHT = 68;
const COLUMNS = 4;
const VIEWPORT = 360;

/*
 * The panel's one search box drives both levels: on the pack list it filters
 * packs, inside a pack it filters that pack's icons. Opening or leaving a pack
 * clears it, since a pack name is not an icon name.
 */
export function IconsPanel({ search, onSearchChange, onInsert }: {
    search: string;
    onSearchChange: (value: string) => void;
    onInsert: (props: Partial<CanvasElement>) => void;
}) {
    const [pack, setPack] = useState<IconPack | null>(null);
    const reduced = useReducedMotion();
    const [loaded, setLoaded] = useState<{ pack: IconPack; data: IconifyJSON }>();
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const query = pack ? search : "";
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
    const openPack = (next: IconPack | null) => { setPack(next); onSearchChange(""); };

    if (!pack) {
        const packs = ICON_PACKS.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()));
        return <div className="flex flex-col gap-1.5 px-3 pb-4 pt-0.5" aria-label="Icon packages">
            <p className="px-0.5 pb-1 text-[11px] text-ed-faint">Pick a pack to browse. Icons insert as SVG and follow the text colour.</p>
            {packs.map(item => <button key={item.id} type="button" onClick={() => openPack(item.id)} className="group flex items-center gap-3 rounded-xl bg-ed-surface p-2.5 text-left shadow-[inset_0_0_0_1px_var(--ed-border)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--ed-border-strong),0_6px_16px_-10px_var(--ed-border-strong)] focus-visible:outline-none focus-visible:shadow-[var(--ed-accent-glow)]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ed-field text-ed-muted transition-colors group-hover:text-ed-accent"><IconIcons size={20} stroke={1.5} /></span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-ed-text">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-ed-faint">{item.license}</span>
                </span>
                <IconChevronRight size={14} className="text-ed-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ed-text" />
            </button>)}
            {!packs.length && <InsertEmpty title={`No packs match “${search.trim()}”`} onClear={() => onSearchChange("")} />}
        </div>;
    }

    const current = ICON_PACKS.find(item => item.id === pack)!;
    return <motion.div key={pack} initial={{ opacity: 0, x: reduced ? 0 : 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : .15 }} className="flex min-w-0 flex-col gap-2 px-3 pb-4 pt-0.5">
        <div className="flex items-center gap-2">
            <button type="button" aria-label="All icon packs" onClick={() => openPack(null)} className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ed-field text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text"><IconArrowLeft size={14} /></button>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-ed-text">{current.name}</p>
                <p className="text-[10px] tabular-nums text-ed-faint" aria-live="polite">{data ? `${filtered.length.toLocaleString()} of ${names.length.toLocaleString()} icons` : error ? "Could not load icons." : "Loading icons…"}</p>
            </div>
        </div>
        {error ? <button type="button" onClick={() => setRetry(value => value + 1)} className="flex items-center justify-center gap-1.5 rounded-lg bg-ed-field p-2 text-[11px] font-medium text-ed-text hover:bg-ed-field-hover"><IconRefresh size={13} />Retry</button> : <div ref={scrollRef} role="region" aria-label={`${current.name} icons`} aria-busy={!data} onScroll={event => setScrollTop(event.currentTarget.scrollTop)} className="custom-scrollbar -mx-1 overflow-y-auto overscroll-contain rounded-xl" style={{ height: VIEWPORT }}>
            {!data && <div className="grid grid-cols-4 gap-1 p-1" aria-hidden>{Array.from({ length: 16 }, (_, index) => <span key={index} className="h-[60px] animate-pulse rounded-lg bg-ed-field" />)}</div>}
            {data && !filtered.length && <InsertEmpty title={`No icons match “${query.trim()}”`} onClear={() => onSearchChange("")} />}
            <div style={{ height: totalRows * ROW_HEIGHT, position: "relative" }}>
                {data && filtered.slice(firstRow * COLUMNS, endRow * COLUMNS).map((name, index) => {
                    const absolute = firstRow * COLUMNS + index;
                    const svg = iconSvg(data, name);
                    return <button key={`${pack}:${name}`} type="button" title={`${current.name} · ${name}`} aria-label={`Insert ${current.name} ${name}`} onClick={() => onInsert({ name: `${current.name} · ${name}`, svg })} className="group absolute flex flex-col items-center justify-center gap-1.5 rounded-lg text-ed-text transition-colors hover:bg-ed-field hover:text-ed-accent focus-visible:outline-none focus-visible:shadow-[var(--ed-accent-glow)]" style={{ top: Math.floor(absolute / COLUMNS) * ROW_HEIGHT, left: `${absolute % COLUMNS * 25}%`, width: "25%", height: ROW_HEIGHT - 4 }}>
                        <span aria-hidden className="block size-6" dangerouslySetInnerHTML={{ __html: svg }} />
                        <span className="w-full truncate px-1 text-center text-[10px] text-ed-faint group-hover:text-ed-muted">{name}</span>
                    </button>;
                })}
            </div>
        </div>}
        <p className="text-[10px] text-ed-faint">{current.license} · SVG, follows the text colour</p>
    </motion.div>;
}
