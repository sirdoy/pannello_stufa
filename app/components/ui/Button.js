'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Button Variants - CVA Configuration
 *
 * Variant: ember (gradient), subtle (glass), ghost (transparent), success (sage), danger (red), outline (border)
 * Size: sm (44px), md (48px), lg (56px) - iOS minimum touch targets
 */
export const buttonVariants = cva(
  // Base classes
  [
    'font-display font-semibold',
    'rounded-xl',
    'transition-all duration-200',
    'flex items-center justify-center gap-2.5',
    'relative overflow-hidden',
    'select-none',
    // Focus ring - ember glow (consistent with Phase 12 components)
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    // Active state
    'active:scale-[0.97]',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // Primary action - Warm ember gradient
        ember: [
          'bg-gradient-to-br from-ember-500 via-ember-600 to-flame-600',
          'text-white',
          'shadow-[0_2px_8px_rgba(237,111,16,0.25),0_1px_2px_rgba(0,0,0,0.1)]',
          'hover:from-ember-400 hover:via-ember-500 hover:to-flame-500',
          'hover:shadow-[0_4px_16px_rgba(237,111,16,0.35),0_2px_4px_rgba(0,0,0,0.1)]',
          'hover:-translate-y-0.5',
        ],
        // Secondary action - Subtle glass
        subtle: [
          'bg-white/[0.06]',
          'text-slate-200',
          'border border-white/[0.08]',
          'hover:bg-white/[0.1]',
          'hover:border-white/[0.12]',
          'hover:-translate-y-0.5',
          '[html:not(.dark)_&]:bg-black/[0.04]',
          '[html:not(.dark)_&]:text-slate-700',
          '[html:not(.dark)_&]:border-black/[0.08]',
          '[html:not(.dark)_&]:hover:bg-black/[0.06]',
          '[html:not(.dark)_&]:hover:border-black/[0.12]',
        ],
        // Ghost - Transparent with hover
        ghost: [
          'bg-transparent',
          'text-slate-300',
          'hover:bg-white/[0.06]',
          'hover:text-slate-100',
          '[html:not(.dark)_&]:text-slate-600',
          '[html:not(.dark)_&]:hover:bg-black/[0.04]',
          '[html:not(.dark)_&]:hover:text-slate-900',
        ],
        // Success action - Muted sage green
        success: [
          'bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700',
          'text-white',
          'shadow-[0_2px_8px_rgba(96,115,96,0.25),0_1px_2px_rgba(0,0,0,0.1)]',
          'hover:from-sage-400 hover:via-sage-500 hover:to-sage-600',
          'hover:shadow-[0_4px_16px_rgba(96,115,96,0.35)]',
          'hover:-translate-y-0.5',
        ],
        // Danger action - Red
        danger: [
          'bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700',
          'text-white',
          'shadow-[0_2px_8px_rgba(239,68,68,0.25),0_1px_2px_rgba(0,0,0,0.1)]',
          'hover:from-danger-400 hover:via-danger-500 hover:to-danger-600',
          'hover:shadow-[0_4px_16px_rgba(239,68,68,0.35)]',
          'hover:-translate-y-0.5',
        ],
        // Outline - Border only
        outline: [
          'bg-transparent',
          'text-ember-400',
          'border-2 border-ember-500/40',
          'hover:bg-ember-500/10',
          'hover:border-ember-500/60',
          'hover:-translate-y-0.5',
          '[html:not(.dark)_&]:text-ember-600',
          '[html:not(.dark)_&]:border-ember-500/50',
          '[html:not(.dark)_&]:hover:bg-ember-500/10',
          '[html:not(.dark)_&]:hover:border-ember-500/70',
        ],
      },
      size: {
        sm: 'px-4 py-2.5 min-h-[44px] text-sm',
        md: 'px-5 py-3 min-h-[48px] text-base',
        lg: 'px-6 py-4 min-h-[56px] text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      iconOnly: {
        true: 'rounded-full',
        false: '',
      },
    },
    compoundVariants: [
      // iconOnly + size interactions for correct padding and min-width
      { iconOnly: true, size: 'sm', className: 'p-2.5 min-w-[44px] px-0' },
      { iconOnly: true, size: 'md', className: 'p-3 min-w-[48px] px-0' },
      { iconOnly: true, size: 'lg', className: 'p-4 min-w-[56px] px-0' },
    ],
    defaultVariants: {
      variant: 'ember',
      size: 'md',
      fullWidth: false,
      iconOnly: false,
    },
  }
);

/**
 * Icon size mapping relative to button size
 */
const iconSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

/**
 * Button Component - Ember Noir Design System
 *
 * Sophisticated button with warm gradients and smooth interactions.
 * Features multiple variants for different actions and contexts.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button text
 * @param {'ember'|'subtle'|'ghost'|'success'|'danger'|'outline'} props.variant - Button style
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state (shows spinner)
 * @param {string} props.icon - Icon emoji/character
 * @param {'left'|'right'} props.iconPosition - Icon position relative to text
 * @param {boolean} props.fullWidth - Expand to full width
 * @param {boolean} props.iconOnly - Circular icon-only button
 * @param {string} props.className - Additional Tailwind classes
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'ember',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    iconOnly = false,
    className,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size, fullWidth, iconOnly }),
        className
      )}
      {...props}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {/* Button content */}
      <span
        className={cn(
          'flex items-center justify-center gap-2.5',
          loading && 'invisible'
        )}
      >
        {icon && iconPosition === 'left' && (
          <span className={iconSizes[size]} aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && (
          <span className={iconSizes[size]} aria-hidden="true">
            {icon}
          </span>
        )}
      </span>
    </button>
  );
});

/**
 * Button.Icon - Icon-only button wrapper
 *
 * Convenience wrapper for icon-only buttons with required aria-label.
 *
 * @param {Object} props
 * @param {string} props.icon - Icon emoji/character
 * @param {string} props['aria-label'] - Required accessibility label
 * @param {'ember'|'subtle'|'ghost'|'success'|'danger'|'outline'} props.variant - Button style
 * @param {'sm'|'md'|'lg'} props.size - Button size
 */
const ButtonIcon = forwardRef(function ButtonIcon(
  { icon, variant = 'ghost', size = 'md', className, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      icon={icon}
      iconOnly
      className={className}
      {...props}
    />
  );
});

/**
 * Button.Group - Group of related buttons
 *
 * Flex container with gap for grouping related buttons.
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Button elements
 * @param {string} props.className - Additional classes
 */
function ButtonGroup({ children, className, ...props }) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}

// Attach sub-components to Button namespace
Button.Icon = ButtonIcon;
Button.Group = ButtonGroup;

// Named exports
export { Button, ButtonIcon, ButtonGroup };

// Default export
export default Button;
