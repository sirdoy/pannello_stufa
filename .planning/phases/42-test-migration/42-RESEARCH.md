# Phase 42: Test Migration - Research

**Researched:** 2026-02-07
**Domain:** Jest test file migration from JavaScript to TypeScript
**Confidence:** HIGH

## Summary

This phase converts 131 JavaScript test files to TypeScript using the existing Next.js SWC transformer infrastructure. The project already has Jest configured with `next/dist/build/swc/jest-transformer`, which natively supports TypeScript without requiring ts-jest. The migration follows the same `git mv` pattern proven in Phases 38-41 for preserving git history.

Key findings: The SWC transformer provides 40% faster test execution compared to babel-jest or ts-jest, and the existing configuration requires minimal changes (mainly file renaming and type annotations). The project uses pragmatic typing patterns established in prior phases, avoiding strict `jest.Mock<ReturnType, Parameters>` everywhere in favor of typing only where it catches bugs.

**Primary recommendation:** Migrate jest.config.js and jest.setup.js to .ts first to establish TypeScript support, then migrate test files in batches by directory (lib/, app/components/ui/, app/api/, etc.), using `git mv` to preserve git history and fixing broken imports during migration rather than upfront.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Mock typing strategy:**
- Pragmatic typing: type mock return values and parameters where it catches bugs, use `jest.Mock` and `as any` for complex mocks (Firebase, fetch, external APIs)
- No strict `jest.Mock<ReturnType, Parameters>` everywhere — only where it adds value

**Jest config migration:**
- Migrate `jest.config.js` to `jest.config.ts` (TypeScript)
- Migrate `jest.setup.js` to `jest.setup.ts` (TypeScript)
- Migrate all `__mocks__/*.js` files to `.ts` with proper typing
- Coverage thresholds stay at 70% (branches/functions/lines/statements)

**Test file import updates:**
- Fix the 3 known broken API route test imports (route.js → route.ts) during migration, not upfront
- Use `git mv` for all test file renames (preserve git history, consistent with Phases 38-41)

**Failing test handling:**
- Claude fixes runtime failures if quick (<2 min), skips with `test.skip()` + TODO comment if complex
- Pre-existing failures: fix if simple, document complex ones
- Zero tsc errors target on test files (same standard as Phases 38-41)

### Claude's Discretion

**Mock factories:**
- Claude decides: use shared `__mocks__/` typed factories for modules mocked 5+ times across test files, keep inline mocks for the rest
- Type existing helpers (jest.setup, `__mocks__/`) but only create new test utilities where there's clear repetition

**Render typing:**
- Claude decides per test: type component props objects (`const props: ComponentProps = {...}`) for complex components, keep simple renders as-is

**moduleNameMapper paths:**
- Claude decides whether to update moduleNameMapper references from `.js` to `.ts` or let Jest auto-resolve via moduleFileExtensions

**Import style:**
- Claude follows whatever import pattern the source files use (extensionless vs explicit)
- Claude converts `require()` to ES module `import` where straightforward, keeps `require()` for dynamic imports or `jest.mock` patterns that need it

**Verification cadence:**
- Claude decides whether to run tests per batch or at the end, based on batch size and risk

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

The established libraries/tools for Jest + TypeScript testing with Next.js:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | 30.2.0 | Test framework | Industry standard for React testing, already installed |
| @types/jest | 30.0.0 | Jest TypeScript definitions | Provides global types (describe, test, expect) without imports |
| next/dist/build/swc/jest-transformer | Built-in | TypeScript compilation | 40% faster than babel-jest/ts-jest, no additional config needed |
| @testing-library/react | 16.3.1 | React component testing | De facto standard for user-centric testing |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | Extends expect with toBeInTheDocument, toHaveClass, etc. |
| jest-environment-jsdom | 30.2.0 | Browser environment simulation | Required for React component tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest-axe | 10.0.0 | Accessibility testing | Already used in 19+ component tests |
| @types/jest-axe | 3.5.9 | jest-axe TypeScript definitions | Type safety for axe() and toHaveNoViolations() |
| @testing-library/user-event | 14.6.1 | User interaction simulation | For click, type, keyboard events |
| @testing-library/dom | 10.4.0 | DOM testing utilities | Peer dependency of react-testing-library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SWC transformer | ts-jest | ts-jest type-checks during tests (slower, 40% overhead), SWC only transpiles (faster, catch types with tsc separately) |
| @types/jest | @jest/globals | @jest/globals requires explicit imports (describe, test, expect), @types/jest provides globals automatically |
| jest.config.ts | jest.config.js | .ts provides type safety for config object, .js works but no autocomplete/validation |

