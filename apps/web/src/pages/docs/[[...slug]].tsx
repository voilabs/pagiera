import { marked, type Token } from "marked";
import type { GetStaticPaths, GetStaticProps } from "next";
import { Manrope } from "next/font/google";
import { DocsCommandMenu } from "@/components/docs-command-menu";
import { DocsMarkdown, headingId } from "@/components/docs-markdown";
import { Icon } from "@/components/icons";
import { Seo } from "@/components/seo";
import {
  DOC_GROUPS,
  DOC_SLUGS,
  DOCS,
  type DocEntry,
  getDoc,
} from "@/lib/docs-catalog";
import { getDocsContent } from "@/lib/docs-content";
import { breadcrumbSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });
type Heading = { depth: number; id: string; title: string };
type Props = {
  entry: DocEntry | null;
  headings: Heading[];
  tokens: Token[];
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [
    { params: { slug: [] } },
    ...DOC_SLUGS.map((slug) => ({ params: { slug: [slug] } })),
  ],
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : undefined;
  const entry = slug ? (getDoc(slug) ?? null) : null;
  const markdown = entry ? getDocsContent(entry.slug) : overviewMarkdown();
  if (!markdown) return { notFound: true };
  const tokens = marked.lexer(markdown);
  const counts = new Map<string, number>();
  const headings: Heading[] = [];
  for (const token of tokens) {
    if (token.type !== "heading" || token.depth < 2 || token.depth > 3)
      continue;
    const base = headingId(token.text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    headings.push({
      depth: token.depth,
      id: `${base}${count ? `-${count}` : ""}`,
      title: token.text,
    });
  }
  return {
    props: {
      entry,
      headings,
      tokens: JSON.parse(JSON.stringify(tokens)),
    },
    revalidate: 3600,
  };
};

function overviewMarkdown() {
  return `## Start with a working integration

Pagiera is an open-source visual website builder that runs inside your React and Next.js application. Your team edits pages visually, while your application owns authentication, data, storage and deployment.

### The shortest path to a working editor

1. Check the runtime and service requirements.
2. Install the package and add the editor stylesheet.
3. Configure PostgreSQL and Redis.
4. Mount the Pagiera backend route.
5. Load the editor bootstrap on the server.
6. Protect the studio with your own authentication.
7. Save a draft, preview it and publish only after approval.

Continue with [Getting started](/docs/getting-started), then follow [Next.js setup](/docs/nextjs-setup).

## How the pieces fit together

The studio edits a page document. PostgreSQL stores that document, Redis caches published output, and the runtime renders approved pages from your own Next.js server. Request and Repeat blocks resolve before HTML is returned, so API-backed content remains available to crawlers and non-JavaScript clients.

## Choose the guide you need

- **First installation:** begin with [Getting started](/docs/getting-started).
- **App Router wiring:** use [Next.js setup](/docs/nextjs-setup).
- **Dynamic content:** read [Dynamic routes and data](/docs/data-binding).
- **Going live:** follow [Preview and publish](/docs/publishing).
- **Programmatic integration:** open the [API reference](/docs/api-reference).
- **Something failed:** jump to [Troubleshooting](/docs/troubleshooting).

## Explore the systems

Follow the [studio workflow](/docs/studio), browse the [native block reference](/docs/blocks), and learn [responsive design](/docs/responsive-design). Build shared [components and layouts](/docs/components-layouts), connect [forms](/docs/forms), and add [motion and interactions](/docs/interactions).

For programmatic work, read the [document model](/docs/document-model), [CLI guide](/docs/cli), and [AI and MCP guide](/docs/ai-mcp). Before production, review [revisions](/docs/revisions), [fonts and assets](/docs/fonts-assets), and [deployment](/docs/deployment).

## What changed

Read the [changelog](/docs/changelog) for verified source-tree changes and release availability notes.`;
}

export default function Documentation({ entry, headings, tokens }: Props) {
  const path = entry ? `/docs/${entry.slug}` : "/docs";
  const title = entry?.title ?? "Documentation";
  const description =
    entry?.description ??
    "Learn Pagiera step by step: install the visual editor, connect Next.js, bind API data, preview drafts and publish server-rendered pages.";

  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        title={`${title} — Pagiera Docs`}
        description={description}
        path={path}
        jsonLd={breadcrumbSchema([
          { name: "Pagiera", path: "/" },
          { name: "Documentation", path: "/docs" },
          ...(entry ? [{ name: entry.title, path }] : []),
        ])}
      />
      <div className="docs-tools">
        <a className="docs-tools-brand" href="/docs">
          <strong>Pagiera</strong>
          <span>Docs</span>
        </a>
        <DocsCommandMenu />
        <a className="docs-back-link" href="/">
          <Icon name="arrow" size={14} /> Back to website
        </a>
      </div>
      <div className="docs-shell">
        <aside className="docs-nav">
          <div className="docs-nav-title">
            <span>
              <Icon name="layers" size={14} /> Documentation
            </span>
            <small>{DOCS.length} guides</small>
          </div>
          <a
            className={!entry ? "docs-nav-home active" : "docs-nav-home"}
            href="/docs"
          >
            Overview
          </a>
          {DOC_GROUPS.map((group) => {
            const groupDocs = DOCS.filter((doc) => doc.group === group);
            return groupDocs.length ? (
              <section key={group}>
                <h2>{group}</h2>
                {groupDocs.map((doc) => (
                  <a
                    className={entry?.slug === doc.slug ? "active" : undefined}
                    href={`/docs/${doc.slug}`}
                    key={doc.slug}
                  >
                    {doc.title}
                  </a>
                ))}
              </section>
            ) : null;
          })}
        </aside>
        <main className="docs-main">
          <header className="docs-article-head">
            <p className="docs-breadcrumb">
              docs / {entry?.slug ?? "overview"}
            </p>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="docs-article-meta">
              <span>Pagiera documentation</span>
              <span>Step-by-step guide</span>
            </div>
          </header>
          <DocsMarkdown tokens={tokens} />
          <DocsPager current={entry?.slug} />
        </main>
        <aside className="docs-outline">
          <div className="docs-rail-label">
            Documentation <span>Handbook</span>
          </div>
          <p>On this page</p>
          <nav>
            {headings.map((heading) => (
              <a
                className={heading.depth === 3 ? "nested" : undefined}
                href={`#${heading.id}`}
                key={heading.id}
              >
                {heading.title}
              </a>
            ))}
          </nav>
          <section className="docs-rail-resource">
            <h2>Build with Pagiera</h2>
            <a
              href="https://github.com/voilabs/pagiera"
              target="_blank"
              rel="noreferrer"
            >
              Explore on GitHub ↗
            </a>
          </section>
          <section className="docs-rail-resource">
            <h2>Need a hand?</h2>
            <a href="/docs/troubleshooting">Read troubleshooting ↗</a>
            <a href="/faq">Frequently asked questions ↗</a>
          </section>
          <section className="docs-rail-resource">
            <h2>What’s new</h2>
            <a href="/docs/changelog">Read the changelog ↗</a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DocsPager({ current }: { current?: string }) {
  const index = current ? DOCS.findIndex((doc) => doc.slug === current) : -1;
  const previous = index > 0 ? DOCS[index - 1] : null;
  const next = index < DOCS.length - 1 ? DOCS[index + 1] : null;
  return (
    <nav className="docs-pager" aria-label="Documentation pagination">
      {previous ? (
        <a href={`/docs/${previous.slug}`}>
          <span>Previous</span>
          {previous.title}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="next" href={`/docs/${next.slug}`}>
          <span>Next</span>
          {next.title}
        </a>
      ) : null}
    </nav>
  );
}
