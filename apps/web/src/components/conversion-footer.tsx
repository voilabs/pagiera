import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";

type ConversionFooterProps = {
  eyebrow?: string;
  title?: [string, string];
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ConversionFooter({
  eyebrow = "Your next site can start here",
  title = ["Build something", "only you would make."],
  secondaryHref = "/templates",
  secondaryLabel = "Explore templates",
}: ConversionFooterProps) {
  const shellRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ["start end", "end start"],
  });
  const skyY = useTransform(scrollYProgress, [0, 1], [-34, 34]);
  const cloudsY = useTransform(scrollYProgress, [0, 1], [-78, 78]);

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText("bun add pagiera");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const footerLink =
    "transition-colors duration-200 hover:text-[#5402e6] focus-visible:text-[#5402e6]";

  return (
    <section
      className="relative m-[18px] min-h-[1050px] overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#f7f8ff_0%,#eaf1ff_52%,#88aae4_100%)] text-[#13121a] max-lg:m-2.5 max-lg:rounded-[28px] max-sm:m-1.5 max-sm:min-h-[1180px] max-sm:rounded-3xl"
      id="start"
      ref={shellRef}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 -top-[90px] -bottom-[90px] z-0 opacity-45"
        style={prefersReducedMotion ? undefined : { y: skyY }}
      >
        <Image
          className="object-cover object-bottom"
          src="/sky.png"
          alt=""
          fill
          sizes="100vw"
        />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-x-0 -top-[90px] -bottom-[90px] z-[1] opacity-45"
        style={prefersReducedMotion ? undefined : { y: cloudsY }}
      >
        <Image
          className="object-cover object-bottom mix-blend-multiply"
          src="/clouds.png"
          alt=""
          fill
          sizes="100vw"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(250,250,255,.94)_0%,rgba(244,247,255,.7)_33%,transparent_71%),radial-gradient(circle_at_50%_54%,rgba(255,255,255,.72),transparent_34%)]" />

      <div className="relative z-[3] mx-auto flex min-h-[510px] w-[min(920px,calc(100%_-_40px))] flex-col items-center justify-center px-0 pt-[90px] pb-16 text-center max-sm:min-h-[520px] max-sm:pt-[70px]">
        <Image
          className="rounded-[14px]"
          src="/logo.png"
          alt="Pagiera"
          width={48}
          height={48}
        />
        <span className="mt-5 mb-[18px] text-[9px] font-bold tracking-[0.12em] text-[#655d71] uppercase">
          {eyebrow}
        </span>
        <h2 className="m-0 text-[clamp(54px,7.2vw,100px)] leading-[0.91] font-medium tracking-[-0.077em] max-sm:text-[clamp(49px,14.7vw,68px)]">
          {title[0]}
          <br />
          <em className="not-italic text-[#5402e6]">{title[1]}</em>
        </h2>
        <p className="mt-6.5 w-[min(610px,92%)] text-xs leading-7 text-[#635d6c] max-sm:text-[11px]">
          Install the complete visual builder, choose a starting point and shape
          it into something unmistakably yours.
        </p>
        <div className="mt-7 flex gap-2 max-sm:w-[min(330px,100%)] max-sm:flex-col">
          <ButtonLink size="lg" href="https://github.com/voilabs/pagiera">
            Get Pagiera <Icon name="arrow" size={16} />
          </ButtonLink>
          <ButtonLink size="lg" variant="secondary" href={secondaryHref}>
            {secondaryLabel}
          </ButtonLink>
        </div>
      </div>

      <footer className="relative z-[3] mx-auto grid min-h-[540px] max-w-[1340px] grid-cols-[minmax(220px,1fr)_minmax(330px,1.35fr)_minmax(220px,1fr)] items-center gap-[52px] overflow-hidden bg-transparent px-12 pt-10 text-xs text-[#1c202b] before:hidden after:hidden max-lg:min-h-[570px] max-lg:grid-cols-2 max-lg:gap-x-8 max-lg:px-7 max-sm:min-h-[660px] max-sm:items-start max-sm:gap-x-5 max-sm:px-5 max-sm:pt-6">
        <div className="self-center">
          <div className="mb-[30px] flex gap-2.5">
            <SocialLink
              href="https://github.com/voilabs/pagiera"
              label="Pagiera on GitHub"
              icon="code"
            />
            <SocialLink
              href="https://www.npmjs.com/package/pagiera"
              label="Pagiera on npm"
              icon="brackets"
            />
            <SocialLink
              href="https://pagiera.com"
              label="Pagiera website"
              icon="globe"
            />
          </div>
          <a
            className={`${footerLink} mb-[22px] inline-block text-[17px] font-semibold tracking-[-0.025em] max-sm:text-sm`}
            href="mailto:hello@voilabs.com"
          >
            hello@voilabs.com
          </a>
          <p className="m-0 text-xs leading-5 text-[#1e232f]/65 max-sm:text-[9px]">
            Open source visual building.
            <br />
            Designed for the expressive web.
          </p>
        </div>

        <div className="flex items-center justify-center max-lg:col-span-2 max-lg:row-start-1 max-lg:mx-auto max-lg:w-full">
          <button
            className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-[#1e1827]/35 bg-white/40 py-2 pr-2.5 pl-4 text-[#17141b]"
            type="button"
            onClick={copyInstallCommand}
          >
            <code className="font-mono text-sm font-semibold tracking-[-0.025em]">
              bun add pagiera
            </code>
            <span className="flex items-center gap-1.5 rounded-md bg-[#17141b] px-2.5 py-1.5 text-[10px] font-semibold text-white">
              <Icon name="copy" size={15} /> {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>

        <nav
          className="grid justify-items-end gap-[18px] text-[17px] font-semibold tracking-[-0.025em] max-sm:gap-3.5 max-sm:text-sm"
          aria-label="Footer navigation"
        >
          <a className={footerLink} href="/#features">
            Features
          </a>
          <a className={footerLink} href="/#workflow">
            How it works
          </a>
          <a className={footerLink} href="/templates">
            Templates
          </a>
          <a className={footerLink} href="https://github.com/voilabs/pagiera">
            GitHub
          </a>
        </nav>

        <div className="col-span-full grid w-full grid-cols-3 items-center text-[11px] text-[#1b212d]/60 max-sm:grid-cols-2">
          <span>© 2026 Pagiera</span>
          <a
            className={`${footerLink} justify-self-center underline underline-offset-3 max-sm:hidden`}
            href="https://voilabs.com"
          >
            voilabs.com
          </a>
          <div className="flex justify-end gap-4 max-sm:gap-2.5">
            <a
              className={`${footerLink} underline underline-offset-3`}
              href="https://github.com/voilabs/pagiera/blob/main/LICENSE"
            >
              MIT License
            </a>
            <a
              className={`${footerLink} underline underline-offset-3`}
              href="https://github.com/voilabs/pagiera"
            >
              Source code
            </a>
          </div>
        </div>

        <div
          className="pointer-events-none col-span-full w-full bg-[linear-gradient(180deg,rgba(88,89,98,.48)_0%,rgba(88,89,98,.2)_48%,rgba(88,89,98,0)_100%)] bg-clip-text text-center text-[clamp(88px,17vw,268px)] leading-[0.72] font-extrabold tracking-[-0.085em] whitespace-nowrap text-transparent select-none max-sm:text-[22vw]"
          aria-hidden="true"
        >
          PAGIERA
        </div>
      </footer>
    </section>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "code" | "brackets" | "globe";
}) {
  return (
    <a
      className="grid size-11 place-items-center rounded-full border border-[#10141d]/15 transition-colors hover:bg-[#17141b] hover:text-white"
      href={href}
      aria-label={label}
    >
      <Icon name={icon} size={19} />
    </a>
  );
}
