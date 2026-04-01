'use client';

import Card from '../ui/Card';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { calculateWeeklyStats } from '@/lib/scheduler/schedulerStats';
import type { WeeklySchedule } from '@/lib/scheduler/schedulerService';

export interface WeeklySummaryCardProps {
  schedule: WeeklySchedule;
}

export default function WeeklySummaryCard({ schedule }: WeeklySummaryCardProps) {
  const stats = calculateWeeklyStats(schedule);

  // Format hours with 1 decimal
  const formatHours = (hours: number) => hours.toFixed(1) + 'h';

  // Calculate power distribution percentages
  const totalPowerHours = Object.values(stats.powerDistribution).reduce((sum, h) => sum + h, 0);
  const powerPercentages = Object.entries(stats.powerDistribution).map(([level, hours]) => ({
    level: parseInt(level),
    hours,
    percentage: totalPowerHours > 0 ? (hours / totalPowerHours) * 100 : 0,
  }));

  return (
    <Card variant="glass" className="p-6">
      <Heading level={2} size="lg" className="mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Riepilogo Settimanale</span>
      </Heading>

      {/* Main stats */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <Text as="span" variant="secondary">Ore totali</Text>
          <Text as="span" size="lg">
            {formatHours(stats.totalHours)}
          </Text>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Text as="span" variant="secondary">Intervalli</Text>
          <Text as="span">
            {stats.totalIntervals}
          </Text>
        </div>

        {stats.totalHours > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <Text as="span" variant="secondary">Media giornaliera</Text>
              <Text as="span">
                {formatHours(stats.avgPerDay)}
              </Text>
            </div>

            {stats.busiestDay && (
              <div className="flex items-center justify-between text-sm">
                <Text as="span" variant="secondary">Giorno più utilizzato</Text>
                <Text as="span" className="text-primary-400">
                  {stats.busiestDay} ({formatHours(stats.dailyHours[stats.busiestDay]!)})
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* Power distribution */}
      {stats.totalHours > 0 && (
        <>
          <div className="border-neutral-700 pt-4 mb-4">
            <Heading level={3} size="sm" className="text-neutral-300 mb-3">
              Distribuzione Potenza
            </Heading>
            <div className="space-y-2">
              {powerPercentages.filter(p => p.hours > 0).map(({ level, hours, percentage }) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="font-medium text-neutral-400 w-8">
                    ⚡P{level}
                  </span>
                  <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPowerBarClass(level)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-neutral-400 w-16">
                    {formatHours(hours)} ({Math.round(percentage)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekdays vs Weekend */}
          {(stats.weekdaysTotal > 0 || stats.weekendTotal > 0) && (
            <div className="border-neutral-700 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>🏢</span>
                  <span className="text-neutral-400">Settimana</span>
                </div>
                <span className="font-medium text-white">
                  {formatHours(stats.weekdaysTotal)} (
                  {Math.round((stats.weekdaysTotal / stats.totalHours) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center gap-2">
                  <span>🏖️</span>
                  <span className="text-neutral-400">Weekend</span>
                </div>
                <span className="font-medium text-white">
                  {formatHours(stats.weekendTotal)} (
                  {Math.round((stats.weekendTotal / stats.totalHours) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {stats.totalHours === 0 && (
        <div className="text-center py-8">
          <Text variant="tertiary" size="sm">Nessun intervallo configurato</Text>
        </div>
      )}
    </Card>
  );
}

function getPowerBarClass(level: number): string {
  const classes: Record<number, string> = {
    1: 'bg-blue-400',
    2: 'bg-green-400',
    3: 'bg-yellow-400',
    4: 'bg-orange-400',
    5: 'bg-red-400',
  };
  return classes[level] || classes[2]!;
}
