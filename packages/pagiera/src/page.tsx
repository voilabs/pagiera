"use client";

import { createElement, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { PagieraDocument, PagieraElement } from "./document.js";

export type PagieraPageProps = {
    document: PagieraDocument;
    className?: string;
    interactive?: boolean;
    onElementSelect?: (id: string) => void;
};

const safeClass = (id: string) => `pg-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const px = (value: unknown) => typeof value === "number" ? `${value}px` : undefined;

function declarations(style: Record<string, unknown>, type: string) {
    const widthMode = style.widthMode;
    const heightMode = style.heightMode;
    const layout = style.layout;
    const direction = style.direction;
    const rules: Record<string, string | number | undefined> = {
        boxSizing: "border-box",
        display: style.hidden ? "none" : type === "Grid" ? "grid" : layout === "stack" || ["Frame", "Stack", "Section", "Container", "Request", "Repeat", "Button"].includes(type) ? "flex" : "block",
        flexDirection: direction === "row" ? "row" : "column",
        flexWrap: style.wrap ? "wrap" : undefined,
        flexGrow: widthMode === "fill" && direction === "row" ? 1 : undefined,
        width: widthMode === "fixed" ? px(style.w) : widthMode === "fill" ? "100%" : "auto",
        height: heightMode === "fixed" ? px(style.h) : "auto",
        minHeight: heightMode === "fixed" ? px(style.h) : undefined,
        gap: px(style.gap),
        padding: `${Number(style.padT ?? 0)}px ${Number(style.padR ?? 0)}px ${Number(style.padB ?? 0)}px ${Number(style.padL ?? 0)}px`,
        justifyContent: style.justify === "between" ? "space-between" : style.justify === "center" ? "center" : style.justify === "end" ? "flex-end" : "flex-start",
        alignItems: style.align === "center" ? "center" : style.align === "end" ? "flex-end" : style.align === "stretch" ? "stretch" : "flex-start",
        gridTemplateColumns: type === "Grid" ? `repeat(${Number(style.columns ?? 1)}, minmax(0, 1fr))` : undefined,
        background: String(style.gradient || style.bg || "transparent"),
        color: String(style.color || "inherit"),
        border: Number(style.borderW ?? 0) > 0 ? `${Number(style.borderW)}px ${String(style.borderStyle || "solid")} ${String(style.borderC || "transparent")}` : undefined,
        borderRadius: px(style.radius),
        boxShadow: style.shadow ? String(style.shadow) : undefined,
        opacity: Number(style.opacity ?? 100) / 100,
        overflow: style.overflow ? String(style.overflow) : undefined,
        fontSize: px(style.fontSize),
        fontWeight: style.fontWeight ? String(style.fontWeight) : undefined,
        lineHeight: style.lineHeight ? String(style.lineHeight) : undefined,
        letterSpacing: px(style.letterSpacing),
        textAlign: style.textAlign ? String(style.textAlign) : undefined,
        textTransform: style.textTransform ? String(style.textTransform) : undefined,
        cursor: style.cursor ? String(style.cursor) : undefined,
        aspectRatio: style.aspectRatio ? String(style.aspectRatio) : undefined,
        objectFit: style.bgSize ? String(style.bgSize) : undefined,
        backgroundImage: style.bgImage ? `url("${String(style.bgImage).replace(/["'()\\]/g, "")}")` : undefined,
        backgroundSize: style.bgSize ? String(style.bgSize) : undefined,
        backgroundPosition: style.bgPosition ? String(style.bgPosition) : undefined,
        transform: `rotate(${Number(style.rotate ?? 0)}deg) scale(${Number(style.scale ?? 100) / 100})`,
        filter: Number(style.blur ?? 0) ? `blur(${Number(style.blur)}px)` : undefined,
        backdropFilter: Number(style.backdropBlur ?? 0) ? `blur(${Number(style.backdropBlur)}px)` : undefined,
    };
    return Object.entries(rules).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`).join(";");
}

function stylesheet(document: PagieraDocument) {
    const parts: string[] = [];
    for (const font of document.rootStyle.customFonts ?? []) parts.push(`@font-face{font-family:"${font.name.replace(/["'{};]/g, "")}";src:url("${font.url.replace(/["'()\\]/g, "")}");font-weight:${font.weight};font-style:${font.style};font-display:swap}`);
    for (const element of document.elements) {
        const selector = `.${safeClass(element.id)}`;
        parts.push(`${selector}{${declarations(element.base, element.type)}}`);
        if (element.hover && Object.keys(element.hover).length) parts.push(`${selector}:hover{${declarations({ ...element.base, ...element.hover }, element.type)}}`);
        if (element.press && Object.keys(element.press).length) parts.push(`${selector}:active{${declarations({ ...element.base, ...element.press }, element.type)}}`);
        if (element.hover || element.press) parts.push(`${selector}{transition:transform .42s cubic-bezier(.16,1,.3,1),background-color .3s ease,color .3s ease,border-color .3s ease,box-shadow .42s cubic-bezier(.16,1,.3,1),opacity .3s ease}`);
    }
    for (const breakpoint of document.rootStyle.breakpoints.filter((item) => item.id !== "desktop").sort((a, b) => b.width - a.width)) {
        const rules = document.elements.flatMap((element) => {
            const override = element.overrides?.[breakpoint.id];
            return override ? [`.${safeClass(element.id)}{${declarations({ ...element.base, ...override }, element.type)}}`] : [];
        }).join("");
        if (rules) parts.push(`@media(max-width:${breakpoint.width}px){${rules}}`);
    }
    return parts.join("\n");
}

