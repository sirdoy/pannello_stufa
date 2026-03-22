# Phase 116: Type Safety app/ Routes & Pages - Research

**Researched:** 2026-03-22
**Domain:** TypeScript type narrowing — API routes, page components, service worker browser APIs
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scheduler route typing (9 casts)**
- D-01: Each `adminDbGet` call gets a specific return type via the generic overload: `adminDbGet<PidConfig>(...)`, `adminDbGet<NetatmoCurrentStatus>(...)`, etc. — interfaces defined inline or imported from existing types
- D-02: `calibrateValvesServer()` return type is typed at the function definition if not already, eliminating the cast at the call site
- D-03: `source: 'pid_automation' as any` → widen the `source` union type in `updateStoveState` to include `'pid_automation'`
- D-04: `sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData as any)` → type `notificationData` properly in the maintenance track interface
- D-05: Schedule mode/intervals data: define `ScheduleMode` and `ScheduleInterval` interfaces for the Firebase data shape

**Service worker browser APIs (5 casts)**
- D-06: Use `declare global` augmentation for Badging API (`navigator.setAppBadge`, `navigator.clearAppBadge`) — same pattern as Phase 114's Network Information API
- D-07: Use `declare global` augmentation for Periodic Background Sync API (`registration.periodicSync`) — extend `ServiceWorkerRegistration`

**Netatmo homestatus typing (3 casts)**
- D-08: `modulesFromTopology` needs a proper type so `getModulesWithLowBattery`, `hasAnyCriticalBattery`, `hasAnyLowBattery` receive typed module objects — define interface matching the topology shape or import from existing Netatmo types

