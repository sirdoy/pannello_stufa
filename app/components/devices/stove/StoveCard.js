'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getFullSchedulerMode, getNextScheduledAction } from '@/lib/schedulerService';
import { clearSemiManualMode } from '@/lib/schedulerApiClient';
import { STOVE_ROUTES } from '@/lib/routes';
import { logStoveAction, logSchedulerAction } from '@/lib/logService';
import { logError, shouldNotify, sendErrorNotification, sendErrorPushNotification } from '@/lib/errorMonitor';
import { useVersion } from '@/app/context/VersionContext';
import { getMaintenanceStatus, confirmCleaning } from '@/lib/maintenanceService';
import { isSandboxEnabled, isLocalEnvironment } from '@/lib/sandboxService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import ControlButton from '../../ui/ControlButton';
import Skeleton from '../../ui/Skeleton';
import ErrorAlert from '../../ui/ErrorAlert';
import Banner from '../../ui/Banner';
import MaintenanceBar from '../../MaintenanceBar';
import CronHealthBanner from '../../CronHealthBanner';
import Toast from '../../ui/Toast';
import LoadingOverlay from '../../ui/LoadingOverlay';
import CardAccentBar from '../../ui/CardAccentBar';
import { Divider, Heading, Text, EmptyState } from '../../ui';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';

/**
 * StoveCard - Complete stove control for homepage
 * Full StovePanel functionality optimized for mobile-first layout
 */
