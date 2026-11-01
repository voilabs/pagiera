import type { ReactNode } from "react";
import { SiteRoot } from "@/components/site-root";
import { rootMetadata } from "@/lib/seo";
export const metadata = rootMetadata("en");
export default function Layout({ children }: { children: ReactNode }) {
  return <SiteRoot lang="en">{children}</SiteRoot>;
}
