'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import type { Room } from '@/types/rooms';
import type { RegistryDevice } from '@/types/registry';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- useRoom hook ---
function useRoom(roomId: number) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Stanza non trovata');
      setRoom((await res.json()) as Room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { room, loading, error };
}

// --- useRoomDevices hook ---
function useRoomDevices(roomId: number) {
  const [devices, setDevices] = useState<RegistryDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/devices`);
      if (!res.ok) throw new Error('Errore nel caricamento dei dispositivi');
      const data = (await res.json()) as RegistryDevice[];
      setDevices([...data].sort((a, b) => a.custom_name.localeCompare(b.custom_name, 'it')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { devices, loading, error, refetch };
}

// --- Provider badge variant helper (per D-09) ---
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral';
}

// --- RoomDetailPage component ---
export default function RoomDetailPage() {
  const params = useParams();
  const roomId = Number(params['room_id'] as string);

  const roomData = useRoom(roomId);
  const devicesData = useRoomDevices(roomId);
  const { success: toastSuccess, error: toastError } = useToast();

  // State for Plan 02 compatibility
  const [showAssign, setShowAssign] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState<RegistryDevice | null>(null);

  const { room } = roomData;
  const { devices } = devicesData;

  // Silence unused variable warnings — these will be used in Plan 02
  void toastSuccess;
  void toastError;
  void deviceToRemove;

  const isLoading = roomData.loading || devicesData.loading;

  const columns: ColumnDef<RegistryDevice>[] = [
    {
      accessorKey: 'custom_name',
      header: 'Dispositivo',
      enableSorting: true,
    },
    {
      accessorKey: 'provider_name',
      header: 'Provider',
      cell: ({ row }) => (
        <Badge variant={getProviderBadgeVariant(row.original.provider_name)} size="sm">
          {row.original.provider_name}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'device_type_slug',
      header: 'Tipo',
      cell: ({ row }) => (
        <code className="text-sm font-mono text-slate-400">{row.original.device_type_slug}</code>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="danger" size="sm" onClick={() => setDeviceToRemove(row.original)}>
          Rimuovi
        </Button>
      ),
      enableSorting: false,
    },
  ];

  return (
    <SettingsLayout title={room?.name ?? 'Caricamento...'} backHref="/rooms">
      {room && (
        <Text variant="secondary">{room.description ?? ''}</Text>
      )}

      <Card variant="glass" className="p-4 sm:p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-end mb-4">
          <Button variant="ember" size="sm" onClick={() => setShowAssign(true)}>
            Assegna dispositivo
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && <Skeleton className="h-48 w-full" />}

        {/* Room error */}
        {!isLoading && roomData.error && (
          <Banner variant="error">{roomData.error}</Banner>
        )}

        {/* Devices error */}
        {!isLoading && !roomData.error && devicesData.error && (
          <Banner variant="error">{devicesData.error}</Banner>
        )}

        {/* Empty state */}
        {!isLoading && !roomData.error && !devicesData.error && devices.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>Nessun dispositivo assegnato</p>
            <Button variant="ember" size="sm" className="mt-4" onClick={() => setShowAssign(true)}>
              Assegna dispositivo
            </Button>
          </div>
        )}

        {/* Device list */}
        {!isLoading && !roomData.error && !devicesData.error && devices.length > 0 && (
          <DataTable data={devices} columns={columns} />
        )}
      </Card>
    </SettingsLayout>
  );
}
