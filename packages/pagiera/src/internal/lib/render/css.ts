import type { CSSProperties } from "react";
import { fieldAppearanceCss } from "../editor/field-appearance";
import {
    isBand,
    resolveStyle,
    rootStyleToCss,
    splitBand,
    styleToCss,
    textOnly,
    textOnlyPlacementCss,
} from "@/lib/editor/style";
import {
    baseOf,
    type Cascade,
    cascadeOf,
    DEFAULT_CASCADE,
    mediaPlan,
} from "@/lib/editor/cascade";
import { childrenOf } from "@/lib/editor/tree";
import {
    type AnimationLayer,
    animationDeclarations,
    entranceFrom,
    entranceTiming,
    entranceTo,
    frameToCss,
    LOOP_KEYFRAMES,
    loopAmount,
    loopLayer,
    stateTransition,
} from "@/lib/editor/motion";
import {
    type Breakpoint,
    type CanvasElement,
    type RootStyle,
} from "@/lib/editor/types";

/** Properties that take a raw number rather than pixels. */
const UNITLESS = new Set([
    "opacity",
    "zIndex",
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "lineHeight",
    "order",
    "fontWeight",
    "columns",
]);

function kebab(property: string) {
    return property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

export function declarationsToCss(css: CSSProperties): string {
    return Object.entries(css)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([property, value]) => {
            const rendered =
                typeof value === "number" && !UNITLESS.has(property)
                    ? `${value}px`
                    : String(value);
            return `${kebab(property)}:${rendered}`;
        })
        .join(";");
}

