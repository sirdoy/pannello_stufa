'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { adaptNetatmoWsPayload } from '@/lib/netatmo/netatmoWsAdapter';
import type { StalenessInfo } from '@/lib/pwa/stalenessDetector';
import { NETATMO_ROUTES } from '@/lib/routes';

export interface NetatmoTopology {
  home_id: string;
  home_name: string;
  rooms?: NetatmoRoom[];
  modules?: NetatmoModule[];
  [key: string]: unknown;
}

export interface NetatmoRoom {
  id: string;
  name?: string;
  module_ids?: string[];
  modules?: string[];
  [key: string]: unknown;
}

export interface NetatmoModule {
  id: string;
  type: string;
  battery_state?: string;
  battery_level?: number;
  reachable?: boolean;
  rf_strength?: number;
  [key: string]: unknown;
}

export interface RoomStatus {
  room_id: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating?: boolean;
  stoveSync?: boolean;
  stoveSyncSetpoint?: number;
  [key: string]: unknown;
}

export interface ModuleStatus {
  id: string;
  battery_state?: string;
  battery_level?: number;
  reachable?: boolean;
  rf_strength?: number;
  [key: string]: unknown;
}

export interface NetatmoStatus {
  mode?: string;
  rooms?: RoomStatus[];
  modules?: ModuleStatus[];
  hasLowBattery?: boolean;
  hasCriticalBattery?: boolean;
  lowBatteryModules?: NetatmoModule[];
  [key: string]: unknown;
}

export interface UseThermostatDataReturn {
  connected: boolean;
  topology: NetatmoTopology | null;
  status: NetatmoStatus | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  staleness: StalenessInfo | null;
  lastUpdatedAt: number | null;
  refetch: () => Promise<void>;
}

export function useThermostatData(): UseThermostatDataReturn {
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState<NetatmoTopology | null>(null);
  const [status, setStatus] = useState<NetatmoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const staleness = useDeviceStaleness('thermostat');

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const connectionCheckedRef = useRef(false);

  async function checkConnection(retryCount = 0): Promise<void> {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json() as Record<string, unknown>;

      if (data['reconnect']) {
        // Token expired/invalid - retry once in case token was just refreshed
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkConnection(retryCount + 1);
        }
        // All retries exhausted - show reconnect UI
        setConnected(false);
        setError(data['error'] as string);
        return;
      }

      if (!data['error'] && data['home_id']) {
        setConnected(true);
        setTopology(data as unknown as NetatmoTopology);
      } else {
        // Other error - retry once for transient issues
        if (retryCount < MAX_RETRIES && !data['reconnect']) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkConnection(retryCount + 1);
        }
        setConnected(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore connessione termostato:', err);
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return checkConnection(retryCount + 1);
      }
      setConnected(false);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Check connection on mount — strict-mode guard
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStatus(retryCount = 0): Promise<void> {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await response.json() as Record<string, unknown>;

      if (data['reconnect']) {
        // Token issue during polling - retry once before disconnecting
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchStatus(retryCount + 1);
        }
        setConnected(false);
        return;
      }

      if (data['error']) {
        // Rate limiting error - don't show to user, just skip this poll
        const errMsg = data['error'] as string;
        if (errMsg.includes('concurrency limited')) {
          console.warn('⚠️ Netatmo rate limit - skipping this poll');
          return;
        }
        throw new Error(errMsg);
      }

      setStatus(data as unknown as NetatmoStatus);
      setLastUpdatedAt(Date.now());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore fetch status termostato:', err);
      // Retry on network errors (but not rate limit)
      if (retryCount < MAX_RETRIES && !message.includes('concurrency limited')) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchStatus(retryCount + 1);
      }
      // Don't show rate limit errors to user
      if (!message.includes('concurrency limited')) {
        setError(message);
      }
    }
  }

  // WS subscription: subscribe to 'netatmo' topic when connection is OPEN (Phase 141 conditional guard pattern)
  useEffect(() => {
    if (!isWsConnected) return; // guard — prevent dead subscriptions when CLOSED

    const handleMessage = (raw: unknown) => {
      const adapted = adaptNetatmoWsPayload(raw as Record<string, unknown>);
      if (adapted === null) return; // D-06: null payload → keep polling as fallback
      setStatus(adapted);
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());
    };

    subscribe('netatmo', handleMessage);
    return () => { unsubscribe('netatmo', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  // Poll status every 60 seconds — gated on topology being loaded, suppressed when WS is live
  useAdaptivePolling({
    callback: fetchStatus,
    interval: isWsConnected ? null : (topology ? 60000 : null), // D-12: suppress when WS connected
    alwaysActive: false,                                          // D-13: non-safety-critical
    immediate: true,
    initialDelay: 50,
  });

  const refetch = async (): Promise<void> => {
    await fetchStatus();
  };

  return {
    connected,
    topology,
    status,
    loading,
    error,
    stale: staleness?.isStale ?? false,
    staleness,
    lastUpdatedAt,
    refetch,
  };
}
