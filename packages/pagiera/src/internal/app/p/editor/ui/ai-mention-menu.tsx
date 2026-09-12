import { IconAt, IconComponents, IconDeviceDesktop, IconLayersIntersect, IconSearch, IconX } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

type Target = { id: string; name: string; detail: string; component?: boolean };

export function AiMentionMenu({ breakpoints, layers, disabled, onBreakpoint, onLayer, onClose }: {
    breakpoints: Target[]; layers: Target[]; disabled: boolean;
    onBreakpoint: (id: string) => void; onLayer: (id: string) => void; onClose: () => void;
}) {
    const reducedMotion = useReducedMotion();
    const group = (title: string, targets: Target[], breakpoint: boolean) => targets.length > 0 && <section>
        <h3 className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-ed-faint">{title}</h3>
        {targets.map(target => {
            const Icon = breakpoint ? IconDeviceDesktop : target.component ? IconComponents : IconLayersIntersect;
            return <button key={target.id} type="button" disabled={disabled} onClick={() => (breakpoint ? onBreakpoint : onLayer)(target.id)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left outline-none transition-colors hover:bg-ed-menu-hover focus-visible:bg-ed-menu-hover focus-visible:ring-1 focus-visible:ring-ed-accent disabled:opacity-40">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${breakpoint ? "bg-ed-field text-ed-muted" : "bg-ed-accent/10 text-ed-accent"}`}><Icon size={16} stroke={1.6} /></span>
                <span className="min-w-0 flex-1"><span title={target.name} className="block truncate text-xs font-medium text-ed-text">{target.name}</span><span className="block truncate text-[10px] text-ed-faint">{target.detail}</span></span>
                <IconAt size={13} className="shrink-0 text-ed-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>;
        })}
    </section>;
    return <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.15 }}
        aria-label="Mention targets" className="mb-2 overflow-hidden rounded-2xl bg-ed-menu shadow-[0_8px_28px_rgb(0_0_0/0.22)] ring-1 ring-white/[0.07]">
        <div className="flex items-center gap-2 px-3 py-2.5">
            <IconAt size={14} className="text-ed-accent" /><span className="flex-1 text-xs font-medium text-ed-text">Choose a target</span>
            <button type="button" aria-label="Close mention targets" onClick={onClose} className="rounded-md p-1 text-ed-faint hover:bg-ed-menu-hover hover:text-ed-text"><IconX size={13} /></button>
        </div>
        <div className="custom-scrollbar max-h-64 overflow-y-auto overscroll-contain border-t border-white/[0.05] p-1">
            {group("Breakpoints", breakpoints, true)}
            {group("Layers & components", layers, false)}
            {!breakpoints.length && !layers.length && <div className="px-3 py-6 text-center"><IconSearch size={20} className="mx-auto mb-2 text-ed-faint" /><p className="text-xs text-ed-muted">No matching targets</p><p className="mt-1 text-[10px] text-ed-faint">Try a layer or breakpoint name.</p></div>}
        </div>
        <p className="border-t border-white/[0.05] px-3 py-2 text-[10px] text-ed-faint">Type after @ to filter targets</p>
    </motion.div>;
}
