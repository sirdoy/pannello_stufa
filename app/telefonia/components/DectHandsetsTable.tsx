'use client';

import { Phone } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  Heading,
  Badge,
  Banner,
  EmptyState,
  DataTable,
  Skeleton,
} from '@/app/components/ui';
import type { DectHandset } from '../hooks/useFritzDectHandsets';

function getRegistrationMeta(status: string | null | undefined): {
  variant: 'sage' | 'warning';
  label: string;
} {
  // Backend always sends "registered" (presence in the TR-064 list implies it).
  if (status === 'registered') return { variant: 'sage', label: 'Registrato' };
  return { variant: 'warning', label: 'Non registrato' };
}

interface DectHandsetsTableProps {
  handsets: DectHandset[];
  loading: boolean;
  stale?: boolean;
  error?: Error | null;
  total: number;
}

/**
 * DectHandsetsTable — FRITZ-01 presentational card for DECT handsets.
 *
 * Composes only existing primitives. Uses Banner variant="error" for
 * error states per Pitfall 4 (not the legacy alert primitive). Never
 * renders untrusted HTML — JSX default escaping covers threat T-171-01.
 */
export default function DectHandsetsTable({
  handsets,
  loading,
  error = null,
  total,
}: DectHandsetsTableProps) {
  if (loading && handsets.length === 0) {
    return <Skeleton className="h-[280px] rounded-2xl" />;
  }

  const columns: ColumnDef<DectHandset>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-slate-200">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'dect_id',
      header: 'ID',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-400">{row.original.dect_id}</span>
      ),
    },
    {
      accessorKey: 'model',
      header: 'Modello',
      enableSorting: false,
      // TR-064 does not expose the model: backend always sends null.
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.model ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'registration_status',
      header: 'Stato',
      enableSorting: false,
      cell: ({ row }) => {
        const meta = getRegistrationMeta(row.original.registration_status);
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
  ];

  // Sort by DECT id (stable, matches Fritz!Box order), then name (Italian locale)
  const sortedHandsets = [...handsets].sort(
    (a, b) =>
      (a.dect_id ?? 0) - (b.dect_id ?? 0) ||
      (a.name ?? '').localeCompare(b.name ?? '', 'it')
  );

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Phone size={20} aria-hidden="true" className="text-ember-400" />
        <Heading level={2} size="lg">Cornette DECT</Heading>
        <Badge variant="neutral" size="sm">{total}</Badge>
      </div>

      {/* Body */}
      {error ? (
        <Banner
          variant="error"
          title="Impossibile caricare le cornette DECT"
          description={error.message}
          compact={true}
        />
      ) : handsets.length === 0 ? (
        <EmptyState
          icon={<Phone size={48} className="text-slate-500" />}
          title="Nessuna cornetta DECT registrata"
          description="Registra una cornetta dal pannello di controllo del Fritz!Box per vederla qui."
          size="md"
        />
      ) : (
        <DataTable
          columns={columns}
          data={sortedHandsets}
          getRowId={(h: DectHandset) => String(h.dect_id)}
          density="default"
          striped={true}
          enableFiltering={false}
          enablePagination={false}
        />
      )}
    </Card>
  );
}

export { DectHandsetsTable };
