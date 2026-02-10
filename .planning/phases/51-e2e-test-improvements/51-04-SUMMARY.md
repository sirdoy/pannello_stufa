---
phase: 51-e2e-test-improvements
plan: 04
subsystem: e2e-testing
tags: [gap-closure, dependencies, playwright]
dependency_graph:
  requires: [51-01, 51-02, 51-03]
  provides: [dotenv-package]
  affects: [playwright-config]
tech_stack:
  added: [dotenv@16.4.5]
  patterns: []
key_files:
  created: []
  modified: [package.json]
decisions:
  - key: dotenv-version
    summary: "Use dotenv ^16.4.5 for Playwright env loading"
    rationale: "Matches common ecosystem usage, caret range allows patch updates"
metrics:
  duration_minutes: 1.0
  task_count: 1
  file_count: 1
  completed_at: "2026-02-10T17:00:29Z"
---

# Phase 51 Plan 04: Add Missing dotenv Dependency Summary

**One-liner:** Added dotenv ^16.4.5 devDependency to unblock local E2E test execution after playwright.config.ts import detected.

## Context

**Problem:** Plan 51-01 created `playwright.config.ts` with `import 'dotenv/config'` on line 2, but never added dotenv to package.json devDependencies. This blocked all local E2E test execution with "Cannot find module 'dotenv/config'" error. CI tests worked because GitHub Actions provides environment variables directly, masking the local development issue.

**Discovery:** Identified during Phase 51 verification (51-VERIFICATION.md) as the only blocker preventing local E2E test execution.

**Scope:** Gap closure plan - minimal single-dependency addition with no code changes.

## What Was Built

### Task 1: Add dotenv to package.json devDependencies

**Outcome:** Added `"dotenv": "^16.4.5"` to devDependencies in alphabetical order (after @playwright/test, before @serwist/next).

**Files Modified:**
- `package.json` (line 64): Added dotenv devDependency

**Verification:**
```bash
$ node -e "console.log(require('./package.json').devDependencies.dotenv)"
^16.4.5
```

**Commit:** `34dc5b9` - chore(51-04): add dotenv devDependency for Playwright config

## Deviations from Plan

None - plan executed exactly as written.

## Testing

### Automated Verification

**Node.js module resolution check:**
```bash
$ node -e "const pkg = require('./package.json'); const v = pkg.devDependencies?.dotenv; if (v) console.log('OK: dotenv', v); else { console.error('MISSING'); process.exit(1); }"
OK: dotenv ^16.4.5
```

**Status:** PASSED ✓

### Manual Verification Required

**After user runs `npm install`:**
1. Run `node -e "require('dotenv/config')"` - should exit without error
2. Run `npx playwright test tests/smoke/auth-flows.spec.ts --headed` - should execute tests successfully
3. Verify `import 'dotenv/config'` in playwright.config.ts resolves without module-not-found error

**Why manual:** Project rules prohibit running `npm install` during plan execution. User must install dependencies manually.

## Impact

### Immediate
- Unblocks local E2E test execution for all developers
- `import 'dotenv/config'` in playwright.config.ts now resolves successfully after npm install
- Completes Phase 51 infrastructure (no remaining gaps)

### System-wide
- No impact on CI (already worked with direct env vars)
- No impact on existing test files (they were already correct)
- No impact on build process (devDependency only)

## Success Criteria

All success criteria from plan met:

- [x] dotenv is declared in package.json devDependencies with version ^16.4.5
- [x] No other files modified (minimal gap closure)
- [x] playwright.config.ts unchanged (it already has the correct import)

## Self-Check

**Created Files:**
```bash
$ [ -f ".planning/phases/51-e2e-test-improvements/51-04-SUMMARY.md" ] && echo "FOUND" || echo "MISSING"
FOUND
```

**Modified Files:**
```bash
$ git diff HEAD~1 HEAD --name-only
package.json
```

**Commits:**
```bash
$ git log --oneline -1
34dc5b9 chore(51-04): add dotenv devDependency for Playwright config
```

## Self-Check: PASSED

All claims verified:
- ✓ SUMMARY.md created at correct path
- ✓ package.json modified (dotenv added)
- ✓ Commit 34dc5b9 exists in git history
- ✓ No other files modified (git diff shows only package.json)

---

**Duration:** 1.0 minutes
**Completed:** 2026-02-10T17:00:29Z
**Executor:** Claude Sonnet 4.5 (gsd-executor)
