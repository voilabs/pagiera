import type { ComponentType } from "react";

export const RenderedPage: ComponentType<any>;
export function loadPageData(
    elements: unknown[],
    sources: unknown[],
    options?: Record<string, unknown>,
): Promise<Record<string, Array<Record<string, unknown>>>>;
