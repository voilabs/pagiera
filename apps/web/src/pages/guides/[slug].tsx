import type { GetStaticPaths, GetStaticProps } from "next";
import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { GuideBlocks } from "@/components/guide-blocks";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { GUIDES, type Guide, getGuide } from "@/lib/guides";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  techArticleSchema,
} from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

type Props = { guide: Guide; related: Guide[] };

export const getStaticPaths: GetStaticPaths = async () => ({
  fallback: false,
  paths: GUIDES.map((guide) => ({ params: { slug: guide.slug } })),
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const guide = getGuide(String(params?.slug));
  if (!guide) return { notFound: true };
  const related = guide.related
    .map((slug) => getGuide(slug))
    .filter((entry): entry is Guide => Boolean(entry));
  return { props: { guide, related } };
};

/** Section anchors double as the HowTo step URLs, so they must stay stable. */
const sectionId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

export default function GuidePage({ guide, related }: Props) {
  const path = `/guides/${guide.slug}`;
  const outline = [
    ...(guide.steps ?? []).map((step) => step.title),
    ...(guide.sections ?? []).map((section) => section.heading),
    "Frequently asked questions",
  ];

  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={guide.description}
        jsonLd={[
          techArticleSchema({
            description: guide.description,
            headline: guide.title,
            path,
            updated: guide.updated,
          }),
          ...(guide.steps
            ? [
                howToSchema({
                  description: guide.answer,
                  name: guide.title,
                  path,
                  steps: guide.steps,
                }),
              ]
            : []),
          faqSchema(guide.faq),
          breadcrumbSchema([
            { name: "Pagiera", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path },
          ]),
        ]}
        path={path}
        title={`${guide.title} — Pagiera`}
        type="article"
      />
      <SiteBar active="guides" />

      <div className="docs-layout">
        <aside className="docs-aside">
          <nav aria-label="Guide sections" className="docs-sections">
            <a href="/guides">
              <strong>← All guides</strong>
              <span>{GUIDES.length} integration guides</span>
            </a>
          </nav>
          <div className="docs-toc">
            <p>On this page</p>
            <nav aria-label="On this page">
              {outline.map((entry) => (
                <a href={`#${sectionId(entry)}`} key={entry}>
                  {entry}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="docs-main">
          <Reveal as="div" className="docs-intro" distance={18} on="mount">
            <span className="docs-eyebrow">{guide.category}</span>
            <h1>{guide.title}</h1>
            {/* The question and its answer sit above everything else: a reader
                skimming and an engine quoting both stop at the same paragraph. */}
            <div className="guide-answer">
              <p className="guide-answer-q">{guide.question}</p>
              <p className="guide-answer-a">{guide.answer}</p>
            </div>
            <div className="docs-meta">
              <span className="docs-chip live">
                <i />
                Updated{" "}
                {new Date(guide.updated).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="docs-chip">
                <i />
                {guide.minutes} min read
              </span>
            </div>
          </Reveal>

          <div className="docs-markdown">
            <div className="guide-takeaways">
              <p>Key points</p>
              <ul>
                {guide.takeaways.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            {guide.steps?.map((step, index) => (
              <section key={step.title}>
                <h2 id={sectionId(step.title)}>
                  <span className="guide-step-number">{index + 1}</span>
                  {step.title}
                </h2>
                <p>{step.body}</p>
                {step.blocks ? <GuideBlocks blocks={step.blocks} /> : null}
              </section>
            ))}

            {guide.sections?.map((section) => (
              <section key={section.heading}>
                <h2 id={sectionId(section.heading)}>{section.heading}</h2>
                <GuideBlocks blocks={section.blocks} />
              </section>
            ))}

            <section>
              <h2 id={sectionId("Frequently asked questions")}>
                Frequently asked questions
              </h2>
              {guide.faq.map((entry) => (
                <div key={entry.question}>
                  <h3>{entry.question}</h3>
                  <p>{entry.answer}</p>
                </div>
              ))}
            </section>
          </div>

          {related.length > 0 && (
            <nav aria-label="Related guides" className="guide-related">
              <p>Keep reading</p>
              <div>
                {related.map((entry) => (
                  <a href={`/guides/${entry.slug}`} key={entry.slug}>
                    <span>{entry.category}</span>
                    <strong>{entry.title}</strong>
                  </a>
                ))}
              </div>
            </nav>
          )}
        </main>
      </div>

      <ConversionFooter
        eyebrow="Read it, then build it"
        secondaryHref="/docs"
        secondaryLabel="Read the documentation"
        title={["Enough theory.", "Open the canvas."]}
      />
    </div>
  );
}
