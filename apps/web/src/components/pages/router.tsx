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
import { StructuredData } from "@/components/structured-data";
import { guides, PAGE_UI } from "@/lib/content";
import { COMPARE } from "@/lib/content/compare-copy";
import { FEATURES } from "@/lib/features-copy";
import { INTEGRATIONS_UI } from "@/lib/integrations";
import type { Locale } from "@/lib/landing-copy";
import routes from "@/lib/reset-routes.json";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { type Breadcrumb, pageStructuredData } from "@/lib/structured-data";

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

type MarketingRoute = NonNullable<ReturnType<typeof resolve>>;
function describe(page: MarketingRoute, locale: Locale) {
  const tr = locale === "tr";
  const ui = PAGE_UI[locale];
  switch (page.kind) {
    case "home":
      return {
        title: tr
          ? "React ve Next.js için açık kaynak site oluşturucu"
          : "Open-source website builder for React & Next.js",
        description: SITE_DESCRIPTION[locale],
      };
    case "features":
      return {
        title: tr
          ? "Görsel site oluşturucu özellikleri"
          : "Visual website builder features",
        description: FEATURES[locale].ui.indexLede,
      };
    case "integrations":
      return {
        title: tr
          ? "Uygulama, veri ve yapay zekâ entegrasyonları"
          : "Framework, data and AI integrations",
        description: INTEGRATIONS_UI[locale].lede,
      };
    case "feature": {
      const titles = {
        data: tr
          ? "Görsel sayfalarda dinamik veri bağlama"
          : "Dynamic data binding for visual websites",
        "action-workflow": tr
          ? "Görsel aksiyon ve iş akışı oluşturucu"
          : "Visual Action Workflow builder",
        "motion-editor": tr
          ? "Görsel animasyon ve Motion editörü"
          : "Visual animation and Motion Editor",
      };
      return {
        title: titles[page.feature.slug],
        description: page.feature.lede,
      };
    }
    case "guides":
      return {
        title: tr
          ? "React ve Next.js site geliştirme rehberleri"
          : "React & Next.js website building guides",
        description: ui.guidesLede,
      };
    case "guide":
      return {
        title: page.guide.title,
        description: page.guide.description,
        modified: page.guide.updated,
      };
    case "compare":
      return {
        title: tr
          ? "Görsel site oluşturucu karşılaştırmaları"
          : "Visual website builder comparisons",
        description: ui.compareLede,
      };
    case "comparison":
      return {
        title: `Pagiera vs ${page.item.name}`,
        description: page.item.verdict,
      };
    case "templates":
      return {
        title: tr ? "Görsel site şablonları" : "Visual website templates",
        description: ui.templatesLede,
      };
    case "preview":
      return {
        title: `${ui.preview} · ${page.id}`,
        description: tr
          ? "Pagiera site şablonunun önizlemesi."
          : "Preview of a Pagiera website template.",
        noIndex: true,
      };
    case "faq":
      return {
        title: tr
          ? "Pagiera hakkında sık sorulan sorular"
          : "Frequently asked questions about Pagiera",
        description: ui.faqLede,
      };
  }
}

export function marketingMetadata(path: string, locale: Locale): Metadata {
  const page = resolve(path, locale);
  if (!page) notFound();
  return pageMetadata({ path, locale, ...describe(page, locale) });
}

export function MarketingPage({
  path,
  locale,
}: {
  path: string;
  locale: Locale;
}) {
  const page = resolve(path, locale);
  if (!page) notFound();
  const info = describe(page, locale);
  const breadcrumbs: Breadcrumb[] = [{ name: "Pagiera", path: "/" }];
  const section = path.split("/")[1];
  const parent = routes.find((route) => route.path === `/${section}`);
  if (path !== "/") {
    if (parent && parent.path !== path)
      breadcrumbs.push({ name: parent[locale], path: parent.path });
    breadcrumbs.push({
      name: page.kind === "feature" ? page.feature.name : info.title,
      path,
    });
  }
  return (
    <>
      {page.kind !== "preview" && (
        <StructuredData
          data={pageStructuredData({
            path,
            locale,
            ...info,
            breadcrumbs,
            article: page.kind === "guide",
            collection: [
              "features",
              "guides",
              "compare",
              "templates",
              "integrations",
            ].includes(page.kind),
            sourceCode: page.kind === "home",
          })}
        />
      )}
      <MarketingContent path={path} locale={locale} />
    </>
  );
}

function MarketingContent({ path, locale }: { path: string; locale: Locale }) {
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
