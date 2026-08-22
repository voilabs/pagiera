export type PagieraBreakpoint = {
    id: string;
    name: string;
    width: number;
};

export type PagieraElement = {
    id: string;
    type: string;
    name?: string;
    parentId?: string;
    z: number;
    base: Record<string, unknown>;
    overrides?: Record<string, Record<string, unknown>>;
    content?: string;
    src?: string;
    href?: string;
    target?: "_self" | "_blank";
    alt?: string;
    objectFit?: "cover" | "contain" | "fill" | "none";
    iconName?: "star" | "heart" | "arrow-right" | "check" | "menu" | "search";
    code?: string;
    hover?: Record<string, unknown>;
    press?: Record<string, unknown>;
    interaction?: {
        trigger: "click";
        action: "navigate" | "scroll-to" | "toggle-layer" | "show-layer" | "hide-layer";
        value: string;
        target?: "_self" | "_blank";
    };
};

export type PagieraRootStyle = {
    documentMode: "page" | "component";
    maxWidth: number;
    canvasHeight: number;
    fullWidth: boolean;
    bg: string;
    layout: "absolute" | "stack";
    direction: "row" | "column";
    gap: number;
    fontFamily: string;
    breakpoints: PagieraBreakpoint[];
    customFonts?: Array<{ id: string; name: string; url: string; weight: number; style: "normal" | "italic" }>;
    variables?: Array<{ id: string; name: string; type: "color" | "number"; value: string | number }>;
};

export type PagieraDocument = {
    version: 1;
    elements: PagieraElement[];
    rootStyle: PagieraRootStyle;
    dataSources: unknown[];
};

export function createDocument(patch: Partial<PagieraDocument> = {}): PagieraDocument {
    return {
        version: 1,
        elements: [],
        dataSources: [],
        rootStyle: {
            documentMode: "page",
            maxWidth: 1280,
            canvasHeight: 900,
            fullWidth: true,
            bg: "#ffffff",
            layout: "stack",
            direction: "column",
            gap: 0,
            fontFamily: "Inter, ui-sans-serif, sans-serif",
            breakpoints: [
                { id: "desktop", name: "Desktop", width: 1280 },
                { id: "tablet", name: "Tablet", width: 810 },
                { id: "mobile", name: "Mobile", width: 390 }
            ],
        },
        ...patch,
    };
}
