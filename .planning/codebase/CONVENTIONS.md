# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- Components: `PascalCase.js` (e.g., `Button.js`, `Navbar.js`)
- Utilities/Hooks: `camelCase.js` (e.g., `formatUtils.js`, `useVersionCheck.js`)
- API routes: `route.js` in directory structure (e.g., `app/api/health/route.js`)
- Test files: `[ComponentName].test.js` in `__tests__` folder (co-located pattern)
- Services: `camelCase.js` (e.g., `maintenanceService.js`, `changelogService.js`)

**Functions:**
- Regular functions: `camelCase` (e.g., `formatHoursToHHMM()`, `trackUsageHours()`)
- React components: `PascalCase` (e.g., `Button()`, `Navbar()`)
- Hook functions: `camelCase` with `use` prefix (e.g., `useVersionCheck()`, `useOnlineStatus()`)
- Internal utilities within files: `camelCase` with leading underscore if private (e.g., `_calculateElapsedTime()`)

**Variables & Constants:**
- Variable names: `camelCase` (e.g., `mobileMenuOpen`, `userDropdownOpen`)
- Constants in error codes: `SCREAMING_SNAKE_CASE` (e.g., `ERROR_CODES.UNAUTHORIZED`, `HTTP_STATUS.OK`)
- Enum-like objects: `PascalCase` keys (e.g., `ERROR_CODES: { UNAUTHORIZED, NOT_FOUND }`)

**Types & Props:**
- Props interfaces: Documented inline with JSDoc (see Code Style section)
- No TypeScript interface files in this codebase; uses JSDoc type documentation

## Code Style

**Formatting:**
- Tool: Automatic via Next.js lint (no explicit prettier config found, uses Next.js defaults)
- Indentation: 2 spaces
- Line length: No explicit limit enforced, code follows reasonable wrapping
- Semicolons: Required (enforced by eslint)

**Linting:**
- ESLint config: `eslint.config.mjs` using Next.js core-web-vitals rules
- Command: `npm run lint` (runs Next.js linter)
- Core config: `next/core-web-vitals` extends base ESLint rules

**File Structure:**
```javascript
// 1. Imports (external first, then internal)
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNavigationStructure } from '@/lib/devices/deviceRegistry';

// 2. JSDoc block with @param and @returns
/**
 * Component description in one line
 *
 * More detailed description if needed.
 *
 * @param {Object} props
 * @param {string} props.variant - Style variant (ember|subtle|ghost)
 * @param {boolean} props.disabled - Disable button
 * @returns {JSX.Element} Rendered button
 */

// 3. Component or function definition
export default function ComponentName({ variant = 'default', ...props }) {
  // Component body
}
```

## Import Organization

**Order:**
1. React and third-party React libraries (`react`, `next/*`)
2. UI libraries (`lucide-react`)
3. Internal utilities and services (`@/lib/*`)
4. Components (`./ComponentName`)
5. Styles (implicit via Tailwind classes)

**Path Aliases:**
- `@/`: Root directory (configured in Jest and Next.js)
- Example: `@/lib/core`, `@/lib/firebase`, `@/app/components/ui`

**Barrel Files:**
- Used in component folders: `app/components/ui/index.js` exports all UI components
- Example: `export { default as Button } from './Button'; export { default as Card } from './Card';`
- Enables: `import { Button, Card } from '@/app/components/ui';`

## Error Handling

**Patterns:**
- Use centralized `ApiError` class from `lib/core/apiErrors.js`
- API routes wrap handlers with `withErrorHandler()` from `lib/core`
- Error messages: Italian language convention (e.g., "Non autenticato", "Risorsa non trovata")
- Error codes: Centralized constants in `ERROR_CODES` and `HTTP_STATUS` objects

**API Error Response Format:**
```javascript
// Success
{ success: true, data: {...}, message?: "Optional message" }

// Error
{ success: false, error: "User-friendly message", code: "ERROR_CODE", details?: {...} }
```

**Example from `lib/core/apiResponse.js`:**
```javascript
import { handleError } from '@/lib/core';

export const GET = withErrorHandler(async (request) => {
  try {
    const result = await someOperation();
    return success(result);
  } catch (err) {
    return handleError(err, 'Context/Operation');
  }
}, 'RouteContext');
```

## Logging

**Framework:** `console` methods (no external logging library)

