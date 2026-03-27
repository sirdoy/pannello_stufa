'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { DirigeraData as WsDirigeraData, DirigeraContactSensor } from '@/types/websocket';
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

export function computeDirigeraHealth(summary: SensorSummaryResponse): DirigeraHealth {
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

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

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

  async function fetchHealth() {
    try {
      const healthRes = await fetch('/api/dirigera/health');
      if (!healthRes.ok) return;
      const health = (await healthRes.json()) as DirigeraHealthResponse;
      // D-14: do not update stale from health when WS is connected
      setData(prev => prev ? { ...prev, health } : null);
    } catch {
      // Silent — health is supplementary when WS is active
    }
  }

  const fetchHealthRef = useRef(fetchHealth);
  fetchHealthRef.current = fetchHealth;

  // WS subscription: subscribe to 'dirigera' topic when connection is OPEN (Phase 141 pattern)
  useEffect(() => {
    if (!isWsConnected) return; // guard against CLOSED state

    const handleMessage = (raw: unknown) => {
      const wsData = raw as WsDirigeraData;
      const sensors = wsData.sensors ?? [];

      // D-07/D-08: derive summary stats from raw sensors array (no HTTP call needed)
      const summary: SensorSummaryResponse = {
        total_sensors: sensors.length,
        offline_count: sensors.filter(s => !s.is_reachable).length,
        low_battery_count: sensors.filter(
          s => s.battery_percentage !== null && s.battery_percentage <= 20
        ).length,
        open_count: sensors.filter(
          s => s.type === 'openCloseSensor' && (s as DirigeraContactSensor).is_open
        ).length,
        is_stale: false,
      };

      setData(prev => {
        const health = prev?.health ?? { firmware_version: '', connected_sensors: sensors.length, is_reachable: true };
        return { health, summary };
      });
      setStale(false); // D-13: WS messages are always fresh
      setLoading(false);
      setError(null);

      // D-09: health not in WS — fire-and-forget side-fetch
      void fetchHealthRef.current();
    };

    subscribe('dirigera', handleMessage);
    return () => { unsubscribe('dirigera', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval, // D-01: suppress polling when WS is live
    alwaysActive: false, // D-02: non-safety-critical
    immediate: true,
    initialDelay: 600,
  });

  const health: DirigeraHealth = data ? computeDirigeraHealth(data.summary) : 'ok';

  return { data, loading, error, stale, health };
}
