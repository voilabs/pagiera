import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const origin = process.env.WEBSITE_TEST_ORIGIN || "http://localhost:3000";
const canonical = (process.env.WEBSITE_CANONICAL_ORIGIN || "https://www.pagiera.com").replace(/\/$/, "");
const indexable = process.env.WEBSITE_EXPECT_INDEXABLE !== "false";
const routes = JSON.parse(await readFile(new URL("../src/lib/reset-routes.json", import.meta.url), "utf8"));
const docs = JSON.parse(await readFile(new URL("../content/docs/route-inventory.json", import.meta.url), "utf8"));
const paths = [...routes.map(route => route.path), "/docs", ...docs.map(doc => `/docs/${doc.slug}`)];
const localize = (path, locale) => locale === "tr" ? `/tr${path === "/" ? "" : path}` : path;
const decode = value => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1].toLowerCase(), decode(match[2])]));
const queue = paths.flatMap(path => ["en", "tr"].map(locale => ({ path, locale })));
const expectedSitemap = new Set(queue.filter(item => !item.path.endsWith("/preview")).map(item => canonical + localize(item.path, item.locale)));
const titles = new Set();
let count = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const { path, locale } = queue.shift();
    const url = localize(path, locale);
    const response = await fetch(origin + url, { signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, 200, url);
    const html = await response.text();
    const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(match => attrs(match[0]));
    const metadata = name => tags.find(tag => tag.name === name || tag.property === name)?.content;
    const canonicals = tags.filter(tag => tag.rel === "canonical");
    assert.equal(canonicals.length, 1, `One canonical required: ${url}`);
    assert.equal(new URL(canonicals[0].href).href, canonical + url, `Canonical: ${url}`);
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    assert.ok(title && !titles.has(`${locale}:${title}`), `Missing/duplicate title within locale: ${url}`);
    titles.add(`${locale}:${title}`);
    assert.ok(metadata("description")?.trim().length > 20, `Description: ${url}`);
    const preview = path.endsWith("/preview");
    const shouldIndex = indexable && !preview;
    assert.match(metadata("robots") || "", shouldIndex ? /\bindex\b/ : /\bnoindex\b/, `Indexing: ${url}`);
    assert.equal(new URL(metadata("og:url")).href, canonical + url);
    assert.equal(metadata("og:locale"), locale === "tr" ? "tr_TR" : "en_US");
    assert.equal(metadata("twitter:card"), "summary_large_image");
    const ogImage = new URL(metadata("og:image"));
    assert.equal(ogImage.origin, canonical);
    assert.equal(ogImage.pathname, "/og");
    assert.equal(ogImage.searchParams.get("locale"), locale);
    const alternates = tags.filter(tag => tag.rel === "alternate" && tag.hreflang);
    if (!preview) for (const alternate of ["en", "tr", "x-default"]) {
      assert.equal(new URL(alternates.find(tag => tag.hreflang === alternate)?.href).href, canonical + localize(path, alternate === "tr" ? "tr" : "en"), `Language alternate: ${url}/${alternate}`);
    }
    else assert.equal(alternates.length, 0, `Do not advertise preview translations: ${url}`);
    const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match => JSON.parse(match[1])["@graph"] || []);
    assert.ok(graph.some(node => node["@type"] === "WebSite" && node.name === "Pagiera"), `Site identity: ${url}`);
    if (!preview) {
      assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `One visible H1: ${url}`);
      assert.ok(graph.some(node => node.url === canonical + url && ["WebPage", "CollectionPage", "TechArticle"].includes(node["@type"])), `Page schema: ${url}`);
      if (path !== "/") {
        const breadcrumb = graph.find(node => node["@type"] === "BreadcrumbList");
        assert.equal(breadcrumb?.itemListElement.at(-1).item, canonical + url, `Breadcrumb: ${url}`);
      }
    }
    count++;
  }
}));

const robotsResponse = await fetch(`${origin}/robots.txt`);
assert.equal(robotsResponse.status, 200);
const robots = await robotsResponse.text();
if (indexable) {
  assert.match(robots, /^Allow: \/$/m);
  assert.ok(!/^Disallow: \/$/m.test(robots), "Site-wide crawl block");
  assert.ok(robots.includes(`Sitemap: ${canonical}/sitemap.xml`));
} else assert.match(robots, /^Disallow: \/$/m);
const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200);
const xml = await sitemapResponse.text();
const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
assert.deepEqual(new Set(entries), indexable ? expectedSitemap : new Set(), "Sitemap must contain exactly the indexable canonical routes");
assert.equal(new Set(entries).size, entries.length, "Duplicate sitemap URL");
if (indexable) for (const entry of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  for (const locale of ["en", "tr", "x-default"]) assert.ok(entry[1].includes(`hreflang="${locale}"`), `Sitemap language: ${locale}`);
}
for (const locale of ["en", "tr"]) {
  const imageResponse = await fetch(`${origin}/og?${new URLSearchParams({ title: locale === "tr" ? "Görsel düzenleme ve veri bağlantıları" : "Visual editing and API data", locale })}`);
  assert.equal(imageResponse.status, 200, `Sharing image: ${locale}`);
  assert.match(imageResponse.headers.get("content-type"), /image\/png/);
  const image = Buffer.from(await imageResponse.arrayBuffer());
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
}
const search = await fetch(`${origin}/api/search?query=Redis`);
assert.equal(search.status, 200);
assert.match(search.headers.get("x-robots-tag") || "", /noindex/);
for (const path of ["/features/nonexistent", "/docs/nonexistent", "/tr/nonexistent"]) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 404, `Unknown route must not be a soft 404: ${path}`);
  assert.match(await response.text(), /name="robots" content="noindex"/);
}
console.log(`SEO HTTP checks passed: ${count} EN/TR pages, ${entries.length} sitemap URLs, metadata, languages, JSON-LD, PNG sharing images, API exclusion and real 404s (${indexable ? "production" : "non-indexable"}).`);
