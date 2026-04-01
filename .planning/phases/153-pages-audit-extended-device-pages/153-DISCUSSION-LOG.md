# Phase 153: Pages Audit — Extended Device Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 153-pages-audit-extended-device-pages
**Areas discussed:** Fix depth, Raspi small grids, Sonos sub-components, Plan grouping
**Mode:** --auto (all choices auto-selected)

---

## Fix Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Page-level only | Fix only page.tsx layouts, skip sub-components | |
| Drill into sub-components | Fix page layouts AND sub-component grids/min-widths | ✓ |

**User's choice:** [auto] Drill into sub-components (recommended — Sonos has 14 sub-components with grid/min-w patterns)
**Notes:** Sonos and Raspi have layout patterns inside sub-components that will overflow at 375px if not addressed

---

## Raspi Small Grids

| Option | Description | Selected |
|--------|-------------|----------|
| Keep grid-cols-3 | Tiny stat boxes fit at 375px with gap-3 | ✓ |
| Reduce to grid-cols-2 | Safer mobile layout but wastes space | |

**User's choice:** [auto] Keep grid-cols-3 (recommended — single-value stat boxes are small enough)
**Notes:** Verify visually after implementation. If any box overflows, switch to grid-cols-2 sm:grid-cols-3

---

## Sonos Sub-Components

| Option | Description | Selected |
|--------|-------------|----------|
| overflow-x-auto wrappers | Add scroll wrappers where needed, verify all visually | ✓ |
| Responsive restructuring | Rewrite layouts to stack on mobile | |
| Minimal — page-level only | Only fix the page orchestrator | |

**User's choice:** [auto] overflow-x-auto wrappers where needed (recommended — consistent with Phase 152 D-03)
**Notes:** SonosHistoryChart table and SonosSpeakerVolume are the most likely to need wrappers

---

## Plan Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 01: Device pages, Plan 02: Rooms | Sonos+DIRIGERA+Raspi+Tuya in Plan 01, all Rooms in Plan 02 | ✓ |
| Plan 01: Simple pages, Plan 02: Complex | Group by complexity | |

**User's choice:** [auto] Plan 01: Device pages, Plan 02: Rooms (recommended — matches requirement grouping AUDIT-06/07/08/09 vs AUDIT-10)
**Notes:** Tuya likely needs minimal work (already responsive), so Plan 01 workload is balanced

---

## Claude's Discretion

- Exact responsive breakpoint choices per component
- Whether specific Sonos sub-components need overflow-x-auto or responsive restructuring
- Whether Raspi grids need adjustment after visual inspection
- Order of page fixes within each plan

## Deferred Ideas

None — discussion stayed within phase scope
