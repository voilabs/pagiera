import type { Locale } from "@/lib/landing-copy";
import { FAQ_GROUPS, type FaqGroup } from "./faq";
import { FAQ_GROUPS_TR } from "./faq-tr";
import { GUIDES, type Guide } from "./guides";
import { GUIDES_TR } from "./guides-tr";

export type { GuideBlock } from "./guides";
export type { FaqGroup, Guide };

// Turkish lists mirror the English ones slug for slug; English fills any gap.
function localized<T extends { slug: string }>(
  en: T[],
  tr: T[],
  locale: Locale,
) {
  if (locale === "en") return en;
  return en.map((item) => tr.find((t) => t.slug === item.slug) ?? item);
}

export const guides = (locale: Locale): Guide[] =>
  localized(GUIDES, GUIDES_TR, locale);
export const faqGroups = (locale: Locale): FaqGroup[] =>
  locale === "tr" ? FAQ_GROUPS_TR : FAQ_GROUPS;

export const PAGE_UI = {
  en: {
    guides: "Guides",
    guidesTitle: "Step by step,",
    guidesAccent: "/from setup to ship",
    guidesLede:
      "Practical walkthroughs for integrating Pagiera, binding data, publishing safely and working with coding agents.",
    minutes: "min read",
    updated: "Updated",
    shortAnswer: "Short answer",
    takeaways: "Key points",
    onThisPage: "On this page",
    steps: "Steps",
    questions: "Questions",
    related: "Related guides",
    compare: "Comparisons",
    compareTitle: "Pagiera and",
    compareAccent: "/the tools you know",
    compareLede:
      "Open-source editors, visual CMSs and hosted builders: what each one is for, and when to pick which.",
    verdict: "Verdict",
    choose: "Choose",
    when: "when",
    side: "Side by side",
    otherComparisons: "Other comparisons",
    faq: "FAQ",
    faqTitle: "Frequently asked",
    faqAccent: "/questions",
    faqLede:
      "Answers about what Pagiera is, how it runs and who controls what.",
    templates: "Templates",
    templatesTitle: "Start from",
    templatesAccent: "/a finished site",
    templatesLede:
      "Each template is a set of native Pagiera pages. Install one from the studio and every layer stays editable.",
    preview: "Preview",
    pages: "Pages",
    useTemplate: "Use this template",
    back: "All templates",
    read: "Read",
  },
  tr: {
    guides: "Rehberler",
    guidesTitle: "Adım adım,",
    guidesAccent: "/kurulumdan yayına",
    guidesLede:
      "Pagiera'yı entegre etmek, veri bağlamak, güvenle yayımlamak ve kodlama ajanlarıyla çalışmak için uygulamalı anlatımlar.",
    minutes: "dk okuma",
    updated: "Güncelleme",
    shortAnswer: "Kısa yanıt",
    takeaways: "Öne çıkanlar",
    onThisPage: "Bu sayfada",
    steps: "Adımlar",
    questions: "Sorular",
    related: "İlgili rehberler",
    compare: "Karşılaştırmalar",
    compareTitle: "Pagiera ve",
    compareAccent: "/bildiğiniz araçlar",
    compareLede:
      "Açık kaynak editörler, görsel CMS'ler ve barındırılan site kurucular: her biri ne işe yarar, hangisi ne zaman seçilir.",
    verdict: "Sonuç",
    choose: "Şunu seçin:",
    when: "",
    side: "Yan yana",
    otherComparisons: "Diğer karşılaştırmalar",
    faq: "SSS",
    faqTitle: "Sıkça sorulan",
    faqAccent: "/sorular",
    faqLede:
      "Pagiera'nın ne olduğu, nasıl çalıştığı ve neyi kimin kontrol ettiği hakkında yanıtlar.",
    templates: "Şablonlar",
    templatesTitle: "Hazır bir siteyle",
    templatesAccent: "/başlayın",
    templatesLede:
      "Her şablon yerel Pagiera sayfalarından oluşur. Stüdyodan kurun; her katman düzenlenebilir kalır.",
    preview: "Önizle",
    pages: "Sayfalar",
    useTemplate: "Bu şablonu kullan",
    back: "Tüm şablonlar",
    read: "Oku",
  },
} as const;
