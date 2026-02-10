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
    'transition-all duration-200',
    'flex items-center justify-center',
    'border border-white/10',
    '[html:not(.dark)_&]:border-black/5',
    'text-white',
    // Focus ring - ember glow (consistent with Phase 12 components)
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    // Active state
    'active:scale-95',
    // Touch optimization
    'touch-manipulation',
    'select-none',
    // Disabled state
    'disabled:bg-slate-800 disabled:text-slate-600',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
    '[html:not(.dark)_&]:disabled:bg-slate-200 [html:not(.dark)_&]:disabled:text-slate-400',
    'disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // Primary: warm copper/amber
        ember: [
          'bg-gradient-to-br from-ember-500 to-flame-600',
          'hover:from-ember-400 hover:to-flame-500',
          'shadow-ember-glow-sm hover:shadow-ember-glow',
        ],
        // Secondary: muted ocean blue
        ocean: [
          'bg-gradient-to-br from-ocean-500 to-ocean-600',
          'hover:from-ocean-400 hover:to-ocean-500',
          'shadow-[0_4px_15px_rgba(67,125,174,0.25)]',
          'hover:shadow-[0_6px_20px_rgba(67,125,174,0.35)]',
        ],
        // Sage: muted green
        sage: [
          'bg-gradient-to-br from-sage-500 to-sage-600',
          'hover:from-sage-400 hover:to-sage-500',
          'shadow-[0_4px_15px_rgba(96,115,96,0.25)]',
          'hover:shadow-[0_6px_20px_rgba(96,115,96,0.35)]',
        ],
        // Warning: amber
        warning: [
          'bg-gradient-to-br from-warning-500 to-warning-600',
          'hover:from-warning-400 hover:to-warning-500',
          'shadow-[0_4px_15px_rgba(234,179,8,0.25)]',
          'hover:shadow-[0_6px_20px_rgba(234,179,8,0.35)]',
        ],
        // Danger: red
        danger: [
          'bg-gradient-to-br from-danger-500 to-danger-600',
          'hover:from-danger-400 hover:to-danger-500',
          'shadow-[0_4px_15px_rgba(239,68,68,0.25)]',
          'hover:shadow-[0_6px_20px_rgba(239,68,68,0.35)]',
        ],
        // Subtle: glass effect
        subtle: [
          'bg-white/[0.06]',
          'text-slate-200',
          'hover:bg-white/[0.1]',
          '[html:not(.dark)_&]:bg-black/[0.04]',
          '[html:not(.dark)_&]:text-slate-700',
          '[html:not(.dark)_&]:hover:bg-black/[0.06]',
        ],
      },
      size: {
        // 44px minimum touch target
        sm: 'min-h-[44px] min-w-[44px] h-12 text-2xl',
        // 48px standard
        md: 'min-h-[48px] min-w-[48px] h-14 text-3xl',
        // 56px large
        lg: 'min-h-[56px] min-w-[56px] h-16 sm:h-20 text-3xl sm:text-4xl',
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
      if (process.env.NODE_ENV === 'development' && !(handlePress as any)._warned) {
        console.warn(
          '[ControlButton] onClick prop is deprecated. Use onChange(delta) instead.'
        );
        (handlePress as any)._warned = true;
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
