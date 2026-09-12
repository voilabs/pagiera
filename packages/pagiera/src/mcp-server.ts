import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/** Operator-owned configuration. Never accept commands or credentials from AI output. */
export type PagieraMcpServer = {
    id: string;
    name: string;
} & ({
    transport: "stdio"; command: string; args?: string[]; cwd?: string; env?: Record<string, string>;
} | {
    transport: "http" | "sse"; url: string; headers?: Record<string, string>;
});

export async function inspectMcpServer(server: PagieraMcpServer) {
    const client = new Client({ name: "pagiera", version: "0.2.0" });
    const transport = server.transport === "stdio"
        ? new StdioClientTransport({ command: server.command, args: server.args, cwd: server.cwd, env: server.env, stderr: "ignore" })
        : (() => {
            const url = new URL(server.url);
            if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid MCP endpoint");
            // Endpoint is operator-configured; redirects must not forward credentials to another host.
            const guardedFetch: typeof fetch = (input, init) => fetch(input, { ...init, redirect: "error" });
            const options = { requestInit: { headers: server.headers }, fetch: guardedFetch };
            return server.transport === "sse" ? new SSEClientTransport(url, options) : new StreamableHTTPClientTransport(url, options);
        })();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            (async () => {
                await client.connect(transport);
                const tools = [];
                let cursor: string | undefined;
                do {
                    const result = await client.listTools(cursor ? { cursor } : undefined);
                    tools.push(...result.tools.map(tool => ({ name: tool.name, description: tool.description?.slice(0, 500) })));
                    cursor = result.nextCursor;
                } while (cursor && tools.length < 200);
                return { tools: tools.slice(0, 200) };
            })(),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("MCP connection timed out")), 15000); }),
        ]);
    } finally {
        clearTimeout(timer);
        await client.close().catch(() => {});
        await transport.close().catch(() => {});
    }
}
