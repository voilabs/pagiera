import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin=process.env.WEBSITE_TEST_ORIGIN||'http://localhost:3000';
const marketing=JSON.parse(await readFile(new URL('../apps/web/src/lib/reset-routes.json',import.meta.url),'utf8'));
const docs=JSON.parse(await readFile(new URL('../apps/web/content/docs/route-inventory.json',import.meta.url),'utf8'));
const urls=marketing.flatMap(r=>[{path:r.path,type:'marketing',locale:'en'},{path:'/tr'+(r.path==='/'?'':r.path),type:'marketing',locale:'tr'}]);
for(const prefix of ['/docs','/tr/docs'])for(const suffix of ['',...docs.map(d=>'/'+d.slug)])urls.push({path:prefix+suffix,type:'docs',locale:prefix.startsWith('/tr')?'tr':'en'});
let sample='';let count=0;const queue=[...urls];
await Promise.all(Array.from({length:3},async()=>{while(queue.length){const {path,type,locale}=queue.shift();const r=await fetch(origin+path);assert.equal(r.status,200,path);const html=await r.text();assert.ok(html.includes(`lang="${locale}"`),`Wrong document language: ${path}`);assert.ok(!html.includes('/_mintlify/'),`Old proxy: ${path}`);if(type==='docs'){assert.ok(html.includes('id="nd-docs-layout"')||html.includes('id="nd-sidebar"'),`Not Fumadocs: ${path}`);assert.ok(!/This page is being rewritten|Bu sayfa baştan yazılıyor/.test(html),`Placeholder content: ${path}`);if(!sample)sample=html;}else assert.ok(html.includes(locale==='tr'?'Bu sayfa sıfırlandı':'This page has been reset'),`Unexpected marketing page: ${path}`);count++;}}));
const assets=[...sample.matchAll(/(?:src|href)="([^\"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&')).filter(p=>p.startsWith('/_next/')&&/\.(?:js|css)(?:\?|$)/.test(p));assert.ok(assets.length>0);for(const asset of new Set(assets)){const r=await fetch(origin+asset);assert.equal(r.status,200,asset);await r.arrayBuffer();}
for(const [query,locale,prefix]of [['publish','en','/docs'],['yayımlama','tr','/tr/docs']]){const r=await fetch(`${origin}/api/search?query=${encodeURIComponent(query)}&locale=${locale}`);assert.equal(r.status,200);const results=await r.json();assert.ok(Array.isArray(results)&&results.length>0,`Empty ${locale} search`);assert.ok(results.every(r=>r.url.startsWith(prefix)),`Cross-locale results: ${locale}`);}
assert.equal((await fetch(origin+'/features/nonexistent')).status,404);
assert.equal((await fetch(origin+'/docs/nonexistent')).status,404);
console.log(`Inline Fumadocs checks passed: ${count} EN/TR pages, ${new Set(assets).size} same-app JS/CSS assets, both search languages and unknown-route 404s.`);
