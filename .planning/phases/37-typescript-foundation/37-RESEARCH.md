# Phase 37: TypeScript Foundation - Research

**Researched:** 2026-02-05
**Domain:** TypeScript migration in Next.js 16.1 with incremental adoption
**Confidence:** HIGH

## Summary

This research covers the TypeScript foundation setup for an incremental migration of an existing Next.js 16.1 PWA codebase. The project already has a `tsconfig.json` with `allowJs: true` and path aliases configured, plus one TypeScript file (`app/sw.ts`) demonstrating that TypeScript compilation is working.

The standard approach for this phase is to:
1. Verify and enhance the existing TypeScript configuration
2. Configure ESLint with TypeScript support using the flat config format
3. Create core type definitions for Firebase data structures and API patterns
4. Establish a types directory structure that supports incremental migration

**Primary recommendation:** Leverage the existing working TypeScript setup, add `eslint-config-next/typescript` to the ESLint flat config, and create a centralized `types/` directory with shared type definitions that can be imported by both `.js` and `.ts` files during the migration.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | bundled with Next.js | Type checking and compilation | Next.js includes TypeScript; no separate install needed |
| @types/react | 19.2.8 | React type definitions | Already installed in project |
| @types/jest | 30.0.0 | Jest type definitions | Already installed in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-config-next/typescript | bundled | TypeScript-specific ESLint rules | Add to existing ESLint flat config |
| typescript-eslint | bundled via eslint-config-next | Parser and rules for TS | Automatically included |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual typescript-eslint setup | eslint-config-next/typescript | Next.js bundled config is simpler and tested with Next.js |
| Strict mode immediately | Gradual strictness | allowJs + strict:false enables incremental migration |

**Installation:**
```bash
# No installation needed - TypeScript is bundled with Next.js
# @types/react and @types/jest already installed
```

## Architecture Patterns

### Recommended Project Structure
```
types/
  index.ts              # Re-exports all types
  firebase/
    index.ts            # Firebase data structure types
    stove.ts            # Stove-related types
    maintenance.ts      # Maintenance types
    schedules.ts        # Schedule types
    notifications.ts    # Notification types
  api/
    index.ts            # API types
    responses.ts        # API response patterns
    requests.ts         # API request patterns
    errors.ts           # Error code types
  devices/
    index.ts            # Device types
    registry.ts         # Device registry types
```

### Pattern 1: Type-Only Exports
**What:** Use `export type` for types that should not generate runtime code
**When to use:** All type definitions in the types/ directory
**Example:**
```typescript
// Source: TypeScript handbook + Next.js TypeScript docs
// types/firebase/stove.ts
export type StoveStatus = 'off' | 'igniting' | 'running' | 'shutdown' | 'error';

export interface StoveState {
  status: StoveStatus;
  power: number;
  targetTemperature: number;
  currentTemperature: number;
  lastUpdatedAt: string; // ISO 8601
  errorCode?: string;
}
```

### Pattern 2: Zod Schema Inference
**What:** Derive TypeScript types from existing Zod schemas
**When to use:** When Zod schemas already exist (notification preferences)
**Example:**
```typescript
// Source: Project lib/schemas/notificationPreferences.js
import { z } from 'zod';
import { notificationPreferencesSchema } from '@/lib/schemas/notificationPreferences';

// Infer type from existing Zod schema
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
```

### Pattern 3: API Response Generics
**What:** Generic types for consistent API response wrapping
**When to use:** All API response type definitions
**Example:**
```typescript
// Source: Project lib/core/apiResponse.js patterns
export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### Pattern 4: Discriminated Unions for Device State
**What:** Use discriminated unions for different device states
**When to use:** Device status types where behavior differs by state
**Example:**
```typescript
// types/devices/index.ts
export type DeviceType = 'stove' | 'thermostat' | 'hue' | 'camera';

export interface DeviceBase {
  id: string;
  type: DeviceType;
  name: string;
  enabled: boolean;
}

export interface ConnectedDevice extends DeviceBase {
  connectionStatus: 'connected';
  lastSeen: string;
}

export interface DisconnectedDevice extends DeviceBase {
  connectionStatus: 'disconnected';
  lastError?: string;
}

