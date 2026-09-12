import { carouselDocument } from "./carousel";
import { BASE_STYLE, type CanvasElement } from "./types";

export function upgradeCarouselElements(elements: CanvasElement[]): CanvasElement[] {
    const ids = new Set(elements.map(element => element.id));
    const unique = (candidate: string) => { while (ids.has(candidate)) candidate += "-copy"; ids.add(candidate); return candidate; };
    return elements.flatMap(raw => {
        const element = restoreInteractiveElement(raw);
        const settings = element.interactive;
        if (settings?.kind !== "carousel" || !settings.items.length) return [element];
        const output: CanvasElement[] = [{ ...element, code: undefined, interactive: { ...settings, items: [] } }];
        settings.items.forEach((item, index) => {
            const id = unique(`${element.id}-slide-${index}`);
            output.push({ id, z: index, type: "Frame", parentId: element.id, name: `Slide ${index + 1}`, base: { ...BASE_STYLE, layout: "stack", direction: "column", widthMode: "fill", heightMode: "fill", position: "static", bg: settings.background, justify: "center", align: "center", gap: 16 } });
            if (item.image) output.push({ id: unique(`${id}-image`), z: 0, type: "Image", parentId: id, src: item.image, base: { ...BASE_STYLE, widthMode: "fill", heightMode: "fill", position: "static" } });
            if (item.text) output.push({ id: unique(`${id}-text`), z: 1, type: "Text", parentId: id, content: item.text, base: { ...BASE_STYLE, widthMode: "auto", heightMode: "auto", position: "static", color: settings.color, fontSize: 32 } });
        });
        return output;
    });
}

export function restoreInteractiveElement<T extends { interactive?: InteractiveSettings; code?: string }>(element: T): T & { interactive?: InteractiveSettings } {
    if (element.interactive || !(element.code?.includes("config.kind==='marquee'") || element.code?.includes("data-pagiera-carousel"))) return element;
    const start = element.code.indexOf("const config=");
    const end = element.code.indexOf(",viewport=document.getElementById('viewport')", start);
    if (start < 0 || end < 0) return element;
    try {
        // Recover only JSON from our older generated document, never execute code.
        const interactive = normalizeInteractive(JSON.parse(element.code.slice(start + "const config=".length, end)));
        return interactive ? { ...element, interactive } : element;
    } catch { return element; }
}

export type InteractiveSettings = {
    kind: "carousel" | "marquee";
    items: Array<{ text: string; image: string }>;
    interval: number;
    autoplay: boolean;
    reverse: boolean;
    background: string;
    color: string;
    transition?: "slide" | "fade" | "zoom";
    duration?: number;
    easing?: "ease" | "linear" | "ease-in-out";
    loop?: boolean;
    arrows?: boolean;
    dots?: boolean;
    swipe?: boolean;
    pauseOnHover?: boolean;
    imageFit?: "cover" | "contain";
};
export function normalizeInteractive(value: unknown): InteractiveSettings | undefined {
    if (!value || typeof value !== "object") return;
    const v = value as Partial<InteractiveSettings>;
    if (v.kind !== "carousel" && v.kind !== "marquee") return;
    const hex = (value: unknown, fallback: string) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    return {
        kind: v.kind,
        items: Array.isArray(v.items) ? v.items.slice(0, 30).map(item => ({
            text: typeof item?.text === "string" ? item.text.slice(0, 500) : "",
            image: typeof item?.image === "string" && /^https?:\/\//i.test(item.image) ? item.image.slice(0, 2000) : "",
        })) : [1, 2, 3].map(n => ({ text: `Slide ${n}`, image: "" })),
        interval: typeof v.interval === "number" && Number.isFinite(v.interval) ? Math.max(1, Math.min(120, v.interval)) : v.kind === "carousel" ? 4 : 20,
        autoplay: v.autoplay !== false,
        reverse: v.reverse === true,
        background: hex(v.background, "#5402e6"), color: hex(v.color, "#ffffff"),
        transition: v.transition === "fade" || v.transition === "zoom" ? v.transition : "slide",
        duration: typeof v.duration === "number" && Number.isFinite(v.duration) ? Math.min(2000, Math.max(0, v.duration)) : 450,
        easing: v.easing === "linear" || v.easing === "ease-in-out" ? v.easing : "ease",
        loop: v.loop !== false, arrows: v.arrows !== false, dots: v.dots !== false,
        swipe: v.swipe !== false, pauseOnHover: v.pauseOnHover !== false,
        imageFit: v.imageFit === "contain" ? "contain" : "cover",
    };
}

