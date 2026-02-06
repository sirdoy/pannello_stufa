/**
 * Weather Cache Utility
 *
 * Implements stale-while-revalidate pattern for weather data.
 * Caches weather forecasts for 15 minutes, returns stale data immediately
 * while triggering background refresh.
 *
 * Usage:
 *   import { getCachedWeather } from '@/lib/weatherCache';
 *   import { fetchWeatherForecast } from '@/lib/openMeteo';
 *
 *   const { data, cachedAt, stale } = await getCachedWeather(lat, lon, fetchWeatherForecast);
 */

/** Weather data generic type */
export type WeatherData = unknown;

/** Cache entry */
interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

/** Cached weather result */
export interface CachedWeatherResult {
  data: WeatherData;
  cachedAt: number;
  stale: boolean;
}

/** Fetch function type */
export type WeatherFetchFn = (lat: number, lon: number) => Promise<WeatherData>;

// In-memory cache (Map for fast lookups)
const cache = new Map<string, WeatherCacheEntry>();

// Cache TTL: 15 minutes in milliseconds
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Get cached weather data with stale-while-revalidate pattern
 *
 * Strategy:
 * - Fresh data (age < 15min): Return cached data immediately
 * - Stale data (age > 15min): Return cached data + trigger background refresh
 * - No cache: Fetch fresh data and cache it
 */
export async function getCachedWeather(lat: number, lon: number, fetchFn: WeatherFetchFn): Promise<CachedWeatherResult> {
  // Build cache key with 4-decimal precision (~11m accuracy)
  const cacheKey = `location:${lat.toFixed(4)},${lon.toFixed(4)}`;

  // Check if cache entry exists
  const cached = cache.get(cacheKey);

  if (cached) {
    // Calculate cache age
    const age = Date.now() - cached.timestamp;
    const isStale = age > CACHE_TTL;

    // If stale, trigger background refresh (fire-and-forget pattern)
    if (isStale) {
      fetchFn(lat, lon)
        .then((fresh) => {
          cache.set(cacheKey, {
            data: fresh,
            timestamp: Date.now(),
          });
        })
        .catch((error) => {
          // Log error but don't block response (fire-and-forget)
          console.error('[WeatherCache] Background refresh failed:', error.message);
        });
    }

    // Return cached data immediately (even if stale)
    return {
      data: cached.data,
      cachedAt: cached.timestamp,
      stale: isStale,
    };
  }

  // No cache - fetch fresh data
  const fresh = await fetchFn(lat, lon);

  // Store in cache
  cache.set(cacheKey, {
    data: fresh,
    timestamp: Date.now(),
  });

  // Return fresh data
  return {
    data: fresh,
    cachedAt: Date.now(),
    stale: false,
  };
}

/**
 * Clear all cached weather data
 * Useful for testing or manual cache invalidation
 */
export function clearWeatherCache(): void {
  cache.clear();
}
