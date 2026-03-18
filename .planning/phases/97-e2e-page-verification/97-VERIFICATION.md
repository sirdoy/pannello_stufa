---
phase: 97-e2e-page-verification
verified: 2026-03-18T19:15:00Z
status: human_needed
score: 4/4 automated must-haves verified
human_verification:
  - test: "Run npx playwright test tests/smoke/page-loads.spec.ts against live dev server"
    expected: "All 9 tests pass — homepage, /stove, /thermostat, /lights, /network, /raspi, /analytics, /settings, /debug"
    why_human: "Task 2 (checkpoint:human-verify) was auto-approved by executor in auto_advance mode. The SUMMARY itself warns 'user should manually verify tests pass before merging'. Automated verification cannot run Playwright tests."
  - test: "Confirm no console errors appear on any page during the test run"
    expected: "All 9 expect(errors).toHaveLength(0) assertions pass — zero console errors per page"
    why_human: "E2E-10 (no console errors) is a runtime assertion; only Playwright executing against the live dev server can confirm this."
---

# Phase 97: E2E Page Verification — Verification Report

**Phase Goal:** Every application page has a Playwright test that verifies it loads, shows content, and produces no console errors
**Verified:** 2026-03-18T19:15:00Z
**Status:** human_needed (all automated checks pass; runtime confirmation pending)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Homepage Playwright test confirms dashboard cards render | ? NEEDS HUMAN | Test exists and asserts `getByRole('heading', { name: 'Stufa', level: 2 })` — runtime pass unconfirmed |
| 2 | Each device page (/stove, /thermostat, /lights, /network, /raspi) has a passing test | ? NEEDS HUMAN | 5 tests exist with correct goto + heading assertions — runtime pass unconfirmed |
| 3 | Each support page (/analytics, /settings, /debug) has a passing test | ? NEEDS HUMAN | 3 tests exist with correct goto + heading assertions — runtime pass unconfirmed |
| 4 | No page produces a console error during any test run | ? NEEDS HUMAN | All 9 tests have `expect(errors).toHaveLength(0)` with cleanup(); not yet run against live server |

**Score:** 4/4 automated checks pass — runtime confirmation needed for all 4 truths

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `tests/smoke/page-loads.spec.ts` | Playwright smoke tests for all 9 app pages | VERIFIED | 122 lines, 9 `test()` calls, contains `collectConsoleErrors`, exists at correct path, committed in 80bcda8 |

### Artifact — Level 1: Exists

`tests/smoke/page-loads.spec.ts` — EXISTS (122 lines)

### Artifact — Level 2: Substantive (not a stub)

- Contains `function collectConsoleErrors(page: Page)` helper with listener attach/detach pattern
- Contains exactly 9 `test()` calls (grep count = 9)
- All 9 `page.goto()` calls present: `/`, `/stove`, `/thermostat`, `/lights`, `/network`, `/raspi`, `/analytics`, `/settings`, `/debug`
- Each test has content assertion via `getByRole` with per-page appropriate timeouts (15000ms device, 10000ms support)
- Each test has `expect(errors).toHaveLength(0)` with informative failure message
- 122 lines exceeds min_lines: 80 threshold from PLAN

### Artifact — Level 3: Wired

