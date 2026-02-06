'use client';

import type React from 'react';
import { forwardRef, useState, useCallback, useRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Popover Component - Ember Noir Design System v4.0
 *
 * Built on Radix Popover primitive with:
 * - Click or hover trigger modes
 * - Size variants (sm, md, lg)
 * - Optional arrow indicator
 * - Portal rendering for z-index management
 * - Full accessibility (Radix handles focus trap, aria)
 *
 * @example
 * // Basic click-triggered popover
 * <Popover>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Content>
 *     <p>Popover content here</p>
 *   </Popover.Content>
 * </Popover>
 *
 * @example
 * // Hover-triggered with arrow
 * <Popover triggerMode="hover">
 *   <Popover.Trigger>Hover me</Popover.Trigger>
 *   <Popover.Content arrow>
 *     <p>Info panel</p>
 *   </Popover.Content>
 * </Popover>
 *
 * @example
 * // Different sizes
 * <Popover>
 *   <Popover.Trigger>Small</Popover.Trigger>
 *   <Popover.Content size="sm">Compact content</Popover.Content>
 * </Popover>
 */

// CVA variants for content
const contentVariants = cva(
  [
    'z-50 rounded-2xl p-4',
    'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
    'backdrop-blur-xl',
    'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    'shadow-card-elevated',
    // Animation - scale from 95% + fade
    'data-[state=open]:animate-scale-in',
    'data-[state=closed]:animate-fade-out',
    // Reduced motion
    'motion-reduce:animate-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-xs', // 320px
        md: 'max-w-sm', // 384px (default)
        lg: 'max-w-md', // 448px
      },
    },
    defaultVariants: { size: 'md' },
  }
);

// CVA variants for arrow
const arrowVariants = cva([
  'fill-slate-900/95 [html:not(.dark)_&]:fill-white/95',
]);

/**
 * PopoverArrow - Arrow indicator pointing to trigger
 */
export interface PopoverArrowProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow> {}

const PopoverArrow = forwardRef<React.ElementRef<typeof PopoverPrimitive.Arrow>, PopoverArrowProps>(
  function PopoverArrow({ className, ...props }, ref) {
    return (
      <PopoverPrimitive.Arrow
        ref={ref}
        className={cn(arrowVariants(), className)}
        {...props}
      />
    );
  }
);
PopoverArrow.displayName = 'PopoverArrow';

/**
 * PopoverContent - Styled content container with Portal
 */
export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof contentVariants> {
  arrow?: boolean;
}

const PopoverContent = forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverContentProps>(
  function PopoverContent(
    {
      className,
      size,
      side = 'bottom',
      align = 'center',
      sideOffset = 4,
      arrow = false,
      children,
      ...props
    },
    ref
  ) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(contentVariants({ size }), className)}
        {...props}
      >
        {children}
        {arrow && <PopoverArrow />}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';

/**
 * PopoverTrigger - Trigger element wrapper
 */
const PopoverTrigger = PopoverPrimitive.Trigger;
PopoverTrigger.displayName = 'PopoverTrigger';

/**
 * PopoverClose - Close button primitive
 */
export interface PopoverCloseProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> {}

const PopoverClose = forwardRef<React.ElementRef<typeof PopoverPrimitive.Close>, PopoverCloseProps>(
  function PopoverClose({ className, children, ...props }, ref) {
    return (
      <PopoverPrimitive.Close
        ref={ref}
        className={cn(
          'p-2 rounded-xl',
          'text-slate-400 hover:text-slate-200',
          '[html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700',
          'hover:bg-white/[0.06] [html:not(.dark)_&]:hover:bg-black/[0.04]',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
          className
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Close>
    );
  }
);
PopoverClose.displayName = 'PopoverClose';

/**
 * Popover - Root component with optional hover trigger mode
 */
export interface PopoverProps
  extends Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>, 'open'> {
  triggerMode?: 'click' | 'hover';
  openDelay?: number;
  closeDelay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Popover({
  children,
  triggerMode = 'click',
  openDelay = 200,
  closeDelay = 100,
  open: controlledOpen,
  onOpenChange,
  ...props
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // Determine if we're in controlled mode
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Hover mode handlers - use refs to persist across renders
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = setTimeout(() => {
      handleOpenChange(true);
    }, openDelay);
  }, [handleOpenChange, openDelay]);

  const handleMouseLeave = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      handleOpenChange(false);
    }, closeDelay);
  }, [handleOpenChange, closeDelay]);

  // For hover mode, we wrap in a div with mouse handlers
  if (triggerMode === 'hover') {
    return (
      <PopoverPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'inline-block' }}
        >
          {children}
        </div>
      </PopoverPrimitive.Root>
    );
  }

  // Default click mode
  return (
    <PopoverPrimitive.Root
      open={isControlled ? controlledOpen : undefined}
      onOpenChange={onOpenChange}
      {...props}
    >
      {children}
    </PopoverPrimitive.Root>
  );
}

// Namespace type
type PopoverComponent = typeof Popover & {
  Trigger: typeof PopoverTrigger;
  Content: typeof PopoverContent;
  Close: typeof PopoverClose;
  Arrow: typeof PopoverArrow;
};

// Attach namespace components
(Popover as PopoverComponent).Trigger = PopoverTrigger;
(Popover as PopoverComponent).Content = PopoverContent;
(Popover as PopoverComponent).Close = PopoverClose;
(Popover as PopoverComponent).Arrow = PopoverArrow;

// Named exports for tree-shaking
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
};

// Default export for backwards compatibility
export default Popover as PopoverComponent;
