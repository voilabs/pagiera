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
import { COMPARISONS, type Comparison, getComparison } from "@/lib/comparisons";
import {
  breadcrumbSchema,
  comparisonPageSchema,
  faqSchema,
} from "@/lib/structured-data";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });
type ComparePageProps = { comparison: Comparison; others: Comparison[] };

export const getStaticPaths = (() => ({
  fallback: false,
  paths: COMPARISONS.map((entry) => ({ params: { slug: entry.slug } })),
})) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const comparison = getComparison(String(params?.slug));
  if (!comparison) return { notFound: true };
  return {
    props: {
      comparison,
      others: COMPARISONS.filter((entry) => entry.slug !== comparison.slug),
    },
  };
}) satisfies GetStaticProps<ComparePageProps>;

export default function ComparePage({
  comparison,
  others,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const path = `/compare/${comparison.slug}`;
  const title = `Pagiera vs ${comparison.rival} — which visual builder fits your stack?`;
  // The meta description doubles as the answer-engine snippet, so it carries
  // the verdict's first sentence rather than a marketing line.
  const description = `${comparison.verdict.split(". ")[0]}. A side-by-side comparison of ownership, data binding, hosting and licensing.`;

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
            { name: "Home", path: "/" },
            { name: `Pagiera vs ${comparison.rival}`, path },
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
        eyebrow="No migration, no vendor account"
        secondaryHref="/templates"
        secondaryLabel="Explore templates"
        title={["Own the canvas.", "Own the output."]}
      />
    </div>
  );
}
