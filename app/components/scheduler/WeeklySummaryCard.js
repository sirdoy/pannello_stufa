'use client';

import { useMemo } from 'react';
import Card from '../ui/Card';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { calculateWeeklyStats } from '@/lib/schedulerStats';

export default function WeeklySummaryCard({ schedule }) {
  const stats = useMemo(() => calculateWeeklyStats(schedule), [schedule]);

  // Format hours with 1 decimal
  const formatHours = (hours) => hours.toFixed(1) + 'h';

  // Calculate power distribution percentages
  const totalPowerHours = Object.values(stats.powerDistribution).reduce((sum, h) => sum + h, 0);
  const powerPercentages = Object.entries(stats.powerDistribution).map(([level, hours]) => ({
    level: parseInt(level),
    hours,
    percentage: totalPowerHours > 0 ? (hours / totalPowerHours) * 100 : 0,
  }));

  return (
    <Card liquid className="p-6">
      <Heading level={2} size="lg" weight="semibold" className="mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Riepilogo Settimanale</span>
      </Heading>

      {/* Main stats */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <Text as="span" variant="secondary">Ore totali</Text>
          <Text as="span" weight="bold" size="lg">
            {formatHours(stats.totalHours)}
          </Text>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Text as="span" variant="secondary">Intervalli</Text>
          <Text as="span" weight="medium">
            {stats.totalIntervals}
          </Text>
        </div>

        {stats.totalHours > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <Text as="span" variant="secondary">Media giornaliera</Text>
              <Text as="span" weight="medium">
                {formatHours(stats.avgPerDay)}
              </Text>
            </div>

            {stats.busiestDay && (
              <div className="flex items-center justify-between text-sm">
                <Text as="span" variant="secondary">Giorno più utilizzato</Text>
                <Text as="span" weight="medium" className="text-primary-600 dark:text-primary-400">
                  {stats.busiestDay} ({formatHours(stats.dailyHours[stats.busiestDay])})
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* Power distribution */}
      {stats.totalHours > 0 && (
        <>
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mb-4">
            <Heading level={3} size="sm" weight="medium" className="text-neutral-700 dark:text-neutral-300 mb-3">
              Distribuzione Potenza
            </Heading>
            <div className="space-y-2">
              {powerPercentages.filter(p => p.hours > 0).map(({ level, hours, percentage }) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-8">
                    ⚡P{level}
                  </span>
                  <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPowerBarClass(level)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 w-16 text-right">
                    {formatHours(hours)} ({Math.round(percentage)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekdays vs Weekend */}
          {(stats.weekdaysTotal > 0 || stats.weekendTotal > 0) && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>🏢</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Settimana</span>
                </div>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {formatHours(stats.weekdaysTotal)} (
                  {Math.round((stats.weekdaysTotal / stats.totalHours) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center gap-2">
                  <span>🏖️</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Weekend</span>
                </div>
                <span className="font-medium text-neutral-900 dark:text-white">
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

function getPowerBarClass(level) {
  const classes = {
    1: 'bg-blue-500 dark:bg-blue-400',
    2: 'bg-green-500 dark:bg-green-400',
    3: 'bg-yellow-500 dark:bg-yellow-400',
    4: 'bg-orange-500 dark:bg-orange-400',
    5: 'bg-red-500 dark:bg-red-400',
  };
  return classes[level] || classes[2];
}
