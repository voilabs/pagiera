const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const assert = require("node:assert/strict");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function("require", "module", "exports", output)((name) => {
    if (name.startsWith("@/")) return load(path.join(root, "src", `${name.slice(2)}.ts`));
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), `${name}.ts`));
    return createRequire(file)(name);
  }, module, module.exports);
  return module.exports;
}
const lib = (name) => load(path.join(root, "src/lib", `${name}.ts`));
const { localizedHref } = lib("i18n");
for (const [input, locale, expected] of [
  ["/", "tr", "/tr"], ["/docs/cli?q=a#usage", "tr", "/tr/docs/cli?q=a#usage"],
  ["/tr/docs", "tr", "/tr/docs"], ["/tr/docs", "en", "/docs"],
  ["https://example.com", "tr", "https://example.com"], ["//example.com", "tr", "//example.com"],
  ["/logo.png", "tr", "/logo.png"], ["/api/pagiera", "tr", "/api/pagiera"], ["#section", "tr", "#section"],
]) assert.equal(localizedHref(input, locale), expected);
const { DOCS } = lib("docs-catalog");
const { getDocsContent } = lib("docs-content");
const { DOCS_CONTENT_TR } = lib("docs-content-tr");
const { DOCS_CATALOG_TR } = lib("docs-catalog-tr");
const fences = (text) => [...text.matchAll(/^(?<fence>`{3}|~{3})[^\n]*\n([\s\S]*?)^\k<fence>/gm)].map((match) => match[2]);
for (const doc of DOCS) {
  assert.ok(DOCS_CATALOG_TR[doc.slug]?.title && DOCS_CATALOG_TR[doc.slug]?.description, `Turkish metadata missing: ${doc.slug}`);
  const translated = DOCS_CONTENT_TR[doc.slug];
  assert.ok(translated?.length > 300, `Turkish content missing: ${doc.slug}`);
  assert.notEqual(translated, getDocsContent(doc.slug), `Untranslated docs: ${doc.slug}`);
  assert.deepEqual(fences(translated), fences(getDocsContent(doc.slug)), `Code samples changed in translation: ${doc.slug}`);
  for (const match of translated.matchAll(/\]\(\/docs\/([^\s)#]+)/g)) assert.ok(DOCS.some((doc) => doc.slug === match[1]), `Broken Turkish link: ${match[1]}`);
}
function compareShape(en, tr, at) {
  assert.equal(typeof tr, typeof en, `Type mismatch ${at}`);
  if (Array.isArray(en)) {
    assert.equal(tr.length, en.length, `Array length mismatch ${at}`);
    en.forEach((item, i) => compareShape(item, tr[i], `${at}[${i}]`));
  } else if (en && typeof en === "object") {
    for (const key of Object.keys(en)) {
      assert.ok(key in tr, `Missing translated field ${at}.${key}`);
      if (["slug", "id", "type", "source", "lang", "updated", "related"].includes(key)) assert.deepEqual(tr[key], en[key], `Technical field changed: ${at}.${key}`);
      else compareShape(en[key], tr[key], `${at}.${key}`);
    }
  }
}
compareShape(lib("guides").GUIDES, lib("guides-tr").GUIDES_TR, "guides");
compareShape(lib("comparisons").COMPARISONS, lib("comparisons-tr").COMPARISONS_TR, "comparisons");
compareShape(lib("faq").FAQ_GROUPS, lib("faq-tr").FAQ_GROUPS_TR, "faq");
compareShape(lib("product-content").productFaq, lib("product-content-tr").productFaqTr, "productFaq");
compareShape(lib("product-content").productCapabilities, lib("product-content-tr").productCapabilitiesTr, "productCapabilities");
// A translated label sitting on an English URL is the failure this catches: the
// copy changes but the link drops a Turkish visitor back into the English tree.
// The skip list mirrors localizedHref, so the check and the helper cannot
// disagree about what counts as a localizable page URL.
// The locale list lives in two places that must agree: next.config.ts decides
// which URLs exist, i18n.ts decides which alternates get emitted. If they drift,
// a locale is either routable with no hreflang or advertised with no page.
const nextConfig = load(path.join(root, "next.config.ts")).default;
assert.deepEqual(
  [...nextConfig.i18n.locales].sort(),
  [...lib("i18n").LOCALES].sort(),
  "next.config.ts locales and i18n.ts LOCALES disagree",
);
assert.equal(nextConfig.i18n.defaultLocale, "en", "defaultLocale drives x-default");
// Detection is what sends a Turkish browser from / to /tr. It is only safe
// because it fires on the root alone and yields to the NEXT_LOCALE cookie the
// language switcher writes; turning it off would strand that switcher as the
// only way anyone ever reaches the Turkish site.
assert.notEqual(nextConfig.i18n.localeDetection, false, "Automatic locale detection must stay enabled (leave localeDetection unset)");


const linkOffenders = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.tsx?$/.test(entry.name)) continue;
    for (const match of fs.readFileSync(full, "utf8").matchAll(/href="(\/[^"]*)"/g)) {
      const href = match[1];
      if (href.startsWith("//") || /^\/(?:api|_next)(?:\/|$)/.test(href) || /\.[a-z0-9]+(?:[?#]|$)/i.test(href)) continue;
      linkOffenders.push(`${path.relative(root, full)}: href="${href}"`);
    }
  }
})(path.join(root, "src"));
assert.deepEqual(linkOffenders, [], `Internal page links must go through localizedHref():\n${linkOffenders.join("\n")}`);

console.log(`Turkish coverage verified: ${DOCS.length} docs; guides, comparisons, FAQs, code parity, locale URL behavior and localized internal links.`);
