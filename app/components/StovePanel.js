'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFullSchedulerMode } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';
import { logStoveAction, logNetatmoAction } from '@/lib/logService';
import Card from './ui/Card';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import ModeIndicator from './ui/ModeIndicator';
import Select from './ui/Select';

export default function StovePanel() {
  const router = useRouter();

  const [status, setStatus] = useState('...');
  const [fanLevel, setFanLevel] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [ambientTemp, setAmbientTemp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [semiManualMode, setSemiManualMode] = useState(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState(null);

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
    } catch (err) {
      console.error('Errore modalità scheduler:', err);
    }
  };

  const fetchStatusAndUpdate = useCallback(async () => {
    try {
      const res = await fetch(STOVE_ROUTES.status);
      const json = await res.json();
      const newStatus = json?.StatusDescription || 'sconosciuto';
      setStatus(newStatus);
      await fetchFanLevel();
      await fetchPowerLevel();
      await fetchSchedulerMode();
    } catch (err) {
      console.error('Errore stato:', err);
      setStatus('errore');
    }
  }, []);

  useEffect(() => {
    fetchStatusAndUpdate();
    const interval = setInterval(fetchStatusAndUpdate, 5000);
    return () => clearInterval(interval);
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
      body: JSON.stringify({level}),
    });
    await logStoveAction.setFan(level);
  };

  const handlePowerChange = async (e) => {
    const level = Number(e.target.value);
    setPowerLevel(level);
    await fetch(STOVE_ROUTES.setPower, {
      method: 'POST',
      body: JSON.stringify({level}),
    });
    await logStoveAction.setPower(level);
  };

  const fanOptions = [
    { value: '', label: '-- Seleziona --', disabled: true },
    ...([1, 2, 3, 4, 5, 6].map(level => ({ value: level, label: `Livello ${level}` })))
  ];

  const powerOptions = [
    { value: '', label: '-- Seleziona --', disabled: true },
    ...([0, 1, 2, 3, 4, 5].map(level => ({ value: level, label: `Livello ${level}` })))
  ];

  const handleIgnite = async () => {
    setLoading(true);
    await fetch(STOVE_ROUTES.ignite, {method: 'POST'});
    await logStoveAction.ignite();
    setLoading(false);
  };

  const handleShutdown = async () => {
    setLoading(true);
    await fetch(STOVE_ROUTES.shutdown, {method: 'POST'});
    await logStoveAction.shutdown();
    setLoading(false);
  };

  const getStatusBgColor = (status) => {
    if (!status) return 'bg-neutral-50';
    if (status.includes('WORK')) return 'bg-success-50 border-success-200';
    if (status.includes('OFF')) return 'bg-neutral-50 border-neutral-200';
    if (status.includes('STANDBY')) return 'bg-warning-50 border-warning-200';
    if (status.includes('ERROR')) return 'bg-primary-50 border-primary-200';
    return 'bg-neutral-50 border-neutral-200';
  };

  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <Card className={`p-6 space-y-4 border-2 transition-all duration-300 ${getStatusBgColor(status)}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Stato Stufa</h2>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl hover:bg-white/50 transition-all duration-200 disabled:opacity-50"
            title="Aggiorna stato"
          >
            <span className={`text-2xl inline-block ${refreshing ? 'animate-spin' : ''}`}>
              {refreshing ? '⏳' : '🔄'}
            </span>
          </button>
        </div>

        <StatusBadge status={status} />

        {/* Modalità controllo */}
        <div className="pt-4 border-t border-neutral-200">
          <ModeIndicator
            enabled={schedulerEnabled}
            semiManual={semiManualMode}
            returnToAutoAt={returnToAutoAt}
            onConfigClick={() => router.push('/scheduler')}
          />
        </div>

        {/* Temperatura */}
        {ambientTemp !== null && (
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🌡️</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-info-600">{ambientTemp.toFixed(1)}°C</p>
                <p className="text-xs text-neutral-500">Temperatura ambiente</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Controlli Card */}
      <Card className="p-6 space-y-6">
        <h3 className="text-xl font-bold text-neutral-900">Controlli</h3>

        {/* Accendi/Spegni */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="success"
            size="lg"
            icon="🔥"
            onClick={handleIgnite}
            disabled={loading || isAccesa}
          >
            Accendi
          </Button>
          <Button
            variant="danger"
            size="lg"
            icon="❄️"
            onClick={handleShutdown}
            disabled={loading || isSpenta}
          >
            Spegni
          </Button>
        </div>

        {/* Livelli */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="💨 Livello Ventilazione"
            value={fanLevel ?? ''}
            onChange={handleFanChange}
            options={fanOptions}
          />

          <Select
            label="⚡ Livello Potenza"
            value={powerLevel ?? ''}
            onChange={handlePowerChange}
            options={powerOptions}
          />
        </div>
      </Card>

      {/* Netatmo Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Connessione Netatmo</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNetatmoLogin}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-info-600 hover:bg-info-50 border border-info-200 transition-colors duration-200"
          >
            🔗 Riconnetti Netatmo
          </button>
          <button
            onClick={handleNetatmoLogout}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 border border-primary-200 transition-colors duration-200"
          >
            🔌 Disconnetti Netatmo
          </button>
        </div>
      </Card>
    </div>
  );
}
