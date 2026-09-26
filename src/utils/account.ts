import { AnimeList } from "../interfaces";
import { anilistRequest } from "./anilistRequest";
import { getAnimeList } from "./getAnimeList";

export interface Account {
  id: number;
  name: string;
  lists: AnimeList[];
  syncedAt: number;
}

const PREFIX = "susume-account-v1:";
const pending = new Map<string, Promise<Account>>();

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

export async function loadAccount(token: string, refresh = false): Promise<Account> {
  // Associate the session with an account without copying its credential into the cache.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const sessionKey = `${PREFIX}session:${fingerprint}`;
  const existing = pending.get(fingerprint);
  if (existing) return existing;
  const request = (async () => {
    let identity = read<{ id: number; name: string }>(sessionKey);
    if (!identity || !Number.isInteger(identity.id) || typeof identity.name !== "string") {
      const data = await anilistRequest<{ Viewer: { id: number; name: string } }>(
        "{ Viewer { id name } }", token
      );
      identity = data.Viewer;
    }
    const accountKey = `${PREFIX}${identity.id}`;
    const saved = read<Account>(accountKey);
    if (!refresh && saved?.id === identity.id && Array.isArray(saved.lists) &&
      saved.lists.every((list) => Array.isArray(list.entries)) &&
      typeof saved.name === "string" && Number.isFinite(saved.syncedAt)) {
      localStorage.setItem(sessionKey, JSON.stringify(identity));
      return saved;
    }
    const lists = await getAnimeList(identity.id, token, refresh);
    const account: Account = { ...identity, lists, syncedAt: Date.now() };
    // Commit only successful syncs; retain the previous snapshot on failure.
    localStorage.setItem(accountKey, JSON.stringify(account));
    localStorage.setItem(sessionKey, JSON.stringify(identity));
    return account;
  })().finally(() => pending.delete(fingerprint));
  pending.set(fingerprint, request);
  return request;
}
