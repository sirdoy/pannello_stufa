---
phase: 148-tuya-frontend
plan: 02
subsystem: tuya-frontend
tags: [tuya, dashboard, card, presentational, testing]
dependency_graph:
  requires: [148-01]
  provides: [TuyaCard, TuyaSummary]
  affects: [app/components/DashboardCards.tsx]
tech_stack:
  added: []
  patterns: [orchestrator-presentational, TDD, Phase-146-LastUpdated-pattern]
key_files:
  created:
    - app/components/devices/tuya/TuyaCard.tsx
    - app/components/devices/tuya/components/TuyaSummary.tsx
    - app/components/devices/tuya/__tests__/TuyaCard.test.tsx
    - app/components/devices/tuya/__tests__/TuyaSummary.test.tsx
  modified: []
decisions:
  - TuyaCard uses router.push('/tuya') (same pattern as RaspiCard) rather than Link component
  - LastUpdated placed outside data conditional per Phase 146 pattern — renders when tsMs is set regardless of data state
  - Stale banner rendered inline with SmartHomeCard.Controls (same as RaspiCard stale pattern)
  - TuyaSummary gauge uses 3500W as EU residential max plug wattage for percentage calculation
metrics:
  duration: 3min
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 4
---

# Phase 148 Plan 02: Tuya Dashboard Card Summary

TuyaCard dashboard orchestrator with TuyaSummary aggregate view: active/inactive plug counts, total power display, amber power gauge (3500W max), highest consumer label — all wired to useTuyaData with LastUpdated and navigation to /tuya.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create TuyaSummary presentational component | 636e44ec | TuyaSummary.tsx, TuyaSummary.test.tsx |
| 2 | Create TuyaCard orchestrator with tests | 2201d045 | TuyaCard.tsx, TuyaCard.test.tsx |

## Verification

- `npx jest --testPathPatterns="TuyaCard|TuyaSummary"` — 15 tests pass (2 suites)
- TuyaCard imports useTuyaData, TuyaSummary, LastUpdated, Skeleton.TuyaCard
- TuyaSummary shows aggregate summary per D-01 and D-02
- LastUpdated renders with lastUpdatedAt (UX-02)
- DashboardCards.tsx already imports TuyaCard (registered in Plan 01)

## Decisions Made

1. **router.push navigation**: TuyaCard follows RaspiCard pattern using `useRouter().push('/tuya')` with role="link" + onKeyDown for accessibility, rather than next/link wrapper.
2. **LastUpdated placement**: Outside data conditional per Phase 146 decision — renders when `tsMs` is set, handles null gracefully.
3. **Stale indicator**: Inline Banner with `compact={true}` (same as RaspiCard), not a separate dot indicator — consistent with existing pattern.
4. **Gauge max**: 3500W chosen as EU residential single-phase max for meaningful gauge scale.

## Deviations from Plan

None — plan executed exactly as written. Import paths corrected to relative `../../ui/` (same as RaspiCard) during Rule 3 auto-fix.

## Known Stubs

None — TuyaCard is fully wired to useTuyaData which polls `/api/tuya/plugs`. No hardcoded empty values or placeholder data.

## Self-Check: PASSED

- [x] app/components/devices/tuya/TuyaCard.tsx exists
- [x] app/components/devices/tuya/components/TuyaSummary.tsx exists
- [x] app/components/devices/tuya/__tests__/TuyaCard.test.tsx exists
- [x] app/components/devices/tuya/__tests__/TuyaSummary.test.tsx exists
- [x] Commit 636e44ec exists (TuyaSummary)
- [x] Commit 2201d045 exists (TuyaCard)
