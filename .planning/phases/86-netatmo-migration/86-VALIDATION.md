---
phase: 86
slug: netatmo-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern netatmo --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (netatmo subset) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern netatmo --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 86-01-01 | 01 | 1 | API-07 | unit | `npx jest __tests__/lib/netatmoProxy.test.ts` | ✅ | ⬜ pending |
| 86-01-02 | 01 | 1 | API-07 | unit | `npx jest __tests__/lib/netatmoProxy-camera.test.ts` | ✅ | ⬜ pending |
| 86-01-03 | 01 | 1 | API-08 | unit | `npx jest __tests__/lib/netatmoProxy.test.ts` | ✅ | ⬜ pending |
| 86-01-04 | 01 | 1 | API-09 | grep | `grep -r NETATMO_PROXY_URL lib/ app/ --include="*.ts"` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — existing `netatmoProxy.test.ts` and `netatmoProxy-camera.test.ts` will be updated in place.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Netatmo routes return same data after migration | API-09 | Requires running proxy | Call each API route and verify response shape matches pre-migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
