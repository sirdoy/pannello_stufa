# Phase 158: Automations Module - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 158-automations-module
**Areas discussed:** Rule management UI, Execution history display, Rule form complexity, Navigation placement
**Mode:** --auto (all choices auto-selected as recommended defaults)

---

## Rule Management UI

| Option | Description | Selected |
|--------|-------------|----------|
| DataTable + FormModal (v15.0 pattern) | Consistent with Device Registry, Rooms pages — proven CRUD template | ✓ |
| Card-based layout | Visual cards per rule — new pattern, less dense | |
| Simple list | Minimal list without table features | |

**User's choice:** [auto] DataTable + FormModal (v15.0 CRUD pattern) — recommended default
**Notes:** Consistency with existing CRUD pages (Registry, Rooms) is the primary driver.

---

## Execution History Display

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated rule detail page | /automations/[rule_id] with history DataTable — clean separation | ✓ |
| Expandable rows in list | Inline expansion per row — keeps user on list page | |
| Separate /automations/history page | Global history across all rules | |

**User's choice:** [auto] Dedicated rule detail page with history DataTable — recommended default
**Notes:** Per-rule history (AUTO-06) maps naturally to a detail page. Keeps list page clean.

---

## Rule Form Complexity

| Option | Description | Selected |
|--------|-------------|----------|
| Simple form fields (proxy to HA) | Frontend is thin CRUD layer, HA owns rule structure | ✓ |
| Visual rule builder | Drag-and-drop or visual trigger/condition/action editor | |
| JSON editor | Raw JSON editing for power users | |

**User's choice:** [auto] Simple form fields proxied to HA backend — recommended default
**Notes:** HA backend owns automation logic. Frontend should not duplicate rule-building complexity.

---

## Navigation Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level nav entry | "Automazioni" at same level as Stanze, Registro | ✓ |
| Nested under settings | Sub-item under an existing nav group | |
| Dashboard card only | Access only from dashboard, no nav entry | |

**User's choice:** [auto] Top-level nav entry — recommended default
**Notes:** Automations are a first-class feature warranting top-level visibility.

---

## Claude's Discretion

- Proxy function naming and grouping
- DataTable column selection for both lists
- Loading skeletons and empty state text
- Error handling UX patterns

## Deferred Ideas

None — discussion stayed within phase scope
