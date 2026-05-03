---
phase: 182-design-system-reference-page-v2
plan: "02"
subsystem: EmberGlass/cards
tags: [primitive, circular-button, tdd, barrel]
dependency_graph:
  requires: []
  provides: [CircBtn, CircBtnProps]
  affects: [app/components/EmberGlass/index.ts]
tech_stack:
  added: []
  patterns: [inline-style-only, use-client, RC-clean, explicit-barrel-exports]
key_files:
  created:
    - app/components/EmberGlass/cards/CircBtn.tsx
    - app/components/EmberGlass/cards/index.ts
    - app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx
  modified:
    - app/components/EmberGlass/index.ts
decisions:
  - "sw prop renamed to strokeWidth in lucide-react JSX (only adaptation from bundle source)"
  - "data-testid switches: circ-btn-primary (primary) / circ-btn (default) per test contract"
  - "cards/index.ts uses explicit named exports only — no export* to avoid shadowing existing cards"
  - "comment text cleaned to avoid false-positive grep matches on export* and sw={2.2}"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-03T12:15:58Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 182 Plan 02: CircBtn Primitive Summary

CircBtn 34x34 circular button primitive ported verbatim from bundle (cards.jsx:298-308), with sw→strokeWidth lucide-react adaptation, explicit barrel exports, and 4 passing Jest tests (TDD RED→GREEN).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write failing CircBtn Jest spec (RED) | d460caba | cards/__tests__/CircBtn.test.tsx |
| 2 | CircBtn.tsx + cards/index.ts + main barrel (GREEN) | 55226285 | cards/CircBtn.tsx, cards/index.ts, EmberGlass/index.ts |

## What Was Built

- `app/components/EmberGlass/cards/CircBtn.tsx`: 34x34 circular button primitive. Primary variant fills with `tone` prop + dark text (`#1a0f08`). Default variant uses `rgba(255,255,255,0.08)` translucent fill + white text. `strokeWidth={2.2}` lucide prop (bundle had `sw={2.2}`). `data-testid` switches between `circ-btn-primary` and `circ-btn` based on `primary` prop.
- `app/components/EmberGlass/cards/index.ts`: Minimal barrel with explicit `export { CircBtn }` + `export type { CircBtnProps }` — no wildcard re-exports.
- `app/components/EmberGlass/index.ts`: 3 lines appended — Phase 182 comment + `export { CircBtn }` + `export type { CircBtnProps }` from `./cards/CircBtn`.
- `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx`: 4-test Jest spec covering size, primary bg, default bg, click handler.

## Deviations from Plan

None — plan executed exactly as written. One minor note: the plan's `grep -c "sw={2.2}"` acceptance check expected `0` but the original comment text included `sw={2.2}` as a documentation string. Updated comment to say "sw prop renamed to strokeWidth" to satisfy the clean grep check without losing documentation intent.

## TDD Gate Compliance

- RED gate commit: `d460caba` (test(182-02): add failing CircBtn Jest spec)
- GREEN gate commit: `55226285` (feat(182-02): implement CircBtn primitive + barrel wiring)
- Both gates present in correct order.

## Known Stubs

None. CircBtn is a fully functional primitive with no placeholder data.

## Threat Flags

None. The `tone` prop is passed to `style.background` (CSSOM; no script injection path). Consistent with T-182-02-01 disposition: accept.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| app/components/EmberGlass/cards/CircBtn.tsx | FOUND |
| app/components/EmberGlass/cards/index.ts | FOUND |
| app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx | FOUND |
| commit d460caba (RED) | FOUND |
| commit 55226285 (GREEN) | FOUND |
