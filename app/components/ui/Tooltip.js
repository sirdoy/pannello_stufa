'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * TooltipProvider - Wraps app once to manage global tooltip behavior
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Child elements
 * @param {number} props.delayDuration - Delay before showing (ms)
 * @param {number} props.skipDelayDuration - Skip delay when moving between tooltips (ms)
 */
function TooltipProvider({ children, delayDuration = 400, skipDelayDuration = 300 }) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

/**
 * TooltipRoot - Root component for tooltip composition
 * Manages open state and event handlers
 */
function TooltipRoot({ children, ...props }) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

/**
 * TooltipTrigger - Wraps the element that triggers the tooltip
 * Automatically handles hover and focus events
 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * TooltipContent - The tooltip popup with Ember Noir styling
 *
 * @param {Object} props
 * @param {string} props.className - Additional classes
 * @param {number} props.sideOffset - Distance from trigger (px)
 * @param {'top'|'right'|'bottom'|'left'} props.side - Preferred side
 * @param {ReactNode} props.children - Tooltip content
 */
const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 4, children, ...props },
  ref
) {
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
 * @param {Object} props
 * @param {ReactNode} props.children - The trigger element
 * @param {ReactNode} props.content - Tooltip content
 * @param {'top'|'right'|'bottom'|'left'} props.side - Preferred side
 * @param {boolean} props.open - Controlled open state
 * @param {function} props.onOpenChange - Callback when open state changes
 *
 * @example
 * <Tooltip content="Hello world">
 *   <Button>Hover me</Button>
 * </Tooltip>
 */
function Tooltip({ children, content, side = 'top', ...props }) {
  return (
    <TooltipRoot {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  );
}

// Attach namespace components
Tooltip.Provider = TooltipProvider;
Tooltip.Root = TooltipRoot;
Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

// Named exports
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };

// Default export
export default Tooltip;
