# Phase 154: Pages Audit — Admin & Support Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 154-pages-audit-admin-support-pages
**Areas discussed:** Camera pages, Offline grid handling, Design-system scope, Plan grouping
**Mode:** --auto (all decisions auto-selected)

---

## Camera Pages (AUDIT-14)

| Option | Description | Selected |
|--------|-------------|----------|
| Mark N/A | Camera pages don't exist — skip AUDIT-14 | ✓ |
| Search alternative paths | Look for camera under different route names | |

**User's choice:** [auto] Mark AUDIT-14 as N/A — camera pages don't exist in the codebase
**Notes:** No `app/camera/` directory found. Grep for "camera" in page files only found references in thermostat, debug/design-system, and rooms/status — none are standalone camera pages.

---

## Offline Grid Handling

| Option | Description | Selected |
|--------|-------------|----------|
| grid-cols-1 sm:grid-cols-3 | Consistent with all other audit fixes | ✓ |
| grid-cols-2 sm:grid-cols-3 | Two columns at mobile, three at desktop | |
| Keep as-is | Leave grid-cols-3, verify it works | |

**User's choice:** [auto] grid-cols-1 sm:grid-cols-3 — consistent with Phase 151/152/153 pattern
**Notes:** `grid-cols-3` at 375px with padding gives ~100px per column which is tight. Single-column at mobile is safest.

---

## Design-System Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude | 138KB showcase, already audited in Phase 151 | ✓ |
| Include | Audit alongside other debug pages | |

**User's choice:** [auto] Exclude — developer showcase page, not user-facing, already audited in Phase 151
**Notes:** `/debug/design-system/page.tsx` is 138KB with dozens of grid patterns that are intentional showcase examples, not user-facing layouts.

---

## Plan Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Admin / Support split | Plan 01: Registry + Settings. Plan 02: Debug + Remaining | ✓ |
| By size | Group small pages together, large pages separate | |
| Single plan | All pages in one plan | |

**User's choice:** [auto] Admin/Support split — groups by page purpose, balances workload
**Notes:** Plan 01 covers ~10 pages (2 registry + 8 settings). Plan 02 covers ~10 pages (7 debug + 3 remaining). Balanced split.

---

## Claude's Discretion

- Exact responsive breakpoint choices per component
- Whether grid-cols-2 stat grids in debug pages need adjustment after visual inspection
- Order of page fixes within each plan
- Prefer Playwright verification over unit tests for layout changes

## Deferred Ideas

None — discussion stayed within phase scope
