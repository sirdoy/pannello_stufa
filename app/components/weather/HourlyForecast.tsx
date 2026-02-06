'use client';

/**
 * HourlyForecast Component
 *
 * Displays hourly weather forecast in a horizontal scrollable row.
 * Each card shows time, weather icon, temperature, and precipitation probability.
 *
 * @see ForecastDaySheet - Parent modal that renders this component
 */

import { Text } from '@/app/components/ui';
import WeatherIcon from './WeatherIcon';
import { formatTemperature } from './weatherHelpers';
import { Droplets } from 'lucide-react';

interface HourlyCardProps {
  time: string;
  weatherCode?: number | null;
  temperature: number;
  precipProbability?: number | null;
}

/**
 * HourlyCard - Individual card for one hour
 */
function HourlyCard({ time, weatherCode, temperature, precipProbability }: HourlyCardProps) {
  // Extract just the hour from ISO time string (e.g., "2026-02-03T14:00" -> "14:00")
  const formattedTime = time ? time.split('T')[1]?.substring(0, 5) : '--:--';

  return (
    <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-xl min-w-[70px] [html:not(.dark)_&]:bg-slate-100/80">
      <Text variant="tertiary" size="xs" className="mb-2">
        {formattedTime}
      </Text>
      <WeatherIcon
        code={weatherCode ?? 0}
        size={24}
        className="text-ocean-400 mb-2"
      />
      <Text size="sm" weight="medium">
        {formatTemperature(temperature)}°
      </Text>
      {precipProbability !== null && precipProbability !== undefined && precipProbability > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <Droplets className="w-3 h-3 text-ocean-400" />
          <Text variant="tertiary" size="xs">{precipProbability}%</Text>
        </div>
      )}
    </div>
  );
}

interface HourlyData {
  times: string[];
  temperatures: number[];
  weatherCodes: number[];
  precipProbabilities: number[];
}

export interface HourlyForecastProps {
  /** Hourly data object from API */
  hourly: HourlyData;
  /** Maximum hours to display */
  maxHours?: number;
}

/**
 * HourlyForecast - Horizontal scrollable row of hourly weather cards
 *
 * @example
 * <HourlyForecast
 *   hourly={{
 *     times: ['2026-02-03T14:00', '2026-02-03T15:00', ...],
 *     temperatures: [18, 19, ...],
 *     weatherCodes: [1, 2, ...],
 *     precipProbabilities: [0, 10, ...],
 *   }}
 * />
 */
export function HourlyForecast({ hourly, maxHours = 12 }: HourlyForecastProps) {
  if (!hourly || !hourly.times || hourly.times.length === 0) {
    return null;
  }

  const { times, temperatures, weatherCodes, precipProbabilities } = hourly;

  // Get current hour to filter from now onwards
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0];

  // Find index of current hour (or next available hour)
  let startIndex = times.findIndex((time) => {
    const timeDate = time.split('T')[0];
    const timeHour = parseInt(time.split('T')[1]?.substring(0, 2) ?? '0', 10);
    // Find first hour that's today and >= current hour
    return timeDate === today && timeHour >= currentHour;
  });

  // If no matching hour found for today, show from beginning
  if (startIndex === -1) {
    startIndex = 0;
  }

  // Slice to get remaining hours of today, limited to maxHours
  const endIndex = Math.min(startIndex + maxHours, times.length);
  const displayTimes = times.slice(startIndex, endIndex);
  const displayTemps = temperatures.slice(startIndex, endIndex);
  const displayCodes = weatherCodes.slice(startIndex, endIndex);
  const displayPrecip = precipProbabilities.slice(startIndex, endIndex);

  if (displayTimes.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        {displayTimes.map((time, index) => (
          <HourlyCard
            key={time}
            time={time}
            weatherCode={displayCodes[index]}
            temperature={displayTemps[index]}
            precipProbability={displayPrecip[index]}
          />
        ))}
      </div>
    </div>
  );
}

export default HourlyForecast;
