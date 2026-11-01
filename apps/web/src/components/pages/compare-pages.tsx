import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { InstallPill } from "@/components/landing/install-pill";
import { SiteShell } from "@/components/site/site-shell";
import { Accordion } from "@/components/ui/accordion";
import { PAGE_UI } from "@/lib/content";
import { COMPARE, type Mark } from "@/lib/content/compare-copy";
import { LANDING, type Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";

const two = (n: number) => String(n).padStart(2, "0");

// Hand-drawn marks: a hatched disc, a half-hatched disc and an empty ring.
export function MarkIcon({ mark, label }: { mark: Mark; label: string }) {
  return (
    <svg
      className={`mark mark-${mark}`}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        <clipPath id={`mark-half-${mark}`}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      {mark === "no" ? (
        <path
          d="M7 12.4 C 9 11.6, 15 12.6, 17 11.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <>
          <g
            clipPath={
              mark === "partial" ? `url(#mark-half-${mark})` : undefined
            }
          >
            {[4, 7, 10, 13, 16, 19].map((y) => (
              <line
                key={y}
                x1="2"
                x2="22"
                y1={y + 2}
                y2={y - 6}
                stroke="currentColor"
                strokeWidth="1.1"
              />
            ))}
          </g>
          <circle
            cx="12"
            cy="12"
            r="8.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </>
      )}
    </svg>
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

function RivalCards({ locale, exclude }: { locale: Locale; exclude?: string }) {
  const c = COMPARE[locale];
  const rivals = c.rivals.filter((r) => r.slug !== exclude);
  return (
    <ul className="rival-cards">
      {rivals.map((rival, index) => (
        <li key={rival.slug}>
          <a href={localizedHref(`/compare/${rival.slug}`, locale)}>
            <span className="rival-top">
              <span className="mega-num">{two(index + 1)}</span>
              <span className="cap-label">{rival.category}</span>
            </span>
            <strong lang="en">
              Pagiera <em>vs</em> {rival.name}
            </strong>
            <span className="rival-text">{rival.headline}</span>
            <span className="rival-bottom">
              <span className="mark-strip" aria-hidden="true">
                {rival.marks.map((mark, i) => (
                  <MarkIcon key={c.criteria[i]} mark={mark} label="" />
                ))}
              </span>
              <IconArrowRight size={18} stroke={1.3} aria-hidden="true" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CompareIndex({ locale }: { locale: Locale }) {
  const ui = PAGE_UI[locale];
  const c = COMPARE[locale];
  const href = (path: string) => localizedHref(path, locale);
  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="page-hero">
            <p className="eyebrow">{ui.compare}</p>
            <h1 className="display page-title">
              {ui.compareTitle} <em>{ui.compareAccent}</em>
            </h1>
            <p className="lede">{ui.compareLede}</p>
          </header>

          <section aria-labelledby="matrix">
            <h2 id="matrix" className="ruled-label">
              {c.matrixTitle}
              <span>
                {two(c.rivals.length + 1)} × {two(c.criteria.length)}
              </span>
            </h2>
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <td />
                    <th scope="col" className="ours">
                      Pagiera
                    </th>
                    {c.rivals.map((rival) => (
                      <th key={rival.slug} scope="col">
                        <a href={href(`/compare/${rival.slug}`)}>
                          {rival.name}
                        </a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.criteria.map((criterion, row) => (
                    <tr key={criterion}>
                      <th scope="row">
                        <span className="mega-num">{two(row + 1)}</span>
                        {criterion}
                      </th>
                      <td className="ours">
                        <MarkIcon
                          mark={c.pagieraMarks[row]}
                          label={c.legend[c.pagieraMarks[row]]}
                        />
                      </td>
                      {c.rivals.map((rival) => (
                        <td key={rival.slug}>
                          <MarkIcon
                            mark={rival.marks[row]}
                            label={c.legend[rival.marks[row]]}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="matrix-legend">
              {(["yes", "partial", "no"] as const).map((mark) => (
                <span key={mark}>
                  <MarkIcon mark={mark} label="" />
                  {c.legend[mark]}
                </span>
              ))}
              <p>※ {c.matrixNote}</p>
            </div>
          </section>

          <section aria-labelledby="rivals">
            <h2 id="rivals" className="ruled-label">
              {c.rivalsTitle}
              <span>{two(c.rivals.length)}</span>
            </h2>
            <RivalCards locale={locale} />
          </section>
          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}

export function ComparePage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const ui = PAGE_UI[locale];
  const c = COMPARE[locale];
  const rival = c.rivals.find((r) => r.slug === slug);
  if (!rival) return null;
  const href = (path: string) => localizedHref(path, locale);
  const ours =
    locale === "tr"
      ? "Next.js uygulamanızın içindeki görsel editör"
      : "the visual editor inside your Next.js app";

  return (
    <SiteShell locale={locale}>
      <div className="paper">
        <div className="rails">
          <header className="article-hero">
            <nav className="crumbs" aria-label="Breadcrumb">
              <a href={href("/compare")}>{ui.compare}</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page" lang="en">
                Pagiera vs {rival.name}
              </span>
            </nav>
            <h1 className="display page-title">{rival.headline}</h1>
            <p className="lede left">{rival.intent}</p>
          </header>

          <div className="versus-head" aria-hidden="true">
            <div className="versus-side ours">
              <span className="mega-num">A</span>
              <strong>Pagiera</strong>
              <span>{ours}</span>
            </div>
            <span className="versus-coin">vs</span>
            <div className="versus-side">
              <span className="mega-num">B</span>
              <strong lang="en">{rival.name}</strong>
              <span>{rival.tagline}</span>
            </div>
          </div>

          <div className="answer">
            <span className="mega-eyebrow">{ui.verdict}</span>
            <p>{rival.verdict}</p>
          </div>

          <section aria-labelledby="marks">
            <h2 id="marks" className="ruled-label">
              {c.matrixTitle}
              <span>{two(c.criteria.length)}</span>
            </h2>
            <ul className="mark-rows">
              {c.criteria.map((criterion, i) => (
                <li key={criterion}>
                  <span className="mega-num">{two(i + 1)}</span>
                  <span className="mark-criterion">{criterion}</span>
                  <span className="mark-pair">
                    <span className="ours">
                      <MarkIcon
                        mark={c.pagieraMarks[i]}
                        label={`Pagiera: ${c.legend[c.pagieraMarks[i]]}`}
                      />
                      Pagiera
                    </span>
                    <span>
                      <MarkIcon
                        mark={rival.marks[i]}
                        label={`${rival.name}: ${c.legend[rival.marks[i]]}`}
                      />
                      <span lang="en">{rival.name}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="side">
            <h2 id="side" className="ruled-label">
              {c.atGlance}
              <span>{two(rival.rows.length)}</span>
            </h2>
            <div className="table-wrap versus-table">
              <table>
                <thead>
                  <tr>
                    <td />
                    <th scope="col" lang="en">
                      Pagiera
                    </th>
                    <th scope="col" lang="en">
                      {rival.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rival.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.pagiera}</td>
                      <td>{row.rival}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="choose">
            {[
              { name: "Pagiera", items: rival.choosePagiera, ours: true },
              { name: rival.name, items: rival.chooseRival, ours: false },
            ].map((col) => (
              <section key={col.name} data-ours={col.ours}>
                <h2 className="title small">{c.chooseWhen(col.name)}</h2>
                <ul>
                  {col.items.map((text) => (
                    <li key={text}>
                      <IconCheck size={16} stroke={1.8} aria-hidden="true" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="together">
            <span className="mega-eyebrow">{c.together}</span>
            <p>{rival.together}</p>
          </div>

          <section className="faq" aria-labelledby="compare-faq">
            <div className="faq-intro">
              <p className="eyebrow" lang="en">
                Pagiera vs {rival.name}
              </p>
              <h2 id="compare-faq" className="title">
                {ui.questions}
              </h2>
            </div>
            <Accordion
              className="faq-list"
              items={rival.faq.map((q) => ({ title: q.q, content: q.a }))}
            />
          </section>

          <section aria-labelledby="others">
            <h2 id="others" className="ruled-label">
              {ui.otherComparisons}
              <span>{two(c.rivals.length - 1)}</span>
            </h2>
            <RivalCards locale={locale} exclude={slug} />
          </section>
          <Cta locale={locale} />
        </div>
      </div>
    </SiteShell>
  );
}
