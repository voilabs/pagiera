import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

/** `match` is the `active` value a page passes when this link is its own. */
const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Docs", href: "/docs", match: "docs" },
  { label: "Guides", href: "/guides", match: "guides" },
  { label: "Templates", href: "/templates", match: "templates" },
  { label: "Compare", href: "/compare", match: "compare" },
  { label: "FAQ", href: "/faq", match: "faq" },
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

const MEGA_MENUS: Array<{
  label: string;
  intro: string;
  columns: Array<{ title: string; links: MegaLink[] }>;
  featured: { body: string; label: string; href: string; icon: IconName };
}> = [
  {
    label: "Product",
    intro: "Design the page itself — not a description of it.",
    columns: [
      {
        title: "The editor",
        links: [
          {
            label: "Visual canvas",
            href: "/docs/studio",
            icon: "frame",
            hint: "Artboards, layers, inspector",
          },
          {
            label: "Components & layouts",
            href: "/docs/components-layouts",
            icon: "brackets",
            hint: "Build once, reuse everywhere",
          },
          {
            label: "Responsive design",
            href: "/docs/responsive-design",
            icon: "maximize",
            hint: "Overrides per breakpoint",
          },
          {
            label: "Motion & interactions",
            href: "/docs/interactions",
            icon: "bolt",
            hint: "Hover, entrance, scroll",
          },
        ],
      },
      {
        title: "The page",
        links: [
          {
            label: "Document model",
            href: "/docs/document-model",
            icon: "layers",
            hint: "How a page is stored",
          },
          {
            label: "Blocks",
            href: "/docs/blocks",
            icon: "panel",
            hint: "Carousels, marquees, forms",
          },
          {
            label: "Dynamic data",
            href: "/docs/data-binding",
            icon: "database",
            hint: "Bind your own APIs",
          },
          {
            label: "AI & MCP",
            href: "/docs/ai-mcp",
            icon: "sparkles",
            hint: "Let an agent edit it",
          },
        ],
      },
    ],
    featured: {
      body: "Complete responsive systems you can open and edit on day one.",
      label: "Browse templates",
      href: "/templates",
      icon: "grid",
    },
  },
  {
    label: "Developers",
    intro: "Bring visual editing into the stack you already own.",
    columns: [
      {
        title: "Set it up",
        links: [
          {
            label: "Getting started",
            href: "/docs/getting-started",
            icon: "play",
            hint: "Install and configure",
          },
          {
            label: "Next.js setup",
            href: "/docs/nextjs-setup",
            icon: "code",
            hint: "Routes and the studio",
          },
          {
            label: "Architecture",
            href: "/docs/architecture",
            icon: "layers",
            hint: "How the pieces fit",
          },
          {
            label: "Deployment",
            href: "/docs/deployment",
            icon: "rocket",
            hint: "Run it on your own infra",
          },
        ],
      },
      {
        title: "Build with it",
        links: [
          {
            label: "API reference",
            href: "/docs/api-reference",
            icon: "brackets",
            hint: "Server and client surfaces",
          },
          {
            label: "CLI",
            href: "/docs/cli",
            icon: "terminal",
            hint: "Script the editor",
          },
          {
            label: "Coding agents",
            href: "/docs/agents",
            icon: "cursor",
            hint: "The AGENTS.md contract",
          },
          {
            label: "Security",
            href: "/docs/security",
            icon: "shield",
            hint: "Protect editor and API",
          },
        ],
      },
    ],
    featured: {
      body: "Answer-first walkthroughs for the things you will hit first.",
      label: "Read the guides",
      href: "/guides",
      icon: "book",
    },
  },
  {
    label: "Resources",
    intro: "Everything around the build — before it and after it.",
    columns: [
      {
        title: "Learn",
        links: [
          {
            label: "Documentation",
            href: "/docs",
            icon: "book",
            hint: "The full reference",
          },
          {
            label: "Guides",
            href: "/guides",
            icon: "play",
            hint: "One question, one page",
          },
          {
            label: "FAQ",
            href: "/faq",
            icon: "search",
            hint: "Short, direct answers",
          },
          {
            label: "Troubleshooting",
            href: "/docs/troubleshooting",
            icon: "settings",
            hint: "When something breaks",
          },
        ],
      },
      {
        title: "Decide",
        links: [
          {
            label: "All comparisons",
            href: "/compare",
            icon: "grid",
            hint: "Which tool fits the job",
          },
          {
            label: "vs Webflow",
            href: "/compare/pagiera-vs-webflow",
            icon: "globe",
            hint: "Hosted platform or package",
          },
          {
            label: "vs Framer",
            href: "/compare/pagiera-vs-framer",
            icon: "bolt",
            hint: "Standalone site or product",
          },
          {
            label: "Changelog",
            href: "/docs/changelog",
            icon: "undo",
            hint: "What shipped, and when",
          },
        ],
      },
    ],
    featured: {
      body: "MIT-licensed and developed in the open. Read it, fork it, ship it.",
      label: "View the source",
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
        <a aria-label="Pagiera home" className="site-wordmark" href="/">
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
          aria-label="Main navigation"
          className="site-navigation-links"
          onMouseLeave={() => setHovered(null)}
          onBlur={() => setHovered(null)}
        >
          {MEGA_MENUS.map((menu, index) => (
            <button
              key={menu.label}
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
          {NAV_LINKS.filter((link) => link.label === "Docs").map(
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
                  href={href}
                  key={label}
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
          aria-label="Pagiera on GitHub"
          className="site-source-link"
          href={REPO_HREF}
          rel="noreferrer"
          target="_blank"
        >
          <Icon name="github" size={14} />
          <span>GitHub</span>
        </a>

        <a className="site-start-link" href="/docs/getting-started">
          Get started <Icon name="arrow" size={14} />
        </a>

        <button
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
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
                  <a href="/docs/getting-started">
                    Start building <span aria-hidden="true">↗</span>
                  </a>
                </div>
                {MEGA_MENUS[mega].columns.map((column) => (
                  <section key={column.title}>
                    <h2>{column.title}</h2>
                    {column.links.map((link) => (
                      <a
                        className="site-mega-link"
                        href={link.href}
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
                  <a href={MEGA_MENUS[mega].featured.href}>
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
            aria-label="Mobile navigation"
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
                <details className="site-mobile-group" key={menu.label}>
                  <summary>{menu.label}</summary>
                  {menu.columns.map((column) => (
                    <section key={column.title}>
                      <h2>{column.title}</h2>
                      {column.links.map((link) => (
                        <a
                          className="site-mega-link"
                          href={link.href}
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
                    href={href}
                    key={label}
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
