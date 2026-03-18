'use client';

import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import InfoBox from '@/app/components/ui/InfoBox';
import type { RaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

interface RaspiCpuTempProps {
  data: RaspiFullData | null;
  isStale: boolean;
}

/**
 * RaspiCpuTemp - CPU percentage and temperature card for /raspi page
 */
export default function RaspiCpuTemp({ data }: RaspiCpuTempProps) {
  if (!data) return null;

  const tempValue =
    data.cpuTemperature !== null ? `${data.cpuTemperature.toFixed(1)}°C` : '—';

  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      <Heading level={3}>CPU e Temperatura</Heading>
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon="💻"
          label="CPU"
          value={`${data.cpuPercent.toFixed(1)}%`}
          variant="sage"
        />
        <InfoBox
          icon="🌡️"
          label="Temperatura"
          value={tempValue}
          variant="ember"
        />
      </div>
    </Card>
  );
}
