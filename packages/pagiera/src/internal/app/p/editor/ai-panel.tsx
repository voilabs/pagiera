"use client";

import {
    IconArrowLeft,
    IconArrowUp,
    IconCheck,
    IconChevronDown,
    IconLoader2,
    IconMessage,
    IconPlayerStopFilled,
    IconPlus,
    IconTrash,
    IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { AiDesignPlan } from "@/lib/editor/ai-types";
import type { Breakpoint, CanvasElement, RootStyle } from "@/lib/editor/types";
import { PagieraMark } from "./brand";
import { AiWelcome } from "./ui/ai-welcome";
import type { McpAdapter } from "./ui/mcp-panel";
import { AiComposer } from "./ui/ai-composer";
import { AiMentionMenu } from "./ui/ai-mention-menu";
import { AiChanges } from "./ui/ai-changes";
import { scopeAiPlan } from "@/lib/editor/ai-scope";

/**
 * The design conversation.
 *
 * A turn is the unit: one thing the author asked, one run that answered it,
 * one reply. Progress belongs *to* a turn rather than being interleaved with
 * it as more messages, which is the structural fix here — the previous panel
 * pushed phases, sections and replies into one flat message list and then
 * tried to reconstruct the runs afterwards by scanning for adjacent entries
 * with a matching id. Anything that arrived out of order, or a run that was
 * interrupted, came back as loose progress lines between two questions.
 */

/** One section as the server reports it. */
type RunSection = {
    id: string;
    label: string;
    status: "running" | "done" | "failed";
    facts?: string[];
};

type Turn = {
    id: string;
    createdAt: number;
    prompt: string;
    /** The element the request was scoped to, if any. */
    scope?: string;
    status: "running" | "done" | "stopped" | "error";
    /** What the art direction pass decided. */
    direction?: string[];
    sections: RunSection[];
    /** The assistant's answer, once it arrives. */
    reply?: string;
    /** A one-line summary of each section that was built. */
    summary?: string[];
    error?: string;
    /** Elements written to the canvas so far. */
    applied: number;
};

type Chat = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    turns: Turn[];
};

/** The one element a run is allowed to touch, when the author picked one. */
export type AiFocus = { id: string; name: string; type: string };

export type AiDesignRequest = {
    targetBreakpoint?: string;
    prompt: string;
    breakpoint: Breakpoint;
    focus?: AiFocus;
    history: Array<{ role: "user" | "assistant"; text: string }>;
    document: { rootStyle: RootStyle; elements: unknown[] };
};

/** Emitted by the server as the run progresses. */
export type AiRunEvent =
    | { type: "phase"; id: string; status: "start" | "done"; facts?: string[] }
    | { type: "section"; id: string; label: string; index: number; total: number; status: "start" | "done" | "failed"; facts?: string[] }
    | { type: "plan"; plan: AiDesignPlan; partial?: boolean }
    | { type: "reply"; text: string }
    | { type: "error"; error: string };

export type AiDesignGenerator = (
    request: AiDesignRequest,
    onEvent?: (event: AiRunEvent) => void,
    /** Cancels the run; the panel passes one so Stop reaches the server. */
    signal?: AbortSignal,
) => Promise<AiDesignPlan>;

