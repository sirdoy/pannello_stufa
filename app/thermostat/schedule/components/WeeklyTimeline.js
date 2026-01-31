'use client';
import { useMemo } from 'react';
import { parseTimelineSlots, DAY_NAMES, formatTimeFromMinutes } from '@/lib/utils/scheduleHelpers';
import TimelineSlot from './TimelineSlot';
import { Text } from '@/app/components/ui';

/**
 * WeeklyTimeline - 7-day schedule visualization
 *
 * @param {Object} schedule - Schedule object with zones and timetable
 * @param {string} className - Additional CSS classes
 */
export default function WeeklyTimeline({ schedule, className = '' }) {
  // Parse schedule into day-grouped slots
  const slotsByDay = useMemo(() => {
    if (!schedule?.timetable || !schedule?.zones) {
      return Array(7).fill([]);
    }

    const allSlots = parseTimelineSlots(schedule);

    // Group by day (0-6)
    const grouped = Array(7).fill(null).map(() => []);
    allSlots.forEach(slot => {
      grouped[slot.day].push(slot);
    });

    return grouped;
  }, [schedule]);

  if (!schedule) {
    return (
      <div className="text-center py-8">
        <Text variant="secondary">Nessuna programmazione disponibile</Text>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Time header (optional - shows hour markers) */}
      <div className="flex items-center">
        <div className="w-12 shrink-0" /> {/* Spacer for day labels */}
        <div className="flex-1 flex justify-between text-xs text-slate-500 px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Scrollable timeline container */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-600">
        <div className="min-w-[600px]">
          {DAY_NAMES.map((dayName, dayIndex) => (
            <div key={dayName} className="flex items-center gap-2 mb-1">
              {/* Day label */}
              <Text
                variant="secondary"
                size="sm"
                weight="medium"
                className="w-12 shrink-0 text-right"
              >
                {dayName}
              </Text>

              {/* Day slots */}
              <div className="flex-1 flex rounded-lg overflow-hidden shadow-inner bg-slate-800/30">
                {slotsByDay[dayIndex].length > 0 ? (
                  slotsByDay[dayIndex].map((slot, slotIndex) => (
                    <TimelineSlot
                      key={`${dayIndex}-${slotIndex}`}
                      zoneType={slot.zoneType}
                      zoneName={slot.zoneName}
                      startTime={formatTimeFromMinutes(slot.startMinutes)}
                      endTime={formatTimeFromMinutes(slot.endMinutes)}
                      widthPercent={slot.durationPercent}
                    />
                  ))
                ) : (
                  <div className="flex-1 h-12 bg-slate-700/50 flex items-center justify-center">
                    <Text variant="tertiary" size="xs">Nessun dato</Text>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint (mobile) */}
      <div className="md:hidden text-center">
        <Text variant="tertiary" size="xs">← Scorri per vedere l'intera giornata →</Text>
      </div>
    </div>
  );
}
