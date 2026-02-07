# Phase 41: Pages Migration - Research

**Researched:** 2026-02-07
**Domain:** Next.js 16 page, layout, and React Context migration to TypeScript
**Confidence:** HIGH

## Summary

This research covers the TypeScript migration of 67 files in the app/ directory: 37 pages (page.js), 3 root files (layout.js, template.js, not-found.js), 3 context providers (ThemeContext, VersionContext, PageTransitionContext), and 27 co-located components (debug tabs, design-system docs, thermostat schedule UI, camera/notification/settings components).

The standard approach for Next.js 16 pages is to:
1. Use git mv to preserve history for all file migrations
2. Type pages with async props for params and searchParams (Next.js 16 change)
3. Type layouts with children: React.ReactNode and async params if using dynamic routes
4. Type context providers with explicit interfaces and custom hooks for type safety
5. Type co-located components with domain-specific callbacks (not generic React events)
6. Import Metadata type from 'next' for static metadata exports
7. Aim for less `any` usage than API routes (pages are simpler)

**Primary recommendation:** Follow Phase 40 patterns (double assertion, inline interfaces, pragmatic any) but calibrate for pages which are simpler than API routes. Use Next.js 16's async params/searchParams pattern. Type context providers with null default + runtime checking via custom hooks (null with type guard pattern established in project). Migrate all 27 co-located components in this phase (not deferred to gap closure per user decision).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All 27 co-located components migrated in Phase 41 (not deferred to gap closure)
- Includes: debug tabs (7), design-system doc components (4+1 data file), thermostat schedule components (7), camera components (2), notification components (1), settings components (1)
- Test mocks (app/components/ui/__mocks__/Text.js) and test files (thermostat/page.test.js) deferred to Phase 42
- Pure migration — no behavior changes to any file

### Claude's Discretion
- Context provider default value strategy per context (null + type guard vs defined defaults)
- Context value interface location (inline vs shared location based on complexity/reuse)
- Consumer hook return type annotation style (explicit vs inferred based on Phase 38-39 patterns)
- PageProps shared type vs inline per page (based on actual param/searchParam usage)
- Metadata import and typing approach (assess which pages have metadata exports)
- SearchParams specificity per page (specific keys vs generic Record based on actual usage)
- Gap closure strategy (separate plan vs inline fixes based on error volume, Phase 40-07 pattern)
- Event handler typing approach per component (domain-specific callbacks vs React event types based on what each component actually passes)
- Design-system component-docs.js typing depth (pragmatic typing for large data file)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

**Phase 42 items (already documented):**
- Test mock migration (app/components/ui/__mocks__/Text.js)
- Test file migration (app/thermostat/page.test.js)
- API route test import path updates (route.js → route.ts)
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.0 | Next.js framework with async props | Project's current version |
| react | 19.2.0 | React with new Context API patterns | Project's current version |
| typescript | bundled with Next.js | Type checking | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.8 | React type definitions | Already installed |
| Metadata type | bundled with Next.js | Static metadata typing | For pages/layouts with metadata exports |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual PageProps typing | Next.js 16 PageProps helper | PageProps helper provides route-specific autocomplete but requires typegen |
| Async params/searchParams | Synchronous props | Next.js 16 requires async (params since 16.0, searchParams since 15.0) |
| Context null default | Defined default values | Null forces explicit provider checks, better error messages |

**Installation:**
```bash
# No installation needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── page.tsx                  # Pages with async props
├── layout.tsx                # Layouts with children: React.ReactNode
├── template.tsx              # Template with children
├── not-found.tsx             # Error pages
├── context/
│   ├── ThemeContext.tsx      # Providers with null + type guard
│   ├── VersionContext.tsx
│   └── PageTransitionContext.tsx
├── (pages)/                  # Route groups
│   └── camera/
│       ├── page.tsx          # Client page ('use client')
│       └── CameraDashboard.tsx  # Co-located component
├── debug/
│   └── design-system/
│       ├── page.tsx
│       ├── components/       # Co-located docs components
│       └── data/
│           └── component-docs.ts  # Data file (.ts not .js)
└── thermostat/schedule/
    └── components/           # Co-located schedule UI components
```

