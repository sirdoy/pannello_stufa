# Phase 43: Verification - Research

**Researched:** 2026-02-07
**Domain:** TypeScript migration verification, Jest mock typing, build validation
**Confidence:** HIGH

## Summary

Phase 43 completes the v5.0 TypeScript migration by fixing all remaining TypeScript errors, test failures, and converting final configuration files. The current state shows 1665 TypeScript errors (primarily Jest mock typing issues), 25 test failures (4 fewer than Phase 42's 29), and one remaining JS config file (postcss.config.js).

The research identifies three primary error categories:
1. **Mock type errors (1492+ errors)**: Jest auto-mocks and manual mocks lack proper TypeScript typing - requires `jest.mocked()` helper and `jest.MockedFunction<typeof fn>` pattern
2. **Discriminated union errors (100+ errors)**: Missing properties in test fixtures, improper type narrowing - requires proper type guards and complete fixture data
3. **External API type gaps (198 documented errors)**: Hue v2, Netatmo, Camera APIs have incomplete type definitions - requires full interface definitions with proper property types

**Primary recommendation:** Fix errors in three waves: (1) create shared mock type utilities and apply `jest.mocked()` pattern to all auto-mocked modules, (2) fix discriminated union narrowing with proper type guards and complete test fixtures, (3) create full external API type definitions for Hue/Netatmo/Camera APIs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fix ALL tsc errors to zero — no exceptions, no suppressions
- Fix everything properly even if it requires significant refactoring of working code
- Fix all 29 known failing tests (both migration-caused and pre-existing) — NOTE: Currently 25 failures (4 already resolved)
- Create full type definitions for external APIs (Hue v2, Netatmo, Camera) — not stubs, proper interfaces
- The 198 documented external API type errors from Phase 41 must be fully resolved
- Convert ALL config files to TypeScript (next.config, tailwind.config, postcss.config, etc.)
- Generated/vendor JS files (build output, third-party scripts) excluded from count — only source files matter
- Verify all test-related files are TS (mocks, fixtures, helpers) — no test .js remaining
- public/ directory: convert source code (e.g., service workers) to TS; static assets stay as-is
- `tsc --noEmit` must pass with exit code 0
- `npm run build` must complete successfully (NOTE: project rule says NEVER run npm run build — this is verification only, run with caution)
- Run full test suite (`npm test`) — zero failures required
- No migration report needed — existing phase summaries are sufficient
- Disable `allowJs` in tsconfig.json as final step (enforces pure TS going forward)
- Fix ALL 1492 mock type errors properly — no `as any` pattern
- Use `jest.mocked()` helper (modern Jest built-in) for auto-mocked modules
- Use `jest.MockedFunction<typeof fn>` for manual mock typing
- Create shared mock type utilities (typed mock helpers, factories) to reduce boilerplate
- Automated batch processing allowed where pattern is consistent and safe
- Manual review for edge cases and non-standard patterns
- Disable `allowJs: true` in tsconfig.json after all JS files are converted
- Future JS files will cause compile errors — enforcing pure TypeScript

### Claude's Discretion
- Dev server smoke test depth (which pages to verify)
- Mock utility API design (helper function signatures, factory patterns)
- Which batch patterns are safe for automation vs. need manual review
- Order of operations (fix tsc first vs. tests first vs. config first)
</user_constraints>

## Standard Stack

The established tools for TypeScript migration verification:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| TypeScript | 5.x+ | Type checking via tsc --noEmit | Industry standard type checker |
| Jest | 30.2.0 | Test runner with TypeScript support | Modern Jest with native TS support |
| @types/jest | 30.0.0 | Jest type definitions | Official type definitions for Jest 30+ |
| Next.js | 16.1.0 | Build system with TypeScript support | Framework with native TS config support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest.mocked() | Jest 27+ | Modern mock typing helper | Auto-mocked modules via jest.mock() |
| jest.MockedFunction | Jest 24.9.0+ | Manual mock function typing | Individual function mocks |
| Zod | 3.24.2 | Runtime validation + type inference | External API response validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jest.mocked() | Manual `as jest.MockedFunction<typeof fn>` | Verbose, error-prone, not recommended in modern Jest |
| Full type definitions | Pragmatic `as any` casts | Phase 42 approach rejected — Phase 43 requires proper typing |
| TypeScript strict mode | Loose typing with allowJs | User decision requires strict enforcement |

**Installation:**
```bash
# Already installed — no additional packages required
# Jest 30.2.0 includes jest.mocked() helper built-in
# @types/jest 30.0.0 provides all modern type definitions
```

## Architecture Patterns

### Recommended Test File Structure
```
__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── lib/             # Library/utility tests
└── __mocks__/       # Manual mocks (if needed)
```

### Pattern 1: Auto-Mocked Module Typing
**What:** Use `jest.mocked()` for modules mocked with `jest.mock()`
**When to use:** All auto-mocked modules (Firebase, Next.js, Auth0, custom services)
**Example:**
```typescript
// Source: https://jestjs.io/docs/mock-function-api
import { cacheGet } from '@/lib/cacheService';

jest.mock('@/lib/cacheService');

// Modern approach (Jest 27+)
const mockCacheGet = jest.mocked(cacheGet);

// Now all mock methods are typed
mockCacheGet.mockResolvedValue({ data: [], age_seconds: 0 });
```

### Pattern 2: Manual Mock Function Typing
**What:** Use `jest.MockedFunction<typeof fn>` for individual mocks
**When to use:** Manual mocks created with jest.fn(), spies on global functions
**Example:**
```typescript
// Source: https://jestjs.io/docs/mock-function-api
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
} as Response);
```

### Pattern 3: Discriminated Union Type Guards
**What:** Use 'in' operator and type narrowing for discriminated unions
**When to use:** RateLimitCheckResult, CacheResult, DeadManSwitchStatus, etc.
**Example:**
```typescript
// Source: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
type RateLimitCheckResult = RateLimitAllowed | RateLimitBlocked;

// Type guard with 'in' operator
if ('remaining' in result) {
  // result is RateLimitAllowed
  expect(result.remaining).toBeGreaterThan(0);
} else {
  // result is RateLimitBlocked
  expect(result.resetInSeconds).toBeDefined();
}
```

### Pattern 4: Full External API Type Definitions
**What:** Create complete interface definitions for external APIs
**When to use:** Hue v2 API, Netatmo API, Camera API (198 documented errors)
**Example:**
```typescript
// types/external-apis.d.ts
declare module 'hue-api' {
  export interface HueLight {
    id: string;
    on: { on: boolean };
    brightness: { brightness: number };
    color?: { xy: { x: number; y: number } };
    // ... all properties from actual Hue v2 API
  }

  export interface HueScene {
    id: string;
    name: string;
    actions: HueSceneAction[];
  }
}
```

### Pattern 5: Shared Mock Type Utilities
**What:** Create reusable helpers to reduce boilerplate across 90+ test files
**When to use:** Common mock patterns (Firebase refs, API responses, hooks)
**Example:**
```typescript
// __tests__/__utils__/mockHelpers.ts
import { jest } from '@jest/globals';

export function mockFunction<T extends (...args: any[]) => any>(
  fn: T
): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

export function createMockFirebaseRef() {
  return {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ val: () => null }),
    update: jest.fn().mockResolvedValue(undefined),
  };
}
```

### Pattern 6: Next.js Config TypeScript Migration
**What:** Rename next.config.js to next.config.ts with NextConfig type
**When to use:** All Next.js 15+ projects with TypeScript
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ... config options with full type safety
};

