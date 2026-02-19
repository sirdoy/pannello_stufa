---
phase: 74-suspense-streaming
plan: 02
subsystem: ui
tags: [suspense, react, nextjs, skeleton, testing, server-components, unit-tests]

# Dependency graph
requires:
  - phase: 74-suspense-streaming/74-01
    provides: loading.tsx skeleton layout and DashboardCards async Server Component (created by plan 01)
  - phase: 73-render-optimization
    provides: animation stagger delays and adaptive polling hooks used by dashboard cards
provides:
  - DashboardCards.tsx: per-card Suspense boundaries with matching skeleton fallbacks inside DeviceCardErrorBoundary
  - app/__tests__/loading.test.tsx: unit tests for loading.tsx skeleton layout (5 tests)
  - app/components/__tests__/DashboardCards.test.tsx: unit tests for DashboardCards async Server Component (6 tests)
affects: [any plan touching DashboardCards.tsx, any plan adding new dashboard cards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-card Suspense boundary: DeviceCardErrorBoundary (outside) wraps Suspense (inside) wraps CardComponent"
    - "CARD_SKELETONS registry: maps card IDs to skeleton components for declarative fallback lookup"
    - "Async Server Component testing: await DashboardCards() then render the returned JSX"
    - "Skeleton mocking pattern: jest.mock with MockSkeleton.SubComponent = () => <div data-testid='...' />"

key-files:
  created:
    - app/__tests__/loading.test.tsx
    - app/components/__tests__/DashboardCards.test.tsx
  modified:
    - app/components/DashboardCards.tsx

key-decisions:
  - "DeviceCardErrorBoundary wraps OUTSIDE Suspense; Suspense wraps INSIDE — error boundaries must catch Suspense errors, not the other way around"
  - "CARD_SKELETONS registry mirrors CARD_COMPONENTS registry exactly — same 6 card IDs map to their Skeleton.* sub-components"
  - "DashboardCards tests use await DashboardCards() pattern to render async Server Component as regular JSX"
  - "Cards appear twice in test assertions (x2) because both mobile and desktop layouts render them separately"

patterns-established:
  - "Per-card Suspense fallback: <Suspense fallback={CardSkeleton ? <CardSkeleton /> : null}>"
  - "Async Server Component testing: const jsx = await ComponentFn(); render(jsx as React.ReactElement)"

requirements-completed: [SUSP-02, SUSP-03]

# Metrics
duration: 9min
completed: 2026-02-19
---

# Phase 74 Plan 02: Per-Card Suspense Boundaries and Unit Tests Summary

**Per-card Suspense boundaries with matching skeleton fallbacks added to DashboardCards; 11 unit tests covering skeleton layout, auth redirect, empty state, card rendering order, and Suspense structure**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-19T09:11:38Z
- **Completed:** 2026-02-19T09:20:54Z
- **Tasks:** 2
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- `app/components/DashboardCards.tsx` updated with `CARD_SKELETONS` registry and per-card `<Suspense fallback={<CardSkeleton />}>` boundary inside each `<DeviceCardErrorBoundary>` (6 card IDs mapped)
- `app/__tests__/loading.test.tsx` created with 5 tests: all 6 skeletons render twice (mobile + desktop), `sm:hidden` mobile layout, `sm:flex` desktop layout, `sr-only` heading
- `app/components/__tests__/DashboardCards.test.tsx` created with 6 tests: card rendering, auth redirect, empty state, all-6-cards, stove-first DOM order, Suspense boundary verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Add per-card Suspense boundaries with matching skeleton fallbacks** - `f844c0b` (feat)
2. **Task 2: Create unit tests for DashboardCards and loading.tsx** - `ab2f2f0` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `app/components/DashboardCards.tsx` - Added `import { Suspense } from 'react'`, `import Skeleton`, `CARD_SKELETONS` registry, and per-card `<Suspense>` boundary inside each `<DeviceCardErrorBoundary>`
- `app/__tests__/loading.test.tsx` - 5 unit tests for loading.tsx skeleton layout; all pass
- `app/components/__tests__/DashboardCards.test.tsx` - 6 unit tests for DashboardCards async Server Component; all pass

## Decisions Made
- `DeviceCardErrorBoundary` wraps OUTSIDE `Suspense` — error boundaries must be positioned outside the Suspense boundary to correctly catch errors that occur during suspension and resolution
- `CARD_SKELETONS` registry uses the same 6 card IDs as `CARD_COMPONENTS` — clean symmetry, easy to add/remove cards
- Async Server Component testing via `await DashboardCards()` then `render(jsx)` — simpler than TestWrapper pattern, works correctly with jest-environment-jsdom
- Cards appear x2 in DOM assertions because `renderCard` is called in both mobile and desktop layout blocks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 74 complete: both plans executed; SUSP-01, SUSP-02, SUSP-03 all satisfied
- v9.0 Performance Optimization milestone complete
- Dashboard has full Suspense streaming: page-level loading.tsx + page-shell Suspense + per-card Suspense boundaries

## Self-Check: PASSED

- FOUND: app/components/DashboardCards.tsx (modified with Suspense boundaries)
- FOUND: app/__tests__/loading.test.tsx (5 tests, all pass)
- FOUND: app/components/__tests__/DashboardCards.test.tsx (6 tests, all pass)
- FOUND: .planning/phases/74-suspense-streaming/74-02-SUMMARY.md
- FOUND commit f844c0b (Task 1: per-card Suspense boundaries)
- FOUND commit ab2f2f0 (Task 2: unit tests)

---
*Phase: 74-suspense-streaming*
*Completed: 2026-02-19*
