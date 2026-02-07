'use client';

import { useState } from 'react';
import { Card, Button, StatusBadge, Heading, Text, Badge } from '@/app/components/ui';
import { BatteryBadge } from '@/app/components/devices/thermostat/BatteryWarning';
import { NETATMO_ROUTES } from '@/lib/routes';

interface ModuleData {
  id: string;
  name: string;
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
  onRefresh?: () => Promise<void>;
}

export default function RoomCard({ room, onRefresh }: RoomCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemp, setEditingTemp] = useState(false);
  const [targetTemp, setTargetTemp] = useState(room.setpoint || 20);

  const hasSetpoint = room.setpoint !== undefined;
  const hasTemperature = room.temperature !== undefined;
  const isHeating = room.heating || false;

  // Get device type icon and label
  function getDeviceIcon(module: ModuleData | null): { icon: string; label: string } {
    if (!module) return { icon: '📡', label: 'Dispositivo' };

    const types: Record<string, { icon: string; label: string }> = {
      NATherm1: { icon: '🌡️', label: 'Termostato' },
      NRV: { icon: '🔧', label: 'Valvola' },
      NAPlug: { icon: '🔌', label: 'Relè' },
      OTM: { icon: '⚙️', label: 'Modulo OpenTherm' },
      OTH: { icon: '🎛️', label: 'Termostato OpenTherm' },
    };

    return types[module.type] || { icon: '📡', label: module.type || 'Sconosciuto' };
  }

  // Temperature color coding with dark mode
  function getTempColor(temp?: number, setpoint?: number): string {
    if (!temp || !setpoint) return 'text-slate-400 [html:not(.dark)_&]:text-slate-600';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-sage-400 [html:not(.dark)_&]:text-sage-600';
    if (diff <= -1) return 'text-ember-400 [html:not(.dark)_&]:text-ember-600';
    return 'text-warning-400 [html:not(.dark)_&]:text-warning-600';
  }

  // Mode badge config with dark mode colors
  function getModeBadge(mode?: string): { text: string; color: string; icon: string } {
    const badges: Record<string, { text: string; color: string; icon: string }> = {
      manual: { text: 'Manuale', color: 'flame', icon: '✋' },
      home: { text: 'Casa', color: 'sage', icon: '🏠' },
      max: { text: 'Max', color: 'warning', icon: '🔥' },
      off: { text: 'Off', color: 'slate', icon: '⏸️' },
      schedule: { text: 'Programmato', color: 'ocean', icon: '⏰' },
    };
    return badges[mode || 'schedule'] || badges.schedule;
  }

  // Room type display info
  function getRoomTypeInfo(type?: string): { icon: string; label: string } {
    const types: Record<string, { icon: string; label: string }> = {
      livingroom: { icon: '🛋️', label: 'Soggiorno' },
      bedroom: { icon: '🛏️', label: 'Camera' },
      kitchen: { icon: '🍳', label: 'Cucina' },
      bathroom: { icon: '🚿', label: 'Bagno' },
      office: { icon: '💼', label: 'Ufficio' },
      corridor: { icon: '🚪', label: 'Corridoio' },
      custom: { icon: '🏠', label: 'Personalizzata' },
    };
    return types[type || 'custom'] || { icon: '🏠', label: 'Stanza' };
  }

  async function setTemperature(temp: number) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          room_id: room.id,
          mode: 'off',
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

  // Badge color classes with dark mode
  const badgeColors: Record<string, string> = {
    ocean: 'bg-ocean-900/40 [html:not(.dark)_&]:bg-ocean-100 text-ocean-300 [html:not(.dark)_&]:text-ocean-700 border-ocean-700 [html:not(.dark)_&]:border-ocean-200',
    flame: 'bg-flame-900/40 [html:not(.dark)_&]:bg-flame-100 text-flame-300 [html:not(.dark)_&]:text-flame-700 border-flame-700 [html:not(.dark)_&]:border-flame-200',
    sage: 'bg-sage-900/40 [html:not(.dark)_&]:bg-sage-100 text-sage-300 [html:not(.dark)_&]:text-sage-700 border-sage-700 [html:not(.dark)_&]:border-sage-200',
    warning: 'bg-warning-900/40 [html:not(.dark)_&]:bg-warning-100 text-warning-300 [html:not(.dark)_&]:text-warning-700 border-warning-700 [html:not(.dark)_&]:border-warning-200',
    slate: 'bg-slate-800 [html:not(.dark)_&]:bg-slate-100 text-slate-300 [html:not(.dark)_&]:text-slate-600 border-slate-700 [html:not(.dark)_&]:border-slate-200',
  };

  // Get battery/offline/stoveSync status from room
  const hasLowBattery = room.hasLowBattery || false;
  const hasCriticalBattery = room.hasCriticalBattery || false;
  const isOffline = room.isOffline || false;
  const stoveSync = room.stoveSync || false;

  return (
    <Card variant="glass" className="p-5 sm:p-6 transition-all duration-300 hover:shadow-liquid-lg relative overflow-visible">
      {/* Floating badges container */}
      <div className="absolute -top-2 right-2 z-20 flex items-center gap-2">
        {/* Battery warning badge */}
        {(hasLowBattery || hasCriticalBattery) && (
          <Badge
            variant={hasCriticalBattery ? 'danger' : 'warning'}
            size="sm"
            pulse={hasCriticalBattery}
            icon={<span>{hasCriticalBattery ? '🪫' : '🔋'}</span>}
          >
            <span className="hidden sm:inline">{hasCriticalBattery ? 'Critica' : 'Bassa'}</span>
          </Badge>
        )}

        {/* Offline badge */}
        {isOffline && (
          <Badge variant="neutral" size="sm" icon={<span>📵</span>}>
            <span className="hidden sm:inline">Offline</span>
          </Badge>
        )}

        {/* Heating indicator badge */}
        {isHeating && (
          <Badge variant="ember" size="sm" pulse icon={<span>🔥</span>}>
            <span className="hidden sm:inline">Attivo</span>
          </Badge>
        )}

        {/* Stove sync indicator badge - shown when stove is ON and controlling this valve */}
        {stoveSync && (
          <Badge variant="warning" size="sm" icon={<span>🔥</span>}>
            <span className="hidden sm:inline">Stufa</span>
          </Badge>
        )}
      </div>

      {/* Header - Clean two-row layout */}
      <div className="mb-4">
        {/* Row 1: Room icon + Name (full width) */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl flex-shrink-0">{roomInfo.icon}</span>
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
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors.ocean}`}>
              <span className="text-base">🌡️</span>
              <span>Termostato</span>
            </span>
          )}
          {room.deviceType === 'valve' && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors.flame}`}>
              <span>🔧</span>
              <span>Valvola</span>
            </span>
          )}

          {/* Mode badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors[badge.color] || badgeColors.ocean}`}>
            <span>{badge.icon}</span>
            <span>{badge.text}</span>
          </span>
        </div>
      </div>

      {/* Temperature Display - Glass container */}
      {room.setpoint !== undefined ? (
        <div className="mb-4 p-4 rounded-2xl bg-white/[0.05] [html:not(.dark)_&]:bg-white/[0.08] backdrop-blur-xl border border-white/5 [html:not(.dark)_&]:border-white/10">
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
            <span className="text-xl font-bold text-ocean-400 [html:not(.dark)_&]:text-ocean-600">
              {room.setpoint.toFixed(1)}°
            </span>
          </div>
          <Text variant="tertiary" size="xs" className="mt-2">
            {room.temperature !== undefined ? 'Attuale / Setpoint' : 'Sensore non disponibile / Setpoint'}
          </Text>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-warning-900/20 [html:not(.dark)_&]:bg-warning-50/50 border border-warning-700 [html:not(.dark)_&]:border-warning-200 rounded-xl backdrop-blur-sm">
          <Text variant="warning" size="sm" className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Stanza non configurata o fuori linea</span>
          </Text>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-danger-900/30 [html:not(.dark)_&]:bg-danger-50/80 border border-danger-700 [html:not(.dark)_&]:border-danger-200 rounded-xl backdrop-blur-sm">
          <Text variant="danger" size="sm">{error}</Text>
        </div>
      )}

      {/* Temperature Editor */}
      {editingTemp ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-white/10">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setTargetTemp(Math.max(5, targetTemp - 0.5))}
              className="w-12 h-12"
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-black text-ocean-400 [html:not(.dark)_&]:text-ocean-600">
                {targetTemp.toFixed(1)}°
              </span>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setTargetTemp(Math.min(30, targetTemp + 0.5))}
              className="w-12 h-12"
            >
              +
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => setTemperature(targetTemp)}
              loading={loading}
              className="flex-1"
              size="sm"
            >
              ✓ Conferma
            </Button>
            <Button
              variant="subtle"
              onClick={() => setEditingTemp(false)}
              disabled={loading}
              size="sm"
              className="w-12"
            >
              ✕
            </Button>
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
          >
            🎯 Imposta
          </Button>
          <Button
            variant="success"
            onClick={setModeHome}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Ritorna alla programmazione'}
          >
            🏠 Auto
          </Button>
          <Button
            variant="ghost"
            onClick={setModeOff}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Spegni riscaldamento'}
          >
            ⏸️ Off
          </Button>
        </div>
      )}

      {/* Module Details with Battery Status */}
      {room.roomModules && room.roomModules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 [html:not(.dark)_&]:border-white/10">
          <Text variant="secondary" size="xs" className="mb-2">
            Dispositivi ({room.roomModules.length})
          </Text>
          <div className="space-y-2">
            {room.roomModules.map(module => {
              const deviceInfo = getDeviceIcon(module);
              const isModuleOffline = module.reachable === false;
              return (
                <div
                  key={module.id}
                  className={`flex items-center gap-2 p-2.5 backdrop-blur-sm rounded-xl border transition-all duration-200 ${
                    isModuleOffline
                      ? 'bg-slate-800/40 [html:not(.dark)_&]:bg-slate-200/60 border-slate-600/30 [html:not(.dark)_&]:border-slate-300'
                      : 'bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] border-white/5 [html:not(.dark)_&]:border-white/10 hover:bg-white/[0.08] [html:not(.dark)_&]:hover:bg-white/[0.10]'
                  }`}
                >
                  <span className={`text-lg flex-shrink-0 ${isModuleOffline ? 'opacity-50' : ''}`}>{deviceInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <Text variant="body" size="xs" className={`truncate ${isModuleOffline ? 'opacity-60' : ''}`}>
                      {module.name}
                    </Text>
                    <Text variant="tertiary" size="xs">
                      {deviceInfo.label}
                    </Text>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Battery badge */}
                    {module.battery_state && (
                      <>{(BatteryBadge as any)({ batteryState: module.battery_state, showLabel: true })}</>
                    )}
                    {/* Show battery OK for non-critical states */}
                    {module.battery_state && !['low', 'very_low'].includes(module.battery_state) && (
                      <span className="text-xs text-sage-400 [html:not(.dark)_&]:text-sage-600" title={`Batteria: ${module.battery_state}`}>
                        🔋
                      </span>
                    )}
                    {/* Offline badge */}
                    {isModuleOffline && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-300">
                        📵 Offline
                      </span>
                    )}
                    {/* Bridge indicator */}
                    {module.bridge && !isModuleOffline && (
                      <Text variant="tertiary" size="xs" as="span" title="Connesso tramite bridge">
                        🔗
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