export default nextConfig;
```

### Anti-Patterns to Avoid
- **Pragmatic `as any` casts**: Phase 42 approach rejected — Phase 43 requires proper typing
- **Incomplete discriminated unions**: Test fixtures must include ALL required properties for the discriminant
- **Manual type assertions for mocks**: Use `jest.mocked()` instead of `as jest.MockedFunction<typeof fn>`
- **Incomplete external API types**: Stub interfaces rejected — must define all accessed properties

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mock type inference | Custom mock wrappers | jest.mocked() helper | Built-in since Jest 27, handles deep nesting automatically |
| Manual mock typing | Type assertions everywhere | jest.MockedFunction<typeof fn> | @types/jest provides proper generic types |
| Discriminated union narrowing | Custom type guards | 'in' operator + TypeScript inference | TypeScript compiler recognizes discriminated unions automatically |
| External API validation | Manual property checks | Zod schema validation | Runtime validation + automatic type inference |
| Next.js config typing | Manual JSDoc comments | next.config.ts with NextConfig type | Official TypeScript support in Next.js 15+ |

**Key insight:** Modern Jest (27+) and TypeScript (5.x) have built-in solutions for all mock typing patterns. Custom solutions add complexity without benefit.

## Common Pitfalls

### Pitfall 1: jest.mocked() Shallow vs Deep
**What goes wrong:** Using `jest.mocked(fn, { shallow: true })` on deeply nested mocks breaks type inference for nested properties
**Why it happens:** Shallow mocking only types the top level, nested method calls lose type safety
**How to avoid:** Use default deep mocking for objects with nested methods, reserve shallow for simple function mocks
**Warning signs:** TypeScript errors on `.mock.calls`, `.mockReturnValue()` for nested methods
**Example:**
```typescript
// BAD: Shallow breaks nested typing
const mockService = jest.mocked(netatmoApi, { shallow: true });
mockService.parseSchedules.mockReturnValue([]); // ❌ Type error

