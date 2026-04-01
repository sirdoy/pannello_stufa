# Phase 150: Theme Prefix Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 150-theme-prefix-cleanup
**Areas discussed:** dark: prefix handling, html:not(.dark) handling, batching strategy, design system cleanup
**Mode:** --auto (all decisions auto-selected)

---

## dark: Prefix Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Strip prefix, keep value | `dark:bg-slate-800` → `bg-slate-800` | ✓ |
| Remove entire class | Delete both the light and dark variant | |
| Convert to CSS custom property | Replace with var(--color) | |

**User's choice:** [auto] Strip dark: prefix, keep the value (recommended default)
**Notes:** This preserves the dark appearance which is now the only theme. The light-mode counterpart class should also be removed if present.

---

## html:not(.dark) Selector Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Delete entire rule blocks | Remove all `[html:not(.dark)_&]:` classes | ✓ |
| Convert to standard classes | Keep the value but remove the selector | |

**User's choice:** [auto] Delete entire rule blocks (already decided in Phase 149)
**Notes:** Carried forward from Phase 149 decision D-01. Light-mode overrides have no purpose in dark-only app.

---

## Batching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| By file category | UI components, device components, pages, lib, design system | ✓ |
| By pattern type | dark: files first, then html:not(.dark) files | |
| Single sweep | One plan for everything | |

**User's choice:** [auto] Split by file category (recommended default)
**Notes:** 160+ files benefits from categorical grouping for coherent review and smaller commits.

---

## Design System Page (THEME-10)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove toggle + light examples | Keep dark-only demos, remove theme switching UI | ✓ |
| Full page rewrite | Redesign showcase for dark-only | |

**User's choice:** [auto] Remove theme toggle showcase + light-mode examples (recommended default)
**Notes:** Matches THEME-10 requirement. Minimal change — just delete theme-related sections.

---

## Claude's Discretion

- Exact plan count and file grouping within categories
- Order of plans within the phase
- Edge case handling for dark: in comments/strings
- Whether to combine small categories for efficiency

## Deferred Ideas

None — discussion stayed within phase scope.
