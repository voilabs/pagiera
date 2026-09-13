import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // `localeDetection` is deliberately absent: Next types it as `false` only,
  // because leaving it out *is* how you keep detection on. It runs on the
  // application root alone and yields to the NEXT_LOCALE cookie, so the
  // language switcher is a permanent override, not a per-visit preference.
  i18n: { locales: ["en", "tr"], defaultLocale: "en" },
  images: {
    // The hero art is a pair of ~1.1MB PNGs; AVIF/WebP cut what actually
    // reaches the browser, which is the LCP the ranking systems measure.
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
