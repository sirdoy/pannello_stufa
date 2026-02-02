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

/**
 * ForecastRow Component
 *
 * @param {Object} props
 * @param {Array} props.forecast - Array of forecast day objects
 * @param {Function} [props.onDayClick] - Callback when a day is clicked (receives day data)
 *
 * @example
 * <ForecastRow
 *   forecast={weatherData.forecast}
 *   onDayClick={(day) => setSelectedDay(day)}
 * />
 */
export function ForecastRow({ forecast, onDayClick }) {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Fade gradient indicator on right - shows more content available */}
      <div
        className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10 [html:not(.dark)_&]:from-white"
        aria-hidden="true"
      />

      {/* Scrollable row */}
      <div
        className="
          flex gap-3
          overflow-x-auto
          pb-2
          scrollbar-hide
          snap-x snap-mandatory
          [-webkit-overflow-scrolling:touch]
        "
        role="list"
        aria-label="Previsioni 5 giorni"
      >
        {forecast.map((day, index) => (
          <ForecastDayCard
            key={day.date}
            day={day}
            isToday={index === 0}
            onClick={() => onDayClick?.(day)}
            className="flex-shrink-0 w-20 snap-start"
          />
        ))}
      </div>
    </div>
  );
}

export default ForecastRow;
