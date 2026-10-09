'use client';

import Card from '../ui/Card';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { BarChart3, Briefcase, Palmtree } from 'lucide-react';
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
        <BarChart3 size={18} className="text-(--text-2)" aria-hidden="true" />
        <span>Riepilogo Settimanale</span>
      </Heading>

      {/* Main stats */}
      <div className="mb-6 space-y-3">
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
                <Text as="span" variant="ember">
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
          <div className="mb-4 border-t border-white/8 pt-4">
            <Heading level={3} size="sm" variant="subtle" className="mb-3">
              Distribuzione Potenza
            </Heading>
            <div className="space-y-2">
              {powerPercentages.filter(p => p.hours > 0).map(({ level, hours, percentage }) => (
                <div key={level} className="flex items-center gap-2">
                  <Text as="span" variant="secondary" weight="medium" className="w-8">
                    P{level}
                  </Text>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${getPowerBarClass(level)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <Text as="span" variant="secondary" className="w-16">
                    {formatHours(hours)} ({Math.round(percentage)}%)
                  </Text>
                </div>
              ))}
            </div>
          </div>

          {/* Weekdays vs Weekend */}
          {(stats.weekdaysTotal > 0 || stats.weekendTotal > 0) && (
            <div className="border-t border-white/8 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-(--text-2)" aria-hidden="true" />
                  <Text as="span" variant="secondary" size="sm">Settimana</Text>
                </div>
                <Text as="span" size="sm" weight="medium">
                  {formatHours(stats.weekdaysTotal)} (
                  {Math.round((stats.weekdaysTotal / stats.totalHours) * 100)}%)
                </Text>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Palmtree size={16} className="text-(--text-2)" aria-hidden="true" />
                  <Text as="span" variant="secondary" size="sm">Weekend</Text>
                </div>
                <Text as="span" size="sm" weight="medium">
                  {formatHours(stats.weekendTotal)} (
                  {Math.round((stats.weekendTotal / stats.totalHours) * 100)}%)
                </Text>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {stats.totalHours === 0 && (
        <div className="py-8 text-center">
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
