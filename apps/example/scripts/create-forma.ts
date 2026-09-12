import { BASE_STYLE, DEFAULT_ROOT_STYLE, type CanvasElement, type ElementStyle, type ElementType } from '../../../packages/pagiera/src/internal/lib/editor/types';
import { normalizeInteractive } from '../../../packages/pagiera/src/internal/lib/editor/interactive';
import { normalizeShader, shaderDocument } from '../../../packages/pagiera/src/internal/lib/editor/shaders';
import { parseElements, parseRootStyle } from '../../../packages/pagiera/src/internal/lib/editor/validate';

// Native Pagiera document: no embedded HTML page or external stylesheet.
const elements: CanvasElement[] = [];
const ink = '#241b30', paper = '#f7f6f2', muted = '#776c80';
function add(type: ElementType, name: string, parentId?: string, style: Partial<ElementStyle> = {}, props: Partial<CanvasElement> = {}) {
    const id = `forma-${elements.length + 1}`;
    const el: CanvasElement = { id, type, name, parentId, z: elements.length, base: { ...BASE_STYLE, layout: 'stack', widthMode: 'fill', heightMode: 'auto', color: ink, ...style }, ...props };
    elements.push(el); return el;
}
function text(name: string, content: string, parentId: string, size = 16, style: Partial<ElementStyle> = {}) {
    return add(size >= 32 ? 'Heading' : 'Text', name, parentId, { fontSize: size, lineHeight: 1.3, ...style }, { content });
}
function row(name: string, parentId?: string, style: Partial<ElementStyle> = {}) { return add('Frame', name, parentId, { direction: 'row', align: 'center', justify: 'between', gap: 24, ...style }); }
function section(name: string, color = paper) {
    const s = add('Frame', name, undefined, { bg: color, padT: 76, padB: 76, padL: 60, padR: 60, gap: 34 });
    s.overrides = { tablet: { padL: 32, padR: 32 }, mobile: { padL: 22, padR: 22, padT: 44, padB: 44 } }; return s;
}
function label(content: string, parent: string, color = muted) { return text(content, content, parent, 10, { color, letterSpacing: 1.3 }); }
function button(content: string, parent: string, href?: string, style: Partial<ElementStyle> = {}) {
    return add('Button', content, parent, { widthMode: 'auto', padT: 15, padB: 15, padL: 22, padR: 22, radius: 8, bg: ink, color: paper, fontSize: 13, ...style }, { content, href, hover: { opacity: 85 } });
}
function responsiveRow(el: CanvasElement) { el.overrides = { mobile: { direction: 'column', align: 'stretch' } }; return el; }

const nav = row('Navigation', undefined, { h: 90, heightMode: 'fixed', padL: 60, padR: 60, bg: paper });
nav.overrides = { mobile: { padL: 22, padR: 22, h: 72 } };
text('Forma wordmark', '▰ forma®', nav.id, 30, { widthMode: 'auto', fontWeight: 'bold', letterSpacing: -1 });
const links = row('Navigation links', nav.id, { widthMode: 'auto', gap: 30 }); links.overrides = { mobile: { hidden: true } };
for (const [title, target] of [['Selected work', '#work'], ['The studio', '#studio']]) button(title, links.id, target, { bg: 'transparent', color: ink, padL: 0, padR: 0 });
button('Let’s talk ↗', nav.id, '#contact', { bg: 'transparent', color: ink });

