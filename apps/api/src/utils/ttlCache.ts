type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();

export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = await loader();
  cacheStore.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
  return value;
}

export function invalidateCache(prefix: string) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

// Limpeza periódica do cache em memória para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref(); // Roda a cada 5 minutos
