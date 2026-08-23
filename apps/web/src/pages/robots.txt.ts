import type { GetServerSideProps } from "next";
import { absoluteUrl, IS_INDEXABLE_DEPLOYMENT } from "@/lib/site";

/**
 * Served from a route rather than public/ so the sitemap URL follows the
 * deployment's own origin, and so preview deployments can lock themselves out
 * of the index instead of duplicating the production site.
 *
 * Template previews are deliberately left crawlable: they carry a noindex tag,
 * and a Disallow here would stop crawlers from ever reading it.
 */
function body() {
  if (!IS_INDEXABLE_DEPLOYMENT) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(body());
  res.end();
  return { props: {} };
};

export default function Robots() {
  return null;
}
