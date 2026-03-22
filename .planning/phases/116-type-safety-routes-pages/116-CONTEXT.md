# Phase 116: Type Safety app/ Routes & Pages - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all `as any` casts in API route files and page components in the `app/` directory. Covers scheduler, Netatmo, weather, thermostat/stove, monitoring, settings, log, maintenance routes and pages. Service worker browser API casts included. Test files are explicitly out of scope.

</domain>

<decisions>
## Implementation Decisions

### Scheduler route typing (9 casts — highest concentration)
- **D-01:** Each `adminDbGet` call gets a specific return type via the generic overload: `adminDbGet<PidConfig>(...)`, `adminDbGet<NetatmoCurrentStatus>(...)`, etc. — interfaces defined inline or imported from existing types
- **D-02:** `calibrateValvesServer()` return type is typed at the function definition if not already, eliminating the cast at the call site
- **D-03:** `source: 'pid_automation' as any` → widen the `source` union type in `updateStoveState` to include `'pid_automation'`
- **D-04:** `sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData as any)` → type `notificationData` properly in the maintenance track interface
- **D-05:** Schedule mode/intervals data: define `ScheduleMode` and `ScheduleInterval` interfaces for the Firebase data shape

### Service worker browser APIs (5 casts)
- **D-06:** Use `declare global` augmentation for Badging API (`navigator.setAppBadge`, `navigator.clearAppBadge`) — same pattern as Phase 114's Network Information API
- **D-07:** Use `declare global` augmentation for Periodic Background Sync API (`registration.periodicSync`) — extend `ServiceWorkerRegistration`

### Netatmo homestatus typing (3 casts)
- **D-08:** `modulesFromTopology` needs a proper type so `getModulesWithLowBattery`, `hasAnyCriticalBattery`, `hasAnyLowBattery` receive typed module objects — define interface matching the topology shape or import from existing Netatmo types

### Page component prop casts (thermostat, stove, monitoring, settings, log)
- **D-09:** Prop type mismatches (e.g., `schedule as any`, `stats as any`, `room as any`) are fixed by aligning prop types between parent data and child component interfaces — widen child props or narrow parent data, whichever is simpler
- **D-10:** `icon={<RefreshCw size={16} /> as any}` → widen `icon` prop type to accept `React.ReactNode` (same pattern as Phase 115's ButtonProps fix)

### Weather forecast route (2 casts)
- **D-11:** Define `WeatherCacheResult` and `AirQualityCacheResult` interfaces for the cached response shapes — inline at use site

### Maintenance route (1 cast)
- **D-12:** `parseFloat(targetHours as any)` → `targetHours` is already a string from request body, so type assertion to `string` or validate at parse time

### Claude's Discretion
- Whether to create a shared `types/scheduler.ts` or keep interfaces inline in route files
- Exact placement of `declare global` augmentations (existing `global.d.ts` vs new file)
- Whether to consolidate multiple small type fixes into fewer commits or one per file

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow established patterns from Phase 114 (generic `adminDbGet<T>`, `declare global` augmentation, inline interfaces) and Phase 115 (prop type widening, `React.ReactNode` for icon props).

</specifics>

<canonical_refs>
## Canonical References

### Prior type safety phases
- `.planning/phases/114-type-safety-lib/114-CONTEXT.md` — Generic `adminDbGet<T>` pattern, `declare global` for browser APIs, inline interfaces for single-use shapes
- `.planning/phases/115-type-safety-components/115-CONTEXT.md` — Icon prop widening to `React.ReactNode`, `error instanceof Error` pattern, variant union typing

### Type definitions
- `lib/firebase/admin.ts` — `adminDbGet` generic overload definition
- `lib/types/` — Existing Netatmo, stove, scheduler type definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `adminDbGet<T>()` generic overload (Phase 114) — directly applicable to all 6+ scheduler casts
- `declare global` pattern in existing `global.d.ts` or type augmentation files — reuse for Badge API and Periodic Sync
- Existing Netatmo types in `lib/types/` — may already have module topology types to import

### Established Patterns
- Phase 114: inline interfaces for single-use response shapes (e.g., `const response: { rooms: NetatmoProxyRoom[] }`)
- Phase 115: widen component props rather than cast at call site (e.g., `icon: string | React.ReactNode`)
- Phase 114: `error instanceof Error && 'code' in error` for error narrowing

### Integration Points
- `app/api/scheduler/check/route.ts` imports from `lib/firebase/admin.ts`, `lib/stove/`, `lib/scheduler/`
- `app/api/netatmo/homestatus/route.ts` imports from `lib/netatmo/`
- Page components import from `app/components/` — prop type changes may ripple to component definitions

</code_context>

<deferred>
## Deferred Ideas

- Test file `as any` cleanup (~200+ occurrences in `__tests__/` files) — separate phase or backlog item
- Design system component test `as any` (~30 occurrences in UI component tests) — same deferral

</deferred>

---

*Phase: 116-type-safety-routes-pages*
*Context gathered: 2026-03-22*
