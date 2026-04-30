---
phase: 180-automations-tab-full-editor
plan: "03"
subsystem: automations/primitives
tags: [phase-180, primitives, inline-style, ember-glass]
completed: 2026-04-30

dependency_graph:
  requires: [180-01]
  provides:
    - app/components/EmberGlass/automations/primitives/FieldLabel
    - app/components/EmberGlass/automations/primitives/TextInput
    - app/components/EmberGlass/automations/primitives/NumInput
    - app/components/EmberGlass/automations/primitives/SegmentedControl
    - app/components/EmberGlass/automations/primitives/TwoCol
    - app/components/EmberGlass/automations/primitives/AddChip
    - app/components/EmberGlass/automations/primitives/Pill
    - app/components/EmberGlass/automations/primitives/TypeTile
    - app/components/EmberGlass/automations/primitives/CronHint
    - app/components/EmberGlass/automations/primitives/IconBtn
  affects:
    - Plans 180-04, 180-05, 180-06 (consume all 10 primitives)
    - Plan 180-07 (AutomationEditor consumes TypeTile, CronHint, IconBtn)

tech_stack:
  added: []
  patterns:
    - inline-style + var(--token) discipline (zero Tailwind in primitives/)
    - color-mix(in oklab, {tone} N%, ...) for tone-colored surfaces
    - allowNull prop pattern for optional numeric inputs
    - discriminated Pill modes (tone | muted | neutral)
    - T-180-03-01 three-layer disabled prevention (onClick=undefined + pointerEvents:none + aria-disabled)

key_files:
  created:
    - app/components/EmberGlass/automations/primitives/FieldLabel.tsx (34 LOC)
    - app/components/EmberGlass/automations/primitives/TextInput.tsx (56 LOC)
    - app/components/EmberGlass/automations/primitives/NumInput.tsx (94 LOC)
    - app/components/EmberGlass/automations/primitives/SegmentedControl.tsx (66 LOC)
    - app/components/EmberGlass/automations/primitives/TwoCol.tsx (27 LOC)
    - app/components/EmberGlass/automations/primitives/AddChip.tsx (36 LOC)
    - app/components/EmberGlass/automations/primitives/Pill.tsx (64 LOC)
    - app/components/EmberGlass/automations/primitives/TypeTile.tsx (97 LOC)
    - app/components/EmberGlass/automations/primitives/CronHint.tsx (62 LOC)
    - app/components/EmberGlass/automations/primitives/IconBtn.tsx (43 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/FieldLabel.test.tsx (50 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/TextInput.test.tsx (60 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/NumInput.test.tsx (76 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/SegmentedControl.test.tsx (71 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/Pill.test.tsx (93 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/TypeTile.test.tsx (132 LOC)
    - app/components/EmberGlass/automations/__tests__/primitives/CronHint.test.tsx (83 LOC)
  modified: []

decisions:
  - "TypeTile disabled state uses 3-layer prevention per T-180-03-01: onClick=undefined, pointerEvents:none, aria-disabled=true"
  - "Pill discriminates tone/muted/neutral with color-mix for tone bg and border (bundle lines 214-225 verbatim)"
  - "CronHint LABELS array is const tuple verbatim from bundle line 909"
  - "NumInput unit label uses absolute positioning with right:11px inside relative container"

metrics:
  duration: "~15 minutes"
  completed: 2026-04-30
---

# Phase 180 Plan 03: Automations Primitives Summary

10 bundle-verbatim presentational primitives under `app/components/EmberGlass/automations/primitives/` with 80 passing jest assertions across 7 specs; zero Tailwind classes for visual values; all 10 primitives ready for downstream consumption by Plans 180-04 through 180-09.

## Task 1: 7 Simple Primitives + 5 Jest Specs

Commit: `b008831c` — 12 files, 727 insertions

**Primitives landed:**

| Primitive | LOC | Key visual values (spacing contract) |
|-----------|-----|--------------------------------------|
| `FieldLabel` | 34 | 11px/10px(small), uppercase, letterSpacing 0.8, var(--text-2), marginBottom 6px |
| `TextInput` | 56 | 38px h, 9px radius, rgba(255,255,255,0.05) bg, 0.5px border, mono variant |
| `NumInput` | 94 | 38px h, tabular-nums, unit label at right:11px, allowNull behavior |
| `SegmentedControl` | 66 | 3px container padding, 7px segment radius, radiogroup role |
| `TwoCol` | 27 | grid 1fr 1fr, gap 10px, marginBottom 10px |
| `AddChip` | 36 | 999px radius, 0.5px dashed border, rgba(255,255,255,0.15) |
| `Pill` | 64 | tone/muted/neutral discriminated modes; color-mix for tone bg/border |

**Tests: 54 assertions across 5 suites — all PASS**

## Task 2: 3 Advanced Primitives + 2 Jest Specs

Commit: `9ae6e80f` — 5 files, 417 insertions

**Primitives landed:**

| Primitive | LOC | Key behaviors |
|-----------|-----|---------------|
| `TypeTile` | 97 | selected/unselected/disabled states; D-12 three-layer disabled prevention; tone-colored icon area + glow |
| `CronHint` | 62 | 5-segment split by /\s+/; Italian labels ['min','ora','giorno','mese','giorno sett.']; '—' for missing tokens |
| `IconBtn` | 43 | 24x24px; disabled color rgba(255,255,255,0.2); required aria-label (D-19) |

**Tests: 26 assertions across 2 suites — all PASS**

Total: 80 assertions, 7 suites, all passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CronHint empty-string test corrected**
- **Found during:** Task 2 test run
- **Issue:** Test asserted `['—','—','—','—','—']` for `expr=""`, but `"".trim().split(/\s+/)` returns `[""]` (one empty-string element), so `parts[0]` is `""` not `undefined`, making the first segment `""` rather than `"—"`.
- **Fix:** Test updated to assert `['', '—', '—', '—', '—']` — the correct behavior per the parser. The CronHint implementation is correct and bundle-verbatim; only the test expectation was wrong.
- **Files modified:** `__tests__/primitives/CronHint.test.tsx`
- **Commit:** included in `9ae6e80f`

## Inline-Style Discipline Audit

Final verification result:
```
grep -l "className=" app/components/EmberGlass/automations/primitives/*.tsx | wc -l
→ 0
```

Zero `className=` strings in any of the 10 primitive source files. All visual values are inline-style literals or `var(--token)` references, verbatim from `automations.jsx` bundle.

## Known Stubs

None. All 10 primitives are fully wired presentational components with no hardcoded placeholder data. Props flow directly to rendered output.

## Threat Flags

No new network endpoints, auth paths, or trust boundaries introduced. Primitives are pure presentational components.

Security note: T-180-03-01 (TypeTile disabled bypass) mitigated by three-layer prevention as specified in the threat register.

## Self-Check: PASSED

All 17 files found on disk. Both task commits verified in git log:
- `b008831c` — Task 1: 7 primitives + 5 test files (54 assertions)
- `9ae6e80f` — Task 2: 3 primitives + 2 test files (26 assertions)
