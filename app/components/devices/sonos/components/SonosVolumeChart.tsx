'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { SonosVolumeHistoryItem } from '@/types/sonosProxy';

interface SonosVolumeChartProps {
  items: SonosVolumeHistoryItem[];
  timeRange: '24h' | '7d' | '30d';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const avgVolume = payload.find(p => p.dataKey === 'avg_volume')?.value;

  return (
    <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">
        {format(label * 1000, 'dd/MM HH:mm')}
      </p>
      {avgVolume !== undefined && (
        <p className="text-xs text-amber-400">Volume: {avgVolume}%</p>
      )}
    </div>
  );
}

export default function SonosVolumeChart({ items, timeRange }: SonosVolumeChartProps) {
  const formatXAxis = (val: number) => {
    if (timeRange === '24h') {
      return format(val * 1000, 'HH:mm');
    }
    return format(val * 1000, 'dd/MM');
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={items} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxis}
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '11px' }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '11px' }}
          label={{
            value: 'Volume',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '11px', fill: 'currentColor', opacity: 0.6 },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avg_volume"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          name="Volume medio"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
