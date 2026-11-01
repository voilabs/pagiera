import type { Locale } from "./landing-copy";
import { absoluteUrl, localizedUrl, SITE_DESCRIPTION } from "./seo";

export function siteStructuredData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: "Pagiera",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/logo.png"),
        sameAs: ["https://github.com/voilabs/pagiera"],
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: "Pagiera",
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION[locale],
        inLanguage: ["en", "tr"],
        publisher: { "@id": absoluteUrl("/#organization") },
      },
    ],
  };
}

export type Breadcrumb = { name: string; path: string };
export function pageStructuredData({
  path,
  locale,
  title,
  description,
  breadcrumbs,
  article,
  collection,
  modified,
  sourceCode,
}: {
  path: string;
  locale: Locale;
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  article?: boolean;
  collection?: boolean;
  modified?: string;
  sourceCode?: boolean;
}) {
  const url = localizedUrl(path, locale);
  const graph: Record<string, unknown>[] = [
    {
      "@type": article
        ? "TechArticle"
        : collection
          ? "CollectionPage"
          : "WebPage",
      "@id": `${url}#page`,
      url,
      name: title,
      headline: title,
      description,
      inLanguage: locale,
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
      ...(article
        ? {
            author: { "@id": absoluteUrl("/#organization") },
            mainEntityOfPage: url,
          }
        : {}),
      ...(modified ? { dateModified: modified } : {}),
      ...(breadcrumbs.length > 1
        ? { breadcrumb: { "@id": `${url}#breadcrumb` } }
        : {}),
    },
  ];
  if (breadcrumbs.length > 1)
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: localizedUrl(item.path, locale),
      })),
    });
  if (sourceCode)
    graph.push({
      "@type": "SoftwareSourceCode",
      "@id": absoluteUrl("/#software"),
      name: "Pagiera",
      description: SITE_DESCRIPTION[locale],
      url: localizedUrl("/", locale),
      codeRepository: "https://github.com/voilabs/pagiera",
      programmingLanguage: "TypeScript",
      runtimePlatform: "Node.js",
      license: "https://opensource.org/license/mit",
    });
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeStructuredData(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
