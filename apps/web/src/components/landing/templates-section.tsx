import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { TemplateFrame } from "@/components/template-frame";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { localizedHref, useI18n } from "@/lib/i18n";

/** Mirrors templates/registry.json: accents and page counts are taken from
 *  each template's own preview metadata rather than invented here. */
const templates = [
  {
    accent: "#d7ff3f",
    category: "Portfolio",
    id: "nocturne",
    name: "Nocturne Studio",
    pages: 4,
  },
  {
    accent: "#8b7bff",
    category: "SaaS",
    id: "relay",
    name: "Relay",
    pages: 1,
  },
  {
    accent: "#75e9a1",
    category: "App",
    id: "nexthive",
    name: "NextHive",
    pages: 1,
  },
  {
    accent: "#ffffff",
    category: "Social",
    id: "x-clone",
    name: "X Clone",
    pages: 1,
  },
] as const;

export function TemplatesSection() {
  const { locale, t } = useI18n();
  const categoryLabel = (category: string) =>
    ({
      Portfolio: t("Portfolio", "Portfolyo"),
      SaaS: "SaaS",
      App: t("App", "Uygulama"),
      Social: t("Social", "Sosyal"),
    })[category] ?? category;
  const [activeId, setActiveId] = useState<string>(templates[0].id);
  const active = templates.find((item) => item.id === activeId) ?? templates[0];

  return (
    <section
      className="bg-[#0d0915] px-[max(24px,calc((100vw-1240px)/2))] py-36 text-white max-md:py-24"
      id="templates"
    >
      <div className="grid grid-cols-[.8fr_1.4fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
          {t("Start with momentum", "Hızlı bir başlangıç yapın")}
        </span>
        <div>
          <h2 className="text-[clamp(50px,7vw,100px)] leading-[.88] font-medium tracking-[-.08em]">
            {t("A starting point,", "Bir başlangıç noktası,")}
            <br />
            {t("never a ceiling.", "asla bir sınır değil.")}
          </h2>
          <div className="mt-8 flex items-end justify-between gap-8 max-md:items-start max-md:flex-col">
            <p className="max-w-[590px] text-base leading-8 text-white/52">
              {t(
                "Each template is a complete responsive system with pages, components and motion—ready to be pulled apart and made yours.",
                "Her şablon; sayfaları, bileşenleri ve hareketleriyle tüm ekranlara uyumlu eksiksiz bir sistemdir. Parçalarına ayırıp kendinize uyarlamanız için hazırdır.",
              )}
            </p>
            <ButtonLink
              href={localizedHref("/templates", locale)}
              variant="accent"
            >
              {t("Browse all templates", "Tüm şablonları inceleyin")}{" "}
              <Icon name="arrow" size={15} />
            </ButtonLink>
          </div>
        </div>
      </div>

      <motion.div
        className="mt-20 overflow-hidden rounded-[38px] border border-white/[.06] bg-[#141020] p-3 shadow-[0_45px_100px_rgba(0,0,0,.24)] max-md:mt-14 max-md:rounded-[28px] max-md:p-2"
        initial={{ opacity: 0, y: 36 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ amount: 0.15, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="relative h-[680px] overflow-hidden rounded-[29px] bg-[#141020] max-lg:h-[560px] max-md:h-[430px] max-md:rounded-[22px]">
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

          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-[20px] border border-white/[.08] bg-[#141020]/80 p-2.5 pl-4 text-white shadow-2xl backdrop-blur-xl max-md:inset-x-2 max-md:bottom-2 max-md:flex-wrap">
            <span
              className="size-2.5 rounded-full"
              style={{ background: active.accent }}
            />
            <span>
              <strong className="block text-[13px] font-semibold">
                {active.name}
              </strong>
              <i className="text-[9px] not-italic text-white/45">
                {categoryLabel(active.category)} · {active.pages}{" "}
                {active.pages === 1 ? t("page", "sayfa") : t("pages", "sayfa")}
              </i>
            </span>
            <a
              className="ml-auto flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-semibold text-[#141020] transition hover:bg-[#eaeaea]"
              href={localizedHref(`/templates/${active.id}/preview`, locale)}
              rel="noreferrer"
              target="_blank"
            >
              {t("Open preview", "Önizlemeyi aç")}{" "}
              <Icon name="arrow" size={13} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {templates.map((template, index) => {
            const selected = template.id === active.id;
            return (
              // No outline and no global purple: the selected tab is simply a
              // lifted surface, and the only colour it carries is the
              // template's own accent — the same one shown on the preview.
              <button
                aria-pressed={selected}
                className={cn(
                  "group flex min-h-24 cursor-pointer items-center rounded-[22px] px-5 text-left transition-colors",
                  selected
                    ? "bg-white/[.08] text-white"
                    : "bg-transparent text-white/60 hover:bg-white/[.04]",
                )}
                key={template.id}
                onClick={() => setActiveId(template.id)}
                type="button"
              >
                <span
                  className={cn(
                    "font-mono text-[9px] transition-colors",
                    selected ? undefined : "text-white/28",
                  )}
                  style={selected ? { color: template.accent } : undefined}
                >
                  0{index + 1}
                </span>
                <span className="ml-5">
                  <strong className="block text-[14px] font-semibold tracking-[-.03em]">
                    {template.name}
                  </strong>
                  <i className="mt-1 block text-[9px] not-italic text-white/38">
                    {categoryLabel(template.category)}
                  </i>
                </span>
                <span
                  className={cn(
                    "ml-auto grid size-9 place-items-center rounded-full transition",
                    selected
                      ? "bg-white text-[#141020]"
                      : "bg-white/[.06] text-white/40 group-hover:bg-white/[.1] group-hover:text-white/70",
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
