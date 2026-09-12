import React, { type CSSProperties } from 'react';
import { normalizeTextEffects, type TextEffects } from '../editor/text-effects';

const css = `
[data-pg-text]{display:block;view-timeline-name:--pg-text-view;view-timeline-axis:block}
[data-pg-text] .pg-text-word{white-space:nowrap}
[data-pg-text] .pg-text-unit{display:inline-block;white-space:pre-wrap;transition:translate var(--text-duration) cubic-bezier(.2,.8,.2,1),text-shadow var(--text-duration) ease;transition-delay:calc(var(--i)*var(--text-stagger))}
[data-pg-text-hover=lift]:hover .pg-text-unit,[data-pg-text-hover=lift]:focus-within .pg-text-unit{translate:0 calc(-1*var(--text-distance))}
[data-pg-text-hover=glow]:hover .pg-text-unit,[data-pg-text-hover=glow]:focus-within .pg-text-unit{text-shadow:0 0 16px currentColor,0 0 32px currentColor}
[data-pg-text-hover=underline] .pg-text-unit{text-decoration:underline;text-decoration-color:transparent;text-underline-offset:.22em;transition:text-decoration-color var(--text-duration);transition-delay:calc(var(--i)*var(--text-stagger))}
[data-pg-text-hover=underline]:hover .pg-text-unit,[data-pg-text-hover=underline]:focus-within .pg-text-unit{text-decoration-color:currentColor}
@keyframes pg-text-reveal{from{opacity:.15}to{opacity:1}}
@keyframes pg-text-rise{from{opacity:0;transform:translateY(var(--text-distance))}to{opacity:1;transform:translateY(0)}}
@keyframes pg-text-blur{from{opacity:.15;filter:blur(8px)}to{opacity:1;filter:blur(0)}}
[data-pg-text] .pg-text-roll{display:inline-block;position:relative;overflow:hidden;vertical-align:bottom;max-width:100%}
[data-pg-text] .pg-text-roll-original{display:block}
[data-pg-text] .pg-text-roll-copy{display:block;position:absolute;inset:0;pointer-events:none;transform:translate(calc(-1 * var(--roll-x)),calc(100% + var(--text-distance))) skewY(var(--roll-angle))}
@keyframes pg-text-roll-out{0%{transform:translate(0,0) skewY(0deg)}80%,100%{transform:translate(var(--roll-x),calc(-100% - var(--text-distance))) skewY(calc(-1 * var(--roll-angle)))}}
@keyframes pg-text-roll-in{0%{transform:translate(calc(-1 * var(--roll-x)),calc(100% + var(--text-distance))) skewY(var(--roll-angle))}80%,100%{transform:translate(0,0) skewY(0deg)}}
:is([data-pg-text]:hover,a:is(:hover,:focus-visible) [data-pg-text],button:is(:hover,:focus-visible) [data-pg-text])[data-pg-text-hover=roll] .pg-text-roll-original{animation:pg-text-roll-out var(--text-duration) cubic-bezier(.22,.8,.25,1) calc(var(--i)*var(--text-stagger)) var(--roll-repeat) both}
:is([data-pg-text]:hover,a:is(:hover,:focus-visible) [data-pg-text],button:is(:hover,:focus-visible) [data-pg-text])[data-pg-text-hover=roll] .pg-text-roll-copy{animation:pg-text-roll-in var(--text-duration) cubic-bezier(.22,.8,.25,1) calc(var(--i)*var(--text-stagger)) var(--roll-repeat) both}
@supports(animation-timeline:view()){
[data-pg-text-scroll=reveal] .pg-text-unit{animation-name:pg-text-reveal}
[data-pg-text-scroll=rise] .pg-text-unit{animation-name:pg-text-rise}
[data-pg-text-scroll=blur] .pg-text-unit{animation-name:pg-text-blur}
[data-pg-text-scroll]:not([data-pg-text-scroll=none]) .pg-text-unit{animation-duration:auto;animation-timing-function:linear;animation-fill-mode:both;animation-timeline:--pg-text-view;animation-range:cover var(--text-start) cover var(--text-end)}
}
@media(prefers-reduced-motion:reduce){[data-pg-text] .pg-text-unit{animation:none!important;transition:none!important;translate:none!important;text-shadow:none!important}}
@media(prefers-reduced-motion:reduce){[data-pg-text] .pg-text-roll-original{animation:none!important;transform:none!important}[data-pg-text] .pg-text-roll-copy{display:none!important}}
`;

/** Shared by the canvas and renderer. Unsupported scroll timelines fail open. */
export function TextEffectsContent({ content, effects, enabled = true }: { content: string; effects: TextEffects; enabled?: boolean }) {
    const settings = normalizeTextEffects(effects)!;
    const chunks = content.split(/(\s+)/);
    const letters = (word: string) => Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word), part => part.segment);
    const count = settings.split === 'none' ? 1 : chunks.filter(chunk => chunk && !/^\s+$/.test(chunk)).reduce((n, chunk) => n + (settings.split === 'letters' ? letters(chunk).length : 1), 0);
    let index = 0;
    const unit = (value: string, key: string) => {
        const i = index++;
        const start = settings.start + (count > 1 ? i / (count - 1) : 0) * (settings.end - settings.start) * .65;
        return <span className="pg-text-unit" key={key} style={{ '--i': i, '--text-start': `${start}%`, '--text-end': `${count <= 1 ? settings.end : start + (settings.end - settings.start) * .35}%` } as CSSProperties}>{settings.hover === 'roll' ? <span className="pg-text-roll"><span className="pg-text-roll-original">{value}</span><span className="pg-text-roll-copy" aria-hidden="true">{value}</span></span> : value}</span>;
    };
    return <><style>{css}</style><span data-pg-text data-pg-text-hover={enabled ? settings.hover : 'none'} data-pg-text-scroll={enabled ? settings.scroll : 'none'} style={{ pointerEvents: enabled ? 'auto' : undefined, '--text-duration': `${settings.duration}ms`, '--text-stagger': `${settings.stagger}ms`, '--text-distance': `${settings.distance}px`, '--roll-angle': `${settings.angle}deg`, '--roll-x': `${Math.tan((settings.angle ?? 15) * Math.PI / 180) * 1.2}em`, '--roll-repeat': settings.repeat ? 'infinite' : '1' } as CSSProperties}>
        {settings.split === 'none' ? unit(content, 'all') : chunks.map((chunk, at) => /^\s+$/.test(chunk) ? chunk : settings.split === 'words' ? unit(chunk, String(at)) : <span className="pg-text-word" key={at}>{letters(chunk).map((letter, i) => unit(letter, `${at}-${i}`))}</span>)}
    </span></>;
}
