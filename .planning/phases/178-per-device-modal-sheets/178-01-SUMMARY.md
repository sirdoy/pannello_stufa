---
phase: 178-per-device-modal-sheets
plan: 01
subsystem: ui
tags: [ember-glass, sheets, primitives, react-19, lucide-react, jest]

# Dependency graph
requires:
  - phase: 175-sheet-primitive
    provides: "Sheet container primitive (open/close + Radix Dialog facade) — Phase 178 sub-primitives compose inside SheetBody slots"
  - phase: 174-glass-foundation
    provides: "var(--accent), var(--text-2), var(--font-display) tokens consumed verbatim by sub-primitive inline styles"
provides:
  - "SheetRow (D-10) — label + optional 12px subtitle + optional right-slot ReactNode"
  - "Stepper (D-11) — 36×36 ± buttons + 18px Outfit display value with min/max clamp"
  - "Slider (D-12) — 140×6 range with two-stop linear-gradient (default var(--accent), Phase 179 reuse)"
  - "RadialDial (D-13) — 220×220 SVG 270° arc + 68px Outfit center value + 44×44 ± buttons (no drag)"
  - "SheetBtn (D-14) — flat 16px-pad icon + label button taking LucideIcon"
  - "QuickActionButton (D-15) — yellow-active pill (#f5c84a) for LightsSheet quick toggles"
  - "[data-sheet-focusable=\"true\"]:focus-visible accent-ring rule appended to app/globals.css"
