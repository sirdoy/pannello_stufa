'use client';

import { useState } from 'react';
import PageLayout from '@/app/components/ui/PageLayout';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import Button from '@/app/components/ui/Button';
import { Banner } from '@/app/components/ui';
import { useDirigeraFullData } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import type { SensorFilter } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import { useDirigeraStats } from '@/app/components/devices/dirigera/hooks/useDirigeraStats';
import { useDirigeraHistory } from '@/app/components/devices/dirigera/hooks/useDirigeraHistory';
import { useDirigeraTelemetry } from '@/app/components/devices/dirigera/hooks/useDirigeraTelemetry';
import DirigeraHealthSection from '@/app/components/devices/dirigera/components/DirigeraHealthSection';
import DirigeraSensorList from '@/app/components/devices/dirigera/components/DirigeraSensorList';
import DirigeraAirQualityPanel from '@/app/components/devices/dirigera/components/DirigeraAirQualityPanel';
import DirigeraStatsPanel from '@/app/components/devices/dirigera/components/DirigeraStatsPanel';
import DirigeraHistoryPanel from '@/app/components/devices/dirigera/components/DirigeraHistoryPanel';
import DirigeraTelemetryPanel from '@/app/components/devices/dirigera/components/DirigeraTelemetryPanel';

const FILTERS: { key: SensorFilter; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'contact', label: 'Contatti' },
  { key: 'motion', label: 'Movimento' },
];

/**
 * /dirigera page — DIRIGERA hub health and sensor list.
 *
 * Orchestrator pattern:
 * - useDirigeraFullData handles polling and filter-aware data fetching
 * - DirigeraHealthSection renders hub info
 * - DirigeraSensorList renders sorted, filtered sensor rows
 * - Loading skeleton shows on initial load and filter change
 */
export default function DirigeraPage() {
  const [filter, setFilter] = useState<SensorFilter>('all');
  const { data, loading, stale, error } = useDirigeraFullData(filter);
  const stats = useDirigeraStats();
  const history = useDirigeraHistory({ limit: 50 });
  const telemetry = useDirigeraTelemetry({ limit: 50 });

  // Loading guard — only on initial load or filter change (no cached data)
  if (loading && !data) {
    return (
      <PageLayout header={<PageLayout.Header title="DIRIGERA" backHref="/altro" />}>
        <div className="space-y-6">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-45 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<PageLayout.Header title="DIRIGERA" backHref="/altro" />}>
      <div className="space-y-6">
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && (
          <Banner variant="warning" title="Dati non aggiornati" compact={true} />
        )}

        {/* Error state — no data at all */}
        {error && !data && (
          <Text variant="secondary">{error}</Text>
        )}

        {/* Hub health section */}
        {data && <DirigeraHealthSection health={data.health} />}

        {/* Air quality (ALPSTUGA) — only in "Tutti": contact/motion endpoints exclude it */}
        {data && filter === 'all' && <DirigeraAirQualityPanel sensors={data.sensors} />}

        {/* Filter segmented control */}
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="flex-1"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Sensor list */}
        {data && <DirigeraSensorList sensors={data.sensors} filter={filter} />}

        {/* Stats panel — aggregation + retention from /api/v1/dirigera/stats */}
        <DirigeraStatsPanel
          data={stats.data}
          loading={stats.loading}
          error={stats.error}
          stale={stats.stale}
        />

        {/* History panel — recent sensor events from /api/v1/dirigera/history */}
        <DirigeraHistoryPanel
          items={history.items}
          total={history.total}
          loading={history.loading}
          isLoadingMore={history.isLoadingMore}
          error={history.error}
          stale={history.stale}
          loadMore={history.loadMore}
          sensorNames={Object.fromEntries(
            (data?.sensors ?? []).map((s) => [s.id, s.custom_name ?? s.id]),
          )}
        />

        {/* Telemetry panel — sensor readings from /api/v1/dirigera/telemetry */}
        <DirigeraTelemetryPanel
          items={telemetry.items}
          total={telemetry.total}
          loading={telemetry.loading}
          isLoadingMore={telemetry.isLoadingMore}
          error={telemetry.error}
          stale={telemetry.stale}
          loadMore={telemetry.loadMore}
        />
      </div>
    </PageLayout>
  );
}
