import { withCronSecret, success, error } from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { fetchWeatherForecast } from '@/lib/openMeteo';
import { saveWeatherToCache } from '@/lib/weatherCacheService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/weather?secret={CRON_SECRET}
 * Cron job to fetch and cache weather data every 30 minutes
 * Protected: Requires CRON_SECRET in query param or Authorization header
 *
 * Flow:
 * 1. Read location from Firebase (config/location)
 * 2. If location has coordinates, fetch weather from Open-Meteo
 * 3. Save weather data to Firebase cache
 * 4. Return success with timestamp
 *
 * Response:
 * {
 *   success: true,
 *   message: "Weather data cached successfully",
 *   location: { latitude, longitude, name },
 *   timestamp: 1234567890,
 *   cacheKey: "weather/cache/45.4642,9.1900"
 * }
 */
export const GET = withCronSecret(async (request) => {
  try {
    // Read location from Firebase
    const locationPath = getEnvironmentPath('config/location');
    const location = await adminDbGet(locationPath);

    // Validate location exists and has coordinates
    if (!location) {
      return error('Location not configured in Firebase', 'NO_LOCATION', 400);
    }

    if (!location.latitude || !location.longitude) {
      return error('Location missing coordinates', 'INVALID_LOCATION', 400);
    }

    const { latitude, longitude, name } = location;

    console.log(`🌤️ Fetching weather for: ${name || 'Unknown'} (${latitude}, ${longitude})`);

    // Fetch weather forecast from Open-Meteo
    const weatherData = await fetchWeatherForecast(latitude, longitude);

    // Save to Firebase cache
    await saveWeatherToCache(latitude, longitude, weatherData);

    const timestamp = Date.now();
    const cacheKey = getEnvironmentPath(`weather/cache/${latitude.toFixed(4)},${longitude.toFixed(4)}`);

    console.log(`✅ Weather data cached at ${new Date(timestamp).toISOString()}`);

    return success({
      message: 'Weather data cached successfully',
      location: { latitude, longitude, name },
      timestamp,
      cacheKey,
    });
  } catch (err) {
    console.error('[Cron/Weather] Error:', err.message || err);

    // Handle Open-Meteo API errors
    if (err.message && err.message.includes('Open-Meteo API error')) {
      return error('Weather service unavailable', 'WEATHER_API_ERROR', 503);
    }

    // Generic errors
    return error('Failed to cache weather data', 'CACHE_ERROR', 500);
  }
}, 'Cron/Weather');
