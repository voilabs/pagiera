"use client";
import { RootProvider } from "fumadocs-ui/provider/next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Keys are Fumadocs UI's own message IDs (fumadocs-ui/dist/.translations).
const TR: Record<string, string> = {
  "Search(search trigger)": "Ara",
  "Search(search dialog)": "Dokümanlarda ara",
  "Open Search(search trigger)(aria-label)": "Aramayı aç",
  "Close Search(search dialog)(aria-label)": "Aramayı kapat",
  "No results found(search dialog)": "Sonuç bulunamadı",
  "Search failed(search dialog)": "Arama başarısız oldu",
  "Search failed, showing results for {query}(search dialog)":
    "Arama başarısız oldu, {query} için sonuçlar gösteriliyor",
  "On this page(table of contents)": "Bu sayfada",
  "No Headings(table of contents)": "Başlık yok",
  "Table of Contents(inline table of contents)": "İçindekiler",
  "Next Page(pagination)": "Sonraki",
  "Previous Page(pagination)": "Önceki",
  "Choose a language(language switcher)": "Dil seçin",
  "Choose a language(language switcher)(aria-label)": "Dil seçin",
  "Toggle Theme(theme switcher)(aria-label)": "Temayı değiştir",
  "Light(theme switcher)(aria-label)": "Açık",
  "Dark(theme switcher)(aria-label)": "Koyu",
  "System(theme switcher)(aria-label)": "Sistem",
  "Open Sidebar(sidebar)(aria-label)": "Kenar çubuğunu aç",
  "Close Sidebar(sidebar)(aria-label)": "Kenar çubuğunu kapat",
  "Close Sidebar(aria-label)": "Kenar çubuğunu kapat",
  "Collapse Sidebar(sidebar)(aria-label)": "Kenar çubuğunu daralt",
  "Show Sidebar(sidebar)": "Kenar çubuğunu göster",
  "Hide Sidebar(sidebar)": "Kenar çubuğunu gizle",
  "Toggle Menu(mobile menu)(aria-label)": "Menüyü aç/kapat",
  "Copy Text(code block)(aria-label)": "Kodu kopyala",
  "Copied Text(code block)(aria-label)": "Kopyalandı",
  "Copy Anchor Link(heading anchor)(aria-label)": "Başlık bağlantısını kopyala",
  "Copied Anchor Link(heading anchor)(aria-label)": "Bağlantı kopyalandı",
  "Copy Link(accordion)(aria-label)": "Bağlantıyı kopyala",
  "Copied Link(accordion)(aria-label)": "Bağlantı kopyalandı",
  "Last updated on(page footer)": "Son güncelleme",
  "Edit on GitHub(edit page)": "GitHub'da düzenle",
  "Page Not Found(404 page)": "Sayfa bulunamadı",
  "Back to Home(404 page)": "Ana sayfaya dön",
};
export function DocsProviders({
  children,
  locale,
}: {
  children: ReactNode;
  locale: "en" | "tr";
}) {
  const pathname = usePathname();
  return (
    <RootProvider
      theme={{ defaultTheme: "system", enableSystem: true }}
      i18n={{
        locale,
        defaultLanguage: "en",
        locales: [
          { locale: "en", name: "English" },
          { locale: "tr", name: "Türkçe" },
        ],
        onLocaleChange: (next) => {
          const path = pathname.replace(/^\/tr(?=\/|$)/, "");
          window.location.assign(next === "tr" ? "/tr" + path : path);
        },
        translations: locale === "tr" ? TR : undefined,
      }}
    >
      {children}
    </RootProvider>
  );
}
