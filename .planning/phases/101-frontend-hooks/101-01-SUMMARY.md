---
phase: 101-frontend-hooks
plan: "01"
subsystem: stove-frontend
tags: [proxy-migration, stove, hooks, tdd]
dependency_graph:
  requires: [100-control-endpoints]
  provides: [stoveStatusUtils-proxy, useStoveData-proxy]
  affects: [StoveCard, stove-orchestrator-components]
tech_stack:
  added: []
  patterns: [switch-case-exhaustive, data_freshness-staleness, single-fetch-consolidation]
key_files:
  created: []
  modified:
    - app/components/devices/stove/stoveStatusUtils.ts
    - app/components/devices/stove/hooks/useStoveData.ts
    - __tests__/components/devices/stove/stoveStatusUtils.test.ts
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
decisions:
  - "switch/case on StoveState union replaces toUpperCase().includes() — TypeScript exhaustiveness enforced"
  - "data_freshness === 'STALE' drives staleness indicator — useDeviceStaleness removed from stove"
  - "modulating correctly added to isStoveActive (was missed by old WORK substring logic)"
  - "isStoveOff includes standby/alarm (not WAIT/ERROR substrings)"
  - "StalenessInfo.ageSeconds uses 0 as fallback (field is number not number|null)"
metrics:
  duration_seconds: 400
  completed_date: "2026-03-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 101 Plan 01: Frontend Hooks Proxy Adaptation Summary

Rewrote `stoveStatusUtils.ts` for exact proxy `stove_state` switch/case matching and adapted `useStoveData` to read all fields from a single `/stove/status` proxy response, replacing `useDeviceStaleness` with `data_freshness`-driven staleness.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite stoveStatusUtils for exact proxy stove_state matching | af13d94 | stoveStatusUtils.ts, stoveStatusUtils.test.ts |
| 2 | Adapt useStoveData for proxy response + data_freshness staleness | bd2f3bd | useStoveData.ts, useStoveData.test.ts |

## What Was Built

**Task 1 — stoveStatusUtils.ts:**
- Replaced all `toUpperCase().includes()` substring matching with `switch (status)` on `StoveState` union
- Imported `StoveState` from `@/types/thermorossiProxy` — type-safe exhaustive matching
- `isStoveActive` now correctly includes `'modulating'` (was invisible to old `WORK` substring match)
- `isStoveOff` now correctly includes `'standby'` (was invisible to old `WAIT` substring match) and `'alarm'` (was `'ERROR'`)
- Removed unknown fallback from `getStatusInfo`/`getStatusDisplay` — union is exhaustive
- All Tailwind classes, icons, labels, animation flags preserved exactly

**Task 2 — useStoveData.ts:**
- Removed `useDeviceStaleness` import and hook call entirely
- Removed `fetchFanLevel` and `fetchPowerLevel` functions (3-fetch → 1-fetch consolidation)
- `fetchStatusAndUpdate` destructures `ThermorossiStatusResponse` from single `/stove/status` call
- Staleness state: `isStale` boolean set from `data_freshness === 'STALE'`; produces `StalenessInfo | null`
- Error fields (`errorCode`, `errorDescription`) gated strictly on `stove_state === 'alarm'`
- `isAccesa`/`isSpenta` use exact equality against proxy state strings
- Initial `status` value changed from `'...'` to `'off'` (valid StoveState)

## Test Results

- stoveStatusUtils: 35/35 tests pass (proxy strings throughout)
- useStoveData: 18/18 tests pass (proxy-shaped mock responses, no useDeviceStaleness mock)
- Combined: 53/53 tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `app/components/devices/stove/stoveStatusUtils.ts` exists and contains `import type { StoveState } from '@/types/thermorossiProxy'`
- `app/components/devices/stove/hooks/useStoveData.ts` exists and contains `import type { ThermorossiStatusResponse } from '@/types/thermorossiProxy'`
- Commit af13d94 exists (Task 1)
- Commit bd2f3bd exists (Task 2)
