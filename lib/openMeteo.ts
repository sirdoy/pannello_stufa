/**
 * Open-Meteo API Wrapper
 *
 * Provides weather forecast fetching and WMO weather code interpretation.
 * Free API, no authentication required.
 *
 * Usage:
 *   import { fetchWeatherForecast, interpretWeatherCode } from '@/lib/openMeteo';
 *
 * @see https://open-meteo.com/en/docs
 */

/** WMO weather condition with icon code */
interface WeatherCondition {
  description: string;
  icon: string;
}

/** Current weather data */
interface CurrentWeather {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
  surface_pressure: number;
}

/** Daily weather forecast data */
interface DailyWeather {
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
  relative_humidity_2m_max: number[];
  wind_speed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
}

/** Hourly weather forecast data */
interface HourlyWeather {
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
}

/** Complete weather forecast response */
export interface WeatherForecast {
  current: CurrentWeather;
  daily: DailyWeather;
  hourly: HourlyWeather;
  timezone: string;
  latitude: number;
  longitude: number;
}

/** Air quality data */
interface CurrentAirQuality {
  european_aqi: number;
}

/** Air quality response */
export interface AirQualityData {
  current: CurrentAirQuality;
  timezone: string;
  latitude: number;
  longitude: number;
}

/**
 * WMO Weather Code Mapping (Italian descriptions)
 * Maps WMO codes (0-99) to human-readable conditions and icon codes
 *
 * Icon codes follow standard weather icon naming:
 * 01 = clear sky, 02 = few clouds, 03 = scattered clouds, 04 = broken clouds
 * 09 = shower rain, 10 = rain, 11 = thunderstorm, 13 = snow, 50 = mist
 */
export const WMO_CODES: Record<number, WeatherCondition> = {
  0: { description: 'Sereno', icon: '01' },
  1: { description: 'Prevalentemente sereno', icon: '02' },
  2: { description: 'Parzialmente nuvoloso', icon: '03' },
  3: { description: 'Coperto', icon: '04' },
  45: { description: 'Nebbia', icon: '50' },
  48: { description: 'Nebbia con brina', icon: '50' },
  51: { description: 'Pioviggine leggera', icon: '09' },
  53: { description: 'Pioviggine moderata', icon: '09' },
  55: { description: 'Pioviggine intensa', icon: '09' },
  56: { description: 'Pioviggine gelata leggera', icon: '09' },
  57: { description: 'Pioviggine gelata intensa', icon: '09' },
  61: { description: 'Pioggia leggera', icon: '10' },
  63: { description: 'Pioggia moderata', icon: '10' },
  65: { description: 'Pioggia intensa', icon: '10' },
  66: { description: 'Pioggia gelata leggera', icon: '10' },
  67: { description: 'Pioggia gelata intensa', icon: '10' },
  71: { description: 'Neve leggera', icon: '13' },
  73: { description: 'Neve moderata', icon: '13' },
  75: { description: 'Neve intensa', icon: '13' },
  77: { description: 'Granuli di neve', icon: '13' },
  80: { description: 'Rovesci leggeri', icon: '09' },
  81: { description: 'Rovesci moderati', icon: '09' },
  82: { description: 'Rovesci violenti', icon: '09' },
  85: { description: 'Rovesci di neve leggeri', icon: '13' },
  86: { description: 'Rovesci di neve intensi', icon: '13' },
  95: { description: 'Temporale', icon: '11' },
  96: { description: 'Temporale con grandine leggera', icon: '11' },
  99: { description: 'Temporale con grandine intensa', icon: '11' },
};

/**
 * Interpret WMO weather code to human-readable description and icon
 *
 * @example
 * interpretWeatherCode(0) // { description: 'Sereno', icon: '01' }
 * interpretWeatherCode(95) // { description: 'Temporale', icon: '11' }
 * interpretWeatherCode(999) // { description: 'Sconosciuto', icon: '01' }
 */
export function interpretWeatherCode(code: number): WeatherCondition {
  return WMO_CODES[code] || { description: 'Sconosciuto', icon: '01' };
}

/**
 * Fetch weather forecast from Open-Meteo API
 *
 * @example
 * const forecast = await fetchWeatherForecast(45.4642, 9.19);
 * console.log(forecast.current.temperature_2m); // Current temperature
 * console.log(forecast.daily.temperature_2m_max); // Array of max temps for 5 days
 */
export async function fetchWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
  // Round coordinates to 4 decimals (~11m precision)
  const lat = latitude.toFixed(4);
  const lon = longitude.toFixed(4);

  // Build URL with URLSearchParams for proper encoding
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,relative_humidity_2m_max,wind_speed_10m_max,sunrise,sunset',
    hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m',
    forecast_days: '5',
    timezone: 'auto', // CRITICAL: always include for correct local times
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  // Fetch from Open-Meteo API
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<WeatherForecast>;
}

/**
 * Fetch air quality data from Open-Meteo Air Quality API
 *
 * @example
 * const airQuality = await fetchAirQuality(45.4642, 9.19);
 * console.log(airQuality.current.european_aqi); // Current European AQI
 */
export async function fetchAirQuality(latitude: number, longitude: number): Promise<AirQualityData> {
  // Round coordinates to 4 decimals (~11m precision)
  const lat = latitude.toFixed(4);
  const lon = longitude.toFixed(4);

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'european_aqi',
    timezone: 'auto',
  });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo Air Quality API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<AirQualityData>;
}
