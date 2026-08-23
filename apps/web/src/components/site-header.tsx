import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const links = [
  ["Features", "/#features"],
  ["Studio", "/#studio"],
  ["How it works", "/#workflow"],
  ["Templates", "/templates"],
] as const;

const REPO = "https://github.com/voilabs/pagiera";

/**
 * A floating capsule rather than a full-width bar: at the top of the page it
 * is invisible chrome over the hero, and it only materialises—background,
 * hairline and shadow—once the page scrolls under it.
 */
export function SiteHeader({ active }: { active?: "templates" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 24);
  });

  const solid = scrolled || open;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] px-4 pt-4 max-md:px-3 max-md:pt-3">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-14 max-w-[1180px] items-center gap-2 rounded-full border px-3 transition-[background-color,border-color,box-shadow] duration-300",
          solid
            ? "border-black/[.07] bg-white/85 shadow-[0_14px_44px_rgba(43,24,86,.10)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <a
          aria-label="Pagiera home"
          className="flex shrink-0 items-center gap-2.5"
          href="/"
        >
          <Image
            alt=""
            className="rounded-[9px]"
            height={32}
            priority
            src="/logo.png"
            width={32}
          />
          <span className="text-[16px] font-bold tracking-[-.035em]">
            Pagiera
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="ml-5 flex items-center gap-0.5 max-md:hidden"
        >
          {links.map(([label, href]) => {
            const selected = active === "templates" && label === "Templates";
            return (
              <a
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
                  selected
                    ? "bg-[#5402e6]/[.08] text-[#5402e6]"
                    : "text-[#544d61] hover:bg-black/[.04] hover:text-[#121018]",
                )}
                href={href}
                key={label}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 max-md:hidden">
          <a
            aria-label="Pagiera on GitHub"
            className="grid size-9 place-items-center rounded-full text-[#544d61] transition-colors hover:bg-black/[.05] hover:text-[#121018]"
            href={REPO}
            rel="noreferrer"
            target="_blank"
            title="GitHub"
          >
            <Icon name="github" size={18} />
          </a>
          <ButtonLink href={REPO} size="sm" variant="purple">
            Start building <Icon name="arrow" size={15} />
          </ButtonLink>
        </div>

        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto hidden size-10 cursor-pointer place-items-center rounded-full bg-[#17141b] text-white max-md:grid"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Icon name={open ? "close" : "menu"} size={18} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="Mobile navigation"
            className="pointer-events-auto mx-auto mt-2 hidden origin-top flex-col gap-1 rounded-[26px] border border-black/[.07] bg-white/95 p-2 shadow-[0_18px_50px_rgba(43,24,86,.14)] backdrop-blur-xl max-md:flex"
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map(([label, href]) => (
              <a
                className="flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-semibold text-[#4f4858] transition-colors hover:bg-[#eee9fa] hover:text-[#5402e6]"
                href={href}
                key={label}
                onClick={() => setOpen(false)}
              >
                {label}
                <Icon name="chevron" size={16} />
              </a>
            ))}
            <div className="mt-1 grid grid-cols-[auto_1fr] gap-2 border-t border-black/[.07] pt-2">
              <a
                aria-label="Pagiera on GitHub"
                className="grid size-12 place-items-center rounded-2xl border border-black/10 text-[#4f4858]"
                href={REPO}
                rel="noreferrer"
                target="_blank"
              >
                <Icon name="github" size={18} />
              </a>
              <ButtonLink
                className="w-full"
                href={REPO}
                size="md"
                variant="purple"
              >
                Start building <Icon name="arrow" size={15} />
              </ButtonLink>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
