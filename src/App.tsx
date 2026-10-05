import { Center, Loader, Stack, Text } from "@mantine/core";
import List from "./components/List";
import { useMemo } from "react";
import Charts from "./components/Charts";
import Airing from "./components/Airing";
import { summarizeList } from "./utils/getAnimeList";
import { Account } from "./utils/account";

interface AppProps {
  loggedIn: boolean;
  accessToken: string;
  page: number;
  account: Account | null;
  loading: boolean;
}

function App({ loggedIn, accessToken, page, account, loading }: AppProps) {
  const summary = useMemo(() => summarizeList(account?.lists || []), [account]);


  if (!loggedIn) return <Text>Sign in with AniList to save your anime list in this browser.</Text>;
  if (!account && loading) return <Center><Loader /></Center>;

  const currentPage = () => {
    switch (page) {
      case 0:
        return <Airing tags={summary.tags} animeList={account?.lists || []} />;
      case 1:
        return <List accessToken={accessToken} animeList={account?.lists || []} tagList={summary.tags} />;
      case 2:
        return <Charts animeList={account?.lists || []} tagList={summary.tags} />;
      default:
        return null;
    }
  };

  return (
    <Stack>
        <Stack gap={2}>
          <Text fw={600}>{account?.name || "AniList account"}</Text>
          <Text size="sm" c="dimmed">
            {account ? `Saved in this browser · Last synced ${new Date(account.syncedAt).toLocaleString()}` : "Sync your anime list to get started."}
          </Text>
        </Stack>
      {account && (
        <Stack key={account.syncedAt}>
          {currentPage()}
        </Stack>
      )}
    </Stack>
  );
}

export default App;
