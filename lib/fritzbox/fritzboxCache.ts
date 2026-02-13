/**
 * Fritz!Box Cache Layer
 *
 * Generic cache-aside pattern using Firebase RTDB
 * - 60-second TTL (balances freshness vs rate limit)
 * - Automatic cache invalidation on expiry
 * - Environment-aware paths (dev/ prefix in development)
 */

import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/** Cache TTL in milliseconds (60 seconds) */
export const CACHE_TTL_MS = 60 * 1000;

/**
 * Cache structure in Firebase RTDB
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data with automatic fetch on miss/expiry
 * Cache-aside pattern: check cache first, fetch and store on miss
 *
 * @param cacheKey - Unique cache key (will be prefixed with 'fritzbox/cache/')
 * @param fetchFn - Function to fetch fresh data when cache miss/expired
 * @returns Cached or freshly fetched data
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const path = getEnvironmentPath(`fritzbox/cache/${cacheKey}`);
  const now = Date.now();

  // Try to get cached data
  const cached = (await adminDbGet(path)) as CacheEntry<T> | null;

  // Cache hit - check TTL
  if (cached && cached.data !== undefined && cached.timestamp) {
    const age = now - cached.timestamp;
    if (age < CACHE_TTL_MS) {
      // Cache valid - return cached data
      return cached.data;
    }
  }

  // Cache miss or expired - fetch fresh data
  const freshData = await fetchFn();

  // Store in cache with timestamp
  const cacheEntry: CacheEntry<T> = {
    data: freshData,
    timestamp: now,
  };

  await adminDbSet(path, cacheEntry);

  return freshData;
}

/**
 * Invalidate cache for a specific key
 * Useful for manual cache clearing (e.g., user-triggered refresh)
 *
 * @param cacheKey - Cache key to invalidate
 */
export async function invalidateCache(cacheKey: string): Promise<void> {
  const path = getEnvironmentPath(`fritzbox/cache/${cacheKey}`);
  await adminDbRemove(path);
}
