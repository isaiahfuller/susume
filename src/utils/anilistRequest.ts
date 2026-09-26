// Keep authenticated responses isolated by token; never persist credentials.
const pending = new Map<string, Promise<unknown>>();
const cache = new Map<string, { expiresAt: number; data: unknown }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

export function anilistRequest<T>(query: string, accessToken = "", refresh = false): Promise<T> {
  const key = JSON.stringify([accessToken, query]);
  const cached = cache.get(key);
  if (!refresh && cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(structuredClone(cached.data) as T);
  }
  cache.delete(key);
  let request = pending.get(key);
  if (!request) {
    request = (async () => {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error(`AniList request failed (${response.status})`);
      const result = await response.json();
      if (result.errors?.length || !result.data) {
        throw new Error(result.errors?.[0]?.message || "AniList returned no data");
      }
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
      }
      cache.set(key, { data: result.data, expiresAt: Date.now() + CACHE_TTL });
      return result.data;
    })().finally(() => pending.delete(key));
    pending.set(key, request);
  }
  // Callers may sort or otherwise mutate results without changing the cache.
  return request.then((data) => structuredClone(data) as T);
}
