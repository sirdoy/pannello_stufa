'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import Text from '@/app/components/ui/Text';
import type { DailyStats } from '@/types/analytics';

interface UsageChartProps {
  data: DailyStats[];
  loading?: boolean;
}

interface ChartDataItem {
  displayDate: string;
  date: string;
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

/**
 * UsageChart Component
 *
 * Visualizes daily stove usage hours broken down by power level.
 *
 * Props:
 * - data: Array of DailyStats
 * - loading: boolean
 *
 * Chart:
 * - Stacked bars: hours per power level (1-5)
 * - X-axis: dates
 * - Y-axis: hours
 * - Color scheme: slate → amber → ember → orange → red (low to high heat)
 */
export default function UsageChart({ data = [], loading = false }: UsageChartProps) {
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
        <Text variant="secondary">⏳ Loading chart data...</Text>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
        <Text variant="tertiary">No usage data for this period</Text>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData: ChartDataItem[] = data.map((stat) => ({
    displayDate: format(parseISO(stat.date), 'MMM dd'),
    date: stat.date,
    level1: stat.byPowerLevel[1] || 0,
    level2: stat.byPowerLevel[2] || 0,
    level3: stat.byPowerLevel[3] || 0,
    level4: stat.byPowerLevel[4] || 0,
    level5: stat.byPowerLevel[5] || 0,
    total: stat.totalHours,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const total = payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-3 shadow-xl">
        <Text size="xs" className="mb-2">
          {label}
        </Text>
        <div className="space-y-1.5">
          {payload.map((entry) => (
            entry.value > 0 ? (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <Text size="xs" variant="secondary">
                    {entry.name}:
                  </Text>
                </div>
                <Text size="xs" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)}h
                </Text>
              </div>
            ) : null
          ))}
          <div className="h-px bg-white/10 [html:not(.dark)_&]:bg-black/10 my-1" />
          <div className="flex items-center justify-between gap-4">
            <Text size="xs" variant="secondary">
              Total:
            </Text>
            <Text size="xs">
              {total.toFixed(1)}h
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {/* Grid */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="opacity-10"
        />

        {/* X-axis: Dates */}
        <XAxis
          dataKey="displayDate"
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
        />

        {/* Y-axis: Hours */}
        <YAxis
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
          }}
        />

        {/* Tooltip */}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />

        {/* Legend */}
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />

        {/* Stacked bars by power level */}
        <Bar
          dataKey="level1"
          stackId="power"
          fill="#94a3b8"
          name="Level 1"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="level2"
          stackId="power"
          fill="#f59e0b"
          name="Level 2"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="level3"
          stackId="power"
          fill="#ed6f10"
          name="Level 3"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="level4"
          stackId="power"
          fill="#ea580c"
          name="Level 4"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="level5"
          stackId="power"
          fill="#dc2626"
          name="Level 5"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