affects: [178-02-helper-and-barrel, 178-04-stove-sheet, 178-05-climate-sheet, 178-06-lights-sheet, 178-07-sonos-sheet, 178-08-plugs-sheet, 179-rooms-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bundle-verbatim primitives: inline-style + var(--token), AUDIT-EXCEPTION comments tag every hex/rgba lifted from sheets.jsx"
    - "Class-of-element selector via data-component, per-instance via slugged data-testid (JSX one-data-testid limit)"
    - "Sub-primitive bare buttons (no Pressable wrap, D-24) carry data-sheet-focusable for global :focus-visible accent ring"
    - "RC-clean: zero useMemo / useCallback (D-28 — React Compiler discipline)"

key-files:
  created:
    - app/components/EmberGlass/sheets/primitives/SheetRow.tsx
    - app/components/EmberGlass/sheets/primitives/Stepper.tsx
    - app/components/EmberGlass/sheets/primitives/Slider.tsx
    - app/components/EmberGlass/sheets/primitives/RadialDial.tsx
    - app/components/EmberGlass/sheets/primitives/SheetBtn.tsx
    - app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/SheetBtn.test.tsx
    - app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx
  modified:
    - app/globals.css

key-decisions:
  - "Bundle-verbatim port: every visual literal lifted from sheets.jsx with AUDIT-EXCEPTION comments citing source line ranges (469-482, 484-500, 502-513, 536-579, 581-592, 299-306)"
  - "JSX one-data-testid limit: SheetBtn + QuickActionButton use data-component for class selector + slugged data-testid for instance selector"
  - "Sub-primitives are bare (no Pressable wrap, CONTEXT D-24); accent focus ring delivered via global [data-sheet-focusable=\"true\"]:focus-visible mirroring Phase 175 [data-pressable-focusable]"
  - "Slider ships unused in Phase 178 (SonosSheet uses plain accentColor=#b080ff per bundle); shipped now for Phase 179 Rooms tab brightness reuse"
  - "Stepper.onChange emits raw number — callers wrap to fit consuming hook signatures (e.g. StoveSheet wraps to {target:{value:String(v)}} for handlePowerChange)"

patterns-established:
  - "Bundle-verbatim primitive pattern: inline style={{ }} + var(--token) + AUDIT-EXCEPTION comment per hex/rgba literal citing sheets.jsx line"
  - "Slugged data-testid pattern: function slugify(label) → toLowerCase().replace(/\\s+/g,'-').replace(/[^a-z0-9-]/g,'')"
  - "Min/max clamp via Math.max(min, value-1) / Math.min(max, value+1) — emits raw number"

requirements-completed: [SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06]

# Metrics
duration: 6min
completed: 2026-04-29
---

# Phase 178 Plan 01: Sheet Sub-Primitives Summary

**Six bundle-verbatim sheet sub-primitives (SheetRow, Stepper, Slider, RadialDial, SheetBtn, QuickActionButton) + globals.css [data-sheet-focusable]:focus-visible accent-ring rule, foundation for Phase 178 Wave 2 sheet bodies**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-29T10:39:46Z
- **Completed:** 2026-04-29T10:45:18Z (approx — within same agent invocation)
- **Tasks:** 2 (TDD: 4 commits — 2× RED + 2× GREEN)
- **Files created:** 12 (6 .tsx + 6 jest specs)
- **Files modified:** 1 (app/globals.css)

## Accomplishments

- All six sheet sub-primitive components ported verbatim from `sheets.jsx` line ranges 469-482, 484-500, 502-513, 536-579, 581-592, 299-306, satisfying CONTEXT D-10..D-15.
- All sub-primitive interactive elements (Stepper ±, RadialDial ±, SheetBtn, QuickActionButton, Slider) carry `data-sheet-focusable="true"` paired with the new globals.css rule for accent-ring keyboard focus, mirroring Phase 175 Pressable focus pattern.
- 40 jest tests across 6 spec files (SheetRow×4, Stepper×6, Slider×4, RadialDial×7, SheetBtn×4, QuickActionButton×5) green under `npm run test:components -- app/components/EmberGlass/sheets/primitives`.
- Zero `useMemo` / `useCallback` across all 6 source files (D-28 React Compiler discipline preserved).

## Task Commits

Each task followed strict TDD (RED → GREEN), each committed atomically with `--no-verify` per parallel-worktree convention:

1. **Task 1 RED — SheetRow + Stepper + SheetBtn + QuickActionButton failing specs** — `e18c133c` (test)
2. **Task 1 GREEN — SheetRow + Stepper + SheetBtn + QuickActionButton sub-primitives** — `e9d2f8e6` (feat)
3. **Task 2 RED — Slider + RadialDial failing specs** — `302f2ffe` (test)
4. **Task 2 GREEN — Slider + RadialDial + globals.css focus rule** — `01ebba8a` (feat)

## Files Created/Modified

### Created

- `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` (50 LOC) — label + optional 12px subtitle + right-slot row primitive (D-10)
- `app/components/EmberGlass/sheets/primitives/Stepper.tsx` (78 LOC) — 36×36 ± + 18px Outfit display number stepper, ARIA-labeled, clamp at min/max (D-11)
- `app/components/EmberGlass/sheets/primitives/Slider.tsx` (40 LOC) — 140×6 custom range with two-stop linear-gradient fill, default `var(--accent)` (D-12)
- `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` (135 LOC) — 220×220 SVG 270° arc + 68px Outfit center value + 28px ° superscript + 44×44 ± buttons (D-13)
- `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` (48 LOC) — 16px-pad icon + label flat button taking `LucideIcon` prop (D-14)
- `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` (45 LOC) — yellow-active pill (#f5c84a) (D-15)
- 6× jest specs under `app/components/EmberGlass/sheets/primitives/__tests__/`

### Modified

- `app/globals.css` — appended 4-LOC `[data-sheet-focusable="true"]:focus-visible` rule immediately after the existing Phase 175 `[data-pressable-focusable]:focus-visible` block (lines 384-389)

## Decisions Made

None beyond what was already specified in the plan and CONTEXT.md (D-10..D-15, D-24, D-28). The plan provided verbatim source code; this executor lifted it to disk and shipped specs.

## Deviations from Plan

### Spec normalization (not a source change)

**1. [Rule 1 — Test bug] QuickActionButton spec assertions normalized for jsdom inline-style serialization**
- **Found during:** Task 1 GREEN (initial test run after writing source)
- **Issue:** Bundled spec asserted `styleAttr.toContain('rgba(245,200,74,0.18)')` against jsdom's HTMLElement.getAttribute('style') output. jsdom inserts spaces after commas in inline-style serialization (`rgba(245, 200, 74, 0.18)`) and converts hex `#f5c84a` to `rgb(245, 200, 74)`. Original assertion would never pass.
- **Fix:** Normalized comma-spaces in style string before assertion (`.replace(/,\s+/g, ',')`); switched color match from `#f5c84a` → `rgb(245,200,74)` (jsdom equivalent). Source code unchanged — visual contract literally still `#f5c84a` and `rgba(245,200,74,0.18)` per bundle.
- **Files modified:** `app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx` (active=true and active=false test branches)
- **Verification:** All 5 QuickActionButton tests green; source `QuickActionButton.tsx` still asserts plan-required AUDIT-EXCEPTION literals.
- **Committed in:** `e9d2f8e6` (squashed into Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — spec normalization for jsdom serialization quirk, not a source change)
**Impact on plan:** Zero — plan visual contract preserved verbatim; only test-side assertion normalized to match the runtime DOM serialization output.

## Issues Encountered

- **Worktree base mismatch on agent start.** Agent boot detected `git merge-base HEAD <expected>` returning the wrong commit (worktree was already on `ec305afe`, not the orchestrator-mandated `3341250b`). Followed `<worktree_branch_check>` protocol exactly: `git reset --hard 3341250b` to align base before any other action. Subsequent commits land cleanly on the expected base.

## Stub / Threat Surface Scan

- **Stubs:** None. All primitives are presentational with explicit prop contracts; no hardcoded empty/null data sources, no TODO/FIXME/placeholder strings.
- **Threat flags:** None. Primitives are presentational with no network calls, no `dangerouslySetInnerHTML`, no untrusted text paths. Threat model T-178-01-01 / T-178-01-02 dispositions remain `accept` as planned.

## TDD Gate Compliance

- **RED gates:** `e18c133c` (Task 1) + `302f2ffe` (Task 2) — both confirmed failing with "Cannot find module" before writing source.
- **GREEN gates:** `e9d2f8e6` (Task 1) + `01ebba8a` (Task 2) — both confirmed all specs green under `npm run test:components -- app/components/EmberGlass/sheets/primitives` (40/40 tests passing).
- **REFACTOR:** Not needed — bundle-verbatim ports require no cleanup; visual literals must remain unchanged per AUDIT-EXCEPTION discipline.

## User Setup Required

None — pure presentational primitives, no env vars, no external services, no dashboard configuration.

## Next Phase Readiness

- All six primitives are importable from `app/components/EmberGlass/sheets/primitives/{Name}.tsx` (default named exports).
- Phase 178 Plan 02 (helper-and-barrel) can now ship the index barrel + the helper utilities that compose primitives into sheet bodies.
- Phases 178-04..178-08 (StoveSheet / ClimateSheet / LightsSheet / SonosSheet / PlugsSheet) have full primitive coverage; no further sub-primitive work required.
- Phase 179 (Rooms tab) can reuse `Stepper` (thermostat ±) and `Slider` (lights brightness) per CONTEXT D-12 reuse note.

## Self-Check

Files asserted to exist:
- `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` — FOUND
- `app/components/EmberGlass/sheets/primitives/Stepper.tsx` — FOUND
- `app/components/EmberGlass/sheets/primitives/Slider.tsx` — FOUND
- `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` — FOUND
- `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` — FOUND
- `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` — FOUND
- 6× `__tests__/*.test.tsx` — FOUND

Commits asserted to exist (verified via `git log --oneline 3341250b..HEAD`):
- `e18c133c` — FOUND
- `e9d2f8e6` — FOUND
- `302f2ffe` — FOUND
- `01ebba8a` — FOUND

## Self-Check: PASSED

---
*Phase: 178-per-device-modal-sheets*
*Plan: 01-sheet-primitives*
*Completed: 2026-04-29*
