import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { TemplateFrame } from "@/components/template-frame";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TemplateCatalogItem } from "@/lib/template-catalog";

export function TemplateStore({
  templates,
}: {
  templates: TemplateCatalogItem[];
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<TemplateCatalogItem | null>(null);
  const categories = useMemo(
    () => ["All", ...new Set(templates.map((item) => item.category))],
    [templates],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!needle) return true;
      return [item.name, item.description, item.category, ...item.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [templates, category, query]);

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
      <StoreHero templates={templates} />

      <section
        className="bg-[#0d0915] px-[max(24px,calc((100vw-1240px)/2))] py-32 text-white max-md:py-20"
        id="library"
      >
        <div className="mb-12 flex items-end justify-between gap-8 max-lg:flex-col max-lg:items-stretch">
          <div>
            <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
              {visible.length.toString().padStart(2, "0")} systems ready
            </span>
            <h2 className="mt-4 text-[clamp(38px,4.6vw,64px)] leading-[.94] font-medium tracking-[-.07em]">
              Curated{" "}
              <em className="font-serif font-normal text-[#a982ff]">
                starting points.
              </em>
            </h2>
          </div>

          <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
            <label className="flex h-12 items-center gap-2.5 rounded-full border border-white/10 bg-white/[.04] px-4 text-white/70 transition-colors focus-within:border-[#6a25f0]/60 focus-within:bg-white/[.07]">
              <Icon name="search" size={16} />
              <input
                aria-label="Search templates"
                className="w-40 bg-transparent text-xs text-white outline-none placeholder:text-white/35 max-md:w-full"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates"
                type="search"
                value={query}
              />
            </label>

            <div
              aria-label="Template categories"
              className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/[.04] p-1 max-md:rounded-3xl"
              role="tablist"
            >
              {categories.map((item) => (
                <button
                  aria-selected={category === item}
                  className={cn(
                    "relative h-10 cursor-pointer rounded-full px-4 text-[11px] font-bold transition-colors",
                    category === item
                      ? "text-white"
                      : "text-white/48 hover:text-white/80",
                  )}
                  key={item}
                  onClick={() => setCategory(item)}
                  role="tab"
                  type="button"
                >
                  {category === item && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-[#6a25f0]"
                      layoutId="category-pill"
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <span className="relative z-[1]">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-4 max-md:grid-cols-1"
          layout
        >
          {visible.map((template, index) => (
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0 rounded-[30px] border border-white/[.08] bg-[#171020] p-2.5 pb-6 transition-colors duration-300 hover:border-[#6a25f0]/40 max-md:rounded-[24px]"
              initial={{ opacity: 0, y: 30 }}
              key={template.id}
              layout
              transition={{ delay: Math.min(index, 5) * 0.05 }}
            >
              <TemplateCard
                index={index}
                onPreview={() => setPreview(template)}
                template={template}
              />
            </motion.article>
          ))}
        </motion.div>

        {visible.length === 0 && (
          <div className="grid place-items-center gap-4 rounded-[28px] border border-dashed border-white/12 bg-white/[.02] py-24 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white/[.06] text-[#a982ff]">
              <Icon name="search" size={20} />
            </span>
            <p className="text-sm text-white/55">
              Nothing matches that search yet.
            </p>
            <Button
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
              size="sm"
              variant="accent"
            >
              Reset filters
            </Button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {preview && (
          <PreviewDialog onClose={() => setPreview(null)} template={preview} />
        )}
      </AnimatePresence>
    </>
  );
}

function StoreHero({ templates }: { templates: TemplateCatalogItem[] }) {
  const categories = new Set(templates.map((item) => item.category)).size;
  const pages = templates.reduce((total, item) => total + item.pages.length, 0);

  return (
    <section className="relative m-2 overflow-hidden rounded-[36px] bg-[#f7f5fb] px-6 pt-[190px] pb-24 text-[#17101f] max-md:m-1 max-md:rounded-[28px] max-md:px-4 max-md:pt-32 max-md:pb-16">
      {/* Pixel field: a purple wash rasterised into 12px blocks that dissolve outward. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(56%_46%_at_50%_18%,rgba(106,37,240,.5),rgba(143,92,247,.22)_45%,transparent_72%)] [mask-image:radial-gradient(closest-side,#000_58%,transparent),repeating-conic-gradient(#000_0%_25%,transparent_0%_50%)] [mask-position:0_0] [mask-repeat:repeat] [mask-size:12px_12px,12px_12px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(106,37,240,.5)_1.5px,transparent_0)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,transparent_72%)]" />
      {/* Keeps the fixed site header legible over the busiest part of the field. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(#f7f5fb_28%,rgba(247,245,251,.72)_62%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(transparent,#f7f5fb)]" />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-[3] mx-auto max-w-[1000px] text-center"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-white/80 px-3.5 py-1.5 text-[10px] font-bold tracking-[.08em] text-[#3d3548] uppercase backdrop-blur-md">
          <i className="size-1.5 rounded-full bg-[#6a25f0]" /> Pagiera template
          library
        </span>
        <h1 className="mt-8 text-[clamp(54px,7vw,96px)] leading-[.9] font-semibold tracking-[-0.075em] text-[#17101f] max-md:mt-6 max-md:text-[clamp(46px,13vw,64px)]">
          Start with taste.
          <span className="block">
            Make it{" "}
            <em className="font-serif font-normal text-[#6a25f0]">yours.</em>
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-[560px] text-sm leading-7 text-[#5b5566]">
          Complete responsive systems, not frozen screenshots. Every preview on
          this page is the real site, rendered live by Pagiera.
        </p>

        <div className="mt-9 flex justify-center gap-2 max-sm:mx-auto max-sm:w-[min(330px,100%)] max-sm:flex-col">
          <ButtonLink href="#library" size="lg" variant="accent">
            Browse the library <Icon name="arrow" size={16} />
          </ButtonLink>
          <ButtonLink
            className="bg-white/85"
            href="/"
            size="lg"
            variant="secondary"
          >
            How Pagiera works
          </ButtonLink>
        </div>

        <dl className="mx-auto mt-12 grid w-[min(720px,100%)] grid-cols-3 gap-2 max-sm:grid-cols-1">
          {(
            [
              [templates.length, "Templates"],
              [pages, "Ready-made pages"],
              [categories, "Categories"],
            ] as const
          ).map(([value, label]) => (
            <div
              className="rounded-3xl border border-black/[.07] bg-white/85 px-5 py-5 backdrop-blur-md"
              key={label}
            >
              <dt className="text-[28px] leading-none font-semibold tracking-[-.06em] text-[#17101f]">
                {value}
              </dt>
              <dd className="mt-2 text-[10px] font-bold tracking-[.1em] text-[#6b6478] uppercase">
                {label}
              </dd>
            </div>
          ))}
        </dl>
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
    <>
      <button
        aria-label={`Preview ${template.name}`}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-[22px] border-0 bg-[#0d0915] p-0"
        onClick={onPreview}
        type="button"
      >
        <TemplateFrame
          className="h-[360px] max-sm:h-[240px]"
          eager={index < 2}
          id={template.id}
          name={template.name}
          scale="card"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(13,9,21,.72))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute right-4 bottom-4 flex translate-y-2 items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-[10px] font-bold text-[#171020] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Icon name="play" size={13} />
          Live preview
        </span>
      </button>

      <div className="flex items-start justify-between gap-5 px-3 pt-5">
        <div>
          <span className="mb-1.5 block text-[9px] font-bold tracking-wider text-white/38 uppercase">
            {template.category} / {template.version}
          </span>
          <h3 className="text-[25px] font-semibold tracking-[-.05em] text-white">
            {template.name}
          </h3>
        </div>
        {template.featured && (
          <span className="rounded-full border border-[#6a25f0]/40 bg-[#6a25f0]/15 px-2.5 py-2 text-[9px] font-bold text-[#c3a7ff]">
            Featured
          </span>
        )}
      </div>

      <p className="mx-3 mt-3 min-h-10 text-[11px] leading-5 text-white/48">
        {template.description}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4 px-3">
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              className="rounded-full border border-white/10 px-2.5 py-1.5 text-[8px] font-semibold text-white/50"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <Button
          className="px-0 text-white/70 hover:bg-transparent hover:text-[#a982ff]"
          onClick={onPreview}
          size="sm"
          variant="ghost"
        >
          Preview <Icon name="arrow" size={15} />
        </Button>
      </div>
    </>
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
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[500] grid place-items-center bg-[#07050a]/78 p-5 backdrop-blur-2xl max-md:p-2"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-label={`${template.name} template preview`}
        aria-modal="true"
        className="grid h-[min(900px,94vh)] w-[min(1440px,96vw)] grid-rows-[62px_1fr] overflow-hidden rounded-[28px] border border-white/10 bg-[#171020] shadow-[0_45px_120px_rgba(0,0,0,.5)] max-md:h-[calc(100vh-16px)] max-md:w-full max-md:grid-rows-[58px_1fr] max-md:rounded-[20px]"
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        role="dialog"
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
              className="flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-[10px] font-bold text-[#171020] transition-colors hover:bg-[#eee8f7] max-md:hidden"
              href={`/templates/${template.id}/preview`}
              rel="noreferrer"
              target="_blank"
            >
              Open full <Icon name="arrow" size={14} />
            </a>
            <button
              aria-label="Close preview"
              className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={onClose}
              type="button"
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
