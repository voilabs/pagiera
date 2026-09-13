import { Reveal } from "@/components/reveal";
import { StudioPreview } from "@/components/studio-preview";
import { useI18n } from "@/lib/i18n";

export function StudioSection() {
  const { t } = useI18n();
  return (
    <section
      id="studio"
      className="relative mx-3 overflow-hidden rounded-[40px] bg-[#6a25f0] px-[max(24px,calc((100vw-1240px)/2))] py-24 text-white max-md:mx-2 max-md:px-5"
    >
      <Reveal
        as="p"
        className="text-sm font-medium text-white/75"
        distance={18}
      >
        {t(
          "A system that stays editable",
          "Her zaman düzenlenebilir bir sistem",
        )}
      </Reveal>
      <Reveal
        as="h2"
        className="mt-6 text-[clamp(40px,6vw,80px)] leading-[1.05] tracking-[-.06em]"
        delay={0.08}
      >
        {t("Change once.", "Bir kez değiştirin.")}
        <br />
        {t("Build on it everywhere.", "Her yerde kullanın.")}
      </Reveal>
      <Reveal
        as="p"
        className="mt-7 max-w-[660px] text-lg leading-8 text-white/80"
        delay={0.16}
        distance={20}
      >
        {t(
          "Keep components and linked layouts in Assets. Design shared navigation and footers once, then use a children placeholder for the content that makes each page different.",
          "Bileşenleri ve bağlantılı düzenleri Varlıklar bölümünde tutun. Ortak gezinme alanlarını ve altbilgileri bir kez tasarlayın; ardından her sayfaya özgü içerik için children yer tutucusunu kullanın.",
        )}
      </Reveal>
      <Reveal
        amount={0.15}
        className="mt-12"
        delay={0.22}
        distance={40}
        duration={0.8}
      >
        <StudioPreview assets />
      </Reveal>
    </section>
  );
}