const hero = add('Frame', 'Hero · live shader', undefined, { bg: '#170824', h: 740, heightMode: 'fixed', layout: 'absolute', overflow: 'hidden', radius: 18, marginL: 18, marginR: 18, widthMode: 'auto', alignSelf: 'stretch' });
hero.overrides = { tablet: { h: 700 }, mobile: { h: 730, marginL: 10, marginR: 10 } };
const shader = normalizeShader({ preset: 'aurora', colors: ['#13032a', '#5402e6', '#c59aff'], speed: .6, scale: .8 })!;
add('Frame', 'Shader · Aurora', hero.id, { position: 'absolute', widthMode: 'fill', heightMode: 'fill' }, { shader, code: shaderDocument('aurora', shader) });
add('Frame', 'Hero contrast overlay', hero.id, { position: 'absolute', widthMode: 'fill', heightMode: 'fill', gradient: 'linear-gradient(90deg,#100919ed,#16072188 55%,#26114522)' });
const heroBody = add('Frame', 'Hero content', hero.id, { position: 'absolute', widthMode: 'fill', heightMode: 'fill', padT: 35, padB: 28, padL: 48, padR: 48, justify: 'between', gap: 30 });
heroBody.overrides = { mobile: { padL: 24, padR: 24 } };
const heroTop = row('Hero status', heroBody.id);
text('Availability', '●  Independent minds. Shared ambition.', heroTop.id, 12, { color: '#d7f7b5' });
const geo = label('BASED EVERYWHERE / CREATING BEYOND', heroTop.id, '#dacbe8'); geo.overrides = { mobile: { hidden: true } };
const heroMain = row('Hero columns', heroBody.id, { align: 'center', gap: 24 }); heroMain.overrides = { mobile: { direction: 'column', align: 'stretch' } };
const intro = add('Frame', 'Introduction', heroMain.id, { gap: 24 });
label('A SMALL STUDIO FOR BIG POSSIBILITIES', intro.id, '#d9cbe6');
const headline = text('Main headline', 'Good ideas.\nExtraordinary', intro.id, 78, { color: '#ffffff', lineHeight: 1, letterSpacing: -4 });
headline.overrides = { tablet: { fontSize: 56 }, mobile: { fontSize: 47, letterSpacing: -2 } };
const emphasis = text('Serif headline', 'possibilities.', intro.id, 76, { color: '#dec8ff', lineHeight: 1, fontFamily: 'Georgia, serif', letterSpacing: -3 }); emphasis.overrides = { tablet: { fontSize: 58 }, mobile: { fontSize: 48 } };
text('Introduction copy', 'We turn a spark into something people feel.\nThoughtful brands. Expressive websites. Lasting impressions.', intro.id, 13, { color: '#dfd1ed', lineHeight: 1.8 });
button('Explore our work  ↗', intro.id, '#work', { bg: paper, color: ink });
const art = add('Frame', 'Orbital sculpture · editable rings', heroMain.id, { layout: 'absolute', h: 360, heightMode: 'fixed' }); art.overrides = { tablet: { hidden: true } };
for (let i = 0; i < 4; i++) add('Frame', `Orbit ${i + 1}`, art.id, { position: 'absolute', constraintX: 'center', constraintY: 'center', widthMode: 'fixed', heightMode: 'fixed', w: 330, h: 130, radius: 999, borderW: 19, borderC: ['#dcc5fc', '#b894e7', '#ebdcff', '#ccb0ed'][i], rotate: i * 47, shadow: 'inset 3px 5px 8px #ffffff80, 8px 12px 20px #22074860' });
text('Orbit monogram', 'f.', art.id, 80, { position: 'absolute', constraintX: 'center', constraintY: 'center', widthMode: 'auto', fontFamily: 'Georgia, serif', color: '#eddaff' });
label('STRATEGY · DESIGN · DEVELOPMENT                                  SCROLL TO DISCOVER ↓', heroBody.id, '#d4c3e3');

const trust = row('Collaborators', undefined, { padT: 35, padB: 35, padL: 60, padR: 60 }); trust.overrides = { mobile: { direction: 'column', padL: 22, padR: 22 } };
text('Collaborators label', 'GOOD COMPANY.\nEVEN BETTER COLLABORATIONS.', trust.id, 9, { widthMode: 'fixed', w: 220, color: muted, letterSpacing: 1 });
const marquee = add('Frame', 'Logo marquee', trust.id, { h: 46, heightMode: 'fixed', gap: 55, overflow: 'hidden' }, { interactive: normalizeInteractive({ kind: 'marquee', items: [], autoplay: true, interval: 28 }) });
for (const name of ['⊕ Layers', 'Sisyphus', '▰ Circooles', 'Catalog', '⌘ Quotient', 'Nietzsche']) text(`Logo · ${name}`, name, marquee.id, 25, { widthMode: 'auto', color: '#6e617c', fontWeight: 'bold' });

