'use client';

import { useState, useRef, useCallback } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { CAMERA_ROUTES } from '@/lib/routes';
import type { CameraStatus, DataFreshness } from '@/types/netatmoProxy';

export interface UseCameraDataReturn {
  cameras: CameraStatus[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  stale: boolean;
  dataFreshness: DataFreshness | null;
  lastUpdatedAt: number | null;
  refresh: () => Promise<void>;
}

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1500;

export function useCameraData(): UseCameraDataReturn {
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [stale, setStale] = useState(false);
  const [dataFreshness, setDataFreshness] = useState<DataFreshness | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const dataRef = useRef<CameraStatus[] | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchCameras = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      let lastError: string | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }

        try {
          const response = await fetch(CAMERA_ROUTES.status);
          const data = await response.json() as {
            cameras?: CameraStatus[];
            data_freshness?: DataFreshness | null;
            error?: string;
          };

          if (!response.ok || data.error) {
            lastError = data.error ?? `Errore ${response.status}`;
            continue;
          }

          const newCameras = data.cameras ?? [];
          dataRef.current = newCameras;
          setCameras(newCameras);
          setDataFreshness(data.data_freshness ?? null);
          setConnected(true);
          setStale(false);
          setLastUpdatedAt(Date.now());
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      // All attempts failed
      if (!dataRef.current) {
        setError(lastError);
        setConnected(false);
      } else {
        setStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useAdaptivePolling({
    callback: fetchCameras,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 400,
  });

  return { cameras, loading, error, connected, stale, dataFreshness, lastUpdatedAt, refresh: fetchCameras };
}
