"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

export const MIN_ZOOM = 10;
export const MAX_ZOOM = 400;
/** Presets the +/- buttons step through. */
const ZOOM_STEPS = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400];

const clamp = (value: number) =>
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));

/**
 * Photoshop-style canvas navigation: Ctrl/⌘ + wheel zooms toward the pointer,
 * space-drag and middle-drag pan, plain wheel scrolls.
 *
 * Zooming has to keep the point under the cursor fixed, which means adjusting
 * the scroll offset in the same frame the scale changes — hence the anchor
 * captured before the state update and applied in a layout effect.
 */
export function useCanvasView(contentWidth: number) {
    const viewportRef = useRef<HTMLDivElement>(null);
    /** The scaled frame; all anchoring maths is relative to this box. */
    const frameRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoomState] = useState(100);
    /**
     * The canvas fits itself to the space available until the author zooms by
     * hand — otherwise a 1280 frame in a narrower window overflows and pins
     * itself to the left edge instead of sitting centred.
     */
    const autoFitRef = useRef(true);
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;

    const anchorRef = useRef<{
        clientX: number;
        clientY: number;
        cx: number;
        cy: number;
    } | null>(null);

    /**
     * Brings the frames back into view. The scroll content carries a wide
     * gutter so the canvas can be panned freely, which means the natural
     * scroll origin is empty space rather than the page.
     */
    const recenter = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;

        const frame = frameRef.current;
        // Sit just above the frame rather than centring vertically: a tall
        // page should open at its top, not its middle.
        viewport.scrollTop = frame
            ? Math.max(0, frame.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - 48)
            : (viewport.scrollHeight - viewport.clientHeight) / 2;
    }, []);

    const zoomAt = useCallback(
        (next: number, clientX: number, clientY: number) => {
            const frame = frameRef.current;
            if (frame) {
                const rect = frame.getBoundingClientRect();
                const scale = zoomRef.current / 100;
                anchorRef.current = {
                    clientX,
                    clientY,
                    // Where the cursor sits in unscaled canvas coordinates.
                    cx: (clientX - rect.left) / scale,
                    cy: (clientY - rect.top) / scale,
                };
            }
            autoFitRef.current = false;
            setZoomState(clamp(next));
        },
        [],
    );

    /** Zoom from the centre of the viewport, for buttons and shortcuts. */
    const zoomTo = useCallback(
        (next: number) => {
            const viewport = viewportRef.current;
            if (!viewport) {
                autoFitRef.current = false;
                setZoomState(clamp(next));
                return;
            }
            const rect = viewport.getBoundingClientRect();
            zoomAt(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
        },
        [zoomAt],
    );

    const stepZoom = useCallback(
        (direction: 1 | -1) => {
            const current = zoomRef.current;
            const next =
                direction === 1
                    ? ZOOM_STEPS.find((step) => step > current + 0.5)
                    : [...ZOOM_STEPS].reverse().find((step) => step < current - 0.5);
            zoomTo(next ?? current);
        },
        [zoomTo],
    );

    /** Scales the frame down until it fits the viewport, never past 100%. */
    const fitNow = useCallback(
        (width: number, padding = 80) => {
            const viewport = viewportRef.current;
            if (!viewport || width <= 0) return;
            const available = viewport.clientWidth - padding;
            setZoomState(clamp(Math.min(100, (available / width) * 100)));
        },
        [],
    );

    /** Explicit "fit" also re-arms auto-fitting. */
    const zoomToFit = useCallback(
        (width: number = contentWidth, padding = 80) => {
            autoFitRef.current = true;
            fitNow(width, padding);
            // The layout effect below recentres once the new zoom is applied.
        },
        [contentWidth, fitNow],
    );

    // Re-fit while auto-fitting is armed: on mount, when the frame width
    // changes with the breakpoint, and whenever the panels resize the canvas.
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const refit = () => {
            if (!autoFitRef.current) return;
            fitNow(contentWidth);
            recenter();
        };
        refit();
        const observer = new ResizeObserver(refit);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [contentWidth, fitNow, recenter]);

    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        anchorRef.current = null;

        // An auto-fit has no anchor to preserve: put the frames back in view.
        if (!anchor) {
            if (autoFitRef.current) recenter();
            return;
        }

        const viewport = viewportRef.current;
        const frame = frameRef.current;
        if (!viewport || !frame) return;

        const rect = frame.getBoundingClientRect();
        const scale = zoom / 100;
        // Where the frame's top-left must land for the anchored point to stay
        // under the cursor.
        viewport.scrollLeft += rect.left - (anchor.clientX - anchor.cx * scale);
        viewport.scrollTop += rect.top - (anchor.clientY - anchor.cy * scale);
    }, [zoom, recenter]);

    // Ctrl/⌘ + wheel zooms; a bare wheel keeps the container's native scroll.
    // Trackpad pinch arrives as a wheel event with ctrlKey already set.
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            const factor = Math.exp(-event.deltaY / 300);
            zoomAt(zoomRef.current * factor, event.clientX, event.clientY);
        };

        viewport.addEventListener("wheel", onWheel, { passive: false });
        return () => viewport.removeEventListener("wheel", onWheel);
    }, [zoomAt]);

    /* ---------------------------------------------------------------- panning */

    const [spaceHeld, setSpaceHeld] = useState(false);
    const spaceHeldRef = useRef(false);
    spaceHeldRef.current = spaceHeld;

    const [isPanning, setIsPanning] = useState(false);
    const panRef = useRef<{
        x: number;
        y: number;
        left: number;
        top: number;
    } | null>(null);

    useEffect(() => {
        const isTyping = (target: EventTarget | null) => {
            const node = target as HTMLElement | null;
            return (
                !!node &&
                (node.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName))
            );
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space" || isTyping(event.target)) return;
            // Space would otherwise scroll the page.
            event.preventDefault();
            setSpaceHeld(true);
        };
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space") setSpaceHeld(false);
        };
        // A key-up that happens while the tab is blurred never arrives, which
        // would leave the canvas stuck in pan mode.
        const onBlur = () => setSpaceHeld(false);

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    /**
     * Call from the canvas' mousedown. Returns true when the gesture was taken
     * over for panning, so the caller skips selection and dragging.
     */
    const tryBeginPan = useCallback((event: React.MouseEvent) => {
        const viewport = viewportRef.current;
        if (!viewport) return false;

        const wantsPan =
            event.button === 1 || (event.button === 0 && spaceHeldRef.current);
        if (!wantsPan) return false;

        event.preventDefault();
        event.stopPropagation();
        panRef.current = {
            x: event.clientX,
            y: event.clientY,
            left: viewport.scrollLeft,
            top: viewport.scrollTop,
        };
        setIsPanning(true);
        return true;
    }, []);

    useEffect(() => {
        if (!isPanning) return;

        const onMove = (event: MouseEvent) => {
            const viewport = viewportRef.current;
            const start = panRef.current;
            if (!viewport || !start) return;
            viewport.scrollLeft = start.left - (event.clientX - start.x);
            viewport.scrollTop = start.top - (event.clientY - start.y);
        };
        const onUp = () => {
            panRef.current = null;
            setIsPanning(false);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [isPanning]);

    return {
        viewportRef,
        frameRef,
        zoom,
        scale: zoom / 100,
        zoomTo,
        stepZoom,
        zoomToFit,
        spaceHeld,
        isPanning,
        tryBeginPan,
        recenter,
    };
}
