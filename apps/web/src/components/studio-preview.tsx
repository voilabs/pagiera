import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/icons";

type LayerRow = {
  /** Indent depth in the layer tree. */
  depth: number;
  glyph: "A" | "H" | "box" | "frame" | "link" | "component";
  name: string;
  caret?: boolean;
  badge?: string;
  selected?: boolean;
};

/**
 * A static illustration of the real studio: document chrome, the layer tree,
 * three responsive artboards and the inspector that edits the selected layer.
 * Nothing here is interactive — it is a picture of the product, drawn in CSS.
 */
export function StudioPreview({
  assets = false,
  crop = false,
}: {
  assets?: boolean;
  /** Shows only the top of the editor, so it can rise out of a section edge. */
  crop?: boolean;
}) {
  const { t } = useI18n();
  /** Mirrors the layer tree of the Forma page that ships with the editor. */
  const layerTree: LayerRow[] = [
    {
      depth: 0,
      glyph: "frame",
      name: t("Desktop", "Masaüstü"),
      caret: true,
      badge: t("MAIN", "ANA"),
    },
    { depth: 1, glyph: "box", name: t("Navigation", "Gezinme"), caret: true },
    { depth: 2, glyph: "A", name: t("Forma wordmark", "Forma yazı logosu") },
    {
      depth: 2,
      glyph: "box",
      name: t("Navigation links", "Gezinme bağlantıları"),
      caret: true,
    },
    { depth: 3, glyph: "link", name: t("Selected work", "Seçili çalışmalar") },
    { depth: 3, glyph: "link", name: t("The studio", "Stüdyo") },
    { depth: 3, glyph: "link", name: t("Let’s talk ↗", "Konuşalım ↗") },
    {
      depth: 1,
      glyph: "box",
      name: t("Hero · live shader", "Giriş · canlı shader"),
      caret: true,
    },
    { depth: 2, glyph: "box", name: t("Shader · Aurora", "Shader · Aurora") },
    {
      depth: 2,
      glyph: "box",
      name: t("Hero contrast overlay", "Giriş kontrast katmanı"),
    },
    {
      depth: 2,
      glyph: "box",
      name: t("Hero content", "Giriş içeriği"),
      caret: true,
    },
    {
      depth: 3,
      glyph: "box",
      name: t("Hero status", "Giriş durumu"),
      caret: true,
    },
    { depth: 4, glyph: "A", name: t("Availability", "Müsaitlik") },
    { depth: 4, glyph: "A", name: t("BASED EVERYWHERE …", "HER YERDEYİZ …") },
    {
      depth: 3,
      glyph: "box",
      name: t("Hero columns", "Giriş sütunları"),
      caret: true,
    },
    { depth: 4, glyph: "box", name: t("Introduction", "Tanıtım"), caret: true },
    { depth: 5, glyph: "A", name: t("A SMALL STUDIO F…", "KÜÇÜK BİR STÜDYO…") },
    {
      depth: 5,
      glyph: "H",
      name: t("Main headline", "Ana başlık"),
      selected: true,
    },
    { depth: 5, glyph: "H", name: t("Serif headline", "Serif başlık") },
    { depth: 5, glyph: "A", name: t("Introduction copy", "Tanıtım metni") },
    {
      depth: 5,
      glyph: "link",
      name: t("Explore our work ↗", "Çalışmalarımızı keşfedin ↗"),
    },
    {
      depth: 4,
      glyph: "box",
      name: t("Orbital sculpture · edit…", "Yörünge heykeli · düzenle…"),
      caret: true,
    },
    { depth: 5, glyph: "box", name: t("Orbit 1", "Yörünge 1") },
    { depth: 5, glyph: "box", name: t("Orbit 2", "Yörünge 2") },
    { depth: 5, glyph: "box", name: t("Orbit 3", "Yörünge 3") },
  ];

  const assetTree: LayerRow[] = [
    {
      depth: 0,
      glyph: "component",
      name: t("Project card", "Proje kartı"),
      caret: true,
    },
    { depth: 1, glyph: "box", name: t("Cover media", "Kapak medyası") },
    { depth: 1, glyph: "A", name: t("Project title", "Proje başlığı") },
    {
      depth: 1,
      glyph: "link",
      name: t("Read the case ↗", "Örnek çalışmayı okuyun ↗"),
    },
    { depth: 0, glyph: "component", name: t("Pill button", "Oval düğme") },
    {
      depth: 0,
      glyph: "component",
      name: t("Marquee row", "Kayan şerit satırı"),
    },
    {
      depth: 0,
      glyph: "frame",
      name: t("Main layout", "Ana düzen"),
      caret: true,
      badge: t("LAYOUT", "DÜZEN"),
    },
    { depth: 1, glyph: "box", name: t("Navigation", "Gezinme") },
    {
      depth: 1,
      glyph: "box",
      name: t("Children", "Alt öğeler"),
      selected: true,
    },
    { depth: 1, glyph: "box", name: t("Footer", "Altbilgi") },
    {
      depth: 0,
      glyph: "frame",
      name: t("Case study layout", "Örnek çalışma düzeni"),
      caret: true,
    },
    { depth: 1, glyph: "box", name: t("Breadcrumb", "Gezinme yolu") },
    { depth: 1, glyph: "box", name: t("Children", "Alt öğeler") },
    {
      depth: 0,
      glyph: "component",
      name: t("Footer · shared", "Altbilgi · ortak"),
    },
  ];

  const documentTabs: [IconName, string][] = [
    ["grid", t("Assets", "Varlıklar")],
    ["settings", t("Settings", "Ayarlar")],
    ["arrow", t("Import & export", "İçe ve dışa aktarma")],
    ["brackets", t("Variables", "Değişkenler")],
    ["sparkles", t("AI settings", "Yapay zekâ ayarları")],
    ["panel", t("Pages", "Sayfalar")],
    ["undo", t("History", "Geçmiş")],
  ];

  const inspectorTabs = [
    t("Content", "İçerik"),
    t("Layout", "Düzen"),
    t("Style", "Stil"),
    t("Effects", "Efektler"),
  ];

  const tree = assets ? assetTree : layerTree;

  return (
    <figure
      aria-label={t(
        "Illustration of the Pagiera editor: document tabs, a layer tree, three responsive artboards and the style inspector",
        "Pagiera editörünün görseli: belge sekmeleri, katman ağacı, ekranlara uyumlu üç çalışma yüzeyi ve stil denetleyicisi",
      )}
      className={`studio-preview${crop ? " studio-preview-crop" : ""}`}
    >
      <div className="sp-chrome" aria-hidden="true">
        <div className="sp-chrome-side">
          <span className="sp-app">
            <i className="sp-app-mark" />
            {t("Canvas", "Tuval")}
            <Icon className="sp-caret" name="chevron" size={11} />
          </span>
          <span className="sp-ghost-btn">
            <Icon name="plus" size={13} />
          </span>
        </div>

        <div className="sp-tabs">
          <span className="sp-tab sp-tab-on">
            <Icon name="frame" size={12} />
            {t("Home", "Ana sayfa")}
            <Icon className="sp-tab-close" name="close" size={11} />
          </span>
          {documentTabs.map(([icon, label]) => (
            <span className="sp-tab" key={label}>
              <Icon name={icon} size={12} />
              {label}
            </span>
          ))}
        </div>

        <div className="sp-chrome-side sp-chrome-end">
          <span className="sp-saved">
            <i />
            {t("Saved", "Kaydedildi")}
          </span>
          <span className="sp-republish">
            {t("Republish", "Yeniden yayınla")}
            <i>
              <Icon name="chevron" size={11} />
            </i>
          </span>
        </div>
      </div>

      <div className="sp-body" aria-hidden="true">
        <aside className="sp-panel sp-left">
          <div className="sp-panel-tabs">
            <span>{t("Pages", "Sayfalar")}</span>
            <span className={assets ? undefined : "on"}>
              {t("Layers", "Katmanlar")}
            </span>
            <span className={assets ? "on" : undefined}>
              {t("Assets", "Varlıklar")}
            </span>
          </div>
          <div className="sp-doc-row">
            {assets ? t("Library", "Kütüphane") : t("Document", "Belge")}
            <span>
              <Icon name="minus" size={12} />
              <Icon name="plus" size={12} />
            </span>
          </div>
          <div className="sp-search">
            <Icon name="search" size={12} />
            {assets
              ? t("Search assets…", "Varlık ara…")
              : t("Search layers…", "Katman ara…")}
          </div>
          <div className="sp-tree">
            {tree.map((row) => (
              <span
                className={`sp-row${row.selected ? " sp-row-on" : ""}`}
                key={row.name}
                style={{ paddingLeft: `${8 + row.depth * 13}px` }}
              >
                <i className="sp-caret-slot">
                  {row.caret ? <Icon name="chevron" size={9} /> : null}
                </i>
                <LayerGlyph glyph={row.glyph} />
                <em>{row.name}</em>
                {row.badge ? <b>{row.badge}</b> : null}
              </span>
            ))}
          </div>
        </aside>

        <div className="sp-canvas">
          <div className="sp-boards">
            <Artboard
              main
              name={t("Desktop", "Masaüstü")}
              range="&ge; 1280px"
              size="lg"
              width="1280"
            />
            <Artboard
              name={t("Tablet", "Tablet")}
              range="768&ndash;1279px"
              size="md"
              width="768"
            />
            <Artboard
              name={t("Mobile", "Mobil")}
              range="&le; 767px"
              size="sm"
              width="390"
            />
          </div>
          <span className="sp-fab">
            <Icon name="sparkles" size={15} />
          </span>
        </div>

        <aside className="sp-panel sp-right">
          <div className="sp-panel-tabs">
            <span>Luma</span>
            <span className="on">{t("Style", "Stil")}</span>
          </div>
          <div className="sp-segment">
            {inspectorTabs.map((tab) => (
              <span
                className={tab === t("Content", "İçerik") ? "on" : undefined}
                key={tab}
              >
                {tab}
              </span>
            ))}
          </div>

          <InspectorSection title={t("Text", "Metin")}>
            <p className="sp-label">{t("Content", "İçerik")}</p>
            <span className="sp-field sp-area">
              {t("Good ideas.", "İyi fikirler.")}
              <br />
              {t("Extraordinary", "Olağanüstü")}
            </span>
          </InspectorSection>

          <InspectorSection title={t("Data binding", "Veri bağlama")}>
            <p className="sp-row-field">
              <span>{t("Source", "Kaynak")}</span>
              <span className="sp-field sp-select">
                <Icon name="chevron" size={11} />
              </span>
            </p>
            <p className="sp-help">
              {t(
                "Uses the returned object directly. Repeat is only needed when you want to render every item in a list.",
                "Dönen nesneyi doğrudan kullanır. Yineleme yalnızca listedeki her öğeyi göstermek istediğinizde gereklidir.",
              )}
            </p>
          </InspectorSection>

          <InspectorSection title={t("Layer name", "Katman adı")}>
            <p className="sp-row-field">
              <span>{t("Name", "Ad")}</span>
              <span className="sp-field sp-value">
                {t("Main headline", "Ana başlık")}
              </span>
            </p>
          </InspectorSection>

          <InspectorSection title="HTML">
            <p className="sp-row-field">
              <span>{t("Tag", "Etiket")}</span>
              <span className="sp-field sp-select">
                <Icon name="chevron" size={11} />
              </span>
            </p>
            <p className="sp-help">
              {t(
                "Changes only the published markup — the canvas keeps drawing the element the same way.",
                "Yalnızca yayınlanan işaretlemeyi değiştirir — tuval öğeyi aynı şekilde göstermeye devam eder.",
              )}
            </p>
            <p className="sp-row-field">
              <span>{t("Classes", "Sınıflar")}</span>
              <span className="sp-field sp-value">hero-card featured</span>
            </p>
            <p className="sp-label">{t("Inline style", "Satır içi stil")}</p>
            <span className="sp-field sp-area sp-code">
              mix-blend-mode: difference;
              <br />
              --accent: #5402e6;
            </span>
            <p className="sp-help">
              {t(
                "Applied on the element itself, so it overrides everything the inspector set.",
                "Doğrudan öğeye uygulanır; bu nedenle denetleyicinin tüm ayarlarının önüne geçer.",
              )}
            </p>
          </InspectorSection>
        </aside>
      </div>

      <figcaption className="sr-only">
        {t(
          "Simplified studio illustration. Design across breakpoints and publish the page from one workspace.",
          "Basitleştirilmiş stüdyo görseli. Farklı kırılma noktaları için tasarlayın ve sayfayı tek çalışma alanından yayınlayın.",
        )}
      </figcaption>
    </figure>
  );
}

