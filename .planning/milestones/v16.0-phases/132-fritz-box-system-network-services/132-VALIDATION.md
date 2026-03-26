---
phase: 132
slug: fritz-box-system-network-services
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 132 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern fritzboxClient --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (Fritz!Box tests only) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern fritzboxClient --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 132-01-01 | 01 | 1 | FRITZ-01 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-01-02 | 01 | 1 | FRITZ-02 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-01-03 | 01 | 1 | FRITZ-03 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-02-01 | 02 | 1 | FRITZ-04 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-02-02 | 02 | 1 | FRITZ-05 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-02-03 | 02 | 1 | FRITZ-06 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |
| 132-02-04 | 02 | 1 | FRITZ-07 | unit | `npx jest --testPathPattern fritzboxClient --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Tests append to `lib/fritzbox/__tests__/fritzboxClient.test.ts` using established `jest.mocked(haGet)` pattern.

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
