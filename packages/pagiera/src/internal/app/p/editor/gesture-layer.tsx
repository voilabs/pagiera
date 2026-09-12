import type React from "react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { resolveStyle } from "@/lib/editor/style";
import { displayName } from "@/lib/editor/tree";
import type { Breakpoint, CanvasElement, ResizeHandle } from "@/lib/editor/types";
import type { Cascade } from "@/lib/editor/cascade";
import type { DropPlan } from "./drop-target";

/** One distance readout, in client coordinates. */
export type Measure = {
    axis: "x" | "y";
    from: number;
    to: number;
    cross: number;
    label: number;
    edge: boolean;
};

export type GestureVisuals = {
    /** Where a drag would land: a slot, or a line between two siblings. */
    dropPlan: DropPlan | null;
    /** Distances from the dragged layer to what surrounds it. */
    measures: Measure[];
    /** The selected layer's box on screen, for its name and its handles. */
    selectionBox: DOMRect | null;
    /** The corner radius while it is being dragged, or nothing. */
    radiusPreview: number | null;
};

const NOTHING: GestureVisuals = {
    dropPlan: null,
    measures: [],
    selectionBox: null,
    radiusPreview: null,
};

export type GestureLayerHandle = {
    /** Merge new values in; re-renders this layer and nothing else. */
    set: (patch: Partial<GestureVisuals>) => void;
    get: () => GestureVisuals;
    clear: () => void;
};

/**
 * Everything the canvas draws *about* a gesture: where a drop would land, the
 * distances around what is moving, and the selected layer's name and handles.
 *
 * This layer owns that state, and the gesture writes to it through a ref. Held
 * in the editor's own state it re-rendered the whole canvas — a few hundred
 * layers across three artboards — for every frame of every drag, which left
 * the main thread blocked about half the time. Nothing here is part of the
 * document, so nothing here needs the document to re-render.
 */
