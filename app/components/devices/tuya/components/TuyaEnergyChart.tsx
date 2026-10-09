'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/app/components/ui/Button';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { useTuyaHistory } from '../hooks/useTuyaHistory';

const TuyaEnergyChartInner = dynamic(() => import('./TuyaEnergyChartInner'), {
  ssr: false,
  loading: () => <Skeleton className="h-50" />,
});

interface TuyaEnergyChartProps {
  deviceId: string;
}

export default function TuyaEnergyChart({ deviceId }: TuyaEnergyChartProps) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const { data, loading, error } = useTuyaHistory(deviceId, period);

  return (
    <div className="mt-3 space-y-3">
      {/* Period selector */}
      <div className="flex gap-1">
        <Button
          variant={period === '24h' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => setPeriod('24h')}
          aria-pressed={period === '24h'}
        >
          24h
        </Button>
        <Button
          variant={period === '7d' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => setPeriod('7d')}
          aria-pressed={period === '7d'}
        >
          7g
        </Button>
        <Button
          variant={period === '30d' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => setPeriod('30d')}
          aria-pressed={period === '30d'}
        >
          30g
        </Button>
      </div>

      {/* Chart area */}
      {loading && (
        <Skeleton className="h-50" data-testid="tuya-energy-loading" />
      )}

      {!loading && error && (
        <Text variant="secondary" size="sm">
          {error}
        </Text>
      )}

      {!loading && !error && data && (
        <TuyaEnergyChartInner
          items={data.items}
          granularity={data.granularity}
        />
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <Text variant="secondary" size="sm">
          Nessun dato disponibile
        </Text>
      )}
    </div>
  );
}
