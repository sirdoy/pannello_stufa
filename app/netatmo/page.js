'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Skeleton, ErrorAlert } from '@/app/components/ui';
import RoomCard from '@/app/components/netatmo/RoomCard';
import NetatmoAuthCard from '@/app/components/netatmo/NetatmoAuthCard';
import { NETATMO_ROUTES } from '@/lib/routes';

export default function NetatmoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState(null);
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('schedule');
  const [refreshing, setRefreshing] = useState(false);

  // Check connection status on mount
  useEffect(() => {
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

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [topology]);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      // If we get data without error, we're connected
      if (!data.error && data.home_id) {
        setConnected(true);
        setTopology(data);
      } else if (data.error && (data.error.includes('refresh token') || data.error.includes('Nessun refresh token'))) {
        // Not connected - show auth card
        setConnected(false);
      } else {
        // Other error - still connected but something else failed
        setConnected(true);
        throw new Error(data.error);
      }
    } catch (err) {
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
    return <NetatmoAuthCard />;
  }

  // Show error if topology failed to load
  if (!topology && error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert message={`Impossibile caricare la configurazione Netatmo: ${error}`} />
        <div className="mt-4">
          <Button variant="primary" onClick={checkConnection}>
            🔄 Riprova
          </Button>
        </div>
      </div>
    );
  }

  if (!topology) {
    return <Skeleton.NetatmoPage />;
  }

  const rooms = topology.rooms || [];
  const roomsWithStatus = rooms.map(room => {
    const roomStatus = status?.rooms?.find(r => r.room_id === room.id);
    return {
      ...room,
      temperature: roomStatus?.temperature,
      setpoint: roomStatus?.setpoint,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
    };
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
        {roomsWithStatus.map(room => (
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
