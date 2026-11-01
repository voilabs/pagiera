import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { InstallPill } from "@/components/landing/install-pill";
import { SiteShell } from "@/components/site/site-shell";
import { PAGE_UI } from "@/lib/content";
import {
  getTemplateCatalog,
  getTemplatePreviewDocument,
} from "@/lib/content/template-catalog";
import { LANDING, type Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";
import "@/styles/content-pages.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-template" });
const two = (n: number) => String(n).padStart(2, "0");

export async function TemplatesIndex({ locale }: { locale: Locale }) {
  const ui = PAGE_UI[locale];
  const t = LANDING[locale];
  const catalog = await getTemplateCatalog();
  const href = (path: string) => localizedHref(path, locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="page-hero">
            <p className="eyebrow">{ui.templates}</p>
            <h1 className="display page-title">
              {ui.templatesTitle} <em>{ui.templatesAccent}</em>
            </h1>
            <p className="lede">{ui.templatesLede}</p>
          </header>
          <h2 className="ruled-label">
            {ui.templates}
            <span>{two(catalog.length)}</span>
          </h2>
          <ul className="template-grid">
            {catalog.map((item, index) => (
              <li key={item.id}>
                <a href={href(`/templates/${item.id}/preview`)}>
                  <span className="template-shot">
                    {/* biome-ignore lint/performance/noImgElement: static screenshot */}
                    <img
                      src={`/templates/${item.id}.png`}
                      alt=""
                      width={1440}
                      height={900}
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                    <span className="template-preview-tag">
                      {ui.preview}
                      <IconArrowRight size={13} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="template-info">
                    <span className="mega-num">{two(index + 1)}</span>
                    <span>
                      <span className="template-head">
                        <strong>{item.name}</strong>
                        <span className="cap-label" lang="en">
                          {item.category}
                        </span>
                      </span>
                      <span className="template-desc">{item.description}</span>
                      {item.pages.length > 0 && (
                        <span className="template-pages">
                          {ui.pages}: {item.pages.join(" · ")}
                        </span>
                      )}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <section className="page-cta" aria-labelledby="page-cta">
            <h2 id="page-cta" className="title">
              {ui.useTemplate}
            </h2>
            <p>{t.finalText}</p>
            <InstallPill command={t.install} copy={t.copy} copied={t.copied} />
            <div className="final-actions">
              <a className="btn btn-dark" href={href("/docs/templates")}>
                {t.finalPrimary}
              </a>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}

export async function TemplatePreview({
  locale,
  id,
}: {
  locale: Locale;
  id: string;
}) {
  const preview = await getTemplatePreviewDocument(id);
  if (!preview) notFound();
  const ui = PAGE_UI[locale];
  const href = (path: string) => localizedHref(path, locale);
  return (
    <div className={`template-preview ${manrope.variable}`}>
      {/* Template documents may ask for these families; only previews load them. */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Geist:ital,wght@0,100..900;1,100..900&family=Syncopate:wght@400;700&display=swap"
      />
      <header className="preview-bar">
        <a href={href("/templates")}>
          <IconArrowLeft size={14} aria-hidden="true" />
          {ui.back}
        </a>
        <span className="preview-name">
          {preview.template.name}
          <em lang="en">{preview.template.category}</em>
        </span>
        <a className="preview-use" href={href("/docs/templates")}>
          {ui.useTemplate}
          <IconArrowRight size={14} aria-hidden="true" />
        </a>
      </header>
      {/* Template copy is English; keep its uppercase text English too. */}
      <main lang="en">
        <RenderedPage
          elements={preview.document.elements}
          rootStyle={preview.document.rootStyle}
          data={{}}
        />
      </main>
    </div>
  );
}
