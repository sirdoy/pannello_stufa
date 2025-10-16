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
      window.history.replaceState({}, '', '/netatmo');
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

      console.log('🔍 Netatmo: Checking connection...');

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      console.log('🔍 Netatmo: Response status', response.status, 'reconnect:', data.reconnect, 'error:', data.error);

      // ✅ Handle reconnect flag from token helper
      if (data.reconnect) {
        console.log('❌ Netatmo: Reconnect required -', data.error);
        setConnected(false);
        setError(data.error);
        return;
      }

      // If we get data without error, we're connected
      if (!data.error && data.home_id) {
        console.log('✅ Netatmo: Connected successfully - home_id:', data.home_id);
        setConnected(true);
        setTopology(data);
      } else if (data.error && (data.error.includes('refresh token') || data.error.includes('Nessun refresh token'))) {
        // Not connected - show auth card
        console.log('❌ Netatmo: Not connected - no token');
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
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Errore Connessione Netatmo
          </h2>

          <ErrorAlert message={error} />

          {/* Helpful troubleshooting info */}
          <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
            <p className="text-sm font-semibold text-info-900 mb-2">💡 Suggerimenti:</p>
            <ul className="text-sm text-info-800 space-y-1 ml-4">
              <li>• Verifica di aver completato l&apos;autenticazione Netatmo</li>
              <li>• Controlla che il tuo account Netatmo sia attivo</li>
              <li>• Assicurati di avere almeno un termostato configurato</li>
              <li>• Se il problema persiste, prova a disconnettere e riconnettere</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={checkConnection}>
              🔄 Riprova
            </Button>
            <Button
              variant="outline"
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Controllo Netatmo
        </h1>
        <p className="text-neutral-600">
          Gestisci temperature e riscaldamento di tutte le stanze
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {/* Mode Control */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Modalità Riscaldamento
            </h2>
            <p className="text-sm text-neutral-600">
              {mode === 'schedule' && 'Programmazione attiva'}
              {mode === 'away' && 'Modalità assenza'}
              {mode === 'hg' && 'Antigelo'}
              {mode === 'off' && 'Spento'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mode === 'schedule' ? 'success' : 'outline'}
              onClick={() => handleModeChange('schedule')}
              size="sm"
            >
              ⏰ Programmato
            </Button>
            <Button
              variant={mode === 'away' ? 'warning' : 'outline'}
              onClick={() => handleModeChange('away')}
              size="sm"
            >
              🏃 Assenza
            </Button>
            <Button
              variant={mode === 'hg' ? 'info' : 'outline'}
              onClick={() => handleModeChange('hg')}
              size="sm"
            >
              ❄️ Antigelo
            </Button>
            <Button
              variant={mode === 'off' ? 'danger' : 'outline'}
              onClick={() => handleModeChange('off')}
              size="sm"
            >
              ⏸️ Off
            </Button>
          </div>
        </div>
      </Card>

      {/* Topology Info */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-neutral-600 mb-1">Casa</p>
            <p className="text-lg font-semibold text-neutral-900">
              {topology.home_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">Stanze</p>
            <p className="text-lg font-semibold text-neutral-900">
              {rooms.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">Moduli</p>
            <p className="text-lg font-semibold text-neutral-900">
              {topology.modules?.length || 0}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Button
            variant="outline"
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
        <Card className="p-12 text-center">
          <p className="text-neutral-600">
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
