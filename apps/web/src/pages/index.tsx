import { motion, useScroll, useSpring } from "framer-motion";
import { Manrope } from "next/font/google";
import { ConversionFooter } from "@/components/conversion-footer";
import { AiSection } from "@/components/landing/ai-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { ProductDetails } from "@/components/landing/product-details";
import { StudioSection } from "@/components/landing/studio-section";
import { TemplatesSection } from "@/components/landing/templates-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { Seo } from "@/components/seo";
import { SiteBar } from "@/components/site-bar";
import { productFaq } from "@/lib/product-content";
import { productFaqTr } from "@/lib/product-content-tr";
import { useI18n } from "@/lib/i18n";
import { SITE_DESCRIPTION } from "@/lib/site";
import {
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/lib/structured-data";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

export default function Home() {
  const { locale, t } = useI18n();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32 });

  return (
    <div className={`${manrope.variable} min-w-80 overflow-clip font-sans`}>
      <Seo
        description={t(SITE_DESCRIPTION, "Pagiera, React ve Next.js için açık kaynaklı görsel site oluşturucudur. Kendi uygulamanızda sayfalar tasarlayın, verilerinizi bağlayın ve sunucuda işlenen siteler yayımlayın.")}
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqSchema(locale === "tr" ? productFaqTr : productFaq),
        ]}
        path="/"
        title={t("Pagiera — Open-source React & Next.js Website Builder", "Pagiera — React ve Next.js için Açık Kaynaklı Site Oluşturucu")}
      />
      <motion.div
        className="fixed inset-x-0 top-0 z-[200] h-[3px] origin-left bg-[linear-gradient(90deg,#6a25f0,#939393)]"
        style={{ scaleX: progress }}
      />
      <SiteBar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StudioSection />
        <WorkflowSection />
        <AiSection />
        <TemplatesSection />
        <ProductDetails />
      </main>
      <ConversionFooter />
    </div>
  );
}
