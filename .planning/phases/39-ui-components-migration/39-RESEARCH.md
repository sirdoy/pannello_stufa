# Phase 39: UI Components Migration - Research

**Researched:** 2026-02-06
**Domain:** React component JSX to TSX migration with typed props
**Confidence:** HIGH

## Summary

This research covers the migration of ~114 React UI components (64 design system + ~50 application) from `.jsx` to `.tsx` with TypeScript typed props. The project has completed Phase 37 (TypeScript foundation with shared types) and Phase 38 (library migration with zero tsc errors), providing a solid foundation for component migration.

The standard approach for component migration involves:
1. Batch migration using `git mv` to preserve history
2. Define Props interfaces using CVA VariantProps for styled components
3. Type forwardRef components with explicit ref and props generics
4. Use ReactNode for children props (most permissive, standard practice)
5. Preserve namespace component patterns (Tabs.List, Accordion.Item, etc.)
6. Maintain zero tsc errors per wave (no gap closure phase)

The project already has:
- 64 design system components in `app/components/ui/` using CVA for variants
- Radix UI primitives with forwardRef for accessibility
- Namespace component patterns (Tabs.List, Sheet.Content, Accordion.Item, etc.)
- Established type patterns from Phase 37 (WithChildren, WithDisabled, WithLoading mixins)
- Working TypeScript config with `allowJs: true` for incremental migration

**Primary recommendation:** Migrate design system components first (dependencies for app components), use `git mv` to preserve history, extract Props types with CVA's `VariantProps<typeof componentVariants>` for styled components, type forwardRef with explicit generics, and maintain zero tsc errors per wave through careful batching and testing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Props strictness:**
- Pragmatic approach to `any` usage: minimize but allow where full typing would require overly complex generics. Focus on catching real bugs, not type gymnastics
- Children prop type: Claude's discretion per component based on actual usage (ReactNode vs ReactElement)
- Spread props / HTML attribute extension: Claude's discretion per component based on current implementation
- Event handler types: Claude's discretion — use specific React event types when handler uses event properties, simple callbacks when it just triggers an action

**Component patterns:**
- Namespace patterns (Tabs.List, Accordion.Item, Sheet.Content): Claude's discretion on typing approach while preserving current usage patterns
- forwardRef typing: Claude's discretion per component's needs
- Polymorphic components / `as` prop: Claude's discretion based on actual usage
- Generic type parameters on reusable components: Claude's discretion — add only where component already handles multiple data types

