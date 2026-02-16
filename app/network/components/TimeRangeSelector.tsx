'use client';

import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

interface TimeRangeSelectorProps {
  value: BandwidthTimeRange;
  onChange: (range: BandwidthTimeRange) => void;
}

/**
 * TimeRangeSelector Component
 *
 * Button group for selecting bandwidth chart time range (1h, 24h, 7d).
 * Active button uses ember variant, inactive buttons use subtle variant.
 */
export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges: { value: BandwidthTimeRange; label: string }[] = [
    { value: '1h', label: '1h' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Text variant="secondary" size="sm">
        Intervallo:
      </Text>
      <Button.Group>
        {ranges.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </Button.Group>
    </div>
  );
}
