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
import { COMPARISONS } from "@/lib/comparisons";
import { GUIDES } from "@/lib/guides";
import { localizedHref, useI18n } from "@/lib/i18n";

type ConversionFooterProps = {
  eyebrow?: string;
  title?: [string, string];
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ConversionFooter({
  eyebrow,
  title,
  secondaryHref = "/templates",
  secondaryLabel,
}: ConversionFooterProps) {
  const { locale, t } = useI18n();
  const heading = title ?? [
    t("Build something", "Bir şey oluşturun,"),
    t("only you would make.", "yalnızca size özgü."),
  ];
  const guideLabels: Record<string, string> = {
    "Next.js setup": t("Next.js setup", "Next.js kurulumu"),
    "API data binding": t("API data binding", "API veri bağlama"),
    "Preview & publish": t("Preview & publish", "Önizleme ve yayınlama"),
    "Coding agents": t("Coding agents", "Kodlama ajanları"),
    "Layouts & components": t("Layouts & components", "Düzenler ve bileşenler"),
    "Pagiera as a CMS": t("Pagiera as a CMS", "CMS olarak Pagiera"),
  };
  const shellRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ["start end", "end start"],
  });
  const skyY = useTransform(scrollYProgress, [0, 1], [-34, 34]);

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
    "text-[15px] font-medium whitespace-nowrap text-white/80 transition-colors duration-200 hover:text-white focus-visible:text-white max-sm:text-sm";

  return (
    <section
      className="relative m-[18px] min-h-[1050px] overflow-hidden rounded-[36px] text-white max-lg:m-2.5 max-lg:rounded-[28px] max-sm:m-1.5 max-sm:min-h-[1180px] max-sm:rounded-3xl"
      id="start"
      ref={shellRef}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 -top-[70px] -bottom-[70px] z-0 opacity-75"
        style={prefersReducedMotion ? undefined : { y: skyY }}
      >
        <Image
          className="object-cover object-center [image-rendering:auto]"
          src="/footer-pixel-field.png"
          alt=""
          fill
          sizes="100vw"
        />
      </motion.div>
      {/* Dark end to end so the section reads as a continuation of the page:
          the pixel field only shows through as a purple bloom behind the CTA. */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(13,9,21,.94)_0%,rgba(13,9,21,.66)_16%,rgba(30,12,66,.5)_38%,rgba(15,7,34,.78)_62%,rgba(11,5,26,.9)_100%),radial-gradient(circle_at_50%_28%,rgba(106,37,240,.34),transparent_46%)]" />
      {/* White text over the raw pixel field is unreadable. The band is sized
          in pixels rather than a percentage—the CTA block above it changes
          height—and the mask finishes fading in before the links begin. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[680px] bg-gradient-to-t from-[#080808]/80 [mask-image:linear-gradient(180deg,transparent,black_11%)] max-lg:h-[720px] max-sm:h-[820px]" />

      <div className="relative z-[3] mx-auto flex min-h-[510px] w-[min(920px,calc(100%_-_40px))] flex-col items-center justify-center px-0 pt-[90px] pb-16 text-center max-sm:min-h-[520px] max-sm:pt-[70px]">
        <Image
          className="rounded-[14px]"
          src="/logo.png"
          alt="Pagiera"
          width={48}
          height={48}
        />
        <span className="mt-5 mb-[18px] text-[9px] font-bold tracking-[0.12em] text-white/45 uppercase">
          {eyebrow ??
            t(
              "Your next site can start here",
              "Bir sonraki siteniz burada başlayabilir",
            )}
        </span>
        <h2 className="m-0 text-[clamp(54px,7.2vw,100px)] leading-[0.91] font-medium tracking-[-0.077em] max-sm:text-[clamp(49px,14.7vw,68px)]">
          {heading[0]}
          <br />
          <em className="font-serif font-normal text-[#939393]">
            {heading[1]}
          </em>
        </h2>
        <p className="mt-6.5 w-[min(610px,92%)] text-xs leading-7 text-white/55 max-sm:text-[11px]">
          {t(
            "Install the complete visual builder, choose a starting point and shape it into something unmistakably yours.",
            "Eksiksiz görsel oluşturucuyu kurun, bir başlangıç noktası seçin ve onu tamamen size özgü bir tasarıma dönüştürün.",
          )}
        </p>
        <div className="mt-7 flex gap-2 max-sm:w-[min(330px,100%)] max-sm:flex-col">
          <ButtonLink
            size="lg"
            variant="accent"
            href="https://github.com/voilabs/pagiera"
          >
            {t("Get Pagiera", "Pagiera'yı edinin")}{" "}
            <Icon name="arrow" size={16} />
          </ButtonLink>
          <ButtonLink size="lg" variant="secondary" href={secondaryHref}>
            {secondaryLabel ?? t("Explore templates", "Şablonları keşfedin")}
          </ButtonLink>
        </div>
      </div>

      <footer className="relative z-[3] mx-auto grid min-h-[540px] max-w-[1340px] grid-cols-[minmax(220px,1fr)_minmax(330px,1.35fr)_minmax(220px,1fr)] items-center gap-[52px] overflow-hidden bg-transparent px-12 pt-10 text-xs text-white before:hidden after:hidden max-lg:min-h-[570px] max-lg:grid-cols-2 max-lg:gap-x-8 max-lg:px-7 max-sm:min-h-[660px] max-sm:items-start max-sm:gap-x-5 max-sm:px-5 max-sm:pt-6">
        <div className="self-center">
          <div className="mb-[30px] flex gap-2.5">
            <SocialLink
              href="https://github.com/voilabs/pagiera"
              label={t("Pagiera on GitHub", "GitHub'da Pagiera")}
              icon="code"
            />
            <SocialLink
              href="https://www.npmjs.com/package/pagiera"
              label={t("Pagiera on npm", "npm'de Pagiera")}
              icon="brackets"
            />
            <SocialLink
              href="https://pagiera.com"
              label={t("Pagiera website", "Pagiera web sitesi")}
              icon="globe"
            />
          </div>
          <a
            className={`${footerLink} mb-[22px] inline-block text-[17px] font-semibold tracking-[-0.025em] max-sm:text-sm`}
            href="mailto:hello@voilabs.com"
          >
            hello@voilabs.com
          </a>
          <p className="m-0 text-xs leading-5 text-white/70 max-sm:text-[10px]">
            {t("Open source visual building.", "Açık kaynak görsel oluşturma.")}
            <br />
            {t(
              "Designed for the expressive web.",
              "Kendini ifade eden web için tasarlandı.",
            )}
          </p>
        </div>

        <div className="flex items-center justify-center max-lg:col-span-2 max-lg:row-start-1 max-lg:mx-auto max-lg:w-full">
          <button
            className="flex cursor-pointer items-center gap-4 rounded-full border border-dashed border-white/5 bg-white/5 py-2 pr-2.5 pl-4 text-white"
            type="button"
            onClick={copyInstallCommand}
          >
            <code className="font-mono text-sm font-semibold tracking-[-0.025em]">
              bun add pagiera
            </code>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white">
              <Icon name="copy" size={15} />{" "}
              {copied ? t("Copied", "Kopyalandı") : t("Copy", "Kopyala")}
            </span>
          </button>
        </div>

        {/* Guides and comparisons each have a hub page now, so this column
            links the hubs and lets them carry their own detail pages. The
            guide list stays here because it is the shortest crawl path in. */}
        <nav
          aria-label={t("Footer navigation", "Altbilgi gezinmesi")}
          className="grid grid-cols-2 gap-x-10 gap-y-5 justify-self-end text-right max-sm:col-span-2 max-sm:mt-2 max-sm:w-full max-sm:justify-self-start max-sm:gap-x-8 max-sm:text-left"
        >
          <div className="grid content-start gap-3.5">
            <FooterHeading>{t("Product", "Ürün")}</FooterHeading>
            <a
              className={footerLink}
              href={localizedHref("/#features", locale)}
            >
              {t("Features", "Özellikler")}
            </a>
            <a
              className={footerLink}
              href={localizedHref("/#workflow", locale)}
            >
              {t("How it works", "Nasıl çalışır")}
            </a>
            <a
              className={footerLink}
              href={localizedHref("/#capabilities", locale)}
            >
              {t("What's inside", "İçinde neler var")}
            </a>
            <a
              className={footerLink}
              href={localizedHref("/templates", locale)}
            >
              {t("Templates", "Şablonlar")}
            </a>
            <a className={footerLink} href="https://github.com/voilabs/pagiera">
              GitHub
            </a>
          </div>
          <div className="grid content-start gap-3.5">
            <FooterHeading>{t("Learn", "Öğrenin")}</FooterHeading>
            <a className={footerLink} href={localizedHref("/docs", locale)}>
              {t("Documentation", "Belgeler")}
            </a>
            <a
              className={footerLink}
              href={localizedHref("/docs/agents", locale)}
            >
              {t("For coding agents", "Kodlama ajanları için")}
            </a>
            {GUIDES.map((guide) => (
              <a
                className={footerLink}
                href={localizedHref(`/guides/${guide.slug}`, locale)}
                key={guide.slug}
              >
                {guideLabels[guide.navLabel] ?? guide.navLabel}
              </a>
            ))}
            <a className={footerLink} href={localizedHref("/faq", locale)}>
              {t("FAQ", "Sık sorulan sorular")}
            </a>
            <a className={footerLink} href={localizedHref("/compare", locale)}>
              {t("Compare", "Karşılaştır")} ({COMPARISONS.length})
            </a>
          </div>
        </nav>

        <div className="col-span-full grid w-full grid-cols-3 items-center text-[11px] text-white/70 max-sm:grid-cols-2">
          <span>© {new Date().getFullYear()} Pagiera</span>
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
              {t("MIT License", "MIT Lisansı")}
            </a>
            <a
              className={`${footerLink} underline underline-offset-3`}
              href="https://github.com/voilabs/pagiera"
            >
              {t("Source code", "Kaynak kodu")}
            </a>
          </div>
        </div>

        <div
          className="pointer-events-none col-span-full w-full bg-[linear-gradient(180deg,rgba(255,255,255,.55)_0%,rgba(255,255,255,.2)_48%,rgba(255,255,255,0)_100%)] bg-clip-text text-center text-[clamp(88px,17vw,268px)] leading-[0.72] font-extrabold tracking-[-0.085em] whitespace-nowrap text-transparent select-none max-sm:text-[22vw]"
          aria-hidden="true"
        >
          PAGIERA
        </div>
      </footer>
    </section>
  );
}

function FooterHeading({ children }: { children: string }) {
  return (
    <span className="text-[9px] font-bold tracking-[.14em] text-white/50 uppercase">
      {children}
    </span>
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
      className="grid size-11 place-items-center rounded-full border border-white/25 bg-white/[.08] backdrop-blur-sm transition-colors hover:bg-white hover:text-[#6a25f0]"
      href={href}
      aria-label={label}
    >
      <Icon name={icon} size={19} />
    </a>
  );
}
