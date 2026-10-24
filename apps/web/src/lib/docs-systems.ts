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

### What an instance can change

Select a placed component and open the Content tab. Component content lists every text, image and link layer inside it:

- Text replaces the words of that layer.
- Source and Alt text replace an image.
- Link replaces where a linked layer leads.

These values belong to that placement only. Layout, styling and everything else still come from the master, so a later change to the master reaches every instance. Setting a field back to the master's value removes the override.

### Editing a component

Opening a component shows it on its own canvas. A component whose root fills the available width — a navbar, a footer, a section — is drawn once for each breakpoint of the page, and edits made on a narrower artboard are stored as that breakpoint's overrides, exactly as on a page. A component that hugs its content or has a fixed size is drawn once, at the base breakpoint.

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

## Animation

Every motion setting lives in the Effects tab of the inspector and compiles to plain CSS, so a published page animates without an animation library and stays readable without JavaScript.

- **Entrance.** Presets (fade, rise, drop, slide, zoom, blur, pop, reveal wipe) or Custom, which combines start opacity, X/Y movement, scale, rotation and blur. Arrive word by word, letter by letter, or with **Children one by one** to stagger a container's direct children. **Plays** chooses once or every time the layer comes back into view; **Trigger offset** sets how far up the screen it must come before it starts.
- **Curves.** Ease uses a cubic-bezier editor with presets. Spring uses real stiffness, damping and mass: the spring is simulated and shipped as a CSS linear() easing with a cubic fallback, so it can overshoot and settle. A spring's length comes from its physics, shown under the curve graph.
- **Hover and press.** Besides colour, opacity and scale, hover can lift, move, rotate, tilt in 3D and blur; press can push down. **State transition** replaces the default ease with your own curve or spring for both states.
- **Scroll.** Fade, rise, parallax, zoom, blur, slide, rotate and shrink effects are tied to the layer's progress across the viewport. **Runs** picks the range: while entering, the whole pass, while fully visible, or while leaving (which plays the effect in reverse).
- **Loop.** Pulse, float, sway, spin, bounce, wiggle and breathe, with amount, delay, direction (forward, reverse, yoyo) and smooth or constant speed. A loop on a layer with an entrance starts after the entrance finishes.
- **Preview.** Play runs the selected layer's entrance on the canvas with the same keyframes and timing as the published page; All plays every entrance on the page. Preview interactions tests hover, press and state transitions.

Visitors who ask for reduced motion get the finished layers without entrances, scroll effects or loops.

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
    slug: "translations",
    title: "Translations",
    group: "Build" as const,
    description:
      "Give layers translation keys and render a page in any language.",
    content: `## How it works

Pagiera does not store your translations. A layer names the string it wants with a translation key, and your application supplies the strings for the language it is rendering. The text, image or link typed into the layer stays there as the fallback.

1. Select a layer and open Content → Translation.
2. Enter a key, for example nav.home. Text layers and buttons take a Text key; images take a Source key and an Alt key; linked layers take a Link key; form fields take a Placeholder key.
3. Pass the current language's strings to the renderer.

\`\`\`tsx
import { RenderedPage } from "pagiera/runtime";

const translations = {
  tr: { nav: { home: "Anasayfa" }, "hero.cta": "Randevu Al" },
  en: { nav: { home: "Home" }, "hero.cta": "Book an appointment" },
};

<RenderedPage
  elements={page.elements}
  rootStyle={page.rootStyle}
  data={page.data}
  translations={translations[locale]}
/>
\`\`\`

Keys may be flat or nested: nav.home finds both a "nav.home" entry and home inside nav. A key the language does not define changes nothing, so a partly translated site shows its authored text rather than gaps. Leaving translations out renders the page exactly as authored.

A layer bound to a data source still shows its data. Inside a placed component, a layer whose text, image or link was changed for that placement stops following the component's key for that field.

Keys accept letters, digits, dots, dashes, underscores and colons. Anything else is discarded when the page is saved.

## Previewing languages in the studio

Pass every language to the studio and a language switch appears in the toolbar. Choosing a language shows keyed layers as they read in it; Original shows the authored page. Under each key the Translation group lists the languages that have no string for it.

\`\`\`tsx
<PagieraStudio
  page={page}
  pages={pages}
  library={library}
  adapters={{
    ...client.adapters,
    saveTranslation: (locale, key, value) => saveString(locale, key, value),
  }}
  translations={translations}
/>
\`\`\`

saveTranslation is optional. With it, text typed on the canvas while a language is selected is sent to your function for that language and key, and the canvas shows it immediately. Without it the language preview is read-only: switch back to Original to edit the authored text.

Translations are your data. Decide who may change them in your own saveTranslation, and keep the strings wherever your application already keeps them.`,
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

### Studio and rendering

