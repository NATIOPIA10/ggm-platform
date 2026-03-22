// Simple in-memory cache with TTL
const cache = new Map()

export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

export function setCached(key, data, ttlMs = 30_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

export function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export function clearCache() {
  cache.clear()
}
