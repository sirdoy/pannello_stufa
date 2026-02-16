'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale/it';
import { Card, Heading, Text, Select } from '@/app/components/ui';
import type { DeviceEvent, DeviceHistoryTimeRange, DeviceData, BandwidthTimeRange } from '@/app/components/devices/network/types';
import TimeRangeSelector from './TimeRangeSelector';
import DeviceEventItem from './DeviceEventItem';

interface DeviceHistoryTimelineProps {
  events: DeviceEvent[];
  isLoading: boolean;
  isEmpty: boolean;
  timeRange: DeviceHistoryTimeRange;
  onTimeRangeChange: (range: DeviceHistoryTimeRange) => void;
  deviceFilter: string | null;
  onDeviceFilterChange: (mac: string | null) => void;
  devices: DeviceData[];
}

interface GroupedEvents {
  date: string;
  dateLabel: string;
  events: DeviceEvent[];
}

/**
 * DeviceHistoryTimeline Component
 *
 * Displays device connection/disconnection events in a vertical timeline.
 * Features:
 * - Date-grouped events with Italian locale headers
 * - Device filter dropdown
 * - Time range selector (1h, 24h, 7d)
 * - Loading and empty states
 */
export default function DeviceHistoryTimeline({
  events,
  isLoading,
  isEmpty,
  timeRange,
  onTimeRangeChange,
  deviceFilter,
  onDeviceFilterChange,
  devices,
}: DeviceHistoryTimelineProps) {
  // Group events by date
  const groupedEvents = useMemo<GroupedEvents[]>(() => {
    if (events.length === 0) {
      return [];
    }

    const groups: Record<string, DeviceEvent[]> = {};

    events.forEach((event) => {
      const dateKey = format(event.timestamp, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    // Convert to array and add formatted labels
    return Object.entries(groups)
      .map(([date, dateEvents]) => ({
        date,
        dateLabel: format(new Date(date), 'EEEE, d MMMM yyyy', { locale: it }),
        events: dateEvents,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
  }, [events]);

  // Device filter options
  const deviceOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Tutti i dispositivi' },
      ...devices
        .filter((device) => device.mac)
        .map((device) => ({
          value: device.mac,
          label: device.name || device.mac,
        })),
    ];
  }, [devices]);

  const handleDeviceFilterChange = (event: { target: { value: string | number } }) => {
    const value = event.target.value;
    onDeviceFilterChange(value === 'all' ? null : String(value));
  };

  return (
    <Card variant="elevated" className="p-4 sm:p-6">
      {/* Header with title and controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Heading level={2} size="xl">
            Cronologia Dispositivi
          </Heading>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time range selector */}
            <TimeRangeSelector
              value={timeRange as BandwidthTimeRange}
              onChange={(range) => onTimeRangeChange(range as DeviceHistoryTimeRange)}
            />

            {/* Device filter */}
            <Select
              options={deviceOptions}
              value={deviceFilter ?? 'all'}
              onChange={handleDeviceFilterChange}
              placeholder="Filtra per dispositivo"
              className="min-w-48"
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div>
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8">
            <Text variant="secondary">Caricamento cronologia...</Text>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && isEmpty && (
          <div className="text-center py-12">
            <Text variant="secondary" size="lg">
              Nessun evento nel periodo selezionato
            </Text>
          </div>
        )}

        {/* Timeline with grouped events */}
        {!isLoading && !isEmpty && (
          <div className="space-y-6">
            {groupedEvents.map((group) => (
              <div key={group.date}>
                {/* Sticky date header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm py-2 mb-2 z-10">
                  <Text size="sm" weight="semibold" className="text-slate-300">
                    {group.dateLabel}
                  </Text>
                </div>

                {/* Timeline events with vertical line */}
                <div className="pl-6 border-l-2 border-white/10 space-y-1">
                  {group.events.map((event, index) => (
                    <DeviceEventItem
                      key={`${event.deviceMac}-${event.timestamp}-${index}`}
                      event={event}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
