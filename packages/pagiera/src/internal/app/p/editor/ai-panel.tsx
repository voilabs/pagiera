"use client";

import { IconArrowUp, IconCheck, IconLoader2, IconSparkles, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import type { Breakpoint, CanvasElement, RootStyle } from "@/lib/editor/types";

type StepStatus = "pending" | "active" | "done" | "error";
type RunStep = { id: string; label: string; detail: string; status: StepStatus; updatedAt: number };
type Message = {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: number;
    status?: "running" | "complete" | "error";
    steps?: RunStep[];
    resultSteps?: string[];
};

export type AiDesignRequest = {
    prompt: string;
    breakpoint: Breakpoint;
    history: Array<{ role: "user" | "assistant"; text: string; steps?: string[] }>;
    document: { rootStyle: RootStyle; elements: unknown[] };
};

export type AiDesignGenerator = (request: AiDesignRequest) => Promise<AiDesignPlan>;

const RUN_STEPS = [
    { id: "context", label: "Reading the page", detail: "Inspecting structure, content and the active breakpoint" },
    { id: "direction", label: "Planning art direction", detail: "Choosing hierarchy, palette, type rhythm and composition" },
    { id: "build", label: "Building editor operations", detail: "Creating sections, responsive rules and interactions" },
    { id: "review", label: "Reviewing the result", detail: "Checking mobile layout, motion and visual consistency" },
    { id: "apply", label: "Applying changes", detail: "Writing the validated plan to the canvas" },
] as const;

const uid = () => globalThis.crypto?.randomUUID?.() ?? `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => Date.now();

function newRunSteps(): RunStep[] {
    return RUN_STEPS.map((step, index) => ({ ...step, status: index === 0 ? "active" : "pending", updatedAt: now() }));
}

function restoreMessages(raw: string | null): Message[] {
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Message> & { role?: unknown; text?: unknown }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((message, index) => {
        if ((message.role !== "user" && message.role !== "assistant") || typeof message.text !== "string") return [];
        const interrupted = message.status === "running";
        const rawSteps: unknown[] = Array.isArray(message.steps) ? message.steps : [];
        const storedRunSteps = rawSteps.every((step) => step && typeof step === "object" && "id" in step && "status" in step)
            ? rawSteps as RunStep[]
            : undefined;
        const legacyResultSteps = rawSteps.filter((step): step is string => typeof step === "string");
        return [{
            id: typeof message.id === "string" ? message.id : `legacy-${index}`,
            role: message.role,
            text: interrupted ? "This run was interrupted before it finished. Send the request again to continue." : message.text,
            createdAt: typeof message.createdAt === "number" ? message.createdAt : now(),
            status: interrupted ? "error" as const : message.status,
            steps: storedRunSteps?.map((step) => step.status === "active" ? { ...step, status: "error" as const, updatedAt: now() } : step),
            resultSteps: Array.isArray(message.resultSteps) ? message.resultSteps.filter((step): step is string => typeof step === "string") : legacyResultSteps.length ? legacyResultSteps : undefined,
        }];
    }).slice(-60);
}

export function AiPanel({ pageId, elements, rootStyle, breakpoint, onApply, generate }: { pageId: string; elements: CanvasElement[]; rootStyle: RootStyle; breakpoint: Breakpoint; onApply: (plan: AiDesignPlan) => void; generate?: AiDesignGenerator }) {
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

    const updateRun = (runId: string, transform: (message: Message) => Message) => {
        setMessages((current) => current.map((message) => message.id === runId ? transform(message) : message));
    };

    const activateStep = (runId: string, activeIndex: number) => {
        updateRun(runId, (message) => ({ ...message, steps: message.steps?.map((step, index) => ({ ...step, status: index < activeIndex ? "done" : index === activeIndex ? "active" : "pending", updatedAt: index <= activeIndex ? now() : step.updatedAt })) }));
    };

    const submit = async () => {
        const prompt = input.trim();
        if (!prompt || busy) return;
        const userMessage: Message = { id: uid(), role: "user", text: prompt, createdAt: now() };
        const runId = uid();
        const runMessage: Message = { id: runId, role: "assistant", text: "Working through your request…", createdAt: now(), status: "running", steps: newRunSteps() };
        const nextMessages = [...messages, userMessage, runMessage];
        setMessages(nextMessages);
        setInput("");
        setBusy(true);
        setError(null);

        const timers = [
            window.setTimeout(() => activateStep(runId, 1), 700),
            window.setTimeout(() => activateStep(runId, 2), 2100),
            window.setTimeout(() => activateStep(runId, 3), 6200),
        ];
        try {
            if (!generate) throw new Error("No AI adapter configured.");
            const request: AiDesignRequest = {
                prompt,
                breakpoint,
                history: nextMessages.filter((message) => message.id !== runId).slice(-10).map((message) => ({ role: message.role, text: message.text, steps: message.resultSteps })),
                document: {
                    rootStyle,
                    elements: elements.map(({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code }) => ({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code })),
                },
            };
            const response = await generate(request);
            const result: unknown = response;
            if (!result || typeof result !== "object" || !("operations" in result) || !Array.isArray(result.operations)) throw new Error("AI returned an invalid design plan. Your request is saved, so you can retry it.");
            const plan = result as AiDesignPlan;
            activateStep(runId, 4);
            onApply(plan);
            updateRun(runId, (message) => ({ ...message, text: plan.message || `Applied ${plan.operations.length} changes.`, status: "complete", resultSteps: plan.steps, steps: message.steps?.map((step) => ({ ...step, status: "done", updatedAt: now() })) }));
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : "AI request failed.";
            setInput(prompt);
            setError(message);
            updateRun(runId, (run) => ({ ...run, text: message, status: "error", steps: run.steps?.map((step) => step.status === "active" ? { ...step, status: "error", updatedAt: now() } : step) }));
        } finally {
            timers.forEach((timer) => window.clearTimeout(timer));
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
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-ed-border px-3.5"><span className="flex items-center gap-2 text-[10px] font-semibold text-ed-text"><span className="size-1.5 rounded-full bg-ed-accent" />Page agent</span><button type="button" onClick={clearChat} disabled={busy || messages.length === 0} title="Clear conversation" className="flex size-7 items-center justify-center rounded-full text-ed-faint hover:bg-ed-field hover:text-ed-text disabled:opacity-25"><IconTrash size={13} /></button></div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
            {messages.length === 0 && <div className="rounded-2xl bg-ed-subtle p-4"><span className="flex size-9 items-center justify-center rounded-2xl bg-ed-accent-soft text-ed-accent"><IconSparkles size={17} /></span><p className="mt-4 text-[12px] font-semibold text-ed-text">What should we design?</p><p className="mt-1.5 text-[10px] leading-relaxed text-ed-muted">Ask for a full page, a focused section, or improvements to the current design. Pagiera plans, builds, reviews and applies every run as one undoable change.</p><div className="mt-4 space-y-1.5">{["Create an editorial SaaS landing page", "Improve this page’s hierarchy and spacing", "Add a responsive navbar with a mobile menu"].map((suggestion) => <button key={suggestion} type="button" disabled={busy} onClick={() => setInput(suggestion)} className="block w-full select-none rounded-xl bg-ed-field px-3 py-2.5 text-left text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text disabled:pointer-events-none disabled:opacity-40">{suggestion}</button>)}</div></div>}
            {messages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "items-start"}`}>
                {message.role === "assistant" && <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${message.status === "running" ? "bg-ed-accent-soft text-ed-accent" : message.status === "error" ? "bg-red-500/10 text-red-300" : "bg-ed-field text-ed-muted"}`}>{message.status === "running" ? <IconLoader2 size={13} className="animate-spin" /> : message.status === "error" ? <IconX size={13} /> : <IconSparkles size={13} />}</span>}
                <div className={`max-w-[calc(100%-38px)] rounded-2xl px-3 py-2.5 text-[10px] leading-relaxed ${message.role === "user" ? "rounded-br-md bg-ed-accent text-white" : "rounded-tl-md bg-ed-subtle text-ed-text"}`}>
                    {message.steps && <div className="mb-3 space-y-2.5">{message.steps.map((step) => <div key={step.id} className="flex items-start gap-2"><span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${step.status === "done" ? "bg-emerald-500/15 text-emerald-400" : step.status === "active" ? "bg-ed-accent-soft text-ed-accent" : step.status === "error" ? "bg-red-500/15 text-red-300" : "bg-ed-field text-ed-faint"}`}>{step.status === "done" ? <IconCheck size={9} /> : step.status === "active" ? <IconLoader2 size={9} className="animate-spin" /> : step.status === "error" ? <IconX size={9} /> : <span className="size-1 rounded-full bg-current" />}</span><span><span className={step.status === "pending" ? "text-ed-faint" : "font-medium text-ed-text"}>{step.label}</span><span className="mt-0.5 block text-[9px] leading-snug text-ed-faint">{step.detail}</span></span></div>)}</div>}
                    {message.resultSteps && message.resultSteps.length > 0 && <div className="mb-2 space-y-1">{message.resultSteps.map((step) => <div key={step} className="flex gap-1.5 text-[9px] text-ed-muted"><IconCheck size={10} className="mt-0.5 shrink-0 text-emerald-400" /><span>{step}</span></div>)}</div>}
                    <p>{message.text}</p>
                    <span className="mt-1.5 block text-[8px] text-ed-faint">{new Date(message.createdAt).toISOString().slice(11, 16)} UTC</span>
                </div>
            </div>)}
            {error && <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-[9px] leading-relaxed text-red-300">{error}</p>}
            <div ref={endRef} />
        </div>
        <form className="border-t border-ed-border p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}><fieldset disabled={busy} className="contents"><div className={`rounded-2xl bg-ed-field p-2.5 transition-opacity ${busy ? "opacity-55" : "focus-within:ring-1 focus-within:ring-ed-accent"}`}><textarea value={input} disabled={busy} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder={busy ? "Pagiera is working on the current request…" : "Describe what you want to build…"} rows={3} className="min-h-14 w-full resize-none bg-transparent text-[10px] leading-relaxed text-ed-text outline-none placeholder:text-ed-faint disabled:cursor-not-allowed" /><div className="mt-1 flex items-center justify-between"><span className="text-[8px] text-ed-faint">Enter to send · Shift Enter for a line</span><button type="submit" disabled={!input.trim() || busy} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ed-accent text-white disabled:opacity-30"><IconArrowUp size={13} /></button></div></div></fieldset>{busy && <p className="mt-2 text-center text-[8px] text-ed-faint">Composer is locked until this run finishes.</p>}</form>
    </div>;
}
