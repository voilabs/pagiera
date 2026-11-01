import type { ReactNode } from "react";
import { DocumentationLayout } from "@/components/docs-layout";
export default function Layout({ children }: { children: ReactNode }) {
  return <DocumentationLayout locale="en">{children}</DocumentationLayout>;
}
