'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import DataTable from '@/app/components/ui/DataTable';
import Heading from '@/app/components/ui/Heading';
import Spinner from '@/app/components/ui/Spinner';
import Text from '@/app/components/ui/Text';
import type { SensorTelemetryReading } from '@/types/dirigeraProxy';
import { formatCo2, formatHumidity, formatPm25, formatTemperature } from '@/lib/dirigera/airQuality';

/** Air quality columns as one compact cell ("—" for non-environment sensors). */
function airText(r: SensorTelemetryReading): string {
  if (r.co2 == null && r.pm25 == null && r.temperature == null && r.humidity == null) return '—';
  return [
    formatCo2(r.co2),
    `PM2.5 ${formatPm25(r.pm25)}`,
    formatTemperature(r.temperature),
    formatHumidity(r.humidity),
  ].join(' · ');
}

const dateTime = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' });

const COLUMNS: ColumnDef<SensorTelemetryReading>[] = [
  { accessorKey: 'sensor_id', header: 'Sensore', enableSorting: false },
  {
    id: 'battery',
    header: 'Batteria',
    enableSorting: false,
    cell: ({ row }) => (row.original.battery_percentage !== null ? `${row.original.battery_percentage}%` : '—'),
  },
  {
    id: 'lux',
    header: 'Lux',
    enableSorting: false,
    cell: ({ row }) => (row.original.light_level !== null ? `${row.original.light_level} lux` : '—'),
  },
  {
    id: 'air',
    header: 'Aria',
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap">{airText(row.original)}</span>,
  },
  {
    id: 'timestamp',
    header: 'Data/ora',
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" variant="secondary" size="sm">{dateTime.format(new Date(row.original.timestamp * 1000))}</Text>
    ),
  },
];

interface DirigeraTelemetryPanelProps {
  items: SensorTelemetryReading[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}

/**
 * DirigeraTelemetryPanel — Sensor telemetry readings paginated table for /dirigera page.
 *
 * Displays up to 50 telemetry readings per page. "Carica altri 50" button appends more
 * readings and is hidden when all items are loaded (items.length >= total).
 */
export default function DirigeraTelemetryPanel({
  items,
  total,
  loading,
  isLoadingMore,
  error,
  stale,
  loadMore,
}: DirigeraTelemetryPanelProps) {
  const staleBadge = stale && loading
    ? <Text as="span" variant="ember" size="xs" weight="normal" className="ml-2">Aggiornamento…</Text>
    : stale && !loading
      ? <Text as="span" variant="secondary" size="xs" weight="normal" className="ml-2">Dati non aggiornati</Text>
      : null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={2} size="lg">
          Telemetria
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
          Impossibile caricare la telemetria
        </Text>
      )}

      {/* Empty state — not loading, no error, no items */}
      {items.length === 0 && !loading && !error && (
        <Text variant="secondary" size="sm" className="py-4 text-center">
          Nessuna telemetria
        </Text>
      )}

      {/* Data state */}
      {items.length > 0 && (
        <>
          <DataTable data={items} columns={COLUMNS} density="compact" getRowId={(r) => String(r.id)} />

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
