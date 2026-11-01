"use client";
import {
  IconArrowRight,
  IconBolt,
  IconBook2,
  IconBrandGithub,
  IconChevronDown,
  IconComponents,
  IconDatabase,
  IconDevices,
  IconHistory,
  IconKeyframes,
  IconLayoutDashboard,
  IconMenu2,
  IconPlug,
  IconSchool,
  IconShieldLock,
  IconSparkles,
  IconTemplate,
  IconTerminal2,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SketchBook, SketchMotion } from "@/components/landing/visuals";
import type { Locale, MenuIcon, NavCopy } from "@/lib/landing-copy";
import { localizedHref } from "@/lib/urls";

const ICONS: Record<MenuIcon, typeof IconBolt> = {
  studio: IconLayoutDashboard,
  data: IconDatabase,
  actions: IconBolt,
  motion: IconKeyframes,
  cli: IconTerminal2,
  ai: IconSparkles,
  responsive: IconDevices,
  components: IconComponents,
  docs: IconBook2,
  guides: IconSchool,
  templates: IconTemplate,
  changelog: IconHistory,
  security: IconShieldLock,
  github: IconBrandGithub,
  integrations: IconPlug,
};

const GITHUB = "https://github.com/voilabs/pagiera";
const LANGUAGES = { en: "English", tr: "Türkçe" } as const;

export function SiteNav({
  menu,
  locale,
  cta,
}: {
  menu: NavCopy;
  locale: Locale;
  cta: string;
}) {
  const base = useId();
  const pathname = usePathname();
  const tr = locale === "tr";
  const href = (path: string) => localizedHref(path, locale);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Escape and outside clicks close whichever menu is open.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (open) {
        document.getElementById(`${base}-${open}-trigger`)?.focus();
        setOpen(null);
      }
      setMobile(false);
    }
    function onPointer(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, base]);

  // The mobile sheet covers the page, so the page behind it stops scrolling.
  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobile]);

  function hover(id: string | null) {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(id), id ? 60 : 160);
  }

  return (
    <header
      className="lp-nav"
      ref={navRef}
      onPointerLeave={(event) => event.pointerType === "mouse" && hover(null)}
    >
      <nav className="lp-nav-links" aria-label={menu.label}>
        {menu.menus.map((m) => (
          <button
            key={m.id}
            type="button"
            id={`${base}-${m.id}-trigger`}
            className="lp-menu-trigger"
            aria-expanded={open === m.id}
            aria-controls={`${base}-${m.id}-panel`}
            onClick={() => setOpen(open === m.id ? null : m.id)}
            onPointerEnter={(event) =>
              event.pointerType === "mouse" && hover(m.id)
            }
          >
            {m.label}
            <IconChevronDown size={14} stroke={2} aria-hidden="true" />
          </button>
        ))}
      </nav>

      <a className="lp-brand" href={href("/")}>
        {/* biome-ignore lint/performance/noImgElement: small static logo */}
        <img src="/logo.png" alt="" width={22} height={22} className="logo" />
        Pagiera
      </a>

      <div className="lp-nav-end">
        <div className="lp-lang">
          <button
            type="button"
            id={`${base}-lang-trigger`}
            aria-expanded={open === "lang"}
            aria-controls={`${base}-lang-panel`}
            aria-label={`${menu.language}: ${LANGUAGES[locale]}`}
            onClick={() => setOpen(open === "lang" ? null : "lang")}
            onPointerEnter={() => hover(null)}
          >
            <IconWorld size={14} stroke={1.6} aria-hidden="true" />
            {locale.toUpperCase()}
            <IconChevronDown size={12} stroke={2} aria-hidden="true" />
          </button>
          <ul
            id={`${base}-lang-panel`}
            className="lang-panel"
            hidden={open !== "lang"}
          >
            <li className="lang-head" aria-hidden="true">
              {menu.language}
            </li>
            {(["en", "tr"] as const).map((code, index) => (
              <li key={code}>
                <a
                  href={localizedHref(pathname ?? "/", code)}
                  hrefLang={code}
                  lang={code}
                  aria-current={code === locale ? "true" : undefined}
                >
                  <span className="mega-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {LANGUAGES[code]}
                  <span className="lang-code">{code.toUpperCase()}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a className="lp-icon-link" href={GITHUB} aria-label={menu.github}>
          <IconBrandGithub size={18} stroke={1.7} aria-hidden="true" />
        </a>
        <a className="btn btn-dark lp-cta" href={href("/docs/getting-started")}>
          {cta}
        </a>
        <button
          type="button"
          className="lp-burger"
          aria-expanded={mobile}
          aria-controls={`${base}-mobile`}
          aria-label={mobile ? menu.closeMenu : menu.openMenu}
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? (
            <IconX size={20} aria-hidden="true" />
          ) : (
            <IconMenu2 size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      {menu.menus.map((m) => (
        <div
          key={m.id}
          id={`${base}-${m.id}-panel`}
          className="mega"
          hidden={open !== m.id}
          onPointerEnter={(event) =>
            event.pointerType === "mouse" && hover(m.id)
          }
        >
          <div className="mega-index">
            <p className="mega-eyebrow">
              {m.label}
              <span>
                {String(m.items.length).padStart(2, "0")}{" "}
                {tr ? "başlık" : "entries"}
              </span>
            </p>
            <ol className="mega-list">
              {m.items.map((item, index) => {
                const Icon = ICONS[item.icon];
                return (
                  <li key={item.label}>
                    <a href={href(item.href)} onClick={() => setOpen(null)}>
                      <span className="mega-num">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="mega-body">
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </span>
                      <Icon
                        className="mega-glyph"
                        size={20}
                        stroke={1.1}
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
          <a className="mega-feature" href={href(m.featured.href)}>
            {m.id === "features" ? <SketchMotion /> : <SketchBook />}
            <span className="mega-eyebrow">{m.featured.eyebrow}</span>
            <strong>{m.featured.title}</strong>
            <span className="mega-feature-text">{m.featured.text}</span>
            <span className="mega-cta">
              {m.featured.cta}
              <IconArrowRight size={14} aria-hidden="true" />
            </span>
          </a>
        </div>
      ))}

      <div
        id={`${base}-mobile`}
        className="mobile-sheet"
        hidden={!mobile}
        role="dialog"
        aria-modal="true"
        aria-label={menu.label}
      >
        {menu.menus.map((m) => (
          <section key={m.id}>
            <h2>{m.label}</h2>
            <ul>
              {m.items.map((item, index) => (
                <li key={item.label}>
                  <a href={href(item.href)} onClick={() => setMobile(false)}>
                    <span className="mega-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className="mobile-actions">
          <a className="btn btn-dark" href={href("/docs/getting-started")}>
            {cta}
          </a>
        </div>
      </div>
    </header>
  );
}