const uid = () => globalThis.crypto?.randomUUID?.() ?? `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => Date.now();


/* --------------------------------------------------------------- storage */

const key = (pageId: string) => `pagiera:ai-turns:${pageId}`;

/**
 * Reads back stored conversations.
 *
 * A turn saved mid-flight is restored as stopped rather than running: the run
 * it belonged to died with the page, and a spinner that can never resolve is
 * worse than an honest outcome.
 */
function restore(pageId: string): Chat[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(localStorage.getItem(key(pageId)) ?? "null");
    } catch {
        return [];
    }
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((value): Chat[] => {
        const chat = value as Partial<Chat>;
        if (typeof chat.id !== "string") return [];
        const turns = (Array.isArray(chat.turns) ? chat.turns : []).flatMap((entry): Turn[] => {
            const turn = entry as Partial<Turn>;
            if (typeof turn.id !== "string" || typeof turn.prompt !== "string") return [];
            const running = turn.status === "running";
            return [{
                id: turn.id,
                createdAt: typeof turn.createdAt === "number" ? turn.createdAt : now(),
                prompt: turn.prompt,
                scope: typeof turn.scope === "string" ? turn.scope : undefined,
                status: running ? "stopped" : (turn.status ?? "done"),
                direction: Array.isArray(turn.direction) ? turn.direction : undefined,
                sections: (Array.isArray(turn.sections) ? turn.sections : []).map((section) => ({
                    ...section,
                    status: section.status === "running" ? "failed" : section.status,
                })),
                reply: typeof turn.reply === "string" ? turn.reply : undefined,
                summary: Array.isArray(turn.summary) ? turn.summary : undefined,
                error: typeof turn.error === "string" ? turn.error : undefined,
                applied: typeof turn.applied === "number" ? turn.applied : 0,
            }];
        });
        return [{
            id: chat.id,
            title: typeof chat.title === "string" && chat.title.trim() ? chat.title : titleOf(turns[0]?.prompt ?? ""),
            createdAt: typeof chat.createdAt === "number" ? chat.createdAt : now(),
            updatedAt: typeof chat.updatedAt === "number" ? chat.updatedAt : now(),
            turns: turns.slice(-30),
        }];
    }).sort((a, b) => b.updatedAt - a.updatedAt);
}

function titleOf(prompt: string) {
    const text = prompt.replace(/\s+/g, " ").trim();
    if (!text) return "New chat";
    return text.length > 42 ? `${text.slice(0, 41).trimEnd()}…` : text;
}

/* ------------------------------------------------------------ run report */

/**
 * A turn's progress, as one card that can be folded away.
 *
 * Open while the run is live, because watching it is the point. Once it
 * settles it collapses to a single line, so a long conversation reads as
 * questions and answers rather than a wall of finished progress.
 */
function RunReport({ turn }: { turn: Turn }) {
    const running = turn.status === "running";
    const [open, setOpen] = useState(running);
    // A run that is still going should stay open even if it was collapsed
    // before it started reporting sections.
    useEffect(() => {
        if (running) setOpen(true);
    }, [running]);

    const done = turn.sections.filter((section) => section.status === "done").length;
    const failed = turn.sections.some((section) => section.status === "failed") || turn.status === "error";
    const current = turn.sections.find((section) => section.status === "running");

    if (!turn.direction && turn.sections.length === 0 && turn.status !== "running") return null;

    const headline = running
        ? current ? `Building ${current.label}` : "Setting the direction"
        : turn.status === "stopped"
            ? "Stopped"
            : failed
                ? "Finished with problems"
                : `${done} section${done === 1 ? "" : "s"} built`;

    return (
        <div className="overflow-hidden rounded-2xl bg-ed-subtle">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${
                    running ? "bg-ed-accent-soft text-ed-accent" : failed ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                    {running ? <IconLoader2 size={13} className="animate-spin" /> : failed ? <IconX size={13} /> : <IconCheck size={13} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-ed-text">{headline}</span>
                    <span className="mt-0.5 block truncate text-[9px] text-ed-faint">
                        {turn.applied > 0 ? `${turn.applied} changes prepared` : "Reading the brief"}
                    </span>
                </span>
                <IconChevronDown size={12} className={`shrink-0 text-ed-faint transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="space-y-2 border-t border-ed-border/70 px-3 py-2.5">
                    {turn.direction && turn.direction.length > 0 && (
                        <div className="space-y-1">
                            <span className="block text-[10px] font-medium text-ed-text">Art direction</span>
                            {turn.direction.map((fact) => (
                                <span key={fact} className="block font-mono text-[9px] leading-snug text-ed-faint">{fact}</span>
                            ))}
                        </div>
                    )}
                    {turn.sections.map((section) => (
                        <div key={section.id} className="flex items-start gap-2.5">
                            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center ${
                                section.status === "running" ? "text-ed-accent" : section.status === "failed" ? "text-red-400" : "text-emerald-400"
                            }`}>
                                {section.status === "running"
                                    ? <IconLoader2 size={9} className="animate-spin" />
                                    : section.status === "failed" ? <IconX size={9} /> : <IconCheck size={9} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className={`text-[10px] ${section.status === "running" ? "font-medium text-ed-text" : "text-ed-muted"}`}>
                                    {section.label}
                                </span>
                                {section.facts && section.facts.length > 0 && (
                                    <span className="mt-0.5 block">
                                        {section.facts.map((fact) => (
                                            <span key={fact} className="block font-mono text-[9px] leading-snug text-ed-faint">{fact}</span>
                                        ))}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ----------------------------------------------------------------- panel */

export function AiPanel({
    pageId,
    elements,
    rootStyle,
    breakpoint,
    focus: externalFocus,
    onClearFocus: clearExternalFocus,
    onApply,
    generate,
    enterToSend = true,
    onOpenAiSettings,
    onActiveChatChange,
}: {
    pageId: string;
    elements: CanvasElement[];
    rootStyle: RootStyle;
    breakpoint: Breakpoint;
    focus?: AiFocus;
    onClearFocus?: () => void;
    onApply: (plan: AiDesignPlan) => void;
    generate?: AiDesignGenerator;
    mcp?: McpAdapter;
    enterToSend?: boolean;
    onOpenAiSettings?: () => void;
    /** Lets the panel's own header name the open chat. */
    onActiveChatChange?: (title?: string) => void;
}) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [taggedFocus, setTaggedFocus] = useState<AiFocus>();
    const focus = taggedFocus ?? externalFocus;
    const onClearFocus = () => { setTaggedFocus(undefined); clearExternalFocus?.(); };
    const [targetBreakpoint, setTargetBreakpoint] = useState<string>();
    const [pendingPlans, setPendingPlans] = useState<AiDesignPlan[]>([]);
    const pendingSnapshot = useRef("");
    const [planError, setPlanError] = useState("");
    const mention = input.match(/@([^@\n]*)$/)?.[1]?.toLowerCase();
    const mentionedLayers = mention === undefined ? [] : elements.filter(element => !element.parked && (element.name ?? element.type).toLowerCase().includes(mention)).slice(0, 8);
    const mentionedBreakpoints = mention === undefined ? [] : (rootStyle.breakpoints ?? [{ id: "desktop", name: "Desktop" }, { id: "tablet", name: "Tablet" }, { id: "mobile", name: "Mobile" }]).filter(item => item.name.toLowerCase().includes(mention));
    const clearMention = () => setInput(current => current.replace(/@([^@\n]*)$/, ""));
    const [busy, setBusy] = useState(false);
    const [restoredPage, setRestoredPage] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    // Every explicit cancellation invalidates the whole run, including stream
    // events already queued and generators that resolve after the abort.
    const cancellation = useRef(0);

    const activeChat = chats.find((chat) => chat.id === activeChatId);
    const turns = activeChat?.turns ?? [];

    const stop = () => {
        cancellation.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
    };

    // The panel shell draws the title, so it has to be told what it is.
    const activeTitle = activeChat?.title;
    // biome-ignore lint/correctness/useExhaustiveDependencies: the callback is the caller's setter and is stable in practice
    useEffect(() => {
        onActiveChatChange?.(activeTitle);
        return () => onActiveChatChange?.(undefined);
    }, [activeTitle]);

    useEffect(() => {
        const restored = restore(pageId);
        if (!restored.length) restored.push({ id: uid(), title: "New chat", createdAt: now(), updatedAt: now(), turns: [] });
        setChats(restored);
        setActiveChatId(restored[0].id);
        setInput("");
        setTaggedFocus(undefined);
        setTargetBreakpoint(undefined);
        try {
            const draft = JSON.parse(sessionStorage.getItem(key(pageId) + ":draft") ?? "null");
            if (draft && restored.some(chat => chat.id === draft.chatId)) {
                setActiveChatId(draft.chatId);
                if (typeof draft.text === "string") setInput(draft.text);
                if (typeof draft.breakpoint === "string" && (rootStyle.breakpoints?.map(item => item.id) ?? ["desktop", "tablet", "mobile"]).includes(draft.breakpoint)) setTargetBreakpoint(draft.breakpoint);
            }
        } catch { /* A broken draft must not prevent opening Luma. */ }
        setBusy(false);
        setRestoredPage(pageId);
    }, [pageId]);

    useEffect(() => {
        if (restoredPage !== pageId) return;
        try { sessionStorage.setItem(key(pageId) + ":draft", JSON.stringify({ chatId: activeChatId, text: input, focusId: focus?.id, breakpoint: targetBreakpoint })); } catch { /* Optional session storage. */ }
    }, [pageId, restoredPage, activeChatId, input, focus?.id, targetBreakpoint]);

    useEffect(() => {
        if (restoredPage !== pageId) return;
        try {
            localStorage.setItem(key(pageId), JSON.stringify(chats.slice(0, 30)));
        } catch {
            // Storage is optional; losing history is not worth an error.
        }
    }, [chats, pageId, restoredPage]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [turns.length, turns.at(-1)?.sections.length, activeChatId]);

    /** Applies a change to one turn, leaving everything else untouched. */
    const patchTurn = (chatId: string, turnId: string, update: (turn: Turn) => Turn) => {
        setChats((current) => current.map((chat) => chat.id !== chatId ? chat : {
            ...chat,
            updatedAt: now(),
            turns: chat.turns.map((turn) => turn.id === turnId ? update(turn) : turn),
        }));
    };

    const createChat = () => {
        if (busy) return;
        setPendingPlans([]);
        setPlanError("");
        const id = uid();
        setChats((current) => [{ id, title: "New chat", createdAt: now(), updatedAt: now(), turns: [] }, ...current]);
        setActiveChatId(id);
        setInput("");
    };

    const deleteChat = () => {
        if (!activeChatId) return;
        stop();
        setChats((current) => current.filter((chat) => chat.id !== activeChatId));
        setActiveChatId(null);
        setInput("");
        setBusy(false);
    };

    const submit = async () => {
        const prompt = input.trim();
        if (prompt === "/mcp") { onOpenAiSettings?.(); setInput(""); return; }
        if (pendingPlans.length) return;
        if (!prompt || busy || !activeChatId) return;
        const chatId = activeChatId;
        const turnId = uid();

        setChats((current) => current.map((chat) => chat.id !== chatId ? chat : {
            ...chat,
            title: chat.turns.length === 0 ? titleOf(prompt) : chat.title,
            updatedAt: now(),
            turns: [...chat.turns, {
                id: turnId,
                createdAt: now(),
                prompt,
                scope: focus?.name,
                status: "running" as const,
                sections: [],
                applied: 0,
            }].slice(-30),
        }));
        setInput("");
        setBusy(true);
        const staged: AiDesignPlan[] = [];
        const scopedRefs = new Set<string>();
        pendingSnapshot.current = JSON.stringify({ elements, rootStyle });
        setPlanError("");

        const controller = new AbortController();
        const token = cancellation.current;
        abortRef.current = controller;
        const live = () => !controller.signal.aborted && cancellation.current === token;

        const onEvent = (event: AiRunEvent) => {
            if (!live()) return;
            switch (event.type) {
                case "plan":
                    // Partial plans are the page arriving element by element.
                    // The final plan carries no operations and is only a summary.
                    if (event.partial && event.plan.operations.length > 0) {
                        staged.push(scopeAiPlan(event.plan, elements, focus?.id, targetBreakpoint, scopedRefs));
                        patchTurn(chatId, turnId, (turn) => ({
                            ...turn,
                            applied: turn.applied + event.plan.operations.length,
                        }));
                    }
                    return;
                case "phase":
                    if (event.id === "direction" && event.status === "done") {
                        patchTurn(chatId, turnId, (turn) => ({ ...turn, direction: event.facts?.filter(Boolean) }));
                    }
                    return;
                case "section":
                    patchTurn(chatId, turnId, (turn) => {
                        const at = turn.sections.findIndex((section) => section.id === event.id);
                        const next: RunSection = {
                            id: event.id,
                            label: event.label,
                            status: event.status === "start" ? "running" : event.status,
                            // A second "start" for the same section is a retry,
                            // and it carries the reason the last attempt was
                            // discarded. Facts sent with a start are therefore
                            // kept; only a start with nothing to say leaves the
                            // section's existing facts alone.
                            facts: event.facts ?? (event.status === "start" ? turn.sections[at]?.facts : undefined),
                        };
                        const sections = at >= 0 ? turn.sections.slice() : [...turn.sections, next];
                        if (at >= 0) sections[at] = next;
                        return { ...turn, sections };
                    });
                    return;
                case "reply":
                    patchTurn(chatId, turnId, (turn) => ({ ...turn, reply: event.text }));
                    return;
                default:
            }
        };

        try {
            if (!generate) throw new Error("No AI adapter configured.");
            const history = turns.slice(-6).flatMap((turn) => [
                { role: "user" as const, text: turn.prompt },
                ...(turn.reply ? [{ role: "assistant" as const, text: turn.reply }] : []),
            ]);

            const plan = await generate({
                prompt,
                breakpoint,
                targetBreakpoint,
                focus,
                history: [...history, { role: "user" as const, text: prompt }],
                document: {
                    rootStyle,
                    elements: elements.map(({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code }) =>
                        ({ id, type, name, parentId, content, src, href, base, overrides, hover, press, loop, draggable, styleBindings, componentRole, componentId, variant, interaction, code })),
                },
            }, onEvent, controller.signal);

            // Some adapters cannot cancel their upstream work. They may still
            // resolve, but a stopped run must never touch the canvas.
            if (!live()) throw new DOMException("The design run was stopped.", "AbortError");
            if (!staged.length && plan?.operations?.length) staged.push(scopeAiPlan(plan, elements, focus?.id, targetBreakpoint, scopedRefs));
            setPendingPlans(staged.filter(item => item.operations.length));

            patchTurn(chatId, turnId, (turn) => ({
                ...turn,
                status: "done",
                reply: plan?.message || turn.reply,
                summary: plan?.steps?.length ? plan.steps : undefined,
                sections: turn.sections.map((section) =>
                    section.status === "running" ? { ...section, status: "done" as const } : section),
            }));
        } catch (reason) {
            // Stopping is a decision, not a failure: the run closes quietly and
            // whatever it had already applied to the canvas stays.
            const stopped = !live() || (reason instanceof DOMException && reason.name === "AbortError");
            const message = reason instanceof Error ? reason.message : "AI request failed.";
            if (!stopped) setInput(prompt);
            patchTurn(chatId, turnId, (turn) => ({
                ...turn,
                status: stopped ? "stopped" : "error",
                error: stopped ? undefined : message,
                sections: turn.sections.map((section) =>
                    section.status === "running" ? { ...section, status: "failed" as const } : section),
            }));
        } finally {
            if (abortRef.current === controller) abortRef.current = null;
            setBusy(false);
        }
    };

    return <div className="relative h-full min-h-0 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
        {!activeChat ? (
            <motion.div key="chat-list" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex min-h-0 flex-col">
                <div className="flex h-12 shrink-0 items-center justify-between px-4">
                    <span>
                        <span className="block text-[11px] font-semibold text-ed-text">Luma workspace</span>
                        <span className="mt-0.5 block text-[10px] text-ed-faint">Your conversations</span>
                    </span>
                    <button type="button" onClick={createChat} aria-label="New chat" className="flex size-7 items-center justify-center rounded-lg bg-ed-accent text-white hover:opacity-90"><IconPlus size={13} /></button>
                </div>
                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    {chats.length === 0 ? (
                        <div>
                            <AiWelcome onChoose={prompt => { createChat(); setInput(prompt); }} disabled={busy} />
                            <button type="button" onClick={createChat} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ed-field text-xs font-medium text-ed-text hover:bg-ed-field-hover"><IconPlus size={14} />Start a conversation</button>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {chats.map((chat) => {
                                const last = chat.turns.at(-1);
                                return <button key={chat.id} type="button" onClick={() => setActiveChatId(chat.id)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-ed-subtle">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ed-subtle text-ed-muted group-hover:bg-ed-field group-hover:text-ed-accent"><IconMessage size={14} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-medium text-ed-text">{chat.title}</span>
                                        <span className="mt-0.5 block truncate text-[9px] text-ed-faint">{last?.reply ?? last?.prompt ?? "No messages yet"}</span>
                                    </span>
                                    <span className="text-[8px] text-ed-faint">{new Date(chat.updatedAt).toISOString().slice(5, 10)}</span>
                                </button>;
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        ) : (
        <motion.div key={activeChat.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex min-h-0 flex-col">
            <div className="flex h-11 shrink-0 items-center justify-between px-3">
                <span className="flex min-w-0 items-center gap-1.5">
                    <button type="button" onClick={() => setActiveChatId(null)} disabled={busy} aria-label="Back to chats" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-field hover:text-ed-text disabled:opacity-30"><IconArrowLeft size={14} /></button>
                    <span className="truncate text-[10px] font-semibold text-ed-text">{activeChat.title}</span>
                </span>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={createChat} disabled={busy || pendingPlans.length > 0} aria-label="New chat" className="flex size-7 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-field disabled:opacity-40"><IconPlus size={14} /></button>
                    <button type="button" onClick={deleteChat} title="Delete chat" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ed-faint hover:bg-red-500/10 hover:text-red-400"><IconTrash size={13} /></button>
                </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                {turns.length === 0 && (
                    <div className="flex min-h-48 flex-col justify-center py-8">
                        <PagieraMark size={28} className="mb-4 rounded-lg" />
                        <h2 className="text-sm font-medium text-ed-text">What would you like to change?</h2>
                        <p className="mt-2 text-xs leading-relaxed text-ed-muted">Select a layer or use @ to target it. Describe the change — existing content stays in place.</p>
                    </div>
                )}

                {turns.map((turn) => (
                    <div key={turn.id} className="space-y-3">
                        <div className="flex justify-end">
                            <div className="max-w-[92%] break-words rounded-2xl rounded-br-md bg-ed-field px-3.5 py-3 text-xs leading-relaxed text-ed-text">
                                <p className="whitespace-pre-wrap">{turn.prompt}</p>
                                {turn.scope && <span className="mt-1 block text-[9px] text-ed-faint">↳ {turn.scope}</span>}
                            </div>
                        </div>

                        <RunReport turn={turn} />

                        {(turn.reply || turn.error || turn.status === "stopped") && (
                            <div className="flex items-start gap-2.5">
                                <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${turn.error ? "bg-red-500/10 text-red-300" : "bg-ed-field text-ed-muted"}`}>
                                    {turn.error ? <IconX size={13} /> : <PagieraMark size={16} className="rounded-md" />}
                                </span>
                                <div className="min-w-0 flex-1 space-y-3 break-words py-1 text-xs leading-relaxed text-ed-text">
                                    {turn.summary && turn.summary.length > 0 && (
                                        <div className="space-y-1">
                                            {turn.summary.map((step) => (
                                                <div key={step} className="flex gap-1.5 text-[9px] text-ed-muted">
                                                    <IconCheck size={10} className="mt-0.5 shrink-0 text-emerald-400" />
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className={turn.error ? "text-red-300" : undefined}>
                                        {turn.error
                                            ?? turn.reply
                                            ?? `Stopped${turn.applied > 0 ? ` after ${turn.applied} element${turn.applied === 1 ? "" : "s"}` : ""}.`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {pendingPlans.length > 0 && <div className="mx-3 my-2 rounded-xl bg-ed-accent/10 p-3 text-xs">
                <b>{pendingPlans.reduce((count, plan) => count + plan.operations.length, 0)} changes ready</b>
                <p className="my-2 text-ed-muted">Review these edits before applying. Nothing has changed yet.</p>
                <AiChanges plans={pendingPlans} elements={elements} rootStyle={rootStyle} />
                {planError && <p role="alert" className="my-2 text-red-400">{planError}</p>}
                <div className="flex gap-2"><button type="button" onClick={() => {
                    if (pendingSnapshot.current !== JSON.stringify({ elements, rootStyle })) { setPlanError("The document changed since generation. Discard this plan and generate again."); return; }
                    for (const plan of pendingPlans) onApply(plan);
                    setPendingPlans([]);
                }} className="rounded-lg bg-ed-accent px-3 py-2 text-white">Apply changes</button><button type="button" onClick={() => setPendingPlans([])}>Discard</button></div>
            </div>}
            <AiComposer value={input} onChange={setInput} onSubmit={() => { void submit(); }} busy={busy} blocked={pendingPlans.length > 0} onStop={stop} enterToSend={enterToSend} onSettings={onOpenAiSettings}
                context={<>
                    <span className="max-w-full truncate rounded-md bg-ed-subtle px-2 py-1">{focus ? focus.name : "Current page"}</span>
                    {focus && <button type="button" aria-label="Clear target" disabled={busy || pendingPlans.length > 0} onClick={onClearFocus} className="rounded p-1 hover:text-ed-text"><IconX size={11} /></button>}
                    {targetBreakpoint && <button type="button" disabled={busy || pendingPlans.length > 0} onClick={() => setTargetBreakpoint(undefined)} className="rounded-md bg-ed-accent/10 px-2 py-1 text-ed-accent">{targetBreakpoint} ×</button>}
                </>}
                suggestions={mention !== undefined && <AiMentionMenu
                    breakpoints={mentionedBreakpoints.map(item => ({ id: item.id, name: item.name, detail: "Breakpoint" }))}
                    layers={mentionedLayers.map(item => ({ id: item.id, name: item.name ?? item.type, detail: item.componentRole ? "Component" : item.type, component: Boolean(item.componentRole) }))}
                    disabled={busy || pendingPlans.length > 0}
                    onBreakpoint={id => { setTargetBreakpoint(id); clearMention(); }}
                    onLayer={id => { const item = mentionedLayers.find(layer => layer.id === id); if (item) setTaggedFocus({ id: item.id, name: item.name ?? item.type, type: item.type }); clearMention(); }}
                    onClose={clearMention}
                />} />

        </motion.div>
        )}
        </AnimatePresence>
    </div>;
}
