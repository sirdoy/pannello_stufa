'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  HouseStatusResponse,
  RoomsHealthResponse,
  DeviceStatus,
  LightStatus,
  SensorStatus,
  ThermostatStatus,
  SpeakerStatus,
  StoveStatus,
  CameraStatus,
  HostStatus,
  PlugStatus,
} from '@/types/rooms';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';
import { Text, Heading } from '@/app/components/ui';

// --- useHouseStatus hook (per D-18, D-21) ---
function useHouseStatus() {
  const [houseStatus, setHouseStatus] = useState<HouseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms/house/status');
      if (!res.ok) throw new Error('Errore nel caricamento dello stato');
      setHouseStatus((await res.json()) as HouseStatusResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { houseStatus, loading, error, refetch };
}

/** Rooms health, or null on failure (silently ignored) */
async function fetchRoomsHealth(): Promise<RoomsHealthResponse | null> {
  try {
    const res = await fetch('/api/rooms/health');
    if (!res.ok) return null;
    return (await res.json()) as RoomsHealthResponse;
  } catch {
    return null;
  }
}

// --- useRoomsHealth hook (per D-19 — copy from rooms/page.tsx) ---
function useRoomsHealth() {
  const [health, setHealth] = useState<RoomsHealthResponse | null>(null);

  const refetch = useCallback(async () => {
    const data = await fetchRoomsHealth();
    if (data) setHealth(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchRoomsHealth().then((data) => {
      if (data && !cancelled) setHealth(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { health, refetch };
}

// --- getProviderBadgeVariant helper (per D-14 — copy from rooms/[room_id]/page.tsx) ---
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral';
}

// --- renderDeviceData helper (per D-16, D-17) ---
function renderDeviceData(device: DeviceStatus): string | null {
  if (!device.data) return null;
  // Provider-specific payloads whose registry type is free-form (backend M26)
  if (device.provider_name === 'tuya') {
    const d = device.data as PlugStatus;
    const parts = [d.switch_on ? 'Accesa' : 'Spenta'];
    if (d.power_w !== null) parts.push(`${d.power_w} W`);
    if (d.energy_kwh !== null) parts.push(`${d.energy_kwh} kWh`);
    return parts.join(' · ');
  }
  if (device.provider_name === 'raspi') {
    const d = device.data as HostStatus;
    const parts: string[] = [];
    if (d.cpu_percent !== null) parts.push(`CPU ${d.cpu_percent}%`);
    if (d.cpu_temperature !== null) parts.push(`${d.cpu_temperature.toFixed(1)}°C`);
    if (d.memory_percent !== null) parts.push(`RAM ${d.memory_percent}%`);
    return parts.join(' · ') || null;
  }
  switch (device.device_type) {
    case 'light': {
      const d = device.data as LightStatus;
      const parts = [d.on ? 'Accesa' : 'Spenta'];
      if (d.brightness !== null) parts.push(`${d.brightness} luminosita`);
      return parts.join(' · ');
    }
    case 'sensor': {
      const d = device.data as SensorStatus;
      const parts: string[] = [];
      if (d.temperature !== null) parts.push(`${d.temperature}°C`);
      if (d.humidity !== null) parts.push(`${d.humidity}% umidita`);
      return parts.join(' · ') || null;
    }
    case 'thermostat': {
      const d = device.data as ThermostatStatus;
      const parts: string[] = [];
      if (d.measured_temp !== null) parts.push(`${d.measured_temp}°C`);
      if (d.setpoint_temp !== null) parts.push(`${d.setpoint_temp}°C setpoint`);
      if (d.heating !== null) parts.push(d.heating ? 'In riscaldamento' : 'Non riscaldante');
      return parts.join(' · ') || null;
    }
    case 'speaker': {
      const d = device.data as SpeakerStatus;
      const parts = [d.playing ? 'In riproduzione' : 'Fermo'];
      if (d.volume !== null) parts.push(`Vol ${d.volume}%`);
      return parts.join(' · ');
    }
    case 'stove': {
      const d = device.data as StoveStatus;
      const parts = [d.active ? 'Attiva' : 'Spenta'];
      if (d.temperature !== null) parts.push(`${d.temperature}°C`);
      if (d.power_level !== null) parts.push(`P${d.power_level}`);
      return parts.join(' · ');
    }
    case 'camera': {
      const d = device.data as CameraStatus;
      return d.is_reachable ? 'Raggiungibile' : 'Non raggiungibile';
    }
    default:
      return null;
  }
}

// --- RoomStatusPage component ---
export default function RoomStatusPage() {
  const router = useRouter();
  const { houseStatus, loading, error, refetch } = useHouseStatus();
  const { health, refetch: healthRefetch } = useRoomsHealth();

  const handleRefresh = () => {
    void refetch();
    void healthRefetch();
  };

  const sortedRooms =
    houseStatus !== null
      ? [...houseStatus.rooms].sort((a, b) => a.room_name.localeCompare(b.room_name, 'it'))
      : [];

  return (
    <SettingsLayout title="Stato stanze" backHref="/rooms">
      <Text variant="secondary">Stato aggregato di tutti i dispositivi per stanza</Text>

      <Card variant="glass" className="p-4 sm:p-6">
        {/* Stats row: house summary + health stats (per D-06, D-07, D-08) */}
        {(houseStatus !== null || health !== null) && (
          <Text as="div" variant="secondary" size="sm" className="mb-4 flex flex-wrap items-center gap-4 sm:gap-6">
            {houseStatus !== null && (
              <>
                <span>
                  Totale: <Text as="strong" size="sm">{houseStatus.total_devices}</Text>
                </span>
                <span>
                  Disponibili:{' '}
                  <Text as="strong" size="sm">{houseStatus.total_available}</Text>
                </span>
                <span>
                  Non disponibili:{' '}
                  <Text as="strong" size="sm">{houseStatus.total_unavailable}</Text>
                </span>
              </>
            )}
            {health !== null && (
              <>
                <span>
                  Stanze: <Text as="strong" size="sm">{health.room_count}</Text>
                </span>
                <span>
                  Assegnati: <Text as="strong" size="sm">{health.total_device_count}</Text>
                </span>
                <span>
                  Orfani: <Text as="strong" size="sm">{health.orphan_device_count}</Text>
                </span>
              </>
            )}
          </Text>
        )}

        {/* Toolbar: Aggiorna button (per D-20) */}
        <div className="mb-4 flex items-center justify-end">
          <Button variant="ember" size="sm" onClick={handleRefresh}>
            Aggiorna
          </Button>
        </div>

        {/* Loading state (per D-22) */}
        {loading && <Skeleton className="h-48 w-full" />}

        {/* Error state (per D-23) */}
        {!loading && error && <Banner variant="error">{error}</Banner>}

        {/* Empty state (per D-24) */}
        {!loading && !error && houseStatus !== null && houseStatus.rooms.length === 0 && (
          <EmptyState
            description="Nessuna stanza configurata"
            action={
              <Button variant="ember" size="sm" onClick={() => router.push('/rooms')}>
                Vai alle stanze
              </Button>
            }
          />
        )}

        {/* Room cards grid (per D-09) */}
        {!loading && !error && houseStatus !== null && houseStatus.rooms.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sortedRooms.map((room) => (
              <Card key={room.room_id} variant="glass">
                {/* Room header (per D-10) */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Heading>{room.room_name}</Heading>
                  <Badge variant="sage" size="sm">
                    {room.available_count} disponibili
                  </Badge>
                  <Badge variant="ember" size="sm">
                    {room.unavailable_count} non disp.
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {room.device_count} tot.
                  </Badge>
                </div>

                {/* Empty room state (per D-25) */}
                {room.devices.length === 0 && (
                  <Text variant="secondary" size="sm" className="py-2">Nessun dispositivo assegnato</Text>
                )}

                {/* Device rows (per D-12) */}
                {room.devices.length > 0 && (
                  <div className="space-y-2">
                    {room.devices.map((device) => {
                      const deviceData = renderDeviceData(device);
                      return (
                        <div key={device.device_registry_id} className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Device name */}
                            <Text as="span" size="sm">{device.custom_name}</Text>
                            {/* Provider badge (per D-14) */}
                            <Badge variant={getProviderBadgeVariant(device.provider_name)} size="sm">
                              {device.provider_name}
                            </Badge>
                            {/* Device type mono (per D-15) */}
                            <Text as="code" variant="secondary" size="sm" mono>{device.device_type}</Text>
                            {/* Status badge (per D-13) */}
                            {device.status === 'available' ? (
                              <Badge variant="sage" size="sm">
                                Disponibile
                              </Badge>
                            ) : (
                              <Badge variant="ember" size="sm">
                                Non disponibile
                              </Badge>
                            )}
                          </div>
                          {/* Provider-specific data (per D-16) */}
                          {deviceData !== null && (
                            <Text as="span" variant="secondary" size="xs" className="ml-1">{deviceData}</Text>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </SettingsLayout>
  );
}