### Pattern 1: Next.js 16 Async Page Props
**What:** Pages receive async params and searchParams in Next.js 16
**When to use:** All page.js files
**Example:**
```typescript
// Source: Next.js 16 official docs
// https://nextjs.org/docs/app/api-reference/file-conventions/page

// Server component page (default)
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ query?: string }>;
}) {
  const { slug } = await params;
  const { query } = await searchParams;

  return <div>...</div>;
}

// Client component page
'use client';
export default function ClientPage() {
  // No params/searchParams props in client pages
  // Use useSearchParams() hook instead
  return <div>...</div>;
}
```

### Pattern 2: Layout Children Typing
**What:** Layouts receive children as React.ReactNode, optional async params
**When to use:** layout.js files
**Example:**
```typescript
// Source: Next.js 16 official docs
// https://nextjs.org/docs/app/api-reference/file-conventions/layout

// Root layout (no params)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

// Dynamic route layout (with params)
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  return <div>...</div>;
}
```

### Pattern 3: Static Metadata Typing
**What:** Import Metadata type from 'next' for static metadata exports
**When to use:** Pages/layouts with metadata exports
**Example:**
```typescript
// Source: Next.js Metadata official docs
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto della stufa',
  applicationName: 'Pannello Stufa',
};

export default function Page() {
  return <div>...</div>;
}
```

### Pattern 4: Context Provider Typing (Null + Type Guard)
**What:** Use null as default, custom hook with runtime check
**When to use:** All context providers
**Example:**
```typescript
// Source: React TypeScript best practices + project ThemeContext pattern
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/

'use client';
import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

// Create context with null default (forces provider usage)
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ... state logic ...

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook with runtime check (type guard)
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Pattern 5: Co-located Component Typing (Domain Callbacks)
**What:** Type event handlers with domain-specific callbacks (not generic React events)
**When to use:** Co-located components that pass values to callbacks
**Example:**
```typescript
// Source: Project TemperaturePicker pattern

'use client';
interface TemperaturePickerProps {
  value: number;
  onChange: (newValue: number) => void;  // Domain callback (number)
  min?: number;
  max?: number;
  step?: number;
}

export default function TemperaturePicker({
  value,
  onChange,
  min = 5,
  max = 30,
  step = 0.5,
}: TemperaturePickerProps) {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);  // Calls with number
  };

  return (
    <button onClick={decrease}>-</button>
  );
}

// NOT: onChange: (e: React.MouseEvent) => void
// The component handles the event internally, passes domain value
```

### Pattern 6: Data File Typing (component-docs.js)
**What:** Convert .js data file to .ts with pragmatic typing
**When to use:** app/debug/design-system/data/component-docs.js
**Example:**
```typescript
// Source: Project component-docs.js structure

// Option 1: Pragmatic - Define structure loosely
interface ComponentDoc {
  name: string;
  description: string;
  category: string;
  props: Array<{
    name: string;
    type: string;
    default?: string;
    description: string;
    required?: boolean;
  }>;
  keyboard: Array<{ key: string; action: string }>;
  aria: Array<{ attr: string; description: string }>;
  screenReader: string;
  codeExample: string;
}

export const componentDocs: Record<string, ComponentDoc> = {
  Button: { /* ... */ },
  // ...
};

