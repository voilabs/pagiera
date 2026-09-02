"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconPlayerPlay,
    IconPlus,
    IconTrash,
    IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import {
    type DataSource,
    HTTP_METHODS,
    type HttpMethod,
    type RequestPair,
    sendsBody,
} from "@/lib/editor/types";
import type { SourceSample } from "./data-panel";

export type SourcePreview =
    | { status: "ok"; rows: Array<Record<string, unknown>>; keys: string[]; total: number }
    | { status: "error"; message: string };
export type SourcePreviewer = (source: DataSource, sampleQuery: string) => Promise<SourcePreview>;

type Tab = "params" | "body" | "headers" | "response";

/**
 * A test that did not come back with rows.
 *
 * Kept as a record rather than a message because the message alone rarely
 * explains anything: "Requests to localhost are not allowed" makes sense next
 * to the URL it was refused for, the method it was sent with, and the query it
 * was tested against.
 */
type Failure = {
    message: string;
    status?: number;
    method: string;
    url: string;
    query: string;
    params: number;
    headers: string[];
};

/**
 * The full request builder. A source has enough moving parts — URL, query,
 * headers, the path into the payload, and the response itself — that editing
 * it in a 240px rail meant guessing; here everything is visible at once.
 */
export function DataSourceModal({
    source,
    sample,
    onChange,
    onSample,
    onClose,
    preview,
}: {
    source: DataSource;
    sample?: SourceSample;
    onChange: (changes: Partial<DataSource>) => void;
    onSample: (sample: SourceSample) => void;
    onClose: () => void;
    preview: SourcePreviewer;
}) {
    const [tab, setTab] = useState<Tab>("params");
    const method = source.method ?? "GET";
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<Array<Record<string, unknown>>>(
        sample?.rows ?? [],
    );
    const [keys, setKeys] = useState<string[]>(sample?.keys ?? []);
    const [testQuery, setTestQuery] = useState("");
    const [failure, setFailure] = useState<Failure | null>(null);
    const [busy, startTest] = useTransition();

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const bodyError = (() => {
        if (!sendsBody(method)) return null;
        const raw = source.body?.trim();
        if (!raw) return null;
        // Tokens are not valid JSON on their own, so check the resolved shape
        // with placeholders swapped for a string.
        try {
            JSON.parse(raw.replace(/{{[^}]*}}/g, "x"));
            return null;
        } catch {
            return "This is not valid JSON yet.";
        }
    })();

    const describe = (message: string, status?: number): Failure => ({
        message,
        status,
        method,
        url: source.url,
        query: testQuery,
        params: (source.params ?? []).filter((pair) => pair.key.trim()).length,
        // Names only. A header's value is where an API key would be, and a
        // failure panel is not the place to put one on screen.
        headers: (source.headers ?? []).map((pair) => pair.key.trim()).filter(Boolean),
    });

    const run = () => {
        startTest(async () => {
            try {
                const result = await preview(source, testQuery);
                if (result.status === "error") {
                    setError(result.message);
                    setFailure(describe(result.message));
                    setTab("response");
                    return;
                }
                setError(null);
                setFailure(null);
                setRows(result.rows);
                setKeys(result.keys);
                setTab("response");
                onSample({ keys: result.keys, rows: result.rows });
            } catch (reason) {
                // A refused or failing request is an ordinary outcome of
                // testing one, not a crash. Left unhandled it became an
                // unhandled rejection, which the dev server presents as a
                // full-screen error page over the editor.
                const message = reason instanceof Error ? reason.message : String(reason);
                const status = typeof (reason as { status?: unknown })?.status === "number"
                    ? (reason as { status: number }).status
                    : undefined;
                setError(message);
                setFailure(describe(message, status));
                setTab("response");
            }
        });
    };

    return (
        <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            {/* A real button, so closing by click-away is reachable from the
                keyboard too rather than relying on Escape alone. */}
            <button
                type="button"
                aria-label="Close dialog"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`Data source: ${source.name}`}
                className="relative flex h-[min(760px,calc(100vh-32px))] w-full max-w-[920px] flex-col overflow-hidden rounded-3xl bg-ed-surface"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-ed-border px-5 py-4">
                    <input
                        type="text"
                        value={source.name}
                        aria-label="Source name"
                        onChange={(e) => onChange({ name: e.target.value })}
                        className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ed-text outline-none"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-ed-faint transition-colors hover:bg-ed-field hover:text-ed-text"
                    >
                        <IconX size={16} />
                    </button>
                </header>

                <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-ed-border px-5 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                    <select
                        aria-label="HTTP method"
                        value={method}
                        onChange={(e) => onChange({ method: e.target.value as HttpMethod })}
                        className="shrink-0 cursor-pointer rounded-md bg-ed-field px-2 py-1.5 font-mono text-[11px] font-semibold text-ed-text outline-none [&>option]:bg-ed-surface"
                    >
                        {HTTP_METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={source.url}
                        aria-label="Request URL"
                        placeholder="{{WINDOW_URL}}/api/posts"
                        onChange={(e) => onChange({ url: e.target.value })}
                        className="min-w-0 flex-1 rounded-md bg-ed-field px-3 py-1.5 font-mono text-[12px] text-ed-text outline-none transition-colors focus:bg-ed-field-hover placeholder:text-ed-faint"
                    />
                    <button
                        type="button"
                        onClick={run}
                        disabled={busy}
                        className="flex shrink-0 items-center gap-1.5 rounded-md bg-ed-accent px-3.5 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        <IconPlayerPlay size={13} />
                        {busy ? "Sending…" : "Send"}
                    </button>
                    <select
                        aria-label="Behavior when the API returns 404"
                        value={source.onNotFound ?? "empty"}
                        onChange={(event) => onChange({
                            onNotFound: event.target.value as DataSource["onNotFound"],
                        })}
                        title="Choose what the published page does when this API returns 404"
                        className="col-span-3 min-w-0 cursor-pointer rounded-md bg-ed-field px-2 py-1.5 text-[11px] font-medium text-ed-muted outline-none lg:col-span-1 [&>option]:bg-ed-surface"
                    >
                        <option value="empty">404: Keep page</option>
                        <option value="page-404">404: Page not found</option>
                    </select>
                </div>

                <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-ed-border px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {(
                        [
                            ["params", `Query${source.params?.length ? ` (${source.params.length})` : ""}`],
                            ...(sendsBody(method)
                                ? ([["body", source.body?.trim() ? "Body •" : "Body"]] as Array<[Tab, string]>)
                                : []),
                            ["headers", `Headers${source.headers?.length ? ` (${source.headers.length})` : ""}`],
                            ["response", `Response${rows.length ? ` (${rows.length})` : ""}`],
                        ] as Array<[Tab, string]>
                    ).map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            onClick={() => setTab(value)}
                            className={`relative px-3 py-2.5 text-[12px] transition-colors ${
                                tab === value
                                    ? "text-ed-text"
                                    : "text-ed-muted hover:text-ed-text"
                            }`}
                        >
                            {label}
                            {tab === value && (
                                <motion.span
                                    layoutId="data-tab"
                                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ed-accent"
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
                    {/* No `mode="wait"`: the incoming tab mounts immediately, so
                        the panel never depends on an exit animation finishing
                        to show the right content. */}
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.14 }}
                    >
                            {tab === "params" && (
                                <PairTable
                                    pairs={source.params ?? []}
                                    valueHint="value, {{query.id}} or {{params.slug}}"
                                    onChange={(params) => onChange({ params })}
                                    note="Empty values are dropped, so an unset filter is simply not sent."
                                />
                            )}
                            {tab === "body" && (
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={source.body ?? ""}
                                        aria-label="Request body"
                                        spellCheck={false}
                                        placeholder={`{\n  "title": "{{query.title}}"\n}`}
                                        onChange={(e) => onChange({ body: e.target.value })}
                                        className="min-h-[280px] resize-y rounded-lg bg-ed-field p-3 font-mono text-[12px] leading-relaxed text-ed-text outline-none transition-colors focus:bg-ed-surface focus:ring-1 focus:ring-inset focus:ring-[var(--ed-accent)]/60 placeholder:text-ed-faint"
                                    />
                                    <p className="text-[11px] leading-relaxed text-ed-faint">
                                        Sent as{" "}
                                        <code className="rounded bg-ed-field px-1 font-mono">
                                            application/json
                                        </code>
                                        . Tokens work here too. A body is never cached, so
                                        the request runs on every render.
                                    </p>
                                    {bodyError && (
                                        <p className="flex items-center gap-1.5 text-[11px] text-amber-500">
                                            <IconAlertTriangle size={13} />
                                            {bodyError}
                                        </p>
                                    )}
                                </div>
                            )}
                            {tab === "headers" && (
                                <PairTable
                                    pairs={source.headers ?? []}
                                    valueHint="e.g. Bearer …"
                                    onChange={(headers) => onChange({ headers })}
                                    note="Headers are sent from the server, so a key never reaches the browser — but it is stored with the page, so treat it as shared with anyone who can edit this site."
                                />
                            )}
                            {tab === "response" && (
                                <ResponseView
                                    rows={rows}
                                    keys={keys}
                                    path={source.path}
                                    onPath={(path) => onChange({ path })}
                                    failure={failure}
                                />
                            )}
                    </motion.div>
                </div>

                <footer className="flex shrink-0 items-center gap-3 border-t border-ed-border px-5 py-3">
                    <label
                        htmlFor="data-test-query"
                        className="shrink-0 text-[11px] text-ed-faint"
                    >
                        Test with
                    </label>
                    <input
                        id="data-test-query"
                        type="text"
                        value={testQuery}
                        placeholder="uid=1&limit=5"
                        onChange={(e) => setTestQuery(e.target.value)}
                        className="min-w-0 flex-1 rounded-md bg-ed-field px-3 py-1.5 font-mono text-[11px] text-ed-text outline-none placeholder:text-ed-faint"
                    />
                    <AnimatePresence>
                        {error ? (
                            <motion.span
                                key="err"
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-[11px] text-red-400"
                            >
                                <IconAlertTriangle size={13} />
                                {error}
                            </motion.span>
                        ) : rows.length > 0 ? (
                            <motion.span
                                key="ok"
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-[11px] text-emerald-500"
                            >
                                <IconCheck size={13} />
                                {rows.length} rows
                            </motion.span>
                        ) : null}
                    </AnimatePresence>
                </footer>
            </motion.div>
        </motion.div>
    );
}

