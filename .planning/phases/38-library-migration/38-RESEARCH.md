# Phase 38: Library Migration - Research

**Researched:** 2026-02-06
**Domain:** JavaScript to TypeScript migration for library modules (services, hooks, utilities, repositories)
**Confidence:** HIGH

## Summary

This research covers the migration of ~147 JavaScript files in lib/ plus ~12 hooks in app/hooks/ to TypeScript. Phase 37 has established a solid foundation with @/types infrastructure, barrel exports, type guards, and union types. The project's tsconfig.json has `allowJs: true` and `strict: false`, enabling incremental migration without breaking existing code.

The standard approach for library migration is:
1. Migrate leaf utilities first (no dependencies on other lib/ files)
2. Progress through dependency layers (utils → repositories → services → hooks)
3. Type external API responses pragmatically (prefer `unknown` + type guards over `any`)
4. Extend @/types with shared types, keep file-specific types local
5. Migrate in batches of 10-15 files per plan to maintain verification quality

Current state: ~30,460 lines of JavaScript code across 159 files. Phase 37 created comprehensive type infrastructure that can be immediately leveraged.

**Primary recommendation:** Use bottom-up dependency order (leaf utilities → base classes → repositories → services → hooks), batch files by complexity/coupling rather than directory, and extend Phase 37's type patterns consistently.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**NONE** — All implementation decisions delegated to Claude's discretion.

### Claude's Discretion

