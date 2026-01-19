'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NETATMO_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Text, Button, EmptyState } from '../../ui';
import BatteryWarning, { ModuleBatteryList } from './BatteryWarning';

/**
 * ThermostatCard - Complete thermostat control for homepage
 * Summary view of Netatmo integration with quick controls
 * Includes battery status warnings and stove sync indicator
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
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);

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

  // Get rooms with status (includes stove sync info)
  // Shows ALL rooms including offline ones
  const rooms = topology?.rooms || [];
  const topologyModules = topology?.modules || [];
  const statusModules = status?.modules || [];

  // Merge topology modules with status modules to get battery/reachable info
  const modulesWithStatus = topologyModules.map(topModule => {
    const statModule = statusModules.find(m => m.id === topModule.id);
    return {
      ...topModule,
      battery_state: statModule?.battery_state,
      reachable: statModule?.reachable ?? true,
    };
  });

  const roomsWithStatus = rooms.map(room => {
    const roomStatus = status?.rooms?.find(r => r.room_id === room.id);

    // Find modules for this room to check if offline
    const roomModules = room.modules?.map(moduleId =>
      modulesWithStatus.find(m => m.id === moduleId)
    ).filter(Boolean).filter(m => m.type !== 'NAPlug') || [];

    // Check if room is offline (all modules unreachable)
    const isOffline = roomModules.length > 0 && roomModules.every(m => m.reachable === false);

    // Check battery status
    const hasLowBattery = roomModules.some(m =>
      m.battery_state === 'low' || m.battery_state === 'very_low'
    );
    const hasCriticalBattery = roomModules.some(m => m.battery_state === 'very_low');

    return {
      ...room,
      temperature: roomStatus?.temperature,
      setpoint: roomStatus?.setpoint,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
      stoveSync: roomStatus?.stoveSync || false,
      stoveSyncSetpoint: roomStatus?.stoveSyncSetpoint,
      isOffline,
      hasLowBattery,
      hasCriticalBattery,
      roomModules,
    };
  }); // Removed filter - show ALL rooms including offline

  // Get battery/module info
  const modules = status?.modules || [];
  const lowBatteryModules = status?.lowBatteryModules || [];
  const hasLowBattery = status?.hasLowBattery || false;
  const hasCriticalBattery = status?.hasCriticalBattery || false;

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
  const banners = [];

  // Error banner
  if (error) {
    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Connessione',
      description: error,
      dismissible: true,
      onDismiss: () => setError(null)
    });
  }

  // Battery warning banner (only if not dismissed and has low battery)
  if (hasLowBattery && !batteryWarningDismissed) {
    const batteryBannerVariant = hasCriticalBattery ? 'error' : 'warning';
    const batteryIcon = hasCriticalBattery ? '🪫' : '🔋';
    const count = lowBatteryModules.length;
    const batteryTitle = hasCriticalBattery
      ? `Batteria Critica - ${count} dispositiv${count > 1 ? 'i' : 'o'}`
      : `Batteria Bassa - ${count} dispositiv${count > 1 ? 'i' : 'o'}`;

    // Build description with device list
    const deviceList = lowBatteryModules.map(m => {
      const typeName = m.type === 'NRV' ? 'Valvola' : m.type === 'NATherm1' ? 'Termostato' : m.type;
      const name = m.name || m.id?.substring(0, 8) || 'Sconosciuto';
      return `${typeName} "${name}"`;
    }).join(', ');

    const batteryDescription = hasCriticalBattery
      ? `Sostituire le batterie immediatamente: ${deviceList}`
      : `Sostituire presto le batterie: ${deviceList}`;

    banners.push({
      variant: batteryBannerVariant,
      icon: batteryIcon,
      title: batteryTitle,
      description: batteryDescription,
      dismissible: true,
      onDismiss: () => setBatteryWarningDismissed(true)
    });
  }

  const infoBoxes = topology ? [
    { icon: '🏠', label: 'Casa', value: topology.home_name || '-' },
    { icon: '🚪', label: 'Stanze', value: rooms.length },
    { icon: '📡', label: 'Dispositivi', value: topology.modules?.length || 0 },
    ...(hasLowBattery ? [{ icon: hasCriticalBattery ? '🪫' : '🔋', label: 'Batteria', value: `${lowBatteryModules.length} bassa` }] : []),
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
      {/* Room Selection - includes status indicators */}
      <RoomSelector
        rooms={roomsWithStatus.map(room => ({
          id: room.id,
          name: room.name,
          isOffline: room.isOffline,
          hasLowBattery: room.hasLowBattery,
          hasCriticalBattery: room.hasCriticalBattery,
        }))}
        selectedRoomId={selectedRoomId}
        onChange={(e) => setSelectedRoomId(e.target.value)}
      />

      {/* Selected Room Temperature */}
      {selectedRoom ? (
        <div className="space-y-4 mb-4 sm:mb-6">
                {/* Offline Room Display */}
                {selectedRoom.isOffline ? (
                  <div className="relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 border-slate-600/40 [html:not(.dark)_&]:from-slate-200/80 [html:not(.dark)_&]:via-slate-100/90 [html:not(.dark)_&]:to-slate-200/70 [html:not(.dark)_&]:border-slate-300">
                    {/* Offline Badge */}
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-slate-500/30 rounded-full blur-lg"></div>
                        <div className="relative bg-gradient-to-br from-slate-500 to-slate-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50 [html:not(.dark)_&]:ring-white/50">
                          <span className="text-xs font-bold font-display">📵 OFFLINE</span>
                        </div>
                      </div>
                    </div>

                    {/* Battery warning if critical */}
                    {selectedRoom.hasCriticalBattery && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-danger-500/30 rounded-full blur-lg animate-pulse"></div>
                          <div className="relative bg-gradient-to-br from-danger-500 to-danger-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50 [html:not(.dark)_&]:ring-white/50">
                            <span className="text-xs font-bold font-display">🪫 BATTERIA</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Room name */}
                    {roomsWithStatus.length === 1 && (
                      <div className="text-center mb-4">
                        <Heading level={3} size="sm" variant="subtle" className="uppercase tracking-wider font-display">
                          {selectedRoom.name}
                        </Heading>
                      </div>
                    )}

                    {/* Offline Message */}
                    <div className="flex flex-col items-center justify-center py-6">
                      <span className="text-5xl mb-4">📵</span>
                      <Text variant="secondary" size="lg" weight="bold" className="mb-2">
                        Dispositivo Offline
                      </Text>
                      <Text variant="tertiary" size="sm" className="text-center max-w-xs">
                        {selectedRoom.hasCriticalBattery
                          ? 'Batteria scarica. Sostituire le batterie per ripristinare la connessione.'
                          : 'Impossibile comunicare con la valvola. Verificare la connessione e le batterie.'
                        }
                      </Text>
                    </div>
                  </div>
                ) : (
                /* Main Temperature Display - Ember Noir style with light mode */
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

                  {/* Stove Sync Badge - shows when living room is synced with stove */}
                  {selectedRoom.stoveSync && (
                    <div className={`absolute -top-2 ${selectedRoom.heating ? '-left-2' : '-right-2'} z-20`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-warning-500/30 rounded-full blur-lg [html:not(.dark)_&]:bg-warning-400/40"></div>
                        <div className="relative bg-gradient-to-br from-warning-500 to-warning-600 text-white px-3 py-1.5 rounded-full shadow-lg ring-2 ring-slate-900/50 [html:not(.dark)_&]:ring-white/50">
                          <span className="text-xs font-bold font-display">🔥 STUFA</span>
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
                )}

                {/* Quick temperature controls - Ember Noir */}
                {selectedRoom.setpoint && !selectedRoom.isOffline && (
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

            {/* Mode Control - Redesigned for better readability */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'schedule', icon: '⏰', label: 'Auto', color: 'sage' },
                { id: 'away', icon: '🏃', label: 'Away', color: 'warning' },
                { id: 'hg', icon: '❄️', label: 'Gelo', color: 'ocean' },
                { id: 'off', icon: '⏸️', label: 'Off', color: 'slate' },
              ].map(({ id, icon, label, color }) => {
                const isActive = mode === id;
                const colorStyles = {
                  sage: isActive
                    ? 'bg-sage-900/50 border-sage-400/60 ring-2 ring-sage-500/30 [html:not(.dark)_&]:bg-sage-100 [html:not(.dark)_&]:border-sage-400 [html:not(.dark)_&]:ring-sage-300/50'
                    : '',
                  warning: isActive
                    ? 'bg-warning-900/50 border-warning-400/60 ring-2 ring-warning-500/30 [html:not(.dark)_&]:bg-warning-100 [html:not(.dark)_&]:border-warning-400 [html:not(.dark)_&]:ring-warning-300/50'
                    : '',
                  ocean: isActive
                    ? 'bg-ocean-900/50 border-ocean-400/60 ring-2 ring-ocean-500/30 [html:not(.dark)_&]:bg-ocean-100 [html:not(.dark)_&]:border-ocean-400 [html:not(.dark)_&]:ring-ocean-300/50'
                    : '',
                  slate: isActive
                    ? 'bg-slate-700/70 border-slate-500/60 ring-2 ring-slate-500/30 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:ring-slate-300/50'
                    : '',
                };

                return (
                  <button
                    key={id}
                    onClick={() => handleModeChange(id)}
                    disabled={refreshing}
                    className={`
                      flex flex-col items-center justify-center
                      p-3 sm:p-4 rounded-2xl border
                      transition-all duration-200 active:scale-95
                      disabled:opacity-50 disabled:cursor-not-allowed
                      min-h-[80px] sm:min-h-[90px]
                      ${isActive
                        ? colorStyles[color]
                        : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50 [html:not(.dark)_&]:bg-white/70 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:hover:bg-slate-100/80'
                      }
                    `}
                  >
                    <span className="text-3xl sm:text-4xl mb-1.5">{icon}</span>
                    <span className={`text-xs sm:text-sm font-bold font-display ${
                      isActive
                        ? 'text-white [html:not(.dark)_&]:text-slate-900'
                        : 'text-slate-400 [html:not(.dark)_&]:text-slate-600'
                    }`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Calibrate Button - More prominent */}
            <div className="mt-5 sm:mt-6">
              {/* Calibration Success Banner */}
              {calibrationSuccess !== null && (
                <div className={`mb-3 p-3 rounded-xl border ${
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

              <button
                onClick={handleCalibrateValves}
                disabled={calibrating}
                className="
                  w-full flex items-center justify-center gap-2.5
                  px-4 py-3.5 rounded-xl
                  bg-ocean-900/40 border border-ocean-500/40
                  hover:bg-ocean-900/60 hover:border-ocean-400/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200
                  [html:not(.dark)_&]:hover:bg-ocean-100/90 [html:not(.dark)_&]:hover:border-ocean-300
                "
              >
                <span className="text-xl">{calibrating ? '⏳' : '🔧'}</span>
                <span className="text-sm font-bold font-display text-ocean-300 [html:not(.dark)_&]:text-ocean-700">
                  {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
                </span>
              </button>
            </div>

      {/* Actions */}
      <div className="mt-4 sm:mt-5">
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
