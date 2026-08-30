import type { AiDesignOperation } from "../ai-types";
import type { CanvasElement } from "../types";

/**
 * Turns built elements into the editor operations the canvas applies.
 *
 * Element ids double as refs: a section is built as a self-contained tree, so
 * every `parentId` in it already points at another element from the same
 * batch. The applier resolves refs to real ids as it goes, which is what lets
 * a section stream in one element at a time and still land correctly parented.
 */
export function toAddOperations(elements: CanvasElement[]): AiDesignOperation[] {
    return elements.map((element): AiDesignOperation => ({
        kind: "add",
        ref: element.id,
        type: element.type,
        name: element.name,
        parentId: element.parentId ?? null,
        content: element.content,
        src: element.src,
        alt: element.alt,
        href: element.href,
        style: element.base,
        tabletStyle: element.overrides?.tablet,
        mobileStyle: element.overrides?.mobile,
        hoverStyle: element.hover,
        pressStyle: element.press,
        loop: element.loop,
        draggable: element.draggable,
        styleBindings: element.styleBindings,
        interaction: element.interaction,
    }));
}