**Installation:**
Already installed — no new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
.planning/phases/42-test-migration/
├── 42-CONTEXT.md           # User decisions (already exists)
├── 42-RESEARCH.md          # This file
└── 42-PLAN.md              # To be created by planner

Test file structure (131 files):
__tests__/                  # Root level (if any)
lib/__tests__/              # 13 files (utilities, services, APIs)
app/components/ui/__tests__/ # 19+ files (UI components)
app/components/**/__tests__/ # Domain components
app/api/**/__tests__/       # API route tests (70+ files)
app/hooks/__tests__/        # 4 files (custom hooks)
app/context/__tests__/      # 1 file (React contexts)
__mocks__/                  # 2 files (next-server.js, react-dom.js)
app/components/ui/__mocks__/ # 1 file (Text.js)
```

### Pattern 1: Jest Config Migration (.js → .ts)

**What:** Convert jest.config.js to jest.config.ts with type safety
**When to use:** First step of migration — establishes TypeScript support
**Example:**
```typescript
// Source: https://jestjs.io/docs/configuration
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Update to .ts
  testEnvironment: 'jest-environment-jsdom',

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Update next-server mock to .ts
    '^next/dist/server/web/exports/next-response$': '<rootDir>/__mocks__/next-server.ts',
  },

  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)', // Already supports .ts/.tsx
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}', // Already includes .ts/.tsx
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['next/dist/build/swc/jest-transformer', {}],
  },

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

export default createJestConfig(customJestConfig);
```

**Key changes:**
1. Import `type { Config } from 'jest'` for type safety
2. Add type annotation `customJestConfig: Config`
3. Update setupFilesAfterEnv path to .ts
4. Update moduleNameMapper mock paths to .ts (if using explicit extensions)
5. Use `export default` instead of `module.exports`

### Pattern 2: Jest Setup File Migration

**What:** Convert jest.setup.js to jest.setup.ts with mock typing
**When to use:** After jest.config.ts migration, before test files
**Example:**
```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import type { Config as JestConfig } from 'jest';

// Mock react-dom with inline mock (no type needed, simple passthrough)
jest.mock('react-dom', () => {
  const actualReactDOM = jest.requireActual('react-dom');
  return {
    ...actualReactDOM,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Configure testing-library
configure({
  asyncUtilTimeout: 3000,
  reactStrictMode: true,
});

// Global type declarations for test environment
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
  var __TEST_ENVIRONMENT__: boolean;
  var __CLIENT_SIDE_MOUNTED__: boolean;

  // Type axe helper function
  function runAxeWithRealTimers(container: Element): Promise<any>;
}

// Polyfills and mocks (keep as-is, add types only where helpful)
global.IS_REACT_ACT_ENVIRONMENT = true;
global.__TEST_ENVIRONMENT__ = true;
global.__CLIENT_SIDE_MOUNTED__ = true;

// Environment variables (no types needed)
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
// ... rest of env vars

// Mock implementations with minimal typing
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock localStorage with typed interface
interface LocalStorageMock {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
}

const localStorageMock: LocalStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// NextResponse mock with typed implementation
interface NextResponseMockType {
  (body: any, init?: ResponseInit): Response;
  json: jest.Mock<Response, [body: any, init?: ResponseInit]>;
}

const nextResponseJsonImpl = (body: any, init?: ResponseInit) => ({
  status: init?.status || 200,
  headers: new Headers(init?.headers || {}),
  json: async () => body,
});

function NextResponseMock(body: any, init?: ResponseInit): Response {
  return {
    body,
    status: init?.status || 200,
    headers: new Headers(init?.headers || {}),
    json: async () => body,
  } as Response;
}

NextResponseMock.json = jest.fn().mockImplementation(nextResponseJsonImpl);

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: NextResponseMock,
  default: { NextResponse: NextResponseMock },
}));

