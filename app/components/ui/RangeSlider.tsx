'use client';

import { forwardRef, type CSSProperties, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Thumb colour (CSS colour or token). Default: the accent */
  color?: string;
}

/**
 * RangeSlider — compact native range input with the EmberGlass look (workspace ROADMAP M75).
 *
 * The only place, with the sheet primitives, where a native <input type="range"> is written. Use it for
 * dense rows (volume, EQ, seek, duration) where ui/Slider (Radix, tooltip, range mode) is too much; the native
 * input keeps `onChange` / `onMouseUp` / `onTouchEnd` and the phone gestures.
 */
const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(function RangeSlider(
  { color = 'var(--accent)', className, style, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="range"
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
        '[&::-moz-range-thumb]:bg-(--range-color)',
        '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none',
        '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-(--range-color)',
        '[&::-webkit-slider-thumb]:shadow-lg',
        className
      )}
      style={{ '--range-color': color, accentColor: color, ...style } as CSSProperties}
      {...props}
    />
  );
});

export default RangeSlider;
