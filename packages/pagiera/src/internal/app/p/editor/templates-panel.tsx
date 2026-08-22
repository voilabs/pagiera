"use client";

import { IconArrowUpRight, IconCheck, IconRefresh, IconSearch, IconSparkles, IconTemplate } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
    DEFAULT_TEMPLATE_REGISTRY_URL,
    FALLBACK_TEMPLATE_REGISTRY,
    loadTemplateBundle,
    loadTemplateRegistry,
    type TemplateInstallInput,
    type TemplateRegistryEntry,
} from "@/lib/editor/template-registry";

type RegistryState = "loading" | "github" | "cache" | "stale" | "bundled";

export function TemplatesPanel({
    busy,
    registryUrl = DEFAULT_TEMPLATE_REGISTRY_URL,
    onInstall,
}: {
    busy: boolean;
    registryUrl?: string;
    onInstall: (template: TemplateInstallInput) => void;
}) {
    const [templates, setTemplates] = useState(FALLBACK_TEMPLATE_REGISTRY.templates);
    const [status, setStatus] = useState<RegistryState>("loading");
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [installing, setInstalling] = useState<string>();

    const refresh = async (force = false) => {
        setStatus("loading");
        setError("");
        const result = await loadTemplateRegistry(registryUrl, force);
        setTemplates(result.registry.templates);
        setStatus(result.source);
        if (result.error) setError(result.error instanceof Error ? result.error.message : "Could not refresh templates.");
    };

    useEffect(() => {
        void refresh();
    }, [registryUrl]);

    const categories = useMemo(() => ["All", ...new Set(templates.map((template) => template.category))], [templates]);
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return templates.filter((template) =>
            (category === "All" || template.category === category) &&
            (!needle || [template.name, template.description, template.category, ...template.tags].some((value) => value.toLowerCase().includes(needle))),
        );
    }, [templates, category, query]);

    const install = async (template: TemplateRegistryEntry) => {
        setInstalling(template.id);
        setError("");
        try {
            onInstall(await loadTemplateBundle(template, registryUrl));
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Template download failed.");
        } finally {
            setInstalling(undefined);
        }
    };

    return (
        <div className="min-h-full bg-ed-surface">
            <div className="sticky top-0 z-10 border-b border-ed-border bg-ed-surface/95 p-4 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-ed-accent-soft text-ed-accent"><IconTemplate size={16} /></span>
                            <div><h2 className="text-[13px] font-semibold text-ed-text">Template gallery</h2><p className="text-[9px] text-ed-faint">Complete, editable sites</p></div>
                        </div>
                    </div>
                    <button type="button" onClick={() => void refresh(true)} disabled={status === "loading"} className="flex size-8 items-center justify-center rounded-lg border border-ed-border bg-ed-field text-ed-muted transition hover:border-ed-accent/50 hover:text-ed-text disabled:opacity-40" title="Refresh from GitHub">
                        <IconRefresh size={14} className={status === "loading" ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-ed-border bg-ed-field px-3 py-2.5 focus-within:border-ed-accent/60">
                    <IconSearch size={14} className="shrink-0 text-ed-faint" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." className="min-w-0 flex-1 bg-transparent text-[11px] text-ed-text outline-none placeholder:text-ed-faint" />
                    <span className={`size-1.5 rounded-full ${status === "github" ? "bg-emerald-400" : status === "loading" ? "animate-pulse bg-ed-accent" : "bg-amber-400"}`} title={status} />
                </div>

                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[9px] font-medium transition ${category === item ? "border-ed-accent bg-ed-accent text-white" : "border-ed-border bg-ed-subtle text-ed-muted hover:text-ed-text"}`}>{item}</button>)}
                </div>
            </div>

            <div className="space-y-4 p-4">
                {error && <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2.5 text-[9px] leading-relaxed text-amber-200">{error} Using the most recent available catalog.</div>}
                <div className="flex items-center justify-between"><span className="text-[9px] font-medium uppercase tracking-[.14em] text-ed-faint">{visible.length} templates</span><span className="text-[9px] text-ed-faint">{status === "github" ? "Live from GitHub" : status === "cache" ? "Cached catalog" : status === "loading" ? "Refreshing…" : "Offline catalog"}</span></div>

                {visible.map((template, index) => (
                    <motion.article key={template.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.035, 0.18), duration: 0.3 }} className="group overflow-hidden rounded-[18px] border border-ed-border bg-ed-subtle transition-colors hover:border-ed-accent/45">
                        <div className="relative h-44 overflow-hidden p-5" style={{ background: template.preview.background, color: template.preview.foreground }}>
                            <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 88% 10%, ${template.preview.accent}55, transparent 34%)` }} />
                            <div className="absolute inset-x-5 top-5 flex items-center justify-between border-b pb-3" style={{ borderColor: `${template.preview.foreground}22` }}>
                                <span className="font-mono text-[7px] font-bold tracking-[.18em]" style={{ color: template.preview.accent }}>{template.preview.eyebrow}</span>
                                <span className="flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="size-1 rounded-full" style={{ background: `${template.preview.foreground}66` }} />)}</span>
                            </div>
                            <p className="relative mt-14 max-w-[270px] text-[25px] font-semibold leading-[.88] tracking-[-.065em]">{template.preview.headline}</p>
                            <div className="absolute bottom-5 left-5 h-1 w-14 rounded-full" style={{ background: template.preview.accent }} />
                            {template.featured && <span className="absolute bottom-4 right-4 rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[.12em]" style={{ color: template.preview.background, background: template.preview.accent }}>Featured</span>}
                        </div>

                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0"><h3 className="truncate text-[12px] font-semibold text-ed-text">{template.name}</h3><p className="mt-1 text-[9px] leading-relaxed text-ed-muted">{template.description}</p></div>
                                <span className="shrink-0 rounded-md bg-ed-field px-2 py-1 font-mono text-[8px] text-ed-faint">v{template.version}</span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">{template.tags.map((tag) => <span key={tag} className="rounded-full border border-ed-border px-2 py-1 text-[8px] text-ed-faint">{tag}</span>)}</div>
                            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">{template.pages.slice(0, 6).map((page) => <span key={page} className="flex min-w-0 items-center gap-1.5 text-[8px] text-ed-muted"><IconCheck size={10} className="shrink-0" style={{ color: template.preview.accent }} /><span className="truncate">{page}</span></span>)}</div>

                            <button type="button" disabled={busy || Boolean(installing)} onClick={() => void install(template)} className="mt-4 flex h-10 w-full items-center justify-between rounded-xl px-3.5 text-[10px] font-semibold transition hover:brightness-110 disabled:cursor-wait disabled:opacity-45" style={{ background: template.preview.accent, color: template.preview.background }}>
                                <span className="flex items-center gap-2"><IconSparkles size={13} />{installing === template.id ? "Downloading template…" : "Use this template"}</span><IconArrowUpRight size={13} />
                            </button>
                        </div>
                    </motion.article>
                ))}

                {visible.length === 0 && <div className="rounded-2xl border border-dashed border-ed-border px-5 py-12 text-center"><IconTemplate size={22} className="mx-auto text-ed-faint" /><p className="mt-3 text-[10px] font-medium text-ed-muted">No templates match this search.</p></div>}
            </div>
        </div>
    );
}