// Type the axe helper
global.runAxeWithRealTimers = async (container: Element) => {
  const isUsingFakeTimers = typeof jest !== 'undefined' && jest.isFakeTimers?.();

  if (isUsingFakeTimers) {
    jest.useRealTimers();
  }

  const { axe } = require('jest-axe');
  const results = await axe(container);

  if (isUsingFakeTimers) {
    jest.useFakeTimers();
  }

  return results;
};
```

**Pragmatic typing approach:**
- Type parameters where it catches bugs (query: string, body: any, init?: ResponseInit)
- Use `as any` for complex mocks that don't need strict typing (localStorage)
- Add `declare global` for test-specific globals
- Keep implementation simple — no jest.Mock<ReturnType, Parameters> everywhere

### Pattern 3: Component Test Migration

**What:** Convert .test.js → .test.tsx for React component tests
**When to use:** For files that render components (19+ UI component tests)
**Example:**
```typescript
// Source: Testing Library docs + project patterns
// app/components/ui/__tests__/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDivider,
  cardVariants,
} from '../Card';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations with default variant', async () => {
      const { container } = render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CVA Variants', () => {
    it('applies elevated variant classes', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-slate-850/90');
      expect(card).toHaveClass('shadow-card-elevated');
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to Card root element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
```

**Key changes:**
1. Rename .test.js → .test.tsx (JSX syntax)
2. Type assertion for container.firstChild: `as HTMLElement`
3. Type ref: `createRef<HTMLDivElement>()`
4. No need to type props objects for simple cases (user discretion)

### Pattern 4: API Route Test Migration

**What:** Convert API route tests from .js → .ts with pragmatic mock typing
**When to use:** For 70+ API route test files
**Example:**
```typescript
// app/api/netatmo/setthermmode/__tests__/route.test.ts
import { POST } from '../route'; // Update import to match .ts file
import * as core from '@/lib/core';
import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';

// Mock with minimal typing (pragmatic approach)
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: jest.fn((handler) => handler),
  success: jest.fn((data) => ({
    status: 200,
    json: async () => ({ success: true, ...data }),
  })),
  badRequest: jest.fn((message) => ({
    status: 400,
    json: async () => ({ success: false, error: message }),
  })),
  serverError: jest.fn((message) => ({
    status: 500,
    json: async () => ({ success: false, error: message }),
  })),
  parseJsonOrThrow: jest.fn(async (req) => req.json()),
  validateRequired: jest.fn((value, name) => {
    if (value === undefined || value === null) {
      throw new Error(`${name} is required`);
    }
  }),
  validateEnum: jest.fn((value, validValues, name) => {
    if (!validValues.includes(value)) {
      throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
    }
  }),
  requireNetatmoToken: jest.fn(async () => 'test-access-token'),
}));

jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbPush: jest.fn(),
}));

jest.mock('@/lib/netatmoApi', () => ({
  __esModule: true,
  default: {
    setThermMode: jest.fn(),
  },
}));