**Patterns:**
- Log errors with context: `console.error('[Context]', error.message)`
- Debug logs: `console.log('[DEBUG:ServiceName]', data)`
- Warnings: `console.warn('[WARNING]', message)`
- Jest setup mocks `console.error` and `console.log` in tests

**Example:**
```javascript
beforeEach(() => {
  console.error = jest.fn();
});

// Later, verify logging:
expect(console.error).toHaveBeenCalledWith('[TestContext]', 'Test error');
```

## Comments

**When to Comment:**
- Complex algorithms or business logic
- Device-specific integrations (Thermorossi stove, Netatmo, Philips Hue)
- Workarounds or temporary fixes
- State transitions or async operations

**JSDoc/TSDoc:**
- Required for all exported functions and components
- Use `@param`, `@returns`, `@deprecated`, `@throws`
- Format: Block comment with `/**` ... `*/`

**Example:**
```javascript
/**
 * Converts decimal hours to HH:MM format
 * @param {number} decimalHours - Hours in decimal format (e.g., 47.5)
 * @returns {string} Formatted string in HH:MM format (e.g., "47:30")
 */
export function formatHoursToHHMM(decimalHours) {
  // Implementation
}
```

**Deprecation Pattern:**
```javascript
/**
 * Button Component
 *
 * @param {Object} props
 * @param {'primary'|'secondary'} props.variant
 *
 * @deprecated props.variant="primary" - Use variant="ember" instead
 * @deprecated props.liquid - No longer needed
 */
```

## Function Design

**Size Guidelines:**
- Components: Keep under 150 lines (refactor hooks/utilities into separate files)
- Utility functions: Keep under 50 lines (split complex logic)
- API handlers: Keep under 40 lines (extract business logic to lib/)

**Parameters:**
- Use object destructuring for components: `function Component({ prop1, prop2 = default })`
- For functions with 2+ params, use destructured object: `function operate({ input, options = {} })`
- For simple functions, single params acceptable: `function formatHours(decimal)`

**Return Values:**
- Components: Always return JSX or null
- Utility functions: Return appropriate type (string, number, object, Promise)
- API handlers: Return `NextResponse` via helper functions (`success()`, `error()`, `handleError()`)
- Async functions: Return Promise with explicit type in JSDoc

## Module Design

**Exports:**
- Use `export default` for main component/function per file
- Use named exports for utilities: `export function utility1() {}`
- Never mix default and named exports in same file

**Example Structure:**
```javascript
// lib/formatUtils.js - Multiple utilities, use named exports
export function formatHoursToHHMM(hours) { ... }
export function parseTemperature(temp) { ... }

// app/components/Button.js - Single component, use default export
export default function Button({ variant, ...props }) { ... }
```

**Barrel Files Pattern:**
```javascript
// app/components/ui/index.js
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Text } from './Text';

// Usage in other files:
import { Button, Card } from '@/app/components/ui';
```

## Client vs Server Components

**Server Components (default):**
- Use when: Fetching data, accessing secrets, using server-only libraries
- Example: `app/layout.js`, page files without `'use client'`
- Can import server-only modules

**Client Components:**
- Mark with `'use client'` directive at top of file
- Example: Interactive components (`app/components/Navbar.js`)
- Cannot use server features directly
- Can use React hooks (useState, useEffect, useContext)

**Pattern:**
```javascript
// Server component (no directive needed)
export default function Page() {
  const data = await fetchData(); // OK on server
  return <ClientComponent data={data} />; // Pass data as props
}

// Client component
'use client';

import { useState } from 'react';

export default function ClientComponent({ data }) {
  const [state, setState] = useState(null); // OK - client hook
  return <div>{state}</div>;
}
```

## Component Patterns

**State Management:**
- Local state: `useState` for component-specific state
- Context: `app/context/` folder for shared state (e.g., `VersionContext.js`)
- Side effects: `useEffect` with dependency arrays

**Prop Passing:**
- Always destructure props in function parameters
- Provide sensible defaults: `{ variant = 'default', disabled = false }`
- Forward unknown props with spread: `{ ...props }`

**Example:**
```javascript
export default function Button({
  children,
  variant = 'ember',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  return <button className={`${baseClasses} ${variantStyles[variant]}`} {...props}>
    {children}
  </button>;
}
```

---

*Convention analysis: 2026-01-23*
