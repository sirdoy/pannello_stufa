---
phase: 99
slug: proxy-client-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 99 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern=thermorossiProxy --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=thermorossiProxy --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 99-01-01 | 01 | 1 | CLIENT-02 | unit | `npx jest types/thermorossiProxy` | ❌ W0 | ⬜ pending |
| 99-01-02 | 01 | 1 | CLIENT-01, CLIENT-03 | unit | `npx jest lib/thermorossiProxy` | ❌ W0 | ⬜ pending |
| 99-01-03 | 01 | 1 | READ-01 | unit | `npx jest app/api/stove/status` | ❌ W0 | ⬜ pending |
| 99-01-04 | 01 | 1 | READ-02 | unit | `npx jest app/api/stove/getPower` | ❌ W0 | ⬜ pending |
| 99-01-05 | 01 | 1 | READ-03 | unit | `npx jest app/api/stove/getFan` | ❌ W0 | ⬜ pending |
| 99-01-06 | 01 | 1 | READ-04 | unit | `npx jest app/api/stove/health` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/thermorossiProxy.test.ts` — unit tests for proxy client convenience wrappers
- [ ] `__tests__/app/api/stove/status.test.ts` — route handler test for status endpoint
- [ ] `__tests__/app/api/stove/health.test.ts` — route handler test for health endpoint

*Existing test infrastructure (jest.config.ts, mock patterns) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Proxy returns correct data_freshness | READ-01, READ-02, READ-03 | Requires live HA proxy | curl /api/stove/status and verify data_freshness field |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
