'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import type { TuyaHistoryItem } from '@/types/tuyaProxy';

interface TuyaEnergyChartInnerProps {
  items: TuyaHistoryItem[];
  granularity: 'raw' | 'hourly' | 'daily';
}

function formatTick(ts: number, granularity: 'raw' | 'hourly' | 'daily'): string {
  if (granularity === 'raw' || granularity === 'hourly') {
    return format(new Date(ts * 1000), 'HH:mm');
  }
  return format(new Date(ts * 1000), 'dd/MM');
}

export default function TuyaEnergyChartInner({
  items,
  granularity,
}: TuyaEnergyChartInnerProps) {
  const isRaw = granularity === 'raw';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={items} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="tuya-power-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tuya-energy-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts: number) => formatTick(ts, granularity)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />

        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => `${v}`}
        />

        {!isRaw && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => `${v}`}
          />
        )}

        <Tooltip
          contentStyle={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: 12,
          }}
          labelFormatter={(ts: number) => format(new Date(ts * 1000), 'dd/MM HH:mm')}
          formatter={(value: number, name: string) => {
            if (name === 'power_w' || name === 'avg_power_w') {
              const label = isRaw ? 'Potenza (W)' : 'Potenza media (W)';
              return [value?.toFixed(1), label];
            }
            if (name === 'energy_kwh_delta') {
              return [value?.toFixed(3), 'Energia (kWh)'];
            }
            return [value, name];
          }}
        />

        {isRaw ? (
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="power_w"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="url(#tuya-power-gradient)"
            dot={false}
            connectNulls
            name="power_w"
          />
        ) : (
          <>
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="avg_power_w"
              stroke="#f59e0b"
              strokeWidth={1.5}
              fill="url(#tuya-power-gradient)"
              dot={false}
              connectNulls
              name="avg_power_w"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="energy_kwh_delta"
              stroke="#38bdf8"
              strokeWidth={1.5}
              fill="url(#tuya-energy-gradient)"
              dot={false}
              connectNulls
              name="energy_kwh_delta"
            />
          </>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