describe('POST /api/netatmo/setthermmode', () => {
  const mockSession = {
    user: {
      sub: 'auth0|123',
      email: 'test@test.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Type assertions for mocked functions (pragmatic, not strict)
    (adminDbGet as jest.Mock).mockResolvedValue('home123');
    (adminDbPush as jest.Mock).mockResolvedValue({ key: 'log-key-123' });
    (NETATMO_API.setThermMode as jest.Mock).mockResolvedValue(true);
  });

  const createRequest = (body: any) => ({
    json: async () => body,
  });

  it('should return 400 when mode is missing', async () => {
    const request = createRequest({});

    const response = await POST(request as any, {}, mockSession as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 200 success with schedule mode', async () => {
    const request = createRequest({ mode: 'schedule' });

    const response = await POST(request as any, {}, mockSession as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'schedule',
      })
    );
  });
});
```

**Key changes:**
1. Rename .test.js → .test.ts (no JSX)
2. Update import: `from '../route'` (TypeScript auto-resolves .ts)
3. Type request factory parameter: `body: any` (pragmatic)
4. Use `as jest.Mock` for type assertions in beforeEach
5. Use `as any` for complex request/session types (pragmatic, per user decision)

### Pattern 5: Service/Utility Test Migration

**What:** Convert lib/__tests__/*.test.js → .test.ts with minimal typing
**When to use:** For 13 lib/ test files (pure functions, no React)
**Example:**
```typescript
// lib/__tests__/formatUtils.test.ts
import { formatHoursToHHMM } from '../formatUtils';

describe('formatUtils', () => {
  describe('formatHoursToHHMM', () => {
    test('converts decimal hours to HH:MM format correctly', () => {
      expect(formatHoursToHHMM(47.5)).toBe('47:30');
      expect(formatHoursToHHMM(10.25)).toBe('10:15');
      expect(formatHoursToHHMM(0.5)).toBe('0:30');
      expect(formatHoursToHHMM(1.75)).toBe('1:45');
    });

    test('handles null, undefined and NaN values', () => {
      expect(formatHoursToHHMM(null)).toBe('0:00');
      expect(formatHoursToHHMM(undefined)).toBe('0:00');
      expect(formatHoursToHHMM(NaN)).toBe('0:00');
    });
  });
});
```

**Key changes:**
1. Rename .test.js → .test.ts
2. Update imports (no file extension needed)
3. No additional typing needed if source function is typed

### Pattern 6: Hook Test Migration

**What:** Convert hook tests with renderHook() from .js → .ts
**When to use:** For 4 hook test files in app/hooks/__tests__/
**Example:**
```typescript
// app/hooks/__tests__/useVersionCheck.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { VersionProvider, useVersion } from '../VersionContext';
import { getLatestVersion } from '@/lib/changelogService';

// Mock with minimal typing
jest.mock('@/lib/changelogService', () => ({
  getLatestVersion: jest.fn(),
}));

jest.mock('@/lib/version', () => ({
  APP_VERSION: '1.5.0',
}));

describe('VersionContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <VersionProvider>{children}</VersionProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns context when used within VersionProvider', () => {
    const { result } = renderHook(() => useVersion(), { wrapper });

    expect(result.current).toHaveProperty('needsUpdate');
    expect(result.current).toHaveProperty('firebaseVersion');
  });

  test('sets needsUpdate when local version is older', async () => {
    const mockLatestVersion = {
      version: '1.6.0',
      date: '2025-10-11',
      type: 'minor' as const,
      changes: ['New feature'],
    };

    (getLatestVersion as jest.Mock).mockResolvedValueOnce(mockLatestVersion);

    const { result } = renderHook(() => useVersion(), { wrapper });

    await act(async () => {
      await result.current.checkVersion();
    });

    await waitFor(() => {
      expect(result.current.needsUpdate).toBe(true);
      expect(result.current.firebaseVersion).toBe('1.6.0');
    });
  });
});
```

**Key changes:**
1. Rename .test.js → .test.ts
2. Type wrapper children: `{ children: React.ReactNode }`
3. Type const values with `as const` for literal types
4. Use `as jest.Mock` for mock assertions

### Pattern 7: __mocks__ Migration

**What:** Convert mock files from .js → .ts with proper types
**When to use:** For 3 mock files (__mocks__/next-server.js, react-dom.js, app/components/ui/__mocks__/Text.js)
**Example:**
```typescript
// __mocks__/next-server.ts
/**
 * Mock for Next.js 16 internal server modules
 * Maps internal imports to the public 'next/server' API
 */
