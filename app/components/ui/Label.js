'use client';

import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Label Variants - CVA Configuration
 *
 * Size: sm (text-xs), md (text-sm), lg (text-base)
 * Variant: default, muted, required
 */
const labelVariants = cva(
  // Base classes
  [
    'font-medium font-display select-none',
    'leading-none',
  ],
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      variant: {
        default: [
          'text-slate-300',
          '[html:not(.dark)_&]:text-slate-700',
        ],
        muted: [
          'text-slate-400',
          '[html:not(.dark)_&]:text-slate-500',
        ],
        required: [
          'text-slate-300',
          '[html:not(.dark)_&]:text-slate-700',
          "after:content-['*'] after:ml-0.5 after:text-ember-500",
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

/**
 * Label Component - Ember Noir Design System
 *
 * Accessible label built on Radix UI Label primitive with CVA variants.
 * Automatically handles htmlFor association when used with form controls.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {'default'|'muted'|'required'} props.variant - Style variant
 * @param {string} props.htmlFor - ID of the form control to associate with
 * @param {string} props.className - Additional classes
 * @param {ReactNode} props.children - Label text content
 */
const Label = forwardRef(({ className, size, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ size, variant }), className)}
    {...props}
  />
));

Label.displayName = 'Label';

export { Label, labelVariants };
export default Label;