**Migration batching:**
- **Design system first**: Migrate all 64 ui/ components first (they're dependencies), then migrate ~50 app components
- Wave sizing: Claude's discretion based on component complexity and dependencies
- **Zero tsc errors per wave**: Each plan must leave tsc clean. No gap closure phase — different from Phase 38
- Progress tracking: Claude's discretion

**Interface conventions:**
- Props naming convention: Claude's discretion based on whether props need to be importable
- interface vs type: Claude's discretion (interface for extension, type for unions)
- Variant props: Claude's discretion based on existing codebase patterns
- Mixin types (WithChildren, WithDisabled, WithLoading from Phase 37): Claude's discretion — use where they fit naturally

### Claude's Discretion

Most typing decisions are delegated to Claude with the guiding principles:
- Be pragmatic, not dogmatic — minimize `any` but don't over-engineer
- Preserve existing component API and usage patterns
- Match patterns established in Phase 37/38 types
- Each plan must achieve zero tsc errors (no deferred gap closure)
- Design system components before application components

### Specific Implementation Notes

- Phase 38 used git mv to preserve history — continue this pattern for .jsx → .tsx renames
- Phase 37 created mixin interfaces (WithChildren, WithDisabled, WithLoading) — available for composition
- Zero errors per wave is a hard requirement — different from Phase 38's gap closure approach
- Design system components are the foundation — migrate them first so app components can import typed versions

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | bundled with Next.js | Type checking | Already working in project |
| React | 19.x | Component framework | Current version |
| @types/react | 19.2.8 | React type definitions | Already installed |
| class-variance-authority | 0.7.1 | Variant typing with VariantProps | Already used for all design system components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/* | Various | Accessible primitives | Many design system components use Radix (Accordion, Tabs, Sheet, Dialog, etc.) |
| lucide-react | Latest | Icon library | Used throughout design system |
| React.forwardRef | Built-in | Ref forwarding | Components that need ref access (all Radix wrappers) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Props interfaces | CVA VariantProps | VariantProps extracts types from CVA variants automatically, reducing duplication |
| PropsWithChildren utility | ReactNode directly | PropsWithChildren is just `{ children?: ReactNode }`, direct is clearer |
| React.FC | Function component without FC | React.FC has drawbacks (implicit children, type inference issues), modern React avoids it |

**Installation:**
```bash
# No installation needed - all dependencies already in project
# TypeScript bundled with Next.js
# CVA, Radix UI, React types already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/components/ui/
├── Button.tsx              # Migrated with Props interface + CVA VariantProps
├── Card.tsx                # Migrated with namespace pattern (Card.Header, Card.Content)
├── Tabs.tsx                # Migrated with namespace + context + forwardRef
├── Accordion.tsx           # Migrated with Radix wrapper + forwardRef
├── SmartHomeCard.tsx       # Migrated with namespace + forwardRef subcomponents
├── index.ts                # Barrel export (already exists, update imports)
└── __tests__/
    └── Button.test.js      # Tests stay as .js (no need to migrate)

app/components/weather/
├── WeatherCard.tsx         # Application component migrated after ui/ components
├── CurrentConditions.tsx   # Application component
└── ForecastRow.tsx         # Application component
```

### Pattern 1: CVA Component with VariantProps
**What:** Extract prop types from CVA variants using VariantProps utility
**When to use:** All components using CVA for styling (most design system components)
**Example:**
```typescript
// Source: CVA official docs + project Button.js
'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// CVA variants definition
export const buttonVariants = cva(
  ['font-display', 'font-semibold', 'rounded-xl', 'transition-all'],
  {
    variants: {
      variant: {
        ember: ['bg-gradient-to-br', 'from-ember-500', 'text-white'],
        subtle: ['bg-white/[0.06]', 'text-slate-200'],
        ghost: ['bg-transparent', 'text-slate-300'],
      },
      size: {
        sm: ['px-3', 'py-2', 'text-sm', 'min-h-[44px]'],
        md: ['px-4', 'py-3', 'text-base', 'min-h-[48px]'],
        lg: ['px-6', 'py-4', 'text-lg', 'min-h-[56px]'],
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);

// Extract variant types from CVA
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { children, className, variant, size, loading, icon, iconPosition = 'left', ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
```

### Pattern 2: Namespace Components with Subcomponents
**What:** Type namespace pattern (Parent.Child) preserving existing API
**When to use:** Components with subcomponents (Tabs.List, Accordion.Item, Card.Header, SmartHomeCard.Status)
**Example:**
```typescript
// Source: Project Tabs.js + TypeScript React patterns
'use client';

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// CVA variants
const listVariants = cva(['relative', 'flex', 'gap-1'], {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
});

// Props interfaces
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof listVariants> {}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
}

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

// Subcomponents with forwardRef
const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ children, className, orientation, ...props }, ref) {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(listVariants({ orientation }), className)}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    );
  }
);
TabsList.displayName = 'TabsList';

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ children, className, icon, ...props }, ref) {
    return (
      <TabsPrimitive.Trigger ref={ref} className={cn('...', className)} {...props}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </TabsPrimitive.Trigger>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ children, className, ...props }, ref) {
    return (
      <TabsPrimitive.Content ref={ref} className={cn('...', className)} {...props}>
        {children}
      </TabsPrimitive.Content>
    );
  }
);
TabsContent.displayName = 'TabsContent';

// Main component (no forwardRef needed)
export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

function Tabs({ children, ...props }: TabsProps) {
  return <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>;
}

// Attach subcomponents to create namespace
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
```

### Pattern 3: Radix UI Wrapper Components
**What:** Type Radix primitives with ComponentPropsWithoutRef
**When to use:** All Radix UI wrapper components (Accordion, Sheet, Dialog, Popover, etc.)
**Example:**
```typescript
// Source: Radix UI docs + project Accordion.js
'use client';

import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const itemVariants = cva(['border-b', 'border-white/[0.06]']);

// Use ComponentPropsWithoutRef to inherit Radix props
export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof itemVariants> {}

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem({ children, className, ...props }, ref) {
    return (
      <AccordionPrimitive.Item
        ref={ref}
        className={cn(itemVariants(), className)}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

// Similar for AccordionTrigger and AccordionContent...

function Accordion(props: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root {...props} />;
}

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export default Accordion;
```

### Pattern 4: ReactNode vs ReactElement for Children
**What:** Choose appropriate children type based on actual usage
**When to use:** All components accepting children prop
**Example:**
```typescript
// Use ReactNode (most permissive) for wrapper components
interface CardProps {
  children?: React.ReactNode; // Accepts strings, numbers, JSX, arrays, null
  className?: string;
}

// Use ReactElement when you need actual JSX element (rare)
interface SpecificSlotProps {
  children: React.ReactElement; // Only accepts JSX elements, not strings
}

// Most common: ReactNode is the standard for children props
// Source: React TypeScript best practices + project patterns
```

### Pattern 5: Event Handler Types
**What:** Use specific React event types or generic callbacks
**When to use:** All event handler props (onClick, onChange, onFocus, etc.)
**Example:**
```typescript
// Specific event type when handler uses event properties
interface InputProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

// Generic callback when handler just triggers action
interface ButtonProps {
  onClick?: () => void; // Simple callback, no event needed
}

// With optional event parameter
interface ControlButtonProps {
  onChange?: (value: number, e?: React.MouseEvent<HTMLButtonElement>) => void;
}
```

### Pattern 6: Mixin Types from Phase 37
**What:** Compose props with established mixin interfaces
**When to use:** Components with common prop patterns (children, disabled, loading)
**Example:**
```typescript
// Source: types/components/common.ts (Phase 37)
import type { WithChildren, WithDisabled, WithLoading } from '@/types/components';

// Compose with mixins
interface SmartHomeCardProps extends WithChildren, WithDisabled {
  icon?: React.ReactNode;
  title: string;
  colorTheme?: 'ember' | 'ocean' | 'sage';
  isLoading?: boolean; // Or use WithLoading
}

// Available mixins from Phase 37:
// - WithChildren: { children?: ReactNode }
// - WithDisabled: { disabled?: boolean }
// - WithLoading: { loading?: boolean }
// - WithFormField: { name?, label?, error?, required? }
```

### Anti-Patterns to Avoid
- **Using React.FC:** Modern React avoids React.FC due to implicit children and type inference issues
- **Overly strict children types:** Use ReactNode (permissive) not ReactElement (restrictive) unless you have a specific need
- **Manual variant prop typing:** Use CVA's VariantProps instead of manually typing variant options
- **Missing displayName:** Always set displayName on forwardRef components for DevTools
- **Breaking existing API:** Preserve existing prop names and patterns when adding types
- **any for complex types:** Use unknown with type guards, or accept pragmatic any for truly dynamic cases
- **Type-only imports in client components:** Use `import type` for types, `import` for runtime values

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Extract variant types from CVA | Manual union types | `VariantProps<typeof variants>` | CVA provides automatic type extraction |
| Type Radix props | Manual interfaces | `ComponentPropsWithoutRef<typeof Primitive.X>` | Radix provides full type definitions |
| Children prop type | Custom ReactChild type | `React.ReactNode` | Standard React type for renderable content |
| forwardRef generic types | Inferred types | Explicit `forwardRef<Element, Props>` | Explicit types prevent inference errors |
| HTML element props | Manual interfaces | `React.HTMLAttributes<HTMLDivElement>` or `React.ButtonHTMLAttributes<HTMLButtonElement>` | Built-in React types cover all HTML attributes |
| Event handler types | any or generic function | `React.MouseEvent<HTMLButtonElement>`, `React.ChangeEvent<HTMLInputElement>` | Specific React event types provide correct typing |

**Key insight:** The design system already uses CVA for variants and Radix for primitives. TypeScript types should be extracted from these existing patterns, not recreated manually.

## Common Pitfalls

### Pitfall 1: React.FC Issues
**What goes wrong:** Using React.FC causes type inference problems and implicit children
**Why it happens:** Legacy pattern from older React TypeScript practices
**How to avoid:** Use explicit function declaration with typed props, avoid React.FC completely
**Warning signs:** Children prop appearing when not intended, generic type inference failing
**Source:** [React with TypeScript Best Practices - SitePoint](https://www.sitepoint.com/react-with-typescript-best-practices/)

### Pitfall 2: Namespace Component Type Loss
**What goes wrong:** Namespace properties (Tabs.List) lose types after assignment
**Why it happens:** TypeScript doesn't automatically infer namespace property types
**How to avoid:** Export both namespace component and individual subcomponents explicitly
**Warning signs:** No autocomplete for subcomponent props, type errors on subcomponents
**Source:** [React components with namespace - Medium](https://medium.com/@kunukn_95852/react-components-with-namespace-f3d169feaf91)

### Pitfall 3: forwardRef Generic Order Confusion
**What goes wrong:** forwardRef types in wrong order causes ref type errors
**Why it happens:** Generic order (ref, props) is opposite of parameter order (props, ref)
**How to avoid:** Always use `forwardRef<ElementType, PropsType>` explicitly
**Warning signs:** Ref type mismatch errors, "Type 'X' is not assignable to type 'Ref<Y>'"
**Source:** [TypeScript forwardRef typing - Total TypeScript](https://www.totaltypescript.com/forwardref-with-generic-components)

### Pitfall 4: Missing displayName on forwardRef
**What goes wrong:** Components show as "Anonymous" in React DevTools
**Why it happens:** forwardRef returns anonymous function by default
**How to avoid:** Always set `Component.displayName = 'ComponentName'` after forwardRef
**Warning signs:** DevTools showing <Anonymous> instead of component name
**Source:** Project pattern in all existing forwardRef components

### Pitfall 5: Overly Restrictive Children Types
**What goes wrong:** Using ReactElement for children prevents strings, numbers, arrays
**Why it happens:** Confusion between ReactNode (permissive) and ReactElement (restrictive)
**How to avoid:** Default to ReactNode for children, only use ReactElement if you specifically need JSX elements
**Warning signs:** Type errors when passing string children, "Type 'string' is not assignable to type 'ReactElement'"
**Source:** [ReactNode vs ReactElement - Total TypeScript](https://www.totaltypescript.com/jsx-element-vs-react-reactnode)

### Pitfall 6: Breaking Zero Errors Requirement
**What goes wrong:** Migration wave introduces tsc errors in other files
**Why it happens:** Type changes propagate to dependent components not yet migrated
**How to avoid:** Test `tsc --noEmit` after each component migration, batch carefully to minimize dependencies
**Warning signs:** Errors in files not touched by current migration
**Context:** Zero errors per wave is a hard requirement per CONTEXT.md

### Pitfall 7: CVA Variants Not Exported
**What goes wrong:** VariantProps can't extract types, manual duplication needed
**Why it happens:** Variants defined but not exported from component file
**How to avoid:** Export variants with `export const componentVariants = cva(...)` pattern
**Warning signs:** Need to manually type variant props that CVA already defines
**Source:** [CVA TypeScript docs](https://cva.style/docs/getting-started/typescript)

## Code Examples

Verified patterns from project and official sources:

### Example 1: Simple CVA Component (Button)
```typescript
// Source: app/components/ui/Button.js + CVA docs
'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const buttonVariants = cva(
  ['font-display', 'rounded-xl', 'transition-all'],
  {
    variants: {
      variant: {
        ember: ['bg-gradient-to-br', 'from-ember-500'],
        ghost: ['bg-transparent', 'text-slate-300'],
      },
      size: {
        sm: ['px-3', 'py-2', 'min-h-[44px]'],
        md: ['px-4', 'py-3', 'min-h-[48px]'],
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, className, variant, size, loading, icon, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
```

### Example 2: Namespace Component with Context (Tabs)
```typescript
// Source: app/components/ui/Tabs.js
'use client';

import { forwardRef, createContext, useContext } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// Context for internal state (if needed)
const TabsContext = createContext<{ value?: string }>({ value: undefined });

const listVariants = cva(['relative', 'flex', 'gap-1']);
const triggerVariants = cva(['px-4', 'py-2.5', 'min-h-[44px]']);

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof listVariants> {}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ children, className, ...props }, ref) {
    return (
      <TabsPrimitive.List ref={ref} className={cn(listVariants(), className)} {...props}>
        {children}
      </TabsPrimitive.List>
    );
  }
);
TabsList.displayName = 'TabsList';

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ children, className, icon, ...props }, ref) {
    return (
      <TabsPrimitive.Trigger ref={ref} className={cn(triggerVariants(), className)} {...props}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </TabsPrimitive.Trigger>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

// Main component
export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

function Tabs({ children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value: props.value }}>
      <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
// ... other subcomponents

export { Tabs, TabsList, TabsTrigger };
export default Tabs;
```

### Example 3: Application Component (WeatherCard)
```typescript
// Source: app/components/weather/WeatherCard.jsx
'use client';

import { useState } from 'react';
import { SmartHomeCard, Badge, Button, Text } from '@/app/components/ui';
import { CloudSun, RefreshCw } from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    pressure?: number;
  };
  forecast: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
  }>;
  hourly?: {
    temperatures: number[];
  };
  cachedAt?: string;
  stale?: boolean;
}

export interface WeatherCardProps {
  weatherData?: WeatherData | null;
  locationName?: string | null;
  indoorTemp?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function WeatherCard({
  weatherData = null,
  locationName = null,
  indoorTemp = null,
  isLoading = false,
  error = null,
  onRetry = () => {},
  onRefresh = () => {},
  isRefreshing = false,
}: WeatherCardProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (isLoading) {
    return <Skeleton.WeatherCard />;
  }

  if (error) {
    return (
      <SmartHomeCard icon={<CloudSun />} title="Meteo" colorTheme="ocean">
        <SmartHomeCard.Controls>
          <div className="text-center py-8">
            <Text variant="secondary" className="mb-4">
              {error.message || 'Impossibile caricare il meteo'}
            </Text>
            <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw />}>
              Riprova
            </Button>
          </div>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  // ... rest of component
}

export default WeatherCard;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React.FC | Explicit function types | 2021-2022 | Better type inference, no implicit children |
| Manual variant types | CVA VariantProps | 2023-present | Automatic type extraction from CVA definitions |
| PropTypes (runtime) | TypeScript interfaces | 2024-present | Compile-time checking, better IDE support |
| defaultProps | ES6 default parameters | React 18+ | Simpler, better with TypeScript |
| Implicit forwardRef types | Explicit generics | 2022-present | Prevents ref type inference errors |
| React 18 forwardRef required | React 19 ref as prop | React 19 (2025) | Simpler API, but forwardRef still needed for backward compat |

**Deprecated/outdated:**
- React.FC: No longer recommended, causes implicit children issues
- PropTypes: Replaced by TypeScript for type checking
- defaultProps: Being phased out in favor of destructuring defaults

## Open Questions

Things that couldn't be fully resolved:

1. **Generic Components with forwardRef**
   - What we know: forwardRef breaks type inference for generic components (reported CVA/React issue)
   - What's unclear: Best workaround pattern for project (few generic components identified)
   - Recommendation: Address case-by-case if encountered, may need custom forwardRef declaration merging

2. **Test File Migration**
   - What we know: Test files currently .js, components migrating to .tsx
   - What's unclear: Should tests migrate to .ts or stay .js?
   - Recommendation: Keep tests as .js (working fine, no type errors), focus phase on component files only

3. **Wave Sizing for Zero Errors**
   - What we know: Must maintain zero tsc errors per wave, design system has 64 components
   - What's unclear: Optimal wave size to minimize cross-dependencies
   - Recommendation: Start with 10-15 component batches for design system, analyze dependency errors, adjust sizing

## Sources

### Primary (HIGH confidence)
- [CVA TypeScript Documentation](https://cva.style/docs/getting-started/typescript) - VariantProps extraction pattern
- [React Official TypeScript Guide](https://react.dev/learn/typescript) - Component typing best practices
- [Radix UI Composition Guide](https://www.radix-ui.com/primitives/docs/guides/composition) - forwardRef patterns with primitives
- Project codebase Phase 37 types (`types/components/common.ts`) - Established mixin types
- Project codebase existing components (`app/components/ui/Button.js`, `Tabs.js`, `Accordion.js`) - Current patterns

### Secondary (MEDIUM confidence)
- [React TypeScript Cheatsheet - forwardRef](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forward_and_create_ref/) - forwardRef typing patterns
- [Total TypeScript - ReactNode vs ReactElement](https://www.totaltypescript.com/jsx-element-vs-react-reactnode) - Children prop typing
- [SitePoint - React with TypeScript Best Practices](https://www.sitepoint.com/react-with-typescript-best-practices/) - Modern patterns (2026)
- [Medium - React Namespace Components](https://medium.com/@kunukn_95852/react-components-with-namespace-f3d169feaf91) - Namespace pattern typing
- [LogRocket - React Children Typing](https://blog.logrocket.com/react-children-prop-typescript/) - ReactNode guidance

### Tertiary (LOW confidence - context only)
- WebSearch results on migration strategies - General guidance, not project-specific
- WebSearch results on any vs unknown - TypeScript best practices, not React-specific

## Migration Strategy Recommendations

Based on research findings and user constraints:

### Wave 1: Foundation Components (10-15 components)
Components with minimal dependencies, no namespace patterns:
- Badge, Spinner, Icon, Divider, EmptyState
- Container, Grid, Section
- Heading, Text, Label

**Rationale:** Simple, low-risk, establish patterns early

### Wave 2: Form Components (10-15 components)
Form elements, few cross-dependencies:
- Input, Checkbox, Switch, Slider
- Select, RadioGroup, Toggle
- Progress, ProgressBar

**Rationale:** Self-contained, similar typing patterns

### Wave 3: Namespace Components (10-15 components)
Complex namespace patterns requiring careful typing:
- Tabs, Accordion, Sheet, Modal
- Popover, Tooltip, RightClickMenu
- Card (with subcomponents)

**Rationale:** More complex, benefit from patterns established in Waves 1-2

### Wave 4: Smart Home Components (10-15 components)
Domain-specific design system components:
- SmartHomeCard, StatusCard, DeviceCard
- ConnectionStatus, HealthIndicator
- ControlButton, ActionButton

**Rationale:** Depend on foundation/namespace components from earlier waves

### Wave 5: Complex Components (remaining design system)
DataTable, DashboardLayout, CommandPalette, etc.
**Rationale:** Most complex, benefit from all previous patterns

### Wave 6+: Application Components (~50 files)
Weather components, device cards, page-specific components
**Rationale:** Depend on typed design system from Waves 1-5

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project already uses all libraries, versions confirmed
- Architecture patterns: HIGH - Patterns extracted from existing project code + official docs
- CVA VariantProps: HIGH - Official CVA TypeScript docs + project usage verified
- Radix UI typing: HIGH - Official Radix composition guide + project implementations
- Migration strategy: MEDIUM - Batching strategy based on best practices, wave sizing needs validation
- Generic forwardRef: LOW - Known limitation, case-by-case resolution needed

**Research date:** 2026-02-06
**Valid until:** 60 days (stable domain, TypeScript/React patterns mature)

**Key validation needed:**
1. Verify wave sizing maintains zero tsc errors (adjust batch size if needed)
2. Test namespace component typing pattern preserves existing API
3. Confirm CVA VariantProps exports work for all styled components
4. Validate Radix ComponentPropsWithoutRef pattern for all primitives
