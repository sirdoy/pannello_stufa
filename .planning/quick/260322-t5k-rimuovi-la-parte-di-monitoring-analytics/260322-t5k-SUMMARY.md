---
phase: quick
plan: 260322-t5k
subsystem: analytics, monitoring, type-safety
tags: [cleanup, deletion, typescript, type-fix]
dependency_graph:
  requires: []
  provides: [clean-codebase, zero-tsc-errors]
  affects: [stove-routes, scheduler-routes, network-page, debug-panels, test-suites]
tech_stack:
  added: []
  patterns: [non-null-assertion, as-any-cast, global-as-any-fetch, HTTP_STATUS-constant]
key_files:
  deleted:
    - app/analytics/page.tsx
    - app/monitoring/page.tsx
    - app/components/analytics/ (8 files)
    - components/monitoring/ (5 files)
    - lib/analytics/ (4 source + 4 test files)
    - lib/health/ (3 source files)
    - lib/pelletEstimationService.ts
    - lib/__tests__/pelletEstimationService.test.ts
    - types/analytics.ts
    - app/api/analytics/ (3 routes)
    - app/api/vitals/ (2 routes)
    - app/api/cron/aggregate-analytics/route.ts
    - app/api/health-monitoring/ (5 routes + 1 test)
    - __tests__/lib/healthLogger.test.ts
    - __tests__/lib/healthMonitoring.test.ts
    - __tests__/lib/healthDeadManSwitch.test.ts
    - __tests__/api/health-monitoring/cron-executions.test.ts
    - __tests__/components/monitoring/StatusCards.test.tsx
  modified:
    - app/components/ClientProviders.tsx
    - app/error.tsx
    - app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx
    - app/components/Navbar.tsx
    - app/network/page.tsx
    - app/api/stove/ignite/route.ts
    - app/api/stove/shutdown/route.ts
    - app/api/stove/setPower/route.ts
    - app/api/stove/setFan/route.ts
    - app/api/stove/setWaterTemperature/route.ts
    - app/api/scheduler/check/route.ts
    - app/api/scheduler/check/__tests__/route.test.ts
    - app/_components/WebVitals.tsx
    - app/debug/components/tabs/SchedulerTab.tsx
    - app/debug/api/components/tabs/SchedulerTab.tsx
    - tests/smoke/page-loads.spec.ts
    - __tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx
    - types/api/errors.ts
    - lib/core/apiErrors.ts
    - app/components/ui/Button.tsx
    - app/components/ui/DeviceCard.tsx
    - app/components/ui/Slider.tsx
    - app/components/TransitionLink.tsx
    - app/components/devices/lights/LightsCard.tsx
    - multiple test files (type fixes)
decisions:
  - "Correlation chart (bandwidth-stove) now always shown without consent gating since analytics is removed"
  - "DeviceCardErrorBoundary now logs to console.error instead of POST /api/analytics/error"
  - "app/error.tsx now logs to console.error instead of POST /api/analytics/error"
  - "HTTP_STATUS.ACCEPTED (202) added to lib/core/apiErrors.ts and types/api/errors.ts"
  - "ButtonIcon.icon widened from string to React.ReactNode (was already accepting JSX at call sites)"
  - "Slider omits onChange from SliderPrimitivePropsBase to resolve FormEventHandler conflict"
  - "ToastNotification omits 'type' from ToastProps to avoid conflict with legacy type field"
metrics:
  duration: "~19 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_deleted: 40+
  files_modified: 30+
---

# Quick Task 260322-t5k: Remove Analytics and Monitoring Subsystem

**One-liner:** Deleted entire analytics and monitoring subsystem (40+ files, ~7,900 LOC) and resolved all 100+ TypeScript build errors reaching 0 tsc errors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete analytics/monitoring + clean references | 3702d071 | 61 files (40+ deleted, 15 modified) |
| 2 | Fix all TypeScript build errors | b369b487 | 26 files |

## Task 1: Analytics and Monitoring Deletion

Deleted all analytics and health monitoring code:
- Pages: `/analytics` and `/monitoring`
- Components: 8 analytics components + 5 monitoring components
- API routes: 3 analytics routes + 5 vitals routes + 5 health-monitoring routes + 1 cron route
- Library code: `lib/analytics/` (4 files), `lib/health/` (3 files), `lib/pelletEstimationService.ts`
- Types: `types/analytics.ts`
- All associated tests

