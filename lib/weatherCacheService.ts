/**
 * Weather Cache Service
 *
 * Firebase-backed weather cache for persistent storage across server restarts.
 * Used by cron job to fetch and cache weather data every 30 minutes.
 *
 * Usage:
 *   import { getWeatherFromCache, saveWeatherToCache, invalidateWeatherCache } from '@/lib/weatherCacheService';
 *
 *   // Read from cache
 *   const weatherData = await getWeatherFromCache(45.4642, 9.19);
 *
 *   // Save to cache
 *   await saveWeatherToCache(45.4642, 9.19, forecastData);
 *
 *   // Invalidate cache (manual refresh)
 *   await invalidateWeatherCache(45.4642, 9.19);
 */

import { adminDbGet, adminDbSet, adminDbRemove } from './firebaseAdmin.js';
import { getEnvironmentPath } from './environmentHelper.js';

/** Cached weather entry */
export interface CachedWeather {
  data: unknown;
  timestamp: number;
}

/**
 * Generate cache key for weather data
 * Uses 4-decimal precision (~11m accuracy) to balance caching and location accuracy
 */
function getCacheKey(lat: number, lon: number): string {
  const latRounded = lat.toFixed(4);
  const lonRounded = lon.toFixed(4);
  return getEnvironmentPath(`weather/cache/${latRounded},${lonRounded}`);
}

/**
 * Get cached weather data from Firebase
 * Returns null if cache doesn't exist or is invalid
 */
export async function getWeatherFromCache(lat: number, lon: number): Promise<CachedWeather | null> {
  try {
    const cacheKey = getCacheKey(lat, lon);
    const cached = await adminDbGet(cacheKey) as CachedWeather | null;

    if (!cached || !cached.data || !cached.timestamp) {
      return null;
    }

    return cached;
  } catch (error) {
    console.error('[WeatherCacheService] Error reading cache:', error);
    return null;
  }
}

/**
 * Save weather data to Firebase cache
 * Stores data with current timestamp for cache freshness tracking
 */
export async function saveWeatherToCache(lat: number, lon: number, data: unknown): Promise<void> {
  try {
    const cacheKey = getCacheKey(lat, lon);
    await adminDbSet(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    console.log(`✅ Weather cached at: ${cacheKey}`);
  } catch (error) {
    console.error('[WeatherCacheService] Error saving cache:', error);
    throw error;
  }
}

/**
 * Invalidate weather cache for given coordinates
 * Used for manual refresh - removes cache entry to force fresh fetch
 */
export async function invalidateWeatherCache(lat: number, lon: number): Promise<void> {
  try {
    const cacheKey = getCacheKey(lat, lon);
    await adminDbRemove(cacheKey);
    console.log(`🗑️ Weather cache invalidated: ${cacheKey}`);
  } catch (error) {
    console.error('[WeatherCacheService] Error invalidating cache:', error);
    throw error;
  }
}
