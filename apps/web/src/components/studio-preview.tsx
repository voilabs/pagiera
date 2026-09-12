import type { ReactNode } from "react";
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

/** Mirrors the layer tree of the Forma page that ships with the editor. */
const layerTree: LayerRow[] = [
  { depth: 0, glyph: "frame", name: "Desktop", caret: true, badge: "MAIN" },
  { depth: 1, glyph: "box", name: "Navigation", caret: true },
  { depth: 2, glyph: "A", name: "Forma wordmark" },
  { depth: 2, glyph: "box", name: "Navigation links", caret: true },
  { depth: 3, glyph: "link", name: "Selected work" },
  { depth: 3, glyph: "link", name: "The studio" },
  { depth: 3, glyph: "link", name: "Let’s talk ↗" },
  { depth: 1, glyph: "box", name: "Hero · live shader", caret: true },
  { depth: 2, glyph: "box", name: "Shader · Aurora" },
  { depth: 2, glyph: "box", name: "Hero contrast overlay" },
  { depth: 2, glyph: "box", name: "Hero content", caret: true },
  { depth: 3, glyph: "box", name: "Hero status", caret: true },
  { depth: 4, glyph: "A", name: "Availability" },
  { depth: 4, glyph: "A", name: "BASED EVERYWHERE …" },
  { depth: 3, glyph: "box", name: "Hero columns", caret: true },
  { depth: 4, glyph: "box", name: "Introduction", caret: true },
  { depth: 5, glyph: "A", name: "A SMALL STUDIO F…" },
  { depth: 5, glyph: "H", name: "Main headline", selected: true },
  { depth: 5, glyph: "H", name: "Serif headline" },
  { depth: 5, glyph: "A", name: "Introduction copy" },
  { depth: 5, glyph: "link", name: "Explore our work ↗" },
  { depth: 4, glyph: "box", name: "Orbital sculpture · edit…", caret: true },
  { depth: 5, glyph: "box", name: "Orbit 1" },
  { depth: 5, glyph: "box", name: "Orbit 2" },
  { depth: 5, glyph: "box", name: "Orbit 3" },
];

const assetTree: LayerRow[] = [
  { depth: 0, glyph: "component", name: "Project card", caret: true },
  { depth: 1, glyph: "box", name: "Cover media" },
  { depth: 1, glyph: "A", name: "Project title" },
  { depth: 1, glyph: "link", name: "Read the case ↗" },
  { depth: 0, glyph: "component", name: "Pill button" },
  { depth: 0, glyph: "component", name: "Marquee row" },
  {
    depth: 0,
    glyph: "frame",
    name: "Main layout",
    caret: true,
    badge: "LAYOUT",
  },
  { depth: 1, glyph: "box", name: "Navigation" },
  { depth: 1, glyph: "box", name: "Children", selected: true },
  { depth: 1, glyph: "box", name: "Footer" },
  { depth: 0, glyph: "frame", name: "Case study layout", caret: true },
  { depth: 1, glyph: "box", name: "Breadcrumb" },
  { depth: 1, glyph: "box", name: "Children" },
  { depth: 0, glyph: "component", name: "Footer · shared" },
];

const documentTabs: [IconName, string][] = [
  ["grid", "Assets"],
  ["settings", "Settings"],
  ["arrow", "Import & export"],
  ["brackets", "Variables"],
  ["sparkles", "AI settings"],
  ["panel", "Pages"],
  ["undo", "History"],
];

