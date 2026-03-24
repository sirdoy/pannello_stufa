'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type {
  DirigeraHealthResponse,
  DirigeraSensor,
  DirigeraSensorsResponse,
  ContactSensorsResponse,
  MotionSensorsResponse,
} from '@/types/dirigeraProxy';

export type SensorFilter = 'all' | 'contact' | 'motion';

const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
  all: '/api/dirigera/sensors',
  contact: '/api/dirigera/sensors/contact',
  motion: '/api/dirigera/sensors/motion',
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
        fetch('/api/dirigera/health'),
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

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { data, loading, stale, error };
}