export const GestureLayer = forwardRef<GestureLayerHandle, {
    selectedElement: CanvasElement | null;
    breakpoint: Breakpoint;
    cascade: Cascade;
    scale: number;
    effectsPreview: boolean;
    handleResizeMouseDown: (
        event: React.MouseEvent,
        handle: ResizeHandle,
        element: CanvasElement,
        breakpoint: Breakpoint,
    ) => void;
    beginRadiusDrag: (event: React.MouseEvent, element: CanvasElement, breakpoint: Breakpoint) => void;
}>(function GestureLayer(
    { selectedElement, breakpoint, cascade, scale, effectsPreview, handleResizeMouseDown, beginRadiusDrag },
    ref,
) {
    const [visuals, setVisuals] = useState<GestureVisuals>(NOTHING);
    useImperativeHandle(
        ref,
        () => ({
            set: (patch) => setVisuals((current) => ({ ...current, ...patch })),
            get: () => visuals,
            clear: () => setVisuals(NOTHING),
        }),
        [visuals],
    );

    const { dropPlan, measures, selectionBox, radiusPreview } = visuals;

    return (
        // One stacking context keeps every canvas control below the toolbar
        // and popup menus without clipping handles outside the selected frame.
        <div className="pointer-events-none fixed inset-0 z-30" data-canvas-gesture-layer>
                {/* Insertion line. Fixed positioning because the plan is measured
                    in screen coordinates, which already account for canvas zoom. */}
                {dropPlan?.slot && (
                    <div
                        className="pointer-events-none fixed z-[95] rounded-md border-2 border-dashed border-ed-accent bg-[var(--ed-accent-soft)]"
                        style={{
                            left: dropPlan.slot.x,
                            top: dropPlan.slot.y,
                            width: dropPlan.slot.w,
                            height: dropPlan.slot.h,
                        }}
                    />
                )}

                {!dropPlan?.slot && dropPlan?.indicator && (
                    <div
                        className="pointer-events-none fixed z-[95] rounded-full bg-ed-accent"
                        style={
                            dropPlan.indicator.vertical
                                ? { left: dropPlan.indicator.x - 1, top: dropPlan.indicator.y, width: 2, height: dropPlan.indicator.length }
                                : { left: dropPlan.indicator.x, top: dropPlan.indicator.y - 1, width: dropPlan.indicator.length, height: 2 }
                        }
                    />
                )}

                {/* The selection's own chrome: its name, and the four corners
                    that resize it. Drawn over the canvas in screen coordinates so
                    nothing between the layer and the viewport can clip it. */}
                {selectionBox && selectedElement && !effectsPreview && (
                    <>
                        {!selectedElement.parked && (
                            <span
                                className="pointer-events-none fixed z-[70] whitespace-nowrap text-[11px] font-medium leading-none text-ed-accent"
                                style={{ left: selectionBox.left, top: selectionBox.top - 16 }}
                            >
                                {displayName(selectedElement)}
                            </span>
                        )}
                        {/* The corner radius, dragged from just inside the corner
                            it rounds — and while it is moving, the number it is
                            setting, because a radius is a value you are aiming at
                            rather than a shape you eyeball. */}
                        {(() => {
                            const style = resolveStyle(selectedElement, breakpoint, cascade);
                            const limit = Math.min(selectionBox.width, selectionBox.height) / 2;
                            if (limit < 10 || ["Divider", "Embed"].includes(selectedElement.type)) return null;
                            const inset = Math.min(Math.max(style.radius * scale, 11), limit);
                            return (
                                <button
                                    type="button"
                                    aria-label="Drag to round the corners"
                                    title={`Corner radius · ${Math.round(style.radius)}`}
                                    onMouseDown={(event) => beginRadiusDrag(event, selectedElement, breakpoint)}
                                    className="pointer-events-auto fixed z-[71] flex cursor-nwse-resize items-center justify-center"
                                    style={{
                                        left: selectionBox.left + inset,
                                        top: selectionBox.top + inset,
                                        width: 16,
                                        height: 16,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    <span
                                        className="rounded-full border-ed-accent"
                                        style={{ width: 8, height: 8, background: "#fff", borderWidth: 1.5 }}
                                    />
                                    {radiusPreview !== null && (
                                        <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 rounded bg-ed-accent px-1.5 py-0.5 text-[10px] font-medium tabular-nums leading-none text-white">
                                            {radiusPreview}
                                        </span>
                                    )}
                                </button>
                            );
                        })()}

                        {([
                            { handle: "nw" as const, x: 0, y: 0, cursor: "nwse-resize" },
                            { handle: "ne" as const, x: 1, y: 0, cursor: "nesw-resize" },
                            { handle: "sw" as const, x: 0, y: 1, cursor: "nesw-resize" },
                            { handle: "se" as const, x: 1, y: 1, cursor: "nwse-resize" },
                        ]).map((corner) => (
                            <button
                                key={corner.handle}
                                type="button"
                                aria-label={`Resize ${corner.handle}`}
                                onMouseDown={(event) =>
                                    selectedElement && handleResizeMouseDown(event, corner.handle, selectedElement, breakpoint)
                                }
                                className="pointer-events-auto fixed z-[71] flex items-center justify-center"
                                style={{
                                    left: selectionBox.left + corner.x * selectionBox.width,
                                    top: selectionBox.top + corner.y * selectionBox.height,
                                    width: 18,
                                    height: 18,
                                    transform: "translate(-50%, -50%)",
                                    cursor: corner.cursor,
                                }}
                            >
                                <span
                                    className="border-ed-accent"
                                    style={{
                                        width: 8,
                                        height: 8,
                                        background: "#fff",
                                        borderWidth: 1,
                                        borderRadius: 1,
                                    }}
                                />
                            </button>
                        ))}
                    </>
                )}

                {/* Distances to whatever surrounds the layer being dragged.
                    Drawn over everything in screen coordinates, because what is
                    being measured is what the browser is rendering — a stacked
                    layer has no coordinates of its own to compute from. */}
                {measures.map((measure) => (
                    <div
                        key={`m-${measure.axis}-${Math.round(measure.from)}-${Math.round(measure.cross)}`}
                        className="pointer-events-none fixed z-[9999] flex items-center justify-center"
                        style={
                            measure.axis === "x"
                                ? {
                                      left: measure.from,
                                      top: measure.cross,
                                      width: Math.max(1, measure.to - measure.from),
                                      height: 1,
                                  }
                                : {
                                      left: measure.cross,
                                      top: measure.from,
                                      width: 1,
                                      height: Math.max(1, measure.to - measure.from),
                                  }
                        }
                    >
                        <span className={`absolute inset-0 bg-ed-accent ${measure.edge ? "opacity-45" : ""}`} />
                        {/* End caps, so a distance reads as a measurement rather
                            than as one more alignment line. */}
                        <span
                            className="absolute bg-ed-accent"
                            style={measure.axis === "x"
                                ? { left: 0, top: -3, width: 1, height: 7 }
                                : { left: -3, top: 0, width: 7, height: 1 }}
                        />
                        <span
                            className="absolute bg-ed-accent"
                            style={measure.axis === "x"
                                ? { right: 0, top: -3, width: 1, height: 7 }
                                : { left: -3, bottom: 0, width: 7, height: 1 }}
                        />
                        <span className="absolute whitespace-nowrap rounded bg-ed-accent px-1 py-px text-[9px] font-medium tabular-nums leading-none text-white">
                            {measure.label}
                        </span>
                    </div>
                ))}
        </div>
    );
});
