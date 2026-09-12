# AI workspace

## Implemented

- Type `@` in a Luma conversation to choose a layer/component or breakpoint.
- Breakpoint requests produce layout-only updates to existing layers; content and structure stay shared.
- Plans wait for Apply / Discard. Applying a stale plan is refused if the document has changed.
- `/mcp` opens approved-server discovery. HTTP, legacy SSE and stdio are supported.
- No MCP tool is automatically executed.

## Host configuration

Add `mcpServers` and `authorizeMcp(request)` to the same Pagiera server configuration used by every route/bootstrap entrypoint.
The authorization callback must verify the application's signed-in administrator, not simply return true in production.
The editor's client adapter supplies `mcp` automatically.

```ts
{
  mcpServers: [
    { id: "remote", name: "Design library", transport: "http", url: "https://your-server.example/mcp",
      headers: { Authorization: `Bearer ${process.env.DESIGN_MCP_TOKEN}` } },
    { id: "local", name: "Local tools", transport: "stdio", command: "/absolute/path/to/node",
      args: ["/absolute/path/to/server.mjs"], env: { TOOL_TOKEN: process.env.TOOL_TOKEN! } }
  ],
  authorizeMcp: async request => Boolean(await verifyAdministratorSession(request))
}
```

Local means the machine hosting Pagiera, not a remote visitor's computer. Never accept arbitrary executable paths, environment variables, or credentials from a model. Only configure trusted endpoints/processes. stdio does not provide an OS sandbox. Serverless hosts may prohibit persistent child processes.

Connections are short-lived, rate-limited, and bounded by a 15-second timeout. The browser only receives server names, transport types, and tool descriptions. Connection errors do not disclose credentials.

## Not yet implemented

Multi-page site orchestration/transactional site backup, automatic MCP tool use with approval, browser OAuth enrollment, visual diff preview, and adding arbitrary server definitions through the editor. The current workflow edits the open document and discovers operator-configured tools; it is not a fully autonomous whole-site agent.
