'use client';

/**
 * PidAutomationPanel
 *
 * Panel for configuring stove-thermostat PID automation.
 * When enabled and stove is ON in automatic scheduler mode,
 * adjusts stove power level based on room temperature vs setpoint.
 *
 * Configuration stored in Firebase at users/${userId}/pidAutomation
 */

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth/useUser';
import { Card, Button, Banner, Skeleton, Heading, Text } from '@/app/components/ui';
import Toggle from '@/app/components/ui/Toggle';
import { NETATMO_ROUTES } from '@/lib/routes';
import { setPidConfig, subscribeToPidConfig } from '@/lib/services/pidAutomationService';
import { PIDController } from '@/lib/utils/pidController';

interface RoomData {
  room_id: string;
  room_name: string;
  temperature?: number;
  setpoint?: number;
  [key: string]: unknown;
}

interface RoomSelectorProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  onChange: (roomId: string | null) => void;
  disabled: boolean;
}

/**
 * Room Selector Component
 */
function RoomSelector({ rooms, selectedRoomId, onChange, disabled }: RoomSelectorProps) {
  return (
    <div className="space-y-2">
      <Text size="sm">
        Stanza da monitorare
      </Text>
      <select
        value={selectedRoomId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        aria-label="Stanza da monitorare"
        className="w-full rounded-xl border border-white/10 bg-slate-800/60
                   px-4 py-3
                   text-white 
                   transition-all focus:border-ember-500 focus:ring-2
                   focus:ring-ember-500/50 disabled:cursor-not-allowed
                   disabled:opacity-50"
      >
        <option value="">Seleziona stanza...</option>
        {rooms.map((room) => (
          <option key={room.room_id} value={room.room_id}>
            {room.room_name} ({room.temperature?.toFixed(1) || '--'}°C)
          </option>
        ))}
      </select>
    </div>
  );
}

interface ManualSetpointInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}

/**
 * Manual Setpoint Input Component
 */
