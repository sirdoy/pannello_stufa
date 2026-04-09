# Phase 160: Sonos Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 160-sonos-gap-closure
**Mode:** --auto (all decisions auto-selected)
**Areas discussed:** Route retention, Frontend update scope, Test coverage, Response consistency

---

## Route Retention Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep old routes | Old `/api/sonos/zones/*` routes remain for backwards compatibility | ✓ |
| Remove old routes | Delete old routes, frontend must use v1 paths | |

**User's choice:** [auto] Keep old routes (recommended — matches Phase 159 D-01 and Phase 156 pattern)
**Notes:** Consistent with all prior gap closure phases that kept old routes intact

---

## Frontend Update Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Defer frontend migration | Frontend hooks keep using old paths, v1 routes exist for API alignment | ✓ |
| Update frontend hooks | Migrate useSonosData/useSonosCommands to v1 paths in this phase | |

**User's choice:** [auto] Defer frontend migration (recommended — keeps phase focused on route creation)
**Notes:** Phase 159 (Hue) also deferred frontend migration

---

## Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located tests | `__tests__/route.test.ts` per route directory | ✓ |
| Single test file | One test file covering all 13 routes | |

**User's choice:** [auto] Co-located tests (recommended — matches Phase 159 D-06 pattern)
**Notes:** Consistent with existing test organization in the project

---

## Response Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Match existing shapes | V1 routes return identical responses to old routes | ✓ |
| Normalize to v1 conventions | Restructure responses for v1 consistency | |

**User's choice:** [auto] Match existing shapes (recommended — v1 routes are thin wrappers)
**Notes:** Command routes include suggested_poll_delay_s: 1 in 202 responses

---

## Claude's Discretion

- Log tag naming (e.g., 'Sonos/Zones/Playback')
- Test assertion granularity
- Query parameter parsing for queue endpoint

## Deferred Ideas

None — all decisions within phase scope
