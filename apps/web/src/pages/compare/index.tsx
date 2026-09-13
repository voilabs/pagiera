import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { COMPARISONS } from "@/lib/comparisons";
import { COMPARISONS_TR } from "@/lib/comparisons-tr";
import { localizedHref, useI18n } from "@/lib/i18n";
import { breadcrumbSchema, itemListPageSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "How Pagiera compares to Webflow, Framer, Figma and Builder.io — who owns the output, where the editor runs, and which tool each job actually calls for.";

export default function CompareIndex() {
  const { locale, t } = useI18n();
  const entries = locale === "tr" ? COMPARISONS_TR : COMPARISONS;
  const description = t(
    DESCRIPTION,
    "Pagiera ile Webflow, Framer, Figma ve Builder.io karşılaştırması: çıktı kime ait, editör nerede çalışıyor ve hangi iş için hangi araç uygun?",
  );
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={description}
        jsonLd={[
          itemListPageSchema({
            description,
            items: entries.map((entry) => ({
              description: entry.verdict,
              name: t(`Pagiera vs ${entry.rival}`, `Pagiera ve ${entry.rival}`),
              path: localizedHref(`/compare/${entry.slug}`, locale),
            })),
            name: t("Pagiera comparisons", "Pagiera karşılaştırmaları"),
            path: localizedHref("/compare", locale),
          }),
          breadcrumbSchema([
            { name: "Pagiera", path: localizedHref("/", locale) },
            {
              name: t("Compare", "Karşılaştır"),
              path: localizedHref("/compare", locale),
            },
          ]),
        ]}
        path="/compare"
        title={t(
          "Pagiera compared — Webflow, Framer, Figma and Builder.io",
          "Pagiera karşılaştırması — Webflow, Framer, Figma ve Builder.io",
        )}
      />
      <SiteBar active="compare" />

      <div className="hub">
        <Reveal as="div" className="hub-head" distance={20} on="mount">
          <span className="docs-eyebrow">{t("Compare", "Karşılaştır")}</span>
          <h1>
            {t(
              "The honest version of “which one should I use?”",
              "“Hangisini kullanmalıyım?” sorusuna dürüst bir yanıt",
            )}
          </h1>
          <p>
            {t(
              "Every comparison leads with a verdict, including the cases where the other tool is the right answer. Pagiera is a visual builder that lives inside your own React and Next.js application — that single fact decides most of these questions.",
              "Her karşılaştırma, diğer aracın daha uygun olduğu durumlar da dahil olmak üzere bir sonuçla başlar. Pagiera, kendi React ve Next.js uygulamanızın içinde çalışan görsel bir oluşturucudur; bu tek özellik soruların çoğunun yanıtını belirler.",
            )}
          </p>
        </Reveal>

        {/* The one distinction that survives every competitor's next release. */}
        <Reveal as="div" className="hub-callout" distance={18}>
          <p>
            <strong>{t("The short answer.", "Kısa yanıt.")}</strong>{" "}
            {t(
              "Choose Pagiera when the editor has to run inside your product, behind your auth, reading the same APIs your app already uses, with the page source in your repository. Choose a hosted tool when the site is separate from your product and someone else should run the infrastructure.",
              "Editörün ürününüzün içinde, kendi kimlik doğrulamanızla ve uygulamanızın API'lerini kullanarak çalışması, sayfa kaynağının da deponuzda kalması gerekiyorsa Pagiera'yı seçin. Site ürününüzden bağımsızsa ve altyapıyı başkası yönetecekse barındırılan bir araç seçin.",
            )}
          </p>
        </Reveal>

        <div className="hub-list">
          {entries.map((entry, index) => (
            <Reveal
              as="article"
              className="hub-row"
              delay={index * 0.05}
              key={entry.slug}
            >
              <a href={localizedHref(`/compare/${entry.slug}`, locale)}>
                <span className="hub-row-meta">
                  <i className="hub-row-strong">{entry.rival}</i>
                  <i className="hub-row-lead">
                    {t("Comparison", "Karşılaştırma")} {index + 1}
                  </i>
                </span>
                <span>
                  <h2>{entry.headline}</h2>
                  <p className="hub-row-q">{entry.rivalTagline}</p>
                  <p className="hub-row-a">{entry.verdict}</p>
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
                "Rather judge it yourself?",
                "Kendiniz değerlendirmek ister misiniz?",
              )}
            </h2>
            <p>
              {t(
                "The package is MIT-licensed and the templates are open. Install it and see how far it gets before you read another comparison.",
                "Paket MIT lisanslıdır ve şablonlar açıktır. Başka bir karşılaştırma okumadan önce kurun ve neler yapabildiğinizi görün.",
              )}
            </p>
          </div>
          <span>
            <a className="hub-link" href={localizedHref("/docs", locale)}>
              {t("Read the documentation →", "Dokümantasyonu okuyun →")}
            </a>
            <a className="hub-link" href={localizedHref("/templates", locale)}>
              {t("Explore templates →", "Şablonları keşfedin →")}
            </a>
          </span>
        </Reveal>
      </div>

      <ConversionFooter
        eyebrow={t(
          "No migration, no vendor account",
          "Taşıma yok, sağlayıcı hesabı yok",
        )}
        secondaryHref={localizedHref("/templates", locale)}
        secondaryLabel={t("Explore templates", "Şablonları keşfedin")}
        title={[
          t("Own the canvas.", "Tuval sizin olsun."),
          t("Own the output.", "Çıktı sizin olsun."),
        ]}
      />
    </div>
  );
}