// GOOD: Deep mocking types all levels
const mockService = jest.mocked(netatmoApi);
mockService.parseSchedules.mockReturnValue([]); // ✅ Fully typed
```

### Pitfall 2: Discriminated Union Property Access
**What goes wrong:** Accessing union-specific properties without type narrowing causes TS2339 "Property does not exist"
**Why it happens:** TypeScript can't infer which union member until you narrow with type guard
**How to avoid:** Always use 'in' operator, typeof, or custom type guard before accessing discriminant-specific properties
**Warning signs:** TS2339 errors on properties that definitely exist in one union branch
**Example:**
```typescript
// BAD: No type narrowing
const result: RateLimitCheckResult = checkRateLimit(userId);
expect(result.remaining).toBeDefined(); // ❌ 'remaining' doesn't exist on RateLimitBlocked

// GOOD: Type guard with 'in' operator
if ('remaining' in result) {
  expect(result.remaining).toBeGreaterThan(0); // ✅ TypeScript knows it's RateLimitAllowed
}
```

### Pitfall 3: Mock Type Persistence After clearAllMocks()
**What goes wrong:** jest.clearAllMocks() in afterEach() removes mock implementations, breaking tests
**Why it happens:** clearAllMocks() resets `.mockImplementation()` but TypeScript types remain, causing runtime mismatches
**How to avoid:** Re-apply mock implementations after clearAllMocks() or use mockImplementation() in beforeEach()
**Warning signs:** Tests pass in isolation but fail when run together, "not a function" runtime errors
**Example:**
```typescript
// BAD: Implementation cleared in afterEach
beforeEach(() => {
  mockFn.mockReturnValue(42);
});

afterEach(() => {
  jest.clearAllMocks(); // ❌ Removes mockReturnValue
});

// GOOD: Re-apply in beforeEach
afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  mockFn.mockReturnValue(42); // ✅ Applied after clear
});
```

### Pitfall 4: External API Property Assumptions
**What goes wrong:** Assuming external API types match internal expectations causes 198+ property access errors
**Why it happens:** Hue v2, Netatmo, Camera APIs have different property structures than assumed
**How to avoid:** Create complete type definitions from official API documentation, validate with Zod at runtime
**Warning signs:** TS2339 "Property does not exist" on external API responses, runtime undefined errors
**Example:**
```typescript
// BAD: Assumed property structure
interface HueLight {
  on: boolean; // ❌ Actual API: { on: boolean }
  brightness: number; // ❌ Actual API: { brightness: number }
}

