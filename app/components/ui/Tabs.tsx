'use client';

import type React from 'react';
import { forwardRef, useLayoutEffect, useRef, useState, createContext, useContext } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Tabs Component - Ember Noir Design System v4.0
 *
 * Built on Radix Tabs primitive with:
 * - Sliding underline indicator (smooth transition)
 * - Horizontal and vertical orientations
 * - Icon + text support
 * - Size variants (sm, md, lg)
 * - Keyboard navigation (arrow keys)
 * - Accessible by default (role="tablist", role="tab", role="tabpanel")
 *
 * @example
 * // Basic usage
 * <Tabs defaultValue="tab1">
 *   <Tabs.List>
 *     <Tabs.Trigger value="tab1">Schedule</Tabs.Trigger>
 *     <Tabs.Trigger value="tab2">Manual</Tabs.Trigger>
 *     <Tabs.Trigger value="tab3">History</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="tab1">Schedule content</Tabs.Content>
 *   <Tabs.Content value="tab2">Manual content</Tabs.Content>
 *   <Tabs.Content value="tab3">History content</Tabs.Content>
 * </Tabs>
 *
 * @example
 * // With icons
 * <Tabs defaultValue="schedule">
 *   <Tabs.List>
 *     <Tabs.Trigger value="schedule" icon={<Calendar />}>Schedule</Tabs.Trigger>
 *     <Tabs.Trigger value="manual" icon={<Sliders />}>Manual</Tabs.Trigger>
 *   </Tabs.List>
 * </Tabs>
 *
 * @example
 * // Vertical orientation
 * <Tabs defaultValue="tab1" orientation="vertical">
 *   <Tabs.List orientation="vertical">
 *     <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
 *     <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
 *   </Tabs.List>
 * </Tabs>
 */

// Context for tracking current value (needed for indicator positioning)
interface TabsContextValue {
  value: string | undefined;
}

const TabsContext = createContext<TabsContextValue>({ value: undefined });

// CVA variants for TabsList
const listVariants = cva(
  [
    'relative flex gap-1',
    'border-b border-white/[0.06]',
    '[html:not(.dark)_&]:border-black/[0.06]',
  ],
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col border-b-0 border-r',
      },
      overflow: {
        scroll: 'overflow-x-auto scrollbar-hide',
        wrap: 'flex-wrap',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      overflow: 'scroll',
    },
  }
);

// CVA variants for TabsTrigger
const triggerVariants = cva(
  [
    'px-4 py-2.5 min-h-[44px]',
    'font-display font-medium text-sm',
    'text-slate-400 hover:text-slate-200',
    '[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-slate-900',
    'transition-colors duration-[var(--duration-fast)]',
    // Focus ring
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50 focus-visible:ring-inset',
    // Active state
    'data-[state=active]:text-slate-100',
    '[html:not(.dark)_&]:data-[state=active]:text-slate-900',
    // Disabled state
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-xs min-h-[36px]',
        md: 'px-4 py-2.5 text-sm min-h-[44px]',
        lg: 'px-5 py-3 text-base min-h-[48px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

/**
 * TabsList - Container for tab triggers with sliding indicator
 */
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof listVariants> {}

const TabsList = forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  function TabsList({ children, className, orientation = 'horizontal', overflow, ...props }, ref) {
    const { value } = useContext(TabsContext);
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ width: 0, left: 0, opacity: 0 });
    const listRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
      const activeTab = listRef.current?.querySelector('[data-state="active"]') as HTMLElement | null;
      if (activeTab) {
        if (orientation === 'horizontal') {
          setIndicatorStyle({
            width: activeTab.offsetWidth,
            left: activeTab.offsetLeft,
            opacity: 1,
          });
        } else {
          setIndicatorStyle({
            height: activeTab.offsetHeight,
            top: activeTab.offsetTop,
            opacity: 1,
          });
        }
      }
    }, [value, orientation]);

    return (
      <TabsPrimitive.List
        ref={(node) => {
          listRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(listVariants({ orientation, overflow }), className)}
        {...props}
      >
        {children}
        {/* Sliding indicator */}
        <span
          className={cn(
            'absolute bg-ember-500',
            '[html:not(.dark)_&]:bg-ember-700',
            'transition-all duration-[var(--duration-smooth)]',
            // Use spring easing with subtle overshoot for polished feel
            'ease-[var(--ease-spring-subtle)]',
            'motion-reduce:transition-none',
            orientation === 'horizontal'
              ? 'bottom-0 h-0.5'
              : 'right-0 w-0.5',
          )}
          style={indicatorStyle}
          aria-hidden="true"
          data-testid="tabs-indicator"
        />
      </TabsPrimitive.List>
    );
  }
);
TabsList.displayName = 'TabsList';

/**
 * TabsTrigger - Individual tab button with icon support
 */
export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof triggerVariants> {
  icon?: React.ReactNode;
}

const TabsTrigger = forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  function TabsTrigger({ children, className, size, icon, ...props }, ref) {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(triggerVariants({ size }), className)}
        {...props}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>}
          {children}
        </span>
      </TabsPrimitive.Trigger>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent - Content panel for each tab
 */
export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

const TabsContent = forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, TabsContentProps>(
  function TabsContent({ children, className, ...props }, ref) {
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          'focus-visible:outline-none',
          // Fade transition between panels
          'data-[state=active]:animate-fade-in',
          'motion-reduce:animate-none',
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    );
  }
);
TabsContent.displayName = 'TabsContent';

/**
 * Tabs - Root component with context provider
 */
export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

function Tabs({ children, value, defaultValue, onValueChange, orientation, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue }}>
      <TabsPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        orientation={orientation}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

// Namespace type
type TabsComponent = typeof Tabs & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
};

// Attach namespace components
(Tabs as TabsComponent).List = TabsList;
(Tabs as TabsComponent).Trigger = TabsTrigger;
(Tabs as TabsComponent).Content = TabsContent;

// Named exports for tree-shaking
export { Tabs, TabsList, TabsTrigger, TabsContent };

// Default export for backwards compatibility
export default Tabs as TabsComponent;
