'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import type { AutomationRule, AutomationExecution } from '@/types/automations';
import type { PaginatedResponse } from '@/types/common';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import { Text } from '@/app/components/ui';
import Heading from '@/app/components/ui/Heading';

const PAGE_SIZE = 20;

// --- useAutomationDetail hook ---
function useAutomationDetail(ruleId: string) {
  const [rule, setRule] = useState<AutomationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/automations/${ruleId}`);
      if (!res.ok) throw new Error('Errore nel caricamento della regola');
      setRule((await res.json()) as AutomationRule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [ruleId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rule, loading, error };
}

// --- useExecutions hook ---
function useExecutions(ruleId: string) {
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/automations/${ruleId}/executions?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );
      if (!res.ok) throw new Error('Errore nel caricamento dello storico esecuzioni');
      const data = (await res.json()) as PaginatedResponse<AutomationExecution>;
      setExecutions(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [ruleId, page]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { executions, totalCount, loading, error, page, setPage };
}

// --- Execution status badge helper ---
function getExecutionBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge variant="sage">Completata</Badge>;
    case 'failure':
      return <Badge variant="danger">Fallita</Badge>;
    case 'running':
      return <Badge variant="warning">In esecuzione</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

// --- AutomationDetailPage component ---
export default function AutomationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params['rule_id'] as string;

  const { rule, loading: ruleLoading, error: ruleError } = useAutomationDetail(ruleId);
  const {
    executions,
    totalCount,
    loading: executionsLoading,
    error: executionsError,
    page,
    setPage,
  } = useExecutions(ruleId);

  const executionColumns: ColumnDef<AutomationExecution>[] = [
    {
      accessorKey: 'started_at',
      header: 'Data',
      cell: ({ row }) => new Date(row.original.started_at).toLocaleString('it-IT'),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => getExecutionBadge(row.original.status),
      enableSorting: false,
    },
    {
      accessorKey: 'duration_ms',
      header: 'Durata',
      cell: ({ row }) => {
        const val = row.original.duration_ms;
        return val != null ? `${val}ms` : '\u2014';
      },
      enableSorting: false,
    },
    {
      accessorKey: 'error_message',
      header: 'Dettaglio',
      cell: ({ row }) => (
        <Text variant="secondary" size="sm">
          {row.original.error_message ?? '\u2014'}
        </Text>
      ),
      enableSorting: false,
    },
  ];

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <SettingsLayout title={rule?.name ?? 'Caricamento...'} backHref="/automations">
      {ruleLoading && (
        <>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </>
      )}

      {!ruleLoading && ruleError && (
        <Banner variant="error">{ruleError}</Banner>
      )}

      {!ruleLoading && rule && (
        <>
          {/* Back navigation */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/automations')}
              aria-label="Torna alle automazioni"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <Heading level={1}>{rule.name}</Heading>
              <Text variant="secondary">{rule.description ?? 'Nessuna descrizione'}</Text>
            </div>
          </div>

          {/* Rule metadata card */}
          <Card variant="glass" className="mb-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Text variant="secondary" size="sm">Stato</Text>
                <div className="mt-1">
                  <Badge variant={rule.enabled ? 'ember' : 'neutral'}>
                    {rule.enabled ? 'Attiva' : 'Disattiva'}
                  </Badge>
                </div>
              </div>
              <div>
                <Text variant="secondary" size="sm">Creata il</Text>
                <Text>
                  {rule.created_at
                    ? new Date(rule.created_at).toLocaleDateString('it-IT')
                    : '\u2014'}
                </Text>
              </div>
              <div>
                <Text variant="secondary" size="sm">ID</Text>
                <Text variant="secondary" size="sm">{rule.id}</Text>
              </div>
            </div>
          </Card>

          {/* Execution history section */}
          <Heading level={2} className="mb-4">Storico Esecuzioni</Heading>

          {executionsLoading && <Skeleton className="h-48 w-full" />}

          {!executionsLoading && executionsError && (
            <Banner variant="error">{executionsError}</Banner>
          )}

          {!executionsLoading && !executionsError && executions.length === 0 && (
            <Card variant="glass">
              <div className="p-4 sm:p-6">
                <Text variant="secondary">Nessuna esecuzione registrata</Text>
                <Text variant="secondary" size="sm">
                  Questa regola non ha ancora eseguito nessuna azione.
                </Text>
              </div>
            </Card>
          )}

          {!executionsLoading && !executionsError && executions.length > 0 && (
            <DataTable columns={executionColumns} data={executions} />
          )}

          {/* Pagination for executions */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Text variant="secondary" size="sm">
                {totalCount} esecuzioni totali
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
        </>
      )}
    </SettingsLayout>
  );
}
