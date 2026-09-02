/**
 * Comparison pages exist for two audiences: search crawlers ranking
 * "pagiera vs <tool>" queries, and answer engines that quote a single
 * paragraph. Every entry therefore leads with `verdict`—a self-contained
 * answer—before any table, and every claim stays at a level that survives a
 * competitor's next release (no prices, no version numbers).
 *
 * Claims about other products describe their documented, headline behaviour.
 * Re-read them before a release: this is the file that goes stale first.
 */

export type ComparisonRow = {
  label: string;
  pagiera: string;
  rival: string;
};

export type Comparison = {
  slug: string;
  rival: string;
  /** Fills "<rival> is <tagline>" in copy and structured data. */
  rivalTagline: string;
  headline: string;
  /** The paragraph an answer engine can lift verbatim. Keep it decisive. */
  verdict: string;
  intent: string;
  choosePagiera: string[];
  chooseRival: string[];
  rows: ComparisonRow[];
  faq: Array<{ question: string; answer: string }>;
};

const OWNERSHIP_ROW = {
  label: "Who owns the output",
  pagiera:
    "You do. Pages are JSON documents in your repository, rendered by your own app.",
};

export const COMPARISONS: Comparison[] = [
  {
    choosePagiera: [
      "The visual editor has to live inside your own product, behind your own auth.",
      "Marketing needs to edit pages that read from the same APIs your app uses.",
      "You want the page source in git, reviewable in a pull request.",
    ],
    chooseRival: [
      "The work is design exploration—systems, prototypes, handoff, critique.",
      "Your team collaborates on visual ideas long before anything is built.",
      "You need a shared design file as the source of truth across many products.",
    ],
    faq: [
      {
        answer:
          "No. Figma is a design tool and Pagiera is a builder that renders production pages inside your Next.js app. Most teams keep designing in Figma and use Pagiera where the page actually ships.",
        question: "Is Pagiera a Figma replacement?",
      },
      {
        answer:
          "Figma Sites can publish a design as a hosted site on Figma's infrastructure. Pagiera renders pages from your own application, on your own hosting, from documents you keep in your repository.",
        question: "How is this different from Figma Sites?",
      },
      {
        answer:
          "Yes—Pagiera pages are ordinary React output, so they use the same fonts, tokens and components your codebase already defines, which is usually how a Figma design system reaches production.",
        question: "Can Pagiera pages follow our Figma design system?",
      },
    ],
    headline: "A design canvas and a production canvas are not the same tool.",
    intent:
      "Teams comparing these two are usually asking whether a design file can become the real website, or whether design and delivery stay separate steps.",
    rival: "Figma",
    rivalTagline: "the industry-standard collaborative design tool",
    rows: [
      {
        label: "Primary job",
        pagiera: "Building and shipping the page that users load.",
        rival: "Designing interfaces and design systems collaboratively.",
      },
      {
        label: "What the canvas produces",
        pagiera: "A server-rendered React page in your own app.",
        rival: "A design file, plus published sites via Figma Sites.",
      },
      {
        ...OWNERSHIP_ROW,
        rival: "Figma. Designs live in Figma's cloud workspace.",
      },
      {
        label: "Real data",
        pagiera: "Binds to your APIs, route params and form submissions.",
        rival: "Placeholder content and plugin-driven mock data.",
      },
      {
        label: "Licence",
        pagiera: "MIT, installed from npm.",
        rival: "Proprietary SaaS, seat-based.",
      },
      {
        label: "Self-hosting",
        pagiera: "Runs wherever your app runs.",
        rival: "Not applicable—Figma is hosted by Figma.",
      },
    ],
    slug: "pagiera-vs-figma",
    verdict:
      "Figma is where a website is designed; Pagiera is where it is built and shipped. Figma gives you a collaborative design file and, through Figma Sites, a hosted page published from that file. Pagiera is an MIT-licensed package you install into your own Next.js app, so the same visual canvas produces the production page—server-rendered, bound to your real APIs, with the page document stored in your repository. Use Figma to decide what the page should be; use Pagiera when that page has to run inside a product you own.",
  },
  {
    choosePagiera: [
      "The builder has to be embedded in your product rather than replace it.",
      "Pages must render from your own APIs and your own deployment.",
      "You do not want page content locked to one vendor's hosting.",
    ],
    chooseRival: [
      "You want a hosted marketing site with a CMS and no application to maintain.",
      "The team is non-technical and needs everything in one managed product.",
      "Built-in hosting, forms and analytics matter more than owning the runtime.",
    ],
    faq: [
      {
        answer:
          "Yes, in the sense that both let you compose responsive pages visually. The difference is where the page runs: Webflow serves it from Webflow, Pagiera renders it from your own application.",
        question: "Can Pagiera do what Webflow does?",
      },
      {
        answer:
          "Pagiera has no hosting to migrate to. You install it into an existing Next.js app and deploy that app as you already do.",
        question: "Do we have to move hosting to use Pagiera?",
      },
      {
        answer:
          "Webflow's CMS is part of the platform. Pagiera binds pages to whatever data source you already have—a REST endpoint, your database through an API route, or route parameters.",
        question: "What replaces the Webflow CMS?",
      },
    ],
    headline: "One is a hosted platform. The other is a package you install.",
    intent:
      "The real question here is whether you want a managed website platform or a visual layer inside software you already run.",
    rival: "Webflow",
    rivalTagline: "a hosted visual website platform with its own CMS",
    rows: [
      {
        label: "Where pages run",
        pagiera: "Your Next.js app, on your infrastructure.",
        rival: "Webflow's hosting.",
      },
      {
        ...OWNERSHIP_ROW,
        rival: "Webflow, with code export available on paid plans.",
      },
      {
        label: "Content model",
        pagiera: "Your existing APIs and data sources, bound per element.",
        rival: "Built-in CMS collections.",
      },
      {
        label: "Embeds into your product",
        pagiera: "Yes—the editor is a component you mount behind your auth.",
        rival: "No. The designer is Webflow's own application.",
      },
      {
        label: "Licence",
        pagiera: "MIT, installed from npm.",
        rival: "Proprietary SaaS, plan-based.",
      },
      {
        label: "Best fit",
        pagiera: "Product teams shipping pages inside an app they maintain.",
        rival: "Marketing sites that want hosting and CMS in one place.",
      },
    ],
    slug: "pagiera-vs-webflow",
    verdict:
      "Webflow is a complete hosted platform: you design, manage content and publish inside Webflow, and Webflow serves the result. Pagiera is the opposite trade—an MIT-licensed package you install into your own Next.js app, so pages render from your infrastructure, read your real APIs, and live in your repository as JSON documents. Pick Webflow when you want a managed website with hosting and a CMS included. Pick Pagiera when the visual editor needs to live inside a product you already run and deploy.",
  },
  {
    choosePagiera: [
      "You need the editor inside your app, not a separate site to link out to.",
      "Pages have to read live application data, not just published content.",
      "Open source and self-hosting are requirements, not preferences.",
    ],
    chooseRival: [
      "You want polished motion and a hosted site with very little setup.",
      "The site is standalone marketing rather than part of a product.",
      "A managed CDN, forms and analytics out of the box are worth the lock-in.",
    ],
    faq: [
      {
        answer:
          "Framer is generally faster to a published site because hosting and templates are included. Pagiera is faster when the page belongs inside an app you already deploy.",
        question: "Which is quicker to launch with?",
      },
      {
        answer:
          "Pagiera authors motion as part of the page document and renders it in your app. Framer's motion tooling is more extensive and tuned for standalone sites.",
        question: "Does Pagiera handle animation?",
      },
      {
        answer:
          "Yes. Pagiera is MIT-licensed and installed from npm, so it runs on your own hosting with no vendor account involved.",
        question: "Can we self-host Pagiera?",
      },
    ],
    headline: "Hosted polish versus a builder that lives in your codebase.",
    intent:
      "People weighing these two are choosing between the fastest route to a beautiful standalone site and a builder that becomes part of their own product.",
    rival: "Framer",
    rivalTagline: "a hosted site builder known for motion and templates",
    rows: [
      {
        label: "Where pages run",
        pagiera: "Your Next.js app, on your infrastructure.",
        rival: "Framer's hosting.",
      },
      { ...OWNERSHIP_ROW, rival: "Framer, within its own project format." },
      {
        label: "Motion",
        pagiera: "Authored in the document, rendered by your app.",
        rival: "Extensive, with a large preset and effects library.",
      },
      {
        label: "Application data",
        pagiera: "Bound to your APIs, route params and forms.",
        rival: "CMS collections and integrations.",
      },
      {
        label: "Licence",
        pagiera: "MIT, installed from npm.",
        rival: "Proprietary SaaS, plan-based.",
      },
      {
        label: "Best fit",
        pagiera: "Pages that are part of a product you maintain.",
        rival: "Standalone marketing sites that need to look sharp fast.",
      },
    ],
    slug: "pagiera-vs-framer",
    verdict:
      "Framer gets a polished, animated marketing site online quickly, with hosting, templates and motion tooling included. Pagiera is not a hosted product at all: it is an MIT-licensed package that puts the same kind of visual canvas inside your own Next.js app, rendering server-side from your own APIs with the page stored in your repository. Choose Framer for a standalone site you want live this week. Choose Pagiera when the page has to run inside your product, on your hosting, with the content model you already have.",
  },
  {
    choosePagiera: [
      "You would rather install a package than depend on a hosted service.",
      "Page documents belong in your repository and your review process.",
      "You want the whole editing surface to be MIT-licensed.",
    ],
    chooseRival: [
      "You want a managed visual CMS with roles, scheduling and analytics.",
      "Multiple front-ends across frameworks consume the same content.",
      "A vendor-run editor and support contract are worth the subscription.",
    ],
    faq: [
      {
        answer:
          "Both mount a visual editor over your own React components. Builder.io stores and serves content from its cloud; Pagiera keeps the document in your repository and renders it from your app.",
        question: "How is Pagiera different from Builder.io?",
      },
      {
        answer:
          "There is no external content API to call. A Pagiera page is a JSON document your app loads directly, so there is no extra network hop or vendor availability to depend on.",
        question: "Where is the content stored?",
      },
      {
        answer:
          "Pagiera targets React and Next.js. A headless platform like Builder.io is the better fit when several different frameworks must consume the same content.",
        question: "Does Pagiera support non-React front-ends?",
      },
    ],
    headline: "Same idea, opposite dependency: SaaS content API or your repo.",
    intent:
      "Both tools let non-developers compose pages from your real components; the decision is whether the content lives in a vendor's cloud or in your codebase.",
    rival: "Builder.io",
    rivalTagline: "a hosted headless visual CMS for composable front-ends",
    rows: [
      {
        label: "Content storage",
        pagiera: "JSON documents in your repository or your own database.",
        rival: "Builder.io's hosted content API.",
      },
      {
        ...OWNERSHIP_ROW,
        rival: "You own the components; Builder hosts the content.",
      },
      {
        label: "Editor hosting",
        pagiera: "Mounted inside your app, behind your auth.",
        rival: "Builder.io's hosted studio.",
      },
      {
        label: "Framework support",
        pagiera: "React and Next.js.",
        rival: "Many frameworks through per-framework SDKs.",
      },
      {
        label: "Licence",
        pagiera: "MIT, installed from npm.",
        rival: "Proprietary SaaS with a free tier.",
      },
      {
        label: "Best fit",
        pagiera: "Teams that want no runtime vendor dependency.",
        rival: "Organisations that want managed governance and workflows.",
      },
    ],
    slug: "pagiera-vs-builder-io",
    verdict:
      "Builder.io and Pagiera solve the same problem—letting people compose pages from your real components—but they take opposite dependencies. Builder.io is a hosted visual CMS: content lives in Builder's cloud and your app fetches it through their API and SDK. Pagiera is an MIT-licensed package: the editor mounts inside your own app, and the page is a JSON document you keep in your repository and render server-side. Choose Builder.io for managed governance, workflows and multi-framework delivery. Choose Pagiera when you want the entire editing surface and its content inside your codebase, with no runtime vendor in the path.",
  },
];

export const COMPARISON_SLUGS = COMPARISONS.map((entry) => entry.slug);

export function getComparison(slug: string) {
  return COMPARISONS.find((entry) => entry.slug === slug) ?? null;
}
