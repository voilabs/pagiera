'use client';

import { useEffect, useRef, useState } from 'react';
import { shaderDocument } from '../../../../../packages/pagiera/src/internal/lib/editor/shaders';
import { normalizeInteractive } from '../../../../../packages/pagiera/src/internal/lib/editor/interactive';
import { CarouselContent, mountNativeCarousels } from '../../../../../packages/pagiera/src/internal/lib/render/carousel-content';
import { MarqueeContent, mountMarquees } from '../../../../../packages/pagiera/src/internal/lib/render/marquee';
import './showcase.css';

const shader = shaderDocument('aurora', { colors: ['#13032a', '#5402e6', '#c59aff'], speed: .6, scale: .8 });
const carousel = normalizeInteractive({ kind: 'carousel', items: [], autoplay: false, loop: true, transition: 'slide', duration: 650, easing: 'ease-in-out', arrows: false, dots: false })!;
const marquee = normalizeInteractive({ kind: 'marquee', items: [], autoplay: true, interval: 28 })!;
const projects = [
    { name: 'Objects of tomorrow.', category: '01 / BRAND STRATEGY · DIGITAL EXPERIENCE', color: 'lilac', word: 'ora', text: 'A new perspective on everyday essentials.', tags: ['Brand identity', 'E-commerce'] },
    { name: 'A little less ordinary.', category: '02 / ART DIRECTION · DEVELOPMENT', color: 'lime', word: 'off.', text: 'A bold new home for ideas that don’t fit in.', tags: ['Art direction', 'Website'] },
    { name: 'Made to move you.', category: '03 / INTERACTION · VISUAL IDENTITY', color: 'peach', word: 'movo', text: 'Movement, made beautifully simple.', tags: ['Motion design', 'Product'] },
];
function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <span aria-hidden="true">{diagonal ? '↗' : '↗'}</span>; }
function Mark() { return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 3h22v7H10v5h12v7H10v3H3V3Z" fill="currentColor" /></svg>; }

export default function Showcase() {
    const root = useRef<HTMLDivElement>(null);
    const [service, setService] = useState('Design');
    const [sent, setSent] = useState(false);
    const [menu, setMenu] = useState(false);
    useEffect(() => {
        if (!root.current) return;
        const stopCarousel = mountNativeCarousels(root.current);
        const stopMarquee = mountMarquees(root.current);
        return () => { stopCarousel(); stopMarquee(); };
    }, []);
    return <div className="forma" ref={root}>
        <header className="f-nav"><a className="f-logo" href="#home" aria-label="Forma home"><Mark />forma<span>®</span></a>
            <nav aria-label="Main navigation" className={menu ? 'is-open' : ''}><a href="#work" onClick={() => setMenu(false)}>Selected work</a><a href="#studio" onClick={() => setMenu(false)}>The studio</a><a href="#contact" onClick={() => setMenu(false)}>Contact</a></nav>
            <a className="f-contact" href="#contact">Let’s talk <Arrow /></a><button className="f-menu" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
        </header>
        <main>
            <section id="home" className="f-hero">
                <iframe title="Animated purple aurora shader" className="f-shader" srcDoc={shader} sandbox="allow-scripts" tabIndex={-1} />
                <div className="f-hero-shade" />
                <div className="f-hero-top"><span><i /> Independent minds. Shared ambition.</span><span>BASED EVERYWHERE / CREATING BEYOND</span></div>
                <div className="f-hero-main"><div><p className="f-eyebrow">A SMALL STUDIO FOR BIG POSSIBILITIES</p><h1>Good ideas.<br />Extraordinary<br /><em>possibilities.</em></h1><p className="f-hero-copy">We turn a spark into something people feel.<br />Thoughtful brands. Expressive websites. Lasting impressions.</p><a className="f-button light" href="#work">Explore our work <span>↗</span></a></div>
                    <div className="f-sculpture" aria-label="Abstract orbital sculpture"><div className="f-orbit one" /><div className="f-orbit two" /><div className="f-orbit three" /><div className="f-orbit four" /><span className="f-orbit-center">f.</span><span className="f-sculpture-label">IDEAS IN CONSTANT MOTION<br />FIG. 001 — FORMA STUDIO</span><span className="f-cross">+</span></div>
                </div>
                <div className="f-hero-bottom"><span>STRATEGY · DESIGN · DEVELOPMENT</span><a href="#studio">Scroll to discover ↓</a><span>OPEN FOR COLLABORATIONS <i /></span></div>
            </section>
            <section className="f-trust" aria-label="Collaborator showcase"><p>GOOD COMPANY.<br /><strong>EVEN BETTER COLLABORATIONS.</strong></p><div className="f-marquee"><MarqueeContent settings={marquee}>{['⊕ Layers', 'Sisyphus', '▰ Circooles', 'Catalog', '⌘ Quotient', 'Nietzsche'].map(name => <span className="f-partner" key={name}>{name}</span>)}</MarqueeContent></div></section>
            <section id="work" className="f-section f-work"><div className="f-section-head"><div><p className="f-eyebrow">01 / SELECTED WORK</p><h2>Different by design.</h2></div><p>A few things we’ve put our hearts into.<br />Always intentional. Never off the shelf.</p></div>
                <div className="f-carousel"><CarouselContent settings={carousel} controls={<div className="f-project-controls"><div className="f-pagination">{projects.map((p, i) => <button key={p.word} data-carousel-action="go-to" data-carousel-target={i} aria-label={`View ${p.word} project`}>{String(i + 1).padStart(2, '0')}</button>)}</div><div className="f-arrows"><button data-carousel-action="previous" aria-label="Previous project">←</button><button data-carousel-action="next" aria-label="Next project">→</button></div></div>}>
                    {projects.map(p => <article key={p.word} className={`f-project ${p.color}`}><div className="f-project-info"><span className="f-eyebrow">{p.category}</span><h3>{p.name}</h3><p>{p.text}</p><div className="f-tags">{p.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="f-project-art"><div className="f-poster"><span>EVERYDAY, REIMAGINED.</span><strong>{p.word}<sup>®</sup></strong><div className="f-product" /><span>LESS, BUT WITH MORE FEELING. ↗</span></div></div></article>)}
                </CarouselContent></div>
            </section>
            <section id="studio" className="f-section f-studio"><p className="f-eyebrow">02 / SMALL TEAM. FULL PICTURE.</p><div className="f-studio-grid"><h2>Not just how it looks.<br />How it <em>makes you feel.</em></h2><div><p>We’re a close-knit collective of thinkers, designers and builders. We connect the dots between what makes you different and what makes people care.</p><a className="f-text-link" href="#contact">Meet your next creative partners ↗</a></div></div>
                <div className="f-service-head"><div role="tablist" aria-label="Explore services">{['Design', 'Build', 'Evolve'].map(s => <button key={s} role="tab" aria-selected={service === s} aria-controls="service-content" id={`tab-${s}`} onClick={() => setService(s)}>{s}<span>↗</span></button>)}</div><span>ONE PARTNER. FROM FIRST IDEA TO WHAT’S NEXT.</span></div>
                <div id="service-content" role="tabpanel" aria-labelledby={`tab-${service}`} className="f-cards">{(service === 'Design' ? [['✳', 'Find your own voice.', 'Brand strategy & identity', 'Distinctive identities with a clear point of view. From the first word to the smallest detail.'], ['⌘', 'Make every click count.', 'Web & digital design', 'Intuitive experiences with enough personality to make people stop, feel and explore.'], ['◉', 'Give ideas momentum.', 'Motion & interaction', 'Purposeful movement that turns a good experience into an unforgettable one.']] : service === 'Build' ? [['↗', 'From vision to live.', 'Web development', 'Responsive, accessible websites with a carefully considered experience on every screen.'], ['⊞', 'Room for what’s next.', 'Design systems', 'Reusable components, shared layouts and a solid foundation that grows with your brand.'], ['◎', 'Connected by default.', 'Integrations', 'Bring your content, forms and everyday tools together into one seamless experience.']] : [['✳', 'Stay in good shape.', 'Ongoing care', 'A creative partner for updates, improvements and the next chapter of your story.'], ['↗', 'Better with every step.', 'Optimization', 'Learn from real feedback and refine the details that matter to your audience.'], ['⌘', 'Keep moving forward.', 'Creative partnership', 'An extension of your team, ready to explore whatever comes next.']]).map(([icon, title, subtitle, body], i) => <article key={title} className="f-card"><div className="f-card-top"><span>{icon}</span><small>0{i + 1}</small></div><p className="f-eyebrow">{subtitle}</p><h3>{title}</h3><p>{body}</p></article>)}</div>
            </section>
            <section className="f-section f-faq"><div><p className="f-eyebrow">03 / A LITTLE CLARITY</p><h2>Good questions.<br />Straight answers.</h2><p>Something else on your mind?<br /><a href="#contact">We’d love to hear it ↗</a></p></div><div className="f-questions">{[['What can we create together?', 'A brand from scratch, a new website, a product experience or an ongoing creative partnership. We shape the scope around your idea.'], ['How does a project usually work?', 'We start with a conversation, agree on the direction, then work in focused stages: discover, design, build and refine. You’re part of the process throughout.'], ['Can you work with our existing team?', 'Absolutely. We can lead the creative process or join your team for a specific part of it.'], ['Is this a real studio website?', 'This is a Pagiera component showcase. The shader, carousel and marquee use the package’s actual rendering components; the contact form is a local demonstration.']].map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
            <section id="contact" className="f-section f-inquiry"><div><p className="f-eyebrow"><i /> NEXT CHAPTER STARTS HERE</p><h2>Have a good feeling?<br /><em>Let’s follow it.</em></h2><p>Tell us what you’re imagining.<br />Big idea or early spark — we’re all ears.</p><a href="mailto:hello@example.com">hello@example.com ↗</a></div><form onSubmit={event => { event.preventDefault(); setSent(true); }}><div className="f-form-row"><label>Your name<input required name="name" autoComplete="name" placeholder="Alex Morgan" /></label><label>Email address<input required type="email" name="email" autoComplete="email" placeholder="alex@company.com" /></label></div><label>What do you have in mind?<select name="interest" defaultValue=""><option value="" disabled>Select a service</option><option>Brand &amp; identity</option><option>Website &amp; development</option><option>Creative partnership</option><option>A bit of everything</option></select></label><label>A little about your idea<textarea required name="message" rows={3} placeholder="The beginning of something good…" /></label><button className="f-button dark" type="submit">{sent ? 'Demo received ✓' : 'Start a conversation'}<span>↗</span></button><p className="f-form-note" role="status">{sent ? 'Thanks! This is a local demo; nothing was sent or stored.' : 'Demo form · no data is sent or stored.'}</p></form></section>
        </main>
        <footer className="f-footer"><a className="f-logo" href="#home"><Mark />forma<span>®</span></a><p>Independent by nature. Connected by design.</p><a href="#home">Back to top ↑</a><div>© 2026 FORMA — A PAGIERA SHOWCASE<span>BUILT WITH CURIOSITY. AND PAGIERA.</span></div></footer>
    </div>;
}
