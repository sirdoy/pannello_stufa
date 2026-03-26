---
phase: 135-sonos-zone-extended-ui
plan: "01"
subsystem: sonos-hooks
tags: [sonos, hooks, play-mode, sleep-timer, queue, data-layer]
dependency_graph:
  requires: [128-sonos-extended-controls]
  provides: [play-mode polling, sleep-timer polling, play-mode command, sleep-timer command, queue pagination]
  affects: [135-02-sonos-zone-extended-ui]
tech_stack:
  added: []
  patterns: [Promise.allSettled for parallel zone fetches, cycling mock pattern for 3 useRetryableCommand hooks]
key_files:
  created:
    - app/components/devices/sonos/hooks/useSonosQueue.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts
  modified:
    - app/components/devices/sonos/hooks/useSonosFullData.ts
    - app/components/devices/sonos/hooks/useSonosCommands.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts
decisions:
  - "useSonosFullData: playModes and sleepTimers fetched in single Promise.all wrapping two Promise.allSettled batches — parallel fetch for efficiency"
  - "useSonosCommands: third useRetryableCommand (sonosExtendedCmd) follows same unconditional hook call pattern"
  - "useSonosCommands tests: cycling callCount % 3 mock pattern (not mockReturnValueOnce) to survive React re-renders that call hooks multiple times"
  - "useSonosQueue: QUEUE_PAGE_SIZE=20, fetchPage abstraction handles both reset (fetchInitial) and append (loadMore)"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 4
requirements: [SONOS-35, SONOS-36, SONOS-37]
---

# Phase 135 Plan 01: Sonos Zone Extended UI — Data Layer Summary

**One-liner:** Extended Sonos hooks with play-mode/sleep-timer polling + commands via sonosExtendedCmd, plus new useSonosQueue on-demand paginated hook.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Extend useSonosFullData + useSonosCommands with play-mode/sleep-timer | a976eb33 | 4 modified |
| 2 | Create useSonosQueue on-demand hook with pagination tests | e716a9c9 | 2 created |

## What Was Built

### useSonosFullData (extended)

- `SonosFullData` interface extended with `playModes: Record<string, SonosPlayModeResponse>` and `sleepTimers: Record<string, SonosSleepTimerResponse>`
- `fetchData` now fetches play-mode and sleep-timer per zone via `Promise.all([Promise.allSettled(...), Promise.allSettled(...)])` after volume fetches
- Graceful degradation: individual zone failures don't break the overall fetch

### useSonosCommands (extended)

- New `sonosExtendedCmd = useRetryableCommand({ device: 'sonos', action: 'extended' })` as third unconditional hook call
- `handleSetPlayMode(groupId, mode)` — PUT `/api/sonos/zones/{groupId}/play-mode` with `{ mode }` body
- `handleSetSleepTimer(groupId, duration)` — PUT `/api/sonos/zones/{groupId}/sleep-timer` with `{ duration }` body (duration=0 cancels)
- `UseSonosCommandsReturn` interface extended with new handlers and `sonosExtendedCmd`

### useSonosQueue (new)

- Standalone on-demand hook — NOT in polling loop, called on user demand
- `fetchInitial()` resets items list (append=false)
- `loadMore()` appends to existing items (append=true)
- `hasMore: items.length < total` derived flag
- `QUEUE_PAGE_SIZE = 20` per design spec
- Error message in Italian (`'Queue non disponibile'`)
- Passes `?limit=20&offset=N` query params correctly

## Test Coverage

| File | Tests | Status |
|------|-------|--------|
| useSonosFullData.test.ts | 10 | All pass |
| useSonosCommands.test.ts | 12 | All pass |
| useSonosQueue.test.ts | 7 | All pass |
| **Total** | **36** | **All pass** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed useSonosCommands test cycling mock for 3 hooks**
- **Found during:** Task 1 test verification
- **Issue:** Plan's `mockReturnValueOnce` pattern fails when React re-renders the hook multiple times (consuming values), causing `execute` to be called 0 times
- **Fix:** Reverted to cycling `callCount % 3` pattern (same as original `callCount % 2` but for 3 commands) — matches the established test pattern in this codebase
- **Files modified:** `useSonosCommands.test.ts`
- **Commit:** a976eb33

## Known Stubs

None — all hooks wire to real API endpoints. Plan 02 will consume these hooks in presentational components.

## Self-Check: PASSED
