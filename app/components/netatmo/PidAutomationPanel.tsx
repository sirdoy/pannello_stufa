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
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, Button, Banner, Skeleton, Heading, Text } from '@/app/components/ui';
import Toggle from '@/app/components/ui/Toggle';
import { NETATMO_ROUTES } from '@/lib/routes';
import { getPidConfig, setPidConfig, subscribeToPidConfig } from '@/lib/services/pidAutomationService';
import { PIDController } from '@/lib/utils/pidController';

/**
 * Room Selector Component
 */
function RoomSelector({ rooms, selectedRoomId, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Text weight="semibold" size="sm">
        Stanza da monitorare
      </Text>
      <select
        value={selectedRoomId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl bg-slate-800/60 [html:not(.dark)_&]:bg-white/80
                   border border-white/10 [html:not(.dark)_&]:border-slate-200
                   text-white [html:not(.dark)_&]:text-slate-900
                   focus:ring-2 focus:ring-ember-500/50 focus:border-ember-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all"
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

/**
 * Manual Setpoint Input Component
 */
function ManualSetpointInput({ value, onChange, disabled }) {
  const MIN_TEMP = 15;
  const MAX_TEMP = 25;
  const STEP = 0.5;

  const handleSliderChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e) => {
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
      <Text weight="semibold" size="sm">
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
          className="w-full h-2 rounded-lg appearance-none cursor-pointer
                     bg-slate-700 [html:not(.dark)_&]:bg-slate-200
                     accent-ember-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between mt-1">
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
          className="w-10 h-10 rounded-full bg-slate-700/60 [html:not(.dark)_&]:bg-slate-200
                     text-white [html:not(.dark)_&]:text-slate-900
                     hover:bg-slate-600 [html:not(.dark)_&]:hover:bg-slate-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-xl font-bold"
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
            className="w-24 px-3 py-2 text-center text-2xl font-bold rounded-xl
                       bg-slate-800/60 [html:not(.dark)_&]:bg-white/80
                       border border-ember-500/50
                       text-ember-400 [html:not(.dark)_&]:text-ember-600
                       focus:ring-2 focus:ring-ember-500/50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ember-400/60 text-sm">
            °C
          </span>
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= MAX_TEMP}
          className="w-10 h-10 rounded-full bg-slate-700/60 [html:not(.dark)_&]:bg-slate-200
                     text-white [html:not(.dark)_&]:text-slate-900
                     hover:bg-slate-600 [html:not(.dark)_&]:hover:bg-slate-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-xl font-bold"
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
function computePidPreview(measured, setpoint, kp, ki, kd) {
  if (measured == null || setpoint == null) return null;
  const pid = new PIDController({ kp, ki, kd });
  return pid.compute(setpoint, measured, 5);
}

/**
 * Power level labels in Italian
 */
const POWER_LABELS = {
  1: 'Minima',
  2: 'Bassa',
  3: 'Media',
  4: 'Alta',
  5: 'Massima',
};

/**
 * Color class for each power level
 */
const POWER_COLORS = {
  1: 'text-blue-400 [html:not(.dark)_&]:text-blue-600',
  2: 'text-cyan-400 [html:not(.dark)_&]:text-cyan-600',
  3: 'text-yellow-400 [html:not(.dark)_&]:text-yellow-600',
  4: 'text-orange-400 [html:not(.dark)_&]:text-orange-600',
  5: 'text-red-400 [html:not(.dark)_&]:text-red-600',
};

/**
 * Background color class for power level indicator
 */
const POWER_BG_COLORS = {
  1: 'bg-blue-500/20 border-blue-500/30',
  2: 'bg-cyan-500/20 border-cyan-500/30',
  3: 'bg-yellow-500/20 border-yellow-500/30',
  4: 'bg-orange-500/20 border-orange-500/30',
  5: 'bg-red-500/20 border-red-500/30',
};

/**
 * PID Power Preview Component
 */
function PidPowerPreview({ powerLevel }) {
  if (powerLevel == null) return null;

  return (
    <div className={`mt-4 p-4 rounded-xl border ${POWER_BG_COLORS[powerLevel]}`}>
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
                  ? 'bg-ember-500 [html:not(.dark)_&]:bg-ember-600'
                  : 'bg-slate-700/50 [html:not(.dark)_&]:bg-slate-300/50'
              }`}
              style={{ height: `${8 + level * 4}px` }}
            />
          ))}
        </div>
        {/* Power value */}
        <Text weight="bold" className={`text-3xl ${POWER_COLORS[powerLevel]}`}>
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

/**
 * Temperature Display Component
 */
function TemperatureDisplay({ room, manualSetpoint, kp, ki, kd }) {
  if (!room) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-white/10">
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
    <div className="p-4 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="secondary" size="sm">Temperatura attuale</Text>
          <Text weight="bold" className="text-2xl text-white [html:not(.dark)_&]:text-slate-900">
            {room.temperature?.toFixed(1) || '--'}°C
          </Text>
        </div>
        <div className="text-right">
          <Text variant="secondary" size="sm">Target PID</Text>
          <Text weight="bold" className="text-2xl text-ember-400 [html:not(.dark)_&]:text-ember-600">
            {targetSetpoint?.toFixed(1) || '--'}°C
          </Text>
        </div>
      </div>
      {room.temperature && targetSetpoint && (
        <div className="mt-3 pt-3 border-t border-white/10">
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

/**
 * Advanced Settings (PID Gains) - Collapsible
 */
function AdvancedSettings({ kp, ki, kd, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white/[0.02] [html:not(.dark)_&]:bg-slate-50/50 hover:bg-white/[0.04] transition-colors"
      >
        <Text weight="semibold" size="sm">
          Impostazioni avanzate (PID)
        </Text>
        <span className="text-slate-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-white/10">
          <Text variant="tertiary" size="xs">
            Modifica i guadagni PID solo se sai cosa stai facendo.
            Valori errati possono causare oscillazioni o instabilita.
          </Text>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">
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
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 [html:not(.dark)_&]:bg-white/80
                           border border-white/10 [html:not(.dark)_&]:border-slate-200
                           text-white [html:not(.dark)_&]:text-slate-900 text-sm
                           focus:ring-2 focus:ring-ember-500/50
                           disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1">
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
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 [html:not(.dark)_&]:bg-white/80
                           border border-white/10 [html:not(.dark)_&]:border-slate-200
                           text-white [html:not(.dark)_&]:text-slate-900 text-sm
                           focus:ring-2 focus:ring-ember-500/50
                           disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1">
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
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 [html:not(.dark)_&]:bg-white/80
                           border border-white/10 [html:not(.dark)_&]:border-slate-200
                           text-white [html:not(.dark)_&]:text-slate-900 text-sm
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

export default function PidAutomationPanel() {
  const { user, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState(null);
  const [manualSetpoint, setManualSetpoint] = useState(20);
  const [kp, setKp] = useState(0.5);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.05);

  // Rooms from Netatmo
  const [rooms, setRooms] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Original config for reset
  const [originalConfig, setOriginalConfig] = useState(null);

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
        console.error('Error loading PID config:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [user, userLoading]);

  // Track changes
  const handleEnabledChange = (value) => {
    setEnabled(value);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleRoomChange = (roomId) => {
    setTargetRoomId(roomId);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSetpointChange = (value) => {
    setManualSetpoint(value);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleGainChange = (gain, value) => {
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
      setError(err.message);
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
  const selectedRoom = rooms.find((r) => String(r.room_id) === String(targetRoomId));

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
        <Heading level={2} size="xl" className="flex items-center gap-2 mb-2">
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
          <Banner variant="danger">{error}</Banner>
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
      <div className="mb-6 p-4 rounded-xl bg-white/[0.05] [html:not(.dark)_&]:bg-white/[0.08] backdrop-blur-xl border border-white/5 [html:not(.dark)_&]:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Text weight="semibold" className="mb-1">
              Abilita automazione PID
            </Text>
            <Text variant="secondary" size="sm">
              Quando attivo, la potenza stufa si regola automaticamente in base alla temperatura
            </Text>
          </div>
          <Toggle
            checked={enabled}
            onChange={handleEnabledChange}
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
          <div className="mb-6 p-4 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-ember-500/30">
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
            variant="neutral"
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
      <div className="mt-6 p-4 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/60">
        <Text variant="secondary" size="sm" weight="semibold" className="mb-2">
          Come funziona
        </Text>
        <ul className="space-y-1 ml-4">
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
