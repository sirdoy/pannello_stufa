'use client';
import { formatDuration } from '@/lib/utils/scheduleHelpers';
import { Text } from '@/app/components/ui';

/**
 * DurationPicker - Logarithmic slider for 5min to 12 hours
 *
 * Uses logarithmic scale for better UX (more granularity at short durations).
 *
 * @param {number} value - Duration in minutes (5-720)
 * @param {Function} onChange - Called with new duration in minutes
 */
export default function DurationPicker({ value, onChange }) {
  // Logarithmic scale: 5 min to 720 min (12 hours)
  const minLog = Math.log(5);
  const maxLog = Math.log(720);

  const toSlider = (minutes) => {
    return ((Math.log(minutes) - minLog) / (maxLog - minLog)) * 100;
  };

  const fromSlider = (percent) => {
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
        <Text variant="body" weight="bold" className="text-ember-400">
          {formatDuration(value)}
        </Text>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={toSlider(value)}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
        className="
          w-full h-2 rounded-lg appearance-none cursor-pointer
          bg-slate-700 [html:not(.dark)_&]:bg-slate-200

          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-ember-500
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-webkit-slider-thumb]:active:scale-95
          [&::-webkit-slider-thumb]:transition-transform

          [&::-moz-range-thumb]:w-6
          [&::-moz-range-thumb]:h-6
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-ember-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
        "
        style={{ touchAction: 'none' }}
      />

      {/* Scale markers */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>5 min</span>
        <span>30 min</span>
        <span>2h</span>
        <span>6h</span>
        <span>12h</span>
      </div>
    </div>
  );
}
