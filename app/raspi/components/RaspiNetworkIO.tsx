'use client';

import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import InfoBox from '@/app/components/ui/InfoBox';
import Text from '@/app/components/ui/Text';
import type { RaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

interface RaspiNetworkIOProps {
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
 * RaspiNetworkIO - Network bytes sent/received card for /raspi page
 */
export default function RaspiNetworkIO({ data }: RaspiNetworkIOProps) {
  if (!data) return null;

  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      <Heading level={3}>Rete</Heading>
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon="⬆️"
          label="Inviati"
          value={formatBytes(data.networkBytesSent)}
          variant="sage"
        />
        <InfoBox
          icon="⬇️"
          label="Ricevuti"
          value={formatBytes(data.networkBytesRecv)}
          variant="ocean"
        />
      </div>
      <Text variant="secondary" size="sm">
        Interfaccia: {data.networkInterface}
      </Text>
    </Card>
  );
}
