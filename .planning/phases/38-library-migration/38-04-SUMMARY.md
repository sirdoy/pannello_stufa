---
phase: 38
plan: 04
subsystem: data-layer
tags: [typescript, repositories, schemas, validators, devices, generics]
requires: [38-01, 38-02, 37-03]
provides: [typed-repositories, typed-schemas, typed-validators, typed-devices]
affects: [38-05, 38-06, 38-07]
tech-stack:
  added: []
  patterns: [generic-repository, zod-infer-types, union-types]
key-files:
  created: []
  modified:
    - lib/repositories/base/BaseRepository.ts
    - lib/repositories/MaintenanceRepository.ts
    - lib/repositories/ScheduleRepository.ts
    - lib/repositories/SchedulerModeRepository.ts
    - lib/repositories/StoveStateRepository.ts
    - lib/repositories/index.ts
    - lib/schemas/coordinationPreferences.ts
    - lib/schemas/notificationPreferences.ts
    - lib/validators/index.ts
    - lib/validators/stove.validators.ts
    - lib/devices/deviceRegistry.ts
    - lib/devices/deviceTypes.ts
    - lib/devices/index.ts
decisions:
  - decision: BaseRepository as abstract generic class
    rationale: Enable type-safe CRUD operations for all repository subclasses
    date: 2026-02-06
  - decision: Export inferred types from Zod schemas
    rationale: Provide TypeScript types alongside runtime validation
    date: 2026-02-06
  - decision: Local interfaces in MaintenanceRepository
    rationale: MaintenanceData differs from types/firebase MaintenanceRecord structure
    date: 2026-02-06
metrics:
  duration: 7.2
  completed: 2026-02-06
---

# Phase 38 Plan 04: Repositories, Schemas, Validators Summary

**One-liner:** Migrated data access layer with generic BaseRepository, Zod schema type inference, and typed device registry

## Objectives Achieved

**Primary Goal:** Migrate repositories, schemas, validators, and device registry from JavaScript to TypeScript

**Result:** 13 files converted with full type safety

1. BaseRepository now uses generics `BaseRepository<T>` for type-safe CRUD operations
2. All repository subclasses properly typed with their data structures
3. Zod schemas export inferred TypeScript types via `z.infer<typeof schema>`
4. Validators use StovePowerLevel from @/types/firebase
5. Device registry fully typed with union types and interfaces

## What Was Built

### Task 1: Repositories with Generic Base Class (6 files)

**Files migrated:**
- `lib/repositories/base/BaseRepository.ts` - Abstract generic class `BaseRepository<T = unknown>`
- `lib/repositories/MaintenanceRepository.ts` - Extends `BaseRepository<MaintenanceData>`
- `lib/repositories/ScheduleRepository.ts` - Extends `BaseRepository<ScheduleData>`
- `lib/repositories/SchedulerModeRepository.ts` - Extends `BaseRepository<SchedulerMode>`
- `lib/repositories/StoveStateRepository.ts` - Extends `BaseRepository<StoveState>`
- `lib/repositories/index.ts` - Barrel export

**Key changes:**
- BaseRepository abstract class with generic type parameter `<T = unknown>`
- All CRUD methods type-safe: `get(): Promise<T | null>`, `set(subPath: string, data: Partial<T>)`
- Protected helper methods: `resolvePath()`, `filterUndefined()`, `withTimestamp()`
- MaintenanceRepository uses local `MaintenanceData` interface (differs from types/firebase)
- ScheduleRepository uses local `ScheduleData`, `ScheduleInterval`, `ScheduleMetadata` interfaces
- SchedulerModeRepository uses local `SchedulerMode` interface
- StoveStateRepository imports `StoveState` from @/types/firebase

**Commit:** 52e006d

### Task 2: Schemas, Validators, Device Modules (7 files)

