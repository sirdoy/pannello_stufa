---
phase: 51-e2e-test-improvements
plan: 02
subsystem: testing/e2e
tags: [playwright, auth0, smoke-tests, critical-flows, accessibility]
dependency_graph:
  requires: [51-01]
  provides: [auth-smoke-tests, stove-e2e-tests, thermostat-e2e-tests]
  affects: [testing-infrastructure, quality-gates]
tech_stack:
  added: []
  patterns: [read-only-tests, role-based-selectors, generous-timeouts]
key_files:
  created:
    - tests/smoke/auth-flows.spec.ts
    - tests/features/stove-ignition.spec.ts
    - tests/features/thermostat-schedule.spec.ts
  modified: []
decisions:
  - slug: auth-smoke-tests-clear-storage-state
    summary: Auth smoke tests explicitly clear storageState to test real Auth0 login flow
    rationale: Feature tests use cached session for speed, but smoke tests must verify actual authentication works
  - slug: read-only-feature-tests
    summary: Stove and thermostat tests verify UI rendering without triggering device actions
    rationale: Tests run against real devices, destructive actions could affect user experience
  - slug: accessibility-first-selectors
    summary: Tests use getByRole and text patterns instead of CSS classes
    rationale: More resilient to UI changes, aligns with accessibility best practices
  - slug: generous-timeouts-for-api-polling
    summary: 15-second timeouts for visibility assertions
    rationale: Dashboard polls device status every 5-15 seconds, tests must account for polling delays
metrics:
  duration_minutes: 2.0
  tasks_completed: 2
  files_created: 3
  completed_date: 2026-02-10
---

# Phase 51 Plan 02: Auth Smoke Tests & Critical Flow E2E Tests Summary

**One-liner**: Auth0 authentication smoke tests and read-only E2E tests for stove ignition and thermostat schedule flows using accessibility-first selectors.

## What Was Built

### 1. Auth Smoke Tests (`tests/smoke/auth-flows.spec.ts`)
- **3 tests covering Auth0 authentication lifecycle**:
  - `should complete signin flow via Auth0` - verifies full login via Auth0 Universal Login
  - `should redirect unauthenticated user to login` - ensures protected routes redirect to Auth0
  - `should complete signout flow` - verifies logout and redirect to login page
- **Explicitly clears storageState** using `test.use({ storageState: { cookies: [], origins: [] } })` to test real auth flow
- **No cached session** - unlike feature tests, these exercise the actual Auth0 login every time
- **Credentials from environment** - uses `TEST_USER` from `test-context.ts` (no hardcoded secrets)

### 2. Stove Ignition E2E Tests (`tests/features/stove-ignition.spec.ts`)
- **4 read-only tests for stove card rendering**:
  - `should display stove card with current status` - verifies "Stufa" heading visible
  - `should show stove status indicator` - checks status badge (SPENTA, IN FUNZIONE, etc.)
  - `should have ignition controls available` - verifies ACCENDI/SPEGNI buttons exist
  - `should show fan and power level indicators` - checks 💨 Ventola and ⚡ Potenza displays
- **No destructive actions** - tests only verify UI elements, do NOT click ignite/shutdown buttons
- **Role-based selectors** - uses `getByRole('heading', { name: 'Stufa', level: 2 })` and `getByRole('button', { name: /ACCENDI/i })`
- **15-second timeouts** - accounts for 5-15 second polling intervals in StoveCard

### 3. Thermostat Schedule E2E Tests (`tests/features/thermostat-schedule.spec.ts`)
- **6 read-only tests for thermostat card rendering**:
  - `should display thermostat card with device info` - verifies "Termostato" heading visible
  - `should show current temperature reading` - checks "Attuale" label and temperature value (regex: `/\d+(\.\d+)?°/`)
  - `should show target temperature if set` - verifies "Target" label when setpoint exists
  - `should show thermostat mode controls` - checks mode buttons (Auto, Away, Gelo, Off)
  - `should show schedule section` - verifies "Programmazione" section visible
  - `should have temperature adjustment controls when applicable` - checks ± 0.5° buttons
- **No device changes** - tests do NOT change schedules, modes, or temperatures
- **Conditional assertions** - target temp and adjustment controls may not always be visible (depends on mode)
- **Text pattern matching** - uses `/Attuale/i`, `/Target/i`, `/Modalità/i` for resilient selectors

## Technical Approach

