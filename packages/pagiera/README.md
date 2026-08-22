# Pagiera

[![Pagiera visual website builder](https://raw.githubusercontent.com/voilabs/pagiera/main/packages/pagiera/thumbnail.png)](https://pagiera.com)

[Website](https://pagiera.com) · [GitHub](https://github.com/voilabs/pagiera) · [Issues](https://github.com/voilabs/pagiera/issues)

Pagiera is a full-stack visual website builder for React and Next.js. It ships the editor, responsive canvas, page management, reusable components, templates, AI generation, server-side data fetching, publishing runtime, PostgreSQL persistence, and Redis caching as one installable package.

Design in the editor and render the same document on the server. Published pages use semantic HTML, support dynamic routes and query parameters, and can load external API data before HTML is sent to the browser.

## Highlights

- Framer-style visual editor with an infinite canvas
- Responsive breakpoints with isolated overrides
- Free and flow-based layouts
- Reusable components and variants
- Layers, assets, templates, icons, and component library
- Hover, press, entrance, loop, and scroll effects
- Custom easing curves and spring controls
- Site-wide fonts provided through `next/font`
- AI-assisted site generation through OpenRouter and the AI SDK
- GET, POST, PUT, PATCH, and DELETE data sources
- Path parameters, query parameters, headers, and request bodies
- Server-side Request and Repeat blocks
- Dynamic routes such as `/blog/:slug`
- Draft preview and published page rendering
- PostgreSQL persistence and optimistic revisions
- Redis-backed publishing cache and AI rate limiting
- GitHub-backed template catalog with browser caching and offline fallbacks
- Semantic output including `main`, `section`, `nav`, `header`, `footer`, headings, links, paragraphs, and buttons

## Requirements

- Node.js 20+
- React 18.3+
- Next.js App Router for the full-stack integration
- PostgreSQL
- Redis
- OpenRouter API key for AI generation

## Installation

```bash
npm install pagiera
```

```bash
bun add pagiera
```

## Environment variables

Create `.env.local`:

```env
PAGIERA_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/pagiera
PAGIERA_REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

Pagiera creates its required PostgreSQL tables when the server initializes. Redis is used for published-page caching and AI rate limiting.

## Next.js setup

### 1. Import the editor stylesheet

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "pagiera/full.css";
```

`full.css` contains the complete studio UI. Use `pagiera/styles.css` only with the smaller `PagieraEditor` API.

Pagiera uses `@fontsource-variable/figtree` for its editor chrome, including Latin and Latin Extended glyphs. The host application does not need to configure an editor font.

### 2. Add the font provider

The provider makes `next/font` fonts available in **Typography → Site font**. A selection applies to the canvas, preview, and published site.

```tsx
// src/app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import { PagieraProvider } from "pagiera/provider";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PagieraProvider
          fonts={[
            { variable: geistSans.variable, title: "Geist Sans" },
            { variable: geistMono.variable, title: "Geist Mono" },
          ]}
        >
          {children}
        </PagieraProvider>
      </body>
    </html>
  );
}
```

```ts
type PagieraFont = {
  variable: string;
  title: string;
};
```

### 3. Mount the backend

```ts
// src/app/api/pagiera/[...path]/route.ts
import {
  createPagieraRouteHandlers,
  pagieraConfigFromEnv,
} from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;
```

Open `/api/pagiera/health` after starting the application to verify PostgreSQL, Redis, and the configured OpenRouter model.

### 4. Load editor data on the server

```ts
// src/lib/editor-bootstrap.ts
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap = await server.getEditorBootstrap(pageId);

  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}
```

### 5. Mount the studio

The initial document is server-rendered. A client wrapper handles editing and in-editor navigation.

```tsx
// src/app/editor/pagiera-editor.tsx
"use client";

import { createPagieraClient } from "pagiera";
import PagieraStudio from "pagiera/full";
import type { PagieraStudioProps } from "pagiera/full";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Bootstrap = {
  page: PagieraStudioProps["page"];
  pages: PagieraStudioProps["pages"];
  library: PagieraStudioProps["library"];
};

export function PagieraEditorClient({ initial }: { initial: Bootstrap }) {
  const router = useRouter();
  const client = useMemo(() => createPagieraClient(), []);
  const [bootstrap, setBootstrap] = useState(initial);

  return (
    <PagieraStudio
      page={bootstrap.page}
      pages={bootstrap.pages}
      library={bootstrap.library}
      adapters={{
        ...client.adapters,
        navigate: async (pageId, options) => {
          if (pageId === bootstrap.page.id) return;
          const next = await client.bootstrap(pageId) as Bootstrap;
          setBootstrap(next);
          const href = `/editor/${encodeURIComponent(pageId)}`;
          options?.replace ? router.replace(href) : router.push(href);
        },
        refresh: () => {
          void client.bootstrap(bootstrap.page.id).then((next) => {
            setBootstrap(next as Bootstrap);
          });
        },
        previewHref: (pageId) => `/preview/${encodeURIComponent(pageId)}`,
        publishedHref: (slug) => slug === "home" ? "/" : `/${slug}`,
      }}
    />
  );
}
```

```tsx
// src/app/editor/page.tsx
import { editorBootstrap } from "@/lib/editor-bootstrap";
import { PagieraEditorClient } from "./pagiera-editor";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  return <PagieraEditorClient initial={await editorBootstrap()} />;
}
```

```tsx
// src/app/editor/[pageId]/page.tsx
import { editorBootstrap } from "@/lib/editor-bootstrap";
import { PagieraEditorClient } from "../pagiera-editor";

export const dynamic = "force-dynamic";

export default async function EditorDocumentPage({ params }: {
  params: Promise<{ pageId: string }>;
}) {
  return (
    <PagieraEditorClient
      initial={await editorBootstrap((await params).pageId)}
    />
  );
}
```

## Publishing pages

Load published documents on the server. Request blocks then finish before HTML is returned, making API-backed content available to search engines.

```tsx
// src/lib/published-page.tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function renderPublishedPage(
  slug: string,
  searchParams: SearchParams,
  params: Record<string, string> = {},
) {
  const rawQuery = await searchParams;
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] ?? "" : value ?? "",
    ]),
  );

  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPublishedPage(slug, {
    query,
    params,
    page: { slug },
  });

  if (!page) notFound();

  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
    />
  );
}
```

The `home` page is permanent and maps to `/`:

```tsx
// src/app/page.tsx
import { renderPublishedPage } from "@/lib/published-page";

export const dynamic = "force-dynamic";

export default function HomePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderPublishedPage("home", searchParams);
}
```

Other pages can use a catch-all route:

```tsx
// src/app/[...path]/page.tsx
import { renderPublishedPage } from "@/lib/published-page";

export const dynamic = "force-dynamic";

export default async function PublishedPage({ params, searchParams }: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderPublishedPage((await params).path.join("/"), searchParams);
}
```

## Template registry

The editor reads its catalog from the public Pagiera repository by default:

```text
https://raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json
```

This is a static GitHub Raw/CDN request, not the rate-limited GitHub REST API. Registry and template responses are cached in memory and `localStorage` for 15 minutes. The refresh button bypasses the local TTL, and the package keeps bundled fallback entries for offline use.

You may point the studio at a fork, branch, or private proxy:

```tsx
<PagieraStudio
  {...props}
  templateRegistryUrl="https://example.com/pagiera/registry.json"
/>
```

New templates live under the repository's `templates/` directory. They can be released independently from npm package versions. See [`templates/README.md`](https://github.com/voilabs/pagiera/blob/main/templates/README.md) for the registry schema and contribution workflow.

## Dynamic routes and request data

Page slugs may contain named parameters:

```text
blog/:slug
```

For `/blog/1`, pass the matched values in the server context:

```ts
{
  params: { slug: "1" },
  query: { preview: "true" }
}
```

Request URLs, headers, query fields, and bodies may reference context values:

```text
https://dummyjson.com/posts/{{params.slug}}
```

```text
https://api.example.com/search?q={{query.q}}
```

Request blocks expose one returned object directly to descendants. Repeat blocks iterate array results. Both are resolved on the server for published pages.

An upstream `404` can turn the complete route into a 404 page when the data source uses the `page-404` behavior.

## Preview routes

```tsx
// src/app/preview/[pageId]/page.tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: {
  params: Promise<{ pageId: string }>;
}) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPreviewPage((await params).pageId);
  if (!page) notFound();

  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
    />
  );
}
```

## Server API

```ts
import {
  createPagieraRouteHandlers,
  createPagieraServer,
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";
```

`getPagieraServer(config)` returns a shared server with:

- `handle(request)` — process a Pagiera API request
- `getEditorBootstrap(pageId?)` — load editor document, pages, and library
- `getPreviewPage(pageId, context?)` — load a draft and resolve data
- `getPublishedDocument(slug)` — load published document metadata
- `getPublishedPage(slug, context?)` — load published document and SSR data
- `close()` — close PostgreSQL and Redis connections
- `pool` — PostgreSQL pool
- `redis` — Redis client

```ts
type PagieraServerConfig = {
  postgresUrl: string;
  redisUrl: string;
  openRouterApiKey: string;
  openRouterModel: string;
  basePath?: string;
  aiRateLimitPerMinute?: number;
};
```

## Client API

```ts
import { createPagieraClient } from "pagiera";

const client = createPagieraClient({
  baseUrl: "/api/pagiera",
});
```

The client includes:

- `bootstrap(pageId?)`
- `loadPage(pageId)`
- `adapters.save(...)`
- `adapters.createPage(...)`
- `adapters.renamePage(...)`
- `adapters.duplicatePage(...)`
- `adapters.deletePage(...)`
- `adapters.installTemplate(...)`
- `adapters.publishPage(...)`
- `adapters.unpublishPage(...)`
- `adapters.previewSource(...)`
- `adapters.generate(...)`

## Package exports

| Import | Purpose |
| --- | --- |
| `pagiera` | Document utilities, lightweight editor, renderer, client adapters |
| `pagiera/provider` | Provider, `next/font` integration, font types |
| `pagiera/full` | Complete visual studio component |
| `pagiera/full.css` | Complete studio stylesheet |
| `pagiera/runtime` | Published and preview renderer |
| `pagiera/data` | Server-side page data loader |
| `pagiera/server` | PostgreSQL, Redis, OpenRouter, API, publishing server |
| `pagiera/styles.css` | Lightweight editor stylesheet |

## Lightweight editor

```tsx
"use client";

import { useState } from "react";
import {
  createDocument,
  PagieraEditor,
  type PagieraDocument,
} from "pagiera";
import "pagiera/styles.css";

export function SmallEditor() {
  const [document, setDocument] = useState<PagieraDocument>(() => (
    createDocument()
  ));

  return (
    <PagieraEditor
      value={document}
      onChange={setDocument}
      adapters={{
        save: async (nextDocument) => saveDocument(nextDocument),
      }}
    />
  );
}
```

## Security

The Pagiera API can create, modify, publish, and delete content. Protect `/editor`, `/preview`, and write operations under `/api/pagiera` with your application's authentication and authorization layer before deploying publicly.

Never expose `PAGIERA_POSTGRES_URL`, `PAGIERA_REDIS_URL`, or `OPENROUTER_API_KEY` to client components. These are server-only values.

## Troubleshooting

### `server.getEditorBootstrap is not a function`

Make sure all imports resolve to one installed Pagiera version. Remove stale local tarballs or lockfile entries, reinstall, and verify:

```bash
node -p "require('pagiera/package.json').version"
```

### CSS says `@import` must precede other rules

Upgrade Pagiera. Current builds use `@font-face` for the editor font and do not distribute a Google Fonts `@import`.

### PostgreSQL or Redis fails

Open `/api/pagiera/health`, then verify both connection URLs are reachable from the Next.js server process.

### AI generation fails

Verify the OpenRouter key, model identifier, model availability, and account credits.

### Published API data is missing from HTML

Use `server.getPublishedPage(...)` or `loadPageData(...)` in a Server Component before rendering `RenderedPage`. Client-only fetching does not provide the same SEO behavior.

## Local package example

This repository includes `apps/example`, a standalone workspace consumer of the package.

```bash
cd apps/example
cp .env.example .env.local
bun install
bun run dev
```

Open:

- `/editor` — visual editor
- `/preview/:pageId` — draft renderer
- `/` — published `home` page
- `/api/pagiera/health` — backend diagnostics

## License

MIT
