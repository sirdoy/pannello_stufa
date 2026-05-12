'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { DirigeraData as WsDirigeraData } from '@/types/websocket';
import type {
  DirigeraHealthResponse,
  DirigeraSensor,
  DirigeraSensorsResponse,
  ContactSensorsResponse,
  MotionSensorsResponse,
} from '@/types/dirigeraProxy';

export type SensorFilter = 'all' | 'contact' | 'motion';

const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
  all: '/api/v1/dirigera/sensors',
  contact: '/api/v1/dirigera/sensors/contact',
  motion: '/api/v1/dirigera/sensors/motion',
};

export interface DirigeraFullData {
  health: DirigeraHealthResponse;
  sensors: DirigeraSensor[];
}

export interface UseDirigeraFullDataReturn {
  data: DirigeraFullData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}

export function useDirigeraFullData(filter: SensorFilter): UseDirigeraFullDataReturn {
  const [data, setData] = useState<DirigeraFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<DirigeraFullData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  // WS — primary channel when OPEN. Pushed `sensors[]` replace the HTTP cycle.
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  // Reset state when filter changes so we fetch the new endpoint immediately
  useEffect(() => {
    setData(null);
    setLoading(true);
    dataRef.current = null;
  }, [filter]);

  const fetchData = async () => {
    try {
      setError(null);
      const [healthRes, sensorsRes] = await Promise.all([
        fetch('/api/v1/dirigera/health'),
        fetch(FILTER_ENDPOINTS[filter]),
      ]);

      if (!healthRes.ok || !sensorsRes.ok) {
        throw new Error('One or more DIRIGERA endpoints failed');
      }

      const health = await healthRes.json() as DirigeraHealthResponse;

      // All three response shapes have a .sensors array
      const sensorsBody = await sensorsRes.json() as
        | DirigeraSensorsResponse
        | ContactSensorsResponse
        | MotionSensorsResponse;
      const sensors = sensorsBody.sensors as DirigeraSensor[];

      const newData: DirigeraFullData = { health, sensors };
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

  // WS subscription — when OPEN, replaces the polling cycle. Filter client-side
  // since WS topic always streams all sensors regardless of filter param.
  useEffect(() => {
    if (!isWsConnected) return;
    const handleMessage = (raw: unknown) => {
      const wsData = raw as WsDirigeraData;
      const all = (wsData.sensors ?? []) as DirigeraSensor[];
      const filtered =
        filter === 'contact'
          ? all.filter((s) => s.type === 'openCloseSensor')
          : filter === 'motion'
            ? all.filter((s) => s.type === 'occupancySensor')
            : all;
      const newData: DirigeraFullData = {
        // Health isn't on WS — keep last-known value (HTTP backfills via fetchData
        // when WS drops). Fall back to a minimal stub so consumers can render.
        health:
          dataRef.current?.health ?? {
            firmware_version: '',
            connected_sensors: filtered.length,
            is_reachable: true,
          },
        sensors: filtered,
      };
      dataRef.current = newData;
      setData(newData);
      setStale(false);
      setLoading(false);
      setError(null);
    };
    subscribe('dirigera', handleMessage);
    return () => {
      unsubscribe('dirigera', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe, filter]);

  useAdaptivePolling({
    callback: fetchData,
    // Suppress polling when WS is live (same pattern as other device hooks)
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { data, loading, stale, error };
}
