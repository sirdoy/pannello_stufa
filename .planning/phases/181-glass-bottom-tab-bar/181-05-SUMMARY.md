---
phase: 181-glass-bottom-tab-bar
plan: 05
subsystem: ui
tags: [next.js, app-router, layout, chrome, ember-glass, safe-area]

requires:
  - phase: 181-glass-bottom-tab-bar
    provides: BottomTabBar export (Plan 02), NavbarConnectionStatusChip (Plan 04)
provides:
  - app/layout.tsx wired to new bottom-tab-bar chrome
  - safe-area-aware <main> padding (top 12px, bottom 88px) so content clears chip + bar
  - <NavbarConnectionStatusChip /> mounted as sibling of <main>
  - <BottomTabBar /> mounted after </main>
  - legacy <Navbar /> + <Footer /> mounts removed (source files preserved on disk per D-04)
affects: [181-06 (Playwright smoke), 182 (cleanup of legacy Navbar.tsx + Footer.tsx)]

tech-stack:
  added: []
  patterns:
    - "Safe-area-aware padding via env(safe-area-inset-*) calc() to clear floating chrome"
    - "Atomic chrome swap pattern (4-line edit; legacy source files left on disk for bundled cleanup phase)"

key-files:
  created: []
  modified:
    - app/layout.tsx

key-decisions:
  - "Preserved legacy Navbar.tsx and ui/Footer.tsx source files on disk per CONTEXT D-04 — only the import + JSX lines in app/layout.tsx were touched, deferring source-file deletion to the post-Phase-182 cleanup bundle."
  - "Mounted <NavbarConnectionStatusChip /> BEFORE <main> and <BottomTabBar /> AFTER </main> so DOM order matches CONTEXT D-13 / PATTERNS.md exactly; both use position:fixed so visual stacking is unaffected."

patterns-established:
  - "Atomic chrome swap: import + JSX edits stay co-located in app/layout.tsx; legacy chrome source files persist until a deletion-only cleanup phase ships."

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04]

duration: 4min
completed: 2026-05-02
---

# Phase 181 Plan 05: Atomic Chrome Swap in app/layout.tsx Summary

**Atomic chrome swap that mounts BottomTabBar + NavbarConnectionStatusChip into app/layout.tsx, removes legacy Navbar/Footer mounts, and retunes <main> padding for safe-area + 88px bar clearance — all without touching the legacy chrome source files.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-02T21:20:32Z
- **Completed:** 2026-05-02T21:24:50Z
- **Tasks:** 2 (1 code edit + 1 verification-only smoke check)
- **Files modified:** 1 (app/layout.tsx)

## Accomplishments

- Removed legacy `import Navbar from './components/Navbar'` and `import { Footer } from './components/ui'` (source files untouched on disk per D-04).
- Added `import { BottomTabBar } from './components/EmberGlass'` and `import { NavbarConnectionStatusChip } from './components/layout/NavbarConnectionStatusChip'` alongside existing component imports.
- Replaced `<Navbar />` JSX mount with `<NavbarConnectionStatusChip />` as a sibling of `<main>` (CONTEXT D-13).
- Replaced `<Footer />` JSX mount with `<BottomTabBar />` after `</main>` (PATTERNS.md `app/layout.tsx (MOD)`).
- Retuned `<main>` className from `pt-2 pb-12 px-4 sm:px-6 lg:px-8` to `pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+88px)] px-4 sm:px-6 lg:px-8` (CONTEXT D-11).
- Preserved every unrelated mount and structural element (`<WebVitals />`, `<VersionEnforcer />`, `<AmbientBg />`, the skip-link `<a href="#main-content">`, the `<div className="max-w-7xl mx-auto">` wrapper, and `id="main-content"` on `<main>`).

## Task Commits

Each task was committed atomically (Task 2 was verification-only — no commit, no files modified):

1. **Task 181-05-01: Atomic edit of app/layout.tsx — swap legacy chrome for new chrome** — `9af864bb` (feat)
2. **Task 181-05-02: Smoke-check that all related test suites are still green after the layout swap** — verification-only, no commit (no files modified per task spec).

## Files Created/Modified

