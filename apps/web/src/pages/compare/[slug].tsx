import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import { Manrope } from "next/font/google";
import { ComparisonView } from "@/components/comparison-view";
import { ConversionFooter } from "@/components/conversion-footer";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { COMPARISONS, type Comparison } from "@/lib/comparisons";
import { COMPARISONS_TR } from "@/lib/comparisons-tr";
import { localizedHref, useI18n } from "@/lib/i18n";
import {
  breadcrumbSchema,
  comparisonPageSchema,
  faqSchema,
} from "@/lib/structured-data";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });
type ComparePageProps = { comparison: Comparison; others: Comparison[] };

export const getStaticPaths = (() => ({
  fallback: false,
  paths: COMPARISONS.flatMap((entry) =>
    ["en", "tr"].map((locale) => ({ params: { slug: entry.slug }, locale })),
  ),
})) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params, locale }) => {
  const comparisons = locale === "tr" ? COMPARISONS_TR : COMPARISONS;
  const comparison = comparisons.find(
    (entry) => entry.slug === String(params?.slug),
  );
  if (!comparison) return { notFound: true };
  return {
    props: {
      comparison,
      others: comparisons.filter((entry) => entry.slug !== comparison.slug),
    },
  };
}) satisfies GetStaticProps<ComparePageProps>;

export default function ComparePage({
  comparison,
  others,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { locale, t } = useI18n();
  const path = localizedHref(`/compare/${comparison.slug}`, locale);
  const title = t(
    `Pagiera vs ${comparison.rival} — which visual builder fits your stack?`,
    `Pagiera ve ${comparison.rival} — teknoloji yığınınıza hangi görsel oluşturucu uygun?`,
  );
  // The meta description doubles as the answer-engine snippet, so it carries
  // the verdict's first sentence rather than a marketing line.
  const description = `${comparison.verdict.split(". ")[0]}. ${t("A side-by-side comparison of ownership, data binding, hosting and licensing.", "Sahiplik, veri bağlama, barındırma ve lisanslamanın yan yana karşılaştırması.")}`;

  return (
    <div
      className={`${manrope.variable} min-w-80 overflow-clip bg-[#0b0b0b] font-sans text-[#f5f5f5]`}
    >
      <Seo
        description={description}
        jsonLd={[
          comparisonPageSchema({
            description,
            path,
            rival: comparison.rival,
            title,
          }),
          faqSchema(comparison.faq),
          breadcrumbSchema([
            { name: t("Home", "Ana sayfa"), path: localizedHref("/", locale) },
            {
              name: t(
                `Pagiera vs ${comparison.rival}`,
                `Pagiera ve ${comparison.rival}`,
              ),
              path,
            },
          ]),
        ]}
        path={path}
        title={title}
      />
      <SiteBar active="compare" />
      <main>
        <ComparisonView comparison={comparison} others={others} />
      </main>
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
