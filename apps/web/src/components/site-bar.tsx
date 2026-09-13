import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** `match` is the `active` value a page passes when this link is its own. */
type Translate = (en: string, tr: string) => string;

const getNavLinks = (t: Translate) => [
  { label: t("Features", "Özellikler"), href: "/#features" },
  { label: t("Docs", "Belgeler"), href: "/docs", match: "docs" },
  { label: t("Guides", "Rehberler"), href: "/guides", match: "guides" },
  { label: t("Templates", "Şablonlar"), href: "/templates", match: "templates" },
  { label: t("Compare", "Karşılaştır"), href: "/compare", match: "compare" },
  { label: t("FAQ", "Sık sorulan sorular"), href: "/faq", match: "faq" },
] as const;

export type NavSection = "docs" | "guides" | "templates" | "compare" | "faq";

const REPO_HREF = "https://github.com/voilabs/pagiera";

/**
 * The menu covers the whole site, not just the documentation. Guides, the
 * comparisons and the FAQ have no top-level nav entry of their own, so if they
 * are missing here they are reachable only from the footer.
 *
 * Hints are kept to roughly thirty characters: a hint that wraps to a second
 * line breaks the row rhythm of the column it sits in.
 */
type MegaLink = { label: string; href: string; icon: IconName; hint: string };

