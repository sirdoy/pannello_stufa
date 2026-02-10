---
phase: 51-e2e-test-improvements
plan: 03
subsystem: testing
tags: [e2e, ci, playwright, github-actions, notifications]
dependency_graph:
  requires: ["51-01"]
  provides: ["notification-delivery-test", "playwright-ci-workflow"]
  affects: [".github/workflows", "tests/features", "playwright.config.ts"]
tech_stack:
  added: []
  patterns: ["GitHub Actions CI", "Playwright blob reporter in CI", "CI-conditional webServer command"]
key_files:
  created:
    - tests/features/notification-delivery.spec.ts
    - .github/workflows/playwright.yml
  modified:
    - playwright.config.ts
decisions:
  - id: ci-uses-npm-start
    summary: "CI workflow builds app first, then uses npm run start for stability"
    rationale: "Pre-building the app and serving the production build is faster and more stable than npm run dev in CI. The playwright.config.ts uses process.env.CI to conditionally select the command."
    alternatives: ["Use npm run dev in CI (slower, more transient failures)"]
  - id: no-fcm-interaction-in-tests
    summary: "Notification tests validate UI only, no FCM service worker interaction"
    rationale: "Playwright cannot meaningfully test Push API / Service Worker registration. The tests verify the settings page renders correctly and displays notification controls. Actual FCM delivery is verified manually or via API tests."
    alternatives: ["Mock service worker (complex, low value)", "API endpoint to verify FCM config (future enhancement)"]
  - id: github-secrets-for-credentials
    summary: "All Auth0 and Firebase credentials stored as GitHub encrypted secrets"
    rationale: "Credentials never appear in workflow files. The user must configure secrets in repository settings before CI can run."
    alternatives: ["Environment-specific .env files (less secure)", "Vault integration (overkill for this project)"]
  - id: blob-reporter-in-ci
    summary: "CI uses Playwright blob reporter instead of HTML reporter"
    rationale: "Blob reporter creates binary artifacts suitable for merging results from parallel runs. For this project with single worker, it provides a more compact output than HTML."
    alternatives: ["HTML reporter in CI (works but produces large artifacts)"]
metrics:
  duration_minutes: 1.9
  completed_date: 2026-02-10
---

# Phase 51 Plan 03: Notification Delivery Test & CI Workflow Summary

**One-liner:** Notification UI E2E test with GitHub Actions CI workflow for automated Playwright testing on every PR.

## What Was Built

Created notification delivery E2E test validating the notification settings UI (no FCM interaction) and GitHub Actions workflow for automated Playwright testing on PRs.

### Notification Delivery Test (tests/features/notification-delivery.spec.ts)

**7 tests validating notification settings UI:**
- Page displays notification status heading
- Device registration section is visible
- Device registration info or call-to-action shown
- Test notification buttons present
- Notification history link displayed
- iOS information section shown
- Device management link available

**Key patterns:**
- Role-based selectors (getByRole, getByText)
- Generous timeouts (15s) for Firebase data loading
- No FCM service worker interaction (UI validation only)
- Uses cached storageState (single auth per test run)

**Why no FCM interaction:** Playwright cannot meaningfully test Push API / Service Worker registration. The tests verify the settings page is accessible and functional. Actual FCM delivery is verified manually.

### GitHub Actions CI Workflow (.github/workflows/playwright.yml)

**Workflow structure:**
1. Checkout code + setup Node.js with npm cache
2. Install dependencies (npm ci)
3. Install Playwright Chromium browser with system dependencies
4. Build application (npm run build) with all secrets
5. Run Playwright tests (npx playwright test) with all secrets
6. Upload Playwright report artifact (always, 30 days retention)
7. Upload test traces artifact (on failure only, 7 days retention)

**CI configuration:**
- Triggers: PR to main, push to main
- Timeout: 15 minutes
- Single worker (prevents Auth0 rate limiting)
- 2 retries (handles transient failures)
- Blob reporter (compact binary format)

**Credentials management:**
All credentials stored as GitHub encrypted secrets:
- E2E_TEST_USER_EMAIL
- E2E_TEST_USER_PASSWORD
- AUTH0_ISSUER_BASE_URL
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET
- AUTH0_SECRET
- NEXT_PUBLIC_FIREBASE_* (7 variables)

### Playwright Config Update (playwright.config.ts)

**webServer command now CI-conditional:**
```typescript
command: process.env.CI ? 'npm run start' : 'npm run dev'
```

**Rationale:** CI workflow pre-builds the app, then `npm run start` serves the production build. This is faster and more stable than `npm run dev` in CI. Locally, `npm run dev` provides faster iteration without a build step.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria met:

- ✅ `tests/features/notification-delivery.spec.ts` exists with 7 notification UI tests
- ✅ `.github/workflows/playwright.yml` exists with PR-triggered E2E test job
- ✅ CI workflow references only GitHub secrets (no hardcoded credentials)
- ✅ Playwright report artifact uploaded on every run
- ✅ Test traces uploaded on failure only
- ✅ CI uses single worker to prevent Auth0 rate limiting
- ✅ `playwright.config.ts` webServer uses `npm run start` in CI

