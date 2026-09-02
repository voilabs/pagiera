import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { TemplateFrame } from "@/components/template-frame";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const templates = [
  {
    accent: "#6a25f0",
    category: "Portfolio",
    id: "nocturne",
    name: "Nocturne Studio",
    pages: 4,
  },
  {
    accent: "#8f5cff",
    category: "SaaS",
    id: "relay",
    name: "Relay",
    pages: 1,
  },
  {
    accent: "#171020",
    category: "Social",
    id: "x-clone",
    name: "X Clone",
    pages: 1,
  },
] as const;

export function TemplatesSection() {
  const [activeId, setActiveId] = useState<string>(templates[0].id);
  const active = templates.find((item) => item.id === activeId) ?? templates[0];

  return (
    <section
      className="bg-[#0d0915] px-[max(24px,calc((100vw-1240px)/2))] py-36 text-white max-md:py-24"
      id="templates"
    >
      <div className="grid grid-cols-[.8fr_1.4fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
          Start with momentum
        </span>
        <div>
          <h2 className="text-[clamp(50px,7vw,100px)] leading-[.88] font-medium tracking-[-.08em]">
            A starting point,
            <br />
            never a ceiling.
          </h2>
          <div className="mt-8 flex items-end justify-between gap-8 max-md:items-start max-md:flex-col">
            <p className="max-w-[590px] text-base leading-8 text-white/52">
              Each template is a complete responsive system with pages,
              components and motion—ready to be pulled apart and made yours.
            </p>
            <ButtonLink href="/templates" variant="accent">
              Browse all templates <Icon name="arrow" size={15} />
            </ButtonLink>
          </div>
        </div>
      </div>

      <motion.div
        className="mt-20 overflow-hidden rounded-[38px] border border-white/10 bg-[#171020] p-3 shadow-[0_45px_100px_rgba(0,0,0,.24)] max-md:mt-14 max-md:rounded-[28px] max-md:p-2"
        initial={{ opacity: 0, y: 36 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ amount: 0.15, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="relative h-[680px] overflow-hidden rounded-[29px] bg-[#171020] max-lg:h-[560px] max-md:h-[430px] max-md:rounded-[22px]">
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0, scale: 0.985 }}
              initial={{ opacity: 0, scale: 0.985 }}
              key={active.id}
              transition={{ duration: 0.32 }}
            >
              <TemplateFrame
                className="h-full"
                id={active.id}
                name={active.name}
                scale="feature"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-[20px] border border-white/12 bg-[#171020]/76 p-2.5 pl-4 text-white shadow-2xl backdrop-blur-xl max-md:inset-x-2 max-md:bottom-2 max-md:flex-wrap">
            <span
              className="size-2.5 rounded-full"
              style={{ background: active.accent }}
            />
            <span>
              <strong className="block text-[13px] font-semibold">
                {active.name}
              </strong>
              <i className="text-[9px] not-italic text-white/45">
                {active.category} · {active.pages}{" "}
                {active.pages === 1 ? "page" : "pages"}
              </i>
            </span>
            <a
              className="ml-auto flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-semibold text-[#171020] transition hover:bg-[#eee8f7]"
              href={`/templates/${active.id}/preview`}
              rel="noreferrer"
              target="_blank"
            >
              Open preview <Icon name="arrow" size={13} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 max-md:grid-cols-1">
          {templates.map((template, index) => {
            const selected = template.id === active.id;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "group flex min-h-24 cursor-pointer items-center rounded-[22px] border px-5 text-left transition-colors",
                  selected
                    ? "border-[#6a25f0]/45 bg-[#6a25f0]/14 text-white"
                    : "border-transparent bg-white/[.035] text-white/72 hover:border-white/10 hover:bg-white/[.06]",
                )}
                key={template.id}
                onClick={() => setActiveId(template.id)}
                type="button"
              >
                <span className="font-mono text-[9px] text-[#6a25f0]">
                  0{index + 1}
                </span>
                <span className="ml-5">
                  <strong className="block text-[14px] font-semibold tracking-[-.03em]">
                    {template.name}
                  </strong>
                  <i className="mt-1 block text-[9px] not-italic text-white/38">
                    {template.category}
                  </i>
                </span>
                <span
                  className={cn(
                    "ml-auto grid size-9 place-items-center rounded-full border transition",
                    selected
                      ? "border-[#6a25f0] bg-[#6a25f0] text-white"
                      : "border-white/10 text-[#a982ff] group-hover:bg-white/[.06]",
                  )}
                >
                  <Icon name="arrow" size={14} />
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
