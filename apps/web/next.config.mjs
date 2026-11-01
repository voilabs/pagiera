import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
export default withMDX({
  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
});
