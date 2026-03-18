# Phase 92: Jest Configuration - Research

**Researched:** 2026-03-18
**Domain:** Jest 30 configuration — testPathIgnorePatterns, ordering isolation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Add `<rootDir>/tests/` to `testPathIgnorePatterns` in `jest.config.ts` to exclude Playwright files
- Keep existing `testMatch` patterns unchanged — they correctly match unit tests
- Use Jest `--randomize` flag to detect ordering-dependent failures
- Fix shared mutable state in each failing suite (module-level variables, singleton mutation, timer leaks)
- Standard fixes: `beforeEach`/`afterEach` cleanup, `jest.restoreAllMocks()`, `jest.isolateModules()` where needed
- Validate by running `npm test -- --randomize` multiple times with different seeds

### Claude's Discretion
- Exact ordering of fixes (tackle suites in any convenient order)
- Whether to add `--randomize` permanently to the test script or keep it as a validation step
- Choice of isolation technique per suite (beforeEach reset vs jest.isolateModules vs jest.resetModules)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JEST-01 | Playwright .spec.ts files excluded from Jest runner | Add `<rootDir>/tests/` to `testPathIgnorePatterns` — verified mechanism, single-line fix |
| JEST-02 | Flaky tests pass reliably in full suite run (no ordering dependency) | `--randomize` flag confirmed in Jest 30; isolation patterns documented below |
</phase_requirements>

---

## Summary

Jest 30.2.0 is installed. The current `jest.config.ts` has a `testMatch` pattern `**/?(*.)+(spec|test).[jt]s?(x)` that matches the 4 Playwright `.spec.ts` files in `tests/`. Adding `<rootDir>/tests/` to `testPathIgnorePatterns` is the correct, minimal fix — verified by inspecting the config and running `npm test -- --listTests` which confirms all 4 spec files appear in Jest's discovery list.

The `--randomize` flag is confirmed available in Jest 30 (tested: `jest --randomize --passWithNoTests --testPathPatterns=NOMATCH` exits cleanly with code 0). Note: Jest 30 also changed the CLI flag from `--testPathPattern` to `--testPathPatterns` (plural) — this is relevant for any documentation or scripts being written.

The full test suite currently shows 17 failing suites and 38 failing tests. Exactly 4 of the 17 are the Playwright spec files (JEST-01 domain). The remaining 13 are the suites tracked under TFIX-01 through TFIX-12 (Phases 93–94). This phase (92) only needs to address the config change (JEST-01) and global state isolation patterns (JEST-02).

**Primary recommendation:** One-line config change fixes JEST-01. For JEST-02, use `jest.restoreAllMocks()` in `afterEach` within affected suites (or promote it to `jest.setup.ts` globally), then validate with `npm test -- --randomize`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | 30.2.0 | Test runner | Already installed; project standard |
| jest-environment-jsdom | 30.2.0 | Browser-like environment | Already configured in jest.config.ts |
| next/jest | via next@16.1.0 | Next.js-aware Jest transform | Already wired via createJestConfig |

### No new dependencies needed
This phase is pure configuration — no new packages to install.

---

## Architecture Patterns

### Pattern 1: testPathIgnorePatterns for Playwright Exclusion

**What:** Add `tests/` directory to the ignore list in `jest.config.ts`
**When to use:** Whenever a directory contains non-Jest test files that match Jest's testMatch glob

Current state of `testPathIgnorePatterns` in `jest.config.ts`:
```typescript
// Source: jest.config.ts (verified by Read tool)
testPathIgnorePatterns: [
  '<rootDir>/.next/',
  '<rootDir>/node_modules/',
  '<rootDir>/out/',
  '<rootDir>/__tests__/__utils__/',
],
```

Required change:
```typescript
testPathIgnorePatterns: [
  '<rootDir>/.next/',
  '<rootDir>/node_modules/',
  '<rootDir>/out/',
  '<rootDir>/__tests__/__utils__/',
  '<rootDir>/tests/',   // exclude Playwright .spec.ts files
],
```

**Why `testPathIgnorePatterns` not `testMatch` change:** The CONTEXT.md locked decision is to keep `testMatch` unchanged. `testPathIgnorePatterns` takes precedence and is the correct scalpel — it excludes the entire `tests/` directory without touching the glob that correctly finds all `__tests__/` unit files. This matches the existing precedent: `__tests__/__utils__/` is already excluded this way (Phase 43).

### Pattern 2: --randomize for Ordering Independence

**What:** Run the full suite with randomized file order to surface ordering-dependent failures
**Jest 30 syntax (verified):**
```bash
npm test -- --randomize
# or with a specific seed for reproducibility:
npm test -- --randomize --seed=12345
```

`--randomize` randomizes the order of test *files* (suites). Within a file, test order is also randomized when this flag is active.

### Pattern 3: Ordering Independence Fixes

**Root cause pattern:** Module-level singleton state is initialized once at import time and not reset between test files. When suite A runs first and mutates a singleton, suite B gets the already-mutated state.

