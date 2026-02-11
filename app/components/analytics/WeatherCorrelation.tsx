'use client';

import {
  ComposedChart,
  Bar,
  Line,
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

interface WeatherCorrelationProps {
  data: DailyStats[];
  loading?: boolean;
}

interface ChartDataItem {
  displayDate: string;
  date: string;
  consumptionKg: number;
  usageHours: number;
  avgTemperature?: number;
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
 * WeatherCorrelation Component
 *
 * Visualizes the correlation between pellet consumption and outdoor temperature.
 *
 * Props:
 * - data: Array of DailyStats
 * - loading: boolean
 *
 * Chart:
 * - Bars (left Y-axis): daily pellet consumption (kg)
 * - Line (right Y-axis): average temperature (°C)
 * - X-axis: dates
 * - Dual Y-axes for different scales
 * - Requires weather data from cron
 */
export default function WeatherCorrelation({ data = [], loading = false }: WeatherCorrelationProps) {
  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
        <Text variant="secondary">⏳ Loading chart data...</Text>
      </div>
    );
  }

  // Filter to only days with weather data
  const weatherData = data.filter((stat) => stat.avgTemperature !== undefined);

  if (!weatherData || weatherData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
        <Text variant="tertiary">Weather data unavailable - correlations require weather data from cron</Text>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData: ChartDataItem[] = weatherData.map((stat) => ({
    displayDate: format(parseISO(stat.date), 'MMM dd'),
    date: stat.date,
    consumptionKg: stat.pelletEstimate.totalKg,
    usageHours: stat.totalHours,
    avgTemperature: stat.avgTemperature,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    // Find the full data item
    const dataItem = chartData.find((item) => item.displayDate === label);
    if (!dataItem) return null;

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
              {dataItem.consumptionKg.toFixed(1)} kg
            </Text>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-ocean-500" />
              <Text size="xs" variant="secondary">
                Temperature:
              </Text>
            </div>
            <Text size="xs" className="text-ocean-500">
              {dataItem.avgTemperature?.toFixed(1) ?? 'N/A'}°C
            </Text>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Text size="xs" variant="secondary">
              Usage:
            </Text>
            <Text size="xs">
              {dataItem.usageHours.toFixed(1)}h
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart
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

        {/* Left Y-axis: Pellet consumption */}
        <YAxis
          yAxisId="left"
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

        {/* Right Y-axis: Temperature */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
          label={{
            value: 'Temp (°C)',
            angle: 90,
            position: 'insideRight',
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

        {/* Bars: Pellet consumption */}
        <Bar
          yAxisId="left"
          dataKey="consumptionKg"
          fill="#ed6f10"
          name="Pellet (kg)"
          radius={[4, 4, 0, 0]}
        />

        {/* Line: Temperature */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgTemperature"
          stroke="#437dae"
          strokeWidth={2}
          dot={{ fill: '#437dae', r: 4 }}
          activeDot={{ r: 6 }}
          name="Temperature (°C)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