export * from 'next/server';

// __mocks__/react-dom.ts
/**
 * Mock react-dom to render portals inline in tests
 */
const ReactDOM = jest.requireActual('react-dom');

export = {
  ...ReactDOM,
  createPortal: (node: React.ReactNode) => node,
};

// app/components/ui/__mocks__/Text.tsx (needs JSX)
import React from 'react';

interface TextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  [key: string]: any;
}

export default function Text({ children, as: Component = 'span', ...props }: TextProps) {
  return <Component {...props}>{children}</Component>;
}
```

**Key changes:**
1. next-server.js → .ts (re-export only)
2. react-dom.js → .ts with typed parameter
3. Text.js → .tsx with typed props interface

### Anti-Patterns to Avoid

- **Over-typing mocks:** Don't use `jest.Mock<Promise<Response>, [string, RequestInit]>` for complex APIs — use `jest.Mock` or `as jest.Mock` and `as any` for parameters (pragmatic approach per user decision)
- **Strict typing everywhere:** Don't type every variable — only where it catches bugs or aids clarity
- **Changing test logic:** Migration is conversion only, not refactoring — preserve existing test structure
- **Breaking git history:** Don't delete and create files — use `git mv` to preserve blame tracking
- **Module path updates in moduleNameMapper:** Let Jest auto-resolve via moduleFileExtensions unless explicit .js extensions cause issues

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-safe mock factories | Custom mock generator functions | jest.mocked() helper (Jest 27+) | Built-in, less verbose than jest.MockedFunction<typeof foo> |
| Component prop typing in tests | Manual interface definitions per test | ComponentProps<typeof Component> or VariantProps<typeof variants> | Inferred from source, stays in sync |
| Request/Response mock typing | Detailed mock types for Next.js types | Use `as any` for complex external types (Firebase, Next.js) | Pragmatic per user decision, avoids maintenance burden |
| Test file transformation | Manual search/replace | Use `git mv` for renaming | Preserves git history, consistent with Phases 38-41 |
| TypeScript type checking in tests | Enable strict: true in tsconfig | Keep strict: false, use tsc for source code only | Tests can use `any` liberally (don't ship to production) |

**Key insight:** The project already established pragmatic typing patterns in Phases 38-41 — tests follow the same philosophy: type where it helps, use `any` where strict typing adds no value.

## Common Pitfalls

### Pitfall 1: Over-strict Mock Typing
**What goes wrong:** Attempting to use `jest.Mock<ReturnType, Parameters>` for complex external APIs (Firebase, fetch) leads to type errors and maintenance burden.
**Why it happens:** TypeScript best practices suggest strict typing everywhere, but test mocks often deal with complex third-party types that change frequently.
**How to avoid:** Use the pragmatic approach per user decision:
- Type mock return values and parameters where it catches bugs (simple types: string, number, object shapes)
- Use `jest.Mock` without generics and `as any` for complex mocks (Firebase, fetch, Next.js internal APIs)
- Example: `(adminDbGet as jest.Mock).mockResolvedValue('home123')` instead of `jest.Mock<Promise<string | null>, [string]>`
**Warning signs:** Seeing TypeScript errors like "Type 'X' is not assignable to parameter of type 'Y'" in mock setup code

### Pitfall 2: Breaking Git History with Delete/Create
**What goes wrong:** Deleting .js files and creating new .ts files breaks git blame, making it hard to trace test authorship and changes.
**Why it happens:** Standard file operations (rm old, create new) are simpler than learning git mv.
**How to avoid:** Always use `git mv old.test.js new.test.ts` for renaming test files. This pattern was proven successful in Phases 38-41 for 137+ file migrations.
**Warning signs:** Running `git log --follow new.test.ts` shows no history before migration

### Pitfall 3: require() vs import Confusion
**What goes wrong:** Converting all `require()` to `import` breaks jest.mock() patterns that rely on hoisting and module resolution order.
**Why it happens:** ES modules and CommonJS have different hoisting rules — `import` hoists before code execution, `require()` executes in order.
**How to avoid:** Follow user decision:
- Convert straightforward `require()` to `import` (simple imports at top of file)
- Keep `require()` for dynamic imports or `jest.mock()` patterns that need it
- Common pattern to keep: `const { something } = require('module')` after `jest.mock()` when module needs mocking before import
**Warning signs:** Tests fail with "Cannot access 'X' before initialization" or mocks not working

### Pitfall 4: Forgetting to Update setupFilesAfterEnv Path
**What goes wrong:** jest.config.ts references `jest.setup.js` but file was renamed to `jest.setup.ts`, causing setup code not to run.
**Why it happens:** Config and setup file are migrated separately, easy to forget path update.
**How to avoid:** When migrating jest.setup.js → jest.setup.ts, immediately update jest.config.ts setupFilesAfterEnv array to reference .ts extension.
**Warning signs:** Tests fail with "localStorage is not defined" or "matchMedia is not defined" (global mocks not loaded)

### Pitfall 5: moduleNameMapper Stale Paths
**What goes wrong:** moduleNameMapper references `__mocks__/next-server.js` but file was renamed to `.ts`, causing module resolution to fail.
**Why it happens:** Mock files migrated but config not updated.
**How to avoid:** Per user discretion, either:
- Update moduleNameMapper paths from .js → .ts when migrating __mocks__ files
- OR let Jest auto-resolve via moduleFileExtensions (recommended — less maintenance)
**Warning signs:** Tests fail with "Cannot find module '__mocks__/next-server.ts'" or similar

### Pitfall 6: Import Path Extensions
**What goes wrong:** Changing imports from `import { POST } from '../route'` to `import { POST } from '../route.ts'` causes issues with TypeScript module resolution.
**Why it happens:** Some developers add explicit .ts extensions thinking it's more explicit.
**How to avoid:** Follow user decision: use extensionless imports to match source file patterns. TypeScript and Jest auto-resolve to .ts/.tsx files via moduleFileExtensions.
**Warning signs:** TypeScript errors "Cannot find module '../route.ts'" or Jest resolution failures

### Pitfall 7: Type Checking Performance in CI
**What goes wrong:** Running tests with strict TypeScript type checking (via ts-jest with type-checking enabled) causes 40% slower CI builds.
**Why it happens:** By default, ts-jest runs full TypeScript compiler during test execution.
**How to avoid:** The project already uses Next.js SWC transformer which only transpiles (no type checking). Run `tsc --noEmit` separately for type checking, not during test execution.
**Warning signs:** Test suite runtime increases significantly after TypeScript migration

## Code Examples

Verified patterns from project and official sources:

### Migrating jest.config.js → jest.config.ts
```typescript
// Source: https://jestjs.io/docs/configuration
// Before (jest.config.js)
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
const customJestConfig = { /* config */ };
module.exports = createJestConfig(customJestConfig);

