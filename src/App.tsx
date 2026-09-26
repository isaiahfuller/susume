import { Center, Loader, Stack, Text } from "@mantine/core";
import List from "./components/List";
import { useEffect, useMemo, useState } from "react";
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
  const [visited, setVisited] = useState<number[]>([page]);
  const summary = useMemo(() => summarizeList(account?.lists || []), [account]);

  useEffect(() => {
    setVisited((pages) => pages.includes(page) ? pages : [...pages, page]);
  }, [page]);

  if (!loggedIn) return <Text>Sign in with AniList to save your anime list in this browser.</Text>;
  if (!account && loading) return <Center><Loader /></Center>;

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
          {visited.includes(0) && <div hidden={page !== 0}><Airing tags={summary.tags} animeList={account.lists} /></div>}
          {visited.includes(1) && <div hidden={page !== 1}><List accessToken={accessToken} animeList={account.lists} tagList={summary.tags} /></div>}
          {visited.includes(2) && <div hidden={page !== 2}><Charts animeList={account.lists} tagList={summary.tags} /></div>}
        </Stack>
      )}
    </Stack>
  );
}

export default App;
