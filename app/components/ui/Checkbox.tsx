'use client';

import type React from 'react';

import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Checkbox Variants - CVA Configuration
 *
 * Size: sm (16px), md (20px), lg (24px)
 * Variant: primary, ember, ocean, sage, flame
 */
const checkboxVariants = cva(
  // Base classes
  [
    'rounded-md border-2 transition-all duration-200',
    'flex items-center justify-center',
    'outline-none cursor-pointer',
    // Focus ring - ember glow
    'focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Base border (unchecked)
    'border-slate-500 [html:not(.dark)_&]:border-slate-400',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      variant: {
        primary: [
          'hover:border-ember-400 [html:not(.dark)_&]:hover:border-ember-500',
          'data-[state=checked]:bg-ember-500 data-[state=checked]:border-ember-500',
          'data-[state=indeterminate]:bg-ember-500 data-[state=indeterminate]:border-ember-500',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ember-600 [html:not(.dark)_&]:data-[state=checked]:border-ember-600',
          '[html:not(.dark)_&]:data-[state=indeterminate]:bg-ember-600 [html:not(.dark)_&]:data-[state=indeterminate]:border-ember-600',
        ],
        ember: [
          'hover:border-ember-400 [html:not(.dark)_&]:hover:border-ember-500',
          'data-[state=checked]:bg-ember-500 data-[state=checked]:border-ember-500',
          'data-[state=indeterminate]:bg-ember-500 data-[state=indeterminate]:border-ember-500',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ember-600 [html:not(.dark)_&]:data-[state=checked]:border-ember-600',
          '[html:not(.dark)_&]:data-[state=indeterminate]:bg-ember-600 [html:not(.dark)_&]:data-[state=indeterminate]:border-ember-600',
        ],
        ocean: [
          'hover:border-ocean-400 [html:not(.dark)_&]:hover:border-ocean-500',
          'data-[state=checked]:bg-ocean-500 data-[state=checked]:border-ocean-500',
          'data-[state=indeterminate]:bg-ocean-500 data-[state=indeterminate]:border-ocean-500',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ocean-600 [html:not(.dark)_&]:data-[state=checked]:border-ocean-600',
          '[html:not(.dark)_&]:data-[state=indeterminate]:bg-ocean-600 [html:not(.dark)_&]:data-[state=indeterminate]:border-ocean-600',
        ],
        sage: [
          'hover:border-sage-400 [html:not(.dark)_&]:hover:border-sage-500',
          'data-[state=checked]:bg-sage-500 data-[state=checked]:border-sage-500',
          'data-[state=indeterminate]:bg-sage-500 data-[state=indeterminate]:border-sage-500',
          '[html:not(.dark)_&]:data-[state=checked]:bg-sage-600 [html:not(.dark)_&]:data-[state=checked]:border-sage-600',
          '[html:not(.dark)_&]:data-[state=indeterminate]:bg-sage-600 [html:not(.dark)_&]:data-[state=indeterminate]:border-sage-600',
        ],
        flame: [
          'hover:border-flame-400 [html:not(.dark)_&]:hover:border-flame-500',
          'data-[state=checked]:bg-flame-500 data-[state=checked]:border-flame-500',
          'data-[state=indeterminate]:bg-flame-500 data-[state=indeterminate]:border-flame-500',
          '[html:not(.dark)_&]:data-[state=checked]:bg-flame-600 [html:not(.dark)_&]:data-[state=checked]:border-flame-600',
          '[html:not(.dark)_&]:data-[state=indeterminate]:bg-flame-600 [html:not(.dark)_&]:data-[state=indeterminate]:border-flame-600',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'ocean',
    },
  }
);

/**
 * Icon size mapping for checkbox indicators
 */
const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

type CheckboxPrimitivePropsBase = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

export type CheckboxProps = Omit<CheckboxPrimitivePropsBase, 'checked' | 'onCheckedChange'> &
  VariantProps<typeof checkboxVariants> & {
    /** Checked state (true, false, or 'indeterminate') */
    checked?: boolean | 'indeterminate';
    /** Indeterminate state (legacy prop, converts to checked='indeterminate') */
    indeterminate?: boolean;
    /** Radix change handler (receives boolean | 'indeterminate') */
    onCheckedChange?: (checked: boolean | 'indeterminate') => void;
    /** Legacy change handler (backwards compatibility) */
    onChange?: (event: { target: { checked: boolean; indeterminate: boolean; name?: string; value?: string } }) => void;
    /** Optional label text */
    label?: React.ReactNode;
    /** Input id (for label association) */
    id?: string;
    /** Input name */
    name?: string;
    /** Input value */
    value?: string;
  };

/**
 * Checkbox Component - Ember Noir Design System
 *
 * Accessible checkbox built on Radix UI primitives with CVA variants.
 * Supports checked, unchecked, and indeterminate states with full keyboard navigation.
 */
const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onCheckedChange,
    onChange, // backwards compatibility
    disabled = false,
    label,
    size = 'md',
    variant = 'ocean',
    className,
    id,
    name,
    value,
    ...props
  },
  ref
) {
  // Convert indeterminate boolean prop to Radix format
  const radixChecked = indeterminate ? 'indeterminate' : checked;

  // Handle change with backwards compatibility
  const handleCheckedChange = (newChecked) => {
    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }
    // Legacy onChange support - simulate event-like object
    if (onChange) {
      onChange({
        target: {
          checked: newChecked === true,
          indeterminate: newChecked === 'indeterminate',
          name,
          value,
        },
      });
    }
  };

  const checkboxElement = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={id}
      name={name}
      value={value}
      checked={radixChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      className={cn(checkboxVariants({ size, variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-white">
        {radixChecked === 'indeterminate' ? (
          <Minus className={iconSizes[size]} strokeWidth={3} />
        ) : (
          <Check className={iconSizes[size]} strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  // Wrap with label if provided
  if (label) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        {checkboxElement}
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium select-none',
            'text-white [html:not(.dark)_&]:text-slate-900',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {label}
        </label>
      </div>
    );
  }

  return checkboxElement;
});

export default Checkbox;
