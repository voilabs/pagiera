import { IconSparkles, IconShieldCheck } from "@tabler/icons-react";
import { McpPanel, type McpAdapter } from "./mcp-panel";

export function AiSettings({ mcp, available, enterToSend, onEnterToSend }: {
    mcp?: McpAdapter; available: boolean; enterToSend: boolean; onEnterToSend: (value: boolean) => void;
}) {
    return <div className="space-y-8">
        <section>
            <div className="flex items-center gap-3"><span className="rounded-xl bg-ed-accent/10 p-2.5 text-ed-accent"><IconSparkles size={20} /></span><div><h2 className="text-sm font-semibold">Luma</h2><p className="mt-1 text-xs text-ed-muted">{available ? "AI adapter connected" : "No AI adapter configured"}</p></div></div>
            <p className="mt-4 text-xs leading-relaxed text-ed-muted">Model and API credentials are managed by your host. Secrets are never stored in the page document.</p>
        </section>
        <section className="border-t border-ed-border pt-6">
            <h2 className="text-sm font-semibold">Chat preferences</h2>
            <div className="mt-4 flex items-center justify-between gap-6"><div><p className="text-xs font-medium">Enter to send</p><p className="mt-1 text-xs text-ed-muted">{enterToSend ? "Shift + Enter adds a new line." : "Enter adds a new line. Ctrl / ⌘ + Enter sends."}</p></div>
                <button type="button" role="switch" aria-label="Enter to send" aria-checked={enterToSend} onClick={() => onEnterToSend(!enterToSend)} className={"flex h-6 w-10 shrink-0 items-center rounded-full p-1 transition-colors " + (enterToSend ? "bg-ed-accent" : "bg-ed-field")}><span className={"size-4 rounded-full bg-white transition-transform motion-reduce:transition-none " + (enterToSend ? "translate-x-4" : "")} /></button>
            </div>
            <p className="mt-3 text-[11px] text-ed-faint">Saved in this browser, across documents.</p>
        </section>
        <section className="flex gap-3 rounded-xl bg-ed-field/50 p-4"><IconShieldCheck size={18} className="shrink-0 text-ed-accent" /><div><h2 className="text-xs font-medium">Review before applying</h2><p className="mt-1 text-xs leading-relaxed text-ed-muted">Generated changes require approval. Targeted requests stay within their layer or breakpoint scope.</p></div></section>
        <McpPanel adapter={mcp} />
    </div>;
}
