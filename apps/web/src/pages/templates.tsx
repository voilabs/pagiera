import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { TemplateStore } from "@/components/template-store";
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
  return (
    <div
      className={`${manrope.variable} min-w-80 overflow-clip bg-[#0b0b0b] font-sans text-[#f5f5f5]`}
    >
      <Seo
        description={`Explore ${templates.length} responsive Pagiera templates—complete multi-page systems you can preview as real rendered websites, then open and edit on the canvas.`}
        jsonLd={[
          templateCollectionSchema(templates),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
          ]),
        ]}
        path="/templates"
        title="Templates — responsive starting points for Pagiera"
      />
      <SiteBar active="templates" />
      <main>
        <TemplateStore templates={templates} />
      </main>
      <ConversionFooter
        eyebrow="Built with the same system you’ll use"
        title={["Pick a direction.", "Then break the rules."]}
        secondaryHref="/"
        secondaryLabel="Back to product"
      />
    </div>
  );
}
