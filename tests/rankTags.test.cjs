const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const filename = require('node:path').resolve('src/utils/rankTags.ts');
const mod = new Module(filename, module);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { rankTags } = mod.exports;

test('ranking preserves scores, orders tag names and leaves source entries untouched', () => {
  const entry = { mediaId: 1, mediaName: 'Example', status: 'COMPLETED', tagRank: 100, entryScore: 80 };
  const tags = { Genre: { Low: [{ ...entry, entryScore: 20 }], High: [entry], Empty: [] } };
  const ranked = rankTags(tags);
  assert.deepEqual(ranked.Genre.keys, ['High', 'Low', 'Empty']);
  assert.equal(ranked.Genre.tags.High.listScore, 64);
  assert.equal(ranked.Genre.tags.Low.listScore, 4);
  assert.equal(ranked.Genre.tags.Empty.listScore, 0);
  ranked.Genre.tags.High.entries[0].entryScore = 0;
  assert.equal(entry.entryScore, 80);
  assert.deepEqual(Object.keys(tags.Genre), ['Low', 'High', 'Empty']);
  assert.deepEqual(rankTags({}), {});
});
