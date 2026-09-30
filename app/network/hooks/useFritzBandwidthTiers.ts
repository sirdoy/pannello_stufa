'use client';

import { useState, useEffect } from 'react';
import type { BandwidthHistoryPoint } from '@/app/components/devices/network/types';

export type BandwidthTier = 'realtime' | 'hourly' | 'daily' | 'auto';

/**
 * Backend default page size is 100 (7 days hourly = 168 rows would be truncated).
 * 1000 = backend max (Query le=1000) and covers every tier requested here.
 */
const TIER_LIMIT = 1000;

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
interface TierResult {
  tier: BandwidthTier;
  data: BandwidthHistoryPoint[];
  granularity: 'hourly' | 'daily' | null;
}

export function useFritzBandwidthTiers(): {
  tier: BandwidthTier;
  setTier: (tier: BandwidthTier) => void;
  tierData: BandwidthHistoryPoint[];
  loading: boolean;
  autoGranularity: 'hourly' | 'daily' | null;
} {
  const [tier, setTier] = useState<BandwidthTier>('realtime');
  // Last loaded result, tagged with its tier: loading = requested tier not loaded yet
  const [result, setResult] = useState<TierResult | null>(null);

  useEffect(() => {
    if (tier === 'realtime') return;
    let cancelled = false;

    const request: Promise<Omit<TierResult, 'tier'>> =
      tier === 'auto'
        ? fetch(`/api/v1/fritzbox/history/bandwidth/auto?days=7&limit=${TIER_LIMIT}`)
            .then((r) => r.json())
            .then((json: unknown) => {
              const data = json as { auto: { items: AggregatedRecord[] } };
              const items = data.auto?.items ?? [];
              return {
                data: mapAutoToChartPoints(items),
                granularity: items[0]?.granularity ?? null,
              };
            })
        : fetch(
            tier === 'hourly'
              ? `/api/v1/fritzbox/history/bandwidth/hourly?days=7&limit=${TIER_LIMIT}`
              : `/api/v1/fritzbox/history/bandwidth/daily?days=30&limit=${TIER_LIMIT}`
          )
            .then((r) => r.json())
            .then((json: unknown) => {
              const data = json as Record<string, { items: (HourlyRecord | DailyRecord)[] }>;
              const items =
                tier === 'hourly'
                  ? (data.hourly?.items ?? [])
                  : (data.daily?.items ?? []);
              return { data: mapToChartPoints(items, tier), granularity: null };
            });

    request
      .catch(() => ({ data: [], granularity: null }))
      .then((loaded) => {
        // Drop responses of a tier the user already left
        if (!cancelled) setResult({ tier, ...loaded });
      });

    return () => {
      cancelled = true;
    };
  }, [tier]);

  const current = result?.tier === tier ? result : null;
  // While a new tier loads the previous chart stays visible
  const tierData = tier === 'realtime' ? [] : (result?.data ?? []);
  const loading = tier !== 'realtime' && current === null;
  const autoGranularity = current?.granularity ?? null;

  return { tier, setTier, tierData, loading, autoGranularity };
}