/** A CSS-identifier-safe class for one element. */
export function classFor(id: string) {
    return `pg-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/**
 * "inherit" means "the page default" — which on a published page is a neutral
 * system stack, not whatever the surrounding app happens to set.
 */
export const DEFAULT_PAGE_FONT = "ui-sans-serif, system-ui, sans-serif";

function pageTransitionCss(rootStyle: RootStyle) {
    const kind = rootStyle.pageTransition ?? "smooth";
    // No reserved gutter: it left an empty strip beside full-bleed backgrounds.
    if (kind === "none") return "";

    const duration = Math.max(120, Math.min(1200, rootStyle.pageTransitionDuration ?? 380));
    const leaveDuration = Math.max(90, Math.round(duration * 0.48));
    const frames = kind === "fade"
        ? {
              leave: "to{opacity:0}",
              enter: "from{opacity:0}to{opacity:1}",
          }
        : kind === "slide"
          ? {
                leave: "to{opacity:0;transform:translateX(-20px)}",
                enter: "from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}",
            }
          : {
                leave: "to{opacity:0;transform:translateY(-6px);filter:blur(3px)}",
                enter: "from{opacity:0;transform:translateY(10px);filter:blur(5px)}to{opacity:1;transform:none;filter:blur(0)}",
            };

    return `
@view-transition{navigation:auto}
::view-transition-old(root),::view-transition-new(root){mix-blend-mode:normal;animation-fill-mode:both}
::view-transition-old(root){animation:pg-page-leave ${leaveDuration}ms cubic-bezier(.4,0,1,1) both}
::view-transition-new(root){animation:pg-page-enter ${duration}ms cubic-bezier(.16,1,.3,1) both}
@keyframes pg-page-leave{${frames.leave}}
@keyframes pg-page-enter{${frames.enter}}
@media (prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}}
`;
}

export function resolveFont(fontFamily: string) {
    return fontFamily === "inherit" || fontFamily === ""
        ? DEFAULT_PAGE_FONT
        : fontFamily;
}

/**
 * Breakpoints are emitted as real media queries so a published page responds
 * to the viewport rather than to whatever the editor was previewing.
 */
/**
 * The rules for one element. A full-bleed band produces two: the shell that
 * spans the viewport and the inner box that holds the content width.
 */
function rulesFor(
    element: CanvasElement,
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    rootStyle: RootStyle,
    cascade: Cascade,
): Array<[suffix: string, declarations: CSSProperties]> {
    const parent = element.parentId ? byId.get(element.parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;
    const style = resolveStyle(element, breakpoint, cascade);

    const css = styleToCss(
        style,
        {
            parentLayout: parentStyle?.layout ?? "stack",
            parentDirection: parentStyle?.direction ?? "column",
            parentAlign: parentStyle?.align ?? rootStyle.align,
            textOnly: textOnly(element, byId),
        },
        element,
    );
    if (style.hidden) css.display = "none";

    if (!isBand(element.type, style, rootStyle) || style.hidden) {
        return [["", css]];
    }

    const { shell, inner } = splitBand(css, rootStyle.maxWidth);
    return [
        ["", shell],
        [">.pg-inner", inner],
    ];
}

/**
 * `styleToCss` leaves a property out when it holds its default (no padding, no
 * blur, full opacity), which is right for a lone rule but not for one that
 * overrides another: an omitted declaration lets the overridden value through.
 * Anything the other rule sets and this one omits is reset with `unset`.
 */
function withResets(css: CSSProperties, overridden: Iterable<string>): CSSProperties {
    const out = { ...css } as Record<string, unknown>;
    for (const property of overridden) {
        const value = out[property];
        if (value === undefined || value === null || value === "") out[property] = "unset";
    }
    return out as CSSProperties;
}

function setProperties(css: CSSProperties) {
    return Object.entries(css)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([property]) => property);
}

/**
 * Interaction states must only override the declarations they actually
 * change. Re-emitting the complete base style from `:hover` used to win over
 * responsive rules through the pseudo-class's higher specificity, making a
 * button inside a component jump back to its desktop size and placement.
 */
function interactionDeclarations(
    element: CanvasElement,
    byId: Map<string, CanvasElement>,
    breakpoint: Breakpoint,
    rootStyle: RootStyle,
    cascade: Cascade,
    patch: NonNullable<CanvasElement["hover"]>,
    carried: Set<string> = new Set(),
) {
    const parent = element.parentId ? byId.get(element.parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;
    const context = {
        parentLayout: parentStyle?.layout ?? "stack",
        parentDirection: parentStyle?.direction ?? "column",
        parentAlign: parentStyle?.align ?? rootStyle.align,
        textOnly: textOnly(element, byId),
    } as const;
    const resting = resolveStyle(element, breakpoint, cascade);
    const restingCss = styleToCss(resting, context, element);
    const activeCss = styleToCss({ ...resting, ...patch }, context, element);
    const delta: CSSProperties = {};
    const properties = new Set([...Object.keys(activeCss), ...setProperties(restingCss)]) as Set<keyof CSSProperties>;
    for (const property of properties) {
        if (activeCss[property] !== restingCss[property]) {
            // CSSProperties is a heterogeneous map; this assignment is safe
            // because both values come from the same property key.
            // A state that returns a property to its default omits it, so
            // the resting value has to be reset explicitly.
            const active = activeCss[property];
            (delta as Record<string, unknown>)[property as string] =
                active === undefined || active === null || active === "" ? "unset" : active;
        }
    }
    // A hidden layer has no box at all, so "show it" is not among the
    // differences above — the resting rule is what hides it. Revealing one is
    // giving it back the display its own layout asks for.
    if (resting.hidden && patch.hidden === false) delta.display = activeCss.display;
    // A wider breakpoint's state rule still matches here, so whatever it set
    // has to be restated at this breakpoint's own active value.
    for (const property of carried) {
        if (property in delta) continue;
        const active = (activeCss as Record<string, unknown>)[property];
        (delta as Record<string, unknown>)[property] = active === undefined || active === null || active === "" ? "unset" : active;
    }
    for (const property of setProperties(delta)) carried.add(property);
    return declarationsToCss(delta);
}

/** Whether hovering is what makes this layer exist on the page at all. */
function revealsOnHover(element: CanvasElement) {
    return element.hover?.hidden === false;
}

function hoverSelector(element: CanvasElement, byId: Map<string, CanvasElement>) {
    const parent = element.hoverTrigger === "parent" && element.parentId
        ? byId.get(element.parentId)
        : undefined;
    if (!parent) return `.${classFor(element.id)}:hover`;
    const hovered = `.${classFor(parent.id)}:hover .${classFor(element.id)}`;
    // A menu that only a pointer can open is closed to everyone on a keyboard,
    // so focus inside the parent opens a revealed layer too.
    return revealsOnHover(element)
        ? `${hovered},.${classFor(parent.id)}:focus-within .${classFor(element.id)}`
        : hovered;
}

/**
 * The shared half of every entrance; each element adds its own keyframes.
 *
 * Entrance keyframes animate `translate`/`scale`/`rotate` rather than
 * `transform`, so they compose with an element's own rotation or scale
 * instead of clobbering it, and they give only a start: the end is the
 * element's own style, which is also what it rests at once revealed. Nothing
 * forces it to full opacity afterwards, so a 60% layer stays at 60%.
 */
const ENTRANCE_CSS = `
.pg-part{display:inline-block;white-space:pre-wrap}
/* The hidden start state is applied only once the script is running, so a
   visitor without JavaScript still sees every element. A split entrance hides
   the pieces it animates instead of the element that holds them. Each piece
   is inline-block because translate and scale do nothing to an inline box. */
