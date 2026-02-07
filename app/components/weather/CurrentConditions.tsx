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
import { Droplets, Wind, Sun, Thermometer, Gauge, Eye, ArrowUp, ArrowDown, Leaf, TrendingUp, TrendingDown, Sunrise, Sunset } from 'lucide-react';
import type { ReactNode } from 'react';
import WeatherIcon, { getWeatherLabel } from './WeatherIcon';
import {
  formatTemperature,
  getTemperatureComparison,
  formatWindSpeed,
  getUVIndexLabel,
  getAirQualityLabel,
  getPressureLabel,
  getTemperatureTrend,
} from './weatherHelpers';

interface WeatherCondition {
  description?: string;
  code?: number;
}

interface CurrentWeather {
  temperature: number;
  feelsLike?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  condition?: WeatherCondition;
  uvIndex?: number | null;
  airQuality?: number | null;
  pressure?: number | null;
  visibility?: number | null;
}

interface TodayForecast {
  tempMax: number;
  tempMin: number;
  uvIndex?: number | null;
  airQuality?: number | null;
  sunrise?: string;
  sunset?: string;
}

interface WeatherDetailCellProps {
  icon: ReactNode;
  iconColor?: string;
  label: string;
  value: string;
  sublabel?: string | null;
}

/**
 * WeatherDetailCell - Individual cell in the weather details grid
 */
function WeatherDetailCell({ icon, iconColor = 'text-ocean-400', label, value, sublabel }: WeatherDetailCellProps) {
  return (
    <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/80">
      <span className={`w-5 h-5 ${iconColor} mb-1.5`}>
        {icon}
      </span>
      <Text variant="tertiary" size="xs" className="mb-0.5">
        {label}
      </Text>
      <Text size="sm">
        {value}
      </Text>
      {sublabel && (
        <Text variant="tertiary" size="xs" className="mt-0.5">
          {sublabel}
        </Text>
      )}
    </div>
  );
}

export interface CurrentConditionsProps {
  /** Current weather data from API */
  current: CurrentWeather;
  /** Today's forecast with min/max/UV */
  todayForecast?: TodayForecast | null;
  /** Array of hourly temperatures for trend calculation */
  hourlyTemperatures?: number[] | null;
  /** Optional indoor temperature for comparison */
  indoorTemp?: number | null;
}

/**
 * CurrentConditions - Current weather display with temperature and details grid
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
 *   todayForecast={{ tempMax: 22.5, tempMin: 12.3, uvIndex: 5 }}
 *   hourlyTemperatures={[15, 16, 17, 18, 19, 20, 21]}
 *   indoorTemp={20.5}
 * />
 */
export function CurrentConditions({ current, todayForecast = null, hourlyTemperatures = null, indoorTemp = null }: CurrentConditionsProps) {
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

  // Calculate temperature trend from hourly data
  const trend = getTemperatureTrend(hourlyTemperatures);

  // Build details array (only include items with data)
  interface WeatherDetail {
    key: string;
    icon: ReactNode;
    iconColor: string;
    label: string;
    value: string;
    sublabel?: string | null;
  }

  const details: WeatherDetail[] = [];

  // Always include humidity, wind, feels like
  if (humidity !== null && humidity !== undefined) {
    details.push({
      key: 'humidity',
      icon: <Droplets className="w-5 h-5" />,
      iconColor: 'text-ocean-400',
      label: 'Umidita',
      value: `${Math.round(humidity)}%`,
    });
  }

  if (windSpeed !== null && windSpeed !== undefined) {
    details.push({
      key: 'wind',
      icon: <Wind className="w-5 h-5" />,
      iconColor: 'text-slate-400',
      label: 'Vento',
      value: formatWindSpeed(windSpeed),
    });
  }

  // UV Index - prefer todayForecast, fallback to current
  const uvIndex = todayForecast?.uvIndex ?? current.uvIndex;
  if (uvIndex !== null && uvIndex !== undefined) {
    const uvLabel = getUVIndexLabel(uvIndex);
    details.push({
      key: 'uv',
      icon: <Sun className="w-5 h-5" />,
      iconColor: 'text-warning-400',
      label: 'UV',
      value: `${Math.round(uvIndex)}`,
      sublabel: uvLabel || null,
    });
  }

  // Air Quality Index - prefer todayForecast, fallback to current
  const airQuality = todayForecast?.airQuality ?? current.airQuality;
  if (airQuality !== null && airQuality !== undefined) {
    const aqiLabel = getAirQualityLabel(airQuality);
    details.push({
      key: 'airQuality',
      icon: <Leaf className="w-5 h-5" />,
      iconColor: 'text-green-400',
      label: 'Aria',
      value: `${Math.round(airQuality)}`,
      sublabel: aqiLabel || null,
    });
  }

  if (feelsLike !== null && feelsLike !== undefined) {
    details.push({
      key: 'feelsLike',
      icon: <Thermometer className="w-5 h-5" />,
      iconColor: 'text-ember-400',
      label: 'Percepita',
      value: `${formatTemperature(feelsLike)}°`,
    });
  }

  // Pressure (if available)
  if (current.pressure !== null && current.pressure !== undefined) {
    const pressureLabel = getPressureLabel(current.pressure);
    details.push({
      key: 'pressure',
      icon: <Gauge className="w-5 h-5" />,
      iconColor: 'text-slate-400',
      label: 'Pressione',
      value: `${Math.round(current.pressure)} hPa`,
      sublabel: pressureLabel || null,
    });
  }

  // Visibility (if available)
  if (current.visibility !== null && current.visibility !== undefined) {
    details.push({
      key: 'visibility',
      icon: <Eye className="w-5 h-5" />,
      iconColor: 'text-slate-400',
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
          <div className="flex items-baseline gap-3 mb-1">
            <Text
              size="xl"
             
              className="leading-none text-4xl"
            >
              {formatTemperature(temperature)}°
            </Text>
            {/* Temperature trend indicator */}
            {trend === 'rising' && (
              <span className="flex items-center" title="In aumento">
                <TrendingUp className="w-4 h-4 text-ember-400" />
              </span>
            )}
            {trend === 'falling' && (
              <span className="flex items-center" title="In diminuzione">
                <TrendingDown className="w-4 h-4 text-ocean-400" />
              </span>
            )}
            {/* Today's min/max */}
            {todayForecast && (
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-0.5 text-ember-400">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatTemperature(todayForecast.tempMax)}°</span>
                </span>
                <span className="flex items-center gap-0.5 text-ocean-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatTemperature(todayForecast.tempMin)}°</span>
                </span>
              </div>
            )}
          </div>
          <Text
            variant="secondary"
            size="base"
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
              iconColor={detail.iconColor}
              label={detail.label}
              value={detail.value}
              sublabel={detail.sublabel}
            />
          ))}
        </div>
      )}

      {/* Sunrise/Sunset row - compact horizontal display */}
      {todayForecast && (todayForecast.sunrise || todayForecast.sunset) && (
        <div className="flex items-center justify-center gap-6 pt-3 mt-3 border-t border-slate-700/20 [html:not(.dark)_&]:border-slate-200/30">
          {todayForecast.sunrise && (
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-warning-400" />
              <Text variant="secondary" size="sm">{todayForecast.sunrise}</Text>
            </div>
          )}
          {todayForecast.sunset && (
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-ember-400" />
              <Text variant="secondary" size="sm">{todayForecast.sunset}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Default export for convenience
export default CurrentConditions;
