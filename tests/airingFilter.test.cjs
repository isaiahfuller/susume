const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const filename = path.resolve('src/utils/airingFilter.ts');
const mod = new Module(filename, module);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { getWatchedAnimeIds, filterUnwatchedSequels } = mod.exports;

const list = (status, id, progress = 0) => ({
  status, entries: [{ media: { id }, progress }],
});
const anime = (id, edges = []) => ({ id, relations: { edges } });
const relation = (relationType, id) => ({ relationType, node: { id } });

test('completed or started entries count as watched, not untouched list entries', () => {
  const ids = getWatchedAnimeIds([
    list('COMPLETED', 1), list('CURRENT', 2, 1), list('PAUSED', 3, 2),
    list('DROPPED', 4, 1), list('PLANNING', 5), list('CURRENT', 6),
    list('COMPLETED', 1),
  ]);
  assert.deepEqual([...ids], [1, 2, 3, 4]);
  assert.deepEqual([...getWatchedAnimeIds([])], []);
});

test('hides unwatched prequels but retains unrelated titles and watched sequels in order', () => {
  const entries = [
    anime(10), anime(11, [relation('PREQUEL', 1)]),
    anime(12, [relation('PREQUEL', 2)]), anime(13, [relation('SEQUEL', 2)]),
    anime(14, [relation('PREQUEL', 1), relation('PREQUEL', 2)]),
    { id: 15 },
  ];
  const original = entries.slice();
  assert.deepEqual(filterUnwatchedSequels(entries, new Set([1])).map(({ id }) => id), [10, 11, 13, 15]);
  assert.deepEqual(entries, original);
  assert.deepEqual(filterUnwatchedSequels([], new Set()), []);
});

test('with no watched history, retains only entries without prequels', () => {
  assert.deepEqual(filterUnwatchedSequels([
    anime(10), anime(11, [relation('PREQUEL', 1)]),
  ], new Set()).map(({ id }) => id), [10]);
});