const getMegaMenus = (t: Translate): Array<{
  label: string;
  intro: string;
  columns: Array<{ title: string; links: MegaLink[] }>;
  featured: { body: string; label: string; href: string; icon: IconName };
}> => [
  {
    label: t("Product", "Ürün"),
    intro: t("Design the page itself — not a description of it.", "Sayfayı tarif etmek yerine doğrudan tasarlayın."),
    columns: [
      {
        title: t("The editor", "Düzenleyici"),
        links: [
          {
            label: t("Visual canvas", "Görsel tuval"),
            href: "/docs/studio",
            icon: "frame",
            hint: t("Artboards, layers, inspector", "Çalışma alanları, katmanlar, özellikler"),
          },
          {
            label: t("Components & layouts", "Bileşenler ve düzenler"),
            href: "/docs/components-layouts",
            icon: "brackets",
            hint: t("Build once, reuse everywhere", "Bir kez oluştur, her yerde kullan"),
          },
          {
            label: t("Responsive design", "Duyarlı tasarım"),
            href: "/docs/responsive-design",
            icon: "maximize",
            hint: t("Overrides per breakpoint", "Ekran boyutuna özel ayarlar"),
          },
          {
            label: t("Motion & interactions", "Hareket ve etkileşimler"),
            href: "/docs/interactions",
            icon: "bolt",
            hint: t("Hover, entrance, scroll", "Üzerine gelme, giriş, kaydırma"),
          },
        ],
      },
      {
        title: t("The page", "Sayfa"),
        links: [
          {
            label: t("Document model", "Belge modeli"),
            href: "/docs/document-model",
            icon: "layers",
            hint: t("How a page is stored", "Sayfanın saklanma biçimi"),
          },
          {
            label: t("Blocks", "Bloklar"),
            href: "/docs/blocks",
            icon: "panel",
            hint: t("Carousels, marquees, forms", "Slaytlar, kayan şeritler, formlar"),
          },
          {
            label: t("Dynamic data", "Dinamik veri"),
            href: "/docs/data-binding",
            icon: "database",
            hint: t("Bind your own APIs", "Kendi API’lerinizi bağlayın"),
          },
          {
            label: t("AI & MCP", "Yapay zekâ ve MCP"),
            href: "/docs/ai-mcp",
            icon: "sparkles",
            hint: t("Let an agent edit it", "Bir ajanla düzenleyin"),
          },
        ],
      },
    ],
    featured: {
      body: t("Complete responsive systems you can open and edit on day one.", "İlk günden açıp düzenleyebileceğiniz eksiksiz duyarlı tasarım sistemleri."),
      label: t("Browse templates", "Şablonlara göz atın"),
      href: "/templates",
      icon: "grid",
    },
  },
  {
    label: t("Developers", "Geliştiriciler"),
    intro: t("Bring visual editing into the stack you already own.", "Görsel düzenlemeyi mevcut teknoloji altyapınıza ekleyin."),
    columns: [
      {
        title: t("Set it up", "Kurulum"),
        links: [
          {
            label: t("Getting started", "Başlangıç"),
            href: "/docs/getting-started",
            icon: "play",
            hint: t("Install and configure", "Yükleyin ve yapılandırın"),
          },
          {
            label: t("Next.js setup", "Next.js kurulumu"),
            href: "/docs/nextjs-setup",
            icon: "code",
            hint: t("Routes and the studio", "Rotalar ve stüdyo"),
          },
          {
            label: t("Architecture", "Mimari"),
            href: "/docs/architecture",
            icon: "layers",
            hint: t("How the pieces fit", "Parçaların bir araya gelişi"),
          },
          {
            label: t("Deployment", "Dağıtım"),
            href: "/docs/deployment",
            icon: "rocket",
            hint: t("Run it on your own infra", "Kendi altyapınızda çalıştırın"),
          },
        ],
      },
      {
        title: t("Build with it", "Geliştirme"),
        links: [
          {
            label: t("API reference", "API başvuru kaynağı"),
            href: "/docs/api-reference",
            icon: "brackets",
            hint: t("Server and client surfaces", "Sunucu ve istemci arayüzleri"),
          },
          {
            label: t("CLI", "Komut satırı arayüzü"),
            href: "/docs/cli",
            icon: "terminal",
            hint: t("Script the editor", "Düzenleyiciyi betiklerle yönetin"),
          },
          {
            label: t("Coding agents", "Kodlama ajanları"),
            href: "/docs/agents",
            icon: "cursor",
            hint: t("The AGENTS.md contract", "AGENTS.md sözleşmesi"),
          },
          {
            label: t("Security", "Güvenlik"),
            href: "/docs/security",
            icon: "shield",
            hint: t("Protect editor and API", "Düzenleyiciyi ve API’yi koruyun"),
          },
        ],
      },
    ],
    featured: {
      body: t("Answer-first walkthroughs for the things you will hit first.", "İlk karşılaşacağınız konular için doğrudan yanıt sunan adım adım rehberler."),
      label: t("Read the guides", "Rehberleri okuyun"),
      href: "/guides",
      icon: "book",
    },
  },
  {
    label: t("Resources", "Kaynaklar"),
    intro: t("Everything around the build — before it and after it.", "Geliştirme öncesinde ve sonrasında ihtiyacınız olan her şey."),
    columns: [
      {
        title: t("Learn", "Öğrenin"),
        links: [
          {
            label: t("Documentation", "Belgeler"),
            href: "/docs",
            icon: "book",
            hint: t("The full reference", "Kapsamlı başvuru kaynağı"),
          },
          {
            label: t("Guides", "Rehberler"),
            href: "/guides",
            icon: "play",
            hint: t("One question, one page", "Her soruya bir sayfa"),
          },
          {
            label: t("FAQ", "Sık sorulan sorular"),
            href: "/faq",
            icon: "search",
            hint: t("Short, direct answers", "Kısa ve doğrudan yanıtlar"),
          },
          {
            label: t("Troubleshooting", "Sorun giderme"),
            href: "/docs/troubleshooting",
            icon: "settings",
            hint: t("When something breaks", "Bir sorun çıktığında"),
          },
        ],
      },
      {
        title: t("Decide", "Karar verin"),
        links: [
          {
            label: t("All comparisons", "Tüm karşılaştırmalar"),
            href: "/compare",
            icon: "grid",
            hint: t("Which tool fits the job", "İşinize uygun araç hangisi?"),
          },
          {
            label: t("vs Webflow", "Webflow ile karşılaştırma"),
            href: "/compare/pagiera-vs-webflow",
            icon: "globe",
            hint: t("Hosted platform or package", "Barındırılan platform veya paket"),
          },
          {
            label: t("vs Framer", "Framer ile karşılaştırma"),
            href: "/compare/pagiera-vs-framer",
            icon: "bolt",
            hint: t("Standalone site or product", "Bağımsız site veya ürün"),
          },
          {
            label: t("Changelog", "Değişiklik günlüğü"),
            href: "/docs/changelog",
            icon: "undo",
            hint: t("What shipped, and when", "Neler, ne zaman yayımlandı?"),
          },
        ],
      },
    ],
    featured: {
      body: t("MIT-licensed and developed in the open. Read it, fork it, ship it.", "MIT lisanslı ve açık geliştiriliyor. Kodu okuyun, çatallayın ve yayımlayın."),
      label: t("View the source", "Kaynak kodunu inceleyin"),
      href: REPO_HREF,
      icon: "github",
    },
  },
];

