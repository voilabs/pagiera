"use client";

import { createElement, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { PagieraDocument, PagieraElement } from "./document.js";
import { IconGlyph } from "./internal/lib/editor/icon.js";
import { customTagOf, withCustom } from "./internal/lib/render/custom.js";

export type PagieraPageProps = {
    document: PagieraDocument;
    className?: string;
    interactive?: boolean;
    onElementSelect?: (id: string) => void;
};

const safeClass = (id: string) => `pg-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const px = (value: unknown) => typeof value === "number" ? `${value}px` : undefined;

function formHeaders(raw?: string) {
    const headers: Record<string, string> = {};
    for (const line of (raw ?? "").split(/\r?\n/)) {
        const separator = line.indexOf(":");
        if (separator > 0) headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    return headers;
}

async function submitBackgroundForm(element: PagieraElement, form: HTMLFormElement) {
    const data = new FormData(form);
    const fields: Record<string, string | string[]> = {};
    data.forEach((raw, key) => {
        const value = raw instanceof File ? raw.name : String(raw);
        const current = fields[key];
        fields[key] = current === undefined ? value : Array.isArray(current) ? [...current, value] : [current, value];
    });
    const interpolate = (value: string) => value.replace(/{{\s*form\.([A-Za-z0-9_.-]+)\s*}}/g, (_match, key: string) => {
        const found = fields[key];
        return found === undefined ? "" : Array.isArray(found) ? found.join(",") : found;
    });
    const method = element.formMethod ?? "POST";
    const contentType = element.formContentType ?? "json";
    const headers = formHeaders(interpolate(element.formHeaders ?? ""));
    const customBody = interpolate(element.formBody ?? "");
    let url = element.formAction || window.location.href;
    const init: RequestInit = { method, headers };
    if (method === "GET") {
        const target = new URL(url, window.location.href);
        const query = customBody ? new URLSearchParams(customBody) : new URLSearchParams(Object.entries(fields).flatMap(([key, value]) => Array.isArray(value) ? value.map((item) => [key, item]) : [[key, value]]));
        query.forEach((value, key) => target.searchParams.append(key, value));
        url = target.href;
    } else if (contentType === "form-data") {
        init.body = data;
    } else if (contentType === "urlencoded") {
        init.body = customBody || new URLSearchParams(Object.entries(fields).flatMap(([key, value]) => Array.isArray(value) ? value.map((item) => [key, item]) : [[key, value]])).toString();
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
    } else {
        init.body = customBody || JSON.stringify(fields);
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    }
    const status = form.querySelector<HTMLElement>("[data-pg-form-status]");
    const submit = form.querySelector<HTMLButtonElement>("[type=submit]");
    form.setAttribute("aria-busy", "true");
    form.dataset.pgState = "loading";
    if (submit) submit.disabled = true;
    if (status) status.textContent = "";
    try {
        const response = await fetch(url, init);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.dataset.pgState = "success";
        if (status) status.textContent = element.formSuccessMessage ?? "Sent successfully.";
        if (element.formResetOnSuccess) form.reset();
        form.dispatchEvent(new CustomEvent("pagiera:form-success", { bubbles: true, detail: { response } }));
    } catch (error) {
        form.dataset.pgState = "error";
        if (status) status.textContent = element.formErrorMessage ?? "Something went wrong.";
        form.dispatchEvent(new CustomEvent("pagiera:form-error", { bubbles: true, detail: { error } }));
    } finally {
        form.removeAttribute("aria-busy");
        if (submit) submit.disabled = false;
    }
}

function declarationMap(style: Record<string, unknown>, type: string) {
    const widthMode = style.widthMode;
    const heightMode = style.heightMode;
    const layout = style.layout;
    const direction = style.direction;
    const rules: Record<string, string | number | undefined> = {
        boxSizing: "border-box",
        display: style.hidden ? "none" : type === "Grid" || type === "Repeat" ? "grid" : layout === "stack" || ["Frame", "Stack", "Section", "Container", "Form", "Request", "Button"].includes(type) ? "flex" : "block",
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
        gridTemplateColumns: type === "Grid" || type === "Repeat" ? `repeat(${Number(style.columns ?? 1)}, minmax(0, 1fr))` : undefined,
        // The fill carries its own alpha so a translucent background can sit
        // over a blurred backdrop without `opacity` fading the blur too.
        background: String(style.gradient || fillOf(style.bg, style.bgOpacity) || "transparent"),
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
    return rules;
}

function serializeDeclarations(rules: Record<string, string | number | undefined>) {
    return Object.entries(rules).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`).join(";");
}

