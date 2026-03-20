---
phase: 101-frontend-hooks
plan: "02"
subsystem: stove-frontend
tags: [proxy-migration, stove, commands, tdd, 202-accepted, 409-conflict]
dependency_graph:
  requires: [101-01, 100-control-endpoints]
  provides: [useStoveCommands-proxy, StoveCard-exact-status]
  affects: [StoveCard, stove-orchestrator-components]
tech_stack:
  added: []
  patterns: [202-delayed-polling, 409-error-surfacing, fake-timers-runAllTimersAsync]
key_files:
  created: []
  modified:
    - app/components/devices/stove/hooks/useStoveCommands.ts
    - app/components/devices/stove/StoveCard.tsx
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
decisions:
  - "suggested_poll_delay_s from ThermorossiCommandResponse drives fetchStatusAndUpdate delay — default 15s ignite/shutdown, 5s fan/power"
  - "409 Conflict throws Error('Command not allowed in current state') — proxy state gate surfaces as user-facing error"
  - "modeChanged/returnToAutoAt reading removed from handleFanChange and handlePowerChange — proxy response carries no scheduler state"
  - "StoveCard uses status === 'working' exact equality — not toUpperCase().includes('WORK') substring"
  - "jest.runAllTimersAsync() required for fake timers + async/await chains — jest.runAllTimers() alone hangs inside act()"
metrics:
  duration_seconds: 595
  completed_date: "2026-03-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 101 Plan 02: Command Handler Proxy Adaptation Summary

Rewrote all 4 `useStoveCommands` handlers to read `suggested_poll_delay_s` from `ThermorossiCommandResponse` and delay `fetchStatusAndUpdate`, added 409 Conflict error throwing, removed stale `modeChanged` reading, and replaced the `toUpperCase().includes('WORK')` substring check in `StoveCard` with exact `=== 'working'` equality.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Adapt useStoveCommands for 202 delayed refresh + 409 handling | 25dcd45 | useStoveCommands.ts, useStoveCommands.test.ts |
| 2 | Fix StoveCard.tsx inline substring check for StoveAdjustments visibility | 01936f1 | StoveCard.tsx |

## What Was Built

**Task 1 — useStoveCommands.ts:**
- Added `import type { ThermorossiCommandResponse } from '@/types/thermorossiProxy'`
- Rewrote `handleIgnite`: checks `response.ok`, throws on 409, reads `suggested_poll_delay_s`, awaits `new Promise<void>(resolve => setTimeout(resolve, delayMs))`, then calls `fetchStatusAndUpdate`. Default delay 15s.
- Rewrote `handleShutdown`: same pattern as handleIgnite. Default delay 15s.
- Rewrote `handleFanChange`: removed `data.modeChanged` block entirely, added delayed refresh pattern. Default delay 5s.
- Rewrote `handlePowerChange`: same as handleFanChange. Default delay 5s.
- All 4 handlers: null response (deduplicated request) silently skips all logic
- 6 other handlers (`handleClearSemiManual`, `handleSetManualMode`, etc.) left unchanged

**Task 1 — useStoveCommands.test.ts:**
- Added `import type { ThermorossiCommandResponse }` and `mockCommandResponse` constant with `suggested_poll_delay_s: 15`
- Added `jest.useFakeTimers()` in `beforeEach`, `jest.useRealTimers()` in `afterEach`
- All command tests use per-test inline mock responses (not shared `mockResponse202` object)
- All async command tests use `await jest.runAllTimersAsync()` pattern inside `act()` — critical for interleaving fake timers with promise chains
- Added tests: delayed refresh after 15s, setSemiManualMode not called by fan/power, 409 throws for all 4 commands, null response skips fetchStatusAndUpdate

**Task 2 — StoveCard.tsx:**
- Single-line change on line 171: `stoveData.status?.toUpperCase().includes('WORK')` → `stoveData.status === 'working'`
- StoveAdjustments now only visible when stove is in exact `'working'` state — not during igniting or modulating

## Test Results

- useStoveCommands: 18/18 tests pass
- stoveStatusUtils: 35/35 tests pass (unchanged)
- useStoveData: 18/18 tests pass (unchanged)
- Combined: 71/71 tests pass

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed test timer pattern: jest.runAllTimers() hangs inside act()**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Using `jest.runAllTimers()` synchronously inside `await act(async () => { ... })` caused tests to hang because the Promise chain inside the handler (`new Promise(resolve => setTimeout(resolve, delay))`) needed microtask flushes after the timer fired. `jest.runAllTimers()` is synchronous and doesn't flush the subsequent microtasks.
- **Fix:** Used `await jest.runAllTimersAsync()` which interleaves timer advancement with microtask flushing — the Jest 27+ API designed for exactly this use case.
- **Files modified:** `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts`
- **Commit:** 25dcd45 (included in Task 1 commit)

**2. [Rule 1 - Bug] Replaced shared mockResponse202 with per-test inline mocks**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** The `mockResponse202.json` mock was created at describe-level. With `jest.clearAllMocks()` in `beforeEach`, the `json` function mock was cleared but the object reference remained, leading to inconsistent behavior across tests.
- **Fix:** Each test creates its own inline response mock with `jest.fn().mockResolvedValue(...)` for the `json` method.
- **Files modified:** `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts`
- **Commit:** 25dcd45 (included in Task 1 commit)

## Self-Check: PASSED

- `app/components/devices/stove/hooks/useStoveCommands.ts` exists and contains `import type { ThermorossiCommandResponse } from '@/types/thermorossiProxy'`
- `app/components/devices/stove/hooks/useStoveCommands.ts` contains `response.status === 409`
- `app/components/devices/stove/hooks/useStoveCommands.ts` contains `data.suggested_poll_delay_s`
- `app/components/devices/stove/hooks/useStoveCommands.ts` does NOT contain `data.modeChanged`
- `app/components/devices/stove/StoveCard.tsx` contains `stoveData.status === 'working'`
- `app/components/devices/stove/StoveCard.tsx` does NOT contain `toUpperCase().includes`
- Commit 25dcd45 exists (Task 1)
- Commit 01936f1 exists (Task 2)
