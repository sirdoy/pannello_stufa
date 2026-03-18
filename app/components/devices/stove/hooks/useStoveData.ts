/**
 * useStoveData Hook
 *
 * Encapsulates all stove state management:
 * - Polling via useAdaptivePolling (60s, alwaysActive:true)
 * - Staleness tracking (90s threshold when on, 180s when off)
 * - Error monitoring
 *
 * This hook guarantees SINGLE polling loop for StoveCard.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { getFullSchedulerMode, getNextScheduledAction } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logError, shouldNotify } from '@/lib/errorMonitor';
import { getMaintenanceStatus } from '@/lib/maintenanceService';
import { isSandboxEnabled, isLocalEnvironment } from '@/lib/sandboxService';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
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
  const [status, setStatus] = useState<string>('...');
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

  // Derived state (computed before staleness call so threshold can depend on it)
  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;

  // Staleness thresholds: 90s when stove is on, 180s when off (1.5x the 60s polling interval)
  const stoveStalenessThreshold = isAccesa ? 90000 : 180000;
  const staleness = useDeviceStaleness('stove', stoveStalenessThreshold);

  // Fetch functions
  const fetchFanLevel = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.getFan);
      const json = await res.json();
      const level = json?.Result ?? 3;
      setFanLevel(level);
      return level;
    } catch (err) {
      console.error('Errore livello ventola:', err);
      return null;
    }
  };

  const fetchPowerLevel = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.getPower);
      const json = await res.json();
      const level = json?.Result ?? 2;
      setPowerLevel(level);
      return level;
    } catch (err) {
      console.error('Errore livello potenza:', err);
      return null;
    }
  };

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
      // Check sandbox mode
      if (isLocalEnvironment()) {
        const sandboxEnabled = await isSandboxEnabled();
        setSandboxMode(sandboxEnabled);
      }

      const res = await fetch(STOVE_ROUTES.status);
      const json = await res.json();
      const newStatus = json?.StatusDescription || 'sconosciuto';
      const newErrorCode = json?.Error ?? 0;
      const newErrorDescription = json?.ErrorDescription || '';

      setStatus(newStatus);
      setErrorCode(newErrorCode);
      setErrorDescription(newErrorDescription);

      if (newErrorCode !== 0) {
        await logError(newErrorCode, newErrorDescription, {
          status: newStatus,
          source: 'status_monitor',
        });

        if (shouldNotify(newErrorCode, previousErrorCode.current)) {
          // Browser notification (immediate)
          // await sendErrorNotification(newErrorCode, newErrorDescription);

          // Push notification (to all user devices)
          // if (userId) {
          //   await sendErrorPushNotification(newErrorCode, newErrorDescription, userId);
          // }
        }
      }

      previousErrorCode.current = newErrorCode;

      await fetchFanLevel();
      await fetchPowerLevel();
      await fetchSchedulerMode();
      await fetchMaintenanceStatus();
      await checkVersion();
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('errore');
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
