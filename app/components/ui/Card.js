'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';

/**
 * Card Variants - CVA Configuration
 *
 * Variant: default, elevated, subtle, outlined, glass
 * hover: boolean - Enable hover effects
 * glow: boolean - Add ember glow effect
 * padding: boolean - Include default padding (default: true)
 */
export const cardVariants = cva(
  // Base classes
  [
    'rounded-2xl',
    'transition-all',
    'duration-[var(--duration-smooth)]',
    'ease-[var(--ease-move)]',
    'relative',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-slate-900/80 border border-white/[0.06] shadow-card backdrop-blur-xl',
          '[html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:border-black/[0.06]',
          '[html:not(.dark)_&]:shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
        ],
        elevated: [
          'bg-slate-850/90 border border-white/[0.08] shadow-card-elevated backdrop-blur-xl',
          '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-black/[0.08]',
          '[html:not(.dark)_&]:shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
        ],
        subtle: [
          'bg-white/[0.03] border border-white/[0.04]',
          '[html:not(.dark)_&]:bg-black/[0.02] [html:not(.dark)_&]:border-black/[0.04]',
        ],
        outlined: [
          'bg-transparent border border-white/[0.12]',
          '[html:not(.dark)_&]:border-black/[0.12]',
        ],
        glass: [
          'bg-slate-900/70 border border-white/[0.08] shadow-card backdrop-blur-2xl backdrop-saturate-150',
          '[html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-black/[0.06]',
        ],
      },
      hover: {
        true: [
          'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
          'hover:border-white/[0.1]',
          'hover:ease-[var(--ease-spring-subtle)]',
          '[html:not(.dark)_&]:hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]',
          '[html:not(.dark)_&]:hover:border-black/[0.1]',
        ],
        false: [],
      },
      glow: {
        true: [
          'shadow-ember-glow border-ember-500/20',
          '[html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.12)]',
          '[html:not(.dark)_&]:border-ember-500/25',
        ],
        false: [],
      },
      padding: {
        true: 'p-5 sm:p-6',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
      glow: false,
      padding: true,
    },
  }
);

/**
 * Card Component - Ember Noir Design System
 *
 * Sophisticated container with warm dark aesthetic and subtle depth.
 * Features multiple variants for different use cases.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Card content
 * @param {'default'|'elevated'|'subtle'|'outlined'|'glass'} props.variant - Visual style
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.glow - Add ember glow effect (for active states)
 * @param {boolean} props.padding - Include default padding (default: true)
 * @param {string} props.className - Additional Tailwind classes
 */
const Card = forwardRef(function Card(
  {
    children,
    className,
    variant = 'default',
    hover = false,
    glow = false,
    padding = true,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, glow, padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * CardHeader - Header section for cards
 */
const CardHeader = forwardRef(function CardHeader(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * CardTitle - Title element for cards
 * Uses Heading component internally for consistent typography.
 */
const CardTitle = forwardRef(function CardTitle(
  { children, icon, className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn('flex items-center gap-3', className)} {...props}>
      {icon && <span className="text-2xl sm:text-3xl">{icon}</span>}
      <Heading level={2} size="lg">
        {children}
      </Heading>
    </div>
  );
});

/**
 * CardContent - Main content area
 */
const CardContent = forwardRef(function CardContent(
  { children, className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
});

/**
 * CardFooter - Footer section for actions
 */
const CardFooter = forwardRef(function CardFooter(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'mt-5 pt-4 border-t border-white/[0.06]',
        '[html:not(.dark)_&]:border-black/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * CardDivider - Visual separator within cards
 */
const CardDivider = forwardRef(function CardDivider(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'h-px my-4 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent',
        '[html:not(.dark)_&]:via-black/[0.08]',
        className
      )}
      {...props}
    />
  );
});

// Attach namespace properties
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Divider = CardDivider;

// Export both named and namespace
export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDivider };
export default Card;
