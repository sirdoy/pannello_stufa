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
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import { Heading, Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- Zod schemas ---
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

const editLabelSchema = z.object({
  label: z
    .string()
    .min(1, 'Etichetta obbligatoria')
    .max(128, 'Max 128 caratteri'),
});

// --- useDeviceTypes hook ---
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
      const sorted = [...data].sort((a, b) =>
        a.label.localeCompare(b.label, 'it')
      );
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
  const [typeToEdit, setTypeToEdit] = useState<DeviceType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);
  const { types, loading, error, refetch } = useDeviceTypes();
  const { success: toastSuccess, error: toastError } = useToast();

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
        row.original.is_builtin ? null : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTypeToEdit(row.original)}
            >
              Modifica
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setTypeToDelete(row.original)}
            >
              Elimina
            </Button>
          </div>
        ),
      enableSorting: false,
    },
  ];

  // Handle create: POST /api/registry/types
  const handleCreate = async (data: DeviceTypeCreate) => {
    const res = await fetch('/api/registry/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 409) throw new Error('Slug già esistente');
    if (!res.ok) throw new Error('Errore durante la creazione');
    toastSuccess('Tipo creato con successo');
    await refetch();
  };

  // Handle edit: DELETE old + POST new (backend has no PUT for types)
  const handleEdit = async (data: { label: string }) => {
    if (!typeToEdit) return;
    // If label hasn't changed, skip
    if (data.label === typeToEdit.label) return;
    // Delete old type, then recreate with new label
    const delRes = await fetch(`/api/registry/types/${typeToEdit.slug}`, {
      method: 'DELETE',
    });
    if (!delRes.ok && delRes.status !== 404) {
      throw new Error('Errore durante la modifica');
    }
    const createRes = await fetch('/api/registry/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: typeToEdit.slug, label: data.label }),
    });
    if (!createRes.ok) throw new Error('Errore durante la modifica');
    toastSuccess('Tipo aggiornato');
    await refetch();
  };

  // Handle delete: DELETE /api/registry/types/{slug}
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

      {/* Create modal */}
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
        {({ control }: any) => (
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

      {/* Edit modal */}
      <FormModal
        isOpen={typeToEdit !== null}
        onClose={() => setTypeToEdit(null)}
        onSubmit={handleEdit}
        title="Modifica tipo"
        defaultValues={typeToEdit ? { label: typeToEdit.label } : { label: '' }}
        validationSchema={editLabelSchema}
        submitLabel="Salva"
        cancelLabel="Annulla"
        successMessage="Tipo aggiornato!"
      >
        {({ control }: any) => (
          <>
            <div className="text-sm text-slate-400 mb-2">
              <p>Slug: <strong className="text-slate-200">{typeToEdit?.slug}</strong></p>
            </div>
            <Controller
              name="label"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Etichetta"
                  data-field="label"
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            />
          </>
        )}
      </FormModal>

      {/* Delete confirmation */}
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
