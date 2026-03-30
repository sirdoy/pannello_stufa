# Phase 146: Raspi WS Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 146-raspi-ws-migration
**Areas discussed:** WS Adapter Shape, Polling Fallback, LastUpdated Placement, Health Computation
**Mode:** --auto (all decisions auto-selected)

---

## WS Adapter Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Direct field mapping | Map WS fields inline in handler, same as fetchData | ✓ |
| Standalone adapter function | Pure function like adaptNetatmoWsPayload | |
| Shared adapter utility | Generic adapter for all simple providers | |

**User's choice:** [auto] Direct field mapping (recommended default)
**Notes:** WS RaspiData shape is close to what the hook needs — no complex transformation like Netatmo required.

---

## Polling Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 60s/300s pattern | Same intervals as current, suppress when WS live | ✓ |
| Shorter fallback (30s/120s) | More aggressive polling when WS down | |
| Longer fallback (120s/600s) | Less aggressive, reduce API load | |

**User's choice:** [auto] Keep 60s/300s pattern (recommended default)
**Notes:** Consistent with all 6 other migrated hooks. No reason to deviate.

---

## LastUpdated Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Card footer | Standard position, same as other device cards | ✓ |
| Inside HealthIndicator | Combine with health badge | |
| Below stats grid | After the stats but before footer | |

**User's choice:** [auto] Card footer (recommended default)
**Notes:** All other cards use footer placement. Consistency is the right call.

---

## Health Computation

| Option | Description | Selected |
|--------|-------------|----------|
| Compute from WS payload | Use cpu_percent, memory, disk, system from WS data | ✓ |
| Separate health side-fetch | Fetch /api/raspi/health like DIRIGERA pattern | |
| Dual source | WS for data, periodic health check for accuracy | |

**User's choice:** [auto] Compute from WS payload (recommended default)
**Notes:** Unlike DIRIGERA (which has a dedicated health endpoint with extra info), Raspi health is derived purely from the same metrics the hook already has. No side-fetch needed.

---

## Claude's Discretion

- Hook internal state management patterns (refs, effect cleanup)
- Test file updates and WS context mocking approach

## Deferred Ideas

None — discussion stayed within phase scope