/** The same sandboxed document runs in the editor preview and public renderer. */
export function interactiveDocument(value: InteractiveSettings): string {
    const settings = normalizeInteractive(value)!;
    if (settings.kind === "carousel") return carouselDocument(settings);
    const json = JSON.stringify(settings).replace(/</g, "\\u003c");
    return `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font:16px system-ui;color:${settings.color};background:${settings.background}}button{cursor:pointer;font:inherit;color:inherit;border:0;background:#0004;border-radius:999px;padding:8px 13px}button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
    #viewport{height:100%;overflow:hidden;position:relative}#track{height:100%;display:flex;transition:transform .4s ease}article{position:relative;display:flex;align-items:center;justify-content:center;flex:0 0 100%;height:100%;overflow:hidden;font-size:clamp(18px,4vw,42px);padding:24px;text-align:center}img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}article span{position:relative;z-index:1;overflow-wrap:anywhere}article:has(img) span{background:#0008;border-radius:10px;padding:10px 16px}
    nav{position:absolute;bottom:12px;left:12px;right:12px;display:flex;justify-content:center;gap:8px;z-index:2}nav button[aria-current=true]{background:#fff;color:#111}.strip{display:flex;flex-shrink:0;height:100%;gap:16px;padding-right:16px}.strip article{flex:0 0 220px;border-radius:14px;background:#ffffff12}
    .marquee #track{width:max-content;animation:drift ${settings.interval}s linear infinite;animation-direction:${settings.reverse ? "reverse" : "normal"}}.marquee:hover #track,.marquee:focus-within #track{animation-play-state:paused}@keyframes drift{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){#track{transition:none!important;animation:none!important}}
    </style><div id="viewport" tabindex="0" role="region" aria-label="${settings.kind}"><div id="track"></div></div><script>(()=>{
    const config=${json},viewport=document.getElementById('viewport'),track=document.getElementById('track'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
    function card(item){const el=document.createElement('article');if(item.image){const img=document.createElement('img');img.src=item.image;img.alt='';img.draggable=false;el.append(img)}const label=document.createElement('span');label.textContent=item.text;el.append(label);return el}
    if(!config.items.length){track.append(card({text:'Add items in Content settings'}));return}
    if(config.kind==='marquee'){
        viewport.className='marquee';if(!config.autoplay)track.style.animationPlayState='paused';
        const render=()=>{track.replaceChildren();const strip=document.createElement('div');strip.className='strip';const repeats=Math.max(1,Math.ceil(innerWidth/(config.items.length*236)));for(let i=0;i<repeats;i++)config.items.forEach(item=>strip.append(card(item)));track.append(strip);const copy=strip.cloneNode(true);copy.setAttribute('aria-hidden','true');track.append(copy)};render();new ResizeObserver(render).observe(viewport);return;
    }
    config.items.forEach(item=>track.append(card(item)));let index=0,timer=0,paused=!config.autoplay,hover=false;const nav=document.createElement('nav');nav.setAttribute('aria-label','Slide controls');viewport.append(nav);
    function button(label,action,text){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.textContent=text;b.onclick=action;nav.append(b);return b}
    const dots=[];function show(next){index=(next+config.items.length)%config.items.length;track.style.transform='translateX(-'+index*100+'%)';[...track.children].forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==index)));dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)))}
    function schedule(){clearInterval(timer);if(!paused&&!hover&&!reduce.matches&&!document.hidden&&config.items.length>1)timer=setInterval(()=>show(index+1),config.interval*1000)}
    if(config.items.length>1){button('Previous slide',()=>{show(index-1);schedule()},'‹');config.items.forEach((_,i)=>dots.push(button('Go to slide '+(i+1),()=>{show(i);schedule()},String(i+1))));button('Next slide',()=>{show(index+1);schedule()},'›');const toggle=button('Pause autoplay',()=>{paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'Play autoplay':'Pause autoplay');schedule()},paused?'▶':'Ⅱ');toggle.setAttribute('aria-label',paused?'Play autoplay':'Pause autoplay')}
    viewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));schedule()}});viewport.onmouseenter=()=>{hover=true;schedule()};viewport.onmouseleave=()=>{hover=false;schedule()};viewport.onfocusin=()=>{hover=true;schedule()};viewport.onfocusout=()=>{hover=false;schedule()};document.addEventListener('visibilitychange',schedule);reduce.addEventListener('change',schedule);show(0);schedule();
    })();</script></html>`;
}
