'use client';

import type React from 'react';
import { forwardRef, useState, useCallback } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

type SliderPrimitivePropsBase = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export type SliderProps = Omit<SliderPrimitivePropsBase, 'value' | 'defaultValue' | 'onValueChange' | 'min' | 'max' | 'step' | 'disabled'> &
  VariantProps<typeof rangeVariants> & {
    /** Current value (number for single, array for range) */
    value?: number | number[];
    /** Initial value */
    defaultValue?: number | number[];
    /** Callback with new value */
    onValueChange?: (value: number | number[]) => void;
    /** Alias for onValueChange (simpler API) */
    onChange?: (value: number | number[]) => void;
    /** Minimum value (default: 0) */
    min?: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Step increment (default: 1) */
    step?: number;
    /** Disabled state */
    disabled?: boolean;
    /** Enable dual-thumb range selection */
    range?: boolean;
    /** Show value tooltip while dragging */
    showTooltip?: boolean;
  };

/**
 * Slider Component - Ember Noir Design System
 *
 * Accessible range slider built on Radix UI Slider primitive.
 * Supports single value, range mode, and optional tooltip.
 */

// Range fill variants
const rangeVariants = cva(
  'absolute h-full rounded-full',
  {
    variants: {
      variant: {
        ember: 'bg-gradient-to-r from-ember-500 to-flame-500',
        ocean: 'bg-gradient-to-r from-ocean-500 to-ocean-600',
        sage: 'bg-gradient-to-r from-sage-500 to-sage-600',
      },
    },
    defaultVariants: {
      variant: 'ember',
    },
  }
);

// Thumb variants (border color matches range)
const thumbVariants = cva(
  cn(
    'block h-5 w-5 rounded-full bg-white shadow-lg',
    'border-2',
    'transition-transform duration-150',
    'hover:scale-110',
    'active:scale-95',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  ),
  {
    variants: {
      variant: {
        ember: 'border-ember-500 focus-visible:ring-ember-500/50',
        ocean: 'border-ocean-500 focus-visible:ring-ocean-500/50',
        sage: 'border-sage-500 focus-visible:ring-sage-500/50',
      },
    },
    defaultVariants: {
      variant: 'ember',
    },
  }
);

const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  {
    value: valueProp,
    defaultValue: defaultValueProp,
    onValueChange,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    range = false,
    showTooltip = false,
    disabled = false,
    variant = 'ember',
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  },
  ref
) {
  // Track dragging state for tooltip
  const [isDragging, setIsDragging] = useState(false);

  // Track internal value for tooltip display
  const [internalValue, setInternalValue] = useState(() => {
    // Convert to array format for Radix
    if (valueProp !== undefined) {
      return Array.isArray(valueProp) ? valueProp : [valueProp];
    }
    if (defaultValueProp !== undefined) {
      return Array.isArray(defaultValueProp) ? defaultValueProp : [defaultValueProp];
    }
    // Default: range mode starts with full range, single starts at min
    return range ? [min, max] : [min];
  });

  // Convert value to array format for Radix
  const normalizedValue = valueProp !== undefined
    ? (Array.isArray(valueProp) ? valueProp : [valueProp])
    : undefined;

  // For defaultValue: use provided value, or for range mode without value, use [min, max]
  const normalizedDefaultValue = (() => {
    if (valueProp !== undefined) return undefined; // Controlled mode, no defaultValue
    if (defaultValueProp !== undefined) {
      return Array.isArray(defaultValueProp) ? defaultValueProp : [defaultValueProp];
    }
    // No value props - use defaults based on range mode
    return range ? [min, max] : undefined;
  })();

  // Handle value change - unwrap for single-thumb mode
  const handleValueChange = useCallback((values: number[]) => {
    setInternalValue(values);

    // Call appropriate callback
    const callback = onValueChange || onChange;
    if (callback) {
      // For single-thumb, return just the number
      // For range mode, return the array
      if (range) {
        callback(values);
      } else {
        const firstValue = values[0];
        if (firstValue !== undefined) {
          callback(firstValue);
        }
      }
    }
  }, [range, onValueChange, onChange]);

  // Track dragging for tooltip
  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get display values for tooltips
  const displayValues = valueProp !== undefined ? normalizedValue : internalValue;

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Track */}
      <SliderPrimitive.Track
        className={cn(
          'relative h-2 w-full grow overflow-hidden rounded-full',
          'bg-slate-700',
          '[html:not(.dark)_&]:bg-slate-200'
        )}
      >
        {/* Range fill */}
        <SliderPrimitive.Range className={rangeVariants({ variant })} />
      </SliderPrimitive.Track>

      {/* Thumb(s) - aria-label must be on thumb for accessibility */}
      {(range ? [0, 1] : [0]).map((index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={range ? `${ariaLabel} ${index === 0 ? 'minimum' : 'maximum'}` : ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={thumbVariants({ variant })}
        >
          {/* Tooltip */}
          {showTooltip && isDragging && displayValues && (
            <div
              className={cn(
                'absolute left-1/2 -translate-x-1/2 -top-8',
                'bg-slate-800 px-2 py-1 rounded text-xs text-white',
                'whitespace-nowrap pointer-events-none',
                '[html:not(.dark)_&]:bg-slate-900'
              )}
            >
              {displayValues[index]}
            </div>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});

export default Slider;
