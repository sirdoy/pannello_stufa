'use client';

import type React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * TooltipProvider - Wraps app once to manage global tooltip behavior
 */
export interface TooltipProviderProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider> {}

function TooltipProvider({ children, delayDuration = 400, skipDelayDuration = 300, ...props }: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

/**
 * TooltipRoot - Root component for tooltip composition
 */
export interface TooltipRootProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {}

function TooltipRoot({ children, ...props }: TooltipRootProps) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

/**
 * TooltipTrigger - Wraps the element that triggers the tooltip
 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * TooltipContent - The tooltip popup with Ember Noir styling
 */
export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {}

const TooltipContent = forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  function TooltipContent({ className, sideOffset = 4, children, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 px-3 py-1.5 text-sm',
          'bg-slate-800 [html:not(.dark)_&]:bg-slate-900',
          'text-slate-100',
          'rounded-lg shadow-lg',
          'border border-slate-700/50 [html:not(.dark)_&]:border-slate-700',
          // Animation
          'animate-fade-in',
          'data-[state=closed]:animate-fade-out',
          // Reduced motion
          'motion-reduce:animate-none',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className="fill-slate-800 [html:not(.dark)_&]:fill-slate-900"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

/**
 * Tooltip - Simple single-component API
 *
 * Use this for simple tooltips. For complex compositions, use the
 * individual Tooltip.Root, Tooltip.Trigger, and Tooltip.Content components.
 *
 * @example
 * <Tooltip content="Hello world">
 *   <Button>Hover me</Button>
 * </Tooltip>
 */
export interface TooltipProps extends Omit<TooltipRootProps, 'children'> {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

function Tooltip({ children, content, side = 'top', ...props }: TooltipProps) {
  return (
    <TooltipRoot {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  );
}

// Namespace type
type TooltipComponent = typeof Tooltip & {
  Provider: typeof TooltipProvider;
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
};

// Attach namespace components
(Tooltip as TooltipComponent).Provider = TooltipProvider;
(Tooltip as TooltipComponent).Root = TooltipRoot;
(Tooltip as TooltipComponent).Trigger = TooltipTrigger;
(Tooltip as TooltipComponent).Content = TooltipContent;

// Named exports
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };

// Default export
export default Tooltip as TooltipComponent;
