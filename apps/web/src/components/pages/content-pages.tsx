import { IconArrowRight } from "@tabler/icons-react";
import { Fragment } from "react";
import { InstallPill } from "@/components/landing/install-pill";
import { SiteShell } from "@/components/site/site-shell";
import { Accordion } from "@/components/ui/accordion";
import { faqGroups, type GuideBlock, guides, PAGE_UI } from "@/lib/content";
import { LANDING, type Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";

const two = (n: number) => String(n).padStart(2, "0");
const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* Shared pieces */

function PageHero({
  eyebrow,
  title,
  accent,
  lede,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
}) {
  return (
    <header className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display page-title">
        {title} <em>{accent}</em>
      </h1>
      <p className="lede">{lede}</p>
    </header>
  );
}

function Crumbs({
  items,
  label = "Breadcrumb",
}: {
  items: { label: string; href?: string }[];
  label?: string;
}) {
  return (
    <nav className="crumbs" aria-label={label}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? (
            <a href={item.href}>{item.label}</a>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

function Cta({ locale }: { locale: Locale }) {
  const t = LANDING[locale];
  return (
    <section className="page-cta" aria-labelledby="page-cta">
      <h2 id="page-cta" className="title">
        {t.finalTitle.replace("\n", " ")}
      </h2>
      <p>{t.finalText}</p>
      <InstallPill command={t.install} copy={t.copy} copied={t.copied} />
      <div className="final-actions">
        <a
          className="btn btn-dark"
          href={localizedHref("/docs/getting-started", locale)}
        >
          {t.finalPrimary}
        </a>
      </div>
    </section>
  );
}

function Blocks({ blocks }: { blocks: readonly GuideBlock[] }) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;
    switch (block.type) {
      case "text":
        return <p key={key}>{block.body}</p>;
      case "list":
        return (
          <ul key={key} className="prose-list">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case "ordered":
        return (
          <ol key={key} className="prose-list ordered">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        );
      case "code":
        return (
          <figure key={key} className="code">
            <figcaption>{block.lang}</figcaption>
            <pre>
              <code>{block.source}</code>
            </pre>
          </figure>
        );
      case "note":
        return (
          <p key={key} className="note">
            {block.body}
          </p>
        );
      case "table":
        return (
          <div key={key} className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{block.head[0]}</th>
                  <th scope="col">{block.head[1]}</th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map(([a, b]) => (
                  <tr key={a}>
                    <th scope="row">{a}</th>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  });
}

/* Guides */

export function GuidesIndex({ locale }: { locale: Locale }) {
  const ui = PAGE_UI[locale];
  const list = guides(locale);
  const href = (path: string) => localizedHref(path, locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <PageHero
            eyebrow={ui.guides}
            title={ui.guidesTitle}
            accent={ui.guidesAccent}
            lede={ui.guidesLede}
          />
          <h2 className="ruled-label">
            {ui.guides}
            <span>{two(list.length)}</span>
          </h2>
          <ol className="article-list">
            {list.map((guide, index) => (
              <li key={guide.slug}>
                <a href={href(`/guides/${guide.slug}`)}>
                  <span className="mega-num">{two(index + 1)}</span>
                  <span className="article-body">
                    <span className="cap-label">{guide.category}</span>
                    <strong>{guide.title}</strong>
                    <span>{guide.description}</span>
                  </span>
                  <span className="article-meta">
                    {guide.minutes} {ui.minutes}
                    <IconArrowRight size={18} stroke={1.3} aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}

export function GuidePage({ locale, slug }: { locale: Locale; slug: string }) {
  const ui = PAGE_UI[locale];
  const list = guides(locale);
  const guide = list.find((g) => g.slug === slug);
  if (!guide) return null;
  const href = (path: string) => localizedHref(path, locale);
  const toc = [
    ...(guide.steps?.length ? [{ id: "steps", label: ui.steps }] : []),
    ...(guide.sections ?? []).map((s) => ({
      id: slugify(s.heading),
      label: s.heading,
    })),
    { id: "questions", label: ui.questions },
  ];
  const related = guide.related
    .map((r) => list.find((g) => g.slug === r))
    .filter((g) => g !== undefined);

  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="article-hero">
            <Crumbs
              items={[
                { label: ui.guides, href: href("/guides") },
                { label: guide.category },
              ]}
            />
            <h1 className="display page-title">{guide.title}</h1>
            <p className="article-stamp">
              {guide.minutes} {ui.minutes} · {ui.updated} {guide.updated}
            </p>
          </header>

          <div className="answer">
            <span className="mega-eyebrow">{ui.shortAnswer}</span>
            <p className="answer-q">{guide.question}</p>
            <p>{guide.answer}</p>
          </div>

          <div className="article">
            <aside className="article-toc" aria-label={ui.onThisPage}>
              <div className="article-toc-inner">
                <p className="eyebrow">{ui.onThisPage}</p>
                <ol>
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.label}</a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <article className="article-main">
              <section aria-labelledby="takeaways" className="takeaways">
                <h2 id="takeaways" className="eyebrow">
                  {ui.takeaways}
                </h2>
                <ol>
                  {guide.takeaways.map((item, i) => (
                    <li key={item}>
                      <span className="mega-num">{two(i + 1)}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </section>

              {guide.steps?.length ? (
                <section aria-labelledby="steps">
                  <h2 id="steps" className="title small">
                    {ui.steps}
                  </h2>
                  <ol className="guide-steps">
                    {guide.steps.map((step, i) => (
                      <li key={step.title}>
                        <span className="step-num">{two(i + 1)}</span>
                        <div>
                          <h3>{step.title}</h3>
                          <p>{step.body}</p>
                          {step.blocks && <Blocks blocks={step.blocks} />}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {(guide.sections ?? []).map((section) => (
                <section
                  key={section.heading}
                  aria-labelledby={slugify(section.heading)}
                  className="prose-section"
                >
                  <h2 id={slugify(section.heading)} className="title small">
                    {section.heading}
                  </h2>
                  <Blocks blocks={section.blocks} />
                </section>
              ))}

              <section aria-labelledby="questions" className="prose-section">
                <h2 id="questions" className="title small">
                  {ui.questions}
                </h2>
                <Accordion
                  className="faq-list inline"
                  items={guide.faq.map((item) => ({
                    title: item.question,
                    content: item.answer,
                  }))}
                />
              </section>
            </article>
          </div>

          {related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="ruled-label">
                {ui.related}
                <span>{two(related.length)}</span>
              </h2>
              <ol className="mega-list index-list">
                {related.map((item, i) => (
                  <li key={item.slug}>
                    <a href={href(`/guides/${item.slug}`)}>
                      <span className="mega-num">{two(i + 1)}</span>
                      <span className="mega-body">
                        <strong>{item.navLabel}</strong>
                        <span>{item.title}</span>
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
          )}
          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}

/* FAQ */

export function FaqPage({ locale }: { locale: Locale }) {
  const ui = PAGE_UI[locale];
  const groups = faqGroups(locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <PageHero
            eyebrow={ui.faq}
            title={ui.faqTitle}
            accent={ui.faqAccent}
            lede={ui.faqLede}
          />
          <nav className="faq-jump" aria-label={ui.onThisPage}>
            {groups.map((group, i) => (
              <a key={group.title} href={`#${slugify(group.title)}`}>
                <span className="mega-num">{two(i + 1)}</span>
                {group.title}
              </a>
            ))}
          </nav>
          {groups.map((group, i) => (
            <section
              key={group.title}
              className="faq"
              aria-labelledby={slugify(group.title)}
            >
              <div className="faq-intro">
                <p className="eyebrow">
                  {two(i + 1)} / {two(groups.length)}
                </p>
                <h2 id={slugify(group.title)} className="title small">
                  {group.title}
                </h2>
                <p>{group.blurb}</p>
              </div>
              <Accordion
                className="faq-list"
                items={group.entries.map((entry) => ({
                  title: entry.question,
                  content: entry.answer,
                }))}
              />
            </section>
          ))}
          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}
