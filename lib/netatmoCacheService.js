/**
 * Netatmo Cache Service
 *
 * Firebase-based cache with TTL for Netatmo API responses.
 * Reduces API calls by 90%+ through smart caching.
 *
 * Pattern follows netatmoTokenHelper.js access_token_cache implementation.
 * Cache entries have timestamp-based validation with 5-minute TTL.
 */

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// ============================================
// CONSTANTS
// ============================================

/**
 * Cache TTL in milliseconds (5 minutes)
 * Balances freshness with API rate limit prevention
 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get cached data or fetch fresh data if cache is invalid
 *
 * @param {string} cacheKey - Cache key identifier (e.g., 'schedule/home_id')
 * @param {Function} fetchFn - Async function to fetch fresh data on cache miss
 * @returns {Promise<{data: any, source: 'cache'|'api', age_seconds?: number}>}
 *
 * @example
 * const result = await getCached('schedule/12345', async () => {
 *   return await fetchScheduleFromNetatmo('12345');
 * });
 *
 * if (result.source === 'cache') {
 *   console.log(`Cache hit (age: ${result.age_seconds}s)`);
 * }
 */
export async function getCached(cacheKey, fetchFn) {
  try {
    // Build environment-aware Firebase path
    const cachePath = getEnvironmentPath(`netatmo/cache/${cacheKey}`);

    // Attempt to read cached data
    const cached = await adminDbGet(cachePath);

    // Validate cache entry
    if (cached && cached.data && cached.cached_at) {
      const age = Date.now() - cached.cached_at;

      // Check if cache is still valid
      if (age < CACHE_TTL_MS) {
        const ageSeconds = Math.floor(age / 1000);
        console.log(`✅ Cache HIT for "${cacheKey}" (age: ${ageSeconds}s)`);

        return {
          data: cached.data,
          source: 'cache',
          age_seconds: ageSeconds,
        };
      }

      console.log(`⏰ Cache EXPIRED for "${cacheKey}" (age: ${Math.floor(age / 1000)}s)`);
    } else {
      console.log(`❌ Cache MISS for "${cacheKey}"`);
    }

    // Cache miss or expired - fetch fresh data
    console.log(`🔄 Fetching fresh data for "${cacheKey}"...`);
    const freshData = await fetchFn();

    // Store in cache with timestamp
    await adminDbSet(cachePath, {
      data: freshData,
      cached_at: Date.now(),
    });

    console.log(`✅ Cache STORED for "${cacheKey}"`);

    return {
      data: freshData,
      source: 'api',
    };

  } catch (error) {
    console.error(`❌ Cache error for "${cacheKey}":`, error);
    throw error;
  }
}

/**
 * Invalidate cache entry
 * Useful for manual cache busting after mutations
 *
 * @param {string} cacheKey - Cache key to invalidate
 * @returns {Promise<boolean>} True if successful
 *
 * @example
 * // After updating schedule via API
 * await invalidateCache('schedule/12345');
 */
export async function invalidateCache(cacheKey) {
  try {
    const cachePath = getEnvironmentPath(`netatmo/cache/${cacheKey}`);

    // Delete cache entry
    await adminDbSet(cachePath, null);

    console.log(`🗑️ Cache INVALIDATED for "${cacheKey}"`);
    return true;

  } catch (error) {
    console.error(`❌ Error invalidating cache for "${cacheKey}":`, error);
    throw error;
  }
}
