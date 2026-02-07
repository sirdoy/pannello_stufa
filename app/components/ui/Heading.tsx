'use client';

import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Heading Variants - CVA Configuration
 *
 * Size: sm, md, lg, xl, 2xl, 3xl
 * Variant: default, gradient, subtle, ember, ocean, sage, warning, danger, info
 */
const headingVariants = cva(
  // Base classes
  'font-bold font-display',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl sm:text-2xl',
        '2xl': 'text-2xl sm:text-3xl',
        '3xl': 'text-3xl sm:text-4xl',
      },
      variant: {
        // Neutral hierarchy
        default: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
        gradient: 'bg-gradient-to-r from-ember-500 to-flame-600 bg-clip-text text-transparent',
        subtle: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
        // Accent colors - Ember Noir palette
        ember: 'text-ember-400 [html:not(.dark)_&]:text-ember-700',
        ocean: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-700',
        sage: 'text-sage-400 [html:not(.dark)_&]:text-sage-700',
        warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
        danger: 'text-danger-400 [html:not(.dark)_&]:text-danger-700',
        info: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-800', // alias for ocean (info cards)
      },
    },
    defaultVariants: {
      size: '2xl',
      variant: 'default',
    },
  }
);

// Level to size auto-mapping
const sizeMapping: Record<number, '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm'> = {
  1: '3xl',  // 30px-36px
  2: '2xl',  // 24px-30px
  3: 'xl',   // 20px-24px
  4: 'lg',   // 18px
  5: 'md',   // 16px
  6: 'sm',   // 14px
};

/**
 * Heading Component Props
 */
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Heading Component - Ember Noir Design System
 *
 * Semantic heading (h1-h6) with CVA-powered size and variant options.
 * Handles dark/light mode internally - use variants instead of external color classes.
 *
 * @param {Object} props - Component props
 * @param {1|2|3|4|5|6} props.level - Heading level (h1-h6)
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'} props.size - Font size override
 * @param {'default'|'gradient'|'subtle'|'ember'|'ocean'|'sage'|'warning'|'danger'|'info'} props.variant - Color variant
 * @param {ReactNode} props.children - Heading content
 * @param {string} props.className - Additional layout/spacing classes (NOT colors)
 *
 * @example
 * <Heading level={1} size="3xl" variant="gradient">Main Title</Heading>
 * <Heading level={3} variant="neutral">Info Title</Heading>
 */
const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  {
    level = 2,
    size,
    variant = 'default',
    className,
    children,
    ...props
  },
  ref
) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const finalSize = size || sizeMapping[level] || 'md';

  return (
    <Tag
      ref={ref}
      className={cn(headingVariants({ size: finalSize, variant }), className)}
      {...props}
    >
      {children}
    </Tag>
  );
});

Heading.displayName = 'Heading';

export { Heading, headingVariants };
export default Heading;