**Fix hierarchy (prefer in this order):**

1. **`jest.restoreAllMocks()` in afterEach** — restores spies/stubs to original implementation. Already used in some suites but not universally applied.

2. **`jest.resetModules()` in beforeEach** — clears the module registry so the next `require/import` re-evaluates the module fresh. Use for module-level state that cannot be reached via mock reset.

3. **`jest.isolateModules(fn)`** — wraps a block to run with a fresh module registry. Use for single-test isolation when resetting the whole registry is too broad.

4. **`beforeEach` / `afterEach` explicit reset** — reset module-level variables to their initial values. Best when the variable is exported (can be accessed by test) or the module exposes a `reset()`.

**The global `afterEach` in `jest.setup.ts`:**
```typescript
// Source: jest.setup.ts (verified by Read tool)
afterEach(() => {
  jest.clearAllMocks();
  // Restore NextResponse.json implementation after clearAllMocks
  if ((NextResponseMock as any).json.mockImplementation) {
    (NextResponseMock as any).json.mockImplementation(nextResponseJsonImpl);
  }
  localStorageMock.getItem?.mockClear();
  // ...
});
```

`jest.clearAllMocks()` clears mock call history and instances but does NOT restore the original implementation of spied functions. Adding `jest.restoreAllMocks()` here (or replacing `clearAllMocks` with `restoreAllMocks`) would make isolation more robust globally.

**Important distinction:**
- `clearAllMocks()` — resets `.mock.calls`, `.mock.instances`, `.mock.results`, clears mock return values
- `resetAllMocks()` — same as clear PLUS removes any `mockReturnValue` / `mockImplementation`
- `restoreAllMocks()` — same as reset PLUS restores `jest.spyOn` targets to original implementation

For ordering independence, the key is `restoreAllMocks()` for spies. But the existing `jest.setup.ts` also manually re-applies `NextResponseMock.json.mockImplementation` after `clearAllMocks()` — this custom logic must be preserved if switching strategies.

### Pattern 4: Validation with --randomize

Run multiple times to increase confidence (randomize uses different seeds each run):
```bash
npm test -- --randomize
npm test -- --randomize
npm test -- --randomize
# Or pin a seed for regression tests:
npm test -- --randomize --seed=42
```

### Anti-Patterns to Avoid

- **Changing testMatch to exclude `spec`:** Would break any future unit tests using the `.spec.ts` naming convention. Prefer `testPathIgnorePatterns` (directory-based, not pattern-based).
- **Relying solely on `clearAllMocks()` for spy isolation:** Does not restore original implementation, leaving spy wrappers in place that can affect subsequent suites.
- **Adding `--randomize` to the base `npm test` script without confirming all 38 currently-failing tests are fixed first:** Running `--randomize` on a broken suite makes it harder to isolate failures.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Playwright file exclusion | Custom testMatch regex to skip spec files | `testPathIgnorePatterns: ['<rootDir>/tests/']` | Directory-scoped, precedence over testMatch, precedent in this codebase |
| Randomized test ordering | Manual shuffle script | `jest --randomize` | Built into Jest 30, supports `--seed` for reproducibility |
| Module state reset | Custom reset functions in every test file | `jest.resetModules()` or `jest.isolateModules()` | Jest-native, well-tested, no coordination needed |

---

## Common Pitfalls

### Pitfall 1: testPathIgnorePatterns Uses Full Path Matching
**What goes wrong:** Forgetting to use `<rootDir>/` prefix causes the pattern to be treated as a regex against the full absolute path, which may accidentally exclude unexpected files.
**How to avoid:** Always prefix with `<rootDir>/` for directory exclusions (matches existing pattern in this config).
**Warning signs:** More test files disappear than expected when running `--listTests`.

### Pitfall 2: Jest 30 CLI Flag Rename
**What goes wrong:** Using `--testPathPattern` (singular) triggers an error: "Option was replaced by --testPathPatterns."
**Why it happens:** Jest 30 renamed the flag to `--testPathPatterns` (plural).
**How to avoid:** Use `--testPathPatterns` in any scripts, npm scripts, or documentation. The jest.config.ts `testPathIgnorePatterns` key name in config is unchanged.
**Verified:** Running `npm test -- --testPathPattern=X` fails with explicit error message in this project.

### Pitfall 3: restoreAllMocks Breaks Explicit mockImplementation in jest.setup.ts
**What goes wrong:** If `jest.restoreAllMocks()` is added globally to `jest.setup.ts`, the `NextResponseMock.json` spy (line 277) gets restored to `undefined` after each test. The existing post-clearAllMocks handler re-applies the implementation but only checks for `.mockImplementation` property existence.
**How to avoid:** If adding `restoreAllMocks()` globally, audit `jest.setup.ts` to ensure the `NextResponseMock.json` re-application logic still works correctly. The existing handler at line 290 handles `clearAllMocks()` — for `restoreAllMocks()` the mock function itself is restored to the original, not just cleared.
**Recommendation:** Keep per-suite `jest.restoreAllMocks()` in `afterEach` blocks for suites with spies, rather than making it global, to avoid this interaction.