**Files migrated:**
- `lib/schemas/coordinationPreferences.ts` - Export `ZoneConfig`, `CoordinationPreferences` types
- `lib/schemas/notificationPreferences.ts` - Export `DNDWindow`, `RateLimit`, `NotificationPreferences` types
- `lib/validators/index.ts` - Barrel export
- `lib/validators/stove.validators.ts` - Typed with `StovePowerLevel`, input/output interfaces
- `lib/devices/deviceRegistry.ts` - Fully typed helper functions
- `lib/devices/deviceTypes.ts` - Added `DeviceTypeId`, `DeviceColor` unions, `DeviceConfig` interface
- `lib/devices/index.ts` - Barrel export

**Key changes:**

**Schemas:**
- Added `export type ZoneConfig = z.infer<typeof zoneConfigSchema>`
- Added `export type CoordinationPreferences = z.infer<typeof coordinationPreferencesSchema>`
- Added `export type DNDWindow = z.infer<typeof dndWindowSchema>`
- Added `export type RateLimit = z.infer<typeof rateLimitSchema>`
- Added `export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>`
- Updated function signatures with return types

**Validators:**
- Created interfaces: `IgniteInput`, `ShutdownInput`, `FanInput`, `PowerInput`
- Added `CommandSource` type: `'manual' | 'scheduler'`
- Imported `StovePowerLevel` from @/types/firebase
- All validation functions now have typed parameters and return types

**Devices:**
- Added union types: `DeviceTypeId`, `DeviceColor`
- Created interfaces: `DisplayItem`, `DeviceFeatures`, `DeviceConfig`, `ColorClasses`, `GlobalSection`, `SettingsMenuItem`
- Added types to all registry constants with `as const` for literal inference
- All helper functions fully typed with return types and parameters
- Internal interfaces: `NavItem`, `DeviceNav`, `SettingsMenuItemOutput`, `NavigationStructure`, `DeviceBadge`

**Commit:** caba8b5

## Technical Details

**Generic Repository Pattern:**
```typescript
export abstract class BaseRepository<T = unknown> {
  protected basePath: string;

  async get(subPath: string = ''): Promise<T | null> { ... }
  async set(subPath: string, data: Partial<T>): Promise<void> { ... }
  async update(subPath: string, updates: Partial<T>): Promise<void> { ... }
}

export class StoveStateRepository extends BaseRepository<StoveState> {
  constructor() {
    super(getEnvironmentPath('stove/state'));
  }

  async getState(): Promise<StoveState | null> {
    return this.get();
  }
}
```

**Zod Schema Type Inference:**
```typescript
export const coordinationPreferencesSchema = z.object({
  enabled: z.boolean().default(true),
  defaultBoost: z.number().min(0.5).max(5).default(2),
  zones: z.array(zoneConfigSchema).default([]),
  // ...
});

// Export inferred type
export type CoordinationPreferences = z.infer<typeof coordinationPreferencesSchema>;
```

**Device Registry Union Types:**
```typescript
export type DeviceTypeId = 'stove' | 'thermostat' | 'camera' | 'lights' | 'sonos';
export type DeviceColor = 'primary' | 'info' | 'ocean' | 'warning' | 'success';

export interface DeviceConfig {
  id: DeviceTypeId;
  name: string;
  icon: string;
  color: DeviceColor;
  enabled: boolean;
  routes: Record<string, string>;
  features: DeviceFeatures;
}

export const DEVICE_CONFIG: Record<DeviceTypeId, DeviceConfig> = { ... };
```

## Testing & Verification

**TypeScript Compilation:**
```bash
npx tsc --noEmit
# No errors in lib/repositories, lib/schemas, lib/validators, lib/devices
```

**JS File Check:**
```bash
find lib/repositories lib/schemas lib/validators lib/devices -name "*.js" -not -path "*__tests__*"
# Empty result - all files converted
```

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### 1. BaseRepository as Abstract Generic Class

**Context:** Repository pattern needed type safety for CRUD operations

**Decision:** Made BaseRepository abstract with generic type parameter `<T = unknown>`

