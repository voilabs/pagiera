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
    applicationCategory: "DeveloperApplication",
    description: SITE_DESCRIPTION,
    featureList: [
      "Freeform responsive canvas",
      "Reusable components with variants",
      "API, route param and form data binding",
      "Server-rendered production output",
      "Motion and interaction authoring",
    ],
    isAccessibleForFree: true,
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
 * Answer engines and Google's FAQ treatment both read this, and it is the one
 * block on a comparison page that maps a literal question to a literal answer.
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
