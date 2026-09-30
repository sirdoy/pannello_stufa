'use client';

import type React from 'react';
import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Switch Track Variants - CVA Configuration
 *
 * Size: sm, md, lg
 * Variant: ember (default), ocean, sage
 */
const switchTrackVariants = cva(
  // Base classes
  [
    'relative inline-flex items-center rounded-full',
    'transition-all duration-(--duration-smooth)',
    'ease-(--ease-move)',
    'cursor-pointer outline-none',
    // Focus ring - ember glow
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Unchecked state - dark/light
    'bg-slate-700 ',
  ],
  {
    variants: {
      size: {
        sm: 'h-6 w-11',
        md: 'h-8 w-14',
        lg: 'h-10 w-18',
      },
      variant: {
        ember: [
          'data-[state=checked]:bg-linear-to-r',
          'data-[state=checked]:from-ember-500 data-[state=checked]:to-flame-600',
        ],
        ocean: [
          'data-[state=checked]:bg-linear-to-r',
          'data-[state=checked]:from-ocean-500 data-[state=checked]:to-ocean-600',
        ],
        sage: [
          'data-[state=checked]:bg-linear-to-r',
          'data-[state=checked]:from-sage-500 data-[state=checked]:to-sage-600',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'ember',
    },
  }
);

/**
 * Switch Thumb Variants - CVA Configuration
 *
 * Handles the sliding indicator
 */
const switchThumbVariants = cva(
  // Base classes - all sizes share these
  [
    'block rounded-full bg-white shadow-lg',
    'transition-transform duration-(--duration-smooth)',
    'ease-spring',
    // Start position (unchecked)
    'translate-x-0.5',
  ],
  {
    variants: {
      size: {
        sm: [
          'size-5',
          'data-[state=checked]:translate-x-5',
        ],
        md: [
          'size-7',
          'data-[state=checked]:translate-x-6',
        ],
        lg: [
          'size-9',
          'data-[state=checked]:translate-x-8',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

type SwitchPrimitivePropsBase = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

export type SwitchProps = Omit<SwitchPrimitivePropsBase, 'checked' | 'onCheckedChange'> &
  VariantProps<typeof switchTrackVariants> & {
    /** Checked state */
    checked?: boolean;
    /** Radix change handler (receives boolean) */
    onCheckedChange?: (checked: boolean) => void;
    /** Legacy change handler (backwards compatibility) */
    onChange?: (checked: boolean) => void;
    /** Accessible label (sets aria-label) */
    label?: string;
  };

/**
 * Switch Component - Ember Noir Design System
 *
 * Accessible toggle switch built on Radix UI primitives with CVA variants.
 * Supports smooth 250ms animation and full keyboard navigation.
 */
const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked = false,
    onCheckedChange,
    onChange, // backwards compatibility
    disabled = false,
    size = 'md',
    variant = 'ember',
    className,
    label,
    ...props
  },
  ref
) {
  // Handle change with backwards compatibility
  const handleCheckedChange = (newChecked: boolean) => {
    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }
    // Legacy onChange support
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(switchTrackVariants({ size, variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={switchThumbVariants({ size })}
      />
    </SwitchPrimitive.Root>
  );
});

export default Switch;
