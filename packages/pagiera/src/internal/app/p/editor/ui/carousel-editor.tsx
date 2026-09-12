import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { InteractiveSettings } from "@/lib/editor/interactive";
import { CarouselContent, mountNativeCarousels } from "@/lib/render/carousel-content";

export function CarouselEditor({ settings, children, controls, selectedSlide, preview, editing, onAdd, onSelect, onAddControl }: {
    settings: InteractiveSettings; children: ReactNode; controls?: ReactNode; selectedSlide: number; preview: boolean; editing: boolean; onAdd: () => void; onSelect: (index: number) => void; onAddControl: (kind: 'previous' | 'next' | 'pagination') => void;
}) {
    const slides = Children.toArray(children);
    const [active, setActive] = useState(0);
    const [localPreview, setLocalPreview] = useState(false);
    const running = preview || (localPreview && editing);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => { if (selectedSlide >= 0) setActive(selectedSlide); }, [selectedSlide]);
    const settingsKey = JSON.stringify(settings);
    const structureKey = [...slides, ...Children.toArray(controls)].map(child => isValidElement(child) ? child.key : '').join('|');
    // Element objects change on hover/selection too; those must not restart playback.
    useLayoutEffect(() => { if (running && root.current) return mountNativeCarousels(root.current); }, [running, structureKey, settingsKey]);
    useEffect(() => { if (!editing) setLocalPreview(false); }, [editing]);
    return <div ref={root} onMouseDown={event => { if (running) event.stopPropagation(); }} style={{ width: '100%', height: '100%', minWidth: 0, position: 'relative' }}>
        {!preview && editing && <button type="button" onMouseDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setLocalPreview(value => !value); }} style={{ position: 'absolute', bottom: 6, right: 6, zIndex: 6 }} className="rounded-md bg-ed-field px-2 py-1 text-[11px] text-ed-text">{localPreview ? 'Edit slides' : 'Preview'}</button>}
        {running ? <CarouselContent settings={settings} controls={controls}>{children}</CarouselContent> : <>
            {editing && <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 5, display: 'flex', gap: 4, maxWidth: '90%', overflowX: 'auto' }} onMouseDown={event => event.stopPropagation()}>
                {slides.map((_, index) => <button key={index} type="button" aria-label={`Edit slide ${index + 1}`} onClick={event => { event.stopPropagation(); setActive(index); onSelect(index); }} className={`rounded-md px-2 py-1 text-[11px] ${active === index ? 'bg-ed-accent text-white' : 'bg-ed-field text-ed-text'}`}>{index + 1}</button>)}
                <button type="button" onClick={event => { event.stopPropagation(); onAdd(); }} className="whitespace-nowrap rounded-md bg-ed-field px-2 py-1 text-[11px] text-ed-text">+ Slide</button>
                <select aria-label="Add editable carousel controls" value="" onClick={event => event.stopPropagation()} onChange={event => { if (event.target.value) onAddControl(event.target.value as 'previous' | 'next' | 'pagination'); }} className="rounded-md bg-ed-field px-2 text-[11px] text-ed-text">
                    <option value="" disabled>+ Controls</option><option value="previous">Previous arrow</option><option value="next">Next arrow</option><option value="pagination">Pagination</option>
                </select>
            </div>}
            <div style={{ width: '100%', height: '100%' }} data-carousel-slide-editor>{slides[Math.min(active, slides.length - 1)] ?? <span className="pointer-events-none flex h-full items-center justify-center text-[12px] text-ed-muted">Add a slide, then design it with elements</span>}</div>
            <style>{'[data-carousel-slide-editor] > [data-canvas-element]{width:100%!important;height:100%!important;position:relative!important;inset:auto!important}'}</style>
            <div data-carousel-controls style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>{controls}</div>
            <style>{'[data-carousel-controls] > *{pointer-events:auto}'}</style>
        </>}
    </div>;
}
