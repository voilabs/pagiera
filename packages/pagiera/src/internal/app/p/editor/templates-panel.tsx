"use client";

import { IconAlertTriangle, IconArrowUpRight, IconCheck, IconDownload, IconRefresh, IconSearch, IconSparkles, IconTemplate, IconUpload, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePagieraFonts } from "pagiera/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FONT_STACKS } from "@/lib/editor/types";
import {
    DEFAULT_TEMPLATE_REGISTRY_URL,
    FALLBACK_TEMPLATE_REGISTRY,
    loadTemplateRegistry,
    type TemplateRegistryEntry,
} from "@/lib/editor/template-registry";
import { TemplatePreview, useTemplatePreview } from "./template-preview";

type RegistryState = "loading" | "local" | "network" | "cache" | "stale" | "bundled";
type InstallStage = "fetching" | "replacing" | "creating" | "opening";

const INSTALL_STEPS: Array<{ id: InstallStage; label: string; detail: string }> = [
    { id: "fetching", label: "Fetching template", detail: "Loading the latest bundle on the server" },
    { id: "replacing", label: "Replacing pages", detail: "Removing the previous site inside one transaction" },
    { id: "creating", label: "Creating documents", detail: "Writing responsive pages, data and interactions" },
    { id: "opening", label: "Opening Home", detail: "Refreshing the editor with the new site" },
];

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));

