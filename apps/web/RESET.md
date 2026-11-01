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

The marketing pages and documentation use the same SEO policy. Production builds are indexable by default; `next dev` and Vercel preview/development environments are excluded. For other staging hosts set `PAGIERA_SITE_INDEXABLE=false` before building. This policy changes crawl hints, not access permissions.

## Search and sharing configuration

- `PAGIERA_SITE_URL`: canonical HTTP(S) origin, without a path, query or credentials. Defaults to `https://www.pagiera.com`, which is the destination of the public apex redirect. Existing `NEXT_PUBLIC_SITE_URL` configurations remain supported. The new name takes precedence.
- `PAGIERA_SITE_INDEXABLE`: optional exact `true` or `false` override. Invalid values fail rather than accidentally exposing a staging site to indexing. Rebuild after changing URL/indexing configuration because documentation, robots and sitemap are generated during the build.
- `GOOGLE_SITE_VERIFICATION`: optional HTML-tag verification token from Search Console. The legacy `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` name is also accepted. A token does not grant Search Console API access.
- `src/lib/seo.ts`: shared canonical, EN/TR/x-default, robots, title, description, Open Graph and Twitter metadata.
- `src/lib/structured-data.ts`: website identity, breadcrumb hierarchy, source-code identity and technical article markup. The serializer escapes script delimiters; there are no invented ratings or publication dates.
- `/sitemap.xml`: public marketing routes and actual Fumadocs pages in both languages. Template previews and API routes are excluded. Only guides with an existing editorial date emit `lastmod`; build time is never presented as a content update.
- `/robots.txt`: production allows public content and advertises the sitemap; non-indexable environments disallow crawling. Template previews remain crawlable in production so their `noindex` metadata can be read. API responses also send `X-Robots-Tag: noindex`.
- `/og?title=…&locale=en` (or `tr`): generates the page's 1200×630 social image in this application. No image service or API key is required.

### Verify after deployment

1. Choose one canonical host and have your hosting platform redirect the other host to it permanently. Set the origin above to the final host and deploy the production build.
2. Request the live `/robots.txt`, `/sitemap.xml`, an English page and its Turkish counterpart. Expect crawl access, a nonempty sitemap, a self-referencing canonical, reciprocal `en`/`tr` links and indexable page metadata. A staging build should instead remain blocked and noindex.
3. Verify the domain in Google Search Console using DNS or the optional HTML token, then submit the canonical `/sitemap.xml` URL. Use URL Inspection on the home page, a feature page and a documentation page in each language. A successful local test does not submit a sitemap or prove Google has indexed it.
4. Validate representative structured data with Google's Rich Results Test and monitor indexing, actual search queries, impressions and clicks. Use PageSpeed Insights on the deployed pages to measure real performance before claiming Core Web Vitals improvements. These reports need live access; no search ranking is guaranteed.

Canonical and sitemap behavior follows [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap); language links follow [localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

## Checks

```sh
node scripts/check-docs.cjs
node scripts/check-i18n.cjs
node scripts/check-seo.mjs
bun run --cwd apps/web build
node scripts/check-local-website.mjs
node scripts/check-seo-http.mjs
```

The HTTP checks need the app running on port 3000; `WEBSITE_TEST_ORIGIN` selects another test origin. `check-seo-http.mjs` expects production indexing unless `WEBSITE_EXPECT_INDEXABLE=false` is set for development/staging, and `WEBSITE_CANONICAL_ORIGIN` can specify a non-default canonical origin. The documentation checker covers content, navigation, local links, native blocks and TypeScript example syntax. The Next build compiles every MDX page and checks app types. These do not execute the host integration examples against a database or replace a real end-to-end integration test.

The pre-reset website is saved under `.archive/web-before-reset-*` (ignored by Git). The old Mintlify application and its launcher were removed after migrating the handbook.
