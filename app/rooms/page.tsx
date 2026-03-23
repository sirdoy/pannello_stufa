'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Controller, type Control } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { Room, RoomsHealthResponse } from '@/types/rooms';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// Zod schema for room form (per D-10)
const roomSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
  description: z.string().max(500, 'Max 500 caratteri').nullable().optional(),
});
type RoomFormData = z.infer<typeof roomSchema>;

// --- useRooms hook (per D-23 through D-26) ---
function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) {
        throw new Error('Errore nel caricamento delle stanze');
      }
      const data: Room[] = await res.json();
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, 'it'));
      setRooms(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rooms, loading, error, refetch };
}

// --- useRoomsHealth hook (per D-27 through D-29) ---
function useRoomsHealth() {
  const [health, setHealth] = useState<RoomsHealthResponse | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms/health');
      if (!res.ok) return;
      const data: RoomsHealthResponse = await res.json();
      setHealth(data);
    } catch {
      // silently ignore health fetch errors
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { health, refetch };
}

// --- RoomsPage component ---
export default function RoomsPage() {
  const router = useRouter();
  const { rooms, loading, error, refetch } = useRooms();
  const { health, refetch: healthRefetch } = useRoomsHealth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Pre-declared state vars for Plan 02 compatibility
  const [showCreate, setShowCreate] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // --- Mutation handlers ---

  const handleCreate = async (data: RoomFormData) => {
    const apiBody = {
      name: data.name,
      description: data.description?.trim() || null,
    };
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody),
    });
    if (res.status === 409) throw new Error('Stanza con questo nome gia esistente');
    if (!res.ok) throw new Error('Errore durante la creazione');
    toastSuccess('Stanza creata');
    setShowCreate(false);
    await refetch();
    await healthRefetch();
  };

  const handleEdit = async (data: RoomFormData) => {
    if (!roomToEdit) return;
    const apiBody = {
      name: data.name,
      description: data.description?.trim() || null,
    };
    const res = await fetch(`/api/rooms/${roomToEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody),
    });
    if (res.status === 409) throw new Error('Stanza con questo nome gia esistente');
    if (res.status === 404) {
      toastError('Stanza non trovata');
      setRoomToEdit(null);
      await refetch();
      return;
    }
    if (!res.ok) throw new Error('Errore durante la modifica');
    toastSuccess('Stanza aggiornata');
    setRoomToEdit(null);
    await refetch();
    await healthRefetch();
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: 'DELETE' });
    if (res.status === 404) {
      toastError('Stanza gia eliminata');
      setRoomToDelete(null);
      await refetch();
      await healthRefetch();
      return;
    }
    if (!res.ok) {
      toastError("Errore durante l'eliminazione");
      setRoomToDelete(null);
      return;
    }
    toastSuccess('Stanza eliminata');
    setRoomToDelete(null);
    await refetch();
    await healthRefetch();
  };

  // --- Column definitions (per D-04, D-07) ---
  const columns: ColumnDef<Room>[] = [
    { accessorKey: 'name', header: 'Nome', enableSorting: true },
    {
      accessorKey: 'description',
      header: 'Descrizione',
      cell: ({ row }) => (
        <span className="text-slate-400 truncate max-w-xs block">
          {row.original.description ?? '\u2014'}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'device_count',
      header: 'Dispositivi',
      cell: ({ row }) => {
        const count = row.original.device_count ?? 0;
        return (
          <Badge variant="neutral" size="sm">
            {count} {count === 1 ? 'dispositivo' : 'dispositivi'}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'created_at',
      header: 'Creata',
      cell: ({ row }) =>
        new Date(row.original.created_at * 1000).toLocaleDateString('it-IT'),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/rooms/${row.original.id}`)}>
            Dispositivi
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRoomToEdit(row.original)}>
            Modifica
          </Button>
          <Button variant="danger" size="sm" onClick={() => setRoomToDelete(row.original)}>
            Elimina
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <SettingsLayout title="Stanze" backHref="/registry/devices">
      <Text variant="secondary">Gestisci le stanze del sistema</Text>

      <Card variant="glass" className="p-4 sm:p-6">
        {/* Health stats inline (per D-27) */}
        {health !== null && (
          <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
            <span>
              Stanze: <strong className="text-slate-200">{health.room_count}</strong>
            </span>
            <span>
              Dispositivi assegnati:{' '}
              <strong className="text-slate-200">{health.total_device_count}</strong>
            </span>
            <span>
              Orfani: <strong className="text-slate-200">{health.orphan_device_count}</strong>
            </span>
          </div>
        )}

        {/* Toolbar: stato + create buttons (per D-08, D-05) */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/rooms/status')}>
            Stato
          </Button>
          <Button variant="ember" size="sm" onClick={() => setShowCreate(true)}>
            Crea stanza
          </Button>
        </div>

        {/* Loading state */}
        {loading && <Skeleton className="h-48 w-full" />}

        {/* Error state */}
        {!loading && error && <Banner variant="error">{error}</Banner>}

        {/* Empty state */}
        {!loading && !error && rooms.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>Nessuna stanza creata</p>
            <Button
              variant="ember"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              Crea stanza
            </Button>
          </div>
        )}

        {/* Room list */}
        {!loading && !error && rooms.length > 0 && (
          <DataTable data={rooms} columns={columns} />
        )}
      </Card>

      {/* Create FormModal (per D-08, D-09) */}
      <FormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        title="Crea stanza"
        defaultValues={{ name: '', description: '' }}
        validationSchema={roomSchema}
        submitLabel="Crea"
        cancelLabel="Annulla"
      >
        {({ control }: { control: Control<RoomFormData> }) => (
          <>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Input label="Nome" error={fieldState.error?.message} {...field} />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Descrizione"
                  error={fieldState.error?.message}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </>
        )}
      </FormModal>

      {/* Edit FormModal (per D-13, D-14 — key prop for remount per Pitfall 3) */}
      <FormModal
        key={roomToEdit?.id ?? 'new'}
        isOpen={roomToEdit !== null}
        onClose={() => setRoomToEdit(null)}
        onSubmit={handleEdit}
        title="Modifica stanza"
        defaultValues={
          roomToEdit
            ? { name: roomToEdit.name, description: roomToEdit.description ?? '' }
            : { name: '', description: '' }
        }
        validationSchema={roomSchema}
        submitLabel="Salva"
        cancelLabel="Annulla"
      >
        {({ control }: { control: Control<RoomFormData> }) => (
          <>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Input label="Nome" error={fieldState.error?.message} {...field} />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Descrizione"
                  error={fieldState.error?.message}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </>
        )}
      </FormModal>

      {/* Delete ConfirmationDialog (per D-18, D-19) */}
      <ConfirmationDialog
        isOpen={roomToDelete !== null}
        onClose={() => setRoomToDelete(null)}
        onConfirm={handleDelete}
        title="Elimina stanza"
        description={`Eliminare "${roomToDelete?.name}" (${roomToDelete?.device_count ?? 0} dispositivi)?`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
