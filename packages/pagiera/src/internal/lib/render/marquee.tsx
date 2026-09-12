import React from "react";
import type { InteractiveSettings } from "../editor/interactive";

/** Real children stay in the document once; visual copies are runtime-only. */
export function MarqueeContent({ settings, children, editing = false }: { settings: InteractiveSettings; children: React.ReactNode; editing?: boolean }) {
    return <div data-pg-marquee data-duration={settings.interval} data-reverse={settings.reverse} data-playing={!editing && settings.autoplay} style={{ width: "100%", minWidth: 0, height: "100%", overflow: "hidden", gap: "inherit" }}>
        <style>{'[data-marquee-track] > div > * { flex: 0 0 auto !important; position: relative !important; inset: auto !important; }'}</style>
        <div data-marquee-track style={{ display: "flex", width: "max-content", minWidth: editing ? "100%" : undefined, height: "100%", gap: "inherit" }}>
            <div data-marquee-source style={{ display: "flex", flex: "0 0 auto", minWidth: editing ? "100%" : undefined, alignItems: "center", height: "100%", gap: "inherit" }}>{React.Children.count(children) ? children : settings.items.map((item, index) => <div key={index} style={{ flex: "0 0 220px", color: settings.color }}>{item.image && <img src={item.image} alt="" style={{ width: "100%", height: 80, objectFit: "cover" }} />}{item.text}</div>)}</div>
        </div>
    </div>;
}

/** Self-contained so the published, non-hydrated renderer can run it too. */
export function mountMarquees(root: ParentNode) {
    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>('[data-pg-marquee]').forEach(viewport => {
        const track = viewport.querySelector<HTMLElement>('[data-marquee-track]');
        const source = viewport.querySelector<HTMLElement>('[data-marquee-source]');
        if (!track || !source || viewport.dataset.playing !== 'true') return;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)');
        let animation: Animation | undefined;
        let hovered = false;
        const copies: HTMLElement[] = [];
        const pause = () => {
            if (document.hidden || hovered || reduce.matches) animation?.pause();
            else animation?.play();
        };
        const build = () => {
            animation?.cancel();
            copies.splice(0).forEach(copy => copy.remove());
            const width = source.offsetWidth;
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            const distance = width + gap;
            if (!width || !source.children.length || reduce.matches) return;
            for (let i = 0; i < Math.min(100, Math.ceil(viewport.clientWidth / distance) + 1); i++) {
                const copy = source.cloneNode(true) as HTMLElement;
                copy.removeAttribute('data-marquee-source');
                copy.setAttribute('aria-hidden', 'true');
                copy.inert = true;
                copy.style.pointerEvents = 'none';
                // Copies must never masquerade as canvas layers or duplicate IDs.
                const ids = new Map<string, string>();
                copy.querySelectorAll<HTMLElement>('[id]').forEach(node => {
                    const next = node.id + '-marquee-' + i + '-' + Math.random().toString(36).slice(2);
                    ids.set(node.id, next); node.id = next;
                });
                copy.querySelectorAll('*').forEach(node => {
                    node.removeAttribute('data-canvas-element');
                    for (const attribute of Array.from(node.attributes)) {
                        let value = attribute.value;
                        ids.forEach((next, old) => { value = value.split('url(#' + old + ')').join('url(#' + next + ')'); if (value === '#' + old) value = '#' + next; });
                        if (value !== attribute.value) node.setAttribute(attribute.name, value);
                    }
                });
                track.append(copy); copies.push(copy);
            }
            animation = track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-' + distance + 'px)' }], {
                duration: Math.max(1, Number(viewport.dataset.duration) || 20) * 1000,
                iterations: Infinity, easing: 'linear', direction: viewport.dataset.reverse === 'true' ? 'reverse' : 'normal',
            });
            pause();
        };
        const enter = () => { hovered = true; pause(); };
        const leave = () => { hovered = false; pause(); };
        const observer = new ResizeObserver(build); observer.observe(source); observer.observe(viewport);
        viewport.addEventListener('mouseenter', enter); viewport.addEventListener('mouseleave', leave);
        viewport.addEventListener('focusin', enter); viewport.addEventListener('focusout', leave);
        document.addEventListener('visibilitychange', pause); reduce.addEventListener('change', build);
        build();
        cleanups.push(() => { animation?.cancel(); observer.disconnect(); copies.forEach(copy => copy.remove()); viewport.removeEventListener('mouseenter', enter); viewport.removeEventListener('mouseleave', leave); viewport.removeEventListener('focusin', enter); viewport.removeEventListener('focusout', leave); document.removeEventListener('visibilitychange', pause); reduce.removeEventListener('change', build); });
    });
    return () => cleanups.forEach(cleanup => cleanup());
}
