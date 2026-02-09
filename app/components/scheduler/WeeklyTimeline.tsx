'use client';

import { getDayTotalHours, getPowerGradient } from '@/lib/schedulerStats';
import Button from '../ui/Button';
import type { WeeklySchedule } from '@/lib/schedulerService';

const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const dayShortNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export interface WeeklyTimelineProps {
  schedule: WeeklySchedule;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export default function WeeklyTimeline({ schedule, selectedDay, onSelectDay }: WeeklyTimelineProps) {
  return (
    <div className="space-y-2">
      {daysOfWeek.map((day, dayIndex) => {
        const intervals = schedule[day] || [];
        const totalHours = getDayTotalHours(intervals);
        const isSelected = selectedDay === day;
        const hasIntervals = intervals.length > 0;

        return (
          <div
            key={day}
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              ${isSelected
                ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400 dark:ring-primary-500'
                : 'bg-neutral-50 dark:bg-white/[0.03] hover:bg-neutral-100 dark:hover:bg-white/[0.05]'
              }
            `}
          >
            {/* Day name */}
            <div className="w-12 flex-shrink-0">
              <span className={`
                text-sm font-medium
                ${isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-neutral-700 dark:text-neutral-300'
                }
              `}>
                {dayShortNames[dayIndex]}
              </span>
            </div>

            {/* Timeline bar (24h) */}
            <div className="flex-1 relative">
              <div className="h-8 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden relative">
                {/* Reference grid lines */}
                {[0, 6, 12, 18, 24].map(hour => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 w-px bg-neutral-300 dark:bg-neutral-600"
                    style={{ left: `${(hour / 24) * 100}%` }}
                  />
                ))}

                {/* Interval bars */}
                {intervals.map((interval, idx) => {
                  const [startH, startM] = interval.start.split(':').map(Number);
                  const [endH, endM] = interval.end.split(':').map(Number);
                  const startMinutes = startH * 60 + startM;
                  const endMinutes = endH * 60 + endM;
                  const totalMinutes = 24 * 60;

                  const left = (startMinutes / totalMinutes) * 100;
                  const width = ((endMinutes - startMinutes) / totalMinutes) * 100;

                  return (
                    <div
                      key={idx}
                      role="img"
                      aria-label={`Intervallo ${interval.start} - ${interval.end}, potenza ${interval.power}, ventola ${interval.fan}`}
                      className="absolute top-0 bottom-0 transition-all duration-200 hover:opacity-90"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: getPowerGradient(interval.power),
                      }}
                      title={`${interval.start} - ${interval.end} | ⚡P${interval.power} 💨V${interval.fan}`}
                    />
                  );
                })}

                {/* Empty state overlay */}
                {!hasIntervals && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      Nessun intervallo
                    </span>
                  </div>
                )}
              </div>

              {/* Time labels (optional, show on hover) */}
              <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>24h</span>
              </div>
            </div>

            {/* Total hours badge */}
            <div className="w-16 flex-shrink-0 text-right">
              <span className={`
                text-sm font-medium
                ${hasIntervals
                  ? 'text-neutral-700 dark:text-neutral-300'
                  : 'text-neutral-400 dark:text-neutral-600'
                }
              `}>
                {totalHours.toFixed(1)}h
              </span>
            </div>

            {/* Select button */}
            <div className="w-20 flex-shrink-0">
              <Button
                size="sm"
                variant={isSelected ? 'ember' : 'ghost'}
                onClick={() => onSelectDay(day)}
                className="w-full"
              >
                {isSelected ? 'Attivo' : 'Modifica'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