- `app/layout.tsx` — Swapped legacy `Navbar` + `Footer` imports/mounts for `BottomTabBar` + `NavbarConnectionStatusChip`; retuned `<main>` padding for safe-area + 88px bar clearance.

## Verification Results

All 14 acceptance grep gates on `app/layout.tsx` pass:

| Gate | Expected | Actual |
| --- | --- | --- |
| `grep -c "import Navbar from './components/Navbar'"` | 0 | 0 |
| `grep -E "import.*Footer.*from" \| wc -l` | 0 | 0 |
| `grep -c "import { BottomTabBar } from './components/EmberGlass'"` | 1 | 1 |
| `grep -c "NavbarConnectionStatusChip"` | >=2 | 2 |
| `grep -c "<BottomTabBar"` | >=1 | 1 |
| `grep -c "<NavbarConnectionStatusChip"` | >=1 | 1 |
| `grep -c "<Navbar />"` | 0 | 0 |
| `grep -c "<Footer />"` | 0 | 0 |
| `grep -q 'pt-\[calc(env(safe-area-inset-top)+12px)\]'` | OK | OK |
| `grep -q 'pb-\[calc(env(safe-area-inset-bottom)+88px)\]'` | OK | OK |
| `grep -c 'pt-2 pb-12'` | 0 | 0 |
| `[ -f app/components/Navbar.tsx ]` (D-04) | OK | OK |
| `[ -f app/components/ui/Footer.tsx ]` (D-04) | present | `app/components/ui/Footer.tsx` |

All 8 spec invocations from Task 181-05-02 pass:

1. `app/components/__tests__/Navbar.test.tsx` — PASS (legacy Navbar test, source unchanged per D-16).
2. `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` — PASS (legacy WS chip test).
3. `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` — PASS (Plan 02).
4. `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` — PASS (Plan 04).
5. `app/components/EmberGlass/__tests__/Sheet.test.tsx` — PASS (Plan 01).
6. `app/components/EmberGlass/__tests__/SheetCounter.test.ts` — PASS (Plan 01).
7. `app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx` — PASS (Plan 03).
8. `app/altro/__tests__/page.test.tsx` — PASS (Plan 03 route-level — invoked via direct `npx jest` because `npm run test:pages` glob is rooted at `__tests__/app` and does not match `app/altro/__tests__/`).

Aggregate: 8 suites passed, 67 tests passed (66 from the bundled `test:components` invocation + 1 from the standalone `app/altro/__tests__/page.test.tsx` run). Zero failures.

## Decisions Made

None beyond what the plan specified. All changes follow CONTEXT D-04 / D-11 / D-13 / D-16 and PATTERNS.md `app/layout.tsx (MOD)` verbatim.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- The `npm run test:pages` script in this repo is hardcoded to glob `__tests__/app --testPathIgnorePatterns=__tests__/app/components`, which does NOT match `app/altro/__tests__/page.test.tsx` (the real location of Plan 03's route-level spec). Resolved by invoking `npx jest app/altro/__tests__/page.test.tsx` directly. This is a test-tooling observation only; the spec itself passes and the Plan 05 acceptance criteria are met. No code change was made — this is documented here so a future tooling phase can decide whether to widen the `test:pages` glob.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- App shell now ships the new chrome end-to-end. Wave 4 (Playwright smoke spec) is unblocked.
- Cleanup phase (post-Phase-182) can now safely delete `app/components/Navbar.tsx`, `app/components/__tests__/Navbar.test.tsx`, `app/components/ui/Footer.tsx`, and any remaining `Footer` re-exports from `app/components/ui/index.ts` — they are no longer referenced by `app/layout.tsx`.
- No blockers.

## Self-Check: PASSED

- File `app/layout.tsx` modified (verified via `grep -c "<BottomTabBar"` returning 1 and `grep -c "<NavbarConnectionStatusChip"` returning 1).
- Commit `9af864bb` exists (verified via `git log --oneline | grep 9af864bb`).
- Source files preserved per D-04: `app/components/Navbar.tsx` and `app/components/ui/Footer.tsx` both still on disk and untouched.

---
*Phase: 181-glass-bottom-tab-bar*
*Completed: 2026-05-02*
