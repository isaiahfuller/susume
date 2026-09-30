const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

function client(request) {
  const filename = path.resolve('src/utils/communityRecommendations.ts');
  const mod = new Module(filename, module);
  mod.require = () => ({ anilistRequest: request });
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}
const media = (id, extra = {}) => ({ id, title: { userPreferred: `Anime ${id}` }, type: 'ANIME', isAdult: false, ...extra });
const list = (status, ids) => ({ status, entries: ids.map((id) => ({ media: media(id), progress: 0 })) });
const page = (items, hasNextPage = false) => ({ recommendations: {
  pageInfo: { hasNextPage }, nodes: items.map((mediaRecommendation) => ({ mediaRecommendation })),
} });

test('ranks cached recommendations by distinct completed sources without network calls', () => {
  const lists = [list('COMPLETED', [1, 2]), list('COMPLETED', [1]), list('CURRENT', [3]), list('PLANNING', [4])];
  Object.assign(lists[0].entries[0].media, page([media(5), media(5), media(1), media(3), null, media(8, { isAdult: true }), media(9, { type: 'MANGA' }), media(6)]));
  Object.assign(lists[0].entries[1].media, page([media(5), media(4)]));
  lists[1].entries[0].media = lists[0].entries[0].media;
  const results = client(() => { throw new Error('Must not call API'); }).getCommunityRecommendations(lists);
  assert.deepEqual(results.map((item) => [item.media.id, item.sources.length]), [[5, 2], [4, 1], [6, 1]]);
  assert.deepEqual(results[0].sources.map((source) => source.id), [1, 2]);
});

test('handles empty and older cached lists without recommendation data', () => {
  const api = client(() => { throw new Error('Must not call API'); });
  assert.deepEqual(api.getCommunityRecommendations([]), []);
  assert.deepEqual(api.getCommunityRecommendations([list('COMPLETED', [1])]), []);
});


test('uses completed scores and the rated average for unscored sources', () => {
  const lists = [list('COMPLETED', [1, 2, 3])];
  lists[0].entries[0].score = 100;
  lists[0].entries[1].score = 20;
  lists[0].entries[2].score = 0;
  Object.assign(lists[0].entries[0].media, page([media(10)]));
  Object.assign(lists[0].entries[1].media, page([media(11), media(12)]));
  Object.assign(lists[0].entries[2].media, page([media(12)]));
  const results = client(() => { throw new Error('Must not call API'); }).getCommunityRecommendations(lists);
  assert.deepEqual(results.map((item) => item.media.id), [12, 10, 11]);
});


test('option excludes recommendations on any list, including planning', () => {
  const lists = [list('COMPLETED', [1]), list('PLANNING', [2])];
  Object.assign(lists[0].entries[0].media, page([media(2), media(3)]));
  const api = client(() => { throw new Error('Must not call API'); });
  assert.deepEqual(api.getCommunityRecommendations(lists).map((item) => item.media.id), [2, 3]);
  assert.deepEqual(api.getCommunityRecommendations(lists, true).map((item) => item.media.id), [3]);
});
