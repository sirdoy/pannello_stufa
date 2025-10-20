'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getFullSchedulerMode, clearSemiManualMode, getNextScheduledAction } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logStoveAction, logSchedulerAction } from '@/lib/logService';
import { logError, shouldNotify, sendErrorNotification } from '@/lib/errorMonitor';
import { useVersion } from '@/app/context/VersionContext';
import { getMaintenanceStatus, confirmCleaning } from '@/lib/maintenanceService';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Skeleton from '../../ui/Skeleton';
import ErrorAlert from '../../ui/ErrorAlert';
import Banner from '../../ui/Banner';
import MaintenanceBar from '../../MaintenanceBar';
import CronHealthBanner from '../../CronHealthBanner';

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

  const fetchFanLevel = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.getFan);
      const json = await res.json();
      setFanLevel(json?.Result ?? 3);
    } catch (err) {
      console.error('Errore livello ventola:', err);
    }
  };

  const fetchPowerLevel = async () => {
    try {
      const res = await fetch(STOVE_ROUTES.getPower);
      const json = await res.json();
      setPowerLevel(json?.Result ?? 2);
    } catch (err) {
      console.error('Errore livello potenza:', err);
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
  }, [checkVersion]);

  useEffect(() => {
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchStatusAndUpdate();
    const interval = setInterval(fetchStatusAndUpdate, 5000);

    return () => {
      clearInterval(interval);
      pollingStartedRef.current = false;
    };
  }, [fetchStatusAndUpdate]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchStatusAndUpdate();
    setRefreshing(false);
  };

  const handleFanChange = async (e) => {
    const level = Number(e.target.value);
    setFanLevel(level);
    await fetch(STOVE_ROUTES.setFan, {
      method: 'POST',
      body: JSON.stringify({ level, source: 'manual' }),
    });
    await logStoveAction.setFan(level);
  };

  const handlePowerChange = async (e) => {
    const level = Number(e.target.value);
    setPowerLevel(level);
    await fetch(STOVE_ROUTES.setPower, {
      method: 'POST',
      body: JSON.stringify({ level, source: 'manual' }),
    });
    await logStoveAction.setPower(level);
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
    setLoading(true);
    await fetch(STOVE_ROUTES.ignite, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.ignite();
    setLoading(false);
  };

  const handleShutdown = async () => {
    setLoading(true);
    await fetch(STOVE_ROUTES.shutdown, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
    await logStoveAction.shutdown();
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

  // Status mapping: technical name → user-friendly display
  const getStatusInfo = (status) => {
    if (!status) {
      return {
        label: 'Caricamento...',
        icon: '⏳',
        textColor: 'text-neutral-600',
        bgColor: 'bg-gradient-to-br from-neutral-50/80 via-neutral-100/60 to-neutral-50/80',
        iconBg: 'bg-neutral-100/70',
        animated: true,
      };
    }

    const statusUpper = status.toUpperCase();

    // 🔥 WORK - In funzione
    if (statusUpper.includes('WORK')) {
      return {
        label: 'In Funzione',
        icon: '🔥',
        textColor: 'text-success-700',
        bgColor: 'bg-gradient-to-br from-success-500/[0.03] via-success-600/[0.02] to-success-500/[0.03]',
        iconBg: 'bg-success-100/50',
        animated: true,
        pulse: true,
      };
    }

    // ❄️ OFF - Spenta
    if (statusUpper.includes('OFF')) {
      return {
        label: 'Spenta',
        icon: '❄️',
        textColor: 'text-neutral-600',
        bgColor: 'bg-gradient-to-br from-neutral-500/[0.02] via-neutral-600/[0.01] to-neutral-500/[0.02]',
        iconBg: 'bg-neutral-100/50',
        animated: false,
      };
    }

    // 🚀 START - Avvio in corso
    if (statusUpper.includes('START')) {
      return {
        label: 'Avvio in Corso',
        icon: '🚀',
        textColor: 'text-info-700',
        bgColor: 'bg-gradient-to-br from-info-500/[0.03] via-info-600/[0.02] to-info-500/[0.03]',
        iconBg: 'bg-info-100/50',
        animated: true,
        pulse: true,
      };
    }

    // 💤 STANDBY/WAIT - In attesa
    if (statusUpper.includes('STANDBY') || statusUpper.includes('WAIT')) {
      return {
        label: 'In Attesa',
        icon: '💤',
        textColor: 'text-warning-700',
        bgColor: 'bg-gradient-to-br from-warning-50/80 via-warning-100/60 to-warning-50/80',
        iconBg: 'bg-warning-100/70',
        animated: true,
      };
    }

    // ⚠️ ERROR - Errore
    if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) {
      return {
        label: 'Errore',
        icon: '⚠️',
        textColor: 'text-primary-700',
        bgColor: 'bg-gradient-to-br from-primary-50/80 via-primary-100/60 to-primary-50/80',
        iconBg: 'bg-primary-100/70',
        animated: true,
        pulse: true,
      };
    }

    // 🔄 CLEANING - Pulizia
    if (statusUpper.includes('CLEAN')) {
      return {
        label: 'Pulizia Automatica',
        icon: '🔄',
        textColor: 'text-accent-700',
        bgColor: 'bg-gradient-to-br from-accent-50/80 via-accent-100/60 to-accent-50/80',
        iconBg: 'bg-accent-100/70',
        animated: true,
        pulse: true,
      };
    }

    // 🌡️ MODULATION - Modulazione
    if (statusUpper.includes('MODULATION')) {
      return {
        label: 'Modulazione',
        icon: '🌡️',
        textColor: 'text-info-700',
        bgColor: 'bg-gradient-to-br from-info-50/80 via-info-100/60 to-info-50/80',
        iconBg: 'bg-info-100/70',
        animated: true,
      };
    }

    // Default - Stato sconosciuto
    return {
      label: status,
      icon: '❔',
      textColor: 'text-neutral-600',
      bgColor: 'bg-gradient-to-br from-neutral-50/80 via-neutral-100/60 to-neutral-50/80',
      iconBg: 'bg-neutral-100/70',
      animated: false,
    };
  };

  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;
  const statusInfo = getStatusInfo(status);

  if (initialLoading) {
    return <Skeleton.StovePanel />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Maintenance Cleaning Banner */}
      {needsMaintenance && (
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
      )}

      {/* Error Alert */}
      {errorCode !== 0 && (
        <ErrorAlert
          errorCode={errorCode}
          errorDescription={errorDescription}
          showDetailsButton={true}
          showSuggestion={true}
        />
      )}

      {/* Main Status Card - Liquid Glass */}
      <Card liquid className={`overflow-hidden transition-all duration-500 ${statusInfo.bgColor}`}>
        <div className="relative">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🔥</span>
                <span>Stufa</span>
              </h2>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="group relative p-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-2xl shadow-liquid-sm hover:shadow-liquid active:scale-[0.98] transition-all duration-300 disabled:opacity-50 ring-1 ring-white/20 ring-inset overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
                title="Aggiorna stato"
              >
                <span className={`text-xl inline-block relative z-10 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
              </button>
            </div>

            {/* Main Status Display - Mobile First */}
            <div className="space-y-4 mb-6">
              {/* Status principale - Glassmorphism Design */}
              <div className="relative overflow-hidden rounded-3xl group">
                {/* Background gradient animation */}
                {statusInfo.animated && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                )}

                <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 bg-white/[0.10] backdrop-blur-3xl rounded-3xl shadow-liquid hover:shadow-liquid-lg transition-all duration-500 hover:scale-[1.002] ring-1 ring-white/20 ring-inset overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none">
                  {/* Error Badge */}
                  {errorCode !== 0 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full shadow-elevated-lg ring-2 ring-white/40">
                          <span className="text-xs sm:text-sm font-bold">⚠️ ERR {errorCode}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Icon with animated background */}
                  <div className="relative mb-5 z-10">
                    {statusInfo.pulse && (
                      <div className={`absolute inset-0 ${statusInfo.iconBg} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
                    )}
                    <div className={`relative ${statusInfo.iconBg} rounded-full p-5 sm:p-6 shadow-inner-soft ring-1 ring-white/15 ring-inset transition-all duration-500 ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                      <span className="text-6xl sm:text-7xl drop-shadow-md relative z-10">
                        {statusInfo.icon}
                      </span>
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center relative z-10">
                    <p className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3 opacity-50">
                      Stato Attuale
                    </p>
                    <p className={`text-3xl sm:text-4xl lg:text-5xl font-black ${statusInfo.textColor} tracking-tight leading-tight`}>
                      {statusInfo.label}
                    </p>
                    {/* Technical status (small, subtle) */}
                    {statusInfo.label !== status && (
                      <p className="text-xs text-neutral-500 mt-3 font-mono opacity-30 tracking-wide">
                        {status}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ventola e Potenza - Grid responsive con Liquid Glass */}
              <div className="grid grid-cols-2 gap-4">
                {/* Ventola */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="relative flex flex-col items-center justify-center p-5 sm:p-6 bg-gradient-to-br from-white/[0.08] to-info-500/[0.05] backdrop-blur-2xl rounded-2xl shadow-liquid-sm hover:shadow-liquid transition-all duration-300 hover:scale-[1.005] ring-1 ring-white/15 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none">
                    {/* Icon with soft glow */}
                    <div className="relative mb-3 z-10">
                      <div className="absolute inset-0 bg-info-400/10 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-info-100/50 to-info-200/50 rounded-full p-3 shadow-inner-soft ring-1 ring-white/15 ring-inset">
                        <span className="text-2xl sm:text-3xl drop-shadow-sm relative z-10">💨</span>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.15em] mb-2 opacity-50 relative z-10">Ventola</p>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <p className="text-2xl sm:text-3xl font-black text-info-700 leading-none">
                        {fanLevel ?? '-'}
                      </p>
                      <span className="text-sm sm:text-base text-neutral-500 font-semibold opacity-50">/6</span>
                    </div>
                  </div>
                </div>

                {/* Potenza */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="relative flex flex-col items-center justify-center p-5 sm:p-6 bg-gradient-to-br from-white/[0.08] to-accent-500/[0.05] backdrop-blur-2xl rounded-2xl shadow-liquid-sm hover:shadow-liquid transition-all duration-300 hover:scale-[1.005] ring-1 ring-white/15 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none">
                    {/* Icon with soft glow */}
                    <div className="relative mb-3 z-10">
                      <div className="absolute inset-0 bg-accent-400/10 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-accent-100/50 to-accent-200/50 rounded-full p-3 shadow-inner-soft ring-1 ring-white/15 ring-inset">
                        <span className="text-2xl sm:text-3xl drop-shadow-sm relative z-10">⚡</span>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.15em] mb-2 opacity-50 relative z-10">Potenza</p>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <p className="text-2xl sm:text-3xl font-black text-accent-700 leading-none">
                        {powerLevel ?? '-'}
                      </p>
                      <span className="text-sm sm:text-base text-neutral-500 font-semibold opacity-50">/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 py-1.5 bg-white/[0.10] backdrop-blur-2xl text-neutral-700 font-semibold text-xs uppercase tracking-[0.15em] rounded-full shadow-liquid-sm ring-1 ring-white/20 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none">
                  <span className="relative z-10">Modalità Controllo</span>
                </span>
              </div>
            </div>

            {/* Mode Indicator - Liquid Glass */}
            <div className="flex flex-col gap-4 p-5 sm:p-6 bg-white/[0.08] backdrop-blur-2xl rounded-2xl shadow-liquid-sm ring-1 ring-white/15 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none">
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
                    schedulerEnabled && semiManualMode ? 'text-warning-700' :
                    schedulerEnabled ? 'text-success-700' :
                    'text-accent-700'
                  }`}>
                    {schedulerEnabled && semiManualMode ? 'Semi-manuale' : schedulerEnabled ? 'Automatica' : 'Manuale'}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 break-words">
                    {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                      (() => {
                        const date = new Date(returnToAutoAt);
                        const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                        return `Ritorno auto: ${time} del ${day}`;
                      })()
                    ) : schedulerEnabled && nextScheduledAction ? (
                      <>
                        <span className={`font-semibold ${nextScheduledAction.action === 'ignite' ? 'text-success-600' : 'text-primary-600'}`}>
                          {nextScheduledAction.action === 'ignite' ? '🔥 Accensione' : '❄️ Spegnimento'}
                        </span>
                        {' alle '}
                        <span className="font-medium text-neutral-700">
                          {(() => {
                            const date = new Date(nextScheduledAction.timestamp);
                            const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                            return `${time} del ${day}`;
                          })()}
                        </span>
                        {nextScheduledAction.action === 'ignite' && (
                          <span className="text-neutral-400 block sm:inline"> • P{nextScheduledAction.power}, V{nextScheduledAction.fan}</span>
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
                    className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-warning-700 bg-warning-50 hover:bg-warning-100 border border-warning-200 hover:border-warning-300 transition-all duration-200 active:scale-95"
                  >
                    ↩️ Torna in Automatico
                  </button>
                )}
                <button
                  onClick={() => router.push('/stove/scheduler')}
                  className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-info-700 bg-info-50 hover:bg-info-100 border border-info-200 hover:border-info-300 transition-all duration-200 active:scale-95"
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
                <div className="relative my-6 sm:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 py-1.5 bg-white/[0.10] backdrop-blur-2xl text-neutral-700 font-semibold text-xs uppercase tracking-[0.15em] rounded-full shadow-liquid-sm ring-1 ring-white/20 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none">
                      <span className="relative z-10">Manutenzione</span>
                    </span>
                  </div>
                </div>

                <MaintenanceBar maintenanceStatus={maintenanceStatus} />
              </>
            )}

            {/* Separator Controllo */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 py-1.5 bg-white/[0.10] backdrop-blur-2xl text-neutral-700 font-semibold text-xs uppercase tracking-[0.15em] rounded-full shadow-liquid-sm ring-1 ring-white/20 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none">
                  <span className="relative z-10">Controllo</span>
                </span>
              </div>
            </div>

            {/* Azioni On/Off - Liquid Glass Buttons */}
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
                Accendi
              </Button>
              <Button
                liquid
                variant="danger"
                size="lg"
                icon="❄️"
                onClick={handleShutdown}
                disabled={loading || isSpenta || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold"
              >
                Spegni
              </Button>
            </div>

            {/* Status indicator - Liquid Glass */}
            {isAccesa && (
              <div className="mb-6 p-3 sm:p-4 bg-success-500/[0.08] backdrop-blur-2xl rounded-xl text-center shadow-liquid-sm ring-1 ring-success-500/20 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-success-400/10 before:to-transparent before:pointer-events-none">
                <p className="text-xs sm:text-sm font-semibold text-success-700 tracking-wide relative z-10">✓ Stufa in funzione</p>
              </div>
            )}
            {isSpenta && (
              <div className="mb-6 p-3 sm:p-4 bg-neutral-500/[0.08] backdrop-blur-2xl rounded-xl text-center shadow-liquid-sm ring-1 ring-neutral-400/20 ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-neutral-300/10 before:to-transparent before:pointer-events-none">
                <p className="text-xs sm:text-sm font-semibold text-neutral-600 tracking-wide relative z-10">○ Stufa spenta</p>
              </div>
            )}

            {/* Regolazioni - Visibili solo quando stufa accesa */}
            {!isSpenta && (
              <div className="space-y-4">
                <Select
                  label="💨 Livello Ventilazione"
                  value={fanLevel ?? ''}
                  onChange={handleFanChange}
                  options={fanOptions}
                  disabled={needsMaintenance}
                  className="text-base sm:text-lg py-3 sm:py-4"
                />

                <Select
                  label="⚡ Livello Potenza"
                  value={powerLevel ?? ''}
                  onChange={handlePowerChange}
                  options={powerOptions}
                  disabled={needsMaintenance}
                  className="text-base sm:text-lg py-3 sm:py-4"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
