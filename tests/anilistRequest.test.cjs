const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

function load(path) {
  const filename = require('node:path').resolve(path);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = (id) => id === './anilistRequest' ? client : require(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}
const client = load('src/utils/anilistRequest.ts');
const { anilistRequest } = client;
const { getAiringAnime } = load('src/utils/getAiringAnime.ts');

test('AniList request reuse, isolation, expiry, failures and pagination', async () => {
  const originalFetch = global.fetch;
  const originalNow = Date.now;
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return { ok: true, json: async () => ({ data: { values: [1] } }) };
  };
  try {
    const [first, second] = await Promise.all([anilistRequest('same'), anilistRequest('same')]);
    assert.equal(calls, 1);
    first.values.push(2);
    assert.deepEqual(second.values, [1]);
    assert.deepEqual((await anilistRequest('same')).values, [1]);
    assert.equal(calls, 1);
    await anilistRequest('same', 'other-account');
    assert.equal(calls, 2);
    Date.now = () => originalNow() + 300001;
    await anilistRequest('same');
    assert.equal(calls, 3);
    Date.now = originalNow;

    global.fetch = async () => { calls++; return { ok: false, status: 429 }; };
    await assert.rejects(anilistRequest('retry'), /429/);
    global.fetch = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'failed' }] }) });
    await assert.rejects(anilistRequest('retry'), /failed/);
    global.fetch = async () => ({ ok: true, json: async () => ({ data: { success: true } }) });
    assert.deepEqual(await anilistRequest('retry'), { success: true });

    let pages = 0;
    global.fetch = async (_url, options) => {
      pages++;
      assert.match(JSON.parse(options.body).query, /perPage: 50/);
      return { ok: true, json: async () => ({ data: { Page: {
        media: [{ id: pages, tags: [], isAdult: false }],
        pageInfo: { total: 999, hasNextPage: pages === 1 },
      } } }) };
    };
    assert.equal((await getAiringAnime(1, new Set(), [], {})).length, 2);
    assert.equal(pages, 2);
    await getAiringAnime(1, new Set(), [], {});
    assert.equal(pages, 2);
  } finally {
    global.fetch = originalFetch;
    Date.now = originalNow;
  }
});
