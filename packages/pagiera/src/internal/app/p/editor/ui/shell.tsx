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
}) {
    return (
        <div className="pg-editor flex h-screen w-full flex-col overflow-hidden bg-ed-surface font-sans text-xs text-ed-text selection:bg-[var(--ed-accent-soft)]">
            {/* The bar across the top: three groups, the middle one taking
                whatever the ends leave it. */}
            <header className="relative z-40 grid h-14 shrink-0 grid-cols-[260px_minmax(0,1fr)_288px] items-center gap-2 bg-ed-surface px-2">
                <div className="flex min-w-0 items-center gap-1 px-1">{toolbarLeft}</div>
                <div className="scrollbar-none flex h-full min-w-0 items-end justify-start gap-1 overflow-x-auto pl-6 pr-3 [&>*:not(nav)]:hidden">
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
                    className="hidden"
                >
                    {rail}
                </nav>

                {panelOpen && (
                    <aside className="pg-on-nav z-20 flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-transparent">
                        {panel}
                    </aside>
                )}

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-ed-canvas">
                    <div className="flex flex-1 overflow-hidden bg-ed-canvas">
                        <main
                            className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-ed-canvas"
                            onMouseDown={onCanvasBackgroundMouseDown}
                        >
                            {canvas}
                        </main>

                    </div>
                    {overlays}
                </div>

                {inspectorVisible && (
                    <aside aria-label="Inspector" className="z-10 flex w-[288px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-transparent">
                        {inspector}
                    </aside>
                )}
            </div>
        </div>
    );
}
