import routes from "@/lib/reset-routes.json";
import { localizedHref } from "@/lib/urls";
export default function ResetPage({
  path = "/",
  locale = "en",
}: {
  path?: string;
  locale?: "en" | "tr";
}) {
  const page = routes.find((r) => r.path === path);
  const tr = locale === "tr";
  return (
    <div className="site-reset">
      <header className="reset-header">
        <a className="brand" href={localizedHref("/", locale)}>
          Pagiera
        </a>
        <nav aria-label={tr ? "Gezinme" : "Navigation"}>
          <a href={localizedHref("/docs", locale)}>
            {tr ? "Dokümantasyon" : "Documentation"} ↗
          </a>
          <a href={localizedHref(path, tr ? "en" : "tr")}>{tr ? "EN" : "TR"}</a>
        </nav>
      </header>
      <main className="reset-main">
        <p className="eyebrow">{tr ? "Yeni bir başlangıç" : "A fresh start"}</p>
        <h1>{(tr ? page?.tr : page?.en) ?? "Pagiera"}</h1>
        <p>
          {tr
            ? "Bu sayfa sıfırlandı. İçeriği ve tasarımı baştan oluşturuyoruz."
            : "This page has been reset. We are rebuilding the content and design from scratch."}
        </p>
        <code>{localizedHref(path, locale)}</code>
        <div className="routes">
          {routes
            .filter((r) =>
              [
                "/",
                "/features",
                "/guides",
                "/compare",
                "/templates",
                "/faq",
              ].includes(r.path),
            )
            .map((r) => (
              <a key={r.path} href={localizedHref(r.path, locale)}>
                {tr ? r.tr : r.en}
              </a>
            ))}
        </div>
      </main>
    </div>
  );
}
