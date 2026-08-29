"use client";

import { IconDatabase, IconPlus, IconTrash } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { newId } from "@/lib/editor/tree";
import type { DataSource } from "@/lib/editor/types";
import { DataSourceModal, type SourcePreviewer } from "./data-modal";

export type SourceSample = { keys: string[]; rows: Array<Record<string, unknown>> };

/**
 * The rail lists sources and their state; editing one opens the modal, where
 * the URL, query, headers and response all fit on screen at once.
 */
export function DataPanel({
    sources,
    samples,
    onChange,
    onSample,
    preview,
}: {
    sources: DataSource[];
    samples: Record<string, SourceSample>;
    onChange: (updater: (prev: DataSource[]) => DataSource[]) => void;
    onSample: (sourceId: string, sample: SourceSample) => void;
    preview: SourcePreviewer;
}) {
    const [openId, setOpenId] = useState<string | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const open = sources.find((source) => source.id === openId);

    useEffect(() => {
        setPortalContainer(document.querySelector<HTMLElement>(".pg-editor"));
    }, []);

    const add = () => {
        const source: DataSource = {
            id: newId(),
            name: `Source ${sources.length + 1}`,
            url: "",
            path: "",
            params: [],
            headers: [],
        };
        onChange((prev) => [...prev, source]);
        setOpenId(source.id);
    };

    return (
        <div className="flex flex-col gap-3 p-4">
            <p className="text-[11px] leading-relaxed text-ed-muted">
                Point a source at a JSON endpoint. Use <b>Request</b> for one object
                or <b>Repeat</b> for an array, then bind their children to fields.
            </p>

            <div className="flex flex-col gap-2">
                {sources.map((source) => {
                    const sample = samples[source.id];
                    const host = hostOf(source.url);

                    return (
                        <motion.div
                            key={source.id}
                            layout
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group flex items-center gap-2.5 rounded-xl border border-ed-border p-2.5 transition-colors hover:border-ed-accent/50"
                        >
                            <button
                                type="button"
                                onClick={() => setOpenId(source.id)}
                                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                            >
                                <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        sample
                                            ? "bg-emerald-500/15 text-emerald-500"
                                            : "bg-ed-field text-ed-faint"
                                    }`}
                                >
                                    <IconDatabase size={15} />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-[12px] font-medium text-ed-text">
                                        {source.name}
                                    </span>
                                    <span className="truncate text-[10px] text-ed-faint">
                                        {sample
                                            ? `${sample.rows.length} rows · ${sample.keys.length} fields`
                                            : host || "No URL yet"}
                                    </span>
                                </span>
                            </button>

                            <button
                                type="button"
                                aria-label={`Remove ${source.name}`}
                                onClick={() =>
                                    onChange((prev) => prev.filter((s) => s.id !== source.id))
                                }
                                className="shrink-0 rounded-md p-1.5 text-ed-faint opacity-0 transition-all hover:bg-ed-field hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                            >
                                <IconTrash size={13} />
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={add}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ed-border py-2.5 text-[11px] text-ed-muted transition-colors hover:border-ed-accent hover:text-ed-text"
            >
                <IconPlus size={14} />
                Add a data source
            </button>

            {portalContainer && createPortal(
                <AnimatePresence>
                    {open && (
                        <DataSourceModal
                            key={open.id}
                            source={open}
                            sample={samples[open.id]}
                            onChange={(changes) =>
                                onChange((prev) =>
                                    prev.map((s) => (s.id === open.id ? { ...s, ...changes } : s)),
                                )
                            }
                            onSample={(sample) => onSample(open.id, sample)}
                            onClose={() => setOpenId(null)}
                            preview={preview}
                        />
                    )}
                </AnimatePresence>,
                portalContainer,
            )}
        </div>
    );
}

function hostOf(url: string) {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
}
