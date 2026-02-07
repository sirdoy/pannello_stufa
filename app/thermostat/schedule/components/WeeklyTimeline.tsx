'use client';
import { useMemo, useState, useEffect } from 'react';
import { parseTimelineSlots, DAY_NAMES, formatTimeFromMinutes, ZONE_COLORS } from '@/lib/utils/scheduleHelpers';
import TimelineSlot from './TimelineSlot';
import { Text } from '@/app/components/ui';

interface Schedule {
  timetable?: unknown;
  zones?: Array<{ type: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface TimelineSlot {
  day: number;
  zoneType: number;
  zoneName: string;
  startMinutes: number;
  endMinutes: number;
  durationPercent: number;
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
  const slotsByDay = useMemo((): TimelineSlot[][] => {
    if (!schedule?.timetable || !schedule?.zones) {
      return Array(7).fill([]);
    }

    const allSlots = parseTimelineSlots(schedule) as TimelineSlot[];

    // Group by day (0-6)
    const grouped: TimelineSlot[][] = Array(7).fill(null).map(() => []);
    allSlots.forEach(slot => {
      grouped[slot.day].push(slot);
    });

    return grouped;
  }, [schedule]);

  // Get unique zones used in the schedule for legend
  const usedZones = useMemo(() => {
    if (!schedule?.zones) return [];
    const zoneTypes = new Set<number>();
    schedule.zones.forEach(z => zoneTypes.add(z.type));
    return Array.from(zoneTypes).map(type => ({
      type,
      ...(ZONE_COLORS[type] || ZONE_COLORS.default)
    }));
  }, [schedule]);

  if (!schedule) {
    return (
      <div className="text-center py-8">
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
        <div className="flex flex-wrap gap-3 mb-2">
          {usedZones.map(zone => (
            <div key={zone.type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: zone.bg }}
              />
              <Text variant="secondary" size="xs">{zone.name}</Text>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable timeline container - includes time header */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-600">
        <div className="min-w-[600px]">
          {/* Time header (inside scrollable area) */}
          <div className="flex items-center mb-2">
            <div className="w-12 shrink-0" /> {/* Spacer for day labels */}
            <div className="flex-1 flex justify-between text-xs text-slate-500 px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {DAY_NAMES.map((dayName, dayIndex) => (
            <div key={dayName} className="flex items-center gap-2 mb-1">
              {/* Day label */}
              <Text
                variant="secondary"
                size="sm"
               
                className="w-12 shrink-0 text-right"
              >
                {dayName}
              </Text>

              {/* Day slots with grid overlay */}
              <div className="flex-1 relative">
                {/* Vertical grid lines */}
                {gridLines.map(pos => (
                  <div
                    key={pos}
                    className="absolute top-0 bottom-0 w-px bg-slate-600/30 pointer-events-none z-10"
                    style={{ left: `${pos}%` }}
                  />
                ))}

                {/* Current time indicator */}
                {currentDay === dayIndex && currentTimePercent !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-ember-500 pointer-events-none z-20"
                    style={{ left: `${currentTimePercent}%` }}
                  >
                    {/* Indicator dot at top */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-ember-500" />
                  </div>
                )}

                {/* Slots container */}
                <div className="flex rounded-lg overflow-hidden shadow-inner bg-slate-800/30">
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
