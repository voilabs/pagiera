export const LOCALES = ["en", "tr"] as const;
export function localizedHref(href: string, locale: string = "en") {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    /^\/(?:api|_next)(?:\/|$)/.test(href) ||
    /\.[a-z0-9]+(?:[?#]|$)/i.test(href)
  )
    return href;
  const path = href.replace(/^\/tr(?=\/|[?#]|$)/, "") || "/";
  return locale === "tr" ? "/tr" + (path === "/" ? "" : path) : path;
}
