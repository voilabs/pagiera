import { createElement } from './tree';
import type { CanvasElement } from './types';
export type Disclosure = { kind: 'tabs' | 'accordion'; role: 'root' | 'trigger' | 'panel'; target: string };
export function normalizeDisclosure(value: unknown): Disclosure | undefined {
    if (!value || typeof value !== 'object') return;
    const v = value as Partial<Disclosure>;
    if (!['tabs', 'accordion'].includes(v.kind ?? '') || !['root', 'trigger', 'panel'].includes(v.role ?? '')) return;
    return { kind: v.kind!, role: v.role!, target: typeof v.target === 'string' ? v.target.slice(0, 100) : '' };
}
export function disclosureAttributes(value?: Disclosure): Record<string, string | undefined> {
    return value ? { 'data-pg-disclosure': value.role === 'root' ? value.kind : undefined, 'data-pg-disclosure-role': value.role, 'data-pg-disclosure-target': value.target } : {};
}
/** Headers and panels are ordinary editable layers, not generated HTML. */
export function disclosureChildren(root: CanvasElement): CanvasElement[] {
    const kind = root.disclosure!.kind;
    const children: CanvasElement[] = [];
    function child(type: 'Frame' | 'Button' | 'Text', name: string, parentId: string) {
        const el = createElement(type, { x: 0, y: 0, z: children.length, parentId }); el.name = name;
        el.base = { ...el.base, position: 'static', layout: 'stack', direction: 'column', widthMode: 'fill', heightMode: 'auto', gap: 12, bg: 'transparent', borderW: 0 };
        children.push(el); return el;
    }
    const tabs = kind === 'tabs' ? child('Frame', 'Tab buttons', root.id) : undefined;
    if (tabs) tabs.base.direction = 'row';
    for (let i = 0; i < 3; i++) {
        const target = String(i + 1);
        const trigger = child('Button', `${kind === 'tabs' ? 'Tab' : 'Question'} ${target}`, tabs?.id ?? root.id);
        trigger.content = trigger.name; trigger.disclosure = { kind, role: 'trigger', target };
        trigger.base = { ...trigger.base, bg: '#ece7f5', color: '#251a35', radius: 8, padT: 14, padB: 14, padL: 18, padR: 18 };
        const panel = child('Frame', `Panel ${target}`, root.id);
        panel.disclosure = { kind, role: 'panel', target };
        panel.base = { ...panel.base, bg: '#f7f5fa', padT: 24, padB: 24, padL: 24, padR: 24, radius: 8 };
        const content = child('Text', `Panel ${target} content`, panel.id);
        content.content = 'Design this panel with text, images, buttons or any other layers.';
        content.base.color = '#51465f';
    }
    return children;
}
