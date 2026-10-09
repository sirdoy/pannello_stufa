'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import DataTable from '@/app/components/ui/DataTable';
import Heading from '@/app/components/ui/Heading';
import Spinner from '@/app/components/ui/Spinner';
import Text from '@/app/components/ui/Text';
import type { SensorEvent } from '@/types/dirigeraProxy';

const dateTime = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' });

interface DirigeraHistoryPanelProps {
  items: SensorEvent[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
  /** sensor_id → display name (events carry only sensor_id). */
  sensorNames?: Record<string, string>;
}

/**
 * DirigeraHistoryPanel — Recent sensor events paginated table for /dirigera page.
 *
 * Displays up to 50 sensor events per page. "Carica altri 50" button appends more
 * events and is hidden when all items are loaded (items.length >= total).
 */
export default function DirigeraHistoryPanel({
  items,
  total,
  loading,
  isLoadingMore,
  error,
  stale,
  loadMore,
  sensorNames = {},
}: DirigeraHistoryPanelProps) {
  const staleBadge = stale && loading
    ? <Text as="span" variant="ember" size="xs" weight="normal" className="ml-2">Aggiornamento…</Text>
    : stale && !loading
      ? <Text as="span" variant="secondary" size="xs" weight="normal" className="ml-2">Dati non aggiornati</Text>
      : null;

  const columns: ColumnDef<SensorEvent>[] = [
    {
      id: 'sensor',
      header: 'Sensore',
      enableSorting: false,
      cell: ({ row }) => sensorNames[row.original.sensor_id] ?? row.original.sensor_id,
    },
    { accessorKey: 'event_type', header: 'Tipo evento', enableSorting: false },
    {
      id: 'timestamp',
      header: 'Data/ora',
      enableSorting: false,
      cell: ({ row }) => (
        <Text as="span" variant="secondary" size="sm">{dateTime.format(new Date(row.original.timestamp * 1000))}</Text>
      ),
    },
  ];

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={2} size="lg">
          Eventi recenti
          {staleBadge}
        </Heading>
      </div>

      {/* Loading state — no items yet */}
      {loading && items.length === 0 && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" label="Caricamento" />
        </div>
      )}

      {/* Error state — no items */}
      {error && items.length === 0 && (
        <Text variant="secondary" size="sm" className="py-4 text-center">
          Impossibile caricare lo storico
        </Text>
      )}

      {/* Empty state — not loading, no error, no items */}
      {items.length === 0 && !loading && !error && (
        <Text variant="secondary" size="sm" className="py-4 text-center">
          Nessun evento
        </Text>
      )}

      {/* Data state */}
      {items.length > 0 && (
        <>
          <DataTable data={items} columns={columns} density="compact" getRowId={(e) => String(e.id)} />

          {/* Load more button — hidden when all items loaded */}
          {items.length < total && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full sm:w-auto"
              >
                {isLoadingMore ? 'Caricamento...' : 'Carica altri 50'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
