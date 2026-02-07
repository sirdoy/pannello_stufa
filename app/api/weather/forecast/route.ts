import { withAuthAndErrorHandler, success, badRequest, error, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { getCachedWeather } from '@/lib/weatherCache';
import { fetchWeatherForecast, fetchAirQuality, interpretWeatherCode } from '@/lib/openMeteo';

export const dynamic = 'force-dynamic';

/**
 * Helper function to format time from ISO string to HH:MM
 */
function formatTime(isoString: string | undefined): string | null {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

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
 *   current: { temperature, feelsLike, humidity, windSpeed, pressure, condition, airQuality, units },
 *   forecast: [{ date, tempMax, tempMin, condition, weatherCode, uvIndex, precipChance, humidity, windSpeed, sunrise, sunset }, ...],
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
    // Fetch weather and air quality in parallel
    const [weatherResult, airQualityResult] = await Promise.all([
      getCachedWeather(latitude, longitude, fetchWeatherForecast),
      fetchAirQuality(latitude, longitude).catch((err) => {
        // Air quality is optional - log error but don't fail
        console.warn('[Weather/Forecast] Air quality fetch failed:', err.message);
        return null;
      }),
    ]);

    const { data, cachedAt, stale } = weatherResult as any;

    // Enrich current weather with interpreted code
    const currentCondition = interpretWeatherCode(data.current.weather_code);

    // Extract air quality value
    const airQuality = (airQualityResult as any)?.current?.european_aqi ?? null;

    // Enrich daily forecast with interpreted codes and extended data
    const dailyForecast = data.daily.time.map((date: string, i: number) => {
      const code = data.daily.weather_code[i];
      return {
        date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        condition: {
          ...interpretWeatherCode(code),
          code,
        },
        weatherCode: code, // Keep for backwards compatibility
        uvIndex: data.daily.uv_index_max?.[i] ?? null,
        precipChance: data.daily.precipitation_probability_max?.[i] ?? null,
        humidity: data.daily.relative_humidity_2m_max?.[i] ?? null,
        windSpeed: data.daily.wind_speed_10m_max?.[i] ?? null,
        sunrise: formatTime(data.daily.sunrise?.[i]),
        sunset: formatTime(data.daily.sunset?.[i]),
        airQuality: i === 0 ? airQuality : null, // Only today has AQI data
      };
    });

    // Extract hourly data for trend calculation and detailed forecast
    const hourlyTimes = data.hourly?.time || [];
    const hourlyTemps = data.hourly?.temperature_2m || [];
    const hourlyWeatherCodes = data.hourly?.weather_code || [];
    const hourlyPrecipProbs = data.hourly?.precipitation_probability || [];
    const hourlyWindSpeeds = data.hourly?.wind_speed_10m || [];

    // Return enriched response
    return success({
      current: {
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        pressure: data.current.surface_pressure ?? null,
        condition: {
          ...currentCondition,
          code: data.current.weather_code,
        },
        airQuality,
        units: data.current_units,
      },
      forecast: dailyForecast,
      hourly: {
        times: hourlyTimes,
        temperatures: hourlyTemps,
        weatherCodes: hourlyWeatherCodes,
        precipProbabilities: hourlyPrecipProbs,
        windSpeeds: hourlyWindSpeeds,
      },
      cachedAt,
      stale,
    });
  } catch (err) {
    // Log error for monitoring
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Weather/Forecast]', errorMessage);

    // Handle Open-Meteo API errors
    if (errorMessage.includes('Open-Meteo API error')) {
      return error('Weather service unavailable', ERROR_CODES.WEATHER_API_ERROR, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    // Generic network/fetch errors
    return error('Weather service unavailable', 'WEATHER_API_ERROR', 503);
  }
}, 'Weather/Forecast');
