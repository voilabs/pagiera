import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";
import { translationsFor } from "./translations";

export type PublishedSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function renderPublishedPage(
  slug: string,
  searchParams: PublishedSearchParams,
) {
  const rawQuery = await searchParams;
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? (value[0] ?? "") : (value ?? ""),
    ]),
  );
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPublishedPage(slug, {
    query,
    params: {},
    page: { slug },
  });
  if (!page) notFound();
  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
      // `?lang=en` renders the page in that language; without it the page
      // shows the text it was authored with.
      translations={translationsFor(query.lang)}
      // An authored link to another page of this site becomes a client-side
      // transition. External URLs, fragments and `_blank` links are left as
      // plain anchors by the renderer, so nothing needs excluding here.
      components={{ Link }}
    />
  );
}

/**
 * The page's own SEO, resolved for this address: on `/blog/:slug` each post
 * gets the title, description and image its data source returned.
 */
export async function publishedMetadata(slug: string): Promise<Metadata> {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const seo = await server.getPublishedMetadata(slug, {
    params: {},
    page: { slug },
  });
  if (!seo) return { title: "Not found" };
  const images = seo.image ? [seo.image] : undefined;
  return {
    title: seo.title,
    description: seo.description,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: seo.title,
      description: seo.description,
      images,
    },
  };
}