const inspectorTabs = ["Content", "Layout", "Style", "Effects"];

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
  const tree = assets ? assetTree : layerTree;

  return (
    <figure
      aria-label="Illustration of the Pagiera editor: document tabs, a layer tree, three responsive artboards and the style inspector"
      className={`studio-preview${crop ? " studio-preview-crop" : ""}`}
    >
      <div className="sp-chrome" aria-hidden="true">
        <div className="sp-chrome-side">
          <span className="sp-app">
            <i className="sp-app-mark" />
            Canvas
            <Icon className="sp-caret" name="chevron" size={11} />
          </span>
          <span className="sp-ghost-btn">
            <Icon name="plus" size={13} />
          </span>
        </div>

        <div className="sp-tabs">
          <span className="sp-tab sp-tab-on">
            <Icon name="frame" size={12} />
            Home
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
            Saved
          </span>
          <span className="sp-republish">
            Republish
            <i>
              <Icon name="chevron" size={11} />
            </i>
          </span>
        </div>
      </div>

      <div className="sp-body" aria-hidden="true">
        <aside className="sp-panel sp-left">
          <div className="sp-panel-tabs">
            <span>Pages</span>
            <span className={assets ? undefined : "on"}>Layers</span>
            <span className={assets ? "on" : undefined}>Assets</span>
          </div>
          <div className="sp-doc-row">
            {assets ? "Library" : "Document"}
            <span>
              <Icon name="minus" size={12} />
              <Icon name="plus" size={12} />
            </span>
          </div>
          <div className="sp-search">
            <Icon name="search" size={12} />
            {assets ? "Search assets…" : "Search layers…"}
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
              name="Desktop"
              range="&ge; 1280px"
              size="lg"
              width="1280"
            />
            <Artboard
              name="Tablet"
              range="768&ndash;1279px"
              size="md"
              width="768"
            />
            <Artboard name="Mobile" range="&le; 767px" size="sm" width="390" />
          </div>
          <span className="sp-fab">
            <Icon name="sparkles" size={15} />
          </span>
        </div>

        <aside className="sp-panel sp-right">
          <div className="sp-panel-tabs">
            <span>Luma</span>
            <span className="on">Style</span>
          </div>
          <div className="sp-segment">
            {inspectorTabs.map((tab) => (
              <span className={tab === "Content" ? "on" : undefined} key={tab}>
                {tab}
              </span>
            ))}
          </div>

          <InspectorSection title="Text">
            <p className="sp-label">Content</p>
            <span className="sp-field sp-area">
              Good ideas.
              <br />
              Extraordinary
            </span>
          </InspectorSection>

          <InspectorSection title="Data binding">
            <p className="sp-row-field">
              <span>Source</span>
              <span className="sp-field sp-select">
                <Icon name="chevron" size={11} />
              </span>
            </p>
            <p className="sp-help">
              Uses the returned object directly. Repeat is only needed when you
              want to render every item in a list.
            </p>
          </InspectorSection>

          <InspectorSection title="Layer name">
            <p className="sp-row-field">
              <span>Name</span>
              <span className="sp-field sp-value">Main headline</span>
            </p>
          </InspectorSection>

          <InspectorSection title="HTML">
            <p className="sp-row-field">
              <span>Tag</span>
              <span className="sp-field sp-select">
                <Icon name="chevron" size={11} />
              </span>
            </p>
            <p className="sp-help">
              Changes only the published markup — the canvas keeps drawing the
              element the same way.
            </p>
            <p className="sp-row-field">
              <span>Classes</span>
              <span className="sp-field sp-value">hero-card featured</span>
            </p>
            <p className="sp-label">Inline style</p>
            <span className="sp-field sp-area sp-code">
              mix-blend-mode: difference;
              <br />
              --accent: #5402e6;
            </span>
            <p className="sp-help">
              Applied on the element itself, so it overrides everything the
              inspector set.
            </p>
          </InspectorSection>
        </aside>
      </div>

      <figcaption className="sr-only">
        Simplified studio illustration. Design across breakpoints and publish
        the page from one workspace.
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
  return (
    <div className={`sp-board sp-board-${size}`}>
      <div className="sp-board-bar">
        <span className="sp-board-name">{name}</span>
        <span className="sp-board-meta">
          <i>{width}</i>
          <i className="sp-board-range">{range}</i>
          {main ? <b>MAIN</b> : null}
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
            <i>Selected work</i>
            <i>The studio</i>
          </span>
          <i className="sp-hero-talk">Let&#8217;s talk &#8599;</i>
        </div>
        <div className="sp-hero-status">
          <span>&#9679; Independent minds. Shared ambition.</span>
          <span>BASED EVERYWHERE / CREATING BEYOND</span>
        </div>
        <div className="sp-hero-grid">
          <div className="sp-hero-col">
            <p className="sp-hero-eyebrow">
              A small studio for big possibilities
            </p>
            <div className={selected ? "sp-selection" : undefined}>
              <strong className="sp-hero-title">
                Good ideas.
                <br />
                Extraordinary
              </strong>
              {selected ? (
                <>
                  <small>Main headline</small>
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
              possibilities.
            </strong>
            <p className="sp-hero-copy">
              We turn a spark into something people feel.
              <br />
              Thoughtful brands. Expressive websites. Lasting impressions.
            </p>
            <span className="sp-hero-cta">Explore our work &#8599;</span>
          </div>
          <OrbitSculpture />
        </div>
        <div className="sp-hero-foot">
          <span>STRATEGY &#183; DESIGN &#183; DEVELOPMENT</span>
          <span>SCROLL TO DISCOVER &#8595;</span>
        </div>
      </div>

      <div className="sp-logos">
        <span className="sp-logos-label">
          Good company.
          <br />
          Even better collaborations.
        </span>
        <i>ers</i>
        <i className="sp-logo-serif">Sisyphus</i>
        <i>&#9642;Circooles</i>
        <i>Catalog</i>
        <i>&#8984;Quotient</i>
        <i>Nietzsch&#8230;</i>
      </div>

      <div className="sp-work">
        <p className="sp-work-index">01 / Selected work</p>
        <h3>Different by design.</h3>
        <p className="sp-work-copy">
          A few things we&#8217;ve put our hearts into. Always intentional.
          Never off the shelf.
        </p>
        <div className="sp-work-card">
          <span className="sp-work-tag">Everyday, reimagined.</span>
          <strong>Objects of tomorrow.</strong>
          <p>A new perspective on everyday essentials.</p>
          <span className="sp-work-meta">
            Brand identity / Digital experience
          </span>
          <i className="sp-work-mark">ora&#174;</i>
        </div>
      </div>
    </div>
  );
}

/** The orbital object that sits beside the headline in the Forma template. */
function OrbitSculpture() {
  return (
    <svg
      aria-hidden="true"
      className="sp-orbit"
      fill="none"
      viewBox="0 0 200 200"
    >
      <title>Orbital sculpture</title>
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