export type Device = ConnectedDevice | DisconnectedDevice;
```

### Anti-Patterns to Avoid
- **Using `any` liberally:** Use `unknown` with type guards instead; `any` defeats the purpose of TypeScript
- **Inline type definitions:** Centralize types in the types/ directory for reuse
- **Duplicating types between files:** Use re-exports from index.ts files
- **Overly strict types during migration:** Start with looser types, tighten incrementally
- **Editing next-env.d.ts:** This is auto-generated; create custom .d.ts files instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| React component types | Custom Props interfaces | React.FC, ComponentProps | Built-in React types handle edge cases |
| API route handler types | Manual request/response types | Next.js built-in types | Next.js 16 provides RouteContext, PageProps |
| Firebase snapshot typing | Manual `as` casts everywhere | Generic type parameters | Firebase SDK supports generics |
| Form validation types | Separate TS types and Zod schemas | `z.infer<typeof schema>` | Zod inference keeps types in sync |
| Error code types | Manual string literals | `typeof ERROR_CODES[keyof typeof ERROR_CODES]` | Derive from existing constants |

**Key insight:** The codebase already has well-structured JavaScript with JSDoc comments and Zod schemas. Types should be derived from existing patterns rather than recreating them.

## Common Pitfalls

### Pitfall 1: Breaking Incremental Migration by Enabling Strict Mode
**What goes wrong:** Enabling `strict: true` causes thousands of errors in existing .js files
**Why it happens:** Strict mode applies to all files including those not yet migrated
**How to avoid:** Keep `strict: false` in tsconfig.json; optionally enable strictness per-file with `// @ts-check` or migrate to .ts
**Warning signs:** TypeScript errors in unchanged .js files after config changes

### Pitfall 2: Forgetting to Update includes Array
**What goes wrong:** New .ts/.tsx files not type-checked
**Why it happens:** tsconfig.json `include` pattern doesn't match new file locations
**How to avoid:** The existing config includes `**/*.ts` and `**/*.tsx` which covers all locations
**Warning signs:** No type errors in obviously wrong code

### Pitfall 3: Path Alias Mismatch Between tsconfig and jsconfig
**What goes wrong:** `@/` imports work in IDE but fail at runtime, or vice versa
**Why it happens:** Having both tsconfig.json and jsconfig.json with different path configurations
**How to avoid:** Remove jsconfig.json after migrating to tsconfig.json; the project should use tsconfig.json only
**Warning signs:** Import errors that differ between development and production

### Pitfall 4: Incorrect ESLint Parser Configuration
**What goes wrong:** ESLint reports parsing errors on TypeScript files
**Why it happens:** ESLint not configured to use TypeScript parser for .ts/.tsx files
**How to avoid:** Use `eslint-config-next/typescript` which configures the parser correctly
**Warning signs:** "Parsing error: Unexpected token" on valid TypeScript syntax

### Pitfall 5: Type Definitions Out of Sync with Runtime
**What goes wrong:** Types say one thing, runtime data is different
**Why it happens:** Firebase data structures evolve without updating types
**How to avoid:** Use Zod for runtime validation with `z.infer` for types; single source of truth
**Warning signs:** Runtime errors despite no TypeScript errors

## Code Examples

Verified patterns from official sources:

### tsconfig.json for Incremental Migration
```json
// Source: https://nextjs.org/docs/app/api-reference/config/typescript
// Existing project config is already well-configured
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", "public/sw.js"]
}
```

### ESLint Flat Config with TypeScript
```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/eslint
// eslint.config.mjs - Updated for TypeScript
import { defineConfig, globalIgnores } from 'eslint/config';
import nextConfig from 'eslint-config-next';
import nextTs from 'eslint-config-next/typescript';
import tailwindcss from 'eslint-plugin-tailwindcss';

const eslintConfig = defineConfig([
  // Next.js base config
  ...nextConfig,

  // TypeScript rules
  ...nextTs,

  // Tailwind CSS design token enforcement (existing)
  {
    name: 'tailwindcss/design-tokens',
    plugins: { tailwindcss },
    settings: {
      tailwindcss: { config: {} },
    },
    rules: {
      'tailwindcss/no-arbitrary-value': ['warn', {
        ignoredProperties: ['content', 'grid-template-columns', 'grid-template-rows', 'animation', 'box-shadow'],
      }],
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/enforces-negative-arbitrary-values': 'warn',
      'tailwindcss/enforces-shorthand': 'warn',
      'tailwindcss/migration-from-tailwind-2': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },

  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'public/sw.js',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
```

### Firebase Data Type Definitions
```typescript
// Source: Project lib/repositories/ patterns + Firebase TypeScript docs
// types/firebase/stove.ts

/**
 * Stove operational status
 */
export type StoveStatus =
  | 'off'
  | 'igniting'
  | 'running'
  | 'modulating'
  | 'shutdown'
  | 'error'
  | 'standby';

/**
 * Stove power level (1-5)
 */
export type StovePowerLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Stove state as stored in Firebase /stove/state
 */
export interface StoveState {
  status: StoveStatus;
  power: StovePowerLevel;
  targetTemperature: number;
  currentTemperature?: number;
  exhaustTemperature?: number;
  lastUpdatedAt: string; // ISO 8601
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Maintenance record as stored in Firebase /maintenance
 */
export interface MaintenanceRecord {
  lastCleaning: string; // ISO 8601
  totalHours: number;
  hoursSinceLastCleaning: number;
  needsCleaning: boolean;
  cleaningThresholdHours: number;
  history?: MaintenanceHistoryEntry[];
}

export interface MaintenanceHistoryEntry {
  timestamp: string;
  type: 'cleaning' | 'inspection' | 'repair';
  notes?: string;
}
```

