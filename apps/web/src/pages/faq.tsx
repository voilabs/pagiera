import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { Reveal } from "@/components/reveal";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { ALL_FAQ, FAQ_GROUPS } from "@/lib/faq";
import { ALL_FAQ_TR, FAQ_GROUPS_TR } from "@/lib/faq-tr";
import { localizedHref, useI18n } from "@/lib/i18n";
import { breadcrumbSchema, faqSchema } from "@/lib/structured-data";

const font = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

const DESCRIPTION =
  "Answers about installing Pagiera in Next.js, hosting it yourself, reusing layouts, binding API data, publishing pages and using AI or a coding agent.";

const groupId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function FaqPage() {
  const { locale, t } = useI18n();
  const entries = locale === "tr" ? FAQ_GROUPS_TR : FAQ_GROUPS;
  const description = t(
    DESCRIPTION,
    "Pagiera'nın Next.js kurulumu, kendi sunucunuzda barındırılması, düzenlerin yeniden kullanımı, API verileri, sayfa yayımlama ve yapay zekâ veya kodlama ajanı kullanımı hakkında yanıtlar.",
  );
  const allFaq = locale === "tr" ? ALL_FAQ_TR : ALL_FAQ;
  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        description={description}
        jsonLd={[
          // Every question marked up here is rendered on the page below.
          faqSchema(allFaq),
          breadcrumbSchema([
            { name: "Pagiera", path: localizedHref("/", locale) },
            { name: t("FAQ", "SSS"), path: localizedHref("/faq", locale) },
          ]),
        ]}
        path="/faq"
        title={t(
          "Pagiera FAQ — setup, hosting, data and publishing",
          "Pagiera SSS — kurulum, barındırma, veri ve yayımlama",
        )}
      />
      <SiteBar active="faq" />

      <div className="docs-layout">
        <aside className="docs-aside">
          <nav
            aria-label={t("FAQ topics", "SSS konuları")}
            className="docs-sections"
          >
            {entries.map((group) => (
              <a
                href={localizedHref(`#${groupId(group.title)}`, locale)}
                key={group.title}
              >
                <strong>{group.title}</strong>
                <span>
                  {group.entries.length} {t("questions", "soru")}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="docs-main">
          <Reveal as="div" className="docs-intro" distance={18} on="mount">
            <span className="docs-eyebrow">
              {t("Frequently asked questions", "Sık sorulan sorular")}
            </span>
            <h1>
              {t(
                "Straight answers about building on Pagiera",
                "Pagiera ile geliştirmeye dair net yanıtlar",
              )}
            </h1>
            <p className="docs-lede">
              {allFaq.length}{" "}
              {t(
                "questions covering what Pagiera is, what it needs to run, how pages stay editable, where the data comes from and what the AI is allowed to touch.",
                "soru: Pagiera nedir, çalışmak için neye ihtiyaç duyar, sayfalar nasıl düzenlenebilir kalır, veriler nereden gelir ve yapay zekâ nelere müdahale edebilir?",
              )}
            </p>
            <div className="docs-meta">
              <a className="docs-chip" href={localizedHref("/docs", locale)}>
                {t("Read the documentation →", "Dokümantasyonu okuyun →")}
              </a>
              <a className="docs-chip" href={localizedHref("/guides", locale)}>
                {t("Browse the guides →", "Rehberlere göz atın →")}
              </a>
            </div>
          </Reveal>

          <div className="docs-markdown">
            {entries.map((group) => (
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
        eyebrow={t("Still deciding?", "Hâlâ karar veremediniz mi?")}
        secondaryHref={localizedHref("/compare", locale)}
        secondaryLabel={t(
          "Compare the alternatives",
          "Alternatifleri karşılaştırın",
        )}
        title={[
          t("Answers are cheap.", "Yanıt vermek kolay."),
          t("Building is the proof.", "Kanıt, ortaya koyduğunuz iş."),
        ]}
      />
    </div>
  );
}
