'use client';

import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
import type { BandwidthTier } from '../hooks/useFritzBandwidthTiers';

interface HistoryTierToggleProps {
  value: BandwidthTier;
  onChange: (tier: BandwidthTier) => void;
}

const tiers: { value: BandwidthTier; label: string }[] = [
  { value: 'realtime', label: 'Tempo reale' },
  { value: 'hourly', label: 'Orario' },
  { value: 'daily', label: 'Giornaliero' },
  { value: 'auto', label: 'Auto' },
];

/**
 * HistoryTierToggle Component
 *
 * Button group for selecting bandwidth data tier (real-time, hourly, daily).
 * Active button uses ember variant, inactive buttons use subtle variant.
 * Mirrors TimeRangeSelector pattern.
 */
export default function HistoryTierToggle({ value, onChange }: HistoryTierToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Text variant="secondary" size="sm">
        Dati:
      </Text>
      <Button.Group>
        {tiers.map((tier) => (
          <Button
            key={tier.value}
            variant={value === tier.value ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => onChange(tier.value)}
          >
            {tier.label}
          </Button>
        ))}
      </Button.Group>
    </div>
  );
}
