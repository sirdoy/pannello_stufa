'use client';
import { tempToColor } from '@/lib/utils/scheduleHelpers';

/**
 * TimelineSlot - Single temperature slot in timeline
 *
 * @param {number} temperature - Target temperature in °C
 * @param {string} startTime - Formatted start time (e.g., "08:00")
 * @param {string} endTime - Formatted end time
 * @param {number} widthPercent - Slot width as percentage of day (0-100)
 * @param {string} zoneName - Name of the temperature zone
 * @param {boolean} showTime - Show time labels (default: false, only on hover/focus)
 */
export default function TimelineSlot({
  temperature,
  startTime,
  endTime,
  widthPercent,
  zoneName,
  showTime = false,
}) {
  const bgColor = tempToColor(temperature);

  // Determine text color based on temperature (dark text for light backgrounds)
  // Hot temps (>20°C) use dark backgrounds, need white text
  // Cold temps (<18°C) use lighter backgrounds, need dark text
  const textColor = temperature >= 19 ? 'text-white' : 'text-slate-900';

  return (
    <div
      className={`
        h-12 flex items-center justify-center
        text-xs font-semibold
        ${textColor}
        transition-all duration-200
        hover:scale-y-110 hover:z-10
        group relative
        min-w-[40px]
      `}
      style={{
        width: `${widthPercent}%`,
        backgroundColor: bgColor,
      }}
      title={`${zoneName}: ${temperature}°C (${startTime}-${endTime})`}
    >
      {/* Always show temperature */}
      <span>{temperature}°</span>

      {/* Time tooltip on hover */}
      <div className="
        absolute -bottom-8 left-1/2 -translate-x-1/2
        bg-slate-900 text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity pointer-events-none
        whitespace-nowrap z-20
        [html:not(.dark)_&]:bg-slate-800
      ">
        {startTime}-{endTime}
      </div>
    </div>
  );
}
