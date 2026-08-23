import { motion, useReducedMotion } from "framer-motion";
import { Manrope } from "next/font/google";
import { Icon } from "@/components/icons";
import { Seo } from "@/components/seo";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const QUICK_LINKS = [
  ["Features", "/#features"],
  ["Studio", "/#studio"],
  ["How it works", "/#workflow"],
  ["Templates", "/templates"],
] as const;

/**
 * The 404 leans on the same idea as the rest of the site: the page is a
 * canvas. The missing route is drawn as a selected element—accent outline,
 * corner handles, measurement badge—so the error reads as part of the product
 * rather than a stock Next.js page.
 */
export default function NotFound() {
  const reduced = Boolean(useReducedMotion());

  return (
    <div
      className={`${manrope.variable} min-w-80 overflow-clip bg-[#f8f7fb] font-sans text-[#121018]`}
    >
      <Seo
        description="The page you were looking for is not on this canvas. Head back to the Pagiera home page or browse the template library."
        noindex
        path="/404"
        title="404 — this page isn't on the canvas | Pagiera"
      />
      <SiteHeader />

      <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#f5f3ff] px-6 pt-[150px] pb-14 max-md:px-4 max-md:pt-32">
        <Ambience />

        <div className="relative z-[2] mx-auto w-full max-w-[900px] text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#5402e6]/10 bg-white/60 px-3 py-2 text-[11px] font-bold tracking-[0.09em] text-[#554c66] uppercase backdrop-blur-xl">
            <span className="size-2 rounded-full bg-[#5402e6] ring-[5px] ring-[#5402e6]/10" />
            Error 404
          </span>

          <div className="mt-14 mb-16 flex justify-center max-md:mt-10 max-md:mb-12">
            <SelectedNumerals reduced={reduced} />
          </div>

          <h1 className="text-[clamp(38px,5.4vw,68px)] leading-[.94] font-medium tracking-[-.07em]">
            This page isn’t on the canvas.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[clamp(14px,1.3vw,17px)] leading-8 tracking-[-.02em] text-[#665f70]">
            The layer you were looking for was moved, renamed, or never
            published. Everything else is still where you left it.
          </p>

          <div className="mt-8 flex justify-center gap-2.5 max-sm:mx-auto max-sm:w-full max-sm:max-w-[330px] max-sm:flex-col">
            <ButtonLink href="/" size="lg" variant="purple">
              Back to home <Icon name="arrow" size={17} />
            </ButtonLink>
            <ButtonLink href="/templates" size="lg" variant="secondary">
              Explore templates
            </ButtonLink>
          </div>

          <nav
            aria-label="Helpful links"
            className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
          >
            {QUICK_LINKS.map(([label, href]) => (
              <a
                className="rounded-full border border-black/[.07] bg-white/60 px-4 py-2.5 text-[13px] font-medium text-[#544d61] backdrop-blur-xl transition-colors hover:border-[#5402e6]/25 hover:bg-white hover:text-[#5402e6]"
                href={href}
                key={label}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* The editor's status bar, as a closing wink. */}
        <div className="relative z-[2] mx-auto mt-16 flex w-full max-w-[900px] items-center gap-1 border-t border-black/[.07] pt-4 text-[11px] text-[#6d6678] max-md:mt-12">
          <span className="text-[#8d8ba3]">Page</span>
          <Icon className="text-[#8d8ba3]" name="chevron" size={11} />
          <span>404</span>
          <span className="ml-auto font-mono text-[10px] text-[#8d8ba3]">
            Not found
          </span>
        </div>
      </main>
    </div>
  );
}

function Ambience() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.045)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,#000_25%,transparent_72%)]" />
      <div className="absolute top-[6%] left-1/2 size-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.95),rgba(236,230,255,.4)_45%,transparent_72%)] blur-2xl max-md:size-[520px]" />
      <div className="absolute -right-40 bottom-[-18%] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(84,2,230,.16),transparent_68%)] blur-3xl" />
    </div>
  );
}

function SelectedNumerals({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      animate={{ opacity: 1, scale: 1 }}
      className="relative inline-block leading-[.8]"
      initial={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="block text-[clamp(120px,20vw,260px)] font-medium tracking-[-.085em] text-[#141117]">
        4<span className="text-[#5402e6]">0</span>4
      </span>

      <span className="pointer-events-none absolute inset-[-14px] outline outline-[1.5px] outline-[#5402e6]">
        {[
          "-top-[5px] -left-[5px]",
          "-top-[5px] -right-[5px]",
          "-bottom-[5px] -left-[5px]",
          "-right-[5px] -bottom-[5px]",
        ].map((position) => (
          <motion.i
            animate={
              reduced
                ? undefined
                : { scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }
            }
            className={`absolute size-[11px] rounded-full border-[1.5px] border-[#5402e6] bg-white ${position}`}
            key={position}
            transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
          />
        ))}

        <span className="absolute -top-7 left-0 flex items-center gap-1.5 rounded-md bg-[#5402e6] px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white">
          <Icon name="frame" size={11} />
          Missing page
        </span>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full rounded bg-[#5402e6] px-1.5 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap text-white">
          404 × 404
        </span>
      </span>

      <motion.span
        animate={reduced ? undefined : { x: [0, 10, 0], y: [0, 7, 0] }}
        className="absolute -right-6 bottom-2 text-[#5402e6] max-md:-right-2"
        transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
      >
        <Icon name="cursor" size={20} />
      </motion.span>
    </motion.span>
  );
}
