import { SYSTEM_DOCS } from "./docs-systems";

const content: Record<string, string> = {
  ...Object.fromEntries(
    SYSTEM_DOCS.map((entry) => [entry.slug, entry.content]),
  ),
  "getting-started": `## Before you begin

Pagiera runs inside your application. You keep control of authentication, page data and deployment. For the complete studio integration you need Node.js 20 or newer, React 18.3 or newer, the Next.js App Router, PostgreSQL and Redis. OpenRouter is optional and is only required for AI-assisted generation.

## Install the package

Choose the command for your package manager:

\`\`\`bash
bun add pagiera
# or
npm install pagiera
\`\`\`

### Import the editor stylesheet

Add the full studio stylesheet before your own overrides. Import it once in the root stylesheet used by the editor route.

\`\`\`css
@import "tailwindcss";
@import "pagiera/full.css";
\`\`\`

## Configure the services

Create \`.env.local\` and add the two required service URLs. Keep these values on the server; never expose them through a \`NEXT_PUBLIC_\` variable.

\`\`\`env
PAGIERA_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/pagiera
PAGIERA_REDIS_URL=redis://localhost:6379

# Optional: needed only for AI generation
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
\`\`\`

PostgreSQL stores projects, drafts and published documents. Redis caches published pages and template bundles and provides AI rate limiting.

## Verify the installation

Continue to [Next.js setup](/docs/nextjs-setup), mount the backend route, then open \`/api/pagiera/health\`. Do not expose the studio publicly before adding your authentication check.`,

  "nextjs-setup": `## Create the backend route

Pagiera exposes one catch-all handler for editor and runtime operations. Create \`src/app/api/pagiera/[...path]/route.ts\`:

\`\`\`ts
import { createPagieraRouteHandlers, pagieraConfigFromEnv } from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;
\`\`\`

### Protect the route

Pagiera does not choose an authentication provider for you. Run your normal session or role check before forwarding editor requests. Public page rendering can remain public; editing and publishing endpoints should not.

## Load the editor bootstrap

Fetch the initial document on the server. This keeps the first render deterministic and avoids a loading-only editor shell.

\`\`\`ts
// src/lib/editor-bootstrap.ts
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap = await server.getEditorBootstrap(pageId);
  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}
\`\`\`

## Mount the studio

Create a server page that performs the permission check and loads the bootstrap. Pass that result to a small client wrapper containing the interactive editor.

### Keep the boundary explicit

- Server component: authentication, route parameters and bootstrap loading.
- Client component: studio interactions and in-editor navigation.
- API route: saving, previewing, publishing and asset operations.

## Run the health check

Start Next.js and visit \`/api/pagiera/health\`. Resolve PostgreSQL or Redis errors before opening the editor. If AI is configured, confirm that the selected OpenRouter model is available.`,

  publishing: `## Understand the three states

Saving, previewing and publishing are deliberately separate. **Save** updates the draft. **Preview** renders that draft through a protected route. **Publish** replaces the public version. Publishing content does not deploy your Next.js application or configure a domain.

## Render the published page

Load the approved document on the server and hand its elements to the runtime.

\`\`\`tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export async function PublishedPage({ slug }: { slug: string }) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPublishedPage(slug, { page: { slug } });
  if (!page) notFound();
  return <RenderedPage elements={page.elements} />;
}
\`\`\`

## Add a protected preview route

The preview route should accept a page ID, verify the current user can edit it, load the draft and render it with the same runtime used in production. Add \`noindex\` metadata so preview URLs cannot enter search results.

## Publish safely

1. Save the current draft.
2. Open the protected preview on desktop, tablet and mobile widths.
3. Verify dynamic data with realistic route and query values.
4. Publish from the studio.
5. Request the public URL in a fresh session.
6. Confirm that the initial HTML contains important text and data.

### Rollback strategy

Treat the page document as production data. Keep database backups and, when your workflow requires approval history, record published revisions before replacement.`,

  "data-binding": `## Choose Request or Repeat

Use a **Request** block when an endpoint returns one object. Use a **Repeat** block when a list should create one visual subtree per item. Published requests resolve on the server before HTML is returned.

## Use route and query values

A page slug may contain named parameters such as \`blog/:slug\`. Pass the matched values into the published-page context:

\`\`\`ts
{
  params: { slug: "introducing-pagiera" },
  query: { preview: "true" },
  page: { slug: "blog/:slug" }
}
\`\`\`

Reference those values in request URLs, headers or bodies:

\`\`\`text
https://api.example.com/posts/{{params.slug}}
https://api.example.com/search?q={{query.q}}
\`\`\`

## Bind returned fields

Connect text, images, links and visibility rules to fields returned by the request. For Repeat blocks, each repeated subtree receives the current item as its local data context.

### Handle loading and failure

Server rendering has no client-side loading phase for published output. Design empty and error states explicitly. An upstream 404 can turn the complete route into a 404 response when the data source uses the \`page-404\` behavior.

## Keep pages indexable

Do not move essential content into an effect that runs after hydration. Confirm with “View Source” or an HTTP request that titles, descriptions and primary page copy are present in the returned HTML.`,

  templates: `## What a template contains

A Pagiera template is a validated document bundle: pages, reusable components, linked layouts, assets and the metadata required to present it in the template browser.

## Configure the registry

Point the server at a registry you control, or use the official registry:

\`\`\`env
PAGIERA_TEMPLATE_REGISTRY_URL=https://raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json
\`\`\`

## Install a template

The browser sends only the selected template ID to your backend. The server downloads the configured bundle, validates it and replaces the project atomically. This keeps registry trust and network access on the server.

### Before installation

- Save or export work that should not be replaced.
- Confirm the target project.
- Review the pages and assets listed by the template.
- Ensure the registry URL uses HTTPS and belongs to a trusted publisher.

## Maintain your own registry

Version bundles, keep IDs stable and validate every release in a clean project. Avoid changing an existing version in place; publish a new version so installations remain reproducible.`,

  "api-reference": `## Server API

Import server-only functions from \`pagiera/server\`. Never include this entry point in a client component.

### createPagieraRouteHandlers

Creates the GET, POST, PUT, PATCH and DELETE handlers used by the catch-all backend route.

### pagieraConfigFromEnv

Builds server configuration from the documented environment variables and validates required values.

### getPagieraServer

Returns the server facade used to load editor bootstraps, drafts and published pages.

\`\`\`ts
const server = await getPagieraServer(pagieraConfigFromEnv());
const bootstrap = await server.getEditorBootstrap(pageId);
const published = await server.getPublishedPage(slug, context);
\`\`\`

## Runtime API

Import \`RenderedPage\` from \`pagiera/runtime\` to render approved elements. Pass request context to the server before rendering so dynamic blocks resolve into the initial HTML.

## Client API

The studio client receives the server-produced bootstrap. Keep navigation callbacks and editor-only state in this boundary; credentials and database configuration remain on the server.

## Package exports

- \`pagiera/server\` — database, cache, route handlers and document loading.
- \`pagiera/runtime\` — production page rendering.
- \`pagiera/full.css\` — complete studio styles.
- Lightweight exports — use only when embedding a reduced editing surface.`,

  security: `## Define the trust boundary

Pagiera provides editor and publishing primitives, not an authentication product. Your application decides who can list projects, open a draft, upload assets and publish a page.

## Protect editor routes

Require an authenticated session and an explicit editor role before rendering the studio. Repeat the authorization check in API handlers; hiding a navigation link is not access control.

## Keep secrets on the server

PostgreSQL, Redis and OpenRouter credentials must never use the \`NEXT_PUBLIC_\` prefix. Do not serialize them into the editor bootstrap or return them from health endpoints.

## Validate external data

Treat template registries and APIs used by Request blocks as external input. Use HTTPS, allowlist hosts when possible, limit response sizes and avoid forwarding arbitrary user-provided headers.

## Production checklist

- Editor and preview routes require authentication.
- Publishing requires a narrower role than ordinary editing when appropriate.
- Database and Redis connections use production credentials and encryption.
- Preview pages send \`noindex\`.
- Backups and a document recovery process exist.
- Logs do not include secrets or complete authorization headers.`,

  troubleshooting: `## The health endpoint fails

Open \`/api/pagiera/health\` and address the first failing dependency. Verify environment variables are available to the Next.js server process, then test PostgreSQL and Redis independently.

## The editor has no styles

Import \`pagiera/full.css\` before your own stylesheet. CSS \`@import\` rules must appear before ordinary style rules. Restart the dev server after changing the root stylesheet.

## getEditorBootstrap is not a function

Your application and generated lockfile may be resolving different package versions. Inspect the installed \`pagiera\` version, reinstall dependencies and restart Next.js.

## AI generation fails

Confirm that \`OPENROUTER_API_KEY\` is present on the server and that \`OPENROUTER_MODEL\` names a model available to the account. AI is optional; remove its configuration while diagnosing the core editor.

## Published API data is missing from HTML

Load the published document with request context on the server. Verify route parameters and query values match the placeholders used by Request blocks. Inspect the raw HTML response rather than only the hydrated browser view.

## A page saves but does not change publicly

Saving changes the draft only. Open preview to verify the draft, then publish it. If the public page remains stale, check Redis connectivity and cache invalidation.`,

  agents: `## Objective

Build pages as native Pagiera documents so a human can open, edit, preview and publish them after the coding agent finishes. Do not replace the requested editable page with a separate hardcoded React page.

## Integration sequence

1. Inspect the application’s existing authentication, routing and styling conventions.
2. Install Pagiera and import the editor stylesheet.
3. Configure PostgreSQL and Redis with server-only environment variables.
4. Mount the catch-all backend route.
5. Add a protected studio route and server bootstrap.
6. Create or import native page documents.
7. Verify save, preview and publish separately.

## Preserve editability

Use native elements, components, variants and linked layouts. Put shared navigation and footers in a layout with a children placeholder. Use Request and Repeat blocks for data rather than hiding fetch logic in an unrelated client component.

## Verification contract

- The editor opens behind authentication.
- The page document can be selected and changed visually.
- Saving does not silently publish.
- Preview renders the current draft.
- Publishing updates the public page.
- Essential dynamic content exists in server-rendered HTML.
- No secret is exposed to the browser.

## Report the result

State which files were changed, which environment variables are required, where the editor route lives and how the user can preview and publish. Report any unverified external dependency explicitly.`,
};

export function getDocsContent(slug: string) {
  return content[slug];
}