## Technical Details

### Test Structure

**Notification delivery tests follow the pattern:**
1. Navigate to `/settings/notifications`
2. Wait for networkidle (Firebase data loads)
3. Assert UI elements are visible with generous timeouts
4. Use case-insensitive regex for Italian text matching

**No test clicks the "Test Notification" button because:**
- FCM requires service worker registration (not available by default)
- Push notifications require real device permissions
- The client-side flow is better verified by unit tests
- E2E tests validate the UI is accessible and functional

### CI Workflow Details

**Build step includes all secrets:** Next.js build process references env vars in middleware and server components. Without Auth0/Firebase secrets, the build fails with "missing env var" errors.

**Firebase fallback values:** Some Firebase secrets may not be configured yet. The build step uses `|| 'dummy-for-build'` fallback to prevent build failures. At runtime, tests need real Firebase config to interact with the app.

**Artifact retention:**
- Playwright report: 30 days (every run, for PR checks)
- Test traces: 7 days (failures only, detailed debugging)

**Why blob reporter:** GitHub Actions with Playwright typically uses blob reporter for parallel sharding. This project uses single worker, but blob reporter still provides compact binary output suitable for CI artifacts.

### Auth0 Configuration Required

**User action needed before CI can run:**

1. Create Auth0 test user (if not existing):
   - Navigate to Auth0 Dashboard → User Management → Users
   - Create test user account
   - Note email and password

2. Add secrets to GitHub repository:
   - Navigate to GitHub → Settings → Secrets and variables → Actions
   - Add 7 secrets: E2E_TEST_USER_EMAIL, E2E_TEST_USER_PASSWORD, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET
   - Add 7 Firebase secrets: NEXT_PUBLIC_FIREBASE_API_KEY, etc.

3. Run workflow:
   - Open PR or push to main
   - GitHub Actions runs Playwright tests automatically
   - Check Actions tab for results and artifacts

## Implementation Quality

**Code quality:**
- TypeScript with strict typing
- Comprehensive inline comments
- Descriptive test names
- Generous timeouts for UI interactions
- Role-based selectors (accessible, resilient)

**CI quality:**
- All credentials via encrypted secrets
- Separate build and test steps (visibility)
- Conditional artifact uploads (always vs failure)
- Timeout protection (15 minutes)
- Retry logic (2 retries for transient failures)

## Impact

**Testing automation:**
- Every PR triggers E2E tests automatically
- Notification settings page validated on every change
- Catch regressions before merge

**Developer experience:**
- Playwright report artifact available on every run
- Test traces with screenshots/videos on failure
- Single worker prevents Auth0 rate limit errors

**Security:**
- All credentials stored as encrypted secrets
- No credentials in workflow file or code
- Secrets scope limited to Actions workflow

## Files Modified

**Created (2 files):**
- `tests/features/notification-delivery.spec.ts` - 7 notification UI tests
- `.github/workflows/playwright.yml` - CI workflow for Playwright E2E tests

**Modified (1 file):**
- `playwright.config.ts` - Added CI-conditional webServer command

## Git Commits

1. **a92a49a** - `feat(51-03): add notification delivery E2E test`
   - Created notification-delivery.spec.ts with 7 UI validation tests
   - Tests verify settings page, device registration, test buttons, history links
   - No FCM interaction (service worker not available in Playwright)

2. **aa7d4f8** - `feat(51-03): add GitHub Actions CI workflow for Playwright tests`
   - Updated playwright.config.ts to use npm run start in CI
   - Created .github/workflows/playwright.yml with PR and push triggers
   - All Auth0 and Firebase credentials use GitHub encrypted secrets
   - Playwright report and traces uploaded as artifacts

## Next Steps

**Immediate:**
1. Configure GitHub secrets for Auth0 and Firebase (see user_setup in plan)
2. Create Auth0 test user account (if not existing)
3. Open PR to trigger workflow and verify CI runs successfully

**Future enhancements:**
- Add more E2E tests for stove ignition, thermostat schedule (51-02)
- Create API test helper endpoint to verify FCM config without browser Push API
- Add Playwright trace viewer link to PR comments on failure
- Consider matrix strategy for multiple browsers (currently Chromium only)

## Self-Check: PASSED

**Files created:**
```bash
[ -f "tests/features/notification-delivery.spec.ts" ] && echo "FOUND: tests/features/notification-delivery.spec.ts"
[ -f ".github/workflows/playwright.yml" ] && echo "FOUND: .github/workflows/playwright.yml"
```

FOUND: tests/features/notification-delivery.spec.ts
FOUND: .github/workflows/playwright.yml

**Files modified:**
```bash
[ -f "playwright.config.ts" ] && echo "FOUND: playwright.config.ts"
```

FOUND: playwright.config.ts

**Commits exist:**
```bash
git log --oneline --all | grep -q "a92a49a" && echo "FOUND: a92a49a"
git log --oneline --all | grep -q "aa7d4f8" && echo "FOUND: aa7d4f8"
```

FOUND: a92a49a
FOUND: aa7d4f8

All files and commits verified.
