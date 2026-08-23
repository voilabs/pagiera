import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";

export function HeroSection() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const skyY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const cloudX = useTransform(scrollYProgress, [0, 0.2], [0, -28]);
  const cloudY = useTransform(scrollYProgress, [0, 0.2], [0, 145]);
  const copyY = useTransform(scrollYProgress, [0, 0.16], [0, 54]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0.18]);
  const stageY = useSpring(useTransform(scrollYProgress, [0, 0.25], [0, 80]), {
    stiffness: 120,
    damping: 30,
  });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [5, -5]), {
    stiffness: 110,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 110,
    damping: 22,
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Pointer tracking only drives decorative motion.
    <section
      className="relative min-h-[1080px] overflow-hidden bg-[#f5f3ff] px-6 pt-[170px] pb-20 max-md:min-h-[940px] max-md:px-4 max-md:pt-32"
      id="top"
      onMouseLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      onMouseMove={(event) => {
        if (reduced) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
        pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={reduced ? undefined : { y: skyY }}
      >
        <Image
          className="object-cover object-top"
          src="/sky.png"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
        />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={reduced ? undefined : { x: cloudX, y: cloudY }}
      >
        {/* Eager, but deliberately not `priority`: preloading both 1.1MB
            backdrops made them race the heading for the LCP. */}
        <Image
          className="object-cover object-top mix-blend-multiply"
          src="/clouds.png"
          alt=""
          fill
          loading="eager"
          quality={70}
          sizes="100vw"
        />
      </motion.div>
      <motion.div
        animate={
          reduced
            ? undefined
            : { opacity: [0.22, 0.34, 0.22], scale: [1, 1.08, 1] }
        }
        className="pointer-events-none absolute top-[8%] left-1/2 z-[1] h-[570px] w-[850px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.95),rgba(236,230,255,.35)_45%,transparent_73%)] blur-2xl"
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
      />

      <motion.div
        className="relative z-[2] mx-auto max-w-[950px] text-center"
        style={reduced ? undefined : { opacity: copyOpacity, y: copyY }}
      >
        {/* <motion.div
          className="inline-flex items-center gap-2.5 rounded-full border border-[#5402e6]/10 bg-white/60 px-3 py-2 text-[11px] font-bold tracking-[0.09em] text-[#554c66] uppercase backdrop-blur-xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="size-2 rounded-full bg-[#5402e6] ring-[5px] ring-[#5402e6]/10" />
          The open visual website builder
        </motion.div> */}
        <motion.h1
          className="mt-6 mb-5 text-[clamp(58px,7.3vw,108px)] leading-[0.91] font-medium tracking-[-0.075em] max-md:text-[clamp(52px,15vw,76px)]"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.7 }}
        >
          Design the web.
          <span className="block font-bold text-[#5402e6]">
            Keep the freedom.
          </span>
        </motion.h1>
        <motion.p
          className="mx-auto max-w-[650px] text-[clamp(15px,1.4vw,19px)] leading-8 tracking-[-0.02em] text-[#665f70]"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.65 }}
        >
          A freeform, responsive and data-aware visual builder that turns
          expressive ideas into production-ready websites.
        </motion.p>
        <motion.div
          className="mt-8 flex justify-center gap-2.5 max-sm:mx-auto max-sm:w-full max-sm:max-w-[330px] max-sm:flex-col"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <ButtonLink
            size="lg"
            variant="purple"
            href="https://github.com/voilabs/pagiera"
          >
            Start building <Icon name="arrow" size={17} />
          </ButtonLink>
          <ButtonLink size="lg" variant="secondary" href="/templates">
            Explore templates
          </ButtonLink>
        </motion.div>
      </motion.div>

      <div className="relative z-[3] mx-auto mt-20 w-[min(1220px,96%)] [perspective:1400px] max-md:mt-14 max-md:w-[132%] max-md:-translate-x-[12%]">
        <motion.div
          initial={{ opacity: 0, scale: 0.965 }}
          animate={{ opacity: 1, scale: 1 }}
          style={
            reduced
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  y: stageY,
                }
          }
          transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <EditorPreview reduced={Boolean(reduced)} />
        </motion.div>

        <FloatingChip
          className="-left-10 top-[18%]"
          delay={0.9}
          icon="grid"
          reduced={Boolean(reduced)}
        >
          Free canvas
        </FloatingChip>
        <FloatingChip
          className="-right-12 top-[57%]"
          delay={1.2}
          icon="layers"
          reduced={Boolean(reduced)}
          reverse
        >
          Reusable components
        </FloatingChip>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-8 z-[4] hidden items-center gap-3 text-[10px] font-bold tracking-[0.14em] text-[#655d70] uppercase lg:flex">
        <span>Scroll to explore</span>
        <span className="relative h-10 w-px overflow-hidden bg-black/10">
          <motion.i
            animate={reduced ? undefined : { y: [-16, 40] }}
            className="absolute inset-x-0 top-0 h-4 bg-[#5402e6]"
            transition={{ duration: 1.7, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
      </div>
      <div className="pointer-events-none absolute right-8 bottom-8 z-[4] hidden gap-4 text-[10px] font-semibold tracking-[0.1em] text-[#71697a] uppercase lg:flex">
        <span>Open source</span>
        <span>Responsive</span>
        <span>SSR</span>
      </div>
    </section>
  );
}

function FloatingChip({
  children,
  className,
  delay,
  icon,
  reduced,
  reverse = false,
}: {
  children: ReactNode;
  className: string;
  delay: number;
  icon: "grid" | "layers";
  reduced: boolean;
  reverse?: boolean;
}) {
  return (
    <motion.div
      animate={
        reduced
          ? { opacity: 1, rotate: 0, scale: 1, y: 0 }
          : {
              opacity: 1,
              rotate: reverse ? [2, -1, 2] : [-2, 1, -2],
              scale: 1,
              y: reverse ? [8, -8, 8] : [-8, 8, -8],
            }
      }
      className={`pointer-events-none absolute z-10 hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#352f3c] shadow-[0_18px_45px_rgba(64,45,96,.16)] backdrop-blur-xl lg:flex ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      transition={{
        delay,
        duration: reduced ? 0 : 4.2,
        ease: "easeInOut",
        repeat: reduced ? 0 : Infinity,
      }}
    >
      <span className="grid size-7 place-items-center rounded-full bg-[#eee7ff] text-[#5402e6]">
        <Icon name={icon} size={14} />
      </span>
      {children}
    </motion.div>
  );
}

/**
 * The editor chrome palette, copied from the real editor's light theme (the
 * `--ed-*` block in the package's globals.css). Driving the mock from the same
 * variables keeps it recognisably the product, and swapping the preview to the
 * dark chrome is a single object away.
 */
const EDITOR_CHROME = {
  "--ed-canvas": "#e8e9ec",
  "--ed-surface": "#ffffff",
  "--ed-subtle": "#f6f6fa",
  "--ed-field": "#eeeef4",
  "--ed-border": "#e0e0e9",
  "--ed-text": "#15141d",
  "--ed-muted": "#5d5b73",
  "--ed-faint": "#8d8ba3",
  "--ed-accent": "#5402e6",
  "--ed-accent-soft": "rgb(84 2 230 / .12)",
  "--ed-grid": "rgb(0 0 0 / .045)",
} as CSSProperties;

const RAIL_PANELS: IconName[] = ["frame", "layers", "copy", "image", "grid"];
const RAIL_TOOLS: IconName[] = ["brackets", "globe", "sparkles"];

const LAYERS: Array<{
  depth: number;
  icon: IconName;
  label: string;
  active?: boolean;
  branch?: boolean;
}> = [
  { branch: true, depth: 0, icon: "frame", label: "Navigation" },
  { branch: true, depth: 0, icon: "frame", label: "Hero" },
  { branch: true, depth: 1, icon: "frame", label: "Hero composition" },
  { branch: true, depth: 2, icon: "frame", label: "Hero copy" },
  { depth: 3, icon: "text", label: "Hero eyebrow" },
  { active: true, depth: 3, icon: "heading", label: "Hero title" },
  { depth: 3, icon: "text", label: "Hero body" },
  { depth: 3, icon: "frame", label: "Hero actions" },
  { branch: true, depth: 2, icon: "image", label: "Hero artwork" },
  { branch: true, depth: 0, icon: "frame", label: "Marquee" },
  { branch: true, depth: 0, icon: "frame", label: "Manifesto" },
];

const BREADCRUMB = ["Hero", "Hero composition", "Hero copy", "Hero title"];

function EditorPreview({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[26px] border border-[var(--ed-border)] bg-[var(--ed-surface)] text-[var(--ed-text)] shadow-[0_65px_140px_rgba(55,35,88,.28),0_12px_34px_rgba(55,35,88,.14)]"
      style={EDITOR_CHROME}
    >
      <EditorHeader />
      <div className="grid h-[610px] grid-cols-[48px_236px_minmax(0,1fr)_256px] bg-[var(--ed-canvas)] max-xl:h-[540px] max-xl:grid-cols-[46px_200px_minmax(0,1fr)_222px] max-lg:grid-cols-[44px_minmax(0,1fr)_208px] max-md:h-[420px] max-md:grid-cols-[40px_minmax(0,1fr)]">
        <EditorRail />
        <LayersPanel />
        <EditorCanvas reduced={reduced} />
        <EditorInspector reduced={reduced} />
      </div>
    </div>
  );
}

function EditorHeader() {
  return (
    <header className="grid h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-[var(--ed-border)] bg-[var(--ed-surface)] px-2.5">
      <span className="w-fit rounded-full px-2 py-1 text-[12px] font-semibold tracking-[-.02em]">
        Pagiera
      </span>
      <div className="flex h-8 items-center gap-1 rounded-full bg-[var(--ed-subtle)] p-0.5 text-[var(--ed-muted)] max-sm:hidden">
        <div className="flex items-center gap-0.5">
          <span className="flex size-6 items-center justify-center rounded-full">
            <Icon name="minus" size={12} />
          </span>
          <span className="w-9 text-center text-[10px] tabular-nums">46%</span>
          <span className="flex size-6 items-center justify-center rounded-full">
            <Icon name="plus" size={12} />
          </span>
        </div>
        <div className="flex items-center gap-0.5 border-l border-[var(--ed-border)] pl-1">
          <span className="flex size-6 items-center justify-center rounded-full">
            <Icon name="undo" size={13} />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full opacity-35">
            <Icon name="redo" size={13} />
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1">
        <span className="mr-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-[var(--ed-muted)] max-md:hidden">
          <i className="size-1.5 rounded-full bg-emerald-500" />
          Saved
        </span>
        <span className="h-7 rounded-full bg-[var(--ed-accent)] px-3 text-[10px] font-semibold leading-7 text-white">
          Publish
        </span>
        <span className="flex size-7 items-center justify-center rounded-full text-[var(--ed-muted)]">
          <Icon name="moon" size={14} />
        </span>
        <span className="flex size-7 items-center justify-center rounded-full text-[var(--ed-muted)] max-sm:hidden">
          <Icon name="panel" size={14} />
        </span>
      </div>
    </header>
  );
}

function EditorRail() {
  return (
    <aside className="flex flex-col items-center border-r border-[var(--ed-border)] bg-[var(--ed-surface)] p-1.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ed-accent)] text-white max-md:size-7">
        <Icon name="plus" size={14} />
      </span>
      <span className="my-1.5 h-px w-5 bg-[var(--ed-border)]" />
      <nav className="flex w-full flex-col items-center gap-1 rounded-full bg-[var(--ed-subtle)] p-0.5">
        {RAIL_PANELS.map((name) => (
          <RailButton active={name === "layers"} icon={name} key={name} />
        ))}
      </nav>
      <span className="my-1.5 h-px w-5 bg-[var(--ed-border)]" />
      <nav className="flex w-full flex-col items-center gap-1 rounded-full bg-[var(--ed-subtle)] p-0.5">
        {RAIL_TOOLS.map((name) => (
          <RailButton icon={name} key={name} />
        ))}
      </nav>
      <nav className="mt-auto flex w-full justify-center rounded-full bg-[var(--ed-subtle)] p-0.5">
        <RailButton icon="settings" />
      </nav>
    </aside>
  );
}

function RailButton({
  active = false,
  icon,
}: {
  active?: boolean;
  icon: IconName;
}) {
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full max-md:size-7 ${
        active ? "bg-[var(--ed-accent)] text-white" : "text-[var(--ed-muted)]"
      }`}
    >
      <Icon name={icon} size={15} />
    </span>
  );
}

function LayersPanel() {
  return (
    <aside className="flex min-w-0 flex-col overflow-hidden border-r border-[var(--ed-border)] bg-[var(--ed-surface)] max-lg:hidden">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ed-border)] px-3.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--ed-accent-soft)] text-[var(--ed-accent)]">
            <Icon name="layers" size={13} />
          </span>
          <span className="truncate text-[11px] font-semibold">Layers</span>
        </span>
        <Icon className="text-[var(--ed-faint)]" name="close" size={14} />
      </div>
      <div className="border-b border-[var(--ed-border)] bg-[var(--ed-subtle)] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[var(--ed-border)] bg-[var(--ed-surface)] px-2.5 py-1.5">
          <Icon className="text-[var(--ed-faint)]" name="search" size={13} />
          <span className="flex-1 truncate text-[11px] text-[var(--ed-faint)]">
            Search layers...
          </span>
          <span className="text-[11px] text-[var(--ed-faint)]">⌘</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden py-1">
        {LAYERS.map((layer) => (
          <LayerRow key={layer.label} {...layer} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--ed-border)] px-3 py-2 text-[var(--ed-muted)]">
        <span className="text-[10px] tabular-nums">28 elements</span>
        <span className="flex items-center gap-1.5">
          <Icon name="copy" size={15} />
          <Icon name="trash" size={15} />
        </span>
      </div>
    </aside>
  );
}

