# Website and inline documentation

The website and Fumadocs run inside **one Next.js application**. There is no documentation process, proxy or separate port.

## Development

From the repository root:

```sh
bun install
bun run --cwd apps/web dev
```

- Website: `http://localhost:3000`
- Documentation: `http://localhost:3000/docs`
- Turkish documentation: `http://localhost:3000/tr/docs`
- Search: `/api/search?query=publish` and `/api/search?query=yayımlama&locale=tr`

Search is built locally from the MDX content and needs no hosted service or login. The application uses native App Router routes for both languages. Fumadocs providers are scoped to documentation layouts; marketing pages retain their own layout.

## Content and routes

- `content/docs/en/*.mdx` and `content/docs/tr/*.mdx`: handbook content.
- `content/docs/*/meta.json`: section labels and sidebar order.
- `content/docs/route-inventory.json`: stable documentation route inventory.
- `source.config.ts`: the two Fumadocs MDX collections.
- `src/lib/docs-source.ts`: collection loaders and `/docs` / `/tr/docs` base URLs.
- `.source/`: generated modules, ignored by Git. `bun run --cwd apps/web docs:generate` regenerates them before standalone type checking; Next dev/build also generates them.
- `src/lib/docs-catalog.ts` and `docs-catalog-tr.ts`: matching public metadata.
- `src/lib/reset-routes.json`: marketing URLs reserved during the redesign.

The marketing site remains intentionally reset. Its pages are temporary and marked noindex; robots and sitemap also reflect the unpublished local rebuild. The documentation now contains substantive content. Review indexing/canonical policy before public deployment.

## Checks

```sh
node scripts/check-docs.cjs
node scripts/check-i18n.cjs
bun run --cwd apps/web build
node scripts/check-local-website.mjs
```

The last command needs the app running on port 3000. The documentation checker covers content, navigation, local links, native blocks and TypeScript example syntax. The Next build compiles every MDX page and checks app types. These do not execute the host integration examples against a database or replace a real end-to-end integration test.

The pre-reset website is saved under `.archive/web-before-reset-*` (ignored by Git). The old Mintlify application and its launcher were removed after migrating the handbook.
