'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import type { DeviceType, DeviceTypeCreate } from '@/types/registry';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import { Heading, Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- Zod schema for device type creation (per D-09, D-10) ---
const deviceTypeSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug obbligatorio')
    .max(64, 'Max 64 caratteri')
    .regex(/^[a-z0-9_]+$/, 'Solo lettere minuscole, cifre e underscore'),
  label: z
    .string()
    .min(1, 'Etichetta obbligatoria')
    .max(128, 'Max 128 caratteri'),
});

// --- useDeviceTypes hook (per D-17, D-18, D-19) ---
function useDeviceTypes() {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registry/types');
      if (!res.ok) throw new Error('Errore nel caricamento dei tipi');
      const data = (await res.json()) as DeviceType[];
      // Sort: built-in first, then alphabetical by label with Italian locale (per D-07)
      const sorted = [...data].sort((a, b) => {
        if (a.is_builtin && !b.is_builtin) return -1;
        if (!a.is_builtin && b.is_builtin) return 1;
        return a.label.localeCompare(b.label, 'it');
      });
      setTypes(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { types, loading, error, refetch };
}

// --- DeviceTypesPage component ---
export default function DeviceTypesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);
  const { types, loading, error, refetch } = useDeviceTypes();
  const { success: toastSuccess, error: toastError } = useToast();

  // DataTable column definitions (per D-04, D-05, D-13)
  const columns: ColumnDef<DeviceType>[] = [
    {
      accessorKey: 'label',
      header: 'Etichetta',
      enableSorting: true,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <code className="text-sm font-mono text-slate-400">{row.original.slug}</code>
      ),
    },
    {
      accessorKey: 'is_builtin',
      header: 'Tipo',
      cell: ({ row }) =>
        row.original.is_builtin ? (
          <Badge variant="ocean" size="sm">
            Built-in
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            Custom
          </Badge>
        ),
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: 'Creato',
      cell: ({ row }) =>
        new Date(row.original.created_at * 1000).toLocaleDateString('it-IT'),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        !row.original.is_builtin ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setTypeToDelete(row.original)}
          >
            Elimina
          </Button>
        ) : null,
      enableSorting: false,
    },
  ];

  // Handle create: POST /api/registry/types, throw on 409 to keep modal open (per D-08, D-09, D-11, D-12, D-20)
  const handleCreate = async (data: DeviceTypeCreate) => {
    const res = await fetch('/api/registry/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 409) throw new Error('Slug gia esistente');
    if (!res.ok) throw new Error('Errore durante la creazione');
    toastSuccess('Tipo creato con successo');
    await refetch();
  };

  // Handle delete: DELETE /api/registry/types/{slug}, toast on 409 (per D-14, D-15, D-16, D-20)
  const handleDelete = async () => {
    if (!typeToDelete) return;
    const res = await fetch(`/api/registry/types/${typeToDelete.slug}`, {
      method: 'DELETE',
    });
    if (res.status === 409) {
      toastError('Tipo in uso da dispositivi registrati');
      setTypeToDelete(null);
      return;
    }
    if (!res.ok) {
      toastError("Errore durante l'eliminazione");
      setTypeToDelete(null);
      return;
    }
    toastSuccess('Tipo eliminato');
    setTypeToDelete(null);
    await refetch();
  };

  return (
    <SettingsLayout title="Tipi dispositivo" icon="🏷️" backHref="/">
      <Text variant="secondary">
        Gestisci i tipi di dispositivo disponibili nel registro
      </Text>

      {error && <Banner variant="error">{error}</Banner>}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card variant="glass" className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={2} size="lg">
              Tipi
            </Heading>
            <Button variant="ember" size="sm" onClick={() => setShowCreate(true)}>
              Crea tipo
            </Button>
          </div>
          <DataTable columns={columns} data={types} variant="compact" />
        </Card>
      )}

      <FormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        title="Crea tipo dispositivo"
        defaultValues={{ slug: '', label: '' }}
        validationSchema={deviceTypeSchema}
        submitLabel="Crea"
        cancelLabel="Annulla"
        successMessage="Tipo creato!"
      >
        {({ control }) => (
          <>
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Slug"
                  data-field="slug"
                  {...field}
                  error={fieldState.error?.message}
                  placeholder="es. irrigatore"
                />
              )}
            />
            <Controller
              name="label"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Etichetta"
                  data-field="label"
                  {...field}
                  error={fieldState.error?.message}
                  placeholder="es. Irrigatore giardino"
                />
              )}
            />
          </>
        )}
      </FormModal>

      <ConfirmationDialog
        isOpen={typeToDelete !== null}
        onClose={() => setTypeToDelete(null)}
        onConfirm={handleDelete}
        title="Elimina tipo"
        description={`Eliminare "${typeToDelete?.label}" (${typeToDelete?.slug})?`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