function LayerGlyph({ glyph }: { glyph: LayerRow["glyph"] }) {
  if (glyph === "A" || glyph === "H") {
    return <i className="sp-glyph sp-glyph-letter">{glyph}</i>;
  }
  const icon: IconName =
    glyph === "frame"
      ? "frame"
      : glyph === "link"
        ? "globe"
        : glyph === "component"
          ? "brackets"
          : "grid";
  return (
    <i className="sp-glyph">
      <Icon name={icon} size={10} />
    </i>
  );
}

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="sp-section">
      <p className="sp-section-head">
        {title}
        <Icon name="chevron" size={11} />
      </p>
      {children}
    </div>
  );
}

function Artboard({
  main,
  name,
  range,
  size,
  width,
}: {
  main?: boolean;
  name: string;
  range: string;
  size: "lg" | "md" | "sm";
  width: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`sp-board sp-board-${size}`}>
      <div className="sp-board-bar">
        <span className="sp-board-name">{name}</span>
        <span className="sp-board-meta">
          <i>{width}</i>
          <i className="sp-board-range">{range}</i>
          {main ? <b>{t("MAIN", "ANA")}</b> : null}
          <Icon name="plus" size={11} />
        </span>
      </div>
      <div className="sp-board-inner">
        <PreviewSite selected={size === "lg"} />
      </div>
    </div>
  );
}

