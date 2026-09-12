import { IconAt, IconSettings, IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function AiComposer({ value, onChange, onSubmit, busy, blocked, onStop, enterToSend, onSettings, context, suggestions }: {
    value: string; onChange: (value: string) => void; onSubmit: () => void; busy: boolean; blocked: boolean;
    onStop: () => void; enterToSend: boolean; onSettings?: () => void; context: ReactNode; suggestions: ReactNode;
}) {
    const input = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const node = input.current;
        if (!node) return;
        node.style.height = "auto";
        node.style.height = Math.min(180, Math.max(84, node.scrollHeight)) + "px";
    }, [value]);
    return <form className="shrink-0 px-3 pb-3 pt-2" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
        {suggestions}
        <div className="rounded-[20px] bg-ed-field p-3 shadow-[0_4px_18px_rgb(0_0_0/0.08)] ring-1 ring-inset ring-white/[0.06] transition-shadow focus-within:ring-ed-accent/50">
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] text-ed-muted">{context}</div>
            <textarea ref={input} aria-label="Message Luma" rows={3} value={value} disabled={busy}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === "Enter" && !event.shiftKey && (enterToSend || event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        if (!blocked && !busy && value.trim()) onSubmit();
                    }
                }}
                placeholder={busy ? "Preparing your changes…" : "What would you like to create?"}
                className="custom-scrollbar block w-full resize-none bg-transparent px-1 py-1 text-[13px] leading-relaxed text-ed-text outline-none placeholder:text-ed-faint disabled:opacity-70" />
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button type="button" aria-label="Mention a target" title="Mention a layer or breakpoint" disabled={busy || blocked} onClick={() => { onChange(value + (value && !value.endsWith(" ") ? " @" : "@")); input.current?.focus(); }} className="flex size-8 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-subtle hover:text-ed-text disabled:opacity-40"><IconAt size={17} stroke={1.6} /></button>
                    <button type="button" aria-label="AI settings" title="AI settings & MCP servers" disabled={!onSettings || busy || blocked} onClick={onSettings} className="flex size-8 items-center justify-center rounded-lg text-ed-muted hover:bg-ed-subtle hover:text-ed-text disabled:opacity-40"><IconSettings size={16} stroke={1.6} /></button>
                </div>
                {busy ? <button type="button" aria-label="Stop generation" onClick={onStop} className="flex size-8 items-center justify-center rounded-full bg-ed-text text-ed-surface"><IconPlayerStopFilled size={12} /></button> :
                    <button type="submit" aria-label="Send message" disabled={!value.trim() || blocked} className="flex size-8 items-center justify-center rounded-full bg-ed-accent text-white transition-opacity hover:opacity-90 disabled:bg-ed-subtle disabled:text-ed-faint"><IconArrowUp size={17} stroke={2} /></button>}
            </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-ed-faint">{blocked ? "Review or discard the prepared changes first" : busy ? "Nothing changes until you approve" : enterToSend ? "Enter to send · Shift + Enter for a new line" : "Ctrl / ⌘ + Enter to send"}</p>
    </form>;
}
