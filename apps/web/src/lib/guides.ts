/**
 * Guides exist for two readers: a developer looking for the shortest correct
 * path to a working integration, and an answer engine that will quote one
 * paragraph and move on. Every guide therefore states its `answer` before any
 * steps, keeps each step independently meaningful, and avoids version numbers
 * or prices that would silently rot.
 *
 * Every code sample here is taken from the package documentation. When the
 * package changes, this file changes with it.
 */

export type GuideBlock =
  | { type: "text"; body: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "code"; lang: string; source: string }
  | { type: "note"; body: string }
  | { type: "table"; head: [string, string]; rows: Array<[string, string]> };

export type GuideStep = {
  title: string;
  body: string;
  blocks?: GuideBlock[];
};

export type GuideSection = {
  heading: string;
  blocks: GuideBlock[];
};

export type Guide = {
  slug: string;
  category: string;
  /** The h1. Phrased as the thing the reader wants to accomplish. */
  title: string;
  /** Short anchor text for navigation, where the full title will not fit. */
  navLabel: string;
  /** The search question this page exists to answer, used as the lede heading. */
  question: string;
  /** Self-contained answer. An engine that quotes only this is still correct. */
  answer: string;
  description: string;
  updated: string;
  minutes: number;
  takeaways: string[];
  steps?: GuideStep[];
  sections?: GuideSection[];
  faq: Array<{ question: string; answer: string }>;
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "add-a-visual-editor-to-nextjs",
    navLabel: "Next.js setup",
    category: "Integration",
    title: "Add a visual page editor to a Next.js application",
    question: "How do you add a visual page editor to a Next.js app?",
    answer:
      "Install the pagiera package, point it at PostgreSQL and Redis, mount its catch-all API route under /api/pagiera, load the editor bootstrap on the server, and render the studio behind your own authentication. The editor runs inside your application rather than on a separate hosted account, so the pages it produces are rendered by your own Next.js server.",
    description:
      "Install Pagiera in a Next.js App Router project: environment variables, the catch-all backend route, the server bootstrap and mounting the studio behind your own auth.",
    updated: "2026-09-12",
    minutes: 6,
    takeaways: [
      "Pagiera is an npm package, not a hosted editor account — it runs inside your own Next.js app.",
      "PostgreSQL stores documents and revisions; Redis caches published pages, template bundles and AI rate limits.",
      "One catch-all route handler at /api/pagiera/[...path] serves the whole editor backend.",
      "The editor route is yours to protect: Pagiera does not ship an authentication layer.",
    ],
    steps: [
      {
        title: "Install the package",
        body: "Pagiera ships the editor, the runtime and the server handlers in a single package. Node.js 20+, React 18.3+ and the Next.js App Router are required for the full-stack integration.",
        blocks: [{ type: "code", lang: "bash", source: "bun add pagiera" }],
      },
      {
        title: "Configure the services",
        body: "Create .env.local with a PostgreSQL connection and a Redis connection. An OpenRouter key is only needed if you want AI generation; everything else works without it.",
        blocks: [
          {
            type: "code",
            lang: "env",
            source: `PAGIERA_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/pagiera
PAGIERA_REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5`,
          },
          {
            type: "note",
            body: "Pagiera creates the PostgreSQL tables it needs when the server first initializes. You do not run a separate migration step.",
          },
        ],
      },
      {
        title: "Mount the backend",
        body: "A single catch-all route handler exposes every editor endpoint. Export the verbs it returns and Next.js routes the rest.",
        blocks: [
          {
            type: "code",
            lang: "ts",
            source: `// src/app/api/pagiera/[...path]/route.ts
import {
  createPagieraRouteHandlers,
  pagieraConfigFromEnv,
} from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;`,
          },
          {
            type: "text",
            body: "Open /api/pagiera/health after starting the app. It reports whether PostgreSQL, Redis and the configured OpenRouter model are reachable, which turns a silent misconfiguration into a readable answer.",
          },
        ],
      },
      {
        title: "Load the editor data on the server",
        body: "The first document is server-rendered, so the studio opens with content instead of a loading state.",
        blocks: [
          {
            type: "code",
            lang: "ts",
            source: `// src/lib/editor-bootstrap.ts
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap = await server.getEditorBootstrap(pageId);

  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}`,
          },
        ],
      },
      {
        title: "Mount the studio behind your own auth",
        body: "Render the studio on a route only your team can reach. Pagiera deliberately does not ship an authentication layer — the editor route and the API route inherit whatever your application already enforces.",
        blocks: [
          {
            type: "list",
            items: [
              "Protect both the editor page and /api/pagiera with the same check.",
              "Import the editor stylesheet before your own CSS: @import rules must precede other rules.",
              "Add the font provider so next/font families appear in the Typography panel.",
            ],
          },
        ],
      },
    ],
    sections: [
      {
        heading: "What each service is responsible for",
        blocks: [
          {
            type: "table",
            head: ["Service", "What it holds"],
            rows: [
              [
                "PostgreSQL",
                "Page documents, drafts and published revisions — the durable source of truth.",
              ],
              [
                "Redis",
                "Published-page cache, template bundle cache and AI rate limiting.",
              ],
              [
                "OpenRouter",
                "Optional. Only used when you ask the AI panel to propose a change.",
              ],
            ],
          },
        ],
      },
    ],
    faq: [
      {
        question: "Does Pagiera require a hosted account?",
        answer:
          "No. Pagiera is distributed as an MIT-licensed npm package. You install it into your own application and run it on your own infrastructure; there is no separate website account to sign up for.",
      },
      {
        question: "Can I run Pagiera without Redis?",
        answer:
          "Redis is listed as a requirement because published-page caching, template bundle caching and AI rate limiting depend on it. Check the version you installed before assuming a degraded mode exists.",
      },
      {
        question: "Does Pagiera handle login for the editor?",
        answer:
          "No. Pagiera does not ship an authentication layer. You mount the editor route and the API route inside your application and protect them with the authentication you already use.",
      },
    ],
    related: ["bind-api-data-to-a-page", "preview-and-publish-pages"],
  },

  {
    slug: "bind-api-data-to-a-page",
    navLabel: "API data binding",
    category: "Data",
    title: "Bind API data to a visually designed page",
    question: "How do you bind live API data to a page in Pagiera?",
    answer:
      "Add a Request block to fetch one object or a Repeat block to iterate an array, then reference route parameters and query fields inside the URL, headers or body using {{params.x}} and {{query.x}} placeholders. For published pages both resolve on the server before HTML is returned, so API-backed content is present in the initial response rather than filled in afterwards.",
    description:
      "Use Request and Repeat blocks to bind GET, POST, PUT, PATCH and DELETE data sources to a Pagiera page, with route parameters, query fields and server-side resolution.",
    updated: "2026-09-12",
    minutes: 5,
    takeaways: [
      "Request blocks expose one returned object to their descendants; Repeat blocks iterate an array result.",
      "Placeholders such as {{params.slug}} and {{query.q}} work in URLs, headers, query fields and bodies.",
      "Published pages resolve both block types on the server, so the data is in the HTML crawlers receive.",
      "An upstream 404 can turn the whole route into a 404 when the source uses the page-404 behavior.",
    ],
    sections: [
      {
        heading: "Give the page a dynamic slug",
        blocks: [
          {
            type: "text",
            body: "A page slug can carry named parameters. The matched values are handed to the server context when the page renders.",
          },
          { type: "code", lang: "text", source: "blog/:slug" },
          {
            type: "text",
            body: "For a request to /blog/1, the context passed to the server looks like this:",
          },
          {
            type: "code",
            lang: "ts",
            source: `{
  params: { slug: "1" },
  query: { preview: "true" }
}`,
          },
        ],
      },
      {
        heading: "Reference the context from the data source",
        blocks: [
          {
            type: "text",
            body: "Request URLs, headers, query fields and bodies may all reference context values with double-brace placeholders.",
          },
          {
            type: "code",
            lang: "text",
            source: `https://dummyjson.com/posts/{{params.slug}}
https://api.example.com/search?q={{query.q}}`,
          },
        ],
      },
      {
        heading: "Choose between Request and Repeat",
        blocks: [
          {
            type: "table",
            head: ["Block", "When to use it"],
            rows: [
              [
                "Request",
                "The endpoint returns one object and you want to bind its fields to elements directly.",
              ],
              [
                "Repeat",
                "The endpoint returns an array and you want to render every item with the same design.",
              ],
            ],
          },
          {
            type: "note",
            body: "Repeat is only needed when you want to render every item in a list. If you are binding a single record, a Request block alone is enough.",
          },
        ],
      },
      {
        heading: "Why server-side resolution matters",
        blocks: [
          {
            type: "text",
            body: "Client-side fetching leaves the first response empty, which is what makes many visually built pages invisible to crawlers and answer engines. Pagiera finishes Request blocks before the HTML is returned, so the content a crawler reads is the content a visitor sees.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Which HTTP methods can a data source use?",
        answer:
          "GET, POST, PUT, PATCH and DELETE data sources are supported, and request URLs, headers, query fields and bodies can all reference route parameters and query values.",
      },
      {
        question: "Is API data visible to search engines?",
        answer:
          "Yes for published pages. Request blocks are resolved on the server and finish before HTML is returned, so API-backed content is part of the initial response rather than loaded afterwards in the browser.",
      },
      {
        question: "What happens when the upstream API returns 404?",
        answer:
          "When the data source uses the page-404 behavior, an upstream 404 turns the complete route into a 404 page instead of rendering an empty layout.",
      },
    ],
    related: ["add-a-visual-editor-to-nextjs", "preview-and-publish-pages"],
  },

  {
    slug: "preview-and-publish-pages",
    navLabel: "Preview & publish",
    category: "Workflow",
    title: "Preview a draft and publish it safely",
    question: "Does saving a page in Pagiera make it public?",
    answer:
      "No. Saving updates the draft only. You preview the draft on a preview route, and the page becomes public only when you publish it. The home slug maps to /. Publishing updates the page content — it does not deploy your host application or configure a domain.",
    description:
      "Understand the Pagiera save, preview and publish workflow: what each step changes, where drafts live and what publishing does and does not do.",
    updated: "2026-09-12",
    minutes: 4,
    takeaways: [
      "Save writes a draft. Publish is a separate, deliberate step.",
      "Preview routes render the draft so you can check it before anyone else can.",
      "The page slug home maps to the site root.",
      "Publishing content is not the same as deploying your application.",
    ],
    steps: [
      {
        title: "Save the draft",
        body: "Saving stores the document revision in PostgreSQL. Nothing on the public site changes at this point, which means an unfinished layout can sit in the editor for as long as it needs to.",
      },
      {
        title: "Open the preview route",
        body: "A preview route renders the draft document through the same runtime the published page uses, so what you approve is what will ship.",
        blocks: [
          {
            type: "code",
            lang: "tsx",
            source: `// src/app/preview/[pageId]/page.tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";`,
          },
          {
            type: "note",
            body: "Preview routes show unpublished work. Protect them the same way you protect the editor.",
          },
        ],
      },
      {
        title: "Publish",
        body: "Publishing promotes the approved draft to the public page and refreshes the Redis-backed published cache. The public route then serves the new revision.",
      },
      {
        title: "Render the published page",
        body: "Published documents are loaded on the server so Request blocks finish before HTML is returned.",
        blocks: [
          {
            type: "code",
            lang: "tsx",
            source: `const server = await getPagieraServer(pagieraConfigFromEnv());
const page = await server.getPublishedPage(slug, {
  query,
  params,
  page: { slug },
});

if (!page) notFound();`,
          },
        ],
      },
    ],
    sections: [
      {
        heading: "What publishing does not do",
        blocks: [
          {
            type: "list",
            items: [
              "It does not deploy your host application — your own pipeline still owns that.",
              "It does not configure DNS or a domain.",
              "It does not change your authentication or infrastructure.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        question: "Does saving a page make it public?",
        answer:
          "No. Saving updates the draft. You preview the draft and then publish to update the public page. The home slug maps to /.",
      },
      {
        question: "Can I roll back a published page?",
        answer:
          "Pagiera keeps page documents and revisions in PostgreSQL, and the editor exposes a History tab. Check the behaviour of the version you installed before relying on a specific rollback flow.",
      },
    ],
    related: ["add-a-visual-editor-to-nextjs", "bind-api-data-to-a-page"],
  },

  {
    slug: "build-with-a-coding-agent",
    navLabel: "Coding agents",
    category: "AI",
    title: "Build an editable website with a coding agent",
    question:
      "Can an AI coding agent build a website you can still edit visually?",
    answer:
      "Yes, if the agent creates native Pagiera document elements instead of a separate hardcoded page. The package ships an AGENTS.md integration guide for exactly this. A document produced that way can be saved, opened in the visual editor, previewed and published like any other page — which is what keeps the result editable after the agent finishes.",
    description:
      "Direct a coding agent to produce a native Pagiera document rather than hardcoded JSX, so the page it builds stays editable in the visual canvas afterwards.",
    updated: "2026-09-12",
    minutes: 5,
    takeaways: [
      "The package includes an AGENTS.md guide written for coding agents.",
      "Ask for native Pagiera document elements — a hardcoded page is not editable in the canvas.",
      "Agent output goes through the same save, preview and publish workflow as hand-designed pages.",
      "In-editor AI proposals are reviewed before they are applied; nothing changes silently.",
    ],
    sections: [
      {
        heading: "The instruction that changes the outcome",
        blocks: [
          {
            type: "text",
            body: "The difference between a page you can keep editing and a page you have to rebuild is a single instruction. Ask the agent to create native Pagiera document elements. If it writes a React component with hardcoded markup instead, the visual canvas has nothing to edit — the design lives in code the editor does not own.",
          },
          {
            type: "list",
            items: [
              "Point the agent at /docs/agents, which renders the package's AGENTS.md.",
              "Name the outcome: an editable document, not a static page component.",
              "Let the agent save a draft, then review it in the editor before publishing.",
            ],
          },
        ],
      },
      {
        heading: "How in-editor AI edits differ",
        blocks: [
          {
            type: "text",
            body: "Inside the editor, Luma works on a target you choose: select a layer, or mention it with @. It proposes text, style, hover and element changes and shows the old and new values, so you approve the change rather than discover it.",
          },
          {
            type: "table",
            head: ["Step", "What happens"],
            rows: [
              ["Target", "You select a layer or reference one with @."],
              [
                "Propose",
                "The change is described with before and after values.",
              ],
              ["Apply", "Nothing touches the page until you accept it."],
            ],
          },
          {
            type: "note",
            body: "AI generation requires an OpenRouter key, and the supported operations depend on the version you installed. Breakpoint-targeted requests are limited to supported layout updates.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Can an AI coding agent design an editable Pagiera website?",
        answer:
          "Yes. The package includes an AGENTS.md integration guide for coding agents. Ask your agent to create native Pagiera document elements rather than a separate hardcoded page. The resulting document can be saved, opened in the visual editor, previewed and published.",
      },
      {
        question: "Do AI edits apply automatically?",
        answer:
          "No. Supported requests are proposed with their old and new values so you can review them, and the existing page stays in place until you apply the change.",
      },
      {
        question: "Is an API key required for AI features?",
        answer:
          "AI generation requires an OpenRouter key. The rest of the editor — canvas, components, layouts, data binding and publishing — works without one.",
      },
    ],
    related: ["add-a-visual-editor-to-nextjs", "reuse-layouts-and-components"],
  },

  {
    slug: "reuse-layouts-and-components",
    navLabel: "Layouts & components",
    category: "Design system",
    title: "Reuse navigation, footers and layouts across pages",
    question:
      "How do you avoid rebuilding navigation and footers on every page?",
    answer:
      "Design the shared structure once as a linked layout and place a children placeholder where page-specific content belongs. Pair that with reusable components and variants for the smaller repeated pieces. Every page that uses the layout inherits changes to it, so a navigation edit happens in one place rather than on every page.",
    description:
      "Use linked layouts with children placeholders, reusable components and variants to keep shared page structure consistent across a Pagiera site.",
    updated: "2026-09-12",
    minutes: 4,
    takeaways: [
      "A linked layout holds shared structure; a children placeholder marks where each page differs.",
      "Components with variants cover repeated pieces that need small differences.",
      "Layouts and components live in the Assets panel alongside the rest of the document.",
      "Changing the layout changes every page that links to it.",
    ],
    sections: [
      {
        heading: "Layouts versus components",
        blocks: [
          {
            type: "table",
            head: ["Use a linked layout when", "Use a component when"],
            rows: [
              [
                "The structure wraps a whole page — navigation, footer, page chrome.",
                "The piece repeats inside pages — a card, a button, a marquee row.",
              ],
              [
                "Each page needs to drop its own content into the middle.",
                "Each instance needs the same design with small variations.",
              ],
            ],
          },
        ],
      },
      {
        heading: "The children placeholder",
        blocks: [
          {
            type: "text",
            body: "A layout without a children placeholder is just a page. The placeholder is what makes the layout reusable: it marks the slot every linked page fills with its own content, while the navigation and footer around it stay owned by the layout.",
          },
          {
            type: "ordered",
            items: [
              "Design the shared navigation and footer once.",
              "Insert a children placeholder between them.",
              "Link each page to the layout and design only what differs.",
            ],
          },
        ],
      },
      {
        heading: "Keeping expression consistent",
        blocks: [
          {
            type: "text",
            body: "Shared structure does not have to mean uniform pages. Shader colors, icon sets from Tabler, Lucide and Remix, text hover effects and entrance or scroll-based motion are all editable per element, so pages can stay distinct while their skeleton stays shared.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Can I reuse navigation and footer designs across pages?",
        answer:
          "Yes. Use reusable components and linked layouts for shared structure. Layouts can include a children placeholder for page-specific content, so you do not need to rebuild navigation and footers for every page.",
      },
      {
        question: "Does editing a layout update every page that uses it?",
        answer:
          "Linked layouts exist so shared structure is edited once. Pages linked to the layout inherit its structure, while their own content stays in the children slot.",
      },
    ],
    related: ["add-a-visual-editor-to-nextjs", "build-with-a-coding-agent"],
  },
];

export const GUIDE_SLUGS = GUIDES.map((guide) => guide.slug);

export function getGuide(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug);
}
