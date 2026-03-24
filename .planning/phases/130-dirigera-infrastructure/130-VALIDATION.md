---
phase: 130
slug: dirigera-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 130 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (jest.config.ts) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=dirigeraProxy` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=dirigeraProxy`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 130-01-01 | 01 | 1 | DIRIG-02 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 130-01-02 | 01 | 1 | DIRIG-01 | unit | `npm test -- --testPathPattern=dirigeraProxy` | ❌ W0 | ⬜ pending |
| 130-01-03 | 01 | 1 | DIRIG-03 | unit | `npm test -- --testPathPattern=dirigera/health` | ❌ W0 | ⬜ pending |
| 130-01-04 | 01 | 1 | DIRIG-04 | unit | `npm test -- --testPathPattern=dirigera/sensors` | ❌ W0 | ⬜ pending |
| 130-01-05 | 01 | 1 | DIRIG-05 | unit | `npm test -- --testPathPattern=sensors/contact` | ❌ W0 | ⬜ pending |
| 130-01-06 | 01 | 1 | DIRIG-06 | unit | `npm test -- --testPathPattern=sensors/motion` | ❌ W0 | ⬜ pending |
| 130-01-07 | 01 | 1 | DIRIG-07 | unit | `npm test -- --testPathPattern=sensors/summary` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/dirigera/dirigeraProxy.test.ts` — unit tests for all 5 proxy functions
- [ ] `__tests__/app/api/dirigera/health/route.test.ts` — health route test
- [ ] `__tests__/app/api/dirigera/sensors/route.test.ts` — sensors list route test
- [ ] `__tests__/app/api/dirigera/sensors/contact/route.test.ts` — contact sensors route test
- [ ] `__tests__/app/api/dirigera/sensors/motion/route.test.ts` — motion sensors route test
- [ ] `__tests__/app/api/dirigera/sensors/summary/route.test.ts` — summary route test

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
