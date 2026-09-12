/** A parked layer has one copy; page layers have one per artboard. */
export function canvasTargetSelector(id: string, breakpoint: string, parked: boolean) {
    const layer = `[data-canvas-element="${CSS.escape(id)}"]`;
    return parked ? `[data-parked] ${layer}` : `[data-artboard="${CSS.escape(breakpoint)}"] ${layer}`;
}
