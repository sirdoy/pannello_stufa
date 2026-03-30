'use client';

import { useState, useEffect } from 'react';
import type { TuyaHistoryResponse } from '@/types/tuyaProxy';

export interface UseTuyaHistoryReturn {
  data: TuyaHistoryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useTuyaHistory(
  deviceId: string | null,
  period: '24h' | '7d' | '30d'
): UseTuyaHistoryReturn {
  const [data, setData] = useState<TuyaHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/tuya/plugs/${deviceId}/history?period=${period}&page_size=500`
        );

        if (!res.ok) {
          throw new Error('History fetch failed');
        }

        const json = await res.json() as TuyaHistoryResponse;

        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setError('Storico non disponibile');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [deviceId, period]);

  return { data, loading, error };
}
