'use client';

import {
  LineChart,
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
import TimeRangeSelector from './TimeRangeSelector';
import HistoryTierToggle from './HistoryTierToggle';
import type { BandwidthHistoryPoint, BandwidthTimeRange } from '@/app/components/devices/network/types';
import type { BandwidthTier } from '../hooks/useFritzBandwidthTiers';

interface BandwidthChartProps {
  data: BandwidthHistoryPoint[];
  timeRange: BandwidthTimeRange;
  onTimeRangeChange: (range: BandwidthTimeRange) => void;
  isEmpty: boolean;
  isCollecting: boolean;
  isLoading?: boolean;
  pointCount: number;
  // Tier props (optional — backward compatible, defaults to 'realtime')
  activeTier?: BandwidthTier;
  onTierChange?: (tier: BandwidthTier) => void;
  tierData?: BandwidthHistoryPoint[];
  tierLoading?: boolean;
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
 * Shows time and bandwidth values with colored indicators.
 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const downloadValue = payload.find((p) => p.dataKey === 'download')?.value ?? 0;
  const uploadValue = payload.find((p) => p.dataKey === 'upload')?.value ?? 0;

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
              Download:
            </Text>
          </div>
          <Text size="xs" className="text-emerald-400">
            {downloadValue.toFixed(1)} Mbps
          </Text>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400" style={{ backgroundColor: '#2dd4bf' }} />
            <Text size="xs" variant="secondary">
              Upload:
            </Text>
          </div>
          <Text size="xs" className="text-teal-400">
            {uploadValue.toFixed(1)} Mbps
          </Text>
        </div>
      </div>
    </div>
  );
}

/**
 * BandwidthChart Component
 *
 * Recharts LineChart showing download and upload bandwidth over time.
 * Features time range selector, tier toggle, empty state, and collecting state.
 *
 * Tier modes:
 * - realtime: Uses real-time data with TimeRangeSelector (existing behavior)
 * - hourly: Fetches hourly aggregated data (no TimeRangeSelector)
 * - daily: Fetches daily aggregated data (no TimeRangeSelector)
 *
 * States:
 * - isEmpty: No data collected yet, shows message
 * - isCollecting: < 10 points, shows progress overlay
 * - Normal: Renders chart with data
 */
export default function BandwidthChart({
  data,
  timeRange,
  onTimeRangeChange,
  isEmpty,
  isCollecting,
  isLoading = false,
  pointCount,
  activeTier = 'realtime',
  onTierChange,
  tierData = [],
  tierLoading = false,
}: BandwidthChartProps) {
  const isRealtime = activeTier === 'realtime';

  // Which data to render in the chart
  const chartData = isRealtime ? data : tierData;

  // Tick formatter based on tier / time range
  const formatXAxis = (timestamp: number) => {
    if (!isRealtime) {
      if (activeTier === 'daily') {
        return format(timestamp, 'dd/MM');
      }
      // hourly
      return format(timestamp, 'dd/MM HH:mm');
    }
    if (timeRange === '7d') {
      return format(timestamp, 'dd/MM');
    }
    return format(timestamp, 'HH:mm');
  };

  return (
    <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6">
      {/* Header: Title + Tier Toggle + Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <Heading level={2} size="lg">
          Banda
        </Heading>
        <div className="flex items-center gap-4">
          {onTierChange && (
            <HistoryTierToggle value={activeTier} onChange={onTierChange} />
          )}
          {isRealtime && !isEmpty && (
            <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
          )}
        </div>
      </div>

      {/* Tier Loading State (for historical tiers) */}
      {!isRealtime && tierLoading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Text variant="secondary">
              Caricamento dati storici...
            </Text>
          </div>
        </div>
      )}

      {/* Tier Empty State (for historical tiers) */}
      {!isRealtime && !tierLoading && tierData.length === 0 && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Text variant="secondary">
              Nessun dato storico disponibile
            </Text>
          </div>
        </div>
      )}

      {/* Real-time: Loading State */}
      {isRealtime && isLoading && data.length === 0 && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Text variant="secondary">
              Caricamento storico banda...
            </Text>
          </div>
        </div>
      )}

      {/* Real-time: Empty State */}
      {isRealtime && isEmpty && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Text variant="secondary">
              Raccolta dati banda in corso...
            </Text>
            <Text variant="tertiary" size="sm" className="mt-1">
              Torna tra qualche minuto
            </Text>
          </div>
        </div>
      )}

      {/* Real-time: Collecting State (shows progress, but still renders chart if data > 0) */}
      {isRealtime && !isEmpty && isCollecting && (
        <div className="mb-4 flex items-center justify-center">
          <Text variant="secondary" size="sm">
            Raccolta dati: {pointCount}/10 punti
          </Text>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (isRealtime ? !isEmpty : !tierLoading) && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />

            {/* X-axis: Time */}
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
            />

            {/* Y-axis: Mbps */}
            <YAxis
              stroke="currentColor"
              className="opacity-60"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Mbps',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }} />

            {/* Legend */}
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />

            {/* Download Line */}
            <Line
              type="monotone"
              dataKey="download"
              stroke="rgb(52, 211, 153)"
              strokeWidth={2}
              dot={false}
              name="Download"
              isAnimationActive={false}
            />

            {/* Upload Line */}
            <Line
              type="monotone"
              dataKey="upload"
              stroke="rgb(45, 212, 191)"
              strokeWidth={2}
              dot={false}
              name="Upload"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
