'use client';

import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Spinner from '@/app/components/ui/Spinner';
import Text from '@/app/components/ui/Text';
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
    <Card variant="subtle" padding={false} className="p-3">
      <Text as="div" variant="secondary" size="xs" className="mb-1">{label}</Text>
      <Text as="div" weight="bold" className="text-2xl">{value}</Text>
    </Card>
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
    ? <Text as="span" variant="ember" size="xs" weight="normal" className="ml-2">Aggiornamento…</Text>
    : stale && !loading
      ? <Text as="span" variant="secondary" size="xs" weight="normal" className="ml-2">Dati non aggiornati</Text>
      : null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={2} size="lg">
          Statistiche
          {staleBadge}
        </Heading>
      </div>

      {/* Loading state — no data yet */}
      {loading && !data && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" label="Caricamento" />
        </div>
      )}

      {/* Error state — no data */}
      {error && !data && (
        <Text variant="secondary" size="sm" className="py-4 text-center">
          Impossibile caricare le statistiche
        </Text>
      )}

      {/* Empty state — not loading, no error, no data */}
      {!data && !loading && !error && (
        <Text variant="secondary" size="sm" className="py-4 text-center">
          Statistiche non disponibili
        </Text>
      )}

      {/* Data state */}
      {data && (
        <>
          {/* Aggregazione subsection */}
          <section className="mb-6">
            <Text as="h3" variant="label" className="mb-3">Aggregazione</Text>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Esecuzioni" value={data.aggregation.total_runs} />
              <Tile label="Ultimo run" value={formatTimestamp(data.aggregation.last_run)} />
              <Tile label="Sensori ultimo run" value={data.aggregation.last_sensors_processed ?? 'n/d'} />
            </div>
          </section>

          {/* Retention subsection */}
          <section>
            <Text as="h3" variant="label" className="mb-3">Retention</Text>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Esecuzioni" value={data.retention.total_runs} />
              <Tile label="Ultimo run" value={formatTimestamp(data.retention.last_run)} />
              <Tile label="Eventi eliminati" value={data.retention.last_raw_events_deleted ?? 'n/d'} />
              <Tile label="Giornalieri eliminati" value={data.retention.last_daily_rows_deleted ?? 'n/d'} />
              <Tile label="Telemetria eliminata" value={data.retention.last_telemetry_deleted ?? 'n/d'} />
            </div>
          </section>
        </>
      )}
    </Card>
  );
}
