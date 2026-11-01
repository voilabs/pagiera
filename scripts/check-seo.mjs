import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../packages/pagiera/package.json", import.meta.url));
const esbuild = require("esbuild");
function load(relativePath) {
  const output = esbuild.buildSync({
    entryPoints: [fileURLToPath(new URL(relativePath, import.meta.url))],
    bundle: true, platform: "node", format: "cjs", write: false,
  });
  const module = { exports: {} };
  new Function("module", "exports", output.outputFiles[0].text)(module, module.exports);
  return module.exports;
}
const seo = load("../apps/web/src/lib/seo.ts");
const schema = load("../apps/web/src/lib/structured-data.ts");
const keys = ["NODE_ENV", "VERCEL_ENV", "PAGIERA_SITE_INDEXABLE", "PAGIERA_SITE_URL", "NEXT_PUBLIC_SITE_URL", "GOOGLE_SITE_VERIFICATION", "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"];
const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
try {
  for (const key of keys) delete process.env[key];
  process.env.NODE_ENV = "production";
  assert.equal(seo.siteIndexable(), true);
  assert.equal(seo.siteOrigin(), "https://www.pagiera.com");
  process.env.VERCEL_ENV = "preview";
  assert.equal(seo.siteIndexable(), false, "Vercel previews must stay excluded");
  delete process.env.VERCEL_ENV;
  process.env.NODE_ENV = "development";
  assert.equal(seo.siteIndexable(), false, "Development must stay excluded");
  process.env.PAGIERA_SITE_INDEXABLE = "true";
  assert.equal(seo.siteIndexable(), true, "Explicit local indexing test override");
  process.env.PAGIERA_SITE_INDEXABLE = "false";
  assert.equal(seo.siteIndexable(), false);
  process.env.PAGIERA_SITE_INDEXABLE = "TRUE";
  assert.throws(() => seo.siteIndexable(), /must be true or false/);
  delete process.env.PAGIERA_SITE_INDEXABLE;
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://legacy.example";
  assert.equal(seo.siteOrigin(), "https://legacy.example");
  process.env.PAGIERA_SITE_URL = "https://canonical.example/";
  assert.equal(seo.siteOrigin(), "https://canonical.example");
  for (const invalid of ["ftp://example.com", "https://example.com/path", "https://user:password@example.com", "https://example.com?key=value", "https://example.com/#hash", "invalid"]){
    process.env.PAGIERA_SITE_URL = invalid;
    assert.throws(() => seo.siteOrigin(), undefined, `Invalid canonical origin accepted: ${invalid}`);
  }
  process.env.PAGIERA_SITE_URL = "https://canonical.example";
  assert.deepEqual(seo.languageAlternates("/features/data"), {
    en: "https://canonical.example/features/data", tr: "https://canonical.example/tr/features/data", "x-default": "https://canonical.example/features/data",
  });
  for (const locale of ["en", "tr"]) {
    const metadata = seo.pageMetadata({ path: "/features/data", locale, title: "Data", description: "Bind your own API data." });
    assert.equal(metadata.alternates.canonical, seo.localizedUrl("/features/data", locale));
    assert.equal(metadata.robots.index, true);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(new URL(metadata.openGraph.images[0].url).searchParams.get("locale"), locale);
    const preview = seo.pageMetadata({ path: "/templates/nocturne/preview", locale, title: "Preview", description: "Preview only.", noIndex: true });
    assert.equal(preview.robots.index, false);
    assert.equal(preview.robots.follow, true);
    assert.equal(preview.alternates.languages, undefined);
    const graph = schema.pageStructuredData({ path: "/docs/data-binding", locale, title: "Data", description: "Data guide", article: true, breadcrumbs: [{ name: "Pagiera", path: "/" }, { name: "Docs", path: "/docs" }, { name: "Data", path: "/docs/data-binding" }] });
    const breadcrumbs = graph["@graph"].find(node => node["@type"] === "BreadcrumbList");
    assert.equal(breadcrumbs.itemListElement.at(-1).item, seo.localizedUrl("/docs/data-binding", locale));
    assert.deepEqual(breadcrumbs.itemListElement.map(item => item.position), [1, 2, 3]);
    assert.equal(graph["@graph"][0].dateModified, undefined, "Do not invent content dates");
  }
  const unsafe = { text: "</script><img src=x onerror=alert(1)>\u2028\u2029" };
  const safe = schema.serializeStructuredData(unsafe);
  assert.ok(!safe.includes("<") && !safe.includes("\u2028") && !safe.includes("\u2029"), "JSON-LD must not break out of its script");
  assert.deepEqual(JSON.parse(safe), unsafe);
  process.env.GOOGLE_SITE_VERIFICATION = "test-verification";
  assert.equal(seo.rootMetadata("en").verification.google, "test-verification");
  process.env.PAGIERA_SITE_INDEXABLE = "false";
  assert.equal(seo.pageMetadata({ path: "/", locale: "en", title: "Home", description: "Home" }).robots.index, false);
  console.log("SEO policy checks passed: production/preview indexing, canonical validation, legacy config, language alternates, social metadata, preview exclusion and JSON-LD safety.");
} finally {
  for (const key of keys) {
    if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
  }
}
