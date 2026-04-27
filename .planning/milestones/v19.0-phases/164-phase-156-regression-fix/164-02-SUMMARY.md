---
phase: 164
plan: "02"
subsystem: stove
tags: [thermorossi, path-alignment, test-retarget, regression-fix, legacy-cleanup]
one_liner: "Retarget four test files from legacy /api/stove/* assertions to canonical /api/v1/thermorossi/* paths, completing the PATH-02 test half and achieving zero legacy refs repo-wide"
dependency_graph:
  requires:
    - PATH-01: legacy /api/stove/ directory deleted (Plan 01)
    - PATH-02 (production half): all frontend wiring aligned (Plan 01)
  provides:
    - PATH-02 (test half): all test assertions aligned to canonical paths
    - Phase exit gate: zero /api/stove/ refs in app/lib/components/__tests/ (excluding lib/version.ts)
  affects:
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
    - lib/retry/__tests__/idempotencyManager.test.ts
    - lib/hooks/__tests__/useRetryableCommand.test.ts
tech_stack:
  added: []
  patterns:
    - Mechanical string-literal replacement (no test structure changes)
    - Opaque cache-key discriminator swap in idempotency tests
key_files:
  created: []
  modified:
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
    - lib/retry/__tests__/idempotencyManager.test.ts
    - lib/hooks/__tests__/useRetryableCommand.test.ts
decisions:
  - "D-05 applied: ignite segment is 'ignit' (no trailing e) in all test assertions"
  - "D-06 confirmed: lib/version.ts untouched (historical changelog, 2 legacy refs intentionally preserved)"
  - "No { level } -> { value } body-key assertion updates needed (none found in any test file)"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-15"
  tasks_completed: 5
  tasks_total: 5
  files_modified: 4
requirements_satisfied:
  - PATH-02
---

# Phase 164 Plan 02: Test Path Retargeting Summary

Retarget the four test files that still asserted against legacy `/api/stove/*` paths to the canonical `/api/v1/thermorossi/*` tree, then run a final repo-wide grep sweep proving zero legacy references remain outside `lib/version.ts`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Retarget useStoveData test to canonical status path | 731d17bc | useStoveData.test.ts |
| 2 | Retarget useStoveCommands test to canonical command paths | f59d31c0 | useStoveCommands.test.ts |
| 3 | Retarget idempotencyManager test cache-key fixtures | 748c6eb2 | idempotencyManager.test.ts |
| 4 | Retarget useRetryableCommand test execute() inputs | ec448047 | useRetryableCommand.test.ts |
| 5 | Final repo-wide grep sweep + targeted Jest run | (verification only) | — |

## String Replacement Counts Per File

| File | Legacy refs removed | Canonical refs added | Segments replaced |
|------|---------------------|----------------------|-------------------|
| useStoveData.test.ts | 1 | 1 | `/api/stove/status` → `/api/v1/thermorossi/status` |
| useStoveCommands.test.ts | 9 | 9 | ignite(1), shutdown(1), setFan(1), setPower(1), status poll_endpoint(4 via replace_all), mockCommandResponse(1) |
| idempotencyManager.test.ts | 19 | 19 | ignite(8), shutdown(11) |
| useRetryableCommand.test.ts | 12 | 12 | ignite(12) |

## Final Repo-Wide Grep Sweep

Command:
```bash
grep -rn '/api/stove/' app/ lib/ components/ __tests__/ --include='*.ts' --include='*.tsx' | grep -v 'lib/version.ts' | wc -l
```

Output: **0**

Phase exit gate: PASS — zero `/api/stove/` references in production + test code outside `lib/version.ts`.

## Targeted Jest Run Results

Command:
```bash
npx jest --testPathPatterns="stove|idempotency|useRetryableCommand" --no-coverage
```

Result:
```
Test Suites: 12 passed, 12 total
Tests:       185 passed, 185 total
Time:        8.022 s
```

All 12 suites green, 185 tests passing.

## lib/version.ts Preservation (D-06)

```bash
grep -c '/api/stove/' lib/version.ts
# → 2
```

Historical changelog entries in `lib/version.ts` preserved unchanged per decision D-06.

## PATH-01 Filesystem Check

```
app/api/stove/ does not exist — PATH-01_OK
```

## Unexpected Legacy References

None found outside the planned file set. Every `/api/stove/` occurrence was in the four planned test files.

## Body Key Assertions ({ level } → { value })

No `{ level }` body-key assertions were found in any of the four test files. No updates of this type were needed.

## Deviations from Plan

None — plan executed exactly as written. All four files contained only the segments listed in the mapping table. No unmapped segments were encountered.

## Self-Check: PASSED

Files exist:
- __tests__/components/devices/stove/hooks/useStoveData.test.ts — FOUND
- __tests__/components/devices/stove/hooks/useStoveCommands.test.ts — FOUND
- lib/retry/__tests__/idempotencyManager.test.ts — FOUND
- lib/hooks/__tests__/useRetryableCommand.test.ts — FOUND

Commits verified:
- 731d17bc — FOUND
- f59d31c0 — FOUND
- 748c6eb2 — FOUND
- ec448047 — FOUND
