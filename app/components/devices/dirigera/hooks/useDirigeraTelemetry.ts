'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type {
  SensorTelemetryResponse,
  SensorTelemetryParams,
  SensorTelemetryReading,
} from '@/types/dirigeraProxy';

export interface UseDirigeraTelemetryReturn {
  items: SensorTelemetryReading[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}

export function useDirigeraTelemetry(params?: SensorTelemetryParams): UseDirigeraTelemetryReturn {
  const [items, setItems] = useState<SensorTelemetryReading[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const offsetRef = useRef(0);
  const hasDataRef = useRef(false);

  const isVisible = useVisibility();
  const interval = isVisible ? 300_000 : 600_000;

  const buildUrl = (offset: number) => {
    const sp = new URLSearchParams({ limit: '50', offset: String(offset) });
    if (params?.sensor_id) sp.set('sensor_id', params.sensor_id);
    return `/api/v1/dirigera/telemetry?${sp.toString()}`;
  };

  const fetchPage = async (offset: number, append: boolean) => {
    const res = await fetch(buildUrl(offset));
    if (!res.ok) throw new Error('Impossibile caricare la telemetria');
    const data = (await res.json()) as SensorTelemetryResponse;
    if (append) {
      setItems(prev => [...prev, ...data.telemetry]);
    } else {
      setItems(data.telemetry);
      offsetRef.current = 0;
    }
    setTotal(data.total);
    setStale(false);
    setError(null);
    hasDataRef.current = true;
  };

  const pollCallback = async () => {
    try {
      await fetchPage(0, false);
    } catch {
      setStale(true);
      if (!hasDataRef.current) setError('Impossibile caricare la telemetria');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextOffset = offsetRef.current + 50;
    offsetRef.current = nextOffset;
    setIsLoadingMore(true);
    fetchPage(nextOffset, true)
      .catch(() => {
        setStale(true);
      })
      .finally(() => setIsLoadingMore(false));
  };

  useAdaptivePolling({
    callback: pollCallback,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { items, total, loading, isLoadingMore, error, stale, loadMore };
}
