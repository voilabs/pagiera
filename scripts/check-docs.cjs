// Run from any directory. Compile only the local, trusted documentation modules.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  new Function("require", "module", "exports", outputText)(
    (name) => {
      if (!name.startsWith("./")) throw new Error(`Unexpected docs dependency: ${name}`);
      return load(path.resolve(path.dirname(file), `${name}.ts`));
    }, module, module.exports,
  );
  return module.exports;
}
const dir = path.join(root, "apps/web/src/lib");
const { DOCS } = load(path.join(dir, "docs-catalog.ts"));
const { getDocsContent } = load(path.join(dir, "docs-content.ts"));
const errors = [];
const slugs = new Set(DOCS.map((doc) => doc.slug));
if (slugs.size !== DOCS.length) errors.push("Duplicate documentation slugs");
for (const doc of DOCS) {
  const content = getDocsContent(doc.slug);
  if (!content || content.length < 300) errors.push(`Missing/substantial content required: ${doc.slug}`);
  if (!doc.title || !doc.description) errors.push(`Missing metadata: ${doc.slug}`);
  if (!/^[a-z0-9-]+$/.test(doc.slug)) errors.push(`Invalid slug: ${doc.slug}`);
  for (const match of (content || "").matchAll(/\]\(\/docs\/([^\s)#]+)(?:#[^\s)]*)?\)/g)) {
    if (!slugs.has(match[1])) errors.push(`${doc.slug}: broken docs link ${match[1]}`);
  }
  if (content?.includes("pagiera/styles/full.css")) errors.push(`${doc.slug}: invalid CSS export`);
}
const types = fs.readFileSync(path.join(root, "packages/pagiera/src/internal/lib/editor/types.ts"), "utf8");
const elementArray = types.match(/ELEMENT_TYPES\s*=\s*\[([\s\S]*?)\]/)?.[1];
if (!elementArray) errors.push("Cannot locate native element type inventory");
for (const match of (elementArray || "").matchAll(/"([^"]+)"/g)) {
  if (!new RegExp(`\\b${match[1]}\\b`).test(getDocsContent("blocks") || "")) {
    errors.push(`Native block missing from reference: ${match[1]}`);
  }
}
if (!getDocsContent("changelog")?.includes("## Unreleased")) errors.push("Missing Unreleased changelog section");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Documentation checks passed: ${DOCS.length} pages, internal links and native block coverage.`);
