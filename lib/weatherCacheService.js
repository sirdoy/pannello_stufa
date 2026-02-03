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

/**
 * Generate cache key for weather data
 * Uses 4-decimal precision (~11m accuracy) to balance caching and location accuracy
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Cache key in format: {env}/weather/cache/{lat},{lon}
 */
function getCacheKey(lat, lon) {
  const latRounded = lat.toFixed(4);
  const lonRounded = lon.toFixed(4);
  return getEnvironmentPath(`weather/cache/${latRounded},${lonRounded}`);
}

/**
 * Get cached weather data from Firebase
 * Returns null if cache doesn't exist or is invalid
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{ data: object, timestamp: number } | null>} Cached weather data with timestamp
 *
 * @example
 * const cached = await getWeatherFromCache(45.4642, 9.19);
 * if (cached) {
 *   console.log('Cached at:', new Date(cached.timestamp));
 *   console.log('Temperature:', cached.data.current.temperature_2m);
 * }
 */
export async function getWeatherFromCache(lat, lon) {
  try {
    const cacheKey = getCacheKey(lat, lon);
    const cached = await adminDbGet(cacheKey);

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
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {object} data - Weather forecast data from Open-Meteo API
 * @returns {Promise<void>}
 *
 * @example
 * const forecast = await fetchWeatherForecast(45.4642, 9.19);
 * await saveWeatherToCache(45.4642, 9.19, forecast);
 */
export async function saveWeatherToCache(lat, lon, data) {
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
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<void>}
 *
 * @example
 * // User clicked refresh button
 * await invalidateWeatherCache(45.4642, 9.19);
 * // Next request will fetch fresh data
 */
export async function invalidateWeatherCache(lat, lon) {
  try {
    const cacheKey = getCacheKey(lat, lon);
    await adminDbRemove(cacheKey);
    console.log(`🗑️ Weather cache invalidated: ${cacheKey}`);
  } catch (error) {
    console.error('[WeatherCacheService] Error invalidating cache:', error);
    throw error;
  }
}
