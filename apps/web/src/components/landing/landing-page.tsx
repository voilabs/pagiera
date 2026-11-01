import Image from "next/image";
import { BrandIcon } from "@/components/landing/brand-icon";
import { InstallPill } from "@/components/landing/install-pill";
import { UseCaseTabs } from "@/components/landing/use-case-tabs";
import {
  ActionsVisual,
  CliVisual,
  DataVisual,
  Etching,
  MotionVisual,
  StudioVisual,
} from "@/components/landing/visuals";
import { Lines, PixelField, PixelMark } from "@/components/site/marks";
import { SiteShell } from "@/components/site/site-shell";
import { Accordion } from "@/components/ui/accordion";
import { LANDING, type Locale, STACK } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";
import assetsShot from "../../../public/editor/editor-assets.png";

const PILLAR_NUMBERS = ["01", "02", "03"];

export function LandingPage({ locale }: { locale: Locale }) {
  const t = LANDING[locale];
  const tr = locale === "tr";
  const href = (path: string) => localizedHref(path, locale);
  const visuals = {
    studio: <StudioVisual alt={t.editorAlt} />,
    data: <DataVisual />,
    actions: <ActionsVisual />,
    motion: <MotionVisual />,
    cli: <CliVisual />,
  };

  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <section className="hero">
            <h1 className="display">
              <Lines text={t.heroTitle} />
            </h1>
            <p className="lede">{t.heroText}</p>
            <div className="hero-art">
              <Etching />
              <InstallPill
                command={t.install}
                copy={t.copy}
                copied={t.copied}
              />
            </div>
          </section>

          <section className="studio" aria-labelledby="lp-editor">
            <div className="section-head">
              <h2 id="lp-editor" className="title">
                <Lines text={t.editorTitle} />
              </h2>
              <p>{t.editorText}</p>
            </div>
            <figure className="frame">
              <Image
                src={assetsShot}
                alt={t.editorAlt}
                sizes="(max-width: 1200px) 100vw, 1100px"
                placeholder="blur"
              />
            </figure>
            <ul className="pillars">
              {t.pillars.map((pillar, index) => (
                <li key={pillar.title}>
                  <span className="pillar-number">{PILLAR_NUMBERS[index]}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="ink" aria-labelledby="lp-flow">
        <PixelField className="pixel-field pixel-field-right" />
        <PixelField className="pixel-field pixel-field-left" />
        <div className="rails rails-dark">
          <div className="flow-head">
            <PixelMark />
            <h2 id="lp-flow" className="title">
              {t.flowTitle} <em>{t.flowAccent}</em>
            </h2>
            <p>{t.flowText}</p>
          </div>
          <UseCaseTabs
            label={t.featuresLabel}
            more={tr ? "Dokümanda oku" : "Read the docs"}
            tabs={t.useCases.map((item) => ({
              ...item,
              href: href(item.href),
              visual: visuals[item.id],
            }))}
          />

          <div className="stack-block">
            <p className="eyebrow">{t.stackEyebrow}</p>
            <h2 className="title small">{t.stackTitle}</h2>
            <p className="stack-text">{t.stackText}</p>
            <ul className="stack">
              {STACK.map((name) => (
                <li key={name}>
                  <span className="stack-mark">
                    <BrandIcon name={name} />
                  </span>
                  {name}
                </li>
              ))}
            </ul>
            <div className="stack-cards">
              {t.stackCards.map((card) => (
                <a
                  key={card.title}
                  className="stack-card"
                  href={href(card.href)}
                >
                  <span className="stack-card-mark" aria-hidden="true">
                    {card.mark}
                  </span>
                  <span>
                    <strong>{card.title}</strong>
                    <span>{card.text}</span>
                  </span>
                </a>
              ))}
            </div>
            <a className="text-link" href={href("/integrations")}>
              {t.stackLink} →
            </a>
          </div>
        </div>
      </section>

      <div className="paper">
        <div className="rails">
          <section className="numbers" aria-labelledby="lp-numbers">
            <p className="eyebrow">{t.numbersEyebrow}</p>
            <h2 id="lp-numbers" className="title">
              {t.numbersTitle}
            </h2>
            <ul className="numbers-grid">
              {t.numbers.map((item) => (
                <li key={item.label}>
                  <span className="number-value">{item.value}</span>
                  <span className="number-label">{item.label}</span>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="faq" aria-labelledby="lp-faq">
            <div className="faq-intro">
              <p className="eyebrow">{t.faqEyebrow}</p>
              <h2 id="lp-faq" className="title">
                <Lines text={t.faqTitle} />
              </h2>
              <p>{t.faqText}</p>
            </div>
            <Accordion
              className="faq-list"
              items={t.faq.map((item) => ({ title: item.q, content: item.a }))}
            />
          </section>

          <section className="final" aria-labelledby="lp-final">
            <h2 id="lp-final" className="title">
              <Lines text={t.finalTitle} />
            </h2>
            <p>{t.finalText}</p>
            <InstallPill command={t.install} copy={t.copy} copied={t.copied} />
            <div className="final-actions">
              <a className="btn btn-dark" href={href("/docs/getting-started")}>
                {t.finalPrimary}
              </a>
              <a
                className="btn btn-line"
                href="https://github.com/voilabs/pagiera"
              >
                {t.finalSecondary}
              </a>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
