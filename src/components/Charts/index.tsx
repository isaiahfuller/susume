import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimeList, AnimeListEntry, RankedTagList } from "../../interfaces";
import { Container, Text, Title } from "@mantine/core";
import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";

interface ChartsProps {
  animeList: AnimeList[];
  tagList: RankedTagList;
}
interface Decade {
  [key: number]: {
    entries: AnimeListEntry[];
    decade: string;
    avg: number;
    totalScore: number;
    length: number;
  };
}
export default function Charts({ animeList, tagList }: ChartsProps) {
  const [decades, setDecades] = useState<Decade>({});
  const scoreRanges = useMemo(() => {
    const ranges = Array.from({ length: 10 }, (_, index) => ({
      range: `${index * 10}–${(index + 1) * 10}`,
      count: 0,
    }));
    const seen = new Set<number>();
    for (const list of animeList.filter((list) => list.status === "COMPLETED")) {
      for (const entry of list.entries) {
        if (
          !Number.isFinite(entry.score) ||
          entry.score <= 0 ||
          entry.score > 100 ||
          seen.has(entry.media.id)
        ) continue;
        seen.add(entry.media.id);
        ranges[Math.ceil(entry.score / 10) - 1].count++;
      }
    }
    return ranges;
  }, [animeList]);
  tagList;

  const getDecadesAvg = useCallback(() => {
    const completedCombined = [];
    const decades: Decade = {};
    for (const list of animeList.filter((e) => e.status === "COMPLETED")) {
      console.log(list.entries);
      for (const entry of list.entries) {
        if (entry.media.seasonYear) completedCombined.push(entry);
      }
    }
    completedCombined.sort((a, b) => a.media.seasonYear - b.media.seasonYear);
    for (const entry of completedCombined) {
      const decade = 10 * Math.floor(entry.media.seasonYear / 10);
      if (!decades[decade])
        decades[decade] = {
          entries: [],
          totalScore: 0,
          avg: 0,
          length: 0,
          decade: `${decade}s`,
        };
      decades[decade].entries.push(entry);
      decades[decade].totalScore += entry.score;
      if (entry.score) decades[decade].length++;
      decades[decade].avg = Math.floor(decades[decade].totalScore / decades[decade].length);
    }
    setDecades(decades);
  }, [animeList]);

  useEffect(() => {
    //     const tags: Tag = {};
    // for (const [k, v] of Object.entries(tagList)) {
    //   const sset = k.split("-")[0];
    //   if (!tags[sset]) tags[sset] = {};
    // const current = tags[sset];
    // tags[sset] = { ...current, ...v };
    // }
    // console.log("tags", tags);
    getDecadesAvg();
  }, [getDecadesAvg]);

  return (
    <Container>
      <Title>Charts</Title>
      <Text fw={600}>Average score by decade</Text>
      <Text size="sm" c="dimmed">
        Completed anime with a score and a season year.
      </Text>
      <BarChart data={Object.values(decades)} width={400} height={250}>
        <XAxis dataKey="decade" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="avg" />
      </BarChart>
      <Text fw={600}>Score ranges</Text>
      <Text size="sm" c="dimmed">
        Completed anime with a score. Each range includes its upper bound and
        excludes its lower bound.
      </Text>
      <BarChart data={scoreRanges} width={400} height={250}>
        <XAxis dataKey="range" interval={0} angle={-45} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Anime" />
      </BarChart>
    </Container>
  );
}
