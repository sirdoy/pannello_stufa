'use client';

import { useEffect, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface TamStatus {
  enabled: boolean;
  new_messages: number;
  total_messages: number;
  is_stale: boolean;
  fetched_at: string | null;
}

interface UseFritzTamStatusOptions {
  paused?: boolean;
}

/**
 * useFritzTamStatus
 *
 * Polls /api/fritzbox/telephony/tam (FRITZ-03).
 * Single-object response (no pagination). Follows the canonical
 * Fritz!Box polling pattern with paused/visibility gating.
 * Defensive paused->active re-fetch (Open Question #2 RESOLVED).
 */
export function useFritzTamStatus(options: UseFritzTamStatusOptions = {}): {
  status: TamStatus | null;
  loading: boolean;
  stale: boolean;
} {
  const { paused = false } = options;

  const [status, setStatus] = useState<TamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async (): Promise<void> => {
    try {
      const res = await fetch('/api/fritzbox/telephony/tam');
      if (!res.ok) {
        setStale(true);
        setStatus(null);
        return;
      }
      const json = (await res.json()) as { tam: TamStatus };
      setStatus(json.tam);
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
  useEffect(() => {
    if (!paused) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return { status, loading, stale };
}
