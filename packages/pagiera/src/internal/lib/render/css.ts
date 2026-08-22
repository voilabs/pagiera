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
        },
        element,
    );
    css.zIndex = element.z;
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
    parts.push(
        // The font is pinned on `.pg-root` rather than on <body>: the app's
        // layout puts a font class on <body>, which would out-specify an
        // element selector and leak the editor's typeface into the site.
        // The shell spans the viewport; the content width is applied by each
        // band's inner box, so section backgrounds reach both edges.
        `.pg-root{font-family:${resolveFont(rootStyle.fontFamily)}}` +
            ".pg-node{box-sizing:border-box}" +
            ".pg-node img{display:block;width:100%;height:100%}" +
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
        if (!element.hover || Object.keys(element.hover).length === 0) continue;
        const merged = { ...resolveStyle(element, baseId, cascade), ...element.hover };
        const parent = element.parentId ? byId.get(element.parentId) : undefined;
        const parentStyle = parent ? resolveStyle(parent, baseId, cascade) : undefined;
        const css = styleToCss(
            merged,
            {
                parentLayout: parentStyle?.layout ?? "stack",
                parentDirection: parentStyle?.direction ?? "column",
            },
            element,
        );
        parts.push(
            `.${classFor(element.id)}:hover{${declarationsToCss(css)}}`,
        );
    }

    for (const element of elements) {
        if (element.press && Object.keys(element.press).length) {
            const merged = { ...resolveStyle(element, baseId, cascade), ...element.press };
            const parent = element.parentId ? byId.get(element.parentId) : undefined;
            const parentStyle = parent ? resolveStyle(parent, baseId, cascade) : undefined;
            const css = styleToCss(merged, { parentLayout: parentStyle?.layout ?? "stack", parentDirection: parentStyle?.direction ?? "column" }, element);
            parts.push(`.${classFor(element.id)}:active{${declarationsToCss(css)}}`);
        }
        if (element.loop) {
            const name = element.loop.type;
            parts.push(`.${classFor(element.id)}{animation:pg-loop-${name} ${element.loop.duration}ms ease-in-out infinite}`);
        }
    }
    if (elements.some((element) => element.loop)) parts.push(`@keyframes pg-loop-pulse{0%,100%{scale:1}50%{scale:1.06}}@keyframes pg-loop-float{0%,100%{translate:0 0}50%{translate:0 -12px}}@keyframes pg-loop-spin{to{rotate:360deg}}@media(prefers-reduced-motion:reduce){.pg-node{animation:none!important}}`);

    return parts.join("\n");
}

export function rootChildren(elements: CanvasElement[]) {
    return childrenOf(elements, undefined);
}
