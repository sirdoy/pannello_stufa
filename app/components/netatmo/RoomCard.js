'use client';

import { useState } from 'react';
import { Card, Button, StatusBadge } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';

export default function RoomCard({ room, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTemp, setEditingTemp] = useState(false);
  const [targetTemp, setTargetTemp] = useState(room.setpoint || 20);

  const hasSetpoint = room.setpoint !== undefined;
  const hasTemperature = room.temperature !== undefined;
  const isHeating = room.heating || false;

  // Get device type icon and label
  function getDeviceIcon(module) {
    if (!module) return { icon: '📡', label: 'Dispositivo' };

    const types = {
      NATherm1: { icon: '🌡️', label: 'Termostato' },
      NRV: { icon: '🔧', label: 'Valvola' },
      NAPlug: { icon: '🔌', label: 'Relè' },
      OTM: { icon: '⚙️', label: 'Modulo OpenTherm' },
      OTH: { icon: '🎛️', label: 'Termostato OpenTherm' },
    };

    return types[module.type] || { icon: '📡', label: module.type || 'Sconosciuto' };
  }

  // Temperature color coding with dark mode
  function getTempColor(temp, setpoint) {
    if (!temp || !setpoint) return 'text-neutral-600 dark:text-neutral-400';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-success-600 dark:text-success-400';
    if (diff <= -1) return 'text-primary-600 dark:text-primary-400';
    return 'text-warning-600 dark:text-warning-400';
  }

  // Mode badge config with dark mode colors
  function getModeBadge(mode) {
    const badges = {
      manual: { text: 'Manuale', color: 'accent', icon: '✋' },
      home: { text: 'Casa', color: 'success', icon: '🏠' },
      max: { text: 'Max', color: 'warning', icon: '🔥' },
      off: { text: 'Off', color: 'neutral', icon: '⏸️' },
      schedule: { text: 'Programmato', color: 'info', icon: '⏰' },
    };
    return badges[mode] || badges.schedule;
  }

  // Room type display info
  function getRoomTypeInfo(type) {
    const types = {
      livingroom: { icon: '🛋️', label: 'Soggiorno' },
      bedroom: { icon: '🛏️', label: 'Camera' },
      kitchen: { icon: '🍳', label: 'Cucina' },
      bathroom: { icon: '🚿', label: 'Bagno' },
      office: { icon: '💼', label: 'Ufficio' },
      corridor: { icon: '🚪', label: 'Corridoio' },
      custom: { icon: '🏠', label: 'Personalizzata' },
    };
    return types[type] || { icon: '🏠', label: 'Stanza' };
  }

  async function setTemperature(temp) {
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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const badge = getModeBadge(room.mode);
  const roomInfo = getRoomTypeInfo(room.type);

  // Badge color classes with dark mode
  const badgeColors = {
    info: 'bg-info-100 dark:bg-info-900/40 text-info-700 dark:text-info-300 border-info-200 dark:border-info-700',
    accent: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 border-accent-200 dark:border-accent-700',
    success: 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-700',
    warning: 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-700',
    neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
  };

  return (
    <Card liquid className="p-5 sm:p-6 transition-all duration-300 hover:shadow-liquid-lg relative overflow-visible">
      {/* Heating indicator - floating badge */}
      {isHeating && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-warning-500/30 rounded-full blur-md animate-pulse" />
            <div className="relative bg-gradient-to-br from-warning-500 to-warning-600 text-white px-2.5 py-1 rounded-full shadow-lg ring-2 ring-white/30">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>🔥</span>
                <span className="hidden sm:inline">Attivo</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header - Clean two-row layout */}
      <div className="mb-4">
        {/* Row 1: Room icon + Name (full width) */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl flex-shrink-0">{roomInfo.icon}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate" title={room.name}>
              {room.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {roomInfo.label}
            </p>
          </div>
        </div>

        {/* Row 2: Badges (device type + mode) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device type badge */}
          {room.deviceType === 'thermostat' && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors.info}`}>
              <span>🌡️</span>
              <span>Termostato</span>
            </span>
          )}
          {room.deviceType === 'valve' && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors.accent}`}>
              <span>🔧</span>
              <span>Valvola</span>
            </span>
          )}

          {/* Mode badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${badgeColors[badge.color] || badgeColors.info}`}>
            <span>{badge.icon}</span>
            <span>{badge.text}</span>
          </span>
        </div>
      </div>

      {/* Temperature Display - Glass container */}
      {room.setpoint !== undefined ? (
        <div className="mb-4 p-4 rounded-2xl bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl border border-white/10 dark:border-white/5">
          <div className="flex items-baseline gap-2">
            {room.temperature !== undefined ? (
              <>
                <span className={`text-4xl font-black ${getTempColor(room.temperature, room.setpoint)}`}>
                  {room.temperature.toFixed(1)}°
                </span>
                <span className="text-neutral-400 dark:text-neutral-500 text-xl">/</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-neutral-400 dark:text-neutral-500" title="Sensore temperatura non disponibile">
                  --°
                </span>
                <span className="text-neutral-400 dark:text-neutral-500 text-xl mx-1">/</span>
              </>
            )}
            <span className="text-xl font-bold text-info-600 dark:text-info-400">
              {room.setpoint.toFixed(1)}°
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {room.temperature !== undefined ? 'Attuale / Setpoint' : 'Sensore non disponibile / Setpoint'}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-warning-50/50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-warning-700 dark:text-warning-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>Stanza non configurata o fuori linea</span>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-primary-50/80 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-primary-700 dark:text-primary-300">{error}</p>
        </div>
      )}

      {/* Temperature Editor */}
      {editingTemp ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-sm border border-white/10">
            <Button
              liquid
              variant="secondary"
              size="sm"
              onClick={() => setTargetTemp(Math.max(5, targetTemp - 0.5))}
              className="w-12 h-12"
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-black text-info-600 dark:text-info-400">
                {targetTemp.toFixed(1)}°
              </span>
            </div>
            <Button
              liquid
              variant="secondary"
              size="sm"
              onClick={() => setTargetTemp(Math.min(30, targetTemp + 0.5))}
              className="w-12 h-12"
            >
              +
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              liquid
              variant="success"
              onClick={() => setTemperature(targetTemp)}
              loading={loading}
              className="flex-1"
              size="sm"
            >
              ✓ Conferma
            </Button>
            <Button
              liquid
              variant="secondary"
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
            liquid
            variant="primary"
            onClick={() => setEditingTemp(true)}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Imposta temperatura manuale'}
          >
            🎯 Imposta
          </Button>
          <Button
            liquid
            variant="success"
            onClick={setModeHome}
            disabled={loading || !hasSetpoint}
            size="sm"
            title={!hasSetpoint ? 'Stanza non configurata' : 'Ritorna alla programmazione'}
          >
            🏠 Auto
          </Button>
          <Button
            liquid
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

      {/* Module Details */}
      {room.roomModules && room.roomModules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
            Dispositivi ({room.roomModules.length})
          </p>
          <div className="space-y-2">
            {room.roomModules.map(module => {
              const deviceInfo = getDeviceIcon(module);
              return (
                <div
                  key={module.id}
                  className="flex items-center gap-2 p-2.5 bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/10 dark:border-white/5 transition-all duration-200 hover:bg-white/[0.10] dark:hover:bg-white/[0.08]"
                >
                  <span className="text-lg flex-shrink-0">{deviceInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {module.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {deviceInfo.label}
                    </p>
                  </div>
                  {module.bridge && (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500" title="Connesso tramite bridge">
                      🔗
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
