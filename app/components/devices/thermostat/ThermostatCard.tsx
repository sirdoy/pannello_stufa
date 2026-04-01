'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { NETATMO_ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils/cn';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Text, Button, EmptyState, Spinner, Select, Badge } from '../../ui';
import BatteryWarning, { ModuleBatteryList } from './BatteryWarning';
import { useScheduleData } from '@/lib/hooks/useScheduleData';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import { useDebounce } from '@/app/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useThermostatData } from './hooks/useThermostatData';
import { LastUpdated } from '@/app/components/ui/LastUpdated';

/**
 * ThermostatCard - Complete thermostat control for homepage
 * Summary view of Netatmo integration with quick controls
 * Includes battery status warnings and stove sync indicator
 */
export default function ThermostatCard() {
  const router = useRouter();
  const { connected, topology, status, loading, error: dataError, staleness, lastUpdatedAt, refetch } = useThermostatData();
  const [commandError, setCommandError] = useState<string | null>(null);
  const error = dataError ?? commandError;
  const setError = setCommandError;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<boolean | null>(null);
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);

  // Pending setpoint for debounced thermostat writes
  const [pendingSetpoint, setPendingSetpoint] = useState<number | null>(null);
  const debouncedSetpoint = useDebounce(pendingSetpoint, 500);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Schedule management
  const { schedules, activeSchedule, loading: scheduleLoading, refetch: refetchSchedules } = useScheduleData();

  // Online status tracking
  const { isOnline } = useOnlineStatus();

  // Type assertion for schedules data (from useScheduleData hook)
  interface ScheduleItem {
    id: string;
    name: string;
  }
  const typedSchedules = schedules as unknown as ScheduleItem[];
  const typedActiveSchedule = activeSchedule as unknown as ScheduleItem | undefined;
  const [switchingSchedule, setSwitchingSchedule] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  // Retry infrastructure - one hook per command type
  const netatmoModeCmd = useRetryableCommand({ device: 'netatmo', action: 'setMode' });
  const netatmoTempCmd = useRetryableCommand({ device: 'netatmo', action: 'setTemp' });
  const netatmoCalibrateCmd = useRetryableCommand({ device: 'netatmo', action: 'calibrate' });
  const netatmoScheduleCmd = useRetryableCommand({ device: 'netatmo', action: 'setSchedule' });

  // Sync selectedScheduleId with activeSchedule
  useEffect(() => {
    if (typedActiveSchedule && !selectedScheduleId && typedActiveSchedule.id) {
      setSelectedScheduleId(typedActiveSchedule.id);
    }
  }, [activeSchedule, selectedScheduleId]);

  // Debounced thermostat write: fire API call only after 500ms of no setpoint changes
  useEffect(() => {
    if (debouncedSetpoint === null) return;
    const room = topology?.rooms?.find((r: any) => r.id === selectedRoomId);
    if (!room) return;
    const roomStatus = status?.rooms?.find((r: any) => r.room_id === room.id);
    if (debouncedSetpoint === roomStatus?.setpoint) {
      setPendingSetpoint(null); // No change needed
      return;
    }
    handleTemperatureChange(room.id, debouncedSetpoint);
    setPendingSetpoint(null);
  }, [debouncedSetpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pending setpoint on room change to prevent cross-room writes
  useEffect(() => {
    setPendingSetpoint(null);
  }, [selectedRoomId]);

  // Get rooms with status (includes stove sync info)
  // Shows ALL rooms including offline ones
  const rooms = topology?.rooms || [];
  const topologyModules = topology?.modules || [];
  const statusModules = status?.modules || [];

  // Merge topology modules with status modules to get battery/reachable info
  const modulesWithStatus = topologyModules.map((topModule: any) => {
    const statModule = statusModules.find((m: any) => m.id === topModule.id);
    return {
      ...topModule,
      battery_state: statModule?.battery_state,
      reachable: statModule?.reachable ?? true,
    };
  });

  const roomsWithStatus = rooms.map((room: any) => {
    const roomStatus = status?.rooms?.find((r: any) => r.room_id === room.id);

    // Find modules for this room to check if offline (exclude relays and cameras)
    const roomModuleIds = room.module_ids ?? room.modules ?? [];
    const roomModules = roomModuleIds.map((moduleId: string) =>
      modulesWithStatus.find((m: any) => m.id === moduleId)
    ).filter(Boolean).filter((m: any) => m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC') || [];

    // Check if room is offline (all modules unreachable)
    const isOffline = roomModules.length > 0 && roomModules.every((m: any) => m.reachable === false);

    // Check battery status
    const hasLowBattery = roomModules.some((m: any) =>
      m.battery_state === 'low' || m.battery_state === 'very_low'
    );
    const hasCriticalBattery = roomModules.some((m: any) => m.battery_state === 'very_low');

    // Determine device type
    const hasThermostat = roomModules.some((m: any) => m.type === 'NATherm1' || m.type === 'OTH');
    const hasValve = roomModules.some((m: any) => m.type === 'NRV');
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
  }).filter((room: any) => {
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

  const selectedRoom = roomsWithStatus.find((r: any) => r.id === selectedRoomId) || roomsWithStatus[0];
  const mode = status?.mode || 'schedule';
  const hasHeating = roomsWithStatus.some((r: any) => r.heating);

  // Filter only active rooms (heating or setpoint > temperature)
  const activeRooms = roomsWithStatus.filter((room: any) => {
    if (room.isOffline) return false;
    return room.heating === true ||
           (room.setpoint && room.temperature && room.setpoint > room.temperature);
  });

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleModeChange(newMode: string) {
    try {
      setLoadingMessage('Cambio modalità termostato...');
      setRefreshing(true);
      setError(null);
      const response = await netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: topology!.home_id, mode: newMode }),
      });

      if (response) {
        const data = await response.json() as { error?: string };
        if (data.error) throw new Error(data.error);
        await refetch();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleTemperatureChange(roomId: string, temp: number) {
    try {
      setLoadingMessage('Modifica temperatura...');
      setRefreshing(true);
      setError(null);
      const response = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: topology!.home_id,
          room_id: roomId,
          mode: 'manual',
          temp,
        }),
      });

      if (response) {
        const data = await response.json() as { error?: string };
        if (data.error) throw new Error(data.error);
        await refetch();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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

      const response = await netatmoCalibrateCmd.execute(NETATMO_ROUTES.calibrate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response) {
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.success) {
          setCalibrationSuccess(true);
          // Clear success message after 5 seconds
          setTimeout(() => setCalibrationSuccess(null), 5000);
        }

        await refetch();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore calibrazione valvole:', err);
      setError(`Calibrazione fallita: ${message}`);
      setCalibrationSuccess(false);
    } finally {
      setCalibrating(false);
      setRefreshing(false);
    }
  }

  async function handleScheduleChange(scheduleId: string) {
    if (!scheduleId || scheduleId === typedActiveSchedule?.id) return;

    if (!topology?.home_id) {
      setError('Home ID non disponibile');
      return;
    }

    try {
      setSwitchingSchedule(true);
      setLoadingMessage('Cambio programmazione...');
      setError(null);

      const response = await netatmoScheduleCmd.execute(NETATMO_ROUTES.switchHomeSchedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: topology.home_id, schedule_id: scheduleId }),
      });

      if (response) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Errore cambio programmazione');

        // Refetch schedules to update active
        await refetchSchedules();
        setSelectedScheduleId(scheduleId);
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSwitchingSchedule(false);
    }
  }

  // Build props for DeviceCard
  const banners: any[] = [];

  // Retry Infrastructure Error Banner
  if (netatmoModeCmd.lastError || netatmoTempCmd.lastError || netatmoCalibrateCmd.lastError || netatmoScheduleCmd.lastError) {
    banners.push({
      variant: 'error',
      description: (netatmoModeCmd.lastError || netatmoTempCmd.lastError || netatmoCalibrateCmd.lastError || netatmoScheduleCmd.lastError)?.message,
      actions: [
        {
          label: 'Riprova',
          onClick: () => {
            const failedCmd = [netatmoModeCmd, netatmoTempCmd, netatmoCalibrateCmd, netatmoScheduleCmd].find(cmd => cmd.lastError);
            failedCmd?.retry();
          },
          variant: 'ghost'
        }
      ]
    });
  }

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
    const deviceList = lowBatteryModules.map((m: any) => {
      const typeName = m.type === 'NRV' ? 'Valvola' : m.type === 'NATherm1' ? 'Termostato' : m.type;
      const name = m.name || m.id?.substring(0, 8) || 'Sconosciuto';
      return `${typeName} "${name}"`;
    }).join(',');

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
    { icon: '📡', label: 'Dispositivi', value: modulesWithStatus.filter((m: any) => m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC').length },
    ...(hasLowBattery ? [{ icon: hasCriticalBattery ? '🪫' : '🔋', label: 'Batteria', value: `${lowBatteryModules.length} bassa` }] : []),
  ] : [];

  return (
    <DeviceCard
      icon="🌡️"
      title="Termostato"
      colorTheme="ocean"
      connected={connected}
      connectInfoRoute="/thermostat"
      loading={loading || refreshing || calibrating || switchingSchedule}
      loadingMessage={loadingMessage}
      skeletonComponent={loading ? <Skeleton.ThermostatCard /> : null}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
    >
      {/* Active Devices List - Shows only actively heating rooms */}
      {activeRooms.length > 0 && (
        <div className="mb-4 sm:mb-5">
          <Divider label="Dispositivi Attivi" variant="gradient" spacing="medium" />

          <div className="mt-4 flex flex-wrap gap-2">
            {activeRooms.map((room: any) => {
              // Device type icon
              const deviceIcon = room.deviceType === 'valve' ? '🔧' : room.deviceType === 'thermostat' ? '🌡️' : '📡';

              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    "bg-ember-900/40 border-ember-500/40 text-ember-300"
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
        rooms={roomsWithStatus.map((room: any) => ({
          id: room.id,
          name: room.name,
          isOffline: room.isOffline,
          hasLowBattery: room.hasLowBattery,
          hasCriticalBattery: room.hasCriticalBattery,
          heating: room.heating,
        }))}
        selectedRoomId={selectedRoomId || undefined}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoomId(e.target.value)}
      />

      {/* Selected Room Temperature */}
      {selectedRoom ? (
        <div className="space-y-4 mb-4 sm:mb-6">
                {/* Offline Room Display */}
                {selectedRoom.isOffline ? (
                  <div className="relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 border-slate-600/40">
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
                    ? 'bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30 border-ember-500/40 shadow-ember-glow'
                    : 'bg-gradient-to-br from-ocean-900/30 via-slate-900/60 to-ocean-800/20 border-ocean-500/30'
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
                    <div className="relative overflow-hidden rounded-2xl bg-ocean-900/40 backdrop-blur-xl border border-ocean-500/30">
                      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                        <Text variant="label" size="xs" className="mb-2 font-display text-ocean-300">
                          Attuale
                        </Text>
                        <div className="flex items-baseline gap-1">
                          <Text className="text-4xl sm:text-5xl font-display text-ocean-100 leading-none">
                            {selectedRoom.temperature}
                          </Text>
                          <Text as="span" className="text-2xl sm:text-3xl text-ocean-400/70">°</Text>
                        </div>
                      </div>
                    </div>

                    {/* Target Temperature Box */}
                    {selectedRoom.setpoint && (
                      <div className="relative overflow-hidden rounded-2xl bg-ocean-900/50 backdrop-blur-xl border border-ocean-500/40">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                          <Text variant="label" size="xs" className="mb-2 font-display text-ocean-300">
                            Target
                          </Text>
                          <div className="flex items-baseline gap-1">
                            <Text className="text-4xl sm:text-5xl font-display text-ocean-200 leading-none">
                              {selectedRoom.setpoint}
                            </Text>
                            <Text as="span" className="text-2xl sm:text-3xl text-ocean-400/70">°</Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Devices Summary - Shows which devices are controlling this room */}
                  {selectedRoom.roomModules && selectedRoom.roomModules.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      {selectedRoom.roomModules.map((module: any) => {
                        const isValve = module.type === 'NRV';
                        const isThermostat = module.type === 'NATherm1' || module.type === 'OTH';
                        const isReachable = module.reachable !== false;

                        return (
                          <div
                            key={module.id}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              selectedRoom.heating && isReachable
                                ? "bg-ember-900/40 border-ember-500/40 text-ember-300"
                                : isReachable
                                ? "bg-slate-800/40 border-slate-600/30 text-slate-300"
                                : "bg-slate-900/40 border-slate-700/30 text-slate-500 opacity-60"
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

                  {/* Staleness Indicator */}
                  {staleness?.cachedAt && (
                    <div className="mt-4 text-center">
                      <Text variant="tertiary" size="sm">
                        Ultimo aggiornamento: {formatDistanceToNow(new Date(staleness.cachedAt), { addSuffix: true, locale: it })}
                      </Text>
                    </div>
                  )}
                </div>
                )}

                {/* Quick temperature controls - Ember Noir */}
                {isOnline && selectedRoom.setpoint && !selectedRoom.isOffline && (
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="subtle"
                        size="lg"
                        onClick={() => {
                          const current = pendingSetpoint ?? selectedRoom.setpoint;
                          setPendingSetpoint(parseFloat((current - 0.5).toFixed(1)));
                        }}
                        disabled={refreshing}
                        className="flex-1 h-16 sm:h-18 text-lg font-bold font-display"
                      >
                        − 0.5°
                      </Button>
                      <div className="flex flex-col items-center justify-center px-4">
                        <Text variant="label" size="xs" className="font-display">Target</Text>
                        <Text variant="tertiary" className="text-2xl sm:text-3xl font-display">{pendingSetpoint ?? selectedRoom.setpoint}°</Text>
                      </div>
                      <Button
                        variant="subtle"
                        size="lg"
                        onClick={() => {
                          const current = pendingSetpoint ?? selectedRoom.setpoint;
                          setPendingSetpoint(parseFloat((current + 0.5).toFixed(1)));
                        }}
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
                level={3}
              />
            )}

            {/* Separator */}
            <Divider label="Modalità" variant="gradient" spacing="large" />

            {isOnline ? (
              <>
            {/* Mode Control - Redesigned for better readability */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'schedule', icon: '⏰', label: 'Auto', color: 'sage' },
                { id: 'away', icon: '🏃', label: 'Away', color: 'warning' },
                { id: 'hg', icon: '❄️', label: 'Gelo', color: 'ocean' },
                { id: 'off', icon: '⏸️', label: 'Off', color: 'slate' },
              ].map(({ id, icon, label, color }) => {
                const isActive = mode === id;
                const colorStyles: Record<string, string> = {
                  sage: isActive
                    ? 'bg-sage-900/50 border-sage-400/60 ring-2 ring-sage-500/30'
                    : '',
                  warning: isActive
                    ? 'bg-warning-900/50 border-warning-400/60 ring-2 ring-warning-500/30'
                    : '',
                  ocean: isActive
                    ? 'bg-ocean-900/50 border-ocean-400/60 ring-2 ring-ocean-500/30'
                    : '',
                  slate: isActive
                    ? 'bg-slate-700/70 border-slate-500/60 ring-2 ring-slate-500/30'
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
                        ? 'text-white'
                        : 'text-slate-400'
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
                            setSelectedScheduleId(String(e.target.value));
                            handleScheduleChange(String(e.target.value));
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
                    ? 'bg-sage-900/30 border-sage-500/40 text-sage-300'
                    : 'bg-danger-900/30 border-danger-500/40 text-danger-300'
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
                className="bg-ocean-900/40 border-ocean-500/40 hover:bg-ocean-900/60 hover:border-ocean-400/50 text-ocean-300"
              >
                {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
              </Button>
            </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <Text variant="secondary" size="sm">
                  Controlli non disponibili offline
                </Text>
              </div>
            )}

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

      <LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-700/30" />
    </DeviceCard>
  );
}
