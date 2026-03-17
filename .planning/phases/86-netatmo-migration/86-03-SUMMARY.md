---
phase: 86-netatmo-migration
plan: "03"
subsystem: netatmo-api
tags: [gap-closure, tests, netatmo]
dependency_graph:
  requires: ["86-01", "86-02"]
  provides: ["getroommeasure-route-tests-green"]
  affects: ["__tests__/api/netatmo/getroommeasure.test.ts"]
tech_stack:
  added: []
  patterns: ["URLSearchParams assertions in Jest", "jest.MockedFunction for named exports"]
key_files:
  created: []
  modified:
    - __tests__/api/netatmo/getroommeasure.test.ts
key_decisions:
  - "getroommeasure RoomMeasureResponse type import kept — mockProxyResponse fixture still typed as RoomMeasureResponse"
  - "URLSearchParams.get() assertions replace string URL toContain() — matches actual route implementation"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-17"
  tasks_completed: 1
  files_modified: 1
---

# Phase 86 Plan 03: getroommeasure Route Test Fix Summary

Fix the broken getroommeasure route test that still imported the deleted `netatmoProxyGet` function, replacing all mock references and string-URL assertions with `getProxyRoomMeasure` and `URLSearchParams.get()` assertions.

## What Was Built

The `__tests__/api/netatmo/getroommeasure.test.ts` file was updated to match the current route implementation introduced in plan 86-02.

Key changes:
- Import changed from `netatmoProxyGet` to `getProxyRoomMeasure`
- Mock variable renamed from `mockNetatmoProxyGet` to `mockGetProxyRoomMeasure`
- Test 1: replaced `calledUrl.toContain('/getroommeasure')` assertions with `calledParams.get('room_id')` / `calledParams.get('scale')`
- Test 4: replaced `calledUrl.toContain('scale=1hour')` with `calledParams.get('scale')`
- Test 5: replaced five `calledUrl.toContain(...)` assertions with four `calledParams.get(...)` assertions
- Tests 2, 3, 6: updated mock variable names

## Verification Results

- `npx jest __tests__/api/netatmo/getroommeasure.test.ts` — **6 passed, 0 failed**
- `npx jest __tests__/lib/netatmoProxy.test.ts __tests__/lib/netatmoProxy-camera.test.ts` — **28 passed, 0 failed** (no regression)
- `grep -r "netatmoProxyGet" __tests__/` — **0 matches** (no deleted function references remain)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- File exists: `__tests__/api/netatmo/getroommeasure.test.ts` — FOUND
- Commit b0099b5 — FOUND
- 0 `netatmoProxyGet` references in `__tests__/` — CONFIRMED
- 6 tests pass — CONFIRMED
