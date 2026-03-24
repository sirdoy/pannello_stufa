---
phase: 128
slug: sonos-extended-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 128 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern=sonos --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=sonos --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 128-01-01 | 01 | 1 | SONOS-18,19,20,21,22,23,24,25 | unit | `npx jest sonosProxy.test` | ✅ | ⬜ pending |
| 128-01-02 | 01 | 1 | SONOS-18 | integration | `npx jest --testPathPattern=eq` | ❌ W0 | ⬜ pending |
| 128-01-03 | 01 | 1 | SONOS-19 | integration | `npx jest --testPathPattern=play-mode` | ❌ W0 | ⬜ pending |
| 128-01-04 | 01 | 1 | SONOS-20 | integration | `npx jest --testPathPattern=queue` | ❌ W0 | ⬜ pending |
| 128-01-05 | 01 | 1 | SONOS-21,22 | integration | `npx jest --testPathPattern=home-theater` | ❌ W0 | ⬜ pending |
| 128-01-06 | 01 | 1 | SONOS-24 | integration | `npx jest --testPathPattern=sleep-timer` | ❌ W0 | ⬜ pending |
| 128-01-07 | 01 | 1 | SONOS-25 | integration | `npx jest --testPathPattern=history` | ❌ W0 | ⬜ pending |
| 128-02-01 | 02 | 1 | SONOS-18,19,21,23,24,26,27,28,29,30 | unit | `npx jest sonosProxy.test` | ✅ | ⬜ pending |
| 128-02-02 | 02 | 1 | SONOS-26,27 | integration | `npx jest --testPathPattern=join\|unjoin` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Proxy wrapper test extensions in `lib/sonos/__tests__/sonosProxy.test.ts` — add describe blocks for new wrappers
- [ ] Route test stubs created alongside route files

*Existing infrastructure covers framework and config — only test cases need adding.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
