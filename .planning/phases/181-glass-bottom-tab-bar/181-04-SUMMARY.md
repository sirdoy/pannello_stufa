---
phase: 181-glass-bottom-tab-bar
plan: 04
subsystem: ui
tags: [react, jsx, jest, testing-library, websocket, navbar, fixed-position, safe-area]

# Dependency graph
requires:
  - phase: 144-websocket-connection-status
    provides: NavbarConnectionStatus zero-arg decorative component (role="status")
  - phase: 181-glass-bottom-tab-bar/01
    provides: globals.css body[data-sheet-open=true] [data-ws-chip=true] hide-on-sheet rule
provides:
  - NavbarConnectionStatusChip floating wrapper (top-right, z-150, safe-area-inset aware)
  - data-ws-chip="true" selector hook for sheet-open hide rule
  - 3-spec Jest suite validating attribute, fixed position, and child render
affects:
  - 181-05 (legacy header removal) — chip now has its own home, decoupled from <Navbar />
  - Any future phase needing a floating chrome element under the 200/201 Sheet ceiling

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Thin wrapper pattern (positioning concern only; wrapped Phase 144 component untouched)
    - Inline-style fixed positioning with safe-area-inset-top env() for iOS notch safety
    - data-* selector hooks paired with globals.css rules (Plan 01 contract)
    - z-index 150 budget tier (BottomTabBar + chip, below Sheet 200/201)

key-files:
  created:
    - app/components/layout/NavbarConnectionStatusChip.tsx
    - app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx
  modified: []

key-decisions:
  - "D-13: NavbarConnectionStatusChip floats top-right (calc(env(safe-area-inset-top) + 12px), right 12, zIndex 150) — wrapper does not touch Phase 144 component"
  - "D-14: 3-spec Jest suite (data-ws-chip attribute, fixed/zIndex inline styles, child role=status render with OPEN mock)"
  - "UI-SPEC correction over CONTEXT D-13: NO pointer-events: 'auto' — chip is decorative; 4 inline-style properties only (RESEARCH Pattern 13)"

patterns-established:
  - "Wrap-only contract: positioning wrappers do not modify their wrapped components (Phase 144 file diff is empty)"
  - "data-* selector hooks live on the wrapper, never on the wrapped component (keeps wrapped component reusable elsewhere)"

requirements-completed: [NAV-01]

# Metrics
duration: 6min
completed: 2026-05-02
---

# Phase 181 Plan 04: NavbarConnectionStatusChip Floating Wrapper Summary

**Top-right floating wrapper around the Phase 144 WS connection status chip with safe-area-inset-top awareness and the data-ws-chip selector hook for sheet-open hide-rule integration.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-02T21:04:00Z
- **Completed:** 2026-05-02T21:10:21Z
- **Tasks:** 1 (TDD: RED → GREEN, no REFACTOR needed)
- **Files modified:** 2 created, 0 modified

## Accomplishments

- NavbarConnectionStatusChip floating wrapper shipped (~25 LOC plus block comment)
- 4-property inline style only: `position: fixed`, `top: calc(env(safe-area-inset-top) + 12px)`, `right: 12`, `zIndex: 150`
- `data-ws-chip="true"` selector hook present for Plan 01's `body[data-sheet-open="true"] [data-ws-chip="true"]` hide rule
- Phase 144 NavbarConnectionStatus is untouched (wrap-only contract verified by `git diff` returning zero lines)
- 3/3 Jest specs green via `npx jest app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx`

## Task Commits

Each task was committed atomically (TDD):

1. **Task 181-04-01 RED: failing specs for NavbarConnectionStatusChip** - `5c19da2c` (test)
2. **Task 181-04-01 GREEN: NavbarConnectionStatusChip floating wrapper (NAV-01)** - `d936a0bc` (feat)

_Note: No REFACTOR commit — wrapper is at minimal-LOC shape already; cleanup would be cosmetic only._

