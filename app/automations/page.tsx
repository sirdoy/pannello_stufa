'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Controller, type Control } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { AutomationRule } from '@/types/automations';
import type { PaginatedResponse } from '@/types/common';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Switch from '@/app/components/ui/Switch';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// Zod schema for automation rule form (T-158-05: validation mitigates tamper threats)
const automationSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(128, 'Max 128 caratteri'),
  description: z.string().max(500, 'Max 500 caratteri').nullable().optional(),
  enabled: z.boolean().default(true),
});
type AutomationFormData = z.infer<typeof automationSchema>;

const PAGE_SIZE = 20;

// --- useAutomations hook ---
function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/automations?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );
      if (!res.ok) throw new Error('Errore nel caricamento delle automazioni');
      const data = (await res.json()) as PaginatedResponse<AutomationRule>;
      setRules(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rules, totalCount, loading, error, refetch, page, setPage };
}

// --- AutomationsPage component ---
export default function AutomationsPage() {
  const router = useRouter();
  const { rules, totalCount, loading, error, refetch, page, setPage } = useAutomations();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<AutomationRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- CRUD handlers ---

  const handleCreate = async (data: AutomationFormData) => {
    setSubmitting(true);
    try {
      // Legacy admin form — server has defaults for condition/actions.
      // Full editor at /automazioni (Phase 180) provides the typed body.
      const body = {
        name: data.name,
        description: data.description?.trim() ?? null,
        enabled: data.enabled,
      };
      const res = await fetch('/api/v1/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Operazione non riuscita. Riprova.');
      toastSuccess('Regola creata con successo');
      setShowCreateModal(false);
      await refetch();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: AutomationFormData) => {
    if (!ruleToEdit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/automations/${ruleToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description?.trim() ?? null,
          enabled: data.enabled,
        }),
      });
      if (!res.ok) throw new Error('Operazione non riuscita. Riprova.');
      toastSuccess('Regola aggiornata con successo');
      setRuleToEdit(null);
      await refetch();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    // WR-07 (REVIEW iteration 2): symmetric submitting state with
    // handleCreate/handleUpdate. Prevents parallel DELETEs racing the
    // refetch when ConfirmationDialog auto-closes too quickly.
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/automations/${ruleToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Operazione non riuscita. Riprova.');
      toastSuccess('Regola eliminata');
      setRuleToDelete(null);
      await refetch();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.');
      setRuleToDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Column definitions ---
  const columns: ColumnDef<AutomationRule>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <button
          className="text-left hover:text-ember-400 transition-colors"
          onClick={() => router.push(`/automations/${row.original.id}`)}
        >
          <Text>{row.original.name}</Text>
          {row.original.description && (
            <Text variant="secondary" size="sm">
              {row.original.description}
            </Text>
          )}
        </button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'enabled',
      header: 'Stato',
      cell: ({ row }) => (
        <Badge
          variant={row.original.enabled ? 'ember' : 'neutral'}
          pulse={row.original.enabled}
        >
          {row.original.enabled ? 'Attiva' : 'Disattiva'}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'last_triggered_at',
      header: 'Ultima esecuzione',
      cell: ({ row }) => {
        const val = row.original.last_triggered_at;
        // last_triggered_at is Unix seconds (number) \u2014 convert to ms
        return val ? new Date(val * 1000).toLocaleString('it-IT') : '\u2014';
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRuleToEdit(row.original)}>
            Modifica
          </Button>
          <Button variant="danger" size="sm" onClick={() => setRuleToDelete(row.original)}>
            Elimina
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <SettingsLayout title="Automazioni">
      <Text variant="secondary">Gestisci le regole di automazione del sistema</Text>

      <Card variant="glass" className="p-4 sm:p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="ember" size="sm" onClick={() => setShowCreateModal(true)}>
            Nuova Regola
          </Button>
        </div>

        {/* Loading state */}
        {loading && <Skeleton className="h-48 w-full" />}

        {/* Error state */}
        {!loading && error && <Banner variant="error">{error}</Banner>}

        {/* Empty state */}
        {!loading && !error && rules.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>Nessuna automazione configurata</p>
            <p className="text-sm mt-1">Crea la tua prima regola di automazione</p>
            <Button
              variant="ember"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Nuova Regola
            </Button>
          </div>
        )}

        {/* Rules list */}
        {!loading && !error && rules.length > 0 && (
          <DataTable data={rules} columns={columns} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Text variant="secondary" size="sm">
              {totalCount} regole totali
            </Text>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Precedente
              </Button>
              <Text size="sm">
                {page + 1} / {totalPages}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Successivo
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create FormModal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        title="Nuova regola"
        defaultValues={{ name: '', description: '', enabled: true }}
        validationSchema={automationSchema}
        submitLabel="Crea"
        cancelLabel="Annulla"
      >
        {({ control }: { control: Control<AutomationFormData> }) => (
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
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    label="Abilitata"
                  />
                  <Text size="sm">Abilitata</Text>
                </div>
              )}
            />
          </>
        )}
      </FormModal>

      {/* Edit FormModal (key prop forces remount on target change) */}
      <FormModal
        key={ruleToEdit?.id ?? 'create'}
        isOpen={ruleToEdit !== null}
        onClose={() => setRuleToEdit(null)}
        onSubmit={handleUpdate}
        title="Modifica regola"
        defaultValues={
          ruleToEdit
            ? {
                name: ruleToEdit.name,
                description: ruleToEdit.description ?? '',
                enabled: ruleToEdit.enabled,
              }
            : { name: '', description: '', enabled: true }
        }
        validationSchema={automationSchema}
        submitLabel="Salva"
        cancelLabel="Annulla"
      >
        {({ control }: { control: Control<AutomationFormData> }) => (
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
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    label="Abilitata"
                  />
                  <Text size="sm">Abilitata</Text>
                </div>
              )}
            />
          </>
        )}
      </FormModal>

      {/* Delete ConfirmationDialog */}
      <ConfirmationDialog
        isOpen={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleDelete}
        title="Elimina automazione"
        description={`Sei sicuro di voler eliminare la regola "${ruleToDelete?.name}"? L'operazione non può essere annullata.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
