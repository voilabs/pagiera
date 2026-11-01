import { IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { InstallPill } from "@/components/landing/install-pill";
import {
  ActionsVisual,
  DataVisual,
  MotionVisual,
  SketchData,
  SketchGraph,
  SketchMotion,
} from "@/components/landing/visuals";
import { PixelField } from "@/components/site/marks";
import { SiteShell } from "@/components/site/site-shell";
import { Accordion } from "@/components/ui/accordion";
import { FEATURES, type FeatureSlug } from "@/lib/features-copy";
import { LANDING, type Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";

const SKETCHES: Record<FeatureSlug, () => ReactNode> = {
  data: SketchData,
  "action-workflow": SketchGraph,
  "motion-editor": SketchMotion,
};
const DEMOS: Record<FeatureSlug, () => ReactNode> = {
  data: DataVisual,
  "action-workflow": ActionsVisual,
  "motion-editor": MotionVisual,
};

const two = (n: number) => String(n).padStart(2, "0");

function Cta({ locale }: { locale: Locale }) {
  const { ui } = FEATURES[locale];
  const t = LANDING[locale];
  return (
    <section className="page-cta" aria-labelledby="page-cta">
      <h2 id="page-cta" className="title">
        {ui.ctaTitle}
      </h2>
      <p>{ui.ctaText}</p>
      <InstallPill command={t.install} copy={t.copy} copied={t.copied} />
      <div className="final-actions">
        <a
          className="btn btn-dark"
          href={localizedHref("/docs/getting-started", locale)}
        >
          {ui.getStarted}
        </a>
      </div>
    </section>
  );
}

export function FeaturesIndex({ locale }: { locale: Locale }) {
  const { ui, features } = FEATURES[locale];
  const href = (path: string) => localizedHref(path, locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="page-hero">
            <p className="eyebrow">{ui.indexEyebrow}</p>
            <h1 className="display page-title">
              {ui.indexTitle} <em>{ui.indexAccent}</em>
            </h1>
            <p className="lede">{ui.indexLede}</p>
          </header>

          <section aria-labelledby="featured">
            <h2 id="featured" className="ruled-label">
              {ui.featuredLabel}
              <span>{two(features.length)}</span>
            </h2>
            <ul className="feature-cards">
              {features.map((feature, index) => {
                const Sketch = SKETCHES[feature.slug];
                return (
                  <li key={feature.slug}>
                    <a href={href(`/features/${feature.slug}`)}>
                      <span className="feature-card-art">
                        <Sketch />
                      </span>
                      <span className="mega-num">{two(index + 1)}</span>
                      <strong>{feature.name}</strong>
                      <span className="feature-card-text">{feature.lede}</span>
                      <span className="mega-cta">
                        {ui.explore}
                        <IconArrowRight size={14} aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="more">
            <h2 id="more" className="ruled-label">
              {ui.moreLabel}
              <span>{two(ui.more.length)}</span>
            </h2>
            <ol className="mega-list index-list">
              {ui.more.map((item, index) => (
                <li key={item.label}>
                  <a href={href(item.href)}>
                    <span className="mega-num">
                      {two(index + features.length + 1)}
                    </span>
                    <span className="mega-body">
                      <strong>{item.label}</strong>
                      <span>{item.text}</span>
                    </span>
                    <IconArrowRight
                      className="mega-glyph"
                      size={18}
                      stroke={1.3}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}

export function FeaturePage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: FeatureSlug;
}) {
  const { ui, features } = FEATURES[locale];
  const index = features.findIndex((f) => f.slug === slug);
  const f = features[index];
  const next = features[(index + 1) % features.length];
  const href = (path: string) => localizedHref(path, locale);
  const Sketch = SKETCHES[slug];
  const Demo = DEMOS[slug];

  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="feature-hero">
            <div className="feature-hero-copy">
              <nav className="crumbs" aria-label="Breadcrumb">
                <a href={href("/features")}>{ui.breadcrumb}</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{f.name}</span>
              </nav>
              <h1 className="display page-title">
                {f.title} <em>{f.accent}</em>
              </h1>
              <p className="lede">{f.lede}</p>
              <div className="final-actions">
                <a
                  className="btn btn-dark"
                  href={href("/docs/getting-started")}
                >
                  {ui.getStarted}
                </a>
                <a className="btn btn-line" href={href(f.docs)}>
                  {ui.readDocs}
                </a>
              </div>
            </div>
            <div className="feature-hero-art">
              <Sketch />
              <span className="mega-eyebrow">
                {f.eyebrow}
                <span>{two(index + 1)}</span>
              </span>
            </div>
          </header>
        </div>
      </div>

      <section className="ink" aria-label={f.windowTitle}>
        <PixelField className="pixel-field pixel-field-right" />
        <div className="rails rails-dark feature-demo">
          <div className="window">
            <div className="window-bar" aria-hidden="true">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="window-title">Pagiera · {f.windowTitle}</span>
            </div>
            <div className="window-body">
              <Demo />
            </div>
          </div>
          <p className="demo-caption">{f.caption}</p>
        </div>
      </section>

      <div className="paper">
        <div className="rails">
          <section aria-labelledby="steps">
            <h2 id="steps" className="ruled-label">
              {ui.stepsTitle}
              <span>{two(f.steps.length)}</span>
            </h2>
            <ol className="steps">
              {f.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="step-num">{two(i + 1)}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="capabilities">
            <h2 id="capabilities" className="ruled-label">
              {ui.capabilitiesTitle}
              <span>{two(f.capabilities.length)}</span>
            </h2>
            <ul className="capabilities">
              {f.capabilities.map((item) => (
                <li key={item.title}>
                  <span className="cap-label">{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="limits">
            <h2 id="limits" className="ruled-label">
              {ui.limitsTitle}
              <span>{two(f.limits.length)}</span>
            </h2>
            <ul className="numbers-grid">
              {f.limits.map((item) => (
                <li key={item.label}>
                  <span className="number-value">{item.value}</span>
                  <span className="number-label">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="limits-note">{f.limitsNote}</p>
          </section>

          <section className="faq" aria-labelledby="feature-faq">
            <div className="faq-intro">
              <p className="eyebrow">{f.name}</p>
              <h2 id="feature-faq" className="title">
                {ui.faqTitle}
              </h2>
            </div>
            <Accordion
              className="faq-list"
              items={f.faq.map((item) => ({ title: item.q, content: item.a }))}
            />
          </section>

          <a className="next-feature" href={href(`/features/${next.slug}`)}>
            <span className="mega-eyebrow">{ui.next}</span>
            <strong>
              {next.title} <em>{next.accent}</em>
            </strong>
            <IconArrowRight size={28} stroke={1.2} aria-hidden="true" />
          </a>

          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}
