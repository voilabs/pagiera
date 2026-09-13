import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

const LOCALES = [
  { code: "en", label: "English", short: "EN" },
  { code: "tr", label: "Türkçe", short: "TR" },
] as const;

/**
 * The panel stays in the DOM and is hidden with `visibility` rather than being
 * unmounted: the alternate-locale link is then still in the served HTML for
 * crawlers, while `visibility: hidden` keeps it out of the tab order and the
 * accessibility tree until the menu opens.
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const active = router.locale === "tr" ? "tr" : "en";
  const current = LOCALES.find((item) => item.code === active) ?? LOCALES[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`language-menu${open ? " is-open" : ""}`}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={active === "tr" ? "Dili değiştir" : "Change language"}
        className="language-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon name="globe" size={14} />
        <span>{current.short}</span>
        <Icon className="language-caret" name="chevron" size={11} />
      </button>

      <div className="language-list" role="menu">
        {LOCALES.map((item) => (
          <Link
            aria-current={item.code === active ? "true" : undefined}
            className={item.code === active ? "is-active" : undefined}
            href={router.asPath}
            hrefLang={item.code}
            key={item.code}
            lang={item.code}
            locale={item.code}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${item.code}; Path=/; Max-Age=31536000; SameSite=Lax`;
              setOpen(false);
            }}
            role="menuitem"
          >
            <span>{item.label}</span>
            {item.code === active ? <Icon name="check" size={13} /> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
