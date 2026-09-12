import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { GUIDES } from "@/lib/guides";
import { breadcrumbSchema, itemListPageSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "Short, answer-first guides for building with Pagiera: installing the editor in Next.js, binding API data, publishing safely, working with a coding agent and reusing layouts.";

export default function GuidesIndex() {
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={DESCRIPTION}
        jsonLd={[
          itemListPageSchema({
            description: DESCRIPTION,
            items: GUIDES.map((guide) => ({
              description: guide.description,
              name: guide.title,
              path: `/guides/${guide.slug}`,
            })),
            name: "Pagiera guides",
            path: "/guides",
          }),
          breadcrumbSchema([
            { name: "Pagiera", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
        ]}
        path="/guides"
        title="Guides — building with Pagiera"
      />
      <SiteBar active="guides" />

      <div className="hub">
        <Reveal as="div" className="hub-head" distance={20} on="mount">
          <span className="docs-eyebrow">Guides</span>
          <h1>One question, one answer, one page.</h1>
          <p>
            Every guide opens with the answer, then shows the shortest correct
            path to it. No preamble, no tour of features you did not ask about.
          </p>
        </Reveal>

        <div className="hub-list">
          {GUIDES.map((guide, index) => (
            <Reveal
              as="article"
              className="hub-row"
              delay={index * 0.05}
              key={guide.slug}
            >
              <a href={`/guides/${guide.slug}`}>
                <span className="hub-row-meta">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <i className="hub-row-lead">{guide.category}</i>
                  <i>{guide.minutes} min read</i>
                </span>
                <span>
                  <h2>{guide.title}</h2>
                  <p className="hub-row-q">{guide.question}</p>
                  <p className="hub-row-a">{guide.answer}</p>
                </span>
                <span className="hub-row-arrow">
                  <Icon name="arrow" size={18} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal as="div" className="hub-aside" distance={20}>
          <div>
            <h2>Looking for the full reference?</h2>
            <p>
              The documentation renders the package README and the coding-agent
              integration guide, synced from the official repository.
            </p>
          </div>
          <span>
            <a className="hub-link" href="/docs">
              Read the documentation →
            </a>
            <a className="hub-link" href="/faq">
              Browse the FAQ →
            </a>
          </span>
        </Reveal>
      </div>

      <ConversionFooter
        eyebrow="Guides are the short version"
        secondaryHref="/docs"
        secondaryLabel="Read the documentation"
        title={["Learn it once.", "Then build for years."]}
      />
    </div>
  );
}
