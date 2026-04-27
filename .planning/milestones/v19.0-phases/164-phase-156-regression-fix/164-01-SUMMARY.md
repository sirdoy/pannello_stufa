---
phase: 164
plan: "01"
subsystem: stove
tags: [thermorossi, path-alignment, regression-fix, legacy-cleanup]
one_liner: "Delete resurrected legacy /api/stove/ tree and rewire all production references to canonical /api/v1/thermorossi/* paths"
dependency_graph:
  requires: []
  provides:
    - PATH-01: legacy /api/stove/ directory deleted
    - PATH-02 (production half): all frontend wiring aligned to canonical paths
  affects:
    - lib/routes.ts
    - lib/commands/deviceCommands.tsx
    - app/sw.ts
    - app/debug/components/tabs/StoveTab.tsx
    - app/debug/api/components/tabs/StoveTab.tsx
    - types/api/responses.ts
    - lib/hooks/useRetryableCommand.ts
    - lib/retry/idempotencyManager.ts
tech_stack:
  added: []
  patterns:
    - executeStoveAction(path, method, body) signature with GET/POST split
    - SW Category A/B/C classification for stove URL changes
key_files:
  deleted:
    - app/api/stove/getFan/route.ts
    - app/api/stove/getPower/route.ts
    - app/api/stove/health/route.ts
    - app/api/stove/history/route.ts
    - app/api/stove/ignite/route.ts
    - app/api/stove/setFan/route.ts
    - app/api/stove/setPower/route.ts
    - app/api/stove/setWaterTemperature/route.ts
    - app/api/stove/shutdown/route.ts
    - app/api/stove/status/route.ts
  modified:
    - lib/routes.ts
    - lib/commands/deviceCommands.tsx
    - app/sw.ts
    - app/debug/components/tabs/StoveTab.tsx
    - app/debug/api/components/tabs/StoveTab.tsx
    - types/api/responses.ts
    - lib/hooks/useRetryableCommand.ts
    - lib/retry/idempotencyManager.ts
decisions:
  - "D-01 confirmed: no redirects in next.config.ts; legacy paths return 404 after deletion"
  - "D-05 confirmed: ignite segment is 'ignit' (no trailing e) — applied in all 6 call sites"
  - "D-06 confirmed: lib/version.ts untouched (historical changelog)"
  - "A1 resolved: canonical response field is power_level/fan_level (not Result) per ThermorossiPowerResponse/ThermorossiFanResponse types"
  - "A2 resolved: Serwist uses content-hash precache manifest (default); no explicit SW_CACHE_VERSION bump needed"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-15"
  tasks_completed: 6
  tasks_total: 6
  files_deleted: 10
  files_modified: 8
requirements_satisfied:
  - PATH-01
  - PATH-02 (production half)
---

# Phase 164 Plan 01: Legacy Stove Route Deletion & Path Alignment Summary

Delete the resurrected legacy `/api/stove/*` route tree and rewire every production-code reference to the canonical `/api/v1/thermorossi/*` tree.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete legacy /api/stove/ route tree | 55107c7f | 10 route files deleted |
| 2 | Rewrite STOVE_ROUTES in lib/routes.ts | a27912e7 | lib/routes.ts |
| 3 | Rewrite lib/commands/deviceCommands.tsx | e9dd2305 | lib/commands/deviceCommands.tsx |
| 4 | Rewrite app/sw.ts three-category stove references | 83cd3aa8 | app/sw.ts |
| 5 | Rewrite both debug panel StoveTab.tsx files | 449831c5 | 2 StoveTab.tsx files |
| 6 | Update JSDoc-only references (3 files) | 7af4ce0b | 3 files |

## Files Deleted

The `app/api/stove/` directory and all 10 route files were removed:
- getFan, getPower, health, history, ignite, setFan, setPower, setWaterTemperature, shutdown, status (each with route.ts)

Canonical `/api/v1/thermorossi/` tree was confirmed intact (7 directories) before and after deletion.

## Files Modified (8 files)

### lib/routes.ts
All 7 `STOVE_ROUTES` keys updated to canonical paths. Key names preserved so hook consumers (useStoveData, useStoveCommands) transitively update without changes. UI page routes in `STOVE_UI_ROUTES` (`/stove`, `/stove/scheduler`, etc.) are separate constants and were not touched.

