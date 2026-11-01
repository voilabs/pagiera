import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { DocsProviders } from "@/components/docs-providers";
import { categorizedDocsTree } from "@/lib/docs-navigation";
import { type DocsLocale, docsSources } from "@/lib/docs-source";
export function DocumentationLayout({
  locale,
  children,
}: {
  locale: DocsLocale;
  children: ReactNode;
}) {
  const tr = locale === "tr";
  return (
    <DocsProviders locale={locale}>
      <DocsLayout
        tree={categorizedDocsTree(docsSources[locale].getPageTree())}
        nav={{
          title: (
            <span className="docs-brand">
              {/* biome-ignore lint/performance/noImgElement: tiny static logo */}
              <img src="/logo.png" alt="" width={24} height={24} />
              Pagiera
              <small>{tr ? "Doküman" : "Docs"}</small>
            </span>
          ),
          url: tr ? "/tr/docs" : "/docs",
        }}
        i18n
        githubUrl="https://github.com/voilabs/pagiera"
        links={[
          {
            text: tr ? "Entegrasyonlar" : "Integrations",
            url: tr ? "/tr/integrations" : "/integrations",
            external: false,
          },
          {
            text: tr ? "Pagiera ana sayfası" : "Pagiera website",
            url: tr ? "/tr" : "/",
            external: false,
          },
        ]}
      >
        {children}
      </DocsLayout>
    </DocsProviders>
  );
}
