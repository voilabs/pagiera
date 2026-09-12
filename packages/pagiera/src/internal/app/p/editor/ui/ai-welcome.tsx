import { IconArrowUpRight, IconLayout, IconTypography, IconSparkles } from "@tabler/icons-react";

const ideas = [
    { label: "Design a page", detail: "Start with a fresh direction", prompt: "A calm editorial site for an architecture studio", Icon: IconLayout },
    { label: "Refine the layout", detail: "Clearer hierarchy, less noise", prompt: "Redesign this page with stronger hierarchy and less noise", Icon: IconSparkles },
    { label: "Improve typography", detail: "Balance type, spacing and rhythm", prompt: "Improve this page's typography, spacing and readability while preserving its content", Icon: IconTypography },
];

export function AiWelcome({ onChoose, disabled = false }: { onChoose: (prompt: string) => void; disabled?: boolean }) {
    return <div className="px-1 pb-4 pt-8">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-ed-accent/10 text-ed-accent"><IconSparkles size={21} stroke={1.5} /></span>
        <h2 className="mt-5 text-[19px] font-semibold leading-tight tracking-tight text-ed-text">A little help.<br />A new perspective.</h2>
        <p className="mt-3 text-xs leading-relaxed text-ed-muted">Build something new or refine what’s already on your canvas.</p>
        <div className="mt-6 space-y-2">{ideas.map(({ label, detail, prompt, Icon }) => <button key={label} type="button" disabled={disabled} onClick={() => onChoose(prompt)} className="group flex w-full items-center gap-3 rounded-xl bg-ed-field/50 px-3 py-3 text-left transition-colors hover:bg-ed-field disabled:opacity-40">
            <Icon size={16} stroke={1.5} className="shrink-0 text-ed-muted group-hover:text-ed-accent" />
            <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-ed-text">{label}</span><span className="mt-1 block text-[11px] text-ed-faint">{detail}</span></span>
            <IconArrowUpRight size={13} className="shrink-0 text-ed-faint" />
        </button>)}</div>
    </div>;
}
