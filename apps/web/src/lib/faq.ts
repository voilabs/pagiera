import { productFaq } from "@/lib/product-content";

/**
 * The FAQ hub is the superset; the home page keeps its shorter selection.
 * Both pages render exactly the questions they mark up, which is the only rule
 * that matters here — structured data must never describe invisible content.
 *
 * Answers are written to survive being quoted alone, so each one repeats enough
 * context to be correct without the question next to it.
 */
export type FaqEntry = { question: string; answer: string };
export type FaqGroup = { title: string; blurb: string; entries: FaqEntry[] };

const pick = (...questions: string[]): FaqEntry[] =>
  questions.map((question) => {
    const entry = productFaq.find((item) => item.question === question);
    if (!entry) throw new Error(`Unknown product FAQ question: ${question}`);
    return entry;
  });

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "What Pagiera is",
    blurb: "The short version, before the setup details.",
    entries: [
      ...pick("What is Pagiera?", "Is Pagiera free to use?"),
      {
        question: "Is Pagiera a website builder or a developer tool?",
        answer:
          "Both, deliberately. Pagiera is an npm package a developer installs into a React and Next.js application, and the thing it installs is a visual editor that non-developers can use. The developer owns the integration; the editor is where the pages get designed.",
      },
      {
        question: "How is Pagiera different from a hosted website builder?",
        answer:
          "A hosted builder keeps your pages on its own platform and serves them from its infrastructure. Pagiera runs inside your application: the documents live in your PostgreSQL database, the pages are rendered by your own Next.js server, and the package is MIT-licensed, so there is no vendor account between you and your site.",
      },
    ],
  },
  {
    title: "Setup and hosting",
    blurb: "What you need before the editor opens.",
    entries: [
      ...pick("Can I host Pagiera in my own Next.js application?"),
      {
        question: "What are the requirements for running Pagiera?",
        answer:
          "Node.js 20 or newer, React 18.3 or newer, the Next.js App Router for the full-stack integration, PostgreSQL and Redis. An OpenRouter API key is needed only for AI generation.",
      },
      {
        question: "Do I have to run database migrations?",
        answer:
          "No. Pagiera creates the PostgreSQL tables it requires when the server initializes. Redis is used for published-page caching, template bundle caching and AI rate limiting.",
      },
      {
        question: "How do I check that my setup is working?",
        answer:
          "Open /api/pagiera/health after starting the application. It verifies PostgreSQL, Redis and the configured OpenRouter model, which turns a silent misconfiguration into a readable answer.",
      },
      {
        question: "Does Pagiera handle authentication?",
        answer:
          "No. Pagiera does not ship an authentication layer. You mount the editor route and the /api/pagiera route inside your own application and protect them with the authentication and authorisation you already use.",
      },
    ],
  },
  {
    title: "Designing and reusing",
    blurb: "How a page stays editable after the first draft.",
    entries: [
      ...pick(
        "Can I reuse navigation and footer designs?",
        "What interactive content can I build?",
      ),
      {
        question: "Can I design different layouts per breakpoint?",
        answer:
          "Yes. The canvas shows responsive artboards side by side, and breakpoints carry isolated overrides, so a change made at one width does not silently rewrite the others.",
      },
    ],
  },
  {
    title: "Data and publishing",
    blurb: "Where the content comes from and when it goes live.",
    entries: [
      ...pick("Does saving a page make it public?"),
      {
        question: "Can a Pagiera page read from an API?",
        answer:
          "Yes. Request blocks bind one returned object to their descendants and Repeat blocks iterate array results. Both support GET, POST, PUT, PATCH and DELETE sources, and request URLs, headers, query fields and bodies can reference route parameters and query values.",
      },
      {
        question: "Is API-backed content visible to search engines?",
        answer:
          "Yes for published pages. Request blocks are resolved on the server and finish before HTML is returned, so API-backed content is part of the initial response rather than being fetched in the browser afterwards.",
      },
      {
        question: "Does publishing a page deploy my application?",
        answer:
          "No. Publishing updates the public page content and refreshes the cached revision. Deploying your host application, configuring DNS and managing your domain remain your own pipeline's responsibility.",
      },
    ],
  },
  {
    title: "AI and coding agents",
    blurb: "What the model is allowed to change, and when.",
    entries: [
      ...pick(
        "Can an AI coding agent design an editable Pagiera website?",
        "How do targeted AI edits work?",
      ),
      {
        question: "Can I use Pagiera without any AI features?",
        answer:
          "Yes. AI generation requires an OpenRouter key, and everything else — the canvas, components, layouts, data binding, previewing and publishing — works without one.",
      },
    ],
  },
];

export const ALL_FAQ: FaqEntry[] = FAQ_GROUPS.flatMap((group) => group.entries);