function ManualSetpointInput({ value, onChange, disabled }: ManualSetpointInputProps) {
  const MIN_TEMP = 15;
  const MAX_TEMP = 25;
  const STEP = 0.5;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= MIN_TEMP && newValue <= MAX_TEMP) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(MAX_TEMP, value + STEP);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(MIN_TEMP, value - STEP);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <Text size="sm">
        Setpoint target
      </Text>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={MIN_TEMP}
          max={MAX_TEMP}
          step={STEP}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          aria-label="Setpoint target"
          className="h-2 w-full cursor-pointer appearance-none rounded-lg
                     bg-slate-700 
                     accent-ember-500
                     disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="mt-1 flex justify-between">
          <Text variant="tertiary" size="xs">{MIN_TEMP}°C</Text>
          <Text variant="tertiary" size="xs">{MAX_TEMP}°C</Text>
        </div>
      </div>

      {/* Numeric input with +/- buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= MIN_TEMP}
          className="size-10 rounded-full bg-slate-700/60 text-xl
                     font-bold
                     text-white 
                     transition-colors hover:bg-slate-600
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          −
        </button>
        <div className="relative">
          <input
            type="number"
            min={MIN_TEMP}
            max={MAX_TEMP}
            step={STEP}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            aria-label="Setpoint target in gradi"
            className="w-24 [appearance:textfield] rounded-xl border border-ember-500/50 bg-slate-800/60 px-3
                       py-2
                       text-center text-2xl
                       font-bold
                       text-ember-400 focus:ring-2
                       focus:ring-ember-500/50 disabled:cursor-not-allowed
                       disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ember-400/60">
            °C
          </span>
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= MAX_TEMP}
          className="size-10 rounded-full bg-slate-700/60 text-xl
                     font-bold
                     text-white 
                     transition-colors hover:bg-slate-600
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Compute PID power preview for display purposes.
 * Simulates a "cold start" (no accumulated integral/derivative)
 * with dt=5 minutes (the scheduler cron interval).
 */
function computePidPreview(measured: number | null | undefined, setpoint: number | null | undefined, kp: number, ki: number, kd: number): number | null {
  if (measured == null || setpoint == null) return null;
  const pid = new PIDController({ kp, ki, kd });
  return pid.compute(setpoint, measured, 5);
}

/**
 * Power level labels in Italian
 */
const POWER_LABELS: Record<number, string> = {
  1: 'Minima',
  2: 'Bassa',
  3: 'Media',
  4: 'Alta',
  5: 'Massima',
};

/**
 * Color class for each power level
 */
const POWER_COLORS: Record<number, string> = {
  1: 'text-blue-400 ',
  2: 'text-cyan-400 ',
  3: 'text-yellow-400 ',
  4: 'text-orange-400 ',
  5: 'text-red-400 ',
};

/**
 * Background color class for power level indicator
 */
const POWER_BG_COLORS: Record<number, string> = {
  1: 'bg-blue-500/20 border-blue-500/30',
  2: 'bg-cyan-500/20 border-cyan-500/30',
  3: 'bg-yellow-500/20 border-yellow-500/30',
  4: 'bg-orange-500/20 border-orange-500/30',
  5: 'bg-red-500/20 border-red-500/30',
};

interface PidPowerPreviewProps {
  powerLevel: number | null;
}

/**
 * PID Power Preview Component
 */
function PidPowerPreview({ powerLevel }: PidPowerPreviewProps) {
  if (powerLevel == null) return null;

  return (
    <div className={`mt-4 rounded-xl border p-4 ${POWER_BG_COLORS[powerLevel]}`}>
      <Text variant="secondary" size="sm" className="mb-2">
        Potenza boost calcolata dal PID
      </Text>
      <div className="flex items-center gap-3">
        {/* Power level bars */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-4 rounded-sm transition-all ${
                level <= powerLevel
                  ? 'bg-ember-500 '
                  : 'bg-slate-700/50 '
              }`}
              style={{ height: `${8 + level * 4}px` }}
            />
          ))}
        </div>
        {/* Power value */}
        <Text className={`text-3xl ${POWER_COLORS[powerLevel]}`}>
          {powerLevel}
        </Text>
        <Text variant="secondary" size="sm">
          / 5 &mdash; {POWER_LABELS[powerLevel]}
        </Text>
      </div>
      <Text variant="tertiary" size="xs" className="mt-2">
        Anteprima: potenza che il PID imposterebbe alla prima iterazione (dt=5min, senza storico)
      </Text>
    </div>
  );
}

interface TemperatureDisplayProps {
  room: RoomData | null;
  manualSetpoint: number;
  kp: number;
  ki: number;
  kd: number;
}

/**
 * Temperature Display Component
 */
function TemperatureDisplay({ room, manualSetpoint, kp, ki, kd }: TemperatureDisplayProps) {
  if (!room) {
    return (
      <div className="] rounded-xl border border-white/10 bg-white/4 p-4 backdrop-blur-sm">
        <Text variant="tertiary" size="sm">
          Seleziona una stanza per vedere la temperatura
        </Text>
      </div>
    );
  }

  // Use manual setpoint for calculations
  const targetSetpoint = manualSetpoint;

  // Compute PID power preview
  const previewPower = computePidPreview(room.temperature, targetSetpoint, kp, ki, kd);

  return (
    <div className="] rounded-xl border border-white/10 bg-white/4 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="secondary" size="sm">Temperatura attuale</Text>
          <Text className="text-2xl text-white ">
            {room.temperature?.toFixed(1) || '--'}°C
          </Text>
        </div>
        <div className="text-right">
          <Text variant="secondary" size="sm">Target PID</Text>
          <Text className="text-2xl text-ember-400 ">
            {targetSetpoint?.toFixed(1) || '--'}°C
          </Text>
        </div>
      </div>
      {room.temperature && targetSetpoint && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <Text variant="tertiary" size="xs">
            Differenza: {(targetSetpoint - room.temperature).toFixed(1)}°C
            {room.temperature < targetSetpoint
              ? ' (sotto target - aumenta potenza)'
              : room.temperature > targetSetpoint
                ? ' (sopra target - diminuisce potenza)'
                : ' (a target)'}
          </Text>
        </div>
      )}
      {room.setpoint && room.setpoint !== targetSetpoint && (
        <div className="mt-2">
          <Text variant="tertiary" size="xs">
            Setpoint Netatmo: {room.setpoint.toFixed(1)}°C (ignorato)
          </Text>
        </div>
      )}
      {/* PID Power Preview */}
      <PidPowerPreview powerLevel={previewPower} />
    </div>
  );
}

interface AdvancedSettingsProps {
  kp: number;
  ki: number;
  kd: number;
  onChange: (gain: string, value: number) => void;
  disabled: boolean;
}

/**
 * Advanced Settings (PID Gains) - Collapsible
 */
function AdvancedSettings({ kp, ki, kd, onChange, disabled }: AdvancedSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-white/2 px-4 py-3 transition-colors hover:bg-white/4"
      >
        <Text size="sm">
          Impostazioni avanzate (PID)
        </Text>
        <span className="text-slate-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-white/10 p-4">
          <Text variant="tertiary" size="xs">
            Modifica i guadagni PID solo se sai cosa stai facendo.
            Valori errati possono causare oscillazioni o instabilita.
          </Text>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block">
                <Text variant="secondary" size="xs">Kp (Proporzionale)</Text>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={kp}
                onChange={(e) => onChange('kp', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="w-full rounded-lg border border-white/10 bg-slate-800/60
                           px-3 py-2
                           text-sm text-white
                           focus:ring-2 focus:ring-ember-500/50
                           disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block">
                <Text variant="secondary" size="xs">Ki (Integrale)</Text>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={ki}
                onChange={(e) => onChange('ki', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="w-full rounded-lg border border-white/10 bg-slate-800/60
                           px-3 py-2
                           text-sm text-white
                           focus:ring-2 focus:ring-ember-500/50
                           disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block">
                <Text variant="secondary" size="xs">Kd (Derivativo)</Text>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={kd}
                onChange={(e) => onChange('kd', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="w-full rounded-lg border border-white/10 bg-slate-800/60
                           px-3 py-2
                           text-sm text-white
                           focus:ring-2 focus:ring-ember-500/50
                           disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PIDConfig {
  enabled: boolean;
  targetRoomId: string | null;
  manualSetpoint: number;
  kp: number;
  ki: number;
  kd: number;
}

export default function PidAutomationPanel() {
  const { user, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [manualSetpoint, setManualSetpoint] = useState(20);
  const [kp, setKp] = useState(0.5);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.05);

  // Rooms from Netatmo
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Original config for reset
  const [originalConfig, setOriginalConfig] = useState<PIDConfig | null>(null);

  // Load config and rooms on mount
  useEffect(() => {
    if (!user || userLoading) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch rooms from Netatmo
        const roomsResponse = await fetch(NETATMO_ROUTES.homeStatus);
        const roomsData = await roomsResponse.json();

        if (roomsData.error) {
          // Rate limiting error - don't show to user, just skip this load
          if (roomsData.error.includes('concurrency limited')) {
            console.warn('⚠️ Netatmo rate limit - skipping this load');
            setLoading(false);
            return;
          }
          throw new Error(roomsData.error);
        }

        // Extract rooms with temperature data
        const roomsList = roomsData.rooms || [];
        setRooms(roomsList);

        // Subscribe to config changes
        const unsubscribe = subscribeToPidConfig(user.sub, (config) => {
          setEnabled(config.enabled);
          setTargetRoomId(config.targetRoomId);
          setManualSetpoint(config.manualSetpoint ?? 20);
          setKp(config.kp ?? 0.5);
          setKi(config.ki ?? 0.1);
          setKd(config.kd ?? 0.05);
          setOriginalConfig(config);
          setHasChanges(false);
        });

        setLoading(false);

        return () => unsubscribe();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error loading PID config:', err);
        // Don't show rate limit errors to user
        if (!message.includes('concurrency limited')) {
          setError(message);
        }
        setLoading(false);
      }
    };

    loadData();
  }, [user, userLoading]);

  // Track changes
  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleRoomChange = (roomId: string | null) => {
    setTargetRoomId(roomId);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSetpointChange = (value: number) => {
    setManualSetpoint(value);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleGainChange = (gain: string, value: number) => {
    if (gain === 'kp') setKp(value);
    else if (gain === 'ki') setKi(value);
    else if (gain === 'kd') setKd(value);
    setHasChanges(true);
    setSuccess(false);
  };

  // Save config
  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (enabled && !targetRoomId) {
      setError('Seleziona una stanza da monitorare');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await setPidConfig(user.sub, {
        enabled,
        targetRoomId,
        manualSetpoint,
        kp,
        ki,
        kd,
      });

      setHasChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving PID config:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    if (originalConfig) {
      setEnabled(originalConfig.enabled);
      setTargetRoomId(originalConfig.targetRoomId);
      setManualSetpoint(originalConfig.manualSetpoint ?? 20);
      setKp(originalConfig.kp ?? 0.5);
      setKi(originalConfig.ki ?? 0.1);
      setKd(originalConfig.kd ?? 0.05);
      setHasChanges(false);
      setError(null);
    }
  };

  // Get selected room for temperature display
  const selectedRoom = rooms.find((r) => String(r.room_id) === String(targetRoomId)) || null;

  // Loading state
  if (userLoading || loading) {
    return (
      <Card variant="glass" className="p-6">
        <Skeleton className="h-64" />
      </Card>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Card variant="glass" className="p-6">
        <Text variant="secondary">
          Devi essere autenticato per configurare l&apos;automazione PID.
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Heading level={2} size="xl" className="mb-2 flex items-center gap-2">
          <span>🎯</span>
          <span>Automazione PID Stufa-Termostato</span>
        </Heading>
        <Text variant="secondary">
          Regola automaticamente la potenza della stufa per mantenere la temperatura target
        </Text>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="mb-4">
          <Banner variant="success">
            Configurazione salvata con successo!
          </Banner>
        </div>
      )}

      {/* Master Toggle */}
      <div className="] mb-6 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Text className="mb-1">
              Abilita automazione PID
            </Text>
            <Text variant="secondary" size="sm">
              Quando attivo, la potenza stufa si regola automaticamente in base alla temperatura
            </Text>
          </div>
          <Toggle
            checked={enabled}
            onCheckedChange={handleEnabledChange}
            disabled={saving}
            label="Abilita automazione PID"
            size="md"
          />
        </div>
      </div>

      {/* Configuration (only shown when enabled) */}
      {enabled && (
        <>
          {/* Room Selector */}
          <div className="mb-6">
            <RoomSelector
              rooms={rooms}
              selectedRoomId={targetRoomId}
              onChange={handleRoomChange}
              disabled={saving}
            />
          </div>

          {/* Manual Setpoint Input */}
          <div className="] mb-6 rounded-xl border border-ember-500/30 bg-white/4 p-4 backdrop-blur-sm">
            <ManualSetpointInput
              value={manualSetpoint}
              onChange={handleSetpointChange}
              disabled={saving}
            />
          </div>

          {/* Temperature Display */}
          <div className="mb-6">
            <TemperatureDisplay room={selectedRoom} manualSetpoint={manualSetpoint} kp={kp} ki={ki} kd={kd} />
          </div>

          {/* Advanced Settings */}
          <div className="mb-6">
            <AdvancedSettings
              kp={kp}
              ki={ki}
              kd={kd}
              onChange={handleGainChange}
              disabled={saving}
            />
          </div>
        </>
      )}

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <div className="flex gap-3">
          <Button
            variant="subtle"
            onClick={handleReset}
            disabled={saving}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            variant="ember"
            onClick={handleSave}
            disabled={saving || (enabled && !targetRoomId)}
            className="flex-1"
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 rounded-xl bg-slate-800/40 p-4 ">
        <Text variant="secondary" size="sm" className="mb-2">
          Come funziona
        </Text>
        <ul className="ml-4 space-y-1">
          <li>
            <Text variant="tertiary" size="xs">
              Quando abilitato e la stufa e in modalita automatica:
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - Legge la temperatura della stanza selezionata
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - Confronta con il setpoint target impostato manualmente
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - Regola la potenza stufa (1-5) per raggiungere il target
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - L&apos;algoritmo PID evita oscillazioni eccessive
            </Text>
          </li>
        </ul>
      </div>
    </Card>
  );
}