### API Response Type Definitions
```typescript
// Source: Project lib/core/apiResponse.js + apiErrors.js
// types/api/responses.ts

import type { ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

/**
 * Error codes from the codebase
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * HTTP status codes
 */
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

/**
 * Successful API response
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  // Data is spread at top level for backward compatibility
  [key: string]: unknown;
}

/**
 * Error API response
 */
export interface ApiError {
  success: false;
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
  // Device-specific flags
  reconnect?: boolean;
}

/**
 * Generic API response union
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Stove status response
 */
export interface StoveStatusResponse extends ApiSuccess {
  status: import('./firebase/stove').StoveStatus;
  power: import('./firebase/stove').StovePowerLevel;
  temperature: number;
  maintenance?: {
    needsCleaning: boolean;
    hoursSinceLastCleaning: number;
  };
}
```

### Repository Base Type Definition
```typescript
// Source: Project lib/repositories/base/BaseRepository.js
// types/firebase/repository.ts

/**
 * Firebase data with timestamp
 */
export interface WithTimestamp {
  updatedAt: string; // ISO 8601
  createdAt?: string;
}

/**
 * Base repository interface
 */
export interface IBaseRepository<T> {
  get(subPath?: string): Promise<T | null>;
  set(subPath: string, data: T): Promise<void>;
  update(subPath: string, updates: Partial<T>): Promise<void>;
  push(subPath: string, data: T): Promise<string>;
  remove(subPath: string): Promise<void>;
  transaction(subPath: string, updateFn: (current: T | null) => T | null): Promise<void>;
}

/**
 * Filter undefined values (Firebase requirement)
 */
export type FilterUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K] extends object
    ? FilterUndefined<T[K]>
    : T[K];
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| .eslintrc.js legacy format | eslint.config.mjs flat config | ESLint 9 (2024) | Project already uses flat config |
| Manual TypeScript setup | Next.js built-in TypeScript | Always | No extra installation needed |
| moduleResolution: "node" | moduleResolution: "bundler" | TypeScript 5.0+ | Better bundler compatibility |
| jsx: "preserve" | jsx: "react-jsx" | React 17+ | Automatic JSX transform |
| Separate jsconfig.json | tsconfig.json with allowJs | N/A | Single config for both |

**Deprecated/outdated:**
- **jsconfig.json with tsconfig.json present:** Use only tsconfig.json; jsconfig.json is for JS-only projects
- **@types/node manual installation:** Next.js bundles this
- **eslint-plugin-typescript separate from Next.js config:** Use eslint-config-next/typescript

## Open Questions

Things that couldn't be fully resolved:

1. **Zod type inference for existing schemas**
   - What we know: The project uses Zod schemas (notification preferences) that can infer types
   - What's unclear: Whether all Zod schemas export their inferred types
   - Recommendation: Audit Zod schemas and add `export type X = z.infer<typeof schema>` where missing

2. **Service worker type augmentation**
   - What we know: `app/sw.ts` has custom type augmentations for `WorkerGlobalScope`
   - What's unclear: Whether additional service worker type augmentations are needed
   - Recommendation: Current setup works; extend only if new SW features added

3. **Third-party library types**
   - What we know: @types/react and @types/jest are installed
   - What's unclear: Whether other libraries need @types packages
   - Recommendation: Add @types/* packages as needed when TypeScript errors surface during migration

## Sources

### Primary (HIGH confidence)
- [Next.js TypeScript Documentation](https://nextjs.org/docs/app/api-reference/config/typescript) - tsconfig.json configuration, plugins, incremental support
- [Next.js ESLint Documentation](https://nextjs.org/docs/app/api-reference/config/eslint) - Flat config format, TypeScript integration
- [typescript-eslint Getting Started](https://typescript-eslint.io/getting-started/) - ESLint 9 flat config with TypeScript

### Secondary (MEDIUM confidence)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - Native TypeScript config support
- [ESLint 9 Flat Config Guide](https://eslint.org/docs/latest/use/configure/migration-guide) - Flat config migration

### Tertiary (LOW confidence)
- WebSearch results on Firebase TypeScript best practices - General patterns, validated against project code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified against Next.js 16 official documentation
- Architecture: HIGH - Based on existing project patterns and official TypeScript/Next.js docs
- Pitfalls: HIGH - Derived from official migration guides and common issues

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - TypeScript ecosystem is stable)