**Type Strictness Level:**
- `any` usage — pragmatic approach based on file complexity (likely: prefer `unknown` + type guards for new code, allow `any` with TODO comments for complex third-party interactions)
- Return type annotations — based on function visibility and complexity (likely: explicit on exports, inferred for internal helpers)
- Strict mode — based on current tsconfig state (likely: work within existing strictness, don't loosen)
- Central vs local types — shared types to @/types, file-specific stay local

**Migration Order & Batching:**
- Order — analyze dependency graph and pick most efficient approach (likely: leaf utilities first, then services)
- Batch size — based on file complexity and interdependencies
- Test migration timing — based on roadmap Phase 42 boundary
- Verification cadence — based on practical batch size

**External Dependency Typing:**
- Firebase typing — use Phase 37 types where they fit, extend as needed
- Netatmo API typing — based on how data is currently consumed
- Hue/OpenMeteo/other APIs — consistent strategy adjusted per service complexity
- Where new types live — shared types extend @/types, service-specific stay in lib/

**Hook Return Types & Generics:**
- Loading/error/success patterns — match current hook structure (likely: simple nullable if that's the existing pattern)
- Generic vs specific hooks — based on actual commonality between hooks
- Command typing — based on existing command patterns (likely: string literal unions per Phase 37 conventions)
- Export types — based on hook complexity and breadth of consumption

**Guiding Principles:**
1. **Pragmatic over dogmatic** — pick what fits the existing codebase patterns
2. **Consistency with Phase 37** — follow conventions established in TypeScript Foundation (barrel exports, union types, mixin interfaces)
3. **No behavior changes** — this is a type migration, not a refactor
4. **Extend @/types when reuse potential exists** — don't duplicate type definitions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

---

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | bundled with Next.js | Type checking and compilation | Next.js includes TypeScript; established in Phase 37 |
| @types/react | 19.2.8 | React type definitions | Already installed; covers React hooks |
| @types/node | latest | Node.js type definitions | For Node APIs used in services |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | existing | Runtime schema validation | Already used for notification preferences; leverage z.infer<> |
| Phase 37 types | @/types | Shared type infrastructure | Established patterns: barrel exports, union types, type guards |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual dependency analysis | madge or dependency-cruiser | Tools add dependency but project is small enough for manual analysis |
| Big-bang migration | File-by-file incremental | Incremental is safer but Phase 37 foundation makes it straightforward |
| Any for all external APIs | unknown + type guards | `unknown` requires more upfront work but prevents runtime errors |

**Installation:**
```bash
# No additional packages needed
# TypeScript, @types/react, @types/node already installed
# Phase 37 @/types infrastructure ready to extend
```

---

## Architecture Patterns

### Recommended Migration Order (Bottom-Up Dependency)

Based on the codebase structure:

```
Wave 1: Leaf Utilities (no lib/ dependencies)
├── lib/utils/cn.js
├── lib/utils/formatUtils.js
├── lib/utils/pidController.js
├── lib/utils/scheduleHelpers.js
└── lib/deviceFingerprint.js

Wave 2: Core Infrastructure
├── lib/core/apiErrors.js
├── lib/core/apiResponse.js
├── lib/firebase.js
├── lib/firebaseAdmin.js
└── lib/logger.js

Wave 3: Base Classes
├── lib/repositories/base/BaseRepository.js
└── lib/schemas/* (Zod schemas - type inference)

Wave 4: Repositories (depend on base)
├── lib/repositories/MaintenanceRepository.js
├── lib/repositories/ScheduleRepository.js
├── lib/repositories/SchedulerModeRepository.js
└── lib/repositories/StoveStateRepository.js

Wave 5: External API Services
├── lib/stoveApi.js
├── lib/services/netatmoApi.js
├── lib/hue/hueApi.js
└── lib/services/openMeteoApi.js

Wave 6: Business Logic Services (depend on repos + APIs)
├── lib/services/StoveService.js
├── lib/services/maintenanceService.js
├── lib/services/coordinationService.js
└── lib/schedulerService.js

Wave 7: React Hooks (depend on services/utils)
├── app/hooks/useDebounce.js
├── app/hooks/useToast.js
├── app/hooks/useHaptic.js
└── app/hooks/useContextMenuLongPress.js
```

**Rationale:** Each wave depends only on previous waves. Within a wave, files can be migrated in parallel or any order.

### Pattern 1: Utility Function Migration (Simple)
**What:** Pure utilities with minimal external dependencies
**When to use:** lib/utils/*, standalone helpers
**Example:**
```typescript
// Before: lib/utils/cn.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// After: lib/utils/cn.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Pattern 2: Repository Class Migration (Generic Base)
**What:** Repository classes extending BaseRepository
**When to use:** All repository classes
**Example:**
```typescript
// lib/repositories/base/BaseRepository.ts
export abstract class BaseRepository<T = unknown> {
  protected basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async get(subPath: string = ''): Promise<T | null> {
    const fullPath = this.resolvePath(subPath);
    return adminDbGet<T>(fullPath);
  }

  async set(subPath: string, data: T): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    const filteredData = this.filterUndefined(data);
    return adminDbSet(fullPath, filteredData);
  }

  // ... other methods
}

// lib/repositories/MaintenanceRepository.ts
import { BaseRepository } from './base/BaseRepository';
import type { MaintenanceData } from '@/types/firebase';

export class MaintenanceRepository extends BaseRepository<MaintenanceData> {
  constructor() {
    super('maintenance');
  }

  async canIgnite(): Promise<boolean> {
    const data = await this.getData();
    return !data.needsCleaning;
  }
}
```

### Pattern 3: Service Class Migration (Business Logic)
**What:** Service classes that orchestrate repositories and APIs
**When to use:** StoveService, coordinationService, etc.
**Example:**
```typescript
// lib/services/StoveService.ts
import type { StovePowerLevel } from '@/types/firebase';
import type { ApiResponse } from '@/types/api';

export class StoveService {
  private maintenanceRepo: MaintenanceRepository;
  private stoveStateRepo: StoveStateRepository;

  constructor() {
    this.maintenanceRepo = new MaintenanceRepository();
    this.stoveStateRepo = new StoveStateRepository();
  }

  async ignite(
    power: StovePowerLevel = 3,
    source: 'manual' | 'scheduler' = 'manual'
  ): Promise<ApiResponse<{ status: string }>> {
    const canIgnite = await this.maintenanceRepo.canIgnite();
    if (!canIgnite) {
      throw ApiError.maintenanceRequired();
    }
    // ... rest of implementation
  }
}
```

### Pattern 4: External API Typing (Pragmatic unknown)
**What:** Type external API responses with `unknown` and type guards
**When to use:** Netatmo, Hue, OpenMeteo, Thermorossi APIs
**Example:**
```typescript
// types/api/netatmo.ts
export interface NetatmoDevice {
  id: string;
  name: string;
  type: 'NATherm1' | 'NRV';
  room_id: string;
}

export interface NetatmoApiResponse {
  status: string;
  body: {
    devices?: NetatmoDevice[];
    errors?: string[];
  };
}

// Type guard
export function isNetatmoResponse(data: unknown): data is NetatmoApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    'body' in data
  );
}

// lib/services/netatmoApi.ts
export async function getDevices(): Promise<NetatmoDevice[]> {
  const response = await fetch(url);
  const data: unknown = await response.json();

  if (!isNetatmoResponse(data)) {
    throw new Error('Invalid Netatmo API response');
  }

  return data.body.devices ?? [];
}
```

### Pattern 5: React Hook Migration (Generic Returns)
**What:** Custom hooks with typed return values
**When to use:** All app/hooks/* files
**Example:**
```typescript
// app/hooks/useToast.ts
'use client';

import { useContext } from 'react';
import { ToastContext } from '@/app/components/ui/ToastProvider';
import type { ToastVariant } from '@/types/components';

interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastAPI {
  toast: (options: ToastOptions) => string;
  success: (message: string) => string;
  error: (message: string) => string;
  warning: (message: string) => string;
  info: (message: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): ToastAPI {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
```

### Pattern 6: Zod Schema Type Inference
**What:** Leverage existing Zod schemas for type safety
**When to use:** lib/schemas/* files already using Zod
**Example:**
```typescript
// lib/schemas/notificationPreferences.ts
import { z } from 'zod';

export const notificationPreferencesSchema = z.object({
  enabled: z.boolean(),
  channels: z.object({
    push: z.boolean(),
    email: z.boolean(),
  }),
  events: z.object({
    maintenance: z.boolean(),
    errors: z.boolean(),
  }),
});

// Export inferred type
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
```

### Anti-Patterns to Avoid

- **Big-bang conversion:** Don't migrate all files at once; use dependency-ordered waves
- **Loose any everywhere:** Use `unknown` + type guards for external APIs; allow `any` only with TODO comments
- **Duplicating Phase 37 types:** Check @/types before creating new types
- **Breaking behavior:** Migration must be type-only; no logic changes
- **Ignoring test boundaries:** Phase 42 handles test migration; only migrate lib/hooks/__tests__/ if it's trivial

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency graph analysis | Custom script | Manual analysis or madge | 159 files is manageable manually; tool adds dependency |
| Type inference for Zod schemas | Manual type definitions | `z.infer<typeof schema>` | Zod provides automatic type inference |
| Firebase type definitions | Custom interfaces | Phase 37 @/types/firebase | Already established in TypeScript Foundation |
| API response wrapping | New generic types | Phase 37 @/types/api | ApiResponse<T> pattern already exists |
| Class type guards | Manual instanceof checks | TypeScript's built-in instanceof | Language feature handles class type narrowing |

**Key insight:** Phase 37 invested heavily in type infrastructure. This phase extends that foundation rather than creating new patterns.

---

## Common Pitfalls

### Pitfall 1: Big-Bang Migration Temptation
**What goes wrong:** Attempting to migrate all 159 files in one plan leads to overwhelming verification burden and high error risk.
**Why it happens:** Files appear simple individually, creating false confidence.
**How to avoid:** Batch 10-15 files per plan based on complexity, not just count. A complex service counts as 3-5 simple utilities.
**Warning signs:** Plan has >20 file conversions; verification checklist exceeds 50 items.

### Pitfall 2: Over-Typing External APIs Upfront
**What goes wrong:** Creating exhaustive type definitions for entire Netatmo/Hue/OpenMeteo APIs when only 3-5 endpoints are used.
**Why it happens:** TypeScript mindset of "type everything comprehensively."
**How to avoid:** Type only what's actually consumed. Use `unknown` + type guards for unused response fields.
**Warning signs:** API type file exceeds 200 lines but code only uses 2 endpoints; types include fields never referenced.

### Pitfall 3: Ignoring Existing tsconfig Settings
**What goes wrong:** Enabling strict mode or strictNullChecks mid-migration causes 100+ errors across already-migrated files.
**Why it happens:** Desire for "proper" TypeScript without considering incremental impact.
**How to avoid:** Work within existing `strict: false` setting. Document stricter settings as Phase 43+ work.
**Warning signs:** Changing tsconfig.json compiler options during Phase 38.

### Pitfall 4: Duplicating Phase 37 Types
**What goes wrong:** Creating new type definitions that already exist in @/types, leading to inconsistent types and import confusion.
**Why it happens:** Not checking Phase 37's type infrastructure before migration.
**How to avoid:** Always check @/types/firebase, @/types/api, @/types/components before creating new types. If similar, extend existing.
**Warning signs:** Defining StoveStatus or ApiResponse again; creating types that "feel familiar."

### Pitfall 5: Class Constructor Parameter Typing Mismatch
**What goes wrong:** Repository/Service class constructors typed with parameters that don't match actual usage patterns (e.g., expecting injected dependencies when code uses `new MaintenanceRepository()`).
**Why it happens:** Applying dependency injection patterns from research without checking actual codebase patterns.
**How to avoid:** Match existing constructor signatures exactly. Current pattern: repositories take no params, initialize internally.
**Warning signs:** Tests fail with "expected 1 argument, got 0" errors; constructor signature doesn't match existing usage.

### Pitfall 6: Breaking Firebase filterUndefined Pattern
**What goes wrong:** TypeScript strict object typing rejects `filterUndefined()` utility that strips undefined values before Firebase writes.
**Why it happens:** TypeScript's exactOptionalPropertyTypes or type narrowing issues.
**How to avoid:** Type `filterUndefined` as `<T extends object>(obj: T): Partial<T>` to preserve flexibility.
**Warning signs:** Repository update() methods fail type checking; "Type 'undefined' is not assignable" errors.

### Pitfall 7: Hook Return Type Over-Engineering
**What goes wrong:** Creating complex generic hook patterns when hooks have simple, specific return shapes.
**Why it happens:** Research shows advanced hook patterns; applying them without considering actual hook complexity.
**How to avoid:** Most project hooks return simple objects or primitives. Use explicit return types, not generics, unless commonality exists across 3+ hooks.
**Warning signs:** Hook return type spans 30+ lines; generic type parameters like `<TData, TError, TOptions>` for a hook used in one place.

---

## Code Examples

Verified patterns from Phase 37 and research:

### Example 1: Simple Utility Migration
```typescript
// Before: lib/utils/formatUtils.js
export function formatTemperature(temp) {
  if (temp === null || temp === undefined) return '--';
  return `${temp}°C`;
}

// After: lib/utils/formatUtils.ts
export function formatTemperature(temp: number | null | undefined): string {
  if (temp === null || temp === undefined) return '--';
  return `${temp}°C`;
}
```

### Example 2: Repository with Firebase Types
```typescript
// types/firebase/maintenance.ts (Phase 37 - already exists)
export interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt: string | null;
  needsCleaning: boolean;
  lastUpdatedAt: string | null;
  lastNotificationLevel: number;
}

// lib/repositories/MaintenanceRepository.ts
import { BaseRepository } from './base/BaseRepository';
import type { MaintenanceData } from '@/types/firebase';

const DEFAULT_TARGET_HOURS = 50;

export class MaintenanceRepository extends BaseRepository<MaintenanceData> {
  constructor() {
    super('maintenance');
  }

  async getData(): Promise<MaintenanceData> {
    const data = await this.get();

    if (data) {
      return data;
    }

    const defaultData: MaintenanceData = {
      currentHours: 0,
      targetHours: DEFAULT_TARGET_HOURS,
      lastCleanedAt: null,
      needsCleaning: false,
      lastUpdatedAt: null,
      lastNotificationLevel: 0,
    };

    await this.set('', defaultData);
    return defaultData;
  }

  async canIgnite(): Promise<boolean> {
    const data = await this.getData();
    return !data.needsCleaning;
  }
}
```

### Example 3: External API with Type Guard
```typescript
// types/api/thermorossi.ts
export interface ThermorossiStatusResponse {
  status: string;
  power: number;
  fanLevel: number;
  temperature: number;
}

export function isThermorossiStatus(data: unknown): data is ThermorossiStatusResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    typeof (data as any).status === 'string' &&
    'power' in data &&
    typeof (data as any).power === 'number'
  );
}

// lib/stoveApi.ts
export async function getStatus(): Promise<ThermorossiStatusResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/GetStatus/${API_KEY}`);
  const data: unknown = await response.json();

  if (!isThermorossiStatus(data)) {
    throw new Error('Invalid Thermorossi API response');
  }

  return data;
}
```

### Example 4: Service Class with Type Safety
```typescript
// lib/services/StoveService.ts
import { MaintenanceRepository } from '@/lib/repositories/MaintenanceRepository';
import { StoveStateRepository } from '@/lib/repositories/StoveStateRepository';
import type { StovePowerLevel } from '@/types/firebase';
import type { ApiResponse } from '@/types/api';
import { ApiError } from '@/lib/core';

export class StoveService {
  private maintenanceRepo: MaintenanceRepository;
  private stoveStateRepo: StoveStateRepository;

  constructor() {
    this.maintenanceRepo = new MaintenanceRepository();
    this.stoveStateRepo = new StoveStateRepository();
  }

  async ignite(
    power: StovePowerLevel = 3,
    source: 'manual' | 'scheduler' = 'manual'
  ): Promise<ApiResponse<{ status: string }>> {
    const canIgnite = await this.maintenanceRepo.canIgnite();
    if (!canIgnite) {
      throw ApiError.maintenanceRequired();
    }

    const result = await apiIgnite(power);

    await this.stoveStateRepo.updateState({
      status: 'START',
      statusDescription: 'Avvio in corso',
      powerLevel: power,
      source,
    });

    return result;
  }
}
```

### Example 5: React Hook Migration
```typescript
// app/hooks/useDebounce.ts
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Example 6: Extending Phase 37 Types
```typescript
// types/firebase/stove.ts (Phase 37 - already exists)
export type StoveStatus = 'off' | 'igniting' | 'running' | 'modulating' | 'shutdown' | 'error' | 'standby';
export type StovePowerLevel = 1 | 2 | 3 | 4 | 5;

// types/firebase/stove.ts (extend during Phase 38)
export interface StoveCommandOptions {
  power?: StovePowerLevel;
  source: 'manual' | 'scheduler';
  skipMaintenanceCheck?: boolean;
}

export interface StoveOperationResult {
  success: boolean;
  status: StoveStatus;
  timestamp: string;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual JS imports | TypeScript path aliases (@/lib, @/types) | Phase 37 | Cleaner imports, better refactoring |
| Runtime-only validation | Zod schemas + TypeScript types | Existing + Phase 37 | Compile-time + runtime safety |
| Inline type comments | Dedicated @/types directory | Phase 37 | Centralized, reusable types |
| any for Firebase data | Discriminated unions (StoveStatus, etc.) | Phase 37 | Type-safe Firebase reads/writes |
| Ad-hoc error handling | ApiError class + error codes | Existing pattern | Consistent error responses |

**Deprecated/outdated:**
- JSDoc @param annotations: Phase 38 replaces with TypeScript signatures
- Separate .d.ts files: Not needed with direct .ts conversion
- PropTypes: React+TypeScript uses interface props (handled in Phase 39+)

---

## Open Questions

Things that couldn't be fully resolved:

1. **Test file migration scope**
   - What we know: lib/ has ~10 test files; Phase 42 handles app/components/__tests__/
   - What's unclear: Should lib/__tests__/ be migrated in Phase 38 or deferred to Phase 42?
   - Recommendation: Migrate test files in lib/hooks/__tests__/ during Phase 38 (only 1 file: useOnlineStatus.test.js). Defer lib/services/__tests__/ and others to Phase 42 for consistency.

2. **Strict mode progression**
   - What we know: Current tsconfig has `strict: false`
   - What's unclear: When to enable stricter settings (noImplicitAny, strictNullChecks)?
   - Recommendation: Keep `strict: false` through Phase 38-41. Phase 43 (Verification) assesses whether to enable stricter settings based on migration quality.

3. **Generic vs. specific repository base class**
   - What we know: BaseRepository could be generic `BaseRepository<T>`
   - What's unclear: Does generic T add value if most methods return unknown Firebase data?
   - Recommendation: Make BaseRepository generic but default to `<T = unknown>`. Specific repositories like `MaintenanceRepository extends BaseRepository<MaintenanceData>` get type safety, but generic base allows flexibility.

4. **Firebase Admin SDK type completeness**
   - What we know: Firebase Admin SDK types exist but may not cover custom adminDb helpers
   - What's unclear: Do our adminDbGet/Set/Update wrappers need custom typing?
   - Recommendation: Type wrappers as generic functions: `adminDbGet<T>(path: string): Promise<T | null>`. Consumers provide type: `adminDbGet<MaintenanceData>('/maintenance')`.

---

## Sources

### Primary (HIGH confidence)
- [TypeScript Official Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html) - Official migration patterns
- Phase 37 Research & Plans (.planning/phases/37-typescript-foundation/) - Established project patterns
- Current codebase (lib/, app/hooks/, types/) - Actual structure and patterns
- tsconfig.json - Existing TypeScript configuration

### Secondary (MEDIUM confidence)
- [TypeScript Best Practices for Large-Scale Web Applications in 2026](https://johal.in/typescript-best-practices-for-large-scale-web-applications-in-2026/) - Modern patterns
- [How To Incrementally Adopt TypeScript In A Large Codebase](https://medium.com/async/how-to-incrementally-adopt-typescript-in-a-large-codebase-71d90564add5) - Incremental migration strategy
- [Stripe: Migrating millions of lines of code to TypeScript](https://stripe.com/blog/migrating-to-typescript) - Large-scale migration lessons
- [TypeScript React Hooks Typing Patterns](https://stevekinney.com/courses/react-typescript/typescript-react-hooks) - Hook typing patterns
- [React TypeScript Hook Guide](https://devtrium.com/posts/react-typescript-how-to-type-hooks) - Comprehensive hook typing

### Tertiary (LOW confidence - verified against codebase)
- [TypeScript any vs unknown Deep Dive](https://tomdohnal.com/posts/typescript-any-vs-unknown-a-deep-dive) - Type safety patterns
- [TypeScript Migration: JavaScript to TypeScript 101](https://www.turing.com/kb/migrate-javascript-to-typescript) - General migration guide
- [Firebase TypeScript Cloud Functions](https://firebase.google.com/docs/functions/typescript) - Firebase typing patterns (docs updated 2026-01-22)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phase 37 established all needed infrastructure
- Architecture: HIGH - Bottom-up dependency order verified against actual codebase structure
- External API typing: MEDIUM - Pragmatic approach (unknown + guards) is sound but specifics depend on API complexity
- Hook typing: HIGH - Patterns align with current hook simplicity (most return objects or primitives)
- Pitfalls: HIGH - Based on verified codebase patterns and common migration issues from research

**Research date:** 2026-02-06
**Valid until:** 60 days (stable patterns; TypeScript/Next.js migration approaches evolve slowly)

**Files analyzed:**
- 159 JavaScript files across lib/ and app/hooks/
- Phase 37 type infrastructure (@/types/*)
- Sample files: StoveService.js, BaseRepository.js, MaintenanceRepository.js, useToast.js, cn.js, stoveApi.js
- tsconfig.json (strict: false, allowJs: true)

**Key research insights:**
1. **Bottom-up beats breadth-first**: Dependency-ordered waves (leaf utilities → repositories → services → hooks) minimize type errors
2. **Phase 37 did the hard work**: Existing @/types infrastructure means this phase extends rather than establishes
3. **Pragmatic typing wins**: `unknown` + type guards for external APIs; avoid exhaustive typing of unused fields
4. **Batch by complexity, not count**: 15 utilities ≠ 15 services; weight by coupling and API surface
5. **Tests belong to Phase 42**: Only migrate lib/hooks/__tests__/ if trivial; defer rest for consistency
