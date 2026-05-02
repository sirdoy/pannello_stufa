---
phase: 181-glass-bottom-tab-bar
plan: 06
subsystem: testing
tags: [playwright, smoke, navigation, bottom-tab-bar, safe-area-inset, accessibility]

requires:
  - phase: 181-glass-bottom-tab-bar
    provides: BottomTabBar component (Plan 03), atomic chrome swap in app/layout.tsx (Plan 05), CSS cross-cutting rules (Plan 01), Sheet primitive body[data-sheet-open] hook (Plan 175)
provides:
  - Playwright smoke spec covering NAV-01..04 + console-error gate (tests/smoke/bottom-tab-bar.spec.ts)
  - Verbatim helper reuse pattern from rooms-tab.spec.ts (collectConsoleErrors + dismiss helpers + primeDashboardForSheetTest)
  - CSS contract assertion strategy for env(safe-area-inset-bottom) under headless Chromium (computed bottom + inline source string)
  - Programmatic body[data-sheet-open="true"] toggling pattern for hide-on-sheet-open contract verification (avoids fragile real-sheet-open trigger)
affects: [phase-182, future Phase 181 follow-up plans, sign-off gates]

tech-stack:
  added: []
  patterns:
    - "Playwright smoke spec follows tests/smoke/ convention (RESEARCH Pattern 9 — corrects CONTEXT typo)"
    - "Helpers lifted verbatim from rooms-tab.spec.ts; no drift from established convention"
    - "CSS env() contract verified via inline style.bottom (source string) + computed bottom (resolved 8px under env=0)"
    - "Hide-on-sheet-open verified by programmatic body.dataset.sheetOpen toggle, not real sheet click (architecture-level contract test)"

key-files:
  created:
    - tests/smoke/bottom-tab-bar.spec.ts
  modified: []

key-decisions:
  - "Programmatic body[data-sheet-open] toggle instead of real-sheet open click — contract-level test, less fragile"
  - "Inline style.bottom read for env() source-string assertion — getComputedStyle resolves to '8px' under headless Chromium per RESEARCH Pitfall 4"
  - "6 grouped tests under single describe block (NAV-04 inset, NAV-02 active tint, NAV-02 /altro Esci, NAV-01 desktop center, NAV-03 hide-on-sheet, console-error gate over /altro)"

patterns-established:
  - "Smoke spec helper-reuse pattern: import { test, expect, type ConsoleMessage, type Page } from '@playwright/test' + verbatim helpers from rooms-tab.spec.ts"
  - "Dual breakpoint coverage in single spec via page.setViewportSize() + waitForTimeout(150) for @media rule application"
  - "Environment-gap documentation pattern when dev server / storage state unavailable in worktree"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04]

duration: 8min
completed: 2026-05-02
---

# Phase 181 Plan 06: Bottom Tab Bar Playwright Smoke Spec Summary

**Playwright smoke spec covering NAV-01..04 (safe-area inset CSS contract, active tab tinting, /altro Esci, desktop centered 480px pill, hide-on-sheet-open, console-error gate) lifting helpers verbatim from rooms-tab.spec.ts**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-02T21:22:00Z
- **Completed:** 2026-05-02T21:30:49Z
- **Tasks:** 2 (1 file-modifying + 1 gate-only)
- **Files modified:** 1 created (264 LOC)

## Accomplishments

