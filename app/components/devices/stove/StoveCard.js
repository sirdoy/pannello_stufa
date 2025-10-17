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

  const getStatusBgColor = (status) => {
    if (!status) return 'bg-neutral-50';
    if (status.includes('WORK')) return 'bg-success-50 border-success-200';
    if (status.includes('OFF')) return 'bg-neutral-50 border-neutral-200';
    if (status.includes('STANDBY')) return 'bg-warning-50 border-warning-200';
    if (status.includes('ERROR')) return 'bg-primary-50 border-primary-200';
    return 'bg-neutral-50 border-neutral-200';
  };

  const getStatusIcon = (status) => {
    if (!status) return '❔';
    if (status.includes('WORK')) return '🔥';
    if (status.includes('OFF')) return '❄️';
    if (status.includes('ERROR')) return '⚠️';
    if (status.includes('START')) return '⏱️';
    if (status.includes('WAIT')) return '💤';
    return '❔';
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-neutral-500';
    if (status.includes('WORK')) return 'text-success-600';
    if (status.includes('OFF')) return 'text-neutral-500';
    if (status.includes('STANDBY')) return 'text-warning-500';
    if (status.includes('ERROR')) return 'text-primary-600';
    return 'text-neutral-500';
  };

  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');
  const needsMaintenance = maintenanceStatus?.needsCleaning || false;

  if (initialLoading) {
    return <Skeleton.StovePanel />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Maintenance Cleaning Banner */}
      {needsMaintenance && (
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

      {/* Main Status Card */}
      <Card className={`overflow-hidden border-2 transition-all duration-300 ${getStatusBgColor(status)}`}>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500"></div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">🔥 Stufa</h2>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="group relative p-2 sm:p-3 rounded-xl hover:bg-white/70 active:scale-95 transition-all duration-200 disabled:opacity-50"
                title="Aggiorna stato"
              >
                <span className={`text-lg sm:text-xl inline-block ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
              </button>
            </div>

            {/* Main Status Display - Mobile First */}
            <div className="space-y-4 mb-4 sm:mb-6">
              {/* Status principale */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm relative">
                {/* Error Badge */}
                {errorCode !== 0 && (
                  <div className="absolute -top-2 -right-2 animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-75"></div>
                      <div className="relative bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-white shadow-lg">
                        <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-5xl sm:text-6xl drop-shadow-lg">{getStatusIcon(status)}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${getStatusColor(status)}`}>
                      {status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ventola e Potenza - Grid responsive */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm">
                  <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">💨</span>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">Ventola</p>
                  <p className="text-xl sm:text-2xl font-bold text-info-600">{fanLevel ?? '-'}<span className="text-sm sm:text-base text-neutral-400">/6</span></p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm">
                  <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">⚡</span>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">Potenza</p>
                  <p className="text-xl sm:text-2xl font-bold text-accent-600">{powerLevel ?? '-'}<span className="text-sm sm:text-base text-neutral-400">/5</span></p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Modalità Controllo</span>
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-white/40 backdrop-blur-sm rounded-xl border border-neutral-200/60">
              <div className="flex items-center gap-3 sm:gap-4">
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
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Manutenzione</span>
                  </div>
                </div>

                <MaintenanceBar maintenanceStatus={maintenanceStatus} />
              </>
            )}

            {/* Separator Controllo */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Controllo</span>
              </div>
            </div>

            {/* Azioni On/Off */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Button
                variant="success"
                size="lg"
                icon="🔥"
                onClick={handleIgnite}
                disabled={loading || isAccesa || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg"
              >
                Accendi
              </Button>
              <Button
                variant="danger"
                size="lg"
                icon="❄️"
                onClick={handleShutdown}
                disabled={loading || isSpenta || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg"
              >
                Spegni
              </Button>
            </div>

            {/* Status indicator */}
            {isAccesa && (
              <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-success-50 border border-success-200 rounded-xl text-center">
                <p className="text-xs sm:text-sm font-medium text-success-700">✓ Stufa in funzione</p>
              </div>
            )}
            {isSpenta && (
              <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-600">○ Stufa spenta</p>
              </div>
            )}

            {/* Regolazioni - Visibili solo quando stufa accesa */}
            {!isSpenta && (
              <div className="space-y-4 sm:space-y-5">
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
