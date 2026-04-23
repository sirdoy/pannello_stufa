'use client';

import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  Heading,
  Text,
  Badge,
  Banner,
  EmptyState,
  DataTable,
  Button,
  Skeleton,
} from '@/app/components/ui';
import type { CallRecord } from '../hooks/useFritzCallHistory';

const PAGE_SIZE = 50;

interface CallHistoryTableProps {
  calls: CallRecord[];
  loading: boolean;
  stale?: boolean;
  error?: Error | null;
  totalCount: number;
  page: number;
  onPageChange: (p: number) => void;
}

type CallTypeVariant = 'sage' | 'ocean' | 'danger' | 'warning' | 'neutral';

function getCallTypeMeta(type: string): {
  variant: CallTypeVariant;
  icon: ReactNode;
  label: string;
} {
  switch (type) {
    case 'incoming':
      return { variant: 'sage', icon: <PhoneIncoming size={14} />, label: 'In entrata' };
    case 'outgoing':
      return { variant: 'ocean', icon: <PhoneOutgoing size={14} />, label: 'In uscita' };
    case 'missed':
      return { variant: 'danger', icon: <PhoneMissed size={14} />, label: 'Persa' };
    case 'voicemail':
      return { variant: 'warning', icon: <Voicemail size={14} />, label: 'Segreteria' };
    default:
      return { variant: 'neutral', icon: <Phone size={14} />, label: 'Sconosciuto' };
  }
}

function formatDuration(sec: number): ReactNode {
  if (sec === 0) return <span className="text-slate-500">—</span>;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * CallHistoryTable — FRITZ-02 presentational card for call history.
 *
 * Server-paginated 50/page with Prev/Next controls. No ErrorAlert (Pitfall 4),
 * no dangerouslySetInnerHTML (threat T-171-01). Pitfall 5 (unknown call_type
 * fallback) and Pitfall 6 (timestamp seconds→ms) are both applied.
 */
export default function CallHistoryTable({
  calls,
  loading,
  error = null,
  totalCount,
  page,
  onPageChange,
}: CallHistoryTableProps) {
  if (loading && calls.length === 0 && totalCount === 0 && !error) {
    return <Skeleton className="h-[520px] rounded-2xl" />;
  }

  const columns: ColumnDef<CallRecord>[] = [
    {
      accessorKey: 'call_type',
      header: 'Tipo',
      enableSorting: false,
      cell: ({ row }) => {
        const meta = getCallTypeMeta(row.original.call_type);
        return (
          <Badge variant={meta.variant} size="sm" icon={meta.icon}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'number',
      header: 'Numero',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-slate-200">{row.original.number}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'duration_seconds',
      header: 'Durata',
      enableSorting: false,
      cell: ({ row }) => formatDuration(row.original.duration_seconds),
    },
    {
      accessorKey: 'timestamp',
      header: 'Data/ora',
      enableSorting: false,
      // Pitfall 6: raw timestamp is Unix SECONDS — *1000 for Date.
      cell: ({ row }) =>
        format(new Date(row.original.timestamp * 1000), 'dd MMM yyyy HH:mm', {
          locale: it,
        }),
    },
  ];

  const offset = page * PAGE_SIZE;
  const rangeEnd = Math.min(offset + PAGE_SIZE, totalCount);
  const isLastPage = (page + 1) * PAGE_SIZE >= totalCount;

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History size={20} aria-hidden="true" className="text-ember-400" />
        <Heading level={2} size="lg">Cronologia chiamate</Heading>
        <Badge variant="neutral" size="sm">{totalCount}</Badge>
      </div>

      {/* Body */}
      {error ? (
        <Banner
          variant="error"
          title="Impossibile caricare la cronologia"
          description={error.message}
          compact={true}
        />
      ) : totalCount === 0 && !loading ? (
        <EmptyState
          icon={<History size={48} className="text-slate-500" />}
          title="Nessuna chiamata registrata"
          description="Le chiamate appariranno qui non appena il Fritz!Box le registra."
          size="md"
        />
      ) : (
        <DataTable
          columns={columns}
          data={calls}
          density="default"
          striped={true}
          enableFiltering={false}
          enablePagination={false}
        />
      )}

      {/* Pagination footer (only when there are results) */}
      {!error && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 border-t border-white/[0.06] pt-4">
          <Text variant="secondary" size="sm">
            Mostra {offset + 1}–{rangeEnd} di {totalCount}
          </Text>

          <Button.Group>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              aria-label="Pagina precedente"
            >
              <ChevronLeft size={16} />
              Precedente
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={isLastPage}
              aria-label="Pagina successiva"
            >
              Successiva
              <ChevronRight size={16} />
            </Button>
          </Button.Group>

          {/* Screen-reader live region */}
          <div role="status" aria-live="polite" className="sr-only">
            Pagina {page + 1}. Righe da {offset + 1} a {rangeEnd} di {totalCount}.
          </div>
        </div>
      )}
    </Card>
  );
}

export { CallHistoryTable };
