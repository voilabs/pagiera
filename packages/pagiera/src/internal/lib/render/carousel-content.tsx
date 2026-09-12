import React from "react";
import { mountCarousel } from "../editor/carousel";
import type { InteractiveSettings } from "../editor/interactive";

const CSS = `[data-carousel-native]{position:relative;width:100%;height:100%;min-width:0;overflow:hidden}
[data-carousel-stage]{position:relative;width:100%;height:100%;overflow:hidden}
[data-carousel-slide]{position:absolute;inset:0;overflow:hidden}
[data-carousel-slide] > *{width:100%!important;height:100%!important;max-width:none!important;position:relative!important;inset:auto!important}
[data-carousel-native] > .arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:4;border:0;border-radius:50%;width:36px;height:36px;background:#0006;color:var(--carousel-controls,#fff);font:28px system-ui;cursor:pointer}
[data-carousel-native] > .previous{left:12px}[data-carousel-native] > .next{right:12px}
[data-carousel-native] > nav{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:4;display:flex;gap:5px;border-radius:20px;background:#0004;padding:5px 8px;max-width:85%;flex-wrap:wrap}
[data-carousel-native] > nav > button{border:0;background:transparent;color:var(--carousel-controls,#fff);cursor:pointer;width:22px;height:22px;display:grid;place-items:center}
[data-carousel-native] .dot:after{content:'';width:6px;height:6px;background:currentColor;border-radius:50%;opacity:.4}
[data-carousel-native] .dot[aria-current=true]:after{opacity:1;transform:scale(1.4)}
[data-carousel-native] > button:disabled{opacity:.25}[data-carousel-native] > .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
[data-carousel-native] > button:focus-visible,[data-carousel-native] > nav > button:focus-visible{outline:2px solid currentColor;outline-offset:2px}`;

export function CarouselContent({ settings, children, controls }: { settings: InteractiveSettings; children: React.ReactNode; controls?: React.ReactNode }) {
    const slides = React.Children.toArray(children);
    return <div data-carousel-native data-carousel-settings={JSON.stringify(settings)} role="region" aria-roledescription="carousel" aria-label="Carousel" tabIndex={0} style={{ '--carousel-controls': settings.color } as React.CSSProperties}>
        <style>{CSS}</style>
        <style>{'[data-carousel-controls]{position:absolute;inset:0;z-index:3;pointer-events:none}[data-carousel-controls] > *{pointer-events:auto}'}</style>
        <div data-carousel-stage>{slides.map((child, index) => <div key={index} data-carousel-slide role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== 0} inert={index !== 0} style={{ visibility: index ? 'hidden' : 'visible' }}>{child}</div>)}</div>
        <div data-carousel-controls>{controls}</div>
    </div>;
}

export function mountNativeCarousels(root: ParentNode) {
    const cleanups = Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-native]')).map(viewport => {
        const settings = JSON.parse(viewport.dataset.carouselSettings!) as InteractiveSettings;
        return mountCarousel(viewport, settings);
    });
    return () => cleanups.forEach(cleanup => cleanup?.());
}
