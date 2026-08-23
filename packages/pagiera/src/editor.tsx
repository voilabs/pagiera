"use client";

import { useMemo, useState } from "react";
import { createDocument, type PagieraDocument, type PagieraElement } from "./document.js";
import { PagieraPage } from "./page.js";
import "@fontsource-variable/figtree";
import figtreeSansWoff2 from "@fontsource-variable/figtree/wght.woff2";

export type PagieraEditorAdapters = {
    save?: (document: PagieraDocument) => void | Promise<void>;
    generate?: (prompt: string, document: PagieraDocument) => Promise<PagieraDocument>;
    installTemplate?: (templateId: string, document: PagieraDocument) => PagieraDocument | Promise<PagieraDocument>;
};

export type PagieraEditorProps = {
    value?: PagieraDocument;
    onChange?: (document: PagieraDocument) => void;
    adapters?: PagieraEditorAdapters;
    className?: string;
};

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function elementLabel(element: PagieraElement) {
    return element.name || element.content?.slice(0, 28) || element.type;
}

function defaultElement(type: string): PagieraElement {
    const textual = type === "Heading" || type === "Text" || type === "Button";
    const field = type === "Input" || type === "Textarea";
    return {
        id: uid(), type, z: Date.now(), name: type,
        content: type === "Heading" ? "Your headline" : type === "Text" ? "Write something meaningful." : type === "Button" ? "Button" : undefined,
        placeholder: type === "Input" ? "Enter a value…" : type === "Textarea" ? "Write your message…" : undefined,
        fieldName: type === "Input" ? "field" : type === "Textarea" ? "message" : undefined,
        inputType: type === "Input" ? "text" : undefined,
        formMethod: type === "Form" ? "POST" : undefined,
        formSubmitMode: type === "Form" ? "request" : undefined,
        formContentType: type === "Form" ? "json" : undefined,
        buttonType: type === "Button" ? "button" : undefined,
        base: {
            x: 0, y: 0, w: textual ? 280 : 360, h: type === "Textarea" ? 120 : field ? 46 : textual ? 48 : 180,
            widthMode: field ? "fill" : textual ? "auto" : "fill", heightMode: field ? "fixed" : "auto",
            layout: ["Section", "Container", "Stack", "Frame", "Form", "Button"].includes(type) ? "stack" : "absolute",
            direction: "column", gap: 12, padT: type === "Section" ? 64 : 0, padR: type === "Section" ? 40 : 0, padB: type === "Section" ? 64 : 0, padL: type === "Section" ? 40 : 0,
            align: type === "Form" ? "stretch" : "start", justify: "start", bg: type === "Button" ? "#4f8cff" : field ? "#ffffff" : "transparent", color: type === "Button" ? "#ffffff" : field ? "#18181b" : "inherit",
            borderW: field ? 1 : 0, borderC: field ? "#d4d4d8" : "transparent", radius: field ? 10 : 0,
            fontSize: type === "Heading" ? 48 : 16, fontWeight: type === "Heading" || type === "Button" ? "700" : "400", lineHeight: 1.2, opacity: 100, scale: 100,
        },
    };
}