- Shipped `tests/smoke/bottom-tab-bar.spec.ts` (264 LOC) with 6 grouped tests under a single `Phase 181 — Bottom Tab Bar (NAV-01..04)` describe block.
- Verbatim copy of `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest` from `tests/smoke/rooms-tab.spec.ts:33-127` — no drift from the established Phase 179 convention.
- NAV-04 contract assertion uses dual signal: `getComputedStyle(el).bottom === '8px'` (resolved env=0 under headless Chromium per RESEARCH Pitfall 4) AND `(el as HTMLElement).style.bottom` contains `env(safe-area-inset-bottom)` (source-string contract that survives the resolver).
- NAV-03 hide-on-sheet-open verified by programmatic `document.body.dataset.sheetOpen = 'true'` toggle — same observable effect as a real Phase 175 Sheet open, but architecturally cleaner (the cross-cutting CSS rule is the unit under test).
- NAV-01 desktop centering asserts `boundingBox().width === 480` AND `Math.abs(box.x + box.width / 2 - 1280 / 2) < 4` after viewport resize + 150ms settle (allows the `@media (min-width: 640px)` rule to apply).
- NAV-02 active tab tint asserts `aria-current="page"` selector + computed color !== `rgba(255, 255, 255, 0.55)` (the inactive grey from BottomTabBar.tsx:92).
- Scoped Jest gates green: `npm run test:components` (1 suite, 10 tests passing) and `npm run test:pages` (4 suites, 28 tests passing).

## Task Commits

1. **Task 181-06-01: Create tests/smoke/bottom-tab-bar.spec.ts with 5+ grouped tests + console-error gate** — `0e5956be` (test)
2. **Task 181-06-02: Final scoped test pass + UI smoke at 375px and 1280px breakpoints** — gate-only, no file changes (results documented below)

**Plan metadata commit:** (final SUMMARY commit)

## Files Created/Modified

- `tests/smoke/bottom-tab-bar.spec.ts` — Playwright smoke spec, 264 LOC, 6 grouped tests under `Phase 181 — Bottom Tab Bar (NAV-01..04)` describe.

## Verification Results

### Acceptance criteria (Task 181-06-01)

| Criterion | Result |
|-----------|--------|
| `tests/smoke/bottom-tab-bar.spec.ts` exists | OK |
| `grep -c "test(" ...` ≥ 5 | OK — 6 tests |
| `data-bottom-tab="true"` selector present | OK (6 references) |
| `collectConsoleErrors` helper present | OK |
| `dismissVersionEnforcerIfPresent` helper present | OK |
| `375` AND `812` viewport literals | OK |
| `1280` AND `800` viewport literals | OK |
| `env(safe-area-inset-bottom)` source-string assertion | OK |
| `data-sheet-open` attribute interaction | OK |
| `/altro` navigation test | OK |
| TypeScript compiles cleanly (`tsc --noEmit --skipLibCheck`) | OK — exit 0 |

### Acceptance criteria (Task 181-06-02 — final scoped test pass)

| Suite | Result | Notes |
|-------|--------|-------|
| `npm run test:components` | PASS — 1 suite, 10 tests | Project's `__tests__/app/components` directory contains `CameraMonitoringToggle.test.tsx`; co-located component tests under `app/components/__tests__/*` are not in this script's scope by design. |
| `npm run test:pages` | PASS — 4 suites, 28 tests | All `__tests__/app` page tests green. |
| `npx playwright test tests/smoke/bottom-tab-bar.spec.ts` | NOT RUN — environment gap | See "Environment Gap" below. |

### Viewport / breakpoint coverage

The spec exercises both critical breakpoints in a single run:

- **375x812 (mobile):** NAV-04 inset contract (computed `bottom: '8px'` + `env(safe-area-inset-bottom)` in inline source string), NAV-02 active tint on /stanze, NAV-02 /altro Esci, NAV-03 hide-on-sheet-open.
- **1280x800 (desktop):** NAV-01 — `boundingBox().width === 480` + horizontally centered to within 4px of viewport midpoint after 150ms settle on `@media (min-width: 640px)` rule.

The mobile breakpoint is the `beforeEach` default; the NAV-01 test resizes to 1280x800 mid-test.

### Console-error gate

`collectConsoleErrors` helper hard-fails (`expect(errors).toEqual([])`) on any non-axe console error during `/altro` navigation. No upstream filter beyond the axe-core `'Fix any of the following'` ignore established by the verbatim helper (rooms-tab.spec.ts:38-39).

## Decisions Made

