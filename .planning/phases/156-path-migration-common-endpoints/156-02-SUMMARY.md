---
phase: 156-path-migration-common-endpoints
plan: "02"
subsystem: frontend
tags: [path-migration, thermorossi, service-worker, debug-panels, commands, tests]
dependency_graph:
  requires: ["156-01"]
  provides: ["zero /api/stove/ frontend references"]
  affects: ["lib/commands/deviceCommands.tsx", "app/sw.ts", "app/debug/", "lib/routes.ts"]
tech_stack:
  added: []
  patterns: ["STOVE_ROUTES constants for centralized path management"]
key_files:
  created: []
  modified:
    - lib/commands/deviceCommands.tsx
    - app/debug/api/components/tabs/StoveTab.tsx
    - app/debug/components/tabs/StoveTab.tsx
    - app/sw.ts
    - lib/hooks/useRetryableCommand.ts
    - types/api/responses.ts
    - lib/routes.ts
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
    - lib/retry/__tests__/idempotencyManager.test.ts
    - lib/hooks/__tests__/useRetryableCommand.test.ts
decisions:
  - "executeStoveAction rewritten to accept full path + method instead of path segment, enabling varying depths like /api/v1/thermorossi/commands/ignit"
  - "Power/fan set commands use { value: } body key (not { level: }) matching route handler expectation"
  - "lib/routes.ts STOVE_ROUTES updated as Rule 1 auto-fix — root cause of test failures (hooks consume these constants)"
metrics:
  duration_seconds: 480
  tasks_completed: 2
  files_modified: 11
  completed_date: "2026-04-07"
---

# Phase 156 Plan 02: Frontend Path Migration to /api/v1/thermorossi/* Summary

Complete elimination of all `/api/stove/` frontend references, replacing with canonical `/api/v1/thermorossi/*` paths across hooks, commands, debug panels, service worker, routes constants, and tests.

## Tasks Completed

### Task 1: Update all frontend source files
- **lib/commands/deviceCommands.tsx**: Rewrote `executeStoveAction` to accept full path + HTTP method; updated all 6 stove command calls with canonical paths and `{ value: }` body keys (not `{ level: }`)
- **app/debug/api/components/tabs/StoveTab.tsx**: Replaced all 10 URL strings (5 GET + 5 POST) with canonical paths
- **app/debug/components/tabs/StoveTab.tsx**: Same replacements as above (second debug tab)
- **app/sw.ts**: Updated both occurrences of `/api/stove/status` to `/api/v1/thermorossi/status` (pathname check at line ~597 and fetch at line ~718)
- **lib/hooks/useRetryableCommand.ts**: JSDoc example updated
- **types/api/responses.ts**: JSDoc example updated

### Task 2: Update test files and run verification
- **useStoveData.test.ts**: Updated `/api/stove/status` assertion to `/api/v1/thermorossi/status`
- **useStoveCommands.test.ts**: Updated all 9 occurrences across ignite, shutdown, setFan, setPower, and poll_endpoint assertions
- **idempotencyManager.test.ts**: Updated all `/api/stove/ignite` (12 occurrences) and `/api/stove/shutdown` (6 occurrences)
- **useRetryableCommand.test.ts**: Updated all 10 `/api/stove/ignite` occurrences

## Verification Results

- `grep -r '/api/stove/' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v .next | grep -v lib/version.ts | grep -v .claude/worktrees` = 0
- `grep -c '/api/v1/thermorossi/' lib/commands/deviceCommands.tsx` = 10 (>= 6 required)
- `grep -c '/api/v1/thermorossi/status' app/sw.ts` = 2
- All 4 test suites: PASS (useStoveData, useStoveCommands, idempotencyManager, useRetryableCommand)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated STOVE_ROUTES constants in lib/routes.ts**
- **Found during:** Task 2 — tests failing because hooks called `STOVE_ROUTES.ignite` which resolved to `/api/stove/ignite`
- **Issue:** `lib/routes.ts` STOVE_ROUTES exported constants still pointed to old `/api/stove/*` paths; hooks (`useStoveCommands.ts`, `useStoveData.ts`) import these constants, so they passed old URLs to fetch/execute
- **Fix:** Updated all 7 STOVE_ROUTES values to canonical `/api/v1/thermorossi/*` paths
- **Files modified:** `lib/routes.ts`
- **Commit:** 2498a8f8

## Commits

| Hash | Message |
|------|---------|
| 0587a1e0 | feat(156-02): update frontend source files from /api/stove/* to /api/v1/thermorossi/* |
| 2498a8f8 | feat(156-02): update test files and STOVE_ROUTES to canonical /api/v1/thermorossi/* paths |

## Known Stubs

None.

## Self-Check: PASSED
