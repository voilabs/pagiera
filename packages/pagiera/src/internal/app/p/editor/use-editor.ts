"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { CanvasElement, DataSource, RootStyle } from "@/lib/editor/types";

const HISTORY_LIMIT = 100;
const AUTOSAVE_DELAY = 900;

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

/** Everything a page save writes; history and autosave track it as one unit. */
export type EditorDocument = {
    elements: CanvasElement[];
    rootStyle: RootStyle;
    dataSources: DataSource[];
};

export type EditorSaveResult =
    | { status: "saved"; version: number }
    | {
          status: "conflict";
          version: number;
          elements: CanvasElement[];
          rootStyle: RootStyle;
          dataSources: DataSource[];
      }
    | { status: "error"; message: string };

export type EditorDocumentSaver = (
    pageId: string,
    document: EditorDocument,
    expectedVersion: number,
) => Promise<EditorSaveResult>;

type Updater = EditorDocument | ((prev: EditorDocument) => EditorDocument);

type HistoryState = {
    past: EditorDocument[];
    present: EditorDocument;
    future: EditorDocument[];
    /**
     * Snapshot taken when a continuous gesture (drag, resize, slider) starts.
     * Without it every mousemove would land in the undo stack.
     */
    txBase: EditorDocument | null;
};

type Action =
    | { type: "set"; updater: Updater; transient?: boolean }
    | { type: "beginTx" }
    | { type: "endTx" }
    | { type: "undo" }
    | { type: "redo" }
    | { type: "reset"; document: EditorDocument };

function pushPast(past: EditorDocument[], entry: EditorDocument) {
    const next = [...past, entry];
    return next.length > HISTORY_LIMIT
        ? next.slice(next.length - HISTORY_LIMIT)
        : next;
}

function reducer(state: HistoryState, action: Action): HistoryState {
    switch (action.type) {
        case "set": {
            const next =
                typeof action.updater === "function"
                    ? action.updater(state.present)
                    : action.updater;
            if (next === state.present) return state;

            // Inside a transaction the intermediate values are not history
            // entries; `endTx` records the whole gesture as one step.
            if (action.transient || state.txBase) {
                return { ...state, present: next, future: [] };
            }
            return {
                past: pushPast(state.past, state.present),
                present: next,
                future: [],
                txBase: null,
            };
        }
        case "beginTx":
            return state.txBase ? state : { ...state, txBase: state.present };
        case "endTx": {
            if (!state.txBase) return state;
            if (state.txBase === state.present) return { ...state, txBase: null };
            return {
                past: pushPast(state.past, state.txBase),
                present: state.present,
                future: [],
                txBase: null,
            };
        }
        case "undo": {
            const previous = state.past.at(-1);
            if (!previous) return state;
            return {
                past: state.past.slice(0, -1),
                present: previous,
                future: [state.present, ...state.future],
                txBase: null,
            };
        }
        case "redo": {
            const [next, ...rest] = state.future;
            if (!next) return state;
            return {
                past: pushPast(state.past, state.present),
                present: next,
                future: rest,
                txBase: null,
            };
        }
        case "reset":
            return { past: [], present: action.document, future: [], txBase: null };
    }
}

