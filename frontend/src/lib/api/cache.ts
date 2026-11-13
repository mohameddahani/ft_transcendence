/**
 * Lightweight in-memory query cache & in-flight promise deduplication
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightPromises = new Map<string, Promise<unknown>>();

export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = 30_000,
  forceRefresh = false
): Promise<T> {
  const now = Date.now();

  // If cached and not expired, return cached value immediately
  if (!forceRefresh) {
    const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
    if (cached && now - cached.timestamp < ttlMs) {
      return cached.data;
    }
  }

  // If a request for this exact key is currently in-flight, return the existing promise
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const data = await fetchFn();
      cacheStore.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of Array.from(cacheStore.keys())) {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
}

