import type { InteractiveSettings } from "./interactive";

/** Runs inside the sandbox; all content is assigned as text, never as HTML. */
export function mountCarousel(viewport: HTMLElement, config: InteractiveSettings) {
    const controller = new AbortController();
    const originalChildren = new Set(viewport.children);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const slides: HTMLElement[] = [];
    const dots: HTMLButtonElement[] = [];
    const animations: Animation[] = [];
    let transitioning = false;
    let queued: { requested: number; manual: boolean } | undefined;
    const customControls = Array.from(viewport.querySelectorAll<HTMLElement>('[data-carousel-action]')).filter(node => node.closest('[data-carousel-native]') === viewport && node.dataset.carouselAction !== 'group');
    const savedControls = customControls.map(node => ({ node, attributes: ['role', 'tabindex', 'aria-label', 'aria-disabled', 'aria-current', 'data-carousel-active', 'style'].map(name => [name, node.getAttribute(name)] as const) }));
    let index = 0, timer: ReturnType<typeof setTimeout> | undefined;
    let paused = !config.autoplay, hovering = false, focused = false, pointer: { id: number; x: number; y: number } | undefined;
    let visible = true;
    const nativeStage = viewport.querySelector<HTMLElement>(':scope > [data-carousel-stage]');
    const stage = nativeStage ?? document.createElement('div');
    if (!nativeStage) { stage.className = 'stage'; viewport.append(stage); }
    const status = document.createElement('span'); status.className = 'sr-only'; status.setAttribute('aria-live', 'polite'); viewport.append(status);
    let previous: HTMLButtonElement | undefined, next: HTMLButtonElement | undefined, toggle: HTMLButtonElement | undefined;
    function control(label: string, text: string, action: () => void, parent: HTMLElement, className = '') {
        const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = text; button.setAttribute('aria-label', label); button.onclick = action; parent.append(button); return button;
    }
    if (nativeStage) slides.push(...Array.from(nativeStage.children) as HTMLElement[]);
    else config.items.forEach((item, i) => {
        const slide = document.createElement('article'); slide.className = 'slide'; slide.setAttribute('role', 'group'); slide.setAttribute('aria-roledescription', 'slide'); slide.setAttribute('aria-label', (i + 1) + ' of ' + config.items.length);
        if (item.image) { const image = document.createElement('img'); image.src = item.image; image.alt = ''; image.draggable = false; image.style.objectFit = config.imageFit || 'cover'; image.onerror = () => image.remove(); slide.append(image); }
        if (item.text) { const caption = document.createElement('div'); caption.className = 'caption'; caption.textContent = item.text; slide.append(caption); }
        stage.append(slide); slides.push(slide);
    });
    if (!slides.length) { if (!nativeStage) stage.textContent = 'Add slides in the editor'; return () => status.remove(); }
    function schedule() {
        clearTimeout(timer);
        if (paused || focused || (config.pauseOnHover && hovering) || !visible || document.hidden || reduced.matches || pointer || slides.length < 2 || (!config.loop && index === slides.length - 1)) return;
        timer = setTimeout(() => show(index + 1, false), Math.max(config.interval * 1000, (config.duration || 0) + 100));
    }
    function show(requested: number, manual = true) {
        if (transitioning) { queued = { requested, manual }; return; }
        const target = config.loop ? (requested + slides.length) % slides.length : Math.max(0, Math.min(slides.length - 1, requested));
        const old = index; index = target;
        animations.splice(0).forEach(animation => animation.cancel());
        slides.forEach((slide, i) => { slide.style.visibility = i === index ? 'visible' : 'hidden'; slide.style.zIndex = i === index ? '2' : '1'; slide.inert = i !== index; slide.setAttribute('aria-hidden', String(i !== index)); });
        if (old !== index && !reduced.matches && config.duration) {
            const sign = requested > old ? 1 : -1;
            const from = config.transition === 'slide' ? { transform: 'translateX(' + sign * 100 + '%)', opacity: 1 } : { transform: config.transition === 'zoom' ? 'scale(1.12)' : 'none', opacity: 0 };
            const to = config.transition === 'slide' ? { transform: 'translateX(' + -sign * 100 + '%)', opacity: 1 } : { transform: config.transition === 'zoom' ? 'scale(.96)' : 'none', opacity: 0 };
            const options = { duration: config.duration, easing: config.easing || 'ease' };
            const outgoing = slides[old].animate([{ visibility: 'visible', transform: 'none', opacity: 1 }, { visibility: 'visible', ...to }], options);
            const incoming = slides[index].animate([from, { transform: 'none', opacity: 1 }], options);
            animations.push(outgoing, incoming);
            transitioning = true;
            void Promise.all([outgoing.finished, incoming.finished]).catch(() => {}).then(() => {
                transitioning = false;
                if (controller.signal.aborted) return;
                const pending = queued; queued = undefined;
                if (pending) show(pending.requested, pending.manual);
            });
        }
        dots.forEach((dot, i) => { dot.setAttribute('aria-current', String(i === index)); });
        customControls.forEach(node => {
            const action = node.dataset.carouselAction;
            const target = Number(node.dataset.carouselTarget);
            const active = action === 'go-to' && target === index;
            const disabled = action === 'go-to' ? !Number.isInteger(target) || target < 0 || target >= slides.length : !config.loop && (action === 'previous' ? index === 0 : index === slides.length - 1);
            node.setAttribute('aria-disabled', String(disabled));
            if (action === 'go-to') {
                node.setAttribute('aria-current', String(active));
                node.dataset.carouselActive = String(active);
                const savedStyle = savedControls.find(saved => saved.node === node)!.attributes.find(([name]) => name === 'style')![1];
                const original = document.createElement('div'); original.setAttribute('style', savedStyle || '');
                if (node.dataset.carouselActiveColor) node.style.backgroundColor = active ? node.dataset.carouselActiveColor : original.style.backgroundColor;
                if (node.dataset.carouselInactiveOpacity) node.style.opacity = active ? original.style.opacity : String(Number(node.dataset.carouselInactiveOpacity) / 100);
            }
        });
        if (previous) previous.disabled = !config.loop && index === 0;
        if (next) next.disabled = !config.loop && index === slides.length - 1;
        if (manual) status.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length;
        schedule();
    }
    if (slides.length > 1) {
        if (config.arrows) {
            if (!customControls.some(node => node.dataset.carouselAction === 'previous')) previous = control('Previous slide', '‹', () => show(index - 1), viewport, 'arrow previous');
            if (!customControls.some(node => node.dataset.carouselAction === 'next')) next = control('Next slide', '›', () => show(index + 1), viewport, 'arrow next');
        }
        const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Slide controls'); viewport.append(nav);
        if (config.dots && !customControls.some(node => node.dataset.carouselAction === 'go-to')) slides.forEach((_, i) => dots.push(control('Go to slide ' + (i + 1), '', () => show(i), nav, 'dot')));
        if (config.autoplay) toggle = control('Pause autoplay', 'Ⅱ', () => {
            paused = !paused; toggle!.textContent = paused ? '▶' : 'Ⅱ'; toggle!.setAttribute('aria-label', paused ? 'Play autoplay' : 'Pause autoplay');
            if (!paused && !config.loop && index === slides.length - 1) show(0); else schedule();
        }, nav, 'play');
        if (!nav.childElementCount) nav.remove();
    }
    customControls.forEach(node => {
        if (!node.matches('button,a,input')) { node.setAttribute('role', 'button'); node.tabIndex = 0; }
        if (!node.getAttribute('aria-label')) node.setAttribute('aria-label', node.dataset.carouselAction === 'go-to' ? 'Go to slide ' + (Number(node.dataset.carouselTarget) + 1) : node.dataset.carouselAction === 'previous' ? 'Previous slide' : 'Next slide');
        const activate = (event: Event) => {
            event.preventDefault(); event.stopPropagation();
            if (node.getAttribute('aria-disabled') === 'true') return;
            show(node.dataset.carouselAction === 'go-to' ? Number(node.dataset.carouselTarget) : index + (node.dataset.carouselAction === 'previous' ? -1 : 1));
        };
        node.addEventListener('click', activate, { signal: controller.signal });
        node.addEventListener('keydown', event => { if (!node.matches('button,a,input') && (event.key === 'Enter' || event.key === ' ')) activate(event); }, { signal: controller.signal });
    });
    viewport.addEventListener('keydown', event => {
        if ((event.target as HTMLElement).closest('[data-carousel-native]') !== viewport) return;
        if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
            event.preventDefault(); show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
        }
    }, { signal: controller.signal });
    if (config.swipe) {
        stage.style.touchAction = 'pan-y'; stage.style.cursor = 'grab';
        stage.onpointerdown = event => { if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('a,button,input,textarea,select,[contenteditable=true],[data-carousel-action]')) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; stage.setPointerCapture(event.pointerId); stage.style.cursor = 'grabbing'; schedule(); };
        stage.onpointerup = event => {
            if (!pointer || pointer.id !== event.pointerId) return;
            const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; pointer = undefined; stage.style.cursor = 'grab';
            if (Math.abs(dx) >= Math.min(60, viewport.clientWidth * .15) && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1)); else schedule();
        };
        stage.onpointercancel = stage.onlostpointercapture = () => { pointer = undefined; stage.style.cursor = 'grab'; schedule(); };
    }
    viewport.onmouseenter = () => { hovering = true; schedule(); }; viewport.onmouseleave = () => { hovering = false; schedule(); };
    viewport.addEventListener('focusin', () => { focused = true; schedule(); }, { signal: controller.signal });
    viewport.addEventListener('focusout', event => { focused = viewport.contains(event.relatedTarget as Node); schedule(); }, { signal: controller.signal });
    document.addEventListener('visibilitychange', schedule, { signal: controller.signal });
    reduced.addEventListener('change', () => { animations.splice(0).forEach(animation => animation.cancel()); schedule(); }, { signal: controller.signal });
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }); observer.observe(viewport);
    show(0, false);
    return () => {
        clearTimeout(timer); controller.abort(); observer.disconnect(); animations.forEach(animation => animation.cancel());
        savedControls.forEach(({ node, attributes }) => attributes.forEach(([name, value]) => value === null ? node.removeAttribute(name) : node.setAttribute(name, value)));
        viewport.onmouseenter = viewport.onmouseleave = null;
        stage.onpointerdown = stage.onpointerup = stage.onpointercancel = stage.onlostpointercapture = null;
        Array.from(viewport.children).forEach(child => { if (!originalChildren.has(child)) child.remove(); });
        slides.forEach((slide, i) => { slide.style.visibility = i ? 'hidden' : 'visible'; slide.style.zIndex = ''; slide.inert = i !== 0; slide.setAttribute('aria-hidden', String(i !== 0)); });
    };
}

