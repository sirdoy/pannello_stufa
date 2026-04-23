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
import type { DeviceEventRawRecord } from '../hooks/useFritzDeviceEventsRaw';

const PAGE_SIZE = 100;

export interface RawDeviceEventsTableProps {
  items: DeviceEventRawRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  onPageChange: (p: number) => void;
}

/**
 * RawDeviceEventsTable — FRITZ-06 presentational surface.
 *
 * Displays the untransformed device join/leave event log.
 * Timestamps are Unix seconds (multiplied by 1000 per Pitfall 6).
 * All Fritz!Box-supplied strings render via JSX text interpolation only (T-171-01).
 */
export default function RawDeviceEventsTable({
  items,
  loading,
  totalCount,
  page,
  onPageChange,
}: RawDeviceEventsTableProps) {
  const columns: ColumnDef<DeviceEventRawRecord>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      enableSorting: false,
      cell: ({ row }) => format(new Date(row.original.timestamp * 1000), 'dd MMM HH:mm:ss', { locale: it }),
    },
    {
      accessorKey: 'mac',
      header: 'MAC',
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{row.original.mac}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: false,
      cell: ({ row }) => <span className="text-slate-300">{row.original.name ?? '—'}</span>,
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{row.original.ip ?? '—'}</span>,
    },
    {
      accessorKey: 'event_type',
      header: 'Evento',
      enableSorting: false,
      cell: ({ row }) => {
        const et = row.original.event_type;
        if (et === 'connected') {
          return (
            <Badge variant="ocean" size="sm">
              Connesso
            </Badge>
          );
        }
        if (et === 'disconnected') {
          return (
            <Badge variant="neutral" size="sm">
              Disconnesso
            </Badge>
          );
        }
        return (
          <Badge variant="neutral" size="sm">
            {et}
          </Badge>
        );
      },
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
          Eventi dispositivi
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
          title="Nessun evento dispositivo"
          description="Nessun dispositivo ha registrato eventi di join/leave nell'intervallo selezionato."
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
