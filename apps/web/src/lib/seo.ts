import type { Metadata } from "next";
import type { Locale } from "./landing-copy";
import { localizedHref } from "./urls";

// The public apex currently redirects to www. Never infer canonicals from
// request headers: preview hosts and forwarded hosts must not change them.
export function siteOrigin() {
  const url = new URL(
    process.env.PAGIERA_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.pagiera.com",
  );
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "PAGIERA_SITE_URL must be an HTTP(S) origin without a path, query or credentials.",
    );
  return url.origin;
}

export function siteIndexable() {
  const override = process.env.PAGIERA_SITE_INDEXABLE;
  if (override !== undefined && !["true", "false"].includes(override)) {
    throw new Error("PAGIERA_SITE_INDEXABLE must be true or false.");
  }
  if (override) return override === "true";
  return (
    process.env.NODE_ENV === "production" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  );
}

export const absoluteUrl = (path: string) =>
  new URL(path, `${siteOrigin()}/`).href;
export const localizedUrl = (path: string, locale: Locale) =>
  absoluteUrl(localizedHref(path, locale));
export const SITE_DESCRIPTION = {
  en: "Open-source visual website builder for React and Next.js. Design responsive pages, connect API data, build workflows and animate inside your own application.",
  tr: "React ve Next.js için açık kaynak görsel site oluşturucu. Kendi uygulamanızda duyarlı sayfalar tasarlayın, API verilerini bağlayın, akışlar ve animasyonlar oluşturun.",
};

export function languageAlternates(path: string) {
  return {
    en: localizedUrl(path, "en"),
    tr: localizedUrl(path, "tr"),
    "x-default": localizedUrl(path, "en"),
  };
}

export function rootMetadata(locale: Locale): Metadata {
  const verification =
    process.env.GOOGLE_SITE_VERIFICATION ||
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return {
    metadataBase: new URL(siteOrigin()),
    title: "Pagiera",
    description: SITE_DESCRIPTION[locale],
    applicationName: "Pagiera",
    robots: { index: siteIndexable(), follow: siteIndexable() },
    icons: { icon: "/favicon.ico", apple: "/logo.png" },
    verification: verification ? { google: verification } : undefined,
  };
}

export type PageSeo = {
  path: string;
  locale: Locale;
  title: string;
  description: string;
  noIndex?: boolean;
  modified?: string;
};

export function pageMetadata({
  path,
  locale,
  title,
  description,
  noIndex,
  modified,
}: PageSeo): Metadata {
  const index = siteIndexable() && !noIndex;
  const fullTitle = `${title} — Pagiera`;
  const summary = description.replace(/\s+/g, " ").trim();
  const image = absoluteUrl(`/og?${new URLSearchParams({ title, locale })}`);
  return {
    title: fullTitle,
    description: summary,
    alternates: {
      canonical: localizedUrl(path, locale),
      ...(!noIndex ? { languages: languageAlternates(path) } : {}),
    },
    robots: {
      index,
      follow: siteIndexable(),
      ...(index
        ? {
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large",
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          }
        : {}),
    },
    openGraph: {
      type: modified ? "article" : "website",
      siteName: "Pagiera",
      title: fullTitle,
      description: summary,
      url: localizedUrl(path, locale),
      locale: locale === "tr" ? "tr_TR" : "en_US",
      alternateLocale: locale === "tr" ? "en_US" : "tr_TR",
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      ...(modified ? { modifiedTime: modified } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: summary,
      images: [{ url: image, alt: fullTitle }],
    },
  };
}
