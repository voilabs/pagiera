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
import { type DocsLocale, docsSources } from "@/lib/docs-source";

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
  return (
    <DocsPage toc={page.data.toc} tableOfContent={{ style: "clerk" }}>
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
  return {
    title: page.data.title + " — Pagiera",
    description: page.data.description,
    alternates: {
      canonical:
        (locale === "tr" ? "/tr/docs" : "/docs") +
        (slug?.length ? "/" + slug.join("/") : ""),
    },
  };
}