export function carouselDocument(config: InteractiveSettings) {
    const json = JSON.stringify(config).replace(/</g, '\\u003c');
    return `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:system-ui;color:${config.color};background:${config.background}}#viewport,.stage{position:relative;width:100%;height:100%;overflow:hidden}.stage{display:grid;place-items:center;user-select:none}.slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:24px;text-align:center;font-size:clamp(18px,4vw,42px)}img{position:absolute;inset:0;width:100%;height:100%}.caption{position:relative;max-width:85%;overflow-wrap:anywhere;white-space:pre-wrap}.slide:has(img) .caption{padding:12px 18px;border-radius:12px;background:#0008}button{cursor:pointer;border:0;color:inherit;background:#0005;display:grid;place-items:center}button:focus-visible{outline:2px solid currentColor;outline-offset:3px}button:disabled{opacity:.25;cursor:default}.arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:4;width:36px;height:36px;border-radius:50%;font:28px system-ui}.previous{left:12px}.next{right:12px}nav{position:absolute;z-index:4;bottom:12px;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:5px;max-width:85%;padding:5px 8px;border-radius:18px;background:#0003}.dot{padding:0;width:20px;height:20px;border-radius:50%;background:transparent}.dot:after{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.4}.dot[aria-current=true]:after{opacity:1;transform:scale(1.4)}.play{width:26px;height:22px;border-radius:10px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    </style><div id="viewport" data-pagiera-carousel tabindex="0" role="region" aria-roledescription="carousel" aria-label="Carousel"></div><script>const config=${json},viewport=document.getElementById('viewport');(${mountCarousel.toString()})(viewport,config);</script></html>`;
}
