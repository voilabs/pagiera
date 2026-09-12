import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { COMPARISONS } from "@/lib/comparisons";
import { breadcrumbSchema, itemListPageSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "How Pagiera compares to Webflow, Framer, Figma and Builder.io — who owns the output, where the editor runs, and which tool each job actually calls for.";

export default function CompareIndex() {
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={DESCRIPTION}
        jsonLd={[
          itemListPageSchema({
            description: DESCRIPTION,
            items: COMPARISONS.map((entry) => ({
              description: entry.verdict,
              name: `Pagiera vs ${entry.rival}`,
              path: `/compare/${entry.slug}`,
            })),
            name: "Pagiera comparisons",
            path: "/compare",
          }),
          breadcrumbSchema([
            { name: "Pagiera", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ]}
        path="/compare"
        title="Pagiera compared — Webflow, Framer, Figma and Builder.io"
      />
      <SiteBar active="compare" />

      <div className="hub">
        <Reveal as="div" className="hub-head" distance={20} on="mount">
          <span className="docs-eyebrow">Compare</span>
          <h1>The honest version of “which one should I use?”</h1>
          <p>
            Every comparison leads with a verdict, including the cases where the
            other tool is the right answer. Pagiera is a visual builder that
            lives inside your own React and Next.js application — that single
            fact decides most of these questions.
          </p>
        </Reveal>

        {/* The one distinction that survives every competitor's next release. */}
        <Reveal as="div" className="hub-callout" distance={18}>
          <p>
            <strong>The short answer.</strong> Choose Pagiera when the editor
            has to run inside your product, behind your auth, reading the same
            APIs your app already uses, with the page source in your repository.
            Choose a hosted tool when the site is separate from your product and
            someone else should run the infrastructure.
          </p>
        </Reveal>

        <div className="hub-list">
          {COMPARISONS.map((entry, index) => (
            <Reveal
              as="article"
              className="hub-row"
              delay={index * 0.05}
              key={entry.slug}
            >
              <a href={`/compare/${entry.slug}`}>
                <span className="hub-row-meta">
                  <i className="hub-row-strong">{entry.rival}</i>
                  <i className="hub-row-lead">Comparison {index + 1}</i>
                </span>
                <span>
                  <h2>{entry.headline}</h2>
                  <p className="hub-row-q">{entry.rivalTagline}</p>
                  <p className="hub-row-a">{entry.verdict}</p>
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
            <h2>Rather judge it yourself?</h2>
            <p>
              The package is MIT-licensed and the templates are open. Install it
              and see how far it gets before you read another comparison.
            </p>
          </div>
          <span>
            <a className="hub-link" href="/docs">
              Read the documentation →
            </a>
            <a className="hub-link" href="/templates">
              Explore templates →
            </a>
          </span>
        </Reveal>
      </div>

      <ConversionFooter
        eyebrow="No migration, no vendor account"
        secondaryHref="/templates"
        secondaryLabel="Explore templates"
        title={["Own the canvas.", "Own the output."]}
      />
    </div>
  );
}
