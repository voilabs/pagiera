"use client";

import { IconPalette, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newId } from "@/lib/editor/tree";
import type { CanvasElement, DesignVariable, ElementStyle, RootStyle, StyleKey } from "@/lib/editor/types";

const COLOR_PROPERTIES: Array<{ label: string; value: StyleKey }> = [
    { label: "Background", value: "bg" }, { label: "Text colour", value: "color" },
    { label: "Border colour", value: "borderC" },
];
const NUMBER_PROPERTIES: Array<{ label: string; value: StyleKey }> = [
    { label: "Gap", value: "gap" }, { label: "Radius", value: "radius" },
    { label: "Font size", value: "fontSize" }, { label: "Padding top", value: "padT" },
];

export function VariablesPanel({ rootStyle, selectedElement, setRootStyle, setElements }: { rootStyle: RootStyle; selectedElement?: CanvasElement; setRootStyle: (patch: Partial<RootStyle>) => void; setElements: (updater: (elements: CanvasElement[]) => CanvasElement[]) => void }) {
    const variables = rootStyle.variables ?? [];
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "color" | "number">("all");
    const [property, setProperty] = useState<StyleKey>("bg");

    const updateVariable = (id: string, patch: Partial<DesignVariable>) => {
        const next = variables.map((variable) => variable.id === id ? { ...variable, ...patch } as DesignVariable : variable);
        const changed = next.find((variable) => variable.id === id);
        setRootStyle({ variables: next });
        if (!changed) return;
        setElements((elements) => elements.map((element) => {
            const keys = Object.entries(element.styleBindings ?? {}).filter(([, variableId]) => variableId === id).map(([key]) => key as StyleKey);
            if (!keys.length) return element;
            const base = { ...element.base } as ElementStyle;
            const mutableBase = base as unknown as Record<string, unknown>;
            for (const key of keys) mutableBase[key] = changed.value;
            return { ...element, base };
        }));
    };

    const add = (type: DesignVariable["type"]) => setRootStyle({ variables: [...variables, { id: newId(), name: type === "color" ? "Brand colour" : "Spacing", type, value: type === "color" ? "#5402e6" : 16 }] });
    const bind = (variable: DesignVariable) => {
        if (!selectedElement) return;
        const allowed = variable.type === "color" ? COLOR_PROPERTIES : NUMBER_PROPERTIES;
        const key = allowed.some((item) => item.value === property) ? property : allowed[0].value;
        setProperty(key);
        setElements((elements) => elements.map((element) => {
            if (element.id !== selectedElement.id) return element;
            const base = { ...element.base } as ElementStyle;
            (base as unknown as Record<string, unknown>)[key] = variable.value;
            return { ...element, base, styleBindings: { ...element.styleBindings, [key]: variable.id } };
        }));
    };


    const remove = (id: string) => {
        setRootStyle({ variables: variables.filter(item => item.id !== id) });
        // Keep resolved values, but remove dangling variable references.
        setElements(elements => elements.map(element => {
            const bindings = element.styleBindings;
            if (!bindings || !Object.values(bindings).includes(id)) return element;
            return { ...element, styleBindings: Object.fromEntries(Object.entries(bindings).filter(([, value]) => value !== id)) };
        }));
    };
    const visible = variables.filter(v => (filter === "all" || v.type === filter) && v.name.toLowerCase().includes(query.trim().toLowerCase()));
    return <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-medium text-ed-text">{variables.length} variables</p><p className="mt-1 text-xs text-ed-muted">Change a value once to update its bound layers.</p></div>
            <div className="flex gap-2">{(["color", "number"] as const).map(type => <button key={type} type="button" onClick={() => add(type)} className="flex h-9 items-center gap-2 rounded-lg bg-ed-field px-3 text-xs text-ed-text hover:bg-ed-field-hover"><IconPlus size={14} />{type === "color" ? "Colour" : "Number"}</button>)}</div>
        </div>
        <div className="flex flex-wrap gap-3">
            <input aria-label="Search variables" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search variables…" className="h-10 min-w-0 flex-1 rounded-xl bg-ed-field px-3 text-xs text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" />
            <div className="flex gap-1">{(["all", "color", "number"] as const).map(type => <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)} className={"rounded-lg px-3 text-xs " + (filter === type ? "bg-ed-field text-ed-text" : "text-ed-muted")}>{type === "all" ? "All" : type === "color" ? "Colours" : "Numbers"}</button>)}</div>
        </div>
        {!selectedElement && <p className="text-xs text-ed-faint">Select a layer on the canvas before opening settings to bind a variable.</p>}
        {selectedElement && <p className="text-xs text-ed-muted">Bind to: <span className="text-ed-text">{selectedElement.name || selectedElement.type}</span></p>}
        <div className="space-y-2">{visible.map(variable => {
            const options = variable.type === "color" ? COLOR_PROPERTIES : NUMBER_PROPERTIES;
            return <div key={variable.id} className="rounded-xl bg-ed-field/50 p-4">
                <div className="flex items-center gap-3">
                    {variable.type === "color" ? <input aria-label={variable.name + " colour"} type="color" value={String(variable.value)} onChange={e => updateVariable(variable.id, { value: e.target.value })} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent" /> : <IconPalette size={20} className="text-ed-faint" />}
                    <input aria-label="Variable name" value={variable.name} onChange={e => updateVariable(variable.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-xs font-medium text-ed-text outline-none focus:ring-1 focus:ring-ed-accent" />
                    {variable.type === "number" ? <input aria-label={variable.name + " value"} type="number" value={Number(variable.value)} onChange={e => { const value = e.target.valueAsNumber; if (Number.isFinite(value)) updateVariable(variable.id, { value }); }} className="h-8 w-20 rounded-lg bg-ed-field px-2 text-right text-xs text-ed-text" /> : <span className="font-mono text-xs text-ed-muted">{variable.value}</span>}
                    <button type="button" aria-label={"Delete " + variable.name} title="Delete variable; keep current layer values" onClick={() => remove(variable.id)} className="rounded-lg p-2 text-ed-faint hover:bg-red-500/10 hover:text-red-400"><IconTrash size={15} /></button>
                </div>
                {selectedElement && <div className="mt-3 flex gap-2">
                    <Select value={options.some(item => item.value === property) ? property : options[0].value} onValueChange={value => setProperty(value as StyleKey)}><SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger><SelectContent>{options.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
                    <button type="button" onClick={() => bind(variable)} className="rounded-lg bg-ed-accent px-4 text-xs font-medium text-white">Bind to layer</button>
                </div>}
            </div>;
        })}</div>
        {visible.length === 0 && <div className="rounded-2xl bg-ed-field/40 px-6 py-12 text-center"><IconPalette size={26} className="mx-auto text-ed-accent" /><p className="mt-3 text-sm text-ed-text">{variables.length ? "No matching variables" : "Create your first design variable"}</p><p className="mt-2 text-xs text-ed-muted">{variables.length ? "Try another search or type." : "Start with a brand colour or a shared spacing value."}</p></div>}
    </div>;
}
