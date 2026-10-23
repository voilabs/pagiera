import assert from 'node:assert/strict';
import { createElement } from '../src/internal/lib/editor/tree';
import { parseElements } from '../src/internal/lib/editor/validate';
import { entranceFrom, springCurve, stateTransition } from '../src/internal/lib/editor/motion';
import { classFor, ENTRANCE_SCRIPT, stylesheetFor } from '../src/internal/lib/render/css';
import { type CanvasElement, DEFAULT_ROOT_STYLE } from '../src/internal/lib/editor/types';

// A spring's length comes from its physics, and an underdamped one overshoots.
const bouncy = springCurve({ stiffness: 320, damping: 12, mass: 1 });
assert.ok(bouncy.easing.startsWith('linear(0, '));
assert.ok(Math.max(...bouncy.points) > 1.05, 'underdamped spring overshoots');
assert.equal(bouncy.points.at(-1), 1);
const stiff = springCurve({ stiffness: 900, damping: 60, mass: 1 });
assert.ok(stiff.duration < bouncy.duration, 'a stiffer, damped spring settles sooner');
assert.ok(Math.max(...stiff.points) <= 1.001, 'a critically damped spring does not overshoot');
assert.ok(springCurve({ stiffness: 200, damping: 20, mass: 4 }).duration > springCurve({ stiffness: 200, damping: 20, mass: 1 }).duration);

const base = createElement('Text', { x: 0, y: 0, z: 0 });
const custom = entranceFrom({ ...base.base, entrance: 'custom', entranceX: -20, entranceY: 30, entranceScale: 80, entranceRotate: 10, entranceBlur: 6, entranceOpacity: 0 });
assert.deepEqual(custom, { opacity: 0, translate: '-20px 30px', scale: '0.8', rotate: '10deg', filter: 'blur(6px)' });

// Old documents round-trip; new fields validate and clamp.
const parent: CanvasElement = {
    ...createElement('Frame', { x: 0, y: 0, z: 0 }),
    id: 'parent',
    base: { ...createElement('Frame', { x: 0, y: 0, z: 0 }).base, layout: 'stack', entrance: 'up', entranceSplit: 'children', entranceStagger: 90, entranceCurve: 'spring', entranceReplay: true, entranceOffset: 20 },
};
const childA: CanvasElement = { ...createElement('Text', { x: 0, y: 0, z: 0 }), id: 'a', parentId: 'parent', loop: { type: 'float', duration: 2000, amount: 150 } };
const childB: CanvasElement = { ...createElement('Text', { x: 0, y: 0, z: 0 }), id: 'b', parentId: 'parent', hover: { translateY: -4, rotateX: 8 }, transition: { curve: 'spring', duration: 300, bezier: '0.16, 1, 0.3, 1', stiffness: 400, damping: 30, mass: 1 } };
const scroller: CanvasElement = { ...createElement('Text', { x: 0, y: 0, z: 0 }), id: 's', base: { ...base.base, scrollEffect: 'slide-left', scrollRange: 'exit', scrollAmount: 120 } };
const parsed = parseElements(JSON.parse(JSON.stringify([parent, childA, childB, scroller])));
assert.equal(parsed[0].base.entranceSplit, 'children');
assert.equal(parsed[0].base.entranceReplay, true);
assert.deepEqual(parsed[1].loop, { type: 'float', duration: 2000, amount: 150 });
assert.equal(parsed[2].transition?.curve, 'spring');
assert.equal(parsed[3].base.scrollRange, 'exit');
const legacy = parseElements([{ ...createElement('Text', { x: 0, y: 0, z: 0 }), loop: { type: 'spin', duration: 900 }, base: { ...base.base, scrollRange: 'nowhere', springMass: 99 } }])[0];
assert.deepEqual(legacy.loop, { type: 'spin', duration: 900 });
assert.equal(legacy.base.scrollRange, 'auto');
assert.equal(legacy.base.springMass, 10);

const css = stylesheetFor(parsed, DEFAULT_ROOT_STYLE);
const p = classFor('parent');
const a = classFor('a');
// Children mode: the parent stays visible, each child is staggered.
assert.ok(css.includes(`.pg-ready .${p}.pg-in .${a}{`));
assert.ok(css.includes('animation-delay:90ms'), 'second child waits one stagger step');
// The spring ships as linear() with a cubic fallback before it.
assert.match(css, /animation-timing-function:cubic-bezier\([^;]+\);animation-timing-function:linear\(/);
// A loop inside an entrance starts after it instead of being overridden.
assert.ok(css.includes(`pg-e-${p},pg-loop-float`));
assert.ok(css.includes('--pg-la:1.50'));
// The resting state is the element's own: nothing forces opacity back to 1.
assert.ok(!css.includes('.pg-in{opacity:1}'));
assert.ok(css.includes('prefers-reduced-motion:no-preference'));
// Hover transforms and spring transitions.
assert.ok(css.includes('perspective(1000px)'));
assert.ok(css.includes(`transition:${stateTransition(parsed[2].transition).fallback};transition:${stateTransition(parsed[2].transition).value}`));
// Scroll: exit range plays the arrival backwards.
assert.ok(css.includes('animation-direction:reverse'));
assert.ok(css.includes('animation-range:exit 0% exit 100%'));
assert.ok(css.includes('--pg-amt:120px'));
// The runtime knows about replay and per-element offsets.
assert.ok(ENTRANCE_SCRIPT.includes('data-pg-replay'));
assert.ok(ENTRANCE_SCRIPT.includes('data-pg-offset'));

console.log('motion tests passed');
