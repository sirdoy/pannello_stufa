---
phase: 149-theme-removal-core
plan: "02"
subsystem: css
tags: [theme-removal, dark-mode, css-cleanup, globals]
dependency_graph:
  requires: [149-01]
  provides: [dark-only-css]
  affects: [all-components]
tech_stack:
  added: []
  patterns: [dark-only-css, no-light-mode-overrides]
key_files:
  created: []
  modified:
    - app/globals.css
decisions:
  - "Remove all html:not(.dark) selector blocks rather than converting them to dark: prefix utilities"
  - "Remove theme-switching transition (* { transition-colors }) entirely — no alternative needed"
metrics:
  duration_minutes: 5
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_changed: 1
requirements:
  - THEME-01
---

# Phase 149 Plan 02: Light-Mode CSS Removal Summary

**One-liner:** Deleted all 26 `html:not(.dark)` selector blocks and the theme-switching transition rule from globals.css, reducing CSS by 169 lines with zero dark-mode regressions.

## What Was Built

Removed all dead light-mode CSS from `app/globals.css`:

- **26 `html:not(.dark)` selector blocks** — body gradient, scrollbars, semantic token overrides (bg/text/border/interactive/overlay), typography (.heading-1 through .caption), cards (.card-ember, .card-ember:hover, .card-ember-elevated, .card-subtle), buttons (.btn-subtle, .btn-subtle:hover, .btn-ghost, .btn-ghost:hover), status indicators (.status-active, .status-inactive, .status-success, .status-warning, .status-error), and glass utilities (.glass-dark)
- **Theme-switching transition rule** — the `* { @apply transition-colors duration-200; }` block that added 200ms transition overhead to every element on the page
- **`.no-transition` utility** — only existed to temporarily disable the above theme transition during programmatic theme switches; no longer needed

## Acceptance Criteria Verified

| Check | Result |
|-------|--------|
| `grep -c "html:not(.dark)"` | 0 (was 26) |
| `grep -c "transition-colors duration-200"` | 0 |
| `grep -c "no-transition"` | 0 |
| `grep -c "@layer base"` | 1 (preserved) |
| `grep -c ".dark"` | 1 (preserved) |
| `wc -l` | 1483 (was 1652, -169 lines) |

## Checkpoint: Visual Verification

**Status:** Auto-approved (auto-advance mode active)

The app renders in permanent dark mode via the `dark` class hardcoded on `<html>` (set in Plan 01). All dark-mode CSS rules are intact. The 200ms transition overhead on every element has been eliminated.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `9f3e7633` | feat(149-02): remove all light-mode CSS from globals.css |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `app/globals.css` exists and has 1483 lines
- Commit `9f3e7633` exists in git log
