import { Reveal } from "@/components/reveal";
import { StudioPreview } from "@/components/studio-preview";
import { useI18n } from "@/lib/i18n";

export function FeaturesSection() {
  const { t } = useI18n();
  const features = [
    [
      t("A canvas, not a cage", "Sınır koymayan bir tuval"),
      t(
        "Arrange artboards, tune responsive layouts and keep selection handles outside your content.",
        "Çalışma yüzeylerini düzenleyin, ekranlara uyumlu düzenleri ayarlayın ve seçim tutamaçlarını içeriğinizin dışında tutun.",
      ),
    ],
    [
      t("One connected workspace", "Birbirine bağlı tek çalışma alanı"),
      t(
        "Move between pages, components and settings with document tabs attached to the canvas.",
        "Tuvale bağlı belge sekmeleriyle sayfalar, bileşenler ve ayarlar arasında geçiş yapın.",
      ),
    ],
    [
      t("Control in context", "İhtiyacınız olan yerde kontrol"),
      t(
        "Adjust typography, layout and effects, or review a targeted AI change before applying it.",
        "Tipografiyi, düzeni ve efektleri ayarlayın veya hedefli bir yapay zekâ değişikliğini uygulamadan önce inceleyin.",
      ),
    ],
  ] as const;

  return (
    <section
      id="features"
      className="bg-[#0b0b0b] px-[max(24px,calc((100vw-1240px)/2))] py-28 text-white max-md:py-20"
    >
      <Reveal as="p" className="product-eyebrow" distance={18}>
        {t("The visual layer, rebuilt", "Görsel katman, yeniden tasarlandı")}
      </Reveal>
      <Reveal
        as="h2"
        className="mt-6 max-w-[900px] text-[clamp(40px,6vw,80px)] leading-[1.05] tracking-[-.06em]"
        delay={0.08}
      >
        {t("Room to design.", "Tasarım için alan.")}
        <br />
        {t("Structure to ship.", "Yayınlamak için yapı.")}
      </Reveal>
      <Reveal
        as="p"
        className="mt-7 max-w-[670px] text-lg leading-8 text-white/60"
        delay={0.16}
        distance={20}
      >
        {t(
          "A focused canvas in the middle. Layers and assets on the left. Style and Luma on the right. Everything you need stays close without getting in the way of the page.",
          "Ortada odaklanmış bir tuval. Solda katmanlar ve varlıklar. Sağda Stil ve Luma. İhtiyacınız olan her şey, sayfanın önüne geçmeden elinizin altında.",
        )}
      </Reveal>
      <div className="my-12 grid grid-cols-3 gap-8 max-md:grid-cols-1">
        {features.map(([title, text], index) => (
          <Reveal as="article" delay={index * 0.09} key={title}>
            <h3 className="mb-3 text-xl font-medium">{title}</h3>
            <p className="text-base leading-7 text-white/60">{text}</p>
          </Reveal>
        ))}
      </div>
      <Reveal amount={0.15} distance={40} duration={0.8}>
        <StudioPreview />
      </Reveal>
    </section>
  );
}
