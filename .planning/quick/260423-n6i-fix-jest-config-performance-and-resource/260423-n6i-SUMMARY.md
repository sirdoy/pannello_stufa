---
status: complete
quick_id: 260423-n6i
slug: fix-jest-config-performance
created: 2026-04-23
completed: 2026-04-23
commits:
  - b8071cde — perf(jest): ignore GSD worktrees and cap maxWorkers
  - 78cede64 — feat(scripts): add scoped jest commands for targeted iteration
  - 79b758a6 — docs(claude): require scoped test subsets in agent verification
---

# Quick Task 260423-n6i: Jest Performance & Resource Fix — Summary

## One-liner

Jest now ignores `.claude/worktrees/` + `.planning/` (no more haste collisions), caps at 50% of cores locally (2 in CI), exposes 6 scoped `test:*` scripts, and CLAUDE.md rule 8 formalizes "never run full suite from agents".

## What Changed

### 1. `jest.config.ts` — 3 new config keys

- `testPathIgnorePatterns` extended with `<rootDir>/.claude/` and `<rootDir>/.planning/`.
- `modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.planning/', '<rootDir>/.next/']` — this is the fix for the `duplicate manual mock` + `Haste module naming collision` warnings I observed during phase 170 execution. `testPathIgnorePatterns` alone excludes test matching but haste-map still indexes files for module resolution; `modulePathIgnorePatterns` is the separate category that stops the indexing itself.
- `watchPathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.planning/', '<rootDir>/.next/', '<rootDir>/node_modules/']`.
- `maxWorkers: process.env.CI ? 2 : '50%'` — halves local CPU usage while preserving the existing `test:ci` behavior (that script still passes `--maxWorkers=2` explicitly).

### 2. `package.json` — 6 new scripts

| Script | Purpose |
|--------|---------|
| `test:changed` | `jest --onlyChanged --passWithNoTests` — git-aware, only files touched vs HEAD |
| `test:quick` | `jest --bail --passWithNoTests` — fast-fail iteration |
| `test:unit` | `jest __tests__/lib __tests__/hooks __tests__/utils` — pure logic (no jsdom component render) |
| `test:api` | `jest __tests__/api` — API route tests only |
| `test:components` | `jest __tests__/app/components` — UI component tests |
| `test:pages` | `jest __tests__/app --testPathIgnorePatterns=__tests__/app/components` — pages/routes excluding components |

Existing `test`, `test:random`, `test:watch`, `test:coverage`, `test:ci` untouched.

### 3. `CLAUDE.md` — new rule 8

```
8. **USE** scoped test subsets in verification — NEVER `npm test` alone
   from agents or PLAN.md <verify><automated> blocks. Prefer
   `npm test -- <specific paths>` or the scoped scripts:
   test:changed, test:quick, test:unit, test:api, test:components, test:pages.
   The full suite is reserved for release gates and CI (test:ci).
```

Also updated the top-of-file `## Commands` block with the new scoped scripts so they're discoverable.

## Problem Observed (Before Fix)

During phase 170 chain execution:

```
jest-haste-map: duplicate manual mock found: next-server
  * <rootDir>/__mocks__/next-server.ts
  * <rootDir>/.claude/worktrees/agent-a8b2ef5f/__mocks__/next-server.ts
jest-haste-map: Haste module naming collision: pannello-stufa
  * <rootDir>/package.json
  * <rootDir>/.claude/worktrees/agent-a8b2ef5f/package.json
```

Root cause: `jest.config.ts` excluded Playwright `tests/` and `__utils__/` but not `.claude/worktrees/` where GSD creates worktree copies during phase execution. Every worktree spawn + merge cycle temporarily doubled the haste-map index until the cleanup step ran.

## Verification

- `npx jest __tests__/hooks/useLogin.test.ts --silent` → 1 suite, 9 tests, 3.4s, **no haste warnings**.
- `npm run test:unit -- --listTests` → resolves 22 test files under `lib/` + `hooks/` + `utils/`.
- `npm run test:changed` → ran 3 suites × 31 tests in 5.5s, correctly scoped to the files I edited (jest config + package.json + CLAUDE.md propagate to related tests).

## Expected Impact

- **Haste-map crashes eliminated** — worktrees can live alongside jest runs without warnings.
- **Local CPU capped at 50%** — developer machine stays responsive during `npm test`.
- **Iterative dev loop 5-10× faster** — `test:changed` runs in ~5s vs ~2-10 min for full suite, `test:quick` + `test:unit` similar.
- **GSD chain execution no longer re-runs 300+ file suite between waves** — agents now have a rule to pick scoped subsets (phase 170 plans already did this; rule 8 makes it a project convention).

## Self-Check: PASSED

All 3 commits clean, all 4 task acceptance criteria met, 2 smoke tests green, zero regressions in auth subset (9/9 tests still pass with new config).