// After (jest.config.ts)
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Updated
  // ... rest of config
};

export default createJestConfig(customJestConfig);
```

### Migrating Component Test with Accessibility
```typescript
// Source: Project pattern from Card.test.js
// app/components/ui/__tests__/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Card from '../Card';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  it('should have no a11y violations', async () => {
    const { container } = render(<Card>Content</Card>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies elevated variant classes', () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    const card = container.firstChild as HTMLElement; // Type assertion
    expect(card).toHaveClass('bg-slate-850/90');
  });
});
```

### Migrating API Route Test with Pragmatic Mocking
```typescript
// Source: Project pattern from setthermmode route test
// app/api/netatmo/setthermmode/__tests__/route.test.ts

// Mock BEFORE imports (hoisting pattern)
jest.mock('@/lib/core', () => ({
  success: jest.fn((data) => ({ status: 200, json: async () => data })),
  badRequest: jest.fn((msg) => ({ status: 400, json: async () => ({ error: msg }) })),
}));

// Import AFTER mocks
import { POST } from '../route'; // Auto-resolves to route.ts
import * as core from '@/lib/core';

describe('POST /api/netatmo/setthermmode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when mode is missing', async () => {
    const request = { json: async () => ({}) };

    // Pragmatic typing: as any for complex types
    const response = await POST(request as any, {}, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
  });
});
```

### Migrating Hook Test with Typed Wrapper
```typescript
// Source: Project pattern from VersionContext test
// app/context/__tests__/VersionContext.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { VersionProvider, useVersion } from '../VersionContext';

