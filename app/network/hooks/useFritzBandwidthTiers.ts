'use client';

import { useState, useEffect } from 'react';
import type { BandwidthHistoryPoint } from '@/app/components/devices/network/types';

export type BandwidthTier = 'realtime' | 'hourly' | 'daily' | 'auto';

interface AggregatedRecord {
  timestamp: number;          // unified field (NOT hour_timestamp or day_timestamp)
  granularity: 'hourly' | 'daily';
  avg_downstream_rate: number;
  avg_upstream_rate: number;
  [key: string]: string | number;
}

function mapAutoToChartPoints(items: AggregatedRecord[]): BandwidthHistoryPoint[] {
  return items
    .map((record) => ({
      time: record.timestamp * 1000,
      download: record.avg_downstream_rate / 1_000_000,
      upload: record.avg_upstream_rate / 1_000_000,
    }))
    .sort((a, b) => a.time - b.time);
}

interface HourlyRecord {
  hour_timestamp: number;
  avg_downstream_rate: number;
  avg_upstream_rate: number;
  [key: string]: number;
}

interface DailyRecord {
  day_timestamp: number;
  avg_downstream_rate: number;
  avg_upstream_rate: number;
  [key: string]: number;
}

function mapToChartPoints(
  items: (HourlyRecord | DailyRecord)[],
  tier: 'hourly' | 'daily',
): BandwidthHistoryPoint[] {
  const timestampKey = tier === 'hourly' ? 'hour_timestamp' : 'day_timestamp';
  return items
    .map((record) => ({
      time: (record[timestampKey] ?? 0) * 1000,
      download: record.avg_downstream_rate / 1_000_000,
      upload: record.avg_upstream_rate / 1_000_000,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * useFritzBandwidthTiers
 *
 * On-demand tier fetching (NOT a polling hook).
 * Fetches hourly or daily bandwidth history when tier state changes.
 * When tier is 'realtime', clears tierData — parent uses real-time data directly.
 *
 * Transforms API response:
 * - Timestamps: Unix seconds -> ms (* 1000)
 * - Rates: bps -> Mbps (/ 1_000_000)
 *
 * @returns { tier, setTier, tierData, loading }
 */
export function useFritzBandwidthTiers(): {
  tier: BandwidthTier;
  setTier: (tier: BandwidthTier) => void;
  tierData: BandwidthHistoryPoint[];
  loading: boolean;
  autoGranularity: 'hourly' | 'daily' | null;
} {
  const [tier, setTier] = useState<BandwidthTier>('realtime');
  const [tierData, setTierData] = useState<BandwidthHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoGranularity, setAutoGranularity] = useState<'hourly' | 'daily' | null>(null);

  useEffect(() => {
    if (tier === 'realtime') {
      setTierData([]);
      setAutoGranularity(null);
      return;
    }

    if (tier === 'auto') {
      setLoading(true);
      fetch('/api/v1/fritzbox/history/bandwidth/auto?days=7')
        .then((r) => r.json())
        .then((json: unknown) => {
          const data = json as { auto: { items: AggregatedRecord[] } };
          const items = data.auto?.items ?? [];
          const chosen = items[0]?.granularity ?? null;
          setAutoGranularity(chosen);
          setTierData(mapAutoToChartPoints(items));
        })
        .catch(() => {
          setTierData([]);
          setAutoGranularity(null);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    setAutoGranularity(null);

    const endpoint =
      tier === 'hourly'
        ? '/api/v1/fritzbox/history/bandwidth/hourly?days=7'
        : '/api/v1/fritzbox/history/bandwidth/daily?days=30';

    setLoading(true);

    fetch(endpoint)
      .then((r) => r.json())
      .then((json: unknown) => {
        const data = json as Record<string, { items: (HourlyRecord | DailyRecord)[] }>;
        const items =
          tier === 'hourly'
            ? (data.hourly?.items ?? [])
            : (data.daily?.items ?? []);
        setTierData(mapToChartPoints(items, tier));
      })
      .catch(() => {
        setTierData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tier]);

  return { tier, setTier, tierData, loading, autoGranularity };
}
