---
phase: 97
slug: e2e-page-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 97 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (already installed) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/smoke/page-loads.spec.ts` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/smoke/page-loads.spec.ts`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 97-01-01 | 01 | 1 | E2E-01 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "homepage"` | ❌ W0 | ⬜ pending |
| 97-01-02 | 01 | 1 | E2E-02 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "stove"` | ❌ W0 | ⬜ pending |
| 97-01-03 | 01 | 1 | E2E-03 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "thermostat"` | ❌ W0 | ⬜ pending |
| 97-01-04 | 01 | 1 | E2E-04 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "lights"` | ❌ W0 | ⬜ pending |
| 97-01-05 | 01 | 1 | E2E-05 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "network"` | ❌ W0 | ⬜ pending |
| 97-01-06 | 01 | 1 | E2E-06 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "raspi"` | ❌ W0 | ⬜ pending |
| 97-01-07 | 01 | 1 | E2E-07 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "analytics"` | ❌ W0 | ⬜ pending |
| 97-01-08 | 01 | 1 | E2E-08 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "settings"` | ❌ W0 | ⬜ pending |
| 97-01-09 | 01 | 1 | E2E-09 | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "debug"` | ❌ W0 | ⬜ pending |
| 97-01-10 | 01 | 1 | E2E-10 | smoke | Verified inline in each test above | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/smoke/page-loads.spec.ts` — stubs for E2E-01 through E2E-10

*Existing Playwright infrastructure covers framework needs. Only the test file is missing.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
