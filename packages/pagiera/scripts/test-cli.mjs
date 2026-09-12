import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, validate } from '../cli/main.mjs';

test('reject duplicate IDs, missing parents and cycles', () => {
  const element = { id: 'a', type: 'Heading', z: 0, base: {} };
  const doc = { version: 1, rootStyle: {}, dataSources: [], elements: [element] };
  assert.equal(validate(doc), doc);
  assert.throws(() => validate({ ...doc, elements: [element, element] }));
  assert.throws(() => validate({ ...doc, elements: [{ ...element, parentId: 'missing' }] }));
  assert.throws(() => validate({ ...doc, elements: [{ ...element, parentId: 'a' }] }));
});

test('create/save/readback and reject HTTP-200 version conflicts without publishing', async () => {
  const requests = [];
  let conflict = false;
  const server = createServer(async (req, res) => {
    let text = ''; for await (const chunk of req) text += chunk;
    requests.push({ url: req.url, body: text ? JSON.parse(text) : undefined });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.endsWith('/save') ? { status: conflict ? 'conflict' : 'saved', version: 2 } : req.method === 'POST' ? { pageId: 'abc' } : { id: 'abc', version: 1 }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const dir = await mkdtemp(join(tmpdir(), 'pagiera-cli-'));
  try {
    const file = join(dir, 'page.json');
    await writeFile(file, JSON.stringify({ version: 1, rootStyle: {}, elements: [], dataSources: [] }));
    const env = { PAGIERA_URL: `http://127.0.0.1:${server.address().port}/api/pagiera` };
    const result = await run(['page', 'create', '--file', file, '--name', 'Test', '--slug', 'test'], env);
    assert.equal(result.pageId, 'abc');
    assert.equal(requests.find(r => r.url.endsWith('/save')).body.expectedVersion, 1);
    assert.ok(!requests.some(r => r.url.includes('publish')));
    conflict = true;
    await assert.rejects(run(['page', 'update', 'abc', '--file', file, '--expected-version', '1'], env), /conflict/);
    assert.equal((await run(['page', 'preview', 'abc'], env)).previewUrl, `http://127.0.0.1:${server.address().port}/preview/abc`);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true });
  }
});