@media (prefers-reduced-motion:no-preference){
.pg-ready .pg-anim:not(.pg-in):not(.pg-split){opacity:0}
.pg-ready .pg-anim:not(.pg-in) .pg-part{opacity:0}
}
@media (prefers-reduced-motion:reduce){.pg-ready .pg-anim,.pg-ready .pg-anim .pg-part{animation:none!important}}
`.trim();

/**
 * Scroll-linked effects run on a view timeline rather than on a reveal: the
 * animation's progress *is* the element's progress across the viewport, so it
 * plays backwards when the visitor scrolls back up.
 *
 * The whole sheet sits behind `@supports`, and there is no JavaScript
 * fallback on purpose — a browser without view timelines shows the finished
 * element, which is the content, rather than a hidden one waiting on a
 * feature it does not have.
 */
const SCROLL_KEYFRAMES = `
@keyframes pg-s-fade{from{opacity:0}}
@keyframes pg-s-rise{from{opacity:0;translate:0 var(--pg-amt,40px)}}
@keyframes pg-s-parallax{from{translate:0 var(--pg-amt,40px)}to{translate:0 calc(var(--pg-amt,40px) * -1)}}
@keyframes pg-s-zoom{from{opacity:0;scale:var(--pg-scale,.9)}}
@keyframes pg-s-blur{from{opacity:0;filter:blur(var(--pg-blur,10px))}}
@keyframes pg-s-slide-left{from{opacity:0;translate:calc(var(--pg-amt,40px) * -1) 0}}
@keyframes pg-s-slide-right{from{opacity:0;translate:var(--pg-amt,40px) 0}}
@keyframes pg-s-rotate{from{opacity:0;rotate:var(--pg-rot,-12deg);scale:.96}}
@keyframes pg-s-shrink{to{opacity:.35;scale:var(--pg-scale,.9)}}
`.trim();

/** Where on its pass across the viewport each scroll range runs. */
const SCROLL_RANGE_CSS = {
    enter: "entry 0% cover 40%",
    cover: "cover 0% cover 100%",
    contain: "contain 0% contain 100%",
    exit: "exit 0% exit 100%",
} as const;

/**
 * A fixed element that appears after a scroll position waits just past the
 * edge it is pinned to and slides in from there. `translate` rather than
 * `transform`, so it composes with the element's own rotation or scale.
 */
const PIN_AFTER_CSS = `
.pg-pin-ready [data-pg-pin-after]{translate:0 -110%;transition:translate .3s ease-in-out}
.pg-pin-ready [data-pg-pin-after][data-pg-pin-side=bottom]{translate:0 110%}
.pg-pin-ready [data-pg-pin-after][data-pg-pin-side=left]{translate:-110% 0}
.pg-pin-ready [data-pg-pin-after][data-pg-pin-side=right]{translate:110% 0}
.pg-pin-ready [data-pg-pin-after].pg-pin-in{translate:none}
@media (prefers-reduced-motion:reduce){.pg-pin-ready [data-pg-pin-after]{transition:none}}
`.trim();

export function hasScrollEffects(
    elements: CanvasElement[],
    cascade: Cascade = DEFAULT_CASCADE,
) {
    const baseId = baseOf(cascade).id;
    return elements.some(
        (el) => resolveStyle(el, baseId, cascade).scrollEffect !== "none",
    );
}

/**
 * The reveal script; static, with no interpolated content.
 *
 * Hiding content until a callback fires is a risky trade on a public page, so
 * this fails open three ways: whatever is already on screen is revealed
 * synchronously, anything still hidden is revealed after a timeout, and the
 * whole hidden state is skipped when IntersectionObserver or motion
 * preferences say so.
 */
export const ENTRANCE_SCRIPT = `
(function(){
  var nodes=document.querySelectorAll('.pg-anim');
  if(!nodes.length)return;
  var reveal=function(n){n.classList.add('pg-in');};
  var all=function(){for(var i=0;i<nodes.length;i++)reveal(nodes[i]);};
  var onScreen=function(n){var r=n.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;};

  if(!('IntersectionObserver' in window)||!window.matchMedia||matchMedia('(prefers-reduced-motion:reduce)').matches){
    all();return;
  }
  document.documentElement.classList.add('pg-ready');

  // Anything already in view animates straight away rather than waiting for
  // the observer's first delivery.
  // Revealed two frames later, so the hidden start state is painted first:
  // after a client-side navigation the new nodes are inserted and scanned in
  // one frame, and a class added before the first paint has nothing to
  // transition from — the content simply popped in.
  var pending=[],visible=[];
  for(var i=0;i<nodes.length;i++){
    if(onScreen(nodes[i]))visible.push(nodes[i]);else pending.push(nodes[i]);
  }

  // One observer per trigger offset: how far into the viewport an element
  // has to come before it plays is the observer's root margin.
  var observers={};
  var watch=function(n){
    var offset=n.getAttribute('data-pg-offset')||'8';
    var io=observers[offset]||(observers[offset]=new IntersectionObserver(function(entries,self){
      for(var j=0;j<entries.length;j++){
        if(!entries[j].isIntersecting)continue;
        reveal(entries[j].target);
        if(!entries[j].target.hasAttribute('data-pg-replay'))self.unobserve(entries[j].target);
      }
    },{threshold:0.15,rootMargin:'0px 0px -'+offset+'% 0px'}));
    io.observe(n);
  };
  // A replaying entrance is reset once it has left the screen completely, so
  // it is hidden again by the time it scrolls back in.
  var away=new IntersectionObserver(function(entries){
    for(var j=0;j<entries.length;j++){
      if(!entries[j].isIntersecting)entries[j].target.classList.remove('pg-in');
    }
  },{threshold:0});

  requestAnimationFrame(function(){requestAnimationFrame(function(){
    for(var v=0;v<visible.length;v++){
      reveal(visible[v]);
      if(visible[v].hasAttribute('data-pg-replay')){watch(visible[v]);away.observe(visible[v]);}
    }
  });});
  for(var k=0;k<pending.length;k++){
    watch(pending[k]);
    if(pending[k].hasAttribute('data-pg-replay'))away.observe(pending[k]);
  }

  // Last resort: never leave content invisible because a callback did not
  // run. Only what is on screen by then — revealing everything would spend
  // the entrances further down before anyone scrolled to them.
  setTimeout(function(){
    for(var n=0;n<nodes.length;n++)if(onScreen(nodes[n]))reveal(nodes[n]);
  },3000);
})();
`.trim();

export function hasEntrances(
    elements: CanvasElement[],
    cascade: Cascade = DEFAULT_CASCADE,
) {
    const baseId = baseOf(cascade).id;
    return elements.some(
        (el) => {
            const style = resolveStyle(el, baseId, cascade);
            return style.entrance !== "none" && style.scrollEffect === "none";
        },
    );
}

/**
 * Builds the stylesheet for a published document: one base rule per element,
 * plus a media block for each breakpoint that actually overrides something,
 * plus hover rules.
 */
export function stylesheetFor(
    elements: CanvasElement[],
    rootStyle: RootStyle,
): string {
    const byId = new Map(elements.map((el) => [el.id, el]));
    const cascade = cascadeOf(rootStyle.breakpoints, rootStyle.baseBreakpointId);
    const baseId = baseOf(cascade).id;
    const parts: string[] = [];
    parts.push(pageTransitionCss(rootStyle));
    for (const font of rootStyle.customFonts ?? []) {
        const family = font.name.replace(/["'{};]/g, "");
        const rawUrl = font.url.replace(/["'()\\]/g, "");
        const url = rawUrl === "/fonts/manrope-variable.woff2"
            ? "/api/pagiera/assets/manrope-variable.woff2"
            : rawUrl;
        parts.push(`@font-face{font-family:"${family}";src:url("${url}") format("woff2");font-weight:${font.weight};font-style:${font.style};font-display:swap}`);
    }

    // The published page lives inside the app's root layout, which paints its
    // own theme background on <body>. Take that over, or the area beside a
    // width-capped page shows the editor's chrome colour rather than the
    // page's own background.
    parts.push(`html,body{margin:0;padding:0;background:${rootStyle.bg}}`);

    parts.push(`html{scroll-behavior:smooth}.pg-root{${declarationsToCss(rootStyleToCss(rootStyle))}}`);

    // A freely placed page positions its children at absolute coordinates, so
    // the page has to be exactly as wide as the artboard those coordinates were
    // drawn on. Left at `width: 100%` the canvas is the viewport instead, and
    // everything the author placed lands somewhere else on the published page.
    // A stacked page needs none of this — flex reflows to whatever width it
    // gets, which is the point of it.
    if (rootStyle.layout === "absolute") {
        // The width is the artboard`s drawing width, not its threshold: the
        // coordinates were laid out on the canvas the author saw, so that is
        // the only width that keeps them where they were put.
        const drawn = (item: { width: number; canvasWidth?: number }) => item.canvasWidth ?? item.width;
        parts.push(`.pg-root{width:${drawn(baseOf(cascade))}px;margin-left:auto;margin-right:auto}`);
        for (const plan of mediaPlan(cascade)) {
            const definition = cascade.breakpoints.find((item) => item.id === plan.id);
            if (definition) parts.push(`@media ${plan.query}{.pg-root{width:${drawn(definition)}px}}`);
        }
    }
    parts.push(
        // The font is pinned on `.pg-root` rather than on <body>: the app's
        // layout puts a font class on <body>, which would out-specify an
        // element selector and leak the editor's typeface into the site.
        // The shell spans the viewport; the content width is applied by each
        // band's inner box, so section backgrounds reach both edges.
            `.pg-root{font-family:${resolveFont(rootStyle.fontFamily)}}` +
            ".pg-node{box-sizing:border-box}" +
            ".pg-component-root{background:transparent!important;background-image:none!important;border-width:0!important;box-shadow:none!important;overflow:visible!important}" +
            // `:is()` contributes the specificity of `button`, so this reset
            // used to beat an element's generated class rule. The editor
            // showed the authored font size/weight while the renderer fell
            // back to the page's 16px/400. `:where()` keeps the reset at zero
            // extra specificity; the per-element rule emitted below wins.
            ".pg-node:where(input,textarea,button){font:inherit}" +
            // A Button publishes as a native <button>, which arrives with the
            // platform's own grey fill and bevelled border. The editor emits a
            // background only when one was set and a border-width only when it
            // is non-zero, so a deliberately transparent, unbordered button was
            // rendering as the operating system's default control. `:where`
            // keeps this at zero specificity, and it is emitted before the
            // per-element rules, so anything the author did set still wins.
            ".pg-node:where(button){appearance:none;background-color:transparent;border-width:0;color:inherit;text-align:inherit}" +
            ".pg-node:is(input,textarea){outline:none}" +
            ".pg-node:is(select){outline:none;appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%271.6%27><path d=%27M4 6.5 8 10.5 12 6.5%27/></svg>\");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px}" +
            // A radio group is several inputs inside one styled box, so the
            // choices lay themselves out rather than inheriting the box's own
            // flow, which is sized for a single control.
            ".pg-node[role=radiogroup]{display:flex;flex-direction:column;gap:8px}" +
            // Text with a `::before`/`::after` from custom CSS keeps them on
            // the text's line (the node itself is a grid, see `textOnly`).
            textOnlyPlacementCss(".pg-text-only") +
            ".pg-choice{display:flex;align-items:center;gap:8px;cursor:pointer}" +
            ".pg-choice input{accent-color:currentColor;margin:0}" +
            ".pg-node:is(input[type=checkbox],input[type=radio]){accent-color:currentColor}" +
            ".pg-node:is(textarea){resize:none}" +
            ".pg-form-status:empty{display:none}" +
            ".pg-form-status{font-size:12px;line-height:1.4}" +
            ".pg-node[data-pg-state=success] .pg-form-status{color:#22c55e}" +
            ".pg-node[data-pg-state=error] .pg-form-status{color:#ef4444}" +
            ".pg-node img{display:block;width:100%;height:100%}" +
            ".pg-node:is(ul,ol){list-style:none}" +
            ".pg-list{counter-reset:pg-list}" +
            ".pg-list>li{position:relative}" +
            ".pg-list-bullet>li::before{content:'\\2022';position:absolute;left:-1em;opacity:.65}" +
            ".pg-list-number>li::before{counter-increment:pg-list;content:counter(pg-list) '.';position:absolute;left:-1.6em;opacity:.65;font-variant-numeric:tabular-nums}" +
            ".pg-node hr{border:0;width:100%;height:100%}" +
            ".pg-node iframe{display:block;width:100%;height:100%;border:0}" +
            // A pasted glyph carries whatever width the author copied it with;
            // the element box is what should decide its size.
            ".pg-svg-glyph>svg{display:block;width:100%;height:100%}" +
            // A Markdown element produces tags nobody styled: its headings and
            // lists are generated at render time, so they never get an element
            // rule of their own. These defaults inherit the element's own font
            // and colour and only set the rhythm — the author still controls
            // size and colour from the element box, as with any other text.
            ".pg-md{width:100%}" +
            ".pg-md>*{margin:0}" +
            ".pg-md>*+*{margin-top:1em}" +
            ".pg-md h1,.pg-md h2,.pg-md h3,.pg-md h4,.pg-md h5,.pg-md h6{font-weight:600;line-height:1.25;margin-top:1.6em;text-wrap:balance}" +
            ".pg-md h1{font-size:1.9em}.pg-md h2{font-size:1.55em}.pg-md h3{font-size:1.25em}.pg-md h4{font-size:1.1em}" +
            ".pg-md :is(ul,ol){padding-left:1.4em}" +
            ".pg-md ul{list-style:disc}.pg-md ol{list-style:decimal}" +
            ".pg-md li+li{margin-top:.35em}" +
            ".pg-md a{color:inherit;text-decoration:underline;text-underline-offset:2px}" +
            ".pg-md img{max-width:100%;height:auto;border-radius:inherit}" +
            ".pg-md blockquote{border-left:3px solid currentColor;padding-left:1em;opacity:.85}" +
            ".pg-md :is(code,pre){font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}" +
            ".pg-md pre{overflow-x:auto;padding:1em;border-radius:.5em;background:rgba(127,127,127,.12)}" +
            ".pg-md pre code{background:none;padding:0}" +
            ".pg-md code{background:rgba(127,127,127,.15);border-radius:.3em;padding:.1em .35em}" +
            ".pg-md table{width:100%;border-collapse:collapse}" +
            ".pg-md :is(th,td){border:1px solid rgba(127,127,127,.35);padding:.45em .7em;text-align:left}" +
            ".pg-md hr{border:0;border-top:1px solid rgba(127,127,127,.35);margin:2em 0}" +
            // A layer that opens or closes another one is a control. This
            // used to be set from the script that wires it up, which changed
            // the element before hydration and logged a mismatch for it.
            ".pg-node[data-pg-target]{cursor:pointer}" +
            ".pg-link{text-decoration:none;color:inherit}",
    );

    // Every property a rule for an element sets, keyed by element and suffix,
    // so a breakpoint rule can reset what the others set and it does not.
    const setByRule = new Map<string, Set<string>>();
    const record = (id: string, suffix: string, css: CSSProperties) => {
        const key = `${id} ${suffix}`;
        const set = setByRule.get(key) ?? new Set<string>();
        for (const property of setProperties(css)) set.add(property);
        setByRule.set(key, set);
    };
    for (const plan of mediaPlan(cascade)) {
        for (const el of elements) {
            for (const [suffix, css] of rulesFor(el, byId, plan.id, rootStyle, cascade)) record(el.id, suffix, css);
        }
    }

    for (const element of elements) {
        parts.push(fieldAppearanceCss(`.${classFor(element.id)}`, element.fieldAppearance, element.type === 'Select'));
        const emitted = rulesFor(element, byId, baseId, rootStyle, cascade)
            .map(([suffix, css]) => {
                record(element.id, suffix, css);
                return `.${classFor(element.id)}${suffix}{${declarationsToCss(css)}}`;
            })
            .join("");
        parts.push(emitted);
        if (element.layoutRole === "layout" && !element.parentId) {
            parts.push(`.${classFor(element.id)}{min-height:100svh;width:100%;flex-shrink:0}`);
        }
    }

    for (const plan of mediaPlan(cascade)) {
        const breakpoint = plan.id;
        // A parent switching layout at this breakpoint changes how its children
        // position themselves, so re-emit descendants of any changed container.
        const affected = elements.filter((el) => {
            if (el.overrides?.[breakpoint]) return true;
            const parent = el.parentId ? byId.get(el.parentId) : undefined;
            return Boolean(parent?.overrides?.[breakpoint]);
        });
        if (affected.length === 0) continue;

        const rules = affected
            .flatMap((el) =>
                rulesFor(el, byId, breakpoint, rootStyle, cascade).map(
                    ([suffix, css]) =>
                        `.${classFor(el.id)}${suffix}{${declarationsToCss(withResets(css, setByRule.get(`${el.id} ${suffix}`) ?? []))}}`,
                ),
            )
            .join("");
        parts.push(`@media ${plan.query}{${rules}}`);
    }

    if (elements.some((element) => { const pinned = resolveStyle(element, baseId, cascade); return pinned.position === "fixed" && pinned.pinAfter > 0; })) parts.push(PIN_AFTER_CSS);

    // Loops come before entrances and scroll effects: those rules restate the
    // loop alongside their own animation, and a later rule of the same
    // specificity has to be the one that wins.
    const loops = elements.filter((element) => element.loop);
    if (loops.length) {
        parts.push(`${LOOP_KEYFRAMES}@media(prefers-reduced-motion:reduce){.pg-node{animation:none!important}}`);
        for (const element of loops) {
            const loop = element.loop!;
            parts.push(`.${classFor(element.id)}{--pg-la:${loopAmount(loop)};${animationDeclarations([loopLayer(loop)])}}`);
        }
    }

    if (hasEntrances(elements, cascade)) {
        parts.push(ENTRANCE_CSS);
        const calm: string[] = [];
        for (const element of elements) {
            const style = resolveStyle(element, baseId, cascade);
            if (style.entrance === "none" || style.scrollEffect !== "none") continue;
            const cls = classFor(element.id);
            const from = entranceFrom(style);
            const to = entranceTo(from);
            parts.push(`@keyframes pg-e-${cls}{from{${frameToCss(from)}}${Object.keys(to).length ? `to{${frameToCss(to)}}` : ""}}`);
            const timing = entranceTiming(style);
            // `backwards` holds the start through the delay and then lets go,
            // so once it has played the element is back on its own style and
            // hover, press and loops are free to change it.
            const entrance = (delay: number | string): AnimationLayer => ({
                name: `pg-e-${cls}`,
                duration: timing.duration,
                easing: timing.easing,
                fallback: timing.fallback,
                delay,
                iterations: 1,
                direction: "normal",
                fill: "backwards",
            });
            // A loop starts where the entrance ends, so the two never fight
            // over the same property.
            const withLoop = (target: CanvasElement, delay: number) =>
                target.loop ? [loopLayer(target.loop, delay + timing.duration)] : [];
            if (style.entranceSplit === "children") {
                // Each direct child gets the parent's entrance, one stagger
                // step after the previous one.
                childrenOf(elements, element.id).forEach((child, index) => {
                    const delay = style.entranceDelay + index * style.entranceStagger;
                    const childCls = classFor(child.id);
                    parts.push(
                        `@media (prefers-reduced-motion:no-preference){.pg-ready .${cls}.pg-anim:not(.pg-in) .${childCls}{opacity:0}}` +
                            `.pg-ready .${cls}.pg-in .${childCls}{${animationDeclarations([entrance(delay), ...withLoop(child, delay)])}}`,
                    );
                    calm.push(`.pg-ready .${cls} .${childCls}`);
                });
            } else if (style.entranceSplit === "none") {
                parts.push(`.pg-ready .${cls}.pg-in{${animationDeclarations([entrance(style.entranceDelay), ...withLoop(element, style.entranceDelay)])}}`);
            } else {
                // Split runs the same animation on each piece, offset by its
                // index, so one delay expression covers a word or a letter
                // without a rule per piece.
                parts.push(`.pg-ready .${cls}.pg-in .pg-part{${animationDeclarations([entrance(`calc(${style.entranceDelay}ms + var(--i, 0) * ${style.entranceStagger}ms)`)])}}`);
            }
        }
        if (calm.length) parts.push(`@media (prefers-reduced-motion:reduce){${calm.join(",")}{animation:none!important}}`);
    }

    if (hasScrollEffects(elements, cascade)) {
        parts.push(SCROLL_KEYFRAMES);
        const scrollRules: string[] = [];
        const scrollSelectors: string[] = [];
        for (const element of elements) {
            const style = resolveStyle(element, baseId, cascade);
            const effect = style.scrollEffect;
            if (effect === "none") continue;
            // Distance means different things per effect: pixels for the ones
            // that move, a proportion for the ones that do not.
            const vars =
                effect === "rise" || effect === "parallax" || effect === "slide-left" || effect === "slide-right"
                    ? `--pg-amt:${style.scrollAmount}px;`
                    : effect === "zoom" || effect === "shrink"
                      ? `--pg-scale:${(1 - Math.min(90, style.scrollAmount) / 100).toFixed(3)};`
                      : effect === "blur"
                        ? `--pg-blur:${(style.scrollAmount / 4).toFixed(2)}px;`
                        : effect === "rotate"
                          ? `--pg-rot:${(-style.scrollAmount * 0.45).toFixed(1)}deg;`
                          : "";
            // Parallax is a background motion that should read across the whole
            // pass and shrinking is about leaving; the rest resolve while the
            // element is arriving.
            const range =
                style.scrollRange !== "auto"
                    ? style.scrollRange
                    : effect === "parallax"
                      ? "cover"
                      : effect === "shrink"
                        ? "exit"
                        : "enter";
            // An arrival effect over the leaving range runs backwards: the
            // element finishes as itself and comes apart on its way out.
            const reverse = range === "exit" && effect !== "shrink" && effect !== "parallax";
            const layers: AnimationLayer[] = [{
                name: `pg-s-${effect}`,
                duration: 1,
                easing: "linear",
                delay: 0,
                iterations: 1,
                direction: reverse ? "reverse" : "normal",
                fill: "both",
                timeline: "view()",
                range: SCROLL_RANGE_CSS[range],
            }];
            if (element.loop) layers.push(loopLayer(element.loop));
            scrollSelectors.push(`.${classFor(element.id)}`);
            // `animation-duration:auto` is what a scroll timeline expects; the
            // 1ms placeholder above only keeps the longhand lists aligned.
            scrollRules.push(
                `.${classFor(element.id)}{${vars}${animationDeclarations(layers).replace(/animation-duration:1ms/, "animation-duration:auto")}}`,
            );
        }
        // Motion tied to scrolling is exactly what a reduced-motion setting is
        // asking about, so the effect is dropped and the finished state stays.
        const calm = scrollSelectors.join(",");
        parts.push(
            `@supports (animation-timeline:view()){${scrollRules.join("")}` +
                (calm ? `@media (prefers-reduced-motion:reduce){${calm}{animation:none}}` : "") +
                `}`,
        );
    }

    // Properties each hover/press selector has set so far, widest rule first.
    const stateCarry = new Map<string, Set<string>>();
    const carry = (selector: string) => {
        const set = stateCarry.get(selector) ?? new Set<string>();
        stateCarry.set(selector, set);
        return set;
    };
    for (const element of elements) {
        if (element.hover || element.press) {
            const transition = stateTransition(element.transition);
            parts.push(`.${classFor(element.id)}{transition:${transition.fallback};${transition.value !== transition.fallback ? `transition:${transition.value};` : ""}will-change:transform}`);
        }
        if (element.hover && Object.keys(element.hover).length) parts.push(`${hoverSelector(element, byId)}{${interactionDeclarations(element, byId, baseId, rootStyle, cascade, element.hover, carry(hoverSelector(element, byId)))}}`);
        // Coming out of `display:none` there is no previous frame to animate
        // from, so a revealed layer would simply pop in. This gives it one.
        if (revealsOnHover(element)) parts.push(`@starting-style{${hoverSelector(element, byId)}{opacity:0;translate:0 8px}}@media (prefers-reduced-motion:reduce){.${classFor(element.id)}{transition:none}}`);
        if (element.press && Object.keys(element.press).length) parts.push(`.${classFor(element.id)}:active{${interactionDeclarations(element, byId, baseId, rootStyle, cascade, element.press, carry(`.${classFor(element.id)}:active`))}}`);
    }

    // A constraint or rotation can itself be responsive. Recompute the small
    // interaction delta inside that artboard's media query so hover composes
    // with the active breakpoint rather than with the base artboard.
    for (const plan of mediaPlan(cascade)) {
        const rules = elements.flatMap((element) => {
            if (!element.hover && !element.press) return [];
            const parent = element.parentId ? byId.get(element.parentId) : undefined;
            if (!element.overrides?.[plan.id] && !parent?.overrides?.[plan.id]) return [];
            const selector = `.${classFor(element.id)}`;
            return [
                element.hover && Object.keys(element.hover).length
                    ? `${hoverSelector(element, byId)}{${interactionDeclarations(element, byId, plan.id, rootStyle, cascade, element.hover, carry(hoverSelector(element, byId)))}}`
                    : "",
                element.press && Object.keys(element.press).length
                    ? `${selector}:active{${interactionDeclarations(element, byId, plan.id, rootStyle, cascade, element.press, carry(`${selector}:active`))}}`
                    : "",
            ].filter(Boolean);
        }).join("");
        if (rules) parts.push(`@media ${plan.query}{${rules}}`);
    }

    // Last, so an author's rule wins against the generated one at equal
    // specificity without having to reach for `!important`.
    if (rootStyle.customCss) parts.push(rootStyle.customCss);

    return parts.join("\n");
}

export function rootChildren(elements: CanvasElement[]) {
    return childrenOf(elements, undefined);
}
