'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NETATMO_ROUTES } from '@/lib/routes';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Skeleton from '../../ui/Skeleton';
import Banner from '../../ui/Banner';

/**
 * ThermostatCard - Complete thermostat control for homepage
 * Summary view of Netatmo integration with quick controls
 */
export default function ThermostatCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState(null);
  const [status, setStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []);

  // Poll status every 30 seconds if connected
  useEffect(() => {
    if (!topology) return;
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      pollingStartedRef.current = false;
    };
  }, [topology]);

  // Get rooms with status
  const rooms = topology?.rooms || [];
  const roomsWithStatus = rooms.map(room => {
    const roomStatus = status?.rooms?.find(r => r.room_id === room.id);
    return {
      ...room,
      temperature: roomStatus?.temperature,
      setpoint: roomStatus?.setpoint,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
    };
  }).filter(r => r.temperature !== undefined);

  // Auto-select first room if not already selected
  useEffect(() => {
    if (roomsWithStatus.length > 0 && !selectedRoomId) {
      setSelectedRoomId(roomsWithStatus[0].id);
    }
  }, [roomsWithStatus.length, selectedRoomId]);

  const selectedRoom = roomsWithStatus.find(r => r.id === selectedRoomId) || roomsWithStatus[0];
  const mode = status?.mode || 'schedule';
  const hasHeating = roomsWithStatus.some(r => r.heating);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      if (data.reconnect) {
        setConnected(false);
        setError(data.error);
        return;
      }

      if (!data.error && data.home_id) {
        setConnected(true);
        setTopology(data);
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error('Errore connessione termostato:', err);
      setConnected(false);
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

      if (data.reconnect) {
        setConnected(false);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus(data);
    } catch (err) {
      console.error('Errore fetch status termostato:', err);
      setError(err.message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkConnection();
    if (topology) await fetchStatus();
    setRefreshing(false);
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
      if (data.error) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTemperatureChange(roomId, temp) {
    try {
      setError(null);
      const response = await fetch(NETATMO_ROUTES.setRoomThermPoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          mode: 'manual',
          temp,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  }

  const handleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;
    window.location.href = `https://api.netatmo.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read_thermostat%20write_thermostat&state=manual`;
  };

  if (loading) {
    return <Skeleton.ThermostatCard />;
  }

  if (!connected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card liquid className="p-4 sm:p-6 lg:p-8 border-2 border-info-200 bg-info-50">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-info-400 to-info-500"></div>

            <div className="space-y-4 sm:space-y-6 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">🌡️ Termostato</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-200 rounded-full">
                  <span className="w-2 h-2 bg-neutral-500 rounded-full"></span>
                  <span className="text-xs font-medium text-neutral-700">Offline</span>
                </div>
              </div>

              {/* Not connected message */}
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔌</div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Termostato Non Connesso
                </h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Connetti il tuo account Netatmo per controllare il riscaldamento
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    liquid
                    variant="success"
                    onClick={handleAuth}
                    icon="🔗"
                  >
                    Connetti Netatmo
                  </Button>
                  <Button
                    liquid
                    variant="outline"
                    onClick={() => router.push('/thermostat')}
                  >
                    Maggiori Info
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-xs text-primary-700">⚠️ {error}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Banner
          liquid
          variant="error"
          icon="⚠️"
          title="Errore Connessione"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Main Status Card */}
      <Card liquid className={`overflow-hidden border-2 transition-all duration-300 ${hasHeating ? 'bg-warning-50 border-warning-200' : 'bg-info-50 border-info-200'}`}>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-info-400 to-info-500"></div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">🌡️ Termostato</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group relative p-2 sm:p-3 rounded-xl hover:bg-white/70 active:scale-95 transition-all duration-200 disabled:opacity-50"
                title="Aggiorna stato"
              >
                <span className={`text-lg sm:text-xl inline-block ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
              </button>
            </div>

            {/* Room Selection */}
            {roomsWithStatus.length > 1 && (
              <div className="mb-4 sm:mb-6">
                <Select
                  liquid
                  label="🚪 Seleziona Stanza"
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  options={roomsWithStatus.map(room => ({
                    value: room.id,
                    label: room.name
                  }))}
                  className="text-base sm:text-lg"
                />
              </div>
            )}

            {/* Selected Room Temperature */}
            {selectedRoom ? (
              <div className="space-y-4 mb-4 sm:mb-6">
                <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm">
                  {/* Room name (solo se c'è una sola stanza) */}
                  {roomsWithStatus.length === 1 && (
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                      {selectedRoom.name}
                    </p>
                  )}

                  <div className="flex items-center gap-6">
                    {/* Current temp */}
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 mb-1">Attuale</p>
                      <p className="text-4xl sm:text-5xl font-bold text-neutral-800">
                        {selectedRoom.temperature}°
                      </p>
                    </div>

                    {/* Arrow */}
                    {selectedRoom.setpoint && (
                      <>
                        <div className="text-2xl text-neutral-400">→</div>

                        {/* Target temp */}
                        <div className="text-center">
                          <p className="text-xs text-neutral-500 mb-1">Target</p>
                          <p className="text-4xl sm:text-5xl font-bold text-info-600">
                            {selectedRoom.setpoint}°
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Heating status */}
                  {selectedRoom.heating && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-warning-100 rounded-full">
                      <span className="text-lg animate-pulse">🔥</span>
                      <span className="text-xs font-semibold text-warning-700">Riscaldamento Attivo</span>
                    </div>
                  )}
                </div>

                {/* Quick temperature controls */}
                {selectedRoom.setpoint && (
                  <div className="flex items-center gap-3">
                    <Button
                      liquid
                      variant="outline"
                      size="sm"
                      icon="➖"
                      onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint - 0.5)}
                      className="flex-1"
                    >
                      -0.5°
                    </Button>
                    <div className="text-center px-4">
                      <p className="text-xs text-neutral-500">Imposta</p>
                      <p className="text-lg font-bold text-neutral-800">{selectedRoom.setpoint}°</p>
                    </div>
                    <Button
                      liquid
                      variant="outline"
                      size="sm"
                      icon="➕"
                      onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint + 0.5)}
                      className="flex-1"
                    >
                      +0.5°
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500">Nessuna temperatura disponibile</p>
              </div>
            )}

            {/* Separator */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Modalità</span>
              </div>
            </div>

            {/* Mode Control */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => handleModeChange('schedule')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                  mode === 'schedule'
                    ? 'bg-success-100 border-success-300 text-success-700'
                    : 'bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white/80'
                }`}
              >
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xs font-semibold">Programmato</div>
              </button>

              <button
                onClick={() => handleModeChange('away')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                  mode === 'away'
                    ? 'bg-warning-100 border-warning-300 text-warning-700'
                    : 'bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white/80'
                }`}
              >
                <div className="text-2xl mb-1">🏃</div>
                <div className="text-xs font-semibold">Assenza</div>
              </button>

              <button
                onClick={() => handleModeChange('hg')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                  mode === 'hg'
                    ? 'bg-info-100 border-info-300 text-info-700'
                    : 'bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white/80'
                }`}
              >
                <div className="text-2xl mb-1">❄️</div>
                <div className="text-xs font-semibold">Antigelo</div>
              </button>

              <button
                onClick={() => handleModeChange('off')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                  mode === 'off'
                    ? 'bg-neutral-200 border-neutral-400 text-neutral-700'
                    : 'bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white/80'
                }`}
              >
                <div className="text-2xl mb-1">⏸️</div>
                <div className="text-xs font-semibold">Off</div>
              </button>
            </div>

            {/* Separator */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Informazioni</span>
              </div>
            </div>

            {/* Summary Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                <span className="text-2xl sm:text-3xl mb-1">🏠</span>
                <p className="text-xs text-neutral-500">Casa</p>
                <p className="text-sm font-bold text-neutral-800 truncate w-full text-center">
                  {topology.home_name || '-'}
                </p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                <span className="text-2xl sm:text-3xl mb-1">🚪</span>
                <p className="text-xs text-neutral-500">Stanze</p>
                <p className="text-sm font-bold text-neutral-800">{rooms.length}</p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 col-span-2 sm:col-span-1">
                <span className="text-2xl sm:text-3xl mb-1">📡</span>
                <p className="text-xs text-neutral-500">Dispositivi</p>
                <p className="text-sm font-bold text-neutral-800">{topology.modules?.length || 0}</p>
              </div>
            </div>

            {/* Link to full page */}
            <div className="mt-4 sm:mt-6">
              <Button
                liquid
                variant="outline"
                onClick={() => router.push('/thermostat')}
                className="w-full"
                size="sm"
              >
                Vedi Tutte le Stanze →
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
