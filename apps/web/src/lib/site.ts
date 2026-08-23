/**
 * One source of truth for everything that has to be an absolute URL: canonical
 * tags, Open Graph, the sitemap and JSON-LD all break silently when they carry
 * a relative path, so every consumer goes through `absoluteUrl`.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment; it falls back to the production
 * domain so a local build still produces valid markup.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagiera.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Pagiera";
export const SITE_LOCALE = "en_US";

export const SITE_DESCRIPTION =
  "Pagiera is the open-source visual website builder: a freeform responsive canvas with reusable components, real data and production-ready motion.";

export const REPO_URL = "https://github.com/voilabs/pagiera";

export const OG_IMAGE = {
  alt: "The Pagiera visual editor with a responsive page open on the canvas.",
  height: 1080,
  url: "/og.png",
  width: 1920,
};

/** Resolves a site-relative path against the configured origin. */
export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

/**
 * Preview deployments must not compete with the production domain in the
 * index, so only a real production build advertises itself to crawlers.
 */
export const IS_INDEXABLE_DEPLOYMENT = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : true;
