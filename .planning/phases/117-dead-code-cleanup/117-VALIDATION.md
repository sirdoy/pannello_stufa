---
phase: 117
slug: dead-code-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 117 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest __tests__/lib/healthMonitoring.test.ts --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/lib/healthMonitoring.test.ts --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 117-01-01 | 01 | 1 | CLEAN-01 | smoke | `npx knip 2>&1 \| grep -cv "app/components/ui"` | ✅ | ⬜ pending |
| 117-02-01 | 02 | 1 | CLEAN-02 | grep | `grep -c "DISABLED" lib/notifications/notificationService.ts` returns 0 | ✅ | ⬜ pending |
| 117-02-02 | 02 | 1 | CLEAN-03 | unit | `npx jest __tests__/lib/healthMonitoring.test.ts -t "STARTING" --no-coverage` | ✅ (needs new cases) | ⬜ pending |
| 117-02-03 | 02 | 1 | CLEAN-03 | unit | `npx jest __tests__/lib/healthMonitoring.test.ts -t "grace period" --no-coverage` | ❌ W0 | ⬜ pending |
| 117-02-04 | 02 | 1 | CLEAN-03 | unit | `npx jest __tests__/lib/healthMonitoring.test.ts -t "cleanup" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/healthMonitoring.test.ts` — 3 new test cases for STARTING grace period (within window, expired, cleanup on exit)
- [ ] `__tests__/lib/healthMonitoring.test.ts` — mock setup for `adminDbGet`/`adminDbSet`/`adminDbRemove`

*No new test files needed for CLEAN-01/CLEAN-02.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Knip zero unused exports (lib/) | CLEAN-01 | Knip is a CLI tool, not a unit test | Run `npx knip` and verify no lib/ files in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