- Deepened the animation module. Entrances gain blur, pop, reveal and fully custom start states, a **Children one by one** stagger, replay on every visit and a trigger offset. Springs are now simulated from stiffness, damping and mass and published as a CSS linear() easing instead of an approximate cubic curve. Hover and press can lift, move, rotate, tilt in 3D and blur, with an editable state transition. Scroll effects gain slide, rotate and shrink plus a choice of range, including reverse while leaving. Loops gain sway, bounce, wiggle and breathe with amount, delay, direction and speed. Play and All replay entrances on the canvas with the published timing.
- Fixed a loop being cancelled for good by the element's own entrance or scroll effect; the loop now continues after the entrance ends. Fixed entrances and scroll effects forcing a layer to full opacity once they finished. The last-resort reveal now only shows what is on screen, so entrances further down the page still play when reached.

- Rebuilt canvas drag and drop. A press only becomes a drag after the pointer moves a few pixels, so clicking no longer reorders layers by accident. The dragged layer lifts and follows the pointer, siblings slide apart to open a slot the size of the layer, and the slot it left closes. On release the layer glides into place. Escape cancels the drag and restores everything, and the canvas scrolls when the pointer nears its edge.
- A layer is no longer nested inside a container smaller than itself unless that container is empty, and the seam between two sections stays reachable even where a child touches the section's edge. Pinned (absolute) children such as section backgrounds are ignored when choosing an insertion point.
- Dragging a layer off every artboard now shows no slot, matching the drop, which parks the layer beside the artboards.
- Blocks dragged in from the Insert panel or the Layers panel show the same insertion line and land between the siblings under the pointer instead of at the end of the container.
- Padding on a selected container is changed with a small grip in the middle of each side. The shaded padding band no longer captures the pointer, so a section can be picked up anywhere.
- Published pages no longer reserve a scrollbar gutter. A page that fits the window shows no scrollbar and no empty strip down its right edge, so full-bleed backgrounds reach the edge as they do on the canvas. Navigating between a page that scrolls and one that does not may shift the layout by the scrollbar's width.
- Fill on a freely positioned (absolute) layer now spans its parent edge to edge on that axis, pinned to both sides, instead of starting at the layer's stored position. A background image set to Fill sits flush on every side even after it has been moved, and its x or y and horizontal or vertical constraint are ignored on the filled axis. Dragging or arrow-nudging such a layer moves it only along the axis that is not filled, the inspector's X or Y field for a filled axis is disabled, and resizing a filled axis turns it back into a fixed size anchored at the edge it was spanning from.
- A dragged layer is drawn above everything on the artboard, including later sections, so a background image carried over another section is no longer hidden under its text.
- A layer dragged inside its own container stays in that container until the pointer leaves the container's box, so reordering nested layers no longer jumps to the parent level near an edge.
- Freely positioned (absolute) layers now move within their own parent and stay freely positioned. Hold Ctrl (⌘ on macOS) while dropping to place one inside another container.
- A selected layer can be dragged from anywhere inside its box, even where another layer covers it. Pressing and releasing without moving still selects the layer on top. Alt-click selects the next layer beneath the pointer, cycling through the stack.
- Locked layers can no longer be selected or dragged on the canvas; a press on one goes to the first unlocked layer beneath it. Locked layers remain selectable in the Layers panel.
- A layer is parked beside the artboards only when it is released at least 32 px outside every artboard, so a drop that slips just past an edge stays on the page.
- New Frame, Section, Image and Embed layers no longer get a default background colour; whatever is behind them shows through. An Image without a source is outlined on the canvas only, and the published page draws nothing for it. Existing layers keep the colours they already have.
- The canvas shows one breakpoint artboard at a time; the device buttons in the dock switch it, and a new dock button shows every breakpoint side by side again. The Layers tree lists only the breakpoints on screen. The choice is remembered in the browser.
- Inspector fields are white with a hairline edge, 12 px left-aligned values and a blue edge with a soft halo on focus; selects and text areas match.
- The full studio stylesheet no longer changes the host app. Every rule in \`pagiera/full.css\` is scoped to the editor's own \`.pg-scope\` element and its theme variables are defined there instead of on \`:root\`, so importing it no longer overrides the host's colours, radii, headings or buttons. Its \`dark:\` variant follows the editor's own \`.pg-dark\` class rather than a host \`.dark\` class.
- Images are no longer stored inside pages as base64. \`createPagieraClient\` now supplies \`uploadImage\`, backed by a new \`POST /assets\` route, so inspector uploads keep a URL; and every inline \`data:image/…\` in a saved page or imported template, including Luma pictures saved by older versions, is moved into the \`assets\` table on its next save. Assets are deduplicated by content hash, their type is read from the file signature, and they are served with \`X-Content-Type-Options: nosniff\`.
- A data source's list path now accepts JSONPath spellings — \`$.items\`, \`items[0].name\`, \`$["items"]\` — alongside dotted paths. Before, \`$.items\` looked for a field literally named \`$\` and Repeat had nothing to loop over. When a response is one object, the Response tab lists the arrays inside it with their item counts; choosing one sets the path and re-sends the request.
- Added Focus mode: the expand button beside the save status, or Ctrl/⌘+Shift+F, makes the studio cover the whole window above the host app's own sidebar and header, and stops the host page scrolling underneath. It is remembered per browser.
- Settings and Templates are now full pages beside the rail, each with its own section list on the left. The canvas, panels, inspector and dock are set aside while one is open, instead of the page being drawn over a live canvas. The Templates page has a single header with refresh, import and export, a search field, and white template cards; its categories live only in the page's own list.
- Editing a component no longer needs a Back to pages button. The rail keeps every destination, and opening a page-level one (Pages, Templates, Assets, Data, History, Settings) returns to the page. The top bar shows a breadcrumb whose page name leads back, Escape with nothing selected also returns, and deleting a component's last master returns on its own.
- The Insert panel shows each element as a small sketch of what it adds (a frame, stacked rows, a grid, heading bars, a pill button, form fields) in two columns, instead of an icon in a grey square.
- Redesigned the editor chrome as a calm light workspace: a warm off-white frame, white floating cards for the panels and inspector, hairline borders, ink-black for the primary publish action and blue for selection and focus. An icon rail on the left now opens Insert, Layers, Pages, Templates, Assets, Data, History and Settings, and each panel is headed by its name. The canvas tools (select or draw, breakpoint, column grid, interaction preview, zoom, undo and redo, Luma) moved from the top bar into a floating dock at the bottom of the canvas. The top bar shows the Pagiera mark and the page or component being edited; the workspace menu, the quick insert button and the open-document tabs were removed, since the rail covers the same destinations.
- Small editor labels now follow one four-step scale (10, 11, 12 and 13 px). Labels previously drawn at 8–9.5 px are raised to 10 px, and fractional sizes are rounded to the nearest step. Larger headings in dialogs and panels are unchanged.
- Added an italic text style and a Max lines setting that cuts longer text with an ellipsis. Both are under Typography and can differ per breakpoint.
- Added separate corner radii. Corners stay linked to Corner radius until Border and shadow → Corners is switched to Separate.
- Added an image Focus setting that chooses which part of a cropped image stays in view.
- Added Appears after for fixed elements: the element slides in once the page has scrolled the given distance. The canvas draws such an element only while it or one of its layers is selected, so it does not cover the page underneath. Without JavaScript it is shown from the start.
- Fixed triggers inside the site header or footer that open another layer of the same component, such as a menu button and its drawer; they did nothing on pages that received the component through the site layout.
- A component whose root fills the available width and holds a single child is no longer shrunk to that child when it is opened for editing.
- Full-width components now open on one artboard per breakpoint. They were previously drawn on a canvas one pixel wide, and their breakpoint overrides could not be edited.
- Placed components can replace an image source, its alt text and a link destination per instance, in addition to text. The Content tab lists them under Component content.
- The Assets panel shows each component as a card with a live preview. Clicking a card opens the component and dragging it places a copy; variants appear as chips only when there is more than one, and the site header and footer are labelled.
- Create component keeps the breakpoint overrides of a full-width layer, so a responsive section stays responsive after it becomes a component.
- Added translation keys. Text, image source, alt text, link and placeholder can each name a key; RenderedPage takes the current language's strings through a translations prop, and the studio previews every language passed to it. See [translations](/docs/translations).
- Added Appears → On parent hover under Effects → Hover. The layer is hidden until its parent is hovered or focused, fades in when it appears, and is drawn on the canvas only while it is selected — so dropdowns and preview cards no longer lie open over the page or its component. This holds on every breakpoint regardless of which artboard was active when it was switched on, and inside a Repeat the interaction preview opens only the row under the pointer.
- Fixed entrance animations, layer toggles, draggable layers, request forms and custom page JavaScript not running after a client-side navigation. They ran on a full page load only, because a script inserted while moving between pages is never executed by the browser; the renderer now runs them itself in that case.

### Agent tooling

- Added a source-tree CLI for inspecting pages, reading the document contract, validating files, creating and updating native documents, obtaining a preview URL and explicitly publishing.
- Updates require an expected page revision. Save conflicts are reported as failures rather than treated as successful writes.
- CLI validation is structural; rendered preview and host authorization are still required.

## Release entries

No historical release notes are reconstructed here. When a release is actually shipped, move its verified changes under the real version and release date, including breaking changes and migration steps where relevant.`,
  },
];
