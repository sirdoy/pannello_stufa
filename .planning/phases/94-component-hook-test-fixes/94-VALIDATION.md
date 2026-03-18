---
phase: 94
slug: component-hook-test-fixes
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 94 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="StovePrimaryActions\|useNetworkData\|useDeviceHistory\|VersionContext" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="StovePrimaryActions|useNetworkData|useDeviceHistory|VersionContext" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 94-01-01 | 01 | 1 | TFIX-09 | unit | `npx jest StovePrimaryActions --no-coverage` | ✅ | ⬜ pending |
| 94-01-02 | 01 | 1 | TFIX-12 | unit | `npx jest VersionContext --no-coverage` | ✅ | ⬜ pending |
| 94-02-01 | 02 | 1 | TFIX-10 | unit | `npx jest useNetworkData --no-coverage` | ✅ | ⬜ pending |
| 94-02-02 | 02 | 1 | TFIX-11 | unit | `npx jest useDeviceHistory --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All 4 test files already exist and run under Jest.

---

## Manual-Only Verifications

All phase behaviors have automated verification. Each requirement is validated by running the corresponding test suite.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
