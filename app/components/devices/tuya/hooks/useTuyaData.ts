'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { TuyaData } from '@/types/websocket';
import type { TuyaPlug } from '@/types/tuyaProxy';

export interface UseTuyaDataReturn {
  plugs: TuyaPlug[] | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  lastUpdatedAt: number | null;
}

export function useTuyaData(): UseTuyaDataReturn {
  const [plugs, setPlugs] = useState<TuyaPlug[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const plugsRef = useRef<TuyaPlug[] | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/tuya/plugs');

      if (!res.ok) {
        throw new Error('Tuya endpoint failed');
      }

      const data = await res.json() as TuyaPlug[];

      // Set stale if any plug has non-LIVE freshness
      const isStale = data.some(p => p.data_freshness !== 'LIVE');

      plugsRef.current = data;
      setPlugs(data);
      setStale(isStale);
      setLastUpdatedAt(Date.now());
    } catch {
      setStale(true);
      if (!plugsRef.current) {
        setError('Tuya non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  // WS subscription: subscribe to 'tuya' topic when connection is OPEN (Phase 141 pattern)
  useEffect(() => {
    if (!isWsConnected) return; // guard against CLOSED state

    const handleMessage = (raw: unknown) => {
      const wsData = raw as TuyaData;

      // Guard against null plugs in WS payload
      if (wsData.plugs === null) {
        setStale(true);
        setLoading(false);
        return;
      }

      const isStale = wsData.data_freshness !== 'LIVE';

      plugsRef.current = wsData.plugs;
      setPlugs(wsData.plugs);
      setStale(isStale);
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());
    };

    subscribe('tuya', handleMessage);
    return () => { unsubscribe('tuya', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { plugs, loading, error, stale, lastUpdatedAt };
}
