/**
 * useStoveData Hook
 *
 * Encapsulates all stove state management:
 * - Polling via useAdaptivePolling (60s, alwaysActive:true)
 * - Staleness tracking from proxy data_freshness field
 * - Error monitoring
 *
 * This hook guarantees SINGLE polling loop for StoveCard.
 * Reads stove_state, power_level, fan_level from single /stove/status fetch.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { getFullSchedulerMode, getNextScheduledAction } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logError, shouldNotify } from '@/lib/errorMonitor';
import { getMaintenanceStatus } from '@/lib/maintenanceService';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
import type { StalenessInfo } from '@/lib/pwa/stalenessDetector';

/**
 * Parameters required by useStoveData
 */
export interface UseStoveDataParams {
  /** checkVersion function from VersionContext */
  checkVersion: () => Promise<void>;
  /** User ID from Auth0 (for notifications) */
  userId?: string;
}

/**
 * All state and functions exposed by useStoveData
 */
export interface UseStoveDataReturn {
  // Core state
  status: string;
  fanLevel: number | null;
  powerLevel: number | null;
  loading: boolean;
  refreshing: boolean;
  initialLoading: boolean;

  // Scheduler state
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  returnToAutoAt: number | null;
  nextScheduledAction: any;

  // Error state
  errorCode: number;
  errorDescription: string;

  // Maintenance state
  maintenanceStatus: any;
  cleaningInProgress: boolean;

  // Sandbox state
  sandboxMode: boolean;
  loadingMessage: string;

  // PWA state
  isOnline: boolean;
  hasPendingCommands: boolean;
  pendingCommands: unknown[];
  staleness: StalenessInfo | null;

  // Derived state
  isAccesa: boolean;
  isSpenta: boolean;
  needsMaintenance: boolean;

  // Actions
  fetchStatusAndUpdate: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setCleaningInProgress: (cleaning: boolean) => void;
  setSchedulerEnabled: (enabled: boolean) => void;
  setSemiManualMode: (semiManual: boolean) => void;
  setReturnToAutoAt: (timestamp: number | null) => void;
  setNextScheduledAction: (action: any) => void;
  fetchMaintenanceStatus: () => Promise<void>;
  fetchSchedulerMode: () => Promise<void>;
}

/**
 * Custom hook for stove data management
 *
 * @param params - Configuration parameters
 * @returns All stove state and actions
 */
export function useStoveData(params: UseStoveDataParams): UseStoveDataReturn {
  const { checkVersion, userId } = params;

  // PWA hooks
  const { isOnline } = useOnlineStatus();
  const { hasPendingCommands, pendingCommands, lastSyncedCommand } = useBackgroundSync();

  // Core state
  const [status, setStatus] = useState<string>('off');
  const [fanLevel, setFanLevel] = useState<number | null>(null);
  const [powerLevel, setPowerLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Scheduler state
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [semiManualMode, setSemiManualMode] = useState(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState<number | null>(null);
  const [nextScheduledAction, setNextScheduledAction] = useState<any>(null);

  // Error monitoring states
  const [errorCode, setErrorCode] = useState(0);
  const [errorDescription, setErrorDescription] = useState('');
  const previousErrorCode = useRef(0);

  // Maintenance states
  const [maintenanceStatus, setMaintenanceStatus] = useState<any>(null);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);

  // Sandbox mode
  const [sandboxMode, setSandboxMode] = useState(false);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Staleness state — derived from proxy data_freshness field
  const [isStale, setIsStale] = useState(false);

  // Staleness object: null when LIVE, { isStale: true } when STALE
  const staleness: StalenessInfo | null = isStale
    ? { isStale: true, cachedAt: null, ageSeconds: 0 }
    : null;

  // Derived state — exact equality against proxy StoveState values
  const isAccesa = status === 'working' || status === 'igniting' || status === 'modulating';
  const isSpenta = status === 'off' || status === 'alarm' || status === 'standby';
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;

  const fetchSchedulerMode = async () => {
    try {
      const mode = await getFullSchedulerMode();
      setSchedulerEnabled(mode.enabled);
      setSemiManualMode(mode.semiManual || false);
      setReturnToAutoAt(mode.returnToAutoAt ? Number(mode.returnToAutoAt) : null);

      if (mode.enabled && !mode.semiManual) {
        const nextAction = await getNextScheduledAction();
        setNextScheduledAction(nextAction);
      } else {
        setNextScheduledAction(null);
      }
    } catch (err) {
      console.error('Errore modalità scheduler:', err);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const status = await getMaintenanceStatus();
      setMaintenanceStatus(status);
    } catch (err) {
      console.error('Errore stato manutenzione:', err);
    }
  };

  const fetchStatusAndUpdate = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.status);
      if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
      const json = await res.json() as ThermorossiStatusResponse;

      const { stove_state, power_level, fan_level, data_freshness, error_code, error_description } = json;

      setStatus(stove_state);
      setFanLevel(fan_level);
      setPowerLevel(power_level);
      setIsStale(data_freshness === 'STALE');

      if (stove_state === 'alarm') {
        const code = error_code ?? 0;
        const desc = error_description ?? '';
        setErrorCode(code);
        setErrorDescription(desc);
        if (code !== 0) {
          await logError(code, desc, { status: stove_state, source: 'status_monitor' });
          if (shouldNotify(code, previousErrorCode.current)) {
            // Browser notification (immediate)
            // await sendErrorNotification(code, desc);

            // Push notification (to all user devices)
            // if (userId) {
            //   await sendErrorPushNotification(code, desc, userId);
            // }
          }
        }
        previousErrorCode.current = code;
      } else {
        setErrorCode(0);
        setErrorDescription('');
        previousErrorCode.current = 0;
      }

      await fetchSchedulerMode();
      await fetchMaintenanceStatus();
      await checkVersion();
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('off');
    } finally {
      setInitialLoading(false);
    }
  };

  // Refresh status when background sync command completes
  useEffect(() => {
    if (lastSyncedCommand) {
      fetchStatusAndUpdate();
    }
  }, [lastSyncedCommand, fetchStatusAndUpdate]);

  // Adaptive polling: 60s interval, always active (safety-critical)
  useAdaptivePolling({
    callback: fetchStatusAndUpdate,
    interval: 60000,
    alwaysActive: true,
    immediate: true,
  });

  return {
    // Core state
    status,
    fanLevel,
    powerLevel,
    loading,
    refreshing,
    initialLoading,

    // Scheduler state
    schedulerEnabled,
    semiManualMode,
    returnToAutoAt,
    nextScheduledAction,

    // Error state
    errorCode,
    errorDescription,

    // Maintenance state
    maintenanceStatus,
    cleaningInProgress,

    // Sandbox state
    sandboxMode,
    loadingMessage,

    // PWA state
    isOnline,
    hasPendingCommands,
    pendingCommands,
    staleness,

    // Derived state
    isAccesa,
    isSpenta,
    needsMaintenance,

    // Actions
    fetchStatusAndUpdate,
    setLoading,
    setLoadingMessage,
    setCleaningInProgress,
    setSchedulerEnabled,
    setSemiManualMode,
    setReturnToAutoAt,
    setNextScheduledAction,
    fetchMaintenanceStatus,
    fetchSchedulerMode,
  };
}
