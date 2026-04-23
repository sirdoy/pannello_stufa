'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Badge from '@/app/components/ui/Badge';
import EmptyState from '@/app/components/ui/EmptyState';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import type { BandwidthRawRecord } from '../hooks/useFritzBandwidthHistoryRaw';

const PAGE_SIZE = 100;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  for (const u of units) {
    if (v < 1024) return `${v.toFixed(1)} ${u}`;
    v /= 1024;
  }
  return `${v.toFixed(1)} PB`;
}

function formatBps(n: number): string {
  if (n < 1000) return `${n} bps`;
  const units = ['Kbps', 'Mbps', 'Gbps'];
  let v = n / 1000;
  for (const u of units) {
    if (v < 1000) return `${v.toFixed(1)} ${u}`;
    v /= 1000;
  }
  return `${v.toFixed(1)} Tbps`;
}

export interface RawBandwidthTableProps {
  items: BandwidthRawRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  onPageChange: (p: number) => void;
}

/**
 * RawBandwidthTable — FRITZ-04 presentational surface.
 *
 * Displays untransformed bandwidth history from the Fritz!Box HA proxy.
 * Timestamps are Unix seconds (multiplied by 1000 for Date per Pitfall 6).
 * All Fritz!Box-supplied strings render via JSX text interpolation only (T-171-01).
 */
export default function RawBandwidthTable({
  items,
  loading,
  totalCount,
  page,
  onPageChange,
}: RawBandwidthTableProps) {
  const columns: ColumnDef<BandwidthRawRecord>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      enableSorting: false,
      cell: ({ row }) => format(new Date(row.original.timestamp * 1000), 'dd MMM HH:mm:ss', { locale: it }),
    },
    {
      accessorKey: 'bytes_sent',
      header: 'Byte inviati',
      enableSorting: false,
      cell: ({ row }) => formatBytes(row.original.bytes_sent),
    },
    {
      accessorKey: 'bytes_received',
      header: 'Byte ricevuti',
      enableSorting: false,
      cell: ({ row }) => formatBytes(row.original.bytes_received),
    },
    {
      accessorKey: 'upstream_rate',
      header: 'Upload',
      enableSorting: false,
      cell: ({ row }) => formatBps(row.original.upstream_rate),
    },
    {
      accessorKey: 'downstream_rate',
      header: 'Download',
      enableSorting: false,
      cell: ({ row }) => formatBps(row.original.downstream_rate),
    },
    {
      accessorKey: 'latency_ms',
      header: 'Latenza',
      enableSorting: false,
      cell: ({ row }) => (row.original.latency_ms !== null ? `${row.original.latency_ms} ms` : '—'),
    },
    {
      accessorKey: 'external_ip',
      header: 'IP esterno',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-400">{row.original.external_ip ?? '—'}</span>
      ),
    },
  ];

  const prevDisabled = page === 0;
  const nextDisabled = (page + 1) * PAGE_SIZE >= totalCount;
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <History size={20} aria-hidden="true" className="text-ember-400" />
        <Heading level={3} size="md">
          Bandwidth grezzo
        </Heading>
        <Badge variant="neutral" size="sm">
          {totalCount}
        </Badge>
      </div>

      {loading ? (
        <Skeleton className="h-[400px] rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<History size={48} className="text-slate-500" />}
          title="Nessun record di bandwidth"
          description="Il Fritz!Box non ha ancora raccolto dati per l'intervallo selezionato."
          size="md"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            density="default"
            striped={true}
            enableFiltering={false}
            enablePagination={false}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
            <Text variant="secondary" size="sm">
              Mostra {start}–{end} di {totalCount}
            </Text>
            <div role="status" aria-live="polite" className="sr-only">
              Pagina {page + 1}. Righe da {start} a {end} di {totalCount}.
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={prevDisabled}
                aria-label="Pagina precedente"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Precedente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={nextDisabled}
                aria-label="Pagina successiva"
              >
                Successiva
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
