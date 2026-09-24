'use client';

import { useEffect, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

import type { DectHandset, DectListResponse } from '@/lib/fritzbox/fritzboxClient';

// Types mirror the backend contract (DectListResponse, docs/api/fritzbox.md).
export type { DectHandset, DectListResponse };

interface UseFritzDectHandsetsOptions {
  paused?: boolean;
}

/**
 * useFritzDectHandsets
 *
 * Polls /api/v1/fritzbox/telephony/dect (FRITZ-01).
 * Clones the canonical Fritz!Box polling hook pattern (useFritzWifiClients):
 * - 60s visible cadence, 300s hidden cadence
 * - paused: true stops polling (interval = null)
 * - Never throws on non-OK: sets stale=true, empties state
 * - Response is NOT paginated: { dect: { handsets, handset_count, is_stale, fetched_at } }
 * - Defensive on missing arrays (Firebase RTDB cache drops empty arrays/nulls)
 * - Defensive paused->active re-fetch (Open Question #2 RESOLVED)
 */
export function useFritzDectHandsets(options: UseFritzDectHandsetsOptions = {}): {
  handsets: DectHandset[];
  loading: boolean;
  stale: boolean;
  total: number;
} {
  const { paused = false } = options;

  const [handsets, setHandsets] = useState<DectHandset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [total, setTotal] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async (): Promise<void> => {
    try {
      const res = await fetch('/api/v1/fritzbox/telephony/dect');
      if (!res.ok) {
        setStale(true);
        setHandsets([]);
        setTotal(0);
        return;
      }
      const json = (await res.json()) as { dect?: Partial<DectListResponse> | null };
      const dect = json.dect ?? null;
      const list = Array.isArray(dect?.handsets) ? dect.handsets : [];
      setHandsets(list);
      setTotal(typeof dect?.handset_count === 'number' ? dect.handset_count : list.length);
      setStale(dect === null || dect.is_stale === true);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 0,
  });

  // Defensive paused->active re-fetch (Open Question #2 RESOLVED).
  // Guarantees fresh data whenever paused flips from true to false.
  useEffect(() => {
    if (!paused) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return { handsets, loading, stale, total };
}
