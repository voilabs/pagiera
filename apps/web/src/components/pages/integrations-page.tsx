"use client";

import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { BrandIcon } from "@/components/landing/brand-icon";
import { SiteShell } from "@/components/site/site-shell";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATIONS,
  INTEGRATIONS_UI,
  type IntegrationCategory,
} from "@/lib/integrations";
import type { Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";
import "@/styles/integrations.css";

export function IntegrationsPage({ locale }: { locale: Locale }) {
  const t = INTEGRATIONS_UI[locale];
  const [category, setCategory] = useState<IntegrationCategory | "all">("all");
  const [query, setQuery] = useState("");
  const normalize = (value: string) =>
    value.toLocaleLowerCase(locale).normalize("NFKD").replace(/\p{M}/gu, "");
  const search = normalize(query.trim());
  const visible = INTEGRATIONS.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      normalize(
        `${item.name} ${item.summary[locale]} ${INTEGRATION_CATEGORIES.find((c) => c.id === item.category)?.[locale]}`,
      ).includes(search),
  );
  const href = (path: string) => localizedHref(path, locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="page-hero">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="display page-title">
              {t.title} <em>{t.accent}</em>
            </h1>
            <p className="lede">{t.lede}</p>
          </header>
          <section
            className="integration-flow"
            aria-labelledby="integration-flow-title"
          >
            <div>
              <h2 id="integration-flow-title" className="title small">
                {t.flowTitle}
              </h2>
              <p>{t.flowText}</p>
            </div>
            <ol className="integration-diagram">
              <li>
                <span>01</span>
                {t.flowHost}
                <small>React / Next.js</small>
              </li>
              <li>
                <span>02</span>Pagiera<small>{t.flowStudio}</small>
              </li>
              <li>
                <span>03</span>
                {t.flowData}
                <small>PostgreSQL / Redis / HTTP</small>
              </li>
            </ol>
          </section>
          <section
            className="integration-directory"
            aria-labelledby="integration-directory-title"
          >
            <h2 id="integration-directory-title" className="ruled-label">
              {t.all}
              <span>{INTEGRATIONS.length.toString().padStart(2, "0")}</span>
            </h2>
            <div className="integration-controls">
              <label className="integration-search">
                <IconSearch size={18} aria-hidden="true" />
                <span className="sr-only">{t.search}</span>
                <input
                  type="search"
                  placeholder={t.placeholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <fieldset className="integration-filters" aria-label={t.eyebrow}>
                {[
                  { id: "all" as const, en: "All", tr: "Tümü" },
                  ...INTEGRATION_CATEGORIES,
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item[locale]}
                  </button>
                ))}
              </fieldset>
            </div>
            <p className="integration-count" role="status" aria-live="polite">
              {visible.length} {t.results}
            </p>
            <ul className="integration-grid">
              {visible.map((item) => (
                <li key={item.id}>
                  <article className="integration-card">
                    <div className="integration-card-head">
                      <span className="integration-logo" aria-hidden="true">
                        {item.brand ? (
                          <BrandIcon name={item.brand} />
                        ) : (
                          item.mark
                        )}
                      </span>
                      <span className="integration-mode">{t[item.mode]}</span>
                    </div>
                    <p className="cap-label">
                      {
                        INTEGRATION_CATEGORIES.find(
                          (c) => c.id === item.category,
                        )?.[locale]
                      }
                    </p>
                    <h3>
                      {item.id === "authentication" && locale === "tr"
                        ? "Kimlik doğrulama"
                        : item.name}
                    </h3>
                    <p className="integration-summary">
                      {item.summary[locale]}
                    </p>
                    <details>
                      <summary>
                        {t.setup}
                        <span aria-hidden="true">+</span>
                      </summary>
                      <ol>
                        {item.steps.map((step) => (
                          <li key={step.en}>{step[locale]}</li>
                        ))}
                      </ol>
                    </details>
                    <a
                      className="text-link"
                      href={href(item.docs.split("#")[0])}
                    >
                      {t.guide}
                      <IconArrowRight size={16} aria-hidden="true" />
                    </a>
                  </article>
                </li>
              ))}
            </ul>
            {visible.length === 0 && (
              <div className="integration-empty">
                <p>{t.empty}</p>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => {
                    setCategory("all");
                    setQuery("");
                  }}
                >
                  {t.reset}
                </button>
              </div>
            )}
            <aside className="integration-note">
              <p>{t.note}</p>
              <a className="text-link" href={href("/docs/integrations")}>
                {t.start} <IconArrowRight size={16} aria-hidden="true" />
              </a>
            </aside>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
