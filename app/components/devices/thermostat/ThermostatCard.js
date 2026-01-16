'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NETATMO_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Text, Button, EmptyState } from '../../ui';

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

  // Build props for DeviceCard
  const banners = error ? [{
    variant: 'error',
    icon: '⚠️',
    title: 'Errore Connessione',
    description: error,
    dismissible: true,
    onDismiss: () => setError(null)
  }] : [];

  const infoBoxes = topology ? [
    { icon: '🏠', label: 'Casa', value: topology.home_name || '-' },
    { icon: '🚪', label: 'Stanze', value: rooms.length },
    { icon: '📡', label: 'Dispositivi', value: topology.modules?.length || 0 },
  ] : [];

  return (
    <DeviceCard
      icon="🌡️"
      title="Termostato"
      colorTheme="ocean"
      connected={connected}
      onConnect={handleAuth}
      connectButtonLabel="Connetti Netatmo"
      connectInfoRoute="/thermostat"
      loading={loading || refreshing || calibrating}
      loadingMessage={loadingMessage}
      skeletonComponent={loading ? <Skeleton.ThermostatCard /> : null}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
    >
      {/* Room Selection */}
      <RoomSelector
        rooms={roomsWithStatus.map(room => ({
          id: room.id,
          name: room.name
        }))}
        selectedRoomId={selectedRoomId}
        onChange={(e) => setSelectedRoomId(e.target.value)}
      />

      {/* Selected Room Temperature */}
      {selectedRoom ? (
        <div className="space-y-4 mb-4 sm:mb-6">
                {/* Main Temperature Display - Ember Noir style with light mode */}
                <div className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border ${
                  selectedRoom.heating
                    ? 'bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30 border-ember-500/40 shadow-ember-glow [html:not(.dark)_&]:from-ember-100/80 [html:not(.dark)_&]:via-ember-50/90 [html:not(.dark)_&]:to-flame-100/70 [html:not(.dark)_&]:border-ember-300 [html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.15)]'
                    : 'bg-gradient-to-br from-ocean-900/30 via-slate-900/60 to-ocean-800/20 border-ocean-500/30 [html:not(.dark)_&]:from-ocean-100/80 [html:not(.dark)_&]:via-ocean-50/90 [html:not(.dark)_&]:to-ocean-100/70 [html:not(.dark)_&]:border-ocean-200'
                }`}>
                  {/* Heating Badge - with light mode */}
                  {selectedRoom.heating && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-ember-500/30 rounded-full blur-lg animate-pulse [html:not(.dark)_&]:bg-ember-400/40"></div>
                        <div className="relative bg-gradient-to-br from-ember-500 to-flame-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50 [html:not(.dark)_&]:ring-white/50">
                          <span className="text-xs font-bold font-display">🔥 ATTIVO</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room name (solo se c'è una sola stanza) */}
                  {roomsWithStatus.length === 1 && (
                    <div className="text-center mb-4">
                      <Heading level={3} size="sm" variant="subtle" className="uppercase tracking-wider font-display">
                        {selectedRoom.name}
                      </Heading>
                    </div>
                  )}

                  {/* Temperature Display Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Current Temperature Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 backdrop-blur-xl border border-white/10 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                        <Text variant="label" size="xs" weight="bold" className="mb-2 font-display">
                          Attuale
                        </Text>
                        <div className="flex items-baseline gap-1">
                          <Text weight="black" className="text-4xl sm:text-5xl font-display text-slate-100 leading-none [html:not(.dark)_&]:text-slate-900">
                            {selectedRoom.temperature}
                          </Text>
                          <Text as="span" weight="bold" className="text-2xl sm:text-3xl text-slate-400 [html:not(.dark)_&]:text-slate-500">°</Text>
                        </div>
                      </div>
                    </div>

                    {/* Target Temperature Box */}
                    {selectedRoom.setpoint && (
                      <div className="relative overflow-hidden rounded-2xl bg-ocean-900/40 backdrop-blur-xl border border-ocean-500/30 [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                          <Text variant="ocean" size="xs" weight="bold" uppercase tracking className="mb-2 font-display">
                            Target
                          </Text>
                          <div className="flex items-baseline gap-1">
                            <Text variant="ocean" weight="black" className="text-4xl sm:text-5xl font-display leading-none [html:not(.dark)_&]:text-ocean-600">
                              {selectedRoom.setpoint}
                            </Text>
                            <Text as="span" weight="bold" className="text-2xl sm:text-3xl text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500">°</Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick temperature controls - Ember Noir */}
                {selectedRoom.setpoint && (
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 sm:p-5 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="subtle"
                        size="lg"
                        onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint - 0.5)}
                        disabled={refreshing}
                        className="flex-1 h-16 sm:h-18 text-lg font-bold font-display"
                      >
                        − 0.5°
                      </Button>
                      <div className="flex flex-col items-center justify-center px-4">
                        <Text variant="label" size="xs" className="font-display">Target</Text>
                        <Text variant="ocean" weight="black" className="text-2xl sm:text-3xl font-display">{selectedRoom.setpoint}°</Text>
                      </div>
                      <Button
                        variant="subtle"
                        size="lg"
                        onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint + 0.5)}
                        disabled={refreshing}
                        className="flex-1 h-16 sm:h-18 text-lg font-bold font-display"
                      >
                        + 0.5°
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

            {/* Mode Control - Ember Noir */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => handleModeChange('schedule')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-display ${
                  mode === 'schedule'
                    ? 'bg-sage-900/40 border-sage-500/50 text-sage-300 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:border-sage-300 [html:not(.dark)_&]:text-sage-700'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/70 hover:border-slate-600/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-slate-100/80'
                }`}
              >
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xs font-semibold">Programmato</div>
              </button>

              <button
                onClick={() => handleModeChange('away')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-display ${
                  mode === 'away'
                    ? 'bg-warning-900/40 border-warning-500/50 text-warning-300 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300 [html:not(.dark)_&]:text-warning-700'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/70 hover:border-slate-600/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-slate-100/80'
                }`}
              >
                <div className="text-2xl mb-1">🏃</div>
                <div className="text-xs font-semibold">Assenza</div>
              </button>

              <button
                onClick={() => handleModeChange('hg')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-display ${
                  mode === 'hg'
                    ? 'bg-ocean-900/40 border-ocean-500/50 text-ocean-300 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300 [html:not(.dark)_&]:text-ocean-700'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/70 hover:border-slate-600/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-slate-100/80'
                }`}
              >
                <div className="text-2xl mb-1">❄️</div>
                <div className="text-xs font-semibold">Antigelo</div>
              </button>

              <button
                onClick={() => handleModeChange('off')}
                disabled={refreshing}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-display ${
                  mode === 'off'
                    ? 'bg-slate-700/60 border-slate-600/60 text-slate-300 [html:not(.dark)_&]:bg-slate-200/80 [html:not(.dark)_&]:border-slate-300 [html:not(.dark)_&]:text-slate-700'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/70 hover:border-slate-600/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-slate-100/80'
                }`}
              >
                <div className="text-2xl mb-1">⏸️</div>
                <div className="text-xs font-semibold">Off</div>
              </button>
            </div>

      {/* Actions - Ember Noir */}
      <div className="mt-4 sm:mt-6 space-y-3">
        {/* Calibration Success Banner */}
        {calibrationSuccess !== null && (
          <div className={`p-3 rounded-lg border ${
            calibrationSuccess
              ? 'bg-sage-900/30 border-sage-500/40 text-sage-300 [html:not(.dark)_&]:bg-sage-50/80 [html:not(.dark)_&]:border-sage-300 [html:not(.dark)_&]:text-sage-700'
              : 'bg-danger-900/30 border-danger-500/40 text-danger-300 [html:not(.dark)_&]:bg-danger-50/80 [html:not(.dark)_&]:border-danger-300 [html:not(.dark)_&]:text-danger-700'
          }`}>
            <Text size="sm" weight="medium" className="font-display">
              {calibrationSuccess
                ? '✓ Calibrazione valvole avviata con successo'
                : '✗ Calibrazione fallita'
              }
            </Text>
          </div>
        )}

        {/* Calibrate Button */}
        <Button
          variant="ocean"
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
          variant="subtle"
          onClick={() => router.push('/thermostat')}
          className="w-full"
          size="sm"
        >
          Vedi Tutte le Stanze →
        </Button>
      </div>
    </DeviceCard>
  );
}
