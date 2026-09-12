import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { ALL_FAQ, FAQ_GROUPS } from "@/lib/faq";
import { breadcrumbSchema, faqSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "Answers about installing Pagiera in Next.js, hosting it yourself, reusing layouts, binding API data, publishing pages and using AI or a coding agent.";

const groupId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function FaqPage() {
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={DESCRIPTION}
        jsonLd={[
          // Every question marked up here is rendered on the page below.
          faqSchema(ALL_FAQ),
          breadcrumbSchema([
            { name: "Pagiera", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
        path="/faq"
        title="Pagiera FAQ — setup, hosting, data and publishing"
      />
      <SiteBar active="faq" />

      <div className="docs-layout">
        <aside className="docs-aside">
          <nav aria-label="FAQ topics" className="docs-sections">
            {FAQ_GROUPS.map((group) => (
              <a href={`#${groupId(group.title)}`} key={group.title}>
                <strong>{group.title}</strong>
                <span>{group.entries.length} questions</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="docs-main">
          <Reveal as="div" className="docs-intro" distance={18} on="mount">
            <span className="docs-eyebrow">Frequently asked questions</span>
            <h1>Straight answers about building on Pagiera</h1>
            <p className="docs-lede">
              {ALL_FAQ.length} questions covering what Pagiera is, what it needs
              to run, how pages stay editable, where the data comes from and
              what the AI is allowed to touch.
            </p>
            <div className="docs-meta">
              <a className="docs-chip" href="/docs">
                Read the documentation →
              </a>
              <a className="docs-chip" href="/guides">
                Browse the guides →
              </a>
            </div>
          </Reveal>

          <div className="docs-markdown">
            {FAQ_GROUPS.map((group) => (
              <section key={group.title}>
                <h2 id={groupId(group.title)}>{group.title}</h2>
                <p>{group.blurb}</p>
                <div className="faq-list">
                  {group.entries.map((entry) => (
                    <article key={entry.question}>
                      <h3>{entry.question}</h3>
                      <p>{entry.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <ConversionFooter
        eyebrow="Still deciding?"
        secondaryHref="/compare"
        secondaryLabel="Compare the alternatives"
        title={["Answers are cheap.", "Building is the proof."]}
      />
    </div>
  );
}
