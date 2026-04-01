'use client';

import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import InfoBox from '@/app/components/ui/InfoBox';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { formatUptime } from '../utils/formatUptime';

interface SystemInfoData {
  model: string;
  firmware_version: string;
  update_available: string;
  device_uptime_seconds: number;
  device_uptime_formatted?: string;
  is_stale?: boolean;
  fetched_at?: string | null;
}

interface SystemInfoCardProps {
  data: SystemInfoData | null;
  loading: boolean;
  stale: boolean;
}

/**
 * SystemInfoCard
 *
 * Displays Fritz!Box system information: model, firmware version (with update badge),
 * and formatted uptime.
 *
 * Shows skeletons while loading, null when no data available.
 */
export default function SystemInfoCard({ data, loading, stale }: SystemInfoCardProps) {
  if (loading) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Text variant="label" size="sm" className="text-slate-400 uppercase tracking-wide">
          Sistema Fritz!Box
        </Text>
        {stale && (
          <Text variant="label" size="xs" className="text-slate-500">
            Dati non aggiornati
          </Text>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InfoBox
          icon="📡"
          label="Modello"
          value={data.model}
          variant="neutral"
        />
        <InfoBox
          icon="🔧"
          label="Firmware"
          value={data.firmware_version}
          variant={data.update_available.length > 0 ? 'warning' : 'neutral'}
        />
        <InfoBox
          icon="🕒"
          label="Uptime"
          value={formatUptime(data.device_uptime_seconds)}
          variant="sage"
        />
      </div>

      {/* Update available badge */}
      {data.update_available.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="ocean" size="sm">
            Aggiornamento disponibile
          </Badge>
          <Text variant="label" size="xs" className="text-slate-400">
            {data.update_available}
          </Text>
        </div>
      )}
    </Card>
  );
}
