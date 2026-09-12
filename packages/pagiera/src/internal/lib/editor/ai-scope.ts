import type { AiDesignPlan } from "./ai-types";
import type { CanvasElement } from "./types";

/** Enforced when accepting a plan, independently of the model's prompt. */
export function scopeAiPlan(plan: AiDesignPlan, elements: CanvasElement[], focusId?: string, breakpoint?: string, refs = new Set<string>()): AiDesignPlan {
    const allowed = new Set(elements.filter(element => !element.parked && (!element.componentRole || Boolean(focusId))).map(element => element.id));
    if (focusId) {
        allowed.clear();
        if (elements.some(element => element.id === focusId)) allowed.add(focusId);
        let changed = true;
        while (changed) {
            changed = false;
            for (const element of elements) if (element.parentId && allowed.has(element.parentId) && !allowed.has(element.id)) { allowed.add(element.id); changed = true; }
        }
    }
    const operations = plan.operations.filter(operation => {
        if (breakpoint) return operation.kind === "update" && allowed.has(operation.id);
        // Existing content must never enter the destructive page-generation path,
        // including when a third-party adapter returns a replacement plan.
        if (operation.kind === "page") return !focusId && elements.length === 0;
        if (operation.kind === "remove") return false;
        if (operation.kind === "add") {
            const parent = operation.parentId;
            if (focusId && (!parent || (!allowed.has(parent) && !refs.has(parent)))) return false;
            if (!focusId && parent && !allowed.has(parent) && !refs.has(parent)) return false;
            refs.add(operation.ref);
            return true;
        }
        return allowed.has(operation.id) || refs.has(operation.id);
    }).map(operation => breakpoint && operation.kind === "update" ? { kind: "update" as const, id: operation.id, style: operation.style } : operation);
    return { ...plan, operations, targetBreakpoint: breakpoint };
}
