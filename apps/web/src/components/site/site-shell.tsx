import type { ReactNode } from "react";
import { SiteNav } from "@/components/landing/site-nav";
import { Logo } from "@/components/site/marks";
import { fontVariables } from "@/lib/fonts";
import { LANDING, type Locale } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";
import "@/styles/landing.css";
import "@/styles/pages.css";
import "@/styles/content-pages.css";
import "@/styles/compare.css";

// The marketing chrome shared by every page: fonts, sticky navigation and footer.
export function SiteShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = LANDING[locale];
  const tr = locale === "tr";
  const href = (path: string) => localizedHref(path, locale);
  return (
    <div className={`landing ${fontVariables}`}>
      <a className="skip-link" href="#main">
        {tr ? "İçeriğe geç" : "Skip to content"}
      </a>
      <div className="paper nav-shell">
        <div className="rails">
          <SiteNav menu={t.menu} locale={locale} cta={t.cta} />
        </div>
      </div>
      <main id="main">{children}</main>
      <footer className="lp-footer">
        <div className="rails rails-dark">
          <div className="footer-top">
            <a className="lp-brand" href={href("/")}>
              <Logo />
              Pagiera
            </a>
            {t.footer.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2>{column.title}</h2>
                {column.links.map((link) => (
                  <a key={link.label} href={href(link.href)}>
                    {link.label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
          <div className="footer-bottom">
            <span>{t.legal}</span>
            <span>© {new Date().getFullYear()} Pagiera</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
