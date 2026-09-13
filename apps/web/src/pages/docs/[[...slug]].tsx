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
import { DOCS_CONTENT_TR } from "@/lib/docs-content-tr";
import { localizedDocs } from "@/lib/docs-localized";
import { docGroupLabel, localizedHref, useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
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
  ].flatMap((path) => [ { ...path, locale: "en" }, { ...path, locale: "tr" } ]),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : undefined;
  const entry = slug ? (localizedDocs(locale ?? "en").find((doc) => doc.slug === slug) ?? null) : null;
  const markdown = entry ? (locale === "tr" ? DOCS_CONTENT_TR[entry.slug] : getDocsContent(entry.slug)) : overviewMarkdown(locale);
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

function overviewMarkdown(locale?: string) {
  if (locale === "tr") return `## Çalışan bir entegrasyonla başlayın

Pagiera, React ve Next.js uygulamanızın içinde çalışan açık kaynaklı bir görsel site oluşturucudur. Ekibiniz sayfaları görsel olarak düzenler; kimlik doğrulama, veri, depolama ve dağıtım uygulamanızın kontrolünde kalır.

### Çalışan bir editöre giden en kısa yol

1. Çalışma ortamı ve servis gereksinimlerini kontrol edin.
2. Paketi kurun ve editör stil dosyasını ekleyin.
3. PostgreSQL ve Redis bağlantılarını yapılandırın.
4. Pagiera sunucu rotasını bağlayın.
5. Editör başlangıç verilerini sunucuda yükleyin.
6. Stüdyoyu kendi kimlik doğrulamanızla koruyun.
7. Taslağı kaydedin, önizleyin ve yalnızca onaydan sonra yayımlayın.

[Başlangıç](/docs/getting-started) ile ilerleyin, ardından [Next.js kurulumu](/docs/nextjs-setup) rehberini uygulayın.

## Parçalar nasıl bir araya gelir?

Stüdyo bir sayfa belgesini düzenler. PostgreSQL belgeyi saklar, Redis yayımlanan çıktıyı önbelleğe alır ve çalışma zamanı onaylanan sayfaları Next.js sunucunuzda işler. Request ve Repeat blokları HTML dönmeden önce çözümlendiği için API verileri ilk HTML çıktısında bulunur.

## İhtiyacınız olan rehberi seçin

- **İlk kurulum:** [Başlangıç](/docs/getting-started).
- **App Router bağlantısı:** [Next.js kurulumu](/docs/nextjs-setup).
- **Dinamik içerik:** [Dinamik rotalar ve veri](/docs/data-binding).
- **Yayına çıkış:** [Önizleme ve yayımlama](/docs/publishing).
- **Programatik entegrasyon:** [API başvurusu](/docs/api-reference).
- **Sorun çözme:** [Sorun giderme](/docs/troubleshooting).

## Sistemleri keşfedin

[Stüdyo iş akışını](/docs/studio), [yerel blokları](/docs/blocks) ve [duyarlı tasarımı](/docs/responsive-design) öğrenin. Ortak [bileşen ve düzenler](/docs/components-layouts) oluşturun, [formları](/docs/forms) bağlayın, [hareket ve etkileşimler](/docs/interactions) ekleyin.

Programatik çalışmalar için [belge modelini](/docs/document-model), [CLI rehberini](/docs/cli) ve [yapay zekâ ile MCP rehberini](/docs/ai-mcp) okuyun. Üretime geçmeden önce [sürümleri](/docs/revisions), [yazı tipleri ve varlıkları](/docs/fonts-assets), [dağıtımı](/docs/deployment) inceleyin.

## Neler değişti?

Doğrulanmış kaynak kodu değişiklikleri ve sürüm durumu için [değişiklik günlüğünü](/docs/changelog) okuyun.`;
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
  const { locale, t } = useI18n();
  const docs = localizedDocs(locale);
  const path = entry ? `/docs/${entry.slug}` : "/docs";
  const title = entry?.title ?? t("Documentation", "Dokümantasyon");
  const description =
    entry?.description ??
    t("Learn Pagiera step by step: install the visual editor, connect Next.js, bind API data, preview drafts and publish server-rendered pages.", "Pagiera’yı adım adım öğrenin: görsel editörü kurun, Next.js ve API verilerini bağlayın, taslakları önizleyin ve sunucuda işlenen sayfalar yayımlayın.");

  return (
    <div className={`${font.variable} docs-page font-sans`}>
      <Seo
        title={`${title} — Pagiera Docs`}
        description={description}
        path={path}
        jsonLd={breadcrumbSchema([
          { name: "Pagiera", path: "/" },
          { name: t("Documentation", "Dokümantasyon"), path: localizedHref("/docs", locale) },
          ...(entry ? [{ name: entry.title, path }] : []),
        ])}
      />
      <div className="docs-tools">
        <a className="docs-tools-brand" href={localizedHref("/docs", locale)}>
          <strong>Pagiera</strong>
          <span>{t("Docs", "Dokümanlar")}</span>
        </a>
        <DocsCommandMenu />
        <div className="docs-header-actions"><LanguageSwitcher />
        <a className="docs-back-link" href={localizedHref("/", locale)}>
          <Icon name="arrow" size={14} /> {t("Back to website", "Siteye dön")}
        </a>
        </div>
      </div>
      <div className="docs-shell">
        <aside className="docs-nav">
          <div className="docs-nav-title">
            <span>
              <Icon name="layers" size={14} /> {t("Documentation", "Dokümantasyon")}
            </span>
            <small>{DOCS.length} {t("guides", "rehber")}</small>
          </div>
          <a
            className={!entry ? "docs-nav-home active" : "docs-nav-home"}
            href={localizedHref("/docs", locale)}
          >
            {t("Overview", "Genel bakış")}
          </a>
          {DOC_GROUPS.map((group) => {
            const groupDocs = docs.filter((doc) => doc.group === group);
            return groupDocs.length ? (
              <section key={group}>
                <h2>{docGroupLabel(group, locale)}</h2>
                {groupDocs.map((doc) => (
                  <a
                    className={entry?.slug === doc.slug ? "active" : undefined}
                    href={localizedHref(`/docs/${doc.slug}`, locale)}
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
              {t("docs", "dokümanlar")} / {entry?.slug ?? t("overview", "genel bakış")}
            </p>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="docs-article-meta">
              <span>{t("Pagiera documentation", "Pagiera dokümantasyonu")}</span>
              <span>{t("Step-by-step guide", "Adım adım rehber")}</span>
            </div>
          </header>
          <DocsMarkdown tokens={tokens} />
          <DocsPager current={entry?.slug} />
        </main>
        <aside className="docs-outline">
          <div className="docs-rail-label">
            {t("Documentation", "Dokümantasyon")} <span>{t("Handbook", "El kitabı")}</span>
          </div>
          <p>{t("On this page", "Bu sayfada")}</p>
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
            <h2>{t("Build with Pagiera", "Pagiera ile geliştirin")}</h2>
            <a
              href="https://github.com/voilabs/pagiera"
              target="_blank"
              rel="noreferrer"
            >
              {t("Explore on GitHub", "GitHub’da inceleyin")} ↗
            </a>
          </section>
          <section className="docs-rail-resource">
            <h2>{t("Need a hand?", "Yardım mı gerekiyor?")}</h2>
            <a href={localizedHref("/docs/troubleshooting", locale)}>{t("Read troubleshooting", "Sorun giderme rehberi")} ↗</a>
            <a href={localizedHref("/faq", locale)}>{t("Frequently asked questions", "Sık sorulan sorular")} ↗</a>
          </section>
          <section className="docs-rail-resource">
            <h2>{t("What’s new", "Yenilikler")}</h2>
            <a href={localizedHref("/docs/changelog", locale)}>{t("Read the changelog", "Değişiklik günlüğü")} ↗</a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DocsPager({ current }: { current?: string }) {
  const { locale, t } = useI18n();
  const DOCS = localizedDocs(locale);
  const index = current ? DOCS.findIndex((doc) => doc.slug === current) : -1;
  const previous = index > 0 ? DOCS[index - 1] : null;
  const next = index < DOCS.length - 1 ? DOCS[index + 1] : null;
  return (
    <nav className="docs-pager" aria-label={t("Documentation pagination", "Dokümantasyon sayfaları")}>
      {previous ? (
        <a href={localizedHref(`/docs/${previous.slug}`, locale)}>
          <span>{t("Previous", "Önceki")}</span>
          {previous.title}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="next" href={localizedHref(`/docs/${next.slug}`, locale)}>
          <span>{t("Next", "Sonraki")}</span>
          {next.title}
        </a>
      ) : null}
    </nav>
  );
}
