"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type PagieraFont = {
    variable: string;
    title: string;
};

export type PagieraResolvedFont = PagieraFont & {
    family: string;
};

const FontContext = createContext<PagieraResolvedFont[]>([]);

function variableName(className: string) {
    if (className.startsWith("--")) return className;
    const baseline = document.createElement("span");
    const probe = document.createElement("span");
    probe.className = className;
    baseline.hidden = true;
    probe.hidden = true;
    document.body.appendChild(baseline);
    document.body.appendChild(probe);
    const baselineStyle = getComputedStyle(baseline);
    const style = getComputedStyle(probe);
    let match = "";
    for (let index = 0; index < style.length; index += 1) {
        const property = style.item(index);
        const value = style.getPropertyValue(property).trim();
        if (
            property.startsWith("--font-") &&
            value &&
            value !== baselineStyle.getPropertyValue(property).trim()
        ) {
            match = property;
            break;
        }
    }
    baseline.remove();
    probe.remove();
    return match;
}

export function PagieraProvider({ fonts = [], children }: { fonts?: PagieraFont[]; children: ReactNode }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [resolved, setResolved] = useState<PagieraResolvedFont[]>(() => fonts.map((font) => ({
        ...font,
        family: font.variable.startsWith("--") ? `var(${font.variable})` : "",
    })));
    const className = useMemo(() => fonts.map((font) => font.variable.startsWith("--") ? "" : font.variable).filter(Boolean).join(" "), [fonts]);

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        setResolved(fonts.flatMap((font) => {
            const property = variableName(font.variable);
            return property ? [{ ...font, family: `var(${property})` }] : [];
        }));
    }, [fonts]);

    return <FontContext.Provider value={resolved}><div ref={rootRef} className={className} style={{ display: "contents" }}>{children}</div></FontContext.Provider>;
}

export function usePagieraFonts() {
    return useContext(FontContext);
}
