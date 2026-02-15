'use client';

import { Badge } from '@/app/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface DeviceStatusBadgeProps {
  active: boolean;
  lastSeen?: number; // Unix timestamp ms
}

/**
 * DeviceStatusBadge Component
 *
 * Displays online/offline status with optional "last seen" timestamp for offline devices.
 * Uses Italian locale for date formatting.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.active - Whether the device is currently online
 * @param {number} [props.lastSeen] - Unix timestamp in ms when device was last seen (offline only)
 *
 * @example
 * // Online device
 * <DeviceStatusBadge active={true} />
 *
 * @example
 * // Offline device with last seen
 * <DeviceStatusBadge active={false} lastSeen={Date.now() - 3600000} />
 *
 * @example
 * // Offline device never connected
 * <DeviceStatusBadge active={false} />
 */
export function DeviceStatusBadge({ active, lastSeen }: DeviceStatusBadgeProps) {
  // Online state: simple badge
  if (active) {
    return <Badge variant="sage" size="sm">Online</Badge>;
  }

  // Offline state: badge + last seen text
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="danger" size="sm">Offline</Badge>
      {lastSeen ? (
        <span className="text-xs text-slate-400">
          Visto {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: it })}
        </span>
      ) : (
        <span className="text-xs text-slate-500">Mai connesso</span>
      )}
    </div>
  );
}

export default DeviceStatusBadge;