- File is in `tests/smoke/` which is under `testDir: './tests'` in `playwright.config.ts`
- The `chromium` project in `playwright.config.ts` has no `testMatch` restriction — all `.spec.ts` files in `./tests` are included
- `storageState: 'tests/.auth/user.json'` and `dependencies: ['setup']` from config apply automatically (no per-file override needed)
- Import: `import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'` — correct Playwright import

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tests/smoke/page-loads.spec.ts` | `playwright.config.ts` | storageState auth from setup project | WIRED | File in `./tests`, config `testDir: './tests'`, chromium project inherits storageState automatically |
| `tests/smoke/page-loads.spec.ts` | all 9 app pages | `page.goto()` with heading assertions | WIRED | 9 `page.goto()` calls confirmed; all 9 target `app/*/page.tsx` files exist |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| E2E-01 | 97-01-PLAN.md | Playwright verifica homepage carica tutte le card visibili senza errori | ? NEEDS HUMAN | Test exists: `test('homepage loads with dashboard cards')`, `page.goto('/')`, heading + console error assertion |
| E2E-02 | 97-01-PLAN.md | Playwright verifica /stove carica e mostra dati | ? NEEDS HUMAN | Test exists: `test('/stove loads and shows data')`, `getByRole('heading', { name: 'Controllo Stufa' })` |
| E2E-03 | 97-01-PLAN.md | Playwright verifica /thermostat carica e mostra dati | ? NEEDS HUMAN | Test exists with `waitForURL(/thermostat|netatmo/)` redirect handling |
| E2E-04 | 97-01-PLAN.md | Playwright verifica /lights carica e mostra dati | ? NEEDS HUMAN | Test exists: `page.goto('/lights')`, flexible heading assertion |
| E2E-05 | 97-01-PLAN.md | Playwright verifica /network carica e mostra dati | ? NEEDS HUMAN | Test exists: `getByRole('heading', { name: 'Rete', level: 1 })` |
| E2E-06 | 97-01-PLAN.md | Playwright verifica /raspi carica e mostra dati | ? NEEDS HUMAN | Test exists: `getByRole('heading', { name: 'Raspberry Pi', level: 1 })` |
| E2E-07 | 97-01-PLAN.md | Playwright verifica /analytics carica | ? NEEDS HUMAN | Test exists: `getByRole('heading', { name: 'Analytics', level: 1 })` |
| E2E-08 | 97-01-PLAN.md | Playwright verifica /settings carica | ? NEEDS HUMAN | Test exists: `getByRole('heading', { name: 'Impostazioni' })` |
| E2E-09 | 97-01-PLAN.md | Playwright verifica /admin carica | ? NEEDS HUMAN | Test exists: `page.goto('/debug')` with comment `// E2E-09: /admin requirement maps to /debug (no /admin route exists)` |
| E2E-10 | 97-01-PLAN.md | Nessuna pagina ha console errors o loading infiniti | ? NEEDS HUMAN | All 9 tests have `expect(errors).toHaveLength(0)` — runtime assertion |

All 10 requirement IDs from PLAN frontmatter are present in REQUIREMENTS.md (Phase 97, status: Complete). No orphaned requirements.

**Note on E2E-09:** The requirement specifies `/admin`. The executor correctly documented that no `/admin` route exists and mapped it to `/debug`. The comment in the test (`// E2E-09: /admin requirement maps to /debug`) is explicit. This is an acceptable mapping decision.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TODOs, FIXMEs, placeholders, `return null`, or console.log stubs found | — | — |

---

## Human Verification Required

### 1. Full Playwright test run

**Test:** With `npm run dev` running on localhost:3000, execute `npx playwright test tests/smoke/page-loads.spec.ts`

**Expected:** 9/9 tests pass. Playwright output shows:
```
  Page Loads > Dashboard > homepage loads with dashboard cards
  Page Loads > Device Pages > /stove loads and shows data
  Page Loads > Device Pages > /thermostat loads and shows data
  Page Loads > Device Pages > /lights loads and shows data
  Page Loads > Device Pages > /network loads and shows data
  Page Loads > Device Pages > /raspi loads and shows data
  Page Loads > Support Pages > /analytics loads
  Page Loads > Support Pages > /settings loads
  Page Loads > Support Pages > /debug loads
  9 passed
```

**Why human:** Task 2 (checkpoint:human-verify) was auto-approved by the executor with `auto_advance=true`. The SUMMARY explicitly states "user should manually verify tests pass before merging." Playwright cannot run without a live server; automated verification cannot confirm this.

### 2. Console error zero-tolerance confirmation

**Test:** Review Playwright output from the above run — specifically that no test fails with a `Console errors on /xxx:` message.

**Expected:** All 9 `expect(errors).toHaveLength(0)` assertions pass, confirming the polling simplification in Phase 96 introduced no runtime errors on any page.

**Why human:** This is a runtime behavior assertion. The test structure is correct (listeners attached before navigation, cleanup before assertion) but the actual behavior requires execution.

### 3. Heading selector accuracy for /thermostat and /lights

**Test:** During the Playwright run, observe that `/thermostat` and `/lights` tests pass — these use `getByRole('heading').first()` which is deliberately flexible.

**Expected:** The first heading on each page is visible and the test does not time out after 15s.

**Why human:** The flexible `.first()` selector was chosen to handle redirect scenarios. If the page has no heading rendered within 15s, the test would hang. Runtime confirms the selector is sufficient.

---

## Summary

The single artifact (`tests/smoke/page-loads.spec.ts`) was created correctly and completely:

- 122 lines, well above the 80-line minimum
- Exactly 9 `test()` calls matching the 9 required pages
- `collectConsoleErrors` helper implemented correctly (listener before navigation, cleanup before assertion)
- All 3 describe block groups present (Dashboard, Device Pages, Support Pages)
- All 9 `page.goto()` calls present covering every required route
- All 9 `expect(errors).toHaveLength(0)` assertions present
- E2E-09 /admin → /debug mapping explicitly documented in code
- No anti-patterns, no stubs, no placeholder implementations
- Committed in `80bcda8` with full stat confirmation (122 insertions)
- Correctly wired to `playwright.config.ts` via testDir placement (no override needed)

The only gap is runtime: Task 2 was a blocking `checkpoint:human-verify` gate that the executor auto-approved. The SUMMARY itself acknowledges this. All automated structural checks pass; the phase goal requires human confirmation that the 9 tests actually pass against the live application.

---

_Verified: 2026-03-18T19:15:00Z_
_Verifier: Claude (gsd-verifier)_
