'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NETATMO_ROUTES } from '@/lib/routes';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Skeleton from '../../ui/Skeleton';
import Banner from '../../ui/Banner';
import LoadingOverlay from '../../ui/LoadingOverlay';
import { Divider, Heading, Text, EmptyState } from '../../ui';

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
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState(null);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

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
  }, [roomsWithStatus, selectedRoomId]);

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
        // Rate limiting error - don't show to user, just skip this poll
        if (data.error.includes('concurrency limited')) {
          console.warn('⚠️ Netatmo rate limit - skipping this poll');
          return;
        }
        throw new Error(data.error);
      }

      setStatus(data);
    } catch (err) {
      console.error('Errore fetch status termostato:', err);
      // Don't show rate limit errors to user
      if (!err.message.includes('concurrency limited')) {
        setError(err.message);
      }
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
      setLoadingMessage('Cambio modalità termostato...');
      setRefreshing(true);
      setError(null);
      const response = await fetch(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Aggiorna status dopo il comando
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleTemperatureChange(roomId, temp) {
    try {
      setLoadingMessage('Modifica temperatura...');
      setRefreshing(true);
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
      // Aggiorna status dopo il comando
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCalibrateValves() {
    try {
      setLoadingMessage('Calibrazione valvole...');
      setRefreshing(true);
      setError(null);
      setCalibrating(true);
      setCalibrationSuccess(null);

      const response = await fetch(NETATMO_ROUTES.calibrate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        setCalibrationSuccess(true);
        // Clear success message after 5 seconds
        setTimeout(() => setCalibrationSuccess(null), 5000);
      }

      // Aggiorna status dopo il comando
      await fetchStatus();
    } catch (err) {
      console.error('Errore calibrazione valvole:', err);
      setError(`Calibrazione fallita: ${err.message}`);
      setCalibrationSuccess(false);
    } finally {
      setCalibrating(false);
      setRefreshing(false);
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
        <Card liquid className="overflow-visible transition-all duration-500">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-info-400 to-info-500 opacity-80"></div>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">🌡️</span>
                  <Heading level={2} size="xl">Termostato</Heading>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <span className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full"></span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Offline</span>
                </div>
              </div>

              {/* Not connected message */}
              <EmptyState
                icon="🔌"
                title="Termostato Non Connesso"
                description="Connetti il tuo account Netatmo per controllare il riscaldamento"
                action={
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
                }
              />

              {error && (
                <div className="mt-4">
                  <Banner
                    liquid
                    variant="error"
                    icon="⚠️"
                    description={error}
                  />
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
      {/* Loading Overlay - Full page blocking */}
      <LoadingOverlay
        show={refreshing || calibrating}
        message={loadingMessage}
        icon="🌡️"
      />

      {/* Main Status Card */}
      <Card liquid className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-accent-500 to-info-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Error Banner - Inside card */}
            {error && (
              <div className="mb-4 sm:mb-6">
                <Banner
                  liquid
                  variant="error"
                  icon="⚠️"
                  title="Errore Connessione"
                  description={error}
                  dismissible
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {/* Header - Simplified without refresh button */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl sm:text-3xl">🌡️</span>
              <Heading level={2} size="xl">Termostato</Heading>
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
                {/* Main Temperature Display - Enhanced with gradient background */}
                <div className={`relative rounded-2xl p-6 sm:p-8 shadow-liquid hover:shadow-liquid-lg transition-all duration-500 ${
                  selectedRoom.heating
                    ? 'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20'
                    : 'bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20'
                }`}>
                  {/* Heating Badge */}
                  {selectedRoom.heating && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-warning-500/20 rounded-full blur-lg animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-warning-500 to-warning-600 text-white px-3 py-1.5 rounded-full shadow-elevated-lg ring-2 ring-white/40">
                          <span className="text-xs font-bold">🔥 ATTIVO</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room name (solo se c'è una sola stanza) */}
                  {roomsWithStatus.length === 1 && (
                    <div className="text-center mb-4">
                      <Heading level={3} size="sm" variant="subtle" className="uppercase tracking-wider">
                        {selectedRoom.name}
                      </Heading>
                    </div>
                  )}

                  {/* Temperature Display Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Current Temperature Box */}
                    <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08]">
                      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                        <Text variant="tertiary" className="mb-2 uppercase tracking-wider text-[10px] sm:text-xs font-bold">
                          Attuale
                        </Text>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black text-neutral-800 dark:text-neutral-100 leading-none">
                            {selectedRoom.temperature}
                          </span>
                          <span className="text-2xl sm:text-3xl text-neutral-600 dark:text-neutral-400 font-bold">°</span>
                        </div>
                      </div>
                    </div>

                    {/* Target Temperature Box */}
                    {selectedRoom.setpoint && (
                      <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08]">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                          <Text variant="tertiary" className="mb-2 uppercase tracking-wider text-[10px] sm:text-xs font-bold">
                            Target
                          </Text>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl sm:text-5xl font-black text-info-600 dark:text-info-400 leading-none">
                              {selectedRoom.setpoint}
                            </span>
                            <span className="text-2xl sm:text-3xl text-info-500 dark:text-info-500 font-bold">°</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick temperature controls - Enhanced */}
                {selectedRoom.setpoint && (
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <Button
                        liquid
                        variant="outline"
                        size="lg"
                        icon="➖"
                        onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint - 0.5)}
                        disabled={refreshing}
                        className="flex-1 h-16 sm:h-18 text-lg font-bold"
                      >
                        -0.5°
                      </Button>
                      <div className="flex flex-col items-center justify-center px-4">
                        <Text variant="tertiary" className="text-xs uppercase">Target</Text>
                        <span className="text-2xl sm:text-3xl font-black text-info-600 dark:text-info-400">{selectedRoom.setpoint}°</span>
                      </div>
                      <Button
                        liquid
                        variant="outline"
                        size="lg"
                        icon="➕"
                        onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint + 0.5)}
                        disabled={refreshing}
                        className="flex-1 h-16 sm:h-18 text-lg font-bold"
                      >
                        +0.5°
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="🌡️"
                title="Nessuna temperatura disponibile"
              />
            )}

            {/* Separator */}
            <Divider label="Modalità" variant="gradient" spacing="large" />

            {/* Mode Control */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => handleModeChange('schedule')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'schedule'
                    ? 'bg-success-100 dark:bg-success-900/30 border-success-300 dark:border-success-600 text-success-700 dark:text-success-400'
                    : 'bg-white/60 dark:bg-white/[0.08] border-white/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/80 dark:hover:bg-white/[0.12] backdrop-blur-sm'
                }`}
              >
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xs font-semibold">Programmato</div>
              </button>

              <button
                onClick={() => handleModeChange('away')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'away'
                    ? 'bg-warning-100 dark:bg-warning-900/30 border-warning-300 dark:border-warning-600 text-warning-700 dark:text-warning-400'
                    : 'bg-white/60 dark:bg-white/[0.08] border-white/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/80 dark:hover:bg-white/[0.12] backdrop-blur-sm'
                }`}
              >
                <div className="text-2xl mb-1">🏃</div>
                <div className="text-xs font-semibold">Assenza</div>
              </button>

              <button
                onClick={() => handleModeChange('hg')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'hg'
                    ? 'bg-info-100 dark:bg-info-900/30 border-info-300 dark:border-info-600 text-info-700 dark:text-info-400'
                    : 'bg-white/60 dark:bg-white/[0.08] border-white/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/80 dark:hover:bg-white/[0.12] backdrop-blur-sm'
                }`}
              >
                <div className="text-2xl mb-1">❄️</div>
                <div className="text-xs font-semibold">Antigelo</div>
              </button>

              <button
                onClick={() => handleModeChange('off')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'off'
                    ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                    : 'bg-white/60 dark:bg-white/[0.08] border-white/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/80 dark:hover:bg-white/[0.12] backdrop-blur-sm'
                }`}
              >
                <div className="text-2xl mb-1">⏸️</div>
                <div className="text-xs font-semibold">Off</div>
              </button>
            </div>

            {/* Separator */}
            <Divider label="Informazioni" variant="gradient" spacing="large" />

            {/* Summary Info - Enhanced */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <span className="text-3xl sm:text-4xl mb-2">🏠</span>
                  <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                    Casa
                  </Text>
                  <Heading level={4} size="sm" className="truncate w-full text-center">
                    {topology.home_name || '-'}
                  </Heading>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <span className="text-3xl sm:text-4xl mb-2">🚪</span>
                  <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                    Stanze
                  </Text>
                  <span className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100">
                    {rooms.length}
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <span className="text-3xl sm:text-4xl mb-2">📡</span>
                  <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                    Dispositivi
                  </Text>
                  <span className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100">
                    {topology.modules?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 sm:mt-6 space-y-3">
              {/* Calibration Success Banner */}
              {calibrationSuccess !== null && (
                <div className={`p-3 rounded-lg border ${
                  calibrationSuccess
                    ? 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-600'
                    : 'bg-error-50 dark:bg-error-900/30 border-error-200 dark:border-error-600'
                }`}>
                  <p className={`text-sm font-medium ${
                    calibrationSuccess
                      ? 'text-success-700 dark:text-success-400'
                      : 'text-error-700 dark:text-error-400'
                  }`}>
                    {calibrationSuccess
                      ? '✓ Calibrazione valvole avviata con successo'
                      : '✗ Calibrazione fallita'
                    }
                  </p>
                </div>
              )}

              {/* Calibrate Button */}
              <Button
                liquid
                variant="info"
                onClick={handleCalibrateValves}
                disabled={calibrating}
                className="w-full"
                size="sm"
                icon={calibrating ? '⏳' : '🔧'}
              >
                {calibrating ? 'Calibrazione in corso...' : 'Tara Valvole'}
              </Button>

              {/* Link to full page */}
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
