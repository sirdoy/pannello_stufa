'use client';
import { Button, Text } from '@/app/components/ui';
import { Minus, Plus } from 'lucide-react';
import { tempToColor } from '@/lib/utils/scheduleHelpers';

/**
 * TemperaturePicker - Temperature selector with +/- buttons
 *
 * @param {number} value - Temperature in °C
 * @param {Function} onChange - Called with new temperature
 * @param {number} min - Minimum temperature (default: 5)
 * @param {number} max - Maximum temperature (default: 30)
 * @param {number} step - Step size (default: 0.5)
 */
export default function TemperaturePicker({
  value,
  onChange,
  min = 5,
  max = 30,
  step = 0.5,
}) {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increase = () => {
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
          className="w-14 h-14 rounded-full p-0"
          aria-label="Diminuisci temperatura"
        >
          <Minus size={24} />
        </Button>

        {/* Temperature display */}
        <div
          className="
            w-28 h-28 rounded-full
            flex flex-col items-center justify-center
            shadow-lg transition-colors duration-300
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
          className="w-14 h-14 rounded-full p-0"
          aria-label="Aumenta temperatura"
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-slate-500 px-4">
        <span>{min}°C</span>
        <span>{max}°C</span>
      </div>
    </div>
  );
}
