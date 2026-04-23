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
      accessorKey: 'model',
      header: 'Modello',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.model ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'firmware_version',
      header: 'Firmware',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-400">
          {row.original.firmware_version ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'battery_charge_level',
      header: 'Batteria',
      enableSorting: true,
      cell: ({ row }) => {
        const pct = row.original.battery_charge_level;
        if (pct === null || pct === undefined) {
          return <span className="text-slate-500">—</span>;
        }
        const variant: 'ember' | 'warning' | 'danger' =
          pct >= 50 ? 'ember' : pct >= 20 ? 'warning' : 'danger';
        const pulse = pct < 20;
        return (
          <Badge variant={variant} size="sm" pulse={pulse}>
            {pct}%
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_registered',
      header: 'Stato',
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_registered ? 'sage' : 'warning'}
          size="sm"
        >
          {row.original.is_registered ? 'Registrato' : 'Non registrato'}
        </Badge>
      ),
    },
  ];

  // Sort: registered first, then by name (Italian locale)
  const sortedHandsets = [...handsets].sort(
    (a, b) =>
      Number(b.is_registered) - Number(a.is_registered) ||
      a.name.localeCompare(b.name, 'it')
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
