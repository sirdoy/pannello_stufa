'use client';

/**
 * StoveSyncPanel
 *
 * Panel for configuring stove-thermostat interconnection.
 * Allows users to:
 * - Enable/disable stove sync
 * - Select which specific rooms (valves) should be controlled when stove is ON
 * - Set the temperature for synced valves
 *
 * Configuration is stored in Firebase and shared across all users.
 */

import { useState, useEffect } from 'react';
import { Card, Button, Banner, Skeleton, Heading, Text } from '@/app/components/ui';
import Toggle from '@/app/components/ui/Toggle';
import { NETATMO_ROUTES, STOVE_ROUTES } from '@/lib/routes';

interface RoomData {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

interface RoomCheckboxProps {
  room: RoomData;
  selected: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

interface StoveSyncPanelProps {
  onSyncComplete?: () => Promise<void>;
}

/**
 * Room Selection Checkbox Component
 */
function RoomCheckbox({ room, selected, onChange, disabled }: RoomCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-ember-600 [html:not(.dark)_&]:border-ember-400 bg-ember-950/30 [html:not(.dark)_&]:bg-ember-50/50'
          : 'border-slate-600 [html:not(.dark)_&]:border-slate-300 bg-white/[0.02] [html:not(.dark)_&]:bg-slate-50/50 hover:bg-white/[0.05]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 rounded-md border-2 border-slate-500 bg-slate-800 checked:bg-ember-500 checked:border-ember-500 focus:ring-2 focus:ring-ember-500/30 transition-all"
      />
      <div className="flex-1">
        <Text size="sm">
          {room.name}
        </Text>
        <Text variant="tertiary" size="xs">
          {getRoomTypeLabel(room.type)}
        </Text>
      </div>
      <span className="text-lg">{getRoomTypeIcon(room.type)}</span>
    </label>
  );
}

function getRoomTypeIcon(type: string): string {
  const types = {
    livingroom: '🛋️',
    bedroom: '🛏️',
    kitchen: '🍳',
    bathroom: '🚿',
    office: '💼',
    corridor: '🚪',
  };
  return types[type] || '🏠';
}

function getRoomTypeLabel(type: string): string {
  const types = {
    livingroom: 'Soggiorno',
    bedroom: 'Camera',
    kitchen: 'Cucina',
    bathroom: 'Bagno',
    office: 'Ufficio',
    corridor: 'Corridoio',
  };
  return types[type] || 'Personalizzata';
}

export default function StoveSyncPanel({ onSyncComplete }: StoveSyncPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([]);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [stoveTemperature, setStoveTemperature] = useState(16);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.stoveSync);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setConfig(data.config);
      setAvailableRooms(data.availableRooms || []);

