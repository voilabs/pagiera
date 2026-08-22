import type React from "react";
import type { CanvasElement } from "./types";

const paths: Record<NonNullable<CanvasElement["iconName"]>, React.ReactNode> = {
    star: <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />,
    heart: <path d="M20.8 5.8c-2.2-2.2-5.7-2.2-7.9 0L12 6.7l-.9-.9a5.6 5.6 0 0 0-7.9 7.9L12 22l8.8-8.3a5.6 5.6 0 0 0 0-7.9Z" />,
    "arrow-right": <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
};

export function IconGlyph({ element }: { element: CanvasElement }) {
    return <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[element.iconName ?? "star"]}</svg>;
}
