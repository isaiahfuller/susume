import { AnimeEntry, AnimeList } from "../interfaces";

export function getWatchedAnimeIds(lists: AnimeList[]): Set<number> {
  const ids = new Set<number>();
  for (const list of lists) {
    for (const entry of list.entries) {
      if (list.status === "COMPLETED" || entry.progress > 0) {
        ids.add(entry.media.id);
      }
    }
  }
  return ids;
}

export function filterUnwatchedSequels(
  entries: AnimeEntry[],
  watchedIds: Set<number>
): AnimeEntry[] {
  return entries.filter((entry) =>
    !entry.relations?.edges.some((edge) =>
      edge.relationType === "PREQUEL" && !watchedIds.has(edge.node.id)
    )
  );
}