// Option 2: More pragmatic - Use 'any' for flexibility
export const componentDocs: Record<string, any> = {
  // Large documentation object - pragmatic typing OK
};
```

### Pattern 7: Git History Preservation
**What:** Use git mv before editing files
**When to use:** ALL file migrations
**Example:**
```bash
# Pattern from Phase 40
git mv app/page.js app/page.tsx
git mv app/layout.js app/layout.tsx
git mv app/context/ThemeContext.js app/context/ThemeContext.tsx
# Then edit TypeScript files
```

### Anti-Patterns to Avoid
- **Using synchronous params/searchParams:** Next.js 16 requires async (await params, await searchParams)
- **Generic React.FC for pages:** Use explicit props interface with params/searchParams
- **Context with defined defaults when no meaningful default exists:** Use null + type guard for clearer errors
- **Complex PageProps helper:** Manual typing is clearer when pages don't have dynamic params
- **Generic React event types for domain callbacks:** Use domain-specific callback signatures (onChange: (value: number) => void)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page props typing | Custom interface from scratch | Next.js async props pattern | Next.js 16 requires Promise props |
| Metadata typing | Manual object types | `import type { Metadata } from 'next'` | Next.js provides complete types |
| Context typing | Manual type assertions | null + custom hook with type guard | Clear error messages, type safety |
| React.ReactNode import | Custom children types | `import { ReactNode } from 'react'` | Standard React type |
| SearchParams typing | Complex union types | `Promise<{ [key: string]: string \| string[] \| undefined }>` | Next.js searchParams pattern |

**Key insight:** Next.js 16 changed pages to use async props (params and searchParams are now Promise types). All page migrations must follow this pattern. Context providers follow React 19 patterns with null defaults + type guards for best error messages.

## Common Pitfalls

### Pitfall 1: Forgetting to Await Params/SearchParams
**What goes wrong:** TypeScript error "Promise is not assignable to type string"
**Why it happens:** Next.js 16 made params/searchParams async (they're Promises)
**How to avoid:** Always destructure with await: `const { slug } = await params;`
**Warning signs:** Type errors about Promise when accessing params or searchParams

### Pitfall 2: Using React.FC for Pages
**What goes wrong:** React.FC doesn't work well with async props pattern
**Why it happens:** Pages need explicit async function signatures
**How to avoid:** Use `export default async function Page(props: { params: Promise<...> })` pattern
**Warning signs:** Type errors with React.FC and Promise props

### Pitfall 3: Context Default Value Without Type Guard
**What goes wrong:** Runtime errors "Cannot read property 'theme' of undefined" without clear context
**Why it happens:** Creating context with defined default but provider isn't wrapping component
**How to avoid:** Use null default + custom hook that throws clear error message
**Warning signs:** Confusing runtime errors about undefined properties

### Pitfall 4: Overly Strict SearchParams Typing
**What goes wrong:** Type errors when users pass unexpected query parameters
**Why it happens:** Typing searchParams as exact object instead of flexible Record
**How to avoid:** Use `{ [key: string]: string | string[] | undefined }` or specific keys with optional modifiers
**Warning signs:** Type errors on valid query parameter usage

### Pitfall 5: Client Pages Typed with Params/SearchParams
**What goes wrong:** Props are undefined at runtime
**Why it happens:** Client components ('use client') don't receive params/searchParams props
**How to avoid:** Client pages use hooks (useParams, useSearchParams), server pages use props
**Warning signs:** Props work in server pages but undefined in client pages

### Pitfall 6: Co-located Component Event Handler Over-typing
**What goes wrong:** Generic React.MouseEvent types when component passes domain values
**Why it happens:** Assuming all onClick handlers receive MouseEvent
**How to avoid:** Look at what the component actually passes to the callback (e.g., onChange(newValue))
**Warning signs:** Type errors when parent tries to use callback value

### Pitfall 7: Not Migrating All Co-located Components
**What goes wrong:** Mixing .js and .ts components in same feature
**Why it happens:** Attempting to defer co-located components to gap closure
**How to avoid:** User locked decision - all 27 co-located components migrate in Phase 41
**Warning signs:** Plan tries to defer thermostat schedule components or debug tabs

## Code Examples

Verified patterns from official sources and project conventions:

### Server Page with Dynamic Route
```typescript
// Source: Next.js 16 docs + project patterns
// app/blog/[slug]/page.tsx

