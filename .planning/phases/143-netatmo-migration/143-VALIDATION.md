---
phase: 143
slug: netatmo-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 143 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="useThermostatData" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="useThermostatData" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 143-01-01 | 01 | 1 | MIG-13 | unit | `npx jest --testPathPattern="useThermostatData" --no-coverage` | ❌ W0 | ⬜ pending |
| 143-01-02 | 01 | 1 | MIG-13 | unit | `npx jest --testPathPattern="useThermostatData" --no-coverage` | ❌ W0 | ⬜ pending |
| 143-02-01 | 02 | 1 | MIG-13, MIG-14 | unit | `npx jest --testPathPattern="useThermostatData" --no-coverage` | ❌ W0 | ⬜ pending |
| 143-02-02 | 02 | 1 | MIG-14 | unit | `npx jest --testPathPattern="useThermostatData" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts` — test suite for extracted hook (Plan 01 creates)
- [ ] Test mocks for WS subscribe/unsubscribe (Plan 02 adds WS test cases)

*Existing infrastructure covers framework and test config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live thermostat card updates from WS | MIG-13 | Requires live WS connection | Open dashboard, verify card updates without page refresh |
| WS→polling fallback transition | MIG-14 | Requires WS disconnect simulation | Disconnect WS (network tab), verify polling activates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
