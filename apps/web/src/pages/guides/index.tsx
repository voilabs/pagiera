import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { GUIDES } from "@/lib/guides";
import { GUIDES_TR } from "@/lib/guides-tr";
import { localizedHref, useI18n } from "@/lib/i18n";
import { breadcrumbSchema, itemListPageSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "Short, answer-first guides for building with Pagiera: installing the editor in Next.js, binding API data, publishing safely, working with a coding agent and reusing layouts.";

export default function GuidesIndex() {
  const { locale, t } = useI18n();
  const entries = locale === "tr" ? GUIDES_TR : GUIDES;
  const description = t(
    DESCRIPTION,
    "Pagiera ile geliştirmek için kısa ve doğrudan yanıt veren rehberler: Next.js editör kurulumu, API verilerini bağlama, güvenli yayımlama, kodlama ajanıyla çalışma ve düzenleri yeniden kullanma.",
  );
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={description}
        jsonLd={[
          itemListPageSchema({
            description,
            items: entries.map((guide) => ({
              description: guide.description,
              name: guide.title,
              path: localizedHref(`/guides/${guide.slug}`, locale),
            })),
            name: t("Pagiera guides", "Pagiera rehberleri"),
            path: localizedHref("/guides", locale),
          }),
          breadcrumbSchema([
            { name: "Pagiera", path: localizedHref("/", locale) },
            {
              name: t("Guides", "Rehberler"),
              path: localizedHref("/guides", locale),
            },
          ]),
        ]}
        path="/guides"
        title={t(
          "Guides — building with Pagiera",
          "Rehberler — Pagiera ile geliştirme",
        )}
      />
      <SiteBar active="guides" />

      <div className="hub">
        <Reveal as="div" className="hub-head" distance={20} on="mount">
          <span className="docs-eyebrow">{t("Guides", "Rehberler")}</span>
          <h1>
            {t(
              "One question, one answer, one page.",
              "Bir soru, bir yanıt, bir sayfa.",
            )}
          </h1>
          <p>
            {t(
              "Every guide opens with the answer, then shows the shortest correct path to it. No preamble, no tour of features you did not ask about.",
              "Her rehber yanıtla başlar, ardından sizi sonuca ulaştıran en kısa doğru yolu gösterir. Uzun girişler veya sormadığınız özelliklerin tanıtımı yok.",
            )}
          </p>
        </Reveal>

        <div className="hub-list">
          {entries.map((guide, index) => (
            <Reveal
              as="article"
              className="hub-row"
              delay={index * 0.05}
              key={guide.slug}
            >
              <a href={localizedHref(`/guides/${guide.slug}`, locale)}>
                <span className="hub-row-meta">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <i className="hub-row-lead">{guide.category}</i>
                  <i>
                    {guide.minutes} {t("min read", "dk okuma")}
                  </i>
                </span>
                <span>
                  <h2>{guide.title}</h2>
                  <p className="hub-row-q">{guide.question}</p>
                  <p className="hub-row-a">{guide.answer}</p>
                </span>
                <span className="hub-row-arrow">
                  <Icon name="arrow" size={18} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal as="div" className="hub-aside" distance={20}>
          <div>
            <h2>
              {t(
                "Looking for the full reference?",
                "Tüm başvuru kaynaklarını mı arıyorsunuz?",
              )}
            </h2>
            <p>
              {t(
                "The documentation renders the package README and the coding-agent integration guide, synced from the official repository.",
                "Dokümantasyon, resmi depodan eşitlenen paket README dosyasını ve kodlama ajanı entegrasyon rehberini sunar.",
              )}
            </p>
          </div>
          <span>
            <a className="hub-link" href={localizedHref("/docs", locale)}>
              {t("Read the documentation →", "Dokümantasyonu okuyun →")}
            </a>
            <a className="hub-link" href={localizedHref("/faq", locale)}>
              {t("Browse the FAQ →", "Sık sorulan sorulara göz atın →")}
            </a>
          </span>
        </Reveal>
      </div>

      <ConversionFooter
        eyebrow={t("Guides are the short version", "Rehberler kısa anlatımdır")}
        secondaryHref={localizedHref("/docs", locale)}
        secondaryLabel={t("Read the documentation", "Dokümantasyonu okuyun")}
        title={[
          t("Learn it once.", "Bir kez öğrenin."),
          t("Then build for years.", "Yıllarca geliştirin."),
        ]}
      />
    </div>
  );
}
