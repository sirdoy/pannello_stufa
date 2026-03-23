'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { Room, DeviceAssignment } from '@/types/rooms';
import type { RegistryDevice } from '@/types/registry';
import type { PaginatedResponse } from '@/types/common';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import FormModal from '@/app/components/ui/FormModal';
import Select from '@/app/components/ui/Select';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- Zod schema for assign form ---
const assignSchema = z.object({
  device_registry_id: z.number().int().positive('Seleziona un dispositivo'),
});
type AssignFormData = z.infer<typeof assignSchema>;

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

// --- useRegistryDevicesForSelect hook ---
function useRegistryDevicesForSelect() {
  const [allDevices, setAllDevices] = useState<RegistryDevice[]>([]);
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/registry/devices?limit=1000');
      if (!res.ok) return;
      const data = (await res.json()) as PaginatedResponse<RegistryDevice>;
      setAllDevices(data.items);
    } catch { /* non-critical */ }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { allDevices, refetch };
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
  const { allDevices, refetch: refetchAllDevices } = useRegistryDevicesForSelect();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showAssign, setShowAssign] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState<RegistryDevice | null>(null);

  const { room } = roomData;
  const { devices, refetch } = devicesData;

  const isLoading = roomData.loading || devicesData.loading;

  // Compute Select options: filter out already-assigned devices, sort by Italian locale
  const assignedIds = new Set(devices.map((d) => d.id));
  const selectOptions = allDevices
    .filter((d) => !assignedIds.has(d.id))
    .sort((a, b) => a.custom_name.localeCompare(b.custom_name, 'it'))
    .map((d) => ({ value: d.id, label: `${d.custom_name} (${d.provider_name})` }));

  const handleAssign = async (data: AssignFormData) => {
    const res = await fetch(`/api/rooms/${roomId}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_registry_id: data.device_registry_id }),
    });
    if (res.status === 404) {
      toastError('Dispositivo o stanza non trovata');
      setShowAssign(false);
      await refetch();
      await refetchAllDevices();
      return; // do NOT throw — modal should close per D-16
    }
    if (!res.ok) throw new Error("Errore durante l'assegnazione");
    const assignment = (await res.json()) as DeviceAssignment;
    const msg = assignment.previous_room_id !== null
      ? 'Dispositivo assegnato (spostato da altra stanza)'
      : 'Dispositivo assegnato';
    toastSuccess(msg);
    setShowAssign(false);
    await refetch();
    await refetchAllDevices();
  };

  const handleRemove = async () => {
    if (!deviceToRemove) return;
    const res = await fetch(`/api/rooms/${roomId}/devices/${deviceToRemove.id}`, {
      method: 'DELETE',
    });
    if (res.status === 404) {
      toastError('Dispositivo gia rimosso');
      setDeviceToRemove(null);
      await refetch();
      await refetchAllDevices();
      return;
    }
    if (!res.ok) {
      toastError('Errore durante la rimozione');
      setDeviceToRemove(null);
      return;
    }
    toastSuccess('Dispositivo rimosso dalla stanza');
    setDeviceToRemove(null);
    await refetch();
    await refetchAllDevices();
  };

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

      <FormModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onSubmit={handleAssign}
        title="Assegna dispositivo"
        defaultValues={{ device_registry_id: 0 }}
        validationSchema={assignSchema}
        submitLabel="Assegna"
        cancelLabel="Annulla"
      >
        {({ control }: { control: Control<AssignFormData> }) => (
          <Controller
            name="device_registry_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Dispositivo"
                placeholder="Seleziona un dispositivo..."
                options={selectOptions}
                value={field.value || undefined}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        )}
      </FormModal>

      <ConfirmationDialog
        isOpen={deviceToRemove !== null}
        onClose={() => setDeviceToRemove(null)}
        onConfirm={handleRemove}
        title="Rimuovi dispositivo"
        description={`Rimuovere "${deviceToRemove?.custom_name}" (${deviceToRemove?.provider_name}) dalla stanza?`}
        confirmLabel="Rimuovi"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