### Selector Strategy
**Accessibility-first**: Tests use `getByRole`, `getByText`, and text patterns instead of CSS classes:
- ✅ `page.getByRole('heading', { name: 'Stufa', level: 2 })`
- ✅ `page.getByRole('button', { name: /ACCENDI/i })`
- ✅ `page.locator('text=/Attuale/i')`
- ❌ NOT `page.locator('.card-title')` (brittle, not accessible)

### Timeouts & Polling
**Generous 15-second timeouts** for visibility assertions:
```typescript
await expect(stoveHeading).toBeVisible({ timeout: 15000 });
```
**Rationale**: StoveCard polls status every 5-15 seconds, ThermostatCard every 30 seconds. Tests must wait for initial data load.

### Auth vs Feature Test Patterns
| Aspect | Auth Smoke Tests | Feature Tests |
|--------|------------------|---------------|
| **storageState** | Cleared (`{ cookies: [], origins: [] }`) | Cached (from `auth.setup.ts`) |
| **Login flow** | Full Auth0 Universal Login | Already authenticated |
| **Purpose** | Verify auth works | Verify app functionality |
| **Frequency** | Every test run | One login per suite |

### Read-Only Test Philosophy
**All feature tests are non-destructive**:
- ✅ Verify UI elements render correctly
- ✅ Check status displays and controls exist
- ❌ Do NOT click ACCENDI, SPEGNI, or schedule change buttons
- ❌ Do NOT modify device state

**Rationale**: Tests run against real Thermorossi stove and Netatmo thermostat. Destructive actions could affect user comfort.

## Deviations from Plan

**None** - plan executed exactly as written.

## Verification

### File Existence
```bash
$ ls -la tests/smoke/auth-flows.spec.ts
-rw-r--r--@ 1 user staff 1294 10 Feb 17:43 tests/smoke/auth-flows.spec.ts

$ ls -la tests/features/stove-ignition.spec.ts
-rw-r--r--@ 1 user staff 2864 10 Feb 17:43 tests/features/stove-ignition.spec.ts

$ ls -la tests/features/thermostat-schedule.spec.ts
-rw-r--r--@ 1 user staff 5192 10 Feb 17:43 tests/features/thermostat-schedule.spec.ts
```

### Commits
```bash
$ git log --oneline -2
385b826 test(51-02): add stove ignition and thermostat schedule E2E tests
e4765ed test(51-02): add Auth0 authentication smoke tests
```

### Test Structure Audit
**Auth smoke tests**: 3 tests, all use cleared storageState ✅
**Stove ignition tests**: 4 tests, all read-only, no button clicks ✅
**Thermostat schedule tests**: 6 tests, all read-only, conditional checks for mode-dependent elements ✅

**Selector audit**: All selectors verified against source components:
- ✅ "Stufa" heading exists in `StoveCard.tsx:1040`
- ✅ "ACCENDI"/"SPEGNI" buttons exist in `StoveCard.tsx:1176,1186,1201`
- ✅ "Termostato" heading exists in `ThermostatCard.tsx:477`
- ✅ "Attuale"/"Target" labels exist in `ThermostatCard.tsx:622,638`
- ✅ Mode buttons (Auto, Away, Gelo, Off) exist in `ThermostatCard.tsx:729-772`

## Self-Check: PASSED ✅

**Created files verified**: All 3 test files exist at expected paths
**Commits verified**: Both commits (`e4765ed`, `385b826`) present in git log
**Selector accuracy**: All selectors match actual DOM elements in source components
**No destructive actions**: All feature tests read-only, verified no `click()` on device control buttons

## Next Steps

1. **Plan 51-03**: GitHub Actions CI workflow for running Playwright tests on PRs
2. **Plan 51-04**: Visual regression testing setup with Percy or Playwright screenshots
3. **Manual test run**: Execute `npx playwright test tests/smoke/auth-flows.spec.ts` to verify Auth0 flow works in local environment

## Dependencies

**Requires**:
- Plan 51-01 (Playwright infrastructure with auth.setup.ts)
- Auth0 test credentials in `.env.local` (`E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`)

**Provides**:
- Auth smoke tests for CI quality gate
- Stove and thermostat critical flow tests
- Accessibility-first selector patterns for future tests

**Affects**:
- Testing infrastructure (new smoke/ and features/ directories)
- Quality gates (auth verification before feature tests)