function fillOf(bg: unknown, bgOpacity: unknown) {
    const colour = String(bg ?? "");
    const alpha = Number(bgOpacity ?? 100);
    if (!colour || colour === "transparent" || !Number.isFinite(alpha) || alpha >= 100) return colour;
    if (alpha <= 0) return "transparent";
    return `color-mix(in srgb, ${colour} ${alpha}%, transparent)`;
}

function declarations(style: Record<string, unknown>, type: string) {
    return serializeDeclarations(declarationMap(style, type));
}

function interactionDeclarations(resting: Record<string, unknown>, patch: Record<string, unknown>, type: string) {
    const before = declarationMap(resting, type);
    const after = declarationMap({ ...resting, ...patch }, type);
    return serializeDeclarations(Object.fromEntries(Object.entries(after).filter(([property, value]) => value !== before[property])));
}

function pageTransitionCss(document: PagieraDocument) {
    const kind = document.rootStyle.pageTransition ?? "smooth";
    if (kind === "none") return "html{scrollbar-gutter:stable}";
    const duration = Math.max(120, Math.min(1200, document.rootStyle.pageTransitionDuration ?? 380));
    const leaveDuration = Math.max(90, Math.round(duration * 0.48));
    const frames = kind === "fade"
        ? { leave: "to{opacity:0}", enter: "from{opacity:0}to{opacity:1}" }
        : kind === "slide"
          ? { leave: "to{opacity:0;transform:translateX(-20px)}", enter: "from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}" }
          : { leave: "to{opacity:0;transform:translateY(-6px);filter:blur(3px)}", enter: "from{opacity:0;transform:translateY(10px);filter:blur(5px)}to{opacity:1;transform:none;filter:blur(0)}" };
    return `
@view-transition{navigation:auto}
html{scrollbar-gutter:stable}
::view-transition-old(root),::view-transition-new(root){mix-blend-mode:normal;animation-fill-mode:both}
::view-transition-old(root){animation:pg-page-leave ${leaveDuration}ms cubic-bezier(.4,0,1,1) both}
::view-transition-new(root){animation:pg-page-enter ${duration}ms cubic-bezier(.16,1,.3,1) both}
@keyframes pg-page-leave{${frames.leave}}
@keyframes pg-page-enter{${frames.enter}}
@media (prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}}
`;
}

