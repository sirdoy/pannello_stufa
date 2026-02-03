import { withAuthAndErrorHandler, success, badRequest, error } from '@/lib/core';
import { getCachedWeather } from '@/lib/weatherCache';
import { fetchWeatherForecast, interpretWeatherCode } from '@/lib/openMeteo';

export const dynamic = 'force-dynamic';

/**
 * GET /api/weather/forecast?lat=X&lon=Y
 * Retrieves weather forecast for given coordinates
 * Returns current conditions and 5-day forecast with Italian descriptions
 * Protected: Requires Auth0 authentication
 *
 * Query params:
 * - lat: Latitude (-90 to 90)
 * - lon: Longitude (-180 to 180)
 *
 * Response:
 * {
 *   success: true,
 *   current: { temperature, feelsLike, humidity, windSpeed, condition, units },
 *   forecast: [{ date, tempMax, tempMin, condition, weatherCode }, ...],
 *   cachedAt: timestamp,
 *   stale: boolean
 * }
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Validate required parameters
  if (!lat || !lon) {
    return badRequest('Missing or invalid coordinates');
  }

  // Parse and validate latitude/longitude
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return badRequest('Missing or invalid coordinates');
  }

  // Validate ranges
  if (latitude < -90 || latitude > 90) {
    return badRequest('Missing or invalid coordinates');
  }
  if (longitude < -180 || longitude > 180) {
    return badRequest('Missing or invalid coordinates');
  }

  try {
    // Get cached weather data (or fetch fresh)
    const { data, cachedAt, stale } = await getCachedWeather(
      latitude,
      longitude,
      fetchWeatherForecast
    );

    // Enrich current weather with interpreted code
    const currentCondition = interpretWeatherCode(data.current.weather_code);

    // Enrich daily forecast with interpreted codes
    const dailyForecast = data.daily.time.map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      condition: interpretWeatherCode(data.daily.weather_code[i]),
      weatherCode: data.daily.weather_code[i],
    }));

    // Extract hourly temperatures for trend calculation
    const hourlyTemps = data.hourly?.temperature_2m || [];
    const hourlyTimes = data.hourly?.time || [];

    // Return enriched response
    return success({
      current: {
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        condition: currentCondition,
        units: data.current_units,
      },
      forecast: dailyForecast,
      hourly: {
        times: hourlyTimes,
        temperatures: hourlyTemps,
      },
      cachedAt,
      stale,
    });
  } catch (err) {
    // Log error for monitoring
    console.error('[Weather/Forecast]', err.message || err);

    // Handle Open-Meteo API errors
    if (err.message && err.message.includes('Open-Meteo API error')) {
      return error('Weather service unavailable', 'WEATHER_API_ERROR', 503);
    }

    // Generic network/fetch errors
    return error('Weather service unavailable', 'WEATHER_API_ERROR', 503);
  }
}, 'Weather/Forecast');
