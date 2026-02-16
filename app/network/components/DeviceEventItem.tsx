'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale/it';
import { Badge, Text } from '@/app/components/ui';
import type { DeviceEvent } from '@/app/components/devices/network/types';

interface DeviceEventItemProps {
  event: DeviceEvent;
}

/**
 * DeviceEventItem Component
 *
 * Single timeline event row showing device connection/disconnection.
 * Displays:
 * - Timeline dot (green for connected, neutral for disconnected)
 * - Device name with status badge
 * - Device IP, timestamp, and relative time
 */
export default function DeviceEventItem({ event }: DeviceEventItemProps) {
  const isConnected = event.eventType === 'connected';

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Timeline dot */}
      <div
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
          isConnected ? 'bg-sage-400' : 'bg-slate-500'
        }`}
      />

      {/* Event details */}
      <div className="flex-1 min-w-0">
        {/* Device name and status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Text size="sm" weight="medium" className="text-slate-100">
            {event.deviceName}
          </Text>
          <Badge variant={isConnected ? 'sage' : 'neutral'} size="sm">
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </Badge>
        </div>

        {/* Device IP and timestamp */}
        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
          <Text variant="secondary" size="xs" className="font-mono">
            {event.deviceIp}
          </Text>
          <Text variant="secondary" size="xs">
            {format(event.timestamp, 'HH:mm:ss')}
          </Text>
          <Text variant="secondary" size="xs">
            {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: it })}
          </Text>
        </div>
      </div>
    </div>
  );
}
