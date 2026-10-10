/**
 * useStoveData Hook
 *
 * Encapsulates all stove state management:
 * - WebSocket primary channel: subscribes to 'thermorossi' topic (MIG-01)
 * - HTTP polling fallback (60s, alwaysActive:true) when WS is unavailable (MIG-02, MIG-03)
 * - Staleness tracking from proxy data_freshness field
 * - Error monitoring
 *
 * This hook guarantees SINGLE polling loop for StoveCard.
 * Reads stove_state, power_level, fan_level from WS messages or /stove/status fetch.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getFullSchedulerMode,
  getNextScheduledAction,
  type NextScheduledAction,
} from '@/lib/scheduler/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logError, shouldNotify } from '@/lib/errorMonitor';
import { getMaintenanceStatus, type MaintenanceStatus } from '@/lib/maintenance/maintenanceService';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { ThermorossiData } from '@/types/websocket';
import type { StoveState, ThermorossiStatusResponse } from '@/types/thermorossiProxy';
import type { StalenessInfo } from '@/lib/pwa/stalenessDetector';
import type { FormattedCommand } from '@/lib/pwa/backgroundSync';
import { WS_SNAPSHOT_GRACE_MS } from '@/lib/ws/snapshotGrace';
import { isFetchInterrupted } from '@/lib/utils/fetchInterruption';

/**
 * Parameters required by useStoveData
 */
export interface UseStoveDataParams {
  /** User ID (session sub) (for notifications) */
  userId?: string;
}

/**
 * All state and functions exposed by useStoveData
 */
export interface UseStoveDataReturn {
  // Core state
  status: StoveState;
  fanLevel: number | null;
  powerLevel: number | null;
  loading: boolean;
  refreshing: boolean;
  initialLoading: boolean;

  // Scheduler state
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  returnToAutoAt: number | null;
  nextScheduledAction: NextScheduledAction | null;

  // Error state
  errorCode: number;
  errorDescription: string;
  /** Reserve sensor of the stove reports low pellets (ROADMAP D11). */
  pelletLow: boolean;

  // Maintenance state
  maintenanceStatus: MaintenanceStatus | null;
  cleaningInProgress: boolean;

  loadingMessage: string;

  // PWA state
  isOnline: boolean;
  hasPendingCommands: boolean;
  pendingCommands: FormattedCommand[];
  staleness: StalenessInfo | null;
  /** The last status read failed: the state shown is the last known one, or 'unknown' (ROADMAP M78). */
  unreachable: boolean;

  // Timestamp for LastUpdated component
  lastUpdatedAt: number | null;

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
  setNextScheduledAction: (action: NextScheduledAction | null) => void;
  fetchMaintenanceStatus: () => Promise<void>;
  fetchSchedulerMode: () => Promise<void>;
}

/**
 * Custom hook for stove data management
 *
 * @param params - Configuration parameters
 * @returns All stove state and actions
 */
