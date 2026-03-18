---
phase: 93
slug: api-infrastructure-test-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 93 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern={file} --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern={fixed-file} --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 93-01-01 | 01 | 1 | TFIX-01 | unit | `npx jest middleware.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-02-01 | 02 | 1 | TFIX-02 | unit | `npx jest changelogService.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-02-02 | 02 | 1 | TFIX-03 | unit | `npx jest stoveApi.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-02-03 | 02 | 1 | TFIX-04 | unit | `npx jest maintenanceService.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-02-04 | 02 | 1 | TFIX-05 | unit | `npx jest schedulerService.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-03-01 | 03 | 1 | TFIX-06 | unit | `npx jest healthDeadManSwitch.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-04-01 | 04 | 1 | TFIX-07 | unit | `npx jest history.test.ts --no-coverage` | ✅ | ⬜ pending |
| 93-04-02 | 04 | 1 | TFIX-08 | unit | `npx jest devices-events.test.ts --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All 8 test files already exist — this phase fixes them, not creates them.

---

## Manual-Only Verifications

All phase behaviors have automated verification. Each requirement is verified by its test suite passing.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
