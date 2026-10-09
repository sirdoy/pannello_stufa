'use client';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import InfoBox from '@/app/components/ui/InfoBox';
import Text from '@/app/components/ui/Text';
import type { WanData } from '@/app/components/devices/network/types';
import CopyableIp from './CopyableIp';
import { Clock, Globe, Link, Server } from 'lucide-react';

interface WanStatusCardProps {
  wan: WanData | null;
  isStale: boolean;
  lastUpdated: number | null;
}

/**
 * Formats uptime seconds into human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}g ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * WanStatusCard Component
 *
 * Displays WAN connection status with:
 * - Status banner (online/offline with colored background)
 * - External IP with copy-to-clipboard
 * - Uptime, Gateway, DNS, Connection Type in InfoBox grid
 */
export default function WanStatusCard({ wan, isStale, lastUpdated }: WanStatusCardProps) {
  if (!wan) {
    return null;
  }

  const statusBgClass = wan.connected
    ? 'bg-sage-500/20 border border-sage-500/40'
    : 'bg-danger-500/20 border border-danger-500/40';

  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      {/* Status Banner */}
      <div className={`${statusBgClass} flex items-center justify-between rounded-lg p-3`}>
        <Badge variant={wan.connected ? 'sage' : 'danger'}>
          {wan.connected ? 'WAN Online' : 'WAN Offline'}
        </Badge>
        {isStale && lastUpdated && (
          <Text variant="label" size="sm">
            Aggiornato {formatDistanceToNow(lastUpdated, { locale: it, addSuffix: true })}
          </Text>
        )}
      </div>

      {/* External IP Section */}
      <div className="space-y-2">
        <Text variant="label" size="sm">
          IP Esterno
        </Text>
        <CopyableIp ip={wan.externalIp || 'N/A'} />
      </div>

      {/* InfoBox Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon={<Clock size={18} />}
          label="Uptime"
          value={formatUptime(wan.uptime)}
          variant="sage"
        />
        <InfoBox
          icon={<Globe size={18} />}
          label="Gateway"
          value={wan.gateway || 'N/A'}
          variant="ocean"
        />
        <InfoBox
          icon={<Server size={18} />}
          label="DNS"
          value={wan.dns || 'Auto'}
          variant="ocean"
        />
        <InfoBox
          icon={<Link size={18} />}
          label="Tipo"
          value={wan.connectionType || 'DHCP'}
          variant="neutral"
        />
      </div>
    </Card>
  );
}
