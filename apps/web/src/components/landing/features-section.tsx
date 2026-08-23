import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

const features: Array<{
  number: string;
  icon: IconName;
  title: string;
  copy: string;
}> = [
  {
    number: "01",
    icon: "cursor",
    title: "Design without the handcuffs.",
    copy: "A freeform canvas, fluid layout, responsive breakpoints and exact styling without fighting the tool.",
  },
  {
    number: "02",
    icon: "layers",
    title: "One component. Every page.",
    copy: "Create reusable assets with variants. Change the master and every instance follows.",
  },
  {
    number: "03",
    icon: "brackets",
    title: "Real data, rendered right.",
    copy: "Connect APIs, route params and forms. Pagiera resolves content server-side for search engines.",
  },
];

export function FeaturesSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="bg-[#f8f7fb] px-[max(24px,calc((100vw-1200px)/2))] py-36 max-md:py-24"
      id="features"
    >
      <SectionHeading
        eyebrow="Built for real creative work"
        title={
          <>
            Freedom where it matters.
            <br />
            Structure where it counts.
          </>
        }
        copy="A visual system that stays out of your way while preserving production-grade output."
      />

      <div className="mt-16 grid grid-cols-12 gap-4">
        <BentoCard className="col-span-7 min-h-[620px] bg-[#17141b] text-white max-lg:col-span-12 max-md:min-h-[560px]">
          <FeatureIntro feature={features[0]} inverse />
          <FreeCanvasVisual reduced={Boolean(reduced)} />
        </BentoCard>

        <BentoCard
          className="col-span-5 min-h-[620px] bg-[#eee8ff] text-[#17141b] max-lg:col-span-12 max-lg:min-h-[560px]"
          delay={0.08}
        >
          <FeatureIntro feature={features[1]} />
          <ComponentVisual reduced={Boolean(reduced)} />
        </BentoCard>

        <BentoCard
          className="col-span-12 grid min-h-[420px] grid-cols-[.78fr_1.22fr] gap-8 bg-white text-[#17141b] max-lg:grid-cols-1"
          delay={0.16}
        >
          <div className="flex flex-col justify-between">
            <FeatureIntro feature={features[2]} />
            <div className="mt-10 flex flex-wrap gap-2 text-[9px] font-bold tracking-[.08em] uppercase">
              {["SSR first", "Route params", "Forms", "REST APIs"].map(
                (label) => (
                  <span
                    className="rounded-full border border-black/10 px-3 py-2 text-black/45"
                    key={label}
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>
          <DataVisual reduced={Boolean(reduced)} />
        </BentoCard>
      </div>
    </section>
  );
}

function BentoCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className: string;
  delay?: number;
}) {
  return (
    <motion.article
      className={`relative overflow-hidden rounded-[32px] border border-black/[.08] p-8 max-md:rounded-[26px] max-md:p-6 ${className}`}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.article>
  );
}

function FeatureIntro({
  feature,
  inverse = false,
}: {
  feature: (typeof features)[number];
  inverse?: boolean;
}) {
  return (
    <div className="relative z-[2]">
      <div
        className={`flex items-center justify-between text-[10px] font-bold ${inverse ? "text-white/40" : "text-black/35"}`}
      >
        <span>{feature.number}</span>
        <span
          className={`grid size-10 place-items-center rounded-full ${inverse ? "bg-white/10 text-[#ad8aff]" : "bg-white text-[#5402e6]"}`}
        >
          <Icon name={feature.icon} />
        </span>
      </div>
      <h3 className="mt-7 max-w-[480px] text-[clamp(32px,3.6vw,48px)] leading-[.96] font-medium tracking-[-.06em]">
        {feature.title}
      </h3>
      <p
        className={`mt-4 max-w-[480px] text-sm leading-7 ${inverse ? "text-white/48" : "text-black/48"}`}
      >
        {feature.copy}
      </p>
    </div>
  );
}

function FreeCanvasVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="absolute right-7 bottom-7 left-7 h-[285px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0e0c11] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:24px_24px] max-md:h-[250px]">
      <div className="absolute inset-y-0 left-0 w-10 border-r border-white/10 bg-[#19161d] p-2">
        {[0, 1, 2, 3].map((item) => (
          <i
            className={`mb-2 block size-6 rounded-full ${item === 0 ? "bg-[#5402e6]" : "bg-white/[.055]"}`}
            key={item}
          />
        ))}
      </div>
      <motion.div
        className="absolute top-8 right-8 bottom-8 left-20 overflow-hidden rounded-lg bg-[#f0ecdf] p-6 text-[#17141b] shadow-2xl max-md:left-16"
        animate={
          reduced ? undefined : { rotate: [-0.35, 0.35, -0.35], y: [1, -3, 1] }
        }
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      >
        <span className="text-[7px] font-bold">FIELDNOTES®</span>
        <strong className="mt-10 block max-w-[330px] text-[clamp(28px,3.4vw,48px)] leading-[.85] tracking-[-.07em]">
          IDEAS FOR A MORE HUMAN WEB.
        </strong>
        <div className="absolute top-[72px] left-[18px] h-[94px] w-[65%] border border-[#7641ef]">
          {[
            "-top-1 -left-1",
            "-top-1 -right-1",
            "-bottom-1 -left-1",
            "-right-1 -bottom-1",
          ].map((position) => (
            <i
              className={`absolute size-2 border border-white bg-[#7641ef] ${position}`}
              key={position}
            />
          ))}
        </div>
        <motion.span
          className="absolute top-[155px] left-[68%] text-[#7641ef]"
          animate={reduced ? undefined : { x: [0, 9, 0], y: [0, 6, 0] }}
          transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
        >
          <Icon name="cursor" size={18} />
        </motion.span>
      </motion.div>
      <span className="absolute right-3 bottom-3 rounded-full border border-white/10 bg-[#17141b]/90 px-3 py-1.5 text-[8px] text-white/45 backdrop-blur">
        Canvas · 100%
      </span>
    </div>
  );
}

function ComponentVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="absolute right-7 bottom-7 left-7 grid h-[285px] place-items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_45%,#fff_0%,#f4f0ff_44%,#e2d8ff_100%)] max-md:h-[250px]">
      <div className="absolute top-5 left-5 rounded-full bg-[#5402e6] px-3 py-1.5 text-[8px] font-bold text-white">
        Navbar · Master
      </div>
      <div className="relative mt-7 grid w-[78%] gap-7">
        <motion.div
          className="rounded-2xl border border-[#5402e6]/15 bg-white p-4 shadow-[0_18px_40px_rgba(84,2,230,.12)]"
          animate={reduced ? undefined : { y: [-3, 3, -3] }}
          transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
        >
          <div className="flex items-center justify-between">
            <strong className="text-[9px]">Pagiera</strong>
            <span className="flex gap-3 text-[7px] text-black/40">
              <i>Work</i>
              <i>About</i>
              <b className="rounded-full bg-[#5402e6] px-2 py-1 font-medium text-white">
                Start
              </b>
            </span>
          </div>
        </motion.div>
        <div className="absolute top-[52px] left-1/2 h-7 w-px -translate-x-1/2 bg-[#5402e6]/25" />
        <div className="grid grid-cols-2 gap-3">
          {["Desktop", "Mobile"].map((label, index) => (
            <motion.div
              className="rounded-xl border border-[#5402e6]/10 bg-white/75 p-3 text-center text-[8px] font-semibold text-[#5402e6] backdrop-blur"
              animate={
                reduced ? undefined : { y: index ? [2, -2, 2] : [-2, 2, -2] }
              }
              key={label}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              Variant · {label}
            </motion.div>
          ))}
        </div>
      </div>
      <span className="absolute right-4 bottom-4 text-[8px] font-semibold text-[#5402e6]/55">
        Synced instantly
      </span>
    </div>
  );
}

function DataVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative min-h-[350px] overflow-hidden rounded-[24px] bg-[#15121a] p-5 font-mono text-[9px] text-white/48 max-md:min-h-[320px]">
      <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
        <span className="flex items-center gap-2">
          <i className="size-2 rounded-full bg-[#55dc94]" />
          Current post
        </span>
        <span>Server request</span>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[.045] p-3">
        <span className="rounded-md bg-[#5402e6] px-2 py-1 font-bold text-white">
          GET
        </span>
        <code className="truncate text-white/75">
          /posts/{"{{params.slug}}"}
        </code>
        <span className="ml-auto text-[#55dc94]">200</span>
      </div>
      <div className="mt-4 grid grid-cols-[.85fr_1.15fr] gap-3 max-md:grid-cols-1">
        <div className="rounded-xl border border-white/[.07] p-4 leading-6">
          <span className="text-white/25">Response</span>
          <p className="mt-2">
            <i className="text-[#ad8aff]">title</i>: “Design systems that move”
          </p>
          <p>
            <i className="text-[#ad8aff]">author</i>: “Voi Labs”
          </p>
          <p>
            <i className="text-[#ad8aff]">published</i>: true
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-[#f0ecdf] p-4 font-sans text-[#17141b]">
          <span className="text-[7px] font-bold tracking-widest uppercase">
            Journal / 04
          </span>
          <strong className="mt-12 block max-w-[260px] text-3xl leading-[.88] tracking-[-.06em]">
            DESIGN SYSTEMS THAT MOVE.
          </strong>
          <motion.i
            className="absolute right-[-25px] bottom-[-35px] size-28 rounded-full bg-[#5402e6]"
            animate={reduced ? undefined : { scale: [0.9, 1.12, 0.9] }}
            transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </div>
      <div className="absolute right-5 bottom-4 flex items-center gap-2 text-[8px] text-white/30">
        <span>Rendered on server</span>
        <Icon className="text-[#55dc94]" name="check" size={12} />
      </div>
    </div>
  );
}