Reference cleanup in surviving files:
- `ClientProviders.tsx`: removed `<ConsentBanner />` import and usage
- `app/error.tsx`: replaced analytics fetch with `console.error`
- `DeviceCardErrorBoundary.tsx`: replaced analytics POST with `console.error`
- `Navbar.tsx`: removed monitoring path icon case, removed unused `Activity` import
- `app/network/page.tsx`: removed consent state + gating; correlation chart now always shown
- 3 stove routes: removed `logAnalyticsEvent` imports and fire-and-forget calls
- `scheduler/check/route.ts`: removed 4 `logAnalyticsEvent` calls
- `scheduler/check/__tests__/route.test.ts`: removed analytics mock, describe block, and assertions
- `WebVitals.tsx`: removed `navigator.sendBeacon('/api/vitals', ...)` pipeline
- Both debug SchedulerTab panels: removed health-monitoring stats endpoint cards
- Smoke test: removed `/analytics loads` E2E test

## Task 2: TypeScript Build Errors Fixed

**Category A: HTTP 202 not in HttpStatus union**
Added `ACCEPTED: 202` to `lib/core/apiErrors.ts` and `202` to `types/api/errors.ts`. Updated 5 stove routes to use `HTTP_STATUS.ACCEPTED` instead of raw `202`.

**Category B: Object possibly undefined (noUncheckedIndexedAccess)**
Added `!` non-null assertions to array index accesses in 5 test files.

**Category C: Mock type incompatibilities**
Changed `global.fetch = jest.fn(...)` to `(global as any).fetch = jest.fn(...)` in useLightsData/useStoveCommands tests. Fixed `mockResolvedValue` types in fritzbox tests with `as any`.

**Category D: Scheduler test signature mismatch**
GET function requires 2 args (request + context) but tests pass 1 (because withCronSecret is mocked). Cast `GET` to single-arg form via `as unknown as (request: Request) => Promise<Response>`. Fixed 2 `mode: { enabled: false }` missing `semiManual` field.

**Category E: pidTuningLogService 'entry' unknown**
Cast `adminDbSet.mock.calls[0]` tuples as `[string, any]`.

**Category F: Component type errors**
- `TransitionLink`: string → `TransitionType` cast via `Parameters<typeof setTransitionType>[0]`
- `Button.ButtonIcon.icon`: widened from `string` to `React.ReactNode` (3 camera components pass JSX)
- `Slider`: also omit `onChange` from Radix base props to resolve `FormEventHandler<HTMLDivElement>` conflict
- `LightsCard`: `StatusBadge | null` → `StatusBadge | undefined`; cast `banners` as `BannerItem[]`
- `DeviceCard.ToastNotification`: also omit `'type'` from `ToastProps`; fix `onClose` → `onOpenChange`

**Stale .next build cache:** Removed stale `.next/types/` and `.next/dev/types/validator.ts` files that referenced deleted routes.

## Deviations from Plan

**Auto-fixed (Rule 2): Additional references found beyond plan scope**
- `app/debug/components/tabs/SchedulerTab.tsx` and `app/debug/api/components/tabs/SchedulerTab.tsx`: referenced `/api/health-monitoring/stats` not listed in the plan's cleanup targets
- `app/_components/WebVitals.tsx`: referenced `/api/vitals` not listed in the plan's cleanup targets
- `__tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx`: tested the analytics fetch behavior being deleted

All cleaned up during Task 1.

**Auto-fixed (Rule 1): Stale .next build cache**
The `.next/dev/types/validator.ts` and `.next/types/validator.ts` generated files still referenced the deleted routes. Deleted them (Next.js regenerates on next build/dev).

**Auto-fixed (Rule 1): LightsRoomControl.tsx not actually needing edit**
Plan listed it as "to be modified for build errors" but no change was needed there (the Slider type fix in `Slider.tsx` resolved the downstream issue).

## Known Stubs

None. All code is functional.

## Self-Check: PASSED

- `3702d071` exists in git log
- `b369b487` exists in git log
- `app/analytics/` does not exist: confirmed
- `lib/analytics/` does not exist: confirmed
- `lib/health/` does not exist: confirmed
- `app/api/netatmo/camera/monitoring/route.ts` exists: confirmed (not touched)
- `npx tsc --noEmit` exits with 0 errors: confirmed
