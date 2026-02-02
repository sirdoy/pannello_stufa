'use client';

/**
 * ForecastDayCard Component
 *
 * Individual forecast day card for the horizontal scroll row.
 * Shows day name, weather icon, high/low temperatures, and precipitation.
 *
 * @see ForecastRow - Parent component that renders multiple cards
 */

import { cn } from '@/lib/utils/cn';
import { Text } from '@/app/components/ui';
import { WeatherIcon } from './WeatherIcon';
import { formatTemperature } from './weatherHelpers';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Droplets } from 'lucide-react';

/**
 * Format day name with capitalized first letter
 * @param {string} dateStr - ISO date string
 * @param {boolean} isToday - Show "Oggi" instead of day name
 * @returns {string} Formatted day name (e.g., "Lun", "Oggi")
 */
function formatDayName(dateStr, isToday) {
  if (isToday) {
    return 'Oggi';
  }
  const dayName = format(parseISO(dateStr), 'EEE', { locale: it });
  // Capitalize first letter: "lun" -> "Lun"
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
}

/**
 * ForecastDayCard Component
 *
 * @param {Object} props
 * @param {Object} props.day - Forecast day data
 * @param {string} props.day.date - ISO date string (e.g., "2026-02-03")
 * @param {number} props.day.tempMax - Maximum temperature
 * @param {number} props.day.tempMin - Minimum temperature
 * @param {Object} props.day.condition - Weather condition { description, icon }
 * @param {number} [props.day.precipChance] - Precipitation probability (0-100)
 * @param {number} props.day.weatherCode - WMO weather code for icon
 * @param {boolean} [props.isToday=false] - Show "Oggi" instead of day name
 * @param {Function} [props.onClick] - Callback when card is tapped
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <ForecastDayCard
 *   day={{ date: '2026-02-03', tempMax: 12, tempMin: 5, weatherCode: 2, precipChance: 30 }}
 *   isToday={false}
 *   onClick={() => handleDayClick(day)}
 * />
 */
export function ForecastDayCard({
  day,
  isToday = false,
  onClick,
  className,
}) {
  const dayName = formatDayName(day.date, isToday);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center p-3 rounded-xl cursor-pointer',
        'bg-slate-800/40 hover:bg-slate-800/60',
        '[html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:hover:bg-slate-200/80',
        'transition-colors duration-200',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Previsioni per ${dayName}: massima ${formatTemperature(day.tempMax)} gradi, minima ${formatTemperature(day.tempMin)} gradi`}
    >
      {/* Day name */}
      <Text
        variant="secondary"
        size="sm"
        weight="medium"
        className="mb-2"
      >
        {dayName}
      </Text>

      {/* Weather icon */}
      <WeatherIcon
        code={day.weatherCode}
        size={32}
        className="text-ocean-400 mb-2"
      />

      {/* High temperature */}
      <Text
        variant="body"
        size="lg"
        weight="bold"
        className="text-ember-400 leading-tight"
      >
        {formatTemperature(day.tempMax)}°
      </Text>

      {/* Low temperature */}
      <Text
        variant="tertiary"
        size="sm"
        className="leading-tight"
      >
        {formatTemperature(day.tempMin)}°
      </Text>

      {/* Precipitation chance - only show if > 10% */}
      {day.precipChance > 10 && (
        <div className="flex items-center gap-0.5 text-ocean-400 mt-1">
          <Droplets className="w-3 h-3" />
          <Text size="xs" className="text-ocean-400">
            {day.precipChance}%
          </Text>
        </div>
      )}
    </div>
  );
}

export default ForecastDayCard;
