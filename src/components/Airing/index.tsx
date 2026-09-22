import { useState, useEffect, useMemo } from "react";
import { AnimeEntry, AnimeList } from "../../interfaces";
import { rankTags } from "../../utils/rankTags";
import { getAiringAnime } from "../../utils/getAiringAnime";
import { Title, Container, Center, Loader } from "@mantine/core";
import AnimeAccordion from "../AnimeAccordion";

export default function Airing(props: {
  tags: { [key: string]: any };
  animeList: AnimeList[];
}) {
  const { animeList } = props;
  const [tags, _setTags] = useState(rankTags(props.tags));
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
    setLoading(true);
    if (!animeList.length || !completedListIds.size) return;
    getAiringAnime(1, completedListIds, [], tags).then((entries) => {
      setList(entries);
      setLoading(false);
    });
    console.log("list:", list);
    console.log("animeList:", animeList);
  }, []);

  if (loading)
    return (
      <Center h="87vh">
        <Loader />
      </Center>
    );
  if (list.length)
    return (
      <Container>
        <Title>Latest Anime</Title>
        {/* <Carousel recommendations={list} /> */}
        <AnimeAccordion list={list} />
      </Container>
    );
}