/**
 * The site's only navigation. It holds the top edge, stays in the document
 * flow and lets each page start right under it — so no page has to reserve
 * vertical room for something floating on top of it, and the navigation reads
 * the same on the landing page as it does on a guide.
 */
export function SiteBar({ active }: { active?: NavSection }) {
  const { locale, t } = useI18n();
  const NAV_LINKS = getNavLinks(t);
  const MEGA_MENUS = getMegaMenus(t);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 12);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <header
      className={cn("site-navigation", scrolled && "is-scrolled")}
      onMouseLeave={() => setMega(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMega(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && mega !== null) {
          event.currentTarget
            .querySelector<HTMLButtonElement>(`[data-mega-trigger="${mega}"]`)
            ?.focus();
          setMega(null);
        }
        if (event.key === "Escape" && open) {
          setOpen(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>(".site-menu-toggle")
            ?.focus();
        }
      }}
    >
      <div className="site-navigation-inner">
        <a aria-label={t("Pagiera home", "Pagiera ana sayfa")} className="site-wordmark" href={localizedHref("/", locale)}>
          <Image
            alt=""
            className="rounded-[7px]"
            height={24}
            priority
            src="/logo.png"
            width={24}
          />
          <span>Pagiera</span>
        </a>

        <nav
          aria-label={t("Main navigation", "Ana gezinme")}
          className="site-navigation-links"
          onMouseLeave={() => setHovered(null)}
          onBlur={() => setHovered(null)}
        >
          {MEGA_MENUS.map((menu, index) => (
            <button
              key={MEGA_MENUS.indexOf(menu)}
              type="button"
              data-mega-trigger={index}
              className={cn(
                "site-navigation-link",
                mega === index && "is-current",
              )}
              aria-expanded={mega === index}
              aria-controls={`mega-menu-${index}`}
              onMouseEnter={(event) => {
                setHovered(index);
                if (event.buttons === 0) setMega(index);
              }}
              onFocus={() => setHovered(index)}
              onClick={() => setMega(mega === index ? null : index)}
            >
              {(hovered ?? mega) === index && (
                <motion.span
                  className="site-link-highlight"
                  layoutId="site-nav-highlight"
                  transition={{
                    duration: reducedMotion ? 0 : 0.24,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                />
              )}
              <span className="site-link-label">{menu.label}</span>
            </button>
          ))}
          {NAV_LINKS.filter((link) => link.href === "/docs").map(
            ({ href, label, ...link }) => {
              const selected =
                "match" in link && Boolean(active) && link.match === active;
              return (
                <a
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "site-navigation-link",
                    selected && "is-current",
                  )}
                  href={localizedHref(href, locale)}
                  key={href}
                  onMouseEnter={() => {
                    setMega(null);
                    setHovered(3);
                  }}
                  onFocus={() => setHovered(3)}
                >
                  {hovered === 3 && (
                    <motion.span
                      className="site-link-highlight"
                      layoutId="site-nav-highlight"
                      transition={{ duration: reducedMotion ? 0 : 0.24 }}
                    />
                  )}
                  <span className="site-link-label">{label}</span>
                </a>
              );
            },
          )}
        </nav>

        <a
          aria-label={t("Pagiera on GitHub", "GitHub’da Pagiera")}
          className="site-source-link"
          href={REPO_HREF}
          rel="noreferrer"
          target="_blank"
        >
          <Icon name="github" size={14} />
          <span>GitHub</span>
        </a>

        <a className="site-start-link" href={localizedHref("/docs/getting-started", locale)}>
          {t("Get started", "Başlayın")} <Icon name="arrow" size={14} />
        </a>

        <LanguageSwitcher />

        <button
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          aria-label={open ? t("Close menu", "Menüyü kapat") : t("Open menu", "Menüyü aç")}
          className="site-menu-toggle"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Icon name={open ? "close" : "menu"} size={17} />
        </button>
      </div>

      <AnimatePresence>
        {mega !== null && (
          <motion.div
            className="site-mega-menu"
            id={`mega-menu-${mega}`}
            key="mega-popup"
            /* The panel's height is deliberately not animated. Animating it
               forced the horizontal content slide to run against a box that was
               still resizing underneath it, and the slide is the part that
               carries the transition. */
            initial={{
              opacity: 0,
              y: reducedMotion ? 0 : -8,
              scale: reducedMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reducedMotion ? 0 : -5,
              scale: reducedMotion ? 1 : 0.99,
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.18,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="site-mega-inner"
                key={mega}
                initial={{ opacity: 0, x: reducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reducedMotion ? 0 : -20 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
              >
                <div className="site-mega-intro">
                  <p>{MEGA_MENUS[mega].intro}</p>
                  <a href={localizedHref("/docs/getting-started", locale)}>
                    {t("Start building", "Oluşturmaya başlayın")} <span aria-hidden="true">↗</span>
                  </a>
                </div>
                {MEGA_MENUS[mega].columns.map((column) => (
                  <section key={column.title}>
                    <h2>{column.title}</h2>
                    {column.links.map((link) => (
                      <a
                        className="site-mega-link"
                        href={localizedHref(link.href, locale)}
                        key={link.href}
                        onClick={() => setMega(null)}
                      >
                        <i className="site-mega-icon">
                          <Icon name={link.icon} size={17} />
                        </i>
                        <span>
                          <strong>{link.label}</strong>
                          <em>{link.hint}</em>
                        </span>
                      </a>
                    ))}
                  </section>
                ))}
                <section className="site-mega-feature">
                  <i className="site-mega-icon">
                    <Icon name={MEGA_MENUS[mega].featured.icon} size={20} />
                  </i>
                  <p>{MEGA_MENUS[mega].featured.body}</p>
                  <a href={localizedHref(MEGA_MENUS[mega].featured.href, locale)}>
                    {MEGA_MENUS[mega].featured.label}{" "}
                    <span aria-hidden="true">↗</span>
                  </a>
                </section>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="site-mobile-navigation"
            animate={{ height: "auto", opacity: 1 }}
            aria-label={t("Mobile navigation", "Mobil gezinme")}
            className="site-mobile-navigation"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="grid px-5 py-2">
              {MEGA_MENUS.map((menu) => (
                <details className="site-mobile-group" key={MEGA_MENUS.indexOf(menu)}>
                  <summary>{menu.label}</summary>
                  {menu.columns.map((column) => (
                    <section key={column.title}>
                      <h2>{column.title}</h2>
                      {column.links.map((link) => (
                        <a
                          className="site-mega-link"
                          href={localizedHref(link.href, locale)}
                          key={link.href}
                          onClick={() => setOpen(false)}
                        >
                          <i className="site-mega-icon">
                            <Icon name={link.icon} size={17} />
                          </i>
                          <span>
                            <strong>{link.label}</strong>
                            <em>{link.hint}</em>
                          </span>
                        </a>
                      ))}
                    </section>
                  ))}
                </details>
              ))}
              {NAV_LINKS.map(({ href, label, ...link }) => {
                const selected =
                  "match" in link && Boolean(active) && link.match === active;
                return (
                  <a
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center justify-between border-b border-white/[.05] text-sm font-medium last:border-b-0",
                      selected ? "text-[#b3b3b3]" : "text-white/70",
                    )}
                    href={localizedHref(href, locale)}
                    key={href}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                    <Icon name="chevron" size={15} />
                  </a>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
