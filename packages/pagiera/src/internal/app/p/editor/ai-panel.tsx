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

const SUGGESTIONS = [
    "A calm editorial site for an architecture studio",
    "A dark launch page for a privacy-first developer tool",
    "Redesign this page with stronger hierarchy and less noise",
];

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
                        {turn.applied > 0 ? `${turn.applied} elements on canvas` : "Reading the brief"}
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
    focus,
    onClearFocus,
    onApply,
    generate,
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
    /** Lets the panel's own header name the open chat. */
    onActiveChatChange?: (title?: string) => void;
}) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState("");
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
        setChats(restore(pageId));
        setActiveChatId(null);
        setBusy(false);
        setRestoredPage(pageId);
    }, [pageId]);

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
                        onApply(event.plan);
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
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-ed-border px-3.5">
                    <span>
                        <span className="block text-[11px] font-semibold text-ed-text">Conversations</span>
                        <span className="block text-[8px] text-ed-faint">Design history</span>
                    </span>
                    <button type="button" onClick={createChat} aria-label="New chat" className="flex size-7 items-center justify-center rounded-full bg-ed-accent text-white hover:opacity-90"><IconPlus size={13} /></button>
                </div>
                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    {chats.length === 0 ? (
                        <div className="rounded-3xl bg-ed-subtle p-5">
                            <PagieraMark size={28} className="rounded-[9px]" />
                            <p className="mt-4 text-[13px] font-semibold text-ed-text">Design with Luma</p>
                            <p className="mt-1.5 text-[10px] leading-relaxed text-ed-muted">Describe the product, the audience and the feeling. Luma chooses a design system and builds the page from Pagiera's responsive blocks.</p>
                            <button type="button" onClick={createChat} className="mt-4 flex items-center gap-1.5 rounded-xl bg-ed-accent px-3 py-2 text-[10px] font-semibold text-white"><IconPlus size={12} />New chat</button>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {chats.map((chat) => {
                                const last = chat.turns.at(-1);
                                return <button key={chat.id} type="button" onClick={() => setActiveChatId(chat.id)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-ed-subtle">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ed-subtle text-ed-muted group-hover:bg-ed-field group-hover:text-ed-accent"><IconMessage size={14} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[10px] font-semibold text-ed-text">{chat.title}</span>
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
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-ed-border px-2.5">
                <span className="flex min-w-0 items-center gap-1.5">
                    <button type="button" onClick={() => setActiveChatId(null)} disabled={busy} aria-label="Back to chats" className="flex size-7 shrink-0 items-center justify-center rounded-full text-ed-muted hover:bg-ed-field hover:text-ed-text disabled:opacity-30"><IconArrowLeft size={14} /></button>
                    <span className="truncate text-[10px] font-semibold text-ed-text">{activeChat.title}</span>
                </span>
                <button type="button" onClick={deleteChat} title="Delete chat" className="flex size-7 shrink-0 items-center justify-center rounded-full text-ed-faint hover:bg-red-500/10 hover:text-red-400"><IconTrash size={13} /></button>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-3.5">
                {turns.length === 0 && (
                    <div className="py-8">
                        <PagieraMark size={32} className="rounded-[10px]" />
                        <p className="mt-4 text-[14px] font-semibold tracking-[-.02em] text-ed-text">What are we designing?</p>
                        <p className="mt-1.5 max-w-[250px] text-[10px] leading-relaxed text-ed-muted">Name the product, who it is for and the action the page should drive. Luma picks the palette, type and composition.</p>
                        <div className="mt-5 space-y-2">
                            {SUGGESTIONS.map((suggestion) => (
                                <button key={suggestion} type="button" disabled={busy} onClick={() => setInput(suggestion)} className="block w-full select-none rounded-2xl border border-ed-border px-3 py-3 text-left text-[10px] leading-relaxed text-ed-muted transition-colors hover:bg-ed-subtle hover:text-ed-text disabled:pointer-events-none disabled:opacity-40">{suggestion}</button>
                            ))}
                        </div>
                    </div>
                )}

                {turns.map((turn) => (
                    <div key={turn.id} className="space-y-3">
                        <div className="flex justify-end">
                            <div className="max-w-[calc(100%-38px)] rounded-2xl rounded-br-md bg-ed-field px-3 py-2.5 text-[10px] leading-relaxed text-ed-text">
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
                                <div className="max-w-[calc(100%-38px)] space-y-2 py-1 text-[10px] leading-relaxed text-ed-text">
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

            <form className="border-t border-ed-border p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                {/* What the next request will act on. Shown even when nothing is
                    focused, because "the whole page" is the fact worth knowing
                    before sending — its absence used to be silent. */}
                <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg bg-ed-field px-2 py-1.5">
                    <PagieraMark size={13} className="shrink-0 rounded-[4px]" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-ed-text">
                        {focus ? <>{focus.name}<span className="text-ed-faint"> · {focus.type}</span></> : "Entire page"}
                    </span>
                    {focus && (
                        <button type="button" onClick={onClearFocus} disabled={busy} title="Work on the whole page instead" className="flex size-4 shrink-0 items-center justify-center rounded text-ed-muted hover:text-ed-text disabled:opacity-30"><IconX size={10} /></button>
                    )}
                </div>
                <div className={`rounded-2xl bg-ed-field p-2.5 ${busy ? "ring-1 ring-ed-border" : "focus-within:ring-1 focus-within:ring-ed-accent"}`}>
                    <textarea
                        value={input}
                        disabled={busy}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }}
                        placeholder={busy ? "Building your page…" : focus ? `Change ${focus.name}…` : "Describe the page you want…"}
                        rows={3}
                        className="min-h-14 w-full resize-none bg-transparent text-[10px] leading-relaxed text-ed-text outline-none placeholder:text-ed-faint disabled:cursor-not-allowed"
                    />
                    <div className="mt-1 flex items-center justify-between">
                        <span className="truncate text-[8px] text-ed-faint">{busy ? "Changes are appearing on canvas" : "Enter to send · Shift Enter for a line"}</span>
                        {busy ? (
                            <button type="button" onClick={stop} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/40 px-2 py-1 text-[9px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"><IconPlayerStopFilled size={9} /> Stop</button>
                        ) : (
                            <button type="submit" disabled={!input.trim()} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ed-accent text-white disabled:opacity-30"><IconArrowUp size={13} /></button>
                        )}
                    </div>
                </div>
            </form>
        </motion.div>
        )}
        </AnimatePresence>
    </div>;
}
