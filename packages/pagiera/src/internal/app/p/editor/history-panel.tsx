"use client";

import { IconHistory, IconLoader2, IconRotate } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

/**
 * The page's saved versions.
 *
 * Every save writes one, and the store keeps the most recent few. Restoring is
 * itself a save, so the version an author restores *away* from is written to
 * the history first — stepping back is never a one-way door.
 *
 * The list shows drafts, not publications: bringing an old layout back does not
 * put it in front of visitors until the author publishes.
 */

export type Revision = {
    id: string;
    version: number;
    createdAt: string;
};

const formatWhen = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export function HistoryPanel({
    pageId,
    currentVersion,
    listRevisions,
    restoreRevision,
    onRestored,
}: {
    pageId: string;
    currentVersion?: number;
    listRevisions?: (pageId: string) => Promise<unknown>;
    restoreRevision?: (pageId: string, revisionId: string) => Promise<unknown>;
    onRestored?: () => void;
}) {
    const [revisions, setRevisions] = useState<Revision[] | undefined>(undefined);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    const load = useCallback(async () => {
        if (!listRevisions) {
            setRevisions([]);
            return;
        }
        try {
            const result = (await listRevisions(pageId)) as { revisions?: Revision[] };
            setRevisions(result?.revisions ?? []);
            setError("");
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load history.");
            setRevisions([]);
        }
    }, [listRevisions, pageId]);

    useEffect(() => {
        void load();
    }, [load]);

    const restore = async (revision: Revision) => {
        if (!restoreRevision) return;
        setBusyId(revision.id);
        setError("");
        try {
            await restoreRevision(pageId, revision.id);
            // The canvas holds the old document in memory; the host reloads it.
            onRestored?.();
            await load();
        } catch (restoreError) {
            setError(
                restoreError instanceof Error ? restoreError.message : "Could not restore.",
            );
        } finally {
            setBusyId("");
        }
    };

    if (!listRevisions) {
        return (
            <div className="p-3">
                <p className="rounded-[18px] bg-ed-subtle p-3 text-[10px] leading-relaxed text-ed-faint">
                    History needs a <code>listRevisions</code> adapter from the host app.
                </p>
            </div>
        );
    }

    return (
        <div className="px-2 py-3">
            {/* The panel header already names it; this only says how it works. */}
            <p className="mb-3 px-2 text-[12px] leading-relaxed text-ed-muted">
                Every save keeps a version. Restoring brings it back as your draft —
                visitors see it only after you publish.
            </p>

            {revisions === undefined && (
                <div className="flex justify-center py-6">
                    <IconLoader2 size={16} className="animate-spin text-ed-faint" />
                </div>
            )}

            {revisions?.length === 0 && !error && (
                <p className="py-6 text-center text-[10px] text-ed-faint">
                    No saved versions yet.
                </p>
            )}

            <div className="flex flex-col gap-0.5">
                {(revisions ?? []).map((revision) => {
                    const isCurrent = revision.version === currentVersion;
                    return (
                        <div
                            key={revision.id}
                            className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--ed-nav-hover)]"
                        >
                            <span className="min-w-0">
                                <span className="block text-[13px] font-medium text-ed-text">
                                    Version {revision.version}
                                    {isCurrent && (
                                        <span className="ml-1.5 rounded-full bg-[var(--ed-accent-soft)] px-1.5 py-px text-[11px] font-medium text-ed-accent">Current</span>
                                    )}
                                </span>
                                <span className="block text-[12px] text-ed-faint">
                                    {formatWhen(revision.createdAt)}
                                </span>
                            </span>
                            <button
                                type="button"
                                disabled={isCurrent || busyId === revision.id || !restoreRevision}
                                onClick={() => void restore(revision)}
                                className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-ed-muted opacity-0 shadow-[inset_0_0_0_1px_var(--ed-border-strong)] transition-opacity hover:text-ed-text focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-0"
                            >
                                {busyId === revision.id ? (
                                    <IconLoader2 size={10} className="animate-spin" />
                                ) : (
                                    <IconRotate size={10} />
                                )}
                                Restore
                            </button>
                        </div>
                    );
                })}
            </div>

            {error && (
                <p className="mt-3 rounded-lg bg-red-500/10 px-2.5 py-2 text-[10px] leading-relaxed text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}
