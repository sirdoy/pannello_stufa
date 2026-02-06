'use client';

import type React from 'react';
import { forwardRef } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * RadioGroup Component - Ember Noir Design System
 *
 * Accessible radio group built on Radix UI primitives with CVA variants.
 * Supports keyboard navigation (Arrow keys) and screen readers (ARIA).
 *
 * @example
 * // Simple usage
 * <RadioGroup value={mode} onValueChange={setMode}>
 *   <RadioGroupItem value="auto" label="Automatic" />
 *   <RadioGroupItem value="manual" label="Manual" />
 *   <RadioGroupItem value="semi" label="Semi-Manual" />
 * </RadioGroup>
 *
 * @example
 * // With compound syntax
 * <RadioGroup.Root value={selected} onValueChange={setSelected}>
 *   <RadioGroup.Item value="a" label="Option A" />
 *   <RadioGroup.Item value="b" label="Option B" />
 * </RadioGroup.Root>
 */

const radioGroupVariants = cva(
  'flex gap-3',
  {
    variants: {
      orientation: {
        vertical: 'flex-col',
        horizontal: 'flex-row flex-wrap',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  }
);

const radioItemVariants = cva(
  [
    // Base circle styles
    'aspect-square shrink-0 rounded-full border-2 transition-all duration-200',
    // Focus ring - ember glow
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-white',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  ],
  {
    variants: {
      variant: {
        ember: [
          'border-slate-500 data-[state=checked]:border-ember-500',
          '[html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:data-[state=checked]:border-ember-600',
        ],
        ocean: [
          'border-slate-500 data-[state=checked]:border-ocean-500',
          '[html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:data-[state=checked]:border-ocean-600',
        ],
        sage: [
          'border-slate-500 data-[state=checked]:border-sage-500',
          '[html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:data-[state=checked]:border-sage-600',
        ],
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);

const radioIndicatorVariants = cva(
  'rounded-full',
  {
    variants: {
      variant: {
        ember: 'bg-ember-500 [html:not(.dark)_&]:bg-ember-600',
        ocean: 'bg-ocean-500 [html:not(.dark)_&]:bg-ocean-600',
        sage: 'bg-sage-500 [html:not(.dark)_&]:bg-sage-600',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof radioGroupVariants> {}

/**
 * RadioGroup Root Component
 */
const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(({
  className,
  orientation = 'vertical',
  ...props
}, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(radioGroupVariants({ orientation }), className)}
    orientation={orientation}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {
  /** Label text (optional, can use children instead) */
  label?: React.ReactNode;
  /** Children as alternative to label */
  children?: React.ReactNode;
  /** Additional classes for the wrapper */
  className?: string;
}

/**
 * RadioGroupItem Component
 */
const RadioGroupItem = forwardRef<HTMLButtonElement, RadioGroupItemProps>(({
  className,
  label,
  children,
  variant = 'ember',
  size = 'md',
  ...props
}, ref) => {
  const displayLabel = label || children;
  const id = props.id || `radio-${props.value}`;

  return (
    <div className={cn(
      'flex items-center gap-3',
      // Touch target: ensure minimum 44px
      'min-h-11',
      className
    )}>
      <RadioGroupPrimitive.Item
        ref={ref}
        id={id}
        className={cn(radioItemVariants({ variant, size }))}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className={cn(radioIndicatorVariants({ variant, size }))} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {displayLabel && (
        <label
          htmlFor={id}
          className={cn(
            'text-base font-medium cursor-pointer select-none',
            'text-slate-200 [html:not(.dark)_&]:text-slate-700',
            props.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {displayLabel}
        </label>
      )}
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

// Type the RadioGroup namespace with sub-component
type RadioGroupComponent = React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof RadioGroupItem;
};

// Attach Item as a compound component
(RadioGroup as RadioGroupComponent).Item = RadioGroupItem;

// Named exports for direct import
export { RadioGroup, RadioGroupItem };

// Default export with compound pattern
export default RadioGroup as RadioGroupComponent;