function stylesheet(document: PagieraDocument) {
    const parts: string[] = [pageTransitionCss(document), ".pg-node{box-sizing:border-box}.pg-node:is(input,textarea,button){font:inherit}.pg-node:is(input,textarea){outline:none}.pg-node:is(textarea){resize:none}.pg-form-status:empty{display:none}.pg-form-status{font-size:12px;line-height:1.4}.pg-node[data-pg-state=success] .pg-form-status{color:#22c55e}.pg-node[data-pg-state=error] .pg-form-status{color:#ef4444}.pg-svg-glyph>svg{display:block;width:100%;height:100%}.pg-node[role=radiogroup]{display:flex;flex-direction:column;gap:8px}.pg-choice{display:flex;align-items:center;gap:8px;cursor:pointer}.pg-choice input{accent-color:currentColor;margin:0}.pg-node:is(input[type=checkbox],input[type=radio]){accent-color:currentColor}.pg-node:is(ul,ol){list-style:none}.pg-list{counter-reset:pg-list}.pg-list>li{position:relative}.pg-list-bullet>li::before{content:'\\2022';position:absolute;left:-1em;opacity:.65}.pg-list-number>li::before{counter-increment:pg-list;content:counter(pg-list) '.';position:absolute;left:-1.6em;opacity:.65;font-variant-numeric:tabular-nums}.pg-node hr{border:0;width:100%;height:100%}.pg-node iframe{display:block;width:100%;height:100%;border:0}"];
    for (const font of document.rootStyle.customFonts ?? []) parts.push(`@font-face{font-family:"${font.name.replace(/["'{};]/g, "")}";src:url("${font.url.replace(/["'()\\]/g, "")}");font-weight:${font.weight};font-style:${font.style};font-display:swap}`);
    for (const element of document.elements) {
        const selector = `.${safeClass(element.id)}`;
        parts.push(`${selector}{${declarations(element.base, element.type)}}`);
        if (element.hover && Object.keys(element.hover).length) parts.push(`${selector}:hover{${interactionDeclarations(element.base, element.hover, element.type)}}`);
        if (element.press && Object.keys(element.press).length) parts.push(`${selector}:active{${interactionDeclarations(element.base, element.press, element.type)}}`);
        if (element.hover || element.press) parts.push(`${selector}{transition:transform .42s cubic-bezier(.16,1,.3,1),background-color .3s ease,color .3s ease,border-color .3s ease,box-shadow .42s cubic-bezier(.16,1,.3,1),opacity .3s ease}`);
    }
    for (const breakpoint of document.rootStyle.breakpoints.filter((item) => item.id !== "desktop").sort((a, b) => b.width - a.width)) {
        const rules = document.elements.flatMap((element) => {
            const override = element.overrides?.[breakpoint.id];
            if (!override) return [];
            const resting = { ...element.base, ...override };
            const selector = `.${safeClass(element.id)}`;
            return [
                `${selector}{${declarations(resting, element.type)}}`,
                element.hover && Object.keys(element.hover).length ? `${selector}:hover{${interactionDeclarations(resting, element.hover, element.type)}}` : "",
                element.press && Object.keys(element.press).length ? `${selector}:active{${interactionDeclarations(resting, element.press, element.type)}}` : "",
            ].filter(Boolean);
        }).join("");
        if (rules) parts.push(`@media(max-width:${breakpoint.width}px){${rules}}`);
    }
    return parts.join("\n");
}

function ElementContent({ element }: { element: PagieraElement }) {
    if (element.code) return <iframe title={element.name ?? "Code component"} srcDoc={element.code} sandbox="" style={{ width: "100%", height: "100%", border: 0 }} />;
    if (element.type === "Image") return element.src ? <img src={element.src} alt={element.alt ?? ""} style={{ display: "block", width: "100%", height: "100%", objectFit: element.objectFit ?? "cover" }} /> : null;
    if (element.type === "Video") return element.src ? <iframe src={element.src} title={element.name ?? "Video"} style={{ width: "100%", height: "100%", border: 0 }} /> : null;
    if (element.type === "Icon") return <IconGlyph element={element} name={element.iconName} />;
    return element.content ? <span style={{ display: "block", width: "100%", whiteSpace: "pre-wrap" }}>{element.content}</span> : null;
}

function semanticTag(element: PagieraElement) {
    const name = (element.name ?? "").toLowerCase();
    if (element.type === "Button") return "button";
    if (element.type === "Form") return "form";
    if (element.type === "Fieldset") return "fieldset";
    if (element.type === "Label") return "label";
    if (element.type === "Heading") {
        const level = name.match(/(?:^|\s)h([1-6])(?:\s|$)/)?.[1] ?? "2";
        return `h${level}`;
    }
    if (element.type === "Text") return "p";
    if (name.includes("navbar") || name === "nav" || name.includes("navigation")) return "nav";
    if (name.includes("footer")) return "footer";
    if (name.includes("header")) return "header";
    if (element.type === "List") return element.listStyle === "number" ? "ol" : "ul";
    if (element.type === "ListItem") return "li";
    if (element.type === "Quote") return "blockquote";
    if (element.type === "Section") return "section";
    return "div";
}

