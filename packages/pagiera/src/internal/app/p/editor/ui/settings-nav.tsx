import { IconAdjustments, IconLayoutGrid, IconPalette, IconPlugConnected, IconSeo, IconTransfer } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { WorkspaceNavItem, WorkspaceNavTitle, WorkspacePage } from "./workspace-page";

export type SettingsSection = "general" | "seo" | "variables" | "transfer" | "ai";
const sections = [
    { id: "general", label: "General", description: "Canvas, typography, page transitions and custom code.", icon: IconAdjustments },
    { id: "seo", label: "SEO", description: "Title, description and sharing image for this page; dynamic pages fill them from their data.", icon: IconSeo },
    { id: "variables", label: "Design variables", description: "Reusable colours and numbers every layer can point at.", icon: IconPalette },
    { id: "ai", label: "AI & connections", description: "Luma's chat preferences and the MCP servers it can reach.", icon: IconPlugConnected },
    { id: "transfer", label: "Import & export", description: "Download the whole site as a bundle, or restore one.", icon: IconTransfer },
] as const;

export function SettingsNavigation({ active, onChange }: { active: SettingsSection; onChange: (section: SettingsSection) => void }) {
    return <nav aria-label="Settings sections" className="space-y-0.5">
        <WorkspaceNavTitle>Settings</WorkspaceNavTitle>
        {sections.map(({ id, label, icon: Icon }) => <WorkspaceNavItem key={id} active={active === id} onClick={() => onChange(id)} icon={<Icon size={16} stroke={1.6} />} label={label} />)}
    </nav>;
}

/** The Settings page: its sections on the left, the open one beside them. */
export function SettingsWorkspace({ children, section = "general", onSection }: { children: ReactNode; section?: SettingsSection; onSection: (section: SettingsSection) => void }) {
    const current = sections.find(item => item.id === section) ?? sections[0];
    return <WorkspacePage
        nav={<SettingsNavigation active={section} onChange={onSection} />}
        title={current.label}
        description={<>{current.description}{section !== "ai" && " Saved with this site."}</>}
        className="max-w-[760px]"
    >
        <div key={section} className="rounded-2xl bg-ed-surface p-6 shadow-[0_0_0_1px_var(--ed-border)]">{children}</div>
    </WorkspacePage>;
}

export function TemplatesNavigation({ categories, active, onChange }: { categories: string[]; active: string; onChange: (category: string) => void }) {
    return <nav aria-label="Template categories" className="space-y-0.5">
        <WorkspaceNavTitle>Templates</WorkspaceNavTitle>
        {categories.map(category => <WorkspaceNavItem key={category} active={active === category} onClick={() => onChange(category)} icon={<IconLayoutGrid size={16} stroke={1.6} />} label={category === "All" ? "All templates" : category} />)}
        <p className="px-2.5 pt-5 text-[12px] leading-relaxed text-ed-faint">Preview before installing. Installing replaces the whole site, so export a backup first.</p>
    </nav>;
}
