'use client';

import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Divider Variants - CVA Configuration
 *
 * Variant: solid, dashed, gradient
 * Spacing: small, medium, large (applied via wrapper based on orientation)
 */
const dividerVariants = cva(
  // Base classes (minimal - most styling per orientation)
  '',
  {
    variants: {
      variant: {
        solid: [
          'bg-slate-700',
          '[html:not(.dark)_&]:bg-slate-300',
        ],
        dashed: [
          'border-dashed border-slate-600 bg-transparent',
          '[html:not(.dark)_&]:border-slate-300',
        ],
        gradient: [
          'bg-gradient-to-r from-transparent via-slate-600/50 to-transparent',
          '[html:not(.dark)_&]:via-slate-300/60',
        ],
      },
    },
    defaultVariants: {
      variant: 'solid',
    },
  }
);

/**
 * Spacing classes by orientation
 */
const spacingClasses = {
  horizontal: {
    small: 'my-4',
    medium: 'my-6',
    large: 'my-8',
  },
  vertical: {
    small: 'mx-4',
    medium: 'mx-6',
    large: 'mx-8',
  },
};

/**
 * Divider Component Props
 */
export interface DividerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof dividerVariants> {
  label?: string;
  spacing?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Divider Component - Ember Noir Design System
 *
 * Visual separator with optional label and variant styles.
 * Supports horizontal and vertical orientations.
 *
 * @param {Object} props
 * @param {string} props.label - Optional label text (horizontal only)
 * @param {'solid'|'dashed'|'gradient'} props.variant - Visual variant
 * @param {'small'|'medium'|'large'} props.spacing - Margin around divider
 * @param {'horizontal'|'vertical'} props.orientation - Direction
 * @param {string} props.className - Additional classes
 *
 * @example
 * <Divider label="Section" variant="gradient" spacing="large" />
 */
const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  {
    label,
    variant = 'solid',
    spacing = 'medium',
    orientation = 'horizontal',
    className,
    ...props
  },
  ref
) {
  const spacingClass = spacingClasses[orientation]?.[spacing] || spacingClasses[orientation]?.medium;

  // Dashed variant uses border instead of bg
  const isDashed = variant === 'dashed';
  const lineClasses = cn(
    dividerVariants({ variant }),
    isDashed ? 'border-t-2' : ''
  );

  // Vertical orientation
  if (orientation === 'vertical') {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn(spacingClass, className)}
        {...props}
      >
        <div className={cn('w-px h-full', lineClasses)} />
      </div>
    );
  }

  // Horizontal with label
  if (label) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn('relative', spacingClass, className)}
        {...props}
      >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className={cn('w-full h-px', lineClasses)} />
        </div>
        <div className="relative flex justify-center">
          <span className={cn(
            'px-4 py-1.5 backdrop-blur-xl font-semibold font-display text-xs uppercase tracking-[0.15em] rounded-full',
            'bg-slate-800/80 text-slate-300 border border-slate-700/50',
            '[html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-200'
          )}>
            {label}
          </span>
        </div>
      </div>
    );
  }

  // Horizontal without label
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cn(spacingClass, className)}
      {...props}
    >
      <div className={cn('w-full h-px', lineClasses)} />
    </div>
  );
});

Divider.displayName = 'Divider';

export { Divider, dividerVariants };
export default Divider;
