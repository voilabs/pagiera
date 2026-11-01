import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/content/guides";
import { docsSources } from "@/lib/docs-source";
import routes from "@/lib/reset-routes.json";
import { languageAlternates, localizedUrl, siteIndexable } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIndexable()) return [];
  const paths = new Set([
    ...routes
      .filter((route) => !route.path.endsWith("/preview"))
      .map((route) => route.path),
    ...docsSources.en.getPages().map((page) => page.url),
  ]);
  return [...paths].flatMap((path) => {
    const guide = GUIDES.find((guide) => path === `/guides/${guide.slug}`);
    return (["en", "tr"] as const).map((locale) => ({
      url: localizedUrl(path, locale),
      alternates: { languages: languageAlternates(path) },
      // Only use a real editorial date; don't pretend every build edits every page.
      ...(guide ? { lastModified: guide.updated } : {}),
    }));
  });
}
