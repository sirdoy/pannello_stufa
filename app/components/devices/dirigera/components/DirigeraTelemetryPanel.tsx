'use client';

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
    ? <span className="ml-2 text-xs text-ember-400">Aggiornamento…</span>
    : stale && !loading
      ? <span className="ml-2 text-xs text-slate-400">Dati non aggiornati</span>
      : null;

  return (
    <div className="rounded-2xl bg-slate-800/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          Telemetria
          {staleBadge}
        </h2>
      </div>

      {/* Loading state — no items yet */}
      {loading && items.length === 0 && (
        <div className="py-8 text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-2 border-slate-600 border-t-ember-500" />
        </div>
      )}

      {/* Error state — no items */}
      {error && items.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-400">
          Impossibile caricare la telemetria
        </p>
      )}

      {/* Empty state — not loading, no error, no items */}
      {items.length === 0 && !loading && !error && (
        <p className="py-4 text-center text-sm text-slate-400">
          Nessuna telemetria
        </p>
      )}

      {/* Data state */}
      {items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-slate-400 uppercase">
                  <th className="pb-2 text-left">Sensore</th>
                  <th className="pb-2 text-left">Batteria</th>
                  <th className="pb-2 text-left">Lux</th>
                  <th className="pb-2 text-left">Aria</th>
                  <th className="pb-2 text-left">Data/ora</th>
                </tr>
              </thead>
              <tbody>
                {items.map(reading => (
                  <tr key={reading.id} className="border-t border-slate-700/50">
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
                    <td className="py-2 text-slate-400">
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
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-ember-500 focus-visible:ring-2 focus-visible:ring-ember-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isLoadingMore ? 'Caricamento...' : 'Carica altri 50'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