/** The page being designed: one studio site, rendered inside every artboard. */
function PreviewSite({ selected }: { selected: boolean }) {
  const { t } = useI18n();
  return (
    <div className="sp-site">
      <div className="sp-hero">
        <div className="sp-hero-shader" />
        <div className="sp-hero-nav">
          <b>
            <i className="sp-hero-mark" />
            forma&#174;
          </b>
          <span>
            <i>{t("Selected work", "Seçili çalışmalar")}</i>
            <i>{t("The studio", "Stüdyo")}</i>
          </span>
          <i className="sp-hero-talk">{t("Let’s talk ↗", "Konuşalım ↗")}</i>
        </div>
        <div className="sp-hero-status">
          <span>
            {t(
              "● Independent minds. Shared ambition.",
              "● Bağımsız zihinler. Ortak hedefler.",
            )}
          </span>
          <span>
            {t(
              "BASED EVERYWHERE / CREATING BEYOND",
              "HER YERDEYİZ / SINIRLARIN ÖTESİNİ TASARLIYORUZ",
            )}
          </span>
        </div>
        <div className="sp-hero-grid">
          <div className="sp-hero-col">
            <p className="sp-hero-eyebrow">
              {t(
                "A small studio for big possibilities",
                "Büyük olasılıklar için küçük bir stüdyo",
              )}
            </p>
            <div className={selected ? "sp-selection" : undefined}>
              <strong className="sp-hero-title">
                {t("Good ideas.", "İyi fikirler.")}
                <br />
                {t("Extraordinary", "Olağanüstü")}
              </strong>
              {selected ? (
                <>
                  <small>{t("Main headline", "Ana başlık")}</small>
                  {["tl", "tr", "bl", "br"].map((corner) => (
                    <i
                      className={`sp-handle sp-handle-${corner}`}
                      key={corner}
                    />
                  ))}
                </>
              ) : null}
            </div>
            <strong className="sp-hero-title sp-hero-serif">
              {t("possibilities.", "olasılıklar.")}
            </strong>
            <p className="sp-hero-copy">
              {t(
                "We turn a spark into something people feel.",
                "Bir kıvılcımı insanların hissedebileceği bir şeye dönüştürüyoruz.",
              )}
              <br />
              {t(
                "Thoughtful brands. Expressive websites. Lasting impressions.",
                "Özenli markalar. Kendini ifade eden web siteleri. Kalıcı izlenimler.",
              )}
            </p>
            <span className="sp-hero-cta">
              {t("Explore our work ↗", "Çalışmalarımızı keşfedin ↗")}
            </span>
          </div>
          <OrbitSculpture />
        </div>
        <div className="sp-hero-foot">
          <span>
            {t(
              "STRATEGY · DESIGN · DEVELOPMENT",
              "STRATEJİ · TASARIM · GELİŞTİRME",
            )}
          </span>
          <span>{t("SCROLL TO DISCOVER ↓", "KEŞFETMEK İÇİN KAYDIRIN ↓")}</span>
        </div>
      </div>

      <div className="sp-logos">
        <span className="sp-logos-label">
          {t("Good company.", "İyi ortaklar.")}
          <br />
          {t("Even better collaborations.", "Daha da iyi iş birlikleri.")}
        </span>
        <i>ers</i>
        <i className="sp-logo-serif">Sisyphus</i>
        <i>&#9642;Circooles</i>
        <i>Catalog</i>
        <i>&#8984;Quotient</i>
        <i>Nietzsch&#8230;</i>
      </div>

      <div className="sp-work">
        <p className="sp-work-index">
          {t("01 / Selected work", "01 / Seçili çalışmalar")}
        </p>
        <h3>{t("Different by design.", "Tasarımıyla farklı.")}</h3>
        <p className="sp-work-copy">
          {t(
            "A few things we’ve put our hearts into. Always intentional. Never off the shelf.",
            "Kalbimizi koyduğumuz birkaç çalışma. Her zaman özenle. Asla sıradan değil.",
          )}
        </p>
        <div className="sp-work-card">
          <span className="sp-work-tag">
            {t("Everyday, reimagined.", "Gündelik hayat, yeniden tasarlandı.")}
          </span>
          <strong>{t("Objects of tomorrow.", "Yarının nesneleri.")}</strong>
          <p>
            {t(
              "A new perspective on everyday essentials.",
              "Günlük ihtiyaçlara yeni bir bakış.",
            )}
          </p>
          <span className="sp-work-meta">
            {t(
              "Brand identity / Digital experience",
              "Marka kimliği / Dijital deneyim",
            )}
          </span>
          <i className="sp-work-mark">ora&#174;</i>
        </div>
      </div>
    </div>
  );
}

/** The orbital object that sits beside the headline in the Forma template. */
function OrbitSculpture() {
  const { t } = useI18n();
  return (
    <svg
      aria-hidden="true"
      className="sp-orbit"
      fill="none"
      viewBox="0 0 200 200"
    >
      <title>{t("Orbital sculpture", "Yörünge heykeli")}</title>
      <g stroke="rgba(255,255,255,.6)" strokeWidth="1.5">
        <circle cx="100" cy="100" r="60" />
        <ellipse cx="100" cy="100" rx="88" ry="38" />
        <ellipse
          cx="100"
          cy="100"
          rx="88"
          ry="38"
          transform="rotate(60 100 100)"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="88"
          ry="38"
          transform="rotate(120 100 100)"
        />
      </g>
      <text
        fill="#fff"
        fontFamily="Georgia, serif"
        fontSize="44"
        textAnchor="middle"
        x="100"
        y="115"
      >
        f.
      </text>
    </svg>
  );
}
