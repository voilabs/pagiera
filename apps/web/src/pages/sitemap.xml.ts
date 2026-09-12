import type { GetServerSideProps } from "next";
import { COMPARISON_SLUGS } from "@/lib/comparisons";
import { DOC_SLUGS } from "@/lib/docs-catalog";
import { GUIDE_SLUGS } from "@/lib/guides";
import { absoluteUrl } from "@/lib/site";

/**
 * Only indexable pages belong here. Template previews render inside iframes
 * and are marked noindex, so listing them would just send crawlers to pages
 * they are told to drop.
 */
const ROUTES: Array<{ changefreq: string; path: string; priority: string }> = [
  { changefreq: "weekly", path: "/", priority: "1.0" },
  { changefreq: "weekly", path: "/templates", priority: "0.8" },
  { changefreq: "weekly", path: "/docs", priority: "0.8" },
  { changefreq: "weekly", path: "/docs/agents", priority: "0.7" },
  ...DOC_SLUGS.filter((slug) => slug !== "agents").map((slug) => ({
    changefreq: "weekly",
    path: `/docs/${slug}`,
    priority: "0.7",
  })),
  { changefreq: "weekly", path: "/guides", priority: "0.8" },
  { changefreq: "monthly", path: "/faq", priority: "0.7" },
  { changefreq: "monthly", path: "/compare", priority: "0.7" },
  ...GUIDE_SLUGS.map((slug) => ({
    changefreq: "monthly",
    path: `/guides/${slug}`,
    priority: "0.7",
  })),
  ...COMPARISON_SLUGS.map((slug) => ({
    changefreq: "monthly",
    path: `/compare/${slug}`,
    priority: "0.7",
  })),
];

function body() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map(
    ({ changefreq, path, priority }) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(body());
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
