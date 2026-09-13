import { DOCS } from "./docs-catalog";
import { DOCS_CATALOG_TR } from "./docs-catalog-tr";

export function localizedDocs(locale: string) {
  return locale === "tr" ? DOCS.map((doc) => ({ ...doc, title: DOCS_CATALOG_TR[doc.slug].title, description: DOCS_CATALOG_TR[doc.slug].description })) : DOCS;
}
