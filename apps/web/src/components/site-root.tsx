import type { ReactNode } from "react";
import { StructuredData } from "@/components/structured-data";
import { fontVariables } from "@/lib/fonts";
import { siteStructuredData } from "@/lib/structured-data";
import "@/styles/globals.css";
export function SiteRoot({
  lang,
  children,
}: {
  lang: "en" | "tr";
  children: ReactNode;
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`flex min-h-screen flex-col ${fontVariables}`}>
        <StructuredData data={siteStructuredData(lang)} />
        {children}
      </body>
    </html>
  );
}
