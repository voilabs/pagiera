import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";

/** The product floats inside the generated pixel landscape, never a screenshot. */
export function HeroSection() {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText("bun add pagiera");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }


  return (
    <section
      className="relative m-2 min-h-[calc(100vh-16px)] overflow-hidden rounded-[36px] bg-[#f8faf2] px-6 pt-[170px] text-[#11130f] max-md:m-1 max-md:min-h-[820px] max-md:rounded-[28px] max-md:px-4 max-md:pt-28"
      id="top"
    >
      <Image
        alt=""
        className="object-cover object-center"
        fill
        priority
        sizes="100vw"
        src="/pagiera-hero-landscape-purple.png"
      />
      <div className="pointer-events-none absolute inset-0 bg-white/[.04]" />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-[3] mx-auto max-w-[1000px] text-center"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="mt-8 text-[clamp(54px,7vw,96px)] font-semibold leading-[.9] tracking-[-0.075em] text-[#0d0f0b] max-md:mt-6 max-md:text-[clamp(48px,13vw,66px)]">
          Build visually.
          <span className="block">
            Ship with{" "}
            <em className="font-serif font-normal text-[#6a25f0]">
              confidence.
            </em>
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-[600px] text-[clamp(15px,1.35vw,18px)] leading-[1.65] tracking-[-0.015em] text-[#5f5a6b]">
          Design freeform, bind real data and publish responsive pages—without
          giving up ownership of the code underneath.
        </p>

        <div className="justify-center flex mt-3">
          <button
            className="flex cursor-pointer items-center gap-4 rounded-full border border-dashed border-black/5 bg-black/5 py-2 pr-2.5 pl-4 text-black"
            type="button"
            onClick={copyInstallCommand}
          >
            <code className="font-mono text-sm font-semibold tracking-[-0.025em]">
              bun add pagiera
            </code>
            <span className="flex items-center gap-1.5 rounded-full bg-black/10 px-2.5 py-1.5 text-[10px] font-semibold text-black">
              <Icon name="copy" size={15} /> {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-2.5 max-sm:mx-auto max-sm:w-full max-sm:max-w-[320px] max-sm:flex-col">
          <ButtonLink
            href="https://github.com/voilabs/pagiera"
            size="lg"
            variant="accent"
          >
            Start building <Icon name="arrow" size={16} />
          </ButtonLink>
          <ButtonLink href="/templates" size="lg" variant="secondary">
            Explore templates
          </ButtonLink>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-[3] mx-auto mt-14 h-[350px] bg-gradient-to-b from-black/20 to-white/20 p-3 backdrop-blur-xl w-[min(1040px,84%)] overflow-hidden rounded-t-[20px] max-md:mt-10 max-md:h-[260px] max-md:w-[96%]"
        initial={{ opacity: 0, y: 46 }}
        transition={{ delay: 0.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <EditorPreview reduced={Boolean(reduced)} />
      </motion.div>
    </section>
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

const RAIL_PANELS: IconName[] = ["frame", "layers", "grid", "image"];
const RAIL_TOOLS: IconName[] = ["brackets", "globe", "sparkles"];

const PAGES = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Journal", "/journal"],
  ["Categories", "/journal/tag/:tag"],
  ["Contact", "/contact"],
  ["Article", "/journal/:slug"],
] as const;

const BREADCRUMB = ["Hero", "Hero composition", "Hero copy", "Hero title"];

function EditorPreview({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="group relative overflow-hidden rounded-[13px] bg-[var(--ed-surface)] text-[var(--ed-text)] shadow-[0_65px_140px_rgba(55,35,88,.24),0_12px_34px_rgba(55,35,88,.12)]"
      style={EDITOR_CHROME}
    >
      <EditorHeader />
      <DocumentTabs />
      <div className="grid h-[610px] grid-cols-[48px_230px_minmax(0,1fr)_256px] bg-[var(--ed-canvas)] max-xl:h-[540px] max-xl:grid-cols-[46px_200px_minmax(0,1fr)_222px] max-lg:grid-cols-[44px_minmax(0,1fr)_208px] max-md:h-[420px] max-md:grid-cols-[40px_minmax(0,1fr)]">
        <EditorRail />
        <PagesPanel />
        <EditorCanvas reduced={reduced} />
        <EditorInspector reduced={reduced} />
      </div>
    </div>
  );
}

function EditorHeader() {
  return (
    <header className="grid h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-[var(--ed-border)] bg-[var(--ed-surface)] px-2.5">
      <div className="flex items-center gap-1.5">
        <span className="w-fit rounded-full px-2 py-1 text-[12px] font-semibold tracking-[-.02em]">
          Pagiera
        </span>
        <i className="h-5 w-px bg-[var(--ed-border)]" />
        <span className="flex size-7 items-center justify-center rounded-full bg-[var(--ed-subtle)] text-[var(--ed-muted)]">
          <Icon name="play" size={12} />
        </span>
        <span className="flex size-7 items-center justify-center rounded-full bg-[var(--ed-subtle)] text-[var(--ed-muted)]">
          <Icon name="pin" size={12} />
        </span>
      </div>
      <div className="flex h-8 items-center gap-1 rounded-full bg-[var(--ed-subtle)] p-0.5 text-[var(--ed-muted)] max-sm:hidden">
        <div className="flex items-center gap-0.5">
          <span className="flex size-6 items-center justify-center rounded-full">
            <Icon name="minus" size={12} />
          </span>
          <span className="w-9 text-center text-[10px] tabular-nums">71%</span>
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
          Republish
        </span>
        <span className="px-1.5 text-[10px] text-[var(--ed-muted)] max-xl:hidden">
          Unpublish
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

function DocumentTabs() {
  return (
    <div className="flex h-9 items-stretch border-b border-[var(--ed-border)] bg-[var(--ed-surface)]">
      <span className="relative flex min-w-[142px] items-center gap-2 border-r border-[var(--ed-border)] bg-[var(--ed-canvas)] px-3 text-[11px] font-medium">
        <Icon name="frame" size={12} />
        Home
        <i className="absolute inset-x-0 top-0 h-0.5 bg-[var(--ed-accent)]" />
      </span>
      <span className="grid w-9 place-items-center border-r border-[var(--ed-border)] text-[var(--ed-faint)]">
        <Icon name="plus" size={12} />
      </span>
    </div>
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
          <RailButton active={name === "frame"} icon={name} key={name} />
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
      className={`flex size-8 items-center justify-center rounded-full max-md:size-7 ${active ? "bg-[var(--ed-accent)] text-white" : "text-[var(--ed-muted)]"
        }`}
    >
      <Icon name={icon} size={15} />
    </span>
  );
}

function PagesPanel() {
  return (
    <aside className="flex min-w-0 flex-col overflow-hidden border-r border-[var(--ed-border)] bg-[var(--ed-surface)] max-lg:hidden">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ed-border)] px-3.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--ed-accent-soft)] text-[var(--ed-accent)]">
            <Icon name="frame" size={13} />
          </span>
          <span className="truncate text-[11px] font-semibold">Pages</span>
        </span>
        <Icon className="text-[var(--ed-faint)]" name="close" size={14} />
      </div>
      <div className="flex items-center justify-between px-3.5 pt-4 pb-2 text-[9px] font-bold tracking-[.14em] text-[var(--ed-faint)] uppercase">
        <span>Pages</span>
        <span className="flex items-center gap-2">
          {PAGES.length}
          <i className="grid size-6 place-items-center rounded-full bg-[var(--ed-field)] text-[var(--ed-muted)]">
            <Icon name="plus" size={11} />
          </i>
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-2">
        {PAGES.map(([name, path], index) => (
          <div
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${index === 0
              ? "bg-[var(--ed-accent)] text-white"
              : "text-[var(--ed-muted)]"
              }`}
            key={name}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-white/15" : "bg-[var(--ed-field)]"
                }`}
            >
              <Icon name="frame" size={12} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[11px] font-semibold">
                {name}
              </strong>
              <i className="block truncate text-[9px] not-italic opacity-65">
                {path}
              </i>
            </span>
          </div>
        ))}
      </div>
    </aside>
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
      <div className="flex h-full items-start justify-center px-5 pt-3 max-md:px-3 max-md:pt-3">
        <motion.div
          animate={reduced ? undefined : { y: [0, -3, 0] }}
          className="w-[94%] max-md:w-full"
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        >
          <FrameLabel base label="Desktop" range="1280+" width="1280" />
          <DesktopFrame reduced={reduced} />
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
          <Icon name="focus" size={14} />
        </span>
        <span className="rounded-md p-1.5">
          <span className="font-mono text-[10px]">1:1</span>
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
          className={`flex size-5 items-center justify-center rounded-md ${base
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

function EditorInspector({ reduced }: { reduced: boolean }) {
  return (
    <aside className="flex min-w-0 flex-col overflow-hidden border-l border-[var(--ed-border)] bg-[var(--ed-surface)] max-md:hidden">
      <div className="flex h-11 shrink-0 items-end gap-0.5 border-b border-[var(--ed-border)] px-2">
        {["Content", "Style", "Interact"].map((tab) => (
          <span
            className={`relative flex-1 px-2 pb-3 pt-2 text-center text-[11px] font-medium ${tab === "Content"
              ? "text-[var(--ed-text)]"
              : "text-[var(--ed-muted)]"
              }`}
            key={tab}
          >
            {tab}
            {tab === "Content" && (
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
            364bc6
          </span>
        </div>
        <span className="mt-2 grid h-8 place-items-center rounded-full border border-[var(--ed-border)] bg-[var(--ed-subtle)] text-[10px] font-medium text-[var(--ed-muted)]">
          Create component
        </span>
        <InspectorGroup title="Request result">
          <InspectorRow label="Source">
            <InspectorSelect value="None" />
          </InspectorRow>
          <p className="text-[9px] leading-4 text-[var(--ed-faint)]">
            Bind a request result directly, or repeat this layer for every item.
          </p>
        </InspectorGroup>
        <InspectorGroup title="Text">
          <InspectorRow label="Content">
            <motion.span
              animate={reduced ? undefined : { opacity: [0.72, 1, 0.72] }}
              className="flex min-h-16 flex-1 items-start rounded-xl bg-[var(--ed-field)] p-2.5 text-[11px] leading-5 text-[var(--ed-text)]"
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              Make the web feel alive.
            </motion.span>
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="Layer name">
          <InspectorRow label="Name">
            <InspectorField value="hero-title" />
          </InspectorRow>
        </InspectorGroup>
        <InspectorGroup title="HTML">
          <InspectorRow label="Tag">
            <InspectorSelect value="h1" />
          </InspectorRow>
        </InspectorGroup>
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
