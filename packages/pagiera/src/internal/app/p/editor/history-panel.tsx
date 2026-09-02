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
                <p className="rounded-2xl border border-ed-border bg-ed-subtle p-3 text-[9px] leading-relaxed text-ed-faint">
                    History needs a <code>listRevisions</code> adapter from the host app.
                </p>
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="mb-3 rounded-2xl border border-ed-border bg-ed-subtle p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ed-text">
                    <IconHistory size={13} /> History
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-ed-faint">
                    Every save keeps a version. Restoring brings it back as your draft —
                    visitors see it only after you publish.
                </p>
            </div>

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

            <div className="flex flex-col gap-1.5">
                {(revisions ?? []).map((revision) => {
                    const isCurrent = revision.version === currentVersion;
                    return (
                        <div
                            key={revision.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-ed-border bg-ed-field px-2.5 py-2"
                        >
                            <span className="min-w-0">
                                <span className="block text-[10px] font-medium text-ed-text">
                                    Version {revision.version}
                                    {isCurrent && (
                                        <span className="ml-1.5 text-[9px] text-ed-faint">current</span>
                                    )}
                                </span>
                                <span className="block text-[9px] text-ed-faint">
                                    {formatWhen(revision.createdAt)}
                                </span>
                            </span>
                            <button
                                type="button"
                                disabled={isCurrent || busyId === revision.id || !restoreRevision}
                                onClick={() => void restore(revision)}
                                className="flex shrink-0 items-center gap-1 rounded-full bg-ed-subtle px-2.5 py-1.5 text-[9px] text-ed-muted hover:text-ed-text disabled:opacity-30"
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
                <p className="mt-3 rounded-lg bg-red-500/10 px-2.5 py-2 text-[9px] leading-relaxed text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}
