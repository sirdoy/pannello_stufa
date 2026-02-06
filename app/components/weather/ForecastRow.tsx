'use client';

/**
 * ForecastRow Component
 *
 * Horizontal scrollable container for 5-day forecast.
 * Apple Weather style with snap points and touch-friendly scrolling.
 *
 * @see ForecastDayCard - Individual day cards rendered in the row
 */

import { ForecastDayCard } from './ForecastDayCard';

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipChance?: number;
  condition?: {
    description?: string;
  };
}

export interface ForecastRowProps {
  /** Array of forecast day objects */
  forecast: ForecastDay[];
  /** Callback when a day is clicked (receives day data) */
  onDayClick?: (day: ForecastDay) => void;
}

/**
 * ForecastRow Component
 *
 * @example
 * <ForecastRow
 *   forecast={weatherData.forecast}
 *   onDayClick={(day) => setSelectedDay(day)}
 * />
 */
export function ForecastRow({ forecast, onDayClick }: ForecastRowProps) {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-5 gap-2"
      role="list"
      aria-label="Previsioni 5 giorni"
    >
      {forecast.slice(0, 5).map((day, index) => (
        <ForecastDayCard
          key={day.date}
          day={day}
          isToday={index === 0}
          onClick={() => onDayClick?.(day)}
        />
      ))}
    </div>
  );
}

export default ForecastRow;
