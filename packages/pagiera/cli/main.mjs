#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validate(document) {
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  if (!object(document) || document.version !== 1 || !Array.isArray(document.elements) || !object(document.rootStyle) || !Array.isArray(document.dataSources)) throw new Error('Expected a version:1 document with elements, rootStyle and dataSources.');
  const ids = new Map();
  for (const element of document.elements) {
    if (!object(element) || typeof element.id !== 'string' || !element.id || ids.has(element.id) || typeof element.type !== 'string' || !object(element.base) || !Number.isFinite(element.z)) throw new Error('Each element needs a unique id, type, numeric z and base styles.');
    ids.set(element.id, element);
  }
  for (const element of ids.values()) {
    const seen = new Set([element.id]);
    let parent = element.parentId;
    while (parent) {
      if (!ids.has(parent)) throw new Error(`Unknown parentId: ${parent}`);
      if (seen.has(parent)) throw new Error(`Parent cycle at ${parent}`);
      seen.add(parent); parent = ids.get(parent).parentId;
    }
  }
  return document;
}

export async function run(args, env = process.env) {
  const positional = []; const options = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) { positional.push(args[i]); continue; }
    const key = args[i].slice(2);
    if (!['file', 'url', 'name', 'slug', 'expected-version'].includes(key)) throw new Error(`Unknown option --${key}`);
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = args[++i];
  }
  const [command, action, id] = positional;
  if (!command || command === 'help') return { commands: ['inspect', 'schema', 'page get ID', 'page create --name NAME --slug SLUG --file document.json', 'page update ID --file document.json --expected-version N', 'page validate --file document.json', 'page preview ID', 'page publish ID'], configuration: 'PAGIERA_URL or --url is the full API base URL. Optional PAGIERA_TOKEN is sent as a Bearer token; the host must authorize it.', output: 'JSON; errors go to stderr with exit code 1.' };
  if (command === 'schema') return { description: 'Public document TypeScript contract; validation checks structure and parent links, server normalization remains authoritative.', types: await readFile(new URL('../dist/document.d.ts', import.meta.url), 'utf8'), example: (await import('../dist/document.js')).createDocument() };
  const allowed = ['get', 'create', 'update', 'validate', 'preview', 'publish'];
  if (command !== 'inspect' && (command !== 'page' || !allowed.includes(action))) throw new Error('Unknown command. Run pagiera help.');
  let document;
  if (['create', 'update', 'validate'].includes(action)) {
    if (!options.file) throw new Error('--file is required');
    document = validate(JSON.parse(await readFile(options.file, 'utf8')));
    if (action === 'validate') return { valid: true, elements: document.elements.length, scope: 'Structural validation; not a full style-schema validator.' };
  }
  if (command === 'page' && !['create', 'validate'].includes(action) && !id) throw new Error('Page ID required (use inspect to discover IDs).');
  if (action === 'create' && (!options.name || !options.slug)) throw new Error('--name and --slug are required');
  const expectedVersion = Number(options['expected-version']);
  if (action === 'update' && (!Number.isInteger(expectedVersion) || expectedVersion < 0)) throw new Error('--expected-version must be the loaded page version, not document.version');
  const base = new URL(options.url || env.PAGIERA_URL || 'http://localhost:3000/api/pagiera');
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid API base URL');
  if (env.PAGIERA_TOKEN && base.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Bearer authentication requires HTTPS outside localhost');
  const request = async (path, body) => {
    const response = await fetch(base.href.replace(/\/$/, '') + path, { method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', ...(env.PAGIERA_TOKEN ? { Authorization: `Bearer ${env.PAGIERA_TOKEN}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response.json();
  };
  if (command === 'inspect') return request('/bootstrap');
  const pagePath = `/pages/${encodeURIComponent(id)}`;
  if (action === 'get') return request(pagePath);
  if (action === 'preview') { await request(pagePath); return { previewUrl: new URL(`/preview/${encodeURIComponent(id)}`, base).href, note: 'Default host preview route; requires host authentication.' }; }
  if (action === 'publish') return request(`${pagePath}/publish`, {});
  const save = async (pageId, version) => {
    const result = await request(`/pages/${encodeURIComponent(pageId)}/save`, { document, expectedVersion: version });
    if (result.status !== 'saved') throw new Error(`Save rejected: ${result.status}. Reload and reconcile; do not force a stale save.`);
    return { ...result, pageId, page: await request(`/pages/${encodeURIComponent(pageId)}`) };
  };
  if (action === 'update') return save(id, expectedVersion);
  const created = await request('/pages', { name: options.name, slug: options.slug });
  try {
    const page = await request(`/pages/${encodeURIComponent(created.pageId)}`);
    return await save(created.pageId, page.version);
  } catch (error) { throw new Error(`Page ${created.pageId} was created but saving failed: ${error.message}`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2)).then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(error => { process.stderr.write(JSON.stringify({ error: error.message }) + '\n'); process.exitCode = 1; });
}
