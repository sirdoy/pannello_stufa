---
phase: 133
slug: fritz-box-history-budget
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 133 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via next/jest) |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- app/api/fritzbox/history` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- app/api/fritzbox`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 133-01-01 | 01 | 1 | FRITZ-08 | unit | `npm test -- app/api/fritzbox/history/bandwidth/hourly` | ❌ W0 | ⬜ pending |
| 133-01-02 | 01 | 1 | FRITZ-09 | unit | `npm test -- app/api/fritzbox/history/bandwidth/daily` | ❌ W0 | ⬜ pending |
| 133-01-03 | 01 | 1 | FRITZ-10 | unit | `npm test -- app/api/fritzbox/history/devices/daily` | ❌ W0 | ⬜ pending |
| 133-01-04 | 01 | 1 | FRITZ-11 | unit | `npm test -- app/api/fritzbox/history/bandwidth/auto` | ❌ W0 | ⬜ pending |
| 133-01-05 | 01 | 1 | FRITZ-12 | unit | `npm test -- app/api/fritzbox/budget-stats` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/api/fritzbox/history/bandwidth/hourly/__tests__/route.test.ts` — stubs for FRITZ-08
- [ ] `app/api/fritzbox/history/bandwidth/daily/__tests__/route.test.ts` — stubs for FRITZ-09
- [ ] `app/api/fritzbox/history/devices/daily/__tests__/route.test.ts` — stubs for FRITZ-10
- [ ] `app/api/fritzbox/history/bandwidth/auto/__tests__/route.test.ts` — stubs for FRITZ-11
- [ ] `app/api/fritzbox/budget-stats/__tests__/route.test.ts` — stubs for FRITZ-12

All test files follow pattern from `app/api/fritzbox/bandwidth/__tests__/route.test.ts`:
- `jest.mock('@/lib/fritzbox')` + `jest.mock('@/lib/auth0')`
- Default `checkRateLimitFritzBox` → `{ allowed: true }`
- `getCachedData` mock resolves with fixture data
- Tests: 401 unauthenticated, 200 success, 429 rate limited, cache key assertion, error propagation

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
