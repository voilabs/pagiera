import { IconX, IconFile, IconSettings, IconPalette, IconTemplate, IconComponents, IconDatabase, IconHistory, IconTransfer, IconLayoutSidebar } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

export type WorkspaceTab = {
    key: string;
    pageId: string;
    panel: string;
    label: string;
    section?: "general" | "variables" | "transfer" | "ai";
    componentId?: string;
};

export function useWorkspaceTabs(storageKey: string, active: WorkspaceTab, ready: boolean) {
    const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
    const [restoredKey, setRestoredKey] = useState("");
    useEffect(() => {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
            const valid = Array.isArray(saved) ? saved.filter((tab): tab is WorkspaceTab =>
                tab && typeof tab.key === "string" && typeof tab.pageId === "string" &&
                typeof tab.panel === "string" && typeof tab.label === "string" &&
                (tab.componentId === undefined || typeof tab.componentId === "string") &&
                (tab.section === undefined || ["general", "variables", "transfer", "ai"].includes(tab.section))) : [];
            setTabs(valid.filter((tab, i) => valid.findIndex(other => other.key === tab.key) === i));
        } catch { setTabs([]); }
        setRestoredKey(storageKey);
    }, [storageKey]);
    useEffect(() => {
        if (!ready || restoredKey !== storageKey) return;
        setTabs(current => {
            const previous = current.find(tab => tab.key === active.key);
            if (previous && JSON.stringify(previous) === JSON.stringify(active)) return current;
            return previous ? current.map(tab => tab.key === active.key ? active : tab) : [...current, active];
        });
    }, [ready, restoredKey, storageKey, active.key, active.label, active.pageId, active.panel, active.section, active.componentId]);
    useEffect(() => {
        if (restoredKey !== storageKey) return;
        try { localStorage.setItem(storageKey, JSON.stringify(tabs)); } catch { /* Optional persistence. */ }
    }, [tabs, restoredKey, storageKey]);
    return { tabs, close: (key: string) => setTabs(current => current.filter(tab => tab.key !== key)) };
}

function tabPresentation(tab: WorkspaceTab) {
    if (tab.componentId) return { label: tab.label, Icon: IconComponents };
    if (tab.panel === "Layers") return { label: tab.label, Icon: IconFile };
    if (tab.panel === "Settings") {
        if (tab.section === "ai") return { label: "AI settings", Icon: IconSettings };
        if (tab.section === "variables") return { label: "Variables", Icon: IconPalette };
        if (tab.section === "transfer") return { label: "Import & export", Icon: IconTransfer };
        return { label: "Settings", Icon: IconSettings };
    }
    const Icon = tab.panel === "Templates" ? IconTemplate : tab.panel === "Data" ? IconDatabase : tab.panel === "History" ? IconHistory : IconLayoutSidebar;
    return { label: tab.panel, Icon };
}

export function WorkspaceTabs({ tabs, activeKey, onOpen, onClose }: {
    tabs: WorkspaceTab[]; activeKey: string; onOpen: (tab: WorkspaceTab) => void; onClose: (tab: WorkspaceTab) => void;
}) {
    const activeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [activeKey]);
    return <nav aria-label="Open workspace tabs" className="scrollbar-none flex h-11 min-w-0 items-end gap-1 overflow-x-auto">
        {tabs.map(tab => {
            const active = tab.key === activeKey;
            const { label, Icon } = tabPresentation(tab);
            return <div key={tab.key} className={"group relative flex h-10 min-w-[112px] max-w-[220px] shrink-0 items-center rounded-t-[14px] rounded-b-none pr-2 transition-colors duration-150 motion-reduce:transition-none " + (active ? "bg-ed-canvas text-ed-text" : "text-ed-muted hover:bg-ed-field/60 hover:text-ed-text")}>
                {active && <span aria-hidden className="absolute left-5 right-5 top-0 h-px bg-gradient-to-r from-transparent via-ed-accent/70 to-transparent" />}
                <button ref={active ? activeRef : undefined} type="button" aria-current={active ? "page" : undefined} onClick={() => onOpen(tab)} title={tab.label} className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3.5 pr-2 text-left text-[11px] font-medium outline-none focus-visible:rounded-t-xl focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ed-accent">
                    <Icon aria-hidden size={14} stroke={1.7} className={"shrink-0 " + (active ? "text-ed-accent" : "text-ed-faint")} />
                    <span className="truncate">{label}</span>
                </button>
                <button type="button" aria-label={"Close tab " + label} disabled={tabs.length === 1} onClick={() => onClose(tab)} className={"flex size-5 shrink-0 items-center justify-center rounded-md text-ed-faint transition-opacity hover:bg-ed-field hover:text-ed-text focus-visible:opacity-100 focus-visible:outline focus-visible:outline-ed-accent group-hover:opacity-100 disabled:invisible motion-reduce:transition-none " + (active ? "opacity-100" : "opacity-0")}><IconX size={11} /></button>
            </div>;
        })}
    </nav>;
}
