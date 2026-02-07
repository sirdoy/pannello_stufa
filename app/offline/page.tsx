'use client';

import { useState, useEffect } from 'react';
import { Card, Heading, Text, Button, Banner, StatusBadge } from '@/app/components/ui';
import {
  getCachedState,
  formatStoveStateForDisplay,
  formatThermostatStateForDisplay,
  getCacheAge,
  DEVICE_IDS,
} from '@/lib/pwa/offlineStateCache';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';

/**
 * Enhanced Offline Page
 *
 * Shows cached device states when offline instead of a generic message.
 * Features:
 * - Last known stove state (temperature, status, power)
 * - Last known thermostat state (temperature, setpoint)
 * - Pending command queue status
 * - Automatic reconnection notification
 */
interface FormattedStoveState {
  cachedAt: Date;
  isStale: boolean;
  ageMinutes: number;
  isOn: boolean;
  temperature: number | null;
  setpoint: number | null;
  exhaustTemp: number | null;
  powerLevel: number | null;
  needsCleaning: boolean;
}

interface FormattedThermostatState {
  cachedAt: Date;
  isStale: boolean;
  ageMinutes: number;
  temperature: number | null;
  setpoint: number | null;
  humidity: number | null;
  roomName: string | null;
  mode: string | null;
  isHeating: boolean;
}

