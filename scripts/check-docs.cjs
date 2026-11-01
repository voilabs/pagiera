require('../apps/web/scripts/check-docs.cjs');

// Repository-only coverage: the isolated website does not ship package source.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'apps/web/content/docs');
const types=fs.readFileSync(path.join(root,'packages/pagiera/src/internal/lib/editor/types.ts'),'utf8').match(/ELEMENT_TYPES\s*=\s*\[([\s\S]*?)\]/)?.[1];assert.ok(types);for(const type of types.matchAll(/"([^"]+)"/g))for(const locale of ['en','tr'])assert.ok(fs.readFileSync(path.join(dir,locale,'blocks.mdx'),'utf8').includes(type[1]),`Undocumented block: ${type[1]}`);
console.log('Native block documentation coverage passed against package source.');
