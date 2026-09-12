/** Local documentation: reviewed against the source, never downloaded from GitHub. */
export const SYSTEM_DOCS = [
  {
    slug: "architecture",
    title: "System architecture",
    group: "Start here" as const,
    description:
      "How the studio, documents, backend and published runtime fit together.",
    content: `## The system at a glance

Pagiera is embedded in your application. The browser hosts the studio, your server handles persistence and data requests, PostgreSQL stores documents, and Redis provides caches and rate limiting. Authentication and deployment belong to the host application.

## Follow a document through the system

1. Load editor bootstrap on the server and pass it to the full studio.
2. Edit native layers in the browser. A document contains elements, root styles and data source definitions.
3. Save through the backend with the page's expected revision. Saving changes the draft, not the public page.
4. Preview the draft through an authenticated route, resolving request data on the server.
5. Publish explicitly. The public runtime reads the published document and renders HTML.

## Package boundaries

| Entry point | Responsibility |
| --- | --- |
| pagiera/full | Complete studio interface |
| pagiera/provider | Host font registration |
| pagiera/server | Backend handlers, persistence and server loading |
| pagiera/runtime | Published page rendering |
| pagiera/data | Data integration exports |
| pagiera | Smaller editor, client and document APIs |

Import server code only in server modules. Import pagiera/full.css for the full studio; pagiera/styles.css is for the smaller editor.

## Choose your next step

Start with [installation](/docs/getting-started), mount [Next.js routes](/docs/nextjs-setup), then follow the [studio workflow](/docs/studio). Read [deployment](/docs/deployment) before exposing the application to users.`,
  },
  {
    slug: "studio",
    title: "Studio workflow",
    group: "Build" as const,
    description:
      "Create a page, organize layers, style it and verify the saved result.",
    content: `## Create your first editable page

1. Open the protected studio and create a page with a descriptive name and route slug.
2. Insert a Section and a Container. Use a vertical Stack for a heading, supporting text and a button.
3. Rename layers by purpose, such as Hero or Primary action, so humans and agents can find them later.
4. Select each layer to edit content and appearance in the inspector.
5. Switch artboards and check wrapping, spacing and overflow before saving.

## Layers and layout

The layer tree determines nesting; sibling ordering and layout determine placement. Prefer flow layouts for text-heavy sections. Free-positioned elements are useful for decorative compositions, but require explicit checks at narrow widths.

Use [reusable components](/docs/components-layouts) for repeated interface pieces and [native blocks](/docs/blocks) for content. Avoid baking a whole editable section into one image or embed.

## Save and verify

1. Save the draft and wait for confirmation.
2. Reload the page to verify persistence, not just local canvas state.
3. Open the draft preview and test links, forms and interactive controls.
4. Publish only after reviewing the result. Saving alone does not publish.

## When something goes wrong

If a save conflicts, reload the latest revision before retrying. If the canvas looks right but preview differs, check stylesheet imports, data context and responsive overrides. See [revisions](/docs/revisions) and [troubleshooting](/docs/troubleshooting).`,
  },
  {
    slug: "blocks",
    title: "Native block reference",
    group: "Reference" as const,
    description:
      "Every native element type, grouped by purpose and editing workflow.",
    content: `## Layout blocks

| Block | Use |
| --- | --- |
| Frame | General-purpose grouping and visual composition |
| Stack | Flow-based rows or columns |
| Section | A major section of a page |
| Container | A content wrapper |
| Grid | Repeated content arranged in a grid |
| Divider | Visual separation |
| Spacer | Intentional empty space |

Start with a parent layout, add its children, then adjust spacing and sizing. Check mobile before adding fixed dimensions everywhere.

## Content and media

| Block | Use |
| --- | --- |
| Heading | Section headings with a meaningful hierarchy |
| Text | Paragraphs and short text |
| Image | Images with descriptive alt text |
| Button | Calls to action and interaction triggers |
| Video | Video content |
| Icon | Library icons |
| List | A list container |
| ListItem | An individual list entry |
| Quote | Quoted content |
| Markdown | Structured markdown content |
| Embed | Embedded content; review trust and browser restrictions |

## Forms

Form groups submission controls. Fieldset and Label provide structure and names. Input, Textarea and Select collect values; Checkbox and Radio collect choices; FileInput lets a visitor select a file. Selection is not a hosted upload service. See [forms](/docs/forms).

## Server-backed content

Request supplies API data and Repeat renders collections. Define a data source, inspect its response shape, select the collection path, and bind child content. See [data binding](/docs/data-binding).

## Composed interactive blocks

Carousels, marquees, tabs and accordions are built using editable layers and interaction settings rather than additional element type names. See [motion and interactions](/docs/interactions).`,
  },
  {
    slug: "document-model",
    title: "Document model",
    group: "Reference" as const,
    description:
      "Element IDs, parent relationships, styles and version-safe document editing.",
    content: `## Document structure

A native document has version, elements, rootStyle and dataSources. The current document format version is 1. This format number is not the page revision used for optimistic saving.

Elements form a flat array. Each has a unique id, a type, numeric z ordering and a base style object. A parentId references another element; an omitted parentId places it at the root. Content-specific fields include content, src, href and alt.

## Safe editing sequence

1. Load the current document and page revision.
2. Preserve fields you do not intend to change, including root styles and data source definitions.
3. Modify existing IDs where possible so references remain stable.
4. Check that every parent exists and that no parent cycle was introduced.
5. Validate, save with the expected page revision, then read back the result.

## Styles and breakpoints

base holds the shared style. overrides stores per-breakpoint changes keyed by breakpoint ID. rootStyle controls page-level layout, fonts and breakpoint definitions. Read definitions from the document instead of assuming every page uses identical widths.

## Agent access

The [CLI](/docs/cli) schema command returns the installed TypeScript document contract and an example. Its validate command checks structural integrity; it is not a complete schema, accessibility or visual validator. Always inspect a rendered preview after saving.`,
  },
  {
    slug: "responsive-design",
    title: "Responsive design",
    group: "Build" as const,
    description:
      "Understand artboards, cascading overrides and real viewport checks.",
    content: `## Start with the page breakpoints

Desktop, tablet and mobile are required breakpoint identities in the editor. Read each page's configured widths instead of copying hard-coded numbers from another document. The visitor breakpoint width and the canvas artboard width can differ: resizing the drawing area should not silently change published behavior.

## Build from wide to narrow

1. Establish the shared layout on the widest artboard.
2. Move to tablet and change only properties that need an override.
3. Move to mobile; stack columns, reduce oversized spacing and check text wrapping.
4. Resize a real preview between artboard widths, not only at their exact sizes.

Styles cascade from wider breakpoints toward narrower ones. A narrower explicit override can keep a value even after its desktop value changes. Remove the override when you want inheritance again.

## Avoid overflow

Prefer flexible widths for content wrappers, natural height for text and deliberate maximum widths for reading. Check images, long URLs, buttons and nested grids. Absolute positioning needs extra care because content can grow independently of its container.

## Acceptance checklist

Verify navigation, headings, controls and forms at narrow, intermediate and wide widths. Test long content and data-driven empty states. Confirm there is no unintended horizontal scrolling in the published runtime.`,
  },
  {
    slug: "components-layouts",
    title: "Components and layouts",
    group: "Build" as const,
    description:
      "Reuse native components, variants and shared page layouts safely.",
    content: `## Reusable components

Build a reusable piece from ordinary layers, then create a component master and place instances where needed. Keep shared visual rules in the master and intentional differences in instance overrides or variants.

1. Finish the component's base layout and responsive behavior.
2. Give the master and its child layers meaningful names.
3. Create instances and verify that a master edit reaches them.
4. Test each variant and any overridden instance separately.

## Shared page layouts

A page layout is a component master marked as a layout with exactly one children slot. The slot receives the page's own root content; surrounding layers provide shared chrome such as a header and footer.

1. Create the layout master with header, content slot and footer.
2. Keep exactly one children slot inside it.
3. Assign the layout to a page.
4. Verify both shared chrome and page-specific content in preview.

Generated layout layers are removed when saving the authored page structure. If the layout is missing or its slot structure is invalid, the current implementation keeps page content visible rather than hiding it.

## Distinguish templates from components

A component is reused within the document system. A template installs a project starting point and can replace project content; read [template installation](/docs/templates) before importing into existing work.`,
  },
  {
    slug: "forms",
    title: "Forms and submission",
    group: "Build" as const,
    description:
      "Build accessible controls and connect them to your own submission backend.",
    content: `## Build the form

1. Add a Form container.
2. Group related fields with Fieldset where appropriate.
3. Add a visible Label for each control and provide meaningful field names.
4. Choose Input, Textarea, Select, Checkbox or Radio according to the value needed.
5. Add a submit control and configure the destination supported by your integration.

Input types include text, email, password, number, tel, url, search, date, time, datetime-local, month, week, color, range and hidden. Use types that match the expected value, but do not treat browser validation as security.

## Own the receiving endpoint

Pagiera's visual form controls are not a managed inbox or payment service. Your application must receive and validate submissions, enforce authorization where needed, prevent abuse and return useful success or error feedback. Never place a server credential in a hidden field.

## File fields

FileInput selects a file in the browser. Your upload endpoint must enforce size and type limits, storage policy and access controls. Test the actual submission encoding and upload flow in your host application.

## Verify the visitor experience

Test keyboard navigation, labels, required fields, invalid input, repeated submission, network failure and a successful response. Check the public preview, not only the editor canvas.`,
  },
  {
    slug: "interactions",
    title: "Motion and interactions",
    group: "Build" as const,
    description:
      "Hover states, click actions, carousel, marquee, tabs and accordion workflows.",
    content: `## States and motion

The editor supports hover and press styling alongside entrance, loop and scroll effects. Start with a readable static design, add one effect at a time, then verify it in preview. Use duration and easing deliberately; avoid essential content depending on a long animation.

## Click actions

Native click interactions include navigate, scroll-to, toggle-layer, show-layer and hide-layer. Set the target deliberately and verify that it still exists after duplicating or deleting layers. Use a real link for ordinary navigation where possible.

## Carousel and marquee

1. Add the interactive composition and edit its native child content.
2. Configure autoplay, interval and direction.
3. For a carousel, review arrows, dots, swipe, loop, pause-on-hover and transition settings.
4. Preview with one item and several items, then test narrow screens.

Carousel settings support slide, fade and zoom transitions. A marquee is continuous moving content; keep essential information available without requiring visitors to chase moving text.

## Tabs and accordion

Headers and panels remain editable layers. A trigger and its panel share a target identifier within the disclosure composition. Preserve matching targets when editing. Verify focus, keyboard behavior and visible content in the rendered page.

## Effects and accessibility

Text effects and shader visuals are decorative enhancements, not substitutes for readable text. Test contrast, reduced-motion preferences and low-powered devices. Do not assume every effect is automatically appropriate for every accessibility requirement.`,
  },
  {
    slug: "ai-mcp",
    title: "AI generation and MCP",
    group: "Build" as const,
    description:
      "Configure AI generation, scope edits and authorize MCP discovery.",
    content: `## AI generation workflow

AI generation uses your server-side OpenRouter configuration. Keep the key out of browser bundles. Configure the model on the server and verify provider access before debugging the editor interface.

1. Save your current work.
2. Describe the page purpose, structure, content and responsive expectations.
3. Select the intended editing scope in the studio.
4. Review generated native layers and inspect the responsive result.
5. Save and preview; publish only after explicit review.

The client generate operation supports streamed events and cancellation. Treat a cancelled or failed run as incomplete and inspect the current document before retrying. Redis participates in AI rate limiting; provider limits and billing remain separate.

## MCP discovery

Server configuration can register operator-owned MCP servers using stdio, HTTP or SSE transports. The backend exposes list and inspect operations for discovery. This integration is not unrestricted tool execution by a browser user.

Configure authorizeMcp to check the requesting user's authorization. The server must own command paths, arguments, environment variables and remote endpoints; do not accept arbitrary connection configurations from visitors.

## Agent-driven editing

For a coding agent working from a terminal, use the [CLI workflow](/docs/cli). MCP discovery and CLI document editing are separate capabilities. Neither replaces host authentication or explicit approval to publish.`,
  },
  {
    slug: "cli",
    title: "CLI for coding agents",
    group: "Reference" as const,
    description:
      "Inspect, validate, create and update native documents from a terminal.",
    content: `## Availability

The CLI is included in the current source tree. The unreleased implementation is not a promise that an older npm version contains the command. From this repository, run node packages/pagiera/cli/main.mjs help after building the package. In a package version that ships the bin entry, use pagiera through your package runner.

## Inspect before editing

Run these commands from the repository root. The schema command reads the built package contract.



~~~bash
node packages/pagiera/cli/main.mjs help
node packages/pagiera/cli/main.mjs schema
node packages/pagiera/cli/main.mjs inspect --url http://localhost:3000/api/pagiera
node packages/pagiera/cli/main.mjs page get PAGE_ID
~~~

The default API base is http://localhost:3000/api/pagiera. Override it with --url or PAGIERA_URL. PAGIERA_TOKEN supplies a bearer token accepted by your host application; the CLI does not create authentication. Use HTTPS outside localhost when sending credentials.

## Validate and create

Write a native document JSON file, then validate it before creating a page. Replace the placeholder ID and version in subsequent examples with values returned by your server.

~~~bash
node packages/pagiera/cli/main.mjs page validate --file page.json
node packages/pagiera/cli/main.mjs page create --name "About" --slug /about --file page.json
~~~

Creation creates the page, saves the document and reads it back. If saving fails after creation, the error includes the created page ID; inspect that page before retrying to avoid duplicates.

## Update without overwriting another editor

~~~bash
node packages/pagiera/cli/main.mjs page get PAGE_ID
node packages/pagiera/cli/main.mjs page update PAGE_ID --file page.json --expected-version 3
node packages/pagiera/cli/main.mjs page preview PAGE_ID
~~~

Updates replace the document. Preserve unrelated fields. On a revision conflict, fetch the latest page and reconcile changes instead of retrying blindly. The preview command returns a conventional preview URL; your host must implement that route.

## Publish only with approval

~~~bash
node packages/pagiera/cli/main.mjs page publish PAGE_ID
~~~

Publishing is separate from saving. Commands return JSON; failures write JSON to stderr and exit nonzero. Structural validation does not guarantee visual correctness or complete style validation.`,
  },
  {
    slug: "revisions",
    title: "Saving and revisions",
    group: "Reference" as const,
    description:
      "Handle optimistic concurrency, recover drafts and separate save from publish.",
    content: `## Two different versions

document.version identifies the serialization format. page.version identifies the saved page revision. Use the page revision as expectedVersion when saving. Never substitute the document format number.

## Save sequence

1. Load the latest page and retain its version.
2. Edit the document without discarding unrelated fields.
3. Save with that expected version.
4. Check the returned status, not only the HTTP status code.
5. Retain the returned new version and read back important changes.

The save operation can return a conflict result even when the HTTP request itself succeeds. On conflict, reload and reconcile the edits; an automatic blind retry risks replacing another person's work.

## Restore a revision

The client adapters expose listRevisions and restoreRevision. Inspect the target revision, confirm the intended recovery with the user, then reload after restoration. Keep preview and publishing as separate verification steps; do not assume restoring a draft republishes the site.

## Operational recovery

Revision history helps recover editing mistakes but is not a database backup. Maintain PostgreSQL backups and test restores as described in [deployment](/docs/deployment).`,
  },
  {
    slug: "fonts-assets",
    title: "Fonts, icons and assets",
    group: "Build" as const,
    description:
      "Register host fonts, choose media and keep content accessible.",
    content: `## Register site fonts

Use PagieraProvider from pagiera/provider to register the next/font variables available to your host. Each font entry has a variable and title. The studio's site font selection is intended to apply to canvas, preview and published output.

1. Load the font in your host application.
2. Register its variable and readable title in the provider.
3. Select the site font in the studio's typography settings.
4. Verify that the font is loaded on both preview and public routes.

The full editor ships its own Figtree font for studio chrome; this is separate from your website typography. See [Next.js setup](/docs/nextjs-setup) for integration context.

## Images, video and icons

Choose assets with appropriate dimensions and usage rights. Supply meaningful image alt text, reserve layout space and test loading failures. Use the icon library for symbols, but retain visible text or an accessible name for important controls.

## External media

Remote images, video and embeds still depend on their origins and your application's browser security policy. Do not assume a URL working on your machine guarantees access for every visitor. Test published pages without an editor session.

## Delivery checks

Review large assets on a slow connection, avoid hiding primary content in decorative media, and confirm font fallback does not make controls overflow.`,
  },
  {
    slug: "deployment",
    title: "Deployment and operations",
    group: "Reference" as const,
    description:
      "Production configuration, security boundaries, caches and recovery checks.",
    content: `## Provision the host

1. Deploy a server-capable Next.js application with the Pagiera backend mounted.
2. Provide PostgreSQL and Redis URLs through server-only configuration.
3. Configure OpenRouter only if AI generation is needed.
4. Protect editor, mutation and preview routes with host authentication and authorization.
5. Check health, save, preview and public rendering in the target environment.

Publishing a page updates application data; it does not deploy the host application or provision infrastructure.

## Server configuration

| Option | Purpose |
| --- | --- |
| postgresUrl | PostgreSQL connection |
| redisUrl | Redis connection |
| openRouterApiKey / openRouterModel | AI provider configuration |
| basePath | Mounted API base path |
| aiRateLimitPerMinute | AI request limit |
| templateRegistryUrl | Template registry upstream |
| allowPrivateHosts | Explicit private data-source host exceptions |
| maxSourceBytes | Maximum source response size; default 2 MB |
| mcpServers / authorizeMcp | Operator-owned MCP connections and authorization |

Use the server type definitions for exact signatures. Do not expose private host exceptions or MCP command configuration as public user input.

## Data and cache lifecycle

PostgreSQL is persistent storage. Redis participates in published-page caching, template caching and rate limiting. Back up the database; do not treat a cache as your recovery copy. Test publishing and unpublishing through the runtime to catch stale content behavior in your deployment.

## Release checklist

Verify unauthorized requests are rejected, secrets stay server-side, draft routes stay private, data-source failures behave predictably, and backups can be restored. Monitor database connectivity, request errors and AI provider failures without logging credentials. Read [security](/docs/security) before production.`,
  },
  {
    slug: "changelog",
    title: "Changelog",
    group: "Reference" as const,
    description:
      "Unreleased changes, documentation additions and compatibility notes.",
    content: `## Unreleased

These entries describe work in the current source tree, not a published npm release. Package availability must be checked against the version you install.

### Documentation

- Preserved the Pagiera purple primary color for solid brand accents and actions; neutral gray styling applies to surrounding surfaces rather than replacing the brand palette.
- Unified website and handbook surfaces around a neutral gray palette. Reorganized navigation around Create, Integrate and Ship workflows, with sliding menu content and a shared animated navigation highlight.
- Neutralized marketing navigation colors to soft charcoal glass, gray hover surfaces and neutral popup menus; docs colors are unchanged.
- Made the marketing navbar transparent at the top and frosted-glass on scroll; replaced link underlines with rounded hover, focus and active backgrounds. Docs navigation remains unchanged.
- Changed the marketing navigation to a centered rounded capsule with detached animated mega-menu popovers. The docs navigation is unchanged.
- Centered the website navigation independently of the logo and action widths; added animated hover, focus and active underlines with reduced-motion support.
- Refined the mega menus and handbook with Pagiera's violet accents, open columns and softer surfaces while retaining grouped navigation and the three-column reading layout.
- Added grouped Product, Developers and Resources mega menus, with expandable mobile groups. Restyled docs as an editorial three-column handbook with continuous navigation rails and resource links.
- Refreshed the shared website navigation with centered links, a Get started action, and a responsive keyboard-accessible menu. The documentation header remains separate.
- Aligned the sticky documentation rails with the article and header, bounded their scrolling to the visible viewport, and prevented sidebar scroll from moving the article at the menu boundary.
- Expanded the local handbook with architecture, studio workflow, native blocks, document structure, responsive design, components and layouts, forms, interactions, AI and MCP, CLI, revisions, fonts and assets, and deployment guides.
- Added this changelog and a documentation maintenance policy.
- Added catalog, content, internal-link and native-block coverage checks to the website build workflow.
- Corrected the full editor stylesheet import to pagiera/full.css.
- Included the documentation catalog in the machine-readable site index.

### Agent tooling

- Added a source-tree CLI for inspecting pages, reading the document contract, validating files, creating and updating native documents, obtaining a preview URL and explicitly publishing.
- Updates require an expected page revision. Save conflicts are reported as failures rather than treated as successful writes.
- CLI validation is structural; rendered preview and host authorization are still required.

## Release entries

No historical release notes are reconstructed here. When a release is actually shipped, move its verified changes under the real version and release date, including breaking changes and migration steps where relevant.`,
  },
];
