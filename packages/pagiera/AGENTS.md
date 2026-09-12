# Build and launch websites with Pagiera

This guide is for coding agents integrating the installed `pagiera` package
into a user's application and designing editable websites with it. Follow the
user's project instructions and explicit scope. Read the bundled [README](./README.md)
for complete Next.js route examples before writing integration code.

## Understand the request

- **Integrate the editor:** add the package, backend, protected studio and preview routes, and public rendering routes.
- **Design a website:** create real Pagiera document elements that the user can edit in the studio. Do not substitute an unrelated hardcoded React landing page or a single HTML Embed for the design.
- **Edit an existing site:** load its latest draft, preserve unrelated content, and update only the requested elements or breakpoint.
- **Activate/publish:** save the reviewed draft, publish the requested page, then verify its public route. Saving a draft is not publishing. Publishing content is not deploying the host application.

For a new design, establish the destination page, audience, brand direction,
content, and desired interactions. Use reasonable defaults for minor visual
choices. Do not overwrite an existing home page just because a new design was
requested. If the user explicitly requests `/`, work on the `home` page rather
than inventing a `/showcase` destination.

## 1. Install and configure

The full integration uses Next.js App Router, Node.js 20+, React 18.3+,
PostgreSQL and Redis. In the consuming app, use its existing package manager:

```sh
npm install pagiera
# or: bun add pagiera
```

Set server-only environment variables:

```dotenv
PAGIERA_POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
PAGIERA_REDIS_URL=redis://HOST:6379
OPENROUTER_API_KEY=YOUR_SERVER_SIDE_KEY
OPENROUTER_MODEL=YOUR_AVAILABLE_MODEL_ID
```

AI generation needs a configured OpenRouter key and available model; manual
document design does not require making AI requests. Never use `NEXT_PUBLIC_`
for these secrets. Read the installed server declarations for configuration
requirements rather than assuming another version's behavior.

Import `pagiera/full.css` in the app's global stylesheet. Use `PagieraProvider`
from `pagiera/provider` to expose the host's fonts; the README includes a
`next/font` example. Use `pagiera/styles.css` only for the lightweight editor.

## 2. Wire the server and studio

Create the backend route:

```ts
// app/api/pagiera/[...path]/route.ts
import { createPagieraRouteHandlers, pagieraConfigFromEnv } from "pagiera/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;
```

Protect the editor, preview, diagnostics, and administrative API with the
host's authentication and authorization before exposing them publicly.
Pagiera is not a replacement for the host's access-control system. Apply the
host's CSRF protections to cookie-authenticated mutations as appropriate.

On the server, obtain the bootstrap:

```ts
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

const server = await getPagieraServer(pagieraConfigFromEnv());
const initial = await server.getEditorBootstrap(pageId);
if (!initial) throw new Error("Page not found");
```

Mount the default export from `pagiera/full` in a client component with
`page`, `pages`, `library`, `initialPanel`, and adapters. Create the adapters
with `createPagieraClient()` from `pagiera`. See the README's complete client
wrapper: it also wires page navigation, bootstrap refresh, preview links and
published links. Do not omit navigation or keep stale bootstrap state when
switching pages.

Expected routes:

- `/editor` loads the bootstrap and redirects using `editorPath(page.id)`.
- `/editor/[pageId]/[panel]` validates the panel with `editorPanel`, loads the page, and passes `initialPanel` to the studio.
- `/preview/[pageId]` renders the protected draft through `getPreviewPage` and `RenderedPage`.
- `/` renders the published `home` page.
- A public catch-all route renders other published slugs without replacing existing application routes.

Only import `pagiera/server` in server code. Use public package exports, not
deep imports into package source or generated internal bundle paths.

## 3. Design an editable website

Read the current document before changing it. Prefer native Frames, Sections,
Stacks, text, images, buttons and other supported blocks. Build a clear page
hierarchy with meaningful layer names and reusable components/layouts for
repeated navigation and footer content. Preserve existing component IDs and
links; inspect an existing studio-created document before authoring advanced
component, layout, shader or interactive configuration. Do not invent fields
that the installed version may silently discard.

The public document helpers are available from `pagiera`:

```ts
import { createDocument, type PagieraDocument } from "pagiera";

const document: PagieraDocument = createDocument();
document.rootStyle = {
  ...document.rootStyle,
  bg: "#121212",
  layout: "stack",
  direction: "column",
};
document.elements = [
  {
    id: crypto.randomUUID(),
    type: "Heading",
    name: "Hero heading",
    z: 0,
    content: "Build something worth sharing.",
    base: {
      position: "static",
      widthMode: "fill",
      heightMode: "auto",
      color: "#ffffff",
      fontSize: 64,
      fontWeight: "700",
      padT: 64,
      padR: 24,
      padB: 64,
      padL: 24,
    },
    overrides: {
      tablet: { fontSize: 48 },
      mobile: { fontSize: 36, padT: 32, padB: 32 },
    },
  },
];
```

This is a minimal document example, not a complete website. For a finished
design, add appropriate content sections, navigation, imagery, calls to action
and footer, with a consistent type scale, spacing and colors. Use licensed or
user-provided assets; do not invent testimonials or business claims.

Document conventions:

