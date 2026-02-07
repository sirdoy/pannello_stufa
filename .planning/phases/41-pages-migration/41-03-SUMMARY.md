---
phase: 41-pages-migration
plan: 03
subsystem: ui
tags: [typescript, react, next.js, pages, stove, lights, netatmo, camera]

# Dependency graph
requires:
  - phase: 40-api-routes-migration
    provides: TypeScript API routes with typed responses
provides:
  - Typed device-control pages (stove, lights, netatmo, camera)
  - Edge-typed large client components with pragmatic API response handling
  - Typed state management and event handlers for all device pages
affects: [42-test-migration, 43-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Edge typing for large files (1000+ lines) - type boundaries, pragmatic any for internals
    - Pragmatic any for external API responses (Hue v2, Netatmo, Thermorossi)
    - Inline interface definitions for component-specific data structures
    - DayOfWeek literal type from const array for scheduler
    - Promise<void> return types on all async functions

key-files:
  created: []
  modified:
    - app/stove/page.tsx
    - app/stove/errors/page.tsx
    - app/stove/maintenance/page.tsx
    - app/stove/scheduler/page.tsx
    - app/lights/page.tsx
    - app/lights/authorized/page.tsx
    - app/lights/automation/page.tsx
    - app/lights/scenes/page.tsx
    - app/netatmo/page.tsx
    - app/netatmo/authorized/page.tsx
    - app/(pages)/camera/page.tsx
    - app/(pages)/camera/CameraDashboard.tsx
    - app/(pages)/camera/events/page.tsx
    - app/(pages)/camera/events/CameraEventsPage.tsx

key-decisions:
  - "Edge typing approach for large files: type state declarations and handlers, allow pragmatic any for complex internals"
  - "Pragmatic any for external API responses (Hue v2, Netatmo camera, Thermorossi) - no full type generation"
  - "DayOfWeek literal type from const array with 'as const' for type-safe scheduler"
  - "NodeJS.Timeout type for setTimeout refs in client components"

patterns-established:
  - "Edge typing pattern: Type boundaries (state, props, handlers), pragmatic any for complex internal logic in 1000+ line files"
  - "Inline interfaces for page-specific data structures (ErrorItem, MaintenanceData, ScheduleInterval)"
  - "Record<string, T> for typed object maps (snapshotUrls, theme configuration)"
  - "Promise<void> async function return types for all async handlers"

# Metrics
duration: 7.7min
completed: 2026-02-07
---

# Phase 41 Plan 03: Device Pages Migration Summary

**14 device-control pages migrated to TypeScript with edge-typed state management and pragmatic external API handling**

## Performance

- **Duration:** 7.7 min (462 seconds)
- **Started:** 2026-02-07T11:33:03Z
- **Completed:** 2026-02-07T11:40:45Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Migrated all 4 stove pages (main, errors, maintenance, scheduler) with typed state and handlers
- Migrated all 6 lights/netatmo pages with pragmatic Hue API response typing
- Migrated all 4 camera pages and co-located components with typed camera/event data
- Applied edge-typing approach to large files (stove page 1052 lines, lights page 1183 lines, scheduler 875 lines)
- Zero .js page files remaining in stove/, lights/, netatmo/, (pages)/camera/

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate stove pages (4 files)** - `0664995` (feat)
2. **Task 2: Migrate lights and netatmo pages (6 files)** - `a913ff4` (feat)
3. **Task 3: Migrate camera pages and components (4 files)** - `6c9c3bc` (feat)

## Files Created/Modified

**Stove pages (4):**
- `app/stove/page.tsx` - Main stove control with typed state, handlers, Firebase listeners
- `app/stove/errors/page.tsx` - Error history with ErrorItem interface
- `app/stove/maintenance/page.tsx` - Maintenance tracking with MaintenanceData interface
- `app/stove/scheduler/page.tsx` - Weekly scheduler with ScheduleInterval, DayOfWeek types

**Lights and Netatmo pages (6):**
- `app/lights/page.tsx` - Hue control dashboard with typed light/room/scene state
- `app/lights/authorized/page.tsx` - OAuth redirect with typed status state
- `app/lights/automation/page.tsx` - Placeholder page (minimal typing)
- `app/lights/scenes/page.tsx` - Scene management with HueScene interface
- `app/netatmo/page.tsx` - Netatmo hub with typed connection state
- `app/netatmo/authorized/page.tsx` - OAuth redirect with typed status state

**Camera pages (4):**
- `app/(pages)/camera/page.tsx` - Server component wrapper (minimal changes)
- `app/(pages)/camera/CameraDashboard.tsx` - Dashboard with Camera, CameraEvent interfaces
- `app/(pages)/camera/events/page.tsx` - Server component wrapper (minimal changes)
- `app/(pages)/camera/events/CameraEventsPage.tsx` - Events list with IntersectionObserver typing

## Decisions Made

**1. Edge typing for large files**
- Files over 800 lines use edge-typing: type state declarations, handlers, and component boundaries
- Allow pragmatic `any` for deeply nested internal logic and complex data transformations
- Rationale: Full typing of 1000+ line files is time-prohibitive and low-value; typing boundaries provides safety where it matters

**2. Pragmatic any for external API responses**
- Hue v2 API, Netatmo camera API, Thermorossi API responses typed as `any`
- Rationale: No official TypeScript types available, full codegen not justified for migration phase, Phase 40 pattern established

**3. DayOfWeek literal type from const array**
- `const daysOfWeek = [...] as const` enables `type DayOfWeek = typeof daysOfWeek[number]`
- Provides type-safe day selection across scheduler components
- Rationale: Type-safe string unions without manual duplication

**4. NodeJS.Timeout for setTimeout refs**
- `useRef<NodeJS.Timeout | null>(null)` for all setTimeout/setInterval refs
- Rationale: Browser vs Node timeout type ambiguity resolved with explicit NodeJS.Timeout

## Deviations from Plan

None - plan executed exactly as written using edge-typing approach for large files as intended.

## Issues Encountered

None - migration proceeded smoothly with established patterns from Phases 38-40.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 41 remaining plans:**
- 41-04: Settings pages migration (devices, notifications, admin, etc.)
- 41-05: Debug pages migration
- 41-06: Misc pages migration (changelog, log, monitoring, offline, root)

**Pattern established:**
- Edge typing approach proven effective for large client components (1000+ lines)
- Pragmatic any for external APIs consistently applied
- Ready to apply same patterns to remaining pages

**Status:**
- 14/14 device-control pages migrated
- 0 .js page files remaining in migrated directories
- All device functionality preserved, type-safe state management achieved

---
*Phase: 41-pages-migration*
*Completed: 2026-02-07*

## Self-Check: PASSED

All 14 files verified to exist.
All 3 commits verified in git history.
