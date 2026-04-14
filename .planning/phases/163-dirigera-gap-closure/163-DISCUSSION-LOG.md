# Phase 163: DIRIGERA Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 163-dirigera-gap-closure
**Mode:** `--auto` (all gray areas resolved via recommended defaults)
**Areas discussed:** Route Path Convention, Client Function Signatures, Types & Envelopes, Route Implementation, Tests

---

## Route Path Convention

| Option | Description | Selected |
|--------|-------------|----------|
| Routes under `app/api/v1/dirigera/*` | Matches roadmap goal verbatim and `docs/api/dirigera.md` base path. Leaves existing `/api/dirigera/*` routes in place. | ✓ |
| Routes under `app/api/dirigera/*` | Mirrors Phase 162 (Fritz!Box) convention. Inconsistent with the spec path stated in the roadmap. | |
| Full v1 migration (move all existing dirigera routes to v1) | Matches Phase 161 (Netatmo) precedent. Out of scope for a gap-closure phase. | |

**Auto-selected:** Option 1 — literal roadmap match, minimal scope.
**Notes:** Mixed-state tradeoff explicitly accepted; a dedicated migration phase can consolidate later (captured in Deferred Ideas).

---

## Client Function Signatures

| Option | Description | Selected |
|--------|-------------|----------|
| Single params object (`getHistory(params?: SensorHistoryParams)`) | Scales cleanly with 4–6 optional fields; self-documenting at call sites. | ✓ |
| Positional args (`getHistory(sensorId?, eventType?, start?, end?, limit?, offset?)`) | Simpler signature but fragile with 6 optional params. | |
| Multiple overloaded functions per filter combination | Over-engineered for this surface area. | |

**Auto-selected:** Option 1.
**Notes:** `getStats()` takes no args; history and telemetry share the params-object pattern.

---

## Types & Envelopes

| Option | Description | Selected |
|--------|-------------|----------|
| Use existing `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse` from `types/dirigeraProxy.ts` | Types already declared (Phase 130, under "FUTURE-PHASE TYPES" comment). Zero new response-type work. | ✓ |
| Refactor to use generic `PaginatedResponse<T>` from `types/common.ts` | Would require renaming response fields (`events`→`items`, `total`→`total_count`) and diverging from the docs spec. | |
| Redefine types inline in the proxy module | Duplicates existing work. | |

**Auto-selected:** Option 1.
**Notes:** Two new param interfaces (`SensorHistoryParams`, `SensorTelemetryParams`) added alongside the response types.

---

## Route Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Thin delegation with `withAuthAndErrorHandler` | Matches `app/api/dirigera/sensors/route.ts` pattern exactly. Route parses query string and forwards typed params to proxy. | ✓ |
| Add rate-limiting + caching wrapper (Fritz!Box style) | Existing DIRIGERA routes don't have this. Would introduce inconsistency across DIRIGERA. | |
| Inline response shaping in the route | Violates raw pass-through rule from Phase 162. | |

**Auto-selected:** Option 1.
**Notes:** Invalid numeric params dropped silently; HA proxy is the source of truth for validation and clamping.

---

## Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Extend lib test + add co-located route tests | Matches the trajectory started in Phase 162 (route tests for gap-closure phases). Covers both transport and route layer. | ✓ |
| Lib test only (existing DIRIGERA pattern) | Simpler but leaves route auth + param forwarding uncovered. | |
| Route tests only | Skips proxy-level query string serialization verification. | |

**Auto-selected:** Option 1.
**Notes:** First co-located route tests in the DIRIGERA module — establishes the pattern going forward.

---

## Claude's Discretion

- Plan granularity (one plan vs two — likely one given small surface).
- Exact Jest mock shape for `haGet` in new tests.
- Placement of new param interfaces within `types/dirigeraProxy.ts`.

## Deferred Ideas

- Migrate existing `/api/dirigera/*` routes to `/api/v1/dirigera/*` in a dedicated phase.
- Frontend UI for sensor history and telemetry charts.
- Rate-limiting / caching for DIRIGERA reads (if polling pressure emerges).