const work = section('Selected work'); work.attributes = [{ name: 'id', value: 'work' }];
label('01 / SELECTED WORK', work.id);
text('Work heading', 'Different by design.', work.id, 48, { letterSpacing: -2 });
text('Work description', 'A few things we’ve put our hearts into. Always intentional. Never off the shelf.', work.id, 14, { color: muted });
const carousel = add('Frame', 'Projects carousel', work.id, { h: 500, heightMode: 'fixed', radius: 16, overflow: 'hidden' }, { interactive: normalizeInteractive({ kind: 'carousel', items: [], autoplay: false, loop: true, transition: 'slide', duration: 650, arrows: false, dots: false }) });
carousel.overrides = { mobile: { h: 620 } };
const projectData = [['Objects of tomorrow.', 'ora', '#e2d8ed', '#50336e'], ['A little less ordinary.', 'off.', '#e5edc9', '#38482b'], ['Made to move you.', 'movo', '#f3ddd3', '#994c37']];
projectData.forEach(([title, word, bg, dark], i) => {
    const slide = responsiveRow(row(`Slide ${i + 1} · ${word}`, carousel.id, { heightMode: 'fill', bg, padT: 35, padL: 42, padR: 42, padB: 78, gap: 35 }));
    slide.overrides = { mobile: { direction: 'column', padL: 24, padR: 24, gap: 22 } };
    const copy = add('Frame', 'Project description', slide.id, { gap: 20, justify: 'center' });
    label(`0${i + 1} / BRAND STRATEGY · DIGITAL EXPERIENCE`, copy.id);
    const titleEl = text('Project title', title, copy.id, 51, { lineHeight: 1.05, letterSpacing: -2 }); titleEl.overrides = { mobile: { fontSize: 32 } };
    text('Project summary', 'A new perspective on everyday essentials.', copy.id, 13, { color: muted });
    text('Project tags', 'Brand identity  /  Digital experience', copy.id, 11);
    const poster = add('Frame', `Editable poster · ${word}`, slide.id, { widthMode: 'fixed', w: 265, heightMode: 'fixed', h: 330, bg: dark, padT: 24, padB: 24, padL: 24, padR: 24, justify: 'between', rotate: i === 1 ? 6 : -6, shadow: '12px 18px 25px #26153930' });
    poster.overrides = { mobile: { w: 220, h: 240 } };
    label('EVERYDAY, REIMAGINED.', poster.id, '#e9d3fa');
    text('Poster wordmark', word + '®', poster.id, 87, { color: '#efddff', fontFamily: 'Georgia, serif', letterSpacing: -6 });
    label('LESS, BUT WITH MORE FEELING. ↗', poster.id, '#e9d3fa');
});
const pagination = row('Custom pagination', carousel.id, { position: 'absolute', constraintY: 'end', x: 24, y: 20, widthMode: 'auto', gap: 6 }); pagination.carouselControl = { action: 'group', slide: 1 };
for (let i = 0; i < 3; i++) { const dot = button(`0${i + 1}`, pagination.id, undefined, { bg: 'transparent', color: ink, padL: 12, padR: 12, padT: 8, padB: 8 }); dot.carouselControl = { action: 'go-to', slide: i + 1, activeColor: '#cab2e3', inactiveOpacity: 40 }; }
for (const [action, glyph, x] of [['previous', '←', 72], ['next', '→', 24]] as const) { const arrow = button(glyph, carousel.id, undefined, { position: 'absolute', constraintX: 'end', constraintY: 'end', x, y: 20, radius: 99, w: 38, h: 38, widthMode: 'fixed', heightMode: 'fixed', padT: 0, padB: 0, padL: 0, padR: 0, align: 'center', justify: 'center', bg: '#ffffff55', color: ink, fontSize: 22 }); arrow.carouselControl = { action, slide: 1 }; }