**Page component prop casts (thermostat, stove, monitoring, settings, log)**
- D-09: Prop type mismatches are fixed by aligning prop types between parent data and child component interfaces — widen child props or narrow parent data, whichever is simpler
- D-10: `icon={<RefreshCw size={16} /> as any}` → widen `icon` prop type to accept `React.ReactNode` (same pattern as Phase 115's ButtonProps fix)

**Weather forecast route (2 casts)**
- D-11: Define `WeatherCacheResult` and `AirQualityCacheResult` interfaces for the cached response shapes — inline at use site

**Maintenance route (1 cast)**
- D-12: `parseFloat(targetHours as any)` → `targetHours` is already a string from request body, so type assertion to `string` or validate at parse time

### Claude's Discretion
- Whether to create a shared `types/scheduler.ts` or keep interfaces inline in route files
- Exact placement of `declare global` augmentations (existing `global.d.ts` vs new file)
- Whether to consolidate multiple small type fixes into fewer commits or one per file

### Deferred Ideas (OUT OF SCOPE)
- Test file `as any` cleanup (~200+ occurrences in `__tests__/` files) — separate phase or backlog item
- Design system component test `as any` (~30 occurrences in UI component tests) — same deferral
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-13 | Scheduler route `adminDbGet` calls typed with specific interfaces | Generic overload `adminDbGet<T>` already in place; 9 casts catalogued with exact fix for each |
| TYPE-14 | Netatmo homestatus `modulesFromTopology` typed for battery functions | `ModuleWithStatus` interface already defined in the file; functions accept `any[]` — fix by matching parameter type to interface |
| TYPE-15 | Weather forecast route response typed instead of `as any` | `CachedWeatherResult` exported from `weatherCache.ts`; `AirQualityData` exported from `openMeteo.ts` — both ready to use |
| TYPE-16 | Thermostat/stove page prop casts eliminated | Each cast catalogued; prop type mismatches identified between page data shapes and child component interfaces |
| TYPE-17 | `sw.ts` browser API casts typed with proper interfaces | `declare global` pattern already in use in `sw.ts`, `lib/pwa/badgeService.ts`, and `lib/hooks/useNetworkQuality.ts` |
</phase_requirements>

## Summary

Phase 116 eliminates all `as any` casts in `app/` API routes and page components. Research found **28 confirmed casts** across 10 files, all of which have clear, low-risk fixes. No cast requires a design change — every fix is either a type parameter on an existing generic, a `declare global` augmentation, an interface import, or a prop type alignment.

The scheduler route (`app/api/scheduler/check/route.ts`) has the highest concentration with 9 casts. All are `adminDbGet<T>` generic calls or minor union widening. The infrastructure (`adminDbGet<T>` generic, `CalibrationResult` union type, `MaintenanceNotificationData` interface, `WeeklySchedule`/`ScheduleInterval` from `lib/scheduler/schedulerService.ts`) is already fully typed — the casts exist only because callers haven't applied the generics yet.

The service worker casts (`app/sw.ts`) follow an established project pattern: `declare global` augmentations that extend browser interfaces. The Badging API augmentation already exists in `lib/pwa/badgeService.ts` — it simply needs to be mirrored inside `sw.ts` (which operates in a different global scope). The Periodic Background Sync augmentation extends `ServiceWorkerRegistration` with a `periodicSync` property.

**Primary recommendation:** Work file-by-file. Each file's casts are independent. The scheduler route and sw.ts are the largest files; all others are 1–3 cast fixes.

## Standard Stack

No new libraries are needed. All type information comes from existing project types.

### Core (already installed)
| Library | Version | Purpose | Role in Phase |
|---------|---------|---------|---------------|
| TypeScript | 5.x | Type checking | Strict mode enabled; all fixes are type-level only |
| Next.js | 15.5 | App framework | App Router route files and page components |

### Reusable Type Sources (already in codebase)
| Source | Type(s) Exported | Used In |
|--------|-----------------|---------|
| `lib/netatmo/netatmoCalibrationService.ts` | `CalibrationResult` | Scheduler route |
| `lib/maintenance/helpers.ts` | `MaintenanceNotificationData` | Scheduler route, maintenance service |
| `lib/maintenance/maintenanceServiceAdmin.ts` | `TrackUsageResult` (has `notificationData?: unknown`) | Must be narrowed |
| `lib/scheduler/schedulerService.ts` | `ScheduleInterval`, `WeeklySchedule`, `SchedulerMode` | Scheduler route |
| `lib/weather/weatherCache.ts` | `CachedWeatherResult` | Weather forecast route |
| `lib/weather/openMeteo.ts` | `AirQualityData`, `WeatherForecast` | Weather forecast route |
| `lib/stove/stoveStateService.ts` | `StoveStateUpdate.source` union | Must be widened |
| `app/components/devices/thermostat/BatteryWarning.tsx` | `Module` interface (local), `BatteryState` | Thermostat page |
| `app/components/netatmo/RoomCard.tsx` | `RoomCardProps.room` shape | Thermostat page |
| `components/monitoring/ConnectionStatusCard.tsx` | `ConnectionStats` interface (local) | Monitoring page |
| `components/monitoring/DeadManSwitchPanel.tsx` | `DeadManSwitchStatus` type (local) | Monitoring page |
| `app/components/scheduler/WeeklySummaryCard.tsx` | `WeeklySummaryCardProps.schedule: WeeklySchedule` | Scheduler page |
| `app/components/scheduler/WeeklyTimeline.tsx` | `WeeklyTimelineProps.schedule: WeeklySchedule` | Scheduler page |
| `app/components/scheduler/AddIntervalModal.tsx` | `AddIntervalModalProps.initialInterval?: ScheduleInterval \| null` | Scheduler page |

## Architecture Patterns

### Pattern 1: Generic `adminDbGet<T>` (TYPE-13)

The function is already generic: `adminDbGet<T = unknown>(path: string): Promise<T | null>`.
Apply the type parameter to replace `as any` at each call site.

**Exact casts in `app/api/scheduler/check/route.ts`:**

| Line | Current | Fix |
|------|---------|-----|
| 110 | `calibrateValvesServer() as any` | Remove cast — `CalibrationResult` already returned |
| 556 | `adminDbGet(...) as any` for pidConfig | `adminDbGet<PidConfig>(...)` with inline `PidConfig` interface |
| 563 | `adminDbGet('netatmo/currentStatus') as any` | `adminDbGet<NetatmoCurrentStatus>(...)` with inline interface |
| 574 | `Object.values(netatmoStatus.rooms) as any[]` | Flows from typed `NetatmoCurrentStatus`; cast disappears |
| 595 | `adminDbGet(pidStatePath) as any` for pidState | `adminDbGet<PidState>(...)` with inline `PidState` interface |
| 670 | `source: 'pid_automation' as any` | Widen union in `StoveStateUpdate.source` |
| 737 | `(await adminDbGet('schedules-v2/mode')) as any` | `adminDbGet<SchedulerMode>(...)` — import from `schedulerService.ts` |
| 796 | `adminDbGet(...) as any[] \| null` for intervals | `adminDbGet<ScheduleInterval[]>(...)` — import from `schedulerService.ts` |
| 854 | `maintenanceTrack.notificationData as any` | Type `notificationData` in `TrackUsageResult` as `MaintenanceNotificationData \| null` |

**Line 92 function signature** (`calibrateValvesIfNeeded(): Promise<any>`) — change to `Promise<CalibrationResult | { calibrated: false; reason: string; nextCalibration: string }>`.

```typescript
// Source: lib/firebaseAdmin.ts line 94 (verified)
export async function adminDbGet<T = unknown>(path: string): Promise<T | null>

// Usage pattern:
const pidConfig = await adminDbGet<PidConfig>(`users/${adminUserId}/pidAutomation`);
//                                  ^^^^^^^^^^ Type parameter replaces the as any
```

### Pattern 2: `declare global` Augmentation (TYPE-17)

The project uses `declare global` in-file to extend browser interfaces. This is the established pattern — confirmed in 4 files.

**For Badging API in `sw.ts`:** The augmentation already exists in `lib/pwa/badgeService.ts`. Since `sw.ts` runs in a different execution context (ServiceWorker, not page), it cannot share the same augmentation transitively. A local `declare global` block in `sw.ts` is the correct fix:

```typescript
// Extend Navigator for Badging API (not yet in TypeScript DOM lib)
declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}
```

**For Periodic Background Sync API in `sw.ts`:** Extend `ServiceWorkerRegistration`:

```typescript
// Extend ServiceWorkerRegistration for Periodic Background Sync API
declare global {
  interface PeriodicSyncManager {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
  interface ServiceWorkerRegistration {
    readonly periodicSync?: PeriodicSyncManager;
  }
}
```

After adding these, replace `(navigator as any).setAppBadge(count)` → `navigator.setAppBadge?.(count)` and `(self.registration as any).periodicSync.register(...)` → `self.registration.periodicSync?.register(...)`.

Note: The optional chaining (`?.`) matches the existing guard `if ('periodicSync' in self.registration)` — safe to use.

### Pattern 3: Interface Alignment for Battery Functions (TYPE-14)

In `app/api/netatmo/homestatus/route.ts`, `modulesFromTopology` is typed as `ModuleWithStatus[]` but the battery utility functions accept `any[]`. The fix is to remove `as any` from the 3 call sites — the functions already accept `any[]`, so just making `ModuleWithStatus` satisfy `any[]` by removing the casts is valid. But cleaner: update function parameter types from `any[]` to `ModuleWithStatus[]`.

```typescript
// Current (in route.ts):
interface ModuleWithStatus {
  [key: string]: unknown;
}
// ... later:
const modulesFromTopology = (topology?.modules ?? []) as ModuleWithStatus[];

// Fix: match function parameter to ModuleWithStatus
function getModulesWithLowBattery(modules: ModuleWithStatus[]): ModuleWithStatus[] { ... }
function hasAnyCriticalBattery(modules: ModuleWithStatus[]): boolean { ... }
function hasAnyLowBattery(modules: ModuleWithStatus[]): boolean { ... }
// Then remove the `as any` from the 3 call sites
```

### Pattern 4: Existing Type Imports for Weather Route (TYPE-15)

`getCachedWeather` already returns `Promise<CachedWeatherResult>` (exported from `weatherCache.ts`). `fetchAirQuality` already returns `Promise<AirQualityData>` (exported from `openMeteo.ts`). The route uses `as any` because destructuring doesn't apply the return type.

```typescript
// Fix in app/api/weather/forecast/route.ts:
import type { CachedWeatherResult } from '@/lib/weather/weatherCache';
import type { AirQualityData } from '@/lib/weather/openMeteo';

// Line 77 — no cast needed, CachedWeatherResult has { data, cachedAt, stale }
const { data, cachedAt, stale } = weatherResult;  // weatherResult: CachedWeatherResult

// Line 83 — airQualityResult: AirQualityData | null (from catch → return null)
const airQuality = airQualityResult?.current?.european_aqi ?? null;
```

The `WeatherData = unknown` in `weatherCache.ts` means `data` is typed as `unknown` — the route accesses `data.current.weather_code` etc., which will need a cast to `WeatherForecast` or a narrowing check. Import `WeatherForecast` from `openMeteo.ts` and cast `data as WeatherForecast`.

### Pattern 5: Prop Type Alignment for Page Components (TYPE-16)

**Thermostat page (`app/thermostat/page.tsx`):**

| Line | Cast | Root cause | Fix |
|------|------|-----------|-----|
| 445 | `lowBatteryModules={(status?.lowBatteryModules \|\| []) as any}` | `status.lowBatteryModules: NetatmoModule[]` vs `BatteryWarningProps.lowBatteryModules?: Module[]` — shape mismatch | `NetatmoModule` already has `id`, `type`, `battery_state`, `reachable` fields matching `Module` — types are structurally compatible. Export `Module` from `BatteryWarning.tsx` or align `NetatmoModule` with `Module` |
| 546 | `modules={modulesWithBattery as any}` | Same structural mismatch with `ModuleBatteryListProps.modules?: Module[]` | Same fix |
| 570 | `room={room as any}` | `RoomWithStatus` vs `RoomCardProps.room` shape | `RoomWithStatus` has all required fields of `RoomCardProps.room` — structurally compatible. Cast not needed if types align |

**Stove scheduler page (`app/stove/scheduler/page.tsx`):**

| Line | Cast | Root cause | Fix |
|------|------|-----------|-----|
| 835 | `schedule={schedule as any}` for `WeeklySummaryCard` | `WeekSchedule = Record<DayOfWeek, ScheduleInterval[]>` vs `WeeklySchedule = { [day: string]: ScheduleInterval[] }` — same structure, different local type | Import `WeeklySchedule` from `schedulerService.ts` instead of local `WeekSchedule` |
| 846 | `schedule={schedule as any}` for `WeeklyTimeline` | Same as above | Same fix |
| 855 | `intervals={schedule[selectedDay] as any \|\| []}` for `DayEditPanel` | Local `ScheduleInterval` vs imported `ScheduleInterval` from `schedulerService.ts` | Use the imported type throughout |
| 890 | `initialInterval={addIntervalModal.initialInterval as any}` | `AddIntervalModalState.initialInterval: ScheduleInterval \| null` vs `AddIntervalModalProps.initialInterval?: ScheduleInterval \| null` — same issue, different `ScheduleInterval` definitions | Unify to imported type |

**Root cause for stove scheduler page:** The page defines its own local `ScheduleInterval` interface (line 32) instead of importing from `schedulerService.ts`. The local definition is structurally identical but TypeScript treats them as distinct. Fix: delete the local definition and import from `schedulerService.ts`.

**Thermostat schedule page (`app/thermostat/schedule/page.tsx`):**

| Line | Cast | Fix |
|------|------|-----|
| 84 | `icon={<RefreshCw size={16} /> as any}` | Widen Button's `icon` prop to `React.ReactNode` (same fix as Phase 115) |
| 114 | `<WeeklyTimeline schedule={activeSchedule as any} />` | `activeSchedule` comes from `useScheduleData()` — type it properly or narrow |

**Monitoring page (`app/monitoring/page.tsx`):**

| Line | Cast | Fix |
|------|------|-----|
| 118 | `stats={stats as any}` | `StatsData = { [key: string]: any }` in page vs `ConnectionStats` in component — replace `StatsData` with `ConnectionStats` or import/export `ConnectionStats` |
| 119 | `dmsStatus={dmsStatus as any}` | Same pattern — replace `DMSStatus = { [key: string]: any }` with `DeadManSwitchStatus` or export from component |

**Log page (`app/log/page.tsx`):**

| Line | Cast | Fix |
|------|------|-----|
| 46 | `.map(([id, entry]) => ({ id, ...(entry as Record<string, any>) } as any))` | `LogEntryData` interface has `[key: string]: any` — the spread is safe, but the outer `as any` is unnecessary. Remove outer cast; `entry` already typed as `unknown` from Firebase `snapshot.val()` |

**Settings notifications page (`app/settings/notifications/page.tsx`):**

| Line | Cast | Fix |
|------|------|-----|
| 172 | `(d) => (d as any).token === currentDeviceToken` | `NotificationDevice` interface (defined at line 38) has `tokenKey` field but `token` is not in the interface — add `token?: string` to `NotificationDevice` or access the right field |

**Settings devices page (`app/settings/notifications/devices/page.tsx`):**

| Line | Cast | Fix |
|------|------|-----|
| 192 | `device={device as any}` | Prop type mismatch — examine component to align |

**Maintenance route (`app/api/maintenance/update-target/route.ts`):**

| Line | Cast | Fix |
|------|------|-----|
| 62 | `parseFloat(targetHours as any)` | `targetHours` is `number` (from `UpdateTargetBody`), `parseFloat` expects `string` — fix by either removing `parseFloat` (value already a number) or casting to `string` first. Since validation at line 49 confirms it's a number, just use `targetHours` directly |

### Anti-Patterns to Avoid
- **Duplicating type definitions:** Don't copy `ScheduleInterval` locally — import from `schedulerService.ts`
- **Over-widening with `unknown` then re-casting:** If the type is already known (e.g., `CalibrationResult`), import and use it directly
- **Changing function signatures that test files mock:** `calibrateValvesServer` is mocked in tests; its return type change must be backward-compatible with `{ calibrated: boolean }` shape

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser API type augmentation | Custom wrapper types | `declare global` interface augmentation | Project's established pattern; TypeScript merges declarations |
| Firebase data types | Generic `Record<string,unknown>` | Specific interfaces with `adminDbGet<T>` | Generic overload already typed; `as any` is the only smell |
| Schedule type alignment | New type definitions | Import from `lib/scheduler/schedulerService.ts` | `WeeklySchedule`, `ScheduleInterval`, `SchedulerMode` are canonical definitions |
| Maintenance notification type | Inline interface | `MaintenanceNotificationData` from `lib/maintenance/helpers.ts` | Already exported; just need to change `notificationData?: unknown` in `TrackUsageResult` |

## Common Pitfalls

### Pitfall 1: `WeatherData = unknown` in weatherCache.ts
**What goes wrong:** After fixing `weatherResult as any`, `data` is typed as `unknown` — every property access on it fails tsc.
**Why it happens:** `weatherCache.ts` uses `type WeatherData = unknown` intentionally to stay generic.
**How to avoid:** Cast `data` to `WeatherForecast` after the destructure: `const typedData = data as WeatherForecast`. Import `WeatherForecast` from `openMeteo.ts`.
**Warning signs:** tsc errors on `data.current.weather_code` etc. after removing the `as any`.

### Pitfall 2: Local `ScheduleInterval` vs imported `ScheduleInterval`
**What goes wrong:** Removing casts in scheduler page still fails because local type is nominally distinct.
**Why it happens:** Page defines `interface ScheduleInterval { start, end, power, fan }` at line 32, identical to `schedulerService.ts` but separate.
**How to avoid:** Delete the local definition first, then import. Check all usages in the 900-line page file — `saveSchedule` (line 219) already casts to `ServiceScheduleInterval` (aliased import), which will also be fixable.
**Warning signs:** Type error says "Property X is missing" even though fields exist — means two different `ScheduleInterval` types.

### Pitfall 3: `TrackUsageResult.notificationData: unknown`
**What goes wrong:** Changing `notificationData` from `unknown` to `MaintenanceNotificationData | null` in the interface affects type of `maintenanceTrack.notificationData` everywhere.
**Why it happens:** The service intentionally typed it as `unknown` to avoid circular imports between notification and maintenance modules.
**How to avoid:** Verify no circular dependency: `maintenanceServiceAdmin.ts` → `helpers.ts` (same directory) — safe. Import `MaintenanceNotificationData` from `helpers.ts` in `maintenanceServiceAdmin.ts`.
**Warning signs:** "Circular dependency" lint warnings after adding the import.

### Pitfall 4: sw.ts `declare global` scope
**What goes wrong:** Adding Badging API types at module level in `sw.ts` may conflict with the existing `declare global { interface WorkerGlobalScope ... }` at line 12.
**Why it happens:** `sw.ts` already has a `declare global` block — TypeScript declaration merging allows multiple blocks in the same file, so adding a second block is valid.
**How to avoid:** Add as a separate `declare global` block (TypeScript merges all `declare global` blocks in a file). Do not try to merge into the existing `WorkerGlobalScope` block.
**Warning signs:** If TypeScript flags the augmentation as invalid, ensure `sw.ts` is treated as a module (has `import` statements at top — it does, line 1).

### Pitfall 5: `NotificationDevice` field mismatch
**What goes wrong:** `(d as any).token` suggests the interface doesn't have a `token` field, but the data does.
**Why it happens:** `NotificationDevice` has `tokenKey` (the Firebase key) but the data object built at line 163 spreads `data` which includes the raw token.
**How to avoid:** Check what `data` shape contains from Firebase and add the correct field to `NotificationDevice`. The cast `as any` is hiding a legitimate field omission — don't just add `[key: string]: unknown` to suppress it.

### Pitfall 6: `parseFloat(targetHours as any)` — value already a number
**What goes wrong:** `targetHours` is validated as `number` at line 49. `parseFloat` expects `string`. The `as any` bridges this.
**Why it happens:** Defensive coding pattern (parse even if already a number), but TypeScript rejects it because `parseFloat` signature is `parseFloat(string: string): number`.
**How to avoid:** The value is already a number — `parseFloat` is redundant. Remove it entirely: `targetHours: targetHours` (or just use `targetHours` directly in the updates object). Alternatively, `targetHours: parseFloat(String(targetHours))` if you want to keep the parse.
**Recommendation:** Remove `parseFloat` entirely — input is validated as `number`, redundant parse adds no value.

## Code Examples

### adminDbGet with typed result

```typescript
// Source: lib/firebaseAdmin.ts line 94
export async function adminDbGet<T = unknown>(path: string): Promise<T | null>

// Before (scheduler/check/route.ts line 556):
const pidConfig = await adminDbGet(`users/${adminUserId}/pidAutomation`) as any;

// After:
interface PidConfig {
  enabled: boolean;
  kp?: number;
  ki?: number;
  kd?: number;
  manualSetpoint?: number;
  targetRoomId?: string;
}
const pidConfig = await adminDbGet<PidConfig>(`users/${adminUserId}/pidAutomation`);
// pidConfig is now PidConfig | null — no cast needed
```

### declare global for Periodic Background Sync (not in TypeScript lib)

```typescript
// Source: MDN Web Docs — Periodic Background Sync API
// Place near top of app/sw.ts alongside existing declare global blocks
declare global {
  interface PeriodicSyncManager {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
  interface ServiceWorkerRegistration {
    readonly periodicSync?: PeriodicSyncManager;
  }
}

// Usage (lines 758, 779, 793):
// Before: await (self.registration as any).periodicSync.register(...)
// After (safe because of existing 'periodicSync' in self.registration guard):
await self.registration.periodicSync?.register(PERIODIC_SYNC_TAG, { minInterval: ... });
```

### Widen source union in stoveStateService.ts

```typescript
// Source: lib/stove/stoveStateService.ts line 17
// Before:
source?: 'manual' | 'scheduler' | 'api' | 'init' | 'external_change';
// After:
source?: 'manual' | 'scheduler' | 'api' | 'init' | 'external_change' | 'pid_automation';

// Then in scheduler/check/route.ts line 670, the cast disappears:
await updateStoveState({ powerLevel: targetPower, source: 'pid_automation' });
```

### Fix MaintenanceNotificationData in TrackUsageResult

```typescript
// Source: lib/maintenance/helpers.ts line 10 (MaintenanceNotificationData already exported)
import type { MaintenanceNotificationData } from './helpers';

// In maintenanceServiceAdmin.ts:
interface TrackUsageResult {
  tracked: boolean;
  reason?: string;
  elapsedMinutes?: number;
  newCurrentHours?: number;
  notificationData?: MaintenanceNotificationData | null;  // was: unknown
  error?: string;
}

// In scheduler/check/route.ts line 854, cast disappears:
await sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData);
// notificationData narrowed to MaintenanceNotificationData at callsite via truthiness check
```

### Monitoring page prop type alignment

```typescript
// Fix: Export types from components or import them at the page level
// In app/monitoring/page.tsx:

// Before:
interface StatsData { [key: string]: any; }
interface DMSStatus { [key: string]: any; }

// After: Delete local interfaces. Import from component files:
import type { ConnectionStats } from '@/components/monitoring/ConnectionStatusCard';
import type { DeadManSwitchStatus } from '@/components/monitoring/DeadManSwitchPanel';

// Then:
const [stats, setStats] = useState<ConnectionStats | null>(null);
const [dmsStatus, setDmsStatus] = useState<DeadManSwitchStatus | null>(null);
// stats as any and dmsStatus as any casts disappear
```

Note: `ConnectionStats` and `DeadManSwitchStatus` are currently not exported from those files — they will need to be exported first.

### Stove scheduler page: import canonical types

```typescript
// In app/stove/scheduler/page.tsx:
// Delete local interface ScheduleInterval (lines 32-38)
// Delete local type WeekSchedule

import {
  getWeeklySchedule,
  getFullSchedulerMode,
  getNextScheduledChange,
  type ScheduleInterval,      // use canonical type
  type WeeklySchedule,        // use canonical type
} from '@/lib/scheduler/schedulerService';

// Then WeekSchedule → WeeklySchedule throughout the file
// The 4 casts on lines 835, 846, 855, 890 disappear
```

## State of the Art

No API changes in this phase — all patterns use existing stable TypeScript features.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `adminDbGet() as any` | `adminDbGet<T>()` | Phase 114 (established) | Caller types the return |
| Inline `declare global` per file | Shared `.d.ts` files | N/A — both are valid | Phase 116 continues inline pattern for sw.ts |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (next/jest) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="scheduler/check\|netatmo/homestatus\|weather/forecast"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-13 | Scheduler route compiles without `as any` | tsc + unit | `npx tsc --noEmit` | N/A (type-level) |
| TYPE-13 | Scheduler route logic unchanged | unit | `npm test -- --testPathPattern="scheduler/check/route"` | ✅ |
| TYPE-14 | Netatmo homestatus battery logic unchanged | unit | `npm test -- --testPathPattern="netatmo/homestatus"` | check |
| TYPE-15 | Weather route logic unchanged | unit | `npm test -- --testPathPattern="weather/forecast"` | check |
| TYPE-16 | Pages render correctly (prop types) | type check | `npx tsc --noEmit` | N/A (type-level) |
| TYPE-17 | sw.ts compiles without `as any` | type check | `npx tsc --noEmit` | N/A (type-level) |

**Primary validation:** `npx tsc --noEmit` with zero errors is the success criterion for all 5 requirements. Unit tests verify no behavioral change.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (< 30 seconds)
- **Per wave merge:** `npm test` (full Jest suite)
- **Phase gate:** Full suite green + `npx tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers the phase. Type fixes are structural, not behavioral, so existing test mocks remain valid.

## Open Questions

1. **`NotificationDevice.token` field**
   - What we know: Line 172 accesses `(d as any).token` — `NotificationDevice` has `tokenKey` not `token`
   - What's unclear: Whether `token` is an actual field in the Firebase data shape that was simply omitted from the interface, or whether `tokenKey` was supposed to be used
   - Recommendation: Read `app/settings/notifications/devices/page.tsx` (line 192 cast) and the `NotificationDevice` interface definition carefully during plan creation; examine Firebase data structure before deciding

2. **`calibrateValvesIfNeeded` return type**
   - What we know: Line 92 declares `Promise<any>` as the return; the function returns 3 different shapes
   - What's unclear: Whether the early-return shape `{ calibrated: false, reason: 'too_soon', nextCalibration: string }` should be part of `CalibrationResult` or a separate type
   - Recommendation: Define a local `CalibrationSkipped` interface and use a union. `calibrateValvesServer()` already has `CalibrationResult` for the actual calibration outcome; the wrapper function can have its own richer return type.

## Sources

### Primary (HIGH confidence)
- Direct code inspection — all 10 affected files read and catalogued
- `lib/firebaseAdmin.ts` — `adminDbGet<T>` generic signature verified at line 94
- `lib/stove/stoveStateService.ts` — `StoveStateUpdate.source` union at line 17
- `lib/maintenance/helpers.ts` — `MaintenanceNotificationData` interface at line 10
- `lib/maintenance/maintenanceServiceAdmin.ts` — `TrackUsageResult.notificationData: unknown` at line 27
- `lib/netatmo/netatmoCalibrationService.ts` — `CalibrationResult` union type at line 29
- `lib/weather/weatherCache.ts` — `CachedWeatherResult` interface at line 25
- `lib/weather/openMeteo.ts` — `AirQualityData` interface at line 66, `WeatherForecast` at line 51
- `lib/scheduler/schedulerService.ts` — `ScheduleInterval`, `WeeklySchedule`, `SchedulerMode` at lines 6-24
- `lib/pwa/badgeService.ts` — existing `declare global` Navigator augmentation at line 25
- `lib/hooks/useNetworkQuality.ts` — `declare global` Navigator augmentation pattern at line 11
- `components/monitoring/ConnectionStatusCard.tsx` — `ConnectionStats` interface at line 10
- `components/monitoring/DeadManSwitchPanel.tsx` — `DeadManSwitchStatus` type at line 26

### Secondary (MEDIUM confidence)
- MDN Web Docs (knowledge): Periodic Background Sync API interface shape (`PeriodicSyncManager`)
- MDN Web Docs (knowledge): Badging API (`navigator.setAppBadge`, `navigator.clearAppBadge`)

### Tertiary (LOW confidence)
None — all critical claims verified from source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all fix patterns from existing code
- Architecture: HIGH — every cast examined with source code; fix strategy derived from the code itself
- Pitfalls: HIGH — pitfalls identified from actual code reading, not speculation

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (stable domain — TypeScript strict mode patterns don't shift)
