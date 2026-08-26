"use client";

import { IconArrowUp, IconCheck, IconLoader2, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import { PagieraMark } from "./brand";
import type { Breakpoint, CanvasElement, RootStyle } from "@/lib/editor/types";


/**
 * One entry in the conversation.
 *
 * A run is not a single reply that fills itself in — each pass the server
 * finishes arrives as its own message, in order, the way a person reporting
 * progress would send them. `runId` ties a run's messages together so the
 * whole thing can still be restored or cleared as a unit.
 */
type Message = {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: number;
    status?: "running" | "complete" | "error";
    /** `phase` is a progress report; `result` is the finished answer. */
    kind?: "phase" | "result";
    runId?: string;
    detail?: string;
    /** What the pass actually decided, straight from the server. */
    facts?: string[];
    resultSteps?: string[];
};

/** The one element a run is allowed to touch, when the author picked one. */
export type AiFocus = { id: string; name: string; type: string };

export type AiDesignRequest = {
    prompt: string;
    breakpoint: Breakpoint;
    focus?: AiFocus;
    history: Array<{ role: "user" | "assistant"; text: string; steps?: string[] }>;
    document: { rootStyle: RootStyle; elements: unknown[] };
};

/** Emitted by the server as each pass starts and finishes. */
export type AiRunEvent =
    | { type: "phase"; id: string; status: "start" | "done" | "skipped"; facts?: string[] }
    | { type: "plan"; plan: AiDesignPlan }
    | { type: "error"; error: string };

export type AiDesignGenerator = (
    request: AiDesignRequest,
    onEvent?: (event: AiRunEvent) => void,
) => Promise<AiDesignPlan>;

/**
 * The passes the server actually performs, in order. Each one is a real model
 * call that reports when it starts and what it decided; the panel never
 * advances a step on a timer, so a stalled request looks stalled.
 */
const RUN_STEPS = [
    { id: "blueprint", label: "Planning art direction", detail: "Palette, type scale and section composition" },
    { id: "draft", label: "Building editor operations", detail: "Sections, responsive rules and interactions" },
    { id: "polish", label: "Reviewing the result", detail: "Auditing layout, motion and consistency" },
    { id: "imagery", label: "Generating imagery", detail: "Photographs for the layout" },
    { id: "apply", label: "Applying to the canvas", detail: "Writing the validated plan" },
] as const;

const uid = () => globalThis.crypto?.randomUUID?.() ?? `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => Date.now();

/**
 * Reads back a stored conversation.
 *
 * Older chats stored a single reply carrying a `steps` array; those become one
 * plain message, since replaying a finished run as separate progress lines
 * would invent a sequence that never happened. A run cut off mid-flight is
 * marked failed rather than left spinning forever.
 */
function restoreMessages(raw: string | null): Message[] {
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((message, index) => {
        const role = message.role as Message["role"];
        if ((role !== "user" && role !== "assistant") || typeof message.text !== "string") return [];
        const interrupted = message.status === "running";

        // A live progress line has nothing to say once the run is over.
        if (message.kind === "phase" && interrupted) return [];

        const rawSteps: unknown[] = Array.isArray(message.steps) ? message.steps : [];
        const legacyResultSteps = rawSteps.filter((step): step is string => typeof step === "string");
        const resultSteps = Array.isArray(message.resultSteps)
            ? message.resultSteps.filter((step): step is string => typeof step === "string")
            : legacyResultSteps;

        return [{
            id: typeof message.id === "string" ? message.id : `legacy-${index}`,
            role,
            text: interrupted ? "This run was interrupted before it finished. Send the request again to continue." : message.text,
            createdAt: typeof message.createdAt === "number" ? message.createdAt : now(),
            status: interrupted ? "error" as const : (message.status as Message["status"]),
            kind: message.kind === "phase" ? "phase" as const : "result" as const,
            runId: typeof message.runId === "string" ? message.runId : undefined,
            detail: typeof message.detail === "string" ? message.detail : undefined,
            facts: Array.isArray(message.facts) ? message.facts.filter((fact): fact is string => typeof fact === "string") : undefined,
            resultSteps: resultSteps.length ? resultSteps : undefined,
        }];
    }).slice(-60);
}

export function AiPanel({ pageId, elements, rootStyle, breakpoint, focus, onClearFocus, onApply, generate }: { pageId: string; elements: CanvasElement[]; rootStyle: RootStyle; breakpoint: Breakpoint; focus?: AiFocus; onClearFocus?: () => void; onApply: (plan: AiDesignPlan) => void; generate?: AiDesignGenerator }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [restoredPage, setRestoredPage] = useState<string | null>(null);

    useEffect(() => {
        try { setMessages(restoreMessages(localStorage.getItem(`pagiera:ai-chat:${pageId}`))); }
        catch { setMessages([]); }
        setBusy(false);
        setRestoredPage(pageId);
    }, [pageId]);

    useEffect(() => {
        if (restoredPage !== pageId) return;
        try { localStorage.setItem(`pagiera:ai-chat:${pageId}`, JSON.stringify(messages.slice(-60))); }
        catch { /* Storage is optional. */ }
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, pageId, restoredPage]);

    const submit = async () => {
        const prompt = input.trim();
        if (!prompt || busy) return;
        const runId = uid();
        setMessages((current) => [...current, { id: uid(), role: "user", text: prompt, createdAt: now(), detail: focus ? `↳ ${focus.name}` : undefined }]);
        setInput("");
        setBusy(true);
        setError(null);

        const push = (message: Omit<Message, "id" | "createdAt">) => {
            setMessages((current) => [...current, { ...message, id: uid(), createdAt: now() }]);
        };
        /** Closes off whichever phase message is still open. */
        const settle = (id: string, patch: Partial<Message>) => {
            setMessages((current) => current.map((message) =>
                message.runId === runId && message.kind === "phase" && message.text === id && message.status === "running"
                    ? { ...message, ...patch }
                    : message,
            ));
        };

        // Each pass posts when it starts and is settled when it lands, so the
        // reader watches the run happen instead of waiting on one silent bubble.
        const onEvent = (event: AiRunEvent) => {
            if (event.type !== "phase") return;
            const step = RUN_STEPS.find((entry) => entry.id === event.id);
            if (!step) return;
            if (event.status === "start") {
                push({ role: "assistant", kind: "phase", runId, text: step.id, detail: step.label, status: "running" });
                return;
            }
            settle(step.id, {
                status: event.status === "skipped" ? "complete" : "complete",
                facts: event.facts,
                detail: event.status === "skipped" ? `${step.label} · skipped` : step.label,
            });
        };

        try {
            if (!generate) throw new Error("No AI adapter configured.");
            const history = messages.slice(-10)
                .filter((message) => message.kind !== "phase")
                .map((message) => ({ role: message.role, text: message.text, steps: message.resultSteps }));
            const request: AiDesignRequest = {
                prompt,
                breakpoint,
                focus,
                history: [...history, { role: "user" as const, text: prompt, steps: undefined }],
                document: {
                    rootStyle,
                    elements: elements.map(({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code }) => ({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code })),
                },
            };
            const result: unknown = await generate(request, onEvent);
            if (!result || typeof result !== "object" || !("operations" in result) || !Array.isArray(result.operations)) throw new Error("AI returned an invalid design plan. Your request is saved, so you can retry it.");
            const plan = result as AiDesignPlan;

            const applyStep = RUN_STEPS[RUN_STEPS.length - 1];
            push({ role: "assistant", kind: "phase", runId, text: applyStep.id, detail: applyStep.label, status: "running" });
            onApply(plan);
            settle(applyStep.id, {
                status: "complete",
                facts: [`${plan.operations.length} operations written to the canvas`],
            });

            push({
                role: "assistant",
                kind: "result",
                runId,
                text: plan.message || `Applied ${plan.operations.length} changes.`,
                status: "complete",
                resultSteps: plan.steps,
            });
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : "AI request failed.";
            setInput(prompt);
            setError(message);
            setMessages((current) => current.map((entry) =>
                entry.runId === runId && entry.status === "running"
                    ? { ...entry, status: "error" as const }
                    : entry,
            ));
            push({ role: "assistant", kind: "result", runId, text: message, status: "error" });
        } finally {
            setBusy(false);
        }
    };

    const clearChat = () => {
        if (busy) return;
        setMessages([]);
        setError(null);
        try { localStorage.removeItem(`pagiera:ai-chat:${pageId}`); } catch { /* noop */ }
    };

    return <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-ed-border px-3.5"><span className="flex items-center gap-2 text-[10px] font-semibold text-ed-text"><PagieraMark size={16} className="rounded-[5px]" />Luma</span><button type="button" onClick={clearChat} disabled={busy || messages.length === 0} title="Clear conversation" className="flex size-7 items-center justify-center rounded-full text-ed-faint hover:bg-ed-field hover:text-ed-text disabled:opacity-25"><IconTrash size={13} /></button></div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
            {messages.length === 0 && <div className="rounded-2xl bg-ed-subtle p-4"><PagieraMark size={36} className="rounded-2xl" /><p className="mt-4 text-[12px] font-semibold text-ed-text">Hi, I’m Luma.</p><p className="mt-1.5 text-[10px] leading-relaxed text-ed-muted">Ask for a whole page, or right-click any layer and choose <span className="text-ed-text">Ask Luma</span> to work on just that one. Every run plans, builds, reviews and applies as a single undoable change.</p><div className="mt-4 space-y-1.5">{["Create an editorial SaaS landing page", "Improve this page’s hierarchy and spacing", "Add a responsive navbar with a mobile menu"].map((suggestion) => <button key={suggestion} type="button" disabled={busy} onClick={() => setInput(suggestion)} className="block w-full select-none rounded-xl bg-ed-field px-3 py-2.5 text-left text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:pointer-events-none disabled:opacity-40">{suggestion}</button>)}</div></div>}
            {messages.map((message) => {
                // A progress report is not a reply: it gets a compact line so a
                // run of them stays scannable and the actual answer still reads
                // as the answer.
                if (message.kind === "phase") {
                    return (
                        <div key={message.id} className="flex items-start gap-2.5 pl-0.5">
                            <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${message.status === "running" ? "bg-ed-accent-soft text-ed-accent" : message.status === "error" ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-400"}`}>
                                {message.status === "running" ? <IconLoader2 size={10} className="animate-spin" /> : message.status === "error" ? <IconX size={10} /> : <IconCheck size={10} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className={`text-[10px] ${message.status === "running" ? "font-medium text-ed-text" : "text-ed-muted"}`}>{message.detail}</span>
                                {message.facts && message.facts.length > 0 && (
                                    <span className="mt-1.5 block space-y-1 rounded-lg bg-ed-subtle px-2.5 py-2">
                                        {message.facts.map((fact) => (
                                            <span key={fact} className="block font-mono text-[9px] leading-snug text-ed-muted">{fact}</span>
                                        ))}
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                }

                return (
                    <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "items-start"}`}>
                        {message.role === "assistant" && (
                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${message.status === "error" ? "bg-red-500/10 text-red-300" : "bg-ed-field text-ed-muted"}`}>
                                {message.status === "error" ? <IconX size={13} /> : <PagieraMark size={16} className="rounded-md" />}
                            </span>
                        )}
                        <div className={`max-w-[calc(100%-38px)] rounded-2xl px-3 py-2.5 text-[10px] leading-relaxed ${message.role === "user" ? "rounded-br-md bg-ed-accent text-white" : "rounded-tl-md bg-ed-subtle text-ed-text"}`}>
                            {message.resultSteps && message.resultSteps.length > 0 && (
                                <div className="mb-2 space-y-1">
                                    {message.resultSteps.map((step) => (
                                        <div key={step} className="flex gap-1.5 text-[9px] text-ed-muted">
                                            <IconCheck size={10} className="mt-0.5 shrink-0 text-emerald-400" />
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p>{message.text}</p>
                            {message.role === "user" && message.detail && (
                                <span className="mt-1 block text-[9px] text-white/70">{message.detail}</span>
                            )}
                            <span className="mt-1.5 block text-[8px] text-ed-faint">{new Date(message.createdAt).toISOString().slice(11, 16)} UTC</span>
                        </div>
                    </div>
                );
            })}
            {error && <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-[9px] leading-relaxed text-red-300">{error}</p>}
            <div ref={endRef} />
        </div>
        <form className="border-t border-ed-border p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            {focus && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-ed-accent-soft px-2.5 py-2">
                    <PagieraMark size={13} className="shrink-0 rounded-[4px]" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-ed-text">
                        Editing <span className="font-semibold">{focus.name}</span>
                        <span className="text-ed-faint"> · {focus.type}</span>
                    </span>
                    <button type="button" onClick={onClearFocus} disabled={busy} title="Work on the whole page instead" className="flex size-5 shrink-0 items-center justify-center rounded-md text-ed-muted hover:bg-ed-field hover:text-ed-text disabled:opacity-30"><IconX size={11} /></button>
                </div>
            )}<fieldset disabled={busy} className="contents"><div className={`rounded-2xl bg-ed-field p-2.5 transition-opacity ${busy ? "opacity-55" : "focus-within:ring-1 focus-within:ring-ed-accent"}`}><textarea value={input} disabled={busy} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder={busy ? "Luma is working on the current request…" : focus ? `Change ${focus.name}…` : "Describe what you want to build…"} rows={3} className="min-h-14 w-full resize-none bg-transparent text-[10px] leading-relaxed text-ed-text outline-none placeholder:text-ed-faint disabled:cursor-not-allowed" /><div className="mt-1 flex items-center justify-between"><span className="text-[8px] text-ed-faint">Enter to send · Shift Enter for a line</span><button type="submit" disabled={!input.trim() || busy} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ed-accent text-white disabled:opacity-30"><IconArrowUp size={13} /></button></div></div></fieldset>{busy && <p className="mt-2 text-center text-[8px] text-ed-faint">Composer is locked until this run finishes.</p>}</form>
    </div>;
}
