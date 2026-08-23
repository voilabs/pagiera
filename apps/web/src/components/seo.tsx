import Head from "next/head";
import {
  absoluteUrl,
  IS_INDEXABLE_DEPLOYMENT,
  OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
} from "@/lib/site";

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
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const blocked = noindex || !IS_INDEXABLE_DEPLOYMENT;
  const robots = blocked
    ? "noindex,nofollow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const structured = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta content={description} name="description" />
        <meta content={robots} name="robots" />
        <link href={url} rel="canonical" />

        <meta content={SITE_NAME} property="og:site_name" />
        <meta content={type} property="og:type" />
        <meta content={url} property="og:url" />
        <meta content={title} property="og:title" />
        <meta content={description} property="og:description" />
        <meta content={imageUrl} property="og:image" />
        <meta content={String(OG_IMAGE.width)} property="og:image:width" />
        <meta content={String(OG_IMAGE.height)} property="og:image:height" />
        <meta content={OG_IMAGE.alt} property="og:image:alt" />
        <meta content={SITE_LOCALE} property="og:locale" />

        <meta content="summary_large_image" name="twitter:card" />
        <meta content={title} name="twitter:title" />
        <meta content={description} name="twitter:description" />
        <meta content={imageUrl} name="twitter:image" />
        <meta content={OG_IMAGE.alt} name="twitter:image:alt" />
      </Head>
      {/* JSON-LD lives in the body: next/head warns about script tags, and
          crawlers read structured data from either position. */}
      {structured.map((entry, index) => (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serialised structured data, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          // biome-ignore lint/suspicious/noArrayIndexKey: the list is static per page.
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
