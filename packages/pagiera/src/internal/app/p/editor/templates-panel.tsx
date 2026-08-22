"use client";

import { IconArrowRight, IconCheck, IconSparkles } from "@tabler/icons-react";
import type { SiteTemplateId } from "@/lib/editor/site-templates";

const templates: Array<{ id: SiteTemplateId; name: string; kind: string; pages: string[]; count: string; accent: string; preview: string; title: string }> = [
    { id: "editorial-blog", name: "Field Notes", kind: "Dynamic editorial blog", pages: ["Home", "Journal", "Article / :slug", "About"], count: "4 pages + API", accent: "#db4b2d", preview: "bg-[#f3efe6] text-[#171714]", title: "IDEAS FOR A MORE HUMAN WEB." },
    { id: "orbit-saas", name: "Orbit OS", kind: "Product & SaaS launch", pages: ["Home", "Product", "Pricing"], count: "3 pages", accent: "#7357ff", preview: "bg-[#070914] text-[#f5f7ff]", title: "SHIP THE NEXT VERSION OF YOU." },
    { id: "nocturne", name: "Nocturne Studio", kind: "Dark editorial portfolio", pages: ["Home", "Work", "Studio", "Contact"], count: "4 pages", accent: "#d7ff3f", preview: "bg-[#0b0b0a] text-[#f1f0ea]", title: "WE DESIGN THE UNEXPECTED." },
];

export function TemplatesPanel({ busy, onInstall }: { busy: boolean; onInstall: (id: SiteTemplateId) => void }) {
    return <div className="space-y-3 p-3">
        <div className="mb-4 rounded-2xl border border-ed-border bg-ed-subtle p-4">
            <p className="text-xs font-semibold text-ed-text">Site templates</p>
            <p className="mt-1 text-[10px] leading-relaxed text-ed-muted">Complete editable sites with pages, responsive layouts, motion, tokens and data requests.</p>
        </div>
        {templates.map((template) => <article key={template.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0e] shadow-xl">
            <div className={`relative h-32 overflow-hidden border-b border-white/10 p-4 ${template.preview}`}>
                <div className="absolute -right-5 -top-6 size-28 rounded-full blur-3xl opacity-40" style={{ background: template.accent }} />
                <span className="relative font-mono text-[8px] font-bold tracking-[.2em]" style={{ color: template.accent }}>{template.name.toUpperCase()}</span>
                <p className="relative mt-8 max-w-[210px] text-[21px] font-semibold leading-[.9] tracking-[-.07em]">{template.title}</p>
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-[12px] font-semibold text-[#f1f0ea]">{template.name}</h3><p className="mt-1 text-[9px] text-[#96958f]">{template.kind}</p></div><span className="rounded-full px-2 py-1 font-mono text-[8px]" style={{ color: template.accent, background: `${template.accent}18` }}>{template.count}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] text-[#96958f]">{template.pages.map((page) => <span key={page} className="flex items-center gap-1.5"><IconCheck size={10} style={{ color: template.accent }} />{page}</span>)}</div>
                <button type="button" disabled={busy} onClick={() => onInstall(template.id)} className="mt-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[10px] font-extrabold text-white transition hover:brightness-110 disabled:opacity-50" style={{ background: template.accent }}><span className="flex items-center gap-2"><IconSparkles size={13} />{busy ? "Installing…" : "Install complete site"}</span><IconArrowRight size={13} /></button>
            </div>
        </article>)}
    </div>;
}
