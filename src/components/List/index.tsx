import "./index.css";
import CommunityRecommendations from "./CommunityRecommendations";
import { AnimeList, RankedTagList } from "../../interfaces";
import { Container } from "@mantine/core";

export default function List(props: {
  accessToken: string;
  animeList: AnimeList[];
  tagList: RankedTagList;
}) {
  const { animeList } = props;
  if (animeList && animeList.length) {
    return (
      <Container>
        <CommunityRecommendations animeList={animeList} />
      </Container>
    );
  } else return <p>Your saved anime list is empty. Add anime on AniList, then sync your account.</p>;
}
