import { RankedTagList, TagList } from "../interfaces";

export function rankTags(tags: TagList): RankedTagList {
  const ranked: RankedTagList = {};
  for (const [category, categoryTags] of Object.entries(tags)) {
    const rankedTags: RankedTagList[string]["tags"] = {};
    for (const [name, entries] of Object.entries(categoryTags)) {
      const total = entries.reduce((sum, entry) =>
        sum + Math.round((entry.tagRank * entry.entryScore * entry.entryScore) / 10000), 0);
      rankedTags[name] = {
        entries: structuredClone(entries),
        listScore: entries.length ? Math.floor(total / entries.length) : 0,
      };
    }
    ranked[category] = {
      tags: rankedTags,
      keys: Object.keys(rankedTags).sort((a, b) => rankedTags[b].listScore - rankedTags[a].listScore),
    };
  }
  return ranked;
}
