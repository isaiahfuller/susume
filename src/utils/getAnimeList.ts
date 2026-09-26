import { anilistRequest } from "./anilistRequest";
import { AnimeList, TagList } from "../interfaces";
import { rankTags } from "./rankTags";

export async function getAnimeList(
  id: number,
  accessToken: string,
  refresh = false
) {
  // 57505
  const query = `
    {
      MediaListCollection(userId: ${id}, type:ANIME) {
        user {
          id
          name
        }
        lists {
          name
          isCustomList
          isSplitCompletedList
          status
          entries {
            media {
              title {
                romaji
                english
                native
                userPreferred
              }
              id
              seasonYear
              episodes
              type
              genres
              meanScore
              tags {
                id
                name
                rank
                category
                isAdult
              }
            }
            progress
            score
          }
        }
      }
    }
    `;
  const data = await anilistRequest<{ MediaListCollection: { lists: AnimeList[] } }>(query, accessToken, refresh);
  const lists = data.MediaListCollection.lists;
  return lists;
}

export function summarizeList(lists: AnimeList[]) {
  let scores = 0;
  let entryCount = 0;
  for (const list of lists) {
    for (const entry of list.entries) {
      scores += entry.score;
      if (entry.score) entryCount++;
    }
  }
  const averageScore = entryCount ? scores / entryCount : 50;
  const calcTags = rankTags(getTags(lists, averageScore));
  return { averageScore, tags: calcTags };
}

function getTags(lists: AnimeList[], averageScore: number) {
  const tags: TagList = {};
  for (const list of lists) {
    for (const entry of list.entries) {
      for (const tag of entry.media.tags) {
        if (tag.isAdult) continue;
        if (!(tag.category in tags)) tags[tag.category] = {};
        if (!(tag.name in tags[tag.category])) {
          tags[tag.category][tag.name] = [];
        }
        tags[tag.category][tag.name].push({
          mediaId: entry.media.id,
          mediaName: entry.media.title.userPreferred,
          tagRank: tag.rank,
          entryScore: entry.score > 0 ? entry.score : averageScore,
          status: list.status,
        });
      }
    }
  }
  return tags;
}
