'use client';

/**
 * CurrentConditions Component
 *
 * Displays current weather conditions with prominent temperature
 * and details grid. Apple Weather widget style layout.
 *
 * @see CONTEXT.md - Large temp + icon prominent, details grid below
 */

import { Text } from '@/app/components/ui';
import { Droplets, Wind, Sun, Thermometer, Gauge, Eye } from 'lucide-react';
import WeatherIcon, { getWeatherLabel } from './WeatherIcon';
import {
  formatTemperature,
  getTemperatureComparison,
  formatWindSpeed,
  getUVIndexLabel,
} from './weatherHelpers';

/**
 * WeatherDetailCell - Individual cell in the weather details grid
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {string} props.label - Detail label
 * @param {string} props.value - Detail value
 */
function WeatherDetailCell({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/80">
      <span className="w-5 h-5 text-ocean-400 mb-1.5">
        {icon}
      </span>
      <Text variant="tertiary" size="xs" className="mb-0.5">
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value}
      </Text>
    </div>
  );
}

/**
 * CurrentConditions - Current weather display with temperature and details grid
 *
 * @param {Object} props
 * @param {Object} props.current - Current weather data from API
 * @param {number} props.current.temperature - Current temperature
 * @param {number} props.current.feelsLike - Feels like temperature
 * @param {number} props.current.humidity - Humidity percentage
 * @param {number} props.current.windSpeed - Wind speed in km/h
 * @param {Object} props.current.condition - Weather condition with description and code
 * @param {Object} [props.current.units] - Unit labels (optional)
 * @param {number|null} props.indoorTemp - Optional indoor temperature for comparison
 *
 * @example
 * <CurrentConditions
 *   current={{
 *     temperature: 18.5,
 *     feelsLike: 17.2,
 *     humidity: 65,
 *     windSpeed: 12,
 *     condition: { description: 'Parzialmente nuvoloso', code: 2 }
 *   }}
 *   indoorTemp={20.5}
 * />
 */
export function CurrentConditions({ current, indoorTemp = null }) {
  if (!current) {
    return null;
  }

  const {
    temperature,
    feelsLike,
    humidity,
    windSpeed,
    condition,
  } = current;

  // Get weather code from condition object
  const weatherCode = condition?.code ?? 0;
  const weatherDescription = condition?.description || getWeatherLabel(weatherCode);

  // Determine if it's night (simple heuristic: check if hour is before 6am or after 8pm)
  // This is a basic implementation - could be improved with sunrise/sunset data
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 20;

  // Temperature comparison text
  const comparisonText = indoorTemp !== null
    ? getTemperatureComparison(temperature, indoorTemp)
    : null;

  // Build details array (only include items with data)
  const details = [];

  // Always include humidity, wind, feels like
  if (humidity !== null && humidity !== undefined) {
    details.push({
      key: 'humidity',
      icon: <Droplets className="w-5 h-5" />,
      label: 'Umidita',
      value: `${Math.round(humidity)}%`,
    });
  }

  if (windSpeed !== null && windSpeed !== undefined) {
    details.push({
      key: 'wind',
      icon: <Wind className="w-5 h-5" />,
      label: 'Vento',
      value: formatWindSpeed(windSpeed),
    });
  }

  // UV Index (if available in current - may not be in Phase 25 API)
  if (current.uvIndex !== null && current.uvIndex !== undefined) {
    const uvLabel = getUVIndexLabel(current.uvIndex);
    details.push({
      key: 'uv',
      icon: <Sun className="w-5 h-5" fill="currentColor" strokeWidth={0} />,
      label: 'UV',
      value: uvLabel ? `${Math.round(current.uvIndex)} - ${uvLabel}` : `${Math.round(current.uvIndex)}`,
    });
  }

  if (feelsLike !== null && feelsLike !== undefined) {
    details.push({
      key: 'feelsLike',
      icon: <Thermometer className="w-5 h-5" />,
      label: 'Percepita',
      value: `${formatTemperature(feelsLike)}°`,
    });
  }

  // Pressure (if available)
  if (current.pressure !== null && current.pressure !== undefined) {
    details.push({
      key: 'pressure',
      icon: <Gauge className="w-5 h-5" />,
      label: 'Pressione',
      value: `${Math.round(current.pressure)} hPa`,
    });
  }

  // Visibility (if available)
  if (current.visibility !== null && current.visibility !== undefined) {
    details.push({
      key: 'visibility',
      icon: <Eye className="w-5 h-5" />,
      label: 'Visibilita',
      value: `${Math.round(current.visibility / 1000)} km`,
    });
  }

  return (
    <div className="space-y-4">
      {/* Main display: large icon + temperature + condition */}
      <div className="flex items-start gap-4">
        {/* Large weather icon */}
        <div className="flex-shrink-0">
          <WeatherIcon
            code={weatherCode}
            isNight={isNight}
            size={64}
            className="text-ocean-400"
          />
        </div>

        {/* Temperature and condition */}
        <div className="flex-1 min-w-0">
          <Text
            size="4xl"
            weight="bold"
            className="leading-none mb-1"
          >
            {formatTemperature(temperature)}°
          </Text>
          <Text
            variant="secondary"
            size="md"
            className="capitalize"
          >
            {weatherDescription}
          </Text>
          {comparisonText && (
            <Text variant="tertiary" size="sm" className="mt-1">
              {comparisonText}
            </Text>
          )}
        </div>
      </div>

      {/* Details grid - responsive columns */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {details.map((detail) => (
            <WeatherDetailCell
              key={detail.key}
              icon={detail.icon}
              label={detail.label}
              value={detail.value}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Default export for convenience
export default CurrentConditions;
