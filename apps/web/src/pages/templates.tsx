import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { TemplateStore } from "@/components/template-store";
import { localizedHref, useI18n } from "@/lib/i18n";
import {
  breadcrumbSchema,
  templateCollectionSchema,
} from "@/lib/structured-data";
import {
  getTemplateCatalog,
  type TemplateCatalogItem,
} from "@/lib/template-catalog";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });
type TemplatesProps = { templates: TemplateCatalogItem[] };

export const getStaticProps = (async () => ({
  props: { templates: await getTemplateCatalog() },
  revalidate: 300,
})) satisfies GetStaticProps<TemplatesProps>;

export default function TemplatesPage({
  templates,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { locale, t } = useI18n();
  return (
    <div
      className={`${manrope.variable} min-w-80 overflow-clip bg-[#0b0b0b] font-sans text-[#f5f5f5]`}
    >
      <Seo
        description={t(
          `Explore ${templates.length} responsive Pagiera templates—complete multi-page systems you can preview as real rendered websites, then open and edit on the canvas.`,
          `${templates.length} duyarlı Pagiera şablonunu keşfedin. Eksiksiz, çok sayfalı sistemleri gerçek web siteleri olarak önizleyin, ardından tuvalde açıp düzenleyin.`,
        )}
        jsonLd={[
          templateCollectionSchema(templates),
          breadcrumbSchema([
            { name: t("Home", "Ana sayfa"), path: localizedHref("/", locale) },
            {
              name: t("Templates", "Şablonlar"),
              path: localizedHref("/templates", locale),
            },
          ]),
        ]}
        path="/templates"
        title={t(
          "Templates — responsive starting points for Pagiera",
          "Şablonlar — Pagiera için duyarlı başlangıç noktaları",
        )}
      />
      <SiteBar active="templates" />
      <main>
        <TemplateStore templates={templates} />
      </main>
      <ConversionFooter
        eyebrow={t(
          "Built with the same system you’ll use",
          "Sizin de kullanacağınız sistemle oluşturuldu",
        )}
        title={[
          t("Pick a direction.", "Bir yön seçin."),
          t("Then break the rules.", "Sonra kuralları yıkın."),
        ]}
        secondaryHref={localizedHref("/", locale)}
        secondaryLabel={t("Back to product", "Ürüne dön")}
      />
    </div>
  );
}
