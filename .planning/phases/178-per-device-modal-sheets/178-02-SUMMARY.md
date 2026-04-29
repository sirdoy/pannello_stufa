---
phase: 178-per-device-modal-sheets
plan: 02
subsystem: ui
tags: [ember-glass, sheets, helper, barrel, hue-scenes, typescript]

# Dependency graph
requires:
  - phase: 175-glass-primitives-press-animation-sheet
    provides: Sheet primitive consumed unmodified by future sheet bodies
  - phase: 177-equal-size-dashboard-glass-cards
    provides: SheetPlaceholderBody (stays alive for Camera/Network/Dirigera) + per-card useState<boolean> wiring
provides:
  - findSceneByName helper at app/components/EmberGlass/sheets/lib/findSceneByName.ts (case-insensitive Hue scene lookup)
  - sheets barrel at app/components/EmberGlass/sheets/index.ts (5 sheet bodies + 6 sub-primitives + helper)
  - top-level EmberGlass barrel re-exports the new sheets module
  - 5 sheet-body stub files awaiting Plans 178-04..178-08
  - 6 primitive stub files (defensive — see deviation R3-1) awaiting Plan 178-01 to overwrite
affects:
  - 178-04-stove-sheet (overwrites StoveSheet stub)
  - 178-05-climate-sheet (overwrites ClimateSheet stub)
  - 178-06-lights-sheet (overwrites LightsSheet stub + consumes findSceneByName)
  - 178-07-sonos-sheet (overwrites SonosSheet stub)
  - 178-08-plugs-sheet (overwrites PlugsSheet stub)
  - 178-09-card-swap-integration (consumes barrel via @/app/components/EmberGlass)
  - phase 179 (Rooms tab — may reuse helper + Slider primitive)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Barrel file with forward references to siblings shipped in same wave"
    - "Stub-first scaffolding for parallel-wave worktrees (TODO Plan 178-NN markers + matching prop interfaces so merges overwrite cleanly)"
    - "Pure helper colocated under sheets/lib/ for plan reviewability"

key-files:
  created:
    - app/components/EmberGlass/sheets/lib/findSceneByName.ts
    - app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts
    - app/components/EmberGlass/sheets/index.ts
    - app/components/EmberGlass/sheets/StoveSheet.tsx (stub)
    - app/components/EmberGlass/sheets/ClimateSheet.tsx (stub)
    - app/components/EmberGlass/sheets/LightsSheet.tsx (stub)
    - app/components/EmberGlass/sheets/SonosSheet.tsx (stub)
    - app/components/EmberGlass/sheets/PlugsSheet.tsx (stub)
    - app/components/EmberGlass/sheets/primitives/SheetRow.tsx (defensive stub — Rule 3)
    - app/components/EmberGlass/sheets/primitives/Stepper.tsx (defensive stub — Rule 3)
    - app/components/EmberGlass/sheets/primitives/Slider.tsx (defensive stub — Rule 3)
    - app/components/EmberGlass/sheets/primitives/RadialDial.tsx (defensive stub — Rule 3)
    - app/components/EmberGlass/sheets/primitives/SheetBtn.tsx (defensive stub — Rule 3)
    - app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx (defensive stub — Rule 3)
  modified:
    - app/components/EmberGlass/index.ts (appended `export * from './sheets'`)

key-decisions:
  - "Helper lives under sheets/lib/ (not app/components/devices/lights/utils/) to keep Phase 178 self-contained — can move later if Phase 179 reuses it (CONTEXT D-07 + Claude's Discretion bullet)"
  - "All 6 primitives stubbed defensively in this worktree (Rule 3 — Plan 178-01 ships real files in a sibling worktree; matching prop interfaces guarantee clean merge)"
  - "Barrel uses named exports for both sheet bodies and sub-primitives; mirrors the existing app/components/EmberGlass/index.ts pattern (PATTERNS lines 442-474)"

patterns-established:
  - "Stub-with-matching-prop-interface convention for parallel-wave barrels: barrel ships first wave, stubs satisfy tsc, sibling waves overwrite with real implementations"
  - "TODO Plan 178-NN markers grep-locatable so downstream agents instantly recognize stubs"