- **Programmatic body[data-sheet-open] toggle for NAV-03** — The CSS cross-cutting rule (Plan 01 D-09) is the unit under test; a real sheet-open click adds dependence on dashboard composition and device wiring. Programmatic `document.body.dataset.sheetOpen = 'true'` produces the same observable effect (translateY(140%) slide-out) and is architecturally cleaner. PATTERNS.md endorses this approach.
- **Inline style read for env() source-string assertion** — `getComputedStyle(el).bottom` resolves the calc to `'8px'` under headless Chromium (env returns 0). To assert the source-string contract (NAV-04), the test reads `(el as HTMLElement).style.bottom`, which is the React-rendered inline style attribute — `'calc(8px + env(safe-area-inset-bottom))'`. Both signals together prove the contract.
- **6 grouped tests instead of 5** — split NAV-02 into two cases (active tint on /stanze + Esci row on /altro) to keep each test focused on a single observable. Plan called for "5+"; spec ships 6.

## Deviations from Plan

None - plan executed exactly as written.

The plan called for "5+ grouped tests"; the spec ships 6 (NAV-04 inset, NAV-02 stanze active tint, NAV-02 /altro Esci, NAV-01 desktop center, NAV-03 hide-on-sheet, console-error gate). Splitting NAV-02 into two cases is the only structural addition vs. the plan's literal scaffold and aligns with rooms-tab.spec.ts:252-411 patterns.

## Environment Gap (documented per plan §acceptance_criteria)

`npx playwright test tests/smoke/bottom-tab-bar.spec.ts --reporter=list` was NOT executed because:

1. **No Next dev server reachable on `:3000`** — `curl http://localhost:3000/` returns no connection in this worktree.
2. **No `tests/.auth/user.json` storage state present** — the `chromium` Playwright project depends on `setup` (tests/auth.setup.ts), which performs a real Auth0 OAuth flow requiring credentials that are not available inside the worktree.
3. **CLAUDE.md rule 4 forbids `npm install` and `npm run build`** — cannot install Playwright browsers if missing.

The spec is verified via:
- TypeScript compilation: `npx tsc --noEmit --skipLibCheck tests/smoke/bottom-tab-bar.spec.ts` exits 0 (no type errors).
- Static contract checks: all 11 grep-based acceptance assertions in §"Verification Results" pass.
- Helper provenance: helpers are byte-identical (verbatim copy) to `tests/smoke/rooms-tab.spec.ts:33-127`.

The runtime smoke pass is deferred to the orchestrator's verification gate (which has access to a live dev server + Auth0 credentials), or to CI.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. (Real-device 34px home-indicator inset verification is documented in `181-VALIDATION.md §Manual-Only Verifications` and is intentionally out of scope here.)

## Next Phase Readiness

- Phase 181 is ready for sign-off pending the orchestrator's runtime Playwright pass (environment gap above).
- Spec covers NAV-01..04 + console-error gate exhaustively at the contract level; orchestrator's full-environment run is the final runtime gate.
- No follow-up tasks required from this plan; tests/smoke/bottom-tab-bar.spec.ts is self-contained and reuses the canonical Phase 179 helpers.

## Self-Check

Verifying claims before final commit:

- `tests/smoke/bottom-tab-bar.spec.ts` exists — FOUND (264 LOC).
- Commit `0e5956be` exists — FOUND in worktree branch git log.
- `npm run test:components` exit 0 — confirmed (1 suite, 10 tests).
- `npm run test:pages` exit 0 — confirmed (4 suites, 28 tests).
- `npx tsc --noEmit --skipLibCheck tests/smoke/bottom-tab-bar.spec.ts` exit 0 — confirmed.
- Helpers are byte-identical to `tests/smoke/rooms-tab.spec.ts:33-127` — confirmed by side-by-side review during authoring.

## Self-Check: PASSED

---
*Phase: 181-glass-bottom-tab-bar*
*Completed: 2026-05-02*
