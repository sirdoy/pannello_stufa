---
phase: 51
plan: 01
subsystem: testing
tags: [e2e, playwright, auth0, session-caching]
dependency_graph:
  requires: []
  provides: [playwright-infrastructure, auth-session-caching]
  affects: [ci-pipeline]
tech_stack:
  added: [playwright, @playwright/test]
  patterns: [storageState-caching, auth0-oauth-flow, setup-project-pattern]
key_files:
  created:
    - playwright.config.ts
    - tests/auth.setup.ts
    - tests/helpers/auth.helpers.ts
    - tests/helpers/test-context.ts
  modified:
    - .gitignore
decisions:
  - title: "Session caching via storageState"
    rationale: "Prevents redundant Auth0 logins and rate limiting; single login per test run"
  - title: "Single worker in CI"
    rationale: "Prevents Auth0 rate limiting during parallel test execution"
  - title: "Auto-retry on transient failures"
    rationale: "2 retries in CI for Auth0 network issues; 0 retries locally for fast feedback"
metrics:
  duration_minutes: 2.6
  tasks_completed: 3
  files_created: 4
  files_modified: 1
  commits: 3
  completed_at: "2026-02-10T16:39:23Z"
---

# Phase 51 Plan 01: E2E Test Infrastructure with Auth0 Session Caching

**One-liner:** Playwright E2E infrastructure with real Auth0 OAuth flows and storageState session caching.

## Overview

Created production-realistic E2E test foundation that authenticates via Auth0 (not TEST_MODE bypass) and caches session state to prevent redundant logins and rate limiting.

## What Was Built

### Core Infrastructure

**1. Playwright Configuration** (`playwright.config.ts`):
- Setup project runs `auth.setup.ts` before all feature tests
- Chromium project depends on setup and reuses cached `storageState`
- Single worker in CI prevents Auth0 rate limiting
- Auto-retry (2x) in CI for transient Auth0 failures
- WebServer config auto-starts dev server for local testing
- Trace capture on first retry for debugging

**2. Auth Setup** (`tests/auth.setup.ts`):
- Authenticates via real Auth0 OAuth flow (2-step: email → password)
- Saves session to `tests/.auth/user.json` using Playwright's `storageState()`
- Runs ONCE per test run (not per test file)
- Handles httpOnly cookies, localStorage, sessionStorage automatically

**3. Auth Helpers** (`tests/helpers/auth.helpers.ts`):
- Centralized `signIn()` function with Auth0 Universal Login interaction
- Centralized `signOut()` function for cleanup
- Single-point maintenance if Auth0 UI changes

**4. Test Context** (`tests/helpers/test-context.ts`):
- Environment-sourced credentials (`E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`)
- Path constants (`AUTH_FILE`, `BASE_URL`)
- No hardcoded secrets

**5. Git Safety** (`.gitignore`):
- `tests/.auth/` directory ignored to prevent credential leakage

## Technical Patterns

### Session Caching Flow
```
Test Run Start
   ↓
Setup Project: auth.setup.ts
   ↓ signIn(page, email, password)
   ↓ page.context().storageState({ path: 'tests/.auth/user.json' })
   ↓
Chromium Project: feature tests
   ↓ use: { storageState: 'tests/.auth/user.json' }
   ↓ (cookies/localStorage restored automatically)
   ↓
All tests run with authenticated session
```

### Auth0 Universal Login Flow
```
1. Navigate to /auth/login → Auth0 redirect
2. Fill email → Click Continue
3. Fill password → Click Continue
4. Redirect back to app → Success
```

### CI Safety Measures
- **Single worker**: Prevents parallel Auth0 requests (rate limiting)
- **2 retries**: Handles transient Auth0 network failures
- **Blob reporter**: Efficient for merging parallel CI results

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

- ✅ Playwright config correctly defines setup project pattern with session caching
- ✅ Auth setup uses real Auth0 OAuth flow (NOT TEST_MODE bypass)
- ✅ Session state saved to tests/.auth/user.json for reuse by feature tests
- ✅ All credentials sourced from environment variables
- ✅ .gitignore prevents credential leakage

## Impact

### Before
- No E2E test infrastructure
- Manual testing only

### After
- Production-realistic E2E tests with real Auth0 authentication
- Session caching prevents redundant logins (single login per test run)
- CI-safe with rate limiting protection
- Foundation for feature test coverage in subsequent plans

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Playwright config and test context | e5b5aaa | playwright.config.ts, tests/helpers/test-context.ts |
| 2 | Create auth helpers and auth setup | 11c3c3b | tests/helpers/auth.helpers.ts, tests/auth.setup.ts |
| 3 | Update .gitignore for auth session caching | 2b8d914 | .gitignore |

## Next Steps

Plan 51-02 will build on this infrastructure to create actual feature tests (homepage, device controls, scheduler) that leverage the cached authentication.

## Self-Check

Verifying claims in this summary:

```bash
# Check created files exist
[ -f "playwright.config.ts" ] && echo "FOUND: playwright.config.ts" || echo "MISSING: playwright.config.ts"
[ -f "tests/auth.setup.ts" ] && echo "FOUND: tests/auth.setup.ts" || echo "MISSING: tests/auth.setup.ts"
[ -f "tests/helpers/auth.helpers.ts" ] && echo "FOUND: tests/helpers/auth.helpers.ts" || echo "MISSING: tests/helpers/auth.helpers.ts"
[ -f "tests/helpers/test-context.ts" ] && echo "FOUND: tests/helpers/test-context.ts" || echo "MISSING: tests/helpers/test-context.ts"

# Check commits exist
git log --oneline --all | grep -q "e5b5aaa" && echo "FOUND: e5b5aaa" || echo "MISSING: e5b5aaa"
git log --oneline --all | grep -q "11c3c3b" && echo "FOUND: 11c3c3b" || echo "MISSING: 11c3c3b"
git log --oneline --all | grep -q "2b8d914" && echo "FOUND: 2b8d914" || echo "MISSING: 2b8d914"

# Check storageState pattern
grep "storageState" playwright.config.ts && echo "FOUND: storageState in config"

# Check no TEST_MODE bypass
grep -v "not TEST_MODE" tests/auth.setup.ts | grep "TEST_MODE" && echo "FOUND TEST_MODE bypass" || echo "NO TEST_MODE bypass (correct)"

# Check .gitignore entry
grep "tests/.auth/" .gitignore && echo "FOUND: gitignore entry"
```

## Self-Check: PASSED

All files verified present:
- ✅ playwright.config.ts
- ✅ tests/auth.setup.ts
- ✅ tests/helpers/auth.helpers.ts
- ✅ tests/helpers/test-context.ts

All commits verified:
- ✅ e5b5aaa (Task 1)
- ✅ 11c3c3b (Task 2)
- ✅ 2b8d914 (Task 3)

Key patterns verified:
- ✅ storageState in playwright.config.ts
- ✅ tests/.auth/ in .gitignore
