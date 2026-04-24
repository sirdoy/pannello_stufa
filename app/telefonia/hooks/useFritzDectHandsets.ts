'use client';

import { useEffect, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface DectHandset {
  id: string;
  name: string;
  model: string;
  firmware_version: string;
  battery_charge_level: number | null;
  is_registered: boolean;
}

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
      const json = (await res.json()) as {
        dect: { items: DectHandset[]; total_count: number; limit: number; offset: number };
      };
      setHandsets(json.dect.items);
      setTotal(json.dect.total_count);
      setStale(false);
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