function ElementContent({ element }: { element: PagieraElement }) {
    if (element.code) return <iframe title={element.name ?? "Code component"} srcDoc={element.code} sandbox="" style={{ width: "100%", height: "100%", border: 0 }} />;
    if (element.type === "Image") return element.src ? <img src={element.src} alt={element.alt ?? ""} style={{ display: "block", width: "100%", height: "100%", objectFit: element.objectFit ?? "cover" }} /> : null;
    if (element.type === "Video") return element.src ? <iframe src={element.src} title={element.name ?? "Video"} style={{ width: "100%", height: "100%", border: 0 }} /> : null;
    if (element.type === "Icon") return <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8Z" /></svg>;
    return element.content ? <span style={{ display: "block", width: "100%", whiteSpace: "pre-wrap" }}>{element.content}</span> : null;
}

function semanticTag(element: PagieraElement) {
    const name = (element.name ?? "").toLowerCase();
    if (element.type === "Button") return "button";
    if (element.type === "Heading") {
        const level = name.match(/(?:^|\s)h([1-6])(?:\s|$)/)?.[1] ?? "2";
        return `h${level}`;
    }
    if (element.type === "Text") return "p";
    if (name.includes("navbar") || name === "nav" || name.includes("navigation")) return "nav";
    if (name.includes("footer")) return "footer";
    if (name.includes("header")) return "header";
    if (element.type === "Section") return "section";
    return "div";
}

export function PagieraPage({ document, className, interactive = true, onElementSelect }: PagieraPageProps) {
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const css = useMemo(() => stylesheet(document), [document]);
    const children = useMemo(() => {
        const map = new Map<string | undefined, PagieraElement[]>();
        for (const element of document.elements) map.set(element.parentId, [...(map.get(element.parentId) ?? []), element]);
        for (const list of map.values()) list.sort((a, b) => a.z - b.z);
        return map;
    }, [document.elements]);

    const render = (element: PagieraElement): ReactNode => {
        const explicit = visibility[element.id];
        const hidden = explicit === undefined ? element.base.hidden === true : !explicit;
        const interaction = element.interaction;
        const runInteraction = interactive && interaction ? () => {
            if (interaction.action === "navigate") interaction.target === "_blank" ? window.open(interaction.value, "_blank", "noopener,noreferrer") : window.location.assign(interaction.value);
            else if (interaction.action === "scroll-to") window.document.getElementById(safeClass(interaction.value))?.scrollIntoView({ behavior: "smooth" });
            else setVisibility((current) => {
                const target = document.elements.find((candidate) => candidate.id === interaction.value);
                const currentVisible = current[interaction.value] ?? target?.base.hidden !== true;
                return { ...current, [interaction.value]: interaction.action === "show-layer" ? true : interaction.action === "hide-layer" ? false : !currentVisible };
            });
        } : undefined;
        const onClick = onElementSelect || runInteraction ? (event: { stopPropagation(): void }) => { if (onElementSelect) { event.stopPropagation(); onElementSelect(element.id); } if (runInteraction) runInteraction(); } : undefined;
        const style: CSSProperties = hidden ? { display: "none" } : {};
        const body = <><ElementContent element={element} />{(children.get(element.id) ?? []).map(render)}</>;
        const props = { id: safeClass(element.id), "data-pagiera-id": element.id, className: `pg-node ${safeClass(element.id)}`, style, onClick, "aria-hidden": hidden || undefined };
        if ((element.href || interaction?.action === "navigate") && !onClick) return createElement("a", { ...props, href: element.href, target: element.target }, body);
        const tag = semanticTag(element);
        return createElement(tag, { ...props, type: tag === "button" ? "button" : undefined }, body);
    };

    const rootStyle: CSSProperties = { width: "100%", minHeight: document.rootStyle.canvasHeight, background: document.rootStyle.bg, color: "inherit", display: "flex", flexDirection: document.rootStyle.direction, gap: document.rootStyle.gap, fontFamily: document.rootStyle.fontFamily };
    return <main className={`pagiera-root ${className ?? ""}`} style={rootStyle}><style>{css}</style>{(children.get(undefined) ?? []).map(render)}</main>;
}
