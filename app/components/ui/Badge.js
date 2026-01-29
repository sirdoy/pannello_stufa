'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Badge Variants - CVA Configuration
 *
 * Versatile status badge component with color variants, sizes, and pulse animation.
 * Used for status indicators across smart home components.
 *
 * @see StatusBadge.js for legacy implementation (backwards compatibility)
 */
export const badgeVariants = cva(
  // Base classes
  [
    'inline-flex items-center gap-1.5',
    'font-display font-semibold',
    'rounded-full',
    'border',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        // Ember - Primary/active state
        ember: [
          'bg-ember-500/15',
          'border-ember-400/25',
          'text-ember-300',
          '[html:not(.dark)_&]:bg-ember-500/10',
          '[html:not(.dark)_&]:border-ember-400/30',
          '[html:not(.dark)_&]:text-ember-700',
        ],
        // Sage - Success/healthy state
        sage: [
          'bg-sage-500/15',
          'border-sage-400/25',
          'text-sage-300',
          '[html:not(.dark)_&]:bg-sage-500/10',
          '[html:not(.dark)_&]:border-sage-400/30',
          '[html:not(.dark)_&]:text-sage-700',
        ],
        // Ocean - Info/starting state
        ocean: [
          'bg-ocean-500/15',
          'border-ocean-400/25',
          'text-ocean-300',
          '[html:not(.dark)_&]:bg-ocean-500/10',
          '[html:not(.dark)_&]:border-ocean-400/30',
          '[html:not(.dark)_&]:text-ocean-700',
        ],
        // Warning - Standby/waiting state
        warning: [
          'bg-warning-500/15',
          'border-warning-400/25',
          'text-warning-300',
          '[html:not(.dark)_&]:bg-warning-500/10',
          '[html:not(.dark)_&]:border-warning-400/30',
          '[html:not(.dark)_&]:text-warning-700',
        ],
        // Danger - Error state
        danger: [
          'bg-danger-500/15',
          'border-danger-400/25',
          'text-danger-300',
          '[html:not(.dark)_&]:bg-danger-500/10',
          '[html:not(.dark)_&]:border-danger-400/30',
          '[html:not(.dark)_&]:text-danger-700',
        ],
        // Neutral - Off/inactive state
        neutral: [
          'bg-slate-500/10',
          'border-slate-400/20',
          'text-slate-400',
          '[html:not(.dark)_&]:bg-slate-500/8',
          '[html:not(.dark)_&]:border-slate-400/25',
          '[html:not(.dark)_&]:text-slate-600',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
      pulse: {
        true: 'animate-glow-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      pulse: false,
    },
  }
);

/**
 * Badge Component
 *
 * Status indicator with CVA variants and optional pulse animation.
 * Designed for smart home device status display.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge text content
 * @param {React.ReactNode} [props.icon] - Optional icon displayed before text
 * @param {'ember'|'sage'|'ocean'|'warning'|'danger'|'neutral'} [props.variant='neutral'] - Color variant
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Size variant
 * @param {boolean} [props.pulse=false] - Enable pulse animation for active states
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * // Basic usage
 * <Badge variant="sage">Online</Badge>
 *
 * @example
 * // With icon and pulse
 * <Badge variant="ember" pulse icon={<FlameIcon />}>Active</Badge>
 *
 * @example
 * // Custom styling
 * <Badge variant="ocean" size="lg" className="mt-2">Starting</Badge>
 */
const Badge = forwardRef(function Badge(
  { children, icon, variant, size, pulse, className, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, pulse }), className)}
      {...props}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
