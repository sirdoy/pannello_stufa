'use client';

import Text from '@/app/components/ui/Text';
import TimeRangeSelector from './TimeRangeSelector';
import RawBandwidthTable from './RawBandwidthTable';
import DevicePresenceTable from './DevicePresenceTable';
import RawDeviceEventsTable from './RawDeviceEventsTable';
import type { useFritzBandwidthHistoryRaw } from '../hooks/useFritzBandwidthHistoryRaw';
import type { useFritzDevicePresenceHistory } from '../hooks/useFritzDevicePresenceHistory';
import type { useFritzDeviceEventsRaw } from '../hooks/useFritzDeviceEventsRaw';

const HOURS_LABEL: Record<'1h' | '24h' | '7d', string> = {
  '1h': 'ora',
  '24h': '24 ore',
  '7d': '7 giorni',
};

export interface RawHistoryTabProps {
  bandwidth: ReturnType<typeof useFritzBandwidthHistoryRaw>;
  presence: ReturnType<typeof useFritzDevicePresenceHistory>;
  events: ReturnType<typeof useFritzDeviceEventsRaw>;
  hours: '1h' | '24h' | '7d';
  onHoursChange: (h: '1h' | '24h' | '7d') => void;
}

/**
 * RawHistoryTab
 *
 * Container for the /network "Storico grezzo" tab. Orchestrates three
 * presentational tables driven by a shared TimeRangeSelector.
 *
 * All three child hooks are owned by the parent page and receive
 * `paused: activeTab !== 'storico'` (D-10 lazy-load). Changing the time
 * range resets pagination on each sub-section via each hook's internal
 * hours-change effect.
 */
export default function RawHistoryTab({
  bandwidth,
  presence,
  events,
  hours,
  onHoursChange,
}: RawHistoryTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Text variant="tertiary" size="sm">
          Dati storici non aggregati forniti dal Fritz!Box (ultime {HOURS_LABEL[hours]}).
        </Text>
        <TimeRangeSelector value={hours} onChange={onHoursChange} />
      </div>

      <RawBandwidthTable
        items={bandwidth.items}
        loading={bandwidth.loading}
        stale={bandwidth.stale}
        totalCount={bandwidth.totalCount}
        page={bandwidth.page}
        onPageChange={bandwidth.setPage}
      />

      <DevicePresenceTable
        items={presence.items}
        loading={presence.loading}
        stale={presence.stale}
        notFound={presence.notFound}
        totalCount={presence.totalCount}
        page={presence.page}
        onPageChange={presence.setPage}
      />

      <RawDeviceEventsTable
        items={events.items}
        loading={events.loading}
        stale={events.stale}
        totalCount={events.totalCount}
        page={events.page}
        onPageChange={events.setPage}
      />
    </div>
  );
}
