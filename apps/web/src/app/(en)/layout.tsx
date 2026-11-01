import type { ReactNode } from "react";
import { SiteRoot } from "@/components/site-root";
export default function Layout({ children }: { children: ReactNode }) {
  return <SiteRoot lang="en">{children}</SiteRoot>;
}
