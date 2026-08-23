import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { TemplateFrame } from "@/components/template-frame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TemplateCatalogItem } from "@/lib/template-catalog";

export function TemplateStore({
  templates,
}: {
  templates: TemplateCatalogItem[];
}) {
  const reduced = useReducedMotion();
  const [category, setCategory] = useState("All");
  const [preview, setPreview] = useState<TemplateCatalogItem | null>(null);
  const categories = useMemo(
    () => ["All", ...new Set(templates.map((item) => item.category))],
    [templates],
  );
  const visible =
    category === "All"
      ? templates
      : templates.filter((item) => item.category === category);

  useEffect(() => {
    if (!preview) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [preview]);

  return (
    <>
      <StoreHero reduced={Boolean(reduced)} />
      <section className="bg-[#f8f7fb] px-[max(24px,calc((100vw-1180px)/2))] py-32 max-md:py-24">
        <div className="mb-12 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs text-[#5402e6]">
              {templates.length.toString().padStart(2, "0")}
            </span>
            <h2 className="text-[clamp(34px,4vw,54px)] font-medium tracking-[-.06em]">
              Curated starting points
            </h2>
          </div>
          <div
            className="flex flex-wrap gap-1 rounded-full border border-black/10 bg-white/70 p-1 max-md:rounded-2xl"
            role="tablist"
            aria-label="Template categories"
          >
            {categories.map((item) => (
              <button
                className={cn(
                  "relative h-10 cursor-pointer rounded-full px-4 text-[11px] font-bold transition-colors",
                  category === item ? "text-white" : "text-[#756d7d]",
                )}
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
              >
                {category === item && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-[#17141b]"
                    layoutId="category-pill"
                  />
                )}
                <span className="relative z-[1]">{item}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-5 max-md:grid-cols-1"
          layout
        >
          <AnimatePresence mode="popLayout">
            {visible.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onPreview={() => setPreview(template)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <AnimatePresence>
        {preview && (
          <PreviewDialog template={preview} onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function StoreHero({ reduced }: { reduced: boolean }) {
  return (
    <section className="relative flex min-h-[760px] items-end overflow-hidden border-b border-[#5402e6]/10 bg-[#f5f3ff] px-[max(24px,calc((100vw-1180px)/2))] pt-44 pb-24 max-md:min-h-[680px] max-md:pt-36 max-md:pb-20">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <Image
          className="object-cover object-top"
          src="/sky.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-70">
        <Image
          className="object-cover object-top mix-blend-multiply"
          src="/clouds.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(rgba(84,2,230,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(84,2,230,.05)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <motion.div
        className="relative z-[3] w-[min(860px,83%)] max-md:w-full"
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="flex items-center gap-2.5 text-[10px] font-bold tracking-[.14em] text-[#5f576a] uppercase">
          <i className="size-2 rounded-full bg-[#5402e6] ring-[5px] ring-[#5402e6]/10" />
          Pagiera template library
        </span>
        <h1 className="my-7 text-[clamp(64px,8.5vw,124px)] leading-[.86] font-medium tracking-[-.08em] max-md:text-[clamp(58px,17vw,84px)]">
          Start with taste.
          <br />
          <em className="not-italic text-[#8f62f7]">Make it yours.</em>
        </h1>
        <p className="max-w-[590px] text-sm leading-7 text-[#665f70]">
          Complete responsive systems, not frozen screenshots. Every preview is
          the real site rendered by Pagiera.
        </p>
      </motion.div>
      <motion.div
        className="absolute top-40 right-[max(30px,calc((100vw-1260px)/2))] z-[2] aspect-square w-[min(36vw,460px)] rounded-full border border-[#5402e6]/15 max-md:top-32 max-md:-right-[28%] max-md:w-[72vw] max-md:opacity-45"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{
          duration: 24,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-[17%] rounded-full border border-[#5402e6]/10" />
        <div className="absolute inset-[38%] rounded-full bg-[#5402e6] shadow-[0_0_90px_rgba(84,2,230,.34)]" />
        <i className="absolute top-[10%] left-[26%] size-3 rounded-full bg-[#5402e6]" />
        <i className="absolute right-[1%] bottom-[38%] size-2 rounded-full bg-[#17141b]" />
      </motion.div>
    </section>
  );
}

function TemplateCard({
  template,
  index,
  onPreview,
}: {
  template: TemplateCatalogItem;
  index: number;
  onPreview: () => void;
}) {
  return (
    <motion.article
      className="min-w-0 rounded-[26px] border border-black/10 bg-white p-2.5 pb-6"
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        className="group relative block w-full cursor-pointer overflow-hidden rounded-[18px] border-0 bg-[#17141b] p-0"
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${template.name}`}
      >
        <TemplateFrame
          className="h-[350px] max-sm:h-[240px]"
          id={template.id}
          name={template.name}
          scale="card"
          eager={index < 2}
        />
        <span className="absolute right-4 bottom-4 flex translate-y-2 items-center gap-2 rounded-full bg-[#17141b]/90 px-3 py-2 text-[10px] font-bold text-white opacity-0 backdrop-blur-xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <Icon name="play" size={13} />
          Live preview
        </span>
      </button>
      <div className="flex items-start justify-between gap-5 px-3 pt-5">
        <div>
          <span className="mb-1.5 block text-[9px] font-bold tracking-wider text-[#8a8291] uppercase">
            {template.category} / {template.version}
          </span>
          <h3 className="text-[25px] font-semibold tracking-[-.05em]">
            {template.name}
          </h3>
        </div>
        {template.featured && (
          <span className="rounded-full bg-[#ecffe0] px-2.5 py-2 text-[9px] font-bold text-[#387325]">
            Featured
          </span>
        )}
      </div>
      <p className="mx-3 mt-3 min-h-10 text-[11px] leading-5 text-[#746d7c]">
        {template.description}
      </p>
      <div className="mt-4 flex items-end justify-between gap-4 px-3">
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              className="rounded-full border border-black/10 px-2.5 py-1.5 text-[8px] font-semibold text-[#776f7e]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <Button className="px-0" variant="ghost" size="sm" onClick={onPreview}>
          Preview <Icon name="arrow" size={15} />
        </Button>
      </div>
    </motion.article>
  );
}

function PreviewDialog({
  template,
  onClose,
}: {
  template: TemplateCatalogItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[500] grid place-items-center bg-[#07050a]/75 p-5 backdrop-blur-2xl max-md:p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        className="grid h-[min(900px,94vh)] w-[min(1440px,96vw)] grid-rows-[62px_1fr] overflow-hidden rounded-3xl bg-[#17141b] max-md:h-[calc(100vh-16px)] max-md:w-full max-md:grid-rows-[58px_1fr]"
        role="dialog"
        aria-modal="true"
        aria-label={`${template.name} template preview`}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
      >
        <div className="grid grid-cols-[1fr_minmax(240px,.9fr)_1fr] items-center gap-5 border-b border-white/10 px-4 text-white max-md:grid-cols-[1fr_auto]">
          <div>
            <span className="block text-[8px] font-bold tracking-wider text-white/40 uppercase">
              {template.category}
            </span>
            <strong className="text-xs">{template.name}</strong>
          </div>
          <div className="flex h-8 items-center gap-2 overflow-hidden rounded-lg bg-white/5 px-3 text-[9px] text-white/45 max-md:hidden">
            <i className="size-1.5 rounded-full bg-[#45d486]" />
            pagiera.com/templates/{template.id}/preview
          </div>
          <div className="flex justify-end gap-2">
            <a
              className="flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-[10px] font-bold text-[#17141b] max-md:hidden"
              href={`/templates/${template.id}/preview`}
              target="_blank"
              rel="noreferrer"
            >
              Open full <Icon name="arrow" size={14} />
            </a>
            <button
              className="grid size-9 cursor-pointer place-items-center rounded-xl bg-white/10"
              type="button"
              onClick={onClose}
              aria-label="Close preview"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>
        <TemplateFrame id={template.id} name={template.name} scale="full" />
      </motion.div>
    </motion.div>
  );
}
