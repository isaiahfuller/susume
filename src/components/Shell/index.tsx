import {
  AppShell,
  Alert,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import App from "../../App";
import { Account, loadAccount } from "../../utils/account";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import {
  faChartSimple,
  faChevronRight,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

const pages = [
  { title: "Airing", icon: faCalendar },
  { title: "Recommendations", icon: faThumbsUp },
  { title: "Charts", icon: faChartSimple },
];

export default function Shell() {
  const [page, setPage] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("anilist-token") || ""
  );
  const [opened, { toggle }] = useDisclosure();
  const { ref: headerRef, height: headerHeight } = useElementSize();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncRevision, setSyncRevision] = useState(0);

  useEffect(() => {
    if (!loggedIn || !accessToken) return;
    let active = true;
    setLoading(true);
    setError("");
    loadAccount(accessToken, syncRevision > 0)
      .then((saved) => { if (active) setAccount(saved); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to sync your account.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loggedIn, accessToken, syncRevision]);

  function logOut() {
    setAccount(null);
    setError("");
    setLoading(true);
    setSyncRevision(0);
    setLoggedIn(false);
    setAccessToken("");
    localStorage.setItem("anilist-token", "");
    localStorage.setItem("anilist-expires", "");
  }

  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get("access_token");
    const expiresIn = Number(params.get("expires_in"));
    if (token && Number.isFinite(expiresIn) && expiresIn > 0) {
      localStorage.setItem("anilist-token", token);
      localStorage.setItem("anilist-expires", new Date(Date.now() + expiresIn * 1000).toISOString());
      setAccessToken(token);
      window.history.replaceState(null, "", location.pathname + location.search);
    }
    const tokenTime = localStorage.getItem("anilist-expires");
    if (tokenTime && new Date(tokenTime) > new Date()) {
      setLoggedIn(true);
    } else setLoggedIn(false);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, idx: number) {
    e.preventDefault();
    setPage(idx);
  }

  return (
    <AppShell
      header={{ height: headerHeight || 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      withBorder={false}
    >
      <AppShell.Header>
        <Stack ref={headerRef} gap={0}>
        <Group justify="space-between" align="center" px={8} py={8} mih={60}>
          <Group align="center">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Stack align="center" p={24}>
              <Title size="h4" lh={0.1}>
                勧め
              </Title>
              <Text lh={0} size="sm" c="dimmed">
                susume
              </Text>
            </Stack>
          </Group>
          
          {error && (
            <Alert color="red" mx={8} py={8} role="alert">
              <Text c="red" span><FontAwesomeIcon icon={faExclamationTriangle} /> </Text>{error} {account && "Your previously saved list is still available."}
            </Alert>
          )}

          <Group gap="xs">
            {loggedIn && (
              <Button loading={loading} onClick={() => setSyncRevision((revision) => revision + 1)}>
                Sync with AniList
              </Button>
            )}
            {loggedIn ? (
              <Button variant="subtle" onClick={() => logOut()}>
                Log Out
              </Button>
            ) : (
              <a href="https://anilist.co/api/v2/oauth/authorize?client_id=10680&response_type=token">
                <Button>Login with AniList</Button>
              </a>
            )}
          </Group>
        </Group>
        </Stack>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={0} style={{ height: "100%" }} justify="space-between">
          <div />
          <Stack>
            {pages.map((e, i) => (
              <NavLink
                href="#"
                label={e.title}
                key={i}
                onClick={(e) => handleClick(e, i)}
                leftSection={<FontAwesomeIcon icon={e.icon} />}
                rightSection={<FontAwesomeIcon icon={faChevronRight} size="xs" />}
              />
            ))}
          </Stack>
          <div />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <App key={`${loggedIn}:${accessToken}`} loggedIn={loggedIn} accessToken={accessToken} page={page} account={account} loading={loading} />
      </AppShell.Main>
    </AppShell>
  );
}