### Pitfall 4: --randomize on a Suite with Ordering Bugs Shows Inconsistent Results
**What goes wrong:** A suite fails in some seeds but passes in others, making it hard to confirm a fix worked.
**How to avoid:** When fixing an ordering issue, pin a seed that reproduces it (`--seed=N`), fix, then verify with that seed, then run unpiped a few times to confirm it's not a different seed's issue.

---

## Code Examples

### JEST-01 Fix (jest.config.ts)
```typescript
// Source: jest.config.ts — minimal verified change
testPathIgnorePatterns: [
  '<rootDir>/.next/',
  '<rootDir>/node_modules/',
  '<rootDir>/out/',
  '<rootDir>/__tests__/__utils__/',
  '<rootDir>/tests/',   // Playwright .spec.ts files
],
```

After this change, `npm test -- --listTests` should show 76 files (currently 80 — 76 unit + 4 spec).

### JEST-02 Validation Command
```bash
# Verify ordering independence:
npm test -- --randomize
# Repeat 3 times with different seeds to build confidence
```

### Per-Suite Isolation Pattern (for ordering-dependent suites)
```typescript
// In a specific test file that has ordering issues:
afterEach(() => {
  jest.restoreAllMocks();
});

// OR for module-level state reset:
beforeEach(() => {
  jest.resetModules();
  // Re-import module under test if needed
});
```

### jest.isolateModules Usage (for single-test isolation)
```typescript
test('isolated test', () => {
  jest.isolateModules(() => {
    const freshModule = require('@/lib/someService');
    // freshModule is a new instance, unaffected by prior test mutations
    expect(freshModule.someState).toBe(initialValue);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `--testPathPattern` (singular) | `--testPathPatterns` (plural) | Jest 30 | CLI scripts using old flag fail with explicit error |
| Manual module isolation per test | `jest.isolateModules()` | Jest 27+ | Cleaner scoping without full registry flush |

---

## Open Questions

1. **Should `--randomize` be added permanently to `npm test`?**
   - What we know: The flag works in Jest 30. It adds a small overhead but ensures ordering independence is validated on every run.
   - What's unclear: Whether the 13 non-Playwright failing suites (TFIX-01 through TFIX-12, addressed in Phases 93–94) have ordering dependencies that would be surfaced.
   - Recommendation: Claude's discretion per CONTEXT.md — add it after Phases 93–94 are complete, so `npm test` always runs with randomization as a built-in safety net.

2. **Does FormModal.test.tsx belong to Phase 92 or Phase 93–94?**
   - What we know: `FormModal.test.tsx` appears in the failing suites list but is not in TFIX-01 through TFIX-12 in REQUIREMENTS.md. It may be an ordering-dependent failure rather than a stand-alone bug.
   - What's unclear: Whether fixing global state isolation (JEST-02) resolves it without explicit inclusion in Phases 93–94.
   - Recommendation: Run `npm test -- --randomize` after the JEST-01 fix to confirm whether FormModal failures are ordering-dependent. If they consistently fail in any order, escalate to Phase 93 scope.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPatterns="jest.config"` (no test, just config validation) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JEST-01 | No Playwright .spec.ts files in Jest run | smoke | `npm test -- --listTests \| grep -v spec` | N/A — listTests output check |
| JEST-02 | Same pass/fail results regardless of order | regression | `npm test -- --randomize` (run 3x) | ✅ existing suite |

### Sampling Rate
- **Per task commit:** `npm test -- --listTests` (verify no spec files) + `npm test` (verify suite count)
- **Per wave merge:** `npm test -- --randomize` (3 runs for seed variance)
- **Phase gate:** Full suite green (excluding Playwright files) before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. This phase modifies the runner configuration, not the tests.

---

## Sources

### Primary (HIGH confidence)
- `jest.config.ts` — verified by Read tool: current testPathIgnorePatterns and testMatch
- `jest.setup.ts` — verified by Read tool: global afterEach, mock setup, clearAllMocks usage
- `npm test -- --listTests` — live output: 4 Playwright spec files confirmed in Jest discovery
- `npm test -- --randomize --passWithNoTests --testPathPatterns=NOMATCH` — live output: flag confirmed supported in Jest 30
- `npm test -- --testPathPattern=X` — live output: confirms Jest 30 renamed to `--testPathPatterns` (plural)

### Secondary (MEDIUM confidence)
- Jest 30 changelog: `testPathPattern` → `testPathPatterns` rename, `--randomize` flag behavior

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- JEST-01 fix: HIGH — single verified config line, precedent in codebase, tested mechanism
- JEST-02 fix: HIGH — `--randomize` confirmed in Jest 30; isolation patterns are Jest-native
- Pitfall around `restoreAllMocks` + `jest.setup.ts` interaction: MEDIUM — identified by code inspection, not a running test

**Research date:** 2026-03-18
**Valid until:** 2026-09-18 (Jest 30 is stable; patterns unlikely to change)
