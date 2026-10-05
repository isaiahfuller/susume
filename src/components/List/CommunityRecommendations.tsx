import { useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AnimeList } from "../../interfaces";
import {
  getCommunityRecommendations,
  watchedSources,
} from "../../utils/communityRecommendations";

export default function CommunityRecommendations({
  animeList,
}: {
  animeList: AnimeList[];
}) {
  const [excludeListed, setExcludeListed] = useState(false);
  const results = useMemo(
    () => getCommunityRecommendations(animeList, excludeListed),
    [animeList, excludeListed],
  );
  const sources = useMemo(() => watchedSources(animeList), [animeList]);
  const missing = sources.some((source) => !source.recommendations);
  const [pagination, setPagination] = useState({
    animeList,
    excludeListed,
    visible: 12,
  });

  // Reset pagination when its inputs change, before React commits the render.
  if (
    pagination.animeList !== animeList ||
    pagination.excludeListed !== excludeListed
  ) {
    setPagination({ animeList, excludeListed, visible: 12 });
  }
  const visible = pagination.visible;

  return (
    <Stack my="lg">
      <Title order={2}>Recommended from watched anime</Title>
      <Text size="sm" c="dimmed">
        AniList user recommendations, ranked by how many completed series
        recommend each title and how you scored them. Each series adds one point
        plus its score divided by 100. Unscored series use your average score.
        Each watched series counts once. Titles you have started are excluded by
        default.
      </Text>
      <Text size="sm" c="dimmed">
        Based on the top 25 user recommendations per series, saved with your
        last list sync.
      </Text>
      <Checkbox
        label="Exclude series on any of my lists"
        checked={excludeListed}
        onChange={(event) => setExcludeListed(event.currentTarget.checked)}
      />
      {!sources.length && (
        <Text c="dimmed">
          Complete an anime and sync your list to find recommendations.
        </Text>
      )}
      {missing && (
        <Alert title="Sync your list">
          Your saved list is missing recommendation data. Sync your account to
          load it.
        </Alert>
      )}
      {!!sources.length && !missing && results.length === 0 && (
        <Text>
          No unwatched recommendations found for your completed anime.
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {results?.slice(0, visible).map(({ media, sources }) => (
          <Card key={media.id} withBorder>
            <Group wrap="nowrap" align="flex-start">
              <Image
                src={media.coverImage?.large}
                alt=""
                w={65}
                h={95}
                radius="sm"
              />
              <Stack gap="xs">
                <Anchor
                  href={`https://anilist.co/anime/${media.id}`}
                  target="_blank"
                  rel="noreferrer"
                  fw={600}
                >
                  {media.title.userPreferred}
                </Anchor>
                <Badge variant="light">
                  From {sources.length} watched series
                </Badge>
              </Stack>
            </Group>
            <details style={{ marginTop: 12 }}>
              <summary>Recommended from</summary>
              <Stack gap={4} mt="xs">
                {sources.map((source) => (
                  <Anchor
                    key={source.id}
                    size="sm"
                    href={`https://anilist.co/anime/${source.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title}
                  </Anchor>
                ))}
              </Stack>
            </details>
          </Card>
        ))}
      </SimpleGrid>
      {results && visible < results.length && (
        <Button
          variant="light"
          onClick={() =>
            setPagination((current) => ({
              ...current,
              visible: current.visible + 12,
            }))
          }
        >
          Show more ({results.length - visible} remaining)
        </Button>
      )}
    </Stack>
  );
}
