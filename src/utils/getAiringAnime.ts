import { anilistRequest } from "./anilistRequest";
import { AnimeEntry, RankedTagList } from "../interfaces";

export async function getAiringAnime(
  page = 1,
  animeList: Set<number>,
  tempList: AnimeEntry[],
  tags: RankedTagList
): Promise<AnimeEntry[]> {
  const currentDate = new Date();
  const query = `
    {
      Page(page: ${page}, perPage: 50) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media(status:RELEASING, seasonYear:${currentDate.getFullYear()}, format_in:[TV,OVA,ONA]) {
          id
          title {
            romaji
            english
            native
            userPreferred
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          siteUrl
          episodes
          type
          genres
          meanScore
          isAdult
          description
          tags {
            name
            category
            id
            rank
          }
          trailer {
            site
            id
          }
          externalLinks {
            url
            site
            siteId
            type
            language
            color
            notes
            isDisabled
            icon
          }
          averageScore
          airingSchedule {
            nodes {
              airingAt
              episode
              timeUntilAiring
            }
          }
          rankings {
            id
            rank
            type
            format
            year
            season
            allTime
            context
          }
          relations {
            edges {
              relationType
              node {
                id
              }
            }
          }
        }
      }
    }
    `;
  const data = await anilistRequest<{
    Page: { media: AnimeEntry[]; pageInfo: { hasNextPage: boolean } };
  }>(query);
  const { media, pageInfo } = data.Page;
  const newList = [...tempList, ...media];
  if (!pageInfo.hasNextPage || media.length === 0) {
    return airingSort(
      newList.filter((e) => !e.isAdult),
      tags,
      animeList
    );
  } else return getAiringAnime(page + 1, animeList, newList, tags);
}
function airingSort(
  entries: AnimeEntry[],
  tags: RankedTagList,
  animeList: Set<number>
): AnimeEntry[] {
  const scores = new Map<number, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!tags[tag.category] || !tags[tag.category].tags[tag.name]) continue;
      const score = tags[tag.category].tags[tag.name].listScore * (tag.rank / 100);
      // console.log(score);
      scores.set(
        entry.id,
        scores.has(entry.id) ? (scores.get(entry.id) ?? 0) + score : score
      );
    }
    scores.set(entry.id, (scores.get(entry.id) ?? 0) / Math.max(entry.tags.length, 1));
    if (entry.relations) {
      for (const edge of entry.relations.edges) {
        if (edge.relationType === "PREQUEL" && !animeList.has(edge.node.id))
          scores.set(entry.id, (scores.get(entry.id) ?? 0) / 2);
        if (edge.relationType === "PREQUEL" && animeList.has(edge.node.id))
          scores.set(entry.id, (scores.get(entry.id) ?? 0) * 1.2);
      }
    }
  }
  console.log(scores);
  const newEntries: AnimeEntry[] = entries.sort(
    (a: AnimeEntry, b: AnimeEntry) => {
      return (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    }
  );
  return newEntries;
}
