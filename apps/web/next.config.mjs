import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
export default withMDX({
  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
});
