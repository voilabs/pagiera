import { SYSTEM_DOCS } from "./docs-systems";

export type DocEntry = {
  slug: string;
  title: string;
  description: string;
  group: "Start here" | "Build" | "Reference";
  sections?: string[];
};

export const DOCS: DocEntry[] = [
  ...SYSTEM_DOCS.map(({ content: _content, ...entry }) => entry),
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Requirements, installation and environment variables.",
    group: "Start here",
    sections: ["Requirements", "Installation", "Environment variables"],
  },
  {
    slug: "nextjs-setup",
    title: "Next.js setup",
    description: "Mount the backend, load the bootstrap and open the studio.",
    group: "Start here",
    sections: ["Next.js setup"],
  },
  {
    slug: "publishing",
    title: "Preview and publish",
    description:
      "Keep drafts private, preview safely and render published pages.",
    group: "Build",
    sections: ["Publishing pages", "Preview routes"],
  },
  {
    slug: "data-binding",
    title: "Dynamic routes and data",
    description: "Resolve request data and repeat API results on the server.",
    group: "Build",
    sections: ["Dynamic routes and request data"],
  },
  {
    slug: "templates",
    title: "Template registry",
    description: "Install, validate and maintain reusable template bundles.",
    group: "Build",
    sections: ["Template registry"],
  },
  {
    slug: "api-reference",
    title: "API reference",
    description: "Server, client and package exports in one place.",
    group: "Reference",
    sections: ["Server API", "Client API", "Package exports"],
  },
  {
    slug: "security",
    title: "Security",
    description: "Protect editor routes and understand the trust boundary.",
    group: "Reference",
    sections: ["Security"],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Fix the most common setup, CSS, database and AI failures.",
    group: "Reference",
    sections: ["Troubleshooting"],
  },
  {
    slug: "agents",
    title: "Coding agent guide",
    description: "The integration contract for agents building editable sites.",
    group: "Reference",
  },
];

export const DOC_GROUPS = ["Start here", "Build", "Reference"] as const;

export const DOC_SLUGS = DOCS.map((entry) => entry.slug);

export function getDoc(slug: string) {
  return DOCS.find((entry) => entry.slug === slug);
}
