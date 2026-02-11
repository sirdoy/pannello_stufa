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
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import Text from '@/app/components/ui/Text';
import type { DailyStats } from '@/types/analytics';

interface ConsumptionChartProps {
  data: DailyStats[];
  loading?: boolean;
}

interface ChartDataItem {
  displayDate: string;
  date: string;
  pelletKg: number;
  costEur: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataItem;
  }>;
  label?: string;
}

/**
 * ConsumptionChart Component
 *
 * Visualizes daily pellet consumption with period summary.
 *
 * Props:
 * - data: Array of DailyStats
 * - loading: boolean
 *
 * Chart:
 * - Bars: daily pellet consumption (kg)
 * - Reference line: daily average
 * - X-axis: dates
 * - Y-axis: pellet kg
 * - Summary: total kg, daily average, estimated cost
 */
export default function ConsumptionChart({ data = [], loading = false }: ConsumptionChartProps) {
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
        <Text variant="tertiary">No consumption data for this period</Text>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData: ChartDataItem[] = data.map((stat) => ({
    displayDate: format(parseISO(stat.date), 'MMM dd'),
    date: stat.date,
    pelletKg: stat.pelletEstimate.totalKg,
    costEur: stat.pelletEstimate.costEstimate,
  }));

  // Calculate period summary
  const totalKg = chartData.reduce((sum, item) => sum + item.pelletKg, 0);
  const totalCost = chartData.reduce((sum, item) => sum + item.costEur, 0);
  const dailyAverage = totalKg / chartData.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-3 shadow-xl">
        <Text size="xs" className="mb-2">
          {label}
        </Text>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-ember-500" />
              <Text size="xs" variant="secondary">
                Pellet:
              </Text>
            </div>
            <Text size="xs" className="text-ember-500">
              {data.pelletKg.toFixed(1)} kg
            </Text>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Text size="xs" variant="secondary">
              Cost:
            </Text>
            <Text size="xs">
              EUR {data.costEur.toFixed(2)}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
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

          {/* Y-axis: Pellet kg */}
          <YAxis
            stroke="currentColor"
            className="opacity-60"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Pellet (kg)',
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

          {/* Daily average reference line */}
          <ReferenceLine
            y={dailyAverage}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Avg',
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12,
            }}
          />

          {/* Bars: Daily pellet consumption */}
          <Bar
            dataKey="pelletKg"
            fill="#ed6f10"
            name="Pellet (kg)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Period summary */}
      <div className="flex gap-6 mt-3">
        <Text variant="secondary" size="xs">
          Total: {totalKg.toFixed(1)} kg
        </Text>
        <Text variant="secondary" size="xs">
          Daily avg: {dailyAverage.toFixed(1)} kg
        </Text>
        <Text variant="secondary" size="xs">
          Est. cost: EUR {totalCost.toFixed(2)}
        </Text>
      </div>
    </>
  );
}