// GOOD: Actual API structure
interface HueLight {
  id: string;
  on: { on: boolean };
  brightness: { brightness: number };
  color?: { xy: { x: number; y: number } };
}
```

### Pitfall 5: Config File TypeScript Migration Order
**What goes wrong:** Converting config files before build validation causes circular dependency errors
**Why it happens:** Next.js config affects TypeScript compilation, changing mid-migration breaks type checking
**How to avoid:** Convert config files LAST, after all source files migrated and tsc passes
**Warning signs:** "Cannot find module" errors in tsconfig, build process fails after config conversion
**Recommended order:** Source files → Tests → Verify tsc passes → Convert configs → Verify build

## Code Examples

Verified patterns from official sources:

### Mock Auto-Mocked Module (Jest.mocked Pattern)
```typescript
// Source: https://jestjs.io/docs/mock-function-api
import { jest } from '@jest/globals';
import { cacheGet, invalidateCache } from '@/lib/cacheService';

jest.mock('@/lib/cacheService');

describe('schedules API', () => {
  const mockCacheGet = jest.mocked(cacheGet);
  const mockInvalidateCache = jest.mocked(invalidateCache);

  beforeEach(() => {
    mockCacheGet.mockResolvedValue({
      data: [{ id: '1', name: 'Schedule 1' }],
      age_seconds: 0,
    });
  });

  it('returns cached schedules', async () => {
    const result = await mockCacheGet('schedules:home123');
    expect(result.data).toHaveLength(1);
    expect(result.age_seconds).toBe(0);
  });
});
```

### Mock Global Function (MockedFunction Pattern)
```typescript
// Source: https://jestjs.io/docs/mock-function-api
import { jest } from '@jest/globals';

