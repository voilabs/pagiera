import type { GetServerSideProps } from "next";
import { COMPARISONS } from "@/lib/comparisons";
import { DOCS } from "@/lib/docs-catalog";
import { ALL_FAQ } from "@/lib/faq";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, IS_INDEXABLE_DEPLOYMENT, SITE_NAME } from "@/lib/site";

/**
 * /llms.txt is a proposed convention, not a ranking factor: it gives a model
 * reading the site a curated map instead of whatever its crawler happened to
 * reach first. It is generated from the same data the pages render, so it
 * cannot drift into describing content that no longer exists.
 *
 * Preview deployments serve nothing, for the same reason robots.txt blocks
 * them — a staging copy competing with production helps no one.
 */
function body() {
  if (!IS_INDEXABLE_DEPLOYMENT) return "";

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    "> Pagiera is an open-source visual website builder distributed as an npm package for React and Next.js. It installs into your own application: the editor runs behind your authentication, page documents live in your PostgreSQL database, and published pages are rendered by your own Next.js server. Licensed under MIT.",
    "",
    "Key facts:",
    "",
    "- Pagiera is a package you install, not a hosted website account.",
    "- Requirements: Node.js 20+, React 18.3+, the Next.js App Router, PostgreSQL and Redis.",
    "- An OpenRouter API key is required only for AI generation; the rest of the editor works without one.",
    "- Saving a page updates a draft. Publishing is a separate step, and it does not deploy your application.",
    "- Request and Repeat data blocks resolve on the server, so API-backed content is present in the initial HTML.",
    "- Pagiera ships no authentication layer; you protect the editor and API routes yourself.",
    "",
    "## Documentation",
    "",
    `- [Documentation](${absoluteUrl("/docs")}): locally maintained product handbook and system reference.`,
    ...DOCS.map(
      (entry) =>
        `- [${entry.title}](${absoluteUrl(`/docs/${entry.slug}`)}): ${entry.description}`,
    ),
    "",
    "## Guides",
    "",
    ...GUIDES.map(
      (guide) =>
        `- [${guide.title}](${absoluteUrl(`/guides/${guide.slug}`)}): ${guide.answer}`,
    ),
    "",
    "## Comparisons",
    "",
    ...COMPARISONS.map(
      (entry) =>
        `- [Pagiera vs ${entry.rival}](${absoluteUrl(`/compare/${entry.slug}`)}): ${entry.verdict}`,
    ),
    "",
    "## Product",
    "",
    `- [Overview](${absoluteUrl("/")}): what the editor does and how the workflow fits together.`,
    `- [Templates](${absoluteUrl("/templates")}): responsive starting points that stay editable after install.`,
    `- [FAQ](${absoluteUrl("/faq")}): ${ALL_FAQ.length} answers about setup, hosting, data, publishing and AI.`,
    "",
    "## Frequently asked questions",
    "",
    ...ALL_FAQ.flatMap((entry) => [
      `### ${entry.question}`,
      "",
      entry.answer,
      "",
    ]),
  ];

  return `${lines.join("\n")}\n`;
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

export default function LlmsTxt() {
  return null;
}
