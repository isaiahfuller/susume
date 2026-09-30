import { AnimeList, RecommendedMedia } from "../interfaces";

export interface CommunityRecommendation {
  media: RecommendedMedia;
  sources: { id: number; title: string }[];
}

export function watchedSources(lists: AnimeList[]) {
  return [...new Map(lists.filter((list) => list.status === "COMPLETED")
    .flatMap((list) => list.entries.map(({ media }) => [media.id, media] as const))).values()];
}

// Recommendations arrive with the list sync; ranking never makes API calls.
export function getCommunityRecommendations(lists: AnimeList[], excludeListed = false): CommunityRecommendation[] {
  const completedEntries = lists.filter((list) => list.status === "COMPLETED")
    .flatMap((list) => list.entries);
  const scoredEntries = completedEntries.filter((entry) => entry.score > 0);
  const averageScore = scoredEntries.length
    ? scoredEntries.reduce((sum, entry) => sum + entry.score, 0) / scoredEntries.length
    : 50;
  const sourceScores = new Map(completedEntries.map((entry) =>
    [entry.media.id, entry.score > 0 ? entry.score : averageScore] as const));
  const excluded = new Set(lists.flatMap((list) => list.entries
    .filter((entry) => excludeListed || list.status !== "PLANNING" || entry.progress > 0)
    .map((entry) => entry.media.id)));
  const results = new Map<number, CommunityRecommendation>();
  for (const source of watchedSources(lists)) {
    for (const node of source.recommendations?.nodes ?? []) {
      const media = node?.mediaRecommendation;
      if (!media || media.type !== "ANIME" || media.isAdult || excluded.has(media.id)) continue;
      const result = results.get(media.id) ?? { media, sources: [] };
      if (!result.sources.some((item) => item.id === source.id)) {
        result.sources.push({ id: source.id, title: source.title.userPreferred });
      }
      results.set(media.id, result);
    }
  }
  const score = (result: CommunityRecommendation) => result.sources.reduce((sum, source) =>
    sum + 1 + (sourceScores.get(source.id) ?? averageScore) / 100, 0);
  return [...results.values()].sort((a, b) => score(b) - score(a) ||
    b.sources.length - a.sources.length ||
    a.media.title.userPreferred.localeCompare(b.media.title.userPreferred));
}