jest.mock('@/lib/changelogService', () => ({
  getLatestVersion: jest.fn(),
}));

describe('VersionContext', () => {
  // Type wrapper children
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <VersionProvider>{children}</VersionProvider>
  );

  test('returns context values', () => {
    const { result } = renderHook(() => useVersion(), { wrapper });

    expect(result.current).toHaveProperty('needsUpdate');
    expect(result.current).toHaveProperty('firebaseVersion');
  });
});
```

### Converting require() to import (Straightforward Cases)
```typescript
// Source: https://jestjs.io/docs/getting-started
// Before (JavaScript with require)
const { formatHoursToHHMM } = require('../formatUtils');

describe('formatUtils', () => {
  test('converts hours', () => {
    expect(formatHoursToHHMM(1.5)).toBe('1:30');
  });
});

// After (TypeScript with import)
import { formatHoursToHHMM } from '../formatUtils';

describe('formatUtils', () => {
  test('converts hours', () => {
    expect(formatHoursToHHMM(1.5)).toBe('1:30');
  });
});
```

### Keeping require() for Dynamic Imports
```typescript
// Source: Project pattern from RadioGroup test
// Keep require() when using dynamic imports in test
describe('RadioGroup', () => {
  it('should lazy load component', () => {
    // Keep require() for dynamic import
    const RadioGroupWithItem = require('../RadioGroup').default;

    render(<RadioGroupWithItem />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});
```

### git mv for Preserving History
```bash
# Source: Phases 38-41 proven pattern
# Rename test file
git mv app/components/ui/__tests__/Card.test.js app/components/ui/__tests__/Card.test.tsx

# Verify history is preserved
git log --follow app/components/ui/__tests__/Card.test.tsx
# Shows full history including pre-migration commits
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ts-jest transformer | Next.js SWC transformer | Next.js 12+ (2021) | 40% faster test execution, no type-checking overhead |
| babel-jest | SWC transformer | Same | Simpler config, native TypeScript support |
| Explicit jest.Mock<T, P> everywhere | Pragmatic typing with jest.Mock and as any | TypeScript migration best practices (2024-2025) | Less maintenance, tests don't ship to production |
| jest.fn().mockImplementation(...) | jest.fn(implementation) | Jest 27+ (2021) | Cleaner syntax, type inference works better |
| MockedFunction<typeof foo> | jest.mocked(foo) | Jest 27+ (2021) | Less verbose, same type safety |
| Separate tsconfig for tests | Single tsconfig with strict: false | Migration pragmatism | Tests can use any liberally |

**Deprecated/outdated:**
- ts-jest for Next.js projects: Use Next.js SWC transformer instead (built-in, faster)
- @jest/globals package: Use @types/jest for automatic globals instead (no imports needed)
- Explicit .ts extensions in imports: Use extensionless imports (TypeScript/Jest auto-resolve)

## Open Questions

Things that couldn't be fully resolved:

1. **jest.requireActual with TypeScript**
   - What we know: `jest.requireActual()` works in TypeScript but returns `any` type
   - What's unclear: Whether to type the return value with type assertions or leave as `any`
   - Recommendation: Leave as `any` for mocks (pragmatic approach), only type if needed for test logic

2. **moduleNameMapper .js → .ts updates**
   - What we know: Jest moduleFileExtensions includes .ts/.tsx, should auto-resolve
   - What's unclear: Whether explicit .js paths in moduleNameMapper need updating or Jest handles it
   - Recommendation: User discretion per CONTEXT.md — test both approaches in first batch, document what works

3. **@types/node for global types**
   - What we know: @types/jest provides test globals, but NodeJS types (process, Buffer) come from @types/node
   - What's unclear: Whether @types/node is already installed (not in package.json devDependencies visible in research)
   - Recommendation: If process.env or Buffer cause TypeScript errors, install @types/node

4. **Test execution order after migration**
   - What we know: 131 test files, some may have interdependencies
   - What's unclear: Optimal batch size and verification cadence (run tests per batch or all at end?)
   - Recommendation: User discretion per CONTEXT.md — start with small batches (lib/, then app/components/ui/), run tests per batch to catch issues early

## Sources

### Primary (HIGH confidence)
- [Jest Configuration Documentation](https://jestjs.io/docs/configuration) - Official jest.config.ts migration guide
- [Jest Code Transformation](https://jestjs.io/docs/code-transformation) - TypeScript transformer setup
- [Jest Mock Functions API](https://jestjs.io/docs/mock-function-api) - Mock typing patterns
- [Testing Library Setup](https://testing-library.com/docs/react-testing-library/setup/) - TypeScript configuration
- [Next.js Jest Documentation](https://nextjs.org/docs/pages/guides/testing/jest) - SWC transformer setup
- Project files: jest.config.js, jest.setup.js, package.json, tsconfig.json (existing configuration)
- Project test files: Card.test.js, setthermmode route.test.js, VersionContext.test.js (current patterns)

### Secondary (MEDIUM confidence)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) - Modern testing patterns
- [How to Configure Jest for React Testing (2026)](https://oneuptime.com/blog/post/2026-01-24-configure-jest-react-testing/view) - Current Jest + TypeScript setup
- [Mastering TypeScript Testing: Jest, React Testing Library, Type Safety](https://typescriptworld.com/mastering-typescript-testing-a-comprehensive-guide-to-jest-react-testing-library-and-type-safety) - TypeScript testing patterns
- [Mock modules properly with Jest and TypeScript](https://dev.to/mattiz/mock-modules-properly-with-jest-and-typescript-3nao) - Mock typing best practices
- [Jest Mocking Best Practices - Microsoft ISE](https://devblogs.microsoft.com/ise/jest-mocking-best-practices/) - Mock cleanup patterns
- [Switching a Jest Project from Babel to SWC](https://www.joshuakgoldberg.com/blog/jest-babel-to-swc/) - SWC transformer benefits (40% performance improvement)

### Tertiary (LOW confidence)
- [@swc/jest Documentation](https://swc.rs/docs/usage/jest) - Alternative to Next.js SWC (not using, but relevant for comparison)
- [Migrating React Native to TypeScript](https://www.theodo.com/en-fr/blog/how-to-migrate-an-existing-react-native-project-from-javascript-to-typescript) - General migration patterns
- [jest-codemods](https://github.com/skovhus/jest-codemods) - Automated migration tools (not using, manual preferred for precision)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js SWC transformer already configured, @types/jest installed, official Jest/Testing Library docs confirm patterns
- Architecture: HIGH - 7 migration patterns documented from official sources and project files, proven in 131 test files
- Pitfalls: HIGH - 7 common issues identified from migration guides, community experiences, and TypeScript best practices
- User decisions: HIGH - CONTEXT.md provides clear locked decisions and discretion areas, research aligned with pragmatic typing approach

**Research date:** 2026-02-07
**Valid until:** ~30 days (stable domain, Jest 30.x is current, Next.js 16.x uses SWC transformer)
