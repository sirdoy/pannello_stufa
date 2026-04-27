---
phase: 164-phase-156-regression-fix
verified: 2026-04-15T14:30:00Z
status: passed
score: 4/4
overrides_applied: 0
---

# Phase 164: Phase 156 Regression Fix — Verification Report

**Phase Goal:** Legacy /api/stove/* surface fully removed; all frontend consumers (routes constants, service worker, command palette, debug panels, tests) target canonical /api/v1/thermorossi/*
**Verified:** 2026-04-15T14:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `app/api/stove/` directory no longer exists and no file references `/api/stove/` outside archived planning docs | VERIFIED | `test ! -d app/api/stove` exits 0; repo-wide grep across app/ lib/ __tests__ returns 0 (excluding lib/version.ts); 2 historical refs in lib/version.ts preserved per D-06 |
| 2 | `lib/routes.ts` STOVE_ROUTES, `app/sw.ts`, and `lib/commands/deviceCommands.tsx` all point to `/api/v1/thermorossi/*` with camelCase action paths and `{ value }` body shape | VERIFIED | STOVE_ROUTES has 7 canonical entries, zero legacy; sw.ts has 2 status refs + 2 shutdown refs, zero legacy; deviceCommands.tsx uses `{ value: currentPower/Fan +/- 1 }` with field names `power_level`/`fan_level` |
| 3 | Both StoveTab debug panels (45 refs each) rewritten to canonical paths | VERIFIED | `app/debug/components/tabs/StoveTab.tsx` = 45 canonical refs, 0 legacy; `app/debug/api/components/tabs/StoveTab.tsx` = 45 canonical refs, 0 legacy |
| 4 | Legacy stove test files deleted or retargeted; Jest + smoke suite green | VERIFIED | All 4 test files retargeted — useStoveData (1 ref), useStoveCommands (9 refs), idempotencyManager (19 refs), useRetryableCommand (12 refs) — all 0 legacy refs; SUMMARY reports 12 suites, 185 tests green |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/routes.ts` | STOVE_ROUTES canonical constants containing `/v1/thermorossi/` | VERIFIED | 7 canonical entries, 0 legacy `/stove/`, `as const` preserved |
| `lib/commands/deviceCommands.tsx` | Command palette stove actions with canonical paths | VERIFIED | 0 `/api/stove/` refs; `executeStoveAction(path, method, body)` signature; `{ value }` body on settings POSTs |
| `app/sw.ts` | SW URL matchers + notification action canonical | VERIFIED | 2x `/api/v1/thermorossi/status`, 2x `v1/thermorossi/commands/shutdown`, 0 legacy; all 4 Category C identifiers preserved |
| `app/debug/components/tabs/StoveTab.tsx` | Debug panel (components tab) canonical | VERIFIED | 45 canonical refs, 0 legacy |
| `app/debug/api/components/tabs/StoveTab.tsx` | Debug panel (api tab) canonical | VERIFIED | 45 canonical refs, 0 legacy |
| `__tests__/.../useStoveData.test.ts` | Status fetch assertion canonical | VERIFIED | 0 legacy, 1 canonical status ref |
| `__tests__/.../useStoveCommands.test.ts` | Command fetch assertions canonical | VERIFIED | 0 legacy, 9 canonical refs |
| `lib/retry/__tests__/idempotencyManager.test.ts` | Cache-key fixtures canonical | VERIFIED | 0 legacy, 19 canonical refs |
| `lib/hooks/__tests__/useRetryableCommand.test.ts` | Retry path inputs canonical | VERIFIED | 0 legacy, 12 canonical refs |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/components/devices/stove/hooks/useStoveData.ts` | `/api/v1/thermorossi/status` | `STOVE_ROUTES.status` indirection | WIRED | Import confirmed at line 18, usage at line 243 |
| `app/components/devices/stove/hooks/useStoveCommands.ts` | `/api/v1/thermorossi/commands/ignit` and `/shutdown` | `STOVE_ROUTES.ignite` / `STOVE_ROUTES.shutdown` | WIRED | Import at line 23; ignite at line 99, shutdown at line 124 |
| `lib/commands/deviceCommands.tsx` | `/api/v1/thermorossi/settings/(power\|fan-level)` | `executeStoveAction(path, 'POST', { value })` | WIRED | Direct path literals; `{ value: currentPower/Fan +/-1 }` confirmed |
| `app/sw.ts` (notification click handler) | `/api/v1/thermorossi/commands/shutdown` | `executeNotificationAction('v1/thermorossi/commands/shutdown', ...)` | WIRED | 2 occurrences confirmed: notification action + switch case |

### Data-Flow Trace (Level 4)

Not applicable — this phase is a path alignment/cleanup with no new dynamic data rendering. All existing data flows were validated at the hook level: STOVE_ROUTES constants now resolve to canonical paths, so hooks transitively target the correct endpoints.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| PATH-01: legacy dir deleted | `test ! -d app/api/stove` | exits 0 | PASS |
| Canonical tree intact | `ls app/api/v1/thermorossi/ \| wc -l` | 7 directories | PASS |
| STOVE_ROUTES all canonical | `grep -c "/v1/thermorossi/" lib/routes.ts` | 7 | PASS |
| STOVE_ROUTES no legacy | `grep -c "/api/stove/" lib/routes.ts` | 0 | PASS |
| SW canonical status refs | `grep -c "/api/v1/thermorossi/status" app/sw.ts` | 2 | PASS |
| SW canonical shutdown refs | `grep -c "v1/thermorossi/commands/shutdown" app/sw.ts` | 2 | PASS |
| SW no legacy refs | `grep -c "/api/stove/" app/sw.ts` | 0 | PASS |
| SW Category C preserved | `stove-command-sync`, `check-stove-status`, `stove-shutdown`, `stove-error` | 1 each | PASS |
| Debug components StoveTab canonical | `grep -c "/api/v1/thermorossi/" app/debug/components/.../StoveTab.tsx` | 45 | PASS |
| Debug api StoveTab canonical | `grep -c "/api/v1/thermorossi/" app/debug/api/.../StoveTab.tsx` | 45 | PASS |
| Repo-wide sweep (excl. lib/version.ts) | `grep -rn '/api/stove/' app/ lib/ __tests__/ ... \| wc -l` | 0 | PASS |
| Historical changelog preserved | `grep -c '/api/stove/' lib/version.ts` | 2 (intentional) | PASS |
| All commits verified | `git cat-file -e <hash>` x10 | all present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PATH-01 | 164-01 | Legacy /api/stove/ directory deleted from repo | SATISFIED | Directory does not exist; 10 route files deleted per git commit 55107c7f |
| PATH-02 | 164-01, 164-02 | All frontend references and tests use canonical /api/v1/thermorossi/* paths | SATISFIED | Production code: routes, SW, command palette, debug panels — all verified canonical; Tests: 4 files retargeted, repo-wide sweep returns 0 |

### Anti-Patterns Found

None. Scanned all modified files:
- No TODO/FIXME/placeholder comments introduced
- No stub implementations — all changes are path-alignment mechanical edits
- `{ level }` body key fully replaced by `{ value }` in deviceCommands.tsx (confirmed via grep)
- No hardcoded empty data

### Human Verification Required

None. All phase deliverables are mechanically verifiable via filesystem checks and grep patterns. The phase is a path cleanup with no new UI, rendering behavior, or external service integration that would require human eyes.

### Gaps Summary

No gaps. All 4 ROADMAP success criteria verified against the actual codebase. The phase achieved its stated goal: the legacy `/api/stove/` surface is fully removed, and every frontend consumer targets canonical `/api/v1/thermorossi/*` paths with the correct body shape.

---

_Verified: 2026-04-15T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
