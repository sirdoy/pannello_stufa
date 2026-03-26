---
phase: 127
slug: sonos-transport-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 127 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (existing) |
| **Config file** | `jest.config.ts` (existing) |
| **Quick run command** | `npm test -- --testPathPattern="sonosProxy"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="sonosProxy" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 127-01-01 | 01 | 1 | SONOS-07 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-02 | 01 | 1 | SONOS-08 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-03 | 01 | 1 | SONOS-09 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-04 | 01 | 1 | SONOS-10 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-05 | 01 | 1 | SONOS-11 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-06 | 01 | 1 | SONOS-12 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-07 | 01 | 1 | SONOS-13 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-08 | 01 | 1 | SONOS-14 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-09 | 01 | 1 | SONOS-15 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-10 | 01 | 1 | SONOS-16 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |
| 127-01-11 | 01 | 1 | SONOS-17 | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/sonosProxy.test.ts` — stubs for SONOS-07 through SONOS-17 proxy functions
- [ ] Follow `__tests__/lib/thermorossiProxy.test.ts` structure: mock global fetch, set env vars in beforeEach, test URL + method + body for each function

*Existing infrastructure covers test framework — only test file creation needed.*

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