function LayerRow({
  active = false,
  branch = false,
  depth,
  icon,
  label,
}: {
  active?: boolean;
  branch?: boolean;
  depth: number;
  icon: IconName;
  label: string;
}) {
  return (
    <div
      className={`flex h-8 items-center gap-2 pr-2 text-[11px] ${
        active
          ? "bg-[var(--ed-accent-soft)] text-[var(--ed-text)]"
          : "text-[var(--ed-muted)]"
      }`}
      style={{ paddingLeft: 12 + depth * 14 }}
    >
      {branch ? (
        <Icon
          className="shrink-0 rotate-90 text-[var(--ed-faint)]"
          name="chevron"
          size={11}
        />
      ) : (
        <span className="w-[11px] shrink-0" />
      )}
      <Icon className="shrink-0" name={icon} size={13} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function EditorCanvas({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="relative min-w-0 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--ed-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--ed-grid) 1px, transparent 1px)",
        backgroundPosition: "-1px -1px",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="flex h-full items-start justify-center gap-[3%] px-5 pt-6 max-md:gap-[4%] max-md:px-3 max-md:pt-4">
        <motion.div
          animate={reduced ? undefined : { y: [0, -4, 0] }}
          className="w-[63%] max-md:w-[68%]"
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        >
          <FrameLabel base label="Desktop" range="1280+" width="1280" />
          <DesktopFrame reduced={reduced} />
        </motion.div>
        <motion.div
          animate={reduced ? undefined : { y: [0, -4, 0] }}
          className="w-[25%] max-md:w-[26%] max-sm:hidden"
          transition={{
            delay: 0.4,
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <FrameLabel label="Mobile" range="480 — 1279" width="480" />
          <MobileFrame />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-8 items-center gap-1 border-t border-[var(--ed-border)] bg-[var(--ed-surface)] px-4 text-[11px] text-[var(--ed-muted)]">
        <span className="text-[var(--ed-faint)]">Page</span>
        {BREADCRUMB.map((crumb, index) => (
          <span
            className={`flex items-center gap-1 whitespace-nowrap ${index < 2 ? "max-lg:hidden" : ""}`}
            key={crumb}
          >
            <Icon className="text-[var(--ed-faint)]" name="chevron" size={11} />
            {crumb}
          </span>
        ))}
      </div>

      <div className="absolute right-4 bottom-11 flex items-center gap-0.5 rounded-lg border border-[var(--ed-border)] bg-[var(--ed-surface)]/90 p-1 text-[var(--ed-faint)] backdrop-blur max-md:hidden">
        <span className="rounded-md p-1.5">
          <Icon name="play" size={14} />
        </span>
        <span className="rounded-md p-1.5">
          <Icon name="focus" size={15} />
        </span>
        <span className="rounded-md px-1.5 py-1.5 font-mono text-[11px] leading-none">
          1:1
        </span>
        <span className="rounded-md p-1.5">
          <Icon name="maximize" size={15} />
        </span>
      </div>
    </div>
  );
}

function FrameLabel({
  base = false,
  label,
  range,
  width,
}: {
  base?: boolean;
  label: string;
  range: string;
  width: string;
}) {
  return (
    <div className="mb-1.5 flex h-5 items-center gap-2">
      <span
        className={`text-[11px] font-medium ${base ? "text-[var(--ed-text)]" : "text-[var(--ed-faint)]"}`}
      >
        {label}
      </span>
      <span className="font-mono text-[10px] text-[var(--ed-faint)]">
        {width}
      </span>
      <span className="truncate font-mono text-[10px] text-[var(--ed-faint)]/60 max-lg:hidden">
        {range}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1 max-lg:hidden">
        <span
          className={`flex size-5 items-center justify-center rounded-md ${
            base
              ? "bg-[var(--ed-accent-soft)] text-[var(--ed-accent)]"
              : "bg-[var(--ed-field)] text-[var(--ed-muted)]"
          }`}
        >
          <Icon name="pin" size={11} />
        </span>
        <span className="flex size-5 items-center justify-center rounded-md bg-[var(--ed-field)] text-[var(--ed-muted)]">
          <Icon name="trash" size={11} />
        </span>
        <span className="flex size-5 items-center justify-center rounded-md bg-[var(--ed-field)] text-[var(--ed-muted)]">
          <Icon name="plus" size={12} />
        </span>
      </span>
    </div>
  );
}

/**
 * The page inside a breakpoint frame. It is deliberately taller than the
 * canvas well so the canvas clips it, the way a real page does in the editor.
 */
function DesktopFrame({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative h-[600px] overflow-hidden bg-[#f1ede4] text-[#141117] shadow-2xl max-xl:h-[540px] max-md:h-[400px]">
      <div className="relative h-[44%] overflow-hidden">
        <div className="flex h-7 items-center justify-between border-b border-black/10 px-[4%] text-[8px] max-lg:text-[6px]">
          <strong className="tracking-[-.02em]">PAGIERA® STUDIO</strong>
          <span className="flex items-center gap-3 whitespace-nowrap max-lg:gap-2">
            <i>Work</i>
            <i>About</i>
            <b className="rounded-full bg-[#141117] px-2.5 py-1 font-medium text-white">
              Start a project
            </b>
          </span>
        </div>
        <div className="relative z-[2] px-[5%] pt-[7%]">
          <span className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.15em] max-lg:text-[6px]">
            <i className="size-1.5 rounded-full bg-[#5402e6]" />
            Independent creative studio
          </span>

          {/* Selection chrome, drawn on the heading itself so the outline hugs
              the element exactly as it does in the editor. */}
          <p className="relative mt-[4%] w-[72%] text-[clamp(17px,2.5vw,34px)] font-medium leading-[.86] tracking-[-.075em] outline outline-[1.5px] outline-[#5402e6]">
            MAKE THE WEB
            <span className="block text-[#5402e6]">FEEL ALIVE.</span>
            {[
              "-left-[5px] -top-[5px]",
              "-right-[5px] -top-[5px]",
              "-bottom-[5px] -left-[5px]",
              "-bottom-[5px] -right-[5px]",
            ].map((position) => (
              <i
                className={`absolute size-[10px] rounded-full border-[1.5px] border-[#5402e6] bg-white ${position}`}
                key={position}
              />
            ))}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap rounded bg-[#5402e6] px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
              760 × 148
            </span>
          </p>

          <div className="mt-[7%] flex items-end justify-between gap-4">
            <p className="max-w-[46%] text-[8px] leading-[1.7] text-black/55 max-lg:text-[6px]">
              Digital experiences with character, rhythm and motion—built for
              brands that refuse to blend in.
            </p>
            <span className="rounded-full border border-black/15 px-3 py-1.5 text-[8px] font-bold uppercase max-lg:hidden">
              View selected work ↗
            </span>
          </div>
        </div>
        <motion.div
          animate={
            reduced
              ? undefined
              : { opacity: [0.72, 1, 0.72], scale: [0.94, 1.08, 0.94] }
          }
          className="absolute -bottom-[10%] right-[6%] aspect-square w-[34%] rounded-full bg-[radial-gradient(circle,#a87aff_0%,#5402e6_32%,transparent_70%)] opacity-90 blur-md"
          transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.span
          animate={reduced ? undefined : { x: [0, 9, 0], y: [0, 6, 0] }}
          className="absolute bottom-[16%] left-[52%] z-[5] text-[#5402e6]"
          transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
        >
          <Icon name="cursor" size={17} />
        </motion.span>
      </div>

      <div className="flex h-[5%] items-center gap-[3%] overflow-hidden bg-[#141117] px-[4%] text-[7px] font-bold uppercase tracking-[.16em] whitespace-nowrap text-[#f1ede4]">
        <span>Brand systems</span>
        <span className="text-[#a87aff]">+</span>
        <span>Digital direction</span>
        <span className="text-[#a87aff]">+</span>
        <span>Interactive experiences</span>
        <span className="text-[#a87aff]">+</span>
        <span>Art direction</span>
      </div>

      <div className="px-[5%] pt-[6%]">
        <span className="text-[7px] font-bold uppercase tracking-[.18em] text-black/45">
          01 / Our point of view
        </span>
        <p className="mt-[3%] max-w-[86%] text-[clamp(11px,1.5vw,21px)] font-medium leading-[1.15] tracking-[-.05em]">
          Craft is a discipline, not a decoration.
        </p>
        <div className="mt-[6%] grid grid-cols-3 gap-[4%] text-[7px] leading-[1.9] text-black/50">
          <p>Strategy first, so every visual decision carries an argument.</p>
          <p>Systems over screens—components that survive the next campaign.</p>
          <p>Motion as meaning, never as ornament for its own sake.</p>
        </div>
      </div>
    </div>
  );
}

function MobileFrame() {
  return (
    <div className="relative h-[600px] overflow-hidden bg-[#f1ede4] text-[#141117] shadow-2xl max-xl:h-[540px] max-md:h-[400px]">
      <div className="relative h-[52%] overflow-hidden">
        <div className="flex h-5 items-center justify-between border-b border-black/10 px-[7%] text-[7px]">
          <strong className="tracking-[-.02em]">PAGIERA®</strong>
          <Icon name="menu" size={9} />
        </div>
        <div className="px-[7%] pt-[9%]">
          <span className="text-[6px] font-bold uppercase tracking-[.14em]">
            Independent creative studio
          </span>
          <p className="mt-[6%] text-[clamp(11px,1.5vw,20px)] font-medium leading-[.9] tracking-[-.07em]">
            MAKE THE WEB
            <span className="block text-[#5402e6]">FEEL ALIVE.</span>
          </p>
          <p className="mt-[7%] text-[6px] leading-[1.8] text-black/55">
            Digital experiences with character, rhythm and motion—built for
            brands that refuse to blend in.
          </p>
          <span className="mt-[8%] block w-fit rounded-full bg-[#141117] px-2.5 py-1 text-[6px] font-medium text-white">
            Start a project
          </span>
        </div>
        <div className="absolute -bottom-[8%] left-1/2 aspect-square w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#a87aff_0%,#5402e6_32%,transparent_70%)] opacity-90 blur-[6px]" />
      </div>

      <div className="flex h-[4%] items-center gap-[4%] overflow-hidden bg-[#141117] px-[7%] text-[6px] font-bold uppercase tracking-[.14em] whitespace-nowrap text-[#f1ede4]">
        <span>Brand systems</span>
        <span className="text-[#a87aff]">+</span>
        <span>Digital direction</span>
      </div>

      <div className="px-[7%] pt-[7%]">
        <span className="text-[6px] font-bold uppercase tracking-[.16em] text-black/45">
          01 / Our point of view
        </span>
        <p className="mt-[5%] text-[clamp(9px,1.1vw,15px)] font-medium leading-[1.15] tracking-[-.05em]">
          Craft is a discipline, not a decoration.
        </p>
        <p className="mt-[7%] text-[6px] leading-[1.9] text-black/50">
          Strategy first, so every visual decision carries an argument.
        </p>
      </div>
    </div>
  );
}

function EditorInspector({ reduced }: { reduced: boolean }) {
  return (
    <aside className="flex min-w-0 flex-col overflow-hidden border-l border-[var(--ed-border)] bg-[var(--ed-surface)] max-md:hidden">
      <div className="flex h-11 shrink-0 items-end gap-0.5 border-b border-[var(--ed-border)] px-2">
        {["Design", "Content", "Effects", "Actions"].map((tab) => (
          <span
            className={`relative flex-1 px-2 pb-3 pt-2 text-center text-[11px] font-medium ${
              tab === "Design"
                ? "text-[var(--ed-text)]"
                : "text-[var(--ed-muted)]"
            }`}
            key={tab}
          >
            {tab}
            {tab === "Design" && (
              <i className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--ed-accent)]" />
            )}
          </span>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold tracking-tight">
            Heading
          </span>
          <span className="font-mono text-[10px] text-[var(--ed-faint)]">
            ef8430
          </span>
        </div>
        <InspectorGroup title="Size">
          <InspectorRow label="W">
            <InspectorField value="Fill" />
            <InspectorSelect value="Fill" />
          </InspectorRow>
          <InspectorRow label="H">
            <InspectorField value="Hug" />
            <InspectorSelect value="Hug" />
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="Text" />
        <InspectorGroup title="Fill">
          <InspectorRow label="Background">
            <span className="flex h-8 flex-1 items-center gap-2 rounded-lg bg-[var(--ed-field)] px-2.5 text-[12px]">
              <i className="size-4 rounded border border-black/10 bg-[#141117]" />
              <span className="flex-1 text-right text-[var(--ed-muted)]">
                transparent
              </span>
            </span>
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="Spacing">
          <InspectorRow label="Padding">
            <InspectorField suffix="px" value="0" />
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="Effects">
          <InspectorRow label="Corner radius">
            <InspectorField suffix="px" value="0" />
          </InspectorRow>
          <InspectorRow label="Opacity">
            <span className="flex flex-1 items-center gap-2">
              <span className="h-1 flex-1 rounded-full bg-[var(--ed-field)]">
                <motion.i
                  animate={
                    reduced
                      ? { width: "100%" }
                      : { width: ["62%", "100%", "62%"] }
                  }
                  className="block h-full rounded-full bg-[var(--ed-accent)]"
                  transition={{
                    duration: 4.6,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </span>
              <span className="w-9 text-right text-[11px] tabular-nums text-[var(--ed-muted)]">
                100%
              </span>
            </span>
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="Composition" />
      </div>
    </aside>
  );
}

function InspectorGroup({
  children,
  title,
}: {
  children?: ReactNode;
  title: string;
}) {
  const open = Boolean(children);
  return (
    <div className="flex flex-col py-1.5">
      <span className="-ml-1 flex items-center gap-1.5 py-2 pl-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ed-muted)]">
        <Icon
          className={`shrink-0 text-[var(--ed-faint)] ${open ? "rotate-90" : ""}`}
          name="chevron"
          size={12}
        />
        {title}
      </span>
      {open && (
        <div className="flex flex-col gap-2 pb-3 pt-0.5">{children}</div>
      )}
    </div>
  );
}

function InspectorRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[70px] shrink-0 text-[11px] text-[var(--ed-muted)]">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function InspectorField({ suffix, value }: { suffix?: string; value: string }) {
  return (
    <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-[var(--ed-field)] px-2.5 text-[12px]">
      <span className="flex-1 truncate text-right tabular-nums text-[var(--ed-faint)]">
        {value}
      </span>
      {suffix && (
        <i className="text-[11px] not-italic text-[var(--ed-faint)]">
          {suffix}
        </i>
      )}
    </span>
  );
}

function InspectorSelect({ value }: { value: string }) {
  return (
    <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-[var(--ed-field)] px-2.5 text-[12px]">
      <span className="flex-1 truncate">{value}</span>
      <Icon
        className="shrink-0 rotate-90 text-[var(--ed-faint)]"
        name="chevron"
        size={12}
      />
    </span>
  );
}
