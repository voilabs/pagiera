import {
  absoluteUrl,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Publisher identity: what Google ties the brand's knowledge panel to. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      height: 512,
      url: absoluteUrl("/logo.png"),
      width: 512,
    },
    name: SITE_NAME,
    sameAs: [REPO_URL],
    url: absoluteUrl("/"),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    name: SITE_NAME,
    publisher: { "@id": ORGANIZATION_ID },
    url: absoluteUrl("/"),
  };
}

/**
 * The product itself. `offers` is a genuine zero-price offer—the builder is
 * open source—so this stays inside what the software rich result allows.
 */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    alternateName: [
      "Pagiera CMS",
      "Pagiera visual CMS",
      "Pagiera page builder",
    ],
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Content Management System",
    description: SITE_DESCRIPTION,
    featureList: [
      "Freeform responsive canvas",
      "Reusable components with variants",
      "API, route param and form data binding",
      "Server-rendered production output",
      "Motion and interaction authoring",
      "Linked layouts with children placeholders",
      "Custom carousel slides and nested marquee content",
      "Shader colors and text hover effects",
      "Targeted AI proposals with before-and-after review",
    ],
    isAccessibleForFree: true,
    keywords:
      "visual CMS, self-hosted CMS, headless CMS alternative, Next.js CMS, React CMS, page builder, website builder, open source CMS",
    license: "https://opensource.org/licenses/MIT",
    name: SITE_NAME,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Web",
    publisher: { "@id": ORGANIZATION_ID },
    softwareHelp: REPO_URL,
    url: absoluteUrl("/"),
  };
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(step.path),
      name: step.name,
      position: index + 1,
    })),
  };
}

export function templateCollectionSchema(
  templates: Array<{ id: string; name: string; description: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: templates.map((template, index) => ({
        "@type": "ListItem",
        item: {
          "@type": "CreativeWork",
          description: template.description,
          name: template.name,
          url: absoluteUrl(`/templates/${template.id}/preview`),
        },
        position: index + 1,
      })),
      numberOfItems: templates.length,
    },
    name: `${SITE_NAME} templates`,
    url: absoluteUrl("/templates"),
  };
}

/**
 * Keep these answers identical to visible page content. Markup does not
 * guarantee rich results or inclusion in generative search answers.
 */
export function faqSchema(
  entries: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
      name: entry.question,
    })),
  };
}

/**
 * A comparison is stated as its own page entity rather than as a review: we
 * are a party to the comparison, so `Review` markup would be self-serving and
 * is exactly what rich-result guidelines exclude.
 */
export function comparisonPageSchema({
  description,
  path,
  rival,
  title,
}: {
  description: string;
  path: string;
  rival: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    about: [
      { "@type": "SoftwareApplication", name: SITE_NAME },
      { "@type": "SoftwareApplication", name: rival },
    ],
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    name: title,
    publisher: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(path),
  };
}

/**
 * A guide is a TechArticle rather than a BlogPosting: it documents a product
 * procedure, and `dateModified` is what an answer engine uses to decide which
 * of two conflicting explanations is current.
 */
export function techArticleSchema({
  description,
  headline,
  path,
  updated,
}: {
  description: string;
  headline: string;
  path: string;
  updated: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    author: { "@id": ORGANIZATION_ID },
    dateModified: updated,
    datePublished: updated,
    description,
    headline,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: absoluteUrl(path),
    publisher: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(path),
  };
}

/** Only emitted for guides that genuinely read as an ordered procedure. */
export function howToSchema({
  description,
  name,
  path,
  steps,
}: {
  description: string;
  name: string;
  path: string;
  steps: Array<{ title: string; body: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    description,
    name,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      name: step.title,
      position: index + 1,
      text: step.body,
      url: `${absoluteUrl(path)}#step-${index + 1}`,
    })),
    totalTime: "PT10M",
  };
}

/** A hub page that exists to enumerate other pages. */
export function itemListPageSchema({
  description,
  items,
  name,
  path,
}: {
  description: string;
  items: Array<{ name: string; description: string; path: string }>;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        name: item.name,
        position: index + 1,
        url: absoluteUrl(item.path),
      })),
      numberOfItems: items.length,
    },
    name,
    publisher: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(path),
  };
}
