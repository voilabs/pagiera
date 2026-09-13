import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { DOC_GROUPS, DOCS } from "@/lib/docs-catalog";
import { localizedDocs } from "@/lib/docs-localized";
import { docGroupLabel, localizedHref, useI18n } from "@/lib/i18n";
import { Icon } from "@/components/icons";

export function DocsCommandMenu() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return localizedDocs(locale).filter((doc) => !needle || `${doc.title} ${doc.description} ${docGroupLabel(doc.group, locale)}`.toLocaleLowerCase(locale).includes(needle));
  }, [query, locale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => { document.body.style.overflow = previous; };
    }
    setQuery("");
    setActive(0);
  }, [open]);

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter" && results[active]) window.location.href = localizedHref(`/docs/${results[active].slug}`, locale);
  }

  const palette = <AnimatePresence>
    {open ? <motion.div className="command-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setOpen(false)}>
      <motion.div aria-label={t("Search documentation", "Dokümantasyonda ara")} aria-modal="true" className="command-menu" role="dialog" initial={{ opacity: 0, scale: .97, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: -8 }} transition={{ duration: .18 }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-input"><Icon name="search" size={18} /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={keyDown} placeholder={t("Search guides, APIs and concepts…", "Rehber, API ve kavram ara…")} /><kbd>ESC</kbd></div>
        <div className="command-results">
          {results.length ? DOC_GROUPS.map((group) => {
            const grouped = results.filter((doc) => doc.group === group);
            return grouped.length ? <section key={group}><h2>{docGroupLabel(group, locale)}</h2>{grouped.map((doc) => {
              const index = results.indexOf(doc);
              return <a className={index === active ? "active" : undefined} href={localizedHref(`/docs/${doc.slug}`, locale)} key={doc.slug} onMouseEnter={() => setActive(index)}><span><strong>{doc.title}</strong><small>{doc.description}</small></span><Icon name="arrow" size={15} /></a>;
            })}</section> : null;
          }) : <p className="command-empty">{t(`No documentation found for “${query}”.`, `“${query}” için doküman bulunamadı.`)}</p>}
        </div>
        <footer><span>↑↓ {t("Navigate", "Gezin")}</span><span>↵ {t("Open", "Aç")}</span><span>Esc {t("Close", "Kapat")}</span></footer>
      </motion.div>
    </motion.div> : null}
  </AnimatePresence>;

  return <>
    <button className="docs-search-trigger" aria-label={t("Search documentation", "Dokümantasyonda ara")} onClick={() => setOpen(true)} type="button"><Icon name="search" size={15} /><span>{t("Search documentation…", "Dokümantasyonda ara…")}</span><kbd>⌘K</kbd></button>
    {mounted ? createPortal(palette, document.body) : null}
  </>;
}
