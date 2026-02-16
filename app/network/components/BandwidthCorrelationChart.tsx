'use client';

import {
  ComposedChart,
  Line,
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
import type {
  CorrelationDataPoint,
  CorrelationStatus,
} from '@/app/components/devices/network/types';

interface BandwidthCorrelationChartProps {
  data: CorrelationDataPoint[];
  status: CorrelationStatus;
  pointCount: number;
  minPoints: number;
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

/**
 * CustomTooltip Component
 *
 * Custom Recharts tooltip with dark theme styling.
 * Shows time, bandwidth, and power level with colored indicators.
 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const bandwidthValue = payload.find((p) => p.dataKey === 'bandwidth')?.value ?? 0;
  const powerLevelValue = payload.find((p) => p.dataKey === 'powerLevel')?.value ?? 0;

  return (
    <div className="bg-slate-900 [html:not(.dark)_&]:bg-white border border-white/10 [html:not(.dark)_&]:border-black/10 rounded-lg p-3 shadow-xl">
      <Text size="xs" className="mb-2">
        {format(label, 'HH:mm:ss')}
      </Text>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ backgroundColor: '#34d399' }} />
            <Text size="xs" variant="secondary">
              Banda:
            </Text>
          </div>
          <Text size="xs" className="text-emerald-400">
            {bandwidthValue.toFixed(1)} Mbps
          </Text>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ed6f10' }} />
            <Text size="xs" variant="secondary">
              Potenza:
            </Text>
          </div>
          <Text size="xs" style={{ color: '#ed6f10' }}>
            {powerLevelValue.toFixed(1)}
          </Text>
        </div>
      </div>
    </div>
  );
}

/**
 * BandwidthCorrelationChart Component
 *
 * Dual y-axis ComposedChart showing bandwidth-stove power correlation.
 * Left Y-axis: Bandwidth (Mbps)
 * Right Y-axis: Power Level (1-5)
 *
 * States:
 * - stove-off: No correlation data available
 * - collecting: < minPoints, shows progress
 * - insufficient: Edge case for insufficient data
 * - ready: Renders chart with data
 */
export default function BandwidthCorrelationChart({
  data,
  status,
  pointCount,
  minPoints,
}: BandwidthCorrelationChartProps) {
  return (
    <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Heading level={2} size="lg">
          Correlazione Banda-Stufa
        </Heading>
      </div>

      {/* Empty State: Stove Off */}
      {status === 'stove-off' && (
        <div className="h-[300px] flex items-center justify-center">
          <Text variant="secondary">
            Stufa spenta — correlazione non disponibile
          </Text>
        </div>
      )}

      {/* Collecting State */}
      {status === 'collecting' && (
        <div className="h-[300px] flex items-center justify-center">
          <Text variant="secondary">
            Raccolta dati: {pointCount}/{minPoints} punti
          </Text>
        </div>
      )}

      {/* Insufficient State */}
      {status === 'insufficient' && (
        <div className="h-[300px] flex items-center justify-center">
          <Text variant="tertiary">
            Dati insufficienti per la correlazione
          </Text>
        </div>
      )}

      {/* Chart: Ready State */}
      {status === 'ready' && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />

            {/* X-axis: Time */}
            <XAxis
              dataKey="time"
              tickFormatter={(timestamp: number) => format(timestamp, 'HH:mm')}
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
            />

            {/* Left Y-axis: Bandwidth */}
            <YAxis
              yAxisId="left"
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Banda (Mbps)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
              }}
            />

            {/* Right Y-axis: Power Level */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 6]}
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Potenza',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }} />

            {/* Legend */}
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />

            {/* Bandwidth Line (Left Y-axis) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="bandwidth"
              stroke="rgb(52, 211, 153)"
              strokeWidth={2}
              dot={false}
              name="Banda (Mbps)"
              isAnimationActive={false}
            />

            {/* Power Level Line (Right Y-axis) */}
            <Line
              yAxisId="right"
              type="stepAfter"
              dataKey="powerLevel"
              stroke="#ed6f10"
              strokeWidth={2}
              dot={false}
              name="Potenza stufa"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
