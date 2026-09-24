'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { CAMERA_ROUTES } from '@/lib/routes';
import type { CameraStatus, DataFreshness } from '@/types/netatmoProxy';
import type { NetatmoData } from '@/types/websocket';

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

  // WS primary channel — Netatmo topic now carries a `cameras` array per
  // docs/api/websocket.md (since 260513-dlo). HTTP /camera/status is the
  // fallback when WS isn't connected.
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

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

  // WS subscription — extracts the cameras array from the netatmo topic payload.
  // The WS NetatmoCamera shape is a superset of CameraStatus (adds vpn_url,
  // proxy_streams, etc.) — we read the CameraStatus-compatible subset here so
  // the card/sheet keep their existing field contract.
  useEffect(() => {
    if (!isWsConnected) return;
    const handleMessage = (raw: unknown) => {
      const data = raw as NetatmoData;
      const wsCameras = data['cameras'];
      if (!Array.isArray(wsCameras)) return;
      const mapped: CameraStatus[] = wsCameras.map((c) => {
        const cam = c as Record<string, unknown>;
        return {
          camera_id: String(cam['camera_id'] ?? ''),
          name: (cam['name'] as string | null) ?? null,
          device_type: (cam['device_type'] as string | null) ?? null,
          status: (cam['status'] as string | null) ?? null,
          sd_status: (cam['sd_status'] as string | null) ?? null,
          alim_status: (cam['alim_status'] as string | null) ?? null,
          firmware: (cam['firmware'] as string | null) ?? null,
          is_local: (cam['is_local'] as boolean | null) ?? null,
        };
      });
      dataRef.current = mapped;
      setCameras(mapped);
      setDataFreshness(data.data_freshness ?? null);
      setConnected(true);
      setStale(data.data_freshness !== 'LIVE');
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());
    };
    subscribe('netatmo', handleMessage);
    return () => {
      unsubscribe('netatmo', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchCameras,
    // Suppress HTTP polling when WS is live (same pattern as other device hooks).
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 400,
  });

  // Bootstrap HTTP fetch on mount regardless of WS state — useAdaptivePolling
  // skips its `immediate` step when interval=null, so without this the card
  // could stay empty until the first WS netatmo push (which may not include
  // cameras if the proxy hasn't refreshed homedata yet).
  useEffect(() => {
    void fetchCameras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { cameras, loading, error, connected, stale, dataFreshness, lastUpdatedAt, refresh: fetchCameras };
}
