/**
 * @deprecated DEPRECATED - DO NOT USE
 *
 * This component uses old design patterns and has been replaced by StoveCard.js
 *
 * Use app/components/devices/stove/StoveCard.js instead.
 *
 * This file is kept for reference only and will be removed in a future version.
 * Last updated: v1.32.0 (2025-12-28)
 * Superseded by: StoveCard (v1.32.0+)
 *
 * @see app/components/devices/stove/StoveCard.js
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getFullSchedulerMode, getNextScheduledAction } from '@/lib/schedulerService';
import { clearSemiManualMode } from '@/lib/schedulerApiClient';
import { STOVE_ROUTES } from '@/lib/routes';
import { logStoveAction, logNetatmoAction, logSchedulerAction } from '@/lib/logService';
import { logError, shouldNotify, sendErrorNotification } from '@/lib/errorMonitor';
import { useVersion } from '@/app/context/VersionContext';
import { getMaintenanceStatus, confirmCleaning } from '@/lib/maintenanceService';
import Card from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import ModeIndicator from './ui/ModeIndicator';
import Select from './ui/Select';
import Skeleton from './ui/Skeleton';
import ErrorAlert from './ui/ErrorAlert';
import Banner from './ui/Banner';
import MaintenanceBar from './MaintenanceBar';
import CronHealthBanner from './CronHealthBanner';
import NetatmoTemperatureReport from './netatmo/NetatmoTemperatureReport';

export default function StovePanel() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  const [status, setStatus] = useState('...');
  const [fanLevel, setFanLevel] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [ambientTemp, setAmbientTemp] = useState(null);
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

  const handleNetatmoLogout = async () => {
    sessionStorage.removeItem('netatmo_refresh_token');
    await logNetatmoAction.disconnect();
    window.location.reload();
  };

  const handleNetatmoLogin = async () => {
    await logNetatmoAction.connect();
    const clientId = process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;
    const netatmoUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read_thermostat&state=manual`;
    window.location.href = netatmoUrl;
  };

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

      // Fetch prossimo cambio scheduler se automatico
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

  // Flag per prevenire double fetch in React Strict Mode
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

      // Log error to Firebase and send notification if needed
      if (newErrorCode !== 0) {
        await logError(newErrorCode, newErrorDescription, {
          status: newStatus,
          source: 'status_monitor',
        });

        // Send notification for new errors
        if (shouldNotify(newErrorCode, previousErrorCode.current)) {
          await sendErrorNotification(newErrorCode, newErrorDescription);
        }
      }

      previousErrorCode.current = newErrorCode;

      await fetchFanLevel();
      await fetchPowerLevel();
      await fetchSchedulerMode();
      await fetchMaintenanceStatus();

      // Check versione app (ogni 5s insieme allo status)
      // checkVersion è ora stabile (no dependencies nel VersionContext)
      await checkVersion();
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('errore');
    } finally {
      setInitialLoading(false);
    }
  }, [checkVersion]);

  useEffect(() => {
    // Previeni double execution in React Strict Mode
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchStatusAndUpdate();
    const interval = setInterval(fetchStatusAndUpdate, 5000);

    return () => {
      clearInterval(interval);
      // Reset ref on unmount per permettere re-mount
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
      body: JSON.stringify({level, source: 'manual'}),
    });
    await logStoveAction.setFan(level);
  };

  const handlePowerChange = async (e) => {
    const level = Number(e.target.value);
    setPowerLevel(level);
    await fetch(STOVE_ROUTES.setPower, {
      method: 'POST',
      body: JSON.stringify({level, source: 'manual'}),
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
      body: JSON.stringify({source: 'manual'}),
    });
    await logStoveAction.ignite();
    setLoading(false);
  };

  const handleShutdown = async () => {
    setLoading(true);
    await fetch(STOVE_ROUTES.shutdown, {
      method: 'POST',
      body: JSON.stringify({source: 'manual'}),
    });
    await logStoveAction.shutdown();
    setLoading(false);
  };

  const handleClearSemiManual = async () => {
    try {
      // Call API to clear semi-manual mode (uses Admin SDK)
      await clearSemiManualMode();
      await logSchedulerAction.clearSemiManual();
      setSemiManualMode(false);
      setReturnToAutoAt(null);

      // Ricarica il prossimo cambio scheduler
      const nextAction = await getNextScheduledAction();
      setNextScheduledAction(nextAction);
    } catch (error) {
      console.error('Errore nella disattivazione modalità semi-manuale:', error);
      // Optionally show error to user
    }
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Maintenance Cleaning Banner - When cleaning needed */}
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
              >
                {cleaningInProgress ? '⏳ Conferma in corso...' : '✓ Ho Pulito la Stufa'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/stove/maintenance')}
              >
                ⚙️ Vai alle Impostazioni
              </Button>
            </>
          }
        />
      )}

      {/* Error Alert - Always on top if present */}
      {errorCode !== 0 && (
        <ErrorAlert
          errorCode={errorCode}
          errorDescription={errorDescription}
          showDetailsButton={true}
          showSuggestion={true}
        />
      )}

      {/* Hero Section - Stato */}
      <Card className={`overflow-hidden border-2 transition-all duration-300 ${getStatusBgColor(status)}`}>
        <div className="relative">
          {/* Header con gradiente */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500"></div>

          <div className="p-8">
            {/* Top bar: Titolo e Refresh */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Stato Stufa</h2>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="group relative p-3 rounded-xl hover:bg-white/70 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-transparent"
                title="Aggiorna stato"
              >
                <span className={`text-xl inline-block ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
              </button>
            </div>

            {/* Main Status Display - Grid 2 colonne */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Colonna 1: Status principale */}
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm relative">
                {/* Error Badge - Pulsante, in alto a destra */}
                {errorCode !== 0 && (
                  <div className="absolute -top-2 -right-2 animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-75"></div>
                      <div className="relative bg-primary-600 text-white px-3 py-1.5 rounded-full border-2 border-white shadow-lg">
                        <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-2">
                  <span className="text-6xl drop-shadow-lg">{getStatusIcon(status)}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                    <p className={`text-3xl font-bold ${getStatusColor(status)}`}>
                      {status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonna 2: Info aggiuntive */}
              <div className="grid grid-cols-2 gap-3">
                {/* Ventola */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm">
                  <span className="text-3xl mb-2">💨</span>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">Ventola</p>
                  <p className="text-2xl font-bold text-info-600">{fanLevel ?? '-'}<span className="text-base text-neutral-400">/6</span></p>
                </div>

                {/* Potenza */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm">
                  <span className="text-3xl mb-2">⚡</span>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">Potenza</p>
                  <p className="text-2xl font-bold text-accent-600">{powerLevel ?? '-'}<span className="text-base text-neutral-400">/5</span></p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Modalità Controllo</span>
              </div>
            </div>

            {/* Mode Indicator - Redesign inline */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 backdrop-blur-sm rounded-xl border border-neutral-200/60">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  schedulerEnabled && semiManualMode ? 'bg-warning-100 border-2 border-warning-300' :
                  schedulerEnabled ? 'bg-success-100 border-2 border-success-300' :
                  'bg-accent-100 border-2 border-accent-300'
                }`}>
                  <span className="text-3xl">
                    {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-bold ${
                    schedulerEnabled && semiManualMode ? 'text-warning-700' :
                    schedulerEnabled ? 'text-success-700' :
                    'text-accent-700'
                  }`}>
                    {schedulerEnabled && semiManualMode ? 'Modalità Semi-manuale' : schedulerEnabled ? 'Modalità Automatica' : 'Modalità Manuale'}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                      (() => {
                        const date = new Date(returnToAutoAt);
                        const time = date.toLocaleString('it-IT', {hour: '2-digit', minute: '2-digit'});
                        const day = date.toLocaleString('it-IT', {day: '2-digit', month: '2-digit'});
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
                            const time = date.toLocaleString('it-IT', {hour: '2-digit', minute: '2-digit'});
                            const day = date.toLocaleString('it-IT', {day: '2-digit', month: '2-digit'});
                            return `${time} del ${day}`;
                          })()}
                        </span>
                        {nextScheduledAction.action === 'ignite' && (
                          <span className="text-neutral-400"> • Potenza {nextScheduledAction.power}, Ventola {nextScheduledAction.fan}</span>
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
              <div className="flex gap-3 w-full sm:w-auto">
                {schedulerEnabled && semiManualMode && (
                  <button
                    onClick={handleClearSemiManual}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-semibold text-warning-700 bg-warning-50 hover:bg-warning-100 border border-warning-200 hover:border-warning-300 transition-all duration-200 active:scale-95 whitespace-nowrap"
                  >
                    ↩️ Torna in Automatico
                  </button>
                )}
                <button
                  onClick={() => router.push('/stove/scheduler')}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-semibold text-info-700 bg-info-50 hover:bg-info-100 border border-info-200 hover:border-info-300 transition-all duration-200 active:scale-95"
                >
                  Configura
                </button>
              </div>
            </div>

            {/* Cron Health Warning - Integrated inline */}
            <div className="mt-6">
              <CronHealthBanner variant="inline" />
            </div>

            {/* Separator Manutenzione */}
            {maintenanceStatus && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Stato Manutenzione</span>
                  </div>
                </div>

                {/* Maintenance Bar - Integrato */}
                <MaintenanceBar maintenanceStatus={maintenanceStatus} />
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Controlli Principali - Grid responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-neutral-900 mb-6">⚡ Azioni Rapide</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="success"
              size="lg"
              icon="🔥"
              onClick={handleIgnite}
              disabled={loading || isAccesa || needsMaintenance}
              className="h-24 text-lg"
            >
              Accendi
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon="❄️"
              onClick={handleShutdown}
              disabled={loading || isSpenta || needsMaintenance}
              className="h-24 text-lg"
            >
              Spegni
            </Button>
          </div>

          {/* Indicatore stato azione */}
          {isAccesa && (
            <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-xl text-center">
              <p className="text-sm font-medium text-success-700">✓ Stufa in funzione</p>
            </div>
          )}
          {isSpenta && (
            <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
              <p className="text-sm font-medium text-neutral-600">○ Stufa spenta</p>
            </div>
          )}
        </Card>

        {/* Livelli - Visibile solo quando stufa accesa */}
        {!isSpenta && (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">⚙️ Regolazioni</h3>

            <div className="space-y-5">
              <Select
                label="💨 Livello Ventilazione"
                value={fanLevel ?? ''}
                onChange={handleFanChange}
                options={fanOptions}
                disabled={needsMaintenance}
                className="text-lg py-4"
              />

              <Select
                label="⚡ Livello Potenza"
                value={powerLevel ?? ''}
                onChange={handlePowerChange}
                options={powerOptions}
                disabled={needsMaintenance}
                className="text-lg py-4"
              />
            </div>
          </Card>
        )}
      </div>

      {/* Netatmo Temperature Report */}
      <NetatmoTemperatureReport />
    </div>
  );
}
