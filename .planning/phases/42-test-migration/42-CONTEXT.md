# Phase 42: Test Migration - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all 112 JS test files to TypeScript (.ts/.tsx) and ensure they pass after migration. Includes migrating Jest config, setup files, and mock files to TypeScript. Tests must compile with zero tsc errors and pass at runtime. No new test coverage or test refactoring — conversion only.

</domain>

<decisions>
## Implementation Decisions

### Mock typing strategy
- Pragmatic typing: type mock return values and parameters where it catches bugs, use `jest.Mock` and `as any` for complex mocks (Firebase, fetch, external APIs)
- No strict `jest.Mock<ReturnType, Parameters>` everywhere — only where it adds value

### Claude's Discretion: Mock factories
- Claude decides: use shared `__mocks__/` typed factories for modules mocked 5+ times across test files, keep inline mocks for the rest
- Type existing helpers (jest.setup, `__mocks__/`) but only create new test utilities where there's clear repetition

### Claude's Discretion: Render typing
- Claude decides per test: type component props objects (`const props: ComponentProps = {...}`) for complex components, keep simple renders as-is

### Jest config migration
- Migrate `jest.config.js` to `jest.config.ts` (TypeScript)
- Migrate `jest.setup.js` to `jest.setup.ts` (TypeScript)
- Migrate all `__mocks__/*.js` files to `.ts` with proper typing
- Coverage thresholds stay at 70% (branches/functions/lines/statements)

### Claude's Discretion: moduleNameMapper paths
- Claude decides whether to update moduleNameMapper references from `.js` to `.ts` or let Jest auto-resolve via moduleFileExtensions

### Test file import updates
- Fix the 3 known broken API route test imports (route.js -> route.ts) during migration, not upfront
- Use `git mv` for all test file renames (preserve git history, consistent with Phases 38-41)

### Claude's Discretion: Import style
- Claude follows whatever import pattern the source files use (extensionless vs explicit)
- Claude converts `require()` to ES module `import` where straightforward, keeps `require()` for dynamic imports or `jest.mock` patterns that need it

### Failing test handling
- Claude fixes runtime failures if quick (<2 min), skips with `test.skip()` + TODO comment if complex
- Pre-existing failures: fix if simple, document complex ones
- Zero tsc errors target on test files (same standard as Phases 38-41)

### Claude's Discretion: Verification cadence
- Claude decides whether to run tests per batch or at the end, based on batch size and risk

</decisions>

<specifics>
## Specific Ideas

- Same `git mv` workflow proven in Phases 38-41 for preserving blame history
- 112 JS test files across: `__tests__/` (root), `lib/__tests__/`, `app/components/ui/__tests__/`, `app/components/**/__tests__/`, `app/api/**/__tests__/`, `app/hooks/__tests__/`, `app/context/__tests__/`
- 3 known broken imports documented in STATE.md blockers section (setthermmode, setroomthermpoint, hue/discover)
- Jest already configured with SWC transformer (`next/dist/build/swc/jest-transformer`) — supports TS natively
- `testMatch` pattern already includes `[jt]s?(x)` — no changes needed for test discovery

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 42-test-migration*
*Context gathered: 2026-02-07*
