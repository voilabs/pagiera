const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),esbuild=require('esbuild');const root=path.resolve(__dirname,'..');const dir=path.join(root,'content/docs');const routes=JSON.parse(fs.readFileSync(path.join(dir,'route-inventory.json'),'utf8'));assert.equal(new Set(routes.map(r=>r.slug)).size,routes.length);let count=0;
for(const locale of ['en','tr']){const prefix=locale==='tr'?'/tr/docs':'/docs';const pages=['index',...routes.map(r=>r.slug)];const nav=JSON.parse(fs.readFileSync(path.join(dir,locale,'meta.json'),'utf8')).pages.filter(p=>!p.startsWith('---'));assert.deepEqual([...nav].sort(),[...pages].sort(),`${locale} navigation coverage`);for(const page of pages){const file=path.join(dir,locale,page+'.mdx');const text=fs.readFileSync(file,'utf8');assert.match(text,/^---\r?\n/);assert.match(text,/^title: .+/m);assert.match(text,/^description: .+/m);assert.ok(text.length>650,`Incomplete ${locale}/${page}`);assert.ok(!/This page is being rewritten|Bu sayfa baştan yazılıyor|New documentation is being prepared/.test(text),`Placeholder ${page}`);for(const link of text.matchAll(/\]\((\/[^)#]+)(?:#[^)]*)?\)/g)){const url=link[1];assert.ok(url===prefix||url.startsWith(prefix+'/'),`Wrong locale link ${locale}/${page}: ${url}`);const target=url===prefix?'index':url.slice(prefix.length+1);assert.ok(fs.existsSync(path.join(dir,locale,target+'.mdx')),`Broken ${page} -> ${url}`);}for(const match of text.matchAll(/^(?<fence>`{3}|~{3})(ts|tsx)\s*\r?\n([\s\S]*?)^\k<fence>/gm)){try{esbuild.transformSync(match[3],{loader:match[2],target:'es2022'});}catch(error){throw new Error(`Invalid TypeScript in ${locale}/${page}: ${error.message}`);}}count++;}}
for(const locale of ['en','tr'])assert.match(fs.readFileSync(path.join(dir,locale,'changelog.mdx'),'utf8'),/## Unreleased/);
console.log(`Documentation checks passed: ${count} Fumadocs pages, navigation, links and TypeScript example syntax.`);

// Metadata drives more than the sidebar: keep category cards, localized
// catalogs and integration setup links consistent with the actual handbook.
function loadMetadata(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const module = { exports: {} };
  new Function('module', 'exports', esbuild.transformSync(source, { loader: 'ts', format: 'cjs' }).code)(module, module.exports);
  return module.exports;
}
const { DOCS } = loadMetadata('src/lib/docs-catalog.ts');
const { DOCS_CATALOG_TR } = loadMetadata('src/lib/docs-catalog-tr.ts');
assert.deepEqual(DOCS.map(doc => doc.slug).sort(), routes.map(route => route.slug).sort(), 'Catalog route coverage');
assert.deepEqual(Object.keys(DOCS_CATALOG_TR).sort(), routes.map(route => route.slug).sort(), 'Turkish catalog coverage');
const categories = {};
for (const locale of ['en', 'tr']) {
  categories[locale] = [];
  let current;
  for (const item of JSON.parse(fs.readFileSync(path.join(dir, locale, 'meta.json'), 'utf8')).pages) {
    if (item.startsWith('---')) {
      current = { title: item.slice(3, -3), slugs: [] };
      categories[locale].push(current);
    } else if (item !== 'index') {
      assert.ok(current, `Uncategorized page: ${locale}/${item}`);
      current.slugs.push(item);
      const doc = locale === 'tr' ? DOCS_CATALOG_TR[item] : DOCS.find(doc => doc.slug === item);
      assert.equal(doc.group, current.title, `Category mismatch: ${locale}/${item}`);
    }
  }
  assert.ok(categories[locale].every(category => category.slugs.length > 0), `Empty ${locale} category`);
}
assert.deepEqual(categories.en.map(category => category.slugs), categories.tr.map(category => category.slugs), 'Category locale parity');
const { INTEGRATIONS, INTEGRATION_CATEGORIES, INTEGRATIONS_UI } = loadMetadata('src/lib/integrations.ts');
assert.equal(new Set(INTEGRATIONS.map(item => item.id)).size, INTEGRATIONS.length, 'Unique integration IDs');
assert.deepEqual(Object.keys(INTEGRATIONS_UI.en).sort(), Object.keys(INTEGRATIONS_UI.tr).sort(), 'Integration interface locale parity');
for (const item of INTEGRATIONS) {
  assert.ok(INTEGRATION_CATEGORIES.some(category => category.id === item.category), `Unknown integration category: ${item.id}`);
  assert.ok(['required', 'optional', 'host'].includes(item.mode), `Missing integration setup mode: ${item.id}`);
  assert.ok(item.steps.length > 0, `Missing integration setup steps: ${item.id}`);
  const slug = item.docs.split('#')[0].replace('/docs/', '');
  for (const locale of ['en', 'tr']) {
    assert.ok(item.summary[locale] && item.steps.every(step => step[locale]), `Missing ${locale} integration copy: ${item.id}`);
    assert.ok(fs.existsSync(path.join(dir, locale, `${slug}.mdx`)), `Broken integration guide: ${item.docs}`);
  }
}
console.log(`Category and integration checks passed: ${categories.en.length} matching topic groups, ${INTEGRATIONS.length} localized setup guides.`);
