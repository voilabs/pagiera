import type { AiDesignPlan } from "@/lib/editor/ai-types";
import type { CanvasElement, RootStyle } from "@/lib/editor/types";
import { resolveStyle } from "@/lib/editor/style";
import { cascadeOf } from "@/lib/editor/cascade";

const labels: Record<string, string> = { bg: "Background", color: "Text color", content: "Text", w: "Width", h: "Height", radius: "Corner radius", fontSize: "Font size", fontWeight: "Font weight", padT: "Top padding", padR: "Right padding", padB: "Bottom padding", padL: "Left padding" };
const display = (value: unknown): string => value === undefined || value === null ? "Not set" : value === "" ? "Empty" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

export function AiChanges({ plans, elements, rootStyle }: { plans: AiDesignPlan[]; elements: CanvasElement[]; rootStyle: RootStyle }) {
    const cascade = cascadeOf(rootStyle.breakpoints, rootStyle.baseBreakpointId);
    return <div aria-label="Proposed changes" className="custom-scrollbar my-3 max-h-[40vh] space-y-2 overflow-y-auto overscroll-contain">
        {plans.flatMap((plan, planIndex) => plan.operations.map((operation, index) => {
            const element = "id" in operation ? elements.find(item => item.id === operation.id) : undefined;
            const title = operation.kind === "page" ? "Page settings" : operation.kind === "add" ? `Add ${operation.name ?? operation.type}` : `${operation.kind === "remove" ? "Remove" : "Edit"} ${element?.name ?? element?.type ?? operation.id}`;
            const rows: { label: string; before: unknown; after: unknown }[] = [];
            const beforeStyle = element ? resolveStyle(element, plan.targetBreakpoint ?? cascade.baseId, cascade) : undefined;
            for (const [key, value] of Object.entries(operation)) {
                if (["kind", "id", "ref", "type", "parentId"].includes(key) || value === undefined) continue;
                if (["style", "hoverStyle", "pressStyle", "tabletStyle", "mobileStyle"].includes(key) && value && typeof value === "object") {
                    const before = key === "style" ? operation.kind === "page" ? rootStyle : beforeStyle : key === "hoverStyle" ? element?.hover : key === "pressStyle" ? element?.press : element?.overrides?.[key === "tabletStyle" ? "tablet" : "mobile"];
                    for (const [field, after] of Object.entries(value)) rows.push({ label: `${key === "style" ? "" : key.replace("Style", "") + " · "}${labels[field] ?? field}`, before: (before as unknown as Record<string, unknown> | undefined)?.[field], after });
                } else rows.push({ label: labels[key] ?? key, before: (element as unknown as Record<string, unknown> | undefined)?.[key], after: value });
            }
            return <section key={`${planIndex}-${index}`} className="overflow-hidden rounded-xl bg-ed-field ring-1 ring-white/5">
                <div className="border-b border-white/5 px-3 py-2"><h3 className="break-words text-xs font-medium text-ed-text">{title}</h3><p className="mt-1 text-[10px] text-ed-muted">{plan.targetBreakpoint ?? "Base style · inherited where not overridden"}</p>
                    {operation.kind === "add" && <p className="mt-1 break-words text-[10px] text-ed-muted">Inside: {elements.find(item => item.id === operation.parentId)?.name ?? operation.parentId ?? "Page"}</p>}
                </div>
                <div className="space-y-3 p-3">{rows.map((row, rowIndex) => <div key={rowIndex}>
                    <p className="mb-1 text-[10px] font-medium text-ed-muted">{row.label}</p>
                    {operation.kind !== "add" && <div className="whitespace-pre-wrap break-words rounded-md bg-red-500/5 px-2 py-1 text-[11px] text-ed-muted"><span className="mr-1 text-red-300">−</span>{display(row.before)}</div>}
                    <div className="mt-1 whitespace-pre-wrap break-words rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-ed-text"><span className="mr-1 text-emerald-300">+</span>{display(row.after)}</div>
                </div>)}{operation.kind === "remove" && <p className="text-xs text-red-300">This element and its children will be removed.</p>}</div>
            </section>;
        }))}
    </div>;
}