export default function OfflinePage() {
  const [stoveState, setStoveState] = useState<FormattedStoveState | null>(null);
  const [thermostatState, setThermostatState] = useState<FormattedThermostatState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { isOnline, wasOffline } = useOnlineStatus();
  const { pendingCommands, hasPendingCommands } = useBackgroundSync();

  // Load cached states
  useEffect(() => {
    async function loadCachedStates(): Promise<void> {
      try {
        const [stoveCached, thermostatCached] = await Promise.all([
          getCachedState(DEVICE_IDS.STOVE),
          getCachedState(DEVICE_IDS.THERMOSTAT),
        ]);

        if (stoveCached) {
          setStoveState(formatStoveStateForDisplay(stoveCached));
        }
        if (thermostatCached) {
          setThermostatState(formatThermostatStateForDisplay(thermostatCached));
        }
      } catch (error) {
        console.error('[OfflinePage] Failed to load cached states:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCachedStates();
  }, []);

  // Redirect to home when back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // If back online, show reconnecting message
  if (isOnline) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="p-8 text-center">
          <Text className="text-6xl mb-4">🌐</Text>
          <Heading level={1} size="2xl" className="mb-4">
            Connessione ripristinata
          </Heading>
          <Text variant="tertiary" className="mb-6">
            Reindirizzamento alla home...
          </Text>
          <div className="animate-pulse">
            <div className="h-2 bg-ember-500/30 rounded-full w-48 mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  const hasCachedData = stoveState || thermostatState;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Offline Banner */}
      <Banner
        variant="warning"
        icon="📡"
        title="Connessione assente"
        description="Stai visualizzando dati memorizzati nella cache. L'app si riconnetterà automaticamente."
        compact
      />

      {/* Pending Commands */}
      {hasPendingCommands && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Text className="text-2xl">⏳</Text>
            <div className="flex-1">
              <Heading level={3} size="sm" className="mb-1">
                Comandi in attesa
              </Heading>
              <Text variant="tertiary" size="sm">
                {pendingCommands.length} {pendingCommands.length === 1 ? 'comando' : 'comandi'} in coda.
                {' '}Verranno eseguiti al ripristino della connessione.
              </Text>
            </div>
          </div>

          {/* Command List */}
          <div className="mt-3 space-y-2">
            {pendingCommands.slice(0, 3).map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 dark:bg-white/[0.02]"
              >
                <Text>{cmd.icon}</Text>
                <Text size="sm" className="flex-1">{cmd.label}</Text>
                <Text variant="tertiary" size="xs">{cmd.formattedTime}</Text>
              </div>
            ))}
            {pendingCommands.length > 3 && (
              <Text variant="tertiary" size="xs" className="text-center">
                +{pendingCommands.length - 3} altri comandi
              </Text>
            )}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
          </div>
        </Card>
      )}

      {/* No Cached Data */}
      {!loading && !hasCachedData && (
        <Card className="p-8 text-center">
          <Text className="text-6xl mb-4">📦</Text>
          <Heading level={2} size="xl" className="mb-4">
            Nessun dato memorizzato
          </Heading>
          <Text variant="tertiary" className="mb-6">
            Non sono disponibili dati offline. Connettiti a Internet per visualizzare lo stato dei dispositivi.
          </Text>
          <Button
            variant="ember"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Riprova
          </Button>
        </Card>
      )}

      {/* Cached Stove State */}
      {!loading && stoveState && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Text className="text-3xl">🔥</Text>
              <div>
                <Heading level={2} size="lg">Stufa</Heading>
                <Text variant="tertiary" size="xs">
                  {getCacheAge(stoveState.cachedAt.toISOString())}
                  {stoveState.isStale && ' (dati non recenti)'}
                </Text>
              </div>
            </div>
            <StatusBadge
              status={stoveState.isOn ? 'success' : 'neutral'}
              label={stoveState.isOn ? 'Accesa' : 'Spenta'}
            />
          </div>

          {/* Temperature Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Room Temperature */}
            <div className="text-center p-3 rounded-lg bg-white/5 dark:bg-white/[0.02]">
              <Text variant="tertiary" size="xs" className="mb-1 block">
                Ambiente
              </Text>
              <Text size="xl" className="text-ember-500 dark:text-ember-400">
                {stoveState.temperature != null
                  ? `${stoveState.temperature}°`
                  : '--'}
              </Text>
            </div>

            {/* Setpoint */}
            <div className="text-center p-3 rounded-lg bg-white/5 dark:bg-white/[0.02]">
              <Text variant="tertiary" size="xs" className="mb-1 block">
                Target
              </Text>
              <Text size="xl">
                {stoveState.setpoint != null
                  ? `${stoveState.setpoint}°`
                  : '--'}
              </Text>
            </div>

            {/* Exhaust Temperature */}
            <div className="text-center p-3 rounded-lg bg-white/5 dark:bg-white/[0.02]">
              <Text variant="tertiary" size="xs" className="mb-1 block">
                Fumi
              </Text>
              <Text size="xl">
                {stoveState.exhaustTemp != null
                  ? `${stoveState.exhaustTemp}°`
                  : '--'}
              </Text>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 flex items-center gap-4">
            {stoveState.powerLevel != null && (
              <div className="flex items-center gap-2">
                <Text variant="tertiary" size="sm">Potenza:</Text>
                <Text size="sm">{stoveState.powerLevel}</Text>
              </div>
            )}
            {stoveState.needsCleaning && (
              <StatusBadge status="warning">Pulizia richiesta</StatusBadge>
            )}
          </div>

          {/* Stale Data Warning */}
          {stoveState.isStale && (
            <div className="mt-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Text size="xs" className="text-amber-600 dark:text-amber-400">
                ⚠️ Dati memorizzati {stoveState.ageMinutes} minuti fa.
                Lo stato attuale potrebbe essere diverso.
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Cached Thermostat State */}
      {!loading && thermostatState && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Text className="text-3xl">🌡️</Text>
              <div>
                <Heading level={2} size="lg">Termostato</Heading>
                <Text variant="tertiary" size="xs">
                  {getCacheAge(thermostatState.cachedAt.toISOString())}
                </Text>
              </div>
            </div>
            {thermostatState.isHeating && (
              <StatusBadge status="warning">Riscaldamento</StatusBadge>
            )}
          </div>

          {/* Temperature Display */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Temperature */}
            <div className="text-center p-4 rounded-lg bg-white/5 dark:bg-white/[0.02]">
              <Text variant="tertiary" size="xs" className="mb-1 block">
                {thermostatState.roomName || 'Temperatura'}
              </Text>
              <Text size="xl" className="text-ocean-500 dark:text-ocean-400">
                {thermostatState.temperature != null
                  ? `${thermostatState.temperature.toFixed(1)}°`
                  : '--'}
              </Text>
              {thermostatState.humidity != null && (
                <Text variant="tertiary" size="xs" className="mt-1 block">
                  💧 {thermostatState.humidity}%
                </Text>
              )}
            </div>

            {/* Setpoint */}
            <div className="text-center p-4 rounded-lg bg-white/5 dark:bg-white/[0.02]">
              <Text variant="tertiary" size="xs" className="mb-1 block">
                Target
              </Text>
              <Text size="xl">
                {thermostatState.setpoint != null
                  ? `${thermostatState.setpoint}°`
                  : '--'}
              </Text>
              {thermostatState.mode && (
                <Text variant="tertiary" size="xs" className="mt-1 block">
                  Modo: {thermostatState.mode}
                </Text>
              )}
            </div>
          </div>

          {/* Stale Data Warning */}
          {thermostatState.isStale && (
            <div className="mt-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Text size="xs" className="text-amber-600 dark:text-amber-400">
                ⚠️ Dati memorizzati {thermostatState.ageMinutes} minuti fa.
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Footer Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Text className="text-xl">💡</Text>
          <Text variant="tertiary" size="sm">
            I dati vengono aggiornati automaticamente quando sei online.
            I comandi in coda verranno eseguiti al ripristino della connessione.
          </Text>
        </div>
      </Card>

      {/* Retry Button */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Riprova connessione
        </Button>
      </div>
    </div>
  );
}
