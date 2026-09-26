import { useState, useEffect, useMemo } from "react";
import { AnimeEntry, AnimeList, RankedTagList } from "../../interfaces";
import { getAiringAnime } from "../../utils/getAiringAnime";
import { Title, Center, Loader, Stack } from "@mantine/core";
import AnimeAccordion from "../AnimeAccordion";

export default function Airing(props: {
  tags: RankedTagList;
  animeList: AnimeList[];
}) {
  const { animeList, tags } = props;
  const [list, setList] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const completedListIds = useMemo(() => {
    const res = new Set<number>();
    for (const list of animeList) {
      for (const entry of list.entries) {
        // console.log(entry.media.title.english);
        res.add(entry.media.id);
      }
    }
    return res;
  }, [animeList]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAiringAnime(1, completedListIds, [], tags)
      .then((entries) => { if (active) setList(entries); })
      .catch((error) => { if (active) console.error(error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [completedListIds, tags]);

  if (loading)
    return (
      <Center h="87vh">
        <Loader />
      </Center>
    );
  if (list.length)
    return (
      <Stack>
        <Title>Latest Anime</Title>
        {/* <Carousel recommendations={list} /> */}
        <AnimeAccordion list={list} />
      </Stack>
    );
}
