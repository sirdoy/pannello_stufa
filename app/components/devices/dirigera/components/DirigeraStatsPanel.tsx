'use client';

import type { DirigeraStatsResponse } from '@/types/dirigeraProxy';

interface DirigeraStatsPanelProps {
  data: DirigeraStatsResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}

function formatTimestamp(ts: number | null): string {
  if (ts === null) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(ts * 1000));
}

interface TileProps {
  label: string;
  value: string | number;
}

function Tile({ label, value }: TileProps) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

/**
 * DirigeraStatsPanel — Aggregation + Retention statistics panel for /dirigera page.
 *
 * Renders tiles from DirigeraStatsResponse: aggregation and retention subsections.
 * Fields displayed are exactly those present in the API response (no aspirational tiles).
 */
export default function DirigeraStatsPanel({ data, loading, error, stale }: DirigeraStatsPanelProps) {
  const staleBadge = stale && loading
    ? <span className="text-xs text-ember-400 ml-2">Aggiornamento…</span>
    : stale && !loading
      ? <span className="text-xs text-slate-400 ml-2">Dati non aggiornati</span>
      : null;

  return (
    <div className="rounded-2xl bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Statistiche
          {staleBadge}
        </h2>
      </div>

      {/* Loading state — no data yet */}
      {loading && !data && (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-ember-500" />
        </div>
      )}

      {/* Error state — no data */}
      {error && !data && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Impossibile caricare le statistiche
        </p>
      )}

      {/* Empty state — not loading, no error, no data */}
      {!data && !loading && !error && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Statistiche non disponibili
        </p>
      )}

      {/* Data state */}
      {data && (
        <>
          {/* Aggregazione subsection */}
          <section className="mb-6">
            <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-3">Aggregazione</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Righe aggregate totali" value={data.aggregation.total_rows_aggregated} />
              <Tile label="Ultimo run" value={formatTimestamp(data.aggregation.last_run_at)} />
              <Tile label="Righe ultimo run" value={data.aggregation.rows_aggregated_last_run} />
              <Tile label="Stato ultimo run" value={data.aggregation.last_run_status ?? 'n/d'} />
            </div>
          </section>

          {/* Retention subsection */}
          <section>
            <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-3">Retention</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Righe eliminate totali" value={data.retention.total_rows_deleted} />
              <Tile label="Ultimo run" value={formatTimestamp(data.retention.last_run_at)} />
              <Tile label="Righe eliminate ultimo run" value={data.retention.rows_deleted_last_run} />
              <Tile label="Stato ultimo run" value={data.retention.last_run_status ?? 'n/d'} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
