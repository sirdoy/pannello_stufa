# Phase 161: Netatmo Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 161-netatmo-gap-closure
**Areas discussed:** Route migration strategy, Missing proxy functions, Test strategy, Old route handling
**Mode:** --auto (all decisions auto-selected)

---

## Route Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| All 21 endpoints | Create v1 routes for every endpoint in the Netatmo API spec | ✓ |
| Only 9 gap endpoints | Create v1 routes only for NETA-01 through NETA-09 requirements | |

**User's choice:** [auto] All 21 endpoints (recommended default — complete provider migration)
**Notes:** Matches Phase 160 Sonos approach of full provider v1 coverage.

---

## Missing Proxy Functions

| Option | Description | Selected |
|--------|-------------|----------|
| Add to netatmoProxy.ts | Add haGet/haPost wrappers following existing pattern | ✓ |
| Inline in routes | Handle directly in route handlers without proxy functions | |

**User's choice:** [auto] Add to netatmoProxy.ts (recommended default)
**Notes:** 4 new functions needed: getProxyThermState, proxyCalibrateValve, proxyRenameHome, getProxyHomeData.

---

## Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located per route | __tests__/route.test.ts in each route directory | ✓ |
| Grouped test files | Single test file per domain area (energy, camera, valves) | |

**User's choice:** [auto] Co-located per route (recommended default — matches Phase 160 pattern)
**Notes:** Consistent with Sonos v1 route tests from Phase 160.

---

## Old Route Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep for compatibility | Old /api/netatmo/* routes remain untouched | ✓ |
| Add deprecation headers | Keep but add Deprecation/Sunset headers | |
| Redirect to v1 | 301 redirect old routes to /api/v1/netatmo/* | |

**User's choice:** [auto] Keep for compatibility (recommended default — same as Phase 160 D-01)
**Notes:** Frontend hooks still reference old routes; migration is a separate concern.

---

## Claude's Discretion

- Log tag naming convention for withAuthAndErrorHandler
- Test assertion granularity and mock structure
- Query parameter parsing for getroommeasure

## Deferred Ideas

None — auto-mode stayed within phase scope.