/** The validation and state attributes shared by every field type. */
function constraints(element: PagieraElement) {
    return {
        name: element.fieldName || undefined,
        required: element.required,
        disabled: element.disabled,
        autoComplete: element.autocomplete || undefined,
        pattern: element.pattern || undefined,
        minLength: element.minLength,
        maxLength: element.maxLength,
        min: element.minValue || undefined,
        max: element.maxValue || undefined,
        step: element.step || undefined,
    };
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
        const body = <><ElementContent element={element} />{(children.get(element.id) ?? []).map(render)}{element.type === "Form" && <span className="pg-form-status" data-pg-form-status aria-live="polite" />}</>;
        const props = withCustom(element, { id: safeClass(element.id), "data-pagiera-id": element.id, className: `pg-node ${safeClass(element.id)}${element.type === "List" && element.listStyle !== "none" ? ` pg-list pg-list-${element.listStyle === "number" ? "number" : "bullet"}` : ""}`, style, onClick, "aria-hidden": hidden || undefined });
        if (element.type === "Divider") return createElement("hr", props);
        if (element.type === "Embed") return element.src ? createElement("iframe", { ...props, src: element.src, title: element.name ?? "Embedded content", loading: "lazy", sandbox: "allow-scripts allow-same-origin allow-popups allow-forms", referrerPolicy: "no-referrer-when-downgrade" }) : null;
        if (element.type === "Input") return createElement("input", { ...props, ...constraints(element), type: element.inputType ?? "text", readOnly: element.readOnly, defaultValue: element.defaultValue, placeholder: element.placeholder });
        if (element.type === "Textarea") return createElement("textarea", { ...props, ...constraints(element), readOnly: element.readOnly, placeholder: element.placeholder, defaultValue: element.defaultValue ?? element.content });
        if (element.type === "FileInput") return createElement("input", { ...props, ...constraints(element), type: "file", accept: element.accept || undefined, multiple: element.multiple });
        if (element.type === "Checkbox") return createElement("input", { ...props, ...constraints(element), type: "checkbox", value: element.defaultValue || "on", defaultChecked: element.checked });
        if (element.type === "Select") return createElement("select", { ...props, ...constraints(element), multiple: element.multiple, defaultValue: element.defaultValue ?? (element.placeholder ? "" : undefined) }, [
            element.placeholder ? createElement("option", { key: "placeholder", value: "", disabled: true }, element.placeholder) : null,
            ...(element.options ?? []).map((option, index) => createElement("option", { key: `${index}:${option.value}`, value: option.value }, option.label || option.value)),
        ]);
        // A radio group is one layer but several inputs: the alternatives only
        // mean anything together, so they are not separate elements.
        if (element.type === "Radio") return createElement("div", { ...props, role: "radiogroup" }, (element.options ?? []).map((option, index) => createElement("label", { key: `${index}:${option.value}`, className: "pg-choice" },
            createElement("input", { type: "radio", name: element.fieldName || safeClass(element.id), value: option.value, required: element.required, disabled: element.disabled, defaultChecked: element.defaultValue ? element.defaultValue === option.value : element.checked && index === 0 }),
            createElement("span", null, option.label || option.value),
        )));
        if ((element.href || interaction?.action === "navigate") && !onClick) return createElement("a", { ...props, href: element.href, target: element.target }, body);
        const tag = customTagOf(element) ?? semanticTag(element);
        return createElement(tag, {
            ...props,
            type: tag === "button" ? (element.buttonType ?? "button") : undefined,
            htmlFor: tag === "label" && element.labelFor ? safeClass(element.labelFor) : undefined,
            action: tag === "form" ? element.formAction : undefined,
            method: tag === "form" ? (element.formMethod === "GET" ? "get" : "post") : undefined,
            onSubmit: tag === "form" && (!interactive || element.formSubmitMode !== "native") ? (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (interactive) void submitBackgroundForm(element, event.currentTarget); } : undefined,
        }, body);
    };

    const rootStyle: CSSProperties = { width: "100%", minHeight: document.rootStyle.canvasHeight, background: document.rootStyle.bg, color: "inherit", display: "flex", flexDirection: document.rootStyle.direction, gap: document.rootStyle.gap, fontFamily: document.rootStyle.fontFamily };
    return <main className={`pagiera-root ${className ?? ""}`} style={rootStyle}><style>{css}</style>{(children.get(undefined) ?? []).map(render)}</main>;
}
