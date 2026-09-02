import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const links = [
  ["Features", "/#features"],
  ["Studio", "/#studio"],
  ["How it works", "/#workflow"],
  ["Templates", "/templates"],
] as const;

const REPO = "https://github.com/voilabs/pagiera";

/** A calm hero navigation that becomes a compact glass capsule on scroll. */
export function SiteHeader({ active }: { active?: "templates" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 80);
  });

  const dark = scrolled || open;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] px-5 max-md:px-3">
      <div
        className={cn(
          "pointer-events-auto relative mx-auto flex w-full items-center gap-2 border px-3.5 transition-[max-width,height,margin,border-radius,color,background-color,border-color,box-shadow,backdrop-filter] duration-500 max-md:px-3",
          dark
            ? "mt-6 h-16 max-w-[980px] rounded-full border-white/[.12] bg-[#160f26]/88 text-white shadow-[0_18px_55px_rgba(20,8,42,.28)] backdrop-blur-2xl max-md:mt-3 max-md:h-14"
            : "mt-2 h-20 max-w-[1320px] rounded-none border-transparent bg-transparent text-[#21182b] shadow-none backdrop-blur-none max-md:mt-1 max-md:h-16",
        )}
      >
        <a
          aria-label="Pagiera home"
          className="flex shrink-0 items-center gap-2"
          href="/"
        >
          <Image
            alt=""
            className="rounded-[8px]"
            height={28}
            priority
            src="/logo.png"
            width={28}
          />
          <span className="text-[15px] font-semibold tracking-[-.03em]">
            Pagiera
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5 max-md:hidden"
        >
          {links.map(([label, href]) => {
            const selected = active === "templates" && label === "Templates";
            return (
              <a
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "rounded-full px-2.5 py-2 text-xs font-medium transition-colors",
                  selected
                    ? "bg-[#6a25f0] text-white"
                    : dark
                      ? "text-white/62 hover:bg-white/[.07] hover:text-white"
                      : "text-[#21182b]/58 hover:bg-black/[.045] hover:text-[#21182b]",
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
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors",
              dark
                ? "border-white/10 bg-white/[.045] text-white/68 hover:border-white/20 hover:bg-white/[.08] hover:text-white"
                : "border-transparent bg-transparent text-[#21182b]/64 hover:border-black/[.08] hover:bg-black/[.035] hover:text-[#21182b]",
            )}
            href={REPO}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="github" size={15} />
            Source code
          </a>
        </div>

        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "ml-auto hidden size-10 cursor-pointer place-items-center rounded-full transition-colors max-md:grid",
            dark
              ? "bg-white/[.07] text-white"
              : "bg-black/[.045] text-[#21182b]",
          )}
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
            className="pointer-events-auto mx-auto mt-2 hidden origin-top flex-col gap-1 rounded-[26px] border border-white/10 bg-[#160f26]/95 p-2 text-white shadow-[0_18px_50px_rgba(20,8,42,.28)] backdrop-blur-xl max-md:flex"
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map(([label, href]) => (
              <a
                className="flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[.07] hover:text-[#a982ff]"
                href={href}
                key={label}
                onClick={() => setOpen(false)}
              >
                {label}
                <Icon name="chevron" size={16} />
              </a>
            ))}
            <div className="mt-1 border-t border-white/10 pt-2">
              <a
                aria-label="Pagiera on GitHub"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] text-sm font-medium text-white/70"
                href={REPO}
                rel="noreferrer"
                target="_blank"
              >
                <Icon name="github" size={18} />
                Source code
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
