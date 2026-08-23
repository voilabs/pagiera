"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_TEMPLATE_REGISTRY_URL } from "@/lib/editor/template-registry";
import type { CanvasElement, RootStyle } from "@/lib/editor/types";
import { RenderedPage } from "@/lib/render/page-render";

export type TemplatePreviewPage = {
    name: string;
    slug: string;
    elements: CanvasElement[];
    rootStyle: RootStyle;
};

export type PreviewDevice = { id: string; name: string; width: number };

const FALLBACK_DEVICES: PreviewDevice[] = [
    { id: "desktop", name: "Desktop", width: 1440 },
    { id: "tablet", name: "Tablet", width: 834 },
    { id: "mobile", name: "Mobile", width: 390 },
];

/** The preview endpoint sits beside the registry on the package's own API. */
function previewUrlFor(templateId: string) {
    return `${DEFAULT_TEMPLATE_REGISTRY_URL.replace(/registry\.json$/, "")}${encodeURIComponent(templateId)}/preview`;
}

/**
 * Loads a template's pages without installing them.
 *
 * Bundles are a few hundred kilobytes and the server caches them, so a plain
 * fetch per opened template is cheap; results are kept for the session so
 * flicking between devices and pages never refetches.
 */
export function useTemplatePreview(templateId: string | undefined) {
    const [pages, setPages] = useState<TemplatePreviewPage[]>();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const cache = useRef(new Map<string, TemplatePreviewPage[]>());

    useEffect(() => {
        if (!templateId) return;
        const cached = cache.current.get(templateId);
        if (cached) {
            setPages(cached);
            setError("");
            return;
        }

        let active = true;
        setLoading(true);
        setError("");
        setPages(undefined);

        fetch(previewUrlFor(templateId), { headers: { Accept: "application/json" } })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload?.error ?? `Preview returned ${response.status}.`);
                if (!Array.isArray(payload?.pages) || payload.pages.length === 0) {
                    throw new Error("This template has no previewable pages.");
                }
                return payload.pages as TemplatePreviewPage[];
            })
            .then((result) => {
                cache.current.set(templateId, result);
                if (!active) return;
                setPages(result);
            })
            .catch((reason: unknown) => {
                if (!active) return;
                setError(reason instanceof Error ? reason.message : "Could not load the preview.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [templateId]);

    return { pages, loading, error };
}

/** Device list taken from the template's own breakpoints where it defines them. */
export function devicesFor(page: TemplatePreviewPage | undefined): PreviewDevice[] {
    const defined = page?.rootStyle.breakpoints;
    if (!defined?.length) return FALLBACK_DEVICES;
    return [...defined]
        .sort((a, b) => b.width - a.width)
        .map((item) => ({ id: item.id, name: item.name, width: item.width }));
}

/**
 * Renders one template page exactly as the published site would.
 *
 * The page goes into an iframe rather than a scaled `div` because the
 * generated stylesheet carries real media queries: they resolve against the
 * frame's own viewport, so a 390px device column genuinely lays out as mobile
 * instead of inheriting the editor window's width. The frame is then scaled to
 * fit the available space.
 *
 * The sandbox withholds `allow-scripts` on purpose. Template bundles come from
 * whatever registry the operator configured, and nothing here needs to run:
 * the entrance animations hide content only after their script adds
 * `pg-ready`, so without it every element simply renders in its final visible
 * state.
 */
export function TemplatePreviewStage({
    page,
    width,
    className = "",
}: {
    page: TemplatePreviewPage;
    width: number;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [body, setBody] = useState<HTMLElement | null>(null);
    const [box, setBox] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => {
            setBox({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const scale = box.width > 0 ? Math.min(1, box.width / width) : 0;

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {scale > 0 && (
                <iframe
                    // Remounting per device keeps the frame's viewport honest;
                    // resizing an existing one can leave stale media state.
                    key={`${page.slug}:${width}`}
                    title={`${page.name} preview`}
                    sandbox="allow-same-origin"
                    srcDoc="<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>"
                    onLoad={(event) => setBody(event.currentTarget.contentDocument?.body ?? null)}
                    style={{
                        width,
                        height: box.height / scale,
                        border: 0,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                    }}
                />
            )}
            {body &&
                createPortal(
                    <RenderedPage elements={page.elements} rootStyle={page.rootStyle} />,
                    body,
                )}
        </div>
    );
}

/** Device and page switchers plus the stage, as one self-contained surface. */
export function TemplatePreview({
    pages,
    loading,
    error,
    className = "",
    controlsClassName = "",
}: {
    pages: TemplatePreviewPage[] | undefined;
    loading: boolean;
    error: string;
    className?: string;
    controlsClassName?: string;
}) {
    const [slug, setSlug] = useState<string>();
    const [deviceId, setDeviceId] = useState<string>();

    const page = useMemo(
        () => pages?.find((item) => item.slug === slug) ?? pages?.[0],
        [pages, slug],
    );
    const devices = useMemo(() => devicesFor(page), [page]);
    const device = devices.find((item) => item.id === deviceId) ?? devices[0];

    // A template's breakpoint ids need not survive from one template to the
    // next, so an unknown selection falls back to the widest device.
    useEffect(() => {
        if (deviceId && !devices.some((item) => item.id === deviceId)) setDeviceId(undefined);
    }, [deviceId, devices]);

    return (
        <div className={`flex min-h-0 flex-col ${className}`}>
            <div className={`flex shrink-0 items-center gap-2 ${controlsClassName}`}>
                <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-none">
                    {(pages ?? []).map((item) => (
                        <button
                            key={item.slug}
                            type="button"
                            onClick={() => setSlug(item.slug)}
                            className={`h-7 shrink-0 rounded-full px-3 text-[10px] font-medium transition-colors ${
                                item.slug === page?.slug
                                    ? "bg-ed-field-hover text-ed-text"
                                    : "text-ed-faint hover:text-ed-muted"
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
                <div className="flex shrink-0 gap-1 rounded-full bg-ed-subtle p-1">
                    {devices.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setDeviceId(item.id)}
                            title={`${item.name} · ${item.width}px`}
                            className={`h-6 rounded-full px-2.5 text-[9px] font-medium transition-colors ${
                                item.id === device?.id
                                    ? "bg-ed-surface text-ed-text"
                                    : "text-ed-faint hover:text-ed-muted"
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-ed-subtle">
                {page && device && (
                    <TemplatePreviewStage page={page} width={device.width} className="h-full w-full" />
                )}
                {(loading || error || !page) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ed-subtle px-6 text-center">
                        {loading ? (
                            <span className="flex items-center gap-2 text-[10px] text-ed-faint">
                                <span className="size-1.5 animate-pulse rounded-full bg-ed-accent" />
                                Loading preview…
                            </span>
                        ) : (
                            <p className="max-w-[280px] text-[10px] leading-relaxed text-ed-muted">
                                {error || "This template cannot be previewed."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
