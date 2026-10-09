'use client';
import { useState, useEffect } from 'react';
import { parseTimelineSlots, DAY_NAMES, formatTimeFromMinutes, ZONE_COLORS, TimelineSlot as ImportedTimelineSlot, NetatmoSchedule } from '@/lib/utils/scheduleHelpers';
import TimelineSlot from './TimelineSlot';
import { Text } from '@/app/components/ui';

interface Schedule {
  timetable?: unknown;
  zones?: Array<{ type: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface WeeklyTimelineProps {
  schedule?: Schedule | null;
  className?: string;
}

/**
 * WeeklyTimeline - 7-day schedule visualization
 */
export default function WeeklyTimeline({ schedule, className = '' }: WeeklyTimelineProps) {
  // Current time indicator position
  const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState<number | null>(null);

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      // Convert to Monday-based day (0=Mon, 6=Sun)
      const jsDay = now.getDay(); // 0=Sun, 1=Mon, ...
      const day = jsDay === 0 ? 6 : jsDay - 1;
      const minutes = now.getHours() * 60 + now.getMinutes();
      const percent = (minutes / 1440) * 100;
      setCurrentDay(day);
      setCurrentTimePercent(percent);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Parse schedule into day-grouped slots
  const slotsByDay = ((): ImportedTimelineSlot[][] => {
    if (!schedule?.timetable || !schedule?.zones) {
      return Array(7).fill([]);
    }

    const allSlots = parseTimelineSlots(schedule as unknown as NetatmoSchedule);

    // Group by day (0-6)
    const grouped: ImportedTimelineSlot[][] = Array(7).fill(null).map(() => []);
    allSlots.forEach(slot => {
      const daySlots = grouped[slot.day];
      if (daySlots) {
        daySlots.push(slot);
      }
    });

    return grouped;
  })();

  // Get unique zones used in the schedule for legend
  const usedZones = (() => {
    if (!schedule?.zones) return [];
    const zoneTypes = new Set<number>();
    schedule.zones.forEach(z => zoneTypes.add(z.type));
    const defaultColor = { bg: 'hsl(0, 0%, 50%)', text: 'hsl(0, 0%, 100%)', name: 'Altro' };
    return Array.from(zoneTypes).map(type => ({
      type,
      ...(ZONE_COLORS[type] || defaultColor)
    }));
  })();

  if (!schedule) {
    return (
      <div className="py-8 text-center">
        <Text variant="secondary">Nessuna programmazione disponibile</Text>
      </div>
    );
  }

  // Grid line positions (every 6 hours: 0%, 25%, 50%, 75%, 100%)
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Zone Legend */}
      {usedZones.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-3">
          {usedZones.map(zone => (
            <div key={zone.type} className="flex items-center gap-1.5">
              <div
                className="size-3 rounded-sm"
                style={{ backgroundColor: zone.bg }}
              />
              <Text variant="secondary" size="xs">{zone.name}</Text>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable timeline container - includes time header */}
      <div className="scrollbar-thin scrollbar-thumb-slate-600 -mx-4 overflow-x-auto px-4 pb-4">
        <div className="min-w-150">
          {/* Time header (inside scrollable area) */}
          <div className="mb-2 flex items-center">
            <div className="w-12 shrink-0" /> {/* Spacer for day labels */}
            <Text as="div" variant="tertiary" size="xs" className="flex flex-1 justify-between px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </Text>
          </div>

          {DAY_NAMES.map((dayName, dayIndex) => (
            <div key={dayName} className="mb-1 flex items-center gap-2">
              {/* Day label */}
              <Text
                variant="secondary"
                size="sm"
               
                className="w-12 shrink-0 text-right"
              >
                {dayName}
              </Text>

              {/* Day slots with grid overlay */}
              <div className="relative flex-1">
                {/* Vertical grid lines */}
                {gridLines.map(pos => (
                  <div
                    key={pos}
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/8"
                    style={{ left: `${pos}%` }}
                  />
                ))}

                {/* Current time indicator */}
                {currentDay === dayIndex && currentTimePercent !== null && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-ember-500"
                    style={{ left: `${currentTimePercent}%` }}
                  >
                    {/* Indicator dot at top */}
                    <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-ember-500" />
                  </div>
                )}

                {/* Slots container */}
                <div className="flex overflow-hidden rounded-lg bg-white/4">
                  {(slotsByDay[dayIndex]?.length ?? 0) > 0 ? (
                    slotsByDay[dayIndex]?.map((slot, slotIndex) => (
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
                    <div className="flex h-12 flex-1 items-center justify-center bg-white/6">
                      <Text variant="tertiary" size="xs">Nessun dato</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint (mobile) */}
      <div className="text-center md:hidden">
        <Text variant="tertiary" size="xs">← Scorri per vedere l&apos;intera giornata →</Text>
      </div>
    </div>
  );
}
