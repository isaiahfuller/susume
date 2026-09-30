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
const DB_NAME = "susume-accounts";
const STORE_NAME = "accounts";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAccount(id: number): Promise<Account | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function saveAccount(account: Account): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(account, account.id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function validAccount(saved: Account | null, id: number): saved is Account {
  return saved?.id === id && Array.isArray(saved.lists) &&
    saved.lists.every((list) => Array.isArray(list.entries)) &&
    typeof saved.name === "string" && Number.isFinite(saved.syncedAt);
}

function cacheIdentity(key: string, identity: { id: number; name: string }): void {
  try {
    localStorage.setItem(key, JSON.stringify(identity));
  } catch {
    // A full localStorage must not turn a saved list into a failed sync.
  }
}

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
    let saved = await getAccount(identity.id);
    if (!saved) {
      const legacy = read<Account>(accountKey);
      if (validAccount(legacy, identity.id)) {
        await saveAccount(legacy);
        localStorage.removeItem(accountKey);
        saved = legacy;
      }
    }
    if (!refresh && validAccount(saved, identity.id)) {
      cacheIdentity(sessionKey, identity);
      return saved;
    }
    const lists = await getAnimeList(identity.id, token, refresh);
    const account: Account = { ...identity, lists, syncedAt: Date.now() };
    // Commit only successful syncs; retain the previous snapshot on failure.
    await saveAccount(account);
    localStorage.removeItem(accountKey);
    cacheIdentity(sessionKey, identity);
    return account;
  })().finally(() => pending.delete(fingerprint));
  pending.set(fingerprint, request);
  return request;
}