function templateThumbnailUrl(template: TemplateRegistryEntry, registryUrl: string) {
    if (!template.thumbnail) return undefined;
    try {
        const registryIsAbsolute = /^[a-z][a-z\d+.-]*:\/\//i.test(registryUrl);
        const resolved = new URL(template.thumbnail, new URL(registryUrl, "http://pagiera.local"));
        return registryIsAbsolute
            ? resolved.href
            : `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
        return template.thumbnail;
    }
}

export function TemplatesPanel({
    busy,
    registryUrl = DEFAULT_TEMPLATE_REGISTRY_URL,
    onInstall,
    onImport,
    exportUrl,
    onInstalled,
}: {
    busy: boolean;
    registryUrl?: string;
    onInstall: (templateId: string, fontFamily: string) => Promise<{ pageId?: string }>;
    /** Installs a bundle the author supplied from a file. */
    onImport?: (bundle: unknown) => Promise<{ pageId?: string }>;
    /** Where the current site can be downloaded as a bundle. */
    exportUrl?: (id: string) => string;
    onInstalled: (pageId?: string) => void | Promise<void>;
}) {
    const [templates, setTemplates] = useState(FALLBACK_TEMPLATE_REGISTRY.templates);
    const [status, setStatus] = useState<RegistryState>("loading");
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [installing, setInstalling] = useState<string>();
    const [installStage, setInstallStage] = useState<InstallStage>();
    const [pendingTemplate, setPendingTemplate] = useState<TemplateRegistryEntry>();
    const [installError, setInstallError] = useState("");
    const [selectedFont, setSelectedFont] = useState("");
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [busyImport, setBusyImport] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const providerFonts = usePagieraFonts();
    const [catalogRevision, setCatalogRevision] = useState(0);
    const preview = useTemplatePreview(pendingTemplate?.id, catalogRevision);
    const fontOptions = useMemo(() => {
        const options = [
            ...(pendingTemplate?.font?.url ? [{ label: `${pendingTemplate.font.title} · Template`, value: pendingTemplate.font.family }] : []),
            ...providerFonts.map((font) => ({ label: font.title, value: font.family })),
            ...FONT_STACKS.filter((font) => font.value !== "inherit"),
        ];
        return options.filter((option, index) => options.findIndex((candidate) => candidate.value === option.value) === index);
    }, [pendingTemplate, providerFonts]);

    const refresh = async (force = false) => {
        setStatus("loading");
        setError("");
        // Refreshing the catalog has to invalidate the previews too, or the
        // panel shows a new listing beside stale artwork.
        if (force) setCatalogRevision((current) => current + 1);
        const result = await loadTemplateRegistry(registryUrl, force);
        setTemplates(result.registry.templates);
        setStatus(result.source);
        if (result.error) setError(result.error instanceof Error ? result.error.message : "Could not refresh templates.");
    };

    useEffect(() => {
        void refresh();
    }, [registryUrl]);

    useEffect(() => {
        setPortalContainer(document.querySelector<HTMLElement>(".pg-editor"));
    }, []);

    useEffect(() => {
        if (!pendingTemplate) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !installing) setPendingTemplate(undefined);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [installing, pendingTemplate]);

    useEffect(() => {
        if (!pendingTemplate) return;
        const preferred = pendingTemplate.font
            ? providerFonts.find((font) => font.title.toLowerCase() === pendingTemplate.font?.title.toLowerCase() || font.family === pendingTemplate.font?.family)
            : undefined;
        setSelectedFont(
            pendingTemplate.font?.url
                ? pendingTemplate.font.family
                : preferred?.family ?? providerFonts[0]?.family ?? FONT_STACKS.find((font) => font.label === "Sans")?.value ?? "ui-sans-serif, system-ui, sans-serif",
        );
    }, [pendingTemplate, providerFonts]);

    const categories = useMemo(() => ["All", ...new Set(templates.map((template) => template.category))], [templates]);
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return templates.filter((template) =>
            (category === "All" || template.category === category) &&
            (!needle || [template.name, template.description, template.category, ...template.tags].some((value) => value.toLowerCase().includes(needle))),
        );
    }, [templates, category, query]);

    const importFile = async (file: File) => {
        setError("");
        setBusyImport(true);
        try {
            const text = await file.text();
            const bundle = JSON.parse(text) as { schemaVersion?: unknown; pages?: unknown };
            if (bundle?.schemaVersion !== 1 || !Array.isArray(bundle?.pages)) {
                throw new Error("That file is not a Pagiera template bundle.");
            }
            if (!onImport) throw new Error("Importing is not configured.");
            const result = await onImport(bundle);
            await onInstalled(result.pageId);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not read that file.");
        } finally {
            setBusyImport(false);
        }
    };

    const install = async (template: TemplateRegistryEntry) => {
        setInstalling(template.id);
        setInstallStage("fetching");
        setError("");
        setInstallError("");
        let cancelled = false;
        try {
            const timeline = (async () => {
                await wait(320);
                if (cancelled) return;
                setInstallStage("replacing");
                await wait(460);
                if (cancelled) return;
                setInstallStage("creating");
            })();
            const [result] = await Promise.all([onInstall(template.id, selectedFont), timeline]);
            setInstallStage("opening");
            await wait(420);
            await onInstalled(result.pageId);
            setPendingTemplate(undefined);
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : "Template installation failed.";
            setError(message);
            setInstallError(message);
        } finally {
            cancelled = true;
            setInstalling(undefined);
            setInstallStage(undefined);
        }
    };

    return (
        <div className="min-h-full bg-ed-surface">
            <div className="sticky top-0 z-10 border-b border-ed-border bg-ed-surface/90 backdrop-blur-xl">
                <div className="mx-auto max-w-[1480px] px-6 py-5 lg:px-10">
                <div className="flex items-start justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-ed-accent-soft text-ed-accent"><IconTemplate size={18} /></span>
                        <div className="min-w-0"><h2 className="text-[18px] font-semibold tracking-[-.025em] text-ed-text">Template marketplace</h2><p className="mt-1 text-[11px] text-ed-faint">Discover and install complete, responsive Pagiera sites.</p></div>
                    </div>
                    {exportUrl && (
                        <a
                            href={exportUrl("my-template")}
                            download
                            title="Download this site as a template bundle"
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ed-field px-3.5 text-[10px] font-medium text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text"
                        >
                            <IconDownload size={13} /> Export
                        </a>
                    )}
                    {onImport && (
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="application/json,.json"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    // Cleared so choosing the same file twice still fires.
                                    event.target.value = "";
                                    if (file) void importFile(file);
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={busyImport || busy}
                                title="Replace this site with a template bundle from a file"
                                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ed-field px-3.5 text-[10px] font-medium text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-40"
                            >
                                <IconUpload size={13} /> {busyImport ? "Importing…" : "Import"}
                            </button>
                        </>
                    )}
                    <button type="button" onClick={() => void refresh(true)} disabled={status === "loading"} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ed-field text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-40" title="Refresh template catalog">
                        <IconRefresh size={14} className={status === "loading" ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="mt-5 flex max-w-[720px] gap-2.5">
                    <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-ed-field px-4 transition-colors focus-within:ring-1 focus-within:ring-ed-accent">
                        <IconSearch size={13} className="shrink-0 text-ed-faint" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates, styles and categories…" className="min-w-0 flex-1 bg-transparent text-[11px] text-ed-text outline-none placeholder:text-ed-faint" />
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger aria-label="Template category" className="h-10 min-w-0 w-[150px] rounded-full px-4 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <div className="mt-3 flex max-w-[720px] items-center justify-between px-1 text-[9px] text-ed-faint"><span>{visible.length} templates available</span><span className="flex items-center gap-1.5"><i className={`size-1.5 rounded-full ${status === "local" || status === "network" ? "bg-emerald-400" : status === "loading" ? "animate-pulse bg-ed-accent" : "bg-amber-400"}`} />{status === "local" ? "Local templates" : status === "network" ? (registryUrl.includes("/api/pagiera/templates/") ? "Package catalog" : registryUrl.includes("raw.githubusercontent.com") ? "GitHub catalog" : "Custom catalog") : status === "cache" ? "Cached catalog" : status === "loading" ? "Refreshing" : "Offline catalog"}</span></div>
                </div>
            </div>

            <div className="mx-auto max-w-[1480px] px-6 py-7 lg:px-10">
                {error && <div className="mb-5 rounded-2xl bg-amber-400/8 px-4 py-3 text-[10px] leading-relaxed text-amber-200">{error}</div>}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {visible.map((template, index) => (
                        <motion.article key={template.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.035, 0.16), duration: 0.28 }} className="group overflow-hidden rounded-3xl bg-ed-subtle p-2 transition-colors hover:bg-ed-field">
                            <div className="relative aspect-[16/10] overflow-hidden rounded-[20px]" style={{ background: template.preview.background, color: template.preview.foreground }}>
                                <div className="absolute inset-0 opacity-75" style={{ background: `radial-gradient(circle at 90% 0%, ${template.preview.accent}66, transparent 55%)` }} /><span className="relative block px-6 pt-6 font-mono text-[8px] font-bold tracking-[.14em]" style={{ color: template.preview.accent }}>{template.preview.eyebrow}</span><p className="relative mt-12 max-w-[88%] px-6 text-[28px] font-semibold leading-[.92] tracking-[-.05em]">{template.preview.headline}</p>
                                {template.thumbnail && <img src={templateThumbnailUrl(template, registryUrl)} alt={`${template.name} template preview`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" onError={(event) => { event.currentTarget.hidden = true; }} />}
                                {template.featured && <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-semibold text-white backdrop-blur">Featured</span>}
                            </div>
                            <div className="p-3 pb-2">
                                <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="truncate text-[13px] font-semibold tracking-[-.015em] text-ed-text">{template.name}</h3><p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-[1.55] text-ed-muted">{template.description}</p></div><button type="button" disabled={busy || Boolean(installing)} onClick={() => { setError(""); setInstallError(""); setPendingTemplate(template); }} className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-ed-surface text-ed-text transition-colors hover:bg-ed-accent hover:text-white disabled:cursor-wait disabled:opacity-45" aria-label={`Review and install ${template.name}`}><IconArrowUpRight size={14} /></button></div>
                                <div className="mt-3 flex items-center gap-2 text-[9px] text-ed-faint"><span>{template.category}</span><i className="size-0.5 rounded-full bg-ed-faint" /><span>{template.pages.length} pages</span><i className="size-0.5 rounded-full bg-ed-faint" /><span>v{template.version}</span></div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {visible.length === 0 && <div className="rounded-3xl bg-ed-subtle px-5 py-20 text-center"><IconTemplate size={22} className="mx-auto text-ed-faint" /><p className="mt-3 text-[11px] font-medium text-ed-muted">No templates match this search.</p></div>}
            </div>

            {portalContainer && createPortal(
                <AnimatePresence>
                    {pendingTemplate && (
                        <motion.div
                            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget && !installing) setPendingTemplate(undefined);
                            }}
                        >
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="template-install-title"
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="flex max-h-[min(880px,94vh)] w-full max-w-[1180px] flex-col rounded-3xl bg-ed-surface p-2 text-ed-text shadow-2xl"
                            >
                                <div className="flex shrink-0 items-center gap-3 px-4 py-3.5">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ed-field text-ed-accent"><IconTemplate size={17} /></span>
                                    <div className="min-w-0 flex-1"><h3 id="template-install-title" className="truncate text-[14px] font-semibold">{installing ? "Installing" : "Install"} {pendingTemplate.name}</h3><p className="mt-1 text-[10px] text-ed-faint">{pendingTemplate.pages.length} editable pages · v{pendingTemplate.version} · ID {pendingTemplate.id}</p></div>
                                    <button type="button" aria-label="Close template confirmation" disabled={Boolean(installing)} onClick={() => setPendingTemplate(undefined)} className="flex size-8 select-none items-center justify-center rounded-xl text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text disabled:opacity-40"><IconX size={15} /></button>
                                </div>

                                <div className="grid min-h-0 flex-1 gap-2 px-1 pb-1 lg:grid-cols-[minmax(0,1fr)_380px]">
                                    <TemplatePreview
                                        pages={preview.pages}
                                        loading={preview.loading}
                                        error={preview.error}
                                        className="min-h-[320px] lg:min-h-0"
                                        controlsClassName="px-1"
                                    />

                                <div className="custom-scrollbar min-h-0 overflow-y-auto p-3 lg:pl-2">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {installing && installStage ? (
                                            <motion.div key="progress" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} aria-live="polite">
                                                <div className="overflow-hidden rounded-2xl bg-ed-subtle p-2">
                                                    {INSTALL_STEPS.map((step, index) => {
                                                        const activeIndex = INSTALL_STEPS.findIndex((item) => item.id === installStage);
                                                        const complete = index < activeIndex;
                                                        const active = index === activeIndex;
                                                        return <div key={step.id} className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${active ? "bg-ed-field-hover" : ""}`}>
                                                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${complete ? "bg-ed-accent text-white" : active ? "bg-ed-accent-soft text-ed-accent" : "bg-ed-field text-ed-faint"}`}>
                                                                {complete ? <IconCheck size={13} /> : active ? <span className="size-2 animate-pulse rounded-full bg-current" /> : <span className="text-[9px] font-semibold">{index + 1}</span>}
                                                            </span>
                                                            <span className="min-w-0 flex-1"><span className={`block text-[10px] font-semibold ${active || complete ? "text-ed-text" : "text-ed-faint"}`}>{step.label}</span><span className="mt-0.5 block truncate text-[9px] text-ed-faint">{step.detail}</span></span>
                                                            {active && <span className="text-[9px] font-medium text-ed-accent">Working…</span>}
                                                        </div>;
                                                    })}
                                                </div>
                                                <div className="mt-3 h-1 overflow-hidden rounded-full bg-ed-field"><motion.div className="h-full rounded-full bg-ed-accent" animate={{ width: `${((INSTALL_STEPS.findIndex((item) => item.id === installStage) + 1) / INSTALL_STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 220, damping: 28 }} /></div>
                                                <p className="mt-3 text-center text-[9px] text-ed-faint">Keep this window open while the project is replaced.</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                                                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-ed-subtle px-3.5 py-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-semibold text-ed-text">Site font</p>
                                                        <p className="mt-0.5 text-[9px] leading-relaxed text-ed-faint">
                                                            {pendingTemplate.font?.url
                                                                ? `${pendingTemplate.font.title} is bundled with the template and downloads automatically.`
                                                                : pendingTemplate.font && !providerFonts.some((font) => font.title.toLowerCase() === pendingTemplate.font?.title.toLowerCase() || font.family === pendingTemplate.font?.family)
                                                                    ? `${pendingTemplate.font.title} is not configured. Choose an available fallback.`
                                                                : "Applied to every page installed by this template."}
                                                        </p>
                                                    </div>
                                                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                                                        <SelectTrigger aria-label="Template site font" className="h-8 w-[170px] shrink-0 rounded-full px-3 text-[10px]"><SelectValue placeholder="Choose font" /></SelectTrigger>
                                                        <SelectContent>{fontOptions.map((font) => <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-start gap-3 rounded-xl bg-amber-400/[.07] px-3.5 py-3">
                                                    <IconAlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                                                    <p className="text-[10px] leading-relaxed text-ed-muted"><strong className="font-semibold text-ed-text">This replaces the current site.</strong> Existing pages and revision history will be removed after installation succeeds.</p>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-ed-subtle p-2">
                                                    {pendingTemplate.pages.slice(0, 6).map((page) => <span key={page} className="flex h-8 min-w-0 items-center gap-2 rounded-lg px-2.5 text-[10px] text-ed-text"><IconCheck size={12} className="shrink-0 text-ed-accent" /><span className="truncate">{page}</span></span>)}
                                                </div>

                                                {installError && <div className="mt-2 rounded-xl bg-red-400/8 px-3 py-2.5 text-[9px] leading-relaxed text-red-200">{installError}</div>}

                                                <div className="mt-4 flex justify-end gap-2 pt-1">
                                                    <button type="button" onClick={() => setPendingTemplate(undefined)} className="h-9 select-none rounded-xl px-4 text-[10px] font-medium text-ed-muted transition-colors hover:bg-ed-field-hover hover:text-ed-text">Cancel</button>
                                                    <button type="button" onClick={() => void install(pendingTemplate)} className="flex h-9 min-w-[132px] select-none items-center justify-center gap-2 rounded-xl bg-ed-accent px-4 text-[10px] font-semibold text-white transition hover:brightness-110">
                                                        <IconSparkles size={13} /> Install template
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                portalContainer,
            )}
        </div>
    );
}
