'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import type { DeviceCountPoint } from '../hooks/useFritzDeviceCountHistory';

interface DeviceCountChartProps {
  data: DeviceCountPoint[];
  loading: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
  }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  return (
    <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-3 shadow-xl">
      <Text size="xs" className="mb-2">
        {format(label, 'dd/MM/yyyy')}
      </Text>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <Text size="xs" variant="secondary">
              {p.name}:
            </Text>
            <Text size="xs">{p.value}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DeviceCountChart
 *
 * Code-split Recharts AreaChart showing daily online device counts.
 * Shows:
 * - Online (emerald/sage green)
 * - Total (slate gray)
 *
 * Loading state: centered "Caricamento..."
 * Empty state: centered "Nessun dato disponibile"
 */
export default function DeviceCountChart({ data, loading }: DeviceCountChartProps) {
  return (
    <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6">
      <Heading level={2} size="lg" className="mb-6">
        Dispositivi connessi
      </Heading>

      {loading && (
        <div className="h-[280px] flex items-center justify-center">
          <Text variant="secondary">Caricamento...</Text>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="h-[280px] flex items-center justify-center">
          <Text variant="secondary">Nessun dato disponibile</Text>
        </div>
      )}

      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
            <XAxis
              dataKey="date"
              tickFormatter={(ts: number) => format(ts, 'dd/MM')}
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Dispositivi',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
              }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="online"
              stroke="rgb(52, 211, 153)"
              fill="rgba(52, 211, 153, 0.2)"
              name="Online"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="rgb(148, 163, 184)"
              fill="rgba(148, 163, 184, 0.1)"
              name="Totali"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
