import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // The hero art is a pair of ~1.1MB PNGs; AVIF/WebP cut what actually
    // reaches the browser, which is the LCP the ranking systems measure.
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
