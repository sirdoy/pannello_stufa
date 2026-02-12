/**
 * useStoveData Hook
 *
 * Encapsulates all stove state management:
 * - Polling (custom adaptive loop, NOT useAdaptivePolling)
 * - Firebase real-time listeners
 * - Background sync integration
 * - Staleness tracking
 * - Sandbox mode support
 * - Error monitoring
 *
 * This hook guarantees SINGLE polling loop for StoveCard.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFullSchedulerMode, getNextScheduledAction } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logError, shouldNotify } from '@/lib/errorMonitor';
import { getMaintenanceStatus } from '@/lib/maintenanceService';
import { isSandboxEnabled, isLocalEnvironment } from '@/lib/sandboxService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import { useVisibility } from '@/lib/hooks/useVisibility';
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

  // Connection state
  isFirebaseConnected: boolean;
  usePollingFallback: boolean;

  // PWA state
  isOnline: boolean;
  hasPendingCommands: boolean;
  pendingCommands: unknown[];
  staleness: StalenessInfo | null;
  isVisible: boolean;

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
  const staleness = useDeviceStaleness('stove');
  const isVisible = useVisibility();

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

  // Firebase connection tracking
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const lastFirebaseUpdateRef = useRef<number | null>(null);
  const isFirstConnectionRef = useRef(true);

  // Refs for tracking previous values (for Firebase sync on external changes)
  const previousStatusRef = useRef(null);
  const previousFanLevelRef = useRef(null);
  const previousPowerLevelRef = useRef(null);

  // Polling control
  const pollingStartedRef = useRef(false);

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

  const fetchSchedulerMode = useCallback(async () => {
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
  }, []);

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const status = await getMaintenanceStatus();
      setMaintenanceStatus(status);
    } catch (err) {
      console.error('Errore stato manutenzione:', err);
    }
  }, []);

  const fetchStatusAndUpdate = useCallback(async () => {
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

      const newFanLevel = await fetchFanLevel();
      const newPowerLevel = await fetchPowerLevel();
      await fetchSchedulerMode();
      await fetchMaintenanceStatus();
      await checkVersion();

      // Sync to Firebase if external changes detected (manual actions, auto-shutdown, etc.)
      const hasChanges =
        previousStatusRef.current !== newStatus ||
        previousFanLevelRef.current !== newFanLevel ||
        previousPowerLevelRef.current !== newPowerLevel ||
        previousErrorCode.current !== newErrorCode;

      // Only sync if not initial load (previousStatusRef.current !== null)
      if (hasChanges && previousStatusRef.current !== null) {
        try {
          await fetch('/api/stove/sync-external-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newStatus,
              fanLevel: newFanLevel,
              powerLevel: newPowerLevel,
              errorCode: newErrorCode,
              errorDescription: newErrorDescription
            })
          });
        } catch (syncErr) {
          console.error('[useStoveData] Firebase sync error (non-critical):', syncErr);
          // Non-critical error, don't break the UI update
        }
      }

      // Update refs for next comparison
      previousStatusRef.current = newStatus as any;
      previousFanLevelRef.current = newFanLevel as any;
      previousPowerLevelRef.current = newPowerLevel as any;
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('errore');
    } finally {
      setInitialLoading(false);
    }
  }, [checkVersion, fetchSchedulerMode, fetchMaintenanceStatus, userId]);

  // Refresh status when background sync command completes
  useEffect(() => {
    if (lastSyncedCommand) {
      fetchStatusAndUpdate();
    }
  }, [lastSyncedCommand, fetchStatusAndUpdate]);

  // Adaptive polling (active only if Firebase fails or for validation)
  // CRITICAL: Custom polling loop, NOT useAdaptivePolling
  useEffect(() => {
    if (pollingStartedRef.current) return;

    // Initial fetch (always)
    fetchStatusAndUpdate();

    pollingStartedRef.current = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const scheduleNextPoll = () => {
      // Adaptive polling intervals:
      // - 10s if Firebase disconnected (fallback mode)
      // - 15s if stove is ON (more frequent to detect external changes)
      // - 60s if stove is OFF/standby (less frequent, saves resources)
      let interval;
      if (usePollingFallback) {
        interval = 10000; // Firebase disconnected
      } else {
        // Check if stove is actively running
        const stoveIsOn = status !== 'spento' &&
                          status !== 'standby' &&
                          status !== 'errore' &&
                          status !== '...' &&
                          status !== 'sconosciuto';
        interval = stoveIsOn ? 15000 : 60000; // 15s on, 60s off
      }

      timeoutId = setTimeout(() => {
        // Only poll if:
        // 1. Firebase is disconnected (fallback), OR
        // 2. Last Firebase update was too old (stale data detection)
        const now = new Date();
        const lastUpdate = lastFirebaseUpdateRef.current;
        const timeSinceUpdate = lastUpdate ? (now.getTime() - lastUpdate) / 1000 : Infinity;

        // Stale threshold adapts to polling interval
        const staleThreshold = usePollingFallback ? 30 : (status !== 'spento' ? 30 : 90);

        if (!isFirebaseConnected || timeSinceUpdate > staleThreshold || usePollingFallback) {
          fetchStatusAndUpdate();
        }

        // Schedule next poll (recursive)
        scheduleNextPoll();
      }, interval);
    };

    scheduleNextPoll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      pollingStartedRef.current = false;
    };
  }, [fetchStatusAndUpdate, isFirebaseConnected, usePollingFallback, status]);

  // Firebase connection monitoring
  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setIsFirebaseConnected(connected);

      // Skip warning on initial mount (Firebase starts as disconnected before connecting)
      if (!connected && !isFirstConnectionRef.current) {
        console.warn('[useStoveData] Firebase disconnected, activating polling fallback');
        setUsePollingFallback(true);
      } else if (connected) {
        isFirstConnectionRef.current = false;
        // Keep polling fallback for 30s after reconnection to ensure sync
        setTimeout(() => {
          setUsePollingFallback(false);
        }, 30000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase real-time listener for stove state
  useEffect(() => {
    const path = isLocalEnvironment() ? 'dev/stove/state' : 'stove/state';
    const stateRef = ref(db, path);

    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          // Update all state from Firebase
          if (data.status !== undefined) setStatus(data.status);
          if (data.fanLevel !== undefined) setFanLevel(data.fanLevel);
          if (data.powerLevel !== undefined) setPowerLevel(data.powerLevel);
          if (data.errorCode !== undefined) setErrorCode(data.errorCode);
          if (data.errorDescription !== undefined) setErrorDescription(data.errorDescription);

          // Track last update time
          lastFirebaseUpdateRef.current = Date.now();

          // Fetch related data (scheduler mode, maintenance) on state change
          fetchSchedulerMode();
          fetchMaintenanceStatus();
          checkVersion();
        }
      },
      (error) => {
        console.error('[useStoveData] Firebase listener error:', error);
        // Activate polling fallback on listener error
        setUsePollingFallback(true);
      }
    );

    return () => unsubscribe();
  }, [checkVersion, fetchSchedulerMode, fetchMaintenanceStatus]);

  // Listener Firebase per Sandbox Mode - sync real-time
  useEffect(() => {
    if (!isLocalEnvironment()) return;

    let unsubscribeState: (() => void) | null = null;
    let unsubscribeMaintenance: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    async function setupSandboxListeners() {
      const enabled = await isSandboxEnabled();

      if (enabled) {
        // Listener per stato stufa
        const stateRef = ref(db, 'sandbox/stoveState');
        unsubscribeState = onValue(stateRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setStatus(data.status || '...');
            setFanLevel(data.fan ?? null);
            setPowerLevel(data.power ?? null);
          }
        });

        // Listener per errori
        const errorRef = ref(db, 'sandbox/error');
        unsubscribeError = onValue(errorRef, (snapshot) => {
          const error = snapshot.val();
          if (error) {
            const errorCode = parseInt(error.code.replace('AL', '')) || 1;
            setErrorCode(errorCode);
            setErrorDescription(error.description);
          } else {
            setErrorCode(0);
            setErrorDescription('');
          }
        });

        // Listener per manutenzione
        const maintenanceRef = ref(db, 'sandbox/maintenance');
        unsubscribeMaintenance = onValue(maintenanceRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            await fetchMaintenanceStatus();
          }
        });
      }
    }

    setupSandboxListeners();

    return () => {
      if (unsubscribeState) unsubscribeState();
      if (unsubscribeError) unsubscribeError();
      if (unsubscribeMaintenance) unsubscribeMaintenance();
    };
  }, [sandboxMode, fetchMaintenanceStatus]);

  // Derived state
  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;

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

    // Connection state
    isFirebaseConnected,
    usePollingFallback,

    // PWA state
    isOnline,
    hasPendingCommands,
    pendingCommands,
    staleness,
    isVisible,

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
