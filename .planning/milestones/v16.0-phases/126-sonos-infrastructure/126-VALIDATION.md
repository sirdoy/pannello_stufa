---
phase: 126
slug: sonos-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 126 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- lib/sonos` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- lib/sonos`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 126-01-01 | 01 | 1 | SONOS-01 | unit | `npm test -- lib/sonos/__tests__/sonosProxy.test.ts` | ❌ W0 | ⬜ pending |
| 126-01-02 | 01 | 1 | SONOS-02 | static | `npx tsc --noEmit types/sonosProxy.ts` | ❌ W0 | ⬜ pending |
| 126-01-03 | 01 | 1 | SONOS-03 | unit | `npm test -- sonosProxy` | ❌ W0 | ⬜ pending |
| 126-01-04 | 01 | 1 | SONOS-04 | unit | `npm test -- sonosProxy` | ❌ W0 | ⬜ pending |
| 126-01-05 | 01 | 1 | SONOS-05 | unit | `npm test -- sonosProxy` | ❌ W0 | ⬜ pending |
| 126-01-06 | 01 | 1 | SONOS-06 | unit | `npm test -- sonosProxy` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/sonos/__tests__/sonosProxy.test.ts` — stubs for SONOS-01, SONOS-03, SONOS-04, SONOS-05, SONOS-06
- [ ] `lib/sonos/` directory — needs to be created

*Types file (types/sonosProxy.ts) validated by TypeScript compilation — no separate test file needed.*

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
