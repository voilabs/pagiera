import { useEffect, useState } from "react";
export type McpAdapter = (request: { action: "list" | "inspect"; id?: string }) => Promise<{ servers?: Array<{ id: string; name: string; transport: string }>; tools?: Array<{ name: string; description?: string }> }>;
export function McpPanel({ adapter, onClose }: { adapter?: McpAdapter; onClose?: () => void }) {
    const [servers, setServers] = useState<Array<{ id: string; name: string; transport: string }>>([]);
    const [tools, setTools] = useState<Array<{ name: string; description?: string }>>([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        let live = true;
        if (!adapter) { setError("This host has no MCP adapter."); return; }
        setBusy(true);
        adapter({ action: "list" }).then(result => { if (live) setServers(result.servers ?? []); }).catch(error => { if (live) setError(error.message); }).finally(() => { if (live) setBusy(false); });
        return () => { live = false; };
    }, [adapter]);
    return <section aria-label="MCP connections" className="border-t border-ed-border pt-6 text-xs">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">MCP servers</h2>{onClose && <button type="button" onClick={onClose}>Close</button>}</div>
        <p className="mb-5 mt-2 leading-relaxed text-ed-muted">Connect external tools through HTTP, SSE or stdio. Commands and credentials stay in the host configuration.</p>
        {error && <p role="alert" className="my-2 text-red-400">{error}</p>}
        {!busy && !servers.length && <div className="rounded-xl bg-ed-field/50 p-5"><p className="font-medium text-ed-text">No available servers</p><p className="mt-2 leading-relaxed text-ed-muted">Your host administrator can add servers using <code>mcpServers</code> and grant access through <code>authorizeMcp</code>. Configured servers will appear here.</p></div>}
        {servers.map(server => <button key={server.id} type="button" disabled={busy} className="my-1 block w-full rounded-lg bg-ed-subtle p-2 text-left disabled:opacity-40" onClick={async () => {
            setBusy(true); setError(""); setTools([]);
            try { const result = await adapter!({ action: "inspect", id: server.id }); setTools(result.tools ?? []); }
            catch (error) { setError(error instanceof Error ? error.message : "Connection failed"); }
            finally { setBusy(false); }
        }}>{server.name} · {server.transport} · Test connection</button>)}
        {busy && <p role="status">Connecting…</p>}
        {tools.map(tool => <div key={tool.name} className="mt-2"><b>{tool.name}</b><p className="text-ed-muted">{tool.description}</p></div>)}
        <p className="mt-3 text-[10px] text-ed-faint">Discovery only. Connecting does not grant AI permission to execute tools.</p>
    </section>;
}
