'use client';

import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
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
    'transition-all duration-[var(--duration-smooth)]',
    'ease-[var(--ease-move)]',
    'outline-none cursor-pointer',
    // Focus ring - ember glow
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Unchecked state - dark/light
    'bg-slate-700 [html:not(.dark)_&]:bg-slate-300',
  ],
  {
    variants: {
      size: {
        sm: 'h-6 w-11',
        md: 'h-8 w-14',
        lg: 'h-10 w-[4.5rem]',
      },
      variant: {
        ember: [
          'data-[state=checked]:bg-gradient-to-r',
          'data-[state=checked]:from-ember-500 data-[state=checked]:to-flame-600',
        ],
        ocean: [
          'data-[state=checked]:bg-gradient-to-r',
          'data-[state=checked]:from-ocean-500 data-[state=checked]:to-ocean-600',
        ],
        sage: [
          'data-[state=checked]:bg-gradient-to-r',
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
    'transition-transform duration-[var(--duration-smooth)]',
    'ease-[var(--ease-spring)]',
    // Start position (unchecked)
    'translate-x-0.5',
  ],
  {
    variants: {
      size: {
        sm: [
          'h-5 w-5',
          'data-[state=checked]:translate-x-5',
        ],
        md: [
          'h-7 w-7',
          'data-[state=checked]:translate-x-6',
        ],
        lg: [
          'h-9 w-9',
          'data-[state=checked]:translate-x-8',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * Switch Component - Ember Noir Design System
 *
 * Accessible toggle switch built on Radix UI primitives with CVA variants.
 * Supports smooth 250ms animation and full keyboard navigation.
 *
 * @param {Object} props
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onCheckedChange - Radix change handler (receives boolean)
 * @param {Function} props.onChange - Legacy change handler (backwards compatibility)
 * @param {boolean} props.disabled - Disabled state
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {'ember'|'ocean'|'sage'} props.variant - Color variant when checked
 * @param {string} props.className - Additional classes for the switch
 * @param {string} props.label - Accessible label (sets aria-label)
 */
const Switch = forwardRef(function Switch(
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
  const handleCheckedChange = (newChecked) => {
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