      // Initialize form state from config
      setEnabled(data.config?.enabled || false);
      setStoveTemperature(data.config?.stoveTemperature || 16);
      setSelectedRoomIds(data.config?.rooms?.map(r => r.id) || []);

    } catch (err) {
      console.error('Error fetching stove sync config:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  function handleRoomToggle(roomId: string, selected: boolean) {
    const newSelection = selected
      ? [...selectedRoomIds, roomId]
      : selectedRoomIds.filter(id => id !== roomId);

    setSelectedRoomIds(newSelection);
    setHasChanges(true);
    setSuccess(false);
  }

  function handleTemperatureChange(delta: number) {
    const newTemp = Math.max(5, Math.min(30, stoveTemperature + delta));
    setStoveTemperature(newTemp);
    setHasChanges(true);
    setSuccess(false);
  }

  function handleEnabledToggle(value: boolean) {
    setEnabled(value);
    setHasChanges(true);
    setSuccess(false);
  }

  async function handleSave() {
    if (!enabled) {
      // Disable sync
      return handleDisable();
    }

    if (selectedRoomIds.length === 0) {
      setError('Seleziona almeno una stanza da sincronizzare');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const rooms = selectedRoomIds.map(id => {
        const room = availableRooms.find(r => r.id === id);
        return { id: room.id, name: room.name };
      });

      const response = await fetch(NETATMO_ROUTES.stoveSync, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          rooms,
          stoveTemperature,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setConfig(data.config);
      setHasChanges(false);
      setSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      // Refresh parent data to reflect config changes
      if (onSyncComplete) {
        console.log('🔄 Refreshing thermostat data after config save...');
        await onSyncComplete();
      }

    } catch (err) {
      console.error('Error saving stove sync:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.stoveSync, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setConfig(data.config);
      setHasChanges(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);

      // Refresh parent data after disable
      if (onSyncComplete) {
        console.log('🔄 Refreshing thermostat data after disable...');
        await onSyncComplete();
      }

    } catch (err) {
      console.error('Error disabling stove sync:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    // Reset to saved config
    setEnabled(config?.enabled || false);
    setStoveTemperature(config?.stoveTemperature || 16);
    setSelectedRoomIds(config?.rooms?.map(r => r.id) || []);
    setHasChanges(false);
    setSuccess(false);
    setError(null);
  }

  async function handleSyncNow() {
    if (!config?.enabled) {
      setError('Devi prima abilitare e salvare la sincronizzazione');
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      setSyncSuccess(null);

      // Get current stove status
      const statusResponse = await fetch(STOVE_ROUTES.status);
      const statusData = await statusResponse.json();

      if (statusData.error) {
        throw new Error('Impossibile ottenere lo stato della stufa');
      }

      const stoveStatus = statusData.StatusDescription || 'unknown';
      const stoveIsOn = stoveStatus.includes('WORK') || stoveStatus.includes('START');

      // Call sync API
      const syncResponse = await fetch(NETATMO_ROUTES.stoveSync, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          stoveIsOn,
        }),
      });

      const syncData = await syncResponse.json();

      if (syncData.error) {
        throw new Error(syncData.error);
      }

      // Update config with latest state
      setConfig(syncData.config);

      // Show success message
      if (syncData.synced) {
        const action = stoveIsOn ? 'accesa' : 'spenta';
        setSyncSuccess(`✅ Sincronizzazione completata: stufa ${action}, ${syncData.roomNames || 'stanze'} ${stoveIsOn ? `impostate a ${syncData.temperature}°C` : 'tornate alla programmazione'}`);
      } else {
        setSyncSuccess(`ℹ️ Nessun cambiamento necessario: ${syncData.reason || syncData.message}`);
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSyncSuccess(null), 5000);

      // Refresh parent data to show updated setpoints
      // Add small delay to allow Netatmo API to propagate changes
      if (onSyncComplete) {
        console.log('🔄 Refreshing thermostat data after sync (2s delay for API propagation)...');
        setTimeout(async () => {
          await onSyncComplete();
        }, 2000);
      }

    } catch (err) {
      console.error('Error syncing now:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <Skeleton className="h-64" />
      </Card>
    );
  }

  const currentRoomNames = selectedRoomIds
    .map(id => availableRooms.find(r => r.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Card variant="glass" className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Heading level={2} size="xl" className="flex items-center gap-2 mb-2">
          <span>🔥</span>
          <span>Sincronizzazione Stufa-Termostato</span>
        </Heading>
        <Text variant="secondary">
          Controlla automaticamente le valvole quando la stufa è accesa per evitare dispersioni
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

      {/* Sync Success Banner */}
      {syncSuccess && (
        <div className="mb-4">
          <Banner variant="info">
            {syncSuccess}
          </Banner>
        </div>
      )}

      {/* Master Toggle */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.05] [html:not(.dark)_&]:bg-white/[0.08] backdrop-blur-xl border border-white/5 [html:not(.dark)_&]:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Text className="mb-1">
              Abilita sincronizzazione
            </Text>
            <Text variant="secondary" size="sm">
              Quando la stufa è accesa, le valvole selezionate verranno impostate a {stoveTemperature}°C
            </Text>
          </div>
          <Toggle
            checked={enabled}
            onCheckedChange={handleEnabledToggle}
            disabled={saving}
            label="Abilita sincronizzazione"
            size="md"
          />
        </div>
      </div>

      {/* Configuration (only shown when enabled) */}
      {enabled && (
        <>
          {/* Temperature Setting */}
          <div className="mb-6">
            <Text className="mb-3">
              Temperatura valvole quando stufa è accesa
            </Text>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] [html:not(.dark)_&]:bg-white/[0.06] backdrop-blur-sm border border-white/10">
              <Button
                variant="subtle"
                size="sm"
                onClick={() => handleTemperatureChange(-0.5)}
                disabled={saving || stoveTemperature <= 5}
                className="w-12 h-12"
              >
                −
              </Button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-black text-ember-400 [html:not(.dark)_&]:text-ember-600">
                  {stoveTemperature.toFixed(1)}°C
                </span>
              </div>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => handleTemperatureChange(0.5)}
                disabled={saving || stoveTemperature >= 30}
                className="w-12 h-12"
              >
                +
              </Button>
            </div>
            <Text variant="tertiary" size="xs" className="mt-2">
              Temperatura bassa per ridurre il riscaldamento dalle valvole mentre la stufa è attiva
            </Text>
          </div>

          {/* Room Selection */}
          <div className="mb-6">
            <Text className="mb-3">
              Seleziona stanze da sincronizzare ({selectedRoomIds.length} selezionate)
            </Text>
            {availableRooms.length === 0 ? (
              <Banner variant="warning">
                Nessuna stanza disponibile. Verifica la connessione Netatmo.
              </Banner>
            ) : (
              <div className="space-y-2">
                {availableRooms.map(room => (
                  <RoomCheckbox
                    key={room.id}
                    room={room}
                    selected={selectedRoomIds.includes(room.id)}
                    onChange={(selected) => handleRoomToggle(room.id, selected)}
                    disabled={saving}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Current Configuration Summary */}
      {config?.enabled && (
        <div className="mb-6 p-4 rounded-xl bg-ocean-900/10 [html:not(.dark)_&]:bg-ocean-50/50 border border-ocean-700/30 [html:not(.dark)_&]:border-ocean-200">
          <Text variant="tertiary" size="sm" className="mb-2">
            ℹ️ Configurazione attuale
          </Text>
          <ul className="space-y-1">
            <li>
              <Text variant="tertiary" size="sm">
                • Sincronizzazione: <strong>{config.enabled ? 'Attiva' : 'Disattiva'}</strong>
              </Text>
            </li>
            {config.enabled && config.rooms && (
              <>
                <li>
                  <Text variant="tertiary" size="sm">
                    • Stanze: <strong>{config.rooms.map(r => r.name).join(', ')}</strong>
                  </Text>
                </li>
                <li>
                  <Text variant="tertiary" size="sm">
                    • Temperatura stufa ON: <strong>{config.stoveTemperature}°C</strong>
                  </Text>
                </li>
                {config.stoveMode && (
                  <li>
                    <Text variant="warning" size="sm">
                      • Stato attuale: <strong>Stufa ON - valvole in modalità stufa</strong>
                    </Text>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
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
            disabled={saving || (enabled && selectedRoomIds.length === 0)}
            className="flex-1"
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      )}

      {/* Sync Now Button - only show when enabled and no pending changes */}
      {config?.enabled && !hasChanges && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleSyncNow}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? '⏳ Sincronizzazione in corso...' : '🔄 Sincronizza Ora'}
          </Button>
          <Text variant="tertiary" size="xs" className="mt-2 text-center">
            Forza la sincronizzazione immediata senza aspettare il cronjob
          </Text>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 p-4 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/60">
        <Text variant="secondary" size="sm" className="mb-2">
          💡 Come funziona
        </Text>
        <ul className="space-y-1 ml-4">
          <li>
            <Text variant="tertiary" size="xs">
              • Quando la stufa si accende, le valvole selezionate vengono impostate a {stoveTemperature}°C
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              • Quando la stufa si spegne, le valvole tornano alla programmazione normale
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              • La configurazione è condivisa tra tutti gli utenti connessi
            </Text>
          </li>
          <li>
            <Text variant="tertiary" size="xs">
              • Il setpoint viene verificato ogni 5 minuti per gestire la scadenza (8 ore)
            </Text>
          </li>
        </ul>
      </div>
    </Card>
  );
}