function PairTable({
    pairs,
    valueHint,
    note,
    onChange,
}: {
    pairs: RequestPair[];
    valueHint: string;
    note: string;
    onChange: (next: RequestPair[]) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            {pairs.map((pair, index) => (
                // Rows are appended and deleted, never reordered, so position is
                // a stable identity here.
                // biome-ignore lint/suspicious/noArrayIndexKey: positional identity is stable for this list
                <div key={index} className="grid grid-cols-[minmax(100px,.7fr)_minmax(0,1fr)_auto] items-center gap-2">
                    <input
                        type="text"
                        value={pair.key}
                        aria-label="Name"
                        placeholder="name"
                        onChange={(e) =>
                            onChange(
                                pairs.map((p, i) =>
                                    i === index ? { ...p, key: e.target.value } : p,
                                ),
                            )
                        }
                        className="min-w-0 rounded-md bg-ed-field px-3 py-2 font-mono text-[12px] text-ed-text outline-none transition-colors focus:bg-ed-field-hover placeholder:text-ed-faint"
                    />
                    <input
                        type="text"
                        value={pair.value}
                        aria-label="Value"
                        placeholder={valueHint}
                        onChange={(e) =>
                            onChange(
                                pairs.map((p, i) =>
                                    i === index ? { ...p, value: e.target.value } : p,
                                ),
                            )
                        }
                        className="min-w-0 flex-1 rounded-md bg-ed-field px-3 py-2 font-mono text-[12px] text-ed-text outline-none transition-colors focus:bg-ed-field-hover placeholder:text-ed-faint"
                    />
                    <button
                        type="button"
                        aria-label="Remove row"
                        onClick={() => onChange(pairs.filter((_, i) => i !== index))}
                        className="shrink-0 rounded-md p-2 text-ed-faint transition-colors hover:bg-ed-field hover:text-red-400"
                    >
                        <IconTrash size={13} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={() => onChange([...pairs, { key: "", value: "" }])}
                className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-ed-border py-2.5 text-[12px] text-ed-muted transition-colors hover:border-ed-accent hover:text-ed-text"
            >
                <IconPlus size={14} />
                Add row
            </button>

            <p className="pt-1 text-[11px] leading-relaxed text-ed-faint">
                {note} Use{" "}
                <code className="rounded bg-ed-field px-1 font-mono">
                    {"{{query.name}}"}
                </code>{" "}
                to read the visitor&apos;s URL, or{" "}
                <code className="rounded bg-ed-field px-1 font-mono">
                    {"{{params.slug}}"}
                </code>{" "}
                for a dynamic path such as <span className="text-ed-muted">blog/:slug</span>, or{" "}
                <code className="rounded bg-ed-field px-1 font-mono">
                    {"{{page.slug}}"}
                </code>{" "}
                for the page.
            </p>
        </div>
    );
}


/** What was sent, and what came back, when a test did not produce rows. */
function FailureView({ failure }: { failure: Failure }) {
    const rows: Array<[string, string]> = [
        ["Method", failure.method],
        ["URL", failure.url || "(empty)"],
        ...(failure.query ? ([["Test query", failure.query]] as Array<[string, string]>) : []),
        ...(failure.params ? ([["Query parameters", String(failure.params)]] as Array<[string, string]>) : []),
        ...(failure.headers.length ? ([["Headers", failure.headers.join(", ")]] as Array<[string, string]>) : []),
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <IconAlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-semibold text-red-300">
                        Request failed{failure.status ? ` · ${failure.status}` : ""}
                    </p>
                    <p className="break-words text-[11px] leading-relaxed text-ed-muted">{failure.message}</p>
                </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-ed-border">
                {rows.map(([label, value], index) => (
                    <div
                        key={label}
                        className={`flex gap-3 px-3 py-2 ${index > 0 ? "border-t border-ed-border" : ""}`}
                    >
                        <span className="w-28 shrink-0 text-[10px] text-ed-faint">{label}</span>
                        <span className="min-w-0 flex-1 break-all font-mono text-[10px] text-ed-text">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ResponseView({
    rows,
    keys,
    path,
    onPath,
    failure,
}: {
    rows: Array<Record<string, unknown>>;
    keys: string[];
    path: string;
    onPath: (path: string) => void;
    failure?: Failure | null;
}) {
    if (failure) return <FailureView failure={failure} />;
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-[13px] text-ed-muted">No response yet</p>
                <p className="max-w-[380px] text-[11px] leading-relaxed text-ed-faint">
                    Press <b>Send</b> to call the endpoint. If the list is nested inside
                    the payload, set the path below — for example{" "}
                    <code className="rounded bg-ed-field px-1 font-mono">data.items</code>.
                </p>
                <input
                    type="text"
                    value={path}
                    aria-label="Path to the list"
                    placeholder="path to the list"
                    onChange={(e) => onPath(e.target.value)}
                    className="mt-2 w-[240px] rounded-md bg-ed-field px-3 py-2 text-center font-mono text-[12px] text-ed-text outline-none placeholder:text-ed-faint"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <label
                    htmlFor="data-path"
                    className="shrink-0 text-[11px] text-ed-faint"
                >
                    List path
                </label>
                <input
                    id="data-path"
                    type="text"
                    value={path}
                    placeholder="(payload is already a list)"
                    onChange={(e) => onPath(e.target.value)}
                    className="min-w-0 flex-1 rounded-md bg-ed-field px-3 py-1.5 font-mono text-[12px] text-ed-text outline-none placeholder:text-ed-faint"
                />
            </div>

            <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ed-faint">
                    Fields you can bind
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {keys.map((key) => (
                        <span
                            key={key}
                            className="rounded-md bg-ed-field px-2 py-1 font-mono text-[11px] text-ed-muted"
                        >
                            {key}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ed-faint">
                    First rows
                </p>
                <div className="overflow-x-auto rounded-lg border border-ed-border">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-ed-border bg-ed-subtle">
                                {keys.map((key) => (
                                    <th
                                        key={key}
                                        className="whitespace-nowrap px-3 py-2 font-mono text-[10px] font-semibold uppercase text-ed-faint"
                                    >
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.slice(0, 6).map((row, index) => (
                                // Rows come from an API and have no guaranteed id.
                                // biome-ignore lint/suspicious/noArrayIndexKey: a response row has no stable key
                                <tr key={index} className="border-b border-ed-border last:border-0">
                                    {keys.map((key) => (
                                        <td
                                            key={key}
                                            className="max-w-[220px] truncate px-3 py-2 text-[11px] text-ed-muted"
                                        >
                                            {formatCell(row[key])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function formatCell(value: unknown) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return Array.isArray(value) ? "[…]" : "{…}";
    return String(value);
}
