'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Room, RoomsHealthResponse } from '@/types/rooms';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

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
  const { rooms, loading, error, refetch } = useRooms();
  const { health, refetch: healthRefetch } = useRoomsHealth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Pre-declared state vars for Plan 02 compatibility
  const [showCreate, setShowCreate] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

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

        {/* Toolbar: create button (per D-08) */}
        <div className="flex items-center justify-end mb-4">
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

      {/* Plan 02: FormModal and ConfirmationDialog will be added here */}
    </SettingsLayout>
  );
}
