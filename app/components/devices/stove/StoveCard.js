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
import { Divider, Heading, Text, EmptyState } from '../../ui';

/**
 * StoveCard - Complete stove control for homepage
 * Full StovePanel functionality optimized for mobile-first layout
 */
export default function StoveCard() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

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

  // Status mapping: technical name → user-friendly display (Frame 3 style)
  const getStatusInfo = (status) => {
    if (!status) {
      return {
        label: 'CARICAMENTO...',
        icon: '⏳',
        textColor: 'text-neutral-700',
        bgColor: 'bg-gradient-to-b from-neutral-50 to-neutral-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-neutral-100/90 dark:bg-neutral-800/90',
        boxLabelColor: 'text-neutral-700 dark:text-neutral-300',
        boxValueColor: 'text-neutral-900 dark:text-white',
        boxSuffixColor: 'text-neutral-700 dark:text-neutral-400',
        animated: true,
      };
    }

    const statusUpper = status.toUpperCase();

    // 🔥 WORK - In funzione
    if (statusUpper.includes('WORK')) {
      return {
        label: 'IN FUNZIONE',
        icon: '🔥',
        textColor: 'text-success-800',
        bgColor: 'bg-gradient-to-b from-success-50 to-success-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-success-100/90 dark:bg-success-900/80',
        boxLabelColor: 'text-success-800 dark:text-success-100',
        boxValueColor: 'text-success-950 dark:text-white',
        boxSuffixColor: 'text-success-700 dark:text-success-200',
        animated: true,
        pulse: true,
      };
    }

    // ❄️ OFF - Spenta
    if (statusUpper.includes('OFF')) {
      return {
        label: 'SPENTA',
        icon: '❄️',
        textColor: 'text-info-700',
        bgColor: 'bg-gradient-to-b from-sky-50 to-sky-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-sky-100/90 dark:bg-sky-900/80',
        boxLabelColor: 'text-sky-800 dark:text-sky-100',
        boxValueColor: 'text-sky-950 dark:text-white',
        boxSuffixColor: 'text-sky-700 dark:text-sky-200',
        animated: false,
      };
    }

    // 🚀 START - Avvio in corso
    if (statusUpper.includes('START')) {
      return {
        label: 'AVVIO IN CORSO',
        icon: '🚀',
        textColor: 'text-info-700',
        bgColor: 'bg-gradient-to-b from-info-50 to-info-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-info-100/90 dark:bg-info-900/80',
        boxLabelColor: 'text-info-800 dark:text-info-100',
        boxValueColor: 'text-info-950 dark:text-white',
        boxSuffixColor: 'text-info-700 dark:text-info-200',
        animated: true,
        pulse: true,
      };
    }

    // 💤 STANDBY/WAIT - In attesa
    if (statusUpper.includes('STANDBY') || statusUpper.includes('WAIT')) {
      return {
        label: 'IN ATTESA',
        icon: '💤',
        textColor: 'text-warning-700',
        bgColor: 'bg-gradient-to-b from-warning-50 to-warning-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-warning-100/90 dark:bg-warning-900/80',
        boxLabelColor: 'text-warning-800 dark:text-warning-100',
        boxValueColor: 'text-warning-950 dark:text-white',
        boxSuffixColor: 'text-warning-700 dark:text-warning-200',
        animated: true,
      };
    }

    // ⚠️ ERROR - Errore
    if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) {
      return {
        label: 'ERRORE',
        icon: '⚠️',
        textColor: 'text-primary-700',
        bgColor: 'bg-gradient-to-b from-primary-50 to-primary-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-primary-100/90 dark:bg-primary-900/80',
        boxLabelColor: 'text-primary-800 dark:text-primary-100',
        boxValueColor: 'text-primary-950 dark:text-white',
        boxSuffixColor: 'text-primary-700 dark:text-primary-200',
        animated: true,
        pulse: true,
      };
    }

    // 🔄 CLEANING - Pulizia
    if (statusUpper.includes('CLEAN')) {
      return {
        label: 'PULIZIA',
        icon: '🔄',
        textColor: 'text-accent-700',
        bgColor: 'bg-gradient-to-b from-accent-50 to-accent-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-accent-100/90 dark:bg-accent-900/80',
        boxLabelColor: 'text-accent-800 dark:text-accent-100',
        boxValueColor: 'text-accent-950 dark:text-white',
        boxSuffixColor: 'text-accent-700 dark:text-accent-200',
        animated: true,
        pulse: true,
      };
    }

    // 🌡️ MODULATION - Modulazione
    if (statusUpper.includes('MODULATION')) {
      return {
        label: 'MODULAZIONE',
        icon: '🌡️',
        textColor: 'text-info-700',
        bgColor: 'bg-gradient-to-b from-info-50 to-info-100',
        glassColor: '#d1d5db',
        boxBgColor: 'bg-info-100/90 dark:bg-info-900/80',
        boxLabelColor: 'text-info-800 dark:text-info-100',
        boxValueColor: 'text-info-950 dark:text-white',
        boxSuffixColor: 'text-info-700 dark:text-info-200',
        animated: true,
      };
    }

    // Default - Stato sconosciuto
    return {
      label: status.toUpperCase(),
      icon: '❔',
      textColor: 'text-neutral-700',
      bgColor: 'bg-gradient-to-b from-neutral-50 to-neutral-100',
      glassColor: '#d1d5db',
      boxBgColor: 'bg-neutral-100/90 dark:bg-neutral-800/90',
      boxLabelColor: 'text-neutral-700 dark:text-neutral-300',
      boxValueColor: 'text-neutral-900 dark:text-white',
      boxSuffixColor: 'text-neutral-700 dark:text-neutral-400',
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

      {/* Main Status Card - Liquid Glass Pro */}
      <Card liquid className="overflow-visible transition-all duration-500">
        <div className="relative">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Maintenance Cleaning Banner - Inside card */}
            {needsMaintenance && (
              <div className="mb-6">
                <Banner
                  liquid
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
                        liquid
                        variant="success"
                        onClick={handleConfirmCleaning}
                        disabled={cleaningInProgress}
                        size="sm"
                      >
                        {cleaningInProgress ? '⏳ Conferma...' : '✓ Ho Pulito'}
                      </Button>
                      <Button
                        liquid
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
                  liquid
                  variant="warning"
                  icon="⚠️"
                  title="Connessione Firebase Interrotta"
                  description="Aggiornamenti in tempo reale non disponibili. Dati aggiornati ogni 10 secondi."
                />
              </div>
            )}

            {/* Header - Simplified without refresh button */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl sm:text-3xl">🔥</span>
              <Heading level={2} size="xl">Stufa</Heading>
            </div>

            {/* Main Status Display - Frame 3 Style */}
            <div className="mb-6 relative">
              {/* Sandbox Badge */}
              {sandboxMode && (
                <div className="absolute -top-2 -left-2 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 text-white px-3 py-1.5 rounded-full shadow-elevated-lg ring-2 ring-white/40">
                      <span className="text-xs font-bold">🧪 SANDBOX</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Badge */}
              {errorCode !== 0 && (
                <div className="absolute -top-2 -right-2 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 text-white px-3 py-1.5 rounded-full shadow-elevated-lg ring-2 ring-white/40">
                      <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Riquadro COLORATO con stato/icona/valori */}
              <div className={`relative ${statusInfo.bgColor} rounded-2xl p-6 sm:p-8 shadow-liquid hover:shadow-liquid-lg overflow-visible transition-all duration-500`}>
                    {/* Layout Frame 3: Testo + Icona + Box glassmorphism sovrapposti */}
                    <div className="relative">
                      {/* Testo stato in alto */}
                      <div className="text-center mb-8 sm:mb-10">
                        <h3 className={`text-2xl sm:text-3xl font-black ${statusInfo.textColor} tracking-tight uppercase`}>
                          {statusInfo.label}
                        </h3>
                        {statusInfo.label.toUpperCase() !== status.toUpperCase() && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-mono opacity-40 tracking-wide">
                            {status}
                          </p>
                        )}
                      </div>

                      {/* Container per icona e box glassmorphism sovrapposti */}
                      <div className="relative flex flex-col items-center">
                        {/* Icona grande (z-0, dietro) */}
                        <div className={`relative mb-[-40px] sm:mb-[-50px] ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                          <span className="text-[120px] sm:text-[140px] drop-shadow-xl inline-block" style={{ lineHeight: 1 }}>
                            {statusInfo.icon}
                          </span>
                        </div>

                        {/* Due box glassmorphism (z-10, davanti all'icona) */}
                        <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {/* Box Ventola */}
                          <div className={`relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl ${statusInfo.boxBgColor} border border-white/30 dark:border-white/20`}>
                            <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-xl sm:text-2xl">💨</span>
                              </div>
                              <p className={`text-[10px] sm:text-xs font-bold ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                                Ventola
                              </p>
                              <div className="flex items-baseline gap-0.5">
                                <p className={`text-2xl sm:text-3xl font-black ${statusInfo.boxValueColor} leading-none`}>
                                  {fanLevel ?? '-'}
                                </p>
                                <span className={`text-sm sm:text-base ${statusInfo.boxSuffixColor} font-semibold`}>/6</span>
                              </div>
                            </div>
                          </div>

                          {/* Box Potenza */}
                          <div className={`relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl ${statusInfo.boxBgColor} border border-white/30 dark:border-white/20`}>
                            <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-xl sm:text-2xl">⚡</span>
                              </div>
                              <p className={`text-[10px] sm:text-xs font-bold ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                                Potenza
                              </p>
                              <div className="flex items-baseline gap-0.5">
                                <p className={`text-2xl sm:text-3xl font-black ${statusInfo.boxValueColor} leading-none`}>
                                  {powerLevel ?? '-'}
                                </p>
                                <span className={`text-sm sm:text-base ${statusInfo.boxSuffixColor} font-semibold`}>/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>

            {/* PRIMARY ACTIONS - Always visible */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                liquid
                variant="success"
                size="lg"
                icon="🔥"
                onClick={handleIgnite}
                disabled={loading || isAccesa || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold"
              >
                ACCENDI
              </Button>
              <Button
                liquid
                variant="outline"
                size="lg"
                icon="❄️"
                onClick={handleShutdown}
                disabled={loading || isSpenta}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold"
              >
                SPEGNI
              </Button>
            </div>

            {/* Separator */}
            <Divider label="Modalità Controllo" variant="gradient" spacing="large" />

            {/* Mode Indicator - Liquid Glass */}
            <div className="flex flex-col gap-4 p-5 sm:p-6 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl rounded-2xl shadow-liquid-sm border border-white/20 dark:border-white/10 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none">
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  schedulerEnabled && semiManualMode ? 'bg-warning-100 border-2 border-warning-300' :
                  schedulerEnabled ? 'bg-success-100 border-2 border-success-300' :
                  'bg-accent-100 border-2 border-accent-300'
                }`}>
                  <span className="text-2xl sm:text-3xl">
                    {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-base sm:text-lg font-bold ${
                    schedulerEnabled && semiManualMode ? 'text-warning-700 dark:text-warning-400' :
                    schedulerEnabled ? 'text-success-700 dark:text-success-400' :
                    'text-accent-700 dark:text-accent-400'
                  }`}>
                    {schedulerEnabled && semiManualMode ? 'Semi-manuale' : schedulerEnabled ? 'Automatica' : 'Manuale'}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 break-words">
                    {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                      (() => {
                        const date = new Date(returnToAutoAt);
                        const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                        return `Ritorno auto: ${time} del ${day}`;
                      })()
                    ) : schedulerEnabled && nextScheduledAction ? (
                      <>
                        <span className={`font-semibold ${nextScheduledAction.action === 'ignite' ? 'text-success-700 dark:text-success-400' : 'text-primary-700 dark:text-primary-400'}`}>
                          {nextScheduledAction.action === 'ignite' ? '🔥 Accensione' : '❄️ Spegnimento'}
                        </span>
                        {' alle '}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {(() => {
                            const date = new Date(nextScheduledAction.timestamp);
                            const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                            return `${time} del ${day}`;
                          })()}
                        </span>
                        {nextScheduledAction.action === 'ignite' && (
                          <span className="text-neutral-500 dark:text-neutral-400 block sm:inline"> • P{nextScheduledAction.power}, V{nextScheduledAction.fan}</span>
                        )}
                      </>
                    ) : schedulerEnabled ? (
                      'Controllo automatico attivo'
                    ) : (
                      'Controllo manuale attivo'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {schedulerEnabled && semiManualMode && (
                  <button
                    onClick={handleClearSemiManual}
                    className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-warning-700 dark:text-warning-300 bg-warning-50 dark:bg-warning-900/30 hover:bg-warning-100 dark:hover:bg-warning-900/40 border border-warning-200 dark:border-warning-700/50 hover:border-warning-300 dark:hover:border-warning-600/50 transition-all duration-200 active:scale-95"
                  >
                    ↩️ Torna in Automatico
                  </button>
                )}
                <button
                  onClick={() => router.push('/stove/scheduler')}
                  className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-info-700 dark:text-info-300 bg-info-50 dark:bg-info-900/30 hover:bg-info-100 dark:hover:bg-info-900/40 border border-info-200 dark:border-info-700/50 hover:border-info-300 dark:hover:border-info-600/50 transition-all duration-200 active:scale-95"
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
                      liquid
                      variant="info"
                      icon="ℹ️"
                      description="La modifica attiverà la modalità Semi-Manuale"
                    />
                  )}

                  {/* Ventilazione Control - 3 Column Layout */}
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] dark:from-white/[0.08] dark:to-white/[0.03] border border-white/30 dark:border-white/20 p-5 sm:p-6">
                    {/* Header con icona e label */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-info-100 dark:bg-info-900/40 flex items-center justify-center border-2 border-info-300 dark:border-info-600/50">
                        <span className="text-xl sm:text-2xl">💨</span>
                      </div>
                      <Heading level={4} size="md" className="text-neutral-800 dark:text-white">Ventilazione</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="info"
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
                        <Text variant="tertiary" className="text-xs sm:text-sm uppercase tracking-wide mb-1">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black text-info-700 dark:text-info-400 leading-none">
                            {fanLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-neutral-500 dark:text-neutral-400">/6</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="info"
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

                  {/* Potenza Control - 3 Column Layout */}
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] dark:from-white/[0.08] dark:to-white/[0.03] border border-white/30 dark:border-white/20 p-5 sm:p-6">
                    {/* Header con icona e label */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning-100 dark:bg-warning-900/40 flex items-center justify-center border-2 border-warning-300 dark:border-warning-600/50">
                        <span className="text-xl sm:text-2xl">⚡</span>
                      </div>
                      <Heading level={4} size="md" className="text-neutral-800 dark:text-white">Potenza</Heading>
                    </div>

                    {/* 3 Colonne: [−] [Livello] [+] */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                      {/* Bottone Meno */}
                      <ControlButton
                        type="decrement"
                        variant="warning"
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
                        <Text variant="tertiary" className="text-xs sm:text-sm uppercase tracking-wide mb-1">Livello</Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black text-warning-700 dark:text-warning-400 leading-none">
                            {powerLevel ?? '-'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-neutral-500 dark:text-neutral-400">/5</span>
                        </div>
                      </div>

                      {/* Bottone Più */}
                      <ControlButton
                        type="increment"
                        variant="warning"
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
