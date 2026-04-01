'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/app/components/ui/PageLayout';
import Skeleton from '@/app/components/ui/Skeleton';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { Banner } from '@/app/components/ui';
import { cn } from '@/lib/utils/cn';
import { useDirigeraFullData } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import type { SensorFilter } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import DirigeraHealthSection from '@/app/components/devices/dirigera/components/DirigeraHealthSection';
import DirigeraSensorList from '@/app/components/devices/dirigera/components/DirigeraSensorList';

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
  const router = useRouter();
  const [filter, setFilter] = useState<SensorFilter>('all');
  const { data, loading, stale, error } = useDirigeraFullData(filter);

  // Loading guard — only on initial load or filter change (no cached data)
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-[80px] rounded-2xl" />
        <Skeleton className="h-[48px] rounded-lg" />
        <Skeleton className="h-[180px] rounded-2xl" />
      </div>
    );
  }

  return (
    <PageLayout
      header={
        <PageLayout.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                ← Indietro
              </Button>
              <div>
                <Heading level={1} size="2xl">DIRIGERA</Heading>
              </div>
            </div>
          </div>
        </PageLayout.Header>
      }
    >
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

        {/* Filter segmented control */}
        <div className="flex rounded-lg border border-slate-700/50 overflow-hidden">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-ocean-600/80 text-white'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sensor list */}
        {data && <DirigeraSensorList sensors={data.sensors} filter={filter} />}
      </div>
    </PageLayout>
  );
}
