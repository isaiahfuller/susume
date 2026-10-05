import { useState, useEffect, useMemo } from "react";
import { AnimeEntry, AnimeList, RankedTagList } from "../../interfaces";
import { getAiringAnime } from "../../utils/getAiringAnime";
import { Title, Center, Loader, Text, Container, Switch } from "@mantine/core";
import {
    filterUnwatchedSequels,
    getWatchedAnimeIds,
} from "../../utils/airingFilter";
import AnimeAccordion from "../AnimeAccordion";

export default function Airing(props: {
    tags: RankedTagList;
    animeList: AnimeList[];
}) {
    const { animeList, tags } = props;
    const [list, setList] = useState<AnimeEntry[]>([]);
    const [loadedInputs, setLoadedInputs] = useState<{
        completedListIds: Set<number>;
        tags: RankedTagList;
    } | null>(null);
    const [hideUnwatchedSequels, setHideUnwatchedSequels] = useState(true);
    const watchedIds = useMemo(() => getWatchedAnimeIds(animeList), [animeList]);
    const visibleList = useMemo(
        () =>
            hideUnwatchedSequels ? filterUnwatchedSequels(list, watchedIds) : list,
        [list, watchedIds, hideUnwatchedSequels],
    );
    const completedListIds = useMemo(() => {
        const res = new Set<number>();
        for (const list of animeList) {
            for (const entry of list.entries) {
                res.add(entry.media.id);
            }
        }
        return res;
    }, [animeList]);
    const loading =
        loadedInputs?.completedListIds !== completedListIds ||
        loadedInputs?.tags !== tags;

    useEffect(() => {
        let active = true;
        getAiringAnime(1, completedListIds, [], tags)
            .then((entries) => {
                if (active) setList(entries);
            })
            .catch((error) => {
                if (active) console.error(error);
            })
            .finally(() => {
                if (active) setLoadedInputs({ completedListIds, tags });
            });
        return () => {
            active = false;
        };
    }, [completedListIds, tags]);

    if (loading)
        return (
            <Center h="87vh">
                <Loader />
            </Center>
        );
    return (
        <Container>
            <Title>Latest Anime</Title>
            <Text size="sm" c="dimmed" my="md">
                Currently airing anime based on your completed list and tags.
            </Text>
            <Switch
                label="Hide sequels to unwatched series"
                checked={hideUnwatchedSequels}
                onChange={(event) =>
                    setHideUnwatchedSequels(event.currentTarget.checked)
                }
                mb="md"
            />
            {visibleList.length ? (
                <AnimeAccordion list={visibleList} />
            ) : (
                <Text c="dimmed">No airing anime match your current filters.</Text>
            )}
        </Container>
    );
}
