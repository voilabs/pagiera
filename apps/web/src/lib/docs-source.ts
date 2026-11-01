import { loader, type Source } from "fumadocs-core/source";
import { docsEn, docsTr } from "../../.source/server";

type EnglishSource = Source<{
  pageData: (typeof docsEn.docs)[number];
  metaData: (typeof docsEn.meta)[number];
}>;
type TurkishSource = Source<{
  pageData: (typeof docsTr.docs)[number];
  metaData: (typeof docsTr.meta)[number];
}>;
export const docsSources = {
  en: loader<EnglishSource>({
    baseUrl: "/docs",
    source: docsEn.toFumadocsSource(),
  }),
  tr: loader<TurkishSource>({
    baseUrl: "/tr/docs",
    source: docsTr.toFumadocsSource(),
  }),
};
export type DocsLocale = keyof typeof docsSources;