## Files Created/Modified

- `app/components/layout/NavbarConnectionStatusChip.tsx` (created, 40 lines incl. doc comment) — `'use client'` thin wrapper around `<NavbarConnectionStatus />` inside `<div data-ws-chip="true" style={{position:'fixed', top:'calc(env(safe-area-inset-top) + 12px)', right:12, zIndex:150}}>`. No `pointer-events: auto` (UI-SPEC correction).
- `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` (created, 50 lines) — 3 specs: data-ws-chip attribute, fixed/zIndex inline styles, child role=status render with `useWebSocketContext` mocked to OPEN.

## Decisions Made

- **No pointer-events override.** CONTEXT D-13 erroneously specified `pointerEvents: 'auto'`; UI-SPEC + RESEARCH Pattern 13 corrected this — the chip is purely decorative and `auto` is the default, so adding it would be misleading and dead. Honored in both component and acceptance criteria (`grep -c pointerEvents` returns 0).
- **Mock path matches Phase 144 spec verbatim.** Used `jest.mock('@/app/context/WebSocketContext', ...)` exactly as Phase 144's `NavbarConnectionStatus.test.tsx` does, so future maintenance touches both files with the same import shape.
- **Test-3 regex relaxed to `/conness/i`.** Phase 144 connected-state copy is "Connesso via WS" (verified in `NavbarConnectionStatus.tsx`), but lenient regex allows minor copy refinements without retest churn.
- **`import type React from 'react'` for the return-type annotation.** Avoids unused runtime import while satisfying the `React.ReactElement` return type — cleanly TypeScript-strict without `as any`.

## Deviations from Plan

None — plan executed exactly as written. RED test failed for the expected reason (`Cannot find module '../NavbarConnectionStatusChip'`); GREEN component made all 3 specs pass on the first run; no auto-fixes triggered.

One trivial environment note (not a plan deviation): the worktree's `npm run test:components` script is hardcoded to `__tests__/app/components` and does not glob colocated `app/components/**/__tests__/` paths. Per CLAUDE.md rule 8 (use scoped subsets, not full suite), I ran `npx jest <specific path>` instead, which respects the worktree's `jest.config.ts` testMatch and gave a clean 3/3 pass — same scoping intent.

## Issues Encountered

- **Initial Write tool path resolution.** First attempt to create the test file via the relative-style absolute path landed in the parent project's `app/components/layout/__tests__/` instead of the worktree's. Resolved by `mv`-ing the file into the worktree path and continuing; subsequent `Write` calls used the explicit worktree-prefixed absolute path. No git impact (file was unstaged at the time).

## User Setup Required

None — pure UI component, no env vars, no dashboard config, no external services.

## Self-Check: PASSED

- Component file exists: `app/components/layout/NavbarConnectionStatusChip.tsx` — FOUND
- Test file exists: `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` — FOUND
- RED commit `5c19da2c` — FOUND in `git log --oneline`
- GREEN commit `d936a0bc` — FOUND in `git log --oneline`
- Acceptance grep counts (use client=1, export function=1, data-ws-chip=1, safe-area=1, zIndex 150=1, pointerEvents=0, as any=0, test count=3) — ALL PASS
- Phase 144 component untouched (`git diff HEAD~2..HEAD app/components/layout/NavbarConnectionStatus.tsx` → empty) — VERIFIED
- 3/3 Jest specs green via `npx jest` — VERIFIED

## Next Phase Readiness

- NAV-01 chip wrapper ready to be mounted by Plan 05 (legacy header removal / new layout) at the top of the new chrome stack.
- Plan 01's globals.css `body[data-sheet-open="true"] [data-ws-chip="true"]` hide-rule selector now has a real DOM target.
- No blockers carried forward.

---
*Phase: 181-glass-bottom-tab-bar*
*Plan: 04*
*Completed: 2026-05-02*
