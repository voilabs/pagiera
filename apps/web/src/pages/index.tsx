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
import { SITE_DESCRIPTION } from "@/lib/site";
import {
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/lib/structured-data";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-pagiera" });

export default function Home() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32 });

  return (
    <div className={`${manrope.variable} min-w-80 overflow-clip font-sans`}>
      <Seo
        description={SITE_DESCRIPTION}
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqSchema(productFaq),
        ]}
        path="/"
        title="Pagiera — Open-source React & Next.js Website Builder"
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
