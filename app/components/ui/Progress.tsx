'use client';

import type React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Progress bar root CVA variants
 */
export const progressVariants = cva(
  [
    'relative overflow-hidden rounded-full',
    'bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200/60',
  ],
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

/**
 * Progress indicator CVA variants
 */
const indicatorVariants = cva(
  [
    'h-full rounded-full transition-all duration-500',
    'bg-gradient-to-r',
  ],
  {
    variants: {
      variant: {
        ember: 'from-ember-400 via-ember-500 to-flame-600',
        ocean: 'from-ocean-400 via-ocean-500 to-ocean-600',
        sage: 'from-sage-400 via-sage-500 to-sage-600',
        warning: 'from-warning-400 via-warning-500 to-warning-600',
        danger: 'from-danger-400 via-danger-500 to-danger-600',
      },
      indeterminate: {
        true: 'animate-progress-indeterminate w-1/3',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'ember',
      indeterminate: false,
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {
  /** Additional CSS classes for indicator */
  indicatorClassName?: string;
  /** Accessible label */
  label?: string;
}

/**
 * Progress - Accessible progress bar with Radix primitive
 *
 * Uses @radix-ui/react-progress for proper ARIA attributes.
 * Supports determinate (with value) and indeterminate (loading) states.
 *
 * @example
 * // Determinate progress
 * <Progress value={75} variant="ember" />
 *
 * @example
 * // Indeterminate loading
 * <Progress indeterminate variant="neutral" />
 *
 * @example
 * // Auto-indeterminate when value undefined
 * <Progress />
 */
const Progress = forwardRef<HTMLDivElement, ProgressProps>(({
  value,
  max = 100,
  size,
  variant,
  indeterminate = false,
  className,
  indicatorClassName,
  label = 'Progress',
  ...props
}, ref) => {
  // If value is undefined or null, treat as indeterminate
  const isIndeterminate = indeterminate || value === undefined || value === null;
  const percentage = isIndeterminate ? null : Math.min(Math.max(value as number, 0), max!);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={isIndeterminate ? null : percentage}
      max={max}
      aria-label={label}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          indicatorVariants({ variant, indeterminate: isIndeterminate }),
          indicatorClassName
        )}
        style={isIndeterminate ? undefined : { width: `${(percentage! / max!) * 100}%` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = 'Progress';

export default Progress;
export { Progress };
