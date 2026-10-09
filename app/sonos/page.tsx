'use client';

import { useState } from 'react';
import PageLayout from '@/app/components/ui/PageLayout';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { Banner } from '@/app/components/ui';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import SonosZoneSection from '@/app/components/devices/sonos/components/SonosZoneSection';
import SonosHistoryChart from '@/app/components/devices/sonos/components/SonosHistoryChart';
import { sortZonesPlayingFirst } from '@/lib/sonos/sortZones';

/**
 * /sonos page — Zone-based playback controls and per-speaker volume sliders
 *
 * Orchestrator pattern:
 * - useSonosFullData handles polling for zones + playback + volumes + eqData + homeTheaterData
 * - useSonosCommands handles transport + volume/mute + extended mutations
 * - SonosZoneSection renders each zone with now-playing, controls, speakers
 * - SonosHistoryChart renders below all zones with volume/playback history
 * - Loading skeleton on initial load before data arrives
 */
export default function SonosPage() {
  const { data, loading, stale, error, fetchData, applyMutation } = useSonosFullData();
  const [commandError, setCommandError] = useState<string | null>(null);
  const commands = useSonosCommands({ fetchData, applyMutation, setError: setCommandError });

  // Loading guard — only on initial load (no cached data)
  if (loading && !data) {
    return (
      <PageLayout header={<PageLayout.Header title="Sonos" backHref="/altro" />}>
        <div className="space-y-6">
          <Skeleton className="h-50 rounded-2xl" />
          <Skeleton className="h-50 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<PageLayout.Header title="Sonos" backHref="/altro" />}>
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
        {/* ROADMAP M18: playing zones first */}
        {data && sortZonesPlayingFirst(data.zones, data.playback).map(zone => (
          <SonosZoneSection
            key={zone.group_id}
            zone={zone}
            playback={data.playback[zone.group_id]}
            volumes={data.volumes}
            playMode={data.playModes[zone.group_id]}
            sleepTimer={data.sleepTimers[zone.group_id]}
            commands={commands}
            eqData={data.eqData}
            homeTheaterData={data.homeTheaterData}
            allZones={data.zones}
          />
        ))}

        {/* History section — below all zones per D-23 */}
        {data && data.zones.length > 0 && (
          <SonosHistoryChart
            zones={data.zones}
            speakers={[...new Set(data.zones.flatMap(z => z.members))].map(m => ({ uid: m.uid, name: m.name }))}
          />
        )}
      </div>
    </PageLayout>
  );
}
