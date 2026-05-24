// In-isolate TTL cache. Workers keeps the isolate warm across requests, so
// values memoised here serve subsequent requests with zero D1 round-trips.
// Isolate restarts (cold starts) repopulate on next access — no persistence
// across edge nodes, which is fine for the short TTLs we use here.
const _cache = new Map();

export async function memoTTL(key, ttlMs, fetcher) {
  const now = Date.now();
  const hit = _cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;
  const value = await fetcher();
  _cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateMemo(prefix) {
  if (!prefix) { _cache.clear(); return; }
  for (const k of _cache.keys()) if (k.startsWith(prefix)) _cache.delete(k);
}
