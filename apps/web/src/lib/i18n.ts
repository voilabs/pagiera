import { useRouter } from "next/router";

export type Locale = "en" | "tr";
export const LOCALES = ["en", "tr"] as const;

/** Only page URLs are localized; assets, API endpoints and external URLs are not. */
export function localizedHref(href: string, locale: string = "en"): string {
  if (!href.startsWith("/") || href.startsWith("//") || /^\/(?:api|_next)(?:\/|$)/.test(href) || /\.[a-z0-9]+(?:[?#]|$)/i.test(href)) return href;
  const path = href.replace(/^\/tr(?=\/|[?#]|$)/, "") || "/";
  return locale === "tr" ? `/tr${path === "/" ? "" : path}` : path;
}

export function useI18n() {
  const router = useRouter();
  const locale: Locale = router.locale === "tr" ? "tr" : "en";
  return { locale, t: (en: string, tr: string) => locale === "tr" ? tr : en };
}

export function docGroupLabel(group: string, locale: string) {
  if (locale !== "tr") return group;
  return ({ "Start here": "Başlangıç", Build: "Oluşturma", Reference: "Başvuru" } as Record<string, string>)[group] ?? group;
}
