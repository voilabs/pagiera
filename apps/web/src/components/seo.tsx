import Head from "next/head";
import { localizedHref, useI18n } from "@/lib/i18n";
import {
  absoluteUrl,
  IS_INDEXABLE_DEPLOYMENT,
  OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/site";

/** Keep structured language and page URLs consistent with the rendered locale. */
function localizeSchema(value: unknown, locale: string, key = ""): unknown {
  if (Array.isArray(value)) return value.map((item) => localizeSchema(item, locale, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, localizeSchema(item, locale, name)]));
  if (locale !== "tr" || typeof value !== "string") return value;
  if (key === "inLanguage") return "tr";
  if (["url", "item", "mainEntityOfPage"].includes(key) && value.startsWith(`${SITE_URL}/`)) {
    const url = new URL(value);
    return absoluteUrl(localizedHref(`${url.pathname}${url.search}${url.hash}`, locale));
  }
  if (value === SITE_DESCRIPTION) return "Pagiera, React ve Next.js için açık kaynaklı görsel sayfa oluşturucu ve kendi sunucunuzda barındırabileceğiniz bir CMS’dir. Sayfaları görsel tuvalde düzenleyin, kendi veritabanınızda saklayın ve sunucuda işleyerek yayımlayın.";
  if (value === "Documentation") return "Dokümantasyon";
  if (value === "Pagiera templates") return "Pagiera şablonları";
  return value;
}

/**
 * Every indexable page renders exactly one of these. Keeping the tags in a
 * single component is what stops a page from shipping a relative og:image or
 * forgetting its canonical—the two mistakes crawlers punish silently.
 */
export function Seo({
  description,
  image = OG_IMAGE.url,
  jsonLd,
  noindex = false,
  path,
  title,
  type = "website",
}: {
  description: string;
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  path: string;
  title: string;
  type?: "website" | "article";
}) {
  const { locale } = useI18n();
  const url = absoluteUrl(localizedHref(path, locale));
  const imageUrl = absoluteUrl(image);
  const blocked = noindex || !IS_INDEXABLE_DEPLOYMENT;
  // `follow` even when blocked: keeping the page out of the index is the goal,
  // and a 404 or a preview build still links to pages worth discovering.
  const robots = blocked
    ? "noindex,follow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const structured = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta content={description} name="description" />
        <meta content={robots} name="robots" />
        {/* A page that asks not to be indexed has no canonical to point at. */}
        {!noindex && <link href={url} rel="canonical" />}
        {!noindex && <>
          <link rel="alternate" hrefLang="en" href={absoluteUrl(localizedHref(path, "en"))} />
          <link rel="alternate" hrefLang="tr" href={absoluteUrl(localizedHref(path, "tr"))} />
          <link rel="alternate" hrefLang="x-default" href={absoluteUrl(localizedHref(path, "en"))} />
        </>}

        <meta content={SITE_NAME} property="og:site_name" />
        <meta content={type} property="og:type" />
        <meta content={url} property="og:url" />
        <meta content={title} property="og:title" />
        <meta content={description} property="og:description" />
        <meta content={imageUrl} property="og:image" />
        <meta content={String(OG_IMAGE.width)} property="og:image:width" />
        <meta content={String(OG_IMAGE.height)} property="og:image:height" />
        <meta content={locale === "tr" ? "Tuvalinde duyarlı bir sayfa açık olan Pagiera görsel editörü." : OG_IMAGE.alt} property="og:image:alt" />
        <meta content={locale === "tr" ? "tr_TR" : SITE_LOCALE} property="og:locale" />
        <meta content={locale === "tr" ? SITE_LOCALE : "tr_TR"} property="og:locale:alternate" />

        <meta content="summary_large_image" name="twitter:card" />
        <meta content={title} name="twitter:title" />
        <meta content={description} name="twitter:description" />
        <meta content={imageUrl} name="twitter:image" />
        <meta content={locale === "tr" ? "Tuvalinde duyarlı bir sayfa açık olan Pagiera görsel editörü." : OG_IMAGE.alt} name="twitter:image:alt" />
      </Head>
      {/* JSON-LD lives in the body: next/head warns about script tags, and
          crawlers read structured data from either position. */}
      {structured.map((entry, index) => (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serialised structured data, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localizeSchema(entry, locale)).replace(/</g, "\\u003c") }}
          // biome-ignore lint/suspicious/noArrayIndexKey: the list is static per page.
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
