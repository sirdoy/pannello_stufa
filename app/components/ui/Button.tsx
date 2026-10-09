'use client';

import type React from 'react';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { useHaptic } from '@/app/hooks/useHaptic';

/**
 * Button Variants - CVA Configuration
 *
 * Variant: ember (gradient), subtle (glass), ghost (transparent), success (sage), danger (red), outline (border)
 * Size: sm (44px), md (48px), lg (56px) - iOS minimum touch targets
 */
export const buttonVariants = cva(
  // Base classes: EmberGlass flat buttons (same look as formStyles primary / secondary)
  [
    'font-body font-semibold',
    'rounded-xl',
    'transition-colors',
    'duration-(--duration-fast)',
    'flex items-center justify-center gap-2',
    'relative overflow-hidden',
    'select-none',
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'active:scale-97',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        // Primary action - flat accent, dark label
        ember: 'bg-(--accent) font-bold text-[#1a0d06] hover:brightness-110',
        // Secondary action - glass
        subtle: 'border-[0.5px] border-white/14 bg-white/6 text-white hover:bg-white/10',
        // Ghost - transparent with hover
        ghost: 'bg-transparent text-(--text-2) hover:bg-white/6 hover:text-white',
        // Success / danger - tinted, like a toned Pill
        success: 'border-[0.5px] border-sage-400/30 bg-sage-500/20 text-sage-300 hover:bg-sage-500/30',
        danger: 'border-[0.5px] border-danger-400/30 bg-danger-500/20 text-danger-300 hover:bg-danger-500/30',
        // Outline - accent border only
        outline: 'border-[0.5px] border-ember-500/50 bg-transparent text-ember-400 hover:bg-ember-500/10',
      },
      size: {
        // Heights keep the 44px minimum touch target
        sm: 'min-h-11 px-3.5 py-2 text-[13px]',
        md: 'min-h-12 px-5 py-2.5 text-[15px]',
        lg: 'min-h-14 px-6 py-3 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      iconOnly: {
        true: 'rounded-full',
        false: '',
      },
      colorScheme: {
        sage: [],
        ocean: [],
        warning: [],
        slate: [],
      },
    },
    compoundVariants: [
      // iconOnly + size interactions for correct padding and min-width
      { iconOnly: true, size: 'sm', className: 'p-2.5 min-w-11 px-0' },
      { iconOnly: true, size: 'md', className: 'p-3 min-w-12 px-0' },
      { iconOnly: true, size: 'lg', className: 'p-4 min-w-14 px-0' },
      { variant: 'subtle', colorScheme: 'sage', className: 'border-sage-400/30 bg-sage-500/20 text-sage-300' },
      { variant: 'subtle', colorScheme: 'ocean', className: 'border-ocean-400/30 bg-ocean-500/20 text-ocean-300' },
      { variant: 'subtle', colorScheme: 'warning', className: 'border-warning-400/30 bg-warning-500/20 text-warning-300' },
      { variant: 'subtle', colorScheme: 'slate', className: 'border-white/14 bg-white/6 text-(--text-2)' },
      { variant: 'ghost', colorScheme: 'sage', className: 'text-sage-300 hover:bg-sage-500/10' },
      { variant: 'ghost', colorScheme: 'ocean', className: 'text-ocean-300 hover:bg-ocean-500/10' },
      { variant: 'ghost', colorScheme: 'warning', className: 'text-warning-300 hover:bg-warning-500/10' },
      { variant: 'ghost', colorScheme: 'slate', className: 'text-(--text-2) hover:bg-white/6' },
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
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Button text */
  children?: React.ReactNode;
  /** Loading state (shows spinner) */
  loading?: boolean;
  /** Icon emoji/character or React element */
  icon?: string | React.ReactNode;
  /** Icon position relative to text */
  iconPosition?: 'left' | 'right';
  /** Enable haptic feedback on click (default: true) */
  haptic?: boolean;
  /** Haptic pattern override (default: based on variant) */
  hapticPattern?: 'short' | 'success' | 'warning' | 'error';
}

/**
 * Button Component - Ember Noir Design System
 *
 * Sophisticated button with warm gradients and smooth interactions.
 * Features multiple variants for different actions and contexts.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
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
    colorScheme,
    haptic = true,
    hapticPattern,
    className,
    onClick,
    ...props
  },
  ref
) {
  // Determine haptic pattern based on variant if not explicitly provided
  const resolvedHapticPattern = hapticPattern || (() => {
    if (variant === 'danger') return 'warning';
    if (variant === 'success' || variant === 'ember') return 'short';
    return 'short';
  })();

  // Initialize haptic feedback
  const hapticFeedback = useHaptic(resolvedHapticPattern);

  // Wrap onClick to include haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic && !disabled && !loading) {
      hapticFeedback.trigger();
    }
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size, fullWidth, iconOnly, colorScheme }),
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <span className="rounded-inherit absolute inset-0 flex items-center justify-center bg-inherit">
          <svg
            className="size-5 animate-spin"
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
          'flex items-center justify-center gap-2',
          loading && 'invisible'
        )}
      >
        {icon && iconPosition === 'left' && (
          <span className={iconSizes[size ?? 'md']} aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && (
          <span className={iconSizes[size ?? 'md']} aria-hidden="true">
            {icon}
          </span>
        )}
      </span>
    </button>
  );
});

export interface ButtonIconProps extends Omit<ButtonProps, 'iconOnly' | 'children'> {
  /** Icon emoji/character or React element */
  icon: React.ReactNode;
  /** Required accessibility label */
  'aria-label': string;
}

/**
 * Button.Icon - Icon-only button wrapper
 *
 * Convenience wrapper for icon-only buttons with required aria-label.
 */
const ButtonIcon = forwardRef<HTMLButtonElement, ButtonIconProps>(function ButtonIcon(
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

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button elements */
  children: React.ReactNode;
}

/**
 * Button.Group - Group of related buttons
 *
 * Flex container with gap for grouping related buttons.
 */
function ButtonGroup({ children, className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}

// Type the Button namespace with sub-components
type ButtonComponent = typeof Button & {
  Icon: typeof ButtonIcon;
  Group: typeof ButtonGroup;
};

// Attach sub-components to Button namespace
(Button as ButtonComponent).Icon = ButtonIcon;
(Button as ButtonComponent).Group = ButtonGroup;

// Named exports
export { Button, ButtonIcon, ButtonGroup };

// Default export
export default Button as ButtonComponent;
