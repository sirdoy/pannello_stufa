'use client';

import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import InfoBox from '@/app/components/ui/InfoBox';
import type { RaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

interface RaspiSystemInfoProps {
  data: RaspiFullData | null;
  isStale: boolean;
}

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
 * RaspiSystemInfo - Uptime, load averages, and process count card for /raspi page
 */
export default function RaspiSystemInfo({ data }: RaspiSystemInfoProps) {
  if (!data) return null;

  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      <Heading level={3}>Sistema</Heading>
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon="⏱️"
          label="Uptime"
          value={formatUptime(data.uptimeSeconds)}
          variant="sage"
        />
        <InfoBox
          icon="⚡"
          label="Processi"
          value={String(data.processCount)}
          variant="neutral"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <InfoBox
          icon="📊"
          label="Load 1m"
          value={data.loadAvg1.toFixed(2)}
          variant="ocean"
        />
        <InfoBox
          icon="📊"
          label="Load 5m"
          value={data.loadAvg5.toFixed(2)}
          variant="ocean"
        />
        <InfoBox
          icon="📊"
          label="Load 15m"
          value={data.loadAvg15.toFixed(2)}
          variant="ocean"
        />
      </div>
    </Card>
  );
}
