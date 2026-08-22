"use client";

import { IconArrowUp, IconCheck, IconSparkles } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import type { Breakpoint, CanvasElement, RootStyle } from "@/lib/editor/types";

type Message = { role: "user" | "assistant"; text: string; steps?: string[] };

export type AiDesignRequest = {
    prompt: string;
    breakpoint: Breakpoint;
    history: Message[];
    document: { rootStyle: RootStyle; elements: unknown[] };
};

export type AiDesignGenerator = (request: AiDesignRequest) => Promise<AiDesignPlan>;

export function AiPanel({ pageId, elements, rootStyle, breakpoint, onApply, generate }: { pageId: string; elements: CanvasElement[]; rootStyle: RootStyle; breakpoint: Breakpoint; onApply: (plan: AiDesignPlan) => void; generate?: AiDesignGenerator }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState<"analyzing" | "planning" | "building" | "polishing" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [restoredPage, setRestoredPage] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(`pagiera:ai-chat:${pageId}`);
            setMessages(saved ? (JSON.parse(saved) as Message[]) : []);
        } catch {
            // Corrupt/private storage must not disable the assistant.
            setMessages([]);
        }
        setRestoredPage(pageId);
    }, [pageId]);

    useEffect(() => {
        if (restoredPage !== pageId) return;
        try {
            localStorage.setItem(`pagiera:ai-chat:${pageId}`, JSON.stringify(messages.slice(-40)));
        } catch {
            // Storage is an enhancement; the current conversation still works.
        }
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, pageId, restoredPage]);

    const submit = async () => {
        const prompt = input.trim();
        if (!prompt || busy) return;
        const nextMessages = [...messages, { role: "user" as const, text: prompt }];
        setMessages(nextMessages);
        setInput("");
        setBusy(true);
        setPhase("analyzing");
        setError(null);
        const planningTimer = window.setTimeout(() => setPhase("planning"), 900);
        const buildingTimer = window.setTimeout(() => setPhase("building"), 2200);
        const polishingTimer = window.setTimeout(() => setPhase("polishing"), 6500);
        try {
            const request = { prompt, breakpoint, history: nextMessages.slice(-6), document: { rootStyle, elements: elements.map(({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code }) => ({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code })) } };
            if (!generate) throw new Error("No AI adapter configured.");
            const response = await generate(request);
            const result: unknown = response;
            if (!result || typeof result !== "object" || !("operations" in result) || !Array.isArray(result.operations))
                throw new Error("AI geçerli bir tasarım planı döndürmedi. İsteğin korundu, tekrar deneyebilirsin.");
            const plan = result as AiDesignPlan;
            onApply(plan);
            setMessages((current) => [...current, { role: "assistant", text: plan.message || `Applied ${plan.operations.length} changes.`, steps: plan.steps }]);
        } catch (reason) {
            setInput(prompt);
            setError(reason instanceof Error ? reason.message : "AI request failed.");
        } finally {
            window.clearTimeout(planningTimer);
            window.clearTimeout(buildingTimer);
            window.clearTimeout(polishingTimer);
            setBusy(false);
            setPhase(null);
        }
    };

    return <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && <div className="rounded-xl border border-ed-border bg-ed-subtle p-4"><IconSparkles size={18} className="mb-3 text-ed-accent" /><p className="text-xs font-semibold text-ed-text">Design with AI</p><p className="mt-1 text-[11px] leading-relaxed text-ed-muted">Describe a section, restyle the page, or ask for a complete landing page. Every change remains undoable.</p><div className="mt-3 space-y-1.5">{["Create a dark SaaS hero", "Turn this into a portfolio", "Improve spacing and typography"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setInput(suggestion)} className="block w-full rounded-lg bg-ed-field px-2.5 py-2 text-left text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text">{suggestion}</button>)}</div></div>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "items-start"}`}>
                {message.role === "assistant" && <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ed-accent/15 text-ed-accent"><IconSparkles size={14} /></span>}
                <div className={`max-w-[calc(100%-38px)] rounded-2xl px-3 py-2.5 text-[11px] leading-relaxed ${message.role === "user" ? "rounded-br-md bg-ed-accent text-white" : "rounded-tl-md border border-ed-border bg-ed-subtle text-ed-text"}`}>
                    {message.steps && message.steps.length > 0 && <div className="mb-2.5 space-y-1.5">{message.steps.map((step, stepIndex) => <div key={step} className="flex gap-2 text-[10px] text-ed-muted"><span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><IconCheck size={10} /></span><span><b className="text-ed-text">{stepIndex + 1}.</b> {step}</span></div>)}</div>}
                    <p>{message.text}</p>
                </div>
            </div>)}
            {busy && <div className="flex items-start gap-2.5"><span className="flex size-7 shrink-0 animate-pulse items-center justify-center rounded-lg bg-ed-accent/15 text-ed-accent"><IconSparkles size={14} /></span><div className="flex-1 rounded-2xl rounded-tl-md border border-ed-border bg-ed-subtle p-3"><div className="space-y-2">{[["analyzing","Analyzing your page"],["planning","Creating an art direction"],["building","Building the layout"],["polishing","Polishing responsive details"]].map(([key,label], index) => { const order = ["analyzing","planning","building","polishing"]; const activeIndex = order.indexOf(phase ?? "analyzing"); const done = index < activeIndex; const active = index === activeIndex; return <div key={key} className={`flex items-center gap-2 text-[10px] ${active ? "text-ed-text" : done ? "text-emerald-400" : "text-ed-faint"}`}><span className={`size-1.5 rounded-full ${active ? "animate-pulse bg-ed-accent" : done ? "bg-emerald-400" : "bg-ed-border"}`} />{label}</div>; })}</div></div></div>}
            {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-300">{error}</p>}
            <div ref={endRef} />
        </div>
        <form className="border-t border-ed-border p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}><div className="flex items-end gap-2 rounded-xl border border-ed-border bg-ed-field p-2 focus-within:border-ed-accent"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Ask AI to design…" rows={2} className="min-h-10 flex-1 resize-none bg-transparent text-[11px] text-ed-text outline-none placeholder:text-ed-faint" /><button type="submit" disabled={!input.trim() || busy} className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ed-accent text-white disabled:opacity-30"><IconArrowUp size={14} /></button></div></form>
    </div>;
}