export function useEditorDocument({
    pageId,
    initialDocument,
    initialVersion,
    saveDocument,
}: {
    pageId: string;
    initialDocument: EditorDocument;
    initialVersion: number;
    saveDocument: EditorDocumentSaver;
}) {
    const [state, dispatch] = useReducer(reducer, {
        past: [],
        present: initialDocument,
        future: [],
        txBase: null,
    });

    const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
    const [saveError, setSaveError] = useState<string | null>(null);

    const versionRef = useRef(initialVersion);
    const savedRef = useRef(initialDocument);
    const pendingRef = useRef(state.present);
    const inFlightRef = useRef(false);
    /** Set when an edit lands mid-request, so the save is retried on completion. */
    const queuedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activePageRef = useRef(pageId);

    pendingRef.current = state.present;

    // Swap only the document state when navigation changes the page. Keeping
    // the Editor component mounted preserves the selected side-panel tabs,
    // canvas view and chrome state.
    useEffect(() => {
        if (activePageRef.current === pageId) return;
        activePageRef.current = pageId;
        if (timerRef.current) clearTimeout(timerRef.current);
        versionRef.current = initialVersion;
        savedRef.current = initialDocument;
        pendingRef.current = initialDocument;
        queuedRef.current = false;
        inFlightRef.current = false;
        dispatch({ type: "reset", document: initialDocument });
        setSaveError(null);
        setSaveStatus("saved");
    }, [pageId]);

    const persist = useCallback(async () => {
        if (inFlightRef.current) {
            // Without this the edit would sit unsaved until the next keystroke
            // happened to schedule another debounce.
            queuedRef.current = true;
            return;
        }
        const requestPageId = pageId;
        const snapshot = pendingRef.current;
        if (snapshot === savedRef.current) return;

        inFlightRef.current = true;
        setSaveStatus("saving");
        try {
            const result = await saveDocument(pageId, snapshot, versionRef.current);

            if (activePageRef.current !== requestPageId) return;
            if (result.status === "saved") {
                versionRef.current = result.version;
                savedRef.current = snapshot;
                setSaveError(null);
                setSaveStatus(pendingRef.current === snapshot ? "saved" : "dirty");
            } else if (result.status === "conflict") {
                // Someone else won the write; adopt their state rather than
                // silently overwriting it.
                const adopted = {
                    elements: result.elements,
                    rootStyle: result.rootStyle,
                    dataSources: result.dataSources,
                };
                versionRef.current = result.version;
                savedRef.current = adopted;
                dispatch({ type: "reset", document: adopted });
                setSaveError("This page changed elsewhere and was reloaded.");
                setSaveStatus("conflict");
            } else {
                setSaveError(result.message);
                setSaveStatus("error");
            }
        } catch (error) {
            console.error(error);
            setSaveError("Could not reach the server.");
            setSaveStatus("error");
        } finally {
            if (activePageRef.current === requestPageId) inFlightRef.current = false;
        }
    }, [pageId, saveDocument]);

    // Debounced autosave; re-runs whenever the document changes.
    useEffect(() => {
        if (state.present === savedRef.current) return;
        setSaveStatus((current) => (current === "saving" ? current : "dirty"));

        timerRef.current = setTimeout(() => void persist(), AUTOSAVE_DELAY);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [state.present, persist]);

    // Drain an edit that arrived while the previous save was in flight.
    useEffect(() => {
        if (saveStatus === "saving" || !queuedRef.current) return;
        queuedRef.current = false;
        if (pendingRef.current !== savedRef.current) void persist();
    }, [saveStatus, persist]);

    // Guard against closing the tab with work that never reached the server.
    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (pendingRef.current === savedRef.current) return;
            event.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    const setDocument = useCallback(
        (updater: Updater, options?: { transient?: boolean }) =>
            dispatch({ type: "set", updater, transient: options?.transient }),
        [],
    );

    const setElements = useCallback(
        (
            updater: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[]),
            options?: { transient?: boolean },
        ) =>
            setDocument((doc) => {
                const elements =
                    typeof updater === "function" ? updater(doc.elements) : updater;
                return elements === doc.elements ? doc : { ...doc, elements };
            }, options),
        [setDocument],
    );

    const setRootStyle = useCallback(
        (patch: Partial<RootStyle>) =>
            setDocument((doc) => ({
                ...doc,
                rootStyle: { ...doc.rootStyle, ...patch },
            })),
        [setDocument],
    );

    const setDataSources = useCallback(
        (updater: DataSource[] | ((prev: DataSource[]) => DataSource[])) =>
            setDocument((doc) => {
                const dataSources =
                    typeof updater === "function" ? updater(doc.dataSources) : updater;
                return dataSources === doc.dataSources ? doc : { ...doc, dataSources };
            }),
        [setDocument],
    );

    return {
        elements: state.present.elements,
        rootStyle: state.present.rootStyle,
        dataSources: state.present.dataSources,
        setDataSources,
        setElements,
        setRootStyle,
        beginTransaction: useCallback(() => dispatch({ type: "beginTx" }), []),
        endTransaction: useCallback(() => dispatch({ type: "endTx" }), []),
        undo: useCallback(() => dispatch({ type: "undo" }), []),
        redo: useCallback(() => dispatch({ type: "redo" }), []),
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        saveStatus,
        saveError,
        isDirty: state.present !== savedRef.current,
        saveNow: useCallback(() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            void persist();
        }, [persist]),
    };
}