export default function StoveCard() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  // PWA Background Sync
  const { isOnline } = useOnlineStatus();
  const { queueStoveCommand, hasPendingCommands, pendingCommands, lastSyncedCommand } = useBackgroundSync();

  const [status, setStatus] = useState('...');
  const [fanLevel, setFanLevel] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [semiManualMode, setSemiManualMode] = useState(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState(null);
  const [nextScheduledAction, setNextScheduledAction] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Error monitoring states
  const [errorCode, setErrorCode] = useState(0);
  const [errorDescription, setErrorDescription] = useState('');
  const previousErrorCode = useRef(0);

  // Maintenance states
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);

  // Sandbox mode
  const [sandboxMode, setSandboxMode] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Firebase connection tracking
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const lastFirebaseUpdateRef = useRef(null);

  // Refs for tracking previous values (for Firebase sync on external changes)
  const previousStatusRef = useRef(null);
  const previousFanLevelRef = useRef(null);
  const previousPowerLevelRef = useRef(null);

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
      setReturnToAutoAt(mode.returnToAutoAt || null);

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

  const pollingStartedRef = useRef(false);

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
          await sendErrorNotification(newErrorCode, newErrorDescription);

          // Push notification (to all user devices)
          if (user?.sub) {
            await sendErrorPushNotification(newErrorCode, newErrorDescription, user.sub);
          }
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
        console.log('[StoveCard] External change detected, syncing to Firebase for multi-device updates');
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
          console.error('[StoveCard] Firebase sync error (non-critical):', syncErr);
          // Non-critical error, don't break the UI update
        }
      }

      // Update refs for next comparison
      previousStatusRef.current = newStatus;
      previousFanLevelRef.current = newFanLevel;
      previousPowerLevelRef.current = newPowerLevel;
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('errore');
    } finally {
      setInitialLoading(false);
    }
  }, [checkVersion, user?.sub]);

  // Show toast when background sync command completes
  useEffect(() => {
    if (lastSyncedCommand) {
      const actionLabels = {
        'stove/ignite': '🔥 Stufa accesa (comando sincronizzato)',
        'stove/shutdown': '🌙 Stufa spenta (comando sincronizzato)',
        'stove/set-power': '⚡ Potenza impostata (comando sincronizzato)',
      };
      const message = actionLabels[lastSyncedCommand.endpoint] || 'Comando sincronizzato';
      setToast({ message, variant: 'success' });
      // Refresh status after sync
      fetchStatusAndUpdate();
    }
  }, [lastSyncedCommand]);

  // Adaptive polling (active only if Firebase fails or for validation)
  useEffect(() => {
    if (pollingStartedRef.current) return;

    // Initial fetch (always)
    fetchStatusAndUpdate();

    pollingStartedRef.current = true;
    let timeoutId = null;

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
        const timeSinceUpdate = lastUpdate ? (now - lastUpdate) / 1000 : Infinity;

        // Stale threshold adapts to polling interval
        const staleThreshold = usePollingFallback ? 30 : (status !== 'spento' ? 30 : 90);

        if (!isFirebaseConnected || timeSinceUpdate > staleThreshold || usePollingFallback) {
          console.log(`[StoveCard] Adaptive polling (${interval}ms) - ${usePollingFallback ? 'fallback' : status !== 'spento' ? 'stove on' : 'stove off'}`);
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

      if (!connected) {
        console.warn('[StoveCard] Firebase disconnected, activating polling fallback');
        setUsePollingFallback(true);
      } else {
        console.log('[StoveCard] Firebase connected');
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
          console.log('[StoveCard] Firebase state update:', data);

          // Update all state from Firebase
          if (data.status !== undefined) setStatus(data.status);
          if (data.fanLevel !== undefined) setFanLevel(data.fanLevel);
          if (data.powerLevel !== undefined) setPowerLevel(data.powerLevel);
          if (data.errorCode !== undefined) setErrorCode(data.errorCode);
          if (data.errorDescription !== undefined) setErrorDescription(data.errorDescription);

          // Track last update time
          lastFirebaseUpdateRef.current = new Date();

          // Fetch related data (scheduler mode, maintenance) on state change
          fetchSchedulerMode();
          fetchMaintenanceStatus();
          checkVersion();
        }
      },
      (error) => {
        console.error('[StoveCard] Firebase listener error:', error);
        // Activate polling fallback on listener error
        setUsePollingFallback(true);
      }
    );

    return () => unsubscribe();
  }, [checkVersion]);

  // Listener Firebase per Sandbox Mode - sync real-time
  useEffect(() => {
    if (!isLocalEnvironment()) return;

    let unsubscribeState = null;
    let unsubscribeMaintenance = null;
    let unsubscribeError = null;

    async function setupSandboxListeners() {
      const enabled = await isSandboxEnabled();

      if (enabled) {
        console.log('[Sandbox] Real-time sync attivo');

        // Listener per stato stufa
        const stateRef = ref(db, 'sandbox/stoveState');
        unsubscribeState = onValue(stateRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log('[Sandbox] Aggiornamento stato:', data);
            setStatus(data.status || '...');
            setFanLevel(data.fan ?? null);
            setPowerLevel(data.power ?? null);
          }
        });

        // Listener per errori
        const errorRef = ref(db, 'sandbox/error');
        unsubscribeError = onValue(errorRef, (snapshot) => {
          const error = snapshot.val();
          console.log('[Sandbox] Aggiornamento errore:', error);
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
            console.log('[Sandbox] Aggiornamento manutenzione:', data);
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
  }, [sandboxMode]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchStatusAndUpdate();
    setRefreshing(false);
  };

  const handleFanChange = async (e) => {
    const level = Number(e.target.value);
    setLoadingMessage('Modifica livello ventola...');
    setLoading(true);
    setFanLevel(level);

    const response = await fetch(STOVE_ROUTES.setFan, {
      method: 'POST',
      body: JSON.stringify({ level, source: 'manual' }),
    });

    const data = await response.json();

    // Se la modalità è cambiata, mostra notifica e aggiorna UI immediatamente
    if (data.modeChanged) {
      console.log('[StoveCard] Modalità cambiata in semi-manuale', data);

      setToast({
        message: 'Modalità cambiata in Semi-Manuale',
        icon: '⚙️',
        variant: 'warning'
      });

      // Aggiorna immediatamente lo stato locale (non aspettare Firebase)
      setSemiManualMode(true);
      setReturnToAutoAt(data.returnToAutoAt || null);
      setNextScheduledAction(null);
    }

    await logStoveAction.setFan(level);
    // Aggiorna status dopo il comando
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handlePowerChange = async (e) => {
    const level = Number(e.target.value);
    setLoadingMessage('Modifica livello potenza...');
    setLoading(true);
    setPowerLevel(level);

    const response = await fetch(STOVE_ROUTES.setPower, {
      method: 'POST',
      body: JSON.stringify({ level, source: 'manual' }),
    });

    const data = await response.json();

    // Se la modalità è cambiata, mostra notifica e aggiorna UI immediatamente
    if (data.modeChanged) {
      console.log('[StoveCard] Modalità cambiata in semi-manuale', data);

      setToast({
        message: 'Modalità cambiata in Semi-Manuale',
        icon: '⚙️',
        variant: 'warning'
      });

      // Aggiorna immediatamente lo stato locale (non aspettare Firebase)
      setSemiManualMode(true);
      setReturnToAutoAt(data.returnToAutoAt || null);
      setNextScheduledAction(null);
    }

    await logStoveAction.setPower(level);
    // Aggiorna status dopo il comando
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const fanOptions = [1, 2, 3, 4, 5, 6].map(level => ({
    value: level,
    label: `Livello ${level}`
  }));

  const powerOptions = [1, 2, 3, 4, 5].map(level => ({
    value: level,
    label: `Livello ${level}`
  }));

  const handleIgnite = async () => {
    // If offline, queue command for background sync
    if (!isOnline) {
      await queueStoveCommand('ignite', { source: 'manual' });
      setToast({
        message: 'Comando in coda - verrà eseguito al ritorno della connessione',
        variant: 'warning',
      });
      return;
    }

    setLoadingMessage('Accensione stufa...');
    setLoading(true);
    await fetch(STOVE_ROUTES.ignite, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.ignite();
    // Aggiorna status dopo il comando
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handleShutdown = async () => {
    // If offline, queue command for background sync
    if (!isOnline) {
      await queueStoveCommand('shutdown', { source: 'manual' });
      setToast({
        message: 'Comando in coda - verrà eseguito al ritorno della connessione',
        variant: 'warning',
      });
      return;
    }

    setLoadingMessage('Spegnimento stufa...');
    setLoading(true);
    await fetch(STOVE_ROUTES.shutdown, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.shutdown();
    // Aggiorna status dopo il comando
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handleClearSemiManual = async () => {
    await clearSemiManualMode();
    await logSchedulerAction.clearSemiManual();
    setSemiManualMode(false);
    setReturnToAutoAt(null);

    const nextAction = await getNextScheduledAction();
    setNextScheduledAction(nextAction);
  };

  const handleConfirmCleaning = async () => {
    setCleaningInProgress(true);
    try {
      await confirmCleaning(user);
      await fetchMaintenanceStatus();
    } catch (err) {
      console.error('Errore conferma pulizia:', err);
    } finally {
      setCleaningInProgress(false);
    }
  };

  // Status mapping: technical name → user-friendly display (Ember Noir Design)
  const getStatusInfo = (status) => {
    if (!status) {
      return {
        label: 'CARICAMENTO...',
        icon: '⏳',
        textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        bgColor: 'bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/80',
        borderColor: 'border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
        boxBgColor: 'bg-slate-800/80 [html:not(.dark)_&]:bg-white/80',
        boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
        boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
        glowColor: '',
        animated: true,
      };
    }

    const statusUpper = status.toUpperCase();

    // 🔥 WORK - In funzione (Ember glow - warm copper/amber)
    if (statusUpper.includes('WORK')) {
      return {
        label: 'IN FUNZIONE',
        icon: '🔥',
        textColor: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
        bgColor: 'bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30 [html:not(.dark)_&]:from-ember-100/80 [html:not(.dark)_&]:via-ember-50/90 [html:not(.dark)_&]:to-flame-100/70',
        borderColor: 'border-ember-500/40 [html:not(.dark)_&]:border-ember-300',
        boxBgColor: 'bg-ember-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ember-100/80',
        boxLabelColor: 'text-ember-300 [html:not(.dark)_&]:text-ember-600',
        boxValueColor: 'text-ember-100 [html:not(.dark)_&]:text-ember-700',
        boxSuffixColor: 'text-ember-400/70 [html:not(.dark)_&]:text-ember-500',
        glowColor: 'shadow-ember-glow [html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.15)]',
        animated: true,
        pulse: true,
      };
    }

    // ❄️ OFF - Spenta (Cool slate)
    if (statusUpper.includes('OFF')) {
      return {
        label: 'SPENTA',
        icon: '❄️',
        textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        bgColor: 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 [html:not(.dark)_&]:from-slate-100/80 [html:not(.dark)_&]:via-white/90 [html:not(.dark)_&]:to-slate-100/70',
        borderColor: 'border-slate-600/40 [html:not(.dark)_&]:border-slate-200',
        boxBgColor: 'bg-slate-800/60 backdrop-blur-xl [html:not(.dark)_&]:bg-white/80',
        boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
        boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
        glowColor: '',
        animated: false,
      };
    }

    // 🚀 START - Avvio in corso (Ocean blue)
    if (statusUpper.includes('START')) {
      return {
        label: 'AVVIO IN CORSO',
        icon: '🚀',
        textColor: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30 [html:not(.dark)_&]:from-ocean-100/80 [html:not(.dark)_&]:via-ocean-50/90 [html:not(.dark)_&]:to-ocean-100/70',
        borderColor: 'border-ocean-500/40 [html:not(.dark)_&]:border-ocean-300',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ocean-100/80',
        boxLabelColor: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-600',
        boxValueColor: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-700',
        boxSuffixColor: 'text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500',
        glowColor: 'shadow-[0_0_30px_rgba(67,125,174,0.3)] [html:not(.dark)_&]:shadow-[0_0_20px_rgba(67,125,174,0.15)]',
        animated: true,
        pulse: true,
      };
    }

    // 💤 STANDBY/WAIT - In attesa (Warning amber)
    if (statusUpper.includes('STANDBY') || statusUpper.includes('WAIT')) {
      return {
        label: 'IN ATTESA',
        icon: '💤',
        textColor: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
        bgColor: 'bg-gradient-to-br from-warning-900/30 via-slate-900/60 to-warning-800/20 [html:not(.dark)_&]:from-warning-100/80 [html:not(.dark)_&]:via-warning-50/90 [html:not(.dark)_&]:to-warning-100/70',
        borderColor: 'border-warning-500/40 [html:not(.dark)_&]:border-warning-300',
        boxBgColor: 'bg-warning-900/40 backdrop-blur-xl [html:not(.dark)_&]:bg-warning-100/80',
        boxLabelColor: 'text-warning-300 [html:not(.dark)_&]:text-warning-600',
        boxValueColor: 'text-warning-100 [html:not(.dark)_&]:text-warning-700',
        boxSuffixColor: 'text-warning-400/70 [html:not(.dark)_&]:text-warning-500',
        glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.2)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(234,179,8,0.1)]',
        animated: true,
      };
    }

    // ⚠️ ERROR - Errore (Danger red)
    if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) {
      return {
        label: 'ERRORE',
        icon: '⚠️',
        textColor: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
        bgColor: 'bg-gradient-to-br from-danger-900/40 via-slate-900/60 to-danger-800/30 [html:not(.dark)_&]:from-danger-100/80 [html:not(.dark)_&]:via-danger-50/90 [html:not(.dark)_&]:to-danger-100/70',
        borderColor: 'border-danger-500/50 [html:not(.dark)_&]:border-danger-300',
        boxBgColor: 'bg-danger-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-danger-100/80',
        boxLabelColor: 'text-danger-300 [html:not(.dark)_&]:text-danger-600',
        boxValueColor: 'text-danger-100 [html:not(.dark)_&]:text-danger-700',
        boxSuffixColor: 'text-danger-400/70 [html:not(.dark)_&]:text-danger-500',
        glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.3)] [html:not(.dark)_&]:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        animated: true,
        pulse: true,
      };
    }

    // 🔄 CLEANING - Pulizia (Sage green)
    if (statusUpper.includes('CLEAN')) {
      return {
        label: 'PULIZIA',
        icon: '🔄',
        textColor: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        bgColor: 'bg-gradient-to-br from-sage-900/40 via-slate-900/60 to-sage-800/30 [html:not(.dark)_&]:from-sage-100/80 [html:not(.dark)_&]:via-sage-50/90 [html:not(.dark)_&]:to-sage-100/70',
        borderColor: 'border-sage-500/40 [html:not(.dark)_&]:border-sage-300',
        boxBgColor: 'bg-sage-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-sage-100/80',
        boxLabelColor: 'text-sage-300 [html:not(.dark)_&]:text-sage-600',
        boxValueColor: 'text-sage-100 [html:not(.dark)_&]:text-sage-700',
        boxSuffixColor: 'text-sage-400/70 [html:not(.dark)_&]:text-sage-500',
        glowColor: 'shadow-[0_0_20px_rgba(96,115,96,0.3)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(96,115,96,0.15)]',
        animated: true,
        pulse: true,
      };
    }

    // 🌡️ MODULATION - Modulazione (Ocean blue)
    if (statusUpper.includes('MODULATION')) {
      return {
        label: 'MODULAZIONE',
        icon: '🌡️',
        textColor: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30 [html:not(.dark)_&]:from-ocean-100/80 [html:not(.dark)_&]:via-ocean-50/90 [html:not(.dark)_&]:to-ocean-100/70',
        borderColor: 'border-ocean-500/40 [html:not(.dark)_&]:border-ocean-300',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ocean-100/80',
        boxLabelColor: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-600',
        boxValueColor: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-700',
        boxSuffixColor: 'text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500',
        glowColor: 'shadow-[0_0_20px_rgba(67,125,174,0.25)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(67,125,174,0.12)]',
        animated: true,
      };
    }

    // Default - Stato sconosciuto
    return {
      label: status.toUpperCase(),
      icon: '❔',
      textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      bgColor: 'bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/80',
      borderColor: 'border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
      boxBgColor: 'bg-slate-800/60 backdrop-blur-xl [html:not(.dark)_&]:bg-white/80',
      boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
      boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
      glowColor: '',
      animated: false,
    };
  };

  const statusUpper = status.toUpperCase();
  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;
  const statusInfo = getStatusInfo(status);

  if (initialLoading) {
    return <Skeleton.StovePanel />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Loading Overlay - Full page blocking */}
      <LoadingOverlay
        show={loading}
        message={loadingMessage}
        icon="🔥"
      />

      {/* Error Alert - Outside card as it's a critical system message */}
      {errorCode !== 0 && (
        <ErrorAlert
          errorCode={errorCode}
          errorDescription={errorDescription}
          showDetailsButton={true}
          showSuggestion={true}
        />
      )}

      {/* Main Status Card - Ember Noir */}
      <Card variant="elevated" padding={false} className="overflow-visible transition-all duration-500">
        <div className="relative">
          {/* Modern Accent Bar with glow effect - pulses when stove is active */}
          <CardAccentBar
            colorTheme="ember"
            animated={true}
            pulse={isAccesa}
            size="md"
          />

          <div className="p-6 sm:p-8">
            {/* Maintenance Cleaning Banner - Inside card */}
            {needsMaintenance && (
              <div className="mb-6">
                <Banner
                  variant="warning"
                  icon="🧹"
                  title="Pulizia Stufa Richiesta"
                  description={
                    <>
                      La stufa ha raggiunto <strong>{maintenanceStatus.currentHours.toFixed(1)} ore</strong> di utilizzo.
                      È necessario effettuare la pulizia prima di poterla riaccendere.
                    </>
                  }
                  actions={
                    <>
                      <Button
                        variant="success"
                        onClick={handleConfirmCleaning}
                        disabled={cleaningInProgress}
                        size="sm"
                      >
                        {cleaningInProgress ? '⏳ Conferma...' : '✓ Ho Pulito'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/stove/maintenance')}
                        size="sm"
                      >
                        ⚙️ Impostazioni
                      </Button>
                    </>
                  }
                />
              </div>
            )}

            {/* Firebase Connection Status */}
            {!isFirebaseConnected && (
              <div className="mb-6">
                <Banner
                  variant="warning"
                  icon="⚠️"
                  title="Connessione Firebase Interrotta"
                  description="Aggiornamenti in tempo reale non disponibili. Dati aggiornati ogni 10 secondi."
                />
              </div>
            )}

            {/* Pending commands banner */}
            {hasPendingCommands && (
              <div className="mb-6">
                <Banner
                  variant="info"
                  icon="⏳"
                  title="Comandi in attesa"
                  description={`${pendingCommands.length} ${pendingCommands.length === 1 ? 'comando' : 'comandi'} in coda. Verranno eseguiti al ripristino della connessione.`}
                />
              </div>
            )}

            {/* Header - Ember Noir style */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl sm:text-3xl">🔥</span>
              <Heading level={2} size="xl" className="font-display">Stufa</Heading>
            </div>

            {/* Main Status Display - Ember Noir Style */}
            <div className="mb-6 relative">
              {/* Sandbox Badge */}
              {sandboxMode && (
                <div className="absolute -top-2 -left-2 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-ocean-500/30 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-ocean-500 to-ocean-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50">
                      <span className="text-xs font-bold font-display">🧪 SANDBOX</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Badge */}
              {errorCode !== 0 && (
                <div className="absolute -top-2 -right-2 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-danger-500/30 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-danger-500 to-danger-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50">
                      <span className="text-xs font-bold font-display">⚠️ ERR {errorCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Display Box - Ember Noir */}
              <div className={`relative ${statusInfo.bgColor} rounded-2xl p-6 sm:p-8 ${statusInfo.glowColor} border ${statusInfo.borderColor} overflow-visible transition-all duration-500`}>
                    {/* Layout: Status Label + Icon + Info Boxes */}
                    <div className="relative">
                      {/* Status Label */}
                      <div className="text-center mb-8 sm:mb-10">
                        <Heading level={3} size="3xl" weight="black" className={`${statusInfo.textColor} tracking-tight uppercase font-display`}>
                          {statusInfo.label}
                        </Heading>
                        {statusInfo.label.toUpperCase() !== status.toUpperCase() && (
                          <Text size="xs" className="text-slate-500 mt-1.5 font-mono opacity-60 tracking-wide">
                            {status}
                          </Text>
                        )}
                      </div>

                      {/* Icon + Info Boxes Container */}
                      <div className="relative flex flex-col items-center">
                        {/* Large Status Icon with Glow Effect */}
                        <div className={`relative mb-[-40px] sm:mb-[-50px] ${statusInfo.pulse ? 'animate-pulse-ember' : ''}`}>
                          {/* Radial glow layer behind icon */}
                          <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-3xl opacity-70 ${statusInfo.bgColor}`}
                            style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }}
                          ></div>
                          <span className="relative text-[120px] sm:text-[140px] drop-shadow-2xl inline-block" style={{ lineHeight: 1 }}>
                            {statusInfo.icon}
                          </span>
                        </div>

                        {/* Two Info Boxes */}
                        <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {/* Fan Level Box */}
                          <div className={`relative overflow-hidden rounded-2xl ${statusInfo.boxBgColor} border border-white/10 [html:not(.dark)_&]:border-slate-200`}>
                            <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-xl sm:text-2xl">💨</span>
                              </div>
                              <Text weight="bold" className={`text-[10px] sm:text-xs font-display ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                                Ventola
                              </Text>
                              <div className="flex items-baseline gap-0.5">
                                <Text weight="black" className={`text-2xl sm:text-3xl font-display ${statusInfo.boxValueColor} leading-none`}>
                                  {fanLevel ?? '-'}
                                </Text>
                                <Text as="span" weight="semibold" className={`text-sm sm:text-base ${statusInfo.boxSuffixColor}`}>/6</Text>
                              </div>
                            </div>
                          </div>

                          {/* Power Level Box */}
                          <div className={`relative overflow-hidden rounded-2xl ${statusInfo.boxBgColor} border border-white/10 [html:not(.dark)_&]:border-slate-200`}>
                            <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-xl sm:text-2xl">⚡</span>
                              </div>
                              <Text weight="bold" className={`text-[10px] sm:text-xs font-display ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                                Potenza
                              </Text>
                              <div className="flex items-baseline gap-0.5">
                                <Text weight="black" className={`text-2xl sm:text-3xl font-display ${statusInfo.boxValueColor} leading-none`}>
                                  {powerLevel ?? '-'}
                                </Text>
                                <Text as="span" weight="semibold" className={`text-sm sm:text-base ${statusInfo.boxSuffixColor}`}>/5</Text>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>

            {/* PRIMARY ACTIONS - Ember Noir buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="ember"
                size="lg"
                icon="🔥"
                onClick={handleIgnite}
                disabled={loading || isAccesa || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold font-display"
              >
                ACCENDI
              </Button>
              <Button
                variant="subtle"
                size="lg"
                icon="❄️"
                onClick={handleShutdown}
                disabled={loading || isSpenta}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold font-display"
              >
                SPEGNI
              </Button>
            </div>

            {/* Separator */}
            <Divider label="Modalità Controllo" variant="gradient" spacing="large" />

            {/* Mode Indicator - Ember Noir */}
            <div className="flex flex-col gap-4 p-5 sm:p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 relative overflow-hidden [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  schedulerEnabled && semiManualMode ? 'bg-warning-900/40 border-2 border-warning-500/50 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300' :
                  schedulerEnabled ? 'bg-sage-900/40 border-2 border-sage-500/50 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:border-sage-300' :
                  'bg-ember-900/40 border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300'
                }`}>
                  <span className="text-2xl sm:text-3xl">
                    {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Text weight="bold" className={`text-base sm:text-lg font-display ${
                    schedulerEnabled && semiManualMode ? 'text-warning-400 [html:not(.dark)_&]:text-warning-600' :
                    schedulerEnabled ? 'text-sage-400 [html:not(.dark)_&]:text-sage-600' :
                    'text-ember-400 [html:not(.dark)_&]:text-ember-600'
                  }`}>
                    {schedulerEnabled && semiManualMode ? 'Semi-manuale' : schedulerEnabled ? 'Automatica' : 'Manuale'}
                  </Text>
                  <Text variant="tertiary" size="sm" className="mt-1 break-words">
                    {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                      (() => {
                        const date = new Date(returnToAutoAt);
                        const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                        return `Ritorno auto: ${time} del ${day}`;
                      })()
                    ) : schedulerEnabled && nextScheduledAction ? (
                      <>
                        <Text as="span" weight="semibold" className={nextScheduledAction.action === 'ignite' ? 'text-ember-400 [html:not(.dark)_&]:text-ember-600' : 'text-slate-300 [html:not(.dark)_&]:text-slate-600'}>
                          {nextScheduledAction.action === 'ignite' ? '🔥 Accensione' : '❄️ Spegnimento'}
                        </Text>
                        {' alle '}
                        <Text as="span" weight="medium" className="text-slate-300 [html:not(.dark)_&]:text-slate-600">
                          {(() => {
                            const date = new Date(nextScheduledAction.timestamp);
                            const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                            return `${time} del ${day}`;
                          })()}
                        </Text>
                        {nextScheduledAction.action === 'ignite' && (
                          <Text as="span" variant="tertiary" className="block sm:inline"> • P{nextScheduledAction.power}, V{nextScheduledAction.fan}</Text>
                        )}
                      </>
                    ) : schedulerEnabled ? (
                      'Controllo automatico attivo'
                    ) : (
                      'Controllo manuale attivo'
                    )}
                  </Text>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {schedulerEnabled && semiManualMode && (
                  <button
                    onClick={handleClearSemiManual}
                    className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-display text-warning-300 bg-warning-900/30 hover:bg-warning-900/50 border border-warning-500/40 hover:border-warning-500/60 transition-all duration-200 active:scale-95 [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:hover:bg-warning-200/80 [html:not(.dark)_&]:border-warning-300 [html:not(.dark)_&]:hover:border-warning-400"
                  >
                    ↩️ Torna in Automatico
                  </button>
                )}
                <button
                  onClick={() => router.push('/stove/scheduler')}
                  className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-display text-ocean-300 bg-ocean-900/30 hover:bg-ocean-900/50 border border-ocean-500/40 hover:border-ocean-500/60 transition-all duration-200 active:scale-95 [html:not(.dark)_&]:text-ocean-700 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:hover:bg-ocean-200/80 [html:not(.dark)_&]:border-ocean-300 [html:not(.dark)_&]:hover:border-ocean-400"
                >
                  Configura Pianificazione
                </button>
              </div>
            </div>

            {/* Cron Health Warning */}
            <div className="mt-4 sm:mt-6">
              <CronHealthBanner variant="inline" />
            </div>

            {/* Maintenance Status */}
            {maintenanceStatus && (
              <>
                <Divider label="Manutenzione" variant="gradient" spacing="large" />
                <MaintenanceBar maintenanceStatus={maintenanceStatus} />
              </>
            )}

            {/* Regolazioni - Visibili SOLO quando stufa è in WORK */}
            {status?.toUpperCase().includes('WORK') && (
              <>
                <Divider label="Regolazioni" variant="gradient" spacing="large" />

                <div className="space-y-4">
                  {/* Info badge quando in modalità automatica */}
                  {schedulerEnabled && !semiManualMode && (
                    <Banner
                      variant="info"
                      icon="ℹ️"
                      description="La modifica attiverà la modalità Semi-Manuale"
                      compact
                    />
                  )}

                  {/* Ventilazione Control - Ember Noir */}
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ocean-900/50 flex items-center justify-center border-2 border-ocean-500/50 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300">
                        <span className="text-xl sm:text-2xl">💨</span>
                      </div>
                      <Heading level={4} size="md" className="font-display">Ventilazione</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="ocean"
                        onClick={() => {
                          if (fanLevel > 1) {
                            const newLevel = fanLevel - 1;
                            handleFanChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!fanLevel || fanLevel <= 1}
                      />

                      {/* Display Livello Centrale */}
                      <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                        <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black font-display text-ocean-400 leading-none [html:not(.dark)_&]:text-ocean-600">
                            {fanLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/6</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="ocean"
                        onClick={() => {
                          if (fanLevel < 6) {
                            const newLevel = fanLevel + 1;
                            handleFanChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!fanLevel || fanLevel >= 6}
                      />
                    </div>
                  </div>

                  {/* Potenza Control - Ember Noir */}
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ember-900/50 flex items-center justify-center border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300">
                        <span className="text-xl sm:text-2xl">⚡</span>
                      </div>
                      <Heading level={4} size="md" className="font-display">Potenza</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="ember"
                        onClick={() => {
                          if (powerLevel > 1) {
                            const newLevel = powerLevel - 1;
                            handlePowerChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!powerLevel || powerLevel <= 1}
                      />

                      {/* Display Livello Centrale */}
                      <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                        <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black font-display text-ember-400 leading-none [html:not(.dark)_&]:text-ember-600">
                            {powerLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/5</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="ember"
                        onClick={() => {
                          if (powerLevel < 5) {
                            const newLevel = powerLevel + 1;
                            handlePowerChange({ target: { value: newLevel.toString() } });
                          }
                        }}
                        disabled={!powerLevel || powerLevel >= 5}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          variant={toast.variant}
          duration={3000}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
