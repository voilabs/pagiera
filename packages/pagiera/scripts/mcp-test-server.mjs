import { createInterface } from "node:readline";
const lines = createInterface({ input: process.stdin });
lines.on("line", line => {
    const request = JSON.parse(line);
    if (request.id === undefined) return;
    const result = request.method === "initialize"
        ? { protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "pagiera-test", version: "1" } }
        : request.method === "tools/list"
          ? { tools: [{ name: "sample", description: "Harmless test tool", inputSchema: { type: "object", properties: {} } }] }
          : {};
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\n");
});
