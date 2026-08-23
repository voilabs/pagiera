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
