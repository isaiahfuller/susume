import { anilistRequest } from "../../utils/anilistRequest";
import { useEffect, useState } from "react";
import "./index.css";
import TagDisplay from "../TagDisplay";
import Carousel from "../ListScroll";
import { AnimeEntry, AnimeList, RankedTagList } from "../../interfaces";
import { Accordion, Alert, Button, Container, Flex, Title } from "@mantine/core";

export default function List(props: {
  accessToken: string;
  animeList: AnimeList[];
  tagList: RankedTagList;
}) {
  const { accessToken, animeList, tagList } = props;
  const [recommendations, setRecs] = useState<AnimeEntry[][]>([]);
  const [searchError, setSearchError] = useState("");
  const [usedTags, setUsedTags] = useState<string[]>([]);
  const [displayTags, setDisplayTags] = useState(structuredClone(tagList));
  const [averageScore] = useState(50);
  const [accordionString, setAccordionString] = useState<string | null>(null);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  useEffect(() => {
    setDisplayTags(structuredClone(tagList));
  }, [tagList]);

  function weightedRandom(min: number, max: number) {
    return Math.ceil(max / (Math.random() * max + min));
  }

  async function randomSearch(tags: RankedTagList = displayTags) {
    const requiredCategories = ["Cast-Main Cast", "Cast-Traits", "Setting-Universe", "Setting-Scene", "Setting-Time", "Demographic"];
    if (requiredCategories.some((category) => !tags[category]?.keys?.length)) {
      setSearchError("Your list needs more tag information for random recommendations. Try searching with individual tags.");
      return;
    }
    setSearchError("");
    const mainCast = tags["Cast-Main Cast"].keys.sort(
      (a, b) =>
        tags["Cast-Main Cast"].tags[b].listScore -
        tags["Cast-Main Cast"].tags[a].listScore
    );
    const trait = tags["Cast-Traits"].keys.sort(
      (a, b) =>
        tags["Cast-Traits"].tags[b].listScore - tags["Cast-Traits"].tags[a].listScore
    );
    const setting = tags["Setting-Universe"].keys.sort(
      (a, b) =>
        tags["Setting-Universe"].tags[b].listScore -
        tags["Setting-Universe"].tags[a].listScore
    );
    const scene = tags["Setting-Scene"].keys.sort(
      (a, b) =>
        tags["Setting-Scene"].tags[b].listScore - tags["Setting-Scene"].tags[a].listScore
    );
    const time = tags["Setting-Time"].keys.sort(
      (a, b) =>
        tags["Setting-Time"].tags[b].listScore - tags["Setting-Time"].tags[a].listScore
    );
    const demographic = tags["Demographic"].keys.sort(
      (a, b) =>
        tags["Demographic"].tags[b].listScore - tags["Demographic"].tags[a].listScore
    );
    const idxs = [
      weightedRandom(1, mainCast.length) - 1,
      weightedRandom(1, trait.length) - 1,
      weightedRandom(1, setting.length) - 1,
      weightedRandom(1, scene.length) - 1,
      weightedRandom(1, time.length) - 1,
      weightedRandom(1, demographic.length) - 1,
    ];
    await search(
      `"${mainCast[idxs[0]]}"`,
      `"${trait[idxs[1]]}"`,
      `"${setting[idxs[2]]}"`,
      `"${scene[idxs[3]]}"`,
      `"${time[idxs[4]]}"`,
      `"${demographic[idxs[5]]}"`
    ).catch((error: unknown) => setSearchError(error instanceof Error ? error.message : "Unable to load recommendations."));
  }

  async function search(
    mainCast: string,
    trait: string,
    setting: string,
    scene: string,
    time: string,
    demographic: string
  ) {
    await delay(100);
    const tags = [mainCast, trait, setting, scene, time, demographic];
    const currentTags = new Set<string>();
    let results: AnimeEntry[] = [];
    let attempts = 0;
    do {
      attempts++;
      const tagNames = tags.filter((e) => !currentTags.has(e));
      let str = "";
      tagNames.forEach((e) => {
        str += e.replace(/"/g, "") + ", ";
      });
      str = str.substring(0, str.length - 2);
      if (usedTags.includes(str)) {
        setAccordionString(str);
        return;
      }
      const query = `
      {
        Page(page:0, perPage:10){
          media(tag_in:[${tagNames.join(",")}],type:ANIME){
            title{
              userPreferred,
              romaji
            }
            id
            seasonYear
            episodes
            type
            genres
            meanScore
            siteUrl
            coverImage{
              large
            }
            tags {
              id
              name
              rank
              category
              isAdult
            }
          }
        }
      }
      `;
      await anilistRequest<{ Page: { media: AnimeEntry[] } }>(query, accessToken)
        .then((data) => {
          results = data.Page.media;
          currentTags.add(
            tagNames[Math.floor(Math.random() * (tagNames.length - 1))]
          );
          if (results.length) {
            setRecs((prev) => [...prev, results]);
            setUsedTags((prev) => [...prev, str]);
            setAccordionString(str);
          }
        });
      // break;
    } while (!results.length && attempts < 6 && currentTags.size < tags.length);
  }

  if (animeList && animeList.length) {
    return (
      <Container>
        {searchError && <Alert color="red">{searchError}</Alert>}
        <TagDisplay
          tags={tagList}
          search={search}
          randomSearch={randomSearch}
          setDisplayTags={setDisplayTags}
          displayTags={displayTags}
          averageScore={averageScore}
        />
        <div />
        {/* <hr /> */}
        <Title className="results-header" order={1}>
          Recommended by tags
        </Title>
        <Flex direction="column" className="results">
          <Accordion
            multiple={false}
            className="w-full"
            value={accordionString}
          >
            {recommendations.length
              ? recommendations.map((e, i) => {
                  return (
                    <Accordion.Item value={usedTags[i]} w="full" key={i}>
                      <Accordion.Control
                        w="full"
                        onClick={() =>
                          setAccordionString(
                            accordionString === usedTags[i] ? null : usedTags[i]
                          )
                        }
                      >
                        {usedTags[i]}
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Carousel recommendations={e} />
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })
              : null}
          </Accordion>
          <Button
            fullWidth
            variant="transparent"
            className="m-2"
            onClick={() => randomSearch()}
          >
            {recommendations.length ? "Load more..." : "Find recommendations"}
          </Button>
        </Flex>
      </Container>
    );
  } else return <p>Your saved anime list is empty. Add anime on AniList, then sync your account.</p>;
}
