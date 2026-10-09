'use client';

import type React from 'react';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * ControlButton Variants - CVA Configuration
 *
 * Variants: ember, ocean, sage, warning, danger, subtle
 * Sizes: sm (44px min), md (48px min), lg (56px min) - touch targets
 */
export const controlButtonVariants = cva(
  // Base classes
  [
    'font-display font-black',
    'rounded-xl',
    'transition-colors duration-200',
    'flex items-center justify-center',
    'border-[0.5px]',
    // Focus ring
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    // Active state
    'active:scale-95',
    // Touch optimization
    'touch-manipulation',
    'select-none',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
    'disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // Primary: warm copper/amber
        ember: [
          'border-transparent bg-(--accent) text-[#1a0d06]',
          'hover:brightness-110',
        ],
        // Secondary: muted ocean blue
        ocean: [
          'border-ocean-400/30 bg-ocean-500/20 text-ocean-300',
          'hover:bg-ocean-500/30',
        ],
        // Sage: muted green
        sage: [
          'border-sage-400/30 bg-sage-500/20 text-sage-300',
          'hover:bg-sage-500/30',
        ],
        // Warning: amber
        warning: [
          'border-warning-400/30 bg-warning-500/20 text-warning-300',
          'hover:bg-warning-500/30',
        ],
        // Danger: red
        danger: [
          'border-danger-400/30 bg-danger-500/20 text-danger-300',
          'hover:bg-danger-500/30',
        ],
        // Subtle: glass effect
        subtle: [
          'border-white/14 bg-white/6 text-white',
          'hover:bg-white/10',
        ],
      },
      size: {
        // 44px minimum touch target
        sm: 'h-12 min-h-11 min-w-11 text-2xl',
        // 48px standard
        md: 'h-14 min-h-12 min-w-12 text-3xl',
        // 56px large
        lg: 'h-16 min-h-14 min-w-14 text-3xl sm:h-20 sm:text-4xl',
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'lg',
    },
  }
);

export interface ControlButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'>,
    VariantProps<typeof controlButtonVariants> {
  /** Button type */
  type?: 'increment' | 'decrement';
  /** Called with +step or -step value */
  onChange?: (delta: number) => void;
  /** Step size for increment/decrement (default: 1) */
  step?: number;
  /** @deprecated Use onChange instead */
  onClick?: () => void;
}

/** Tracks functions that have already received the deprecation warning */
const warnedFns = new WeakSet<(...args: unknown[]) => void>();

/**
 * ControlButton Component - Ember Noir Design System
 *
 * Increment/Decrement control button with CVA variants, long-press support,
 * and haptic feedback for continuous value adjustment.
 */
const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(function ControlButton(
  {
    type = 'increment',
    variant = 'ember',
    size = 'lg',
    disabled = false,
    onChange,
    step = 1,
    onClick, // Legacy prop
    className,
    ...props
  },
  ref
) {
  // Handle press - either new onChange API or legacy onClick
  const handlePress = () => {
    if (onClick) {
      // Legacy support - log deprecation warning in dev
      if (process.env.NODE_ENV === 'development' && !warnedFns.has(handlePress)) {
        warnedFns.add(handlePress);
        console.warn(
          '[ControlButton] onClick prop is deprecated. Use onChange(delta) instead.'
        );
      }
      onClick();
    } else if (onChange) {
      const delta = type === 'increment' ? step : -step;
      onChange(delta);
    }
  };

  // Symbol based on type
  const symbol = type === 'increment' ? '+' : '−';

  // Aria label based on type
  const ariaLabel = type === 'increment' ? 'Incrementa' : 'Decrementa';

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(controlButtonVariants({ variant, size }), className)}
      onClick={disabled ? undefined : handlePress}
      {...props}
    >
      {symbol}
    </button>
  );
});

// Named exports
export { ControlButton };

// Default export
export default ControlButton;
