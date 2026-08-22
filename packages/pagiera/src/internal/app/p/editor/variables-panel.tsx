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

    const add = (type: DesignVariable["type"]) => setRootStyle({ variables: [...variables, { id: newId(), name: type === "color" ? "Brand colour" : "Spacing", type, value: type === "color" ? "#8b7bff" : 16 }] });
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

    return <div className="flex flex-col">
        <div className="border-b border-ed-border p-3"><div className="rounded-xl border border-ed-border bg-ed-subtle p-3"><IconPalette size={16} className="mb-2 text-ed-accent" /><p className="text-[11px] font-semibold text-ed-text">Design variables</p><p className="mt-1 text-[9px] leading-relaxed text-ed-muted">Bind shared colours and numbers. Editing a variable updates every bound layer.</p></div></div>
        <div className="flex gap-1.5 border-b border-ed-border p-3"><button type="button" onClick={() => add("color")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ed-field px-2 py-2 text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconPlus size={11} /> Colour</button><button type="button" onClick={() => add("number")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ed-field px-2 py-2 text-[10px] text-ed-muted hover:bg-ed-field-hover hover:text-ed-text"><IconPlus size={11} /> Number</button></div>
        {variables.length === 0 ? <p className="p-5 text-center text-[10px] text-ed-faint">No variables yet.</p> : <div className="space-y-2 p-3">{variables.map((variable) => { const options = variable.type === "color" ? COLOR_PROPERTIES : NUMBER_PROPERTIES; return <div key={variable.id} className="rounded-xl border border-ed-border bg-ed-subtle p-2.5"><div className="flex items-center gap-2"><input value={variable.name} onChange={(event) => updateVariable(variable.id, { name: event.target.value })} className="min-w-0 flex-1 bg-transparent text-[10px] font-medium text-ed-text outline-none" />{variable.type === "color" ? <input type="color" value={String(variable.value)} onChange={(event) => updateVariable(variable.id, { value: event.target.value })} className="size-6 cursor-pointer rounded border-0 bg-transparent" /> : <input type="number" value={Number(variable.value)} onChange={(event) => updateVariable(variable.id, { value: Number(event.target.value) })} className="w-14 rounded-md bg-ed-field px-1.5 py-1 text-right text-[10px] text-ed-text outline-none" />}<button type="button" onClick={() => setRootStyle({ variables: variables.filter((item) => item.id !== variable.id) })} className="text-ed-faint hover:text-red-400"><IconTrash size={12} /></button></div>{selectedElement && <div className="mt-2 flex gap-1.5"><Select value={options.some((item) => item.value === property) ? property : options[0].value} onValueChange={(value) => setProperty(value as StyleKey)}><SelectTrigger className="h-7 min-w-0 flex-1"><SelectValue /></SelectTrigger><SelectContent>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><button type="button" onClick={() => bind(variable)} className="rounded-lg bg-ed-accent px-2 text-[9px] font-medium text-white">Bind</button></div>}</div>; })}</div>}
    </div>;
}
