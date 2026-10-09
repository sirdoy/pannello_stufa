'use client';

import { useState } from 'react';
import {
  AlarmClock, Battery, BatteryLow, BatteryWarning, Bath, BedDouble, Briefcase, Check, CookingPot, DoorOpen, Flame,
  Hand, Home, Link2, Minus, Pause, Plug, Plus, Radio, Settings, SlidersHorizontal, Sofa, Target, Thermometer,
  WifiOff, Wrench, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Button, Banner, Heading, Text, Badge } from '@/app/components/ui';
import { BatteryBadge } from '@/app/components/devices/thermostat/BatteryWarning';
import type { BatteryState } from '@/app/components/devices/thermostat/BatteryWarning';
import { NETATMO_ROUTES } from '@/lib/routes';

interface ModuleData {
  id: string;
  name?: string;
  type: string;
  battery_state?: string;
  reachable?: boolean;
  bridge?: string;
  [key: string]: unknown;
}

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    type: string;
    mode?: string;
    setpoint?: number;
    temperature?: number;
    heating?: boolean;
    deviceType?: 'thermostat' | 'valve' | 'unknown';
    hasLowBattery?: boolean;
    hasCriticalBattery?: boolean;
    isOffline?: boolean;
    stoveSync?: boolean;
    roomModules?: ModuleData[];
    [key: string]: unknown;
  };
  homeId?: string;
  onRefresh?: () => Promise<void>;
}

