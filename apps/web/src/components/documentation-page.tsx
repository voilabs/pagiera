import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import defaultComponents from "fumadocs-ui/mdx";
import { notFound } from "next/navigation";
import { DocumentationCategories } from "@/components/docs-categories";
import { StructuredData } from "@/components/structured-data";
import { type DocsLocale, docsSources } from "@/lib/docs-source";
import { pageMetadata } from "@/lib/seo";
import { pageStructuredData } from "@/lib/structured-data";

const mdxComponents = {
  ...defaultComponents,
  Accordion,
  Accordions,
  Step,
  Steps,
  Tab,
  Tabs,
};
export function DocumentationPage({
  locale,
  slug,
}: {
  locale: DocsLocale;
  slug?: string[];
}) {
  const page = docsSources[locale].getPage(slug);
  if (!page) notFound();
  const Body = page.data.body;
  const path = page.url.replace(/^\/tr(?=\/|$)/, "");
  return (
    <DocsPage toc={page.data.toc} tableOfContent={{ style: "clerk" }}>
      <StructuredData
        data={pageStructuredData({
          path,
          locale,
          title: page.data.title,
          description: page.data.description ?? "",
          article: Boolean(slug?.length),
          collection: !slug?.length,
          breadcrumbs: [
            { name: "Pagiera", path: "/" },
            {
              name: locale === "tr" ? "Dokümantasyon" : "Documentation",
              path: "/docs",
            },
            ...(slug?.length ? [{ name: page.data.title, path }] : []),
          ],
        })}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <Body
          components={{
            ...mdxComponents,
            DocumentationCategories: () => (
              <DocumentationCategories locale={locale} />
            ),
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}
export function docsMetadata(locale: DocsLocale, slug?: string[]) {
  const page = docsSources[locale].getPage(slug);
  if (!page) notFound();
  return pageMetadata({
    path: page.url.replace(/^\/tr(?=\/|$)/, ""),
    locale,
    title: page.data.title,
    description: page.data.description ?? "",
  });
}
