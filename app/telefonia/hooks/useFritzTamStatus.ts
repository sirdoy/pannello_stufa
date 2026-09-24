'use client';

import { useEffect, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

import type { TamStatusModel, TamStatusResponse } from '@/lib/fritzbox/fritzboxClient';

// Types mirror the backend contract (TamStatusResponse, docs/api/fritzbox.md):
// { tam: { total_messages, new_messages, tam_enabled, tam_name }, is_stale, fetched_at }
export type TamStatus = TamStatusResponse;
export type { TamStatusModel };

interface UseFritzTamStatusOptions {
  paused?: boolean;
}

/**
 * useFritzTamStatus
 *
 * Polls /api/v1/fritzbox/telephony/tam (FRITZ-03).
 * Single-object response (no pagination), nested as
 * { tam: { tam: TamStatusModel, is_stale, fetched_at } }. Follows the canonical
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
      const res = await fetch('/api/v1/fritzbox/telephony/tam');
      if (!res.ok) {
        setStale(true);
        setStatus(null);
        return;
      }
      const json = (await res.json()) as { tam?: TamStatus | null };
      const payload = json.tam ?? null;
      if (!payload || !payload.tam) {
        // Malformed payload — never crash the card, surface as stale/unavailable.
        setStale(true);
        setStatus(null);
        return;
      }
      setStatus(payload);
      setStale(payload.is_stale === true);
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
