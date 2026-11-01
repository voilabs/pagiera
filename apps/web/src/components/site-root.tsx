import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
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
        {children}
      </body>
    </html>
  );
}
