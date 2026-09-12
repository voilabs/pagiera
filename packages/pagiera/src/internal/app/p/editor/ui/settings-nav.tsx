import { IconAdjustments, IconPalette, IconTransfer, IconTemplate } from "@tabler/icons-react";
import type { ReactNode } from "react";

export type SettingsSection = "general" | "variables" | "transfer" | "ai";
const sections = [
    { id: "ai", label: "AI & connections", description: "Chat preferences and MCP servers", icon: IconAdjustments },
    { id: "general", label: "General", description: "Canvas, typography, transitions and code", icon: IconAdjustments },
    { id: "variables", label: "Design variables", description: "Reusable colours and numeric values", icon: IconPalette },
    { id: "transfer", label: "Import & export", description: "Download or restore a site bundle", icon: IconTransfer },
] as const;

const row = "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs transition-colors ";
export function SettingsNavigation({ active, onChange }: { active: SettingsSection; onChange: (section: SettingsSection) => void }) {
    return <nav aria-label="Settings sections" className="space-y-1 p-3">
        <p className="px-3 pb-3 pt-2 text-[10px] font-medium uppercase tracking-widest text-ed-faint">Workspace settings</p>
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onChange(id)} aria-current={active === id ? "page" : undefined} className={row + (active === id ? "bg-ed-field text-ed-text" : "text-ed-muted hover:bg-ed-field hover:text-ed-text")}><Icon size={16} className={active === id ? "text-ed-accent" : "text-ed-faint"} />{label}</button>)}
    </nav>;
}

export function SettingsWorkspace({ children, section = "general" }: { children: ReactNode; section?: SettingsSection }) {
    const current = sections.find(item => item.id === section)!;
    return <div className="custom-scrollbar absolute inset-0 z-50 overflow-y-auto bg-ed-canvas">
        <div className="mx-auto w-full max-w-[960px] px-6 py-12 lg:px-12">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[.18em] text-ed-faint">Settings / {current.label}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ed-text">{current.label}</h1>
            <p className="mb-8 mt-2 text-xs text-ed-muted">{current.description}.{section !== "ai" && " Changes are saved with this document."}</p>
            <div key={section} className="overflow-hidden rounded-2xl bg-ed-surface p-5">{children}</div>
        </div>
    </div>;
}

export function TemplatesNavigation({ categories, active, onChange }: { categories: string[]; active: string; onChange: (category: string) => void }) {
    return <nav aria-label="Template categories" className="space-y-1 p-3">
        <p className="px-3 pb-3 pt-2 text-[10px] font-medium uppercase tracking-widest text-ed-faint">Browse templates</p>
        {categories.map(category => <button key={category} type="button" onClick={() => onChange(category)} aria-current={active === category ? "page" : undefined} className={row + (active === category ? "bg-ed-field text-ed-text" : "text-ed-muted hover:bg-ed-field hover:text-ed-text")}><IconTemplate size={16} className={active === category ? "text-ed-accent" : "text-ed-faint"} />{category === "All" ? "All templates" : category}</button>)}
        <p className="px-3 pt-6 text-[11px] leading-relaxed text-ed-faint">Preview before installing. Installation replaces the site; export a backup first.</p>
    </nav>;
}
