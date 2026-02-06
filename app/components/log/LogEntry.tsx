import Image from 'next/image';
import Text from '@/app/components/ui/Text';
import StatusBadge from '@/app/components/ui/StatusBadge';
import type { ReactNode } from 'react';

interface LogUser {
  name?: string;
  email?: string;
  picture?: string;
}

interface DeviceBadge {
  label: string;
  icon?: string;
  color: 'primary' | 'info' | 'warning' | 'success' | 'neutral';
}

interface LogEntryData {
  action: string;
  device?: string;
  value?: string | number | null;
  user?: LogUser;
  timestamp: number | string;
  day?: string;
  roomName?: string;
}

export interface LogEntryProps {
  entry: LogEntryData;
  formatDate: (timestamp: number | string) => string;
  getIcon: (action: string, device?: string) => ReactNode;
  getDeviceBadge?: (device?: string) => DeviceBadge | null;
}

export default function LogEntry({ entry, formatDate, getIcon, getDeviceBadge }: LogEntryProps) {
  const deviceBadge = getDeviceBadge ? getDeviceBadge(entry.device) : null;

  // Map device colors to StatusBadge colors
  const badgeColorMap: Record<string, 'ember' | 'ocean' | 'warning' | 'sage' | 'neutral'> = {
    primary: 'ember',
    info: 'ocean',
    warning: 'warning',
    success: 'sage',
    neutral: 'neutral',
  };

  return (
    <li className="border-b border-slate-700/30 [html:not(.dark)_&]:border-slate-200/60 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0 flex items-start gap-3">
      {/* Icon */}
      <div className="text-2xl mt-0.5 flex-shrink-0">{getIcon(entry.action, entry.device)}</div>

      <div className="flex-1 min-w-0">
        {/* User & Device Badge Row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {/* User Info */}
          {entry.user && (
            <div className="flex items-center gap-2">
              {entry.user.picture && (
                <Image
                  src={entry.user.picture}
                  alt={entry.user.name || entry.user.email || 'User'}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full ring-1 ring-white/10 [html:not(.dark)_&]:ring-black/10"
                />
              )}
              <Text variant="body" weight="semibold" size="sm">
                {entry.user.name || entry.user.email}
              </Text>
            </div>
          )}

          {/* Device Badge */}
          {deviceBadge && (
            <StatusBadge
              status={deviceBadge.label}
              icon={deviceBadge.icon}
              color={badgeColorMap[deviceBadge.color] || 'neutral'}
              size="sm"
            />
          )}
        </div>

        {/* Timestamp */}
        <Text variant="tertiary" size="xs" className="mb-1.5">
          {formatDate(entry.timestamp)}
        </Text>

        {/* Action */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <Text variant="body" weight="medium">
            {entry.action}
          </Text>
          {entry.value !== undefined && entry.value !== null && (
            <Text variant="ember" weight="semibold">
              → {entry.value}
            </Text>
          )}
        </div>

        {/* Optional Metadata */}
        {(entry.day || entry.roomName) && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {entry.day && (
              <Text variant="tertiary" size="xs">
                📅 Giorno: <Text as="span" variant="secondary" size="xs" weight="medium">{entry.day}</Text>
              </Text>
            )}
            {entry.roomName && (
              <Text variant="tertiary" size="xs">
                🏠 Stanza: <Text as="span" variant="secondary" size="xs" weight="medium">{entry.roomName}</Text>
              </Text>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
