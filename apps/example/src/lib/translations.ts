import type { PagieraTranslations } from "pagiera/runtime";

/**
 * The site's strings, by language.
 *
 * A layer in the studio names one of these with a translation key such as
 * `nav.home`. A real site would load them from its own i18n files or CMS; they
 * are inlined here so the example runs without one.
 */
export const translations: Record<string, PagieraTranslations> = {
  tr: {
    nav: {
      home: "Anasayfa",
      about: "Hakkımda",
      gallery: "Galeri",
      blog: "Blog",
      contact: "İletişim",
    },
    hero: { cta: "Randevu Al" },
  },
  en: {
    nav: {
      home: "Home",
      about: "About",
      gallery: "Gallery",
      blog: "Blog",
      contact: "Contact",
    },
    hero: { cta: "Book an appointment" },
  },
};

/** The dictionary for `?lang=`, or nothing so the page renders as authored. */
export function translationsFor(lang: string | string[] | undefined) {
  const code = Array.isArray(lang) ? lang[0] : lang;
  return code ? translations[code] : undefined;
}