- `elements` is a flat array; `parentId` links children to their parent IDs.
- IDs must be unique and stable across edits. Preserve unmodified elements.
- `base` holds shared styles; `overrides` holds breakpoint-specific patches.
- Use the document's actual breakpoint IDs; do not assume custom documents use the defaults.
- Prefer flow layouts, fill widths and automatic content heights for responsive content. Use absolute placement intentionally.
- `createDocument` performs a shallow top-level merge. Spread existing `rootStyle` when changing a few fields.
- `document.version` is a schema version, not the page's optimistic concurrency version.
- Preserve `dataSources`, root settings and unsupported-to-you fields when editing an existing document. Never reconstruct it from only the fields you happen to need.

Use the studio for advanced blocks when their public schema is insufficiently
documented. Read back the saved document to ensure normalization did not drop
important settings. Check desktop, tablet and mobile, text wrapping, keyboard
navigation, form labels, contrast, and reduced-motion behavior.

## 4. Save safely and preview

### Command-line workflow

The package includes the `pagiera` executable. Run `npx pagiera help` for JSON
usage information. Set `PAGIERA_URL` to the host's full API base URL (for
example `http://localhost:3000/api/pagiera`). `PAGIERA_TOKEN`, when provided,
is sent as a Bearer token; the host must implement authorization for it.
The CLI does not create credentials or bypass host authentication.

```sh
npx pagiera inspect
npx pagiera schema
npx pagiera page get PAGE_ID
npx pagiera page validate --file document.json
npx pagiera page create --name Portfolio --slug portfolio --file document.json
npx pagiera page update PAGE_ID --file document.json --expected-version 3
npx pagiera page preview PAGE_ID
```

Use actual page IDs from inspect/get, not slugs. The file contains the complete
version-1 document, not a patch or a page response envelope. Preserve the loaded
page version and pass it explicitly on update. Never substitute a newly fetched
version onto an old document after a conflict. Saves return the read-back page.
Structural validation checks IDs and parent links; the server still normalizes
styles, so inspect the saved document and preview it visually.

`page preview` returns the conventional `/preview/PAGE_ID` URL; hosts with custom
routes should adapt it. `page publish PAGE_ID` is a separate explicit command,
used only when publication was requested. CLI results are JSON on stdout; errors
are JSON on stderr with a nonzero exit code. No model request is made by the CLI:
the coding agent authors the document using the schema and existing page data.

The client API exposes these signatures:

```ts
const client = createPagieraClient({ baseUrl: "/api/pagiera" });
await client.bootstrap(pageId);
await client.loadPage(pageId);
await client.adapters.createPage("About", "about");
await client.adapters.save(pageId, document, expectedVersion);
```

The calls above illustrate separate operations, not a script to blindly run
on every request. Obtain `pageId` and `expectedVersion` from the actual loaded
page response. Inspect the response shape/types for the installed version.
Never use `document.version` as `expectedVersion`. A save replaces the supplied
document content: merge your targeted edits into the complete latest draft.

On a version conflict, reload and reconcile rather than forcing a stale save.
Keep a recoverable copy or revision before significant authorized edits. Do
not write directly to PostgreSQL to bypass validation, revisioning or cache
invalidation. After saving, open `/preview/{pageId}` and verify both the visual
result and interactive behavior before offering publication.

AI-assisted editing is optional. In the studio, select a layer or use `@` to
target a layer/component/breakpoint, describe a specific change, inspect the
old/new values, then apply. Current capabilities vary by version; do not
promise arbitrary deletion, whole-site regeneration or automatic MCP tool
execution. AI output is a proposal, not authorization to publish. MCP discovery
requires host-configured servers and authorization; never expose server
credentials in the chat or browser.

## 5. Publish / activate the website

Only publish when requested or approved. Save and review first, then:

```ts
await client.adapters.publishPage(pageId);
// To take this page offline when requested:
// await client.adapters.unpublishPage(pageId);
```

Render published content with the runtime rather than rendering the draft:

```tsx
// Server Component; adapt slug to the route being served.
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export default async function HomePage() {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPublishedPage("home");
  if (!page) notFound();
  return <RenderedPage elements={page.elements} rootStyle={page.rootStyle} data={page.data} />;
}
```

Use the README's context-aware renderer when the page uses query parameters,
dynamic route parameters or Request/Repeat data blocks. Resolve data on the
server; do not replace it with client-only fetching when SSR is required.

Verify `/` for `home`, or the requested public slug for another page. Check
that visitors see the published revision, not just the editor preview. Draft
changes need another publish before becoming public. Deploying the Next.js
application, configuring a domain/TLS and provisioning production services are
separate host tasks; use the user's chosen deployment provider and approval.

## Example user request an agent should fulfill

> Integrate Pagiera into my Next.js app and design a modern dark portfolio on
> the home page. Use editable native blocks, purple accents, a responsive hero,
> project sections and a reusable footer. Preserve unrelated routes. Show me
> the draft preview first; publish it at `/` only after I approve.

The deliverable is a working integration **and a saved editable Pagiera
document**, not merely instructions, an image mockup, or an unrelated JSX page.
Report the editor URL, preview URL, saved/published status, checks performed,
and any missing credentials or deployment steps. Never claim publication or
successful AI generation without verifying it.

## Verification and troubleshooting

- Follow the consuming app's install, typecheck, build and dev scripts.
- In this monorepo, `bun run check` runs package checks/build and example typecheck; `bun run dev` builds the package and starts the example.
- Check the protected `/api/pagiera/health` endpoint for backend connectivity.
- Verify the installed version with `node -p "require('pagiera/package.json').version"` when examples and exports disagree.
- If workspace source changes are invisible, rebuild the package and restart the relevant dev process if it cached old server modules.
- Do not terminate an unidentified process because a port is occupied.
- Never run paid AI generation, destructive template installation, data resets or publication merely to test the integration without authorization.
