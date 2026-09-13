import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { StudioPreview } from "@/components/studio-preview";
import { ButtonLink } from "@/components/ui/button";
import { localizedHref, useI18n } from "@/lib/i18n";

export function HeroSection() {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const shellRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ["start start", "end start"],
  });
  /** The backdrop drifts well behind the copy, so the hero gains real depth. */
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  async function copy() {
    try {
      await navigator.clipboard.writeText("bun add pagiera");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section
      id="top"
      ref={shellRef}
      className="relative m-2 overflow-hidden rounded-[36px] bg-[#f8faf2] px-6 pt-24 text-[#11130f] max-md:m-1 max-md:px-4 max-md:pt-16"
    >
      <motion.div
        className="absolute inset-x-0 -top-32 -bottom-32 origin-top"
        style={
          prefersReducedMotion
            ? undefined
            : { scale: backdropScale, y: backdropY }
        }
      >
        <Image
          alt=""
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/pagiera-hero-landscape-purple.png"
        />
      </motion.div>
      <div className="relative mx-auto max-w-[1000px] text-center">
        <Reveal as="div" distance={22} duration={0.75} on="mount">
          <h1 className="text-[clamp(48px,7vw,96px)] font-semibold leading-[.98] tracking-[-.065em]">
            {t("Build visually.", "Görsel olarak oluşturun.")}
            <span className="block">
              {t("Ship with", "Yayınlayın,")}{" "}
              <em className="font-serif font-normal text-[#6a25f0]">
                {t("confidence.", "güvenle.")}
              </em>
            </span>
          </h1>
        </Reveal>
        <Reveal
          as="p"
          className="mx-auto mt-7 max-w-[600px] text-lg leading-relaxed text-[#5c5c5c]"
          delay={0.1}
          distance={18}
          on="mount"
        >
          {t(
            "The open-source website builder for React and Next.js. Design visually, reuse layouts and publish responsive pages inside your own application.",
            "React ve Next.js için açık kaynak web sitesi oluşturucu. Görsel olarak tasarlayın, düzenleri yeniden kullanın ve kendi uygulamanızda tüm ekranlara uyumlu sayfalar yayınlayın.",
          )}
        </Reveal>
        <Reveal as="div" delay={0.18} distance={16} on="mount">
          <button
            onClick={copy}
            type="button"
            className="mx-auto mt-5 flex items-center gap-4 rounded-full bg-black/5 px-5 py-3 text-sm transition-colors hover:bg-black/[.08]"
          >
            <code>bun add pagiera</code>
            <Icon name="copy" size={15} />
            <span aria-live="polite">
              {copied ? t("Copied", "Kopyalandı") : t("Copy", "Kopyala")}
            </span>
          </button>
        </Reveal>
        <Reveal
          as="div"
          className="mt-5 flex flex-wrap justify-center gap-3"
          delay={0.26}
          distance={16}
          on="mount"
        >
          <ButtonLink
            href={localizedHref("/docs", locale)}
            size="lg"
            variant="accent"
          >
            {t("Start building", "Oluşturmaya başlayın")}{" "}
            <Icon name="arrow" size={16} />
          </ButtonLink>
          <ButtonLink
            href={localizedHref("/templates", locale)}
            size="lg"
            variant="secondary"
          >
            {t("Explore templates", "Şablonları keşfedin")}
          </ButtonLink>
        </Reveal>
      </div>
      {/* Only the top half of the editor shows: it rises out of the hero edge
          rather than sitting inside it as a finished screenshot. */}
      <div className="relative mx-auto mt-14 max-w-[1240px]">
        <Reveal
          as="div"
          className="overflow-hidden rounded-t-[20px] shadow-[0_-10px_80px_rgba(32,10,72,.22)]"
          delay={0.34}
          distance={44}
          duration={0.9}
          on="mount"
        >
          <StudioPreview crop />
        </Reveal>
      </div>
    </section>
  );
}
