import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { DOC_GROUPS, DOCS } from "@/lib/docs-catalog";
import { Icon } from "@/components/icons";

export function DocsCommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DOCS.filter((doc) => !needle || `${doc.title} ${doc.description} ${doc.group}`.toLowerCase().includes(needle));
  }, [query]);

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
    if (event.key === "Enter" && results[active]) window.location.href = `/docs/${results[active].slug}`;
  }

  const palette = <AnimatePresence>
    {open ? <motion.div className="command-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setOpen(false)}>
      <motion.div aria-label="Search documentation" aria-modal="true" className="command-menu" role="dialog" initial={{ opacity: 0, scale: .97, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: -8 }} transition={{ duration: .18 }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-input"><Icon name="search" size={18} /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={keyDown} placeholder="Search guides, APIs and concepts…" /><kbd>ESC</kbd></div>
        <div className="command-results">
          {results.length ? DOC_GROUPS.map((group) => {
            const grouped = results.filter((doc) => doc.group === group);
            return grouped.length ? <section key={group}><h2>{group}</h2>{grouped.map((doc) => {
              const index = results.indexOf(doc);
              return <a className={index === active ? "active" : undefined} href={`/docs/${doc.slug}`} key={doc.slug} onMouseEnter={() => setActive(index)}><span><strong>{doc.title}</strong><small>{doc.description}</small></span><Icon name="arrow" size={15} /></a>;
            })}</section> : null;
          }) : <p className="command-empty">No documentation found for “{query}”.</p>}
        </div>
        <footer><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
      </motion.div>
    </motion.div> : null}
  </AnimatePresence>;

  return <>
    <button className="docs-search-trigger" onClick={() => setOpen(true)} type="button"><Icon name="search" size={15} /><span>Search documentation…</span><kbd>⌘K</kbd></button>
    {mounted ? createPortal(palette, document.body) : null}
  </>;
}
