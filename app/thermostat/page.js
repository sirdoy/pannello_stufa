'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Skeleton, ErrorAlert, Banner } from '@/app/components/ui';
import RoomCard from '@/app/components/netatmo/RoomCard';
import NetatmoAuthCard from '@/app/components/netatmo/NetatmoAuthCard';
import { NETATMO_ROUTES } from '@/lib/routes';

function NetatmoContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState(null);
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('schedule');
  const [refreshing, setRefreshing] = useState(false);
  const [oauthError, setOauthError] = useState(null);

  // Flags per prevenire double fetch in React Strict Mode
  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Check for OAuth callback errors in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
      // Clear error from URL without reload
      window.history.replaceState({}, '', '/thermostat');
    }
  }, [searchParams]);

  // Check connection status on mount
  useEffect(() => {
    // Skip se già controllato (React 18 Strict Mode double mount)
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;

    checkConnection();
  }, []);

  // Fetch topology if connected
  useEffect(() => {
    if (connected) {
      fetchTopology();
    }
  }, [connected]);

  // Poll status every 30 seconds
  useEffect(() => {
    if (!topology) return;

    // Previeni double execution in React Strict Mode
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      // Reset ref on unmount per permettere re-mount
      pollingStartedRef.current = false;
    };
  }, [topology]);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      // ✅ Handle reconnect flag from token helper
      if (data.reconnect) {
        setConnected(false);
        setError(data.error);
        return;
      }

      // If we get data without error, we're connected
      if (!data.error && data.home_id) {
        setConnected(true);
        setTopology(data);
      } else if (data.error && (data.error.includes('refresh token') || data.error.includes('Nessun refresh token'))) {
        // Not connected - show auth card
        setConnected(false);
      } else {
        // Other error - still connected but something else failed
        console.error('❌ Netatmo: API error -', data.error);
        setConnected(true);
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('❌ Netatmo: Exception in checkConnection -', err);
      // If fetch fails, check if it's auth error
      if (err.message && (err.message.includes('refresh token') || err.message.includes('Nessun refresh token'))) {
        setConnected(false);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchTopology() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTopology(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatus() {
    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus(data);
      setMode(data.mode || 'schedule');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleModeChange(newMode) {
    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMode(newMode);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchTopology();
    await fetchStatus();
    setRefreshing(false);
  }

  if (loading) {
    return <Skeleton.NetatmoPage />;
  }

  // Show auth card if not connected
  if (!connected) {
    return (
      <>
        {/* Show OAuth error banner if present */}
        {oauthError && (
          <div className="max-w-2xl mx-auto px-4 pt-8">
            <Banner
              variant="error"
              icon="❌"
              title="Errore Connessione Netatmo"
              description={oauthError}
              dismissible
              onDismiss={() => setOauthError(null)}
            />
          </div>
        )}
        <NetatmoAuthCard />
      </>
    );
  }

  // Show error if topology failed to load
  if (!topology && error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card liquid className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Errore Connessione Netatmo
          </h2>

          <ErrorAlert message={error} />

          {/* Helpful troubleshooting info */}
          <div className="mt-6 p-4 bg-info-500/10 dark:bg-info-500/20 border border-info-500/20 dark:border-info-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-sm font-bold text-info-800 dark:text-info-300 mb-2">💡 Suggerimenti:</p>
            <ul className="text-sm text-info-700 dark:text-info-400 space-y-1 ml-4">
              <li>• Verifica di aver completato l&apos;autenticazione Netatmo</li>
              <li>• Controlla che il tuo account Netatmo sia attivo</li>
              <li>• Assicurati di avere almeno un termostato configurato</li>
              <li>• Se il problema persiste, prova a disconnettere e riconnettere</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button liquid variant="primary" onClick={checkConnection}>
              🔄 Riprova
            </Button>
            <Button
              liquid
              variant="secondary"
              onClick={() => {
                setConnected(false);
                setError(null);
                setTopology(null);
              }}
            >
              🔗 Riconnetti Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!topology) {
    return <Skeleton.NetatmoPage />;
  }

  const rooms = topology.rooms || [];
  const modules = topology.modules || [];

  // Map rooms with status and enrich with module info
  const roomsWithStatus = rooms.map(room => {
    const roomStatus = status?.rooms?.find(r => r.room_id === room.id);

    // Find modules for this room (exclude relays - NAPlug)
    const roomModules = room.modules?.map(moduleId => {
      return modules.find(m => m.id === moduleId);
    }).filter(Boolean).filter(m => m.type !== 'NAPlug') || [];

    // Determine device type
    const hasThermostat = roomModules.some(m => m.type === 'NATherm1' || m.type === 'OTH');
    const hasValve = roomModules.some(m => m.type === 'NRV');

    return {
      ...room,
      temperature: roomStatus?.temperature,
      setpoint: roomStatus?.setpoint,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
      roomModules, // Add module details (without relays)
      deviceType: hasThermostat ? 'thermostat' : hasValve ? 'valve' : 'unknown',
    };
  });

  // Sort rooms: thermostats first, then valves, then by temperature availability
  const sortedRooms = roomsWithStatus.sort((a, b) => {
    // Priority 1: Thermostats first
    if (a.deviceType === 'thermostat' && b.deviceType !== 'thermostat') return -1;
    if (a.deviceType !== 'thermostat' && b.deviceType === 'thermostat') return 1;

    // Priority 2: Valves before unknown
    if (a.deviceType === 'valve' && b.deviceType === 'unknown') return -1;
    if (a.deviceType === 'unknown' && b.deviceType === 'valve') return 1;

    // Priority 3: Rooms with temperature first
    const aHasTemp = a.temperature !== undefined;
    const bHasTemp = b.temperature !== undefined;
    if (aHasTemp && !bHasTemp) return -1;
    if (!aHasTemp && bHasTemp) return 1;

    return 0;
  });

  // Mode button styles
  const getModeButtonClasses = (currentMode, targetMode) => {
    const baseClasses = 'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2';
    const isActive = currentMode === targetMode;

    const activeStyles = {
      schedule: 'bg-success-500/20 dark:bg-success-500/30 text-success-700 dark:text-success-300 border border-success-500/30 dark:border-success-500/40 shadow-sm',
      away: 'bg-warning-500/20 dark:bg-warning-500/30 text-warning-700 dark:text-warning-300 border border-warning-500/30 dark:border-warning-500/40 shadow-sm',
      hg: 'bg-info-500/20 dark:bg-info-500/30 text-info-700 dark:text-info-300 border border-info-500/30 dark:border-info-500/40 shadow-sm',
      off: 'bg-neutral-500/20 dark:bg-neutral-500/30 text-neutral-700 dark:text-neutral-300 border border-neutral-500/30 dark:border-neutral-500/40 shadow-sm',
    };

    const inactiveStyle = 'bg-white/[0.08] dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300 border border-white/20 dark:border-white/10 hover:bg-white/[0.15] dark:hover:bg-white/[0.10] backdrop-blur-sm';

    return `${baseClasses} ${isActive ? activeStyles[targetMode] : inactiveStyle}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-100 mb-2">
          Controllo Netatmo
        </h1>
        <p className="text-neutral-300">
          Gestisci temperature e riscaldamento di tutte le stanze
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {/* Mode Control - Liquid Glass Card */}
      <Card liquid className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Modalità Riscaldamento
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {mode === 'schedule' && 'Programmazione attiva'}
              {mode === 'away' && 'Modalità assenza'}
              {mode === 'hg' && 'Antigelo'}
              {mode === 'off' && 'Spento'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleModeChange('schedule')}
              className={getModeButtonClasses(mode, 'schedule')}
            >
              <span>⏰</span>
              <span>Programmato</span>
            </button>
            <button
              onClick={() => handleModeChange('away')}
              className={getModeButtonClasses(mode, 'away')}
            >
              <span>🏃</span>
              <span>Assenza</span>
            </button>
            <button
              onClick={() => handleModeChange('hg')}
              className={getModeButtonClasses(mode, 'hg')}
            >
              <span>❄️</span>
              <span>Antigelo</span>
            </button>
            <button
              onClick={() => handleModeChange('off')}
              className={getModeButtonClasses(mode, 'off')}
            >
              <span>⏸️</span>
              <span>Off</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Topology Info - Liquid Glass Card */}
      <Card liquid className="p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-sm">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Casa</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {topology.home_name}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-sm">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Stanze</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {rooms.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-sm">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Moduli</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {topology.modules?.length || 0}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
          <Button
            liquid
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            size="sm"
          >
            🔄 Aggiorna Configurazione
          </Button>
        </div>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onRefresh={fetchStatus}
          />
        ))}
      </div>

      {/* Empty State */}
      {rooms.length === 0 && (
        <Card liquid className="p-12 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Nessuna stanza configurata. Aggiungi dispositivi Netatmo tramite l&apos;app ufficiale.
          </p>
        </Card>
      )}
    </div>
  );
}

// ✅ Wrap with Suspense for useSearchParams
export default function NetatmoPage() {
  return (
    <Suspense fallback={<Skeleton.NetatmoPage />}>
      <NetatmoContent />
    </Suspense>
  );
}
