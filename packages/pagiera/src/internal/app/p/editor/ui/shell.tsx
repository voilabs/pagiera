import type React from "react";

/**
 * Where everything sits.
 *
 * The editor's arrangement lives here and nowhere else: one screen's worth of
 * markup that says the toolbar spans the top, the rail and the open panel run
 * down the left, the canvas takes what is left, and the inspector holds the
 * right edge. Every wrapper that decides a width, a height, a border or an
 * order is in this file — the bar, the rail, the panel, the canvas, the
 * inspector — so rearranging the editor is editing one screen of markup rather
 * than hunting through the four thousand lines of behaviour that fill it.
 *
 * The slots are rendered nodes, so nothing here knows what a panel or a canvas
 * actually is. It only knows where they go.
 */
export function EditorShell({
    toolbarLeft,
    toolbarCenter,
    toolbarRight,
    rail,
    panel,
    panelOpen = false,
    canvas,
    onCanvasBackgroundMouseDown,
    inspector,
    inspectorVisible = true,
    overlays,
    dock,
    page,
    focused = false,
}: {
    /** The bar's left end: where you are, and the way to everywhere else. */
    toolbarLeft: React.ReactNode;
    /** The middle of the bar: the open documents, and the canvas controls. */
    toolbarCenter?: React.ReactNode;
    /** The right end: preview, publish, and the panel toggles. */
    toolbarRight?: React.ReactNode;
    /** The icon column that says which panel is open. */
    rail: React.ReactNode;
    /** What the rail points at. */
    panel?: React.ReactNode;
    /** Whether the panel column takes up room at all. */
    panelOpen?: boolean;
    /** The artboards. */
    canvas: React.ReactNode;
    /** Pressing the empty canvas around the artboards — clears the selection. */
    onCanvasBackgroundMouseDown?: React.MouseEventHandler<HTMLElement>;
    /** The properties column on the right. */
    inspector?: React.ReactNode;
    /** Workspace screens such as Settings and Templates do not use an inspector. */
    inspectorVisible?: boolean;
    /**
     * Menus, dialogs and drag feedback: anything that floats over the canvas
     * rather than taking space from it.
     */
    overlays?: React.ReactNode;
    /**
     * The canvas tools — what a drag does, which artboard, zoom, undo — in
     * one pill floating at the foot of the canvas, where the hand already is,
     * instead of a strip of buttons competing with the document tabs.
     */
    dock?: React.ReactNode;
    /**
     * A full workspace page — Settings, Templates. While one is open the
     * panel, the canvas and the inspector step out of the way entirely; they
     * stay mounted so coming back finds the canvas exactly where it was.
     */
    page?: React.ReactNode;
    /**
     * Focus mode: the editor covers the whole window, over whatever the host
     * app draws around it — its sidebar, its header, its footer. Below the
     * layer menu (z 1000), which is portalled to the body.
     */
    focused?: boolean;
}) {
    const hidden = page ? "hidden" : "";
    return (
        // `pg-scope` is the box the editor's stylesheet is confined to (see
        // scripts/build-full-css.mjs); it takes no space of its own.
        <div className="pg-scope" style={{ display: "contents" }}>
        <div className={`pg-editor flex w-full flex-col overflow-hidden bg-ed-frame font-sans text-xs text-ed-text selection:bg-[var(--ed-accent-soft)] ${focused ? "fixed inset-0 z-[900] h-dvh" : "h-screen"}`}>
            {/* The bar across the top: three groups, the middle one taking
                whatever the ends leave it. */}
            <header className="relative z-40 grid h-12 shrink-0 grid-cols-[260px_minmax(0,1fr)_288px] items-center gap-2 bg-ed-frame px-2">
                <div className="flex min-w-0 items-center gap-1 px-1">{toolbarLeft}</div>
                <div className="scrollbar-none flex h-full min-w-0 items-end justify-start gap-1 overflow-x-auto px-1">
                    {toolbarCenter}
                </div>
                <div className="flex min-w-0 items-center justify-end gap-1.5 px-1">{toolbarRight}</div>
            </header>

            {/* Everything below the bar, in one row. */}
            <div className="flex min-h-0 flex-1 gap-2 overflow-hidden px-2 pb-2">
                {/* The navigation column runs the full height of the window: it
                    is the frame the editor sits in, not a panel inside it. The
                    rail says which panel is open; the column beside it is that
                    panel. Two narrow things with one job each, rather than one
                    wide column carrying navigation and content at once. */}
                <nav
                    aria-label="Editor panels"
                    className="pg-on-nav z-50 flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-2xl bg-ed-surface py-2.5 shadow-[var(--ed-panel-shadow)]"
                >
                    {rail}
                </nav>

                {page && (
                    <section className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-ed-surface shadow-[var(--ed-panel-shadow)]">
                        {page}
                    </section>
                )}

                {panelOpen && (
                    <aside className={`pg-on-nav z-20 flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl bg-ed-surface shadow-[var(--ed-panel-shadow)] ${hidden}`}>
                        {panel}
                    </aside>
                )}

                <div className={`relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-ed-canvas shadow-[inset_0_0_0_1px_var(--ed-border)] ${hidden}`}>
                    <div className="flex flex-1 overflow-hidden">
                        <main
                            className="pg-canvas-well relative flex min-w-0 flex-1 flex-col overflow-hidden"
                            onMouseDown={onCanvasBackgroundMouseDown}
                        >
                            {canvas}
                        </main>

                    </div>
                    {dock && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
                            <div className="pg-dock scrollbar-none pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-[color-mix(in_srgb,var(--ed-menu)_90%,transparent)] p-1.5 shadow-[var(--ed-dock-shadow)] backdrop-blur-xl scrollbar-none">
                                {dock}
                            </div>
                        </div>
                    )}
                    {overlays}
                </div>

                {inspectorVisible && !page && (
                    <aside aria-label="Inspector" className="z-10 flex w-[288px] shrink-0 flex-col overflow-hidden rounded-2xl bg-ed-surface shadow-[var(--ed-panel-shadow)]">
                        {inspector}
                    </aside>
                )}
            </div>
        </div>
        </div>
    );
}
