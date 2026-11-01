export const DOCS = [
  {
    slug: "architecture",
    title: "System architecture",
    group: "Start here",
    description:
      "How the studio, documents, backend and published runtime fit together.",
  },
  {
    slug: "studio",
    title: "Studio workflow",
    group: "Design and content",
    description:
      "Create a page, organize layers, style it and verify the saved result.",
  },
  {
    slug: "blocks",
    title: "Native block reference",
    group: "Design and content",
    description:
      "Every native element type, grouped by purpose and editing workflow.",
  },
  {
    slug: "document-model",
    title: "Document model",
    group: "API and documents",
    description:
      "Element IDs, parent relationships, styles and version-safe document editing.",
  },
  {
    slug: "responsive-design",
    title: "Responsive design",
    group: "Design and content",
    description:
      "Understand artboards, cascading overrides and real viewport checks.",
  },
  {
    slug: "components-layouts",
    title: "Components and layouts",
    group: "Design and content",
    description:
      "Reuse native components, variants and shared page layouts safely.",
  },
  {
    slug: "forms",
    title: "Forms and submission",
    group: "Data and forms",
    description:
      "Build accessible controls and connect them to your own submission backend.",
  },
  {
    slug: "interactions",
    title: "Motion and interactions",
    group: "Actions and motion",
    description:
      "Hover states, click actions, carousel, marquee, tabs and accordion workflows.",
  },
  {
    slug: "ai-mcp",
    title: "AI generation and MCP",
    group: "Integrations",
    description:
      "Configure AI generation, scope edits and authorize MCP discovery.",
  },
  {
    slug: "cli",
    title: "CLI for coding agents",
    group: "Integrations",
    description:
      "Inspect, validate, create and update native documents from a terminal.",
  },
  {
    slug: "revisions",
    title: "Saving and revisions",
    group: "API and documents",
    description:
      "Handle optimistic concurrency, recover drafts and separate save from publish.",
  },
  {
    slug: "fonts-assets",
    title: "Fonts, icons and assets",
    group: "Design and content",
    description:
      "Register host fonts, choose media and keep content accessible.",
  },
  {
    slug: "deployment",
    title: "Deployment and operations",
    group: "Publishing and operations",
    description:
      "Production configuration, security boundaries, caches and recovery checks.",
  },
  {
    slug: "translations",
    title: "Translations",
    group: "Design and content",
    description:
      "Give layers translation keys and render a page in any language.",
  },
  {
    slug: "changelog",
    title: "Changelog",
    group: "Publishing and operations",
    description:
      "Verified documentation and source-tree changes awaiting release.",
  },
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
    group: "Publishing and operations",
    sections: ["Publishing pages", "Preview routes"],
  },
  {
    slug: "data-binding",
    title: "Dynamic routes and data",
    description: "Resolve request data and repeat API results on the server.",
    group: "Data and forms",
    sections: ["Dynamic routes and request data"],
  },
  {
    slug: "templates",
    title: "Template registry",
    description: "Install, validate and maintain reusable template bundles.",
    group: "Design and content",
    sections: ["Template registry"],
  },
  {
    slug: "api-reference",
    title: "API reference",
    description: "Server, client and package exports in one place.",
    group: "API and documents",
    sections: ["Server API", "Client API", "Package exports"],
  },
  {
    slug: "security",
    title: "Security",
    description: "Protect editor routes and understand the trust boundary.",
    group: "Publishing and operations",
    sections: ["Security"],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Fix the most common setup, CSS, database and AI failures.",
    group: "Publishing and operations",
    sections: ["Troubleshooting"],
  },
  {
    slug: "agents",
    title: "Coding agent guide",
    description: "The integration contract for agents building editable sites.",
    group: "Integrations",
  },
  {
    slug: "action-workflow",
    title: "Action Workflow",
    group: "Actions and motion",
    description:
      "Connect events, conditions and actions; test scoped graphs and morph transitions.",
  },
  {
    slug: "motion-editor",
    title: "Motion Editor",
    group: "Actions and motion",
    description:
      "Animate layers with keyframes, easing, effects and text stagger.",
  },
  {
    slug: "integrations",
    title: "Integrations",
    group: "Integrations",
    description:
      "Connect your framework, services, data sources and AI tools with clear setup boundaries.",
  },
] as const;
export const DOC_SLUGS = DOCS.map((d) => d.slug);
