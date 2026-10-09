'use client';

import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import InfoBox from '@/app/components/ui/InfoBox';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { formatUptime } from '../utils/formatUptime';
import { Clock, Router, Wrench } from 'lucide-react';

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
      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Text variant="label" size="sm">
          Sistema Fritz!Box
        </Text>
        {stale && (
          <Text variant="label" size="xs">
            Dati non aggiornati
          </Text>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoBox
          icon={<Router size={18} />}
          label="Modello"
          value={data.model}
          variant="neutral"
        />
        <InfoBox
          icon={<Wrench size={18} />}
          label="Firmware"
          value={data.firmware_version}
          variant={data.update_available.length > 0 ? 'warning' : 'neutral'}
        />
        <InfoBox
          icon={<Clock size={18} />}
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
          <Text variant="label" size="xs">
            {data.update_available}
          </Text>
        </div>
      )}
    </Card>
  );
}