export default async function BlogPost({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;

  return (
    <div>
      <h1>Post: {slug}</h1>
      {tab && <p>Tab: {tab}</p>}
    </div>
  );
}
```

### Client Page (No Props)
```typescript
// Source: Project app/debug/api/page.js pattern
// app/debug/api/page.tsx

'use client';

import { useState } from 'react';

export default function ApiDebugPage() {
  const [activeTab, setActiveTab] = useState('stove');

  // Client pages use hooks, not props
  return <div>...</div>;
}
```

### Root Layout with Metadata
```typescript
// Source: Project app/layout.js pattern
// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto della stufa Thermorossi',
  applicationName: 'Pannello Stufa',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stufa',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

### Context Provider with Type Guard
```typescript
// Source: Project app/context/ThemeContext.js pattern
// app/context/ThemeContext.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // ... implementation ...

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Co-located Component with Domain Callback
```typescript
// Source: Project app/thermostat/schedule/components/TemperaturePicker.js
// app/thermostat/schedule/components/TemperaturePicker.tsx

'use client';

import { Button, Text } from '@/app/components/ui';
import { Minus, Plus } from 'lucide-react';

interface TemperaturePickerProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function TemperaturePicker({
  value,
  onChange,
  min = 5,
  max = 30,
  step = 0.5,
}: TemperaturePickerProps) {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increase = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-4">
      <Button onClick={decrease} disabled={value <= min}>
        <Minus size={24} />
      </Button>
      <Text>{value}°C</Text>
      <Button onClick={increase} disabled={value >= max}>
        <Plus size={24} />
      </Button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous params | `params: Promise<{}>` | Next.js 16.0 | Must await all params access |
| Synchronous searchParams | `searchParams: Promise<{}>` | Next.js 15.0 | Must await all searchParams access |
| React.FC for pages | Explicit async function | React 19 + Next.js 16 | Better type inference for async |
| Context.Provider syntax | Context directly as Provider | React 19 | Both work, direct usage simpler |
| useContext hook only | use() hook alternative | React 19 | Can use both, useContext still standard |

**Deprecated/outdated:**
- Synchronous params/searchParams access in pages (Next.js 16 requires Promise)
- Using React.FC with async functions (explicit signatures better)
- Complex PageProps helper imports (optional, manual typing often clearer)

## Open Questions

Things that couldn't be fully resolved:

1. **PageProps Helper vs Manual Typing**
   - What we know: Next.js 16 provides PageProps helper with typegen
   - What's unclear: Whether project has run `npx next typegen` and if helper is available
   - Recommendation: Start with manual typing (explicit Promise props), can refactor to PageProps helper later if desired

2. **Context Interface Location**
   - What we know: ThemeContext has inline interface, could extract to types/
   - What's unclear: Whether context interfaces should be centralized
   - Recommendation: Claude's discretion per CONTEXT.md - inline for simple contexts, extract if reused elsewhere

3. **SearchParams Specificity**
   - What we know: Some pages use searchParams (e.g., ?tab=stove), most don't
   - What's unclear: Whether to type specific keys per page
   - Recommendation: Claude's discretion per CONTEXT.md - specific keys where used, generic Record<string, string> where unused

4. **Component-docs.js Typing Depth**
   - What we know: Large 1000+ line data file with component documentation
   - What's unclear: Whether to fully type all nested structures or use pragmatic any
   - Recommendation: Claude's discretion per CONTEXT.md - pragmatic typing acceptable for documentation data

## Sources

### Primary (HIGH confidence)
- [Next.js 16 page.js conventions](https://nextjs.org/docs/app/api-reference/file-conventions/page) - Async params/searchParams pattern
- [Next.js 16 layout.js conventions](https://nextjs.org/docs/app/api-reference/file-conventions/layout) - Children and params typing
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - Static metadata typing with Metadata type
- [Next.js 16 Type Safety guide](https://dev.to/bharathkumar28/nextjs-16-type-safety-async-pageprops-typed-routes-3ilc) - PageProps helper and async props
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - Breaking changes documentation

### Secondary (MEDIUM confidence)
- [React TypeScript Context Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/) - Null default + type guard pattern
- [React TypeScript with LogRocket](https://blog.logrocket.com/how-to-use-react-context-typescript/) - Runtime checking best practices
- [Carl Rippon React Context series](https://carlrippon.com/react-context-with-typescript-p4/) - Context without default values
- Project files: app/layout.js, app/page.js, app/context/ThemeContext.js, app/thermostat/schedule/components/TemperaturePicker.js

### Tertiary (LOW confidence)
- [Next.js searchParams TypeScript](https://www.hemantasundaray.com/blog/nextjs-searchparams-typescript-type) - Community patterns for searchParams typing

## Metadata

**Confidence breakdown:**
- Next.js 16 async props pattern: HIGH - Official Next.js docs confirm params/searchParams are Promise types
- Context typing pattern: HIGH - React TypeScript Cheatsheet and project patterns align on null + type guard
- Co-located component patterns: HIGH - Derived from project's existing TypeScript components
- Metadata typing: HIGH - Official Next.js Metadata type well-documented
- SearchParams specificity: MEDIUM - Multiple valid approaches, Claude's discretion per context

**Research date:** 2026-02-07
**Valid until:** 30 days (stable patterns, Next.js 16 is current)

**File counts verified:**
- 37 page.js files (pages)
- 3 root files (layout.js, template.js, not-found.js)
- 3 context providers (ThemeContext.js, VersionContext.js, PageTransitionContext.js)
- 27 co-located components (debug tabs: 7, design-system docs: 5, thermostat schedule: 7, camera: 2, notification: 1, settings: 1, duplicates: 4)
- Total: 67 files (excludes test mocks and test files deferred to Phase 42)