const studio = section('Studio and services'); studio.attributes = [{ name: 'id', value: 'studio' }];
label('02 / SMALL TEAM. FULL PICTURE.', studio.id);
text('Studio heading', 'Not just how it looks.\nHow it makes you feel.', studio.id, 48, { letterSpacing: -2 });
text('Studio introduction', 'A close-knit collective of thinkers, designers and builders. We connect the dots between what makes you different and what makes people care.', studio.id, 16, { color: muted, lineHeight: 1.8 });
const services = responsiveRow(row('Service cards', studio.id, { align: 'stretch', gap: 16 }));
[['✳', 'Brand & identity', 'Find your own voice.'], ['⌘', 'Web & digital design', 'Make every click count.'], ['◉', 'Motion & interaction', 'Give ideas momentum.']].forEach(([icon, category, title], i) => {
    const card = add('Frame', `Service · ${category}`, services.id, { bg: '#eeece7', radius: 12, padT: 28, padB: 28, padL: 28, padR: 28, gap: 22 });
    text('Service symbol', icon, card.id, 38, { color: '#715584' }); label(`0${i + 1} / ${category}`, card.id);
    text('Service title', title, card.id, 25, { letterSpacing: -.8 });
    text('Service description', 'Thoughtful details. A clear point of view. Experiences that make people stop, feel and explore.', card.id, 13, { color: muted, lineHeight: 1.8 });
});
const faq = section('Questions'); label('03 / A LITTLE CLARITY', faq.id); text('FAQ heading', 'Good questions. Straight answers.', faq.id, 43);
for (const [q, answer] of [['What can we create together?', 'A brand from scratch, a new website or an ongoing creative partnership.'], ['How does a project usually work?', 'Discover, design, build and refine. You’re part of the process throughout.'], ['Can you work with our existing team?', 'Absolutely. We can lead the creative process or join for a specific part.']]) {
    const group = add('Frame', q, faq.id, { gap: 16, padT: 18, padB: 18, borderB: 1, borderC: '#ddd4e4' });
    const trigger = button(q + '  +', group.id, undefined, { bg: 'transparent', color: ink, widthMode: 'fill', padL: 0, padR: 0 });
    const body = text('Expandable answer', answer, group.id, 14, { hidden: true, color: muted });
    trigger.interaction = { trigger: 'click', action: 'toggle-layer', value: body.id };
}
const contact = section('Contact', '#e4d9f1'); contact.attributes = [{ name: 'id', value: 'contact' }]; label('NEXT CHAPTER STARTS HERE', contact.id);
text('Contact heading', 'Have a good feeling? Let’s follow it.', contact.id, 48, { letterSpacing: -2 });
text('Contact note', 'Demo form — fields are editable. No submission endpoint is connected.', contact.id, 12, { color: muted });
const form = add('Form', 'Contact form', contact.id, { gap: 22 }, { formSubmitMode: 'native' });
const fields = responsiveRow(row('Name and email', form.id));
for (const [title, name, kind] of [['Your name', 'name', 'text'], ['Email address', 'email', 'email']] as const) {
    const field = add('Frame', title, fields.id, { gap: 10 });
    const input = add('Input', title + ' input', field.id, { h: 48, heightMode: 'fixed', bg: '#f2eaf8', radius: 8, padL: 14, padR: 14, fontSize: 14 }, { fieldName: name, inputType: kind, placeholder: title });
    add('Label', title + ' label', field.id, { fontSize: 12, order: -1 }, { content: title, labelFor: input.id });
}
add('Select', 'Choose a service', form.id, { h: 48, heightMode: 'fixed', bg: '#f2eaf8', radius: 8, padL: 14 }, { fieldName: 'service', options: [{ label: 'Brand & identity', value: 'brand' }, { label: 'Website & development', value: 'web' }, { label: 'Creative partnership', value: 'creative' }] });
add('Textarea', 'Your project idea', form.id, { h: 110, heightMode: 'fixed', bg: '#f2eaf8', radius: 8, padT: 14, padL: 14 }, { fieldName: 'message', placeholder: 'The beginning of something good…' });
button('Start a conversation ↗', form.id);
const footer = section('Footer'); footer.base.padT = 35; footer.base.padB = 35;
text('Footer wordmark', '▰ forma®', footer.id, 32, { fontWeight: 'bold' });
label('INDEPENDENT BY NATURE. CONNECTED BY DESIGN.  /  © 2026 FORMA', footer.id);

export const document = {
    elements: parseElements(elements),
    rootStyle: parseRootStyle({ ...DEFAULT_ROOT_STYLE, bg: paper, maxWidth: 1280, fullWidth: true, fontFamily: 'var(--font-geist-sans), Arial, sans-serif', breakpoints: [{ id: 'desktop', name: 'Desktop', width: 1280 }, { id: 'tablet', name: 'Tablet', width: 768 }, { id: 'mobile', name: 'Mobile', width: 390 }] }),
    dataSources: [],
};

if ((import.meta as ImportMeta & { main?: boolean }).main) {
    const base = 'http://localhost:3000/api/pagiera';
    const create = await fetch(`${base}/pages`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Forma Studio', slug: 'forma-studio' }) });
    const created = await create.json();
    if (!create.ok || !created.pageId) throw new Error(`Could not create a new draft: ${JSON.stringify(created)}`);
    const bootstrap = await (await fetch(`${base}/bootstrap?pageId=${created.pageId}`)).json();
    const saved = await fetch(`${base}/pages/${created.pageId}/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ document, expectedVersion: bootstrap.page.version }) });
    const result = await saved.json();
    if (!saved.ok || result.status !== 'saved') throw new Error(`Save failed for ${created.pageId}: ${JSON.stringify(result)}`);
    console.log(JSON.stringify({ pageId: created.pageId, layers: document.elements.length, result, editor: `/editor/${created.pageId}/layers` }));
}
