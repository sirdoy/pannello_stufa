# Phase 93: API & Infrastructure Test Fixes - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 8 failing server-side and infrastructure test suites so every assertion passes with no skips. This phase fixes tests only — no new test coverage, no new features, no production code changes unless a test reveals an actual bug.

</domain>

<decisions>
## Implementation Decisions

### Fix approach
- Diagnose each failing suite individually — fix whichever side is wrong (test or code)
- If a test expectation is stale (code changed, test not updated), update the test to match current behavior
- If a test reveals an actual code bug, fix the code — but scope the fix to the exact issue
- Document root cause per suite in plan so reviewer understands why it failed

### Mock strategy
- Use explicit `beforeEach` reset for mocks that retain state across tests (consistent with Phase 92 finding: `clearAllMocks` doesn't reset `mockReturnValue`/`mockImplementation`)
- Use `jest.mocked()` for type-safe mock access (project convention from v5.0)
- Use `jest.isolateModules()` only when module-level singleton state causes cross-test pollution
- Prefer `jest.restoreAllMocks()` in `afterEach` for full cleanup

### Plan grouping
- Group related suites into logical plans by domain area to reduce overhead
- Suggested grouping: (1) core middleware + changelog, (2) stove + maintenance + scheduler, (3) health dead man switch, (4) fritzbox history + devices-events
- Plans can run in parallel since suites are independent

### Claude's Discretion
- Exact grouping of suites into plans (may adjust based on root cause analysis)
- Whether a failing assertion needs a test fix or a code fix (diagnose per case)
- Order of execution within a plan
- Whether to add defensive guards in tests to prevent future regression

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Failing test suites (all 8 files)
- `lib/core/__tests__/middleware.test.ts` — 3 withIdempotency tests (TFIX-01)
- `lib/__tests__/changelogService.test.ts` — 4 saveVersion/syncVersion tests (TFIX-02)
- `lib/__tests__/stoveApi.test.ts` — 1 fetchWithRetry retry logging test (TFIX-03)
- `lib/__tests__/maintenanceService.test.ts` — 1 needsCleaning threshold test (TFIX-04)
- `lib/__tests__/schedulerService.test.ts` — 5 save/set/clear schedule tests (TFIX-05)
- `__tests__/lib/healthDeadManSwitch.test.ts` — 1 ADMIN_USER_ID skip test (TFIX-06)
- `app/api/fritzbox/__tests__/history.test.ts` — 6 range/filter/empty tests (TFIX-07)
- `app/api/fritzbox/__tests__/devices-events.test.ts` — 6 event detection tests (TFIX-08)

### Source files under test
- `lib/core/middleware.ts` — Idempotency middleware
- `lib/changelogService.ts` — Version changelog service
- `lib/stoveApi.ts` — Stove API client with retry
- `lib/maintenanceService.ts` — Maintenance tracking service
- `lib/schedulerService.ts` — Schedule management service
- `lib/healthDeadManSwitch.ts` — Health check dead man switch
- `app/api/fritzbox/history/route.ts` — Fritz!Box history API
- `app/api/fritzbox/devices-events/route.ts` — Fritz!Box device events API

### Test infrastructure
- `jest.config.ts` — Jest configuration (Phase 92 updated)
- `jest.setup.ts` — Global test setup and mocks
- `__mocks__/` — Shared mock files
- `docs/testing.md` — Project testing documentation

### Prior phase context
- `.planning/phases/92-jest-configuration/92-CONTEXT.md` — Phase 92 decisions: `clearAllMocks` doesn't reset mockReturnValue, `jest.restoreAllMocks()` pattern, ordering isolation approach

### Requirements
- `.planning/REQUIREMENTS.md` §Test Fixes — API & Infrastructure — TFIX-01 through TFIX-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `jest.mocked()`: Type-safe mock access convention (v5.0 standard)
- `jest.setup.ts`: Global setup — already configures common mocks
- `__mocks__/`: Shared mock modules for firebase, auth0, etc.

### Established Patterns
- `beforeEach` with explicit mock reset (Phase 92 established this as the reliable pattern)
- `jest.isolateModules()` for singleton state isolation (Phase 43 pattern)
- `filterUndefined()` for Firebase writes (must be preserved in any code fixes)
- `jest.restoreAllMocks()` in `afterEach` for full cleanup

### Integration Points
- Phase 92 fixed ordering-dependent flakes — some Phase 93 suites may have been partially fixed by Phase 92's `beforeEach` reset pattern
- All 8 suites are server-side (lib/ and app/api/) — no React/DOM testing concerns
- Fritz!Box tests depend on shared HA client mocks (`haGet`/`haPost`)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard test diagnosis and fix workflow applies.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 93-api-infrastructure-test-fixes*
*Context gathered: 2026-03-18*
