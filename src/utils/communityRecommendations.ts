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
export function getCommunityRecommendations(lists: AnimeList[]): CommunityRecommendation[] {
  const excluded = new Set(lists.flatMap((list) => list.entries
    .filter((entry) => list.status !== "PLANNING" || entry.progress > 0)
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
  return [...results.values()].sort((a, b) => b.sources.length - a.sources.length ||
    a.media.title.userPreferred.localeCompare(b.media.title.userPreferred));
}
