import { AnimatePresence } from "motion/react";
import { PopupSurface } from "./popup-surface";
import { useEffect, useRef, useState } from "react";
import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react";
import type { ReactNode } from "react";

export function WorkspaceMenu({ label, mark, items, onSelect }: {
    label: string;
    mark: ReactNode;
    items: { id: string; label: string; icon: ReactNode; group: string; active: boolean }[];
    onSelect: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const trigger = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!open) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
        };
        window.addEventListener("keydown", escape);
        return () => window.removeEventListener("keydown", escape);
    }, [open]);
    const visible = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
    return <div className="relative">
        <button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => { setOpen(!open); setQuery(""); }} className="flex h-8 items-center gap-2 rounded-lg bg-white/[0.055] px-2 text-[12px] font-semibold text-ed-text transition-colors hover:bg-white/10">
            {mark}<span>{label}</span><IconChevronDown size={12} className="ml-1 text-ed-muted" />
        </button>
        <AnimatePresence>{open && <>
            <div className="fixed inset-0 z-[95]" onPointerDown={() => setOpen(false)} />
            <PopupSurface role="dialog" aria-label="Switch workspace" className="absolute left-0 top-[calc(100%+8px)] z-[96] w-[248px] overflow-hidden rounded-xl bg-ed-menu p-1.5 text-[12px] shadow-[0_16px_48px_#0008,0_0_0_1px_#ffffff12]">
                <label className="flex h-9 items-center gap-2 px-2 text-ed-muted"><IconSearch size={14}/><input autoFocus aria-label="Find a panel" placeholder="Find a panel…" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] text-ed-text outline-none placeholder:text-ed-muted" /></label>
                {Array.from(new Set(visible.map(item => item.group))).map(group => <section key={group} className="border-t border-white/[0.08] py-1.5">
                    <p className="px-2 pb-1 pt-1 text-[10px] font-medium text-[#909090]">{group}</p>
                    {visible.filter(item => item.group === group).map(item => <button type="button" key={item.id} onClick={() => { onSelect(item.id); setOpen(false); }} className="flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-[#ededed] transition-colors hover:bg-white/[0.085] focus-visible:bg-white/[0.085] focus-visible:outline-none">
                        <span className="text-[#ababab]">{item.icon}</span><span className="flex-1">{item.label}</span>{item.active && <IconCheck size={13} className="text-[#b295ff]" />}
                    </button>)}
                </section>)}
                {!visible.length && <p className="px-2 py-4 text-ed-muted">No matching panels.</p>}
            </PopupSurface>
        </>}</AnimatePresence>
    </div>;
}
