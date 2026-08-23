# Pagiera template registry

This directory is the public template catalog consumed by the Pagiera editor. It is served directly through GitHub Raw, so adding a template does not require publishing a new npm package.

## Structure

```text
templates/
  registry.json
  template-id/
    template.json
    thumbnail.svg
```

`registry.json` controls discovery and gallery presentation. Each entry points to a versioned template bundle:

The optional `thumbnail` field accepts a URL relative to the registry (or an absolute public image URL). Built-in entries use `./template-id/thumbnail.svg`; `bun run templates:sync` regenerates those catalog images from each entry's `preview` metadata. Replace the field with a custom PNG, WebP, AVIF, or SVG URL when a real screenshot is available.

```json
{
  "schemaVersion": 1,
  "id": "template-id",
  "version": "1.0.0",
  "pages": [],
  "components": []
}
```

Every bundle must contain a page with the `home` slug. `components` contains optional site-wide masters such as navigation and footer blocks; pages carry their instances. Installing a template atomically replaces the site's current pages and shared components. The package backend validates names, slugs, elements, root styles, components, and data sources before writing anything.

## Publishing a template

1. Add `templates/your-template/template.json`.
2. Add its metadata to `templates/registry.json`.
3. Increase the template's version whenever its JSON changes.
4. Run `bun run templates:check`.
5. Commit and push to `main`.

Editors refresh the catalog from `raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json`. Installation sends only the selected entry's `id` to Pagiera; the backend resolves and validates the bundle from its configured registry. The browser caches catalog metadata and Redis caches backend registry/bundle reads for 15 minutes. GitHub Raw is a static CDN endpoint, not the rate-limited GitHub REST API.

The bundled templates can be regenerated with:

```bash
bun run templates:sync
```