**Rationale:**
- Enables type-safe CRUD methods for all subclasses
- Prevents direct instantiation (must extend)
- Default `unknown` allows flexible typing

**Impact:** All repositories benefit from compile-time type checking

### 2. Export Inferred Types from Zod Schemas

**Context:** Zod schemas validate runtime data but need TypeScript types

**Decision:** Export types via `export type X = z.infer<typeof xSchema>`

**Rationale:**
- Provides both runtime validation and compile-time types
- Follows Zod best practices
- Enables usage: `import type { CoordinationPreferences } from '@/lib/schemas/...'`

**Impact:** Schemas now serve dual purpose (validation + types)

### 3. Local Interfaces in Repositories

**Context:** MaintenanceData structure differs from types/firebase MaintenanceRecord

**Decision:** Define local interfaces within repository files

**Rationale:**
- Firebase structure may differ from repository data model
- Keeps repository independent of global types
- Allows evolution without breaking changes

**Impact:** Repositories have self-contained type definitions

### 4. Union Types for Device System

**Context:** Device registry uses string constants that could be any string

**Decision:** Define union types: `DeviceTypeId`, `DeviceColor`

**Rationale:**
- Prevents invalid device IDs at compile time
- Enables IDE autocomplete
- Works with `as const` for literal inference

**Impact:** Device registry fully type-safe, no string typos possible

## Integration Points

**Used by:**
- API routes import repositories for data access
- React forms import schemas for validation
- API routes import validators for input validation
- UI components import device registry for navigation

**Dependencies:**
- @/lib/firebaseAdmin for database operations
- @/lib/core for validation helpers
- @/types/firebase for StoveState, StovePowerLevel
- zod for schema validation

## Next Phase Readiness

**Blocks:** None

**Provides:**
- Generic repository pattern for other entities
- Zod schema pattern for other forms
- Device registry pattern for other registries

**Concerns:** None - all 13 files converted successfully

## Performance Impact

**Build time:** No change (TypeScript compilation)
**Runtime:** No change (same JavaScript output)
**Developer experience:** Significant improvement (type safety, autocomplete)

## Documentation Updates Required

None - existing JSDoc comments converted to TSDoc

## Self-Check: PASSED

**Files created:** All exist
- lib/repositories/base/BaseRepository.ts ✓
- lib/repositories/MaintenanceRepository.ts ✓
- lib/repositories/ScheduleRepository.ts ✓
- lib/repositories/SchedulerModeRepository.ts ✓
- lib/repositories/StoveStateRepository.ts ✓
- lib/repositories/index.ts ✓
- lib/schemas/coordinationPreferences.ts ✓
- lib/schemas/notificationPreferences.ts ✓
- lib/validators/index.ts ✓
- lib/validators/stove.validators.ts ✓
- lib/devices/deviceRegistry.ts ✓
- lib/devices/deviceTypes.ts ✓
- lib/devices/index.ts ✓

**Commits:** All exist
- 52e006d ✓
- caba8b5 ✓

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Migrate repositories with generic base class | 52e006d | BaseRepository.ts, MaintenanceRepository.ts, ScheduleRepository.ts, SchedulerModeRepository.ts, StoveStateRepository.ts, index.ts |
| 2 | Migrate schemas, validators, devices | caba8b5 | coordinationPreferences.ts, notificationPreferences.ts, validators/index.ts, stove.validators.ts, deviceRegistry.ts, deviceTypes.ts, devices/index.ts |

## Lessons Learned

**What went well:**
- Generic repository pattern provides excellent type safety
- Zod type inference works seamlessly with existing schemas
- Union types prevent invalid device IDs at compile time
- git mv preserved history perfectly

**What could improve:**
- Could define repository interfaces in types/firebase for consistency
- Could extract CommandSource type to types/api

**For next plans:**
- Continue generic patterns for other entities
- Maintain Zod schema + inferred type pattern
- Use union types for all constrained string values
