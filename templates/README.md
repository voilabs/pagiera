# Pagiera template registry

This directory is the public template catalog consumed by the Pagiera editor. It is served directly through GitHub Raw, so adding a template does not require publishing a new npm package.

## Structure

```text
templates/
  registry.json
  template-id/
    template.json
```

`registry.json` controls discovery and gallery presentation. Each entry points to a versioned template bundle:

```json
{
  "schemaVersion": 1,
  "id": "template-id",
  "version": "1.0.0",
  "pages": []
}
```

Every bundle must contain a page with the `home` slug. Installing a template atomically replaces the site's current pages. The package backend validates names, slugs, elements, root styles, and data sources before writing anything.

## Publishing a template

1. Add `templates/your-template/template.json`.
2. Add its metadata to `templates/registry.json`.
3. Increase the template's version whenever its JSON changes.
4. Run `bun run templates:check`.
5. Commit and push to `main`.

Editors refresh the catalog from `raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json`. The browser keeps a 15-minute cache and offers a manual refresh button. GitHub Raw is a static CDN endpoint, not the rate-limited GitHub REST API.

The three package templates can be regenerated with:

```bash
bun run templates:sync
```
