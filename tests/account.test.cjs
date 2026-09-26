const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

function freshClient() {
  const modules = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename).exports;
    const mod = new Module(filename, module);
    modules.set(filename, mod);
    mod.filename = filename;
    mod.paths = module.paths;
    mod.require = (id) => id.startsWith('.') ? load(path.resolve(path.dirname(filename), `${id}.ts`)) : require(id);
    mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, filename);
    return mod.exports;
  }
  return load('src/utils/account.ts');
}

test('saved accounts survive reload, isolate users, deduplicate and preserve failed syncs', async () => {
  const originalFetch = global.fetch;
  const originalStorage = global.localStorage;
  const storage = new Map();
  global.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  let calls = 0;
  let fail = false;
  global.fetch = async (_url, options) => {
    calls++;
    if (fail) return { ok: false, status: 429 };
    const id = options.headers.Authorization === 'Bearer alice' ? 1 : 2;
    const query = JSON.parse(options.body).query;
    const data = query.includes('Viewer') ? { Viewer: { id, name: `User ${id}` } } : {
      MediaListCollection: { lists: [{ name: `List ${id}`, status: 'COMPLETED', entries: [] }] },
    };
    return { ok: true, json: async () => ({ data }) };
  };
  try {
    const client = freshClient();
    const [alice, duplicate] = await Promise.all([client.loadAccount('alice'), client.loadAccount('alice')]);
    assert.deepEqual(alice, duplicate);
    assert.equal(calls, 2);
    assert.deepEqual(await freshClient().loadAccount('alice'), alice);
    assert.equal(calls, 2, 'reload must not make requests');
    const bob = await client.loadAccount('bob');
    assert.equal(bob.id, 2);
    assert.equal(calls, 4);
    assert.equal((await client.loadAccount('alice')).id, 1);
    await client.loadAccount('alice', true);
    assert.equal(calls, 5, 'manual sync bypasses request cache');
    fail = true;
    await assert.rejects(client.loadAccount('alice', true), /429/);
    assert.equal((await freshClient().loadAccount('alice')).id, 1);
    fail = false;
    storage.set('susume-account-v1:1', '{broken');
    await freshClient().loadAccount('alice');
    assert.equal(calls, 7, 'corrupt snapshot is fetched again');
    assert.ok(!JSON.stringify([...storage]).includes('Bearer'));
    assert.ok(![...storage.keys()].some((key) => key.includes('alice')));
  } finally {
    global.fetch = originalFetch;
    global.localStorage = originalStorage;
  }
});
