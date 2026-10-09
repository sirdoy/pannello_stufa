'use client';

import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-(--text-2) uppercase">
                  <th className="pb-2 text-left">Sensore</th>
                  <th className="pb-2 text-left">Batteria</th>
                  <th className="pb-2 text-left">Lux</th>
                  <th className="pb-2 text-left">Aria</th>
                  <th className="pb-2 text-left">Data/ora</th>
                </tr>
              </thead>
              <tbody>
                {items.map(reading => (
                  <tr key={reading.id} className="border-t border-white/8">
                    <td className="py-2">{reading.sensor_id}</td>
                    <td className="py-2">
                      {reading.battery_percentage !== null
                        ? `${reading.battery_percentage}%`
                        : '—'}
                    </td>
                    <td className="py-2">
                      {reading.light_level !== null
                        ? `${reading.light_level} lux`
                        : '—'}
                    </td>
                    <td className="py-2 whitespace-nowrap">{airText(reading)}</td>
                    <td className="py-2 text-(--text-2)">
                      {new Intl.DateTimeFormat('it-IT', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      }).format(new Date(reading.timestamp * 1000))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
