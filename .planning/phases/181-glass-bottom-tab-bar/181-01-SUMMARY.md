---
phase: 181-glass-bottom-tab-bar
plan: 01
subsystem: ui
tags: [emberglass, sheet, css, navigation, body-attribute, ssr-safe, jest, tdd]

# Dependency graph
requires:
  - phase: 175-glass-primitives-press-animation-sheet
    provides: Sheet primitive with body scroll-lock useEffect (additive extension target)
  - phase: 178-glass-redesign-stove-card
    provides: Sheet consumer (auto-broadcasts on next mount, no changes needed)
  - phase: 179-glass-redesign-rooms
    provides: Sheet consumer (auto-broadcasts on next mount, no changes needed)
  - phase: 180-glass-redesign-automations
    provides: Sheet consumer (auto-broadcasts on next mount, no changes needed)
provides:
  - SheetCounter pure module exporting incrementSheetCount/decrementSheetCount
  - body[data-sheet-open="true"] attribute toggled while any Phase 175 Sheet is open
  - 6 cross-cutting CSS rules ([data-bottom-tab="true"] + [data-ws-chip="true"]) ready for Plan 02 BottomTabBar consumer
  - Counter-based stacking semantics so nested sheets do not prematurely reveal the bar
affects: [181-02 BottomTabBar consumer, 181-03 AltroPage, 181-04 layout integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level mutable counter for cross-cutting body data-attribute (avoids Radix internals)"
    - "Additive useEffect augmentation (1 import + 2 lines) — Phase 175 D-02 extension contract"
    - "SSR-safe body attribute writes via typeof document === 'undefined' guard"
    - "Pitfall 2: combined desktop transform (translate(-50%, 140%)) prevents horizontal slide-off"

key-files:
  created:
    - app/components/EmberGlass/SheetCounter.ts
    - app/components/EmberGlass/__tests__/SheetCounter.test.ts
  modified:
    - app/components/EmberGlass/Sheet.tsx
    - app/components/EmberGlass/__tests__/Sheet.test.tsx
    - app/globals.css

key-decisions:
  - "Custom counter module beats sniffing Radix data-scroll-locked: avoids false-positives from unrelated Radix Tooltips/Popovers"
  - "Decrement clamps at Math.max(0, count - 1) to defend against React 19 error-boundary unmount edge cases"
  - "CSS rules appended after @keyframes ambientC block to keep ambient-related groupings contiguous"

patterns-established:
  - "Pattern: cross-cutting body data-attribute toggling via tiny pure module + additive useEffect"
  - "Pattern: counter-based attribute lifecycle survives stacked modal/sheet usage"
  - "Pattern: 5th describe block append on existing spec file preserves all 4 prior describe groups verbatim"

requirements-completed: [NAV-03]

# Metrics
duration: 4.1min
completed: 2026-05-02
---

# Phase 181 Plan 01: Sheet body[data-sheet-open] foundation Summary

**SheetCounter pure module + additive Sheet.tsx augmentation + 6 cross-cutting globals.css rules — every existing Phase 175 Sheet now broadcasts body[data-sheet-open] for the Plan 02 BottomTabBar to hook into, with counter-based stacking and SSR-safe writes.**

## Performance

- **Duration:** 4.1 min
- **Started:** 2026-05-02T20:59:53Z
- **Completed:** 2026-05-02T21:04:08Z
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- SheetCounter.ts pure module: increment/decrement toggle body.dataset.sheetOpen with 0-clamp + SSR guard (~30 LOC)
- Sheet.tsx augmented additively: 1 import + 2 lines inside existing scroll-lock useEffect; ZERO prop/visual/z-index changes
- 6 cross-cutting CSS rules in globals.css covering bar transition + mobile hide + desktop center + Pitfall-2 combined-translate hide + chip transition + chip slide-up hide
- 9 new Jest specs (6 SheetCounter + 3 new Sheet describe block) all green; existing 22 Sheet specs unaffected (25/25 total)
- Phase 178/179/180 sheets now auto-broadcast on next mount — no consumer changes needed

## Task Commits

Each task was committed atomically:

1. **Task 181-01-01: SheetCounter module + Jest spec** — TDD cycle:
   - `90e151bb` (test) — RED: 6 failing specs
   - `a97395ac` (feat) — GREEN: SheetCounter.ts module, 6/6 specs pass
2. **Task 181-01-02: Sheet.tsx augmentation + 5th describe block** — TDD cycle:
   - `2ebbce78` (test) — RED: 3 failing specs in new describe block
   - `c3fb7d0b` (feat) — GREEN: 1 import + 2 lines in Sheet.tsx, 25/25 specs pass
3. **Task 181-01-03: globals.css cross-cutting rules** — `b67e92e6` (feat)

_TDD gate compliance: every task with `tdd="true"` has matching test→feat commit pair._

## Files Created/Modified

- `app/components/EmberGlass/SheetCounter.ts` (NEW, 43 LOC) — pure module with incrementSheetCount/decrementSheetCount + module-private counter + SSR guard + 0-clamp
- `app/components/EmberGlass/__tests__/SheetCounter.test.ts` (NEW, 64 LOC) — 6 Jest specs covering increment, double-increment, decrement-keeps, decrement-clears, clamp, SSR safety
- `app/components/EmberGlass/Sheet.tsx` (MOD, +4 lines) — 1 new import line; incrementSheetCount call in setup; decrementSheetCount call in cleanup
- `app/components/EmberGlass/__tests__/Sheet.test.tsx` (MOD, +37 lines) — appended 5th describe block "Body data-attribute (Phase 181 D-10)" with 3 specs (mount, flip, stacked)
- `app/globals.css` (MOD, +43 lines) — appended 6 rules after `@keyframes ambientC` (line 358), before reduced-motion guard

## Decisions Made

- **Custom counter over Radix sniffing:** chose tiny pure module over `data-scroll-locked` attribute observation; Radix's attribute is set by ANY component using `react-remove-scroll-bar` (Tooltip, Popover modal, etc.) which would cause false-positive bar-hide if Phase 182+ adds an unrelated Radix Tooltip.
- **0-clamp on decrement:** `Math.max(0, count - 1)` defends against React 19 error-boundary cleanup paths that may double-fire useEffect cleanup (per UI-SPEC §SheetCounter.ts module-level state contract).
- **CSS append point:** placed all 6 new rules immediately after `@keyframes ambientC` (line 358) and before the reduced-motion `@media` block, so the new rules are physically grouped between Phase 175 ambient-related code and Phase 175 reduced-motion override (canonical order documented in PATTERNS.md).

## Deviations from Plan

None — plan executed exactly as written. All three tasks landed verbatim per CONTEXT D-08, D-09, D-10, and D-14, with PATTERNS.md and UI-SPEC.md providing the verbatim source for SheetCounter.ts (~30 LOC), the Sheet.tsx 2-line edit, the 5th describe block, and the 6 CSS rules.

## Issues Encountered

None.

## TDD Gate Compliance

Both `tdd="true"` tasks have proper RED→GREEN gate sequence:
- Task 181-01-01: `90e151bb` (test) → `a97395ac` (feat) ✓
- Task 181-01-02: `2ebbce78` (test) → `c3fb7d0b` (feat) ✓

No REFACTOR commits required — implementation matched the verbatim specs from CONTEXT/PATTERNS/UI-SPEC.

## Threat Flags

No new threat surface introduced. T-181-01 (open redirect via tab hrefs), T-181-02 (XSS via AltroPage copy), T-181-03 (auth bypass on /altro) all apply to Wave 2 consumers, not this plan. SheetCounter writes only to `document.body.dataset.sheetOpen` — DOM mutation under same origin, no user input flows.

## Self-Check: PASSED

- `app/components/EmberGlass/SheetCounter.ts` — FOUND
- `app/components/EmberGlass/__tests__/SheetCounter.test.ts` — FOUND
- Sheet.tsx incrementSheetCount/decrementSheetCount references — FOUND (2 each)
- Sheet.test.tsx 5th describe block "Body data-attribute (Phase 181 D-10)" — FOUND
- globals.css `data-bottom-tab` selectors — 4 occurrences (`>= 4` ✓)
- globals.css `data-ws-chip` selectors — 2 occurrences (`>= 2` ✓)
- globals.css `translate(-50%, 140%)` (Pitfall 2) — FOUND
- globals.css `translateY(-140%)` (chip slide-up) — FOUND
- Commits: `90e151bb`, `a97395ac`, `2ebbce78`, `c3fb7d0b`, `b67e92e6` — all reachable via `git log --oneline`
- Jest: `npm run test:components` on both spec files — 31/31 green

## Next Phase Readiness

- **Plan 02 (BottomTabBar):** ready — body attribute mechanism live and tested; consumer just needs `data-bottom-tab="true"` on the bar root and the existing globals.css rules slide it off-screen automatically.
- **Plan 03 (AltroPage) / Plan 04 (layout integration):** unblocked by this plan; depend on Plan 02 BottomTabBar.
- **Phase 178/179/180 sheets:** automatically opt-in on next mount — no consumer changes required.
- **WS chip (existing layout):** Plan 02 must add `data-ws-chip="true"` to the chip root for the slide-up rule to apply (CSS lives here ahead of consumer).

---
*Phase: 181-glass-bottom-tab-bar*
*Completed: 2026-05-02*
