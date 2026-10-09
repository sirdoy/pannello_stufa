'use client';

import type React from 'react';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';

/**
 * Card Variants - CVA Configuration
 *
 * Variant: default, elevated, subtle, outlined, glass
 * hover: boolean - Enable hover effects
 * glow: boolean - Accent (ember) border
 * padding: boolean - Include default padding (default: true)
 */
export const cardVariants = cva(
  // Base classes: the EmberGlass glass surface (same tokens as GlassCard)
  [
    'rounded-(--r-card)',
    'transition-colors',
    'duration-(--duration-smooth)',
    'relative',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: 'border-[0.5px] border-white/8 bg-white/4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-180',
        elevated: 'border-[0.5px] border-white/8 bg-white/4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-180',
        glass: 'border-[0.5px] border-white/8 bg-white/4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-180',
        // Inner surface for a card nested in a card (same as AltroRow / SheetBtn)
        subtle: 'rounded-2xl border-[0.5px] border-white/6 bg-white/4',
        outlined: 'border-[0.5px] border-white/12 bg-transparent',
      },
      hover: {
        true: 'cursor-pointer hover:bg-white/6',
        false: '',
      },
      glow: {
        true: 'border-ember-500/30',
        false: '',
      },
      padding: {
        true: 'p-(--pad-card)',
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
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ children, className, variant = 'default', hover = false, glow = false, padding = true, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, hover, glow, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * CardHeader - Header section for cards
 */
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ children, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('mb-4 flex items-center justify-between', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * CardTitle - Title element for cards
 * Uses Heading component internally for consistent typography.
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = forwardRef<HTMLDivElement, CardTitleProps>(
  function CardTitle({ children, icon, level = 2, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)} {...props}>
        {icon && (
          <span
            aria-hidden={typeof icon === 'string' ? undefined : true}
            className={typeof icon === 'string' ? 'text-2xl sm:text-3xl' : 'inline-flex shrink-0 items-center text-(--text-2)'}
          >
            {icon}
          </span>
        )}
        <Heading level={level} size="lg">
          {children}
        </Heading>
      </div>
    );
  }
);

/**
 * CardContent - Main content area
 */
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

/**
 * CardFooter - Footer section for actions
 */
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ children, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-5 border-t border-white/6 pt-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * CardDivider - Visual separator within cards
 */
export type CardDividerProps = React.HTMLAttributes<HTMLDivElement>;

const CardDivider = forwardRef<HTMLDivElement, CardDividerProps>(
  function CardDivider({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'my-4 h-px bg-white/8',
          className
        )}
        {...props}
      />
    );
  }
);

// Namespace type
type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
  Divider: typeof CardDivider;
};

// Attach namespace properties
(Card as CardComponent).Header = CardHeader;
(Card as CardComponent).Title = CardTitle;
(Card as CardComponent).Content = CardContent;
(Card as CardComponent).Footer = CardFooter;
(Card as CardComponent).Divider = CardDivider;

// Export both named and namespace
export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDivider };
export default Card as CardComponent;
