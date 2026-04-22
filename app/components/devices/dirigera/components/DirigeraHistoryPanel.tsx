'use client';

import type { SensorEvent } from '@/types/dirigeraProxy';

interface DirigeraHistoryPanelProps {
  items: SensorEvent[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
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
}: DirigeraHistoryPanelProps) {
  const staleBadge = stale && loading
    ? <span className="text-xs text-ember-400 ml-2">Aggiornamento…</span>
    : stale && !loading
      ? <span className="text-xs text-slate-400 ml-2">Dati non aggiornati</span>
      : null;

  return (
    <div className="rounded-2xl bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Eventi recenti
          {staleBadge}
        </h2>
      </div>

      {/* Loading state — no items yet */}
      {loading && items.length === 0 && (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-ember-500" />
        </div>
      )}

      {/* Error state — no items */}
      {error && items.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Impossibile caricare lo storico
        </p>
      )}

      {/* Empty state — not loading, no error, no items */}
      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Nessun evento
        </p>
      )}

      {/* Data state */}
      {items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="text-left pb-2">Sensore</th>
                  <th className="text-left pb-2">Tipo evento</th>
                  <th className="text-left pb-2">Data/ora</th>
                </tr>
              </thead>
              <tbody>
                {items.map(event => (
                  <tr key={event.id} className="border-t border-slate-700/50">
                    <td className="py-2">{event.sensor_name ?? event.sensor_id}</td>
                    <td className="py-2">{event.event_type}</td>
                    <td className="py-2 text-slate-400">
                      {new Intl.DateTimeFormat('it-IT', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      }).format(new Date(event.recorded_at * 1000))}
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
                className="w-full sm:w-auto px-4 py-2 text-sm border border-slate-700 rounded-lg hover:border-ember-500 focus-visible:ring-2 focus-visible:ring-ember-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
