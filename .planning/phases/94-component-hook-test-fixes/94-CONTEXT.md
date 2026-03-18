# Phase 94: Component & Hook Test Fixes - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 4 failing component and hook test suites so every assertion passes with no skips. This phase fixes tests only — no new test coverage, no new features, no production code changes unless a test reveals an actual bug.

</domain>

<decisions>
## Implementation Decisions

### Fix approach
- Diagnose each failing suite individually — fix whichever side is wrong (test or code)
- If a test expectation is stale (code changed, test not updated), update the test to match current behavior
- If a test reveals an actual code bug, fix the code — but scope the fix to the exact issue
- Document root cause per suite in plan so reviewer understands why it failed
- Carried forward from Phase 93 — same approach for consistency

### Mock strategy
- Use explicit `beforeEach` reset for mocks that retain state across tests (Phase 92 finding: `clearAllMocks` doesn't reset `mockReturnValue`/`mockImplementation`)
- Use `jest.mocked()` for type-safe mock access (project convention from v5.0)
- Use `jest.restoreAllMocks()` in `afterEach` for full cleanup
- For React hooks: mock `useAdaptivePolling` and `useVisibility` with explicit `mockImplementation` reset per test
- For React contexts: use provider wrappers in `renderHook` options

### Plan grouping
- Plan 1: StovePrimaryActions (TFIX-09) + VersionContext (TFIX-12) — component rendering tests with JSX/providers
- Plan 2: useNetworkData (TFIX-10) + useDeviceHistory (TFIX-11) — hook tests with fetch mocking and async state
- Plans can run in parallel since suites are independent

### React testing patterns
- Use `act()` for state updates triggered by async operations
- Use `waitFor()` for assertions on async state changes
- Provider wrappers for context-dependent tests (VersionContext uses VersionProvider)
- `@testing-library/react` renderHook for hook tests — follow existing patterns in test files

### Claude's Discretion
- Exact root cause diagnosis per suite (may be stale mocks, timing issues, or code changes)
- Whether to restructure test setup blocks or just fix failing assertions
- Order of fixes within a plan

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Failing test suites (all 4 files)
- `__tests__/components/devices/stove/components/StovePrimaryActions.test.tsx` — 3 disable state tests (TFIX-09)
- `app/components/devices/network/__tests__/useNetworkData.test.ts` — stale flag timeout test (TFIX-10)
- `app/network/hooks/__tests__/useDeviceHistory.test.ts` — fetch/refresh tests (TFIX-11)
- `app/context/__tests__/VersionContext.test.tsx` — 4 version check tests (TFIX-12)

### Source files under test
- `app/components/devices/stove/components/StovePrimaryActions.tsx` — Stove ignite/shutdown action buttons
- `app/components/devices/network/hooks/useNetworkData.ts` — Network data polling hook
- `app/network/hooks/useDeviceHistory.ts` — Fritz!Box device history hook
- `app/context/VersionContext.tsx` — Version check context provider

### Test infrastructure
- `jest.config.ts` — Jest configuration (Phase 92 updated)
- `jest.setup.ts` — Global test setup and mocks
- `__mocks__/` — Shared mock files
- `docs/testing.md` — Project testing documentation

### Prior phase context
- `.planning/phases/92-jest-configuration/92-CONTEXT.md` — Phase 92 decisions: `clearAllMocks` doesn't reset mockReturnValue, ordering isolation
- `.planning/phases/93-api-infrastructure-test-fixes/93-CONTEXT.md` — Phase 93 decisions: fix approach, mock strategy, plan grouping

### Requirements
- `.planning/REQUIREMENTS.md` §Test Fixes — Components & Hooks — TFIX-09 through TFIX-12

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `jest.mocked()`: Type-safe mock access convention (v5.0 standard)
- `jest.setup.ts`: Global setup — already configures common mocks
- `__mocks__/`: Shared mock modules for firebase, auth0, etc.
- `@testing-library/react`: renderHook, waitFor, act already used in all 4 test files

### Established Patterns
- `beforeEach` with explicit mock reset (Phase 92 established as reliable pattern)
- `jest.isolateModules()` for singleton state isolation (Phase 43 pattern)
- `jest.restoreAllMocks()` in `afterEach` for full cleanup
- `act()` wrapper for state updates in hook tests
- Provider wrappers passed as `{ wrapper }` option to `renderHook`

### Integration Points
- Phase 92 fixed ordering-dependent flakes — some Phase 94 suites may have been partially fixed
- StovePrimaryActions test uses `@testing-library/react` with `render/screen/fireEvent`
- useNetworkData test mocks `useAdaptivePolling` and `useVisibility` — these are project hooks
- useDeviceHistory test mocks `global.fetch` directly
- VersionContext test mocks `changelogService`, `version`, and `environmentHelper` modules

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard test diagnosis and fix workflow applies. Follow the same patterns established in Phase 93 for consistency.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 94-component-hook-test-fixes*
*Context gathered: 2026-03-18*
