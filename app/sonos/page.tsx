'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/app/components/ui/PageLayout';
import Skeleton from '@/app/components/ui/Skeleton';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { Banner } from '@/app/components/ui';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import SonosZoneSection from '@/app/components/devices/sonos/components/SonosZoneSection';

/**
 * /sonos page — Zone-based playback controls and per-speaker volume sliders
 *
 * Orchestrator pattern:
 * - useSonosFullData handles polling for zones + playback + volumes
 * - useSonosCommands handles transport + volume/mute mutations
 * - SonosZoneSection renders each zone with now-playing, controls, speakers
 * - Loading skeleton on initial load before data arrives
 */
export default function SonosPage() {
  const router = useRouter();
  const { data, loading, stale, error, fetchData } = useSonosFullData();
  const [commandError, setCommandError] = useState<string | null>(null);
  const commands = useSonosCommands({ fetchData, setError: setCommandError });

  // Loading guard — only on initial load (no cached data)
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
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
                <Heading level={1} size="2xl">Sonos</Heading>
              </div>
            </div>
          </div>
        </PageLayout.Header>
      }
    >
      <div className="space-y-6">
        {/* Stale banner — shows when data exists but latest fetch failed */}
        {stale && <Banner variant="warning" title="Dati non aggiornati" compact={true} />}

        {/* Command error banner */}
        {commandError && <Banner variant="warning" title={commandError} compact={true} />}

        {/* Error state — no data at all */}
        {error && !data && <Text variant="secondary">{error}</Text>}

        {/* Empty state */}
        {data?.zones.length === 0 && (
          <Text variant="secondary">Nessuna zona Sonos trovata</Text>
        )}

        {/* Zone sections */}
        {data?.zones.map(zone => (
          <SonosZoneSection
            key={zone.group_id}
            zone={zone}
            playback={data.playback[zone.group_id]}
            volumes={data.volumes}
            commands={commands}
          />
        ))}
      </div>
    </PageLayout>
  );
}
