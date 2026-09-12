import assert from "node:assert/strict";
import { resolve } from "node:path";
import { inspectMcpServer } from "../src/mcp-server";
const result = await inspectMcpServer({ id: "fixture", name: "Fixture", transport: "stdio", command: process.execPath, args: [resolve(import.meta.dir, "mcp-test-server.mjs")] });
assert.equal(result.tools[0]?.name, "sample");
console.log("MCP stdio handshake, discovery and cleanup passed");
const reply = (request: any) => ({ jsonrpc: "2.0", id: request.id, result: request.method === "initialize"
    ? { protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "http-fixture", version: "1" } }
    : { tools: [{ name: "remote_sample", inputSchema: { type: "object", properties: {} } }] } });
const http = Bun.serve({ port: 0, hostname: "127.0.0.1", async fetch(request) {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const body = await request.json();
    return body.id === undefined ? new Response(null, { status: 202 }) : Response.json(reply(body));
} });
try {
    const result = await inspectMcpServer({ id: "http", name: "HTTP fixture", transport: "http", url: http.url.href });
    assert.equal(result.tools[0]?.name, "remote_sample");
} finally { http.stop(true); }
let channel: ReadableStreamDefaultController<Uint8Array>;
const encoder = new TextEncoder();
const sse = Bun.serve({ port: 0, hostname: "127.0.0.1", async fetch(request) {
    if (request.method === "GET") return new Response(new ReadableStream<Uint8Array>({ start(controller) {
        channel = controller;
        controller.enqueue(encoder.encode("event: endpoint\ndata: /messages\n\n"));
    } }), { headers: { "Content-Type": "text/event-stream" } });
    const body = await request.json();
    if (body.id !== undefined) channel.enqueue(encoder.encode("event: message\ndata: " + JSON.stringify(reply(body)) + "\n\n"));
    return new Response(null, { status: 202 });
} });
try {
    const result = await inspectMcpServer({ id: "sse", name: "SSE fixture", transport: "sse", url: sse.url.href });
    assert.equal(result.tools[0]?.name, "remote_sample");
} finally { sse.stop(true); }
console.log("MCP HTTP and legacy SSE handshake/discovery passed");
