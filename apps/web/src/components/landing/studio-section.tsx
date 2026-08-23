import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

/**
 * The one dark stretch of the page. Everything around it shows product
 * screenshots, so this section deliberately avoids fake app chrome and works
 * with the raw material of a canvas instead: guides, masters, easing curves
 * and breakpoints.
 */
export function StudioSection() {
  const reduced = Boolean(useReducedMotion());

  return (
    <section
      className="relative overflow-hidden bg-[#141117] px-[max(24px,calc((100vw-1200px)/2))] py-36 text-white max-md:py-24"
      id="studio"
    >
      <Ambience />

      <div className="relative z-[1]">
        <SectionHeading
          copy="Move freely, compose with layout when you need it, then tune motion and responsive behaviour without ever leaving the canvas."
          eyebrow="A studio, not a form"
          inverted
          title={
            <>
              Build with space
              <br />
              to think.
            </>
          }
        />

        <div className="mt-16 grid grid-cols-3 gap-4 max-lg:grid-cols-1 max-md:mt-12">
          <Plate
            copy="Place elements anywhere on an infinite canvas, then let snapping, guides and layout keep the result disciplined."
            delay={0}
            number="01"
            tags={["Free position", "Smart snapping", "Guides"]}
            title="Move anything, anywhere."
          >
            <CanvasPlate reduced={reduced} />
          </Plate>
          <Plate
            copy="Turn any selection into a master with variants. Every instance across the site follows the moment you edit it."
            delay={0.08}
            number="02"
            tags={["Masters", "Variants", "Instant sync"]}
            title="Change once, everywhere."
          >
            <ComponentPlate reduced={reduced} />
          </Plate>
          <Plate
            copy="Author easing, hover and scroll behaviour on the canvas, then publish the exact timing you tuned."
            delay={0.16}
            number="03"
            tags={["Easing curves", "Scroll & hover", "Real output"]}
            title="Motion that ships."
          >
            <MotionPlate reduced={reduced} />
          </Plate>
        </div>

        <ResponsiveBand />
      </div>
    </section>
  );
}

function Ambience() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-52 -right-40 size-[760px] rounded-full bg-[radial-gradient(circle,rgba(84,2,230,.55),transparent_66%)] opacity-70 blur-3xl" />
      <div className="absolute -bottom-72 -left-52 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(168,134,255,.22),transparent_68%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.028)_1px,transparent_1px)] bg-[size:104px_104px] [mask-image:radial-gradient(ellipse_at_center,#000_35%,transparent_78%)]" />
    </div>
  );
}

