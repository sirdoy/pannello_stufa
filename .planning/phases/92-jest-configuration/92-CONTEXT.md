# Phase 92: Jest Configuration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure the Jest test runner so Playwright `.spec.ts` files are excluded and all unit/integration tests pass regardless of execution order. No test code changes beyond fixing shared global state leaks.

</domain>

<decisions>
## Implementation Decisions

### Playwright exclusion strategy
- Add `<rootDir>/tests/` to `testPathIgnorePatterns` in `jest.config.ts`
- Keep existing `testMatch` patterns unchanged — they correctly match unit tests
- No need to change testMatch because `testPathIgnorePatterns` takes precedence and is more explicit

### Ordering isolation approach
- Use Jest `--randomize` flag to detect ordering-dependent failures
- Fix shared mutable state in each failing suite (e.g., module-level variables, singleton mutation, timer leaks)
- Standard fixes: `beforeEach`/`afterEach` cleanup, `jest.restoreAllMocks()`, `jest.isolateModules()` where needed
- Validate by running `npm test -- --randomize` multiple times with different seeds

### Claude's Discretion
- Exact ordering of fixes (tackle suites in any convenient order)
- Whether to add `--randomize` permanently to the test script or keep it as a validation step
- Choice of isolation technique per suite (beforeEach reset vs jest.isolateModules vs jest.resetModules)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Jest configuration
- `jest.config.ts` — Current Jest configuration with testMatch and testPathIgnorePatterns
- `jest.setup.ts` — Test setup file (global mocks, environment prep)

### Test infrastructure
- `docs/testing.md` — Project testing documentation and patterns
- `__mocks__/` — Shared mock files used across test suites

### Requirements
- `.planning/REQUIREMENTS.md` §Jest Configuration — JEST-01 (Playwright exclusion), JEST-02 (ordering independence)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `jest.config.ts`: Already has `testPathIgnorePatterns` array — just needs `tests/` entry added
- `jest.setup.ts`: Global setup file, good place to add universal cleanup if needed

### Established Patterns
- `__utils__/` already excluded via testPathIgnorePatterns (Phase 43 precedent)
- `jest.mocked()` for type-safe mock access (v5.0 convention)
- `jest.restoreAllMocks()` used in some suites but not universally

### Integration Points
- `package.json` test script — may need `--randomize` added for CI verification
- 4 Playwright files in `tests/features/` and `tests/smoke/` — these are the files to exclude
- ~12 failing test suites identified in Phases 93-94 — ordering issues may overlap with some of those

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Jest configuration best practices apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 92-jest-configuration*
*Context gathered: 2026-03-18*
