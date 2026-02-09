'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Card, Button, ControlButton, Skeleton, Banner, Heading, Text, Divider, Toast, LoadingOverlay, Badge } from '@/app/components/ui';
import MaintenanceBar from '@/app/components/MaintenanceBar';
import CronHealthBanner from '@/app/components/CronHealthBanner';
import ErrorAlert from '@/app/components/ui/ErrorAlert';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { formatHoursToHHMM } from '@/lib/formatUtils';

/**
 * Stove Command Center
 * Full stove control with immersive volcanic design
 */
export default function StovePage() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  // PWA Background Sync
  const { isOnline } = useOnlineStatus();
  const { queueStoveCommand, hasPendingCommands, pendingCommands, lastSyncedCommand } = useBackgroundSync();

  // Core stove state
  const [status, setStatus] = useState<string>('...');
  const [fanLevel, setFanLevel] = useState<number | null>(null);
  const [powerLevel, setPowerLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Scheduler state
  const [schedulerEnabled, setSchedulerEnabled] = useState<boolean>(false);
  const [semiManualMode, setSemiManualMode] = useState<boolean>(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState<string | null>(null);
  const [nextScheduledAction, setNextScheduledAction] = useState<{ action: string; timestamp: string } | null>(null);

  // Error monitoring
  const [errorCode, setErrorCode] = useState<number>(0);
  const [errorDescription, setErrorDescription] = useState<string>('');
  const previousErrorCode = useRef<number>(0);

  // Maintenance
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ needsCleaning: boolean; currentHours: number; targetHours: number; percentage: number; remainingHours: number; isNearLimit: boolean } | null>(null);
  const [cleaningInProgress, setCleaningInProgress] = useState<boolean>(false);

  // Sandbox mode
  const [sandboxMode, setSandboxMode] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; icon?: string; variant?: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Caricamento...');

  // Firebase connection
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [usePollingFallback, setUsePollingFallback] = useState<boolean>(false);
  const lastFirebaseUpdateRef = useRef<Date | null>(null);

  // Refs for tracking previous values
  const previousStatusRef = useRef<string | null>(null);
  const previousFanLevelRef = useRef<number | null>(null);
  const previousPowerLevelRef = useRef<number | null>(null);
  const pollingStartedRef = useRef<boolean>(false);

  // ─────────────────────────────────────────────────────────────
  // Data Fetching Functions
  // ─────────────────────────────────────────────────────────────

  const fetchFanLevel = async (): Promise<number | null> => {
    try {
      const res = await fetch(STOVE_ROUTES.getFan);
      const json: any = await res.json();
      const level = json?.Result ?? 3;
      setFanLevel(level);
      return level;
    } catch (err) {
      console.error('Errore livello ventola:', err);
      return null;
    }
  };

  const fetchPowerLevel = async (): Promise<number | null> => {
    try {
      const res = await fetch(STOVE_ROUTES.getPower);
      const json: any = await res.json();
      const level = json?.Result ?? 2;
      setPowerLevel(level);
      return level;
    } catch (err) {
      console.error('Errore livello potenza:', err);
      return null;
    }
  };

  const fetchSchedulerMode = async (): Promise<void> => {
    try {
      const mode: any = await getFullSchedulerMode();
      setSchedulerEnabled(mode.enabled);
      setSemiManualMode(mode.semiManual || false);
      setReturnToAutoAt(mode.returnToAutoAt || null);

      if (mode.enabled && !mode.semiManual) {
        const nextAction: any = await getNextScheduledAction();
        setNextScheduledAction(nextAction);
      } else {
        setNextScheduledAction(null);
      }
    } catch (err) {
      console.error('Errore modalità scheduler:', err);
    }
  };

  const fetchMaintenanceStatus = async (): Promise<void> => {
    try {
      const status: any = await getMaintenanceStatus();
      setMaintenanceStatus(status);
    } catch (err) {
      console.error('Errore stato manutenzione:', err);
    }
  };

  const fetchStatusAndUpdate = useCallback(async () => {
    try {
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
          await sendErrorNotification(newErrorCode, newErrorDescription);
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

      const hasChanges =
        previousStatusRef.current !== newStatus ||
        previousFanLevelRef.current !== newFanLevel ||
        previousPowerLevelRef.current !== newPowerLevel ||
        previousErrorCode.current !== newErrorCode;

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
          console.error('[StovePage] Firebase sync error:', syncErr);
        }
      }

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

  // ─────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (lastSyncedCommand) {
      const actionLabels = {
        'stove/ignite': '🔥 Stufa accesa (sincronizzato)',
        'stove/shutdown': '🌙 Stufa spenta (sincronizzato)',
        'stove/set-power': '⚡ Potenza impostata (sincronizzato)',
      };
      const message = actionLabels[(lastSyncedCommand as any).endpoint as keyof typeof actionLabels] || 'Comando sincronizzato';
      setToast({ message, variant: 'success' });
      fetchStatusAndUpdate();
    }
  }, [lastSyncedCommand, fetchStatusAndUpdate]);

  useEffect(() => {
    if (pollingStartedRef.current) return;
    fetchStatusAndUpdate();
    pollingStartedRef.current = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const scheduleNextPoll = () => {
      let interval;
      if (usePollingFallback) {
        interval = 10000;
      } else {
        const stoveIsOn = status !== 'spento' &&
          status !== 'standby' &&
          status !== 'errore' &&
          status !== '...' &&
          status !== 'sconosciuto';
        interval = stoveIsOn ? 15000 : 60000;
      }

      timeoutId = setTimeout(() => {
        const now = new Date();
        const lastUpdate = lastFirebaseUpdateRef.current;
        const timeSinceUpdate = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / 1000 : Infinity;
        const staleThreshold = usePollingFallback ? 30 : (status !== 'spento' ? 30 : 90);

        if (!isFirebaseConnected || timeSinceUpdate > staleThreshold || usePollingFallback) {
          fetchStatusAndUpdate();
        }
        scheduleNextPoll();
      }, interval);
    };

    scheduleNextPoll();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      pollingStartedRef.current = false;
    };
  }, [fetchStatusAndUpdate, isFirebaseConnected, usePollingFallback, status]);

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setIsFirebaseConnected(connected);
      if (!connected) {
        setUsePollingFallback(true);
      } else {
        setTimeout(() => setUsePollingFallback(false), 30000);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = isLocalEnvironment() ? 'dev/stove/state' : 'stove/state';
    const stateRef = ref(db, path);

    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.status !== undefined) setStatus(data.status);
          if (data.fanLevel !== undefined) setFanLevel(data.fanLevel);
          if (data.powerLevel !== undefined) setPowerLevel(data.powerLevel);
          if (data.errorCode !== undefined) setErrorCode(data.errorCode);
          if (data.errorDescription !== undefined) setErrorDescription(data.errorDescription);
          lastFirebaseUpdateRef.current = new Date();
          fetchSchedulerMode();
          fetchMaintenanceStatus();
          checkVersion();
        }
      },
      (error) => {
        console.error('[StovePage] Firebase listener error:', error);
        setUsePollingFallback(true);
      }
    );
    return () => unsubscribe();
  }, [checkVersion]);

  useEffect(() => {
    if (!isLocalEnvironment()) return;
    let unsubscribeState: (() => void) | null = null;
    let unsubscribeMaintenance: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    async function setupSandboxListeners() {
      const enabled = await isSandboxEnabled();
      if (enabled) {
        const stateRef = ref(db, 'sandbox/stoveState');
        unsubscribeState = onValue(stateRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setStatus(data.status || '...');
            setFanLevel(data.fan ?? null);
            setPowerLevel(data.power ?? null);
          }
        });

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

        const maintenanceRef = ref(db, 'sandbox/maintenance');
        unsubscribeMaintenance = onValue(maintenanceRef, async () => {
          await fetchMaintenanceStatus();
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

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const handleFanChange = async (newLevel: number): Promise<void> => {
    setLoadingMessage('Modifica ventola...');
    setLoading(true);
    setFanLevel(newLevel);

    const response = await fetch(STOVE_ROUTES.setFan, {
      method: 'POST',
      body: JSON.stringify({ level: newLevel, source: 'manual' }),
    });

    const data: any = await response.json();
    if (data.modeChanged) {
      setToast({ message: 'Modalità Semi-Manuale attivata', icon: '⚙️', variant: 'warning' });
      setSemiManualMode(true);
      setReturnToAutoAt(data.returnToAutoAt || null);
      setNextScheduledAction(null);
    }

    await logStoveAction.setFan(newLevel);
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handlePowerChange = async (newLevel: number): Promise<void> => {
    setLoadingMessage('Modifica potenza...');
    setLoading(true);
    setPowerLevel(newLevel);

    const response = await fetch(STOVE_ROUTES.setPower, {
      method: 'POST',
      body: JSON.stringify({ level: newLevel, source: 'manual' }),
    });

    const data: any = await response.json();
    if (data.modeChanged) {
      setToast({ message: 'Modalità Semi-Manuale attivata', icon: '⚙️', variant: 'warning' });
      setSemiManualMode(true);
      setReturnToAutoAt(data.returnToAutoAt || null);
      setNextScheduledAction(null);
    }

    await logStoveAction.setPower(newLevel);
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handleIgnite = async (): Promise<void> => {
    if (!isOnline) {
      await queueStoveCommand('ignite', { source: 'manual' });
      setToast({ message: 'Comando in coda - eseguito al ripristino connessione', variant: 'warning' });
      return;
    }

    setLoadingMessage('Accensione stufa...');
    setLoading(true);
    await fetch(STOVE_ROUTES.ignite, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.ignite();
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handleShutdown = async (): Promise<void> => {
    if (!isOnline) {
      await queueStoveCommand('shutdown', { source: 'manual' });
      setToast({ message: 'Comando in coda - eseguito al ripristino connessione', variant: 'warning' });
      return;
    }

    setLoadingMessage('Spegnimento stufa...');
    setLoading(true);
    await fetch(STOVE_ROUTES.shutdown, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.shutdown();
    await fetchStatusAndUpdate();
    setLoading(false);
  };

  const handleClearSemiManual = async (): Promise<void> => {
    await clearSemiManualMode();
    await logSchedulerAction.clearSemiManual();
    setSemiManualMode(false);
    setReturnToAutoAt(null);
    const nextAction: any = await getNextScheduledAction();
    setNextScheduledAction(nextAction);
  };

  const handleConfirmCleaning = async (): Promise<void> => {
    setCleaningInProgress(true);
    try {
      await confirmCleaning(user);
      await fetchMaintenanceStatus();
      setToast({ message: 'Pulizia confermata!', variant: 'success', icon: '✓' });
    } catch (err) {
      console.error('Errore conferma pulizia:', err);
    } finally {
      setCleaningInProgress(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Status Mapping
  // ─────────────────────────────────────────────────────────────

  const getStatusConfig = (status: string): { label: string; icon: string; theme: string; pulse: boolean } => {
    if (!status) return { label: 'CARICAMENTO', icon: '⏳', theme: 'slate', pulse: true };

    const s = status.toUpperCase();
    if (s.includes('WORK')) return { label: 'IN FUNZIONE', icon: '🔥', theme: 'ember', pulse: true };
    if (s.includes('OFF')) return { label: 'SPENTA', icon: '❄️', theme: 'slate', pulse: false };
    if (s.includes('START')) return { label: 'AVVIO', icon: '🚀', theme: 'ocean', pulse: true };
    if (s.includes('STANDBY') || s.includes('WAIT')) return { label: 'ATTESA', icon: '💤', theme: 'warning', pulse: true };
    if (s.includes('ERROR') || s.includes('ALARM')) return { label: 'ERRORE', icon: '⚠️', theme: 'danger', pulse: true };
    if (s.includes('CLEAN')) return { label: 'PULIZIA', icon: '🔄', theme: 'sage', pulse: true };
    if (s.includes('MODULATION')) return { label: 'MODULAZIONE', icon: '🌡️', theme: 'ocean', pulse: true };
    return { label: status.toUpperCase(), icon: '❔', theme: 'slate', pulse: false };
  };

  const statusConfig = getStatusConfig(status);
  const isAccesa = status?.toUpperCase().includes('WORK') || status?.toUpperCase().includes('START');
  const isSpenta = status?.toUpperCase().includes('OFF') || status?.toUpperCase().includes('ERROR') || status?.toUpperCase().includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;
  const isWorking = status?.toUpperCase().includes('WORK');

  // Theme colors (dark + light mode via [html:not(.dark)_&] overrides)
  const themeColors = {
    ember: {
      bg: 'from-ember-950/80 via-slate-950 to-flame-950/60 [html:not(.dark)_&]:from-ember-50/80 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-flame-50/60',
      glow: 'shadow-[0_0_120px_40px_rgba(237,111,16,0.15)] [html:not(.dark)_&]:shadow-[0_0_80px_30px_rgba(237,111,16,0.06)]',
      accent: 'text-ember-400 [html:not(.dark)_&]:text-ember-700',
      accentBg: 'bg-ember-500/20 [html:not(.dark)_&]:bg-ember-500/10',
      border: 'border-ember-500/30 [html:not(.dark)_&]:border-ember-500/20',
    },
    slate: {
      bg: 'from-slate-950 via-slate-900 to-slate-950 [html:not(.dark)_&]:from-slate-100 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-slate-100',
      glow: '',
      accent: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
      accentBg: 'bg-slate-500/20 [html:not(.dark)_&]:bg-slate-500/10',
      border: 'border-slate-600/30 [html:not(.dark)_&]:border-slate-300/50',
    },
    ocean: {
      bg: 'from-ocean-950/80 via-slate-950 to-ocean-950/60 [html:not(.dark)_&]:from-ocean-50/80 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-ocean-50/60',
      glow: 'shadow-[0_0_100px_30px_rgba(67,125,174,0.12)] [html:not(.dark)_&]:shadow-[0_0_60px_20px_rgba(67,125,174,0.06)]',
      accent: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-700',
      accentBg: 'bg-ocean-500/20 [html:not(.dark)_&]:bg-ocean-500/10',
      border: 'border-ocean-500/30 [html:not(.dark)_&]:border-ocean-500/20',
    },
    warning: {
      bg: 'from-warning-950/60 via-slate-950 to-warning-950/40 [html:not(.dark)_&]:from-warning-50/60 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-warning-50/40',
      glow: 'shadow-[0_0_80px_25px_rgba(234,179,8,0.1)] [html:not(.dark)_&]:shadow-[0_0_50px_15px_rgba(234,179,8,0.05)]',
      accent: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
      accentBg: 'bg-warning-500/20 [html:not(.dark)_&]:bg-warning-500/10',
      border: 'border-warning-500/30 [html:not(.dark)_&]:border-warning-500/20',
    },
    danger: {
      bg: 'from-danger-950/70 via-slate-950 to-danger-950/50 [html:not(.dark)_&]:from-danger-50/70 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-danger-50/50',
      glow: 'shadow-[0_0_100px_35px_rgba(239,68,68,0.15)] [html:not(.dark)_&]:shadow-[0_0_60px_20px_rgba(239,68,68,0.08)]',
      accent: 'text-danger-400 [html:not(.dark)_&]:text-danger-700',
      accentBg: 'bg-danger-500/20 [html:not(.dark)_&]:bg-danger-500/10',
      border: 'border-danger-500/30 [html:not(.dark)_&]:border-danger-500/20',
    },
    sage: {
      bg: 'from-sage-950/70 via-slate-950 to-sage-950/50 [html:not(.dark)_&]:from-sage-50/70 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-sage-50/50',
      glow: 'shadow-[0_0_80px_25px_rgba(96,115,96,0.12)] [html:not(.dark)_&]:shadow-[0_0_50px_15px_rgba(96,115,96,0.06)]',
      accent: 'text-sage-400 [html:not(.dark)_&]:text-sage-700',
      accentBg: 'bg-sage-500/20 [html:not(.dark)_&]:bg-sage-500/10',
      border: 'border-sage-500/30 [html:not(.dark)_&]:border-sage-500/20',
    },
  };

  const theme = themeColors[statusConfig.theme as keyof typeof themeColors] || themeColors.slate;

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[500px] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Page Title - Visually hidden for accessibility and proper heading hierarchy */}
      <Heading level={1} className="sr-only">
        Controllo Stufa
      </Heading>

      {/* Full-screen ambient gradient overlay */}
      <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${theme.bg} transition-all duration-1000`} />

      {/* Ambient Glow Effect */}
      <div className={`fixed inset-0 -z-10 pointer-events-none transition-all duration-1000 ${theme.glow}`} />

      {/* Loading Overlay */}
      <LoadingOverlay show={loading} message={loadingMessage} icon="🔥" />

      {/* Main Content */}
      <div className="relative space-y-6 sm:space-y-8">

        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION - Status Display
        ═══════════════════════════════════════════════════════════ */}
        <div className="relative">
          {/* Error Alert - Outside main card */}
          {errorCode !== 0 && (
            <div className="mb-6">
              <ErrorAlert
                errorCode={errorCode}
                errorDescription={errorDescription}
                showDetailsButton={true}
                showSuggestion={true}
              />
            </div>
          )}

          {/* Maintenance Banner */}
          {needsMaintenance && (
            <div className="mb-6">
              <Banner
                variant="warning"
                icon="🧹"
                title="Pulizia Stufa Richiesta"
                description={
                  <>
                    Raggiunte <strong>{maintenanceStatus?.currentHours.toFixed(1)} ore</strong>.
                    Effettua la pulizia prima di riaccendere.
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

          {/* Connection Status Banner */}
          {(!isFirebaseConnected || hasPendingCommands) && (
            <div className="mb-6 space-y-3">
              {!isFirebaseConnected && (
                <Banner
                  variant="warning"
                  icon="⚠️"
                  title="Connessione Interrotta"
                  description="Aggiornamenti ogni 10 secondi."
                />
              )}
              {hasPendingCommands && (
                <Banner
                  variant="info"
                  icon="⏳"
                  title={`${pendingCommands.length} comando/i in attesa`}
                  description="Verranno eseguiti al ripristino connessione."
                />
              )}
            </div>
          )}

          {/* Main Hero Card */}
          <Card variant="glass" padding={false} className="overflow-hidden relative">
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, ${statusConfig.theme === 'ember' ? 'rgba(237,111,16,0.3)' : 'rgba(100,100,100,0.2)'} 0%, transparent 50%),
                                  radial-gradient(circle at 70% 80%, ${statusConfig.theme === 'ember' ? 'rgba(254,86,16,0.2)' : 'rgba(100,100,100,0.1)'} 0%, transparent 50%)`
              }} />
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
              {sandboxMode && (
                <div className="bg-ocean-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-xs font-bold">🧪 SANDBOX</span>
                </div>
              )}
              {errorCode !== 0 && (
                <div className="bg-danger-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg ml-auto animate-pulse">
                  <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
                </div>
              )}
            </div>

            <div className="relative z-10 p-6 sm:p-10">
              {/* Status Display */}
              <div className="text-center mb-8">
                {/* Large Status Icon */}
                <div className={`relative inline-block mb-4 ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                  <div className={`absolute inset-0 blur-3xl rounded-full ${theme.accentBg} scale-150`} />
                  <span className="relative text-8xl sm:text-9xl drop-shadow-2xl" style={{ lineHeight: 1 }}>
                    {statusConfig.icon}
                  </span>
                </div>

                {/* Status Label - Using div instead of h1 for visual display (page-level h1 is visually hidden above) */}
                <div
                  className={`text-3xl sm:text-4xl font-black font-display ${theme.accent} tracking-tight uppercase mb-2`}
                  role="status"
                  aria-live="polite"
                >
                  {statusConfig.label}
                </div>
                {statusConfig.label !== status?.toUpperCase() && (
                  <Text size="sm" className="text-slate-500 font-mono">
                    {status}
                  </Text>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
                {/* Fan Level Gauge */}
                <div className={`relative overflow-hidden rounded-2xl bg-slate-900/60 [html:not(.dark)_&]:bg-white/70 backdrop-blur-xl border ${theme.border} p-5 sm:p-6`}>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl mb-2">💨</span>
                    <Text size="xs" className="text-slate-400 [html:not(.dark)_&]:text-slate-500 uppercase tracking-wider mb-1">
                      Ventola
                    </Text>
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-black text-ocean-400 [html:not(.dark)_&]:text-ocean-600">
                        {fanLevel ?? '-'}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">/6</span>
                    </div>
                    {/* Mini bar indicator */}
                    <div className="w-full mt-3 h-2 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ocean-500 to-ocean-400 transition-all duration-300"
                        style={{ width: fanLevel ? `${(fanLevel / 6) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Power Level Gauge */}
                <div className={`relative overflow-hidden rounded-2xl bg-slate-900/60 [html:not(.dark)_&]:bg-white/70 backdrop-blur-xl border ${theme.border} p-5 sm:p-6`}>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl mb-2">⚡</span>
                    <Text size="xs" className="text-slate-400 [html:not(.dark)_&]:text-slate-500 uppercase tracking-wider mb-1">
                      Potenza
                    </Text>
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-black text-ember-400 [html:not(.dark)_&]:text-ember-600">
                        {powerLevel ?? '-'}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">/5</span>
                    </div>
                    {/* Mini bar indicator */}
                    <div className="w-full mt-3 h-2 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ember-500 to-flame-400 transition-all duration-300"
                        style={{ width: powerLevel ? `${(powerLevel / 5) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  variant="ember"
                  size="lg"
                  icon="🔥"
                  onClick={handleIgnite}
                  disabled={loading || isAccesa || needsMaintenance}
                  className="h-16 sm:h-20 text-base sm:text-lg font-bold"
                >
                  ACCENDI
                </Button>
                <Button
                  variant="subtle"
                  size="lg"
                  icon="❄️"
                  onClick={handleShutdown}
                  disabled={loading || isSpenta}
                  className="h-16 sm:h-20 text-base sm:text-lg font-bold"
                >
                  SPEGNI
                </Button>
              </div>

              {/* Mode Indicator */}
              <div className={`rounded-2xl bg-slate-900/50 [html:not(.dark)_&]:bg-white/60 backdrop-blur-xl border ${theme.border} p-4 sm:p-5`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    schedulerEnabled && semiManualMode ? 'bg-warning-900/50 [html:not(.dark)_&]:bg-warning-100 border-2 border-warning-500/50 [html:not(.dark)_&]:border-warning-300' :
                    schedulerEnabled ? 'bg-sage-900/50 [html:not(.dark)_&]:bg-sage-100 border-2 border-sage-500/50 [html:not(.dark)_&]:border-sage-300' :
                    'bg-ember-900/50 [html:not(.dark)_&]:bg-ember-100 border-2 border-ember-500/50 [html:not(.dark)_&]:border-ember-300'
                  }`}>
                    <span className="text-2xl sm:text-3xl">
                      {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className={`text-base sm:text-lg ${
                      schedulerEnabled && semiManualMode ? 'text-warning-400 [html:not(.dark)_&]:text-warning-700' :
                      schedulerEnabled ? 'text-sage-400 [html:not(.dark)_&]:text-sage-700' : 'text-ember-400 [html:not(.dark)_&]:text-ember-700'
                    }`}>
                      {schedulerEnabled && semiManualMode ? 'Semi-manuale' : schedulerEnabled ? 'Automatica' : 'Manuale'}
                    </Text>
                    <Text variant="tertiary" size="sm" className="truncate">
                      {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                        `Ritorno auto: ${new Date(returnToAutoAt).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                      ) : schedulerEnabled && nextScheduledAction ? (
                        `${nextScheduledAction.action === 'ignite' ? '🔥' : '❄️'} ${new Date(nextScheduledAction.timestamp).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                      ) : schedulerEnabled ? 'Automatico attivo' : 'Controllo manuale'}
                    </Text>
                  </div>
                </div>

                {/* Mode Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {schedulerEnabled && semiManualMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSemiManual}
                    >
                      ↩️ Torna Automatico
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/stove/scheduler')}
                  >
                    📅 Pianificazione
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CONTROLS SECTION - Fan & Power (Only when WORK)
        ═══════════════════════════════════════════════════════════ */}
        {isWorking && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="text-2xl">🎛️</span>
              <Heading level={2} size="xl">Regolazioni</Heading>
            </div>

            {schedulerEnabled && !semiManualMode && (
              <Banner
                variant="info"
                icon="ℹ️"
                description="La modifica attiverà la modalità Semi-Manuale"
                compact
              />
            )}

            {/* Fan Control */}
            <Card variant="glass" className="overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ocean-900/50 [html:not(.dark)_&]:bg-ocean-100 flex items-center justify-center border-2 border-ocean-500/50 [html:not(.dark)_&]:border-ocean-300">
                  <span className="text-xl sm:text-2xl">💨</span>
                </div>
                <Heading level={3} size="lg">Ventilazione</Heading>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <ControlButton
                  type="decrement"
                  variant="subtle"
                  onClick={() => fanLevel !== null && fanLevel > 1 && handleFanChange(fanLevel - 1)}
                  disabled={fanLevel === null || fanLevel <= 1}
                />
                <div className="flex flex-col items-center px-6">
                  <Text variant="label" size="sm" className="mb-1">Livello</Text>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-ocean-400 [html:not(.dark)_&]:text-ocean-600">{fanLevel ?? '-'}</span>
                    <span className="text-xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/6</span>
                  </div>
                </div>
                <ControlButton
                  type="increment"
                  variant="subtle"
                  onClick={() => fanLevel !== null && fanLevel < 6 && handleFanChange(fanLevel + 1)}
                  disabled={fanLevel === null || fanLevel >= 6}
                />
              </div>
            </Card>

            {/* Power Control */}
            <Card variant="glass" className="overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ember-900/50 [html:not(.dark)_&]:bg-ember-100 flex items-center justify-center border-2 border-ember-500/50 [html:not(.dark)_&]:border-ember-300">
                  <span className="text-xl sm:text-2xl">⚡</span>
                </div>
                <Heading level={3} size="lg">Potenza</Heading>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <ControlButton
                  type="decrement"
                  variant="ember"
                  onClick={() => powerLevel !== null && powerLevel > 1 && handlePowerChange(powerLevel - 1)}
                  disabled={powerLevel === null || powerLevel <= 1}
                />
                <div className="flex flex-col items-center px-6">
                  <Text variant="label" size="sm" className="mb-1">Livello</Text>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-ember-400 [html:not(.dark)_&]:text-ember-600">{powerLevel ?? '-'}</span>
                    <span className="text-xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/5</span>
                  </div>
                </div>
                <ControlButton
                  type="increment"
                  variant="ember"
                  onClick={() => powerLevel !== null && powerLevel < 5 && handlePowerChange(powerLevel + 1)}
                  disabled={powerLevel === null || powerLevel >= 5}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUICK NAVIGATION - Feature Cards
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <span className="text-2xl">⚡</span>
            <Heading level={2} size="xl">Accesso Rapido</Heading>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Scheduler Card */}
            <Link href="/stove/scheduler" className="block group">
              <Card variant="glass" className="h-full transition-all duration-300 hover:shadow-sage-glow hover:scale-[1.02] hover:border-sage-500/40">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sage-900/50 [html:not(.dark)_&]:bg-sage-100 flex items-center justify-center border border-sage-500/30 [html:not(.dark)_&]:border-sage-300 group-hover:border-sage-500/60 transition-colors flex-shrink-0">
                    <span className="text-3xl">📅</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Heading level={3} size="md" className="group-hover:text-sage-400 [html:not(.dark)_&]:group-hover:text-sage-600 transition-colors mb-1">
                      Pianificazione
                    </Heading>
                    <Text variant="tertiary" size="sm">
                      Orari accensione automatica
                    </Text>
                    <div className="mt-3">
                      <Badge
                        variant={schedulerEnabled ? 'sage' : 'neutral'}
                        size="sm"
                      >
                        {schedulerEnabled ? '⏰ Attivo' : '🔧 Manuale'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Maintenance Card */}
            <Link href="/stove/maintenance" className="block group">
              <Card variant="glass" className="h-full transition-all duration-300 hover:shadow-ocean-glow hover:scale-[1.02] hover:border-ocean-500/40">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-ocean-900/50 [html:not(.dark)_&]:bg-ocean-100 flex items-center justify-center border border-ocean-500/30 [html:not(.dark)_&]:border-ocean-300 group-hover:border-ocean-500/60 transition-colors flex-shrink-0">
                    <span className="text-3xl">🔧</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Heading level={3} size="md" className="group-hover:text-ocean-400 [html:not(.dark)_&]:group-hover:text-ocean-600 transition-colors mb-1">
                      Manutenzione
                    </Heading>
                    <Text variant="tertiary" size="sm">
                      Ore utilizzo e pulizia
                    </Text>
                    {maintenanceStatus && (
                      <div className="mt-3">
                        <Badge
                          variant={maintenanceStatus.needsCleaning ? 'warning' : 'ocean'}
                          size="sm"
                        >
                          {maintenanceStatus.needsCleaning
                            ? '⚠️ Pulizia richiesta'
                            : `⏱️ ${formatHoursToHHMM(maintenanceStatus.currentHours || 0)}`
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>

            {/* Errors Card */}
            <Link href="/stove/errors" className="block group">
              <Card variant="glass" className="h-full transition-all duration-300 hover:shadow-ember-glow hover:scale-[1.02] hover:border-ember-500/40">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-ember-900/50 [html:not(.dark)_&]:bg-ember-100 flex items-center justify-center border border-ember-500/30 [html:not(.dark)_&]:border-ember-300 group-hover:border-ember-500/60 transition-colors flex-shrink-0">
                    <span className="text-3xl">🚨</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Heading level={3} size="md" className="group-hover:text-ember-400 [html:not(.dark)_&]:group-hover:text-ember-600 transition-colors mb-1">
                      Storico Allarmi
                    </Heading>
                    <Text variant="tertiary" size="sm">
                      Errori e diagnostica
                    </Text>
                    <div className="mt-3">
                      <Badge
                        variant={errorCode !== 0 ? 'danger' : 'neutral'}
                        size="sm"
                      >
                        {errorCode !== 0 ? `⚠️ Errore ${errorCode}` : '✓ Nessun errore'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SYSTEM STATUS - Maintenance & Cron Health
        ═══════════════════════════════════════════════════════════ */}
        {maintenanceStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="text-2xl">📊</span>
              <Heading level={2} size="xl">Stato Sistema</Heading>
            </div>

            <Card variant="glass">
              <MaintenanceBar maintenanceStatus={maintenanceStatus} />
            </Card>

            <CronHealthBanner variant="inline" />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BACK NAVIGATION
        ═══════════════════════════════════════════════════════════ */}
        <div className="flex justify-center pt-4 pb-8">
          <Button
            variant="ghost"
            icon="🏠"
            onClick={() => router.push('/')}
          >
            Torna alla Home
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          variant={toast.variant}
          open={!!toast}
          onOpenChange={(open) => !open && setToast(null)}
          duration={3000}
        >
          {toast.icon && <span>{toast.icon}</span>}
          {toast.message}
        </Toast>
      )}
    </div>
  );
}