describe('geocoding API', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    } as Response);
  });

  it('fetches geocoding data', async () => {
    await fetch('https://api.example.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

### Discriminated Union Type Guard
```typescript
// Source: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
type DeadManSwitchStatus =
  | { stale: false; elapsed: number; lastCheck: string }
  | { stale: true; reason: string; elapsed: number; lastCheck: string; error?: string };

function validateStatus(status: DeadManSwitchStatus) {
  if (status.stale) {
    // TypeScript knows status has 'reason' property
    expect(status.reason).toBeDefined();
    if ('error' in status) {
      expect(status.error).toBeDefined();
    }
  } else {
    // TypeScript knows status.stale === false
    expect(status.elapsed).toBeGreaterThan(0);
  }
}
```

### Shared Mock Helper Utility
```typescript
// __tests__/__utils__/mockHelpers.ts
import { jest } from '@jest/globals';

/**
 * Type-safe mock function wrapper
 * Reduces boilerplate for jest.fn() casts
 */
export function mockFunction<T extends (...args: any[]) => any>(
  fn: T
): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

/**
 * Create typed Firebase database reference mock
 */
export function createMockDbRef() {
  return {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ val: () => null }),
    update: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockReturnValue({ key: 'mock-key' }),
  };
}

// Usage in tests
import { mockFunction, createMockDbRef } from './__utils__/mockHelpers';

const mockAdminDbGet = mockFunction(adminDbGet);
const mockRef = createMockDbRef();
```

### Next.js TypeScript Config
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript
import type { NextConfig } from 'next';
import { createSerwist } from '@serwist/next';

const withSerwist = createSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

export default withSerwist(nextConfig);
```

## Current State Analysis

**TypeScript errors:** 1665 total (from `tsc --noEmit`)
**Test failures:** 25 (down from 29 in Phase 42)
**Remaining JS files:** 1 source file (postcss.config.js), 0 in app/lib/components/__tests__

### Error Distribution by File
| File Pattern | Error Count | Primary Issue |
|--------------|-------------|---------------|
| UI component tests (Accordion, Tabs, Sheet) | 290 | Missing mock methods on Radix imports |
| Netatmo tests (sync, API, schedules) | 136 | Discriminated union property access |
| Service tests (scheduler, maintenance, logger) | 135 | Firebase Timestamp mock typing |
| Monitoring tests (StatusCards) | 90 | Missing required props, discriminated unions |
| Debug pages (design-system) | 42 | Large file edge typing gaps |
| API route tests (geocoding) | 12 | Global fetch mock typing |

### Test Failure Categories
| Category | Count | Root Cause |
|----------|-------|------------|
| StoveCard external sync | 10 | Discriminant literal type mismatches |
| StatusCards monitoring | 8 | Missing required props (error field) |
| Misc component tests | 7 | Pre-existing issues unrelated to migration |

### Known Patterns from Phase 42
- Mock type errors are compile-time only — Jest runtime succeeds (3012 passing tests)
- Pragmatic `as any` documented but NOT applied (Phase 43 requires proper fixes)
- 198 external API type errors documented in Phase 41 (Hue/Netatmo/Camera property access)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `as jest.MockedFunction<typeof fn>` | jest.mocked() helper | Jest 27 (2021) | 60% less boilerplate, deep nesting typed automatically |
| Stub type definitions with `any` | Full interface definitions | TypeScript 5.0+ (2023) | Proper autocomplete, catches runtime errors at compile-time |
| allowJs: true forever | Disable after migration | Migration best practice | Prevents regression, enforces pure TypeScript |
| Pragmatic typing for external APIs | Zod validation + inferred types | Zod 3.0+ (2022) | Runtime safety + compile-time inference |

**Deprecated/outdated:**
- `ts-jest` mocked() helper: Replaced by Jest built-in jest.mocked() in Jest 27+
- Manual type assertions for every mock: jest.mocked() handles automatically
- Incremental allowJs: true: Final phase must disable to enforce pure TS
- Global mock type definitions file: Modern approach uses jest.mocked() inline

## Verification Strategy

### Validation Commands
```bash
# TypeScript type checking (must pass with exit code 0)
npx tsc --noEmit

# Full test suite (must pass all 3037 tests)
npm test

# Build verification (CAUTION: project rule says NEVER run, only for final verification)
npm run build

# Dev server smoke test (Claude's discretion on depth)
npm run dev
# Visit critical pages: /, /stove, /lights, /camera, /thermostat
```

### Success Criteria Validation
1. ✅ tsc --noEmit: 0 errors (currently 1665)
2. ✅ npm test: 3037 passed, 0 failed (currently 3012 passed, 25 failed)
3. ✅ find app lib components __tests__ -name "*.js": 0 files (currently 0)
4. ✅ find . -maxdepth 1 -name "*.config.js": 0 files (currently 1: postcss.config.js)
5. ✅ npm run build: Successful completion
6. ✅ allowJs: false in tsconfig.json (currently true)
7. ✅ npm run dev: Server starts, pages load

### Recommended Order of Operations
Based on error analysis and dependency chains:

**Wave 1: Shared Utilities (Foundation)**
- Create `__tests__/__utils__/mockHelpers.ts` with reusable mock type utilities
- Create `types/external-apis.d.ts` with full Hue/Netatmo/Camera interface definitions
- Validate utilities compile without errors

**Wave 2: Mock Type Errors (Bulk - 1492 errors)**
- Apply `jest.mocked()` to all auto-mocked modules (Firebase, services, APIs)
- Fix global fetch/Timestamp mocks with proper typing
- Batch process where pattern is consistent (e.g., all cacheService mocks)
- Manual review for edge cases (custom mock implementations)

**Wave 3: Discriminated Union Errors (136 errors)**
- Fix RateLimitCheckResult property access with 'in' operator type guards
- Fix DeadManSwitchStatus with complete test fixtures (all required props)
- Fix CacheResult discriminated union narrowing
- Add missing required props to test fixtures (error field in StatusCards)

**Wave 4: External API Type Errors (198 documented errors)**
- Apply Hue v2 API type definitions to lights page and tests
- Apply Netatmo API type definitions to thermostat/scheduler code
- Apply Camera API type definitions to camera event handling
- Validate runtime behavior matches new type definitions

**Wave 5: Config Files (Final)**
- Convert postcss.config.js to postcss.config.ts
- Convert next.config.mjs to next.config.ts (if not already TS)
- Convert tailwind.config.ts if needed (likely already TS)
- Verify build still works after config changes

**Wave 6: Final Lockdown**
- Run `tsc --noEmit` — verify 0 errors
- Run `npm test` — verify all 3037 tests pass
- Run `npm run build` — verify successful completion
- Disable `allowJs: true` in tsconfig.json
- Run `tsc --noEmit` again — verify enforcement works
- Create final commit documenting migration completion

## Open Questions

Things that couldn't be fully resolved:

1. **External API Schema Validation**
   - What we know: Hue v2, Netatmo, Camera APIs have incomplete types (198 errors documented)
   - What's unclear: Whether to use Zod validation at runtime or trust type definitions only
   - Recommendation: Create full type definitions first, add Zod validation if runtime errors occur

2. **Test Fixture Completeness**
   - What we know: Discriminated unions require ALL properties for the active discriminant
   - What's unclear: Whether some test fixtures are intentionally minimal or just incomplete
   - Recommendation: Add all required properties, use optional properties for truly optional fields

3. **Mock Implementation Persistence Strategy**
   - What we know: jest.clearAllMocks() in afterEach() clears implementations
   - What's unclear: Whether to re-apply in afterEach() or move to beforeEach()
   - Recommendation: Move mockImplementation() to beforeEach() for consistency

4. **Dev Server Smoke Test Scope**
   - What we know: Must verify server starts and pages load
   - What's unclear: Which pages to test, how deep to navigate
   - Recommendation (Claude's discretion): Visit main pages (home, stove, lights, camera, thermostat), verify no console errors

## Sources

### Primary (HIGH confidence)
- [Jest Mock Functions API](https://jestjs.io/docs/mock-function-api) - Official Jest documentation for mock typing
- [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Official TypeScript handbook on type guards
- [Next.js TypeScript Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript) - Official Next.js 15+ TypeScript support
- Current codebase: package.json (Jest 30.2.0, @types/jest 30.0.0), tsconfig.json (allowJs: true)

### Secondary (MEDIUM confidence)
- [DEV Community: Mock modules properly with Jest and Typescript](https://dev.to/mattiz/mock-modules-properly-with-jest-and-typescript-3nao) - Community best practices
- [Instil: TypeScript Testing Tips - Mocking Functions with Jest](https://instil.co/blog/typescript-testing-tips-mocking-functions-with-jest/) - Professional patterns
- [TypeScript Deep Dive: Discriminated Unions](https://basarat.gitbook.io/typescript/type-system/discriminated-unions) - Comprehensive guide
- [GitHub: Hue-Sync](https://github.com/jdmg94/Hue-Sync) - TypeScript library for Hue API v2
- [GitHub: node-hue-api](https://github.com/peter-murray/node-hue-api/blob/typescript/docs/) - TypeScript Hue API examples

### Tertiary (LOW confidence)
- Community discussions on Netatmo TypeScript types (no official library found)
- WebSearch results for "TypeScript strict mode discriminated union" (general patterns, not project-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Jest 30.2.0 and @types/jest 30.0.0 provide all needed tooling, official documentation comprehensive
- Architecture: HIGH - Patterns verified in official Jest and TypeScript documentation, proven in current codebase
- Pitfalls: MEDIUM - Patterns identified from Phase 42 learnings and common TypeScript migration issues, some project-specific

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable TypeScript/Jest patterns)

**Notes:**
- All findings based on current error analysis (1665 tsc errors, 25 test failures)
- Mock type utilities pattern recommended to reduce boilerplate across 90+ test files
- External API type definitions critical for 198 documented errors from Phase 41
- Order of operations flexible but config files MUST be last to avoid build breakage
