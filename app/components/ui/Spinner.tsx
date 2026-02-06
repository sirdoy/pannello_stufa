'use client';

import type { SVGAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Spinner CVA variants for external styling access
 */
export const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        ember: 'text-ember-500',
        white: 'text-white',
        current: 'text-current',
        muted: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'ember',
    },
  }
);

/**
 * Spinner Component Props
 */
export interface SpinnerProps extends Omit<SVGAttributes<SVGSVGElement>, 'size'>, VariantProps<typeof spinnerVariants> {
  label?: string;
}

/**
 * Spinner - Animated loading indicator
 *
 * Accessible SVG spinner with customizable size and color variants.
 * Uses CSS animation for smooth rotation.
 *
 * @param {Object} props - Component props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} props.size - Spinner size
 * @param {'ember'|'white'|'current'|'muted'} props.variant - Color variant
 * @param {string} props.label - Accessible label for screen readers
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * // Default ember spinner
 * <Spinner size="lg" variant="ember" />
 *
 * @example
 * // Inside a button with inherited color
 * <Button disabled><Spinner size="sm" variant="current" /> Loading...</Button>
 */
export default function Spinner({
  size,
  variant,
  className,
  label = 'Loading',
  ...props
}: SpinnerProps) {
  return (
    <svg
      className={cn(spinnerVariants({ size, variant }), className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
      {...props}
    >
      {/* Background circle */}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* Spinning arc */}
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { Spinner };
