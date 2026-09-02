import type { CSSProperties } from "react";
import {
    isBand,
    resolveStyle,
    rootStyleToCss,
    splitBand,
    styleToCss,
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
    if (kind === "none") return "html{scrollbar-gutter:stable}";

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
html{scrollbar-gutter:stable}
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
): Array<[suffix: string, declarations: string]> {
    const parent = element.parentId ? byId.get(element.parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;
    const style = resolveStyle(element, breakpoint, cascade);

    const css = styleToCss(
        style,
        {
            parentLayout: parentStyle?.layout ?? "stack",
            parentDirection: parentStyle?.direction ?? "column",
            parentAlign: parentStyle?.align ?? rootStyle.align,
        },
        element,
    );
    if (style.hidden) css.display = "none";

    if (!isBand(element.type, style, rootStyle) || style.hidden) {
        return [["", declarationsToCss(css)]];
    }

    const { shell, inner } = splitBand(css, rootStyle.maxWidth);
    return [
        ["", declarationsToCss(shell)],
        [">.pg-inner", declarationsToCss(inner)],
    ];
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
) {
    const parent = element.parentId ? byId.get(element.parentId) : undefined;
    const parentStyle = parent ? resolveStyle(parent, breakpoint, cascade) : undefined;
    const context = {
        parentLayout: parentStyle?.layout ?? "stack",
        parentDirection: parentStyle?.direction ?? "column",
        parentAlign: parentStyle?.align ?? rootStyle.align,
    } as const;
    const resting = resolveStyle(element, breakpoint, cascade);
    const restingCss = styleToCss(resting, context, element);
    const activeCss = styleToCss({ ...resting, ...patch }, context, element);
    const delta: CSSProperties = {};
    for (const property of Object.keys(activeCss) as Array<keyof CSSProperties>) {
        if (activeCss[property] !== restingCss[property]) {
            // CSSProperties is a heterogeneous map; this assignment is safe
            // because both values come from the same property key.
            (delta as Record<string, unknown>)[property as string] = activeCss[property];
        }
    }
    return declarationsToCss(delta);
}

function hoverSelector(element: CanvasElement, byId: Map<string, CanvasElement>) {
    const parent = element.hoverTrigger === "parent" && element.parentId
        ? byId.get(element.parentId)
        : undefined;
    return parent
        ? `.${classFor(parent.id)}:hover .${classFor(element.id)}`
        : `.${classFor(element.id)}:hover`;
}

/**
 * Entrance keyframes animate `translate`/`scale` rather than `transform`, so
 * they compose with an element's own rotation or scale instead of clobbering
 * it. Emitted once, only when some element actually uses an entrance.
 */
const ENTRANCE_KEYFRAMES = `
@keyframes pg-fade{from{opacity:0}to{opacity:1}}
@keyframes pg-up{from{opacity:0;translate:0 28px}to{opacity:1;translate:none}}
@keyframes pg-down{from{opacity:0;translate:0 -28px}to{opacity:1;translate:none}}
@keyframes pg-left{from{opacity:0;translate:-32px 0}to{opacity:1;translate:none}}
@keyframes pg-right{from{opacity:0;translate:32px 0}to{opacity:1;translate:none}}
@keyframes pg-zoom{from{opacity:0;scale:.94}to{opacity:1;scale:none}}
/* The hidden start state is applied only once the script is running, so a
   visitor without JavaScript still sees every element. */
.pg-ready .pg-anim{opacity:0}
/* Revealed elements are visible as a resting value, not only as the end of a
   keyframe: if animations are disabled or never get to run, the content still
   shows rather than staying at zero opacity. */
.pg-ready .pg-anim.pg-in{opacity:1}
@media (prefers-reduced-motion:reduce){.pg-ready .pg-anim{opacity:1;animation:none!important}}
`.trim();

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

  if(!('IntersectionObserver' in window)||!window.matchMedia||matchMedia('(prefers-reduced-motion:reduce)').matches){
    all();return;
  }
  document.documentElement.classList.add('pg-ready');

  // Anything already in view animates straight away rather than waiting for
  // the observer's first delivery.
  var pending=[];
  for(var i=0;i<nodes.length;i++){
    var r=nodes[i].getBoundingClientRect();
    if(r.top<innerHeight&&r.bottom>0)reveal(nodes[i]);else pending.push(nodes[i]);
  }

  var io=new IntersectionObserver(function(entries){
    for(var j=0;j<entries.length;j++){
      if(entries[j].isIntersecting){reveal(entries[j].target);io.unobserve(entries[j].target);}
    }
  },{threshold:0.15,rootMargin:'0px 0px -8% 0px'});
  for(var k=0;k<pending.length;k++)io.observe(pending[k]);

  // Last resort: never leave content invisible because a callback did not run.
  setTimeout(all,3000);
})();
`.trim();

export function hasEntrances(
    elements: CanvasElement[],
    cascade: Cascade = DEFAULT_CASCADE,
) {
    const baseId = baseOf(cascade).id;
    return elements.some(
        (el) => resolveStyle(el, baseId, cascade).entrance !== "none",
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
        parts.push(`.pg-root{width:${baseOf(cascade).width}px;margin-left:auto;margin-right:auto}`);
        for (const plan of mediaPlan(cascade)) {
            const definition = cascade.breakpoints.find((item) => item.id === plan.id);
            if (definition) parts.push(`@media ${plan.query}{.pg-root{width:${definition.width}px}}`);
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
            ".pg-node:is(input,textarea,button){font:inherit}" +
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
            ".pg-link{text-decoration:none;color:inherit}",
    );

    for (const element of elements) {
        const emitted = rulesFor(element, byId, baseId, rootStyle, cascade)
            .map(([suffix, decl]) => `.${classFor(element.id)}${suffix}{${decl}}`)
            .join("");
        parts.push(emitted);
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
                    ([suffix, decl]) => `.${classFor(el.id)}${suffix}{${decl}}`,
                ),
            )
            .join("");
        parts.push(`@media ${plan.query}{${rules}}`);
    }

    if (hasEntrances(elements, cascade)) {
        parts.push(ENTRANCE_KEYFRAMES);
        for (const element of elements) {
            const style = resolveStyle(element, baseId, cascade);
            if (style.entrance === "none") continue;
            parts.push(
                `.pg-ready .${classFor(element.id)}.pg-in{` +
                    `animation:pg-${style.entrance} ${style.entranceDuration}ms ` +
                    `${style.entranceCurve === "spring" ? `cubic-bezier(.16,${1 + Math.max(0, 45 - style.springDamping) / 100},${Math.max(0.12, Math.min(0.52, 120 / style.springStiffness))},1)` : `cubic-bezier(${style.entranceBezier})`} ${style.entranceDelay}ms both}`,
            );
        }
    }

    for (const element of elements) {
        if (element.hover || element.press) parts.push(`.${classFor(element.id)}{transition:transform .42s cubic-bezier(.16,1,.3,1),scale .42s cubic-bezier(.16,1,.3,1),rotate .42s cubic-bezier(.16,1,.3,1),translate .42s cubic-bezier(.16,1,.3,1),background-color .32s ease,color .32s ease,border-color .32s ease,box-shadow .42s cubic-bezier(.16,1,.3,1),opacity .32s ease,filter .42s ease;will-change:transform}`);
        if (element.hover && Object.keys(element.hover).length) parts.push(`${hoverSelector(element, byId)}{${interactionDeclarations(element, byId, baseId, rootStyle, cascade, element.hover)}}`);
        if (element.press && Object.keys(element.press).length) parts.push(`.${classFor(element.id)}:active{${interactionDeclarations(element, byId, baseId, rootStyle, cascade, element.press)}}`);
        if (element.loop) {
            const name = element.loop.type;
            parts.push(`.${classFor(element.id)}{animation:pg-loop-${name} ${element.loop.duration}ms ease-in-out infinite}`);
        }
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
                    ? `${hoverSelector(element, byId)}{${interactionDeclarations(element, byId, plan.id, rootStyle, cascade, element.hover)}}`
                    : "",
                element.press && Object.keys(element.press).length
                    ? `${selector}:active{${interactionDeclarations(element, byId, plan.id, rootStyle, cascade, element.press)}}`
                    : "",
            ].filter(Boolean);
        }).join("");
        if (rules) parts.push(`@media ${plan.query}{${rules}}`);
    }
    if (elements.some((element) => element.loop)) parts.push(`@keyframes pg-loop-pulse{0%,100%{scale:1}50%{scale:1.06}}@keyframes pg-loop-float{0%,100%{translate:0 0}50%{translate:0 -12px}}@keyframes pg-loop-spin{to{rotate:360deg}}@media(prefers-reduced-motion:reduce){.pg-node{animation:none!important}}`);

    // Last, so an author's rule wins against the generated one at equal
    // specificity without having to reach for `!important`.
    if (rootStyle.customCss) parts.push(rootStyle.customCss);

    return parts.join("\n");
}

export function rootChildren(elements: CanvasElement[]) {
    return childrenOf(elements, undefined);
}
