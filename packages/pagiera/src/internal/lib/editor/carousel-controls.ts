export type CarouselControl = { action: "previous" | "next" | "go-to" | "group"; slide: number; activeColor?: string; inactiveOpacity?: number };
export function normalizeCarouselControl(value: unknown): CarouselControl | undefined {
    if (!value || typeof value !== "object") return;
    const v = value as Partial<CarouselControl>;
    if (!["previous", "next", "go-to", "group"].includes(v.action ?? "")) return;
    return { action: v.action!, slide: typeof v.slide === "number" && Number.isFinite(v.slide) ? Math.max(1, Math.min(1000, Math.round(v.slide))) : 1,
        activeColor: typeof v.activeColor === "string" && /^#[0-9a-f]{6}$/i.test(v.activeColor) ? v.activeColor : undefined,
        inactiveOpacity: typeof v.inactiveOpacity === "number" && Number.isFinite(v.inactiveOpacity) ? Math.max(0, Math.min(100, v.inactiveOpacity)) : undefined };
}
export function carouselControlAttributes(control?: CarouselControl): Record<string, string | number | undefined> {
    return control ? { "data-carousel-action": control.action, "data-carousel-target": control.slide - 1, "data-carousel-active-color": control.activeColor, "data-carousel-inactive-opacity": control.inactiveOpacity } : {};
}