requirements-completed:
  - SHEET-04

# Metrics
duration: 5min
completed: 2026-04-29
---

# Phase 178 Plan 02: Helper and Barrel Summary

**Tiny `findSceneByName` Hue scene lookup helper plus the new `EmberGlass/sheets/` barrel that forward-exports 5 sheet bodies + 6 sub-primitives + helper, ready for Wave 2 plans 178-03..178-08 to consume.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-29T10:42:12Z
- **Completed:** 2026-04-29T10:47:14Z
- **Tasks:** 2 (1 TDD: RED→GREEN, 1 standard)
- **Files modified:** 15 (1 modified, 14 created — including 11 stubs)

## Accomplishments

- Pure `findSceneByName(catalog, name)` helper with 6/6 jest cases green (empty catalog, exact-case, case-insensitive, miss, collision-first-wins, mixed-case lookup).
- New sheets barrel `app/components/EmberGlass/sheets/index.ts` (24 LOC) re-exports 5 sheet bodies (`StoveSheet`, `ClimateSheet`, `LightsSheet`, `SonosSheet`, `PlugsSheet`), 6 sub-primitives (`SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton`) plus their `*Props` types, and the helper.
- Top-level EmberGlass barrel appended with `export * from './sheets'` so phases 179-181 can import via `@/app/components/EmberGlass`.
- 5 sheet-body stubs + 6 primitive stubs ship with TODO markers — Plans 178-01 and 178-04..178-08 will replace them with real implementations.
- `npx tsc --noEmit` shows 7 pre-existing errors and zero new errors attributable to Plan 178-02 files.

## Task Commits

1. **Task 1 RED — failing spec for findSceneByName** — `b60e91d8` (test)
2. **Task 1 GREEN — findSceneByName implementation** — `7e857c5a` (feat)
3. **Task 2 — sheets barrel + 5 sheet-body stubs (+ 6 primitive defensive stubs)** — `698437c8` (feat)

_Note: Task 1 followed TDD (RED → GREEN, no REFACTOR needed — helper is already minimal at 6 LOC of body)._

## Files Created/Modified

### Created
- `app/components/EmberGlass/sheets/lib/findSceneByName.ts` (21 LOC) — pure case-insensitive scene lookup, source CONTEXT D-07 / RESEARCH §Code Examples
- `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` (54 LOC) — 6 jest cases
- `app/components/EmberGlass/sheets/index.ts` (24 LOC) — sheets barrel
- `app/components/EmberGlass/sheets/{StoveSheet,ClimateSheet,LightsSheet,SonosSheet,PlugsSheet}.tsx` — 5 sheet-body stubs (5 LOC each, TODO markers + `data-testid="*-sheet-stub"`)
- `app/components/EmberGlass/sheets/primitives/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.tsx` — 6 primitive stubs with matching prop interfaces (defensive — see deviation R3-1)
- `.planning/phases/178-per-device-modal-sheets/deferred-items.md` — pre-existing tsc errors logged out of scope

### Modified
- `app/components/EmberGlass/index.ts` — appended one line `export * from './sheets'` (38 LOC total, was 36)

## Decisions Made