export function useStoveData(_params: UseStoveDataParams = {}): UseStoveDataReturn {
  // PWA hooks
  const { isOnline } = useOnlineStatus();
  const { hasPendingCommands, pendingCommands, lastSyncedCommand } = useBackgroundSync();

  // WS context — primary data channel
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  // Core state
  const [status, setStatus] = useState<StoveState>('off');
  const [fanLevel, setFanLevel] = useState<number | null>(null);
  const [powerLevel, setPowerLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Scheduler state
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [semiManualMode, setSemiManualMode] = useState(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState<number | null>(null);
  const [nextScheduledAction, setNextScheduledAction] = useState<NextScheduledAction | null>(null);

  // Error monitoring states
  const [errorCode, setErrorCode] = useState(0);
  const [errorDescription, setErrorDescription] = useState('');
  const previousErrorCode = useRef(0);
  const [pelletLow, setPelletLow] = useState(false);

  // Maintenance states
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Staleness state — derived from proxy data_freshness field
  const [isStale, setIsStale] = useState(false);
  const [lastPollAt, setLastPollAt] = useState<Date | null>(null);
  // ROADMAP M78: a failed read must not turn into "off" — the stove may be burning.
  const [unreachable, setUnreachable] = useState(false);
  const hasReading = useRef(false);

  // Staleness object: populated when STALE or when lastPollAt is available
  const staleness: StalenessInfo | null = isStale
    ? { isStale: true, cachedAt: lastPollAt, ageSeconds: lastPollAt ? Math.floor((Date.now() - lastPollAt.getTime()) / 1000) : 0 }
    : lastPollAt
      ? { isStale: false, cachedAt: lastPollAt, ageSeconds: Math.floor((Date.now() - lastPollAt.getTime()) / 1000) }
      : null;

  // Derived timestamp — milliseconds since epoch for LastUpdated component
  const lastUpdatedAt: number | null = lastPollAt ? lastPollAt.getTime() : null;

  // Derived state — exact equality against proxy StoveState values
  const isAccesa = status === 'working' || status === 'igniting' || status === 'modulating';
  const isSpenta = status === 'off' || status === 'alarm' || status === 'standby';
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;

  const fetchSchedulerMode = async () => {
    try {
      const mode = await getFullSchedulerMode();
      setSchedulerEnabled(mode.enabled);
      setSemiManualMode(mode.semiManual || false);
      // ISO string → ms (Number(iso) was NaN → "Invalid Date" in the hero)
      setReturnToAutoAt(mode.returnToAutoAt ? Date.parse(mode.returnToAutoAt) : null);

      if (mode.enabled && !mode.semiManual) {
        const nextAction = await getNextScheduledAction();
        setNextScheduledAction(nextAction);
      } else {
        setNextScheduledAction(null);
      }
    } catch (err) {
      if (isFetchInterrupted(err)) return;
      console.error('Errore modalità scheduler:', err);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const status = await getMaintenanceStatus();
      setMaintenanceStatus(status);
    } catch (err) {
      // ROADMAP M55: a navigation cancels in-flight fetches ("Failed to fetch")
      if (isFetchInterrupted(err)) return;
      console.error('Errore stato manutenzione:', err);
    }
  };

  // Refs to avoid stale closures in WS useEffect (per Research pitfall 2)
  const fetchSchedulerModeRef = useRef(fetchSchedulerMode);
  fetchSchedulerModeRef.current = fetchSchedulerMode;
  const fetchMaintenanceStatusRef = useRef(fetchMaintenanceStatus);
  fetchMaintenanceStatusRef.current = fetchMaintenanceStatus;

  // WS subscription: primary data channel (MIG-01)
  useEffect(() => {
    if (!isWsConnected) return;

    const handleMessage = (raw: unknown) => {
      const data = raw as ThermorossiData;

      // Map WS fields to hook state — ThermorossiData is now ThermorossiStatusResponse
      // so stove_state is already StoveState (no cast needed)
      setStatus(data.stove_state);
      hasReading.current = true;
      setUnreachable(false);
      setFanLevel(data.fan_level);
      setPowerLevel(data.power_level);

      // Use data_freshness and last_poll_at from WS payload (proxy-shaped)
      setIsStale(data.data_freshness === 'STALE');
      setLastPollAt(data.last_poll_at ? new Date(data.last_poll_at) : new Date());
      setPelletLow(data.pellet_low === true);

      // Error handling — identical logic to HTTP path (per D-02)
      if (data.stove_state === 'alarm') {
        const code = data.error_code ?? 0;
        const desc = data.error_description ?? '';
        setErrorCode(code);
        setErrorDescription(desc);
        if (code !== 0) {
          void logError(code, desc, { status: data.stove_state, source: 'status_monitor' });
          if (shouldNotify(code, previousErrorCode.current)) {
            // TODO: send push notification (same as HTTP path)
          }
        }
        previousErrorCode.current = code;
      } else {
        setErrorCode(0);
        setErrorDescription('');
        previousErrorCode.current = 0;
      }

      // Clear initial loading (per Research pitfall 4)
      setInitialLoading(false);

      // Trigger side-fetches via refs to avoid stale closure (per D-06, D-07)
      void fetchSchedulerModeRef.current();
      void fetchMaintenanceStatusRef.current();
    };

    subscribe('thermorossi', handleMessage);
    return () => { unsubscribe('thermorossi', handleMessage); };
  }, [isWsConnected, subscribe, unsubscribe]);

  const fetchStatusAndUpdate = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.status);
      if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
      const json = await res.json() as ThermorossiStatusResponse;

      const { stove_state, power_level, fan_level, data_freshness, last_poll_at, error_code, error_description } = json;

      setStatus(stove_state);
      hasReading.current = true;
      setUnreachable(false);
      setFanLevel(fan_level);
      setPowerLevel(power_level);
      setIsStale(data_freshness === 'STALE');
      setLastPollAt(last_poll_at ? new Date(last_poll_at) : null);
      setPelletLow(json.pellet_low === true);

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
    } catch (err) {
      if (isFetchInterrupted(err)) return;
      console.error('Errore stato:', err);
      // Keep the last known state; with no reading at all the state is unknown, not "off".
      setUnreachable(true);
      if (!hasReading.current) setStatus('unknown');
    } finally {
      setInitialLoading(false);
    }
  };

  // Ref: a new fetchStatusAndUpdate per render in the deps re-ran this effect after
  // every status update, polling in a loop once a command had been synced
  const fetchStatusAndUpdateRef = useRef(fetchStatusAndUpdate);
  fetchStatusAndUpdateRef.current = fetchStatusAndUpdate;

  // Refresh status when background sync command completes
  useEffect(() => {
    if (lastSyncedCommand) {
      void fetchStatusAndUpdateRef.current();
    }
  }, [lastSyncedCommand]);

  // Polling fallback: suppressed when WS is live (per D-01), alwaysActive preserved (per D-08)
  useAdaptivePolling({
    callback: fetchStatusAndUpdate,
    interval: isWsConnected ? null : 60000,
    alwaysActive: true,
    immediate: true,
  });

  // ROADMAP M15: WS already OPEN at mount → polling skips `immediate` (interval=null)
  // and an empty backend cache sends no snapshot. Fetch once if no WS data came in
  // time (delayed, so a late HTTP response cannot overwrite a fresher snapshot).
  const initialLoadingRef = useRef(initialLoading);
  initialLoadingRef.current = initialLoading;
  useEffect(() => {
    if (!isWsConnected) return;
    const id = setTimeout(() => {
      if (initialLoadingRef.current) void fetchStatusAndUpdate();
    }, WS_SNAPSHOT_GRACE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    pelletLow,

    // Maintenance state
    maintenanceStatus,
    cleaningInProgress,

    loadingMessage,

    // PWA state
    isOnline,
    hasPendingCommands,
    pendingCommands,
    staleness,
    unreachable,

    // Timestamp
    lastUpdatedAt,

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
