'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Power, Plus, Minus, Calendar, Home, Snowflake, Settings, RefreshCw } from 'lucide-react';
import { NETATMO_ROUTES } from '@/lib/routes';
import { getNetatmoAuthUrl } from '@/lib/netatmoCredentials';
import { cn } from '@/lib/utils/cn';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Text, Button, EmptyState, Spinner, Select, Badge } from '../../ui';
import BatteryWarning, { ModuleBatteryList } from './BatteryWarning';
import { useScheduleData } from '@/lib/hooks/useScheduleData';

/**
 * ThermostatCard - Complete thermostat control for homepage
 * Summary view of Netatmo integration with quick controls
 * Includes battery status warnings and stove sync indicator
 */
export default function ThermostatCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<boolean | null>(null);
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Schedule management
  const { schedules, activeSchedule, loading: scheduleLoading, refetch: refetchSchedules } = useScheduleData();

  // Type assertion for schedules data (from useScheduleData hook)
  interface ScheduleItem {
    id: string;
    name: string;
  }
  const typedSchedules = schedules as ScheduleItem[];
  const typedActiveSchedule = activeSchedule as ScheduleItem | undefined;
  const [switchingSchedule, setSwitchingSchedule] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Sync selectedScheduleId with activeSchedule
  useEffect(() => {
    if (typedActiveSchedule && !selectedScheduleId && (activeSchedule as any).id) {
      setSelectedScheduleId((activeSchedule as any).id);
    }
  }, [activeSchedule, selectedScheduleId]);

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

    // Find modules for this room to check if offline (exclude relays and cameras)
    const roomModules = room.modules?.map(moduleId =>
      modulesWithStatus.find(m => m.id === moduleId)
    ).filter(Boolean).filter(m => m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC') || [];

    // Check if room is offline (all modules unreachable)
    const isOffline = roomModules.length > 0 && roomModules.every(m => m.reachable === false);

    // Check battery status
    const hasLowBattery = roomModules.some(m =>
      m.battery_state === 'low' || m.battery_state === 'very_low'
    );
    const hasCriticalBattery = roomModules.some(m => m.battery_state === 'very_low');

    // Determine device type
    const hasThermostat = roomModules.some(m => m.type === 'NATherm1' || m.type === 'OTH');
    const hasValve = roomModules.some(m => m.type === 'NRV');
    const deviceType = hasThermostat ? 'thermostat' : hasValve ? 'valve' : 'unknown';

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
      deviceType,
    };
  }).filter(room => {
    // Only show rooms that have at least one thermostat or valve device
    // Exclude rooms with only cameras or no thermostat/valve modules
    return room.deviceType === 'thermostat' || room.deviceType === 'valve';
  });

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

  // Filter only active rooms (heating or setpoint > temperature)
  const activeRooms = roomsWithStatus.filter(room => {
    if (room.isOffline) return false;
    return room.heating === true ||
           (room.setpoint && room.temperature && room.setpoint > room.temperature);
  });

  async function checkConnection(retryCount = 0) {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setLoading(true);
      setError(null);

      // Show retry message on subsequent attempts
      if (retryCount > 0) {
        setLoadingMessage('Riconnessione in corso...');
      } else {
        setLoadingMessage('Caricamento...');
      }

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      if (data.reconnect) {
        // Token expired/invalid - retry once in case token was just refreshed
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Token issue detected, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          setLoadingMessage('Verifica token in corso...');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkConnection(retryCount + 1);
        }
        // All retries exhausted - show reconnect UI
        setConnected(false);
        setError(data.error);
        return;
      }

      if (!data.error && data.home_id) {
        setConnected(true);
        setTopology(data);
      } else {
        // Other error - retry once for transient issues
        if (retryCount < MAX_RETRIES && !data.reconnect) {
          console.log(`⏳ Connection error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          setLoadingMessage('Nuovo tentativo...');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkConnection(retryCount + 1);
        }
        setConnected(false);
      }
    } catch (err) {
      console.error('Errore connessione termostato:', err);
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        console.log(`⏳ Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        setLoadingMessage('Nuovo tentativo...');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return checkConnection(retryCount + 1);
      }
      setConnected(false);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMessage('Caricamento...');
    }
  }

  async function fetchStatus(retryCount = 0) {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await response.json();

      if (data.reconnect) {
        // Token issue during polling - retry once before disconnecting
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Status fetch token issue, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchStatus(retryCount + 1);
        }
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
      // Retry on network errors (but not rate limit)
      if (retryCount < MAX_RETRIES && !err.message.includes('concurrency limited')) {
        console.log(`⏳ Status fetch error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchStatus(retryCount + 1);
      }
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
      const response = await fetch((NETATMO_ROUTES as any).setRoomThermpoint, {
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

  async function handleScheduleChange(scheduleId: string) {
    if (!scheduleId || scheduleId === typedActiveSchedule?.id) return;

    try {
      setSwitchingSchedule(true);
      setLoadingMessage('Cambio programmazione...');
      setError(null);

      const response = await fetch(NETATMO_ROUTES.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Errore cambio programmazione');

      // Refetch schedules to update active
      await refetchSchedules();
      setSelectedScheduleId(scheduleId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitchingSchedule(false);
    }
  }

  const handleAuth = () => {
    // Use centralized OAuth URL with all scopes
    window.location.href = getNetatmoAuthUrl('thermostat');
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
    { icon: '🚪', label: 'Stanze', value: roomsWithStatus.length },
    { icon: '📡', label: 'Dispositivi', value: modulesWithStatus.filter(m => m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC').length },
    ...(hasLowBattery ? [{ icon: hasCriticalBattery ? '🪫' : '🔋', label: 'Batteria', value: `${lowBatteryModules.length} bassa` }] : []),
  ] : [];

  // Context menu items for extended actions
  const thermostatContextMenuItems = connected ? [
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'Impostazioni Termostato',
      onSelect: () => router.push('/thermostat/settings'),
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: 'Programmazioni',
      onSelect: () => router.push('/thermostat/schedules'),
    },
    { separator: true },
    {
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Aggiorna',
      onSelect: handleRefresh,
    },
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
      loading={loading || refreshing || calibrating || switchingSchedule}
      loadingMessage={loadingMessage}
      skeletonComponent={loading ? <Skeleton.ThermostatCard /> : null}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
      contextMenuItems={thermostatContextMenuItems as any}
    >
      {/* Active Devices List - Shows only actively heating rooms */}
      {activeRooms.length > 0 && (
        <div className="mb-4 sm:mb-5">
          <Divider label="Dispositivi Attivi" variant="gradient" spacing="medium" />

          <div className="mt-4 flex flex-wrap gap-2">
            {activeRooms.map((room) => {
              // Device type icon
              const deviceIcon = room.deviceType === 'valve' ? '🔧' : room.deviceType === 'thermostat' ? '🌡️' : '📡';

              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    "bg-ember-900/40 border-ember-500/40 text-ember-300 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:border-ember-300 [html:not(.dark)_&]:text-ember-700"
                  )}
                  title={`${room.name} - Attivo`}
                >
                  <span>{deviceIcon}</span>
                  <span>{room.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Selection - includes status indicators */}
      <RoomSelector
        rooms={roomsWithStatus.map(room => ({
          id: room.id,
          name: room.name,
          isOffline: room.isOffline,
          hasLowBattery: room.hasLowBattery,
          hasCriticalBattery: room.hasCriticalBattery,
          heating: room.heating,
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
                      <Badge variant="neutral" size="sm" icon={<span>📵</span>}>
                        OFFLINE
                      </Badge>
                    </div>

                    {/* Battery warning if critical */}
                    {selectedRoom.hasCriticalBattery && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <Badge variant="danger" size="sm" pulse icon={<span>🪫</span>}>
                          BATTERIA
                        </Badge>
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
                      <Text variant="secondary" size="lg" className="mb-2">
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
                      <Badge variant="ember" size="sm" pulse icon={<span>🔥</span>}>
                        ATTIVO
                      </Badge>
                    </div>
                  )}

                  {/* Stove Sync Badge - shows when living room is synced with stove */}
                  {selectedRoom.stoveSync && (
                    <div className={`absolute -top-2 ${selectedRoom.heating ? '-left-2' : '-right-2'} z-20`}>
                      <Badge variant="warning" size="sm" icon={<span>🔥</span>}>
                        STUFA
                      </Badge>
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
                  <div
                    className="grid grid-cols-2 gap-3 sm:gap-4"
                    data-component="temperature-display"
                  >
                    {/* Current Temperature Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 backdrop-blur-xl border border-white/10 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                        <Text variant="label" size="xs" className="mb-2 font-display">
                          Attuale
                        </Text>
                        <div className="flex items-baseline gap-1">
                          <Text className="text-4xl sm:text-5xl font-display text-slate-100 leading-none [html:not(.dark)_&]:text-slate-900">
                            {selectedRoom.temperature}
                          </Text>
                          <Text as="span" className="text-2xl sm:text-3xl text-slate-400 [html:not(.dark)_&]:text-slate-500">°</Text>
                        </div>
                      </div>
                    </div>

                    {/* Target Temperature Box */}
                    {selectedRoom.setpoint && (
                      <div className="relative overflow-hidden rounded-2xl bg-ocean-900/40 backdrop-blur-xl border border-ocean-500/30 [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                          <Text variant="tertiary" size="xs" uppercase tracking className="mb-2 font-display">
                            Target
                          </Text>
                          <div className="flex items-baseline gap-1">
                            <Text variant="tertiary" className="text-4xl sm:text-5xl font-display leading-none [html:not(.dark)_&]:text-ocean-600">
                              {selectedRoom.setpoint}
                            </Text>
                            <Text as="span" className="text-2xl sm:text-3xl text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500">°</Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Devices Summary - Shows which devices are controlling this room */}
                  {selectedRoom.roomModules && selectedRoom.roomModules.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      {selectedRoom.roomModules.map(module => {
                        const isValve = module.type === 'NRV';
                        const isThermostat = module.type === 'NATherm1' || module.type === 'OTH';
                        const isReachable = module.reachable !== false;

                        return (
                          <div
                            key={module.id}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              selectedRoom.heating && isReachable
                                ? "bg-ember-900/40 border-ember-500/40 text-ember-300 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:border-ember-300 [html:not(.dark)_&]:text-ember-700"
                                : isReachable
                                ? "bg-slate-800/40 border-slate-600/30 text-slate-300 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:border-slate-300 [html:not(.dark)_&]:text-slate-600"
                                : "bg-slate-900/40 border-slate-700/30 text-slate-500 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:text-slate-500 opacity-60"
                            )}
                            title={`${module.name || 'Dispositivo'} - ${isReachable ? (selectedRoom.heating ? 'Attivo' : 'Standby') : 'Offline'}`}
                          >
                            <span>{isValve ? '🔧' : isThermostat ? '🌡️' : '📡'}</span>
                            <span>{isValve ? 'Valvola' : isThermostat ? 'Termostato' : module.type}</span>
                            {selectedRoom.heating && isReachable && (
                              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Quick Actions Bar - Icon buttons */}
                {!selectedRoom.isOffline && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {/* Temperature Adjustment */}
                    {selectedRoom.setpoint && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/50 border border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                        <Button
                          aria-label="Diminuisci Temperatura"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint - 0.5)}
                          disabled={refreshing || selectedRoom.setpoint <= 15}
                          className="p-2"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-bold text-ocean-400 [html:not(.dark)_&]:text-ocean-600 w-10 text-center">{selectedRoom.setpoint}°</span>
                        <Button
                          aria-label="Aumenta Temperatura"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemperatureChange(selectedRoom.id, selectedRoom.setpoint + 0.5)}
                          disabled={refreshing || selectedRoom.setpoint >= 30}
                          className="p-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Mode Quick Cycle */}
                    <Button
                      aria-label={`Modalita attuale: ${mode}. Clicca per cambiare`}
                      variant="subtle"
                      size="md"
                      className="p-3"
                      onClick={() => {
                        // Cycle: schedule -> away -> hg -> off -> schedule
                        const modes = ['schedule', 'away', 'hg', 'off'];
                        const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
                        handleModeChange(modes[nextIndex]);
                      }}
                      disabled={refreshing}
                    >
                      {mode === 'schedule' ? <Calendar className="w-5 h-5" /> :
                       mode === 'away' ? <Home className="w-5 h-5" /> :
                       mode === 'hg' ? <Snowflake className="w-5 h-5" /> :
                       <Power className="w-5 h-5" />}
                    </Button>
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
                        <Text variant="tertiary" className="text-2xl sm:text-3xl font-display">{selectedRoom.setpoint}°</Text>
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
                  <Button
                    key={id}
                    variant="subtle"
                    onClick={() => handleModeChange(id)}
                    disabled={refreshing}
                    aria-pressed={isActive}
                    className={cn(
                      "flex-col min-h-[80px] sm:min-h-[90px]",
                      isActive && colorStyles[color]
                    )}
                  >
                    <span className="text-3xl sm:text-4xl mb-1.5">{icon}</span>
                    <span className={`text-xs sm:text-sm font-bold font-display ${
                      isActive
                        ? 'text-white [html:not(.dark)_&]:text-slate-900'
                        : 'text-slate-400 [html:not(.dark)_&]:text-slate-600'
                    }`}>
                      {label}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Schedule Section */}
            <div className="mt-5 sm:mt-6">
              <Divider label="Programmazione" variant="gradient" spacing="large" />

              <div className="mt-4 space-y-3">
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : schedules.length > 0 ? (
                  <>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block mb-1.5">
                          <Text variant="label" size="sm">Programmazione attiva</Text>
                        </label>
                        <Select
                          label="Programmazione"
                          icon="📅"
                          value={selectedScheduleId || typedActiveSchedule?.id || ''}
                          onChange={(e) => {
                            setSelectedScheduleId(e.target.value);
                            handleScheduleChange(e.target.value);
                          }}
                          options={typedSchedules.map(s => ({
                            value: s.id,
                            label: s.name,
                          }))}
                          disabled={switchingSchedule || refreshing}
                        />
                      </div>
                    </div>

                    {typedActiveSchedule && selectedScheduleId === typedActiveSchedule.id && (
                      <div className="flex items-center gap-2">
                        <Text variant="sage" size="sm">
                          ✓ "{typedActiveSchedule.name}" attiva
                        </Text>
                      </div>
                    )}
                  </>
                ) : (
                  <Text variant="tertiary" size="sm">
                    Nessuna programmazione disponibile
                  </Text>
                )}
              </div>
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
                  <Text size="sm" className="font-display">
                    {calibrationSuccess
                      ? '✓ Calibrazione valvole avviata con successo'
                      : '✗ Calibrazione fallita'
                    }
                  </Text>
                </div>
              )}

              <Button
                variant="subtle"
                onClick={handleCalibrateValves}
                loading={calibrating}
                fullWidth
                size="md"
                icon={calibrating ? undefined : '🔧'}
                className="bg-ocean-900/40 border-ocean-500/40 hover:bg-ocean-900/60 hover:border-ocean-400/50 [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200 [html:not(.dark)_&]:hover:bg-ocean-100/90 [html:not(.dark)_&]:hover:border-ocean-300 text-ocean-300 [html:not(.dark)_&]:text-ocean-700"
              >
                {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
              </Button>
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
