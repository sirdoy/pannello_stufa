'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { DirigeraStatsResponse } from '@/types/dirigeraProxy';

export interface UseDirigeraStatsReturn {
  data: DirigeraStatsResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}

export function useDirigeraStats(): UseDirigeraStatsReturn {
  const [data, setData] = useState<DirigeraStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<DirigeraStatsResponse | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 300_000 : 600_000;

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/v1/dirigera/stats');
      if (!res.ok) throw new Error('Impossibile caricare le statistiche');
      const json = (await res.json()) as DirigeraStatsResponse;
      dataRef.current = json;
      setData(json);
      setStale(false);
    } catch {
      setStale(true);
      if (!dataRef.current) setError('Impossibile caricare le statistiche');
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { data, loading, error, stale };
}
