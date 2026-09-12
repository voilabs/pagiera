import assert from 'node:assert/strict';
import { normalizeFieldAppearance, fieldAppearanceCss } from '../src/internal/lib/editor/field-appearance';
import { normalizeDisclosure, disclosureChildren } from '../src/internal/lib/editor/disclosure';
import { createElement } from '../src/internal/lib/editor/tree';
import { parseElements } from '../src/internal/lib/editor/validate';
import { SHADER_PRESETS, shaderDocument } from '../src/internal/lib/editor/shaders';
const field = normalizeFieldAppearance({ arrow: 'chevron', arrowSize: 999, focusColor: 'unsafe', disabledOpacity: -1 })!;
assert.equal(field.arrowSize, 40); assert.equal(field.focusColor, '#5402e6'); assert.equal(field.disabledOpacity, 0);
assert.ok(fieldAppearanceCss('.field', field, true).includes(':not([multiple])'));
assert.ok(fieldAppearanceCss('.field', field, true).includes('appearance:none'));
assert.ok(!fieldAppearanceCss('.field', field, false).includes('appearance:none'));
assert.equal(normalizeDisclosure({ kind: 'bad', role: 'root' }), undefined);
for (const kind of ['tabs', 'accordion'] as const) {
    const root = createElement('Frame', { x: 0, y: 0, z: 0 });
    root.disclosure = { kind, role: 'root', target: '' };
    const children = disclosureChildren(root);
    assert.equal(children.filter(item => item.disclosure?.role === 'trigger').length, 3);
    assert.equal(children.filter(item => item.disclosure?.role === 'panel').length, 3);
    const parsed = parseElements(JSON.parse(JSON.stringify([root, ...children])));
    assert.deepEqual(parsed.map(item => item.disclosure), [root, ...children].map(item => item.disclosure));
    assert.equal(new Set(parsed.map(item => item.id)).size, parsed.length);
}
for (const id of ['mesh', 'noise', 'waves']) { assert.ok(SHADER_PRESETS.some(p => p.id === id)); assert.ok(shaderDocument(id).includes('gl.FRAGMENT_SHADER')); }
assert.notEqual(shaderDocument('mesh'), shaderDocument('waves'));
console.log('Form appearance, disclosure structure/persistence and new shader presets passed.');