export default function RoomCard({ room, homeId, onRefresh }: RoomCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemp, setEditingTemp] = useState(false);
  const [targetTemp, setTargetTemp] = useState(room.setpoint || 20);

  const hasSetpoint = room.setpoint !== undefined;
  const isHeating = room.heating || false;

  // Get device type icon and label
  function getDeviceIcon(module: ModuleData | null): { Icon: LucideIcon; label: string } {
    if (!module) return { Icon: Radio, label: 'Dispositivo' };

    const types: Record<string, { Icon: LucideIcon; label: string }> = {
      NATherm1: { Icon: Thermometer, label: 'Termostato' },
      NRV: { Icon: Wrench, label: 'Valvola' },
      NAPlug: { Icon: Plug, label: 'Relè' },
      OTM: { Icon: Settings, label: 'Modulo OpenTherm' },
      OTH: { Icon: SlidersHorizontal, label: 'Termostato OpenTherm' },
    };

    return types[module.type] || { Icon: Radio, label: module.type || 'Sconosciuto' };
  }

  // Temperature color coding (data colours)
  function getTempColor(temp?: number, setpoint?: number): string {
    if (!temp || !setpoint) return 'text-(--text-2) ';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-sage-400 ';
    if (diff <= -1) return 'text-ember-400 ';
    return 'text-warning-400 ';
  }

  // Mode badge config (Badge variant + icon)
  type ModeBadge = { text: string; variant: 'ember' | 'sage' | 'warning' | 'neutral' | 'ocean'; Icon: LucideIcon };
  function getModeBadge(mode?: string): ModeBadge {
    const badges: Record<string, ModeBadge> = {
      manual: { text: 'Manuale', variant: 'ember', Icon: Hand },
      home: { text: 'Casa', variant: 'sage', Icon: Home },
      max: { text: 'Max', variant: 'warning', Icon: Flame },
      off: { text: 'Off', variant: 'neutral', Icon: Pause },
      schedule: { text: 'Programmato', variant: 'ocean', Icon: AlarmClock },
    };
    return (badges[mode || 'schedule'] ?? badges.schedule)!;
  }

  // Room type display info
  function getRoomTypeInfo(type?: string): { Icon: LucideIcon; label: string } {
    const types: Record<string, { Icon: LucideIcon; label: string }> = {
      livingroom: { Icon: Sofa, label: 'Soggiorno' },
      bedroom: { Icon: BedDouble, label: 'Camera' },
      kitchen: { Icon: CookingPot, label: 'Cucina' },
      bathroom: { Icon: Bath, label: 'Bagno' },
      office: { Icon: Briefcase, label: 'Ufficio' },
      corridor: { Icon: DoorOpen, label: 'Corridoio' },
      custom: { Icon: Home, label: 'Personalizzata' },
    };
    return types[type || 'custom'] || { Icon: Home, label: 'Stanza' };
  }

  async function setTemperature(temp: number) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: homeId,
          room_id: room.id,
          mode: 'manual',
          temp,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEditingTemp(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  async function setModeHome() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: homeId,
          room_id: room.id,
          mode: 'home',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  async function setModeOff() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: homeId,
          room_id: room.id,
          mode: 'home',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  const badge = getModeBadge(room.mode);
  const roomInfo = getRoomTypeInfo(room.type);

  // Get battery/offline/stoveSync status from room
  const hasLowBattery = room.hasLowBattery || false;
  const hasCriticalBattery = room.hasCriticalBattery || false;
  const isOffline = room.isOffline || false;
  const stoveSync = room.stoveSync || false;

  return (
    <Card variant="glass" className="relative overflow-visible p-5 sm:p-6">
      {/* Floating badges container */}
      <div className="absolute -top-2 right-2 z-20 flex items-center gap-2">
        {/* Battery warning badge */}
        {(hasLowBattery || hasCriticalBattery) && (
          <Badge
            variant={hasCriticalBattery ? 'danger' : 'warning'}
            size="sm"
            pulse={hasCriticalBattery}
            icon={hasCriticalBattery ? <BatteryWarning size={14} className="block" /> : <BatteryLow size={14} className="block" />}
          >
            <span className="hidden sm:inline">{hasCriticalBattery ? 'Critica' : 'Bassa'}</span>
          </Badge>
        )}

        {/* Offline badge */}
        {isOffline && (
          <Badge variant="neutral" size="sm" icon={<WifiOff size={14} className="block" />}>
            <span className="hidden sm:inline">Offline</span>
          </Badge>
        )}

        {/* Heating indicator badge */}
        {isHeating && (
          <Badge variant="ember" size="sm" pulse icon={<Flame size={14} className="block" />}>
            <span className="hidden sm:inline">Attivo</span>
          </Badge>
        )}

        {/* Stove sync indicator badge - shown when stove is ON and controlling this valve */}
        {stoveSync && (
          <Badge variant="warning" size="sm" icon={<Flame size={14} className="block" />}>
            <span className="hidden sm:inline">Stufa</span>
          </Badge>
        )}
      </div>

      {/* Header - Clean two-row layout */}
      <div className="mb-4">
        {/* Row 1: Room icon + Name (full width) */}
        <div className="mb-2 flex items-center gap-3">
          <roomInfo.Icon size={18} className="shrink-0 text-(--text-2)" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Heading level={3} size="lg" className="truncate" title={room.name}>
              {room.name}
            </Heading>
            <Text variant="tertiary" size="xs">
              {roomInfo.label}
            </Text>
          </div>
        </div>

        {/* Row 2: Badges (device type + mode) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device type badge */}
          {room.deviceType === 'thermostat' && (
            <Badge variant="ocean" icon={<Thermometer size={14} className="block" />}>
              Termostato
            </Badge>
          )}
          {room.deviceType === 'valve' && (
            <Badge variant="ember" icon={<Wrench size={14} className="block" />}>
              Valvola
            </Badge>
          )}

          {/* Mode badge */}
          <Badge variant={badge.variant} icon={<badge.Icon size={14} className="block" />}>
            {badge.text}
          </Badge>
        </div>
      </div>

      {/* Temperature Display */}
      {room.setpoint !== undefined ? (
        <Card variant="subtle" className="mb-4">
          <div className="flex items-baseline gap-2">
            {room.temperature !== undefined ? (
              <>
                <span className={`text-4xl font-black ${getTempColor(room.temperature, room.setpoint)}`}>
                  {room.temperature.toFixed(1)}°
                </span>
                <Text variant="tertiary" size="xl" as="span">/</Text>
              </>
            ) : (
              <>
                <Text variant="tertiary" size="xl" as="span" title="Sensore temperatura non disponibile">
                  --°
                </Text>
                <Text variant="tertiary" size="xl" as="span" className="mx-1">/</Text>
              </>
            )}
            <span className="text-xl font-bold text-ocean-400 ">
              {room.setpoint.toFixed(1)}°
            </span>
          </div>
          <Text variant="tertiary" size="xs" className="mt-2">
            {room.temperature !== undefined ? 'Attuale / Setpoint' : 'Sensore non disponibile / Setpoint'}
          </Text>
        </Card>
      ) : (
        <Banner variant="warning" compact className="mb-4">
          <Text variant="warning" size="sm">Stanza non configurata o fuori linea</Text>
        </Banner>
      )}

      {/* Error Message */}
      {error && (
        <Banner variant="error" compact className="mb-4">
          <Text variant="danger" size="sm">{error}</Text>
        </Banner>
      )}

      {/* Temperature Editor */}
      {editingTemp ? (
        <div className="space-y-3">
          <Card variant="subtle" padding={false} className="flex items-center gap-3 p-3">
            <Button.Icon
              variant="subtle"
              size="sm"
              onClick={() => setTargetTemp(Math.max(5, targetTemp - 0.5))}
              icon={<Minus size={18} />}
              aria-label="Diminuisci temperatura"
            />
            <div className="flex-1 text-center">
              <span className="text-3xl font-black text-ocean-400 ">
                {targetTemp.toFixed(1)}°
              </span>
            </div>
            <Button.Icon
              variant="subtle"
              size="sm"
              onClick={() => setTargetTemp(Math.min(30, targetTemp + 0.5))}
              icon={<Plus size={18} />}
              aria-label="Aumenta temperatura"
            />
          </Card>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => setTemperature(targetTemp)}
              loading={loading}
              className="flex-1"
              size="sm"
              icon={<Check size={16} />}
            >
              Conferma
            </Button>
            <Button.Icon
              variant="subtle"
              onClick={() => setEditingTemp(false)}
              disabled={loading}
              size="sm"
              icon={<X size={16} />}
              aria-label="Annulla"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ember"
            onClick={() => setEditingTemp(true)}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Imposta temperatura manuale'}
            icon={<Target size={16} />}
          >
            Imposta
          </Button>
          <Button
            variant="success"
            onClick={setModeHome}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Ritorna alla programmazione'}
            icon={<Home size={16} />}
          >
            Auto
          </Button>
          <Button
            variant="ghost"
            onClick={setModeOff}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Spegni riscaldamento'}
            icon={<Pause size={16} />}
          >
            Off
          </Button>
        </div>
      )}

      {/* Module Details with Battery Status */}
      {room.roomModules && room.roomModules.length > 0 && (
        <div className="mt-4 border-t border-white/8 pt-4">
          <Text variant="secondary" size="xs" className="mb-2">
            Dispositivi ({room.roomModules.length})
          </Text>
          <div className="space-y-2">
            {room.roomModules.map(module => {
              const deviceInfo = getDeviceIcon(module);
              const isModuleOffline = module.reachable === false;
              return (
                <Card
                  key={module.id}
                  variant="subtle"
                  padding={false}
                  className="flex items-center gap-2 p-2.5"
                >
                  <deviceInfo.Icon
                    size={18}
                    className={`shrink-0 text-(--text-2) ${isModuleOffline ? 'opacity-50' : ''}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <Text variant="body" size="xs" className={`truncate ${isModuleOffline ? 'opacity-60' : ''}`}>
                      {module.name}
                    </Text>
                    <Text variant="tertiary" size="xs">
                      {deviceInfo.label}
                    </Text>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Battery badge */}
                    {module.battery_state && (
                      <BatteryBadge batteryState={module.battery_state as BatteryState} showLabel />
                    )}
                    {/* Show battery OK for non-critical states */}
                    {module.battery_state && !['low', 'very_low'].includes(module.battery_state) && (
                      <span className="text-sage-400" title={`Batteria: ${module.battery_state}`}>
                        <Battery size={16} aria-hidden="true" />
                      </span>
                    )}
                    {/* Offline badge */}
                    {isModuleOffline && (
                      <Badge variant="neutral" size="sm" icon={<WifiOff size={12} className="block" />}>
                        Offline
                      </Badge>
                    )}
                    {/* Bridge indicator */}
                    {module.bridge && !isModuleOffline && (
                      <span className="text-(--text-2)" title="Connesso tramite bridge">
                        <Link2 size={14} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