### lib/commands/deviceCommands.tsx
`executeStoveAction` refactored from `(endpoint: string)` to `(path: string, method: string = 'POST', body: Record<string, unknown> = {})`. GET requests omit body. Five stove command handlers updated:
- ignite: POST `/api/v1/thermorossi/commands/ignit`
- shutdown: POST `/api/v1/thermorossi/commands/shutdown`
- power-up/down: GET `/api/v1/thermorossi/power` then POST `/api/v1/thermorossi/settings/power` with `{ value }`
- fan-up/down: GET `/api/v1/thermorossi/fan-level` then POST `/api/v1/thermorossi/settings/fan-level` with `{ value }`

### app/sw.ts
Four targeted edits with Category C identifiers preserved byte-identical:
- Category A (URL literals): `/api/stove/status` → `/api/v1/thermorossi/status` (2 locations: fetch matcher + periodic sync fetch)
- Category B (notification fragment): `'stove/shutdown'` → `'v1/thermorossi/commands/shutdown'` (2 locations: executeNotificationAction + switch case)
- Category C preserved: `stove-command-sync`, `check-stove-status`, `stove-shutdown`, `stove-error`

### app/debug/components/tabs/StoveTab.tsx and app/debug/api/components/tabs/StoveTab.tsx
Both files fully rewritten. 45 canonical URL references each, 0 legacy references. All 10 action segment mappings applied per canonical path table. POST bodies already used `{ value }` — no `{ level }` found in either file.

### types/api/responses.ts, lib/hooks/useRetryableCommand.ts, lib/retry/idempotencyManager.ts
JSDoc comment updates only. No runtime code changes. `lib/version.ts` untouched per D-06.

## Deviations from Plan

### Auto-resolved: Assumption A1 — response field name

**Found during:** Task 3 (deviceCommands.tsx)

**Issue:** Plan said "if the canonical field is NOT `Result`, replace `statusData?.Result`." The canonical field is NOT `Result`.

**Investigation:** Read `types/thermorossiProxy.ts`:
- `ThermorossiPowerResponse.power_level` (not `Result`)
- `ThermorossiFanResponse.fan_level` (not `Result`)

The API route's `success()` helper spreads the proxy response directly into the JSON body, so the client-side field names are `power_level` and `fan_level`.

**Fix:** Used `statusData?.power_level ?? 3` and `statusData?.fan_level ?? 3` in the four read-before-write handlers.

**Files modified:** lib/commands/deviceCommands.tsx

**Commit:** e9dd2305

### Confirmed: Assumption A2 — Serwist cache invalidation

Serwist is configured with content-hash precache manifest (default `@serwist/next` behavior — no `additionalPrecacheEntries` with stable revisions). The sw.ts file edit automatically changes the precache hash, forcing SW update on next deploy. No explicit `SW_CACHE_VERSION` bump was added.

### No unmapped debug panel segments encountered

All action segments in both StoveTab.tsx files appeared in the mapping table. No unknown segments found.

## Category C SW Identifiers Preserved

Verified byte-identical after edits:
- `const SYNC_TAG = 'stove-command-sync'` — 1 occurrence
- `const PERIODIC_SYNC_TAG = 'check-stove-status'` — 1 occurrence  
- `NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN = 'stove-shutdown'` — 1 occurrence
- `tag: 'stove-error'` in showNotification — 1 occurrence

## Test Files Status

4 test files still reference legacy paths — retargeted by Plan 02. Per plan instructions, no test fixes were attempted in this plan.

## Wave 1 Gate Results

All gates pass:

```
PATH-01: app/api/stove/ deleted — PASS
STOVE_ROUTES /v1/thermorossi/ count: 7 — PASS (expect 7)
deviceCommands /api/stove/ count: 0 — PASS (expect 0)
SW /api/v1/thermorossi/status count: 2 — PASS (expect >=2)
SW v1/thermorossi/commands/shutdown count: 2 — PASS (expect >=2)
debug/components StoveTab canonical refs: 45 — PASS (expect >=40)
debug/api StoveTab canonical refs: 45 — PASS (expect >=40)
JSDoc /api/stove/ total: 0 — PASS (expect 0)
stove-command-sync: 1 — PASS (expect 1)
check-stove-status: 1 — PASS (expect 1)
```

## Self-Check: PASSED

Files exist:
- lib/routes.ts — FOUND
- lib/commands/deviceCommands.tsx — FOUND
- app/sw.ts — FOUND
- app/debug/components/tabs/StoveTab.tsx — FOUND
- app/debug/api/components/tabs/StoveTab.tsx — FOUND
- types/api/responses.ts — FOUND
- lib/hooks/useRetryableCommand.ts — FOUND
- lib/retry/idempotencyManager.ts — FOUND

Commits verified:
- 55107c7f — FOUND
- a27912e7 — FOUND
- e9dd2305 — FOUND
- 83cd3aa8 — FOUND
- 449831c5 — FOUND
- 7af4ce0b — FOUND
