---
phase: 183-v20-hygiene-cleanup
plan: 01
subsystem: infra
tags: [cleanup, dead-code, orphans, barrel-exports]

# Dependency graph
requires:
  - phase: 181-nav-glass
    provides: "BottomTabBar replaces legacy Navbar.tsx (made it orphan)"
  - phase: 176-splash-animation
    provides: "lib/hooks/useReducedMotion.ts as canonical reduced-motion hook (made app/hooks variant orphan)"
provides:
  - "4 confirmed-orphan source files removed from disk (Navbar.tsx, ui/Footer.tsx, automations/page.tsx, app/hooks/useReducedMotion.ts)"
  - "2 orphaned test files removed (Navbar.test.tsx, app/hooks/__tests__/useReducedMotion.test.ts)"
  - "ui/index.ts barrel cleaned of Footer re-export"
  - "Clean baseline for v20.1 follow-up: legacy /debug/design-system retirement + IntervalBottomSheet rewrite (deferred per RESEARCH §Truth Table)"
affects: [v20.1-legacy-design-system-retirement, v20.0-milestone-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-deletion grep gate: verify zero importers (excluding worktrees + own __tests__) before any git rm"
    - "Source+test paired deletion: when source file is removed, its colocated test in __tests__/ folder must be removed in the same task to keep test:changed green (Pitfall §5 pattern)"

key-files:
  created: []
  modified:
    - "app/components/ui/index.ts (removed Footer re-export line)"
  deleted:
    - "app/components/Navbar.tsx (732 LOC pre-glass chrome, 0 importers)"
    - "app/components/__tests__/Navbar.test.tsx (orphaned by Navbar.tsx deletion)"
    - "app/components/ui/Footer.tsx (0 importers post-grep verification)"
    - "app/automations/page.tsx (legacy /automations route, replaced by /automazioni)"
    - "app/hooks/useReducedMotion.ts (68 LOC duplicate; lib/hooks variant retained)"
    - "app/hooks/__tests__/useReducedMotion.test.ts (orphaned by useReducedMotion.ts deletion — Pitfall §5)"

key-decisions:
  - "Deferred ui/Sheet.tsx + ui/BottomSheet.tsx deletion to follow-up phase per RESEARCH §Truth Table (live importers in /debug/design-system + scheduler IntervalBottomSheet)"
  - "Deleted app/hooks/__tests__/useReducedMotion.test.ts as Rule 3 auto-fix (not in plan must_haves but blocks test:changed if left orphaned)"
  - "Compound Footer-named exports (CardFooter, SheetFooter, PageFooter) retained — unrelated to deleted standalone Footer component"

patterns-established:
  - "Source+test paired deletion: orphaned tests must be deleted alongside their source (mirrors Phase 181 nav-glass migration pattern)"

requirements-completed: []  # Phase 183 plan has no REQ-IDs (hygiene phase)

# Metrics
duration: 4min
completed: 2026-05-03
---

# Phase 183 Plan 01: v20.0 Orphan Cleanup Summary

**Deleted 6 orphan files (4 source + 2 tests) and cleaned ui barrel of Footer re-export — closing v20.0 milestone audit tech_debt #1 partially (4-of-6 deletions, with 2 deferred to follow-up phase per grep evidence).**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-03T16:15:58Z
- **Completed:** 2026-05-03T16:18:20Z
- **Tasks:** 3 / 3
- **Files modified:** 1 (ui/index.ts)
- **Files deleted:** 6 (4 source + 2 tests)

## Accomplishments

- Removed pre-glass `Navbar.tsx` chrome (732 LOC) along with its now-orphan test
- Removed `ui/Footer.tsx` and cleaned its re-export from `ui/index.ts:17`
- Removed legacy `/automations` route page (replaced by `/automazioni` per BottomTabBar in Phase 181)
- Removed duplicate `app/hooks/useReducedMotion.ts` (68 LOC) and its test — `lib/hooks/useReducedMotion.ts` retained as the canonical hook used by `SplashGate`
- All deletions preceded by grep gates confirming zero non-self importers
- Scoped test verification (`npm run test:changed`) green; SplashGate test sanity-run 9/9 passing

## Task Commits

Each task was committed atomically (all `chore` per CLAUDE.md no-feature-flag convention):

1. **Task 1: Delete Navbar.tsx + Navbar.test.tsx** — `5b4c19b9` (chore)
2. **Task 2: Delete Footer.tsx + clean ui barrel** — `f91cdf58` (chore)
3. **Task 3: Delete automations/page.tsx + app/hooks/useReducedMotion.ts (+ orphaned test)** — `087aa8b9` (chore)

**Plan metadata commit:** to follow (this SUMMARY + STATE + ROADMAP updates).

## Files Deleted

- `app/components/Navbar.tsx` — pre-glass mobile/desktop nav, replaced by BottomTabBar in Phase 181
- `app/components/__tests__/Navbar.test.tsx` — orphaned test (would fail to resolve `../Navbar`)
- `app/components/ui/Footer.tsx` — pre-glass page footer; zero consumers
- `app/automations/page.tsx` — legacy `/automations` route; BottomTabBar uses `/automazioni`
- `app/hooks/useReducedMotion.ts` — duplicate hook (68 LOC); `lib/hooks/useReducedMotion.ts` (32 LOC, used by SplashGate) retained
- `app/hooks/__tests__/useReducedMotion.test.ts` — orphaned test (imports `../useReducedMotion`)

## Files Modified

- `app/components/ui/index.ts` — removed line `export { default as Footer } from './Footer';` (line 17 in pre-edit state)

## Decisions Made

1. **Scope reduction (4-of-6 deletions, not 6):** RESEARCH.md §Truth Table verified that `app/components/ui/Sheet.tsx` and `app/components/ui/BottomSheet.tsx` have **live importers** in production code:
   - `Sheet.tsx`: imported by `app/debug/design-system/page.tsx:35` (legacy debug route still linked from `app/debug/page.tsx`)
   - `BottomSheet.tsx`: imported by `app/components/scheduler/IntervalBottomSheet.tsx:4` (production scheduler) + the same legacy debug route
   - Deleting either would break the legacy debug route + scheduler interval picker. The audit's "orphan list" was inaccurate for these two files.
   - **Resolution:** Deferred to follow-up phase (`legacy-design-system-retirement` + `IntervalBottomSheet` rewrite). Logged below as tech_debt rollover.

2. **Source+test paired deletion (Pitfall §5 pattern):** Two test files were deleted alongside their sources:
   - `app/components/__tests__/Navbar.test.tsx` — explicitly listed in plan must_haves
   - `app/hooks/__tests__/useReducedMotion.test.ts` — **NOT in plan must_haves**, discovered during Task 3 grep gate. Applied Rule 3 auto-fix because leaving it would break `npm run test:changed` (`Cannot find module '../useReducedMotion'`).

3. **Compound Footer exports retained:** `CardFooter`, `SheetFooter`, `PageFooter`, and their type aliases remain in `ui/index.ts`. They are unrelated to the deleted `Footer` component and have live consumers. The plan's acceptance criterion `grep -c "Footer" app/components/ui/index.ts == 0` was overly strict; the operative criterion is `grep -c "from './Footer'" == 0`, which is satisfied (0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Deleted orphaned `app/hooks/__tests__/useReducedMotion.test.ts`**
- **Found during:** Task 3 (Gate 3 grep — searching for `useReducedMotion` references)
- **Issue:** The test file imports `from '../useReducedMotion'`. Once the source is deleted, Jest cannot resolve the import and `npm run test:changed` would go red. The plan's must_haves list and `<read_first>` block did not mention this file.
- **Fix:** Added `git rm app/hooks/__tests__/useReducedMotion.test.ts` to the same Task 3 deletion batch. This mirrors the Pitfall §5 pattern from RESEARCH.md (which explicitly called out the same scenario for Navbar.test.tsx in Task 1).
- **Files modified:** 1 deletion (test file only)
- **Verification:** `npm run test:changed` post-deletion: passed (no related tests). Sanity-run `npx jest app/components/EmberGlass/__tests__/SplashGate.test.tsx`: 9/9 passing (confirms `lib/hooks/useReducedMotion.ts` consumer is unaffected).
- **Committed in:** `087aa8b9` (Task 3 commit, alongside the source deletions)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Strictly necessary to keep test suite green. Discovered during a grep gate that the plan correctly mandated, then handled per the same pattern the plan applied to Navbar.test.tsx in Task 1 — so the deviation is a consistency repair, not scope creep.

### Scope Deviation from ROADMAP Success Criterion #1

ROADMAP §"Phase 183" Success Criterion #1 listed 6 files for deletion. This plan executed **4 deletions (not 6)** per RESEARCH §Truth Table grep evidence:

| File | ROADMAP claim | Actual state | Disposition |
|------|---------------|--------------|-------------|
| `app/components/Navbar.tsx` | orphan | orphan (verified) | DELETED ✓ |
| `app/components/ui/Footer.tsx` | orphan | orphan (verified) | DELETED ✓ |
| `app/automations/page.tsx` | orphan | orphan (verified) | DELETED ✓ |
| `app/hooks/useReducedMotion.ts` | orphan | orphan (verified) | DELETED ✓ |
| `app/components/ui/Sheet.tsx` | orphan | **HAS LIVE IMPORTERS** | **DEFERRED** |
| `app/components/ui/BottomSheet.tsx` | orphan | **HAS LIVE IMPORTERS** | **DEFERRED** |

This deviation was anticipated and pre-justified by RESEARCH.md (research date 2026-05-03, evidence: grep on production tree). The plan body explicitly drops these two from the deletion set.

## Tech Debt Rollover

The following items remain after this plan and should be addressed in a follow-up phase (suggested name: `legacy-design-system-retirement`, target milestone: v20.1 hygiene):

1. **Retire `app/debug/design-system/page.tsx`** — legacy `/debug/design-system` route still linked from:
   - `app/debug/page.tsx:365`
   - `lib/devices/deviceTypes.ts:401`
   - `lib/version.ts:618`
   - 3 entries in `docs/INDEX.md` and related docs
   Once retired, `app/components/ui/Sheet.tsx` becomes deletable.

2. **Rewrite `app/components/scheduler/IntervalBottomSheet.tsx`** — currently imports `app/components/ui/BottomSheet.tsx`. Migrating it to the EmberGlass `Sheet` primitive (`app/components/EmberGlass/Sheet.tsx` from Phase 175) unblocks deletion of the legacy `BottomSheet.tsx`.

3. **Compound `Footer`-named export hygiene (optional):** `CardFooter`, `SheetFooter`, `PageFooter` are unrelated to the deleted standalone `Footer` and remain valid. No action needed unless their parent components are themselves retired.

## Issues Encountered

- **Heredoc apostrophe escaping:** First attempt at the Task 3 commit message contained `plan's must_haves`, which broke the bash heredoc. Resolved by removing the apostrophe in the retry. No code impact.

## Next Phase Readiness

- v20.0 milestone audit tech_debt #1 partially closed (4-of-6 — the achievable subset given grep-verified live importers).
- Plan 02 of Phase 183 (REQUIREMENTS.md flips) is unblocked.
- The clean baseline (no orphan production files, no orphan tests) means subsequent v20.0 hygiene plans operate on a known-good test surface.

## Self-Check: PASSED

**File deletions verified:**
- DELETED: `app/components/Navbar.tsx`
- DELETED: `app/components/__tests__/Navbar.test.tsx`
- DELETED: `app/components/ui/Footer.tsx`
- DELETED: `app/automations/page.tsx`
- DELETED: `app/hooks/useReducedMotion.ts`
- DELETED: `app/hooks/__tests__/useReducedMotion.test.ts`

**Kept files verified:**
- KEPT: `lib/hooks/useReducedMotion.ts` (canonical hook used by SplashGate)

**Barrel cleanup verified:**
- `grep -c "from './Footer'" app/components/ui/index.ts` = 0

**Commits verified:**
- FOUND: `5b4c19b9` (Task 1)
- FOUND: `f91cdf58` (Task 2)
- FOUND: `087aa8b9` (Task 3)

**Test gate verified:**
- `npm run test:changed`: passes (no tests touched by pure deletions)
- `npx jest app/components/EmberGlass/__tests__/SplashGate.test.tsx`: 9/9 passing (kept hook consumer)

---
*Phase: 183-v20-hygiene-cleanup*
*Completed: 2026-05-03*
