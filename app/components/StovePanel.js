'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFullSchedulerMode } from '@/lib/schedulerService';

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

  const handleNetatmoLogout = () => {
    sessionStorage.removeItem('netatmo_refresh_token');
    window.location.reload();
  };

  const handleNetatmoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;
    const netatmoUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read_thermostat&state=manual`;
    window.location.href = netatmoUrl;
  };

  const fetchFanLevel = async () => {
    try {
      const res = await fetch('/api/stove/getFan');
      const json = await res.json();
      setFanLevel(json?.Result ?? 3);
    } catch (err) {
      console.error('Errore livello ventola:', err);
    }
  };

  const fetchPowerLevel = async () => {
    try {
      const res = await fetch('/api/stove/getPower');
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
      const res = await fetch('/api/stove/status');
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

  const logAction = async (action, value = null) => {
    await fetch('/api/log/add', {
      method: 'POST',
      body: JSON.stringify({action, ...(value !== null && {value})}),
    });
  };

  const handleFanChange = async (e) => {
    const level = Number(e.target.value);
    setFanLevel(level);
    await fetch('/api/stove/setFan', {
      method: 'POST',
      body: JSON.stringify({level}),
    });
    await logAction('Set ventola', level);
  };

  const handlePowerChange = async (e) => {
    const level = Number(e.target.value);
    setPowerLevel(level);
    await fetch('/api/stove/setPower', {
      method: 'POST',
      body: JSON.stringify({level}),
    });
    await logAction('Set potenza', level);
  };

  const handleIgnite = async () => {
    setLoading(true);
    await fetch('/api/stove/ignite', {method: 'POST'});
    await logAction('Accensione');
    setLoading(false);
  };

  const handleShutdown = async () => {
    setLoading(true);
    await fetch('/api/stove/shutdown', {method: 'POST'});
    await logAction('Spegnimento');
    setLoading(false);
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    if (status.includes('WORK')) return 'text-green-600';
    if (status.includes('OFF')) return 'text-red-600';
    if (status.includes('STANDBY')) return 'text-yellow-600';
    if (status.includes('ERROR')) return 'text-red-700 font-bold';
    return 'text-gray-500';
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

  const isAccesa = status?.includes('WORK') || status?.includes('START');
  const isSpenta = status?.includes('OFF') || status?.includes('ERROR') || status?.includes('WAIT');

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-6 border">
      <h2 className="text-2xl font-semibold text-center">Pannello Stufa</h2>

      <div className="flex justify-between mb-4">
        <button
          onClick={handleNetatmoLogin}
          className="text-sm text-blue-600 underline"
        >
          Riconnetti Netatmo
        </button>
        <button
          onClick={handleNetatmoLogout}
          className="text-sm text-red-600 underline"
        >
          Disconnetti Netatmo
        </button>
      </div>

      <div className="text-center">
        <span className="text-gray-600 text-sm">Stato stufa:</span>
        <p className={`text-xl font-semibold mt-1 flex items-center justify-center gap-2 ${getStatusColor(status)}`}>
          <span>{getStatusIcon(status)}</span>
          <span>{status}</span>
        </p>
        <div className="text-center mt-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="text-sm text-blue-500 hover:underline flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                Aggiornamento...
              </>
            ) : (
              <>
                🔄
              </>
            )}
          </button>
        </div>

      </div>

      <div className="text-center">
        <span className="text-gray-600 text-sm">Modalità controllo:</span>
        <div className={`text-base font-medium mt-1 flex flex-col items-center justify-center gap-1 ${
          schedulerEnabled && semiManualMode ? 'text-yellow-600' :
          schedulerEnabled ? 'text-green-600' : 'text-orange-600'
        }`}>
          <div className="flex items-center gap-2">
            <span>{schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}</span>
            <span>
              {schedulerEnabled && semiManualMode ? 'Semi-manuale' :
               schedulerEnabled ? 'Automatica' : 'Manuale'}
            </span>
            <button
              onClick={() => router.push('/scheduler')}
              className="ml-2 text-xs text-blue-500 hover:underline"
            >
              Configura
            </button>
          </div>
          {schedulerEnabled && semiManualMode && returnToAutoAt && (
            <span className="text-xs text-gray-500">
              Ritorno automatico: {new Date(returnToAutoAt).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>

      {ambientTemp !== null && (
        <div className="text-center">
          <span className="text-gray-600 text-sm">Temperatura ambiente:</span>
          <p className="text-xl font-medium text-sky-600">{ambientTemp.toFixed(1)}°C</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleIgnite}
          disabled={loading || isAccesa}
          className={`w-1/2 py-2 px-4 rounded-xl text-white ${
            isAccesa ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Accendi
        </button>
        <button
          onClick={handleShutdown}
          disabled={loading || isSpenta}
          className={`w-1/2 py-2 px-4 rounded-xl text-white ${
            isSpenta ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Spegni
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Livello Ventilazione</label>
        <select
          value={fanLevel ?? ''}
          onChange={handleFanChange}
          className="w-full border rounded-lg p-2"
        >
          <option disabled value="">-- Seleziona --</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Livello Potenza</label>
        <select
          value={powerLevel ?? ''}
          onChange={handlePowerChange}
          className="w-full border rounded-lg p-2"
        >
          <option disabled value="">-- Seleziona --</option>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
