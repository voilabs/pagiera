import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PopupSurface } from "./popup-surface";
import { useEffect, useState } from "react";
import { IconPlus, IconSearch, IconChevronRight, IconFrame, IconPalette, IconPhoto, IconForms, IconTypography, IconSparkles } from "@tabler/icons-react";
import type { CanvasElement, ElementType } from "@/lib/editor/types";
import { BASE_STYLE } from '@/lib/editor/types';
import { SHADER_PRESETS } from "@/lib/editor/shaders";
import { IconsPanel, TYPE_ICONS } from "../parts";

const categories = [
    { name: "Layout", icon: IconFrame, types: ["Frame", "Stack", "Grid", "Section", "Container"] },
    { name: "Text", icon: IconTypography, types: ["Heading", "Text", "Quote", "Markdown"] },
    { name: "Icons", icon: IconSparkles, types: [] },
    { name: "Shaders", icon: IconPalette, types: [] },
    { name: "Media", icon: IconPhoto, types: ["Image", "Video", "Embed"] },
    { name: "Forms", icon: IconForms, types: ["Form", "Input", "Textarea", "Select", "Checkbox", "Radio", "Button", "Label", "Fieldset", "FileInput"] },
    { name: "Interactive", icon: IconSparkles, types: [] },
    { name: "Utility", icon: IconFrame, types: ["Divider", "Spacer", "List", "ListItem", "Request", "Repeat"] },
] as const;

export function InsertMenu({ onInsert, onShader, onInteractive }: { onInsert: (type: ElementType, props?: Partial<CanvasElement>) => void; onShader: (id: string) => void; onInteractive: (kind: "carousel" | "marquee") => void }) {
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState<string>("Layout");
    const [search, setSearch] = useState("");
    const reducedMotion = useReducedMotion();
    useEffect(() => {
        if (!open) return;
        const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", escape);return () => window.removeEventListener("keydown", escape);
    }, [open]);
    const insert = (type: ElementType, props?: Partial<CanvasElement>) => { onInsert(type, props); setOpen(false); };
    const active = categories.find(item => item.name === category)!;
    return <div className="relative">
        <button type="button" title="Insert" aria-label="Insert" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className={`flex size-8 items-center justify-center rounded-lg text-ed-text transition-colors ${open ? "bg-ed-field-hover" : "bg-ed-field hover:bg-ed-field-hover"}`}><IconPlus size={19}/></button>
        <AnimatePresence>{open && <><div className="fixed inset-0 z-[95]" onPointerDown={() => setOpen(false)} />
            <PopupSurface role="dialog" aria-label="Insert library" className="absolute left-0 top-[calc(100%+10px)] z-[96] flex h-[min(650px,calc(100dvh-80px))] w-[500px] max-w-[calc(100vw-150px)] overflow-hidden rounded-xl bg-ed-surface shadow-[0_16px_48px_#0008,0_0_0_1px_#ffffff12]">
                <div className="flex w-[205px] shrink-0 flex-col border-r border-ed-border p-2">
                    <label className="mb-4 flex h-8 shrink-0 items-center gap-2 rounded-md bg-ed-field px-2 text-ed-muted"><IconSearch size={13}/><input autoFocus aria-label="Search insert library" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full min-w-0 bg-transparent text-[12px] outline-none"/></label>
                    <p className="px-2 pb-2 text-[11px] text-ed-muted">Elements</p>
{categories.map(item => <button key={item.name} type="button" aria-pressed={category===item.name} onClick={()=>{setCategory(item.name);setSearch("");}} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-left text-[12px] transition-colors duration-150 motion-reduce:transition-none ${category===item.name ? "bg-ed-field text-ed-text" : "text-ed-muted hover:bg-ed-field"}`}><item.icon size={15}/><span className="flex-1">{item.name}</span><IconChevronRight size={12}/></button>)}
                </div>
                <div className="relative min-w-0 flex-1 overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                <motion.div key={category}
                    initial={{ opacity: 0, x: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : -6 }}
                    transition={{ duration: reducedMotion ? 0 : .12, ease: [.2, .8, .2, 1] }}
                    className="custom-scrollbar h-full overflow-y-auto p-3">
                    <h3 className="mb-3 text-[11px] font-medium text-ed-muted">{active.name}</h3>
{category === "Interactive" ? <div className="grid grid-cols-2 gap-2">{(['accordion', 'tabs'] as const).filter(kind => kind.includes(search.toLowerCase())).map(kind => <button type="button" key={kind} onClick={() => { onInsert('Frame', { name: kind === 'tabs' ? 'Tabs' : 'Accordion', disclosure: { kind, role: 'root', target: '' }, base: { ...BASE_STYLE, layout: 'stack', direction: 'column', widthMode: 'fill', heightMode: 'auto', gap: 12, position: 'static' } }); setOpen(false); }} className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl bg-ed-field text-[11px] text-ed-muted hover:bg-ed-field-hover"><span className="text-2xl">{kind === 'tabs' ? '▤' : '☷'}</span>{kind === 'tabs' ? 'Tabs' : 'Accordion'}</button>)}{(["carousel", "marquee"] as const).filter(kind => kind.includes(search.toLowerCase())).map(kind => <button type="button" key={kind} onClick={() => { onInteractive(kind); setOpen(false); }} className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl bg-ed-field text-[11px] text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text"><span className="flex items-center gap-1" aria-hidden>{kind === "carousel" && "‹"}<span className="h-9 w-12 rounded-lg bg-gradient-to-br from-[#5402e6] via-[#ad75ff] to-[#ffb5d9]" />{kind === "carousel" ? "›" : "→"}</span>{kind === "carousel" ? "Carousel" : "Marquee"}</button>)}</div> : category === "Icons" ? <IconsPanel search={search} onInsert={props=>insert("Icon",props)}/> : category === "Shaders" ? <div className="grid grid-cols-2 gap-2">{SHADER_PRESETS.filter(item=>item.name.toLowerCase().includes(search.toLowerCase())).map(item=><button key={item.id} type="button" onClick={()=>{onShader(item.id);setOpen(false);}} className="text-left"><span className="mb-2 block aspect-square rounded-xl" style={{background:item.gradient}}/><span className="text-[11px] text-ed-muted">{item.name}</span></button>)}</div> : <div className="grid grid-cols-2 gap-2">{active.types.filter(type=>type.toLowerCase().includes(search.toLowerCase())).map(type=>{const Icon=TYPE_ICONS[type];return <button type="button" key={type} onClick={()=>insert(type)} className="flex h-24 flex-col items-center justify-center gap-3 rounded-lg bg-ed-field text-[11px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><Icon size={22} stroke={1.4}/>{type}</button>;})}</div>}
                </motion.div>
                </AnimatePresence>
                </div>
            </PopupSurface>
        </>}</AnimatePresence>
    </div>;
}
