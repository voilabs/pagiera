import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { TemplateFrame } from "@/components/template-frame";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Kept in step with templates/registry.json — names, pages and accents. */
const TEMPLATES = [
  {
    accent: "#db4b2d",
    category: "Editorial",
    copy: "A dynamic journal with API-powered article routes, an author index and a tag archive.",
    id: "editorial-blog",
    name: "Field Notes",
    pages: 4,
  },
  {
    accent: "#d7ff3f",
    category: "Portfolio",
    copy: "An art-directed studio site built on kinetic type, a case grid and scroll-led motion.",
    id: "nocturne",
    name: "Nocturne Studio",
    pages: 4,
  },
  {
    accent: "#7357ff",
    category: "SaaS",
    copy: "A high-contrast product launch system with pricing tiers and a feature matrix.",
    id: "orbit-saas",
    name: "Orbit OS",
    pages: 3,
  },
  {
    accent: "#8b5cf6",
    category: "Social",
    copy: "A one-page social shell with native search, a composer form and a responsive feed.",
    id: "pulse-social",
    name: "Pulse Social",
    pages: 1,
  },
] as const;

export function TemplatesSection() {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(TEMPLATES[0].id);
  const active = TEMPLATES.find((item) => item.id === activeId) ?? TEMPLATES[0];

  return (
    <section
      className="bg-[#f8f7fb] px-[max(24px,calc((100vw-1200px)/2))] py-36 max-md:py-24"
      id="templates"
    >
      <SectionHeading
        copy={
          <>
            Complete responsive systems—pages, components, data and motion—ready
            to become something entirely new.
            <ButtonLink className="mt-5" href="/templates" variant="ghost">
              Browse the library <Icon name="arrow" size={15} />
            </ButtonLink>
          </>
        }
        eyebrow="Start closer to the finish"
        title={
          <>
            Not templates.
            <br />
            Creative launchpads.
          </>
        }
      />

      <div className="mt-16 grid grid-cols-[1.55fr_1fr] gap-4 max-lg:grid-cols-1 max-md:mt-12">
        {/* The stage renders one template at a time: a real page, not a
            screenshot, and only one iframe on the landing page. */}
        <motion.div
          className="relative rounded-[28px] border border-black/[.08] bg-white p-2 max-md:rounded-[24px]"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ amount: 0.15, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="relative h-[620px] overflow-hidden rounded-[22px] bg-[#17141b] max-lg:h-[520px] max-md:h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={active.id}
                transition={{ duration: 0.35 }}
              >
                {/* Lazy on purpose: the stage sits far below the fold, and an
                    eager iframe pulls a whole second document into the initial
                    load. */}
                <TemplateFrame
                  className="h-full"
                  id={active.id}
                  name={active.name}
                  scale="feature"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: active.accent }}
              />
              <span className="min-w-0">
                <strong className="block truncate text-[13px] font-semibold text-white">
                  {active.name}
                </strong>
                <span className="text-[10px] text-white/55">
                  {active.category} · {active.pages}{" "}
                  {active.pages === 1 ? "page" : "pages"} · Live render
                </span>
              </span>
              <a
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11px] font-semibold text-[#17141b] transition-colors hover:bg-[#5402e6] hover:text-white"
                href={`/templates/${active.id}/preview`}
                rel="noreferrer"
                target="_blank"
              >
                Open preview <Icon name="arrow" size={14} />
              </a>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-2">
          {TEMPLATES.map((template, index) => {
            const selected = template.id === active.id;
            return (
              <motion.button
                aria-pressed={selected}
                className={cn(
                  "group relative flex-1 cursor-pointer overflow-hidden rounded-[22px] border p-5 text-left transition-colors duration-300",
                  selected
                    ? "border-black/10 bg-white shadow-[0_16px_44px_rgba(43,24,86,.08)]"
                    : "border-transparent bg-white/55 hover:bg-white",
                )}
                initial={{ opacity: 0, y: 24 }}
                key={template.id}
                onClick={() => setActiveId(template.id)}
                transition={{
                  delay: index * 0.06,
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                }}
                type="button"
                viewport={{ amount: 0.3, once: true }}
                whileHover={reduced || selected ? undefined : { x: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <i
                  className={cn(
                    "absolute top-5 bottom-5 left-0 w-[3px] rounded-full transition-opacity duration-300",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                  style={{ background: template.accent }}
                />
                <span className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#a09aa8]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong className="text-[17px] font-semibold tracking-[-.035em]">
                    {template.name}
                  </strong>
                  <span
                    className={cn(
                      "ml-auto grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                      selected
                        ? "border-[#5402e6] bg-[#5402e6] text-white"
                        : "border-black/10 text-[#544d61]",
                    )}
                  >
                    <Icon name="arrow" size={15} />
                  </span>
                </span>
                <p className="mt-2 text-[13px] leading-6 text-[#746d7c] max-lg:max-w-[560px]">
                  {template.copy}
                </p>
                <span className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-bold tracking-[.08em] text-[#8f8796] uppercase">
                  <i className="rounded-full border border-black/10 px-2.5 py-1.5 not-italic">
                    {template.category}
                  </i>
                  <i className="rounded-full border border-black/10 px-2.5 py-1.5 not-italic">
                    {template.pages} {template.pages === 1 ? "page" : "pages"}
                  </i>
                  <i className="rounded-full border border-black/10 px-2.5 py-1.5 not-italic">
                    Responsive
                  </i>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
