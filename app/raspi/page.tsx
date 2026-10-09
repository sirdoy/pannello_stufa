'use client';

import PageLayout from '@/app/components/ui/PageLayout';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { Banner } from '@/app/components/ui';
import { useRaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';
import RaspiCpuTemp from './components/RaspiCpuTemp';
import RaspiMemoryDisk from './components/RaspiMemoryDisk';
import RaspiSystemInfo from './components/RaspiSystemInfo';
import RaspiNetworkIO from './components/RaspiNetworkIO';

/**
 * /raspi page — Full Raspberry Pi system stats
 *
 * Orchestrator pattern:
 * - useRaspiFullData handles polling and data fetching
 * - 4 presentational components render UI sections
 * - Loading skeleton shows on initial load before data arrives
 */
export default function RaspiPage() {
  const { data, loading, stale, error } = useRaspiFullData();

  // Loading guard — only on initial load (no cached data)
  if (loading && !data) {
    return (
      <PageLayout header={<PageLayout.Header title="Raspberry Pi" backHref="/altro" />}>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-50 rounded-2xl" />
          <Skeleton className="h-55 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<PageLayout.Header title="Raspberry Pi" backHref="/altro" />}>
      <div className="space-y-6">
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && (
          <Banner variant="warning" title="Dati non aggiornati" compact={true} />
        )}

        {/* Error state — no data at all */}
        {error && !data && (
          <Text variant="secondary">{error}</Text>
        )}

        {/* Stat sections */}
        <RaspiCpuTemp data={data} isStale={stale} />
        <RaspiMemoryDisk data={data} isStale={stale} />
        <RaspiSystemInfo data={data} isStale={stale} />
        <RaspiNetworkIO data={data} isStale={stale} />
      </div>
    </PageLayout>
  );
}
