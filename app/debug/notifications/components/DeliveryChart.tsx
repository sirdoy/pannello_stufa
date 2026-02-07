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

interface DailyDataItem {
  date: string;
  total: number;
  sent: number;
  failed: number;
  deliveryRate: number;
}

interface DeliveryChartProps {
  data?: DailyDataItem[];
  loading?: boolean;
}

interface ChartDataItem extends Omit<DailyDataItem, 'deliveryRate'> {
  displayDate: string;
  deliveryRate: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyDataItem;
  }>;
}

/**
 * DeliveryChart Component
 *
 * Visualizes notification delivery trends using Recharts.
 *
 * Props:
 * - data: Array of { date, total, sent, failed, deliveryRate }
 * - loading: boolean
 *
 * Chart:
 * - Stacked bars: sent (green) + failed (red)
 * - Line: delivery rate percentage
 * - X-axis: dates
 * - Left Y-axis: notification count
 * - Right Y-axis: delivery rate (0-100%)
 */
export default function DeliveryChart({ data = [], loading = false }: DeliveryChartProps) {
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
        <Text variant="tertiary">No data for this period</Text>
      </div>
    );
  }

  // Format data for Recharts
  const chartData: ChartDataItem[] = data.map((item) => ({
    ...item,
    // Format date for X-axis display
    displayDate: format(parseISO(item.date), 'MMM dd'),
    // Round delivery rate for cleaner display
    deliveryRate: parseFloat(item.deliveryRate.toFixed(1)),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-3 shadow-xl">
        <Text size="xs" weight="semibold" className="mb-2">
          {format(parseISO(data.date), 'MMMM dd, yyyy')}
        </Text>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <Text size="xs" variant="secondary">
              Total:
            </Text>
            <Text size="xs" weight="medium">
              {data.total}
            </Text>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sage-500" />
              <Text size="xs" variant="secondary">
                Sent:
              </Text>
            </div>
            <Text size="xs" weight="medium" className="text-sage-500">
              {data.sent}
            </Text>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-ember-500" />
              <Text size="xs" variant="secondary">
                Failed:
              </Text>
            </div>
            <Text size="xs" weight="medium" className="text-ember-500">
              {data.failed}
            </Text>
          </div>
          <div className="h-px bg-white/10 [html:not(.dark)_&]:bg-black/10 my-1" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-ocean-500" />
              <Text size="xs" variant="secondary">
                Rate:
              </Text>
            </div>
            <Text size="xs" weight="semibold" className="text-ocean-500">
              {data.deliveryRate}%
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
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

        {/* Left Y-axis: Notification count */}
        <YAxis
          yAxisId="left"
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
          label={{
            value: 'Notifications',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
          }}
        />

        {/* Right Y-axis: Delivery rate percentage */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
          domain={[0, 100]}
          label={{
            value: 'Rate %',
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

        {/* Stacked bars: Sent + Failed */}
        <Bar
          yAxisId="left"
          dataKey="sent"
          stackId="a"
          fill="#22c55e"
          name="Sent"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          yAxisId="left"
          dataKey="failed"
          stackId="a"
          fill="#ef4444"
          name="Failed"
          radius={[4, 4, 0, 0]}
        />

        {/* Line: Delivery rate */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="deliveryRate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Delivery Rate %"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
