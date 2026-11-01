import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FeaturePage,
  FeaturesIndex,
} from "@/components/features/feature-pages";
import { LandingPage } from "@/components/landing/landing-page";
import { CompareIndex, ComparePage } from "@/components/pages/compare-pages";
import {
  FaqPage,
  GuidePage,
  GuidesIndex,
} from "@/components/pages/content-pages";
import { IntegrationsPage } from "@/components/pages/integrations-page";
import {
  TemplatePreview,
  TemplatesIndex,
} from "@/components/pages/template-pages";
import { guides, PAGE_UI } from "@/lib/content";
import { COMPARE } from "@/lib/content/compare-copy";
import { FEATURES } from "@/lib/features-copy";
import { INTEGRATIONS_UI } from "@/lib/integrations";
import { LANDING, type Locale } from "@/lib/landing-copy";
import routes from "@/lib/reset-routes.json";

// Every marketing URL is listed in reset-routes.json; anything else is a 404.
function resolve(path: string, locale: Locale) {
  if (!routes.some((r) => r.path === path)) return null;
  const [, section, slug, extra] = path.split("/");
  if (!section) return { kind: "home" } as const;
  if (section === "integrations" && !slug)
    return { kind: "integrations" } as const;
  if (section === "features" && !slug) return { kind: "features" } as const;
  if (section === "features") {
    const feature = FEATURES[locale].features.find((f) => f.slug === slug);
    return feature ? ({ kind: "feature", feature } as const) : null;
  }
  if (section === "guides" && !slug) return { kind: "guides" } as const;
  if (section === "guides") {
    const guide = guides(locale).find((g) => g.slug === slug);
    return guide ? ({ kind: "guide", guide } as const) : null;
  }
  if (section === "compare" && !slug) return { kind: "compare" } as const;
  if (section === "compare") {
    const item = COMPARE[locale].rivals.find((c) => c.slug === slug);
    return item ? ({ kind: "comparison", item } as const) : null;
  }
  if (section === "templates" && !slug) return { kind: "templates" } as const;
  if (section === "templates" && extra === "preview")
    return { kind: "preview", id: slug } as const;
  if (section === "faq") return { kind: "faq" } as const;
  return null;
}

export function marketingMetadata(path: string, locale: Locale): Metadata {
  const page = resolve(path, locale);
  const ui = PAGE_UI[locale];
  const robots = { index: false, follow: false };
  const title = (name: string) => `${name} — Pagiera`;
  switch (page?.kind) {
    case "home":
      return {
        title: title(LANDING[locale].heroTitle.replace("\n", " ")),
        robots,
      };
    case "features":
      return {
        title: title(FEATURES[locale].ui.indexEyebrow),
        description: FEATURES[locale].ui.indexLede,
        robots,
      };
    case "integrations":
      return {
        title: title(INTEGRATIONS_UI[locale].eyebrow),
        description: INTEGRATIONS_UI[locale].lede,
        robots,
      };
    case "feature":
      return {
        title: title(page.feature.name),
        description: page.feature.lede,
        robots,
      };
    case "guides":
      return { title: title(ui.guides), description: ui.guidesLede, robots };
    case "guide":
      return {
        title: title(page.guide.title),
        description: page.guide.description,
        robots,
      };
    case "compare":
      return { title: title(ui.compare), description: ui.compareLede, robots };
    case "comparison":
      return {
        title: title(`Pagiera vs ${page.item.name}`),
        description: page.item.verdict,
        robots,
      };
    case "templates":
      return {
        title: title(ui.templates),
        description: ui.templatesLede,
        robots,
      };
    case "preview":
      return { title: title(`${ui.preview} · ${page.id}`), robots };
    case "faq":
      return { title: title(ui.faq), description: ui.faqLede, robots };
    default:
      return { title: "Pagiera", robots };
  }
}

export function MarketingPage({
  path,
  locale,
}: {
  path: string;
  locale: Locale;
}) {
  const page = resolve(path, locale);
  switch (page?.kind) {
    case "home":
      return <LandingPage locale={locale} />;
    case "integrations":
      return <IntegrationsPage locale={locale} />;
    case "features":
      return <FeaturesIndex locale={locale} />;
    case "feature":
      return <FeaturePage locale={locale} slug={page.feature.slug} />;
    case "guides":
      return <GuidesIndex locale={locale} />;
    case "guide":
      return <GuidePage locale={locale} slug={page.guide.slug} />;
    case "compare":
      return <CompareIndex locale={locale} />;
    case "comparison":
      return <ComparePage locale={locale} slug={page.item.slug} />;
    case "templates":
      return <TemplatesIndex locale={locale} />;
    case "preview":
      return <TemplatePreview locale={locale} id={page.id} />;
    case "faq":
      return <FaqPage locale={locale} />;
    default:
      notFound();
  }
}