function Plate({
  children,
  copy,
  delay,
  number,
  tags,
  title,
}: {
  children: ReactNode;
  copy: string;
  delay: number;
  number: string;
  tags: string[];
  title: string;
}) {
  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/[.08] bg-[#1b1720] p-6 transition-colors duration-500 hover:border-white/20 max-md:rounded-[24px]"
      initial={{ opacity: 0, y: 30 }}
      transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ amount: 0.2, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative h-[224px] shrink-0 overflow-hidden rounded-2xl bg-[#100e14] max-md:h-[190px]">
        {children}
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-[#a886ff]">{number}</span>
        <h3 className="text-[22px] leading-tight font-medium tracking-[-.045em]">
          {title}
        </h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/50">{copy}</p>
      <div className="mt-6 flex flex-wrap gap-1.5 border-t border-white/[.07] pt-5 text-[9px] font-bold tracking-[.08em] text-white/40 uppercase">
        {tags.map((tag) => (
          <span
            className="rounded-full border border-white/10 px-2.5 py-1.5"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------- plate 01 */

const LOOP = { duration: 6.4, ease: "easeInOut", repeat: Infinity } as const;

function CanvasPlate({ reduced }: { reduced: boolean }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:26px_26px]">
      <div className="absolute top-7 right-7 h-9 w-16 rounded-lg border border-white/12 bg-white/[.04]" />
      <div className="absolute bottom-8 left-8 h-8 w-24 rounded-lg border border-white/12 bg-white/[.04]" />

      {/* The guides fade in exactly when the moving block lines up. */}
      <motion.i
        animate={reduced ? { opacity: 0.5 } : { opacity: [0, 0, 1, 0, 0] }}
        className="absolute inset-y-4 left-20 w-px bg-[#a886ff]/70"
        transition={LOOP}
      />
      <motion.i
        animate={reduced ? { opacity: 0.5 } : { opacity: [0, 0, 1, 0, 0] }}
        className="absolute inset-x-4 top-[82px] h-px bg-[#a886ff]/70"
        transition={LOOP}
      />

      <motion.div
        animate={reduced ? undefined : { x: [0, 52, 0], y: [0, -30, 0] }}
        className="absolute top-28 left-7 h-16 w-28 rounded-xl bg-[#5402e6] shadow-[0_18px_40px_rgba(84,2,230,.45)]"
        transition={LOOP}
      >
        <span className="absolute -top-6 left-0 rounded-md bg-[#5402e6] px-1.5 py-0.5 font-mono text-[9px] whitespace-nowrap text-white">
          224 × 96
        </span>
        {[
          "-top-1 -left-1",
          "-top-1 -right-1",
          "-bottom-1 -left-1",
          "-right-1 -bottom-1",
        ].map((position) => (
          <i
            className={`absolute size-2 rounded-full border-[1.5px] border-[#a886ff] bg-[#141117] ${position}`}
            key={position}
          />
        ))}
      </motion.div>

      <motion.span
        animate={reduced ? undefined : { x: [0, 52, 0], y: [0, -30, 0] }}
        className="absolute top-[166px] left-[98px] text-white max-md:top-[140px]"
        transition={LOOP}
      >
        <Icon name="cursor" size={18} />
      </motion.span>
    </div>
  );
}

/* ------------------------------------------------------------- plate 02 */

const INSTANCES = ["Desktop", "Tablet", "Mobile"];

function ComponentPlate({ reduced }: { reduced: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 px-6">
      <span className="flex items-center gap-2 rounded-xl border border-[#7c41ff]/40 bg-[#5402e6]/15 px-3.5 py-2.5 text-[10px] font-semibold text-[#c9b4ff]">
        <Icon name="layers" size={13} />
        Navbar · Master
      </span>

      <div className="relative h-12 w-full">
        <span className="absolute top-0 left-1/2 h-5 w-px -translate-x-1/2 bg-white/15" />
        <span className="absolute top-5 right-[16.6%] left-[16.6%] h-px bg-white/15" />
        {["left-[16.6%]", "left-1/2", "right-[16.6%]"].map((position) => (
          <span
            className={`absolute top-5 h-7 w-px bg-white/15 ${position}`}
            key={position}
          />
        ))}
        <motion.span
          animate={reduced ? { opacity: 0.6 } : { opacity: [0.15, 1, 0.15] }}
          className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#a886ff] to-transparent"
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      <div className="flex w-full justify-between gap-2">
        {INSTANCES.map((label, index) => (
          <motion.span
            animate={
              reduced
                ? undefined
                : {
                    borderColor: [
                      "rgba(255,255,255,.1)",
                      "rgba(124,65,255,.65)",
                      "rgba(255,255,255,.1)",
                    ],
                  }
            }
            className="flex-1 rounded-lg border border-white/10 bg-white/[.04] py-2.5 text-center text-[9px] font-medium text-white/60"
            key={label}
            transition={{
              delay: 0.35 + index * 0.22,
              duration: 2.6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            {label}
          </motion.span>
        ))}
      </div>

      <span className="mt-5 font-mono text-[9px] text-white/30">
        3 instances updated
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- plate 03 */

const CURVE = "M12,128 C74,128 92,20 196,20";

function MotionPlate({ reduced }: { reduced: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* The dot rides an `offset-path` in raw pixels, so the curve is drawn at
          1:1 inside a fixed stage rather than scaled to the plate. */}
      <div className="absolute inset-0 flex items-start justify-center pt-3">
        <div className="relative h-[148px] w-[208px]">
          <svg
            aria-hidden="true"
            className="absolute inset-0"
            fill="none"
            height="148"
            viewBox="0 0 208 148"
            width="208"
          >
            <title>Easing curve</title>
            <path
              d="M12 20 V128 H196"
              stroke="rgba(255,255,255,.12)"
              strokeWidth="1"
            />
            <path
              d={CURVE}
              stroke="rgba(255,255,255,.14)"
              strokeDasharray="3 4"
              strokeWidth="1.5"
            />
            <motion.path
              animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
              d={CURVE}
              stroke="#7c41ff"
              strokeLinecap="round"
              strokeWidth="2.5"
              transition={{
                duration: 3.4,
                ease: "easeInOut",
                repeat: Infinity,
                times: [0, 0.7, 1],
              }}
            />
          </svg>

          <motion.i
            animate={
              reduced
                ? { offsetDistance: "100%" }
                : { offsetDistance: ["0%", "100%", "100%"] }
            }
            className="absolute top-0 left-0 size-3 rounded-full bg-white shadow-[0_0_18px_rgba(168,134,255,.9)]"
            style={{
              offsetPath: `path("${CURVE}")`,
              offsetRotate: "0deg",
            }}
            transition={{
              duration: 3.4,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.7, 1],
            }}
          />
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5">
        <div className="flex items-center justify-between font-mono text-[9px] text-white/35">
          <span>cubic-bezier(.22, 1, .36, 1)</span>
          <span>0.8s</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/10">
          <motion.i
            animate={
              reduced ? { width: "100%" } : { width: ["0%", "100%", "100%"] }
            }
            className="block h-full rounded-full bg-[#7c41ff]"
            transition={{
              duration: 3.4,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.7, 1],
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- responsive band */

const WIDTHS = [1280, 1024, 768, 375] as const;
type Width = (typeof WIDTHS)[number];

function ResponsiveBand() {
  const [width, setWidth] = useState<Width>(1280);
  const columns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;

  return (
    <motion.div
      className="mt-4 overflow-hidden rounded-[28px] border border-white/[.08] bg-[#1b1720] p-6 max-md:rounded-[24px]"
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ amount: 0.15, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] text-[#a886ff]">04</span>
          <div>
            <h3 className="text-[22px] leading-tight font-medium tracking-[-.045em]">
              One design. Every width.
            </h3>
            <p className="mt-2 max-w-[430px] text-sm leading-6 text-white/50">
              Breakpoints are frames on the same canvas—edit a width and only
              that width changes.
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[.04] p-1">
          {WIDTHS.map((value) => (
            <button
              className={`cursor-pointer rounded-full px-3.5 py-2 font-mono text-[10px] transition-colors ${
                value === width
                  ? "bg-white text-[#17141b]"
                  : "text-white/45 hover:text-white"
              }`}
              key={value}
              onClick={() => setWidth(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex h-[300px] justify-center overflow-hidden rounded-2xl bg-[#100e14] p-5 max-md:h-[250px]">
        <span className="absolute top-4 left-5 font-mono text-[9px] text-white/25">
          {width} px
        </span>
        <motion.div
          animate={{ width: `${(width / 1280) * 100}%` }}
          className="relative h-full overflow-hidden rounded-xl bg-[#f4f1ea] text-[#141117]"
          transition={{ damping: 30, stiffness: 220, type: "spring" }}
        >
          <div className="flex h-8 items-center justify-between border-b border-black/10 px-3 text-[7px] font-bold">
            <span className="tracking-[-.02em]">PAGIERA®</span>
            {columns === 1 ? (
              <Icon name="menu" size={9} />
            ) : (
              <span className="flex gap-3 text-black/45">
                <i>Work</i>
                <i>Studio</i>
                <i>Contact</i>
              </span>
            )}
          </div>
          <div className="px-3 pt-4">
            <p className="text-[clamp(11px,1.5vw,20px)] leading-[.95] font-medium tracking-[-.06em]">
              Ideas for a
              <span className="block text-[#5402e6]">more human web.</span>
            </p>
            <div
              className="mt-4 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
              }}
            >
              {[0, 1, 2].map((card) => (
                <div className="rounded-md bg-black/[.06] p-2" key={card}>
                  <div className="h-8 rounded bg-[#5402e6]/15" />
                  <div className="mt-2 h-1 w-3/4 rounded-full bg-black/15" />
                  <div className="mt-1.5 h-1 w-1/2 rounded-full bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
