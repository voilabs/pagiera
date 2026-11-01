import type { ReactNode } from "react";
import { SiteRoot } from "@/components/site-root";
import { rootMetadata } from "@/lib/seo";
export const metadata = rootMetadata("tr");
export default function Layout({ children }: { children: ReactNode }) {
  return <SiteRoot lang="tr">{children}</SiteRoot>;
}
