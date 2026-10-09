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
 * <Tabs.List>
 * <Tabs.Trigger value="tab1">Schedule</Tabs.Trigger>
 * <Tabs.Trigger value="tab2">Manual</Tabs.Trigger>
 * <Tabs.Trigger value="tab3">History</Tabs.Trigger>
 * </Tabs.List>
 * <Tabs.Content value="tab1">Schedule content</Tabs.Content>
 * <Tabs.Content value="tab2">Manual content</Tabs.Content>
 * <Tabs.Content value="tab3">History content</Tabs.Content>
 * </Tabs>
 *
 * @example
 * // With icons
 * <Tabs defaultValue="schedule">
 * <Tabs.List>
 * <Tabs.Trigger value="schedule" icon={<Calendar />}>Schedule</Tabs.Trigger>
 * <Tabs.Trigger value="manual" icon={<Sliders />}>Manual</Tabs.Trigger>
 * </Tabs.List>
 * </Tabs>
 *
 * @example
 * // Vertical orientation
 * <Tabs defaultValue="tab1" orientation="vertical">
 * <Tabs.List orientation="vertical">
 * <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
 * <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
 * </Tabs.List>
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
    'relative flex gap-0.5',
    'rounded-[11px] border-[0.5px] border-white/8 bg-white/5 p-[3px]',
  ],
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      overflow: {
        scroll: 'scrollbar-hide overflow-x-auto',
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
    'shrink-0 rounded-lg',
    'font-body font-semibold',
    'text-(--text-2) hover:text-white',
    'transition-colors duration-(--duration-fast)',
    // Focus ring
    'focus-visible:ring-2 focus-visible:ring-ember-500/50 focus-visible:outline-none focus-visible:ring-inset',
    // Active state
    'data-[state=active]:bg-white/12 data-[state=active]:text-white',
    // Disabled state
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'min-h-9 px-3 py-1.5 text-xs',
        // md and lg keep the 44px minimum touch target
        md: 'min-h-11 px-3.5 py-1.5 text-[13px]',
        lg: 'min-h-12 px-4 py-2 text-sm',
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

// Hidden until the first measurement; stable object so re-renders never reset the measured values
const INDICATOR_INITIAL_STYLE: React.CSSProperties = { opacity: 0 };

const TabsList = forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  function TabsList({ children, className, orientation = 'horizontal', overflow, ...props }, ref) {
    const { value } = useContext(TabsContext);
    const listRef = useRef<HTMLDivElement | null>(null);
    const indicatorRef = useRef<HTMLSpanElement | null>(null);

    // Measure the active tab and move the indicator imperatively: a DOM-to-DOM sync
    // needs no React state (and no second render)
    useLayoutEffect(() => {
      const activeTab = listRef.current?.querySelector('[data-state="active"]') as HTMLElement | null;
      const style = indicatorRef.current?.style;
      if (!activeTab || !style) return;
      if (orientation === 'horizontal') {
        style.width = `${activeTab.offsetWidth}px`;
        style.left = `${activeTab.offsetLeft}px`;
        style.height = '';
        style.top = '';
      } else {
        style.height = `${activeTab.offsetHeight}px`;
        style.top = `${activeTab.offsetTop}px`;
        style.width = '';
        style.left = '';
      }
      style.opacity = '1';
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
            // Segmented look: the active tab is a filled pill, the sliding underline is not shown
            'absolute hidden bg-ember-500',
            'transition-all duration-(--duration-smooth)',
            // Use spring easing with subtle overshoot for polished feel
            'ease-spring-subtle',
            'motion-reduce:transition-none',
            orientation === 'horizontal'
              ? 'bottom-0 h-0.5'
              : 'right-0 w-0.5',
          )}
          ref={indicatorRef}
          style={INDICATOR_INITIAL_STYLE}
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
          {icon && <span className="shrink-0 text-base" aria-hidden="true">{icon}</span>}
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
export type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

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
export type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

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
