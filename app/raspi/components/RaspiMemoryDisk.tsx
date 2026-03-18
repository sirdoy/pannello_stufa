'use client';

import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import InfoBox from '@/app/components/ui/InfoBox';
import Text from '@/app/components/ui/Text';
import type { RaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

interface RaspiMemoryDiskProps {
  data: RaspiFullData | null;
  isStale: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${(bytes / 1_024).toFixed(0)} KB`;
}

/**
 * RaspiMemoryDisk - Memory and disk usage card for /raspi page
 */
export default function RaspiMemoryDisk({ data }: RaspiMemoryDiskProps) {
  if (!data) return null;

  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      <Heading level={3}>Memoria e Disco</Heading>
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon="📊"
          label="RAM"
          value={`${data.memoryPercent.toFixed(1)}%`}
          variant="ocean"
        />
        <InfoBox
          icon="💾"
          label="Disco"
          value={`${data.diskPercent.toFixed(1)}%`}
          variant="neutral"
        />
      </div>
      <div className="space-y-1">
        <Text variant="secondary" size="sm">
          RAM: {formatBytes(data.memoryUsedBytes)} / {formatBytes(data.memoryTotalBytes)}
        </Text>
        <Text variant="secondary" size="sm">
          Disco: {formatBytes(data.diskUsedBytes)} / {formatBytes(data.diskTotalBytes)}
        </Text>
      </div>
    </Card>
  );
}
