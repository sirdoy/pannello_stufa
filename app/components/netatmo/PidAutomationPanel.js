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
          <option key={room.id} value={room.id}>
            {room.name} ({room.temperature?.toFixed(1) || '--'}°C)
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Temperature Display Component
 */
function TemperatureDisplay({ room }) {
  if (!room) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-white/10">
        <Text variant="tertiary" size="sm">
          Seleziona una stanza per vedere la temperatura
        </Text>
      </div>
    );
  }

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
          <Text variant="secondary" size="sm">Setpoint termostato</Text>
          <Text weight="bold" className="text-2xl text-ember-400 [html:not(.dark)_&]:text-ember-600">
            {room.setpoint?.toFixed(1) || '--'}°C
          </Text>
        </div>
      </div>
      {room.temperature && room.setpoint && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <Text variant="tertiary" size="xs">
            Differenza: {(room.setpoint - room.temperature).toFixed(1)}°C
            {room.temperature < room.setpoint
              ? ' (sotto target - aumenta potenza)'
              : room.temperature > room.setpoint
                ? ' (sopra target - diminuisce potenza)'
                : ' (a target)'}
          </Text>
        </div>
      )}
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
      setKp(originalConfig.kp ?? 0.5);
      setKi(originalConfig.ki ?? 0.1);
      setKd(originalConfig.kd ?? 0.05);
      setHasChanges(false);
      setError(null);
    }
  };

  // Get selected room for temperature display
  const selectedRoom = rooms.find((r) => String(r.id) === String(targetRoomId));

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
          Devi essere autenticato per configurare l'automazione PID.
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

          {/* Temperature Display */}
          <div className="mb-6">
            <TemperatureDisplay room={selectedRoom} />
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
              - Confronta con il setpoint del termostato
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - Regola la potenza stufa (1-5) per raggiungere il target
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              - L'algoritmo PID evita oscillazioni eccessive
            </Text>
          </li>
        </ul>
      </div>
    </Card>
  );
}