export function PagieraEditor({ value, onChange, adapters, className }: PagieraEditorProps) {
    const [internal, setInternal] = useState<PagieraDocument>(() => value ?? createDocument());
    const document = value ?? internal;
    const [selectedId, setSelectedId] = useState<string>();
    const [breakpointId, setBreakpointId] = useState("desktop");
    const [panel, setPanel] = useState<"layers" | "insert" | "ai">("layers");
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const selected = document.elements.find((element) => element.id === selectedId);
    const breakpoint = document.rootStyle.breakpoints.find((item) => item.id === breakpointId) ?? document.rootStyle.breakpoints[0];
    const roots = useMemo(() => document.elements.filter((element) => !element.parentId).sort((a, b) => b.z - a.z), [document.elements]);

    const commit = (next: PagieraDocument) => { if (!value) setInternal(next); onChange?.(next); };
    const patchElement = (id: string, patch: Partial<PagieraElement>) => commit({ ...document, elements: document.elements.map((element) => element.id === id ? { ...element, ...patch } : element) });
    const patchStyle = (key: string, nextValue: unknown) => {
        if (!selected) return;
        if (breakpointId === "desktop") patchElement(selected.id, { base: { ...selected.base, [key]: nextValue } });
        else patchElement(selected.id, { overrides: { ...selected.overrides, [breakpointId]: { ...selected.overrides?.[breakpointId], [key]: nextValue } } });
    };
    const resolved = selected ? { ...selected.base, ...(breakpointId === "desktop" ? {} : selected.overrides?.[breakpointId]) } : {};
    const add = (type: string) => { const element = defaultElement(type); commit({ ...document, elements: [...document.elements, element] }); setSelectedId(element.id); setPanel("layers"); };

    return <>
        <head>
            <link rel="preload" href={figtreeSansWoff2} as="font" type="font/woff2" crossOrigin="" />
            <style>{`*{font-family:"Figtree Variable",sans-serif} *{scrollbar-width:thin !important;scrollbar-color: var(--pagiera-accent) transparent !important;}`}</style>
        </head>
        <div className={`pagiera-editor ${className ?? ""}`}>
            <header className="pagiera-editor__topbar">
                <strong>Pagiera</strong>
                <div className="pagiera-editor__breakpoints">{document.rootStyle.breakpoints.map((item) => <button type="button" key={item.id} data-active={item.id === breakpointId} onClick={() => setBreakpointId(item.id)}>{item.name}<small>{item.width}</small></button>)}</div>
                <button type="button" onClick={() => adapters?.save?.(document)} disabled={!adapters?.save}>Save</button>
            </header>
            <div className="pagiera-editor__body">
                <aside className="pagiera-editor__left">
                    <nav><button type="button" data-active={panel === "layers"} onClick={() => setPanel("layers")}>Layers</button><button type="button" data-active={panel === "insert"} onClick={() => setPanel("insert")}>Insert</button><button type="button" data-active={panel === "ai"} onClick={() => setPanel("ai")}>AI</button></nav>
                    {panel === "layers" && <div className="pagiera-editor__list">{roots.map((element) => <button type="button" key={element.id} data-active={selectedId === element.id} onClick={() => setSelectedId(element.id)}>{elementLabel(element)}<small>{element.type}</small></button>)}</div>}
                    {panel === "insert" && <div className="pagiera-editor__insert">{["Section", "Container", "Stack", "Grid", "Heading", "Text", "Button", "Image", "Form", "Input", "Textarea"].map((type) => <button type="button" key={type} onClick={() => add(type)}>{type}</button>)}</div>}
                    {panel === "ai" && <form className="pagiera-editor__ai" onSubmit={async (event) => { event.preventDefault(); if (!adapters?.generate || !prompt.trim()) return; setBusy(true); try { commit(await adapters.generate(prompt, document)); setPrompt(""); } finally { setBusy(false); } }}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the site…" /><button type="submit" disabled={busy || !adapters?.generate}>{busy ? "Building…" : "Generate"}</button></form>}
                </aside>
                <main className="pagiera-editor__viewport" onClick={() => setSelectedId(undefined)}>
                    <div className="pagiera-editor__frame" style={{ width: breakpoint.width }}><div className="pagiera-editor__frame-label">{breakpoint.name} · {breakpoint.width}px</div><PagieraPage document={document} interactive={false} onElementSelect={setSelectedId} /></div>
                </main>
                <aside className="pagiera-editor__inspector">
                    {selected ? <><div className="pagiera-editor__inspector-title"><strong>{elementLabel(selected)}</strong><small>{breakpoint.name}</small></div>
                        {(selected.type === "Heading" || selected.type === "Text" || selected.type === "Button") && <label>Content<textarea value={selected.content ?? ""} onChange={(event) => patchElement(selected.id, { content: event.target.value })} /></label>}
                        {(selected.type === "Input" || selected.type === "Textarea") && <><label>Field name<input value={selected.fieldName ?? ""} onChange={(event) => patchElement(selected.id, { fieldName: event.target.value })} /></label><label>Placeholder<input value={selected.placeholder ?? ""} onChange={(event) => patchElement(selected.id, { placeholder: event.target.value })} /></label></>}
                        {selected.type === "Form" && <><label>Endpoint<input value={selected.formAction ?? ""} placeholder="https://api.example.com/contact" onChange={(event) => patchElement(selected.id, { formAction: event.target.value })} /></label><label>Method<select value={selected.formMethod ?? "POST"} onChange={(event) => patchElement(selected.id, { formMethod: event.target.value as PagieraElement["formMethod"] })}>{["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => <option key={method}>{method}</option>)}</select></label><label>Request body<textarea value={selected.formBody ?? ""} placeholder={'{"email":"{{form.email}}"}'} onChange={(event) => patchElement(selected.id, { formBody: event.target.value })} /></label><label>Headers<textarea value={selected.formHeaders ?? ""} placeholder="Authorization: Bearer …" onChange={(event) => patchElement(selected.id, { formHeaders: event.target.value })} /></label></>}
                        <div className="pagiera-editor__grid"><label>Width<input type="number" value={number(resolved.w, 200)} onChange={(event) => patchStyle("w", Number(event.target.value))} /></label><label>Height<input type="number" value={number(resolved.h, 100)} onChange={(event) => patchStyle("h", Number(event.target.value))} /></label></div>
                        <div className="pagiera-editor__grid"><label>Font size<input type="number" value={number(resolved.fontSize, 16)} onChange={(event) => patchStyle("fontSize", Number(event.target.value))} /></label><label>Radius<input type="number" value={number(resolved.radius, 0)} onChange={(event) => patchStyle("radius", Number(event.target.value))} /></label></div>
                        <label>Background<input type="text" value={String(resolved.bg ?? "transparent")} onChange={(event) => patchStyle("bg", event.target.value)} /></label><label>Text color<input type="text" value={String(resolved.color ?? "inherit")} onChange={(event) => patchStyle("color", event.target.value)} /></label>
                        <button type="button" className="pagiera-editor__danger" onClick={() => { commit({ ...document, elements: document.elements.filter((element) => element.id !== selected.id && element.parentId !== selected.id) }); setSelectedId(undefined); }}>Delete element</button>
                    </> : <p className="pagiera-editor__empty">Select an element to edit its properties.</p>}
                </aside>
            </div>
        </div>
    </>;
}
