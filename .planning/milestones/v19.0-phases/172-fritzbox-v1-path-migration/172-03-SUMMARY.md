---
phase: 172-fritzbox-v1-path-migration
plan: 03
subsystem: api
tags: [fritzbox, path-migration, v1, pages, debug, verification]

# Dependency graph
requires:
  - phase: 172-fritzbox-v1-path-migration
    plan: 01
    provides: app/api/v1/fritzbox/** — 28 production routes at canonical v1 path
  - phase: 172-fritzbox-v1-path-migration
    plan: 02
    provides: All 17 Fritz!Box consumer hooks fetch from /api/v1/fritzbox/*
provides:
  - app/network/page.tsx category-override POST routed to /api/v1/fritzbox/category-override
  - app/registry/devices/page.tsx devices GET routed to /api/v1/fritzbox/devices
  - app/debug/components/tabs/NetworkTab.tsx fully aligned to /api/v1/fritzbox/* (37 sites)
  - Route tree JSDoc + test Request() URLs updated to /api/v1/fritzbox/* (46 files)
  - Repo-wide grep guardrail: zero /api/fritzbox/ refs in *.ts/*.tsx (ROADMAP SC-4)
  - Jest: 20 co-located route suites (107 tests) + test:api (7 suites, 68 tests) + test:components (1 suite, 10 tests) all green
  - Playwright smoke: 17 specs discoverable including /telefonia, /network, /debug, /registry routes
affects: [phase-gate for /gsd-verify-work 172-fritzbox-v1-path-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route tree JSDoc/test URL sweep: after git mv, route.ts JSDoc comments and new Request() URLs in test files also need s|/api/fritzbox/|/api/v1/fritzbox/|g treatment"
    - "Guardrail grep scope: --include='*.ts' --include='*.tsx' --exclude-dir='.next' catches production code while leaving docs untouched (Pitfall 6)"

key-files:
  created: []
  modified:
    - app/network/page.tsx
    - app/registry/devices/page.tsx
    - app/debug/components/tabs/NetworkTab.tsx
    - app/api/v1/fritzbox/ (46 route.ts + test files — JSDoc + Request URL update)

key-decisions:
  - "Route tree JSDoc + test Request URLs needed sweeping: git mv in Plan 01 preserved file content unchanged; all JSDoc comments and new Request() URL arguments in 28 route.ts + 20 test files still referenced /api/fritzbox/ — swept in a separate fix commit d0865bd4"
  - "grep guardrail scoped to *.ts/*.tsx only: docs/setup/fritzbox-setup.md has stale .js filesystem-listing context (out of scope per Pitfall 6); .next/ excluded (Pitfall 7)"
  - "NetworkTab.tsx counted 46 v1 refs after sweep (plan said ~37): difference explained by lines containing multiple URL strings; both counts are valid — zero legacy refs is the success criterion"

patterns-established:
  - "Pattern: after git mv of a route tree, sweep the moved files for JSDoc + new Request() URL strings — they travel with git mv but their content remains unchanged"

requirements-completed: [FRITZ-01, FRITZ-02, FRITZ-03, FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07]

# Metrics
duration: 28min
completed: 2026-04-24
---

# Phase 172 Plan 03: Fritz!Box v1 Path Migration (Verification & Final Sweep) Summary

**Final consumer surface sweep (pages + debug panel) + route tree JSDoc fix + repo-wide grep guardrail proving zero /api/fritzbox/ refs in production *.ts/*.tsx — ROADMAP SC-4 satisfied**

## Performance

- **Duration:** 28 min
- **Started:** 2026-04-24T14:29:50Z
- **Completed:** 2026-04-24T14:57:54Z
- **Tasks:** 3 (all executed)
- **Files modified:** 49 (3 consumer files + 46 route tree files)

## Accomplishments

- app/network/page.tsx, app/registry/devices/page.tsx retargeted (1 URL each)
- app/debug/components/tabs/NetworkTab.tsx retargeted (37 URL sites, all /api/v1/fritzbox/*)
- Route tree JSDoc comments + new Request() URL strings in 28 route.ts + 20 test files updated to v1 paths (gap from Plan 01 git mv)
- Repo-wide grep guardrail: `grep -rn "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=".next" --exclude-dir="node_modules"` produces zero output
- Jest verification: 20 route suites (107 tests), test:api 7 suites (68 tests), test:components 1 suite (10 tests) — all green
- Playwright smoke: 17 specs discovered including all 4 Fritz-consuming routes (/telefonia, /network, /debug, /registry/devices)

## Task Commits

Each task was committed atomically:

1. **Task 1: Retarget pages and debug NetworkTab** - `2dbd1b8b` (refactor)
2. **Task 2: Repo-wide grep guardrail** - verification-only (no commit) + deviation fix `d0865bd4` (fix)
3. **Task 3: Final scoped Jest subsets + Playwright smoke** - verification-only (no commit)

## Files Created/Modified

Consumer files (Task 1):
- `app/network/page.tsx` — category-override POST URL: `/api/fritzbox/` → `/api/v1/fritzbox/`
- `app/registry/devices/page.tsx` — devices GET URL: `/api/fritzbox/` → `/api/v1/fritzbox/`
- `app/debug/components/tabs/NetworkTab.tsx` — 37 URL occurrences swept to `/api/v1/fritzbox/`

Route tree fix (deviation d0865bd4):
- `app/api/v1/fritzbox/**/*.ts` (28 route.ts files) — JSDoc comments updated
- `app/api/v1/fritzbox/**/*.test.ts` (20 test files) — new Request() URL arguments updated

## Decisions Made

- Route tree JSDoc + test Request URL sweep added as auto-fix deviation: Plan 01 used `git mv` which preserves content unchanged; all 28 route.ts + 20 test files still had `/api/fritzbox/` in documentation strings and `new Request('http://localhost:3000/api/fritzbox/...')` in test fixtures. These were swept via `find ... -exec sed ... {}` to satisfy the grep guardrail.
- grep guardrail scoped to `*.ts`/`*.tsx` only (Pitfall 6): `docs/setup/fritzbox-setup.md` has stale filesystem-listing context not applicable to production code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Coverage] Route tree JSDoc and test Request URLs not updated by Plan 01 git mv**
- **Found during:** Task 2 (Repo-wide grep guardrail)
- **Issue:** `grep -rn "/api/fritzbox/" app/ --include="*.ts" --include="*.tsx"` returned 100 matches across 46 files, all within `app/api/v1/fritzbox/`. The `git mv` in Plan 01 moved files without altering their content — JSDoc comment strings (`* GET /api/fritzbox/...`) and `new Request('http://localhost:3000/api/fritzbox/...')` arguments in test files still referenced the old path. These are documentation strings and test infrastructure (not functional fetch URLs) but they prevent the grep guardrail from passing.
- **Fix:** `find app/api/v1/fritzbox/ -name "*.ts" -exec grep -l "/api/fritzbox/" {} \; | xargs sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g'` — swept all 46 affected files in one pass.
- **Files modified:** 28 route.ts + 20 test files in app/api/v1/fritzbox/ tree
- **Verification:** `grep -rn "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=".next" --exclude-dir="node_modules"` returns 0 matches
- **Committed in:** `d0865bd4` (fix(172-03): update JSDoc + test Request URLs in route tree to v1 paths)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing coverage from Plan 01 gap)
**Impact on plan:** Fix essential for ROADMAP SC-4 satisfaction. No scope creep — purely completing the URL string sweep across all production *.ts/*.tsx files as the success criterion requires.

## Verification Results

### Task 1 Acceptance Criteria

| Check | Result |
|-------|--------|
| `grep -n "/api/fritzbox/" app/network/page.tsx` | 0 matches |
| `grep -n "/api/fritzbox/" app/registry/devices/page.tsx` | 0 matches |
| `grep -n "/api/fritzbox/" app/debug/components/tabs/NetworkTab.tsx` | 0 matches |
| `grep -c "/api/v1/fritzbox/" app/debug/components/tabs/NetworkTab.tsx` | 46 (≥30 threshold met) |
| `grep -q "/api/v1/fritzbox/category-override" app/network/page.tsx` | MATCH (line 147) |
| `grep -q "/api/v1/fritzbox/devices" app/registry/devices/page.tsx` | MATCH (line 164) |
| `git diff HEAD~2 HEAD --stat` | 49 files, 139+/139- (symmetric URL swap) |

### Task 2: Repo-Wide Guardrail (ROADMAP SC-4)

```
grep -rn "/api/fritzbox/" app/ lib/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=".next" --exclude-dir="node_modules"
```

**Result: empty output — GUARDRAIL PASSED**

### Task 3: Jest Verification

| Suite | Tests | Result |
|-------|-------|--------|
| `npm test -- app/api/v1/fritzbox/` | 107 (20 suites) | PASS |
| `npm run test:api` | 68 (7 suites) | PASS |
| `npm run test:components` | 10 (1 suite) | PASS |

### Task 3: Playwright Smoke

```
npx playwright test tests/smoke/page-loads.spec.ts --list
```

**Result: 17 tests in 2 files discovered**

Fritz-consuming routes confirmed discoverable:
- `/telefonia` → `Fritz!Box Consumer UI (Phase 171) › /telefonia loads and renders heading`
- `/network` → `Fritz!Box Consumer UI (Phase 171) › /network Storico grezzo tab renders sub-sections`
- `/debug` → `Support Pages › /debug loads`
- `/registry/devices` → covered by registry nav specs

No dev server available; discoverability confirmed per Phase 171 accepted approach.

### Phase 172 Requirements Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| FRITZ-01: GET /api/v1/fritzbox/telephony/dect | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |
| FRITZ-02: GET /api/v1/fritzbox/telephony/calls | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |
| FRITZ-03: GET /api/v1/fritzbox/telephony/tam | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |
| FRITZ-04: GET /api/v1/fritzbox/history/bandwidth | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |
| FRITZ-05: GET /api/v1/fritzbox/history/devices | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), 404-graceful preserved |
| FRITZ-06: GET /api/v1/fritzbox/history/device-events | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |
| FRITZ-07: GET /api/v1/fritzbox/service-discovery | SATISFIED | Route at v1 path (Plan 01), hook retargeted (Plan 02), tests green |

All 7 FRITZ-XX requirements satisfied end-to-end. Phase 172 complete.

## Known Stubs

None.

## Threat Flags

None — pure URL string rename. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Issues Encountered

Grep guardrail initially returned 100 matches in route tree files (JSDoc + test Request URLs missed by Plan 01 git mv). Fixed via deviation d0865bd4. See Deviations section.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 172 is complete: all 7 FRITZ-XX requirements satisfied, ROADMAP SC-4 met
- All 3 plans committed: Plan 01 (4b9d7737), Plan 02 (deacade4), Plan 03 (2dbd1b8b + d0865bd4)
- Ready for `/gsd-verify-work 172-fritzbox-v1-path-migration`
- Fritz!Box is now the final provider aligned to /api/v1/{provider}/* canonical path: thermorossi, hue, sonos, netatmo, dirigera, raspi, fritzbox — all unified

---
*Phase: 172-fritzbox-v1-path-migration*
*Completed: 2026-04-24*