- **Helper location:** Placed `findSceneByName` under `sheets/lib/` (not `app/components/devices/lights/utils/`) per CONTEXT D-07 / Claude's Discretion bullet 4 — keeps Phase 178 self-contained and reviewable; can be relocated by Phase 179 if Rooms tab reuses the helper.
- **Defensive primitive stubs:** All 6 primitives (Plan 178-01's deliverable) stubbed under `./primitives/` with matching prop interfaces, so the barrel + `tsc --noEmit` pass in this parallel-wave worktree before Plan 178-01 lands its branch. See deviation R3-1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Stubbed 6 sub-primitives so barrel compiles in parallel-wave worktree**

- **Found during:** Task 2 (`npx tsc --noEmit` verification)
- **Issue:** Plan 178-02 runs in Wave 1 alongside Plan 178-01 (which ships the 6 sub-primitives). The plan's verify step `npx tsc --noEmit` and acceptance criterion "no new errors attributable to the new files" cannot be met if `./primitives/SheetRow`, `./primitives/Stepper`, `./primitives/Slider`, `./primitives/RadialDial`, `./primitives/SheetBtn`, `./primitives/QuickActionButton` modules don't exist when the barrel imports them.
- **Fix:** Created 6 minimal stub files under `app/components/EmberGlass/sheets/primitives/` — each exports a no-op component that returns `null` and a `*Props` interface that matches the contract specified in Plan 178-01 (`SheetRowProps {label, value?, children?}`, `StepperProps {value, min, max, onChange}`, `SliderProps {value, min, max, onChange, color?}`, `RadialDialProps {value, min, max, onChange, color, label}`, `SheetBtnProps {Icon, label, onClick?}`, `QuickActionButtonProps {active, onClick, label}`). Each stub carries a `// TODO Plan 178-01: replace stub with verbatim port…` marker so the merge overwrites them cleanly.
- **Files modified:** `app/components/EmberGlass/sheets/primitives/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.tsx`
- **Verification:** `npx tsc --noEmit` returns 7 errors total — all 7 pre-existing in `app/debug/**` and `app/network/**` test files at base commit `3341250b`. Zero errors involve any sheets/ file.
- **Committed in:** `698437c8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy Plan 178-02's tsc verification in parallel-wave isolation. Plan 178-01 ships real implementations with bundle-verbatim visuals + jest specs in a sibling worktree; on merge, git replaces the 6 primitive stub files with the real ones (different content → clean overwrite, same paths). The 5 sheet-body stubs the plan EXPLICITLY specifies (Task 2 action) follow the same convention; this just extends it one folder deeper.

## Issues Encountered

- **Pre-existing tsc errors logged out of scope:** 7 errors in `app/debug/components/tabs/__tests__/`, `app/debug/hooks/__tests__/`, `app/network/__tests__/`, `app/network/hooks/__tests__/` were present at base commit `3341250b`. They predate Plan 178-02 entirely. Logged in `.planning/phases/178-per-device-modal-sheets/deferred-items.md`; not addressed (scope-boundary rule).

## User Setup Required

None — pure helper + barrel infrastructure, no external services or env vars.

## Next Phase Readiness

- **Plan 178-01** (Wave 1, parallel) can land its 6 real primitives — they overwrite the defensive stubs cleanly (matching prop interfaces).
- **Plan 178-03..178-08** (Wave 2) can `import { StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet, SheetRow, Stepper, Slider, RadialDial, SheetBtn, QuickActionButton, findSceneByName } from '@/app/components/EmberGlass'` and be confident the symbols resolve.
- **Plan 178-06 (LightsSheet)** consumes `findSceneByName` directly per CONTEXT D-07 — helper already shipped, jest-green.
- No blockers identified.

## Self-Check: PASSED

- `app/components/EmberGlass/sheets/lib/findSceneByName.ts` — FOUND
- `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` — FOUND
- `app/components/EmberGlass/sheets/index.ts` — FOUND
- `app/components/EmberGlass/sheets/{Stove,Climate,Lights,Sonos,Plugs}Sheet.tsx` — FOUND (5/5)
- `app/components/EmberGlass/sheets/primitives/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.tsx` — FOUND (6/6)
- `app/components/EmberGlass/index.ts` contains `export * from './sheets'` — FOUND
- Commit `b60e91d8` (test RED) — FOUND
- Commit `7e857c5a` (feat GREEN) — FOUND
- Commit `698437c8` (feat barrel + stubs) — FOUND
- Helper jest spec — 6/6 pass
- `npx tsc --noEmit` — zero new errors attributable to plan files (7 pre-existing in debug/network)
- Zero `useMemo`/`useCallback` in helper or barrel — confirmed by grep

---
*Phase: 178-per-device-modal-sheets*
*Plan: 02 (helper-and-barrel)*
*Completed: 2026-04-29*
