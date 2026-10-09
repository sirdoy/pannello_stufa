'use client';
import { Button, Text } from '@/app/components/ui';
import { Minus, Plus } from 'lucide-react';
import { tempToColor } from '@/lib/utils/scheduleHelpers';

interface TemperaturePickerProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * TemperaturePicker - Temperature selector with +/- buttons
 */
export default function TemperaturePicker({
  value,
  onChange,
  min = 5,
  max = 30,
  step = 0.5,
}: TemperaturePickerProps) {
  const decrease = (): void => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increase = (): void => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const bgColor = tempToColor(value);

  return (
    <div className="space-y-3">
      <Text variant="label" size="sm">Temperatura</Text>

      <div className="flex items-center justify-center gap-4">
        {/* Decrease button */}
        <Button
          variant="subtle"
          size="lg"
          onClick={decrease}
          disabled={value <= min}
          className="size-14 rounded-full p-0"
          aria-label="Diminuisci temperatura"
        >
          <Minus size={24} />
        </Button>

        {/* Temperature display */}
        <div
          className="
            flex size-28 flex-col
            items-center justify-center rounded-full shadow-lg
            transition-colors duration-300
          "
          style={{ backgroundColor: bgColor }}
        >
          <span className="text-3xl font-bold text-white drop-shadow">
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-white/80">°C</span>
        </div>

        {/* Increase button */}
        <Button
          variant="subtle"
          size="lg"
          onClick={increase}
          disabled={value >= max}
          className="size-14 rounded-full p-0"
          aria-label="Aumenta temperatura"
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* Min/max labels */}
      <Text as="div" variant="tertiary" size="xs" className="flex justify-between px-4">
        <span>{min}°C</span>
        <span>{max}°C</span>
      </Text>
    </div>
  );
}
