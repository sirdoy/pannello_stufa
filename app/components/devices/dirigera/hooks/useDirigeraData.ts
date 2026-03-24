'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { DirigeraHealthResponse, SensorSummaryResponse } from '@/types/dirigeraProxy';

export type DirigeraHealth = 'ok' | 'warning' | 'error';

export interface DirigeraCardData {
  health: DirigeraHealthResponse;
  summary: SensorSummaryResponse;
}

export interface UseDirigeraDataReturn {
  data: DirigeraCardData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  health: DirigeraHealth;
}

function computeDirigeraHealth(summary: SensorSummaryResponse): DirigeraHealth {
  if (summary.offline_count > 0) return 'error';
  if (summary.low_battery_count > 0) return 'warning';
  return 'ok';
}

export function useDirigeraData(): UseDirigeraDataReturn {
  const [data, setData] = useState<DirigeraCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<DirigeraCardData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchData = async () => {
    try {
      setError(null);
      const [healthRes, summaryRes] = await Promise.all([
        fetch('/api/dirigera/health'),
        fetch('/api/dirigera/sensors/summary'),
      ]);

      if (!healthRes.ok || !summaryRes.ok) {
        throw new Error('DIRIGERA non raggiungibile');
      }

      const [health, summary] = await Promise.all([
        healthRes.json() as Promise<DirigeraHealthResponse>,
        summaryRes.json() as Promise<SensorSummaryResponse>,
      ]);

      const newData: DirigeraCardData = { health, summary };
      dataRef.current = newData;
      setData(newData);
      setStale(false);
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('DIRIGERA non raggiungibile');
      }
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

  const health: DirigeraHealth = data ? computeDirigeraHealth(data.summary) : 'ok';

  return { data, loading, error, stale, health };
}
