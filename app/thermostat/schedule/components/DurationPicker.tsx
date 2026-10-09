'use client';
import { formatDuration } from '@/lib/utils/scheduleHelpers';
import { Text } from '@/app/components/ui';
import RangeSlider from '@/app/components/ui/RangeSlider';

interface DurationPickerProps {
  value: number;
  onChange: (newValue: number) => void;
}

/**
 * DurationPicker - Logarithmic slider for 5min to 12 hours
 *
 * Uses logarithmic scale for better UX (more granularity at short durations).
 */
export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  // Logarithmic scale: 5 min to 720 min (12 hours)
  const minLog = Math.log(5);
  const maxLog = Math.log(720);

  const toSlider = (minutes: number): number => {
    return ((Math.log(minutes) - minLog) / (maxLog - minLog)) * 100;
  };

  const fromSlider = (percent: number): number => {
    const raw = Math.exp(minLog + (percent / 100) * (maxLog - minLog));
    // Round to nice values
    if (raw < 15) return Math.round(raw / 5) * 5; // 5-min steps
    if (raw < 60) return Math.round(raw / 15) * 15; // 15-min steps
    return Math.round(raw / 30) * 30; // 30-min steps
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="label" size="sm">Durata</Text>
        <Text variant="body" className="text-ember-400">
          {formatDuration(value)}
        </Text>
      </div>

      <RangeSlider
        min={0}
        max={100}
        step={1}
        value={toSlider(value)}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
        className="[&::-moz-range-thumb]:size-6 [&::-webkit-slider-thumb]:size-6"
        style={{ touchAction: 'none' }}
      />

      {/* Scale markers */}
      <Text as="div" variant="tertiary" size="xs" className="flex justify-between">
        <span>5 min</span>
        <span>30 min</span>
        <span>2h</span>
        <span>6h</span>
        <span>12h</span>
      </Text>
    </div>
  );
}
